import type { ReactNode } from "react"
import { cn } from "../lib/utils"

export interface SiteHeaderProps {
  title: string
  subtitle?: string
  badge?: ReactNode
  /** Rendered below subtitle — CTAs, meta info, etc. */
  children?: ReactNode
  className?: string
}

/**
 * Site-wide "hero" header block. Sits below SiteNav (which is fixed; add pt-16
 * to the page wrapper) and above page content.
 *
 * Intentionally minimal: picks up bg from `--track-bg` when the root has
 * `data-track="..."` so each subdomain's accent bleeds through without extra code.
 */
export function SiteHeader({ title, subtitle, badge, children, className }: SiteHeaderProps) {
  return (
    <header
      className={cn(
        "w-full border-b border-[#E5E5E5]",
        "bg-[var(--track-bg,theme(colors.background))]",
        className,
      )}
    >
      <div className="max-w-[1280px] mx-auto px-6 md:px-8 py-10 md:py-14">
        <div className="flex flex-col gap-3">
          {badge && <div className="flex items-center gap-2 text-sm">{badge}</div>}
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-[#111111]">
            {title}
          </h1>
          {subtitle && (
            <p className="text-base md:text-lg text-[#6B7177] max-w-3xl">{subtitle}</p>
          )}
          {children && <div className="mt-2">{children}</div>}
        </div>
      </div>
    </header>
  )
}

export default SiteHeader
