"""FastAPI wrapper for hydro-risk.

Three-phase ETL pipeline exposed as three independent endpoints:
    POST /api/compute/phase1   # database_sx.xlsx  (1.1-1.4)
    POST /api/compute/phase2   # forecast_sx.xlsx  (2.1)
    POST /api/compute/phase3   # risk_sx.xlsx      (3.01-3.09)

Each endpoint accepts a `format` Form field:
    - "xlsx" (default): return xlsx blob via Content-Disposition header
    - "json": return JSON payload with scripts status + per-sheet previews + xlsxBase64

Design notes:
- Phase 1/2 scripts hard-code relative paths (input/*, output/*.xlsx) and have
  NO argparse — we must materialize an isolated workdir matching those paths
  and run the scripts with cwd=workdir. `runner.run_script(work_dir=...)` does
  exactly that.
- Phase 1/2 scripts require an existing target xlsx with pre-defined sheet
  names. The original Streamlit app assumes the repo ships one in output/.
  Since the repo currently has no such template, the API REQUIRES the caller
  to upload `target_xlsx` (the `datebase_sx.xlsx` / `forecast_sx.xlsx` skeleton
  with the correct sheets). This mirrors Phase 3's `risk_sx.xlsx` upload.
- Phase 3 scripts DO accept argparse (-g / -e / -d / -r), so we pass file paths
  directly.
- `run_script` returns `(ok, stdout, stderr)` — not the xlsx. We read the
  resulting xlsx off disk after scripts finish.

Run:
    uv run uvicorn api:app --host 127.0.0.1 --port 8619 --reload
"""
from __future__ import annotations

import base64
import io
import sys
import tempfile
import time
from pathlib import Path
from typing import Optional

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
    cjk_header_safe,
    cors_origins,
    df_to_json_safe,
    build_metadata,
    read_version,
)

PROJECT_ROOT = Path(__file__).resolve().parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.risk.runner import (  # noqa: E402
    PHASE_1,
    PHASE_2,
    PHASE_3,
    run_script,
)

app = FastAPI(title="hydro-risk-api", version=read_version(Path(__file__).parent))

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins("hydro-risk", 3119),
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

# 结果表截断阈值 — 单 sheet 超过这个行数，前端只展示前 N 行（xlsx 完整保留）
JSON_ROW_LIMIT = 500


# ─────────────────────── diagnostics ───────────────────────

@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/meta")
def meta_info() -> dict:
    return {
        "name": "risk",
        "title": "风险图数据",
        "icon": "⚠️",
        "description": "风险图数据表自动填充（GeoJSON→Excel三阶段ETL）",
        "version": "1.0.0",
        "phases": {
            "phase1": [{"id": x[0], "label": x[2]} for x in PHASE_1],
            "phase2": [{"id": x[0], "label": x[2]} for x in PHASE_2],
            "phase3": [{"id": x[0], "label": x[2]} for x in PHASE_3],
        },
    }


@app.get("/api/metadata")
def metadata() -> dict:
    return build_metadata(
        Path(__file__).parent,
        name="risk",
        title="风险图数据",
        icon="⚠️",
        description="风险图数据表自动填充（GeoJSON→Excel三阶段ETL）",
        service_id="hydro-risk",
        service_type="compute",
        default_port=8619,
        compute_endpoint="/api/compute",
        input_formats=['zip'],
        output_formats=['xlsx', 'json'],
    )

# ─────────────────────── helpers ───────────────────────

async def _save_upload(upload: UploadFile | None, dest: Path) -> bool:
    """Save an UploadFile to `dest` (mkdir -p its parent). Return True if saved."""
    if upload is None:
        return False
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(await upload.read())
    return True


def _parse_selected(selected: str | None, default: list) -> list:
    """Parse comma-separated '1.1,1.2' into filtered PHASE_n entries.

    Empty/None → all scripts. Unknown ids are silently dropped.
    """
    if not selected:
        return default
    wanted = {s.strip() for s in selected.split(",") if s.strip()}
    return [row for row in default if row[0] in wanted]


