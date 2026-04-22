"""Black-Scholes, Greeks, IV, option parsing, scenario analysis, roll signals.
Shared between dashboard.py and app.py.
"""
import math
import re
from datetime import date

from scipy.stats import norm
from scipy.optimize import brentq

R = 0.045  # risk-free rate
MARGIN_COST = 0.0425  # annual margin rate (Robinhood Gold)
HIBOR_RATE = 0.023  # flat HIBOR (HSBC HK, no spread)

# Robinhood margin tiers (flat rate by total borrowed amount)
RH_MARGIN_TIERS = [
    (50_000_000, 0.0395),
    (10_000_000, 0.0420),
    (1_000_000,  0.0425),
    (100_000,    0.0450),
    (50_000,     0.0480),
    (0,          0.0500),
]


def rh_margin_rate(balance):
    """Robinhood margin rate for a given borrowed balance (flat rate by tier)."""
    for threshold, rate in RH_MARGIN_TIERS:
        if balance >= threshold:
            return rate
    return 0.0500


def compute_margin_savings(margin_debt, hsbc_max, hibor=HIBOR_RATE,
                           qqq_price=0, theta_per_share=0):
    """Compute cost savings from replacing RH margin with HSBC HIBOR lending.

    Returns list of scenario dicts for different HSBC borrowing amounts.
    """
    steps = sorted(set(filter(lambda x: 0 <= x <= hsbc_max, [
        0, 250_000, 500_000, 750_000, 1_000_000, 1_250_000, 1_500_000,
        margin_debt,                       # full replacement
        margin_debt + 250_000,             # expansion
        margin_debt + 500_000,
        hsbc_max,
    ])))

    baseline_rate = rh_margin_rate(margin_debt)
    baseline_cost = margin_debt * baseline_rate

    rows = []
    for hsbc in steps:
        rh_left = max(0, margin_debt - hsbc)
        rh_rate = rh_margin_rate(rh_left) if rh_left > 0 else 0
        rh_cost = rh_left * rh_rate
        hsbc_cost = hsbc * hibor
        total = rh_cost + hsbc_cost
        extra = max(0, hsbc - margin_debt)
        extra_shares = extra / qqq_price if qqq_price > 0 else 0
        extra_theta = extra_shares * theta_per_share * 365
        rows.append({
            "hsbc": hsbc, "hsbc_cost": hsbc_cost,
            "rh_left": rh_left, "rh_rate": rh_rate, "rh_cost": rh_cost,
            "total": total, "savings": baseline_cost - total,
            "blended": total / (margin_debt + extra) if (margin_debt + extra) > 0 else 0,
            "extra": extra, "extra_shares": extra_shares,
            "extra_theta": extra_theta,
            "extra_net": extra_theta - extra * hibor,
        })
    return rows


# ── Black-Scholes ────────────────────────────────────────────────────

def bs_call_price(S, K, T, r, sigma):
    if T <= 0 or sigma <= 0:
        return max(0, S - K)
    d1 = (math.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * math.sqrt(T))
    d2 = d1 - sigma * math.sqrt(T)
    return S * norm.cdf(d1) - K * math.exp(-r * T) * norm.cdf(d2)


def bs_put_price(S, K, T, r, sigma):
    if T <= 0 or sigma <= 0:
        return max(0, K - S)
    d1 = (math.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * math.sqrt(T))
    d2 = d1 - sigma * math.sqrt(T)
    return K * math.exp(-r * T) * norm.cdf(-d2) - S * norm.cdf(-d1)


def implied_vol(price, S, K, T, r, cp="C"):
    if T <= 0:
        return 0.0
    intrinsic = max(0, S - K) if cp == "C" else max(0, K - S)
    if price <= intrinsic + 0.01:
        return 0.01
    fn = bs_call_price if cp == "C" else bs_put_price
    try:
        return brentq(lambda sig: fn(S, K, T, r, sig) - price, 0.01, 5.0, xtol=1e-6)
    except (ValueError, RuntimeError):
        return 0.25


