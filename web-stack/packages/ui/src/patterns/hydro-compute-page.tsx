"use client"

import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react"
import { SiteHeader } from "../shared/site-header"
import { LiquidGlassCard } from "./liquid-glass-card"
import { RunProgress } from "./run-progress"
import { StatCard } from "./stat-card"
import { cn } from "../lib/utils"

// ============================================================
// Types
// ============================================================

export interface TablePayload {
  columns: string[]
  rows: (string | number | boolean | null)[][]
  totalRows: number
}

export interface PreviewSectionDef {
  key: string
  label: string
  content: ReactNode
  defaultOpen?: boolean
}

export interface ResultTabDef {
  key: string
  label: string
  content: ReactNode
}

export interface StatCardDef {
  label: string
  value: string
  hint?: string
}

export type HydroParamField =
  | { name: string; label: string; kind: "tabs"; options: readonly string[]; default?: string }
  | { name: string; label: string; kind: "slider"; min: number; max: number; step: number; default?: number }
  | { name: string; label: string; kind: "number"; min?: number; max?: number; default?: number; placeholder?: string }
  | { name: string; label: string; kind: "checkbox"; default?: boolean }

export interface HydroComputePageConfig {
  /** Leave empty for same-origin (default; Next.js rewrites handle routing). Set only for cross-host overrides. */
  apiBase?: string
  title: string
  subtitle: string
  badge?: ReactNode

  /** Default "/api/compute". */
  computePath?: string
  /** Default "POST" for upload-mode, "GET" for query-mode. */
  method?: "POST" | "GET"
  /** xlsx = single xlsx upload · zip = single zip upload · query = no file · none = trigger only. */
  uploadMode: "xlsx" | "zip" | "query" | "none"
  /** File input accept attribute. Inferred from uploadMode if absent. */
  accept?: string

  runLabel: string
  /** Prefix for downloaded filename, e.g. "hydro-capacity_result". */
  resultPrefix: string
  /** Typical compute duration in seconds — drives RunProgress bar. */
  estimatedSeconds: number

  /** Optional form fields. Rendered in order above the Run button. */
  paramFields?: HydroParamField[]

  /** Relative path for sample download button. null = hide. Default "/api/sample". */
  samplePath?: string | null

  /** Controls MIME & extension of the download button. */
  resultKind: "xlsx" | "zip" | "csv"

  /** Custom preview renderer. If absent, auto-render `preview.*` keys using SimpleTable where shape matches. */
  renderPreview?: (preview: unknown) => PreviewSectionDef[]
  /** Custom result tabs renderer. If absent, auto-render `results.<sheet>` as tabs. */
  renderResults?: (results: unknown) => ResultTabDef[]
  /** Optional chart area rendered after tabs. */
  renderCharts?: (charts: unknown, meta: unknown) => ReactNode
  /** Stat cards summary. Defaults to elapsedMs / xlsxBytes derived if absent. */
  statCards?: (meta: unknown) => StatCardDef[]
}

// ============================================================
// Helpers (public — re-exported for per-site customization)
// ============================================================

const MIME = {
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  zip: "application/zip",
  csv: "text/csv",
} as const

