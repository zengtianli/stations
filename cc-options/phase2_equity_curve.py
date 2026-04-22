#!/usr/bin/env python3
"""Phase 2: 重建每日 NLV 曲线 + 三路基准对比 + Sharpe/Sortino/Max DD

用法:
  python3 phase2_equity_curve.py              # 全量重建
  python3 phase2_equity_curve.py --incremental # 增量: 从上次状态续跑，append 新行

输出:
  data/daily_nlv.csv
  data/replay_state.json   (增量续跑用的状态快照)
  data/equity_curve.png    (仅全量模式)
  analysis/report.md       (仅全量模式)
"""
import csv
import json
import math
import re
import sys
from collections import defaultdict

from lib_greeks import MARGIN_COST
from datetime import datetime, timedelta
from pathlib import Path

import numpy as np
import requests

DASH = Path(__file__).resolve().parent
DATA = DASH / "data"
ANALYSIS = DASH / "analysis"
ANALYSIS.mkdir(exist_ok=True)

INCREMENTAL = "--incremental" in sys.argv
STATE_FILE = DATA / "replay_state.json"
CSV_FILE = DATA / "daily_nlv.csv"
CSV_FIELDS = [
    "date", "nlv", "cash", "stock_mv", "opt_mtm",
    "qqq_shares", "margin_debt", "leverage", "qqq_close",
    "spy_close", "tqqq_close",
    "b1_nlv", "b2_nlv",
]

# Keep CSV trimmed — everything before this date is pruned on save.
CSV_START_DATE = "2025-01-01"


# ── Helpers ────────────────────────────────────────────────────────

def parse_option(ticker):
    """'QQQ   260417C00585000' → (exp_date, 'C', 585.0)"""
    m = re.match(r"(\w+)\s+(\d{6})([CP])(\d{8})", ticker.strip())
    if not m:
        return None, None, None
    underlying, dt, cp, strike_raw = m.groups()
    exp = f"20{dt[0:2]}-{dt[2:4]}-{dt[4:6]}"
    strike = int(strike_raw) / 1000
    return exp, cp, strike


def fetch_ticker(ticker, range_str="5y"):
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}?range={range_str}&interval=1d"
    r = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}).json()
    result = r["chart"]["result"][0]
    ts = result["timestamp"]
    closes = result["indicators"]["quote"][0]["close"]
    out = {}
    for t, c in zip(ts, closes):
        if c is not None:
            d = datetime.utcfromtimestamp(t).strftime("%Y-%m-%d")
            out[d] = c
    return out


def fetch_qqq(range_str="5y"):
    return fetch_ticker("QQQ", range_str)


def compute_daily_nlv(qqq_px, qqq_shares, qqq_options, cash):
    stock_mv = qqq_shares * qqq_px
    opt_mtm = 0.0
    for ticker, qty in qqq_options.items():
        _, cp, strike = parse_option(ticker)
        if cp == "C":
            intrinsic = max(0, qqq_px - strike)
        elif cp == "P":
            intrinsic = max(0, strike - qqq_px)
        else:
            intrinsic = 0
        opt_mtm += qty * intrinsic * 100
    nlv = cash + stock_mv + opt_mtm
    margin_debt = abs(min(0, cash))
    leverage = (stock_mv + abs(opt_mtm)) / nlv if nlv > 0 else 0
    return nlv, stock_mv, opt_mtm, margin_debt, leverage


