"use client"

import { useEffect, useState } from "react"
import { SiteHeader, StatCard, LiquidGlassCard, RunProgress } from "@tlz/ui"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? ""

interface MetaInfo {
  name: string
  title: string
  icon: string
  description: string
  version: string
  phases?: {
    phase1: Array<{ id: string; label: string }>
    phase2: Array<{ id: string; label: string }>
    phase3: Array<{ id: string; label: string }>
  }
}

interface FileInput {
  name: string
  label: string
  accept: string
  required?: boolean
  hint?: string
}

interface ScriptDef {
  id: string
  name: string
}

interface PhaseConfig {
  id: "phase1" | "phase2" | "phase3"
  phaseNum: 1 | 2 | 3
  label: string
  endpoint: string
  resultKey: string
  resultFilename: string
  description: string
  scripts: ScriptDef[]
  inputs: FileInput[]
}

const GEOJSON_ACCEPT = ".geojson,application/geo+json,application/json"
const XLSX_ACCEPT =
  ".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
const CSV_ACCEPT = ".csv,text/csv"

const PHASES: PhaseConfig[] = [
  {
    id: "phase1",
    phaseNum: 1,
    label: "Phase 1 · 数据库构建",
    endpoint: "/api/compute/phase1",
    resultKey: "database_sx",
    resultFilename: "database_sx.xlsx",
    description:
      "1.1-1.4：上传 datebase_sx.xlsx 骨架 + 4 个 GeoJSON + 可选 CSV，脚本填充各 sheet。",
    scripts: [
      { id: "1.1", name: "保护片" },
      { id: "1.2", name: "堤段" },
      { id: "1.3", name: "堤防" },
      { id: "1.4", name: "河道中心线" },
    ],
    inputs: [
      {
        name: "target_xlsx",
        label: "datebase_sx.xlsx 骨架",
        accept: XLSX_ACCEPT,
        required: true,
        hint: "必须包含 保护片 / 堤段 / 堤防 / 河道中心线 sheet",
      },
      { name: "geojson_bh", label: "保护片 GeoJSON (1.1)", accept: GEOJSON_ACCEPT },
      { name: "geojson_dd", label: "堤段 GeoJSON (1.2)", accept: GEOJSON_ACCEPT },
      { name: "geojson_df", label: "堤防 GeoJSON (1.3)", accept: GEOJSON_ACCEPT },
      { name: "geojson_rc", label: "河流中心线 GeoJSON (1.4)", accept: GEOJSON_ACCEPT },
      { name: "csv_city", label: "city_county_town.csv", accept: CSV_ACCEPT },
      { name: "csv_region", label: "region_name_code.csv", accept: CSV_ACCEPT },
    ],
  },
  {
    id: "phase2",
    phaseNum: 2,
    label: "Phase 2 · 预报断面",
    endpoint: "/api/compute/phase2",
    resultKey: "forecast_sx",
    resultFilename: "forecast_sx.xlsx",
    description: "2.1：上传 forecast_sx.xlsx 骨架 + 断面里程 GeoJSON。",
    scripts: [{ id: "2.1", name: "预报断面" }],
    inputs: [
      {
        name: "target_xlsx",
        label: "forecast_sx.xlsx 骨架",
        accept: XLSX_ACCEPT,
        required: true,
      },
      { name: "geojson_dm", label: "断面里程 GeoJSON", accept: GEOJSON_ACCEPT },
    ],
  },
  {
    id: "phase3",
    phaseNum: 3,
    label: "Phase 3 · 风险分析",
    endpoint: "/api/compute/phase3",
    resultKey: "risk_sx",
    resultFilename: "risk_sx.xlsx",
    description: "3.01-3.09：上传 risk_sx.xlsx 骨架 + 多个 GeoJSON/CSV（按需提供）。",
    scripts: [
      { id: "3.01", name: "保护片信息" },
      { id: "3.02", name: "保护片 GDP/人口" },
      { id: "3.03", name: "堤段信息" },
      { id: "3.04", name: "堤段长度" },
      { id: "3.05", name: "堤段 5m" },
      { id: "3.06", name: "断面里程" },
      { id: "3.07", name: "堤防高程" },
      { id: "3.08", name: "堤段风险" },
      { id: "3.09", name: "设施保护" },
    ],
    inputs: [
      {
        name: "target_xlsx",
        label: "risk_sx.xlsx 骨架",
        accept: XLSX_ACCEPT,
        required: true,
      },
      { name: "geojson_bh", label: "保护片 GeoJSON (3.01/3.02)", accept: GEOJSON_ACCEPT },
      { name: "geojson_dd", label: "堤段 dd_fix GeoJSON (3.03/3.04/3.05/3.08)", accept: GEOJSON_ACCEPT },
      { name: "geojson_df", label: "堤防 df_with_elevation_lc GeoJSON (3.07)", accept: GEOJSON_ACCEPT },
      { name: "geojson_dm", label: "断面里程 dm_LC GeoJSON (3.06)", accept: GEOJSON_ACCEPT },
      { name: "geojson_fac", label: "设施 baohu GeoJSON (3.09)", accept: GEOJSON_ACCEPT },
      { name: "csv_gdp", label: "GDP/人口 CSV (3.01/3.02)", accept: CSV_ACCEPT },
      { name: "csv_region", label: "region_name_code.csv", accept: CSV_ACCEPT },
    ],
  },
]

