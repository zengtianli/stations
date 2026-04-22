"use client"

import { LiquidGlassCard } from "@tlz/ui"
import type { PerfMetricsResp } from "../types"
import { fmtPct } from "../types"

function tone(label: string): string {
  if (label === "CC 实盘") return "bg-blue-50 font-medium"
  return ""
}

export function PerformanceMetricsTable({ data }: { data: PerfMetricsResp | null }) {
  return (
    <LiquidGlassCard className="overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div>
          <div className="text-sm font-semibold">绩效对比</div>
          <div className="text-xs text-[#86868b]">
            起点 {data?.start ?? "—"} · 无风险利率 4.5%
          </div>
        </div>
      </div>
      {!data ? (
        <div className="py-6 text-center text-sm text-[#86868b]">加载中…</div>
      ) : (
        <table className="w-full text-sm">
          <thead className="border-t border-foreground/10 text-[#86868b]">
            <tr>
              <th className="text-left px-4 py-2 font-medium">策略</th>
              <th className="text-right px-4 py-2 font-medium">年化收益</th>
              <th className="text-right px-4 py-2 font-medium">年化波动</th>
              <th className="text-right px-4 py-2 font-medium">Sharpe</th>
              <th className="text-right px-4 py-2 font-medium">Sortino</th>
              <th className="text-right px-4 py-2 font-medium">最大回撤</th>
              <th className="text-right px-4 py-2 font-medium">累计</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-foreground/5">
            {data.strategies.map((s) => (
              <tr key={s.label} className={tone(s.label)}>
                <td className="px-4 py-3">{s.label}</td>
                <td className={`text-right px-4 py-3 tabular-nums ${s.annual_return !== null && s.annual_return >= 0 ? "text-emerald-600" : s.annual_return !== null ? "text-rose-600" : ""}`}>
                  {fmtPct(s.annual_return, 1)}
                </td>
                <td className="text-right px-4 py-3 tabular-nums">{fmtPct(s.annual_vol, 1)}</td>
                <td className="text-right px-4 py-3 tabular-nums">{s.sharpe !== null ? s.sharpe.toFixed(2) : "—"}</td>
                <td className="text-right px-4 py-3 tabular-nums">{s.sortino !== null ? s.sortino.toFixed(2) : "—"}</td>
                <td className={`text-right px-4 py-3 tabular-nums ${s.max_drawdown !== null ? "text-rose-600" : ""}`}>
                  {fmtPct(s.max_drawdown, 1)}
                </td>
                <td className={`text-right px-4 py-3 tabular-nums ${s.total_return !== null && s.total_return >= 0 ? "text-emerald-600" : s.total_return !== null ? "text-rose-600" : ""}`}>
                  {fmtPct(s.total_return, 1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </LiquidGlassCard>
  )
}
