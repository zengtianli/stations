#!/usr/bin/env python3
"""Robinhood QQQ Covered Call Dashboard — Single-page Streamlit App"""
import html as _html
import json
import math
from datetime import datetime, timedelta
from pathlib import Path

import numpy as np
import pandas as pd
import plotly.graph_objects as go
import plotly.io as pio
import streamlit as st

from lib_greeks import (
    process_portfolio, compute_scenarios, compute_roll_signals,
    compute_roll_credits, compute_margin_savings,
    R, MARGIN_COST, HIBOR_RATE, bs_call_price,
)

DASH = Path(__file__).resolve().parent
DATA = DASH / "data"

st.set_page_config(
    page_title="QQQ CC Dashboard",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ── Theme colors ──────────────────────────────────────────────────
CLR_BG = "#fbfbfd"
CLR_FG = "#1d1d1f"
CLR_MUTED = "#86868b"
CLR_BORDER = "#e5e5e7"
CLR_ACCENT = "#0071e3"
CLR_CC = "#0071e3"
CLR_QQQ = "#34c759"
CLR_LEV = "#ff9500"


# ── CSS injection ─────────────────────────────────────────────────

def inject_custom_css():
    st.markdown("""<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    /* Global font */
    html, body, [class*="css"], .stMarkdown, .stMetric,
    [data-testid="stMetricLabel"], [data-testid="stMetricValue"] {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
    }

    /* Main content area subtle gradient */
    section.main > div {
        background: linear-gradient(180deg, #fbfbfd 0%, #f5f7fa 100%);
    }

    /* Metric cards — glass-like with subtle color tint */
    [data-testid="stMetric"] {
        background: linear-gradient(135deg, #ffffff 0%, #f8f9fc 100%);
        border: 1px solid #e5e5e7;
        border-radius: 1rem;
        padding: 1rem 1.2rem;
        box-shadow: 0 2px 8px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06);
        transition: box-shadow 0.2s ease, transform 0.2s ease;
    }
    [data-testid="stMetric"]:hover {
        box-shadow: 0 4px 16px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.06);
        transform: translateY(-1px);
    }
    [data-testid="stMetricLabel"] {
        font-size: 0.8rem !important;
        font-weight: 500 !important;
        color: #86868b !important;
    }
    [data-testid="stMetricValue"] {
        font-size: 1.5rem !important;
        font-weight: 700 !important;
        color: #1d1d1f !important;
    }
    /* Positive delta */
    [data-testid="stMetricDelta"] svg[data-testid="stArrowUpIcon"] ~ span,
    [data-testid="stMetricDelta"][style*="color: green"] {
        color: #34c759 !important;
    }

    /* Markdown tables */
    .stMarkdown table {
        border-collapse: separate;
        border-spacing: 0;
        border-radius: 0.75rem;
        overflow: hidden;
        border: 1px solid #e5e5e7;
        width: 100%;
        font-size: 0.88rem;
        box-shadow: 0 1px 4px rgba(0,0,0,0.04);
    }
    .stMarkdown table th {
        background: linear-gradient(180deg, #f5f5f7 0%, #eeeff1 100%) !important;
        font-weight: 600;
        padding: 0.65rem 1rem;
        text-align: left;
        border-bottom: 1px solid #e5e5e7;
        color: #1d1d1f;
        font-size: 0.82rem;
    }
    .stMarkdown table td {
        padding: 0.55rem 1rem;
        border-bottom: 1px solid #f0f0f2;
        color: #1d1d1f;
    }
    .stMarkdown table tr:last-child td {
        border-bottom: none;
    }
    .stMarkdown table tr:hover td {
        background: #edf2ff !important;
    }
    .stMarkdown table tr:nth-child(even) td {
        background: #f8f9fb;
    }

    /* DataFrames */
    [data-testid="stDataFrame"] {
        border-radius: 0.75rem;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        border: 1px solid #e5e5e7;
    }

    /* Tabs */
    [data-testid="stTabs"] > div:first-child {
        background: #ffffff;
        border-radius: 0.75rem 0.75rem 0 0;
        border-bottom: 1px solid #e5e5e7;
        padding: 0 0.5rem;
    }
    [data-testid="stTabs"] button {
        font-family: 'Inter', -apple-system, sans-serif !important;
        font-weight: 500;
        font-size: 0.95rem;
        color: #86868b;
        padding: 0.7rem 1.5rem;
        border-radius: 0;
        border-bottom: 2px solid transparent;
        transition: all 0.2s ease;
    }
    [data-testid="stTabs"] button:hover {
        color: #1d1d1f;
        background: #f5f5f7;
    }
    [data-testid="stTabs"] button[aria-selected="true"] {
        color: #0071e3 !important;
        border-bottom: 2.5px solid #0071e3 !important;
        font-weight: 600;
        background: transparent;
    }

    /* Sidebar */
    [data-testid="stSidebar"] {
        background: linear-gradient(180deg, #f5f5f7 0%, #edeef0 100%);
    }
    [data-testid="stSidebar"] .stButton button {
        border-radius: 0.5rem;
        font-weight: 500;
        transition: all 0.2s ease;
    }

    /* Expanders */
    [data-testid="stExpander"] {
        border: 1px solid #e5e5e7;
        border-radius: 0.75rem;
        overflow: hidden;
        background: #ffffff;
        box-shadow: 0 1px 4px rgba(0,0,0,0.03);
    }

    /* Spacing */
    [data-testid="stHorizontalBlock"] {
        gap: 0.8rem;
    }

    /* Signal badges */
    .signal-badge {
        display: inline-block;
        border-radius: 0.5rem;
        padding: 0.25rem 0.75rem;
        font-weight: 600;
        font-size: 0.82rem;
        letter-spacing: 0.02em;
    }
    .signal-hold { background: #e8f5e9; color: #2e7d32; }
    .signal-roll { background: #fff8e1; color: #e65100; }
    .signal-assign { background: #fce4ec; color: #c62828; }
    .signal-watch { background: #e3f2fd; color: #1565c0; }
    .signal-expire { background: #f3e5f5; color: #6a1b9a; }

    /* Signal card — colored left border */
    .signal-card {
        background: #ffffff;
        border: 1px solid #e5e5e7;
        border-radius: 1rem;
        padding: 1.2rem 1.2rem 1.2rem 1.4rem;
        box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        margin-bottom: 0.5rem;
        position: relative;
        overflow: hidden;
    }
    .signal-card::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 4px;
        border-radius: 1rem 0 0 1rem;
    }
    .signal-card.card-hold::before { background: #34c759; }
    .signal-card.card-roll::before { background: #ff9500; }
    .signal-card.card-assign::before { background: #ff3b30; }
    .signal-card.card-watch::before { background: #0071e3; }
    .signal-card.card-expire::before { background: #af52de; }

    .signal-card-header {
        font-size: 1rem;
        font-weight: 700;
        color: #1d1d1f;
        margin-bottom: 0.5rem;
    }
    .signal-card-target {
        font-size: 0.85rem;
        color: #1d1d1f;
        margin-top: 0.5rem;
        padding: 0.4rem 0.6rem;
        background: #f5f5f7;
        border-radius: 0.4rem;
        font-family: 'SF Mono', 'Menlo', monospace;
    }
    .signal-card-reason {
        font-size: 0.8rem;
        color: #86868b;
        margin-top: 0.4rem;
        line-height: 1.5;
    }
    .tv-progress-track {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-top: 0.6rem;
    }
    .tv-progress-bar {
        flex: 1;
        height: 6px;
        background: #f0f0f2;
        border-radius: 3px;
        overflow: hidden;
    }
    .tv-progress-fill {
        height: 100%;
        border-radius: 3px;
    }
    .tv-progress-label {
        font-size: 0.75rem;
        color: #86868b;
        white-space: nowrap;
        font-weight: 500;
    }

    /* Section title */
    .section-title {
        font-size: 0.75rem;
        font-weight: 600;
        color: #86868b;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin-bottom: 0.8rem;
    }

    /* Global header banner */
    .header-banner {
        background: linear-gradient(135deg, #0071e3 0%, #40a0ff 100%);
        color: white;
        padding: 0.6rem 1.2rem;
        border-radius: 0.75rem;
        font-size: 0.85rem;
        font-weight: 500;
        margin-bottom: 0.8rem;
        box-shadow: 0 2px 8px rgba(0,113,227,0.2);
    }
    .header-banner span {
        opacity: 0.85;
    }
    </style>""", unsafe_allow_html=True)


inject_custom_css()


# ── Plotly theme ──────────────────────────────────────────────────

_apple_template = go.layout.Template(
    layout=go.Layout(
        font=dict(family="Inter, -apple-system, sans-serif", color=CLR_FG, size=12),
        paper_bgcolor=CLR_BG,
        plot_bgcolor=CLR_BG,
        colorway=[CLR_CC, CLR_QQQ, CLR_LEV, "#ff3b30", "#5856d6", "#af52de"],
        xaxis=dict(gridcolor="#e5e5e7", zerolinecolor="#d1d1d6", gridwidth=0.5),
        yaxis=dict(gridcolor="#e5e5e7", zerolinecolor="#d1d1d6", gridwidth=0.5),
        legend=dict(
            bgcolor="rgba(255,255,255,0.8)",
            bordercolor=CLR_BORDER,
            borderwidth=1,
            font=dict(size=12),
        ),
    )
)
pio.templates["apple"] = _apple_template
pio.templates.default = "apple"


# ── Helper: signal card HTML ──────────────────────────────────────

def _signal_css_class(action):
    a = action.upper()
    if "ASSIGN" in a:
        return "signal-assign"
    if "ROLL" in a:
        return "signal-roll"
    if "WATCH" in a:
        return "signal-watch"
    if "EXPIRE" in a:
        return "signal-expire"
    return "signal-hold"


def _tv_progress_color(pct):
    if pct >= 80:
        return "#ff9500"
    if pct >= 50:
        return "#34c759"
    return "#0071e3"


def _card_css_class(action):
    a = action.upper()
    if "ASSIGN" in a:
        return "card-assign"
    if "ROLL" in a:
        return "card-roll"
    if "WATCH" in a:
        return "card-watch"
    if "EXPIRE" in a:
        return "card-expire"
    return "card-hold"


def render_signal_card(exp, strike, qty, action, target, reason, tv_harv):
    badge_css = _signal_css_class(action)
    card_css = _card_css_class(action)
    fill_color = _tv_progress_color(tv_harv)
    # HTML-escape all dynamic content to prevent broken rendering
    action_safe = _html.escape(str(action))
    target_safe = _html.escape(str(target))
    reason_safe = _html.escape(str(reason))
    target_html = f'<div class="signal-card-target">{target_safe}</div>' if target and target != "-" else ""
    return (
        f'<div class="signal-card {card_css}">'
        f'<div class="signal-card-header">{_html.escape(str(exp))} &middot; {strike}C &times; {abs(qty)}</div>'
        f'<span class="signal-badge {badge_css}">{action_safe}</span>'
        f'{target_html}'
        f'<div class="signal-card-reason">{reason_safe}</div>'
        f'<div class="tv-progress-track">'
        f'<div class="tv-progress-bar">'
        f'<div class="tv-progress-fill" style="width:{min(tv_harv, 100):.0f}%;background:{fill_color}"></div>'
        f'</div>'
        f'<span class="tv-progress-label">TV {tv_harv:.0f}%</span>'
        f'</div>'
        f'</div>'
    )


# ── Settings persistence ───────────────────────────────────────────

SETTINGS_FILE = DATA / "dashboard_settings.json"


def load_settings():
    defaults = {
        "perf_start": "2025-01-01",
        "scenario_pct": 0.0,
        "scenario_days": 30,
        "scenario_grid": "-2,-1,-0.5,0,0.5,1,2",
        "return_period": "月收益",
    }
    if SETTINGS_FILE.exists():
        try:
            saved = json.loads(SETTINGS_FILE.read_text())
            defaults.update(saved)
        except Exception:
            pass
    return defaults


def save_settings(settings):
    SETTINGS_FILE.write_text(json.dumps(settings, ensure_ascii=False, indent=2))


settings = load_settings()

# ── Sidebar ─────────────────────────────────────────────────────────

st.sidebar.title("QQQ Covered Call")

perf_start = st.sidebar.date_input(
    "Performance 起点",
    value=pd.Timestamp(settings["perf_start"]),
)

st.sidebar.markdown("---")
st.sidebar.subheader("情景预测")
scenario_pct = st.sidebar.number_input(
    "QQQ 涨跌幅 (%)", value=float(settings["scenario_pct"]),
    step=0.5, format="%.1f",
)
scenario_days = st.sidebar.number_input(
    "预测天数", value=int(settings["scenario_days"]),
    min_value=1, max_value=365, step=1,
)
scenario_grid_str = st.sidebar.text_input(
    "情景对比百分比 (逗号分隔)",
    value=settings.get("scenario_grid", "-2,-1,-0.5,0,0.5,1,2"),
    help="QQQ 日均 ±0.05%，周均 ±2%。例: -2,-1,-0.5,0,0.5,1,2",
)

st.sidebar.markdown("---")
period_options = ["日收益", "周收益", "月收益", "年收益"]
return_period = st.sidebar.selectbox(
    "收益周期", period_options,
    index=period_options.index(settings.get("return_period", "月收益")),
)

st.sidebar.markdown("---")
if st.sidebar.button("💾 保存设置", use_container_width=True):
    save_settings({
        "perf_start": str(perf_start),
        "scenario_pct": scenario_pct,
        "scenario_days": scenario_days,
        "scenario_grid": scenario_grid_str,
        "return_period": return_period,
    })
    st.sidebar.success("设置已保存")

# Data freshness + refresh button
st.sidebar.markdown("---")
st.sidebar.caption("**数据状态**")
import os as _os
portfolio_file = DATA / "portfolio.json"
if portfolio_file.exists():
    mtime = datetime.fromtimestamp(_os.path.getmtime(portfolio_file))
    st.sidebar.caption(f"持仓快照: {mtime.strftime('%Y-%m-%d %H:%M')}")
nlv_file = DATA / "daily_nlv.csv"
if nlv_file.exists():
    mtime2 = datetime.fromtimestamp(_os.path.getmtime(nlv_file))
    st.sidebar.caption(f"历史曲线: {mtime2.strftime('%Y-%m-%d %H:%M')}")

if st.sidebar.button("🔄 拉取最新数据", use_container_width=True):
    import subprocess
    scripts_dir = DASH
    env = {**_os.environ}
    # Source .env if exists (for VPS deployment)
    env_file = DASH / ".env"
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            line = line.strip()
            if line.startswith("export "):
                line = line[7:]
            if "=" in line and not line.startswith("#"):
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip().strip('"')

    with st.sidebar.status("拉取数据中...", expanded=True) as status:
        ok = True

        # 1. 持仓快照
        st.write("拉取持仓快照 (SnapTrade)...")
        result = subprocess.run(
            ["python3", str(scripts_dir / "st_snapshot.py")],
            capture_output=True, text=True, env=env, cwd=str(DASH),
            timeout=120,
        )
        if result.returncode != 0:
            st.error(f"❌ 快照失败:\n{result.stderr[:500]}")
            ok = False
        else:
            st.write(f"✅ {result.stdout.strip()}")

        # 2. 增量拉取交易流水
        st.write("增量拉取交易流水...")
        result = subprocess.run(
            ["python3", str(scripts_dir / "st_activities.py"), "--incremental"],
            capture_output=True, text=True, env=env, cwd=str(DASH),
            timeout=120,
        )
        if result.returncode != 0:
            st.error(f"❌ 流水拉取失败:\n{result.stderr[:500]}")
            ok = False
        else:
            st.write(f"✅ {result.stdout.strip()}")

        # 3. 增量更新历史曲线
        st.write("增量更新历史曲线...")
        result = subprocess.run(
            ["python3", str(scripts_dir / "phase2_equity_curve.py"), "--incremental"],
            capture_output=True, text=True, env=env, cwd=str(DASH),
            timeout=120,
        )
        if result.returncode != 0:
            st.error(f"❌ 曲线更新失败:\n{result.stderr[:500]}")
            ok = False
        else:
            st.write(f"✅ {result.stdout.strip()}")

        if ok:
            status.update(label="数据已更新", state="complete")
            st.cache_data.clear()
            st.rerun()
        else:
            status.update(label="部分失败", state="error")


# ── Data loaders ────────────────────────────────────────────────────

@st.cache_data(ttl=300)
def load_portfolio():
    f = DATA / "portfolio.json"
    if not f.exists():
        return None
    port = json.loads(f.read_text())
    return process_portfolio(port)


@st.cache_data(ttl=300)
def load_daily_nlv():
    f = DATA / "daily_nlv.csv"
    if not f.exists():
        return None
    df = pd.read_csv(f, parse_dates=["date"])
    return df


@st.cache_data(ttl=300)
def load_contributions():
    """Load contribution/withdrawal cash flows from activities.json."""
    f = DATA / "activities.json"
    if not f.exists():
        return {}
    acts = json.loads(f.read_text())["activities"]
    cf = {}
    for a in acts:
        if a["type"] in ("CONTRIBUTION", "WITHDRAWAL"):
            d = (a.get("trade_date") or "")[:10]
            if d:
                cf[d] = cf.get(d, 0) + float(a.get("amount") or 0)
    return cf


def compute_twr_curve(nlv_series, dates, cf_map):
    """Compute TWR cumulative curve (base=100), stripping out contributions.
    On a contribution day: return = (NLV_end - NLV_prev - CF) / (NLV_prev + max(CF,0))
    This removes the cash flow's effect on the return.
    """
    cum = [100.0]
    for i in range(1, len(nlv_series)):
        prev = nlv_series[i - 1]
        curr = nlv_series[i]
        d = dates[i]
        cf = cf_map.get(d if isinstance(d, str) else d.strftime("%Y-%m-%d"), 0)
        # Adjust base for inflows (add to denominator), outflows reduce NLV
        base = prev + max(cf, 0)  # inflow: as if deposited at start of day
        if base > 100:
            r = (curr - prev - cf) / base
        else:
            r = 0.0
        cum.append(cum[-1] * (1 + r))
    return cum


def twr_metrics(twr_curve):
    """Compute metrics from a TWR curve (list starting at 100)."""
    s = pd.Series(twr_curve)
    if len(s) < 20:
        return {}
    rets = s.pct_change().dropna()
    mu = rets.mean() * 252
    sigma = rets.std() * math.sqrt(252)
    sharpe = (mu - R) / sigma if sigma > 0 else 0
    down = rets[rets < 0]
    sortino_d = down.std() * math.sqrt(252) if len(down) > 0 else 1
    sortino = (mu - R) / sortino_d if sortino_d > 0 else 0
    peak = s.cummax()
    dd = (s - peak) / peak
    max_dd = dd.min()
    total = s.iloc[-1] / s.iloc[0] - 1
    return {"Annual": mu, "Vol": sigma, "Sharpe": sharpe,
            "Sortino": sortino, "Max DD": max_dd, "Total": total}


def _fmt(m, key, pct=False):
    v = m.get(key)
    if v is None:
        return "N/A"
    return f"{v * 100:+.1f}%" if pct else f"{v:.2f}"


def _fmt_pct(pct):
    """Format a decimal like 0.005 → '+0.5%', handles fractional values."""
    if pct == 0:
        return "不变"
    val = pct * 100
    if abs(val - round(val)) < 1e-6:
        return f"{val:+.0f}%"
    return f"{val:+.1f}%"


# ── Load data ───────────────────────────────────────────────────────

data = load_portfolio()
if not data:
    st.error("portfolio.json not found. Run `python cc-dashboard/st_snapshot.py` first.")
    st.stop()

df_nlv = load_daily_nlv()
cf_map = load_contributions()

# ── Pre-compute all metrics (before tabs) ───────────────────────────

# Data date
_data_date = ""
if df_nlv is not None and len(df_nlv) > 0:
    _last_date = pd.Timestamp(df_nlv["date"].iloc[-1])
    _data_date = _last_date.strftime("%Y-%m-%d")
else:
    _data_date = data['ts'][:10] if data.get('ts') else ""

# Sharpe
sharpe_val = None
if df_nlv is not None:
    _df = df_nlv[df_nlv["date"] >= pd.Timestamp(perf_start)]
    if len(_df) >= 20:
        _twr = compute_twr_curve(_df["nlv"].tolist(), _df["date"].tolist(), cf_map)
        _twr_s = pd.Series(_twr)
        rets = _twr_s.pct_change().dropna()
        mu = rets.mean() * 252
        sigma = rets.std() * math.sqrt(252)
        sharpe_val = (mu - R) / sigma if sigma > 0 else 0

# Summary metrics
daily_theta = abs(data['net_theta'])
margin_daily_cost = data['margin_debt'] * MARGIN_COST / 365
margin_annual_cost = data['margin_debt'] * MARGIN_COST
net_daily = daily_theta - margin_daily_cost
total_short_calls = sum(abs(int(r["qty"])) for r in data["opt_rows"])
sharpe_display = f"{sharpe_val:.2f}" if sharpe_val is not None else "N/A"
qqq_px = data['qqq_price']
delta_pct = (1 - data['net_delta'] / data['qqq_shares']) * 100
nlv_impact_1pct = abs(data['net_delta'] * qqq_px * 0.01)

# Risk metrics
eff_leverage = data['net_delta'] * qqq_px / data['nlv'] if data['nlv'] > 0 else 0
nlv_impact_pct = nlv_impact_1pct / data['nlv'] * 100 if data['nlv'] > 0 else 0
opt_delta_abs = abs(data['opt_delta_total'])

# ±1% P&L breakdown
stock_pnl_1pct = data['qqq_shares'] * qqq_px * 0.01
opt_delta_pnl_1pct = data['opt_delta_total'] * qqq_px * 0.01
gamma_adj = 0.5 * data['net_gamma'] * (qqq_px * 0.01) ** 2
net_pnl_up = stock_pnl_1pct + opt_delta_pnl_1pct + gamma_adj
net_pnl_down = -stock_pnl_1pct - opt_delta_pnl_1pct + gamma_adj

# Options data
opt_rows = data["opt_rows"]
signals = compute_roll_signals(opt_rows,
    net_delta=data['net_delta'], qqq_shares=data['qqq_shares'],
    qqq_price=data['qqq_price'], nlv=data['nlv'])
signal_map = {s["ticker"]: s for s in signals}
roll_credits = compute_roll_credits(opt_rows, DATA / "activities.json")

# Build split table data
table_a_data = []  # 持仓概况
table_b_data = []  # 收益分析
signal_cards = []  # Roll 信号

if opt_rows:
    for r in opt_rows:
        qty = int(r["qty"])
        abs_qty = abs(qty)

        tv_remaining = r["time_value"] * abs_qty * 100
        premium_collected = r["avg"] * abs_qty * 100
        slippage = r["spread"] * abs_qty * 100

        strike_backing = r["strike"] * abs_qty * 100
        lev = data["leverage"]
        equity_needed = strike_backing / lev if lev > 0 else strike_backing
        margin_borrowed = strike_backing - equity_needed
        margin_interest = margin_borrowed * MARGIN_COST * max(r["dte"], 1) / 365
        dte_safe = max(r["dte"], 1)
        tv_yield = (tv_remaining / strike_backing) * (365 / dte_safe) * 100 if strike_backing > 0 else 0
        tv_yield_lev = ((tv_remaining - margin_interest) / equity_needed) * (365 / dte_safe) * 100 if equity_needed > 0 else 0

        rc = roll_credits.get(r["ticker"])
        roll_annual = rc["annual"] if rc else None
        if rc:
            days_period = rc.get("days_period", dte_safe)
            credit_total = rc["credit"] * abs_qty * 100
            margin_interest_roll = margin_borrowed * MARGIN_COST * days_period / 365
            roll_annual_lev = ((credit_total - margin_interest_roll) / equity_needed) * (365 / max(days_period, 1)) * 100 if equity_needed > 0 else 0
        else:
            days_period = None
            roll_annual_lev = None

        iv_pct = r["iv"] * 100

        sig = signal_map.get(r["ticker"])
        if sig:
            roll_action = sig["action"]
            roll_reason = "; ".join(sig["reasons"])
            tv_harv = sig.get("tv_harvested_pct", 0)

            if "ASSIGN" in roll_action:
                target_strike = round(data["qqq_price"])
                target_dte = 30
                target_exp = (datetime.now() + timedelta(days=target_dte)).strftime("%m/%d")
                est_tv = r["iv"] * data["qqq_price"] * math.sqrt(target_dte / 365) * 0.4
                est_yield = (est_tv / target_strike) * (365 / target_dte) * 100
                roll_target = f"→ {target_strike}C {target_exp} ATM (~{est_yield:.0f}%年化)"
            elif "ROLL" in roll_action:
                target_strike = int(r["strike"])
                target_dte = 30
                target_exp = (datetime.now() + timedelta(days=target_dte)).strftime("%m/%d")
                est_tv = r["iv"] * data["qqq_price"] * math.sqrt(target_dte / 365) * 0.4
                moneyness = abs(data["qqq_price"] - target_strike) / data["qqq_price"]
                itm_discount = max(0.3, 1 - moneyness * 3)
                est_tv_adj = est_tv * itm_discount
                est_yield = (est_tv_adj / target_strike) * (365 / target_dte) * 100
                roll_target = f"→ {target_strike}C {target_exp} (~{est_yield:.0f}%年化)"
            else:
                roll_target = "-"
        else:
            roll_action = "HOLD"
            roll_reason = "TV healthy"
            tv_harv = 0
            roll_target = "-"

        # Table A: 持仓概况
        table_a_data.append({
            "到期": r["exp"],
            "DTE": r["dte"],
            "行权价": int(r["strike"]),
            "数量": qty,
            "现价": f"${r['price']:.2f}",
            "IV": f"{iv_pct:.0f}%",
            "Delta": round(r["delta"], 2),
            "Theta": round(r["theta"], 3),
        })

        # Table B: 收益分析
        table_b_data.append({
            "到期": r["exp"],
            "行权价": int(r["strike"]),
            "收取权利金": f"${premium_collected:,.0f}",
            "Roll年化": f"{roll_annual:.1f}%" if roll_annual is not None else "-",
            "Roll杠杆年化": f"{roll_annual_lev:.1f}%" if roll_annual_lev is not None else "-",
            "剩余TV年化": f"{tv_yield:.1f}%",
            "杠杆年化": f"{tv_yield_lev:.1f}%",
        })

        # Signal card data
        signal_cards.append({
            "exp": r["exp"],
            "strike": int(r["strike"]),
            "qty": qty,
            "action": roll_action,
            "target": roll_target,
            "reason": roll_reason,
            "tv_harv": tv_harv,
            "slippage": f"${slippage:,.0f}" if slippage > 0 else "-",
            "tv_remaining": f"${tv_remaining:,.0f}",
        })

# Scenario grid
try:
    scenario_pcts = sorted({
        round(float(x.strip()) / 100, 6)
        for x in scenario_grid_str.split(",") if x.strip()
    })
except ValueError:
    scenario_pcts = [-0.05, -0.03, -0.01, 0, 0.01, 0.03, 0.05]
if not scenario_pcts:
    scenario_pcts = [-0.05, -0.03, -0.01, 0, 0.01, 0.03, 0.05]

scenario_results = compute_scenarios(
    data["qqq_price"], data["qqq_shares"], data["cash"], data["opt_rows"],
    pcts=scenario_pcts, days=scenario_days, margin_debt=data["margin_debt"])

margin_cost_total = data["margin_debt"] * MARGIN_COST * scenario_days / 365


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Global header
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

st.markdown(
    f'<div class="header-banner">'
    f'📅 <b>{_data_date}</b> 收盘 &nbsp;·&nbsp; QQQ <b>${data["qqq_price"]:.2f}</b> '
    f'&nbsp;·&nbsp; <span>Updated {_html.escape(str(data["ts"]))}</span>'
    f'</div>',
    unsafe_allow_html=True,
)

tab1, tab2, tab3, tab4, tab5 = st.tabs(["总览", "风险", "期权", "绩效", "情景"])


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Tab 1: 总览
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

with tab1:
    c1, c2, c3, c4 = st.columns(4)
    c1.metric("账户净值 (NLV)", f"${data['nlv']:,.0f}")
    c2.metric("QQQ 持仓市值", f"${data['stock_mv']:,.0f}")
    c3.metric("Margin 借款", f"${data['margin_debt']:,.0f}")
    c4.metric("杠杆倍数", f"{data['leverage']:.1f}×")

    st.markdown(f"""
| 指标 | 数值 | 怎么算的 |
|------|------|----------|
| **账户净值 (NLV)** | ${data['nlv']:,.0f} | 持仓市值 ${data['stock_mv']:,.0f} + 现金 ${data['cash']:,.0f} + 期权负债 ${data['opt_liability']:,.0f} = **${data['nlv']:,.0f}** |
| **QQQ 持仓** | {int(data['qqq_shares'])} 股 | {int(data['qqq_shares'])} 股 × QQQ 现价 ${qqq_px:.2f} = ${data['stock_mv']:,.0f} |
| **Margin 借款** | ${data['margin_debt']:,.0f} | 券商借给你的钱，年利率 **{MARGIN_COST*100:.2f}%**，每天利息 **${margin_daily_cost:,.0f}**，每月 **${margin_daily_cost*30:,.0f}**，每年 **${margin_annual_cost:,.0f}** |
| **杠杆** | {data['leverage']:.1f}× | 持仓市值 ${data['stock_mv']:,.0f} ÷ 净值 ${data['nlv']:,.0f} = {data['leverage']:.1f}×（你用 ${data['nlv']:,.0f} 自有资金撬动了 ${data['stock_mv']:,.0f} 的 QQQ） |
""")

    st.markdown("")

    c5, c6, c7, c8 = st.columns(4)
    c5.metric("日 Theta 收租", f"${daily_theta:,.0f}")
    c6.metric("日 Margin 利息", f"${margin_daily_cost:,.0f}")
    c7.metric("日净收入", f"${net_daily:,.0f}")
    c8.metric("Sharpe Ratio", sharpe_display)

    st.markdown(f"""
| 指标 | 数值 | 怎么算的 |
|------|------|----------|
| **日 Theta 收租** | ${daily_theta:,.0f}/天 | 你卖了 **{total_short_calls} 张** QQQ Short Call，每天时间价值衰减 ${daily_theta:,.0f}。你是卖方，衰减 = 你赚钱。前提：QQQ 价格不动 |
| **日 Margin 利息** | ${margin_daily_cost:,.0f}/天 | Margin 借款 ${data['margin_debt']:,.0f} × 年利率 {MARGIN_COST*100:.2f}% ÷ 365 天 = **${margin_daily_cost:,.0f}/天** |
| **日净收入** | ${net_daily:,.0f}/天 | Theta 收入 ${daily_theta:,.0f} − Margin 利息 ${margin_daily_cost:,.0f} = **${net_daily:,.0f}/天**（≈ ${net_daily*30:,.0f}/月） |
| **净 Delta 暴露** | {data['net_delta']:,.0f} | 你持有 {int(data['qqq_shares'])} 股 QQQ（Delta={int(data['qqq_shares'])}），卖出的 Call 对冲了 **{delta_pct:.0f}%** 的 Delta，剩余暴露 {data['net_delta']:,.0f}。也就是说 **QQQ 现价 ${qqq_px:.2f} 涨跌 1%（±${qqq_px*0.01:.2f}），你的 NLV 大约变动 ±${nlv_impact_1pct:,.0f}** |
| **Sharpe Ratio** | {sharpe_display} | 风险调整后收益率。>1 表示每承受 1 份风险赚 >1 份超额收益（优秀）；0 附近表示刚好和无风险利率持平；<0 表示跑输国债 |
""")

    # ── 融资优化 ──
    with st.expander("💰 融资优化 — HSBC HIBOR vs Robinhood Margin"):
        hibor_input = st.slider("HIBOR 利率 (%)", 1.0, 4.0, HIBOR_RATE * 100, 0.1,
                                help="当前 1M HIBOR ≈ 2.0-2.3%") / 100
        hsbc_max_input = st.slider(
            "HSBC 可借额度 (万 USD)", 10, 300,
            min(int(data['margin_debt'] / 10000), 200), 10,
            help="取决于 HSBC HK 投资抵押的 LTV",
        ) * 10000

        savings_rows = compute_margin_savings(
            data['margin_debt'], hsbc_max_input, hibor_input,
            data['qqq_price'],
            abs(data['net_theta']) / data['qqq_shares'] if data['qqq_shares'] > 0 else 0,
        )

        # Key metrics
        best_replace = [r for r in savings_rows if r['extra'] == 0 and r['savings'] > 0]
        if best_replace:
            best = best_replace[-1]
            sc1, sc2, sc3 = st.columns(3)
            sc1.metric("最优替代额", f"${best['hsbc']:,.0f}",
                       delta=f"混合利率 {best['blended']*100:.2f}%", delta_color="off")
            sc2.metric("年省利息", f"${best['savings']:,.0f}",
                       delta=f"月省 ${best['savings']/12:,.0f}", delta_color="normal")
            sc3.metric("日净收入提升",
                       f"+${best['savings']/365:,.0f}/天",
                       delta=f"${daily_theta - margin_daily_cost + best['savings']/365:,.0f}/天 (新)", delta_color="off")

        # Table
        table_md = (
            "| HSBC 借入 | HSBC 利息 | RH 余额 | RH 利率 | 总利息 | **年省** | 混合利率 |\n"
            "|-----------|----------|---------|---------|-------|---------|--------|\n"
        )
        for r in savings_rows:
            if r['extra'] > 0:
                continue
            tag = "（现状）" if r['hsbc'] == 0 else ""
            table_md += (
                f"| ${r['hsbc']:,.0f}{tag} | ${r['hsbc_cost']:,.0f} | "
                f"${r['rh_left']:,.0f} | {r['rh_rate']*100:.2f}% | "
                f"${r['total']:,.0f} | **${r['savings']:,.0f}** | {r['blended']*100:.2f}% |\n"
            )
        st.markdown(table_md)

        st.caption(
            "资金链路: HSBC HK 借 HKD → 换 USD → Global Transfer → HSBC US → ACH → Robinhood。"
            "全程 $0 手续费，HKD 挂钩 USD 无汇率风险。"
        )


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Tab 2: 风险
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

with tab2:
    # Row A: Leverage & Hedging
    ca1, ca2, ca3, ca4, ca5 = st.columns(5)
    ca1.metric("名义杠杆", f"{data['leverage']:.1f}×")
    ca2.metric("有效杠杆", f"{eff_leverage:.2f}×")
    ca3.metric("Delta 对冲比例", f"{delta_pct:.0f}%")
    ca4.metric("QQQ ±1% 影响", f"±${nlv_impact_1pct:,.0f}")
    ca5.metric("影响占 NLV", f"±{nlv_impact_pct:.2f}%")

    # Row B: Portfolio Greeks
    cb1, cb2, cb3, cb4 = st.columns(4)
    cb1.metric("净 Delta", f"{data['net_delta']:,.0f} 股",
               delta=f"纯 QQQ = {int(data['qqq_shares'])}", delta_color="off")
    cb2.metric("净 Gamma", f"{data['net_gamma']:,.1f}")
    cb3.metric("日 Theta 收入", f"${daily_theta:,.0f}",
               delta=f"利息 ${margin_daily_cost:,.0f}，净 ${net_daily:,.0f}", delta_color="off")
    cb4.metric("净 Vega", f"{data['net_vega']:,.0f}")

    st.markdown("")

    # Risk breakdown — directly rendered (no expander)
    st.markdown(f"""
#### 杠杆与对冲

| 指标 | 数值 | 通俗解释 |
|------|------|----------|
| **名义杠杆** | {data['leverage']:.1f}× | 你用 ${data['nlv']:,.0f} 自有资金买了 ${data['stock_mv']:,.0f} 的 QQQ，多出来的钱是券商借给你的（Margin） |
| **有效杠杆** | {eff_leverage:.2f}× | 但你卖了 deep ITM Call 对冲掉了大部分方向风险，实际上 QQQ 涨跌 1% 只影响你 {nlv_impact_pct:.2f}%，等效于只用了 {eff_leverage:.2f} 倍杠杆 |
| **对冲比例** | {delta_pct:.0f}% | 你持有 {int(data['qqq_shares'])} 股 QQQ（Delta={int(data['qqq_shares'])}），Short Call 贡献了 {opt_delta_abs:,.0f} 负 Delta，对冲掉了 {delta_pct:.0f}% |
| **净 Delta** | {data['net_delta']:,.0f} 股 | {int(data['qqq_shares'])}（持股）+ ({data['opt_delta_total']:,.0f})（期权）= {data['net_delta']:,.0f}。相当于你只裸露了 {data['net_delta']:,.0f} 股的方向风险 |

#### Greeks 解释

| Greek | 数值 | 通俗解释 |
|-------|------|----------|
| **Delta** | {data['net_delta']:,.0f} | QQQ 涨 $1，你的组合大约赚 ${data['net_delta']:,.0f}；跌 $1 亏 ${abs(data['net_delta']):,.0f}。数字越小说明对冲越好 |
| **Gamma** | {data['net_gamma']:,.1f} | QQQ 每涨跌 $1，你的 Delta 会变化 {data['net_gamma']:,.1f}。负数意味着：QQQ 跌的时候你的 Delta 反而变大（保护减弱），涨的时候 Delta 变小（也赚不到更多）。这是卖 Call 的代价 |
| **Theta** | ${daily_theta:,.0f}/天 | 你的 {total_short_calls} 张 Short Call 每天因为时间流逝而贬值 ${daily_theta:,.0f}，这就是你的"收租"收入。QQQ 不涨不跌你也能赚 |
| **Vega** | {data['net_vega']:,.0f} | 市场恐慌（IV 上升）时你会亏钱：IV 每升 1%，组合亏 ${abs(data['net_vega']):,.0f}。因为你是期权卖方，波动率上升 = 你卖出去的东西变贵了 = 亏 |

#### QQQ ±1% P&L 分解

| 分项 | QQQ +1% | QQQ -1% | 说明 |
|------|---------|---------|------|
| 股票 P&L | +${stock_pnl_1pct:,.0f} | -${stock_pnl_1pct:,.0f} | {int(data['qqq_shares'])} 股 × ${qqq_px:.2f} × 1% |
| 期权 Delta P&L | {opt_delta_pnl_1pct:+,.0f} | {-opt_delta_pnl_1pct:+,.0f} | Short Call 的 Delta 对冲（方向相反） |
| Gamma 调整 | {gamma_adj:+,.0f} | {gamma_adj:+,.0f} | Short Gamma 意味着不管涨跌都略吃亏 |
| **净 P&L** | **{net_pnl_up:+,.0f}** | **{net_pnl_down:+,.0f}** | 上涨赚 ${abs(net_pnl_up):,.0f}，下跌亏 ${abs(net_pnl_down):,.0f}（不对称来自 Gamma） |
| **占 NLV** | **{net_pnl_up/data['nlv']*100:+.2f}%** | **{net_pnl_down/data['nlv']*100:+.2f}%** | QQQ 波动 1%，你的 NLV 只波动 ~{nlv_impact_pct:.2f}%——这就是 Sharpe 高的原因 |
""")


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Tab 3: 期权
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

with tab3:
    if opt_rows:
        # Roll signal cards — prominent at top
        st.markdown('<div class="section-title">Roll 信号</div>', unsafe_allow_html=True)
        sig_cols = st.columns(min(len(signal_cards), 3))
        for i, sc in enumerate(signal_cards):
            with sig_cols[i % len(sig_cols)]:
                st.markdown(
                    render_signal_card(
                        sc["exp"], sc["strike"], sc["qty"],
                        sc["action"], sc["target"], sc["reason"], sc["tv_harv"]
                    ),
                    unsafe_allow_html=True,
                )

        st.markdown("")

        # Table A: 持仓概况
        st.markdown('<div class="section-title">持仓概况</div>', unsafe_allow_html=True)
        df_a = pd.DataFrame(table_a_data)
        st.dataframe(df_a, use_container_width=True, hide_index=True)

        # Table B: 收益分析
        st.markdown('<div class="section-title">收益分析</div>', unsafe_allow_html=True)
        df_b = pd.DataFrame(table_b_data)
        st.dataframe(df_b, use_container_width=True, hide_index=True)

        # Roll 计算明细
        with st.expander("Roll 年化计算明细"):
            roll_detail_rows = []
            for r in opt_rows:
                rc = roll_credits.get(r["ticker"])
                if not rc:
                    continue
                strike = r["strike"]
                dp = rc.get("days_period", 1)
                cr = rc["credit"]
                ann = rc["annual"]
                if rc.get("is_roll"):
                    roll_type = "Calendar Roll"
                    detail = (f"Sell {r['exp']} ${strike:.0f}C @${rc['sell_price']:.2f} − "
                              f"Buy @${rc['buy_price']:.2f} = **credit ${cr:.2f}**/share")
                else:
                    roll_type = "Fresh Open"
                    detail = f"Sell {r['exp']} ${strike:.0f}C @${rc['sell_price']:.2f} = **credit ${cr:.2f}**/share"
                formula = f"{cr:.2f} / {strike:.0f} × 365 / {dp} = **{ann:.1f}%**"
                roll_detail_rows.append(f"| {r['exp']} | {strike:.0f} | {abs(int(r['qty']))} | {roll_type} | {rc['open_date']} | {dp}天 | {detail} | {formula} |")

            if roll_detail_rows:
                st.markdown(
                    "| 到期 | Strike | 数量 | 类型 | 开仓日 | 计息天数 | Credit 明细 | Roll年化 = credit/strike × 365/天数 |\n"
                    "|------|--------|------|------|--------|----------|-------------|-----------------------------------|\n"
                    + "\n".join(roll_detail_rows)
                )
                st.caption("**计息天数**：Roll = 旧到期→新到期（延期天数）；Fresh Open = 开仓日→到期日")
            else:
                st.info("无 Roll 数据（activities.json 中未匹配到开仓记录）")

        # 指标说明
        with st.expander("指标说明"):
            st.markdown("""
| 指标 | 含义 | 怎么看 |
|------|------|--------|
| **Roll年化** | 这笔 roll 的面值年化（credit / strike × 365/持有天数） | 不含杠杆的基准收益率 |
| **Roll杠杆年化** | credit 扣 margin 利息，分母用自有资金 | 反映真实回报，与杠杆年化口径一致 |
| **剩余TV年化** | 剩余时间价值年化（面值口径） | 接近 0 → theta 已收割完毕 |
| **杠杆年化** | 剩余TV扣 margin 利息后的年化 | 负数 → 持有成本已超收入，应立即行动 |
| **滑点** | Roll 需付出的 bid-ask spread 成本 | 滑点 > 剩余TV → let assign 更划算 |
| **TV收割** | 已收割的时间价值占比 | ≥80% 触发 roll 信号 |
""")

        # Summary metrics
        total_tv = sum(abs(r["qty"]) * r["time_value"] * 100 for r in opt_rows)
        total_premium = sum(r["avg"] * abs(int(r["qty"])) * 100 for r in opt_rows)
        col_s1, col_s2, col_s3 = st.columns(3)
        col_s1.metric("剩余可收租金", f"${total_tv:,.0f}",
                      delta="所有期权未衰减的时间价值总和", delta_color="off")
        col_s2.metric("已收权利金总额", f"${total_premium:,.0f}",
                      delta="开仓时卖出期权收到的全部权利金", delta_color="off")
        col_s3.metric("年 Margin 利息", f"${margin_annual_cost:,.0f}",
                      delta=f"${margin_daily_cost:,.0f}/天 · ${margin_annual_cost/12:,.0f}/月", delta_color="off")

        st.caption(
            "**剩余可收租金**：如果 QQQ 价格不动，这些钱会在期权到期前全部流入你的 NLV。"
            " | **已收权利金**：你已经到手的钱，其中一部分是时间价值（利润），一部分是内在价值（到期需归还）。"
            " | **年 Margin 利息**：按当前借款额和 4.25% 利率估算，是做杠杆 CC 的主要成本。"
        )


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Tab 4: 绩效
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

with tab4:
    if df_nlv is not None:
        df_perf = df_nlv[df_nlv["date"] >= pd.Timestamp(perf_start)].copy()

        if len(df_perf) < 2:
            st.warning("选定区间内数据不足。")
        else:
            dates_list = df_perf["date"].tolist()
            cc_twr = compute_twr_curve(
                df_perf["nlv"].tolist(), dates_list, cf_map)
            b1_twr = compute_twr_curve(
                df_perf["b1_nlv"].tolist(), dates_list, cf_map)
            b2_twr = compute_twr_curve(
                df_perf["b2_nlv"].tolist(), dates_list, cf_map)

            df_perf["cc_norm"] = cc_twr
            df_perf["b1_norm"] = b1_twr
            df_perf["b2_norm"] = b2_twr

            last_date = df_perf["date"].iloc[-1]
            last_cc = df_perf["cc_norm"].iloc[-1]
            last_b1 = df_perf["b1_norm"].iloc[-1]
            last_b2 = df_perf["b2_norm"].iloc[-1]
            last_lev = df_perf["leverage"].iloc[-1] if "leverage" in df_perf.columns else data["leverage"]
            avg_lev = df_perf["leverage"].mean() if "leverage" in df_perf.columns else last_lev

            pct = scenario_pct / 100
            future_date = last_date + pd.Timedelta(days=int(scenario_days))

            scenario_for_chart = compute_scenarios(
                data["qqq_price"], data["qqq_shares"], data["cash"], opt_rows,
                pcts=[pct], days=scenario_days, margin_debt=data["margin_debt"])
            predicted_nlv = scenario_for_chart[pct]
            cc_future = last_cc * (predicted_nlv / data["nlv"])

            b1_future = last_b1 * (1 + pct)
            margin_cost_b2 = (last_lev - 1) * MARGIN_COST * scenario_days / 365
            b2_future = last_b2 * (1 + last_lev * pct - margin_cost_b2)

            # TWR chart — with area fill for CC
            fig = go.Figure()
            fig.add_trace(go.Scatter(
                x=df_perf["date"], y=df_perf["cc_norm"],
                name="CC 实盘", line=dict(color=CLR_CC, width=2.5),
                fill='tozeroy', fillcolor='rgba(0,113,227,0.06)',
            ))
            fig.add_trace(go.Scatter(
                x=df_perf["date"], y=df_perf["b1_norm"],
                name="QQQ 无杠杆", line=dict(color=CLR_QQQ, width=2),
            ))
            lev_label = f"QQQ {avg_lev:.1f}× 杠杆"
            fig.add_trace(go.Scatter(
                x=df_perf["date"], y=df_perf["b2_norm"],
                name=lev_label, line=dict(color=CLR_LEV, width=2, dash="dot"),
            ))

            if scenario_pct != 0 or scenario_days > 0:
                for start_val, end_val, color, name in [
                    (last_cc, cc_future, CLR_CC, "CC 预测"),
                    (last_b1, b1_future, CLR_QQQ, "QQQ 预测"),
                    (last_b2, b2_future, CLR_LEV, f"{lev_label} 预测"),
                ]:
                    fig.add_trace(go.Scatter(
                        x=[last_date, future_date],
                        y=[start_val, end_val],
                        name=name,
                        line=dict(color=color, width=2, dash="dot"),
                        showlegend=True,
                    ))

                for val, name, color in [
                    (cc_future, "CC", CLR_CC),
                    (b1_future, "QQQ", CLR_QQQ),
                    (b2_future, f"QQQ {avg_lev:.1f}×", CLR_LEV),
                ]:
                    change = val - 100
                    fig.add_annotation(
                        x=future_date, y=val,
                        text=f"{name}: {val:.1f} ({change:+.1f}%)",
                        showarrow=True, arrowhead=2,
                        font=dict(color=color, size=11),
                    )

            fig.update_layout(
                yaxis_title="归一化 (起点=100)",
                height=480,
                margin=dict(t=40, b=40, l=60, r=20),
                legend=dict(orientation="h", y=1.08, font=dict(size=13)),
                hovermode="x unified",
                yaxis=dict(zeroline=False, range=[min(75, min(df_perf["b2_norm"].min(), df_perf["b1_norm"].min()) - 2), None]),
                xaxis=dict(showgrid=False),
            )
            st.plotly_chart(fig, use_container_width=True)

            # Metrics comparison
            cc_m = twr_metrics(cc_twr)
            b1_m = twr_metrics(b1_twr)
            b2_m = twr_metrics(b2_twr)

            metrics_df = pd.DataFrame({
                "策略": ["CC 实盘", "QQQ 无杠杆", f"QQQ {avg_lev:.1f}× 杠杆"],
                "年化收益": [_fmt(cc_m, "Annual", True), _fmt(b1_m, "Annual", True), _fmt(b2_m, "Annual", True)],
                "Sharpe": [_fmt(cc_m, "Sharpe"), _fmt(b1_m, "Sharpe"), _fmt(b2_m, "Sharpe")],
                "Sortino": [_fmt(cc_m, "Sortino"), _fmt(b1_m, "Sortino"), _fmt(b2_m, "Sortino")],
                "最大回撤": [_fmt(cc_m, "Max DD", True), _fmt(b1_m, "Max DD", True), _fmt(b2_m, "Max DD", True)],
            })
            st.dataframe(metrics_df, hide_index=True, use_container_width=True)

            st.markdown("")

            # Return comparison chart
            st.markdown(f'<div class="section-title">收益对比 — {return_period}</div>', unsafe_allow_html=True)

            df_ret = df_perf.set_index("date").copy()

            period_map = {
                "日收益": "D",
                "周收益": "W",
                "月收益": "ME",
                "年收益": "YE",
            }
            freq = period_map[return_period]

            df_ret["cc_twr"] = cc_twr
            df_ret["b1_twr"] = b1_twr

            if return_period == "日收益":
                cc_rets = df_ret["cc_twr"].pct_change().dropna() * 100
                b1_rets = df_ret["b1_twr"].pct_change().dropna() * 100
            else:
                resampled = df_ret[["cc_twr", "b1_twr"]].resample(freq).last()
                cc_rets = resampled["cc_twr"].pct_change().dropna() * 100
                b1_rets = resampled["b1_twr"].pct_change().dropna() * 100

            fig_ret = go.Figure()
            fig_ret.add_trace(go.Bar(
                x=cc_rets.index, y=cc_rets.values,
                name="CC 实盘", marker_color=CLR_CC,
                marker_line_width=0, opacity=0.9,
            ))
            fig_ret.add_trace(go.Bar(
                x=b1_rets.index, y=b1_rets.values,
                name="QQQ", marker_color=CLR_QQQ,
                marker_line_width=0, opacity=0.9,
            ))
            fig_ret.update_layout(
                barmode="group",
                height=320,
                yaxis_title="收益 %",
                margin=dict(t=10, b=30, l=50, r=20),
                legend=dict(orientation="h", y=1.05, font=dict(size=13)),
                hovermode="x unified",
                xaxis=dict(showgrid=False),
                bargap=0.3,
                bargroupgap=0.05,
            )
            st.plotly_chart(fig_ret, use_container_width=True)

    else:
        st.warning("daily_nlv.csv 未找到。运行 `python cc-dashboard/phase2_equity_curve.py` 生成历史数据。")


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Tab 5: 情景
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

with tab5:
    st.markdown(f'<div class="section-title">情景对比（{scenario_days} 天后）</div>', unsafe_allow_html=True)

    cols = st.columns(len(scenario_pcts))
    for i, pct in enumerate(scenario_pcts):
        nlv_at = scenario_results[pct]
        change_pct = (nlv_at - data["nlv"]) / data["nlv"] * 100
        with cols[i]:
            label = f"QQQ {_fmt_pct(pct)}" if pct != 0 else "QQQ 不变"
            st.metric(
                label=label,
                value=f"${nlv_at:,.0f}",
                delta=f"{change_pct:+.1f}%",
            )

    # Explanation table
    rows_md = []
    for pct in scenario_pcts:
        new_px = qqq_px * (1 + pct)
        nlv_at = scenario_results[pct]
        change = (nlv_at - data["nlv"]) / data["nlv"] * 100
        if pct == 0:
            reason = (f"QQQ 价格不变，但 {scenario_days} 天内期权时间价值自然衰减（Theta 收益），"
                      f"同时扣除 Margin 利息 ${margin_cost_total:,.0f}"
                      f"（${data['margin_debt']:,.0f} × {MARGIN_COST*100:.2f}% × {scenario_days}/365）")
        else:
            stock_change = data["qqq_shares"] * (new_px - qqq_px)
            direction = "涨" if pct > 0 else "跌"
            reason = (f"QQQ {direction} {abs(pct)*100:g}%（${qqq_px:.2f} → ${new_px:.2f}），"
                      f"股票市值变动 ${stock_change:+,.0f}，"
                      f"期权用 BS 模型按新价格和剩余 DTE-{scenario_days} 天重新定价，"
                      f"扣除 Margin 利息 ${margin_cost_total:,.0f}")
        rows_md.append(
            f"| {_fmt_pct(pct)} | ${new_px:.2f} | ${nlv_at:,.0f} | {change:+.1f}% | {reason} |"
        )

    st.markdown(f"""
**计算方法**：对每个情景，假设 {scenario_days} 天后 QQQ 到达目标价格，用 Black-Scholes 模型对所有期权重新定价
（DTE 减少 {scenario_days} 天 → 时间价值衰减），加上股票市值变动，减去 {scenario_days} 天的 Margin 利息。

| QQQ 变动 | QQQ 价格 | 预测 NLV | NLV 变动 | 计算说明 |
|----------|----------|----------|----------|----------|
""" + "\n".join(rows_md))


# ── 策略文档 ──────────────────────────────────────────────────────────
st.markdown("---")
_strategy_file = DASH.parent / "strategy-roll.md"
if _strategy_file.exists():
    with st.expander("策略文档 (strategy-roll.md)", expanded=False):
        st.markdown(_strategy_file.read_text())
