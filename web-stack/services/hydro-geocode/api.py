"""FastAPI wrapper for hydro-geocode — unchanged Python core, no Streamlit.

Run:
    uv run uvicorn api:app --host 127.0.0.1 --port 8617 --reload

Requires python-multipart for file upload:
    uv add python-multipart

Env:
    AMAP_API_KEY  — 高德地图 API Key（从 ~/.personal_env 读取）
"""
from __future__ import annotations

import io
import os
import sys
import time
from pathlib import Path

import pandas as pd
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response

# --- shared helpers (see ~/Dev/devtools/lib/hydro_api_helpers.py) ---
for _p in [Path.home() / "Dev/devtools/lib", Path("/var/www/devtools/lib")]:
    if _p.exists():
        sys.path.insert(0, str(_p))
        break
from hydro_api_helpers import (  # noqa: E402
    build_json_response,
    cjk_header_safe,
    cors_origins,
    df_to_json_safe,
    build_metadata,
    read_version,
)

PROJECT_ROOT = Path(__file__).resolve().parent
SRC_DIR = PROJECT_ROOT / "src"
# Match app.py: insert `src/` first so we import `reverse_geocode` directly
# instead of going through `src/__init__.py` (which also loads
# geocode_by_address / search_by_company — those modules currently expose
# different top-level names and would raise ImportError).
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from reverse_geocode import reverse_geocode, wgs84_to_gcj02  # noqa: E402

app = FastAPI(title="hydro-geocode-api", version=read_version(Path(__file__).parent))

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins("hydro-geocode", 3117),
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/meta")
def meta_info() -> dict:
    return {
        "name": "geocode",
        "title": "地理编码",
        "icon": "📍",
        "description": "批量地理编码与逆编码（高德地图API）",
        "version": "1.0.0",
    }


@app.get("/api/metadata")
def metadata() -> dict:
    return build_metadata(
        Path(__file__).parent,
        name="geocode",
        title="地理编码",
        icon="📍",
        description="批量地理编码与逆编码（高德地图API）",
        service_id="hydro-geocode",
        service_type="query",
        default_port=8617,
        compute_endpoint="/api/geocode",
        input_formats=['xlsx'],
        output_formats=['xlsx', 'json'],
    )

def _pick_coord_cols(columns: list[str]) -> tuple[str | None, str | None]:
    """Match the Streamlit app's column detection heuristic."""
    lng_col: str | None = None
    lat_col: str | None = None
    for col in columns:
        col_lower = str(col).lower()
        if col in ("经度", "JD") or col_lower in ("lng", "longitude"):
            lng_col = col
        if col in ("纬度", "WD") or col_lower in ("lat", "latitude"):
            lat_col = col
    return lng_col, lat_col


def _geocode_core(
    xlsx_bytes: bytes,
    api_key: str,
    convert_wgs84: bool = True,
    rate_limit_seconds: float = 0.3,
    max_rows: int | None = None,
) -> dict:
    """Reverse-geocode every row. Shared core for xlsx & json responses.

    Returns dict with: input_df, output_df, total, success, elapsed_ms.

    When api_key is empty, reverse_geocode() will return `error` for every row
    — schema is still valid, so smoke tests without AMAP_API_KEY don't fail.
    """
    upload_buf = io.BytesIO(xlsx_bytes)
    try:
        df = pd.read_excel(upload_buf)
    except Exception as e:
        raise HTTPException(400, f"无法读取 xlsx: {type(e).__name__}: {e}") from e

    if df.empty:
        raise HTTPException(400, "输入表格为空")

    lng_col, lat_col = _pick_coord_cols(list(df.columns))
    if not (lng_col and lat_col):
        raise HTTPException(
            400,
            "未识别到经纬度列（需包含 经度/JD/lng 和 纬度/WD/lat）",
        )

    input_df = df.copy()
    if max_rows is not None:
        df = df.head(max_rows).copy()

    started = time.perf_counter()
    results: list[dict] = []
    success = 0
    total = len(df)

    for _, row in df.iterrows():
        try:
            lng = float(row[lng_col])
            lat = float(row[lat_col])
        except (ValueError, TypeError):
            results.append(
                {
                    "地址": "",
                    "省": "",
                    "市": "",
                    "区县": "",
                    "GCJ02_经度": "",
                    "GCJ02_纬度": "",
                    "错误": "坐标格式错误",
                }
            )
            continue

        if convert_wgs84:
            gcj_lng, gcj_lat = wgs84_to_gcj02(lng, lat)
        else:
            gcj_lng, gcj_lat = lng, lat

        r = reverse_geocode(gcj_lng, gcj_lat, api_key)
        err = r.get("error") or ""
        if not err:
            success += 1
        results.append(
            {
                "地址": r.get("formatted_address") or "",
                "省": r.get("province") or "",
                "市": r.get("city") or "",
                "区县": r.get("district") or "",
                "GCJ02_经度": f"{gcj_lng:.6f}" if convert_wgs84 else "",
                "GCJ02_纬度": f"{gcj_lat:.6f}" if convert_wgs84 else "",
                "错误": err,
            }
        )

        if rate_limit_seconds > 0:
            time.sleep(rate_limit_seconds)

    result_df = pd.DataFrame(results)
    output_df = pd.concat([df.reset_index(drop=True), result_df], axis=1)
    elapsed_ms = int((time.perf_counter() - started) * 1000)

    return {
        "input_df": input_df,
        "output_df": output_df,
        "total": total,
        "success": success,
        "elapsed_ms": elapsed_ms,
    }


