"""FastAPI wrapper — expose cc-options dashboard data without Streamlit.

Usage (dev):
    CC_OPTIONS_DATA_DIR=~/Dev/stations/cc-options/data \
        uv run uvicorn api:app --host 127.0.0.1 --port 8621 --reload

Data source:
    本地 LaunchAgent 17:00 跑 ~/Dev/stations/cc-options/daily_update.sh 生成
    data/{portfolio,activities}.json + daily_nlv.csv，由 cc-options/sync-data.sh
    白名单 rsync 到 VPS /var/www/cc-options/data/。这里只读 JSON/CSV。

金融凭证 (.env) 永不上 VPS — 所有需凭证的拉数据脚本在本地跑。
"""

from __future__ import annotations

import csv
import json
import math
import os
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

import sys
for _p in [Path.home() / "Dev/devtools/lib", Path("/var/www/devtools/lib")]:
    if _p.exists(): sys.path.insert(0, str(_p)); break
from hydro_api_helpers import read_version  # noqa: E402

from lib_greeks import (
    compute_roll_credits,
    compute_roll_signals,
    compute_scenarios,
    process_portfolio,
)

DATA_DIR = Path(os.getenv("CC_OPTIONS_DATA_DIR", "/var/www/cc-options/data"))


app = FastAPI(title="cc-options-api", version=read_version(Path(__file__).parent))

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3121",
        "http://127.0.0.1:3121",
        "https://cc-options.tianlizeng.cloud",
    ],
    allow_methods=["GET"],
    allow_headers=["*"],
)


def _read_json(path: Path) -> Any:
    if not path.exists():
        raise HTTPException(503, f"data not yet synced: {path.name}")
    return json.loads(path.read_text(encoding="utf-8"))


def _get_processed_portfolio() -> dict[str, Any]:
    """Load portfolio.json + run Greeks pipeline. 503 if data missing or no QQQ."""
    proc = process_portfolio(_read_json(DATA_DIR / "portfolio.json"))
    if proc is None:
        raise HTTPException(503, "no QQQ position — process_portfolio returned None")
    return proc


def _clean_signal(s: dict[str, Any]) -> dict[str, Any]:
    """Serialize datetime.date (exp_date) → isoformat for JSON."""
    return {k: (v.isoformat() if hasattr(v, "isoformat") else v) for k, v in s.items()}


@app.get("/api/health")
def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "data_dir": str(DATA_DIR),
        "data_available": DATA_DIR.exists(),
    }


@app.get("/api/meta")
def meta() -> dict[str, Any]:
    """Summary counts + last-update timestamps, used by frontend for freshness hint."""
    out: dict[str, Any] = {"data_dir": str(DATA_DIR)}
    for name in ("portfolio.json", "activities.json", "daily_nlv.csv"):
        p = DATA_DIR / name
        if p.exists():
            out[name] = {
                "size": p.stat().st_size,
                "mtime": int(p.stat().st_mtime),
            }
        else:
            out[name] = None
    return out


@app.get("/api/metadata")
def metadata() -> dict[str, Any]:
    """Canonical service metadata — consumed by ops-console /services-health."""
    try:
        deployed_at = int((Path(__file__).parent / "api.py").stat().st_mtime)
    except OSError:
        deployed_at = 0
    return {
        "name": "cc-options",
        "title": "QQQ CC Dashboard",
        "icon": "📈",
        "description": "Covered call 头寸监控与 NAV 走势",
        "version": _read_version(),
        "service_id": "cc-options",
        "service_type": "proxy",
        "port": int(os.environ.get("SERVICE_PORT", 8621)),
        "compute_endpoint": None,
        "input_formats": [],
        "output_formats": ["json"],
        "deployed_at": deployed_at,
    }


@app.get("/api/portfolio")
def portfolio() -> dict[str, Any]:
    return _read_json(DATA_DIR / "portfolio.json")


@app.get("/api/activities")
def activities(limit: int = 100) -> dict[str, Any]:
    """Return most-recent activities, sorted desc by trade_date, limited for payload."""
    data = _read_json(DATA_DIR / "activities.json")
    items = data.get("activities", [])
    items_sorted = sorted(items, key=lambda x: x.get("trade_date") or "", reverse=True)
    return {
        "fetched_at": data.get("fetched_at"),
        "count": data.get("count", len(items)),
        "returned": min(len(items), limit),
        "activities": items_sorted[:limit],
    }


