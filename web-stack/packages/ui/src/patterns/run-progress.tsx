"use client"

import { useEffect, useState } from "react"

export interface RunProgressProps {
  /** Whether a job is currently running. */
  running: boolean
  /** Typical expected seconds — drives both the pct bar and the "/ ~Ns" label. */
  estimatedSeconds: number
  /** Optional label prefix, defaults to "计算中". */
  label?: string
  /** Optional class override. */
  className?: string
}

/**
 * Compact elapsed + estimated progress bar.
 *
 * - Shows "<label>… 已用 Xs / ~Ys" ticking in 100ms granularity
 * - A filled bar fills to elapsed/estimated, capped at 95% so users see forward motion past estimate
 * - Beyond estimated, adds an indeterminate shimmer animation to signal "still working, just longer than usual"
 */
export function RunProgress({ running, estimatedSeconds, label = "计算中", className }: RunProgressProps) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!running) {
      setElapsed(0)
      return
    }
    const started = Date.now()
    const timer = setInterval(() => {
      setElapsed((Date.now() - started) / 1000)
    }, 100)
    return () => clearInterval(timer)
  }, [running])

  if (!running) return null

  const pct = Math.min(95, (elapsed / Math.max(1, estimatedSeconds)) * 100)
  const overrun = elapsed > estimatedSeconds

  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <div className="flex items-center justify-between text-xs text-[#86868b]">
        <span>{label}… 已用 {elapsed.toFixed(1)}s</span>
        <span>预估 ~{estimatedSeconds}s{overrun && "（超时，仍在处理）"}</span>
      </div>
      <div className="h-1.5 rounded-full bg-foreground/10 overflow-hidden">
        <div
          className={`h-full bg-primary transition-[width] duration-100 ease-linear ${
            overrun ? "animate-pulse" : ""
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
