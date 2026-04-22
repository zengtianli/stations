import type { ReactNode } from "react"
import { cn } from "../lib/utils"

export interface StatCardProps {
  label: string
  value: ReactNode
  hint?: ReactNode
  trend?: "up" | "down" | "flat"
  className?: string
}

/** Stand-in for Streamlit `st.metric`. Pure display, no delta maths. */
export function StatCard({ label, value, hint, trend, className }: StatCardProps) {
  const trendColor =
    trend === "up" ? "text-emerald-600" : trend === "down" ? "text-rose-600" : "text-muted-foreground"
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-5 shadow-sm",
        className,
      )}
    >
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
        {value}
      </div>
      {hint && <div className={cn("mt-2 text-xs", trendColor)}>{hint}</div>}
    </div>
  )
}

export default StatCard
