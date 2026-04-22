"use client"

import { useEffect, useState } from "react"
import { SiteHeader, StatCard, LiquidGlassCard, RunProgress } from "@tlz/ui"
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? ""

interface MetaInfo {
  name: string
  title: string
  icon: string
  description: string
  version: string
}

interface TablePayload {
  columns: string[]
  rows: (string | number | boolean | null)[][]
  totalRows: number
}

interface WaterLevelPoint {
  date: string
  upLevel: number | null
  downLevel: number | null
}
interface FlowPoint {
  date: string
  inflow: number | null
  outflow: number | null
}
interface PowerPoint {
  date: string
  upPower: number | null
  downPower: number | null
  power: number | null
}

interface ComputePayload {
  preview: {
    upResInfo: TablePayload | null
    downResInfo: TablePayload | null
    paras: TablePayload | null
    upResName: string | null
    downResName: string | null
  }
  meta: {
    upRes: string
    downRes: string
    calcStep: string
    elapsedMs: number
    xlsxBytes: number
  }
  results: Record<string, TablePayload>
  charts: {
    waterLevel: WaterLevelPoint[]
    flow: FlowPoint[]
    power: PowerPoint[]
  }
  xlsxBase64: string
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(2)} MB`
}

function formatCell(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—"
  if (typeof v === "number") {
    if (Number.isInteger(v)) return v.toString()
    return v.toFixed(Math.abs(v) < 1 ? 4 : 2)
  }
  if (typeof v === "string" && v.length >= 19 && v.includes("T")) {
    return v.slice(0, 10)
  }
  return String(v)
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
                <th key={c} className="px-3 py-2 text-left font-medium whitespace-nowrap">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, i) => (
              <tr key={i} className="border-t border-foreground/5 hover:bg-foreground/[0.02]">
                {row.map((cell, j) => (
                  <td key={j} className="px-3 py-1.5 whitespace-nowrap">{formatCell(cell)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {truncated && (
        <div className="text-xs text-[#86868b]">
          共 {data.totalRows.toLocaleString()} 行，页面展示前 {displayRows.length} 行（完整数据请下载 xlsx）
        </div>
      )}
    </div>
  )
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

function timestamp(): string {
  return new Date().toISOString().slice(0, 19).replace(/[-:T]/g, "")
}

function trimDate(s: string): string {
  // strip ISO "T..." tail if present, keep "YYYY-MM-DD"
  if (s && s.length >= 10 && s.includes("T")) return s.slice(0, 10)
  return s
}

interface LineSpec {
  key: string
  name: string
  color: string
}

function TimeSeriesChart<T extends { date: string }>({
  data,
  lines,
  yLabel,
}: {
  data: T[]
  lines: LineSpec[]
  yLabel: string
}) {
  if (!data || data.length === 0) {
    return <div className="text-xs text-[#86868b]">无数据</div>
  }
  const normalized = data.map((p) => ({ ...p, date: trimDate(p.date) }))
  // sample tick labels: only show ~8
  const tickCount = 8
  const step = Math.max(1, Math.floor(normalized.length / tickCount))
  const ticks = normalized.filter((_, i) => i % step === 0).map((p) => p.date)
  return (
    <div className="w-full h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={normalized} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
          <XAxis
            dataKey="date"
            ticks={ticks}
            tick={{ fontSize: 11, fill: "#86868b" }}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#86868b" }}
            label={{ value: yLabel, angle: -90, position: "insideLeft", style: { fontSize: 11, fill: "#86868b" } }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(255,255,255,0.95)",
              border: "1px solid rgba(0,0,0,0.1)",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value: unknown) => {
              if (value === null || value === undefined) return "—"
              if (typeof value === "number") return value.toFixed(Math.abs(value) < 1 ? 4 : 2)
              return String(value)
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {lines.map((l) => (
            <Line
              key={l.key}
              type="monotone"
              dataKey={l.key}
              name={l.name}
              stroke={l.color}
              dot={false}
              strokeWidth={1.5}
              connectNulls
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function HomePage() {
  const [meta, setMeta] = useState<MetaInfo | null>(null)
  const [metaError, setMetaError] = useState<string | null>(null)

  const [file, setFile] = useState<File | null>(null)
  const [calcStep, setCalcStep] = useState<"日" | "旬" | "月">("旬")
  const [busy, setBusy] = useState<"sample" | "compute" | null>(null)
  const [result, setResult] = useState<ComputePayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<number>(0) // -1 reserved for charts, but we use sheet count as "charts" index
  const [showUp, setShowUp] = useState(true)
  const [showDown, setShowDown] = useState(false)
  const [showParas, setShowParas] = useState(false)

  useEffect(() => {
    fetch(`${API_BASE}/api/meta`)
      .then((r) => r.json())
      .then((m) => setMeta(m))
      .catch((e) => setMetaError(e instanceof Error ? e.message : String(e)))
  }, [])

  async function downloadSample() {
    setBusy("sample")
    setError(null)
    try {
      const r = await fetch(`${API_BASE}/api/sample`)
      if (!r.ok) throw new Error(`sample ${r.status}`)
      const blob = await r.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "reservoir_sample_input.xlsx"
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

  async function onCompute(e: React.FormEvent) {
    e.preventDefault()
    if (!file) {
      setError("请先选择输入文件")
      return
    }
    setBusy("compute")
    setError(null)
    setResult(null)
    try {
      const form = new FormData()
      form.set("file", file, file.name)
      form.set("calc_step", calcStep)
      form.set("format", "json")
      const r = await fetch(`${API_BASE}/api/compute`, { method: "POST", body: form })
      if (!r.ok) {
        const body = await r.text().catch(() => "")
        throw new Error(`HTTP ${r.status}: ${body.slice(0, 400)}`)
      }
      const data = (await r.json()) as ComputePayload
      setResult(data)
      setActiveTab(0)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(null)
    }
  }

  const resultNames = result ? Object.keys(result.results) : []
  const chartsTabIndex = resultNames.length
  const isChartsActive = activeTab === chartsTabIndex

  return (
    <>
      <SiteHeader
        title="水库群调度"
        subtitle="梯级水库发电调度 · 上传输入.xlsx → 预览 → 运行 → 下载结果"
        badge={
          <span className="inline-flex items-center rounded-full bg-foreground/5 px-3 py-1 text-xs font-medium text-foreground/70">
            ⚡ · Next.js · hydro-reservoir
          </span>
        }
      />

      <main className="max-w-[1280px] mx-auto px-6 md:px-8 py-10 md:py-14 space-y-8">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            label="API 版本"
            value={meta?.version ?? "—"}
            hint={metaError ? "后端离线" : "/api/meta :8612"}
            trend={metaError ? "down" : "flat"}
          />
          <StatCard label="名称" value={meta?.name ?? "—"} hint={meta?.title} />
          <StatCard label="图标" value={meta?.icon ?? "⚡"} hint="梯级发电调度" />
        </section>

        {/* Step 1 */}
        <LiquidGlassCard className="p-6 md:p-8">
          <div className="flex items-start justify-between gap-4 mb-5">
            <h2 className="text-lg font-semibold">Step 1 · 上传输入文件</h2>
            <button
              type="button"
              onClick={downloadSample}
              disabled={busy !== null}
              className="inline-flex items-center rounded-full border border-foreground/20 bg-background/60 px-3 py-1 text-xs font-medium text-foreground transition hover:bg-background/80 disabled:opacity-50"
            >
              {busy === "sample" ? "下载中…" : "下载示例输入"}
            </button>
          </div>
          <form onSubmit={onCompute} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2">输入文件</label>
              <input
                type="file"
                accept=".xlsx,.xlsm"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-foreground file:text-background file:text-sm file:font-medium hover:file:opacity-90"
              />
              {file && (
                <div className="mt-2 text-xs text-[#86868b]">
                  已选：{file.name} · {formatBytes(file.size)}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">计算步长</label>
              <div className="inline-flex rounded-full border border-foreground/20 bg-background/60 p-1">
                {(["日", "旬", "月"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setCalcStep(s)}
                    className={`px-4 py-1.5 text-sm rounded-full transition ${
                      calcStep === s
                        ? "bg-foreground text-background font-medium"
                        : "text-foreground/70 hover:text-foreground"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 whitespace-pre-wrap break-words">
                {error}
              </div>
            )}
            <RunProgress running={busy === "compute"} estimatedSeconds={40} />
            <button
              type="submit"
              disabled={!file || busy !== null}
              className="w-full inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {busy === "compute" ? "计算中…" : "运行 水库群调度"}
            </button>
          </form>
        </LiquidGlassCard>

        {/* Step 2 */}
        {result && (
          <LiquidGlassCard className="p-6 md:p-8 space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h2 className="text-lg font-semibold">Step 2 · 数据预览</h2>
              <div className="text-xs text-[#86868b]">
                🏔️ 上库 {result.meta.upRes} · 🌊 下库 {result.meta.downRes} · 步长 {result.meta.calcStep}
              </div>
            </div>

            {result.preview.upResInfo && (
              <details
                open={showUp}
                onToggle={(e) => setShowUp((e.target as HTMLDetailsElement).open)}
                className="rounded-lg border border-foreground/10"
              >
                <summary className="cursor-pointer select-none px-4 py-2.5 text-sm font-medium">
                  🏔️ 上游水库信息（{result.preview.upResName ?? "—"} · {result.preview.upResInfo.totalRows} 行）
                </summary>
                <div className="p-4 pt-0">
                  <SimpleTable data={result.preview.upResInfo} />
                </div>
              </details>
            )}

            {result.preview.downResInfo && (
              <details
                open={showDown}
                onToggle={(e) => setShowDown((e.target as HTMLDetailsElement).open)}
                className="rounded-lg border border-foreground/10"
              >
                <summary className="cursor-pointer select-none px-4 py-2.5 text-sm font-medium">
                  🌊 下游水库信息（{result.preview.downResName ?? "—"} · {result.preview.downResInfo.totalRows} 行）
                </summary>
                <div className="p-4 pt-0">
                  <SimpleTable data={result.preview.downResInfo} />
                </div>
              </details>
            )}

            {result.preview.paras && (
              <details
                open={showParas}
                onToggle={(e) => setShowParas((e.target as HTMLDetailsElement).open)}
                className="rounded-lg border border-foreground/10"
              >
                <summary className="cursor-pointer select-none px-4 py-2.5 text-sm font-medium">
                  ⚙️ 计算参数（{result.preview.paras.totalRows} 行）
                </summary>
                <div className="p-4 pt-0">
                  <SimpleTable data={result.preview.paras} />
                </div>
              </details>
            )}
          </LiquidGlassCard>
        )}

        {/* Step 3 */}
        {result && (
          <LiquidGlassCard className="p-6 md:p-8 space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h2 className="text-lg font-semibold">Step 3 · 计算结果</h2>
              <div className="text-xs text-[#86868b] flex items-center gap-3">
                <span>耗时 {(result.meta.elapsedMs / 1000).toFixed(1)} s</span>
                <span>·</span>
                <span>xlsx {formatBytes(result.meta.xlsxBytes)}</span>
                <button
                  type="button"
                  onClick={() =>
                    downloadXlsxFromBase64(
                      result.xlsxBase64,
                      `hydro-reservoir_result_${timestamp()}.xlsx`,
                    )
                  }
                  className="ml-2 inline-flex items-center rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground transition hover:opacity-90"
                >
                  📥 下载完整 xlsx
                </button>
              </div>
            </div>

            <div className="flex gap-1 flex-wrap border-b border-foreground/10">
              {resultNames.map((name, i) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setActiveTab(i)}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${
                    activeTab === i
                      ? "border-b-2 border-primary text-foreground -mb-px"
                      : "text-[#86868b] hover:text-foreground"
                  }`}
                >
                  {name}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setActiveTab(chartsTabIndex)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${
                  isChartsActive
                    ? "border-b-2 border-primary text-foreground -mb-px"
                    : "text-[#86868b] hover:text-foreground"
                }`}
              >
                📊 可视化
              </button>
            </div>

            {!isChartsActive && (() => {
              const currentName = resultNames[activeTab]
              const currentData = currentName ? result.results[currentName] : undefined
              return currentData ? <SimpleTable data={currentData} /> : null
            })()}

            {isChartsActive && (
              <div className="space-y-6">
                <div>
                  <div className="text-sm font-medium mb-2">时段末水位（m）</div>
                  <TimeSeriesChart
                    data={result.charts.waterLevel}
                    lines={[
                      { key: "upLevel", name: `${result.meta.upRes}`, color: "#0ea5e9" },
                      { key: "downLevel", name: `${result.meta.downRes}`, color: "#f97316" },
                    ]}
                    yLabel="水位 (m)"
                  />
                </div>
                <div>
                  <div className="text-sm font-medium mb-2">流量（m³/s，上库）</div>
                  <TimeSeriesChart
                    data={result.charts.flow}
                    lines={[
                      { key: "inflow", name: "来水流量", color: "#10b981" },
                      { key: "outflow", name: "发电+弃水", color: "#ef4444" },
                    ]}
                    yLabel="流量 (m³/s)"
                  />
                </div>
                <div>
                  <div className="text-sm font-medium mb-2">出力（kW）</div>
                  <TimeSeriesChart
                    data={result.charts.power}
                    lines={[
                      { key: "upPower", name: `${result.meta.upRes}`, color: "#0ea5e9" },
                      { key: "downPower", name: `${result.meta.downRes}`, color: "#f97316" },
                      { key: "power", name: "合计", color: "#6366f1" },
                    ]}
                    yLabel="出力 (kW)"
                  />
                </div>
                <div className="text-xs text-[#86868b]">
                  数据点：水位 {result.charts.waterLevel.length} / 流量 {result.charts.flow.length} / 出力 {result.charts.power.length}（按 calc_step 聚合）
                </div>
              </div>
            )}
          </LiquidGlassCard>
        )}

        {!result && (
          <LiquidGlassCard className="p-6 md:p-8">
            <div className="text-sm text-[#86868b] space-y-2">
              <div>上传「输入.xlsx」后，将按顺序展示：</div>
              <ol className="list-decimal pl-5 space-y-1 text-xs">
                <li>Step 2 数据预览：上库 / 下库 / 计算参数（可折叠）</li>
                <li>Step 3 计算结果：数据表 tabs（逐日/逐月/逐年/水文年/汇总，上下两库共 10 sheet）+ 可视化（水位/流量/出力 3 张折线图）</li>
                <li>完整 xlsx 下载</li>
              </ol>
            </div>
          </LiquidGlassCard>
        )}
      </main>
    </>
  )
}