const EXT = { xlsx: "xlsx", zip: "zip", csv: "csv" } as const

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(2)} MB`
}

export function formatCell(v: unknown): string {
  if (v === null || v === undefined) return "—"
  if (typeof v === "number") {
    if (Number.isInteger(v)) return v.toString()
    return v.toFixed(Math.abs(v) < 1 ? 4 : 2)
  }
  if (typeof v === "string" && v.length >= 19 && v.includes("T")) return v.slice(0, 10)
  return String(v)
}

export function timestampSlug(): string {
  return new Date().toISOString().slice(0, 19).replace(/[-:T]/g, "")
}

export function downloadFromBase64(b64: string, filename: string, mime: string): void {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  const blob = new Blob([bytes], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function isTablePayload(x: unknown): x is TablePayload {
  return (
    !!x &&
    typeof x === "object" &&
    Array.isArray((x as TablePayload).columns) &&
    Array.isArray((x as TablePayload).rows) &&
    typeof (x as TablePayload).totalRows === "number"
  )
}

// ============================================================
// SimpleTable — exported so pages needing custom renderPreview / renderResults can reuse
// ============================================================

export interface SimpleTableProps {
  data: TablePayload
  /** Clip rendered rows (original totalRows preserved for "共 N 行" hint). */
  limit?: number
}

export function SimpleTable({ data, limit }: SimpleTableProps) {
  const displayRows = limit != null ? data.rows.slice(0, limit) : data.rows
  const truncated = displayRows.length < data.totalRows
  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-lg border border-foreground/10 max-h-[480px] overflow-y-auto">
        <table className="min-w-full text-xs">
          <thead className="bg-foreground/5 sticky top-0">
            <tr>
              {data.columns.map((c) => (
                <th key={c} className="px-3 py-2 text-left font-medium whitespace-nowrap">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, i) => (
              <tr key={i} className="border-t border-foreground/5 hover:bg-foreground/[0.02]">
                {row.map((cell, j) => (
                  <td key={j} className="px-3 py-1.5 whitespace-nowrap">
                    {formatCell(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {truncated && (
        <div className="text-xs text-[#86868b]">
          共 {data.totalRows.toLocaleString()} 行，展示前 {displayRows.length} 行（完整数据请下载）
        </div>
      )}
    </div>
  )
}

// ============================================================
// Default renderers (used when config doesn't override)
// ============================================================

function defaultRenderPreview(preview: unknown): PreviewSectionDef[] {
  if (!preview || typeof preview !== "object") return []
  const sections: PreviewSectionDef[] = []
  for (const [key, value] of Object.entries(preview as Record<string, unknown>)) {
    let content: ReactNode
    let hintCount: number | undefined
    if (isTablePayload(value)) {
      content = <SimpleTable data={value} />
      hintCount = value.totalRows
    } else if (Array.isArray(value)) {
      hintCount = value.length
      content = (
        <pre className="text-xs whitespace-pre-wrap text-[#86868b] max-h-64 overflow-auto">
          {JSON.stringify(value, null, 2)}
        </pre>
      )
    } else if (value && typeof value === "object") {
      content = (
        <pre className="text-xs whitespace-pre-wrap text-[#86868b] max-h-64 overflow-auto">
          {JSON.stringify(value, null, 2)}
        </pre>
      )
    } else {
      content = <span className="text-xs text-[#86868b]">{String(value)}</span>
    }
    sections.push({
      key,
      label: hintCount != null ? `${key}（${hintCount}）` : key,
      content,
      defaultOpen: sections.length === 0,
    })
  }
  return sections
}

function defaultRenderResults(results: unknown): ResultTabDef[] {
  if (!results || typeof results !== "object") return []
  const out: ResultTabDef[] = []
  for (const [key, value] of Object.entries(results as Record<string, unknown>)) {
    if (isTablePayload(value)) {
      out.push({ key, label: key, content: <SimpleTable data={value} /> })
    }
  }
  return out
}

function defaultStatCards(meta: unknown): StatCardDef[] {
  if (!meta || typeof meta !== "object") return []
  const m = meta as Record<string, unknown>
  const cards: StatCardDef[] = []
  if (typeof m.elapsedMs === "number") {
    cards.push({ label: "耗时", value: `${(m.elapsedMs / 1000).toFixed(1)} s` })
  }
  const sizeBytes = typeof m.xlsxBytes === "number" ? m.xlsxBytes : typeof m.zipBytes === "number" ? m.zipBytes : undefined
  if (sizeBytes != null) {
    cards.push({ label: "结果大小", value: formatBytes(sizeBytes) })
  }
  return cards
}

// ============================================================
// ParamField control
// ============================================================

function ParamFieldControl({
  field,
  value,
  onChange,
}: {
  field: HydroParamField
  value: unknown
  onChange: (v: unknown) => void
}) {
  if (field.kind === "tabs") {
    return (
      <div>
        <label className="block text-sm font-medium mb-2">{field.label}</label>
        <div className="flex gap-2 flex-wrap">
          {field.options.map((opt) => {
            const active = value === opt
            return (
              <button
                key={opt}
                type="button"
                onClick={() => onChange(opt)}
                className={cn(
                  "rounded-2xl border px-4 py-2.5 text-sm transition",
                  active
                    ? "border-foreground bg-foreground text-background font-medium"
                    : "border-input text-foreground hover:border-foreground/40",
                )}
              >
                {opt}
              </button>
            )
          })}
        </div>
      </div>
    )
  }
  if (field.kind === "slider") {
    return (
      <div>
        <label className="flex justify-between text-sm font-medium mb-2">
          <span>{field.label}</span>
          <span className="font-mono text-xs">{typeof value === "number" ? value : field.default}</span>
        </label>
        <input
          type="range"
          min={field.min}
          max={field.max}
          step={field.step}
          value={typeof value === "number" ? value : field.default ?? field.min}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full"
        />
      </div>
    )
  }
  if (field.kind === "number") {
    return (
      <div>
        <label className="block text-sm font-medium mb-2">{field.label}</label>
        <input
          type="number"
          min={field.min}
          max={field.max}
          value={value == null ? "" : String(value)}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
        />
      </div>
    )
  }
  // checkbox
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
      <span>{field.label}</span>
    </label>
  )
}

// ============================================================
// HydroComputePage — main component
// ============================================================

interface MetaInfo {
  name?: string
  title?: string
  icon?: string
  description?: string
  version?: string
}

export interface HydroComputePageProps {
  config: HydroComputePageConfig
}

export function HydroComputePage({ config }: HydroComputePageProps) {
  const apiBase = config.apiBase ?? ""
  const computePath = config.computePath ?? "/api/compute"
  const method = config.method ?? (config.uploadMode === "query" ? "GET" : "POST")
  const samplePath =
    config.samplePath === null ? null : config.samplePath ?? "/api/sample"
  const accept =
    config.accept ??
    (config.uploadMode === "xlsx"
      ? ".xlsx,.xlsm,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      : config.uploadMode === "zip"
        ? ".zip,application/zip"
        : "")

  const [meta, setMeta] = useState<MetaInfo | null>(null)
  const [metaError, setMetaError] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [paramValues, setParamValues] = useState<Record<string, unknown>>(() => {
    const init: Record<string, unknown> = {}
    for (const f of config.paramFields ?? []) init[f.name] = f.default
    return init
  })
  const [busy, setBusy] = useState<"sample" | "compute" | null>(null)
  const [result, setResult] = useState<
    | ({
        preview?: unknown
        meta?: unknown
        results?: unknown
        charts?: unknown
        xlsxBase64?: string
        zipBase64?: string
        csvBase64?: string
      } & Record<string, unknown>)
    | null
  >(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState(0)

  useEffect(() => {
    fetch(`${apiBase}/api/meta`)
      .then((r) => r.json())
      .then((m: MetaInfo) => setMeta(m))
      .catch((e) => setMetaError(e instanceof Error ? e.message : String(e)))
  }, [apiBase])

  async function downloadSample() {
    if (!samplePath) return
    setBusy("sample")
    setError(null)
    try {
      const r = await fetch(`${apiBase}${samplePath}`)
      if (!r.ok) throw new Error(`sample ${r.status}`)
      const blob = await r.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${config.resultPrefix}_sample.${EXT[config.resultKind]}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(null)
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (config.uploadMode !== "query" && config.uploadMode !== "none" && !file) {
      setError("请先选择输入文件")
      return
    }
    setBusy("compute")
    setError(null)
    setResult(null)
    try {
      let r: Response
      if (method === "GET") {
        const params = new URLSearchParams()
        for (const [k, v] of Object.entries(paramValues)) {
          if (v === undefined || v === null || v === "") continue
          if (Array.isArray(v)) for (const item of v) params.append(k, String(item))
          else params.append(k, String(v))
        }
        params.set("fmt", "json")
        r = await fetch(`${apiBase}${computePath}?${params.toString()}`)
      } else {
        const form = new FormData()
        if (file) form.set("file", file, file.name)
        for (const [k, v] of Object.entries(paramValues)) {
          if (v === undefined || v === null) continue
          if (typeof v === "boolean") form.set(k, v ? "true" : "false")
          else form.set(k, String(v))
        }
        form.set("format", "json")
        r = await fetch(`${apiBase}${computePath}`, { method: "POST", body: form })
      }
      if (!r.ok) {
        const body = await r.text().catch(() => "")
        throw new Error(`HTTP ${r.status}: ${body.slice(0, 400)}`)
      }
      const data = await r.json()
      setResult(data)
      setActiveTab(0)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(null)
    }
  }

  function handleDownload() {
    if (!result) return
    const b64 =
      result.xlsxBase64 ?? result.zipBase64 ?? result.csvBase64 ?? null
    if (!b64) return
    downloadFromBase64(
      b64,
      `${config.resultPrefix}_${timestampSlug()}.${EXT[config.resultKind]}`,
      MIME[config.resultKind],
    )
  }

  const previewSections = result
    ? config.renderPreview?.(result.preview) ?? defaultRenderPreview(result.preview)
    : []
  const resultTabs = result
    ? config.renderResults?.(result.results) ?? defaultRenderResults(result.results)
    : []
  const stats = result
    ? config.statCards?.(result.meta) ?? defaultStatCards(result.meta)
    : []
  const charts: ReactNode = result && config.renderCharts
    ? config.renderCharts(result.charts ?? {}, result.meta)
    : null

  const needsFile = config.uploadMode !== "query" && config.uploadMode !== "none"

  return (
    <>
      <SiteHeader title={config.title} subtitle={config.subtitle} badge={config.badge} />

      <main className="max-w-[1280px] mx-auto px-6 md:px-8 py-10 md:py-14 space-y-8">
        {/* Top meta cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            label="API 版本"
            value={meta?.version ?? "—"}
            hint={metaError ? "后端离线" : meta?.title ?? ""}
            trend={metaError ? "down" : "flat"}
          />
          <StatCard label="名称" value={meta?.name ?? "—"} hint={meta?.description} />
          <StatCard label="图标" value={meta?.icon ?? "🌊"} hint={config.title} />
        </section>

        {/* Step 1 · Input + Run */}
        <LiquidGlassCard className="p-6 md:p-8">
          <div className="flex items-start justify-between gap-4 mb-5">
            <h2 className="text-lg font-semibold">
              Step 1 · {config.uploadMode === "query" ? "查询条件" : "上传输入文件"}
            </h2>
            {samplePath && needsFile && (
              <button
                type="button"
                onClick={downloadSample}
                disabled={busy !== null}
                className="inline-flex items-center rounded-full border border-foreground/20 bg-background/60 px-3 py-1 text-xs font-medium text-foreground transition hover:bg-background/80 disabled:opacity-50"
              >
                {busy === "sample" ? "下载中…" : "下载示例输入"}
              </button>
            )}
          </div>
          <form onSubmit={onSubmit} className="space-y-5">
            {needsFile && (
              <div>
                <label className="block text-sm font-medium mb-2">输入文件</label>
                <input
                  type="file"
                  accept={accept}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setFile(e.target.files?.[0] ?? null)
                  }
                  className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-foreground file:text-background file:text-sm file:font-medium hover:file:opacity-90"
                />
                {file && (
                  <div className="mt-2 text-xs text-[#86868b]">
                    已选：{file.name} · {formatBytes(file.size)}
                  </div>
                )}
              </div>
            )}
            {(config.paramFields ?? []).map((field) => (
              <ParamFieldControl
                key={field.name}
                field={field}
                value={paramValues[field.name]}
                onChange={(v) => setParamValues((prev) => ({ ...prev, [field.name]: v }))}
              />
            ))}
            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 whitespace-pre-wrap break-words">
                {error}
              </div>
            )}
            <RunProgress
              running={busy === "compute"}
              estimatedSeconds={config.estimatedSeconds}
            />
            <button
              type="submit"
              disabled={busy !== null || (needsFile && !file)}
              className="w-full inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {busy === "compute" ? "计算中…" : config.runLabel}
            </button>
          </form>
        </LiquidGlassCard>

        {/* Step 2 · Preview (optional) */}
        {result && previewSections.length > 0 && (
          <LiquidGlassCard className="p-6 md:p-8 space-y-3">
            <h2 className="text-lg font-semibold">Step 2 · 数据预览</h2>
            {previewSections.map((sec) => (
              <details
                key={sec.key}
                open={sec.defaultOpen}
                className="rounded-lg border border-foreground/10"
              >
                <summary className="cursor-pointer select-none px-4 py-2.5 text-sm font-medium">
                  {sec.label}
                </summary>
                <div className="p-4 pt-0">{sec.content}</div>
              </details>
            ))}
          </LiquidGlassCard>
        )}

        {/* Step 3 · Results */}
        {result && (
          <LiquidGlassCard className="p-6 md:p-8 space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h2 className="text-lg font-semibold">Step 3 · 计算结果</h2>
              <div className="flex items-center gap-3 text-xs text-[#86868b] flex-wrap">
                {stats.map((s, i) => (
                  <span key={i}>
                    {s.label} <span className="font-medium text-foreground">{s.value}</span>
                  </span>
                ))}
                {(result.xlsxBase64 || result.zipBase64 || result.csvBase64) && (
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="ml-2 inline-flex items-center rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground transition hover:opacity-90"
                  >
                    📥 下载 {config.resultKind.toUpperCase()}
                  </button>
                )}
              </div>
            </div>

            {resultTabs.length > 0 && (
              <>
                <div className="flex gap-1 flex-wrap border-b border-foreground/10">
                  {resultTabs.map((tab, i) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(i)}
                      className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${
                        activeTab === i
                          ? "border-b-2 border-primary text-foreground -mb-px"
                          : "text-[#86868b] hover:text-foreground"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                {(() => {
                  const current = resultTabs[activeTab]
                  return current ? <div>{current.content}</div> : null
                })()}
              </>
            )}

            {charts && <div className="mt-6">{charts}</div>}
          </LiquidGlassCard>
        )}

        {/* Placeholder */}
        {!result && busy !== "compute" && (
          <LiquidGlassCard className="p-6 md:p-8">
            <div className="text-sm text-[#86868b]">
              {config.uploadMode === "query"
                ? "填写查询条件，点击运行按钮开始。"
                : "上传输入文件并点击运行，结果将分 Step 2 / Step 3 展示 + 可下载完整文件。"}
            </div>
          </LiquidGlassCard>
        )}
      </main>
    </>
  )
}