def apply_activity(a, cash, qqq_shares, other_shares, qqq_options, contributions, date):
    """Apply one activity to state. Returns updated (cash, qqq_shares)."""
    typ = a["type"]
    amt = float(a.get("amount") or 0)
    fee = float(a.get("fee") or 0)
    units = float(a.get("units") or 0)
    is_option = bool(a.get("option_symbol"))
    opt_ticker = (a.get("option_symbol") or {}).get("ticker") or ""
    sym = (a.get("symbol") or {}).get("symbol") or ""

    if typ in ("CONTRIBUTION", "WITHDRAWAL"):
        cash += amt
        contributions.append((date, amt))
    elif typ in ("FEE", "INTEREST"):
        cash += amt
    elif typ == "DIVIDEND":
        cash += amt
    elif typ == "EXTERNAL_ASSET_TRANSFER_IN":
        if sym == "QQQ":
            qqq_shares += units
        else:
            other_shares[sym] += units
    elif typ in ("BUY", "SELL"):
        cash += amt - fee
        if is_option:
            qqq_options[opt_ticker] += units
            if abs(qqq_options[opt_ticker]) < 0.01:
                del qqq_options[opt_ticker]
        else:
            if sym == "QQQ":
                qqq_shares += units
            else:
                other_shares[sym] += units
    elif typ in ("OPTIONASSIGNMENT", "OPTIONEXPIRATION", "OPTIONEXERCISE"):
        if opt_ticker in qqq_options:
            qqq_options[opt_ticker] += units
            if abs(qqq_options[opt_ticker]) < 0.01:
                del qqq_options[opt_ticker]
    return cash, qqq_shares


def save_state(state):
    """Save replay state to JSON for incremental resume."""
    # Convert defaultdicts to plain dicts for JSON
    s = {
        "last_date": state["last_date"],
        "cash": state["cash"],
        "qqq_shares": state["qqq_shares"],
        "other_shares": dict(state["other_shares"]),
        "qqq_options": dict(state["qqq_options"]),
        "contributions": state["contributions"],
        "b1_shares": state["b1_shares"],
        "b2_val": state["b2_val"],
        "net_deposits_b2": state["net_deposits_b2"],
        "prev_qqq": state["prev_qqq"],
        "saved_at": datetime.now().isoformat(timespec="seconds"),
    }
    STATE_FILE.write_text(json.dumps(s, indent=2, ensure_ascii=False))


def load_state():
    s = json.loads(STATE_FILE.read_text())
    s["other_shares"] = defaultdict(float, s["other_shares"])
    s["qqq_options"] = defaultdict(float, s["qqq_options"])
    # contributions is list of [date, amt]
    s["contributions"] = [(d, a) for d, a in s["contributions"]]
    return s


# ── 1. Load activities ──────────────────────────────────────────────
acts = json.loads((DATA / "activities.json").read_text())["activities"]
acts.sort(key=lambda a: a.get("trade_date") or "")