def greeks(S, K, T, r, sigma, cp="C"):
    if T <= 0 or sigma <= 0:
        delta = 1.0 if (cp == "C" and S > K) else (-1.0 if cp == "P" and K > S else 0.0)
        return {"delta": delta, "gamma": 0, "theta": 0, "vega": 0}
    d1 = (math.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * math.sqrt(T))
    d2 = d1 - sigma * math.sqrt(T)
    gamma = norm.pdf(d1) / (S * sigma * math.sqrt(T))
    vega = S * norm.pdf(d1) * math.sqrt(T) / 100
    if cp == "C":
        delta = norm.cdf(d1)
        theta = (-(S * norm.pdf(d1) * sigma) / (2 * math.sqrt(T))
                 - r * K * math.exp(-r * T) * norm.cdf(d2)) / 365
    else:
        delta = norm.cdf(d1) - 1
        theta = (-(S * norm.pdf(d1) * sigma) / (2 * math.sqrt(T))
                 + r * K * math.exp(-r * T) * norm.cdf(-d2)) / 365
    return {"delta": delta, "gamma": gamma, "theta": theta, "vega": vega}


# ── Option ticker parsing ────────────────────────────────────────────

def parse_ticker(ticker):
    """'QQQ   260417C00585000' → {exp: date, cp: 'C', strike: 585.0}"""
    m = re.match(r"(\w+)\s+(\d{6})([CP])(\d{8})", ticker.strip())
    if not m:
        return None
    _, dt, cp, strike_raw = m.groups()
    exp = date(2000 + int(dt[0:2]), int(dt[2:4]), int(dt[4:6]))
    strike = int(strike_raw) / 1000
    return {"exp": exp, "cp": cp, "strike": strike}


# ── Portfolio processing ─────────────────────────────────────────────

def process_portfolio(port):
    """Parse portfolio.json → structured data for display."""
    today = date.today()
    acc = port["accounts"][0]
    bal = acc["balances"][0]
    cash = float(bal.get("cash") or 0)

    positions = acc.get("positions") or []
    options = acc.get("option_positions") or []

    qqq_price = None
    qqq_shares = 0
    for p in positions:
        sym = (p.get("symbol") or {}).get("symbol") or {}
        s = sym.get("symbol") if isinstance(sym, dict) else sym
        if s == "QQQ":
            qqq_price = float(p.get("price") or 0)
            qqq_shares = float(p.get("units") or 0)

    if not qqq_price:
        return None

    stock_mv = qqq_shares * qqq_price

    opt_rows = []
    for o in options:
        sym_info = (o.get("symbol") or {}).get("option_symbol") or {}
        ticker = sym_info.get("ticker") if isinstance(sym_info, dict) else sym_info
        if not ticker:
            continue
        parsed = parse_ticker(ticker)
        if not parsed:
            continue
        qty = float(o.get("units") or 0)
        price_per_share = float(o.get("price") or 0)
        avg_price = float(o.get("average_purchase_price") or 0) / 100

        dte = (parsed["exp"] - today).days
        T = max(dte / 365, 0.001)

        iv = implied_vol(price_per_share, qqq_price, parsed["strike"], T, R, parsed["cp"])
        g = greeks(qqq_price, parsed["strike"], T, R, iv, parsed["cp"])

        intrinsic = (max(0, qqq_price - parsed["strike"]) if parsed["cp"] == "C"
                     else max(0, parsed["strike"] - qqq_price))
        time_value = max(0, price_per_share - intrinsic)
        # 成本用 strike（ATM 建仓策略，strike ≈ 建仓时股价）
        tv_annual = (time_value / parsed["strike"]) * (365 / max(dte, 1)) * 100

        opt_rows.append({
            "ticker": ticker.strip(),
            "strike": parsed["strike"],
            "exp": parsed["exp"].isoformat(),
            "exp_date": parsed["exp"],
            "dte": dte,
            "cp": parsed["cp"],
            "qty": qty,
            "price": price_per_share,
            "avg": avg_price,
            "bid": float(o.get("bid") or 0),
            "ask": float(o.get("ask") or 0),
            "spread": float(o.get("spread") or 0),
            "iv": iv,
            "delta": g["delta"],
            "gamma": g["gamma"],
            "theta": g["theta"],
            "vega": g["vega"],
            "intrinsic": intrinsic,
            "time_value": time_value,
            "tv_annual_pct": tv_annual,
        })

    opt_rows.sort(key=lambda x: (x["exp"], x["strike"]))

    stock_delta = qqq_shares
    opt_delta_total = sum(r["qty"] * r["delta"] * 100 for r in opt_rows)
    net_delta = stock_delta + opt_delta_total
    net_theta = sum(r["qty"] * r["theta"] * 100 for r in opt_rows)
    net_gamma = sum(r["qty"] * r["gamma"] * 100 for r in opt_rows)
    net_vega = sum(r["qty"] * r["vega"] * 100 for r in opt_rows)
    total_tv = sum(abs(r["qty"]) * r["time_value"] * 100 for r in opt_rows)
    opt_liability = sum(r["qty"] * r["price"] * 100 for r in opt_rows)
    nlv = cash + stock_mv + opt_liability
    margin_debt = abs(min(0, cash))
    leverage = stock_mv / nlv if nlv > 0 else 0

    return {
        "ts": port.get("ts", ""),
        "qqq_price": qqq_price,
        "qqq_shares": qqq_shares,
        "cash": cash,
        "stock_mv": stock_mv,
        "opt_liability": opt_liability,
        "nlv": nlv,
        "margin_debt": margin_debt,
        "leverage": leverage,
        "stock_delta": stock_delta,
        "opt_delta_total": opt_delta_total,
        "net_delta": net_delta,
        "net_theta": net_theta,
        "net_gamma": net_gamma,
        "net_vega": net_vega,
        "total_tv": total_tv,
        "opt_rows": opt_rows,
    }


