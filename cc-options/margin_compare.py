#!/usr/bin/env python3
"""Margin 融资优化计算器 — 对比 Robinhood margin vs HSBC HIBOR 贷款。

用法:
  python3 margin_compare.py                        # 交互输入 HSBC 可借额
  python3 margin_compare.py --hsbc-max 500000      # 指定 HSBC 最大可借额
  python3 margin_compare.py --hsbc-max 2000000 --hibor 0.02 --save
"""
import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from lib_greeks import (
    MARGIN_COST, HIBOR_RATE, compute_margin_savings, rh_margin_rate,
    process_portfolio,
)

DATA = Path(__file__).parent / "data"


def load_portfolio():
    port = json.loads((DATA / "portfolio.json").read_text())
    data = process_portfolio(port)
    if not data:
        print("Error: cannot parse portfolio.json")
        sys.exit(1)
    return data


def fmt(n, prefix="$"):
    """Format number as $1,234 or $1.23M."""
    if abs(n) >= 1_000_000:
        return f"{prefix}{n/1e6:,.2f}M"
    return f"{prefix}{n:,.0f}"


def print_report(data, hsbc_max, hibor):
    margin_debt = data["margin_debt"]
    qqq_price = data["qqq_price"]
    qqq_shares = data["qqq_shares"]
    daily_theta = abs(data["net_theta"])
    theta_per_share = daily_theta / qqq_shares if qqq_shares > 0 else 0

    baseline_rate = rh_margin_rate(margin_debt)
    baseline_cost = margin_debt * baseline_rate

    rows = compute_margin_savings(
        margin_debt, hsbc_max, hibor, qqq_price, theta_per_share,
    )

    print(f"\n{'='*80}")
    print(f"  MARGIN 融资优化 — HSBC HIBOR vs Robinhood")
    print(f"{'='*80}")
    print(f"\n  当前状态:")
    print(f"    Margin 债务:   {fmt(margin_debt)}")
    print(f"    Robinhood 利率: {baseline_rate*100:.2f}% ({fmt(margin_debt)} 档)")
    print(f"    年利息:        {fmt(baseline_cost)}")
    print(f"    日利息:        {fmt(baseline_cost/365)} (θ收入 {fmt(daily_theta)}/天)")
    print(f"    HSBC HIBOR:    {hibor*100:.2f}%")
    print(f"    HSBC 最大借入: {fmt(hsbc_max)}")
    print(f"    QQQ 价格:      {fmt(qqq_price)}")

    # ── 替代 margin 场景 ──
    print(f"\n  {'─'*76}")
    print(f"  替代 Margin 场景（HSBC 借入 → 注入 Robinhood → 降低 margin）")
    print(f"  {'─'*76}")

    header = (
        f"  {'HSBC借入':>10} │ {'HSBC利息':>9} │ {'RH余额':>9} │ {'RH利率':>6} │ "
        f"{'RH利息':>9} │ {'总利息':>9} │ {'年省':>9} │ {'月省':>7} │ {'混合利率':>7}"
    )
    print(header)
    print(f"  {'─'*10}─┼─{'─'*9}─┼─{'─'*9}─┼─{'─'*6}─┼─{'─'*9}─┼─{'─'*9}─┼─{'─'*9}─┼─{'─'*7}─┼─{'─'*7}")

    replacement_rows = [r for r in rows if r["extra"] == 0]
    for r in replacement_rows:
        tag = " ⭐" if r["rh_left"] > 0 and rh_margin_rate(r["rh_left"] - 1) > r["rh_rate"] else ""
        if r["hsbc"] == 0:
            tag = " (现状)"
        elif r["hsbc"] >= margin_debt:
            tag = " (全替)"
        print(
            f"  {fmt(r['hsbc']):>10} │ {fmt(r['hsbc_cost']):>9} │ {fmt(r['rh_left']):>9} │ "
            f"{r['rh_rate']*100:>5.2f}% │ {fmt(r['rh_cost']):>9} │ {fmt(r['total']):>9} │ "
            f"{fmt(r['savings']):>9} │ {fmt(r['savings']/12):>7} │ "
            f"{r['blended']*100:>6.2f}%{tag}"
        )

    # ── 扩仓场景 ──
    expansion_rows = [r for r in rows if r["extra"] > 0]
    if expansion_rows:
        print(f"\n  {'─'*76}")
        print(f"  扩仓场景（借超 margin → 买更多 QQQ → 卖更多 Call）")
        print(f"  {'─'*76}")
        print(
            f"  {'HSBC借入':>10} │ {'额外资本':>9} │ {'额外股数':>8} │ "
            f"{'额外θ/年':>9} │ {'额外利息':>9} │ {'额外净赚':>9} │ {'总利息':>9} │ {'总省':>9}"
        )
        print(f"  {'─'*10}─┼─{'─'*9}─┼─{'─'*8}─┼─{'─'*9}─┼─{'─'*9}─┼─{'─'*9}─┼─{'─'*9}─┼─{'─'*9}")
        for r in expansion_rows:
            total_savings = r["savings"] + r["extra_net"]
            print(
                f"  {fmt(r['hsbc']):>10} │ {fmt(r['extra']):>9} │ "
                f"{r['extra_shares']:>7.0f}股 │ {fmt(r['extra_theta']):>9} │ "
                f"{fmt(r['extra'] * hibor):>9} │ {fmt(r['extra_net']):>9} │ "
                f"{fmt(r['total']):>9} │ {fmt(total_savings):>9}"
            )
        print(f"\n  ⚠️  扩仓增加杠杆，需评估回撤是否突破 ≤QQQ 硬约束")

    # ── 资金链路 ──
    print(f"\n  {'─'*76}")
    print(f"  资金链路（全程 $0 手续费）")
    print(f"  {'─'*76}")
    print(f"  HSBC HK 借 HKD @ HIBOR {hibor*100:.1f}%")
    print(f"    ↓ 行内换 USD（HKD 挂钩 USD，汇率风险 <1.3%）")
    print(f"    ↓ Global Transfer → HSBC US（免费，即时）")
    print(f"    ↓ ACH → Robinhood（免费，1-3 工作日）")
    print(f"    = Robinhood margin 减少 → 利息下降")

    print(f"\n{'='*80}\n")
    return rows