# ── INCREMENTAL MODE ────────────────────────────────────────────────
if INCREMENTAL and STATE_FILE.exists() and CSV_FILE.exists():
    state = load_state()
    last_date = state["last_date"]

    # Fetch recent QQQ / SPY / TQQQ prices (1mo covers any gap)
    qqq_prices = fetch_ticker("QQQ", "1mo")
    spy_prices = fetch_ticker("SPY", "1mo")
    tqqq_prices = fetch_ticker("TQQQ", "1mo")
    all_new_dates = sorted(d for d in qqq_prices if d > last_date)

    if not all_new_dates:
        print(f"增量: 无新交易日 (最后: {last_date})")
        sys.exit(0)

    # Restore state
    cash = state["cash"]
    qqq_shares = state["qqq_shares"]
    other_shares = state["other_shares"]
    qqq_options = state["qqq_options"]
    contributions = state["contributions"]
    b1_shares = state["b1_shares"]
    b2_val = state["b2_val"]
    net_deposits_b2 = state["net_deposits_b2"]
    prev_qqq = state["prev_qqq"]

    # Group new activities by trading day
    trading_day_set = set(all_new_dates)
    def next_trading_day(d):
        if d in trading_day_set:
            return d
        for td in all_new_dates:
            if td >= d:
                return td
        return all_new_dates[-1]

    # Only activities after last_date
    new_acts = [a for a in acts if (a.get("trade_date") or "")[:10] > last_date]
    by_date = defaultdict(list)
    for a in new_acts:
        d = (a.get("trade_date") or "")[:10]
        if d:
            mapped = next_trading_day(d)
            by_date[mapped].append(a)

    # Read existing CSV to get last b1/b2 for prev_qqq context
    # (prev_qqq already in state)

    new_rows = []
    for date in all_new_dates:
        # Apply activities
        for a in by_date.get(date, []):
            cash, qqq_shares = apply_activity(
                a, cash, qqq_shares, other_shares, qqq_options, contributions, date)

        # Compute NLV
        qqq_px = qqq_prices[date]
        nlv, stock_mv, opt_mtm, margin_debt, leverage = compute_daily_nlv(
            qqq_px, qqq_shares, qqq_options, cash)

        # B1: unleveraged QQQ
        for d, amt in contributions:
            if d == date and amt > 0:
                b1_shares += amt / qqq_px
        b1_val = b1_shares * qqq_px

        # B2: leveraged QQQ
        for d, amt in contributions:
            if d == date:
                b2_val += amt
                net_deposits_b2 += amt
        if prev_qqq and prev_qqq > 0 and b2_val > 0:
            qqq_ret = (qqq_px - prev_qqq) / prev_qqq
            lev = max(1.0, min(leverage, 5.0))
            margin_cost_daily = (b2_val * (lev - 1)) * MARGIN_COST / 252 if lev > 1 else 0
            b2_val *= (1 + lev * qqq_ret)
            b2_val -= margin_cost_daily
        prev_qqq = qqq_px

        new_rows.append({
            "date": date, "nlv": nlv, "cash": cash, "stock_mv": stock_mv,
            "opt_mtm": opt_mtm, "qqq_shares": qqq_shares,
            "margin_debt": margin_debt, "leverage": leverage,
            "qqq_close": qqq_px,
            "spy_close": spy_prices.get(date),
            "tqqq_close": tqqq_prices.get(date),
            "b1_nlv": b1_val, "b2_nlv": b2_val,
        })

    # Append to CSV
    with open(CSV_FILE, "a", newline="") as f:
        w = csv.DictWriter(f, fieldnames=CSV_FIELDS)
        for r in new_rows:
            w.writerow({k: (f"{v:.2f}" if isinstance(v, float) else v) for k, v in r.items()})

    # Update state
    save_state({
        "last_date": all_new_dates[-1],
        "cash": cash,
        "qqq_shares": qqq_shares,
        "other_shares": other_shares,
        "qqq_options": qqq_options,
        "contributions": contributions,
        "b1_shares": b1_shares,
        "b2_val": b2_val,
        "net_deposits_b2": net_deposits_b2,
        "prev_qqq": prev_qqq,
    })

    print(f"增量完成: +{len(new_rows)} 天 ({all_new_dates[0]} → {all_new_dates[-1]})")
    last = new_rows[-1]
    print(f"终态: NLV=${last['nlv']:,.0f}  shares={last['qqq_shares']:.0f}")
    sys.exit(0)


# ── FULL REBUILD MODE (original logic) ──────────────────────────────

# ── 2. Load QQQ / SPY / TQQQ daily prices ───────────────────────────
qqq_prices = fetch_ticker("QQQ", "5y")
spy_prices = fetch_ticker("SPY", "5y")
tqqq_prices = fetch_ticker("TQQQ", "5y")
all_dates = sorted(qqq_prices.keys())
print(f"QQQ 价格: {all_dates[0]} → {all_dates[-1]} ({len(all_dates)} 天)")
print(f"SPY: {len(spy_prices)} 天 · TQQQ: {len(tqqq_prices)} 天")

# ── 3. Replay engine ────────────────────────────────────────────────
trading_day_set = set(all_dates)
def next_trading_day(d):
    if d in trading_day_set:
        return d
    for td in all_dates:
        if td >= d:
            return td
    return all_dates[-1]

