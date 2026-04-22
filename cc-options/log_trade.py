#!/usr/bin/env python3
"""记录一笔交易决策到 trade_log.jsonl
用法: python log_trade.py "ROLL OUT" "QQQ 260417C00566000" --note "TV<$1, rolled to 260501C00570000"
"""
import argparse
import json
from datetime import datetime
from pathlib import Path

DASH = Path(__file__).resolve().parent
DATA = DASH / "data"
LOG = DATA / "trade_log.jsonl"

# Load current dashboard data for Greeks snapshot
dashboard = DATA / "dashboard.md"
port_file = DATA / "portfolio.json"

def get_option_snapshot(ticker):
    """Try to get Greeks from last dashboard run"""
    try:
        port = json.loads(port_file.read_text())
        acc = port["accounts"][0]
        qqq_px = None
        for p in acc.get("positions") or []:
            sym = (p.get("symbol") or {}).get("symbol") or {}
            s = sym.get("symbol") if isinstance(sym, dict) else sym
            if s == "QQQ":
                qqq_px = float(p.get("price") or 0)
        return {"qqq_price": qqq_px}
    except Exception:
        return {}

def main():
    p = argparse.ArgumentParser()
    p.add_argument("action", help="LET_ASSIGN / ROLL_OUT / ROLL_UP / CLOSE / OPEN")
    p.add_argument("ticker", help="Option ticker, e.g. 'QQQ 260417C00566000'")
    p.add_argument("--note", "-n", default="", help="Free text note")
    p.add_argument("--qty", type=int, default=0, help="Contracts")
    p.add_argument("--price", type=float, default=0, help="Execution price per share")
    p.add_argument("--new-ticker", default="", help="New ticker if rolling")
    args = p.parse_args()

    snap = get_option_snapshot(args.ticker)
    entry = {
        "ts": datetime.now().isoformat(timespec="seconds"),
        "action": args.action,
        "ticker": args.ticker,
        "qty": args.qty,
        "price": args.price,
        "new_ticker": args.new_ticker,
        "note": args.note,
        **snap,
    }
    with open(LOG, "a") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    print(f"Logged: {args.action} {args.ticker}")
    if args.new_ticker:
        print(f"  → Rolled to: {args.new_ticker}")
    if args.note:
        print(f"  Note: {args.note}")

if __name__ == "__main__":
    main()
