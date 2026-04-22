#!/usr/bin/env python3
"""Robinhood 持仓快照：输出 portfolio.json + portfolio.md"""
import json
import os
import sys
from datetime import datetime
from pathlib import Path

import robin_stocks.robinhood as r

DASH = Path(__file__).resolve().parent
DATA = DASH / "data"
TOKEN_DIR = Path.home() / ".tokens"
TOKEN_DIR.mkdir(exist_ok=True)
PICKLE = TOKEN_DIR / "robinhood.pickle"

USER = os.environ.get("ROBINHOOD_USERNAME")
PWD = os.environ.get("ROBINHOOD_PASSWORD")
if not USER or not PWD:
    sys.exit("缺 ROBINHOOD_USERNAME/ROBINHOOD_PASSWORD，source ~/.personal_env")

r.login(username=USER, password=PWD, expiresIn=86400 * 7,
        pickle_path=str(PICKLE), store_session=True)

profile = r.profiles.load_account_profile()
portfolio = r.profiles.load_portfolio_profile()
holdings = r.account.build_holdings()
options = r.options.get_open_option_positions()

# 期权补全合约信息
opt_rows = []
for o in options or []:
    inst = r.helper.request_get(o["option"])
    opt_rows.append({
        "symbol": o["chain_symbol"],
        "type": inst.get("type"),
        "strike": float(inst.get("strike_price", 0)),
        "expiration": inst.get("expiration_date"),
        "quantity": float(o["quantity"]),
        "avg_price": float(o["average_price"]),
        "side": o["type"],
    })

snap = {
    "ts": datetime.now().isoformat(timespec="seconds"),
    "cash": float(profile.get("cash", 0)),
    "buying_power": float(profile.get("buying_power", 0)),
    "equity": float(portfolio.get("equity", 0)),
    "market_value": float(portfolio.get("market_value", 0)),
    "stocks": holdings,
    "options": opt_rows,
}

(DATA / "portfolio.json").write_text(json.dumps(snap, indent=2, ensure_ascii=False))

# Markdown 快照
lines = [f"# Portfolio Snapshot", f"", f"_{snap['ts']}_", ""]
lines += [f"- Equity: ${snap['equity']:,.2f}",
          f"- Market Value: ${snap['market_value']:,.2f}",
          f"- Cash: ${snap['cash']:,.2f}",
          f"- Buying Power: ${snap['buying_power']:,.2f}", ""]
lines.append("## Stocks\n")
lines.append("| Symbol | Qty | Avg | Price | Equity | PnL% |")
lines.append("|---|---|---|---|---|---|")
for sym, h in (holdings or {}).items():
    lines.append(f"| {sym} | {h['quantity']} | {h['average_buy_price']} | "
                 f"{h['price']} | {h['equity']} | {h['percent_change']}% |")
if opt_rows:
    lines.append("\n## Options\n")
    lines.append("| Symbol | Side | Type | Strike | Expiry | Qty | Avg |")
    lines.append("|---|---|---|---|---|---|---|")
    for o in opt_rows:
        lines.append(f"| {o['symbol']} | {o['side']} | {o['type']} | "
                     f"{o['strike']} | {o['expiration']} | {o['quantity']} | {o['avg_price']} |")

(DATA / "portfolio.md").write_text("\n".join(lines))
print(f"OK → portfolio.json / portfolio.md")
print(f"Equity ${snap['equity']:,.2f} | {len(holdings or {})} stocks | {len(opt_rows)} options")
