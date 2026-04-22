"use client"

import {
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react"
import { cn } from "../lib/utils"
import { LiquidGlassCard } from "./liquid-glass-card"

export interface QueryFormOptions {
  years: number[]
  cities: string[]
  tables: string[]
}

export interface QueryFormProps {
  /** Absolute base like `http://127.0.0.1:8614` or empty string for same-origin. */
  apiBase: string
  /** GET endpoint to fetch options. Called on mount. */
  optionsPath?: string
  /** GET endpoint for download. Params `table`, `years[]`, `cities[]`, `fmt`. */
  endpoint?: string
  /** Loader that returns option lists. If omitted, fetched from `{apiBase}{optionsPath}`. */
  fetchOptions?: () => Promise<QueryFormOptions>
  /** Submit button label. */
  runLabel?: string
  /** Prefix for result filename when server doesn't provide Content-Disposition filename. */
  resultPrefix?: string
  /** Optional right-rail footer slot. */
  footerSlot?: ReactNode
  /** Optional class override. */
  className?: string
}

type Busy = "options" | "download" | null

const FMT_OPTIONS = ["xlsx", "csv"] as const
type Fmt = (typeof FMT_OPTIONS)[number]

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(2)} MB`
}

function timestampSlug(): string {
  return new Date().toISOString().slice(0, 19).replace(/[-:T]/g, "")
}

function filenameFromDisposition(dispo: string | null, fallback: string): string {
  if (!dispo) return fallback
  const m = dispo.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i)
  if (!m) return fallback
  try {
    return decodeURIComponent(m[1]!)
  } catch {
    return m[1] ?? fallback
  }
}

/**
 * Query-style form: pick table + years + cities + fmt → GET → download blob.
 * No upload; options loaded from `/api/options` (or injected `fetchOptions`).
 * Used by hydro-annual which serves read-only built-in datasets.
 */
export function QueryForm({
  apiBase,
  optionsPath = "/api/options",
  endpoint = "/api/compute",
  fetchOptions,
  runLabel = "查询并下载",
  resultPrefix = "result",
  footerSlot,
  className,
}: QueryFormProps) {
  const [options, setOptions] = useState<QueryFormOptions | null>(null)
  const [optionsError, setOptionsError] = useState<string | null>(null)

  const [table, setTable] = useState<string>("")
  const [years, setYears] = useState<Set<number>>(new Set())
  const [cities, setCities] = useState<Set<string>>(new Set())
  const [fmt, setFmt] = useState<Fmt>("xlsx")

  const [busy, setBusy] = useState<Busy>(null)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<
    | { filename: string; size: number; seconds: number; rows?: string; cols?: string }
    | null
  >(null)

  useEffect(() => {
    let alive = true
    setBusy("options")
    const loader: () => Promise<QueryFormOptions> =
      fetchOptions ??
      (async () => {
        const r = await fetch(`${apiBase}${optionsPath}`)
        if (!r.ok) throw new Error(`options ${r.status}`)
        return (await r.json()) as QueryFormOptions
      })
    loader()
      .then((opts) => {
        if (!alive) return
        setOptions(opts)
        // Sensible defaults: first table, latest year, first city.
        if (opts.tables.length > 0) setTable((prev) => prev || opts.tables[0]!)
        if (opts.years.length > 0) {
          setYears((prev) => (prev.size ? prev : new Set([opts.years[opts.years.length - 1]!])))
        }
        if (opts.cities.length > 0) {
          setCities((prev) => (prev.size ? prev : new Set([opts.cities[0]!])))
        }
      })
      .catch((e) => {
        if (!alive) return
        setOptionsError(e instanceof Error ? e.message : String(e))
      })
      .finally(() => {
        if (alive) setBusy(null)
      })
    return () => {
      alive = false
    }
  }, [apiBase, optionsPath, fetchOptions])

  function toggle<T>(set: Set<T>, value: T): Set<T> {
    const next = new Set(set)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    return next
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!table) return setError("请选择数据表")
    if (years.size === 0) return setError("请至少选一个年份")
    if (cities.size === 0) return setError("请至少选一个市")

    setBusy("download")
    setResult(null)
    const started = performance.now()
    try {
      const qs = new URLSearchParams()
      qs.set("table", table)
      for (const y of years) qs.append("years", String(y))
      for (const c of cities) qs.append("cities", c)
      qs.set("fmt", fmt)
      const url = `${apiBase}${endpoint}?${qs.toString()}`
      const r = await fetch(url)
      if (!r.ok) {
        const body = await r.text().catch(() => "")
        throw new Error(`HTTP ${r.status}: ${body.slice(0, 400)}`)
      }
      const blob = await r.blob()
      const fallback = `${resultPrefix}_${timestampSlug()}.${fmt}`
      const filename = filenameFromDisposition(r.headers.get("Content-Disposition"), fallback)
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = blobUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      // Delay revoke so the browser has time to start the download.
      setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000)
      setResult({
        filename,
        size: blob.size,
        seconds: (performance.now() - started) / 1000,
        rows: r.headers.get("X-Rows") ?? undefined,
        cols: r.headers.get("X-Cols") ?? undefined,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className={cn("grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-6", className)}>
      <LiquidGlassCard className="p-6 md:p-8">
        <div className="flex items-start justify-between gap-4 mb-5">
          <h2 className="text-lg font-semibold">查询条件</h2>
          {busy === "options" && (
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

          <div>
            <label className="block text-sm font-medium mb-2">导出格式</label>
            <div className="flex gap-2 flex-wrap">
              {FMT_OPTIONS.map((f) => {
                const active = fmt === f
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFmt(f)}
                    className={cn(
                      "rounded-2xl border px-4 py-2.5 text-sm transition",
                      active
                        ? "border-foreground bg-foreground text-background font-medium"
                        : "border-input text-foreground hover:border-foreground/40",
                    )}
                  >
                    {f.toUpperCase()}
                  </button>
                )
              })}
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 whitespace-pre-wrap break-words">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy !== null || !options}
            className="w-full inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {busy === "download" ? "下载中…" : runLabel}
          </button>
        </form>
      </LiquidGlassCard>

      <LiquidGlassCard className="p-6 md:p-8">
        <h2 className="text-lg font-semibold mb-5">查询结果</h2>
        {!result && (
          <div className="text-[#86868b] text-sm">
            选择条件后点击 <strong>{runLabel}</strong>，浏览器将直接触发文件下载。后端{" "}
            <code className="rounded bg-foreground/10 px-1 text-xs">GET {endpoint}</code>{" "}
            以 query string 接收 <code className="rounded bg-foreground/10 px-1 text-xs">table</code>,
            <code className="rounded bg-foreground/10 px-1 text-xs"> years</code>,
            <code className="rounded bg-foreground/10 px-1 text-xs"> cities</code>,
            <code className="rounded bg-foreground/10 px-1 text-xs"> fmt</code>。
          </div>
        )}
        {result && (
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div className="col-span-2">
              <dt className="text-[#86868b]">已下载</dt>
              <dd className="mt-0.5 font-medium text-foreground break-all">{result.filename}</dd>
            </div>
            <div>
              <dt className="text-[#86868b]">文件大小</dt>
              <dd className="mt-0.5 font-medium text-foreground">{formatBytes(result.size)}</dd>
            </div>
            <div>
              <dt className="text-[#86868b]">耗时</dt>
              <dd className="mt-0.5 font-medium text-foreground">{result.seconds.toFixed(1)} s</dd>
            </div>
            {result.rows && (
              <div>
                <dt className="text-[#86868b]">行数</dt>
                <dd className="mt-0.5 font-medium text-foreground">{result.rows}</dd>
              </div>
            )}
            {result.cols && (
              <div>
                <dt className="text-[#86868b]">列数</dt>
                <dd className="mt-0.5 font-medium text-foreground">{result.cols}</dd>
              </div>
            )}
          </dl>
        )}
        {footerSlot && <div className="mt-6 pt-5 border-t border-foreground/5">{footerSlot}</div>}
      </LiquidGlassCard>
    </div>
  )
}

export default QueryForm
