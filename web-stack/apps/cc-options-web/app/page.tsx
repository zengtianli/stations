"use client"

import { useEffect, useState } from "react"
import { SiteHeader, LiquidGlassCard } from "@tlz/ui"
import type {
  Current,
  EquityRow,
  PerfMetricsResp,
  RollSignalsResp,
  ScenariosResp,
  SummaryResp,
  TwrResp,
} from "./types"
import { fmtMoney } from "./types"
import { RangeProvider, useRange } from "./providers/RangeProvider"
import { AssetStructureSection } from "./components/AssetStructureSection"
import { IncomeSection } from "./components/IncomeSection"
import { RiskSection } from "./components/RiskSection"
import { NLVChart } from "./components/NLVChart"
import { PerformanceMetricsTable } from "./components/PerformanceMetricsTable"
import { ReturnBarChart } from "./components/ReturnBarChart"
import { OptionsSection } from "./components/OptionsSection"
import { ActivitiesTable } from "./components/ActivitiesTable"
import { RefreshButton } from "./components/RefreshButton"

type Position = {
  symbol: { symbol: { symbol?: string; description?: string } }
  price?: number
  units?: number
  open_pnl?: number
  average_purchase_price?: number
}

type Portfolio = {
  ts: string
  accounts: Array<{
    name: string
    number: string
    institution: string
    total_value?: { value: number; currency: string }
    balances: Array<{ cash: number; buying_power: number }>
    positions: Position[]
  }>
}

function formatAsOf(portfolioTs: string | null, rows: EquityRow[] | null): string | null {
  if (portfolioTs) {
    // SnapTrade ts is local ISO "YYYY-MM-DDTHH:MM:SS" — show to the minute.
    const m = portfolioTs.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/)
    if (m) return `${m[1]} ${m[2]}`
    return portfolioTs
  }
  return rows && rows.length > 0 ? rows[rows.length - 1]!.date : null
}

export default function HomePage() {
  return (
    <RangeProvider initial="YTD">
      <HomeInner />
    </RangeProvider>
  )
}

