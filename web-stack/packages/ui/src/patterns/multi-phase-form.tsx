"use client"

import {
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react"
import { cn } from "../lib/utils"
import { LiquidGlassCard } from "./liquid-glass-card"

export interface MultiPhaseFileInput {
  /** Form field name sent to the backend. */
  name: string
  /** UI label. */
  label: string
  /** `accept` attribute, e.g. `.xlsx` / `.geojson,application/geo+json` / `.csv` / `.zip`. */
  accept: string
  /** If true, submit disabled until this file is picked. */
  required?: boolean
  /** Optional hint/description shown under the label. */
  hint?: string
}

export interface MultiPhase {
  /** Stable id — used as key and badge. */
  id: string
  /** Tab label. */
  label: string
  /** POST endpoint path (path only, concat with apiBase). */
  endpoint: string
  /** File inputs in this phase. */
  inputs: readonly MultiPhaseFileInput[]
  /** Submit button label. Defaults to `运行 {label}`. */
  runLabel?: string
  /** Result filename prefix (without extension). Defaults to `phase_{id}`. */
  resultPrefix?: string
  /** Expected result extension (`xlsx` / `zip` / …). Defaults to `xlsx`. */
  resultExt?: string
  /** Optional description shown above the inputs. */
  description?: ReactNode
}

export interface MultiPhaseFormProps {
  apiBase: string
  phases: readonly MultiPhase[]
  /** Optional title above the phase tabs. */
  title?: string
  /** Optional right-rail footer slot (shown under result panel). */
  footerSlot?: ReactNode
  className?: string
}

interface PhaseResult {
  filename: string
  url: string
  size: number
  seconds: number
  status?: string
}

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
 * Multi-phase ETL form. Each phase is an independent upload-many-files →
 * POST multipart → download-one-file flow. Phases are rendered as a tab
 * strip; only the active phase's form is visible. Results / errors are
 * tracked per phase so switching tabs doesn't lose state.
 *
 * Designed for hydro-risk (3 phases), but generic enough for any ETL that
 * splits into independent stages sharing a visual frame.
 */
export function MultiPhaseForm({
  apiBase,
  phases,
  title = "多阶段 ETL",
  footerSlot,
  className,
}: MultiPhaseFormProps) {
  const [activeId, setActiveId] = useState<string>(phases[0]?.id ?? "")
  const [files, setFiles] = useState<Record<string, Record<string, File | null>>>({})
  const [busy, setBusy] = useState<string | null>(null) // phase id currently submitting
  const [errors, setErrors] = useState<Record<string, string | null>>({})
  const [results, setResults] = useState<Record<string, PhaseResult | null>>({})

  const active = phases.find((p) => p.id === activeId) ?? phases[0]

  function setFile(phaseId: string, fieldName: string, file: File | null) {
    setFiles((prev) => ({
      ...prev,
      [phaseId]: { ...(prev[phaseId] ?? {}), [fieldName]: file },
    }))
  }

  function phaseReady(p: MultiPhase): boolean {
    const picked = files[p.id] ?? {}
    for (const inp of p.inputs) {
      if (inp.required && !picked[inp.name]) return false
    }
    return true
  }

  async function submitPhase(p: MultiPhase, e: FormEvent) {
    e.preventDefault()
    if (!phaseReady(p)) {
      setErrors((prev) => ({ ...prev, [p.id]: "请先选择所有必填文件" }))
      return
    }
    setBusy(p.id)
    setErrors((prev) => ({ ...prev, [p.id]: null }))
    setResults((prev) => ({ ...prev, [p.id]: null }))
    const started = performance.now()
    try {
      const form = new FormData()
      const picked = files[p.id] ?? {}
      for (const inp of p.inputs) {
        const f = picked[inp.name]
        if (f) form.set(inp.name, f, f.name)
      }
      const r = await fetch(`${apiBase}${p.endpoint}`, { method: "POST", body: form })
      if (!r.ok) {
        const body = await r.text().catch(() => "")
        throw new Error(`HTTP ${r.status}: ${body.slice(0, 400)}`)
      }
      const blob = await r.blob()
      const ext = p.resultExt ?? "xlsx"
      const prefix = p.resultPrefix ?? `phase_${p.id}`
      const fallback = `${prefix}_${timestampSlug()}.${ext}`
      const filename = filenameFromDisposition(r.headers.get("Content-Disposition"), fallback)
      const url = URL.createObjectURL(blob)
      setResults((prev) => ({
        ...prev,
        [p.id]: {
          filename,
          url,
          size: blob.size,
          seconds: (performance.now() - started) / 1000,
          status: decodeURIComponent(r.headers.get("X-Scripts-Status") ?? "") || undefined,
        },
      }))
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        [p.id]: err instanceof Error ? err.message : String(err),
      }))
    } finally {
      setBusy(null)
    }
  }

  if (!active) {
    return (
      <LiquidGlassCard className={cn("p-6 md:p-8", className)}>
        <div className="text-sm text-[#86868b]">未配置任何 phase。</div>
      </LiquidGlassCard>
    )
  }

  const activeResult = results[active.id] ?? null
  const activeError = errors[active.id] ?? null
  const activeFiles = files[active.id] ?? {}

  return (
    <div className={cn("grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-6", className)}>
      <LiquidGlassCard className="p-6 md:p-8">
        <div className="flex items-start justify-between gap-4 mb-5">
          <h2 className="text-lg font-semibold">{title}</h2>
          <span className="text-xs text-[#86868b]">
            {phases.length} phase · 当前 <code className="rounded bg-foreground/10 px-1">{active.id}</code>
          </span>
        </div>

        <div className="flex gap-2 flex-wrap mb-5">
          {phases.map((p) => {
            const isActive = p.id === active.id
            const hasResult = !!results[p.id]
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setActiveId(p.id)}
                className={cn(
                  "rounded-2xl border px-4 py-2 text-sm transition",
                  isActive
                    ? "border-foreground bg-foreground text-background font-medium"
                    : "border-input text-foreground hover:border-foreground/40",
                )}
              >
                <span className="mr-1 text-xs opacity-70">{p.id}</span>
                {p.label}
                {hasResult && !isActive && <span className="ml-1 text-xs">✓</span>}
              </button>
            )
          })}
        </div>

        {active.description && (
          <div className="mb-5 text-xs text-[#86868b]">{active.description}</div>
        )}

        <form onSubmit={(e) => submitPhase(active, e)} className="space-y-5">
          {active.inputs.map((inp) => {
            const picked = activeFiles[inp.name] ?? null
            return (
              <div key={inp.name}>
                <label className="block text-sm font-medium mb-2">
                  {inp.label}
                  {inp.required && <span className="ml-1 text-rose-600">*</span>}
                </label>
                {inp.hint && <div className="mb-2 text-xs text-[#86868b]">{inp.hint}</div>}
                <input
                  type="file"
                  accept={inp.accept}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setFile(active.id, inp.name, e.target.files?.[0] ?? null)
                  }
                  className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-foreground file:text-background file:text-sm file:font-medium hover:file:opacity-90"
                />
                {picked && (
                  <div className="mt-1 text-xs text-[#86868b]">
                    已选：{picked.name} · {formatBytes(picked.size)}
                  </div>
                )}
              </div>
            )
          })}

          {activeError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 whitespace-pre-wrap break-words">
              {activeError}
            </div>
          )}

          <button
            type="submit"
            disabled={busy !== null || !phaseReady(active)}
            className="w-full inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {busy === active.id ? "计算中…" : active.runLabel ?? `运行 ${active.label}`}
          </button>
        </form>
      </LiquidGlassCard>

      <LiquidGlassCard className="p-6 md:p-8">
        <h2 className="text-lg font-semibold mb-5">
          {active.label} · 结果
        </h2>
        {!activeResult && (
          <div className="text-[#86868b] text-sm">
            该 phase 的结果将在计算完成后在此显示。后端{" "}
            <code className="rounded bg-foreground/10 px-1 text-xs">
              POST {active.endpoint}
            </code>{" "}
            返回 {active.resultExt ?? "xlsx"} blob。切换到其他 phase 不会丢失已计算的结果。
          </div>
        )}
        {activeResult && (
          <div className="space-y-4">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div className="col-span-2">
                <dt className="text-[#86868b]">输出文件</dt>
                <dd className="mt-0.5 font-medium text-foreground break-all">
                  {activeResult.filename}
                </dd>
              </div>
              <div>
                <dt className="text-[#86868b]">文件大小</dt>
                <dd className="mt-0.5 font-medium text-foreground">
                  {formatBytes(activeResult.size)}
                </dd>
              </div>
              <div>
                <dt className="text-[#86868b]">计算耗时</dt>
                <dd className="mt-0.5 font-medium text-foreground">
                  {activeResult.seconds.toFixed(1)} s
                </dd>
              </div>
              {activeResult.status && (
                <div className="col-span-2">
                  <dt className="text-[#86868b]">脚本状态</dt>
                  <dd className="mt-0.5 font-mono text-xs text-foreground break-all">
                    {activeResult.status}
                  </dd>
                </div>
              )}
            </dl>
            <a
              href={activeResult.url}
              download={activeResult.filename}
              className="inline-flex items-center justify-center rounded-full bg-[hsl(var(--track-accent))] px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
            >
              下载 {activeResult.filename}
            </a>
          </div>
        )}
        {footerSlot && <div className="mt-6 pt-5 border-t border-foreground/5">{footerSlot}</div>}
      </LiquidGlassCard>
    </div>
  )
}

export default MultiPhaseForm
