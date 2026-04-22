"""FastAPI wrapper for hydro-reservoir — unchanged Python core, no Streamlit.

Run:
    uv run uvicorn api:app --host 127.0.0.1 --port 8612 --reload
"""
from __future__ import annotations

import base64
import io
import os
import sys
import tempfile
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

# Project root on sys.path so `from src.reservoir import ...` resolves
# exactly like the original Streamlit entrypoint does.
PROJECT_ROOT = Path(__file__).resolve().parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.reservoir import xlsx_bridge  # noqa: E402
from src.reservoir.hydro_core import HydroElectricity, read_info_txt  # noqa: E402

app = FastAPI(title="hydro-reservoir-api", version=read_version(Path(__file__).parent))

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins("hydro-reservoir", 3112),
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/meta")
def meta_info() -> dict:
    return {
        "name": "reservoir",
        "title": "水库群调度",
        "icon": "⚡",
        "description": "梯级水库发电调度优化计算",
        "version": "1.0.0",
    }


@app.get("/api/metadata")
def metadata() -> dict:
    return build_metadata(
        Path(__file__).parent,
        name="reservoir",
        title="水库群调度",
        icon="⚡",
        description="梯级水库发电调度优化计算",
        service_id="hydro-reservoir",
        service_type="compute",
        default_port=8612,
        compute_endpoint="/api/compute",
        input_formats=['xlsx'],
        output_formats=['xlsx', 'json'],
    )

def _parse_input_preview(xlsx_bytes: bytes) -> dict:
    """Reproduce app.py's `parse_uploaded_xlsx` for Step 2 preview (no compute)."""
    xlsx = pd.ExcelFile(io.BytesIO(xlsx_bytes))
    up_res_info = None
    down_res_info = None
    paras = None
    up_res_name = None
    down_res_name = None

    if "计算参数" in xlsx.sheet_names:
        df_params = pd.read_excel(xlsx, sheet_name="计算参数", header=None)
        for _, row in df_params.iterrows():
            name = str(row.iloc[0]).strip() if pd.notna(row.iloc[0]) else ""
            if name == "上库":
                up_res_name = str(row.iloc[1]).strip() if pd.notna(row.iloc[1]) else None
            elif name == "下库":
                down_res_name = str(row.iloc[1]).strip() if pd.notna(row.iloc[1]) else None
        # Full params table w/ header
        paras = df_to_json_safe(df_params.fillna(""))

    if "上游_水库信息" in xlsx.sheet_names:
        up_res_info = df_to_json_safe(pd.read_excel(xlsx, sheet_name="上游_水库信息").fillna(""))
    if "下游_水库信息" in xlsx.sheet_names:
        down_res_info = df_to_json_safe(pd.read_excel(xlsx, sheet_name="下游_水库信息").fillna(""))

    return {
        "upResInfo": up_res_info,
        "downResInfo": down_res_info,
        "paras": paras,
        "upResName": up_res_name,
        "downResName": down_res_name,
    }


