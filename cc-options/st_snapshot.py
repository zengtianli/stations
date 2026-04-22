#!/usr/bin/env python3
"""SnapTrade 持仓快照：输出 portfolio.json + portfolio.md
期权价格用 Yahoo Finance bid/ask mid price 覆盖（SnapTrade 只返回 last trade price，
流动性差的合约偏差大；Robinhood 显示的也是 mid price）。
"""
import json
import os
import time
import urllib.request
import http.cookiejar
from datetime import datetime, timezone
from pathlib import Path
from snaptrade_client import SnapTrade

DASH = Path(__file__).resolve().parent
DATA = DASH / "data"
snap = SnapTrade(
    client_id=os.environ["SNAPTRADE_CLIENT_ID"],
    consumer_key=os.environ["SNAPTRADE_CONSUMER_KEY"],
)
UID = os.environ["SNAPTRADE_USER_ID"]
SECRET = os.environ["SNAPTRADE_USER_SECRET"]

accounts = snap.account_information.list_user_accounts(
    user_id=UID, user_secret=SECRET).body

out = {"ts": datetime.now().isoformat(timespec="seconds"), "accounts": []}
md = [f"# Portfolio Snapshot\n\n_{out['ts']}_\n"]

for acc in accounts:
    aid = acc["id"]
    holdings = snap.account_information.get_user_holdings(
        account_id=aid, user_id=UID, user_secret=SECRET).body

    bal = holdings.get("balances") or []
    pos = holdings.get("positions") or []
    opt = holdings.get("option_positions") or []
    orders = holdings.get("orders") or []
    total = holdings.get("total_value") or {}

    out["accounts"].append({
        "name": acc.get("name"),
        "number": acc.get("number"),
        "institution": acc.get("institution_name"),
        "total_value": total,
        "balances": bal,
        "positions": pos,
        "option_positions": opt,
    })

    md.append(f"## {acc.get('institution_name')} — {acc.get('name')} ({acc.get('number')})\n")
    if total:
        md.append(f"- Total: {total.get('amount')} {total.get('currency')}")
    for b in bal:
        cur = (b.get("currency") or {}).get("code", "")
        md.append(f"- Cash: {b.get('cash')} {cur} | Buying Power: {b.get('buying_power')}")
    md.append("")

    if pos:
        md.append("### Stocks\n")
        md.append("| Symbol | Qty | Avg | Price | Equity | PnL |")
        md.append("|---|---|---|---|---|---|")
        for p in pos:
            sym = (p.get("symbol") or {}).get("symbol") or {}
            s = sym.get("symbol") if isinstance(sym, dict) else sym
            qty = p.get("units")
            avg = p.get("average_purchase_price")
            price = p.get("price")
            eq = (qty or 0) * (price or 0) if qty and price else ""
            pnl = p.get("open_pnl")
            md.append(f"| {s} | {qty} | {avg} | {price} | {eq} | {pnl} |")
        md.append("")

    if opt:
        md.append("### Options\n")
        md.append("| Symbol | Qty | Avg | Price | Currency |")
        md.append("|---|---|---|---|---|")
        for o in opt:
            sym = (o.get("symbol") or {}).get("option_symbol") or {}
            s = sym.get("ticker") if isinstance(sym, dict) else sym
            md.append(f"| {s} | {o.get('units')} | {o.get('average_purchase_price')} "
                      f"| {o.get('price')} | {(o.get('currency') or {}).get('code','')} |")
        md.append("")

# ── Yahoo Finance mid-price enrichment ────────────────────────────
def _yahoo_option_prices(option_positions):
    """Fetch bid/ask from Yahoo Finance, return {(exp_date, strike, cp): {mid, bid, ask, spread}}."""
    # Group target strikes by expiration
    targets = {}
    for o in option_positions:
        sym = (o.get("symbol") or {}).get("option_symbol") or {}
        exp = sym.get("expiration_date", "")
        strike = sym.get("strike_price")
        if exp and strike:
            targets.setdefault(exp, set()).add(strike)
    if not targets:
        return {}

    # Session with cookies + crumb
    cj = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
    ua = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
    opener.addheaders = [("User-Agent", ua)]
    try:
        opener.open("https://fc.yahoo.com/", timeout=5)
    except Exception:
        pass
    crumb = opener.open(
        "https://query2.finance.yahoo.com/v1/test/getcrumb", timeout=10
    ).read().decode()

    # Get expiration epoch map
    base = json.loads(opener.open(
        f"https://query2.finance.yahoo.com/v7/finance/options/QQQ?crumb={crumb}", timeout=10
    ).read())
    exp_epochs = {}
    for e in base["optionChain"]["result"][0].get("expirationDates", []):
        d = datetime.fromtimestamp(e, tz=timezone.utc).strftime("%Y-%m-%d")
        exp_epochs[d] = e

    # Fetch each expiration chain
    result = {}
    for exp_date, strikes in targets.items():
        epoch = exp_epochs.get(exp_date)
        if not epoch:
            continue
        time.sleep(0.3)
        url = f"https://query2.finance.yahoo.com/v7/finance/options/QQQ?date={epoch}&crumb={crumb}"
        data = json.loads(opener.open(url, timeout=10).read())
        chain = data["optionChain"]["result"][0].get("options", [{}])[0]
        for c in chain.get("calls", []):
            if c["strike"] in strikes:
                bid = c.get("bid", 0) or 0
                ask = c.get("ask", 0) or 0
                if bid > 0 and ask > 0:
                    result[(exp_date, c["strike"], "C")] = {
                        "mid": round((bid + ask) / 2, 2),
                        "bid": bid, "ask": ask,
                        "spread": round(ask - bid, 2),
                    }
        for p in chain.get("puts", []):
            if p["strike"] in strikes:
                bid = p.get("bid", 0) or 0
                ask = p.get("ask", 0) or 0
                if bid > 0 and ask > 0:
                    result[(exp_date, p["strike"], "P")] = {
                        "mid": round((bid + ask) / 2, 2),
                        "bid": bid, "ask": ask,
                        "spread": round(ask - bid, 2),
                    }
    return result

# Enrich option prices
for acc in out["accounts"]:
    opts = acc.get("option_positions") or []
    if not opts:
        continue
    try:
        yahoo_prices = _yahoo_option_prices(opts)
        updated = 0
        for o in opts:
            sym = (o.get("symbol") or {}).get("option_symbol") or {}
            ticker = sym.get("ticker", "")
            cp = "C" if "C" in ticker[10:] else "P"
            key = (sym.get("expiration_date", ""), sym.get("strike_price"), cp)
            if key in yahoo_prices:
                info = yahoo_prices[key]
                o["price"] = info["mid"]
                o["bid"] = info["bid"]
                o["ask"] = info["ask"]
                o["spread"] = info["spread"]
                updated += 1
        print(f"Yahoo mid-price: {updated}/{len(opts)} options updated")
    except Exception as e:
        print(f"Yahoo mid-price fetch failed ({e}), keeping SnapTrade prices")

(DATA / "portfolio.json").write_text(json.dumps(out, indent=2, ensure_ascii=False, default=str))
(DATA / "portfolio.md").write_text("\n".join(md))
print(f"OK → portfolio.json / portfolio.md  ({len(out['accounts'])} account(s))")
