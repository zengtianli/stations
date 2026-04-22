"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { LiquidGlassCard, SiteHeader, StatCard, RunProgress } from "@tlz/ui"

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

interface WeightRow {
  指标: string
  AHP: number
  CRITIC: number
  组合: number
}

interface LayerWeightRow {
  层面: string
  权重: number
}

interface GradeRow {
  grade: string
  count: number
  color: string
}

interface ComputePayload {
  preview: {
    macro_raw: TablePayload
    macro_indicators: TablePayload
    meso_raw: TablePayload
    meso_indicators: TablePayload
    micro_raw_by_year: Record<string, TablePayload>
    micro_indicators_by_year: Record<string, TablePayload>
  }
  meta: {
    years: number
    cr: number
    consistent: boolean
    enterprises: number
    latestYear: string
    elapsedMs: number
    xlsxBytes: number
    topsisSheetName: string
  }
  results: Record<string, TablePayload>
  charts: {
    weights: WeightRow[]
    layerWeights: LayerWeightRow[]
    gradeDistribution: GradeRow[]
  }
  xlsxBase64: string
}

const GRADE_COLORS: Record<string, string> = {
  水效领跑: "#1890ff",
  水效先进: "#52c41a",
  水效达标: "#faad14",
  水效待改进: "#f5222d",
}

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