def _xlsx_to_results_payload(xlsx_path: Path, limit: int | None = JSON_ROW_LIMIT) -> dict:
    """Read every sheet of an xlsx → {sheet_name: {columns, rows, totalRows}}."""
    if not xlsx_path.exists():
        return {}
    xlsx = pd.ExcelFile(xlsx_path)
    out: dict[str, dict] = {}
    for sheet in xlsx.sheet_names:
        try:
            df = xlsx.parse(sheet)
        except Exception as e:  # noqa: BLE001
            out[sheet] = {"columns": ["error"], "rows": [[f"{type(e).__name__}: {e}"]], "totalRows": 0}
            continue
        out[sheet] = df_to_json_safe(df, limit=limit)
    return out


def _scripts_payload(
    logs: list[tuple[str, str, bool, str, str]],
) -> list[dict]:
    """logs entry = (num, name, ok, stdout, stderr)"""
    return [
        {
            "id": num,
            "name": name,
            "status": "ok" if ok else "fail",
            "stdout": (out or "")[-2000:],
            "stderr": (err or "")[-2000:],
        }
        for (num, name, ok, out, err) in logs
    ]


def _xlsx_response(
    xlsx_path: Path,
    download_name: str,
    logs: list[tuple[str, str, bool, str, str]],
) -> Response:
    """Package the final xlsx + a compact log header for the caller."""
    if not xlsx_path.exists():
        lines = [
            f"{num} {label}: {'OK' if ok else 'FAIL'}\n--- stderr ---\n{err[-1500:]}"
            for num, label, ok, _out, err in logs
        ]
        raise HTTPException(
            status_code=500,
            detail="脚本执行后未生成目标 xlsx。\n\n" + "\n\n".join(lines),
        )

    # Short status line per script, URL-encoded so it survives latin-1 headers.
    status_line = "; ".join(
        f"{num}={'ok' if ok else 'fail'}" for num, _lbl, ok, _o, _e in logs
    )
    return Response(
        content=xlsx_path.read_bytes(),
        media_type=XLSX_MIME,
        headers={
            "Content-Disposition": f'attachment; filename="{download_name}"',
            "X-Scripts-Status": cjk_header_safe(status_line),
            "Access-Control-Expose-Headers":
                "X-Scripts-Status, Content-Disposition",
        },
    )


def _json_response(
    phase: int,
    result_key: str,
    xlsx_path: Path,
    logs: list[tuple[str, str, bool, str, str]],
    elapsed_ms: int,
) -> JSONResponse:
    """Build the rich JSON payload mirroring hydro-capacity's contract."""
    xlsx_bytes = xlsx_path.read_bytes() if xlsx_path.exists() else b""
    results_map = _xlsx_to_results_payload(xlsx_path) if xlsx_bytes else {}
    payload = {
        "phase": phase,
        "meta": {
            "phase": phase,
            "scripts": _scripts_payload(logs),
            "elapsedMs": elapsed_ms,
            "xlsxBytes": len(xlsx_bytes),
        },
        # 按 phase 归属的主结果键名（方便前端走固定 key，但仍带 sheet 级拆分）
        "results": {result_key: results_map},
        "xlsxBase64": base64.b64encode(xlsx_bytes).decode("ascii") if xlsx_bytes else "",
    }
    return JSONResponse(content=payload)


# ─────────────────────── Phase 1 ───────────────────────

