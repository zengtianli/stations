"""FastAPI wrapper for hydro-annual — query-type (no upload), unchanged Python core.

Run:
    uv run uvicorn api:app --host 127.0.0.1 --port 8614 --reload
"""
from __future__ import annotations

import io
import sys
import time
from pathlib import Path
from urllib.parse import quote

import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response

# --- shared helpers (see ~/Dev/devtools/lib/hydro_api_helpers.py) ---
for _p in [Path.home() / "Dev/devtools/lib", Path("/var/www/devtools/lib")]:
    if _p.exists():
        sys.path.insert(0, str(_p))
        break
from hydro_api_helpers import (  # noqa: E402
    build_json_response,
    df_to_json_safe,
    make_service_app,
)

PROJECT_ROOT = Path(__file__).resolve().parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.annual.data_loader import (  # noqa: E402
    get_available_cities,
    get_available_tables,
    get_available_years,
    get_file_stats,
    load_table,
)

app = make_service_app(
    service_id="hydro-annual",
    name="annual", title="水资源年报", icon="📊",
    description="浙江省水资源年报数据查询 (2019-2024)，按市/表/年度筛选",
    web_port=3114, default_api_port=8614,
    service_type="query",
    compute_endpoint="/api/compute",
    output_formats=['xlsx', 'csv'],
    pyproject_dir=Path(__file__).parent,
)


@app.get("/api/options")
def options() -> dict:
    """For frontend dropdowns — returns available years/cities/tables/stats."""
    stats = get_file_stats()
    return {
        "years": get_available_years(),
        "cities": get_available_cities(only_valid=False),
        "tables": get_available_tables(),
        "stats": {
            "total": stats["total"],
            "by_table": stats.get("by_table", {}),
        },
    }


@app.get("/api/compute")
def compute(
    table: str = Query(..., description="数据表名 (用水量/供水量/社会经济指标/县级套四级分区)"),
    years: list[int] = Query(..., description="年份列表，重复参数形式 ?years=2020&years=2021"),
    cities: list[str] = Query(..., description="市列表，重复参数形式 ?cities=杭州市&cities=宁波市"),
    fmt: str = Query("xlsx", pattern="^(xlsx|csv|json)$", description="导出格式"),
) -> Response:
    if not years:
        raise HTTPException(400, "years 不能为空")
    if not cities:
        raise HTTPException(400, "cities 不能为空")

    t_start = time.perf_counter()
    try:
        df = load_table(table=table, years=years, cities=cities)
    except Exception as e:
        import traceback
        raise HTTPException(
            500,
            f"查询失败: {type(e).__name__}: {e}\n{traceback.format_exc()[-800:]}",
        )

    if df is None or len(df) == 0:
        raise HTTPException(404, f"无匹配数据 · table={table} · years={years} · cities={cities}")

    stem = f"{'_'.join(cities)}_{table}_{min(years)}-{max(years)}"

    if fmt == "csv":
        csv_bytes = df.to_csv(index=False, encoding="utf-8-sig").encode("utf-8-sig")
        return Response(
            content=csv_bytes,
            media_type="text/csv; charset=utf-8",
            headers={
                "Content-Disposition": f'attachment; filename="{quote(stem)}.csv"',
                "X-Rows": str(len(df)),
                "X-Cols": str(len(df.columns)),
                "Access-Control-Expose-Headers": "X-Rows, X-Cols, Content-Disposition",
            },
        )

    # Build xlsx bytes (used by both xlsx and json fmt)
    xlsx_buf = io.BytesIO()
    with pd.ExcelWriter(xlsx_buf, engine="openpyxl") as writer:
        df.to_excel(writer, sheet_name="查询结果", index=False)
    xlsx_bytes = xlsx_buf.getvalue()

    if fmt == "json":
        stats = get_file_stats()
        by_table = stats.get("by_table", {})
        # 估算本次命中的文件数 (years × cities ∩ available)
        total_hits = 0
        for y in years:
            for c in cities:
                from src.annual.data_loader import find_csv_file
                if find_csv_file(y, c, table) is not None:
                    total_hits += 1
        elapsed_ms = int((time.perf_counter() - t_start) * 1000)
        payload = build_json_response(
            preview={
                "query": {"table": table, "years": years, "cities": cities},
                "stats": {"totalFiles": total_hits, "byTable": by_table},
            },
            meta={
                "rows": int(len(df)),
                "cols": int(len(df.columns)),
                "filename": f"{stem}.xlsx",
                "elapsedMs": elapsed_ms,
            },
            results={"查询结果": df_to_json_safe(df)},
            xlsx_bytes=xlsx_bytes,
        )
        return JSONResponse(content=payload)

    return Response(
        content=xlsx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f'attachment; filename="{quote(stem)}.xlsx"',
            "X-Rows": str(len(df)),
            "X-Cols": str(len(df.columns)),
            "Access-Control-Expose-Headers": "X-Rows, X-Cols, Content-Disposition",
        },
    )
