"use client"

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { audiobook, type VoiceCatalog } from "@tlz/api-clients"
import { SiteHeader, LiquidGlassCard, cn } from "@tlz/ui"

type Mode = "file" | "text" | "url"

export default function UploadPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>("file")
  const [file, setFile] = useState<File | null>(null)
  const [text, setText] = useState("")
  const [url, setUrl] = useState("")
  const [voice, setVoice] = useState<string>("")
  const [catalog, setCatalog] = useState<VoiceCatalog | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    audiobook.listVoices().then((c) => {
      setCatalog(c)
      setVoice(c.default)
    }).catch(() => {
      setCatalog({ voices: {}, default: "xiaoxiao" })
      setVoice("xiaoxiao")
    })
  }, [])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const source = mode === "file" ? file : mode === "text" ? text : url
      if (!source || (typeof source === "string" && !source.trim())) {
        throw new Error(mode === "file" ? "请选择文件" : mode === "text" ? "请粘贴内容" : "请填写 URL")
      }
      const payload = mode === "file"
        ? { source_type: "file" as const, source: file as File, file_name: (file as File).name, voice }
        : { source_type: mode, source: source as string, voice }
      const result = await audiobook.createBook(payload)
      router.push(`/books/${encodeURIComponent(result.id)}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setSubmitting(false)
    }
  }

  const voices = catalog ? Object.entries(catalog.voices) : []

  return (
    <>
      <SiteHeader
        title="上传 Markdown"
        subtitle="选一种方式投稿；系统会自动按 ## 拆章节，生成音频与逐句同步数据。"
        badge={
          <Link href="/" className="text-sm underline-offset-4 hover:underline text-foreground/70">
            ← 返回书架
          </Link>
        }
      />

      <main className="max-w-3xl mx-auto px-6 md:px-8 py-10 md:py-14">
        <LiquidGlassCard className="p-6 md:p-8">
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Mode tabs */}
            <div className="flex gap-1 p-1 bg-foreground/5 rounded-full w-fit">
              {(["file", "text", "url"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={cn(
                    "px-4 py-1.5 text-sm rounded-full transition",
                    mode === m ? "bg-white shadow-sm text-foreground" : "text-[#86868b] hover:text-foreground",
                  )}
                >
                  {m === "file" ? "上传文件" : m === "text" ? "粘贴文本" : "外链 URL"}
                </button>
              ))}
            </div>

            {/* Source input */}
            {mode === "file" && (
              <div>
                <label className="block text-sm font-medium mb-2">Markdown 文件（≤ 200KB）</label>
                <input
                  type="file"
                  accept=".md,.markdown,text/markdown,text/plain"
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-foreground file:text-background file:text-sm file:font-medium hover:file:opacity-90"
                />
              </div>
            )}
            {mode === "text" && (
              <div>
                <label className="block text-sm font-medium mb-2">Markdown 文本</label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={12}
                  placeholder="# 书名&#10;## 章节 1&#10;段落…"
                  className="w-full rounded-2xl border border-input bg-white px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            )}
            {mode === "url" && (
              <div>
                <label className="block text-sm font-medium mb-2">Markdown URL</label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/book.md"
                  className="w-full rounded-full border border-input bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            )}

            {/* Voice selector */}
            <div>
              <label className="block text-sm font-medium mb-2">音色</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {voices.length === 0 && (
                  <div className="col-span-4 text-sm text-[#86868b]">加载音色列表…</div>
                )}
                {voices.map(([key, v]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setVoice(key)}
                    className={cn(
                      "rounded-2xl border px-3 py-2.5 text-sm text-left transition",
                      voice === key
                        ? "border-foreground bg-foreground/5 text-foreground font-medium"
                        : "border-input hover:border-foreground/40",
                    )}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "提交中…" : "开始生成"}
            </button>
          </form>
        </LiquidGlassCard>
      </main>
    </>
  )
}
