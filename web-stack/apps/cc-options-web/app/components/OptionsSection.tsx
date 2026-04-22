"use client"

import { LiquidGlassCard } from "@tlz/ui"
import type { Current, RollSignal, RollSignalsResp } from "../types"
import { fmtMoney } from "../types"

const MARGIN_COST = 0.0425

function actionClass(action: string): string {
  if (action.includes("ROLL")) return "bg-amber-100 text-amber-800"
  if (action.includes("ASSIGN")) return "bg-rose-100 text-rose-800"
  if (action.includes("WATCH")) return "bg-blue-100 text-blue-800"
  if (action.includes("EXPIRE")) return "bg-stone-100 text-stone-700"
  return "bg-emerald-100 text-emerald-800"
}

function tvBarColor(pct: number): string {
  if (pct >= 80) return "#ff9500"
  if (pct >= 50) return "#34c759"
  return "#0071e3"
}

export function OptionsSection({ cur, signals }: { cur: Current; signals: RollSignalsResp | null }) {
  const sigMap = new Map((signals?.signals || []).map((s) => [s.ticker, s]))

  // Summary metrics (§3.6)
  const totalTV = cur.opt_rows.reduce((acc, r) => acc + Math.abs(r.qty) * r.time_value * 100, 0)
  const totalPremium = cur.opt_rows.reduce((acc, r) => acc + Math.abs(r.qty) * r.avg * 100, 0)
  const annualMargin = cur.margin_debt * MARGIN_COST

  const shortSigs = (signals?.signals || []).filter((s) => s.qty < 0)

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-semibold">期权 · Short Call 策略</h2>
          <div className="text-xs text-[#86868b] mt-0.5">
            {cur.opt_rows.length} 张持仓 · {shortSigs.length} 张 short call
          </div>
        </div>
        <div className="text-sm tabular-nums">
          <span className="text-[#86868b]">QQQ 现价 </span>
          <span className="font-semibold text-[#1d1d1f]">${cur.qqq_price.toFixed(2)}</span>
        </div>
      </div>

      {/* Roll 信号卡片 */}
      {shortSigs.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3 text-[#1d1d1f]">Roll 信号</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {shortSigs.map((s) => (
              <SignalCard key={s.ticker} s={s} />
            ))}
          </div>
        </div>
      )}

      {/* Table A 持仓概况 */}
      <LiquidGlassCard className="overflow-hidden">
        <div className="px-5 pt-4 pb-2 flex items-baseline justify-between gap-3">
          <div className="text-sm font-semibold">Table A · 持仓概况</div>
          <div className="text-[11px] text-[#86868b]">
            现价 = 内值 + 时间价值 · Theta = 时间价值每天衰减（每股）
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-t border-foreground/10 text-[#86868b]">
              <tr>
                <th className="text-left px-4 py-2 font-medium">到期</th>
                <th className="text-right px-4 py-2 font-medium">DTE</th>
                <th className="text-right px-4 py-2 font-medium">行权价</th>
                <th className="text-right px-4 py-2 font-medium">数量</th>
                <th className="text-right px-4 py-2 font-medium">现价</th>
                <th className="text-right px-4 py-2 font-medium">内值</th>
                <th className="text-right px-4 py-2 font-medium">时间价值</th>
                <th className="text-right px-4 py-2 font-medium">IV</th>
                <th className="text-right px-4 py-2 font-medium">Delta</th>
                <th className="text-right px-4 py-2 font-medium">Theta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/5">
              {cur.opt_rows.map((r, i) => {
                const tvTotal = Math.abs(r.qty) * r.time_value * 100
                return (
                  <tr key={i} className="hover:bg-foreground/5">
                    <td className="px-4 py-2 font-mono text-xs whitespace-nowrap">{r.exp}</td>
                    <td className="text-right px-4 py-2 tabular-nums">{r.dte}</td>
                    <td className="text-right px-4 py-2 tabular-nums">{Math.round(r.strike)}</td>
                    <td className="text-right px-4 py-2 tabular-nums">{r.qty.toFixed(0)}</td>
                    <td className="text-right px-4 py-2 tabular-nums">${r.price.toFixed(2)}</td>
                    <td className="text-right px-4 py-2 tabular-nums text-[#86868b]">
                      ${r.intrinsic.toFixed(2)}
                    </td>
                    <td className="text-right px-4 py-2 tabular-nums">
                      <div>${r.time_value.toFixed(2)}</div>
                      <div className="text-[10px] text-[#86868b]">总 ${fmtMoney(tvTotal)}</div>
                    </td>
                    <td className="text-right px-4 py-2 tabular-nums">{(r.iv * 100).toFixed(0)}%</td>
                    <td className="text-right px-4 py-2 tabular-nums">{r.delta.toFixed(2)}</td>
                    <td className="text-right px-4 py-2 tabular-nums">{r.theta.toFixed(3)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </LiquidGlassCard>

      {/* Table B 收益分析 */}
      <LiquidGlassCard className="overflow-hidden">
        <div className="px-5 pt-4 pb-2 text-sm font-semibold">Table B · 收益分析</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-t border-foreground/10 text-[#86868b]">
              <tr>
                <th className="text-left px-4 py-2 font-medium">到期</th>
                <th className="text-right px-4 py-2 font-medium">行权价</th>
                <th className="text-right px-4 py-2 font-medium">收取权利金</th>
                <th className="text-right px-4 py-2 font-medium">Roll 年化</th>
                <th className="text-right px-4 py-2 font-medium">Roll 杠杆年化</th>
                <th className="text-right px-4 py-2 font-medium">剩余 TV 年化</th>
                <th className="text-right px-4 py-2 font-medium">杠杆年化</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/5">
              {cur.opt_rows.map((r, i) => {
                const abs_qty = Math.abs(r.qty)
                const tv_remaining = r.time_value * abs_qty * 100
                const premium_collected = r.avg * abs_qty * 100
                const strike_backing = r.strike * abs_qty * 100
                const equity_needed = cur.leverage > 0 ? strike_backing / cur.leverage : strike_backing
                const margin_borrowed = strike_backing - equity_needed
                const dte_safe = Math.max(r.dte, 1)
                const margin_interest = margin_borrowed * MARGIN_COST * dte_safe / 365
                const tv_yield = strike_backing > 0 ? (tv_remaining / strike_backing) * 365 / dte_safe * 100 : 0
                const tv_yield_lev = equity_needed > 0 ? ((tv_remaining - margin_interest) / equity_needed) * 365 / dte_safe * 100 : 0
                const sig = sigMap.get(r.ticker)
                const credit = sig?.credit
                const roll_annual = credit?.annual ?? null
                let roll_annual_lev: number | null = null
                if (credit && credit.days_period > 0) {
                  const credit_total = credit.credit * abs_qty * 100
                  const margin_interest_roll = margin_borrowed * MARGIN_COST * credit.days_period / 365
                  roll_annual_lev = equity_needed > 0 ? ((credit_total - margin_interest_roll) / equity_needed) * 365 / Math.max(credit.days_period, 1) * 100 : null
                }
                return (
                  <tr key={i} className="hover:bg-foreground/5">
                    <td className="px-4 py-2 font-mono text-xs whitespace-nowrap">{r.exp}</td>
                    <td className="text-right px-4 py-2 tabular-nums">{Math.round(r.strike)}</td>
                    <td className="text-right px-4 py-2 tabular-nums">${fmtMoney(premium_collected)}</td>
                    <td className="text-right px-4 py-2 tabular-nums">{roll_annual !== null ? `${roll_annual.toFixed(1)}%` : "—"}</td>
                    <td className="text-right px-4 py-2 tabular-nums">{roll_annual_lev !== null ? `${roll_annual_lev.toFixed(1)}%` : "—"}</td>
                    <td className="text-right px-4 py-2 tabular-nums">{tv_yield.toFixed(1)}%</td>
                    <td className={`text-right px-4 py-2 tabular-nums ${tv_yield_lev < 0 ? "text-rose-600" : tv_yield_lev < 5 ? "text-amber-600" : ""}`}>
                      {tv_yield_lev.toFixed(1)}%
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </LiquidGlassCard>

      {/* Roll 明细 (folding) */}
      <details className="group">
        <summary className="cursor-pointer select-none px-5 py-3 rounded-xl bg-foreground/[0.03] hover:bg-foreground/[0.06] text-sm font-semibold flex items-center justify-between">
          Roll 年化计算明细
          <span className="text-xs text-[#86868b] group-open:hidden">展开</span>
          <span className="text-xs text-[#86868b] hidden group-open:inline">收起</span>
        </summary>
        <LiquidGlassCard className="overflow-hidden mt-2">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-foreground/10 text-[#86868b]">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">到期</th>
                  <th className="text-right px-4 py-2 font-medium">Strike</th>
                  <th className="text-right px-4 py-2 font-medium">数量</th>
                  <th className="text-left px-4 py-2 font-medium">类型</th>
                  <th className="text-left px-4 py-2 font-medium">开仓日</th>
                  <th className="text-right px-4 py-2 font-medium">计息天数</th>
                  <th className="text-left px-4 py-2 font-medium">Credit 明细</th>
                  <th className="text-left px-4 py-2 font-medium">Roll 年化公式</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-foreground/5">
                {cur.opt_rows.map((r, i) => {
                  const sig = sigMap.get(r.ticker)
                  const credit = sig?.credit
                  if (!credit) return null
                  const abs_qty = Math.abs(r.qty)
                  const is_roll = credit.is_roll
                  const detail = is_roll
                    ? `Sell ${r.exp} $${Math.round(r.strike)}C @$${credit.sell_price.toFixed(2)} − Buy @$${(credit.buy_price ?? 0).toFixed(2)} = credit $${credit.credit.toFixed(2)}/share`
                    : `Sell ${r.exp} $${Math.round(r.strike)}C @$${credit.sell_price.toFixed(2)} = credit $${credit.credit.toFixed(2)}/share`
                  const formula = `${credit.credit.toFixed(2)} / ${Math.round(r.strike)} × 365 / ${credit.days_period} = ${credit.annual.toFixed(1)}%`
                  return (
                    <tr key={i}>
                      <td className="px-4 py-2 font-mono text-xs whitespace-nowrap">{r.exp}</td>
                      <td className="text-right px-4 py-2 tabular-nums">{Math.round(r.strike)}</td>
                      <td className="text-right px-4 py-2 tabular-nums">{abs_qty}</td>
                      <td className="px-4 py-2">{is_roll ? "Calendar Roll" : "Fresh Open"}</td>
                      <td className="px-4 py-2 text-xs font-mono">{credit.open_date}</td>
                      <td className="text-right px-4 py-2 tabular-nums">{credit.days_period} 天</td>
                      <td className="px-4 py-2 text-xs">{detail}</td>
                      <td className="px-4 py-2 text-xs font-mono">{formula}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-2 border-t border-foreground/5 text-xs text-[#86868b]">
            <strong>计息天数</strong>：Roll = 旧到期 → 新到期（延期）；Fresh Open = 开仓日 → 到期日
          </div>
        </LiquidGlassCard>
      </details>

      {/* Summary metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <LiquidGlassCard className="p-5">
          <div className="text-xs text-[#86868b]">剩余可收租金</div>
          <div className="tabular-nums text-xl font-semibold mt-1">${fmtMoney(totalTV)}</div>
          <div className="text-xs text-[#86868b] mt-1">所有期权未衰减的时间价值总和（QQQ 不动时可落袋）</div>
        </LiquidGlassCard>
        <LiquidGlassCard className="p-5">
          <div className="text-xs text-[#86868b]">已收权利金总额</div>
          <div className="tabular-nums text-xl font-semibold mt-1">${fmtMoney(totalPremium)}</div>
          <div className="text-xs text-[#86868b] mt-1">开仓卖出期权收到的全部权利金</div>
        </LiquidGlassCard>
        <LiquidGlassCard className="p-5">
          <div className="text-xs text-[#86868b]">年 Margin 利息</div>
          <div className="tabular-nums text-xl font-semibold mt-1">${fmtMoney(annualMargin)}</div>
          <div className="text-xs text-[#86868b] mt-1">${fmtMoney(annualMargin / 365)}/天 · ${fmtMoney(annualMargin / 12)}/月</div>
        </LiquidGlassCard>
      </div>

      {/* 指标说明 folder */}
      <details className="group">
        <summary className="cursor-pointer select-none px-5 py-3 rounded-xl bg-foreground/[0.03] hover:bg-foreground/[0.06] text-sm font-semibold">
          指标说明
        </summary>
        <LiquidGlassCard className="overflow-hidden mt-2">
          <table className="w-full text-sm">
            <thead className="border-b border-foreground/10 text-[#86868b]">
              <tr>
                <th className="text-left px-4 py-2 font-medium">指标</th>
                <th className="text-left px-4 py-2 font-medium">含义</th>
                <th className="text-left px-4 py-2 font-medium">怎么看</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/5">
              <GlossaryRow k="Roll 年化" v="这笔 roll 的面值年化（credit / strike × 365/持有天数）" h="不含杠杆的基准收益率" />
              <GlossaryRow k="Roll 杠杆年化" v="credit 扣 margin 利息，分母用自有资金" h="反映真实回报" />
              <GlossaryRow k="剩余 TV 年化" v="剩余时间价值年化（面值口径）" h="接近 0 → theta 已收割完" />
              <GlossaryRow k="杠杆年化" v="剩余 TV 扣 margin 利息后，分母用自有资金" h="负数 → 持有成本已超收入，应立即行动" />
              <GlossaryRow k="滑点" v="Roll 需付出的 bid-ask spread 成本" h="滑点 > 剩余 TV → let assign 更划算" />
              <GlossaryRow k="TV 收割" v="已收割的时间价值占比" h="≥80% 触发 roll 信号" />
            </tbody>
          </table>
        </LiquidGlassCard>
      </details>
    </section>
  )
}

function SignalCard({ s }: { s: RollSignal }) {
  const tv = Math.min(Math.max(s.tv_harvested_pct, 0), 100)
  return (
    <div className="rounded-lg border border-foreground/10 bg-foreground/[0.015] p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="font-mono text-sm">{s.exp} · {Math.round(s.strike)}C × {Math.abs(s.qty)}</div>
      </div>
      <div>
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${actionClass(s.action)}`}>
          {s.action}
        </span>
      </div>
      {s.target && s.target !== "-" && (
        <div className="text-[11px] font-mono text-[#0071e3] bg-blue-50/60 rounded px-2 py-1 border border-blue-100">
          目标 · {s.target}
        </div>
      )}
      {s.reasons.length > 0 && (
        <ul className="text-[11px] text-foreground/70 space-y-0.5">
          {s.reasons.map((r, i) => (
            <li key={i}>· {r}</li>
          ))}
        </ul>
      )}
      <div className="mt-1">
        <div className="flex items-center justify-between text-[10px] text-[#86868b] mb-0.5">
          <span>TV 收割</span>
          <span className="tabular-nums">{tv.toFixed(0)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-foreground/5 overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${tv}%`, background: tvBarColor(tv) }} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-[10px] pt-1 border-t border-foreground/5 mt-1">
        <div>
          <div className="text-[#86868b]">Δ</div>
          <div className="tabular-nums">{s.delta.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-[#86868b]">IV</div>
          <div className="tabular-nums">{(s.iv * 100).toFixed(0)}%</div>
        </div>
        <div>
          <div className="text-[#86868b]">DTE</div>
          <div className="tabular-nums">{s.dte}</div>
        </div>
      </div>
    </div>
  )
}

function GlossaryRow({ k, v, h }: { k: string; v: string; h: string }) {
  return (
    <tr>
      <td className="px-4 py-2 font-medium whitespace-nowrap">{k}</td>
      <td className="px-4 py-2 text-foreground/80 text-xs">{v}</td>
      <td className="px-4 py-2 text-[#86868b] text-xs">{h}</td>
    </tr>
  )
}
