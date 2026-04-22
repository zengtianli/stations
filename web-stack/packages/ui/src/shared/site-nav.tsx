"use client"

import { useState, useEffect, useRef, useCallback, type ReactNode } from "react"
import {
  SHARED_BRAND,
  MEGA_CATEGORIES,
  SHARED_NO_CURRENT_HOSTS,
  SHARED_CURRENT_HOST_MAP,
  type MegaCategory,
  type MegaGroup,
  type MegaItem,
} from "@tlz/menu-ssot"
import { cn } from "../lib/utils"

export interface SiteNavProps {
  /** Override auto host detection. Pass a MegaCategory key like "home" | "hydro" | "dev" | ... */
  currentKey?: string
  /** Right-hand slot (theme switch, search, etc.) */
  rightSlot?: ReactNode
  className?: string
}

function resolveCurrentKey(host: string): string | null {
  if (SHARED_NO_CURRENT_HOSTS.indexOf(host) !== -1) return null
  const mapped = SHARED_CURRENT_HOST_MAP[host]
  if (mapped) return mapped
  if (host === "hydro.tianlizeng.cloud" || host.indexOf("hydro-") === 0) return "hydro"
  if (host === "tianlizeng.cloud") return "home"
  return null
}

function ItemLink({ item }: { item: MegaItem }) {
  return (
    <a
      href={item.url}
      role="menuitem"
      className="inline-flex items-center gap-2 text-[14px] leading-[28px] font-normal text-[#333333] hover:text-[#D40000] transition-colors no-underline"
    >
      <span>{item.label}</span>
      {item.access === "cf-access" && (
        <span className="inline-flex items-center h-[18px] px-1.5 text-[10px] font-medium tracking-[0.05em] rounded-[3px] border text-[#6B7177] border-[#BFBFBF] shrink-0">
          CF
        </span>
      )}
    </a>
  )
}

function Group({ group }: { group: MegaGroup }) {
  return (
    <div className="mb-6 last:mb-0">
      <h3 className="m-0 mb-3 text-[15px] font-semibold text-[#111111]">{group.title}</h3>
      <ul className="list-none p-0 m-0">
        {group.items.map((it) => (
          <li key={it.url}>
            <ItemLink item={it} />
          </li>
        ))}
      </ul>
    </div>
  )
}