// ───────────────────────── payload types ─────────────────────────

interface TablePayload {
  columns: string[]
  rows: (string | number | boolean | null)[][]
  totalRows: number
}

interface ScriptStatus {
  id: string
  name: string
  status: "ok" | "fail"
  stdout: string
  stderr: string
}

interface PhasePayload {
  phase: number
  meta: {
    phase: number
    scripts: ScriptStatus[]
    elapsedMs: number
    xlsxBytes: number
  }
  results: Record<string, Record<string, TablePayload>>
  xlsxBase64: string
}

interface PhaseState {
  files: Record<string, File | null>
  selected: Record<string, boolean>
  busy: boolean
  result: PhasePayload | null
  error: string | null
  activeSheet: string | null
}

function emptyPhaseState(phase: PhaseConfig): PhaseState {
  const files: Record<string, File | null> = {}
  for (const inp of phase.inputs) files[inp.name] = null
  const selected: Record<string, boolean> = {}
  for (const s of phase.scripts) selected[s.id] = true
  return { files, selected, busy: false, result: null, error: null, activeSheet: null }
}

// ───────────────────────── helpers ─────────────────────────

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(2)} MB`
}

function formatCell(v: unknown): string {
  if (v === null || v === undefined) return "—"
  if (typeof v === "number") {
    if (Number.isInteger(v)) return v.toString()
    return v.toFixed(v < 1 ? 4 : 2)
  }
  if (typeof v === "string" && v.length >= 19 && v.includes("T")) {
    return v.slice(0, 10)
  }
  return String(v)
}

function downloadXlsxFromBase64(b64: string, filename: string) {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  const blob = new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function SimpleTable({ data, limit }: { data: TablePayload; limit?: number }) {
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
          共 {data.totalRows.toLocaleString()} 行，展示前 {displayRows.length} 行（完整数据请下载 xlsx）
        </div>
      )}
    </div>
  )
}

function ScriptStatusRow({ s }: { s: ScriptStatus }) {
  const [open, setOpen] = useState(false)
  const ok = s.status === "ok"
  return (
    <div className="border-t border-foreground/5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-foreground/[0.02]"
      >
        <span className="font-mono text-xs text-[#86868b] w-12">{s.id}</span>
        <span className="flex-1 text-sm">{s.name}</span>
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            ok
              ? "bg-emerald-100 text-emerald-700"
              : "bg-rose-100 text-rose-700"
          }`}
        >
          {ok ? "ok" : "fail"}
        </span>
        <span className="text-xs text-[#86868b] w-4 text-right">{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-2">
          {s.stdout && (
            <div>
              <div className="text-xs font-medium text-[#86868b] mb-1">stdout</div>
              <pre className="rounded bg-foreground/5 p-2 text-[11px] leading-snug whitespace-pre-wrap break-words max-h-60 overflow-y-auto">
                {s.stdout}
              </pre>
            </div>
          )}
          {s.stderr && (
            <div>
              <div className="text-xs font-medium text-rose-600 mb-1">stderr</div>
              <pre className="rounded bg-rose-50 p-2 text-[11px] leading-snug whitespace-pre-wrap break-words max-h-60 overflow-y-auto text-rose-800">
                {s.stderr}
              </pre>
            </div>
          )}
          {!s.stdout && !s.stderr && (
            <div className="text-xs text-[#86868b] italic">（无输出）</div>
          )}
        </div>
      )}
    </div>
  )
}

