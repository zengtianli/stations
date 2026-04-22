"use client"

import { useMemo, useState } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { LiquidGlassCard } from "@tlz/ui"
import type { RangeKey, TwrResp } from "../types"
import { useRange } from "../providers/RangeProvider"

const RANGES: { key: RangeKey; label: string }[] = [
  { key: "1M", label: "1月" },
  { key: "3M", label: "3月" },
  { key: "6M", label: "6月" },
  { key: "1Y", label: "1年" },
  { key: "YTD", label: "YTD" },
]

type BenchKey = "spy" | "qqq" | "tqqq"
type Hidden = Record<BenchKey, boolean>

const SERIES_META: { key: "cc" | BenchKey; label: string; color: string; dash?: string }[] = [
  { key: "cc", label: "CC 实盘", color: "#0071e3" },
  { key: "spy", label: "SPY", color: "#34c759" },
  { key: "qqq", label: "QQQ", color: "#ff9500" },
  { key: "tqqq", label: "TQQQ", color: "#af52de", dash: "4 4" },
]

function trimDate(s: string): string {
  if (s && s.length >= 10 && s.includes("T")) return s.slice(0, 10)
  return s
}

export function NLVChart({ data }: { data: TwrResp | null }) {
  const { rangeKey, setRangeKey } = useRange()
  const [hidden, setHidden] = useState<Hidden>({ spy: false, qqq: false, tqqq: false })

  const series = useMemo(() => {
    if (!data || !data.dates || data.dates.length === 0) return null

    const merged = data.dates.map((d, i) => ({
      date: trimDate(d),
      cc: data.cc[i] ?? null,
      spy: data.spy[i] ?? null,
      qqq: data.qqq[i] ?? null,
      tqqq: data.tqqq[i] ?? null,
      diff:
        data.cc[i] !== null && data.qqq[i] !== null
          ? (data.cc[i] as number) - (data.qqq[i] as number)
          : null,
    }))

    const step = Math.max(1, Math.floor(merged.length / 500))
    const sampled = merged.filter((_, i) => i % step === 0 || i === merged.length - 1)

    const tickStep = Math.max(1, Math.floor(sampled.length / 8))
    const ticks = sampled
      .filter((_, i) => i % tickStep === 0 || i === sampled.length - 1)
      .map((r) => r.date)

    return {
      sampled,
      ticks,
      first: data.dates[0]!,
      last: data.dates[data.dates.length - 1]!,
      count: data.dates.length,
    }
  }, [data])

  const domains = useMemo(() => {
    if (!series) return null
    const leftVals: number[] = []
    const rightVals: number[] = []
    const diffVals: number[] = []
    for (const p of series.sampled) {
      if (p.cc !== null) leftVals.push(p.cc as number)
      if (!hidden.spy && p.spy !== null) leftVals.push(p.spy as number)
      if (!hidden.qqq && p.qqq !== null) leftVals.push(p.qqq as number)
      if (!hidden.tqqq && p.tqqq !== null) rightVals.push(p.tqqq as number)
      if (p.diff !== null) diffVals.push(p.diff as number)
    }
    const leftPad = leftVals.length
      ? Math.max(1, Math.round((Math.max(...leftVals) - Math.min(...leftVals)) * 0.08))
      : 1
    const left: [number, number] = leftVals.length
      ? [Math.floor(Math.min(...leftVals) - leftPad), Math.ceil(Math.max(...leftVals) + leftPad)]
      : [95, 105]
    const right: [number, number] = rightVals.length
      ? [
          Math.floor(Math.min(...rightVals) - 1),
          Math.ceil(Math.max(...rightVals) + 1),
        ]
      : left
    const diffAbs = diffVals.length ? Math.max(...diffVals.map(Math.abs)) : 1
    const diffPad = Math.max(0.5, diffAbs * 0.15)
    const diff: [number, number] = [-(diffAbs + diffPad), diffAbs + diffPad]
    return { left, right, diff }
  }, [series, hidden])

  const toggle = (k: BenchKey) => setHidden((h) => ({ ...h, [k]: !h[k] }))

  return (
    <LiquidGlassCard className="p-6">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div>
          <h2 className="text-xl font-semibold">NLV 归一化曲线</h2>
          <div className="text-xs text-[#86868b] mt-0.5">
            窗口起点 = 100 · TWR（已扣入金）· CC 实盘 vs SPY / QQQ / TQQQ · 点图例切换显示
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-foreground/10 overflow-hidden text-xs">
            {RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => setRangeKey(r.key)}
                className={`px-3 py-1 transition ${rangeKey === r.key ? "bg-foreground text-background" : "hover:bg-foreground/5"}`}
              >
                {r.label}
              </button>
            ))}
          </div>
          {series && (
            <span className="text-xs text-[#86868b] tabular-nums">
              {series.count}天 · {trimDate(series.first)} → {trimDate(series.last)}
            </span>
          )}
        </div>
      </div>

      {/* 自定义 Legend */}
      <div className="flex items-center gap-4 mb-2 text-xs flex-wrap">
        {SERIES_META.map((s) => {
          const isCC = s.key === "cc"
          const isHidden = !isCC && hidden[s.key as BenchKey]
          return (
            <button
              key={s.key}
              onClick={() => !isCC && toggle(s.key as BenchKey)}
              className={`inline-flex items-center gap-1.5 transition ${isCC ? "cursor-default" : "cursor-pointer hover:opacity-100"} ${isHidden ? "opacity-35" : "opacity-100"}`}
              disabled={isCC}
            >
              <span
                className="inline-block w-6 h-0.5 rounded"
                style={{
                  background: s.color,
                  height: isCC ? 3 : 2,
                  borderTop: s.dash ? `2px dashed ${s.color}` : undefined,
                  backgroundColor: s.dash ? "transparent" : s.color,
                }}
              />
              <span className={isCC ? "font-semibold" : ""}>{s.label}</span>
              {isCC && <span className="text-[9px] text-[#86868b]">(主)</span>}
            </button>
          )
        })}
      </div>

      {!series || !domains ? (
        <div className="py-10 text-center text-sm text-[#86868b]">曲线加载中…</div>
      ) : (
        <>
          {/* 主图 */}
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={series.sampled}
                syncId="nlv-sync"
                margin={{ top: 8, right: 48, left: 8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
                <XAxis
                  dataKey="date"
                  ticks={series.ticks}
                  tick={{ fontSize: 11, fill: "#86868b" }}
                  interval="preserveStartEnd"
                  hide
                />
                <YAxis
                  yAxisId="left"
                  domain={domains.left}
                  tick={{ fontSize: 11, fill: "#86868b" }}
                  tickFormatter={(v: number) => v.toFixed(0)}
                  label={{
                    value: "CC / SPY / QQQ",
                    angle: -90,
                    position: "insideLeft",
                    style: { fontSize: 11, fill: "#86868b" },
                  }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={domains.right}
                  tick={{ fontSize: 11, fill: "#af52de" }}
                  tickFormatter={(v: number) => v.toFixed(0)}
                  label={{
                    value: "TQQQ",
                    angle: 90,
                    position: "insideRight",
                    style: { fontSize: 11, fill: "#af52de" },
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255,255,255,0.95)",
                    border: "1px solid rgba(0,0,0,0.1)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value, name) => {
                    const n = (name ?? "") as string
                    if (value === null || value === undefined) return ["—", n]
                    if (typeof value === "number") {
                      return [
                        `${value.toFixed(1)}  (${(value - 100 >= 0 ? "+" : "") + (value - 100).toFixed(1)}%)`,
                        n,
                      ]
                    }
                    return [String(value), n]
                  }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="cc"
                  name="CC 实盘"
                  stroke="#0071e3"
                  strokeWidth={3.5}
                  dot={false}
                  connectNulls
                  isAnimationActive={false}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="spy"
                  name="SPY"
                  stroke="#34c759"
                  strokeWidth={1.5}
                  strokeOpacity={0.65}
                  dot={false}
                  connectNulls
                  isAnimationActive={false}
                  hide={hidden.spy}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="qqq"
                  name="QQQ"
                  stroke="#ff9500"
                  strokeWidth={1.5}
                  strokeOpacity={0.65}
                  dot={false}
                  connectNulls
                  isAnimationActive={false}
                  hide={hidden.qqq}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="tqqq"
                  name="TQQQ"
                  stroke="#af52de"
                  strokeWidth={1.5}
                  strokeOpacity={0.65}
                  strokeDasharray="4 4"
                  dot={false}
                  connectNulls
                  isAnimationActive={false}
                  hide={hidden.tqqq}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 副图：CC vs QQQ 超额收益 */}
          <div className="w-full h-[80px] -mt-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={series.sampled}
                syncId="nlv-sync"
                margin={{ top: 2, right: 48, left: 8, bottom: 8 }}
              >
                <defs>
                  <linearGradient id="diffPos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0071e3" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#0071e3" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="diffNeg" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="#ff3b30" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#ff3b30" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                <XAxis
                  dataKey="date"
                  ticks={series.ticks}
                  tick={{ fontSize: 10, fill: "#86868b" }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={domains.diff}
                  tick={{ fontSize: 10, fill: "#86868b" }}
                  tickFormatter={(v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(0)}`}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255,255,255,0.95)",
                    border: "1px solid rgba(0,0,0,0.1)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value) => {
                    if (value === null || value === undefined) return ["—", "CC − QQQ"]
                    if (typeof value === "number") {
                      return [`${value >= 0 ? "+" : ""}${value.toFixed(2)} 点`, "CC − QQQ"]
                    }
                    return [String(value), "CC − QQQ"]
                  }}
                />
                <ReferenceLine y={0} stroke="rgba(0,0,0,0.3)" strokeDasharray="2 2" />
                <Area
                  type="monotone"
                  dataKey="diff"
                  name="CC − QQQ"
                  stroke="#0071e3"
                  strokeWidth={1.5}
                  fill="url(#diffPos)"
                  connectNulls
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[10px] text-[#86868b] text-center mt-0.5">
            副图：CC − QQQ 累计超额（点）· &gt;0 跑赢 &lt;0 跑输
          </div>
        </>
      )}
    </LiquidGlassCard>
  )
}
