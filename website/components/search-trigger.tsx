"use client"

import { useState, useEffect, useCallback } from "react"
import { Command } from "cmdk"

const SEARCH_API = "/api/search"
const SEARCH_PAGE = "/search"

type SearchResult = {
  slug: string
  url: string
  title: string
  description: string
  category: string
  site: string
  snippet: string
}

export function SearchTrigger() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  useEffect(() => {
    if (!open) return
    if (!query || query.length < 2) {
      setResults([])
      return
    }
    setLoading(true)
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`${SEARCH_API}?q=${encodeURIComponent(query)}`)
        const data = await r.json()
        setResults(data.results || [])
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 250)
    return () => clearTimeout(t)
  }, [query, open])

  const close = useCallback(() => {
    setOpen(false)
    setQuery("")
    setResults([])
  }, [])

  const goToFullSearch = useCallback(() => {
    window.location.href = `${SEARCH_PAGE}?q=${encodeURIComponent(query)}`
  }, [query])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="搜索 (⌘K)"
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-[#6b7280] hover:text-[#1f2328] hover:bg-black/[0.05] transition-colors"
      >
        <SearchIcon className="h-4 w-4" />
        <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded border border-black/10 text-[10px] font-mono text-[#86868b]">
          ⌘K
        </kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh] bg-black/30 backdrop-blur-sm"
          onClick={close}
        >
          <Command
            label="全局搜索"
            className="w-full max-w-xl mx-4 rounded-xl border border-black/10 bg-white shadow-2xl overflow-hidden"
            shouldFilter={false}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-black/10">
              <SearchIcon className="h-4 w-4 text-[#86868b]" />
              <Command.Input
                value={query}
                onValueChange={setQuery}
                placeholder="搜索整个站群（博客 / 项目 / 子站 / 命令...）"
                autoFocus
                className="flex-1 outline-none bg-transparent text-sm placeholder:text-[#86868b]"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && query.length >= 2 && results.length === 0) {
                    goToFullSearch()
                  }
                }}
              />
              <kbd className="text-[10px] text-[#86868b] px-1.5 py-0.5 rounded border border-black/10">
                ESC
              </kbd>
            </div>

            <Command.List className="max-h-[60vh] overflow-y-auto py-2">
              {loading && (
                <div className="px-4 py-3 text-sm text-[#86868b]">搜索中…</div>
              )}
              {!loading && query.length >= 2 && results.length === 0 && (
                <div className="px-4 py-3 text-sm text-[#86868b]">
                  无结果。<button onClick={goToFullSearch} className="text-[#0071E3] underline">查看完整搜索</button>
                </div>
              )}
              {!loading && results.length > 0 && (
                <Command.Group>
                  {results.map((r) => (
                    <Command.Item
                      key={r.slug + r.url}
                      value={r.slug + r.url}
                      onSelect={() => { window.location.href = r.url }}
                      className="px-4 py-2.5 cursor-pointer hover:bg-black/[0.04] aria-selected:bg-black/[0.04]"
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <div className="font-medium text-sm text-[#1d1d1f]">{r.title}</div>
                        <div className="text-[11px] text-[#86868b] shrink-0">{r.site || r.category}</div>
                      </div>
                      {r.description && (
                        <div className="text-xs text-[#6b7280] mt-0.5 line-clamp-1">{r.description}</div>
                      )}
                    </Command.Item>
                  ))}
                </Command.Group>
              )}
              {!loading && query.length >= 2 && results.length > 0 && (
                <div className="px-4 py-2 border-t border-black/10 mt-1">
                  <button onClick={goToFullSearch} className="text-xs text-[#0071E3] hover:underline">
                    查看全部 {results.length} 个结果 →
                  </button>
                </div>
              )}
              {query.length < 2 && (
                <div className="px-4 py-3 text-xs text-[#86868b]">
                  输入 2 个字符以上开始搜索 · 跨站索引含 13 个子域 + 主站内容
                </div>
              )}
            </Command.List>
          </Command>
        </div>
      )}
    </>
  )
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}
