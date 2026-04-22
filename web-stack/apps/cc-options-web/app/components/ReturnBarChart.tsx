"use client"

import { useMemo, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { LiquidGlassCard } from "@tlz/ui"
import type { EquityRow } from "../types"

type Period = "D" | "W" | "M" | "Y"
type BenchKey = "spy" | "qqq" | "tqqq"

const PERIODS: { key: Period; label: string }[] = [
  { key: "D", label: "日" },
  { key: "W", label: "周" },
  { key: "M", label: "月" },
  { key: "Y", label: "年" },
]

const BENCH_META: { key: BenchKey; label: string; color: string }[] = [
  { key: "spy", label: "SPY", color: "#34c759" },
  { key: "qqq", label: "QQQ", color: "#ff9500" },
  { key: "tqqq", label: "TQQQ", color: "#af52de" },
]

function trimDate(s: string): string {
  return s && s.includes("T") ? s.slice(0, 10) : s
}

function periodBucket(date: string, period: Period): string {
  const d = trimDate(date)
  switch (period) {
    case "D":
      return d
    case "W": {
      const dt = new Date(d + "T00:00:00Z")
      const day = dt.getUTCDay()
      const diff = (day + 6) % 7
      const monday = new Date(dt.getTime() - diff * 86400000)
      return monday.toISOString().slice(0, 10)
    }
    case "M":
      return d.slice(0, 7)
    case "Y":
      return d.slice(0, 4)
  }
}

export function ReturnBarChart({ rows }: { rows: EquityRow[] | null }) {
  const [period, setPeriod] = useState<Period>("M")
  const [visible, setVisible] = useState<Record<BenchKey, boolean>>({
    spy: false,
    qqq: true,
    tqqq: false,
  })

  const data = useMemo(() => {
    if (!rows || rows.length === 0) return null
    const sliced = rows.filter((r) => r.nlv !== null)
    if (sliced.length < 2) return null

    const ccBuckets = new Map<string, number>()
    const spyBuckets = new Map<string, number>()
    const qqqBuckets = new Map<string, number>()
    const tqqqBuckets = new Map<string, number>()
    for (const r of sliced) {
      const b = periodBucket(r.date, period)
      if (r.nlv !== null) ccBuckets.set(b, r.nlv)
      if (r.spy_close !== null) spyBuckets.set(b, r.spy_close)
      if (r.qqq_close !== null) qqqBuckets.set(b, r.qqq_close)
      if (r.tqqq_close !== null) tqqqBuckets.set(b, r.tqqq_close)
    }
    const keys = [...ccBuckets.keys()].sort()
    const result: {
      bucket: string
      cc: number | null
      spy: number | null
      qqq: number | null
      tqqq: number | null
    }[] = []
    let prev: Record<"cc" | BenchKey, number | null> = {
      cc: null,
      spy: null,
      qqq: null,
      tqqq: null,
    }
    for (const k of keys) {
      const curr = {
        cc: ccBuckets.get(k) ?? null,
        spy: spyBuckets.get(k) ?? null,
        qqq: qqqBuckets.get(k) ?? null,
        tqqq: tqqqBuckets.get(k) ?? null,
      }
      const ret = (name: "cc" | BenchKey): number | null => {
        const p = prev[name]
        const c = curr[name]
        if (p === null || c === null || p <= 0) return null
        return ((c - p) / p) * 100
      }
      const row = {
        bucket: k,
        cc: ret("cc"),
        spy: ret("spy"),
        qqq: ret("qqq"),
        tqqq: ret("tqqq"),
      }
      if (row.cc !== null || row.spy !== null || row.qqq !== null || row.tqqq !== null) {
        result.push(row)
      }
      prev = curr
    }
    return result.length > 0 ? result : null
  }, [rows, period])

  const toggle = (k: BenchKey) => setVisible((v) => ({ ...v, [k]: !v[k] }))

  const activeBench = BENCH_META.filter((b) => visible[b.key])
  const activeLabels = activeBench.length ? activeBench.map((b) => b.label).join(" / ") : "仅 CC"

  return (
    <LiquidGlassCard className="p-6">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div>
          <h2 className="text-xl font-semibold">
            收益对比 <span className="text-xs text-[#86868b] font-normal">· CC 实盘 vs {activeLabels}</span>
          </h2>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs">
            {BENCH_META.map((b) => (
              <label
                key={b.key}
                className={`inline-flex items-center gap-1 cursor-pointer px-2 py-1 rounded border transition ${visible[b.key] ? "border-foreground/20 bg-foreground/5" : "border-foreground/10 opacity-55 hover:opacity-100"}`}
              >
                <input
                  type="checkbox"
                  checked={visible[b.key]}
                  onChange={() => toggle(b.key)}
                  className="w-3 h-3 cursor-pointer"
                  style={{ accentColor: b.color }}
                />
                <span className="inline-block w-2 h-2 rounded-sm" style={{ background: b.color }} />
                <span>{b.label}</span>
              </label>
            ))}
          </div>
          <div className="inline-flex rounded-lg border border-foreground/10 overflow-hidden text-xs">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`px-3 py-1 transition ${period === p.key ? "bg-foreground text-background" : "hover:bg-foreground/5"}`}
              >
                {p.label}收益
              </button>
            ))}
          </div>
        </div>
      </div>

      {!data ? (
        <div className="py-10 text-center text-sm text-[#86868b]">数据不足</div>
      ) : (
        <div className="w-full h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
              <XAxis dataKey="bucket" tick={{ fontSize: 10, fill: "#86868b" }} />
              <YAxis
                tick={{ fontSize: 11, fill: "#86868b" }}
                tickFormatter={(v: number) => `${v.toFixed(0)}%`}
                label={{
                  value: "收益 %",
                  angle: -90,
                  position: "insideLeft",
                  style: { fontSize: 11, fill: "#86868b" },
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
                  if (typeof value === "number") return [`${value.toFixed(2)}%`, n]
                  return [String(value), n]
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="cc" name="CC 实盘" fill="#0071e3" radius={[2, 2, 0, 0]} />
              {visible.spy && <Bar dataKey="spy" name="SPY" fill="#34c759" radius={[2, 2, 0, 0]} />}
              {visible.qqq && <Bar dataKey="qqq" name="QQQ" fill="#ff9500" radius={[2, 2, 0, 0]} />}
              {visible.tqqq && (
                <Bar dataKey="tqqq" name="TQQQ" fill="#af52de" radius={[2, 2, 0, 0]} />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </LiquidGlassCard>
  )
}
