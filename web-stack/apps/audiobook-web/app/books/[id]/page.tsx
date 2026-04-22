"use client"

import { useEffect, useRef, useState } from "react"
import { use } from "react"
import Link from "next/link"
import { audiobook, type BookDetail } from "@tlz/api-clients"
import { SiteHeader, LiquidGlassCard, cn } from "@tlz/ui"

interface PlayerPageProps {
  params: Promise<{ id: string }>
}

const STATUS_LABEL = {
  queued: "排队中",
  generating: "生成中",
  done: "已完成",
  error: "失败",
} as const

export default function PlayerPage({ params }: PlayerPageProps) {
  const { id } = use(params)
  const [book, setBook] = useState<BookDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentChapter, setCurrentChapter] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    let cancelled = false
    audiobook.getBook(id).then((b) => {
      if (!cancelled) setBook(b)
    }).catch((e) => {
      if (!cancelled) setError(e instanceof Error ? e.message : String(e))
    })
    return () => { cancelled = true }
  }, [id])

  // Subscribe to progress while generating
  useEffect(() => {
    if (!book) return
    if (book.status === "done" || book.status === "error") return
    const stop = audiobook.subscribeProgress(
      id,
      (ev) => {
        setBook(ev)
      },
      () => {
        /* SSE errors are usually transient; keep the last snapshot. */
      },
    )
    return () => stop()
  }, [id, book?.status])

  if (error) {
    return (
      <>
        <SiteHeader title="书不存在或后端离线" badge={<Link href="/" className="text-sm underline">← 返回书架</Link>} />
        <main className="max-w-3xl mx-auto px-6 py-10">
          <LiquidGlassCard className="p-8 text-sm text-rose-700">{error}</LiquidGlassCard>
        </main>
      </>
    )
  }

  if (!book) {
    return (
      <>
        <SiteHeader title="加载中…" badge={<Link href="/" className="text-sm underline">← 返回书架</Link>} />
        <main className="max-w-3xl mx-auto px-6 py-10">
          <LiquidGlassCard className="p-8 text-sm text-[#86868b]">正在获取 {id}</LiquidGlassCard>
        </main>
      </>
    )
  }

  const done = book.chapters.filter((c) => c.status === "done").length
  const total = book.chapters.length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  const canPlay = book.chapters[currentChapter]?.status === "done"

  return (
    <>
      <SiteHeader
        title={book.title}
        subtitle={`${book.voice} · ${total} 章 · 已完成 ${done} / ${total}`}
        badge={
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm underline-offset-4 hover:underline text-foreground/70">← 返回书架</Link>
            <span className="inline-flex items-center rounded-full border border-foreground/10 bg-background/60 px-3 py-1 text-xs font-medium text-foreground/70">
              {STATUS_LABEL[book.status]}
            </span>
          </div>
        }
      />

      <main className="max-w-5xl mx-auto px-6 md:px-8 py-10 md:py-14 space-y-8">
        {book.status !== "done" && (
          <LiquidGlassCard className="p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground/80">生成进度</span>
              <span className="font-medium text-foreground">{pct}%</span>
            </div>
            <div className="mt-2 h-2 bg-foreground/5 rounded-full overflow-hidden">
              <div className="h-full bg-[hsl(var(--track-accent))] transition-all" style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-2 text-xs text-[#86868b]">
              通过 <code className="rounded bg-foreground/10 px-1">/api/books/{id}/progress</code> 的 SSE 实时更新
            </div>
          </LiquidGlassCard>
        )}

        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">
          {/* Chapter list */}
          <LiquidGlassCard className="p-3 h-fit">
            <div className="max-h-[60vh] overflow-y-auto">
              <ul className="space-y-1">
                {book.chapters.map((ch, i) => {
                  const active = i === currentChapter
                  const ready = ch.status === "done"
                  return (
                    <li key={ch.index}>
                      <button
                        type="button"
                        disabled={!ready}
                        onClick={() => setCurrentChapter(i)}
                        className={cn(
                          "w-full text-left rounded-xl px-3 py-2 text-sm transition",
                          active ? "bg-foreground text-background" : "hover:bg-foreground/5",
                          !ready && "opacity-50 cursor-not-allowed",
                        )}
                      >
                        <div className="font-medium truncate">{ch.title || `第 ${i + 1} 章`}</div>
                        <div className={cn("text-[11px] mt-0.5", active ? "text-background/70" : "text-[#86868b]")}>
                          {ch.status === "done" ? `${Math.round(ch.duration)}s · ${ch.sentence_count} 句` : STATUS_LABEL[ch.status as keyof typeof STATUS_LABEL] ?? ch.status}
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          </LiquidGlassCard>

          {/* Player */}
          <div className="space-y-4">
            <LiquidGlassCard className="p-6">
              <div className="text-xs text-[#86868b] mb-2">当前章节</div>
              <h2 className="text-lg font-semibold">{book.chapters[currentChapter]?.title || `第 ${currentChapter + 1} 章`}</h2>
              <div className="mt-4">
                {canPlay ? (
                  <audio
                    ref={audioRef}
                    key={`${id}-${currentChapter}`}
                    controls
                    preload="metadata"
                    src={audiobook.audioUrl(id, currentChapter)}
                    className="w-full"
                  />
                ) : (
                  <div className="rounded-xl bg-foreground/5 px-4 py-6 text-sm text-center text-[#86868b]">
                    等待本章生成完成后可播放
                  </div>
                )}
              </div>
            </LiquidGlassCard>

            <LiquidGlassCard className="p-6 text-sm text-[#86868b]">
              <div className="text-xs uppercase tracking-wider text-foreground/60 mb-2">Next iteration</div>
              逐句高亮（sync 数据已经由 <code className="rounded bg-foreground/10 px-1 text-xs">/api/books/{id}/sync/&#123;ch&#125;</code> 提供，此处占位；预计结合 audio.ontimeupdate + sentence timestamps 渲染）。
            </LiquidGlassCard>
          </div>
        </div>
      </main>
    </>
  )
}