by_date = defaultdict(list)
for a in acts:
    d = (a.get("trade_date") or "")[:10]
    if d:
        mapped = next_trading_day(d)
        by_date[mapped].append(a)

# State
cash = 0.0
qqq_shares = 0.0
other_shares = defaultdict(float)
qqq_options = defaultdict(float)
contributions = []

# Daily series
daily = []

for date in all_dates:
    for a in by_date.get(date, []):
        cash, qqq_shares = apply_activity(
            a, cash, qqq_shares, other_shares, qqq_options, contributions, date)

    qqq_px = qqq_prices[date]
    nlv, stock_mv, opt_mtm, margin_debt, leverage = compute_daily_nlv(
        qqq_px, qqq_shares, qqq_options, cash)

    daily.append({
        "date": date, "nlv": nlv, "cash": cash, "stock_mv": stock_mv,
        "opt_mtm": opt_mtm, "qqq_shares": qqq_shares,
        "margin_debt": margin_debt, "leverage": leverage,
        "qqq_close": qqq_px,
        "spy_close": spy_prices.get(date),
        "tqqq_close": tqqq_prices.get(date),
    })

print(f"日线重建完成: {daily[0]['date']} → {daily[-1]['date']} ({len(daily)} 天)")
print(f"终态(replay): NLV=${daily[-1]['nlv']:,.0f}  shares={daily[-1]['qqq_shares']:.0f}  "
      f"open options={len(qqq_options)}")

# ── 3b. 用 portfolio.json 校准终态（activities API 有延迟） ────────
portfolio_file = DATA / "portfolio.json"
if portfolio_file.exists():
    with open(portfolio_file) as f:
        pdata = json.load(f)
    actual_shares = 0.0
    for acct in pdata.get("accounts", []):
        for pos in acct.get("positions", []):
            sym = pos.get("symbol", {})
            inner = sym.get("symbol", sym)  # nested {"symbol": {"symbol": "QQQ"}}
            ticker = inner.get("symbol", "") if isinstance(inner, dict) else ""
            if ticker == "QQQ":
                actual_shares = float(pos.get("units", 0))
    if actual_shares > 0 and actual_shares != qqq_shares:
        delta = actual_shares - qqq_shares
        print(f"校准: replay {qqq_shares:.0f} 股 → portfolio.json {actual_shares:.0f} 股 (Δ{delta:+.0f})")
        qqq_shares = actual_shares
        # Recalculate last day's NLV with corrected shares
        last_px = daily[-1]["qqq_close"]
        nlv, stock_mv, opt_mtm, margin_debt, leverage = compute_daily_nlv(
            last_px, qqq_shares, qqq_options, cash)
        daily[-1].update({
            "qqq_shares": qqq_shares, "nlv": nlv, "stock_mv": stock_mv,
            "opt_mtm": opt_mtm, "margin_debt": margin_debt, "leverage": leverage,
        })
        print(f"终态(校准后): NLV=${nlv:,.0f}  shares={qqq_shares:.0f}")

# ── 4. Benchmarks ───────────────────────────────────────────────────
b1_shares = 0.0
b1_nlv = []
for row in daily:
    for d, amt in contributions:
        if d == row["date"] and amt > 0:
            b1_shares += amt / row["qqq_close"]
    b1_nlv.append(b1_shares * row["qqq_close"])

b2_nlv = []
prev_qqq = None
b2_val = 0.0
net_deposits_b2 = 0.0
for i, row in enumerate(daily):
    for d, amt in contributions:
        if d == row["date"]:
            b2_val += amt
            net_deposits_b2 += amt
    if prev_qqq and prev_qqq > 0 and b2_val > 0:
        qqq_ret = (row["qqq_close"] - prev_qqq) / prev_qqq
        lev = daily[i-1]["leverage"] if i > 0 else 1.0
        lev = max(1.0, min(lev, 5.0))
        margin_cost_daily = (b2_val * (lev - 1)) * MARGIN_COST / 252 if lev > 1 else 0
        b2_val *= (1 + lev * qqq_ret)
        b2_val -= margin_cost_daily
    prev_qqq = row["qqq_close"]
    b2_nlv.append(b2_val)