def save_markdown(data, rows, hibor, output_path):
    margin_debt = data["margin_debt"]
    baseline_rate = rh_margin_rate(margin_debt)
    baseline_cost = margin_debt * baseline_rate

    lines = [
        "# Margin 融资优化分析",
        "",
        f"> 生成时间: {data['ts']}",
        f"> Margin 债务: ${margin_debt:,.0f} @ {baseline_rate*100:.2f}% = ${baseline_cost:,.0f}/年",
        f"> HIBOR: {hibor*100:.2f}%",
        "",
        "## 替代 Margin 场景",
        "",
        "| HSBC 借入 | HSBC 利息 | RH 余额 | RH 利率 | RH 利息 | **总利息** | **年省** | **月省** | 混合利率 |",
        "|-----------|----------|---------|---------|---------|-----------|---------|---------|---------|",
    ]
    for r in rows:
        if r["extra"] > 0:
            continue
        tag = "（现状）" if r["hsbc"] == 0 else ("（全替）" if r["hsbc"] >= margin_debt else "")
        lines.append(
            f"| ${r['hsbc']:,.0f}{tag} | ${r['hsbc_cost']:,.0f} | "
            f"${r['rh_left']:,.0f} | {r['rh_rate']*100:.2f}% | ${r['rh_cost']:,.0f} | "
            f"**${r['total']:,.0f}** | **${r['savings']:,.0f}** | "
            f"${r['savings']/12:,.0f} | {r['blended']*100:.2f}% |"
        )

    expansion = [r for r in rows if r["extra"] > 0]
    if expansion:
        lines += [
            "",
            "## 扩仓场景",
            "",
            "| HSBC 借入 | 额外资本 | 额外股数 | 额外 θ/年 | 额外利息 | 额外净赚 |",
            "|-----------|---------|---------|----------|---------|---------|",
        ]
        for r in expansion:
            lines.append(
                f"| ${r['hsbc']:,.0f} | ${r['extra']:,.0f} | {r['extra_shares']:.0f} 股 | "
                f"${r['extra_theta']:,.0f} | ${r['extra'] * hibor:,.0f} | "
                f"${r['extra_net']:,.0f} |"
            )

    lines += [
        "",
        "## 资金链路",
        "",
        "```",
        f"HSBC HK 借 HKD @ HIBOR {hibor*100:.1f}%",
        "  ↓ 行内换 USD（HKD挂钩USD，汇率风险<1.3%）",
        "  ↓ Global Transfer → HSBC US（免费，即时）",
        "  ↓ ACH → Robinhood（免费，1-3工作日）",
        "  = Robinhood margin 减少 → 利息下降",
        "```",
        "",
    ]

    output_path.write_text("\n".join(lines))
    print(f"  已保存: {output_path}")


def main():
    parser = argparse.ArgumentParser(description="Margin 融资优化计算器")
    parser.add_argument("--hsbc-max", type=float, default=None,
                        help="HSBC 最大可借额（USD 等值）")
    parser.add_argument("--hibor", type=float, default=HIBOR_RATE,
                        help=f"HIBOR 利率（默认 {HIBOR_RATE}）")
    parser.add_argument("--save", action="store_true",
                        help="保存分析结果到 data/margin_analysis.md")
    args = parser.parse_args()

    data = load_portfolio()

    hsbc_max = args.hsbc_max
    if hsbc_max is None:
        try:
            raw = input(f"\n  HSBC 最大可借额（USD，默认 = margin 全替 ${data['margin_debt']:,.0f}）: ").strip()
            hsbc_max = float(raw) if raw else data["margin_debt"]
        except (ValueError, EOFError):
            hsbc_max = data["margin_debt"]

    rows = print_report(data, hsbc_max, args.hibor)

    if args.save:
        save_markdown(data, rows, args.hibor, DATA / "margin_analysis.md")


if __name__ == "__main__":
    main()