def _run_reservoir_pipeline(xlsx_bytes: bytes, calc_step: str) -> tuple[bytes, str, str, dict[str, pd.DataFrame]]:
    """Shared pipeline that returns (xlsx_bytes, up_res, down_res, {sheet_name: df}).

    Mirrors the original `_run_reservoir` but also hands back each sheet's
    DataFrame so JSON callers can build previews/charts without re-reading xlsx.
    """
    with tempfile.TemporaryDirectory() as tmpdir_raw:
        tmpdir = Path(tmpdir_raw)

        input_xlsx = tmpdir / "输入.xlsx"
        input_xlsx.write_bytes(xlsx_bytes)

        csv_input_dir = tmpdir / "data" / "input"
        csv_output_dir = tmpdir / "data" / "output"
        csv_output_dir.mkdir(parents=True, exist_ok=True)

        bridge_result = xlsx_bridge.xlsx_to_csv(input_xlsx, csv_input_dir)
        up_res = bridge_result["up_res"]
        down_res = bridge_result["down_res"]

        reservoirs = sorted(
            item.name
            for item in csv_input_dir.iterdir()
            if item.is_dir() and (item / "input_水库信息.txt").exists()
        )
        sks: dict = {}
        for res_name in reservoirs:
            sks = read_info_txt(sks, res_name, str(csv_input_dir / res_name))

        base_info = {"CalStep": calc_step, "EPSYH": 0.01, "EPSYV": 1, "EPSYW": 1}

        calc_param_file = csv_input_dir / "input_计算参数.csv"
        if not calc_param_file.exists():
            raise HTTPException(400, f"计算参数文件不存在: {calc_param_file.name}")
        paras_df = pd.read_csv(calc_param_file, header=None, index_col=0)

        def _series_dropna(key: str) -> pd.Series:
            return pd.Series(paras_df.loc[key].values).dropna()

        another_add_user = _series_dropna("额外再补用水户（利用上库特征库容以下进行补水）")
        another_add_val = _series_dropna("额外再补流量")
        another_add: list[list] = []
        for i_user in range(len(another_add_user)):
            tmp_add_user = another_add_user.iloc[i_user]
            try:
                tmp_add_val = another_add_val.iloc[i_user]
            except (IndexError, ValueError):
                tmp_add_val = -1
            another_add.append([tmp_add_user, tmp_add_val])

        paras_dict = {
            "up_res": paras_df.loc["上库"].values[0],
            "down_res": paras_df.loc["下库"].values[0],
            "up_v_special": _series_dropna("上库特征库容").astype(float).tolist(),
            "down_v_special": _series_dropna("下库特征库容").astype(float).tolist(),
            "need_add_user": _series_dropna("需补水的用水户（利用上库特征库容之间进行补水）").tolist(),
            "if_q_up_eco_as_in": bool(int(paras_df.loc["湖南镇生态水是否入黄坛口水量平衡"].values[0])),
            "stop_supply": _series_dropna("当上库库容较低时（低于上库特征库容），下库停止供水的用水户").tolist(),
            "another_add": another_add,
        }

        output_list_file = PROJECT_ROOT / "src" / "reservoir" / "output_columns.csv"
        output_list = pd.read_csv(
            output_list_file, sep="\t", header=None, encoding="utf-8",
        ).values[:, 0].tolist()

        test = HydroElectricity(sks, base_info)
        up_table, down_table = test.power_operate_year_up_down(
            if_up_q_eco_as_in=paras_dict["if_q_up_eco_as_in"],
            up_res_name=up_res,
            down_res_name=down_res,
            up_v_special=paras_dict["up_v_special"],
            down_v_special=paras_dict["down_v_special"],
            need_add_user=paras_dict["need_add_user"],
            user_special=paras_dict["another_add"],
            user_stop_supply=paras_dict["stop_supply"],
        )

        original_cwd = os.getcwd()
        os.chdir(csv_output_dir)
        try:
            test.statistic_for_up_down(up_table, "", up_res, output_list)
            test.statistic_for_up_down(down_table, "", down_res, output_list)
        finally:
            os.chdir(original_cwd)

        output_xlsx = tmpdir / "计算结果.xlsx"
        xlsx_bridge.csv_to_xlsx(csv_output_dir, output_xlsx, up_res, down_res)
        xlsx_bytes_out = output_xlsx.read_bytes()

    # Re-read xlsx back to DataFrames for JSON use
    sheets: dict[str, pd.DataFrame] = {}
    xf = pd.ExcelFile(io.BytesIO(xlsx_bytes_out))
    for sn in xf.sheet_names:
        sheets[sn] = pd.read_excel(xf, sheet_name=sn)

    return xlsx_bytes_out, str(up_res), str(down_res), sheets


def _run_reservoir(xlsx_bytes: bytes, calc_step: str) -> tuple[bytes, str, str]:
    """Backward-compatible xlsx-only entrypoint."""
    b, u, d, _ = _run_reservoir_pipeline(xlsx_bytes, calc_step)
    return b, u, d


def _build_charts(up_daily: pd.DataFrame | None, down_daily: pd.DataFrame | None) -> dict:
    """Build the 3 Streamlit-style time series: water-level / flow / power.

    Streamlit app.py's `go.Figure`/`go.Scatter` were per-reservoir; here we fold
    up & down into single series per chart, keyed by date on the x-axis.
    Columns picked from output_columns.csv: 时段末水位 / 来水流量 / 发电流量+弃水流量 / 出力（kW）.
    """
    def _date_col(df: pd.DataFrame) -> str:
        # '年/月/日' is the daily-sheet first col
        return df.columns[0]

    def _dates(df: pd.DataFrame) -> list[str]:
        return [str(x) for x in df[_date_col(df)].tolist()]

    water_level: list[dict] = []
    flow: list[dict] = []
    power: list[dict] = []

    up_dates = _dates(up_daily) if up_daily is not None and len(up_daily) else []
    down_dates = _dates(down_daily) if down_daily is not None and len(down_daily) else []
    all_dates = up_dates or down_dates
    # Index both frames by date string for cheap lookup
    up_by_date = up_daily.set_index(_date_col(up_daily)) if up_daily is not None and len(up_daily) else None
    down_by_date = down_daily.set_index(_date_col(down_daily)) if down_daily is not None and len(down_daily) else None

    def _get(df, date, col):
        if df is None or col not in df.columns or date not in df.index:
            return None
        v = df.loc[date, col]
        try:
            if pd.isna(v):
                return None
        except Exception:
            pass
        try:
            return float(v)
        except Exception:
            return None

    for d in all_dates:
        up_level = _get(up_by_date, d, "时段末水位")
        down_level = _get(down_by_date, d, "时段末水位")
        water_level.append({"date": d, "upLevel": up_level, "downLevel": down_level})

        up_in = _get(up_by_date, d, "来水流量（包含上库生态流量）")
        up_gen = _get(up_by_date, d, "发电流量") or 0.0
        up_spill = _get(up_by_date, d, "弃水流量") or 0.0
        up_out = up_gen + up_spill if (up_gen or up_spill) else None
        flow.append({"date": d, "inflow": up_in, "outflow": up_out})

        up_pw = _get(up_by_date, d, "出力（kW）")
        down_pw = _get(down_by_date, d, "出力（kW）")
        total = None
        if up_pw is not None or down_pw is not None:
            total = (up_pw or 0.0) + (down_pw or 0.0)
        power.append({"date": d, "upPower": up_pw, "downPower": down_pw, "power": total})

    return {"waterLevel": water_level, "flow": flow, "power": power}