# ── 5. Save state for incremental ──────────────────────────────────
save_state({
    "last_date": daily[-1]["date"],
    "cash": cash,
    "qqq_shares": qqq_shares,
    "other_shares": other_shares,
    "qqq_options": qqq_options,
    "contributions": contributions,
    "b1_shares": b1_shares,
    "b2_val": b2_val,
    "net_deposits_b2": net_deposits_b2,
    "prev_qqq": prev_qqq,
})
print(f"状态已保存: data/replay_state.json")

# ── 6. Filter to analysis period (2025-01+) ─────────────────────────
START = "2025-01-01"
idx_start = next((i for i, r in enumerate(daily) if r["date"] >= START), 0)

d_period = daily[idx_start:]
b1_period = b1_nlv[idx_start:]
b2_period = b2_nlv[idx_start:]

dates = [r["date"] for r in d_period]
nlvs = [r["nlv"] for r in d_period]
leverages = [r["leverage"] for r in d_period]

cf_by_date = defaultdict(float)
for d, amt in contributions:
    cf_by_date[d] += amt

# ── 7. Compute metrics with TWR ─────────────────────────────────────
def compute_twr_returns(nlv_series, date_list, cf_map):
    rets = []
    for i in range(1, len(nlv_series)):
        prev = nlv_series[i-1]
        curr = nlv_series[i]
        cf = cf_map.get(date_list[i], 0)
        base = prev + cf
        if base > 100:
            r = (curr - base) / base
            rets.append(r)
        else:
            rets.append(0.0)
    return rets

def compute_metrics(nlv_series, date_list, cf_map, label, rf_annual=0.045):
    rets = compute_twr_returns(nlv_series, date_list, cf_map)
    if len(rets) < 20:
        return {"label": label, "error": "insufficient data"}

    mu = np.mean(rets) * 252
    sigma = np.std(rets) * math.sqrt(252)
    sharpe = (mu - rf_annual) / sigma if sigma > 0 else 0
    downside = [r for r in rets if r < 0]
    sortino_denom = np.std(downside) * math.sqrt(252) if downside else 1
    sortino = (mu - rf_annual) / sortino_denom if sortino_denom > 0 else 0

    cum = 1.0
    for r in rets:
        cum *= (1 + r)
    total_twr = cum - 1

    peak = 1.0
    max_dd = 0
    cum_curve = [1.0]
    for r in rets:
        cum_curve.append(cum_curve[-1] * (1 + r))
    for v in cum_curve:
        if v > peak:
            peak = v
        dd = (peak - v) / peak
        if dd > max_dd:
            max_dd = dd

    n_years = len(rets) / 252
    ann_return = (cum ** (1 / n_years) - 1) if n_years > 0 and cum > 0 else 0

    return {
        "label": label,
        "annual_return": ann_return,
        "annual_vol": sigma,
        "sharpe": sharpe,
        "sortino": sortino,
        "max_drawdown": max_dd,
        "total_twr": total_twr,
    }

m_cc = compute_metrics(nlvs, dates, cf_by_date, "CC 实盘")
m_b1 = compute_metrics(b1_period, dates, cf_by_date, "QQQ 无杠杆")
m_b2 = compute_metrics(b2_period, dates, cf_by_date, "QQQ 同杠杆")

for m in [m_cc, m_b1, m_b2]:
    if "error" in m:
        print(f"  {m['label']}: {m['error']}")
    else:
        print(f"  {m['label']}: 年化={m['annual_return']*100:+.1f}%  "
              f"波动={m['annual_vol']*100:.1f}%  Sharpe={m['sharpe']:.2f}  "
              f"Sortino={m['sortino']:.2f}  MaxDD={m['max_drawdown']*100:.1f}%")