@app.post("/api/compute/phase1")
async def compute_phase1(
    target_xlsx: UploadFile = File(
        ..., description="datebase_sx.xlsx 骨架（必须已含 保护片/堤段/堤防/河道中心线 sheet）"
    ),
    geojson_bh: Optional[UploadFile] = File(None, description="保护片 GeoJSON (1.1)"),
    geojson_dd: Optional[UploadFile] = File(None, description="堤段 GeoJSON (1.2)"),
    geojson_df: Optional[UploadFile] = File(None, description="堤防 GeoJSON (1.3)"),
    geojson_rc: Optional[UploadFile] = File(None, description="河流中心线 GeoJSON (1.4)"),
    csv_city: Optional[UploadFile] = File(None, description="city_county_town.csv"),
    csv_region: Optional[UploadFile] = File(None, description="region_name_code.csv"),
    selected: Optional[str] = Form(
        None, description="逗号分隔的脚本 id，如 '1.1,1.2'；留空=全跑"
    ),
    format: str = Form("xlsx", description="xlsx (binary) | json (scripts+results+base64)"),
) -> Response:
    """Phase 1: 数据库建设 (1.1-1.4) → datebase_sx.xlsx."""
    scripts = _parse_selected(selected, PHASE_1)
    if not scripts:
        raise HTTPException(400, "selected 未匹配任何 Phase 1 脚本")

    started = time.perf_counter()
    with tempfile.TemporaryDirectory(prefix="hydro_risk_p1_") as tmp:
        workdir = Path(tmp)
        input_dir = workdir / "input"
        output_dir = workdir / "output"
        input_dir.mkdir(parents=True, exist_ok=True)
        output_dir.mkdir(parents=True, exist_ok=True)

        # Fixed relative layout matching the scripts' hard-coded paths.
        await _save_upload(geojson_bh, input_dir / "保护片" / "env.geojson")
        await _save_upload(geojson_dd, input_dir / "geojson" / "dd.geojson")
        await _save_upload(geojson_df, input_dir / "df.geojson")
        await _save_upload(geojson_rc, input_dir / "river_center_points.geojson")
        await _save_upload(csv_city, input_dir / "city_county_town.csv")
        await _save_upload(csv_region, input_dir / "region_name_code.csv")

        target = output_dir / "datebase_sx.xlsx"
        target.write_bytes(await target_xlsx.read())

        logs: list[tuple[str, str, bool, str, str]] = []
        for num, fname, label in scripts:
            ok, out, err = run_script(fname, args=None, work_dir=str(workdir))
            logs.append((num, label, ok, out, err))

        elapsed_ms = int((time.perf_counter() - started) * 1000)
        if format == "json":
            return _json_response(1, "database_sx", target, logs, elapsed_ms)
        return _xlsx_response(target, "database_sx.xlsx", logs)


# ─────────────────────── Phase 2 ───────────────────────

@app.post("/api/compute/phase2")
async def compute_phase2(
    target_xlsx: UploadFile = File(
        ..., description="forecast_sx.xlsx 骨架（含预报断面相关 sheet）"
    ),
    geojson_dm: Optional[UploadFile] = File(
        None, description="断面里程 GeoJSON（映射到 input/dm_lc_ll.geojson）"
    ),
    selected: Optional[str] = Form(None),
    format: str = Form("xlsx", description="xlsx (binary) | json (scripts+results+base64)"),
) -> Response:
    """Phase 2: 预报断面 (2.1) → forecast_sx.xlsx."""
    scripts = _parse_selected(selected, PHASE_2)
    if not scripts:
        raise HTTPException(400, "selected 未匹配任何 Phase 2 脚本")

    started = time.perf_counter()
    with tempfile.TemporaryDirectory(prefix="hydro_risk_p2_") as tmp:
        workdir = Path(tmp)
        input_dir = workdir / "input"
        output_dir = workdir / "output"
        input_dir.mkdir(parents=True, exist_ok=True)
        output_dir.mkdir(parents=True, exist_ok=True)

        await _save_upload(geojson_dm, input_dir / "dm_lc_ll.geojson")

        target = output_dir / "forecast_sx.xlsx"
        target.write_bytes(await target_xlsx.read())

        logs: list[tuple[str, str, bool, str, str]] = []
        for num, fname, label in scripts:
            ok, out, err = run_script(fname, args=None, work_dir=str(workdir))
            logs.append((num, label, ok, out, err))

        elapsed_ms = int((time.perf_counter() - started) * 1000)
        if format == "json":
            return _json_response(2, "forecast_sx", target, logs, elapsed_ms)
        return _xlsx_response(target, "forecast_sx.xlsx", logs)


# ─────────────────────── Phase 3 ───────────────────────

