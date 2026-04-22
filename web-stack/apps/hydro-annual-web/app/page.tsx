"use client"

import { useEffect, useState, type FormEvent } from "react"
import {
  SiteHeader,
  StatCard,
  LiquidGlassCard,
  RunProgress,
  SimpleTable,
  downloadFromBase64,
  formatBytes,
} from "@tlz/ui"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? ""

interface MetaInfo {
  name: string
  title: string
  icon: string
  description: string
  version: string
}

interface OptionsPayload {
  years: number[]
  cities: string[]
  tables: string[]
  stats?: { total: number; by_table: Record<string, number> }
}

interface TablePayload {
  columns: string[]
  rows: (string | number | boolean | null)[][]
  totalRows: number
}

interface ComputePayload {
  preview: {
    query: { table: string; years: number[]; cities: string[] }
    stats: { totalFiles: number; byTable: Record<string, number> }
  }
  meta: {
    rows: number
    cols: number
    filename: string
    elapsedMs: number
    xlsxBytes: number
  }
  results: Record<string, TablePayload>
  xlsxBase64: string
}

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

function cn(...xs: (string | false | null | undefined)[]): string {
  return xs.filter(Boolean).join(" ")
}

function downloadCsvFromTable(data: TablePayload, filename: string) {
  const esc = (v: unknown): string => {
    if (v === null || v === undefined) return ""
    const s = String(v)
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
  }
  const lines: string[] = [data.columns.map(esc).join(",")]
  for (const row of data.rows) lines.push(row.map(esc).join(","))
  // utf-8-sig BOM so Excel opens 中文 correctly
  const blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 30_000)
}

