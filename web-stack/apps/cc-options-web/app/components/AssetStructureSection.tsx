"use client"

import { StatCard, LiquidGlassCard } from "@tlz/ui"
import type { Current, SummaryResp } from "../types"
import { calcTrend, fmtMoney, fmtSigned } from "../types"

const MARGIN_COST = 0.0425

export function AssetStructureSection({ cur, summary }: { cur: Current; summary: SummaryResp | null }) {
  const marginDaily = cur.margin_debt * MARGIN_COST / 365
  const prevNlv = summary?.prev_nlv ?? null
  const prevLev = summary?.prev_leverage ?? null
  const nlvDelta = prevNlv !== null ? cur.nlv - prevNlv : null
  const levDelta = prevLev !== null ? cur.leverage - prevLev : null
  const nlvHint = nlvDelta !== null
    ? `较昨日 ${fmtSigned(nlvDelta, 0)}`
    : "净资产 = 持仓 + 现金 + 期权负债"
  const levHint = levDelta !== null
    ? `较昨日 ${levDelta >= 0 ? "+" : ""}${levDelta.toFixed(2)}×`
    : "stock_mv / nlv"
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">资产结构</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="NLV" value={`$${fmtMoney(cur.nlv)}`}
          hint={nlvHint} trend={calcTrend(cur.nlv, prevNlv)} />
        <StatCard label="QQQ 持仓市值" value={`$${fmtMoney(cur.stock_mv)}`}
          hint={`${fmtMoney(cur.qqq_shares, 0)} 股 · $${cur.qqq_price.toFixed(2)}`} trend="flat" />
        <StatCard label="Margin 借款" value={`$${fmtMoney(cur.margin_debt)}`}
          hint={`RH 年 ${(MARGIN_COST * 100).toFixed(2)}%`} trend="flat" />
        <StatCard label="杠杆倍数" value={`${cur.leverage.toFixed(2)}×`}
          hint={levHint} trend={calcTrend(cur.leverage, prevLev)} />
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
              <td className="px-4 py-3 font-medium">账户净值 (NLV)</td>
              <td className="text-right px-4 py-3 tabular-nums">${fmtMoney(cur.nlv)}</td>
              <td className="px-4 py-3 text-foreground/70 text-xs">
                持仓市值 ${fmtMoney(cur.stock_mv)} + 现金 ${fmtMoney(cur.cash)} + 期权负债 ${fmtMoney(cur.opt_liability)}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium">QQQ 持仓</td>
              <td className="text-right px-4 py-3 tabular-nums">{fmtMoney(cur.qqq_shares, 0)} 股</td>
              <td className="px-4 py-3 text-foreground/70 text-xs">
                {fmtMoney(cur.qqq_shares, 0)} 股 × ${cur.qqq_price.toFixed(2)} = ${fmtMoney(cur.stock_mv)}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium">Margin 借款</td>
              <td className="text-right px-4 py-3 tabular-nums">${fmtMoney(cur.margin_debt)}</td>
              <td className="px-4 py-3 text-foreground/70 text-xs">
                年利率 {(MARGIN_COST * 100).toFixed(2)}% → ${fmtMoney(marginDaily)}/天 · ${fmtMoney(marginDaily * 30)}/月 · ${fmtMoney(cur.margin_debt * MARGIN_COST)}/年
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium">杠杆</td>
              <td className="text-right px-4 py-3 tabular-nums">{cur.leverage.toFixed(2)}×</td>
              <td className="px-4 py-3 text-foreground/70 text-xs">
                ${fmtMoney(cur.stock_mv)} / ${fmtMoney(cur.nlv)} = {cur.leverage.toFixed(2)}× · 自有 ${fmtMoney(cur.nlv)} 撬动 ${fmtMoney(cur.stock_mv)}
              </td>
            </tr>
          </tbody>
        </table>
      </LiquidGlassCard>
    </section>
  )
}