# ── 8. Monthly TWR returns ──────────────────────────────────────────
def monthly_twr(nlv_series, date_list, cf_map):
    rets = compute_twr_returns(nlv_series, date_list, cf_map)
    from collections import OrderedDict
    monthly = OrderedDict()
    for i, r in enumerate(rets):
        ym = date_list[i+1][:7]
        if ym not in monthly:
            monthly[ym] = []
        monthly[ym].append(r)
    rows = []
    for ym, daily_rets in monthly.items():
        cum = 1.0
        for r in daily_rets:
            cum *= (1 + r)
        last_idx = max(i for i, d in enumerate(date_list) if d[:7] == ym)
        rows.append((ym, cum - 1, nlv_series[last_idx]))
    return rows

mr_cc = monthly_twr(nlvs, dates, cf_by_date)
mr_b1 = monthly_twr(b1_period, dates, cf_by_date)
mr_b2 = monthly_twr(b2_period, dates, cf_by_date)

# ── 9. Save daily CSV (trimmed to >= CSV_START_DATE) ────────────────
with open(CSV_FILE, "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=CSV_FIELDS)
    w.writeheader()
    for i, r in enumerate(daily):
        if r["date"] < CSV_START_DATE:
            continue
        row = dict(r)
        row["b1_nlv"] = b1_nlv[i]
        row["b2_nlv"] = b2_nlv[i]
        w.writerow({
            k: (f"{v:.2f}" if isinstance(v, float) else ("" if v is None else v))
            for k, v in row.items()
        })

# ── 10. Chart ────────────────────────────────────────────────────────
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.dates as mdates

fig, axes = plt.subplots(3, 1, figsize=(14, 12), gridspec_kw={"height_ratios": [3, 1, 1]})
fig.suptitle("QQQ Covered Call Strategy Analysis (2025-01 →)", fontsize=14, fontweight="bold")

ax = axes[0]
dt_dates = [datetime.strptime(d, "%Y-%m-%d") for d in dates]
ax.plot(dt_dates, [v/1000 for v in nlvs], label="CC Portfolio", linewidth=2, color="#2196F3")
ax.plot(dt_dates, [v/1000 for v in b1_period], label="QQQ (no leverage)", linewidth=1.5,
        color="#4CAF50", linestyle="--")
ax.plot(dt_dates, [v/1000 for v in b2_period], label="QQQ (matched leverage)", linewidth=1.5,
        color="#FF9800", linestyle="--")
ax.set_ylabel("NLV ($K)")
ax.legend(loc="upper left")
ax.grid(True, alpha=0.3)
ax.xaxis.set_major_formatter(mdates.DateFormatter("%b\n%Y"))

ax2 = axes[1]
ax2.fill_between(dt_dates, leverages, alpha=0.4, color="#9C27B0")
ax2.set_ylabel("Leverage")
ax2.set_ylim(0, 5)
ax2.grid(True, alpha=0.3)
ax2.xaxis.set_major_formatter(mdates.DateFormatter("%b"))

ax3 = axes[2]
if mr_cc:
    months_dt = [datetime.strptime(m + "-15", "%Y-%m-%d") for m, _, _ in mr_cc]
    width = timedelta(days=8)
    ax3.bar([d - width for d in months_dt], [r*100 for _, r, _ in mr_cc],
            width=width, label="CC", color="#2196F3", alpha=0.8)
    if mr_b1:
        ax3.bar(months_dt, [r*100 for _, r, _ in mr_b1],
                width=width, label="QQQ", color="#4CAF50", alpha=0.8)
    if mr_b2:
        ax3.bar([d + width for d in months_dt], [r*100 for _, r, _ in mr_b2],
                width=width, label="QQQ Lev", color="#FF9800", alpha=0.8)
    ax3.set_ylabel("Monthly Return %")
    ax3.legend(loc="upper left", fontsize=8)
    ax3.grid(True, alpha=0.3)
    ax3.axhline(0, color="black", linewidth=0.5)
    ax3.xaxis.set_major_formatter(mdates.DateFormatter("%b"))

plt.tight_layout()
plt.savefig(DATA / "equity_curve.png", dpi=150, bbox_inches="tight")
print(f"\n图表已保存: data/equity_curve.png")

# ── 11. Report ───────────────────────────────────────────────────────
def fmt_pct(v):
    return f"{v*100:+.2f}%" if v else "N/A"

report = f"""# Phase 2 分析报告

_生成时间: {datetime.now().strftime("%Y-%m-%d %H:%M")}_
_分析区间: {dates[0]} → {dates[-1]} ({len(dates)} 个交易日)_

## 核心指标对比

| 指标 | CC 实盘 | QQQ 无杠杆 | QQQ 同杠杆 |
|---|---|---|---|
"""

for key, label in [
    ("annual_return", "年化收益"),
    ("annual_vol", "年化波动"),
    ("sharpe", "Sharpe"),
    ("sortino", "Sortino"),
    ("max_drawdown", "最大回撤"),
    ("total_twr", "区间 TWR"),
]:
    vals = []
    for m in [m_cc, m_b1, m_b2]:
        if "error" in m:
            vals.append("N/A")
        elif key in ("sharpe", "sortino"):
            vals.append(f"{m[key]:.2f}")
        else:
            vals.append(fmt_pct(m[key]))
    report += f"| {label} | {vals[0]} | {vals[1]} | {vals[2]} |\n"

report += f"""
## 当前持仓快照

- QQQ 持仓: {daily[-1]['qqq_shares']:.0f} 股 × ${daily[-1]['qqq_close']:.2f} = ${daily[-1]['stock_mv']:,.0f}
- 期权负债 (intrinsic): ${daily[-1]['opt_mtm']:,.0f}
- 现金/Margin: ${daily[-1]['cash']:,.0f}
- **NLV: ${daily[-1]['nlv']:,.0f}**
- 杠杆: {daily[-1]['leverage']:.1f}×

## 月度收益表

| 月份 | CC 实盘 | QQQ 无杠杆 | QQQ 同杠杆 | CC NLV |
|---|---|---|---|---|
"""

for i in range(len(mr_cc)):
    m_str = mr_cc[i][0]
    cc_r = fmt_pct(mr_cc[i][1])
    b1_r = fmt_pct(mr_b1[i][1]) if i < len(mr_b1) else "N/A"
    b2_r = fmt_pct(mr_b2[i][1]) if i < len(mr_b2) else "N/A"
    cc_v = f"${mr_cc[i][2]:,.0f}"
    report += f"| {m_str} | {cc_r} | {b1_r} | {b2_r} | {cc_v} |\n"

report += f"""
## 杠杆使用

- 平均杠杆: {np.mean([r['leverage'] for r in d_period]):.1f}×
- 最高杠杆: {max(r['leverage'] for r in d_period):.1f}×
- 当前杠杆: {d_period[-1]['leverage']:.1f}×

## Margin 利息

- 累计: ${sum(float(a.get('amount',0)) for a in acts if a['type']=='FEE'):,.2f}

## 方法论说明

1. **期权 MTM**: 使用内在价值 (intrinsic only)，深 ITM 误差 <1%，ATM 会低估负债约 1-3%
2. **Sharpe 无风险利率**: 4.5% (Fed funds 区间中值)
3. **杠杆 QQQ 基准**: 逐日复制用户实际杠杆倍数，margin 成本 5.5%/年
4. **非 QQQ 仓位**: 2021-2024 有 TQQQ/SPY/WFC 等，仅计入现金流，不做每日 MTM
5. **数据源**: SnapTrade activities + Yahoo Finance QQQ daily close

![Equity Curve](../data/equity_curve.png)
"""

(ANALYSIS / "report.md").write_text(report)
print(f"报告已保存: analysis/report.md")
