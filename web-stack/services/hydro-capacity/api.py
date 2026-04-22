"""FastAPI wrapper for hydro-capacity — unchanged Python core, no Streamlit.

Run:
    uv run uvicorn api:app --host 127.0.0.1 --port 8611 --reload
"""
from __future__ import annotations

import io
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
    df_to_json_safe,
    make_service_app,
)

PROJECT_ROOT = Path(__file__).resolve().parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.capacity.calc_core import (  # noqa: E402
    build_process_table,
    build_result_table,
    calc_daily_capacity_with_segments,
    calc_monthly_flow,
    calc_reservoir_monthly_capacity,
    calc_reservoir_monthly_volume,
    calc_reservoir_zone_monthly_avg,
    calc_zone_monthly_avg,
)
from src.capacity.xlsx_parser import (  # noqa: E402
    get_flow_column_map,
    parse_flow_sheets,
    parse_input_sheet,
    parse_reservoir_input,
    read_input_sheet_raw,
)

app = make_service_app(
    service_id="hydro-capacity",
    name="capacity", title="纳污能力计算", icon="🌊",
    description="河道/水库纳污能力计算，支持支流分段和多方案",
    web_port=3111, default_api_port=8611,
    service_type="compute",
    compute_endpoint="/api/compute",
    input_formats=['xlsx'],
    output_formats=['xlsx', 'json'],
    pyproject_dir=Path(__file__).parent,
)

def _add_unit(df: pd.DataFrame, unit: str, col_names: list | None = None) -> pd.DataFrame:
    rename_map = {}
    for col in df.columns:
        if col_names and col in col_names:
            rename_map[col] = f"{col}({unit})"
        elif col == "年合计":
            rename_map[col] = f"年合计({unit})"
        elif col == "年平均":
            rename_map[col] = f"年平均({unit})"
    return df.rename(columns=rename_map)


def _zones_preview(zones: list) -> dict:
    rows = [
        {
            "功能区": z.zone_id,
            "干流名": z.main_name,
            "Cs": z.Cs,
            "K(1/s)": z.K,
            "b": z.b,
            "a": z.a,
            "β": z.beta,
            "干流长度L(m)": z.length,
            "干流C0": z.C0,
            "支流数": len(z.branches) if z.branches else 0,
        }
        for z in zones
    ]
    return df_to_json_safe(pd.DataFrame(rows))


def _branches_preview(zones: list) -> dict:
    rows = []
    for z in zones:
        for br in z.branches or []:
            rows.append(
                {
                    "功能区": z.zone_id,
                    "支流名": br.name,
                    "长度L(m)": br.length,
                    "汇入位置(m)": br.join_position,
                    "C0": br.C0,
                }
            )
    return df_to_json_safe(pd.DataFrame(rows))


