"use client"

import { useCallback, useEffect, useState, type FormEvent } from "react"
import Link from "next/link"
import { hydroToolkit, type HydroPlugin } from "@tlz/api-clients"
import { SiteHeader, LiquidGlassCard, cn } from "@tlz/ui"

type Toast = { kind: "ok" | "err"; message: string } | null

export default function PluginsPage() {
  const [plugins, setPlugins] = useState<HydroPlugin[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [gitUrl, setGitUrl] = useState("")
  const [busy, setBusy] = useState<string | null>(null)
  const [toast, setToast] = useState<Toast>(null)

  const refresh = useCallback(async () => {
    try {
      const ps = await hydroToolkit.listPlugins()
      setPlugins(ps)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  async function onInstall(e: FormEvent) {
    e.preventDefault()
    if (!gitUrl.trim()) return
    setBusy("install")
    try {
      const r = await hydroToolkit.installPlugin({ git_url: gitUrl.trim() })
      setToast({ kind: "ok", message: r.message })
      setGitUrl("")
      await refresh()
    } catch (e) {
      setToast({ kind: "err", message: e instanceof Error ? e.message : String(e) })
    } finally {
      setBusy(null)
    }
  }

  async function onUninstall(dirName: string) {
    if (!confirm(`确定卸载插件 ${dirName}?`)) return
    setBusy(`uninstall-${dirName}`)
    try {
      const r = await hydroToolkit.uninstallPlugin(dirName)
      setToast({ kind: "ok", message: r.message })
      await refresh()
    } catch (e) {
      setToast({ kind: "err", message: e instanceof Error ? e.message : String(e) })
    } finally {
      setBusy(null)
    }
  }

  async function onUpdate(dirName: string) {
    setBusy(`update-${dirName}`)
    try {
      const r = await hydroToolkit.updatePlugin(dirName)
      setToast({ kind: "ok", message: r.message })
      await refresh()
    } catch (e) {
      setToast({ kind: "err", message: e instanceof Error ? e.message : String(e) })
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <SiteHeader
        title="插件管理"
        subtitle="安装 / 更新 / 卸载 hydro-* 插件。git clone → pip install → 自动 sidecar。"
        badge={<Link href="/" className="text-sm underline-offset-4 hover:underline text-foreground/70">← 返回插件网格</Link>}
      />

      <main className="max-w-5xl mx-auto px-6 md:px-8 py-10 md:py-14 space-y-8">
        <LiquidGlassCard className="p-6">
          <form onSubmit={onInstall} className="flex flex-col md:flex-row gap-3">
            <input
              type="url"
              value={gitUrl}
              onChange={(e) => setGitUrl(e.target.value)}
              placeholder="https://github.com/zengtianli/hydro-xxx"
              className="flex-1 rounded-full border border-input bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={busy === "install"}
              className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {busy === "install" ? "安装中…" : "安装"}
            </button>
          </form>
        </LiquidGlassCard>

        {error && (
          <LiquidGlassCard className="p-5 text-sm text-rose-700">
            {error.includes("fetch") || error.includes("Failed") ? "后端未启动 — 先跑 uv run uvicorn api:app --port 8610" : error}
          </LiquidGlassCard>
        )}

        <LiquidGlassCard className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-foreground/5 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold">插件</th>
                <th className="px-4 py-3 font-semibold hidden md:table-cell">版本</th>
                <th className="px-4 py-3 font-semibold hidden md:table-cell">描述</th>
                <th className="px-4 py-3 font-semibold text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {plugins === null && !error && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-[#86868b]">加载中…</td></tr>
              )}
              {plugins && plugins.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-[#86868b]">还没有插件</td></tr>
              )}
              {plugins?.map((p) => (
                <tr key={p.name} className="border-t border-foreground/5 hover:bg-foreground/[0.02]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{p.icon}</span>
                      <div className="min-w-0">
                        <div className="font-medium text-foreground truncate">{p.title}</div>
                        <div className="text-[11px] text-[#86868b] font-mono truncate">{p.dir_name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#86868b] hidden md:table-cell">v{p.version}</td>
                  <td className="px-4 py-3 text-[#86868b] hidden md:table-cell max-w-sm truncate">{p.description || "—"}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onUpdate(p.dir_name)}
                      disabled={busy === `update-${p.dir_name}`}
                      className="mr-2 inline-flex items-center rounded-full border border-input px-3 py-1 text-xs hover:bg-foreground/5 disabled:opacity-50"
                    >
                      {busy === `update-${p.dir_name}` ? "更新中…" : "更新"}
                    </button>
                    <button
                      type="button"
                      onClick={() => onUninstall(p.dir_name)}
                      disabled={busy === `uninstall-${p.dir_name}`}
                      className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 text-rose-700 px-3 py-1 text-xs hover:bg-rose-100 disabled:opacity-50"
                    >
                      {busy === `uninstall-${p.dir_name}` ? "卸载中…" : "卸载"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </LiquidGlassCard>

        {toast && (
          <div
            className={cn(
              "fixed bottom-6 right-6 z-50 rounded-full px-5 py-2.5 text-sm shadow-lg border",
              toast.kind === "ok"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800",
            )}
          >
            {toast.message}
          </div>
        )}
      </main>
    </>
  )
}