@app.get("/api/equity-curve")
def equity_curve() -> dict[str, Any]:
    """Return full daily NLV curve as list of {date, nlv, cash, ...} rows."""
    path = DATA_DIR / "daily_nlv.csv"
    if not path.exists():
        raise HTTPException(503, "daily_nlv.csv not yet synced")
    rows: list[dict[str, Any]] = []
    with path.open(encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            converted: dict[str, Any] = {"date": r["date"]}
            for k, v in r.items():
                if k == "date":
                    continue
                try:
                    converted[k] = float(v) if v else None
                except ValueError:
                    converted[k] = v
            rows.append(converted)
    return {
        "count": len(rows),
        "first": rows[0]["date"] if rows else None,
        "last": rows[-1]["date"] if rows else None,
        "rows": rows,
    }


@app.get("/api/summary")
def summary() -> dict[str, Any]:
    """One-shot summary — latest NLV row + portfolio total, for top metric cards."""
    curve = equity_curve()
    rows = curve["rows"]
    latest_row = rows[-1] if rows else {}
    prev_row = rows[-2] if len(rows) >= 2 else {}
    p = _read_json(DATA_DIR / "portfolio.json")
    acct = p["accounts"][0] if p.get("accounts") else {}
    return {
        "as_of": latest_row.get("date"),
        "portfolio_ts": p.get("ts"),
        "nlv": latest_row.get("nlv"),
        "cash": latest_row.get("cash"),
        "stock_mv": latest_row.get("stock_mv"),
        "opt_mtm": latest_row.get("opt_mtm"),
        "qqq_shares": latest_row.get("qqq_shares"),
        "margin_debt": latest_row.get("margin_debt"),
        "leverage": latest_row.get("leverage"),
        "qqq_close": latest_row.get("qqq_close"),
        "account_name": acct.get("name"),
        "account_total_value": (acct.get("total_value") or {}).get("value"),
        "prev_nlv": prev_row.get("nlv"),
        "prev_leverage": prev_row.get("leverage"),
        "prev_date": prev_row.get("date"),
    }


_CURRENT_FIELDS = (
    "qqq_price", "qqq_shares", "cash", "stock_mv", "opt_liability",
    "nlv", "margin_debt", "leverage",
    "stock_delta", "opt_delta_total",
    "net_delta", "net_theta", "net_gamma", "net_vega",
    "total_tv",
)


_DEFAULT_PCTS: tuple[float, ...] = (-0.05, -0.03, -0.01, 0.0, 0.01, 0.03, 0.05)


def _parse_pcts(pcts_arg: str | None) -> tuple[float, ...]:
    """Parse `-5,-3,-1,0,1,3,5` → (-0.05,-0.03,-0.01,0,0.01,0.03,0.05)."""
    if not pcts_arg:
        return _DEFAULT_PCTS
    try:
        vals = sorted({round(float(x.strip()) / 100, 6) for x in pcts_arg.split(",") if x.strip()})
        return tuple(vals) if vals else _DEFAULT_PCTS
    except ValueError:
        return _DEFAULT_PCTS


@app.get("/api/scenarios")
def scenarios(days: int = 0, pcts: str | None = None) -> dict[str, Any]:
    """NLV under QQQ pct shocks, optionally advanced forward N days.

    Args:
        days: project N days into future (Theta decay). Default 0.
        pcts: comma-separated percents, e.g. "-5,-3,-1,0,1,3,5". Default 7 standard steps.

    Returns `current` snapshot (Greeks, deltas, leverage, effective_theta, opt_rows).
    """
    pct_tuple = _parse_pcts(pcts)
    proc = _get_processed_portfolio()
    res = compute_scenarios(
        proc["qqq_price"], proc["qqq_shares"], proc["cash"], proc["opt_rows"],
        pcts=pct_tuple,
        days=days, margin_debt=proc["margin_debt"],
    )
    current = proc["nlv"]
    # Effective theta = only contracts with DTE ≥ 1 (避开到期/今日到期的 BS 炸裂值)
    effective_theta = sum(
        r["qty"] * r["theta"] * 100
        for r in proc["opt_rows"]
        if r["dte"] >= 1
    )
    return {
        "current": {
            **{k: proc[k] for k in _CURRENT_FIELDS},
            "effective_theta": effective_theta,
            "opt_rows": [_clean_signal(r) for r in proc["opt_rows"]],
        },
        "days": days,
        "scenarios": [
            {
                "pct": p, "nlv": n,
                "delta_nlv": n - current,
                "delta_pct": (n - current) / current if current else 0,
            }
            for p, n in sorted(res.items())
        ],
    }


def _compute_target(action: str, strike: float, iv: float, qqq_price: float) -> str:
    """Roll target suggestion, mirrors legacy Streamlit render_signal_card (app.py L730-748)."""
    if not iv or qqq_price <= 0:
        return "-"
    target_dte = 30
    target_exp = (datetime.now() + timedelta(days=target_dte)).strftime("%m/%d")
    if "ASSIGN" in action:
        target_strike = round(qqq_price)
        if target_strike <= 0:
            return "-"
        est_tv = iv * qqq_price * math.sqrt(target_dte / 365) * 0.4
        est_yield = (est_tv / target_strike) * (365 / target_dte) * 100
        return f"→ {target_strike}C {target_exp} ATM (~{est_yield:.0f}%年化)"
    if "ROLL" in action:
        target_strike = int(strike)
        if target_strike <= 0:
            return "-"
        est_tv = iv * qqq_price * math.sqrt(target_dte / 365) * 0.4
        moneyness = abs(qqq_price - target_strike) / qqq_price
        itm_discount = max(0.3, 1 - moneyness * 3)
        est_tv_adj = est_tv * itm_discount
        est_yield = (est_tv_adj / target_strike) * (365 / target_dte) * 100
        return f"→ {target_strike}C {target_exp} (~{est_yield:.0f}%年化)"
    return "-"


@app.get("/api/roll-signals")
def roll_signals() -> dict[str, Any]:
    """Per-position roll/hold/assign decision tree with reasons + roll credits."""
    proc = _get_processed_portfolio()
    sigs = compute_roll_signals(
        proc["opt_rows"],
        net_delta=proc["net_delta"],
        qqq_shares=proc["qqq_shares"],
        qqq_price=proc["qqq_price"],
        nlv=proc["nlv"],
    )
    credits = compute_roll_credits(proc["opt_rows"], DATA_DIR / "activities.json")
    qqq_price = proc["qqq_price"]
    cleaned = []
    for s in sigs:
        out = _clean_signal(s)
        out["credit"] = credits.get(s["ticker"])
        out["target"] = _compute_target(
            s.get("action", ""), s.get("strike", 0), s.get("iv", 0), qqq_price,
        )
        cleaned.append(out)
    return {"count": len(cleaned), "signals": cleaned}


# ── TWR & performance metrics ───────────────────────────────────────

def _load_curve_rows() -> list[dict[str, Any]]:
    """Read daily_nlv.csv as list of dicts (float-cast, `None` for empty cells)."""
    path = DATA_DIR / "daily_nlv.csv"
    if not path.exists():
        raise HTTPException(503, "daily_nlv.csv not yet synced")
    rows: list[dict[str, Any]] = []
    with path.open(encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            converted: dict[str, Any] = {"date": r["date"]}
            for k, v in r.items():
                if k == "date":
                    continue
                try:
                    converted[k] = float(v) if v else None
                except ValueError:
                    converted[k] = v
            rows.append(converted)
    return rows


def _load_cash_flows() -> dict[str, float]:
    """{date → cf} from activities.json CONTRIBUTION/WITHDRAWAL (for TWR adjustment)."""
    try:
        data = _read_json(DATA_DIR / "activities.json")
    except HTTPException:
        return {}
    cf: dict[str, float] = {}
    for a in data.get("activities", []):
        if a.get("type") in ("CONTRIBUTION", "WITHDRAWAL"):
            d = (a.get("trade_date") or "")[:10]
            amt = float(a.get("amount") or 0)
            if d:
                cf[d] = cf.get(d, 0.0) + amt
    return cf


def _twr_curve(nlvs: list[float], dates: list[str], cf_map: dict[str, float]) -> list[float]:
    """TWR cumulative curve normalized to 100 at start; contributions excluded from return."""
    cum = [100.0]
    for i in range(1, len(nlvs)):
        prev, curr = nlvs[i - 1], nlvs[i]
        cf = cf_map.get(dates[i], 0.0)
        base = prev + max(cf, 0.0)
        r = (curr - prev - cf) / base if base > 0 else 0.0
        cum.append(cum[-1] * (1 + r))
    return cum


def _benchmark_curve(prices: list[float | None]) -> list[float | None]:
    """Price-return cumulative curve starting at 100; aligned to dates."""
    base = None
    out: list[float | None] = []
    for p in prices:
        if base is None:
            if p is not None:
                base = p
                out.append(100.0)
            else:
                out.append(None)
        else:
            out.append(100.0 * p / base if p is not None else None)
    return out


def _curve_metrics(curve: list[float | None]) -> dict[str, Any]:
    """Annualized metrics from a normalized curve (skip None entries)."""
    clean = [v for v in curve if v is not None]
    if len(clean) < 20:
        return {"annual_return": None, "annual_vol": None, "sharpe": None,
                "sortino": None, "max_drawdown": None, "total_return": None}
    rets = [(clean[i] - clean[i - 1]) / clean[i - 1] for i in range(1, len(clean))]
    n = len(rets)
    mu_d = sum(rets) / n
    sigma_d = math.sqrt(sum((r - mu_d) ** 2 for r in rets) / n)
    mu_a = mu_d * 252
    sigma_a = sigma_d * math.sqrt(252)
    rf = 0.045
    sharpe = (mu_a - rf) / sigma_a if sigma_a > 0 else 0.0
    downside = [r for r in rets if r < 0]
    if downside:
        ds_mean = sum(downside) / len(downside)
        ds_sigma = math.sqrt(sum((r - ds_mean) ** 2 for r in downside) / len(downside)) * math.sqrt(252)
        sortino = (mu_a - rf) / ds_sigma if ds_sigma > 0 else 0.0
    else:
        sortino = 0.0
    peak = clean[0]
    max_dd = 0.0
    for v in clean:
        if v > peak:
            peak = v
        dd = (v - peak) / peak
        if dd < max_dd:
            max_dd = dd
    total_ret = clean[-1] / clean[0] - 1
    n_years = n / 252
    annual_return = (clean[-1] / clean[0]) ** (1 / n_years) - 1 if n_years > 0 and clean[0] > 0 else 0.0
    return {
        "annual_return": annual_return,
        "annual_vol": sigma_a,
        "sharpe": sharpe,
        "sortino": sortino,
        "max_drawdown": max_dd,
        "total_return": total_ret,
    }


@app.get("/api/twr")
def twr(start: str = "2025-01-01") -> dict[str, Any]:
    """Normalized cumulative curves (base=100) for CC / SPY / QQQ / TQQQ since `start`."""
    all_rows = _load_curve_rows()
    rows = [r for r in all_rows if r["date"] >= start]
    if len(rows) < 2:
        raise HTTPException(400, f"too few rows after start={start}")
    dates = [r["date"] for r in rows]
    nlvs = [r["nlv"] or 0 for r in rows]
    cf_map = _load_cash_flows()
    return {
        "start": start,
        "dates": dates,
        "cc": _twr_curve(nlvs, dates, cf_map),
        "spy": _benchmark_curve([r.get("spy_close") for r in rows]),
        "qqq": _benchmark_curve([r.get("qqq_close") for r in rows]),
        "tqqq": _benchmark_curve([r.get("tqqq_close") for r in rows]),
    }


@app.get("/api/perf-metrics")
def perf_metrics(start: str = "2025-01-01") -> dict[str, Any]:
    """Performance metrics (annual/sharpe/sortino/maxdd) for CC / SPY / QQQ / TQQQ."""
    t = twr(start=start)
    return {
        "start": start,
        "strategies": [
            {"label": "CC 实盘", **_curve_metrics(t["cc"])},
            {"label": "SPY", **_curve_metrics(t["spy"])},
            {"label": "QQQ", **_curve_metrics(t["qqq"])},
            {"label": "TQQQ", **_curve_metrics(t["tqqq"])},
        ],
    }