def _run_reservoir_full(xlsx_bytes: bytes, calc_step: str) -> dict:
    """Full pipeline returning preview + per-sheet JSON + charts + base64 xlsx."""
    started = time.perf_counter()

    preview = _parse_input_preview(xlsx_bytes)
    xlsx_out, up_res, down_res, sheets = _run_reservoir_pipeline(xlsx_bytes, calc_step)
    elapsed_ms = int((time.perf_counter() - started) * 1000)

    DAILY_DISPLAY_LIMIT = 500
    results_payload: dict[str, dict] = {}
    for name, df in sheets.items():
        limit = DAILY_DISPLAY_LIMIT if "逐日" in name else None
        results_payload[name] = df_to_json_safe(df.fillna(""), limit=limit)

    up_daily = sheets.get("上游_逐日过程")
    down_daily = sheets.get("下游_逐日过程")
    charts = _build_charts(up_daily, down_daily)
    # Down-sample charts for frontend (max ~600 points per series)
    CHART_LIMIT = 600
    for k, series in charts.items():
        if len(series) > CHART_LIMIT:
            step = max(1, len(series) // CHART_LIMIT)
            charts[k] = series[::step]

    return {
        "preview": preview,
        "meta": {
            "upRes": up_res,
            "downRes": down_res,
            "calcStep": calc_step,
            "elapsedMs": elapsed_ms,
            "xlsxBytes": len(xlsx_out),
        },
        "results": results_payload,
        "charts": charts,
        "xlsxBase64": base64.b64encode(xlsx_out).decode("ascii"),
    }


@app.post("/api/compute")
async def compute(
    file: UploadFile = File(..., description="输入.xlsx"),
    calc_step: str = Form("旬", description="日 / 旬 / 月"),
    format: str = Form("xlsx", description="xlsx (binary) | json (preview+results+charts+base64)"),
) -> Response:
    if calc_step not in {"日", "旬", "月"}:
        raise HTTPException(400, f"calc_step 必须是 日/旬/月，收到: {calc_step!r}")
    content = await file.read()
    if not content:
        raise HTTPException(400, "上传文件为空")
    try:
        if format == "json":
            payload = _run_reservoir_full(content, calc_step)
            return JSONResponse(content=payload)
        xlsx_bytes, up_res, down_res = _run_reservoir(content, calc_step)
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        raise HTTPException(500, f"计算失败: {type(e).__name__}: {e}\n{traceback.format_exc()[-800:]}")
    # HTTP headers must be latin-1; reservoir names are CJK so URL-encode them.
    # Frontend decodes via `decodeURIComponent(res.headers.get("x-up-res") ?? "")`.
    return Response(
        content=xlsx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": 'attachment; filename="reservoir_result.xlsx"',
            "X-Up-Res": cjk_header_safe(up_res),
            "X-Down-Res": cjk_header_safe(down_res),
            "Access-Control-Expose-Headers": "X-Up-Res, X-Down-Res, Content-Disposition",
        },
    )


@app.get("/api/sample")
def sample_xlsx() -> Response:
    """Return the bundled sample input so the web UI can offer a one-click demo."""
    sample = PROJECT_ROOT / "data" / "sample" / "输入.xlsx"
    if not sample.exists():
        raise HTTPException(404, "示例输入文件不存在")
    return Response(
        content=sample.read_bytes(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="sample_input.xlsx"'},
    )