def _compute_capacity(xlsx_bytes: bytes) -> tuple[dict[str, pd.DataFrame], list, int, bool, pd.DataFrame]:
    """Run full compute. Returns (all_scheme_results, zones, scheme_count, has_reservoir, sample_flow)."""
    upload_buf = io.BytesIO(xlsx_bytes)
    ws_data = read_input_sheet_raw(upload_buf)
    zones, scheme_count = parse_input_sheet(ws_data)

    upload_buf.seek(0)
    xlsx = pd.ExcelFile(upload_buf)

    flow_sheets = parse_flow_sheets(xlsx, scheme_count)
    if not flow_sheets:
        raise HTTPException(400, "未找到逐日流量 sheet（需包含'逐日流量'和'方案N'）")

    reservoir_zones, reservoir_volume_df = parse_reservoir_input(xlsx)

    zone_ids = [z.zone_id for z in zones]
    sample_flow = list(flow_sheets.values())[0]
    flow_col_map = get_flow_column_map(zones, list(sample_flow.columns))

    all_flow_cols: list[str] = []
    for info in flow_col_map.values():
        all_flow_cols.append(info["main"])
        all_flow_cols.extend(info["branches"])

    all_scheme_results: dict[str, pd.DataFrame] = {}
    for s_num in range(1, scheme_count + 1):
        daily_flow = flow_sheets[s_num]
        prefix = f"方案{s_num}" if scheme_count > 1 else ""
        tag = f"（{prefix}）" if prefix else ""

        calc_monthly_flow(daily_flow, all_flow_cols)
        daily_cap, seg_accum = calc_daily_capacity_with_segments(daily_flow, zones, flow_col_map)
        daily_cap_with_month = daily_cap.copy()
        daily_cap_with_month["年"] = daily_cap_with_month["日期"].dt.year
        daily_cap_with_month["月"] = daily_cap_with_month["日期"].dt.month
        monthly_cap = daily_cap_with_month.groupby(["年", "月"])[zone_ids].mean().reset_index()
        zone_avg_cap = calc_zone_monthly_avg(monthly_cap, zone_ids, is_capacity=True)
        process_table = build_process_table(seg_accum, zones)
        result_table = build_result_table(seg_accum, zones)

        all_scheme_results[f"逐日纳污能力{tag}"] = daily_cap
        all_scheme_results[f"逐月纳污能力{tag}"] = _add_unit(monthly_cap, "t/a", zone_ids)
        all_scheme_results[f"功能区月平均纳污能力{tag}"] = _add_unit(zone_avg_cap, "t/a")
        all_scheme_results[f"纳污能力过程{tag}"] = process_table
        all_scheme_results[f"纳污能力结果{tag}"] = result_table

    has_reservoir = bool(reservoir_zones) and reservoir_volume_df is not None
    if has_reservoir:
        r_zone_ids = [z.zone_id for z in reservoir_zones]
        monthly_vol = calc_reservoir_monthly_volume(reservoir_volume_df, r_zone_ids)
        r_monthly_cap = calc_reservoir_monthly_capacity(monthly_vol, reservoir_zones)
        r_zone_avg = calc_reservoir_zone_monthly_avg(r_monthly_cap, r_zone_ids)
        all_scheme_results["水库逐月库容(m³)"] = _add_unit(monthly_vol, "m³", r_zone_ids)
        all_scheme_results["水库月平均纳污能力"] = _add_unit(r_zone_avg, "t/a")

    return all_scheme_results, zones, scheme_count, has_reservoir, sample_flow


def _write_xlsx(all_scheme_results: dict[str, pd.DataFrame]) -> bytes:
    out = io.BytesIO()
    with pd.ExcelWriter(out, engine="openpyxl") as writer:
        for name, df in all_scheme_results.items():
            df.to_excel(writer, sheet_name=name[:31], index=False)
    return out.getvalue()


DAILY_DISPLAY_LIMIT = 500


@app.post("/api/compute")
async def compute(
    file: UploadFile = File(..., description="输入.xlsx"),
    format: str = Form("xlsx", description="xlsx (binary) | json (preview+results+base64)"),
) -> Response:
    content = await file.read()
    if not content:
        raise HTTPException(400, "上传文件为空")
    started = time.perf_counter()
    try:
        all_scheme_results, zones, scheme_count, has_reservoir, sample_flow = _compute_capacity(content)
        xlsx_bytes = _write_xlsx(all_scheme_results)
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        raise HTTPException(
            500,
            f"计算失败: {type(e).__name__}: {e}\n{traceback.format_exc()[-800:]}",
        )
    elapsed_ms = int((time.perf_counter() - started) * 1000)

    if format == "json":
        results_payload = {
            name: df_to_json_safe(df, limit=DAILY_DISPLAY_LIMIT if "逐日" in name else None)
            for name, df in all_scheme_results.items()
        }
        payload = build_json_response(
            preview={
                "zones": _zones_preview(zones),
                "branches": _branches_preview(zones),
                "flowHead": df_to_json_safe(sample_flow, limit=10),
            },
            meta={
                "zoneCount": len(zones),
                "schemeCount": scheme_count,
                "hasReservoir": has_reservoir,
                "elapsedMs": elapsed_ms,
            },
            results=results_payload,
            xlsx_bytes=xlsx_bytes,
        )
        return JSONResponse(content=payload)

    return Response(
        content=xlsx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": 'attachment; filename="capacity_result.xlsx"',
            "X-Zone-Count": str(len(zones)),
            "X-Scheme-Count": str(scheme_count),
            "Access-Control-Expose-Headers": "X-Zone-Count, X-Scheme-Count, Content-Disposition",
        },
    )


@app.get("/api/sample")
def sample_xlsx() -> Response:
    sample = PROJECT_ROOT / "data" / "sample" / "示例输入.xlsx"
    if not sample.exists():
        raise HTTPException(404, "示例输入文件不存在")
    return Response(
        content=sample.read_bytes(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="sample_input.xlsx"'},
    )
