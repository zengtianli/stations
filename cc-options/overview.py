#!/usr/bin/env python3
"""Quick overview of full activity history"""
import json
from collections import defaultdict
from pathlib import Path

DASH = Path(__file__).resolve().parent
DATA = DASH / "data"
acts = json.loads((DATA / "activities.json").read_text())["activities"]

types = defaultdict(int)
years = defaultdict(int)
for a in acts:
    types[a["type"]] += 1
    y = (a.get("trade_date") or "")[:4]
    years[y] += 1

print("类型:", dict(types))
print("年份:", dict(sorted(years.items())))

dates = [a.get("trade_date", "")[:10] for a in acts if a.get("trade_date")]
print(f"范围: {min(dates)} → {max(dates)}")

contribs = [(a.get("trade_date", "")[:10], a["amount"]) for a in acts if a["type"] == "CONTRIBUTION"]
contribs.sort()
total = sum(c for _, c in contribs)
print(f"\n入金时间线 ({len(contribs)}笔, 共${total:,.0f}):")
for d, a in contribs:
    print(f"  {d}  ${a:>10,.2f}")

withdraws = [(a.get("trade_date", "")[:10], a["amount"]) for a in acts if a["type"] == "WITHDRAWAL"]
if withdraws:
    print(f"\n出金 ({len(withdraws)}笔):")
    for d, a in withdraws:
        print(f"  {d}  ${a:>10,.2f}")

fees = [(a.get("trade_date", "")[:10], a["amount"]) for a in acts if a["type"] == "FEE"]
if fees:
    fees.sort()
    print(f"\nMargin利息 ({len(fees)}笔, 共${sum(f for _,f in fees):,.2f}):")
    for d, a in fees:
        print(f"  {d}  ${a:>10,.2f}")