function HomeInner() {
  const { startDate } = useRange()
  const [cur, setCur] = useState<Current | null>(null)
  const [rows, setRows] = useState<EquityRow[] | null>(null)
  const [perf, setPerf] = useState<PerfMetricsResp | null>(null)
  const [twr, setTwr] = useState<TwrResp | null>(null)
  const [signals, setSignals] = useState<RollSignalsResp | null>(null)
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [summary, setSummary] = useState<SummaryResp | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Base fetches — run once
  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetch("/api/scenarios?days=0").then((r) => { if (!r.ok) throw new Error(`scenarios: HTTP ${r.status}`); return r.json() }),
      fetch("/api/equity-curve").then((r) => { if (!r.ok) throw new Error(`equity-curve: HTTP ${r.status}`); return r.json() }),
      fetch("/api/roll-signals").then((r) => { if (!r.ok) throw new Error(`roll-signals: HTTP ${r.status}`); return r.json() }),
      fetch("/api/portfolio").then((r) => { if (!r.ok) throw new Error(`portfolio: HTTP ${r.status}`); return r.json() }),
      fetch("/api/summary").then((r) => { if (!r.ok) throw new Error(`summary: HTTP ${r.status}`); return r.json() }),
    ])
      .then(([s, c, rs, port, sum]) => {
        if (cancelled) return
        setCur((s as ScenariosResp).current)
        setRows((c as { rows: EquityRow[] }).rows)
        setSignals(rs as RollSignalsResp)
        setPortfolio(port as Portfolio)
        setSummary(sum as SummaryResp)
      })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : String(e)) })
    return () => { cancelled = true }
  }, [])

  // Perf-metrics + TWR — refetch when global range changes
  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetch(`/api/perf-metrics?start=${startDate}`).then((r) => { if (!r.ok) throw new Error(`perf-metrics: HTTP ${r.status}`); return r.json() }),
      fetch(`/api/twr?start=${startDate}`).then((r) => { if (!r.ok) throw new Error(`twr: HTTP ${r.status}`); return r.json() }),
    ])
      .then(([p, t]) => {
        if (cancelled) return
        setPerf(p as PerfMetricsResp)
        setTwr(t as TwrResp)
      })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : String(e)) })
    return () => { cancelled = true }
  }, [startDate])

  const account = portfolio?.accounts?.[0]
  const positions: Position[] = account?.positions ?? []
  const ccSharpe = perf?.strategies.find((s) => s.label === "CC 实盘")?.sharpe ?? null
  const asOf = formatAsOf(summary?.portfolio_ts ?? null, rows)

  return (
    <>
      <SiteHeader
        title="QQQ CC Dashboard"
        subtitle="Covered Call 期权仪表盘 · 每日收盘 17:00 刷新"
        badge={
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-foreground/5 px-3 py-1 text-xs font-medium text-foreground/70">
              {asOf ? `as of ${asOf}` : "loading"}
            </span>
            <RefreshButton />
          </div>
        }
      />

      <main className="max-w-[1280px] mx-auto px-6 md:px-8 py-10 md:py-14 space-y-12">
        {error && (
          <LiquidGlassCard className="p-6 border-rose-200 bg-rose-50/50">
            <div className="text-sm text-rose-700">
              后端离线：{error}。先跑 <code className="rounded bg-foreground/10 px-1">CC_OPTIONS_DATA_DIR=~/Dev/stations/cc-options/data uv run uvicorn api:app --port 8621</code>
            </div>
          </LiquidGlassCard>
        )}

        {cur && <AssetStructureSection cur={cur} summary={summary} />}
        {cur && <IncomeSection cur={cur} sharpe={ccSharpe} />}
        {cur && <RiskSection cur={cur} />}

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">绩效对比 <span className="text-xs text-[#86868b] font-normal">· CC 实盘 vs SPY / QQQ / TQQQ</span></h2>
          <NLVChart data={twr} />
          <PerformanceMetricsTable data={perf} />
        </section>

        <ReturnBarChart rows={rows} />

        {cur && <OptionsSection cur={cur} signals={signals} />}

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">持仓</h2>
            <span className="text-xs text-[#86868b]">
              {account ? `${account.institution} · ${account.name} · ${account.number}` : "loading"}
            </span>
          </div>
          {portfolio === null && !error && (
            <LiquidGlassCard className="p-10 text-center text-[#86868b]">加载中…</LiquidGlassCard>
          )}
          {portfolio && positions.length === 0 && (
            <LiquidGlassCard className="p-10 text-center text-[#86868b]">无持仓数据</LiquidGlassCard>
          )}
          {portfolio && positions.length > 0 && (
            <LiquidGlassCard className="overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-foreground/10 text-[#86868b]">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Symbol</th>
                    <th className="text-right px-4 py-3 font-medium">Shares</th>
                    <th className="text-right px-4 py-3 font-medium">Price</th>
                    <th className="text-right px-4 py-3 font-medium">Avg Cost</th>
                    <th className="text-right px-4 py-3 font-medium">Market Value</th>
                    <th className="text-right px-4 py-3 font-medium">Open PnL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-foreground/5">
                  {positions.map((p, i) => {
                    const sym = p.symbol?.symbol?.symbol ?? "?"
                    const desc = p.symbol?.symbol?.description ?? ""
                    const units = p.units ?? 0
                    const price = p.price ?? 0
                    const avg = p.average_purchase_price ?? 0
                    const mv = units * price
                    const pnl = p.open_pnl ?? 0
                    return (
                      <tr key={i} className="hover:bg-foreground/5">
                        <td className="px-4 py-3">
                          <div className="font-medium">{sym}</div>
                          <div className="text-[11px] text-[#86868b] line-clamp-1">{desc}</div>
                        </td>
                        <td className="text-right px-4 py-3 tabular-nums">{fmtMoney(units, 0)}</td>
                        <td className="text-right px-4 py-3 tabular-nums">${fmtMoney(price, 2)}</td>
                        <td className="text-right px-4 py-3 tabular-nums">${fmtMoney(avg, 2)}</td>
                        <td className="text-right px-4 py-3 tabular-nums">${fmtMoney(mv, 0)}</td>
                        <td className={`text-right px-4 py-3 tabular-nums ${pnl >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                          {pnl >= 0 ? "+" : ""}${fmtMoney(pnl, 0)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </LiquidGlassCard>
          )}
        </section>

        <ActivitiesTable />

        <section className="text-xs text-[#86868b] pt-6 border-t border-foreground/10">
          <p>
            数据源：本地 LaunchAgent 17:00 触发 <code className="rounded bg-foreground/10 px-1">daily_update.sh</code>，
            产出 → <code className="rounded bg-foreground/10 px-1">sync-data.sh</code> 白名单 rsync 到 VPS。
            凭证永不上 VPS。
          </p>
        </section>
      </main>
    </>
  )
}
