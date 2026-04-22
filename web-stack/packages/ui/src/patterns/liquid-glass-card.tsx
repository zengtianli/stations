import type { HTMLAttributes } from "react"
import { cn } from "../lib/utils"

export interface LiquidGlassCardProps extends HTMLAttributes<HTMLDivElement> {}

/**
 * Apple-liquid-glass card variant used across website and refreshed sites.
 * Matches website CLAUDE.md recipe: `bg-white/50 backdrop-blur-xl border border-white/60 shadow-sm rounded-2xl`.
 */
export function LiquidGlassCard({ className, children, ...props }: LiquidGlassCardProps) {
  return (
    <div
      className={cn(
        "bg-white/50 backdrop-blur-xl border border-white/60 shadow-sm rounded-2xl",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export default LiquidGlassCard
