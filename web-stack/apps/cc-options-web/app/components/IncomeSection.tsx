"use client"

import { StatCard, LiquidGlassCard } from "@tlz/ui"
import type { Current } from "../types"
import { fmtMoney } from "../types"

const MARGIN_COST = 0.0425

export function IncomeSection({ cur, sharpe }: { cur: Current; sharpe: number | null }) {
  const dailyTheta = Math.abs(cur.effective_theta)
  const marginDaily = cur.margin_debt * MARGIN_COST / 365
  const netDaily = dailyTheta - marginDaily
  const nlvImpact1 = Math.abs(cur.net_delta * cur.qqq_price * 0.01)
  const shortCalls = cur.opt_rows.filter((r) => r.qty < 0 && r.dte >= 1).length

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">收支 <span className="text-xs text-[#86868b] font-normal">· Theta 收租 vs Margin 利息</span></h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="日 Theta 收租" value={`$${fmtMoney(dailyTheta)}`}
          hint={`${shortCalls} 张有效合约 · ≈ $${fmtMoney(dailyTheta * 30)}/月`} trend="up" />
        <StatCard label="日 Margin 利息" value={`$${fmtMoney(marginDaily)}`}
          hint={`${(MARGIN_COST * 100).toFixed(2)}% × ${fmtMoney(cur.margin_debt)} / 365`} trend="down" />
        <StatCard label="日净收入" value={`$${fmtMoney(netDaily)}`}
          hint={`Theta − 利息 · ≈ $${fmtMoney(netDaily * 30)}/月`}
          trend={netDaily >= 0 ? "up" : "down"} />
        <StatCard label="Sharpe Ratio"
          value={sharpe !== null ? sharpe.toFixed(2) : "—"}
          hint="基于 TWR 剥现金流" trend="flat" />
      </div>

      <LiquidGlassCard className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-foreground/10 text-[#86868b]">
            <tr>
              <th className="text-left px-4 py-3 font-medium">指标</th>
              <th className="text-right px-4 py-3 font-medium">数值</th>
              <th className="text-left px-4 py-3 font-medium">怎么算的</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-foreground/5">
            <tr>
              <td className="px-4 py-3 font-medium">日 Theta 收租</td>
              <td className="text-right px-4 py-3 tabular-nums">${fmtMoney(dailyTheta)}/天</td>
              <td className="px-4 py-3 text-foreground/70 text-xs">
                你卖了 {shortCalls} 张 QQQ Short Call（DTE≥1 有效合约），每天时间价值衰减 ${fmtMoney(dailyTheta)}。卖方衰减 = 你赚钱。前提：QQQ 价格不动
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium">日 Margin 利息</td>
              <td className="text-right px-4 py-3 tabular-nums">${fmtMoney(marginDaily)}/天</td>
              <td className="px-4 py-3 text-foreground/70 text-xs">
                Margin ${fmtMoney(cur.margin_debt)} × {(MARGIN_COST * 100).toFixed(2)}% ÷ 365 = ${fmtMoney(marginDaily)}/天
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium">日净收入</td>
              <td className="text-right px-4 py-3 tabular-nums">${fmtMoney(netDaily)}/天</td>
              <td className="px-4 py-3 text-foreground/70 text-xs">
                ${fmtMoney(dailyTheta)} − ${fmtMoney(marginDaily)} = ${fmtMoney(netDaily)}/天 (≈ ${fmtMoney(netDaily * 30)}/月)
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium">净 Delta 暴露</td>
              <td className="text-right px-4 py-3 tabular-nums">{fmtMoney(cur.net_delta, 0)}</td>
              <td className="px-4 py-3 text-foreground/70 text-xs">
                持股 {fmtMoney(cur.qqq_shares, 0)} Delta + 期权 {fmtMoney(cur.opt_delta_total, 0)} Delta = {fmtMoney(cur.net_delta, 0)}。QQQ ±1% → NLV ±${fmtMoney(nlvImpact1)}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium">Sharpe Ratio</td>
              <td className="text-right px-4 py-3 tabular-nums">{sharpe !== null ? sharpe.toFixed(2) : "—"}</td>
              <td className="px-4 py-3 text-foreground/70 text-xs">
                风险调整后收益率（(年化收益 − 4.5%) / 年化波动）。&gt;1 优秀 · 0 附近 = 刚好持平无风险利率 · &lt;0 跑输国债
              </td>
            </tr>
          </tbody>
        </table>
      </LiquidGlassCard>
    </section>
  )
}
