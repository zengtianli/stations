"use client"

import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react"
import { cn } from "../lib/utils"
import { LiquidGlassCard } from "./liquid-glass-card"

export interface ZipComputeParam {
  name: string
  label: string
  options: readonly string[]
  default?: string
}

export interface ZipComputeHeader {
  key: string
  label: string
}

export interface ZipComputeResult {
  filename: string
  url: string
  size: number
  seconds: number
  headers: Record<string, string>
}

export interface ZipComputeFormProps {
  /** Absolute base like `http://127.0.0.1:8615` or empty string for same-origin. */
  apiBase: string
  /** POST endpoint path, defaults to `/api/compute`. */
  computePath?: string
  /** GET endpoint that returns a sample input zip. Pass `null` to hide the button. */
  samplePath?: string | null
  /** Label for the submit button. */
  runLabel?: string
  /** Prefix for the generated result filename (will be suffixed with timestamp + `.zip`). */
  resultPrefix?: string
  /** File input `accept` attribute, defaults to zip. */
  accept?: string
  /** Extra multipart form fields (dropdowns). Rendered as tab-style buttons. */
  params?: readonly ZipComputeParam[]
  /** Which response headers to surface in the result panel (values will be `decodeURIComponent`-ed). */
  headers?: readonly ZipComputeHeader[]
  /** Optional right-rail slot rendered below the result panel. */
  footerSlot?: ReactNode
  /** Optional class override. */
  className?: string
}

type Busy = "sample" | "compute" | null

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(2)} MB`
}

function timestampSlug(): string {
  return new Date().toISOString().slice(0, 19).replace(/[-:T]/g, "")
}

/**
 * Upload-zip → POST multipart → download-zip flow. Mirror of
 * {@link XlsxComputeForm} for hydro-* pipelines that ship zipped
 * txt bundles in and zipped result sets out (irrigation / district /
 * rainfall). Default assumptions:
 *   - Field name for file upload is `file`.
 *   - Extra params are submitted as matching form fields.
 *   - Response is a zip blob; CJK metadata comes back via headers
 *     as URL-encoded strings.
 */
export function ZipComputeForm({
  apiBase,
  computePath = "/api/compute",
  samplePath = "/api/sample",
  runLabel = "运行计算",
  resultPrefix = "result",
  accept = ".zip,application/zip",
  params = [],
  headers = [],
  footerSlot,
  className,
}: ZipComputeFormProps) {
  const [file, setFile] = useState<File | null>(null)
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(params.map((p) => [p.name, p.default ?? p.options[0] ?? ""])),
  )
  const [busy, setBusy] = useState<Busy>(null)
  const [result, setResult] = useState<ZipComputeResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setValues(Object.fromEntries(params.map((p) => [p.name, p.default ?? p.options[0] ?? ""])))
  }, [params])

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
      a.download = `${resultPrefix}_sample_input.zip`
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

  async function onCompute(e: FormEvent) {
    e.preventDefault()
    if (!file) {
      setError("请先选择输入 ZIP")
      return
    }
    setBusy("compute")
    setError(null)
    setResult(null)
    const started = performance.now()
    try {
      const form = new FormData()
      form.set("file", file, file.name)
      for (const p of params) {
        form.set(p.name, values[p.name] ?? p.default ?? "")
      }
      const r = await fetch(`${apiBase}${computePath}`, { method: "POST", body: form })
      if (!r.ok) {
        const body = await r.text().catch(() => "")
        throw new Error(`HTTP ${r.status}: ${body.slice(0, 400)}`)
      }
      const blob = await r.blob()
      const url = URL.createObjectURL(blob)
      const decoded: Record<string, string> = {}
      for (const h of headers) {
        decoded[h.key] = decodeURIComponent(r.headers.get(h.key) ?? "")
      }
      setResult({
        filename: `${resultPrefix}_${timestampSlug()}.zip`,
        url,
        size: blob.size,
        seconds: (performance.now() - started) / 1000,
        headers: decoded,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className={cn("grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-6", className)}>
      <LiquidGlassCard className="p-6 md:p-8">
        <div className="flex items-start justify-between gap-4 mb-5">
          <h2 className="text-lg font-semibold">参数 &amp; 运行</h2>
          {samplePath && (
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

        <form onSubmit={onCompute} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">输入 ZIP</label>
            <input
              type="file"
              accept={accept}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-foreground file:text-background file:text-sm file:font-medium hover:file:opacity-90"
            />
            {file && (
              <div className="mt-2 text-xs text-[#86868b]">
                已选：{file.name} · {formatBytes(file.size)}
              </div>
            )}
          </div>

          {params.map((p) => (
            <div key={p.name}>
              <label className="block text-sm font-medium mb-2">{p.label}</label>
              <div className="flex gap-2 flex-wrap">
                {p.options.map((opt) => {
                  const active = values[p.name] === opt
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setValues((v) => ({ ...v, [p.name]: opt }))}
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
          ))}

          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 whitespace-pre-wrap break-words">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!file || busy !== null}
            className="w-full inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {busy === "compute" ? "计算中…" : runLabel}
          </button>
        </form>
      </LiquidGlassCard>

      <LiquidGlassCard className="p-6 md:p-8">
        <h2 className="text-lg font-semibold mb-5">计算结果</h2>
        {!result && (
          <div className="text-[#86868b] text-sm">
            提交后在此显示识别到的元数据与下载入口。后端{" "}
            <code className="rounded bg-foreground/10 px-1 text-xs">POST {computePath}</code>{" "}
            返回 zip blob；header 里的 CJK 值请用{" "}
            <code className="rounded bg-foreground/10 px-1 text-xs">urllib.parse.quote()</code> 编码。
          </div>
        )}
        {result && (
          <div className="space-y-4">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              {headers.map((h) => (
                <div key={h.key}>
                  <dt className="text-[#86868b]">{h.label}</dt>
                  <dd className="mt-0.5 font-medium text-foreground break-all">
                    {result.headers[h.key] || "—"}
                  </dd>
                </div>
              ))}
              <div>
                <dt className="text-[#86868b]">文件大小</dt>
                <dd className="mt-0.5 font-medium text-foreground">{formatBytes(result.size)}</dd>
              </div>
              <div>
                <dt className="text-[#86868b]">计算耗时</dt>
                <dd className="mt-0.5 font-medium text-foreground">{result.seconds.toFixed(1)} s</dd>
              </div>
            </dl>
            <a
              href={result.url}
              download={result.filename}
              className="inline-flex items-center justify-center rounded-full bg-[hsl(var(--track-accent))] px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
            >
              下载 {result.filename}
            </a>
          </div>
        )}
        {footerSlot && <div className="mt-6 pt-5 border-t border-foreground/5">{footerSlot}</div>}
      </LiquidGlassCard>
    </div>
  )
}

export default ZipComputeForm