@app.post("/api/compute/phase3")
async def compute_phase3(
    target_xlsx: UploadFile = File(..., description="risk_sx.xlsx 骨架"),
    geojson_bh: Optional[UploadFile] = File(None, description="保护片 GeoJSON (3.01/3.02)"),
    geojson_dd: Optional[UploadFile] = File(
        None, description="堤段 dd_fix GeoJSON (3.03/3.04/3.05/3.08)"
    ),
    geojson_df: Optional[UploadFile] = File(
        None, description="堤防 df_with_elevation_lc GeoJSON (3.07)"
    ),
    geojson_dm: Optional[UploadFile] = File(None, description="断面里程 dm_LC GeoJSON (3.06)"),
    geojson_fac: Optional[UploadFile] = File(None, description="设施 baohu GeoJSON (3.09)"),
    csv_gdp: Optional[UploadFile] = File(None, description="GDP/人口 CSV (3.01/3.02)"),
    csv_region: Optional[UploadFile] = File(None, description="region_name_code.csv"),
    selected: Optional[str] = Form(None),
    format: str = Form("xlsx", description="xlsx (binary) | json (scripts+results+base64)"),
) -> Response:
    """Phase 3: 风险分析 (3.01-3.09) → risk_sx.xlsx."""
    scripts = _parse_selected(selected, PHASE_3)
    if not scripts:
        raise HTTPException(400, "selected 未匹配任何 Phase 3 脚本")

    started = time.perf_counter()
    with tempfile.TemporaryDirectory(prefix="hydro_risk_p3_") as tmp:
        workdir = Path(tmp)
        input_dir = workdir / "input"
        output_dir = workdir / "output"
        input_dir.mkdir(parents=True, exist_ok=True)
        output_dir.mkdir(parents=True, exist_ok=True)

        # Paths — set to None if the corresponding upload missing.
        p_bh = input_dir / "保护片" / "env.geojson"
        p_dd = input_dir / "geojson" / "dd_fix.geojson"
        p_df = input_dir / "df_with_elevation_lc.geojson"
        p_dm = input_dir / "dm_LC.geojson"
        p_fac = input_dir / "baohu" / "baohu.geojson"
        p_gdp = input_dir / "GDP、人口、房屋、耕地、道路重新计算结果.csv"
        p_region = input_dir / "region_name_code.csv"

        saved_bh = await _save_upload(geojson_bh, p_bh)
        saved_dd = await _save_upload(geojson_dd, p_dd)
        saved_df = await _save_upload(geojson_df, p_df)
        saved_dm = await _save_upload(geojson_dm, p_dm)
        saved_fac = await _save_upload(geojson_fac, p_fac)
        saved_gdp = await _save_upload(csv_gdp, p_gdp)
        saved_region = await _save_upload(csv_region, p_region)

        target = output_dir / "risk_sx.xlsx"
        target.write_bytes(await target_xlsx.read())

        # Per-script arg tables (matches 3.0x_*.py argparse).
        def _args_for(num: str) -> dict:
            e = {"-e": str(target)}
            if num in ("3.01",):
                if saved_bh:  e["-g"] = str(p_bh)
                if saved_gdp: e["-d"] = str(p_gdp)
                return e
            if num in ("3.02",):
                if saved_bh:     e["-g"] = str(p_bh)
                if saved_gdp:    e["-d"] = str(p_gdp)
                if saved_region: e["-r"] = str(p_region)
                return e
            if num in ("3.03", "3.04", "3.05", "3.08"):
                if saved_dd: e["-g"] = str(p_dd)
                return e
            if num == "3.06":
                if saved_dm: e["-g"] = str(p_dm)
                return e
            if num == "3.07":
                if saved_df: e["-g"] = str(p_df)
                return e
            if num == "3.09":
                if saved_fac:    e["-g"] = str(p_fac)
                if saved_region: e["-r"] = str(p_region)
                return e
            return e

        logs: list[tuple[str, str, bool, str, str]] = []
        for num, fname, label in scripts:
            ok, out, err = run_script(fname, args=_args_for(num), work_dir=str(workdir))
            logs.append((num, label, ok, out, err))

        elapsed_ms = int((time.perf_counter() - started) * 1000)
        if format == "json":
            return _json_response(3, "risk_sx", target, logs, elapsed_ms)
        return _xlsx_response(target, "risk_sx.xlsx", logs)
