#!/usr/bin/env python3
"""体检预告片：不做 TWR，只算三个数
1) 当前净值 NLV
2) 净入金（contributions - withdrawals）
3) 如果每笔入金在当天买 QQQ 持有到今天，会值多少
输出总 P&L vs QQQ-equivalent。
"""
import json
from datetime import datetime, timedelta
from pathlib import Path
import requests

DASH = Path(__file__).resolve().parent
DATA = DASH / "data"
acts = json.loads((DATA / "activities.json").read_text())["activities"]
port = json.loads((DATA / "portfolio.json").read_text())

# -------- 1) NLV from current snapshot ----------
acc = port["accounts"][0]
bal = acc["balances"][0]
cash = float(bal.get("cash") or 0)                    # 可能负（margin debit）
stock_mv = sum(float(p.get("units") or 0) * float(p.get("price") or 0)
               for p in acc.get("positions") or [])
opt_liab = 0.0
for o in acc.get("option_positions") or []:
    qty = float(o.get("units") or 0)                  # short = 负
    px = float(o.get("price") or 0)
    opt_liab += qty * px * 100                        # 美式合约 ×100
nlv = cash + stock_mv + opt_liab
print(f"当前快照")
print(f"  股票市值: ${stock_mv:>14,.2f}")
print(f"  期权 MTM: ${opt_liab:>14,.2f}  (short=负债)")
print(f"  现金    : ${cash:>14,.2f}")
print(f"  NLV     : ${nlv:>14,.2f}")

# -------- 2) 净入金 ----------
contribs = []  # (date, amount)
withdraws = []
fees = 0.0
divs = 0.0
for a in acts:
    t = a.get("type")
    amt = float(a.get("amount") or 0)
    d = (a.get("trade_date") or a.get("settlement_date") or "")[:10]
    if t == "CONTRIBUTION":
        contribs.append((d, amt))
    elif t == "WITHDRAWAL":
        withdraws.append((d, amt))
    elif t == "FEE":
        fees += amt
    elif t == "DIVIDEND":
        divs += amt
net_in = sum(a for _, a in contribs) + sum(a for _, a in withdraws)  # withdraw 已是负
print(f"\n资金流（{len(contribs)} 入金, {len(withdraws)} 出金）")
print(f"  累计入金  : ${sum(a for _,a in contribs):>14,.2f}")
print(f"  累计出金  : ${sum(a for _,a in withdraws):>14,.2f}")
print(f"  净入金    : ${net_in:>14,.2f}")
print(f"  Margin息 : ${fees:>14,.2f}")
print(f"  分红     : ${divs:>14,.2f}")

# -------- 3) 总 P&L ----------
total_pnl = nlv - net_in
roi_simple = total_pnl / net_in if net_in else 0
print(f"\n总 P&L")
print(f"  NLV - 净入金 = ${total_pnl:>14,.2f}  ({roi_simple*100:+.2f}% 简单回报)")

# -------- 4) QQQ 等额对照 ----------
url = "https://query1.finance.yahoo.com/v8/finance/chart/QQQ?range=2y&interval=1d"
r = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}).json()["chart"]["result"][0]
ts = r["timestamp"]
closes = r["indicators"]["quote"][0]["close"]
qqq_hist = [(datetime.utcfromtimestamp(t).strftime("%Y-%m-%d"), c)
            for t, c in zip(ts, closes) if c is not None]
qqq_today = qqq_hist[-1][1]

def qqq_price_on(date_str):
    for d, c in qqq_hist:
        if d >= date_str:
            return c
    return qqq_hist[-1][1]

qqq_value = 0.0
for d, amt in contribs:
    p = qqq_price_on(d)
    if p:
        shares = amt / p
        qqq_value += shares * qqq_today
for d, amt in withdraws:
    p = qqq_price_on(d)
    if p:
        shares = amt / p  # amt 负
        qqq_value += shares * qqq_today

qqq_pnl = qqq_value - net_in
print(f"\nQQQ 等额对照（每笔入金当天买 QQQ）")
print(f"  假想 NLV : ${qqq_value:>14,.2f}")
print(f"  QQQ P&L  : ${qqq_pnl:>14,.2f}  ({qqq_pnl/net_in*100:+.2f}%)")

print(f"\n差额（你 - QQQ）: ${total_pnl - qqq_pnl:>14,.2f}")