function PhasePanel({
  phase,
  state,
  setState,
}: {
  phase: PhaseConfig
  state: PhaseState
  setState: (updater: (prev: PhaseState) => PhaseState) => void
}) {
  function setFile(name: string, file: File | null) {
    setState((prev) => ({ ...prev, files: { ...prev.files, [name]: file } }))
  }

  function toggleScript(id: string) {
    setState((prev) => ({ ...prev, selected: { ...prev.selected, [id]: !prev.selected[id] } }))
  }

  function setAll(value: boolean) {
    setState((prev) => {
      const s: Record<string, boolean> = {}
      for (const sc of phase.scripts) s[sc.id] = value
      return { ...prev, selected: s }
    })
  }

  async function onRun(e: React.FormEvent) {
    e.preventDefault()
    // Validate required files
    for (const inp of phase.inputs) {
      if (inp.required && !state.files[inp.name]) {
        setState((prev) => ({ ...prev, error: `缺少必填：${inp.label}` }))
        return
      }
    }
    const selectedIds = phase.scripts.filter((s) => state.selected[s.id]).map((s) => s.id)
    if (selectedIds.length === 0) {
      setState((prev) => ({ ...prev, error: "至少选择一个脚本" }))
      return
    }

    setState((prev) => ({ ...prev, busy: true, error: null, result: null }))
    try {
      const form = new FormData()
      for (const [k, v] of Object.entries(state.files)) {
        if (v) form.set(k, v, v.name)
      }
      form.set("selected", selectedIds.join(","))
      form.set("format", "json")
      const r = await fetch(`${API_BASE}${phase.endpoint}`, { method: "POST", body: form })
      if (!r.ok) {
        const body = await r.text().catch(() => "")
        throw new Error(`HTTP ${r.status}: ${body.slice(0, 600)}`)
      }
      const data = (await r.json()) as PhasePayload
      const firstSheet = Object.keys(data.results[phase.resultKey] ?? {})[0] ?? null
      setState((prev) => ({
        ...prev,
        busy: false,
        result: data,
        error: null,
        activeSheet: firstSheet,
      }))
    } catch (err) {
      setState((prev) => ({
        ...prev,
        busy: false,
        error: err instanceof Error ? err.message : String(err),
      }))
    }
  }

  const sheetMap = state.result?.results[phase.resultKey] ?? {}
  const sheetNames = Object.keys(sheetMap)
  const activeSheet = state.activeSheet ?? sheetNames[0] ?? null
  const activeTable = activeSheet ? sheetMap[activeSheet] : undefined

  return (
    <div className="space-y-6">
      <LiquidGlassCard className="p-6 md:p-8">
        <div className="mb-5">
          <h2 className="text-lg font-semibold">{phase.label}</h2>
          <p className="mt-1 text-xs text-[#86868b]">{phase.description}</p>
        </div>

        <form onSubmit={onRun} className="space-y-6">
          {/* 脚本选择 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">子脚本选择</label>
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setAll(true)}
                  className="text-primary hover:underline"
                >
                  全选
                </button>
                <span className="text-[#86868b]">·</span>
                <button
                  type="button"
                  onClick={() => setAll(false)}
                  className="text-primary hover:underline"
                >
                  全不选
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {phase.scripts.map((s) => (
                <label
                  key={s.id}
                  className="flex items-center gap-2 rounded-lg border border-foreground/10 px-3 py-2 text-sm cursor-pointer hover:bg-foreground/[0.02]"
                >
                  <input
                    type="checkbox"
                    checked={state.selected[s.id] ?? false}
                    onChange={() => toggleScript(s.id)}
                    className="h-4 w-4"
                  />
                  <span className="font-mono text-xs text-[#86868b]">{s.id}</span>
                  <span>{s.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 文件上传 */}
          <div>
            <label className="block text-sm font-medium mb-2">文件上传</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {phase.inputs.map((inp) => {
                const f = state.files[inp.name] ?? null
                return (
                  <div
                    key={inp.name}
                    className="rounded-lg border border-foreground/10 p-3 space-y-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">
                        {inp.label}
                        {inp.required && <span className="text-rose-600 ml-0.5">*</span>}
                      </span>
                    </div>
                    <input
                      type="file"
                      accept={inp.accept}
                      onChange={(e) => setFile(inp.name, e.target.files?.[0] ?? null)}
                      className="block w-full text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-foreground/10 file:text-foreground file:text-xs hover:file:bg-foreground/15"
                    />
                    {f && (
                      <div className="text-[11px] text-[#86868b] truncate">
                        {f.name} · {formatBytes(f.size)}
                      </div>
                    )}
                    {inp.hint && !f && (
                      <div className="text-[11px] text-[#86868b]">{inp.hint}</div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {state.error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 whitespace-pre-wrap break-words">
              {state.error}
            </div>
          )}

          <RunProgress
            running={state.busy}
            estimatedSeconds={phase.id === "phase1" ? 30 : phase.id === "phase2" ? 10 : 60}
            label={`${phase.label} 运行中`}
          />
          <button
            type="submit"
            disabled={state.busy}
            className="w-full inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {state.busy ? "运行中…" : `运行 ${phase.label}`}
          </button>
        </form>
      </LiquidGlassCard>

      {/* 脚本状态表 */}
      {state.result && (
        <LiquidGlassCard className="p-6 md:p-8 space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h3 className="text-base font-semibold">子脚本状态</h3>
            <div className="text-xs text-[#86868b] flex items-center gap-3">
              <span>耗时 {(state.result.meta.elapsedMs / 1000).toFixed(1)} s</span>
              <span>·</span>
              <span>xlsx {formatBytes(state.result.meta.xlsxBytes)}</span>
              {state.result.xlsxBase64 && (
                <button
                  type="button"
                  onClick={() =>
                    downloadXlsxFromBase64(state.result!.xlsxBase64, phase.resultFilename)
                  }
                  className="ml-2 inline-flex items-center rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground transition hover:opacity-90"
                >
                  📥 下载 {phase.resultFilename}
                </button>
              )}
            </div>
          </div>
          <div className="rounded-lg border border-foreground/10 divide-y divide-foreground/5">
            {state.result.meta.scripts.map((s) => (
              <ScriptStatusRow key={s.id} s={s} />
            ))}
          </div>
        </LiquidGlassCard>
      )}

      {/* 结果表 preview */}
      {state.result && sheetNames.length > 0 && (
        <LiquidGlassCard className="p-6 md:p-8 space-y-4">
          <h3 className="text-base font-semibold">结果预览 · {phase.resultKey}</h3>
          <div className="flex gap-1 flex-wrap border-b border-foreground/10">
            {sheetNames.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setState((prev) => ({ ...prev, activeSheet: name }))}
                className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition ${
                  activeSheet === name
                    ? "border-b-2 border-primary text-foreground -mb-px"
                    : "text-[#86868b] hover:text-foreground"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
          {activeTable && <SimpleTable data={activeTable} />}
        </LiquidGlassCard>
      )}
    </div>
  )
}

export default function HomePage() {
  const [meta, setMeta] = useState<MetaInfo | null>(null)
  const [metaError, setMetaError] = useState<string | null>(null)
  const [activePhase, setActivePhase] = useState<PhaseConfig["id"]>("phase1")

  const [phaseStates, setPhaseStates] = useState<Record<string, PhaseState>>(() => {
    const initial: Record<string, PhaseState> = {}
    for (const p of PHASES) initial[p.id] = emptyPhaseState(p)
    return initial
  })

  useEffect(() => {
    fetch(`${API_BASE}/api/meta`)
      .then((r) => r.json())
      .then((m) => setMeta(m))
      .catch((e) => setMetaError(e instanceof Error ? e.message : String(e)))
  }, [])

  function updatePhaseState(phaseId: string, updater: (prev: PhaseState) => PhaseState) {
    setPhaseStates((prev) => {
      const current = prev[phaseId]
      if (!current) return prev
      return { ...prev, [phaseId]: updater(current) }
    })
  }

  const currentPhase = PHASES.find((p) => p.id === activePhase) ?? PHASES[0]!
  const currentState = phaseStates[currentPhase.id] ?? emptyPhaseState(currentPhase)

  return (
    <>
      <SiteHeader
        title="风险图数据"
        subtitle="GeoJSON → Excel 三阶段 ETL（数据库构建 / 预报断面 / 风险分析）"
        badge={
          <span className="inline-flex items-center rounded-full bg-foreground/5 px-3 py-1 text-xs font-medium text-foreground/70">
            ⚠️ · Next.js · hydro-risk
          </span>
        }
      />

      <main className="max-w-[1280px] mx-auto px-6 md:px-8 py-10 md:py-14 space-y-8">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            label="API 版本"
            value={meta?.version ?? "—"}
            hint={metaError ? "后端离线" : `/api/meta :${8619}`}
            trend={metaError ? "down" : "flat"}
          />
          <StatCard label="名称" value={meta?.name ?? "—"} hint={meta?.title} />
          <StatCard label="图标" value={meta?.icon ?? "⚠️"} hint="风险图数据" />
        </section>

        {/* Phase tabs */}
        <div className="flex gap-1 flex-wrap border-b border-foreground/10">
          {PHASES.map((p) => {
            const st = phaseStates[p.id]
            const hasResult = st?.result != null
            const failCount = st?.result?.meta.scripts.filter((s) => s.status === "fail").length ?? 0
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setActivePhase(p.id)}
                className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition flex items-center gap-2 ${
                  activePhase === p.id
                    ? "border-b-2 border-primary text-foreground -mb-px"
                    : "text-[#86868b] hover:text-foreground"
                }`}
              >
                <span>{p.label}</span>
                {hasResult && (
                  <span
                    className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                      failCount === 0
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {failCount === 0 ? "✓" : `${failCount} fail`}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <PhasePanel
          phase={currentPhase}
          state={currentState}
          setState={(updater) => updatePhaseState(currentPhase.id, updater)}
        />
      </main>
    </>
  )
}