export default function HomePage() {
  const [meta, setMeta] = useState<MetaInfo | null>(null)
  const [metaError, setMetaError] = useState<string | null>(null)

  const [options, setOptions] = useState<OptionsPayload | null>(null)
  const [optionsError, setOptionsError] = useState<string | null>(null)

  const [table, setTable] = useState<string>("")
  const [years, setYears] = useState<Set<number>>(new Set())
  const [cities, setCities] = useState<Set<string>>(new Set())

  const [busy, setBusy] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ComputePayload | null>(null)

  useEffect(() => {
    fetch(`${API_BASE}/api/meta`)
      .then((r) => r.json())
      .then((m) => setMeta(m))
      .catch((e) => setMetaError(e instanceof Error ? e.message : String(e)))
  }, [])

  useEffect(() => {
    fetch(`${API_BASE}/api/options`)
      .then((r) => {
        if (!r.ok) throw new Error(`options ${r.status}`)
        return r.json() as Promise<OptionsPayload>
      })
      .then((opts) => {
        setOptions(opts)
        if (opts.tables.length > 0) setTable((prev) => prev || opts.tables[0]!)
        if (opts.years.length > 0) {
          setYears((prev) => (prev.size ? prev : new Set([opts.years[opts.years.length - 1]!])))
        }
        if (opts.cities.length > 0) {
          setCities((prev) => (prev.size ? prev : new Set([opts.cities[0]!])))
        }
      })
      .catch((e) => setOptionsError(e instanceof Error ? e.message : String(e)))
  }, [])

  function toggle<T>(set: Set<T>, v: T): Set<T> {
    const next = new Set(set)
    if (next.has(v)) next.delete(v)
    else next.add(v)
    return next
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!table) return setError("请选择数据表")
    if (years.size === 0) return setError("请至少选一个年份")
    if (cities.size === 0) return setError("请至少选一个市")

    setBusy(true)
    setResult(null)
    try {
      const qs = new URLSearchParams()
      qs.set("table", table)
      for (const y of years) qs.append("years", String(y))
      for (const c of cities) qs.append("cities", c)
      qs.set("fmt", "json")
      const url = `${API_BASE}/api/compute?${qs.toString()}`
      const r = await fetch(url)
      if (!r.ok) {
        const body = await r.text().catch(() => "")
        throw new Error(`HTTP ${r.status}: ${body.slice(0, 400)}`)
      }
      const data = (await r.json()) as ComputePayload
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  const firstSheet = result ? Object.keys(result.results)[0] : undefined
  const tableData = result && firstSheet ? result.results[firstSheet] : undefined

  return (
    <>
      <SiteHeader
        title="水资源年报"
        subtitle="浙江省水资源年报数据查询与导出（2019–2024）"
        badge={
          <span className="inline-flex items-center rounded-full bg-foreground/5 px-3 py-1 text-xs font-medium text-foreground/70">
            📊 · Next.js · hydro-annual
          </span>
        }
      />

      <main className="max-w-[1280px] mx-auto px-6 md:px-8 py-10 md:py-14 space-y-8">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            label="API 版本"
            value={meta?.version ?? "—"}
            hint={metaError ? "后端离线" : `/api/meta :${8614}`}
            trend={metaError ? "down" : "flat"}
          />
          <StatCard
            label="数据表"
            value={options ? String(options.tables.length) : "—"}
            hint={options ? `年份 ${options.years.length} · 市 ${options.cities.length}` : "加载中"}
          />
          <StatCard
            label="文件总数"
            value={options?.stats?.total != null ? String(options.stats.total) : "—"}
            hint="内置数据集"
          />
        </section>

        <LiquidGlassCard className="p-6 md:p-8">
          <div className="flex items-start justify-between gap-4 mb-5">
            <h2 className="text-lg font-semibold">Step 1 · 查询条件</h2>
            {!options && !optionsError && (
              <span className="text-xs text-[#86868b]">加载选项…</span>
            )}
          </div>

          {optionsError && (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 whitespace-pre-wrap break-words">
              选项加载失败：{optionsError}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2">数据表</label>
              <div className="flex gap-2 flex-wrap">
                {(options?.tables ?? []).map((t) => {
                  const active = table === t
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTable(t)}
                      className={cn(
                        "rounded-2xl border px-4 py-2.5 text-sm transition",
                        active
                          ? "border-foreground bg-foreground text-background font-medium"
                          : "border-input text-foreground hover:border-foreground/40",
                      )}
                    >
                      {t}
                    </button>
                  )
                })}
                {!options && <span className="text-xs text-[#86868b]">—</span>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                年份 <span className="text-xs text-[#86868b]">（可多选）</span>
              </label>
              <div className="flex gap-2 flex-wrap">
                {(options?.years ?? []).map((y) => {
                  const active = years.has(y)
                  return (
                    <button
                      key={y}
                      type="button"
                      onClick={() => setYears((s) => toggle(s, y))}
                      className={cn(
                        "rounded-2xl border px-3 py-1.5 text-sm transition",
                        active
                          ? "border-foreground bg-foreground text-background font-medium"
                          : "border-input text-foreground hover:border-foreground/40",
                      )}
                    >
                      {y}
                    </button>
                  )
                })}
                {!options && <span className="text-xs text-[#86868b]">—</span>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                市 <span className="text-xs text-[#86868b]">（可多选）</span>
              </label>
              <div className="flex gap-2 flex-wrap">
                {(options?.cities ?? []).map((c) => {
                  const active = cities.has(c)
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCities((s) => toggle(s, c))}
                      className={cn(
                        "rounded-2xl border px-3 py-1.5 text-sm transition",
                        active
                          ? "border-foreground bg-foreground text-background font-medium"
                          : "border-input text-foreground hover:border-foreground/40",
                      )}
                    >
                      {c}
                    </button>
                  )
                })}
                {!options && <span className="text-xs text-[#86868b]">—</span>}
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 whitespace-pre-wrap break-words">
                {error}
              </div>
            )}

            <RunProgress running={!!busy} estimatedSeconds={3} label="查询中" />
            <button
              type="submit"
              disabled={busy || !options}
              className="w-full inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "查询中…" : "查询"}
            </button>
          </form>
        </LiquidGlassCard>

        {result && tableData && (
          <LiquidGlassCard className="p-6 md:p-8 space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h2 className="text-lg font-semibold">Step 2 · 查询结果</h2>
              <div className="text-xs text-[#86868b] flex items-center gap-3 flex-wrap">
                <span>行 {result.meta.rows.toLocaleString()}</span>
                <span>·</span>
                <span>列 {result.meta.cols}</span>
                <span>·</span>
                <span>耗时 {(result.meta.elapsedMs / 1000).toFixed(2)} s</span>
                <span>·</span>
                <span>xlsx {formatBytes(result.meta.xlsxBytes)}</span>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() =>
                  downloadFromBase64(result.xlsxBase64, result.meta.filename, XLSX_MIME)
                }
                className="inline-flex items-center rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground transition hover:opacity-90"
              >
                📥 下载 XLSX
              </button>
              <button
                type="button"
                onClick={() =>
                  downloadCsvFromTable(tableData, result.meta.filename.replace(/\.xlsx$/, ".csv"))
                }
                className="inline-flex items-center rounded-full border border-foreground/20 bg-background/60 px-4 py-1.5 text-xs font-medium text-foreground transition hover:bg-background/80"
              >
                📥 下载 CSV
              </button>
              <span className="inline-flex items-center text-xs text-[#86868b]">
                命中 {result.preview.stats.totalFiles} 个文件
              </span>
            </div>

            <SimpleTable data={tableData} />
          </LiquidGlassCard>
        )}

        {!result && !busy && (
          <LiquidGlassCard className="p-6 md:p-8">
            <div className="text-sm text-[#86868b] space-y-2">
              <div>选择 <strong>数据表 / 年份 / 市</strong> 后点击「查询」：</div>
              <ol className="list-decimal pl-5 space-y-1 text-xs">
                <li>后端 <code className="rounded bg-foreground/10 px-1">GET /api/compute?fmt=json</code> 返回完整结果数据</li>
                <li>页面直接渲染结果表（可滚动），同时提供 XLSX / CSV 下载按钮</li>
                <li>sample 数据集中仅 <code className="rounded bg-foreground/10 px-1">社会经济指标 + 全省市 + 2024</code> 完整</li>
              </ol>
            </div>
          </LiquidGlassCard>
        )}
      </main>
    </>
  )
}