# ── Scenario analysis ────────────────────────────────────────────────

def compute_scenarios(qqq_price, qqq_shares, cash, opt_rows,
                      pcts=(-0.05, -0.03, -0.01, 0, 0.01, 0.03, 0.05),
                      days=0, margin_debt=0):
    """Compute NLV under different QQQ price scenarios.

    Args:
        days: number of days into the future (0 = instant snapshot).
              Reduces option DTE → time value decays (Theta income).
        margin_debt: current margin loan balance, used to deduct interest.
    """
    margin_cost = margin_debt * MARGIN_COST * days / 365
    results = {}
    for pct in pcts:
        new_px = qqq_price * (1 + pct)
        new_stock = qqq_shares * new_px
        new_opt = 0
        for r in opt_rows:
            T = max((r["dte"] - days) / 365, 0.001)
            fn = bs_call_price if r["cp"] == "C" else bs_put_price
            new_opt += r["qty"] * fn(new_px, r["strike"], T, R, r["iv"]) * 100
        results[pct] = cash + new_stock + new_opt - margin_cost
    return results


# ── Roll credit matching ─────────────────────────────────────────────

def compute_roll_credits(opt_rows, activities_path):
    """Match current positions with opening trades from activities.json.
    Returns {ticker: {"credit": per_share, "annual": pct, "open_date": str}}.
    """
    import json as _json
    try:
        acts = _json.loads(activities_path.read_text()).get("activities", [])
    except Exception:
        return {}

    # Build lookup: option trades with option_symbol
    opt_trades = [a for a in acts if a.get("option_symbol")]

    result = {}
    for r in opt_rows:
        ticker = r["ticker"]
        # Find SELL trades for this exact ticker (opening the current position)
        sells = [t for t in opt_trades
                 if t["type"] == "SELL"
                 and t.get("option_symbol", {}).get("ticker", "").strip() == ticker]
        if not sells:
            continue
        # Most recent SELL = the opening trade
        sells.sort(key=lambda t: t.get("trade_date", ""))
        open_trade = sells[-1]
        sell_price = float(open_trade.get("price") or 0)
        open_date = (open_trade.get("trade_date") or "")[:10]
        strike = r["strike"]

        # Find matching BUY on same day with same strike but different expiry (roll pair)
        buys = [t for t in opt_trades
                if t["type"] == "BUY"
                and (t.get("trade_date") or "")[:10] == open_date
                and abs(float(t.get("option_symbol", {}).get("strike_price") or 0) - strike) < 1
                and t.get("option_symbol", {}).get("ticker", "").strip() != ticker]

        from datetime import datetime as _dt
        if buys:
            # Rolled: credit = sell - buy
            buy_price = float(buys[0].get("price") or 0)
            credit = sell_price - buy_price
            # Roll 的 days = 旧到期 → 新到期（延期天数），不是开仓到到期
            old_ticker = buys[0].get("option_symbol", {}).get("ticker", "").strip()
            # 从 old ticker 解析到期日（格式 QQQ   YYMMDDCSSSSSSSS）
            try:
                old_exp_str = old_ticker.split()[1][:6]  # YYMMDD
                old_exp = _dt.strptime("20" + old_exp_str, "%Y%m%d").date()
                days_period = (r["exp_date"] - old_exp).days
            except Exception:
                # fallback: 开仓到新到期
                try:
                    days_period = (r["exp_date"] - _dt.strptime(open_date, "%Y-%m-%d").date()).days
                except Exception:
                    days_period = max(r["dte"], 1)
        else:
            # Fresh open: credit = full premium
            credit = sell_price
            buy_price = None
            # Fresh open 的 days = 开仓到到期
            try:
                days_period = (r["exp_date"] - _dt.strptime(open_date, "%Y-%m-%d").date()).days
            except Exception:
                days_period = max(r["dte"], 1)

        days_period = max(days_period, 1)
        annual = (credit / strike) * (365 / days_period) * 100

        result[ticker] = {
            "credit": credit,
            "annual": annual,
            "days_period": days_period,
            "open_date": open_date,
            "buy_price": buy_price,
            "sell_price": sell_price,
            "is_roll": bool(buys),
        }
    return result


