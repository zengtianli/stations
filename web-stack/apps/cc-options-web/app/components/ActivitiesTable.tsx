"use client"

import { useEffect, useMemo, useState } from "react"
import { LiquidGlassCard } from "@tlz/ui"

type OptionSymbol = {
  ticker?: string
  strike_price?: number
  expiration_date?: string
  option_type?: string
} | null

type PlainSymbol = {
  symbol?: string
  raw_symbol?: string
  description?: string
} | null

type Activity = {
  id: string
  type: string
  trade_date: string | null
  settlement_date: string | null
  price: number | null
  units: number | null
  amount: number | null
  fee: number | null
  description: string | null
  option_symbol: OptionSymbol
  symbol: PlainSymbol
}

type Resp = {
  fetched_at: string | null
  count: number
  returned: number
  activities: Activity[]
}

const PAGE_SIZE = 15

const TYPE_OPTIONS = [
  "ALL",
  "SELL",
  "BUY",
  "OPTIONASSIGNMENT",
  "OPTIONEXPIRATION",
  "OPTIONEXERCISE",
  "DIVIDEND",
  "INTEREST",
  "FEE",
  "CONTRIBUTION",
  "WITHDRAWAL",
] as const

function fmtDate(s: string | null | undefined): string {
  if (!s) return "—"
  if (s.length >= 16 && s.includes("T")) return s.slice(0, 10) + " " + s.slice(11, 16)
  return s.slice(0, 10)
}

function fmtNum(v: number | null | undefined, digits = 2): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "—"
  return v.toLocaleString("en-US", { maximumFractionDigits: digits, minimumFractionDigits: digits })
}

function resolveSymbol(a: Activity): string {
  if (a.option_symbol?.ticker) return a.option_symbol.ticker.trim()
  if (a.symbol?.symbol) return a.symbol.symbol
  if (a.symbol?.raw_symbol) return a.symbol.raw_symbol
  return ""
}

function typeBadge(t: string): string {
  switch (t) {
    case "SELL": return "bg-amber-100 text-amber-800"
    case "BUY": return "bg-blue-100 text-blue-800"
    case "OPTIONASSIGNMENT":
    case "OPTIONEXERCISE":
      return "bg-rose-100 text-rose-800"
    case "OPTIONEXPIRATION": return "bg-stone-100 text-stone-700"
    case "DIVIDEND":
    case "INTEREST":
      return "bg-emerald-100 text-emerald-800"
    case "CONTRIBUTION": return "bg-indigo-100 text-indigo-800"
    case "WITHDRAWAL":
    case "FEE":
      return "bg-gray-200 text-gray-700"
    default: return "bg-gray-100 text-gray-700"
  }
}

export function ActivitiesTable() {
  const [data, setData] = useState<Resp | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<string>("ALL")
  const [page, setPage] = useState<number>(0)

  useEffect(() => {
    let cancelled = false
    fetch("/api/activities?limit=100")
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then((d: Resp) => { if (!cancelled) setData(d) })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : String(e)) })
    return () => { cancelled = true }
  }, [])

  const filtered = useMemo(() => {
    if (!data) return []
    return typeFilter === "ALL" ? data.activities : data.activities.filter((a) => a.type === typeFilter)
  }, [data, typeFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages - 1)
  const paged = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE)

  return (
    <LiquidGlassCard className="p-6">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <h2 className="text-xl font-semibold">历史交易流水</h2>
        <div className="flex items-center gap-2 text-xs">
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(0) }}
            className="rounded border border-foreground/10 bg-transparent px-2 py-1"
          >
            {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <span className="text-[#86868b]">
            {data ? `${filtered.length}/${data.count} 条 · 第 ${safePage + 1}/${totalPages} 页` : "—"}
          </span>
        </div>
      </div>

      {error && <div className="text-sm text-rose-700 mb-2">加载失败：{error}</div>}
      {!data && !error && <div className="text-sm text-[#86868b]">加载中…</div>}

      {data && paged.length === 0 && (
        <div className="text-sm text-[#86868b] py-6 text-center">无匹配记录</div>
      )}

      {data && paged.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="border-b border-foreground/10 text-[#86868b]">
                <tr>
                  <th className="text-left px-2 py-2 font-medium">时间</th>
                  <th className="text-left px-2 py-2 font-medium">类型</th>
                  <th className="text-left px-2 py-2 font-medium">标的</th>
                  <th className="text-right px-2 py-2 font-medium">价格</th>
                  <th className="text-right px-2 py-2 font-medium">数量</th>
                  <th className="text-right px-2 py-2 font-medium">金额</th>
                  <th className="text-left px-2 py-2 font-medium">说明</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-foreground/5">
                {paged.map((a) => (
                  <tr key={a.id} className="hover:bg-foreground/5">
                    <td className="px-2 py-2 tabular-nums whitespace-nowrap">{fmtDate(a.trade_date)}</td>
                    <td className="px-2 py-2">
                      <span className={`inline-flex rounded-full px-2 py-0.5 ${typeBadge(a.type)}`}>
                        {a.type}
                      </span>
                    </td>
                    <td className="px-2 py-2 font-mono whitespace-nowrap">{resolveSymbol(a)}</td>
                    <td className="text-right px-2 py-2 tabular-nums">{a.price ? `$${fmtNum(a.price)}` : "—"}</td>
                    <td className="text-right px-2 py-2 tabular-nums">{fmtNum(a.units, 0)}</td>
                    <td className={`text-right px-2 py-2 tabular-nums ${a.amount && a.amount > 0 ? "text-emerald-600" : a.amount && a.amount < 0 ? "text-rose-600" : ""}`}>
                      {a.amount !== null && a.amount !== undefined ? `${a.amount >= 0 ? "+" : "-"}$${fmtNum(Math.abs(a.amount))}` : "—"}
                    </td>
                    <td className="px-2 py-2 text-[#86868b] max-w-[280px]">
                      <div className="truncate" title={a.description ?? ""}>{a.description ?? ""}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-end gap-2 mt-3">
            <button
              onClick={() => setPage(Math.max(0, safePage - 1))}
              disabled={safePage === 0}
              className="px-3 py-1 text-xs rounded border border-foreground/10 hover:bg-foreground/5 disabled:opacity-40 disabled:pointer-events-none"
            >
              ‹ 上一页
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, safePage + 1))}
              disabled={safePage >= totalPages - 1}
              className="px-3 py-1 text-xs rounded border border-foreground/10 hover:bg-foreground/5 disabled:opacity-40 disabled:pointer-events-none"
            >
              下一页 ›
            </button>
          </div>
        </>
      )}
    </LiquidGlassCard>
  )
}
