"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { audiobook, type BookSummary } from "@tlz/api-clients"
import { SiteHeader, LiquidGlassCard, StatCard, cn } from "@tlz/ui"

const STATUS_LABEL: Record<BookSummary["status"], string> = {
  queued: "排队中",
  generating: "生成中",
  done: "已完成",
  error: "失败",
}

const STATUS_CHIP: Record<BookSummary["status"], string> = {
  queued: "bg-amber-50 text-amber-700 border-amber-200",
  generating: "bg-blue-50 text-blue-700 border-blue-200",
  done: "bg-emerald-50 text-emerald-700 border-emerald-200",
  error: "bg-rose-50 text-rose-700 border-rose-200",
}

function formatDuration(sec: number): string {
  if (!sec || sec <= 0) return "--"
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${String(s).padStart(2, "0")}`
}

function formatDate(iso: string): string {
  if (!iso) return ""
  try {
    return new Date(iso).toLocaleString("zh-CN", { hour12: false })
  } catch {
    return iso
  }
}

export default function HomePage() {
  const [books, setBooks] = useState<BookSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const list = await audiobook.listBooks()
        if (!cancelled) setBooks(list)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e))
      }
    }
    load()
    const t = setInterval(load, 5000)
    return () => {
      cancelled = true
      clearInterval(t)
    }
  }, [])

  const stats = useMemo(() => {
    if (!books) return { total: "—", generating: "—", done: "—" }
    return {
      total: books.length.toString(),
      generating: books.filter((b) => b.status === "generating" || b.status === "queued").length.toString(),
      done: books.filter((b) => b.status === "done").length.toString(),
    }
  }, [books])

  return (
    <>
      <SiteHeader
        title="Audiobook"
        subtitle="把 Markdown 变成逐句同步高亮的有声书"
        badge={
          <span className="inline-flex items-center rounded-full bg-foreground/5 px-3 py-1 text-xs font-medium text-foreground/70">
            pilot · Next.js 迁移验证
          </span>
        }
      >
        <Link
          href="/upload"
          className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          上传 Markdown
        </Link>
      </SiteHeader>

      <main className="max-w-[1280px] mx-auto px-6 md:px-8 py-10 md:py-14 space-y-10">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard label="已生成书籍" value={stats.total} hint={error ? "后端离线" : "来自 /api/books"} trend={error ? "down" : "flat"} />
          <StatCard label="排队/生成中" value={stats.generating} hint="每 5s 自动刷新" />
          <StatCard label="已完成" value={stats.done} hint="可播放" />
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">书架</h2>
            {error && (
              <span className="text-xs text-rose-600">
                {error.includes("fetch") || error.includes("Failed") ? "后端未启动 — 先跑 uvicorn app.main:app --port 9200" : error}
              </span>
            )}
          </div>
          {books === null && !error && (
            <LiquidGlassCard className="p-10 text-center text-[#86868b]">加载中…</LiquidGlassCard>
          )}
          {books && books.length === 0 && (
            <LiquidGlassCard className="p-10 text-center text-[#86868b]">
              书架还是空的 — <Link href="/upload" className="underline">上传一本</Link>。
            </LiquidGlassCard>
          )}
          {books && books.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {books.map((b) => (
                <Link
                  key={b.id}
                  href={`/books/${encodeURIComponent(b.id)}`}
                  className="group block focus:outline-none focus:ring-2 focus:ring-ring rounded-2xl"
                >
                  <LiquidGlassCard className="p-5 h-full transition group-hover:shadow-md">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-base font-semibold text-foreground line-clamp-2">{b.title}</h3>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium shrink-0",
                          STATUS_CHIP[b.status],
                        )}
                      >
                        {STATUS_LABEL[b.status]}
                      </span>
                    </div>
                    <dl className="mt-4 grid grid-cols-3 gap-2 text-xs text-[#86868b]">
                      <div>
                        <dt>章节</dt>
                        <dd className="text-foreground font-medium">{b.chapters}</dd>
                      </div>
                      <div>
                        <dt>时长</dt>
                        <dd className="text-foreground font-medium">{formatDuration(b.duration)}</dd>
                      </div>
                      <div>
                        <dt>音色</dt>
                        <dd className="text-foreground font-medium">{b.voice}</dd>
                      </div>
                    </dl>
                    <div className="mt-4 text-[11px] text-[#86868b]">{formatDate(b.created_at)}</div>
                  </LiquidGlassCard>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  )
}