# ── Roll signals ─────────────────────────────────────────────────────

def compute_roll_signals(opt_rows, net_delta=0, qqq_shares=0, qqq_price=0, nlv=0):
    """Generate roll signals based on strategy-roll.md rules.

    Decision tree (delta-first):
      Deep ITM (delta > 0.85):
        滑点 > 剩余TV  → LET ASSIGN + 重开ATM
        DTE ≤ 7        → LET ASSIGN + 重开ATM
        otherwise      → HOLD（TV还在衰减）

      ATM/slight ITM (delta 0.40-0.85):
        TV收割 ≥ 80%   → CALENDAR ROLL
        净TV年化 < 5%  → CALENDAR ROLL
        DTE ≤ 5        → CALENDAR ROLL（gamma风险）
        TV收割 > 50%   → WATCH
        otherwise      → HOLD

      OTM (delta < 0.40):
        DTE ≤ 3        → LET EXPIRE
        otherwise      → HOLD（不追跌，不roll down）

    IV 择时修正:
        IV > 35% → 积极 roll（premium 膨胀）
        IV < 20% → 推迟 roll（premium 太便宜）
    """
    signals = []

    short_rows = [r for r in opt_rows if r["qty"] < 0]
    if not short_rows:
        return signals

    leverage = qqq_shares * qqq_price / nlv if nlv > 0 else 2.9

    # ── 1. Compute metrics ──
    for r in short_rows:
        # TV 收割率
        initial_tv = r["avg"]
        tv_harvested_pct = (1 - r["time_value"] / initial_tv) * 100 if initial_tv > 0.01 else 100
        r["tv_harvested_pct"] = max(0, min(tv_harvested_pct, 100))

        # Theta 效率
        daily_theta_abs = abs(r["theta"])
        r["theta_efficiency"] = (daily_theta_abs / r["time_value"] * 100) if r["time_value"] > 0.01 else 0

        # 净 TV 年化（扣融资成本）
        dte_safe = max(r["dte"], 1)
        strike_backing = abs(r["qty"]) * r["strike"] * 100
        equity_needed = strike_backing / leverage if leverage > 0 else strike_backing
        margin_portion = strike_backing - equity_needed
        margin_cost_for_dte = margin_portion * MARGIN_COST * dte_safe / 365
        tv_remaining = abs(r["qty"]) * r["time_value"] * 100
        r["net_tv_annual"] = ((tv_remaining - margin_cost_for_dte) / equity_needed) * (365 / dte_safe) * 100 if equity_needed > 0 else 0

        # 滑点（双边 bid-ask spread 成本）
        r["slippage_total"] = r["spread"] * abs(r["qty"]) * 100

    # ── 2. Rank ──
    sorted_by_yield = sorted(short_rows, key=lambda x: x["tv_annual_pct"])
    worst_ticker = sorted_by_yield[0]["ticker"] if sorted_by_yield else None
    best_ticker = sorted_by_yield[-1]["ticker"] if sorted_by_yield else None

    # ── 3. Signals (delta-first decision tree) ──
    for r in short_rows:
        reasons = []
        action = None
        delta = abs(r["delta"])
        iv_pct = r["iv"] * 100
        tv_rem = r["time_value"]
        slippage = r["slippage_total"]
        tv_rem_total = abs(r["qty"]) * tv_rem * 100

        if delta > 0.85:
            # ── Deep ITM path ──
            # 只有两种情况 assign：DTE≤7 或 滑点>剩余TV
            # DTE>30 一律 HOLD（TV还在衰减，这些仓位是对冲层）
            if r["dte"] <= 7:
                action = "LET ASSIGN → 卖ATM"
                reasons.append(f"Deep ITM(Δ{delta:.2f})+DTE={r['dte']}≤7，gamma风险高，assign后重开ATM")
            elif slippage > tv_rem_total and tv_rem_total > 0 and r["dte"] <= 14:
                action = "LET ASSIGN → 卖ATM"
                reasons.append(f"Deep ITM(Δ{delta:.2f})，滑点${slippage:,.0f}>剩余TV${tv_rem_total:,.0f}，assign后重开ATM更便宜")
            else:
                action = "HOLD"
                reasons.append(f"Deep ITM(Δ{delta:.2f})，对冲层，TV还在衰减(收{r['tv_harvested_pct']:.0f}%)，DTE {r['dte']}天")

        elif delta >= 0.40:
            # ── ATM / slight ITM path ──
            if r["dte"] <= 5:
                action = "CALENDAR ROLL"
                reasons.append(f"ATM区(Δ{delta:.2f})+DTE={r['dte']}≤5，gamma风险，calendar roll延期")
            elif r["tv_harvested_pct"] >= 80:
                action = "CALENDAR ROLL"
                reasons.append(f"ATM区(Δ{delta:.2f})，TV已收{r['tv_harvested_pct']:.0f}%，同strike延期")
            elif r["net_tv_annual"] < 5:
                action = "CALENDAR ROLL"
                reasons.append(f"ATM区(Δ{delta:.2f})，净TV年化{r['net_tv_annual']:.1f}%<5%，扣融资后收租不划算")
            elif r["tv_harvested_pct"] > 50:
                action = "WATCH"
                reasons.append(f"ATM区(Δ{delta:.2f})，TV已收{r['tv_harvested_pct']:.0f}%，可考虑提前roll锁利")
            else:
                action = "HOLD"
                reasons.append(f"ATM区(Δ{delta:.2f})，TV收{r['tv_harvested_pct']:.0f}%，DTE {r['dte']}天，节奏正常")

        else:
            # ── OTM path (delta < 0.40) ──
            if r["dte"] <= 3:
                action = "LET EXPIRE"
                reasons.append(f"OTM(Δ{delta:.2f})+DTE={r['dte']}，等到期归零")
            else:
                action = "HOLD"
                reasons.append(f"OTM(Δ{delta:.2f})，不追跌不roll down，等QQQ回升")

        # ── IV 择时修正 ──
        if iv_pct > 35 and "ROLL" in action:
            reasons.append(f"IV高({iv_pct:.0f}%)，积极roll，premium膨胀")
        elif iv_pct < 20 and "ROLL" in action:
            reasons.append(f"IV低({iv_pct:.0f}%<20%)，可推迟roll，等IV回升")

        rank_tag = ""
        if r["ticker"] == best_ticker and len(short_rows) > 1:
            rank_tag = "🏆 "
        elif r["ticker"] == worst_ticker and len(short_rows) > 1:
            rank_tag = "⚠️ "

        signals.append({
            "action": rank_tag + action,
            "reasons": reasons,
            **r,
        })
    return signals