def _build_xlsx(output_df: pd.DataFrame) -> bytes:
    out = io.BytesIO()
    with pd.ExcelWriter(out, engine="openpyxl") as writer:
        output_df.to_excel(writer, index=False, sheet_name="坐标查询结果")
    return out.getvalue()


@app.post("/api/compute")
async def compute(
    file: UploadFile = File(..., description="含经纬度列的 xlsx"),
    convert_wgs84: bool = Form(True, description="输入是否为 WGS-84（需转 GCJ-02）"),
    rate_limit_seconds: float = Form(0.3, description="AMAP 免费版 QPS 节流"),
    max_rows: int | None = Form(None, description="可选：只处理前 N 行"),
    format: str = Form("xlsx", description="xlsx (binary) | json (preview+results+base64)"),
) -> Response:
    content = await file.read()
    if not content:
        raise HTTPException(400, "上传文件为空")
    api_key = os.getenv("AMAP_API_KEY", "")
    try:
        r = _geocode_core(
            content,
            api_key=api_key,
            convert_wgs84=convert_wgs84,
            rate_limit_seconds=rate_limit_seconds,
            max_rows=max_rows,
        )
    except HTTPException:
        raise
    except Exception as e:
        import traceback

        raise HTTPException(
            500,
            f"计算失败: {type(e).__name__}: {e}\n{traceback.format_exc()[-800:]}",
        ) from e

    xlsx_bytes = _build_xlsx(r["output_df"])
    total = r["total"]
    success = r["success"]
    rate_pct = (success / total * 100) if total else 0.0

    if format == "json":
        payload = build_json_response(
            preview={"input": df_to_json_safe(r["input_df"], limit=10)},
            meta={
                "totalRows": total,
                "successRows": success,
                "successRate": round(rate_pct, 1),
                "mode": "reverse-geocode",
                "elapsedMs": r["elapsed_ms"],
            },
            results={"坐标查询结果": df_to_json_safe(r["output_df"])},
            xlsx_bytes=xlsx_bytes,
        )
        return JSONResponse(content=payload)

    return Response(
        content=xlsx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": 'attachment; filename="geocode_result.xlsx"',
            "X-Total-Rows": str(total),
            "X-Success-Rows": str(success),
            "X-Success-Rate": f"{rate_pct:.1f}",
            "X-Mode": cjk_header_safe("reverse-geocode"),
            "Access-Control-Expose-Headers": (
                "X-Total-Rows, X-Success-Rows, X-Success-Rate, X-Mode, Content-Disposition"
            ),
        },
    )


@app.get("/api/sample")
def sample_xlsx() -> Response:
    """Return the bundled sample input so the web UI can offer a one-click demo."""
    sample = PROJECT_ROOT / "data" / "sample" / "示例坐标.xlsx"
    if not sample.exists():
        raise HTTPException(404, "示例输入文件不存在")
    return Response(
        content=sample.read_bytes(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="sample_input.xlsx"'},
    )
