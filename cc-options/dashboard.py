#!/usr/bin/env python3
"""Phase 3+4: 实时看板 + Roll 决策建议 → dashboard.md"""
import json
from datetime import date
from pathlib import Path

from lib_greeks import process_portfolio, compute_scenarios, compute_roll_signals

DASH = Path(__file__).resolve().parent
DATA = DASH / "data"
TODAY = date.today()

port = json.loads((DATA / "portfolio.json").read_text())
data = process_portfolio(port)
if not data:
    print("ERROR: QQQ price not found")
    exit(1)

scenarios = compute_scenarios(data["qqq_price"], data["qqq_shares"],
                              data["cash"], data["opt_rows"])
signals = compute_roll_signals(data["opt_rows"])

nlv = data["nlv"]
md = [f"# Dashboard — {TODAY.isoformat()}\n"]
md.append(f"_QQQ: ${data['qqq_price']:.2f} | 更新: {data['ts']}_\n")

md.append("## 账户总览\n")
md.append("| 指标 | 值 |")
md.append("|---|---|")
md.append(f"| NLV | **${nlv:,.0f}** |")
md.append(f"| 股票市值 | ${data['stock_mv']:,.0f} ({data['qqq_shares']:.0f} shares) |")
md.append(f"| 期权负债 | ${data['opt_liability']:,.0f} |")
md.append(f"| Margin 债务 | ${data['margin_debt']:,.0f} |")
md.append(f"| 杠杆 | **{data['leverage']:.1f}×** |")
md.append(f"| 净 Delta | {data['net_delta']:,.0f} (stock {data['stock_delta']:,.0f} + opt {data['opt_delta_total']:,.0f}) |")
md.append(f"| 净 Theta | **${data['net_theta']:+,.0f}/天** |")
md.append(f"| 总时间价值 | ${data['total_tv']:,.0f} |")
md.append("")

md.append("## 情景分析\n")
md.append("| QQQ 变动 | NLV | 变动$ | 变动% |")
md.append("|---|---|---|---|")
for pct in sorted(scenarios.keys()):
    val = scenarios[pct]
    chg = val - nlv
    md.append(f"| {pct:+.0%} | ${val:,.0f} | ${chg:+,.0f} | {chg/nlv*100:+.1f}% |")
md.append("")

md.append("## 期权持仓 + Greeks\n")
md.append("| Exp | DTE | Strike | Qty | Price | IV | Delta | Theta | TV | TV年化% |")
md.append("|---|---|---|---|---|---|---|---|---|---|")
for r in data["opt_rows"]:
    md.append(f"| {r['exp']} | {r['dte']} | {r['strike']:.0f} | {r['qty']:.0f} "
              f"| ${r['price']:.2f} | {r['iv']*100:.0f}% | {r['delta']:.2f} "
              f"| ${r['theta']*r['qty']*100:+.0f} | ${r['time_value']:.2f} "
              f"| {r['tv_annual_pct']:.1f}% |")
md.append("")

if signals:
    md.append("## Roll 建议\n")
    for s in signals:
        md.append(f"### {s['ticker']}")
        md.append(f"**{s['action']}**\n")
        for reason in s["reasons"]:
            md.append(f"- {reason}")
        md.append(f"- 当前: {s['qty']:.0f}张 × ${s['price']:.2f}, DTE={s['dte']}, "
                  f"Delta={s['delta']:.2f}, TV=${s['time_value']:.2f}")
        md.append("")
else:
    md.append("## Roll 建议\n")
    md.append("当前无需操作。\n")

(DATA / "dashboard.md").write_text("\n".join(md))
print(f"OK → dashboard.md")
print(f"NLV=${nlv:,.0f}  Net Delta={data['net_delta']:,.0f}  "
      f"Theta=${data['net_theta']:+,.0f}/day  Total TV=${data['total_tv']:,.0f}")
if signals:
    print(f"\n⚠ {len(signals)} 条 Roll 建议:")
    for s in signals:
        print(f"  {s['ticker']}: {s['action']}")