function SimpleTable({
  data,
  limit,
  rowStyler,
}: {
  data: TablePayload
  limit?: number
  rowStyler?: (row: (string | number | boolean | null)[]) => string | undefined
}) {
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
            {displayRows.map((row, i) => {
              const extra = rowStyler?.(row)
              return (
                <tr
                  key={i}
                  className={`border-t border-foreground/5 hover:bg-foreground/[0.02] ${extra ?? ""}`}
                >
                  {row.map((cell, j) => (
                    <td key={j} className="px-3 py-1.5 whitespace-nowrap">
                      {formatCell(cell)}
                    </td>
                  ))}
                </tr>
              )
            })}
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

type Tab = "data" | "weights" | "topsis"

export default function HomePage() {
  const [meta, setMeta] = useState<MetaInfo | null>(null)
  const [metaError, setMetaError] = useState<string | null>(null)

  const [dataSource, setDataSource] = useState<"sample" | "upload">("sample")
  const [file, setFile] = useState<File | null>(null)
  const [alpha, setAlpha] = useState(0.5)
  const [busy, setBusy] = useState<"sample" | "compute" | null>(null)
  const [result, setResult] = useState<ComputePayload | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [tab, setTab] = useState<Tab>("data")
  const [microYear, setMicroYear] = useState<string | null>(null)
  const [resultTab, setResultTab] = useState(0)

  useEffect(() => {
    fetch(`${API_BASE}/api/meta`)
      .then((r) => r.json())
      .then((m) => setMeta(m))
      .catch((e) => setMetaError(e instanceof Error ? e.message : String(e)))
  }, [])

  useEffect(() => {
    if (!result) return
    const years = Object.keys(result.preview.micro_indicators_by_year)
    if (years.length > 0) setMicroYear(years[years.length - 1] ?? null)
  }, [result])

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
      a.download = "efficiency_sample.xlsx"
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
    if (dataSource === "upload" && !file) {
      setError("请先选择 xlsx 输入文件")
      return
    }
    setBusy("compute")
    setError(null)
    setResult(null)
    try {
      const form = new FormData()
      form.set("format", "json")
      form.set("alpha", String(alpha))
      if (dataSource === "sample") {
        form.set("use_sample", "true")
      } else if (file) {
        form.set("file", file, file.name)
        form.set("use_sample", "false")
      }
      const r = await fetch(`${API_BASE}/api/compute`, { method: "POST", body: form })
      if (!r.ok) {
        const body = await r.text().catch(() => "")
        throw new Error(`HTTP ${r.status}: ${body.slice(0, 400)}`)
      }
      const data = (await r.json()) as ComputePayload
      setResult(data)
      setTab("data")
      setResultTab(0)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(null)
    }
  }

  const resultNames = useMemo(() => (result ? Object.keys(result.results) : []), [result])

  const microYears = useMemo(
    () => (result ? Object.keys(result.preview.micro_indicators_by_year) : []),
    [result],
  )

  const pilotTable = result?.results["分层评分与试点汇总"]
  const layerWeightTable = result?.results["层面权重"]
  const weightDetailTable = result?.results["权重详情"]
  const topsisTable = result && result.meta.topsisSheetName
    ? result.results[result.meta.topsisSheetName]
    : undefined
  const mergedMatrixTable = result?.results["年度综合指标矩阵"]

  return (
    <>
      <SiteHeader
        title="水效评估"
        subtitle="工业集聚区水效评估 · AHP + CRITIC + TOPSIS"
        badge={
          <span className="inline-flex items-center rounded-full bg-foreground/5 px-3 py-1 text-xs font-medium text-foreground/70">
            💧 · Next.js · hydro-efficiency
          </span>
        }
      />

      <main className="max-w-[1280px] mx-auto px-6 md:px-8 py-10 md:py-14 space-y-8">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            label="API 版本"
            value={meta?.version ?? "—"}
            hint={metaError ? "后端离线" : `/api/meta :${8613}`}
            trend={metaError ? "down" : "flat"}
          />
          <StatCard label="名称" value={meta?.name ?? "—"} hint={meta?.title} />
          <StatCard label="图标" value={meta?.icon ?? "💧"} hint="水效评估" />
        </section>

        {/* Step 1: 数据源 & 运行 */}
        <LiquidGlassCard className="p-6 md:p-8">
          <div className="flex items-start justify-between gap-4 mb-5">
            <h2 className="text-lg font-semibold">Step 1 · 数据源与参数</h2>
            <button
              type="button"
              onClick={downloadSample}
              disabled={busy !== null}
              className="inline-flex items-center rounded-full border border-foreground/20 bg-background/60 px-3 py-1 text-xs font-medium text-foreground transition hover:bg-background/80 disabled:opacity-50"
            >
              {busy === "sample" ? "下载中…" : "下载示例 xlsx"}
            </button>
          </div>
          <form onSubmit={onCompute} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2">数据来源</label>
              <div className="flex gap-3">
                {(["sample", "upload"] as const).map((v) => (
                  <label
                    key={v}
                    className={`flex-1 cursor-pointer rounded-lg border px-4 py-3 text-sm transition ${
                      dataSource === v
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-foreground/15 text-[#86868b] hover:border-foreground/30"
                    }`}
                  >
                    <input
                      type="radio"
                      name="dataSource"
                      value={v}
                      checked={dataSource === v}
                      onChange={() => setDataSource(v)}
                      className="mr-2"
                    />
                    {v === "sample" ? "示例数据（内置）" : "上传 xlsx"}
                  </label>
                ))}
              </div>
            </div>

            {dataSource === "upload" && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  输入文件（需含 大循环 / 小循环 / 点循环-YYYY年 / AHP判断矩阵 sheets）
                </label>
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
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">AHP 权重占比 α</label>
                <span className="text-sm tabular-nums text-foreground/80">
                  {alpha.toFixed(2)}
                  <span className="ml-2 text-xs text-[#86868b]">
                    （AHP {Math.round(alpha * 100)}% · CRITIC {Math.round((1 - alpha) * 100)}%）
                  </span>
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={alpha}
                onChange={(e) => setAlpha(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 whitespace-pre-wrap break-words">
                {error}
              </div>
            )}

            <RunProgress running={busy === "compute"} estimatedSeconds={3} />
            <button
              type="submit"
              disabled={busy !== null}
              className="w-full inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {busy === "compute" ? "计算中…" : "运行 水效评估"}
            </button>
          </form>
        </LiquidGlassCard>

        {/* 结果区 */}
        {result && (
          <LiquidGlassCard className="p-6 md:p-8 space-y-5">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-lg font-semibold">计算结果</h2>
                <span className="text-xs text-[#86868b]">
                  {result.meta.years} 年 · {result.meta.enterprises} 企业 · 最近 {result.meta.latestYear} · 耗时 {(result.meta.elapsedMs / 1000).toFixed(1)} s
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  downloadXlsxFromBase64(
                    result.xlsxBase64,
                    `hydro-efficiency_result_${timestamp()}.xlsx`,
                  )
                }
                className="inline-flex items-center rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground transition hover:opacity-90"
              >
                📥 下载完整 xlsx ({formatBytes(result.meta.xlsxBytes)})
              </button>
            </div>

            <div className="flex gap-1 flex-wrap border-b border-foreground/10">
              {(
                [
                  { k: "data", label: "📊 数据与指标" },
                  { k: "weights", label: "⚖️ 权重计算" },
                  { k: "topsis", label: "🏆 TOPSIS 评价" },
                ] as { k: Tab; label: string }[]
              ).map((t) => (
                <button
                  key={t.k}
                  type="button"
                  onClick={() => setTab(t.k)}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${
                    tab === t.k
                      ? "border-b-2 border-primary text-foreground -mb-px"
                      : "text-[#86868b] hover:text-foreground"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === "data" && (
              <div className="space-y-4">
                <details open className="rounded-lg border border-foreground/10">
                  <summary className="cursor-pointer select-none px-4 py-2.5 text-sm font-medium">
                    大循环原始数据 + 指标 (C1–C4)
                  </summary>
                  <div className="p-4 pt-0 space-y-3">
                    <SimpleTable data={result.preview.macro_raw} />
                    <div className="text-xs font-medium text-foreground/80">计算结果 (C1–C4)</div>
                    <SimpleTable data={result.preview.macro_indicators} />
                  </div>
                </details>

                <details className="rounded-lg border border-foreground/10">
                  <summary className="cursor-pointer select-none px-4 py-2.5 text-sm font-medium">
                    小循环原始数据 + 指标 (C5–C6)
                  </summary>
                  <div className="p-4 pt-0 space-y-3">
                    <SimpleTable data={result.preview.meso_raw} />
                    <div className="text-xs font-medium text-foreground/80">计算结果 (C5–C6)</div>
                    <SimpleTable data={result.preview.meso_indicators} />
                  </div>
                </details>

                <details className="rounded-lg border border-foreground/10">
                  <summary className="cursor-pointer select-none px-4 py-2.5 text-sm font-medium">
                    点循环企业数据 + 指标 (C7–C10)
                  </summary>
                  <div className="p-4 pt-0 space-y-3">
                    {microYears.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {microYears.map((y) => (
                          <button
                            key={y}
                            type="button"
                            onClick={() => setMicroYear(y)}
                            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                              microYear === y
                                ? "bg-primary text-primary-foreground"
                                : "border border-foreground/15 text-[#86868b] hover:text-foreground"
                            }`}
                          >
                            {y}
                          </button>
                        ))}
                      </div>
                    )}
                    {(() => {
                      if (!microYear) return null
                      const raw = result.preview.micro_raw_by_year[microYear]
                      const ind = result.preview.micro_indicators_by_year[microYear]
                      if (!raw || !ind) return null
                      return (
                        <>
                          <SimpleTable data={raw} />
                          <div className="text-xs font-medium text-foreground/80">
                            计算结果 (C7–C10) · {microYear}
                          </div>
                          <SimpleTable data={ind} />
                        </>
                      )
                    })()}
                  </div>
                </details>
              </div>
            )}

            {tab === "weights" && (
              <div className="space-y-5">
                <div
                  className={`rounded-lg border px-4 py-3 text-sm ${
                    result.meta.consistent
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-rose-200 bg-rose-50 text-rose-700"
                  }`}
                >
                  一致性比率 CR = {result.meta.cr.toFixed(4)} ·{" "}
                  {result.meta.consistent
                    ? "通过一致性检验 (CR < 0.1)"
                    : "未通过一致性检验，请调整判断矩阵"}
                </div>

                {weightDetailTable && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">组合权重（C1–C10）</div>
                    <SimpleTable data={weightDetailTable} />
                  </div>
                )}

                <div className="space-y-2">
                  <div className="text-sm font-medium">AHP / CRITIC / 组合权重对比</div>
                  <div className="h-[360px] rounded-lg border border-foreground/10 p-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={result.charts.weights}
                        margin={{ top: 16, right: 16, left: 0, bottom: 60 }}
                      >
                        <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                        <XAxis
                          dataKey="指标"
                          interval={0}
                          angle={-30}
                          textAnchor="end"
                          tick={{ fontSize: 10 }}
                          height={70}
                        />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="AHP" fill="#1890ff" />
                        <Bar dataKey="CRITIC" fill="#52c41a" />
                        <Bar dataKey="组合" fill="#faad14" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {mergedMatrixTable && (
                  <details className="rounded-lg border border-foreground/10">
                    <summary className="cursor-pointer select-none px-4 py-2.5 text-sm font-medium">
                      年度综合指标矩阵
                    </summary>
                    <div className="p-4 pt-0">
                      <SimpleTable data={mergedMatrixTable} />
                    </div>
                  </details>
                )}

                {pilotTable && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">分层评分与试点汇总</div>
                    <SimpleTable data={pilotTable} />
                  </div>
                )}

                {layerWeightTable && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">层面权重</div>
                    <SimpleTable data={layerWeightTable} />
                  </div>
                )}
              </div>
            )}

            {tab === "topsis" && topsisTable && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <div className="text-sm font-medium">
                    企业评价（{result.meta.topsisSheetName}）
                  </div>
                  <SimpleTable
                    data={topsisTable}
                    rowStyler={(row) => {
                      const cols = topsisTable.columns
                      const gradeIdx = cols.indexOf("水效等级")
                      if (gradeIdx < 0) return undefined
                      const grade = String(row[gradeIdx] ?? "")
                      const color = GRADE_COLORS[grade]
                      if (!color) return undefined
                      // inline style via class is tricky; use bg-* via arbitrary would need safelist.
                      // Use a neutral approach: return empty and rely on cell markup.
                      return undefined
                    }}
                  />
                  <div className="flex flex-wrap gap-3 text-xs">
                    {Object.entries(GRADE_COLORS).map(([g, c]) => (
                      <span key={g} className="inline-flex items-center gap-1.5">
                        <span
                          className="inline-block h-3 w-3 rounded-sm"
                          style={{ backgroundColor: c }}
                        />
                        {g}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">等级分布</div>
                    <div className="h-[320px] rounded-lg border border-foreground/10 p-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={result.charts.gradeDistribution}
                            dataKey="count"
                            nameKey="grade"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label={((entry: unknown) => {
                              const e = entry as { grade?: string; count?: number }
                              return `${e.grade ?? ""}: ${e.count ?? ""}`
                            }) as never}
                          >
                            {result.charts.gradeDistribution.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">层面权重</div>
                    <div className="h-[320px] rounded-lg border border-foreground/10 p-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={result.charts.layerWeights}
                          margin={{ top: 16, right: 16, left: 0, bottom: 16 }}
                        >
                          <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                          <XAxis dataKey="层面" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <Bar dataKey="权重" fill="#1890ff" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 结果 sheets 选项卡（兜底，全部下载表展示） */}
            <div className="space-y-2 pt-2">
              <div className="text-sm font-medium">xlsx 全表预览</div>
              <div className="flex gap-1 flex-wrap border-b border-foreground/10">
                {resultNames.map((name, i) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setResultTab(i)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition ${
                      resultTab === i
                        ? "border-b-2 border-primary text-foreground -mb-px"
                        : "text-[#86868b] hover:text-foreground"
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
              {(() => {
                const currentName = resultNames[resultTab]
                const currentData = currentName ? result.results[currentName] : undefined
                return currentData ? <SimpleTable data={currentData} /> : null
              })()}
            </div>
          </LiquidGlassCard>
        )}

        {!result && (
          <LiquidGlassCard className="p-6 md:p-8">
            <div className="text-sm text-[#86868b] space-y-2">
              <div>选择数据来源与 α 后点击运行，将按顺序展示：</div>
              <ol className="list-decimal pl-5 space-y-1 text-xs">
                <li>Tab 1 数据与指标：大循环 / 小循环 / 点循环（按年度切换）原始 + C1–C10 计算结果</li>
                <li>Tab 2 权重计算：CR 一致性 + AHP/CRITIC/组合权重柱状图 + 分层评分 + 试点汇总</li>
                <li>Tab 3 TOPSIS 评价：企业评价表（等级色块）+ 等级分布饼图 + 层面权重柱状图</li>
                <li>xlsx 全表预览与完整下载</li>
              </ol>
            </div>
          </LiquidGlassCard>
        )}
      </main>
    </>
  )
}
