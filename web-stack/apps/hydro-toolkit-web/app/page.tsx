"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { hydroToolkit, type HydroPlugin } from "@tlz/api-clients"
import { SiteHeader, LiquidGlassCard, StatCard, cn } from "@tlz/ui"

export default function HomePage() {
  const [plugins, setPlugins] = useState<HydroPlugin[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    hydroToolkit.listPlugins()
      .then((ps) => { if (!cancelled) setPlugins(ps) })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : String(e)) })
    return () => { cancelled = true }
  }, [])

  const stats = useMemo(() => {
    if (!plugins) return { total: "—", active: "—" }
    return {
      total: plugins.length.toString(),
      active: plugins.length.toString(),
    }
  }, [plugins])

  return (
    <>
      <SiteHeader
        title="Hydro Toolkit"
        subtitle="水利计算工具集 · 插件化架构"
        badge={
          <span className="inline-flex items-center rounded-full bg-foreground/5 px-3 py-1 text-xs font-medium text-foreground/70">
            pilot · track=hydro
          </span>
        }
      >
        <Link
          href="/plugins"
          className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          管理插件
        </Link>
      </SiteHeader>

      <main className="max-w-[1280px] mx-auto px-6 md:px-8 py-10 md:py-14 space-y-10">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard label="已安装插件" value={stats.total} hint={error ? "后端离线" : "来自 /api/plugins"} trend={error ? "down" : "flat"} />
          <StatCard label="激活" value={stats.active} hint="可跳转子域" />
          <StatCard label="已注册子域" value="9" hint="hydro 生态" />
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">插件</h2>
            {error && (
              <span className="text-xs text-rose-600">
                后端未启动 — 先跑 <code className="rounded bg-foreground/10 px-1">uv run uvicorn api:app --port 8610</code>
              </span>
            )}
          </div>

          {plugins === null && !error && (
            <LiquidGlassCard className="p-10 text-center text-[#86868b]">加载中…</LiquidGlassCard>
          )}
          {plugins && plugins.length === 0 && (
            <LiquidGlassCard className="p-10 text-center text-[#86868b]">
              还没有插件 — <Link href="/plugins" className="underline">去安装一个</Link>。
            </LiquidGlassCard>
          )}

          {plugins && plugins.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plugins.map((p) => (
                <a
                  key={p.name}
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group block focus:outline-none focus:ring-2 focus:ring-ring rounded-2xl"
                >
                  <LiquidGlassCard className="p-5 h-full transition group-hover:shadow-md">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--track-accent))]/15 text-xl">
                        {p.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold text-foreground">{p.title}</h3>
                          <span className="text-[11px] text-[#86868b]">v{p.version}</span>
                        </div>
                        <p className="mt-1 text-sm text-[#86868b] line-clamp-2">{p.description || "—"}</p>
                      </div>
                    </div>
                    <div className="mt-4 text-[11px] text-[#86868b] break-all">{p.url.replace("https://", "")}</div>
                  </LiquidGlassCard>
                </a>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  )
}