function DesktopPanel({
  category,
  onMouseEnter,
  onMouseLeave,
}: {
  category: MegaCategory
  onMouseEnter: () => void
  onMouseLeave: () => void
}) {
  return (
    <div
      id={`mega-panel-${category.key}`}
      role="menu"
      aria-label={category.label}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="hidden md:block fixed top-16 inset-x-0 bg-[#F5F5F5] shadow-[0_8px_16px_-8px_rgba(0,0,0,0.08)]"
      style={{ maxHeight: "calc(100vh - 64px)", overflowY: "auto" }}
    >
      <div className="max-w-[1280px] w-full mx-auto px-12 py-10 grid grid-cols-4 gap-0 min-h-[320px]">
        {category.columns.map((col, i) => (
          <div
            key={i}
            className={cn(
              "px-6 min-w-0",
              i === 0 && "pl-0",
              i === 3 && "pr-0 border-r-0",
              i !== 3 && "border-r border-[#E0E0E0]",
            )}
          >
            {col.map((g) => (
              <Group key={g.title} group={g} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function SiteNav({ currentKey, rightSlot, className }: SiteNavProps) {
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [resolvedCurrent, setResolvedCurrent] = useState<string | null>(currentKey ?? null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stackRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (currentKey) return
    if (typeof window === "undefined") return
    setResolvedCurrent(resolveCurrentKey(window.location.hostname))
  }, [currentKey])

  const clearHide = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current)
      hideTimer.current = null
    }
  }, [])

  const scheduleHide = useCallback(() => {
    clearHide()
    hideTimer.current = setTimeout(() => setActiveKey(null), 150)
  }, [clearHide])

  const openPanel = useCallback(
    (key: string) => {
      clearHide()
      setActiveKey(key)
    },
    [clearHide],
  )

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (stackRef.current && !stackRef.current.contains(e.target as Node)) {
        setActiveKey(null)
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setActiveKey(null)
        setMobileOpen(false)
      }
    }
    document.addEventListener("click", onDocClick)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("click", onDocClick)
      document.removeEventListener("keydown", onKey)
    }
  }, [])

  const activeCat = MEGA_CATEGORIES.find((c) => c.key === activeKey) || null

  return (
    <div
      ref={stackRef}
      className={cn(
        "fixed top-0 inset-x-0 z-[9999] font-normal text-[15px]",
        "[font-family:-apple-system,BlinkMacSystemFont,'PingFang_SC','Helvetica_Neue',sans-serif]",
        className,
      )}
    >
      <nav
        className="h-16 bg-white border-b border-[#E5E5E5] flex items-center"
        aria-label="站群导航"
      >
        <div className="max-w-[1280px] w-full mx-auto px-6 flex items-center min-w-0">
          <a
            href={SHARED_BRAND.url}
            className="text-[18px] font-medium text-black hover:text-[#D40000] transition-colors no-underline shrink-0"
          >
            {SHARED_BRAND.label}
          </a>
          <span
            aria-hidden="true"
            className="hidden md:inline-block w-px h-8 bg-[#E5E5E5] mx-6 shrink-0"
          />
          <div className="hidden md:flex items-center gap-8 flex-1 min-w-0" role="menubar">
            {MEGA_CATEGORIES.map((cat) => {
              const isActive = activeKey === cat.key
              const isCurrent = resolvedCurrent === cat.key
              return (
                <button
                  key={cat.key}
                  type="button"
                  role="menuitem"
                  aria-haspopup="menu"
                  aria-expanded={isActive}
                  aria-controls={`mega-panel-${cat.key}`}
                  onMouseEnter={() => openPanel(cat.key)}
                  onMouseLeave={scheduleHide}
                  onClick={(e) => {
                    e.preventDefault()
                    setActiveKey(isActive ? null : cat.key)
                  }}
                  className={cn(
                    "bg-transparent border-0 cursor-pointer py-2",
                    "inline-flex items-center gap-1 transition-colors whitespace-nowrap",
                    "text-[15px]",
                    isActive || isCurrent ? "text-black font-medium" : "text-[#333333] font-normal",
                    "hover:text-black",
                  )}
                >
                  <span>{cat.label}</span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "text-[12px] opacity-60 transition-transform duration-[180ms] ease-out",
                      isActive && "rotate-180",
                    )}
                  >
                    ▾
                  </span>
                </button>
              )
            })}
          </div>
          <div className="hidden md:flex items-center gap-2 ml-auto shrink-0">{rightSlot}</div>
          <button
            type="button"
            className="md:hidden ml-auto p-2 text-[#333333] hover:text-black text-[20px]"
            aria-label={mobileOpen ? "关闭菜单" : "打开菜单"}
            aria-expanded={mobileOpen}
            onClick={() => {
              setMobileOpen((v) => !v)
              setActiveKey(null)
            }}
          >
            {mobileOpen ? "✕" : "☰"}
          </button>
        </div>
      </nav>

      {activeCat && (
        <DesktopPanel
          category={activeCat}
          onMouseEnter={clearHide}
          onMouseLeave={scheduleHide}
        />
      )}

      {mobileOpen && (
        <div className="md:hidden fixed top-16 inset-x-0 bottom-0 bg-white overflow-y-auto border-t border-[#E5E5E5] z-[10000]">
          {MEGA_CATEGORIES.map((cat) => {
            const isOpen = activeKey === cat.key
            return (
              <div key={cat.key} className="border-b border-[#E5E5E5]">
                <button
                  type="button"
                  onClick={() => setActiveKey(isOpen ? null : cat.key)}
                  className="flex w-full items-center justify-between px-5 py-4 text-[16px] text-[#333333]"
                  aria-expanded={isOpen}
                >
                  <span className={cn("font-normal", resolvedCurrent === cat.key && "text-black font-medium")}>
                    {cat.label}
                  </span>
                  <span className={cn("text-[12px] opacity-60 transition-transform", isOpen && "rotate-180")}>
                    ▾
                  </span>
                </button>
                {isOpen && (
                  <div className="bg-[#F5F5F5] px-5 pb-4 pt-2">
                    {cat.columns.flat().map((sec) => (
                      <Group key={sec.title} group={sec} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
          <div className="px-5 py-6 text-center text-[13px] text-[#86868b]">{rightSlot}</div>
        </div>
      )}
    </div>
  )
}

export default SiteNav
