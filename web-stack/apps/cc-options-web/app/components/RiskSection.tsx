"use client"

import { LiquidGlassCard } from "@tlz/ui"
import type { Current } from "../types"
import { fmtMoney, fmtSigned } from "../types"

const MARGIN_COST = 0.0425

export function RiskSection({ cur }: { cur: Current }) {
  const qqq = cur.qqq_price
  const effLeverage = cur.nlv > 0 ? (cur.net_delta * qqq) / cur.nlv : 0
  const deltaHedgePct = cur.qqq_shares > 0 ? (1 - cur.net_delta / cur.qqq_shares) * 100 : 0
  const nlvImpact1 = Math.abs(cur.net_delta * qqq * 0.01)
  const nlvImpactPct = cur.nlv > 0 ? (nlvImpact1 / cur.nlv) * 100 : 0

  const stockPnl1 = cur.qqq_shares * qqq * 0.01
  const optDeltaPnl1 = cur.opt_delta_total * qqq * 0.01
  const gammaAdj = 0.5 * cur.net_gamma * Math.pow(qqq * 0.01, 2)
  const netPnlUp = stockPnl1 + optDeltaPnl1 + gammaAdj
  const netPnlDown = -stockPnl1 - optDeltaPnl1 + gammaAdj

  const dailyTheta = Math.abs(cur.effective_theta)

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">风险 <span className="text-xs text-[#86868b] font-normal">· 杠杆 · Delta 对冲 · ±1% P&L 分解</span></h2>

      {/* Row A: 杠杆 & 对冲 (5 metrics) */}
      <LiquidGlassCard className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
          <Cell label="名义杠杆" value={`${cur.leverage.toFixed(2)}×`} />
          <Cell label="有效杠杆" value={`${effLeverage.toFixed(2)}×`} />
          <Cell label="Delta 对冲比例" value={`${deltaHedgePct.toFixed(0)}%`} />
          <Cell label="QQQ ±1% 影响" value={`±$${fmtMoney(nlvImpact1)}`} />
          <Cell label="影响占 NLV" value={`±${nlvImpactPct.toFixed(2)}%`} />
        </div>
      </LiquidGlassCard>

      {/* Row B: Greeks */}
      <LiquidGlassCard className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <Cell label="净 Delta (股)" value={fmtMoney(cur.net_delta, 0)}
            sub={`纯 QQQ = ${fmtMoney(cur.qqq_shares, 0)}`} />
          <Cell label="净 Gamma" value={cur.net_gamma.toFixed(1)} />
          <Cell label="日 Theta 收入 (DTE≥1)" value={`$${fmtMoney(dailyTheta)}`}
            sub={`Margin $${fmtMoney(cur.margin_debt * MARGIN_COST / 365)}/天`} />
          <Cell label="净 Vega" value={`$${fmtMoney(cur.net_vega)}`} />
        </div>
      </LiquidGlassCard>

      {/* 杠杆与对冲 解释表 */}
      <LiquidGlassCard className="overflow-hidden">
        <div className="px-5 pt-4 pb-2 text-sm font-semibold">杠杆与对冲</div>
        <table className="w-full text-sm">
          <thead className="border-t border-foreground/10 text-[#86868b]">
            <tr>
              <th className="text-left px-4 py-2 font-medium">指标</th>
              <th className="text-right px-4 py-2 font-medium">数值</th>
              <th className="text-left px-4 py-2 font-medium">通俗解释</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-foreground/5">
            <tr>
              <td className="px-4 py-3">名义杠杆</td>
              <td className="text-right px-4 py-3 tabular-nums">{cur.leverage.toFixed(2)}×</td>
              <td className="px-4 py-3 text-foreground/70 text-xs">
                自有 ${fmtMoney(cur.nlv)} 买了 ${fmtMoney(cur.stock_mv)} 的 QQQ，多出来的是券商 Margin
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3">有效杠杆</td>
              <td className="text-right px-4 py-3 tabular-nums">{effLeverage.toFixed(2)}×</td>
              <td className="px-4 py-3 text-foreground/70 text-xs">
                卖 deep-ITM Call 对冲后 QQQ ±1% 只影响 {nlvImpactPct.toFixed(2)}%，等效 {effLeverage.toFixed(2)}× 杠杆
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3">对冲比例</td>
              <td className="text-right px-4 py-3 tabular-nums">{deltaHedgePct.toFixed(0)}%</td>
              <td className="px-4 py-3 text-foreground/70 text-xs">
                Short Call 贡献 {fmtMoney(cur.opt_delta_total, 0)} Delta，对冲掉 {deltaHedgePct.toFixed(0)}%
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3">净 Delta</td>
              <td className="text-right px-4 py-3 tabular-nums">{fmtMoney(cur.net_delta, 0)} 股</td>
              <td className="px-4 py-3 text-foreground/70 text-xs">
                {fmtMoney(cur.qqq_shares, 0)}(持股) + ({fmtMoney(cur.opt_delta_total, 0)})(期权) = {fmtMoney(cur.net_delta, 0)}。裸露 {fmtMoney(cur.net_delta, 0)} 股方向风险
              </td>
            </tr>
          </tbody>
        </table>
      </LiquidGlassCard>

      {/* Greeks 解释表 */}
      <LiquidGlassCard className="overflow-hidden">
        <div className="px-5 pt-4 pb-2 text-sm font-semibold">Greeks 解释</div>
        <table className="w-full text-sm">
          <thead className="border-t border-foreground/10 text-[#86868b]">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Greek</th>
              <th className="text-right px-4 py-2 font-medium">数值</th>
              <th className="text-left px-4 py-2 font-medium">通俗解释</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-foreground/5">
            <tr>
              <td className="px-4 py-3">Delta</td>
              <td className="text-right px-4 py-3 tabular-nums">{fmtMoney(cur.net_delta, 0)}</td>
              <td className="px-4 py-3 text-foreground/70 text-xs">
                QQQ 涨 $1 组合赚 ${fmtMoney(cur.net_delta, 0)}，跌 $1 亏 ${fmtMoney(Math.abs(cur.net_delta), 0)}。越小对冲越好
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3">Gamma</td>
              <td className="text-right px-4 py-3 tabular-nums">{cur.net_gamma.toFixed(1)}</td>
              <td className="px-4 py-3 text-foreground/70 text-xs">
                QQQ 每动 $1 Delta 变 {cur.net_gamma.toFixed(1)}。负 Gamma = 跌时保护减弱、涨时赚不到更多，卖 Call 的代价
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3">Theta</td>
              <td className="text-right px-4 py-3 tabular-nums">${fmtMoney(dailyTheta)}/天</td>
              <td className="px-4 py-3 text-foreground/70 text-xs">
                Short Call 时间价值每天衰减 ${fmtMoney(dailyTheta)} = 你的"收租"收入。QQQ 不动也赚
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3">Vega</td>
              <td className="text-right px-4 py-3 tabular-nums">${fmtMoney(cur.net_vega)}</td>
              <td className="px-4 py-3 text-foreground/70 text-xs">
                IV 每升 1% 组合亏 ${fmtMoney(Math.abs(cur.net_vega))}。期权卖方，波动率上升 = 你卖出的东西变贵 = 亏
              </td>
            </tr>
          </tbody>
        </table>
      </LiquidGlassCard>

      {/* ±1% P&L 分解 */}
      <LiquidGlassCard className="overflow-hidden">
        <div className="px-5 pt-4 pb-2 text-sm font-semibold">QQQ ±1% P&L 分解</div>
        <table className="w-full text-sm">
          <thead className="border-t border-foreground/10 text-[#86868b]">
            <tr>
              <th className="text-left px-4 py-2 font-medium">分项</th>
              <th className="text-right px-4 py-2 font-medium">QQQ +1%</th>
              <th className="text-right px-4 py-2 font-medium">QQQ −1%</th>
              <th className="text-left px-4 py-2 font-medium">说明</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-foreground/5">
            <tr>
              <td className="px-4 py-3">股票 P&L</td>
              <td className="text-right px-4 py-3 tabular-nums text-emerald-600">{fmtSigned(stockPnl1)}</td>
              <td className="text-right px-4 py-3 tabular-nums text-rose-600">{fmtSigned(-stockPnl1)}</td>
              <td className="px-4 py-3 text-foreground/70 text-xs">
                {fmtMoney(cur.qqq_shares, 0)} × ${qqq.toFixed(2)} × 1%
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3">期权 Δ P&L</td>
              <td className={`text-right px-4 py-3 tabular-nums ${optDeltaPnl1 >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{fmtSigned(optDeltaPnl1)}</td>
              <td className={`text-right px-4 py-3 tabular-nums ${-optDeltaPnl1 >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{fmtSigned(-optDeltaPnl1)}</td>
              <td className="px-4 py-3 text-foreground/70 text-xs">Short Call Delta 对冲（方向相反）</td>
            </tr>
            <tr>
              <td className="px-4 py-3">Γ 调整</td>
              <td className={`text-right px-4 py-3 tabular-nums ${gammaAdj >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{fmtSigned(gammaAdj, 1)}</td>
              <td className={`text-right px-4 py-3 tabular-nums ${gammaAdj >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{fmtSigned(gammaAdj, 1)}</td>
              <td className="px-4 py-3 text-foreground/70 text-xs">Short Gamma 不管涨跌都略吃亏</td>
            </tr>
            <tr className="bg-foreground/5 font-medium">
              <td className="px-4 py-3">净 P&L</td>
              <td className={`text-right px-4 py-3 tabular-nums ${netPnlUp >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{fmtSigned(netPnlUp)}</td>
              <td className={`text-right px-4 py-3 tabular-nums ${netPnlDown >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{fmtSigned(netPnlDown)}</td>
              <td className="px-4 py-3 text-foreground/70 text-xs">
                占 NLV {(netPnlUp / cur.nlv * 100).toFixed(2)}% / {(netPnlDown / cur.nlv * 100).toFixed(2)}% — Sharpe 高的原因
              </td>
            </tr>
          </tbody>
        </table>
      </LiquidGlassCard>
    </section>
  )
}

function Cell({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <div className="text-[#86868b] text-xs">{label}</div>
      <div className="tabular-nums text-lg font-medium mt-0.5">{value}</div>
      {sub && <div className="text-[11px] text-[#86868b] mt-0.5">{sub}</div>}
    </div>
  )
}
