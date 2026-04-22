import { promises as fs } from "node:fs"
import path from "node:path"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShortcutToggle } from "@/components/shortcut-toggle"

export const dynamic = "force-dynamic"

interface Hotkey {
  mods: string
  mods_display?: string
  key: string
  desc: string
  module: string
  func: string
  scope: string
  source?: string
}

interface PassiveFeature {
  name: string
  module: string
  desc: string
}

interface HsConfig {
  hotkeys: Hotkey[]
  modules: any[]
  settings?: Record<string, any>
  passive_features?: PassiveFeature[]
  exported_at?: string
}

interface RaycastCommand {
  file: string
  title: string
  description: string
  icon: string
  package: string
  mode: string
  project: string
  source: "raycast"
}

interface RaycastIndex {
  commands: RaycastCommand[]
  exported_at?: string
}

interface Prefs {
  hotkeys: Record<string, { enabled?: boolean }>
  raycast: Record<string, { enabled?: boolean }>
}

const HS_CANDIDATES = [
  path.join(process.cwd(), "data/hs_config.json"),
  "/opt/ops-console/data/hs_config.json",
  path.join(process.env.HOME || "", "Dev/ops-console/data/hs_config.json"),
]

const RAYCAST_CANDIDATES = [
  path.join(process.cwd(), "data/raycast_index.json"),
  "/opt/ops-console/data/raycast_index.json",
  path.join(process.env.HOME || "", "Dev/ops-console/data/raycast_index.json"),
]

const PREFS_PATH = path.join(process.cwd(), "data/hs_prefs.json")

async function loadFirst<T>(paths: string[]): Promise<{ data?: T; source?: string; error?: string }> {
  for (const p of paths) {
    try {
      const raw = await fs.readFile(p, "utf-8")
      return { data: JSON.parse(raw) as T, source: p }
    } catch {}
  }
  return { error: "not found" }
}

async function loadPrefs(): Promise<Prefs> {
  try {
    const raw = await fs.readFile(PREFS_PATH, "utf-8")
    const parsed = JSON.parse(raw)
    return { hotkeys: parsed.hotkeys || {}, raycast: parsed.raycast || {} }
  } catch {
    return { hotkeys: {}, raycast: {} }
  }
}

function hotkeyId(h: Hotkey): string {
  return `${(h.scope || "global").toLowerCase()}:${h.mods}:${h.key}`
}

export default async function HammerspoonPage() {
  const { data: cfg, source: hsSource, error: hsError } = await loadFirst<HsConfig>(HS_CANDIDATES)
  const { data: ray } = await loadFirst<RaycastIndex>(RAYCAST_CANDIDATES)
  const prefs = await loadPrefs()

  if (hsError || !cfg) {
    return <div className="glass-card p-8 text-center text-[#86868b]">hs_config.json not found</div>
  }

  const hotkeys = cfg.hotkeys || []
  const finderCount = hotkeys.filter((h) => (h.scope || "").toLowerCase() === "finder").length
  const globalCount = hotkeys.filter((h) => (h.scope || "").toLowerCase() === "global").length
  const passive = cfg.passive_features || []
  const raycast = ray?.commands || []

  const byModule = new Map<string, Hotkey[]>()
  for (const h of hotkeys) {
    if (!byModule.has(h.module)) byModule.set(h.module, [])
    byModule.get(h.module)!.push(h)
  }

  return (
    <div className="space-y-6">
      <header className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Hammerspoon 配置</h1>
        <span className="text-xs text-[#86868b]">
          {cfg.exported_at ? `导出于 ${cfg.exported_at}` : hsSource?.split("/").slice(-2).join("/")}
        </span>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Metric label="HS 快捷键" value={hotkeys.length} />
        <Metric label="Finder 专用" value={finderCount} />
        <Metric label="全局" value={globalCount} />
        <Metric label="Raycast 脚本" value={raycast.length} />
        <Metric label="被动特性" value={passive.length} />
      </div>

      <Card>
        <div className="p-5 border-b border-white/60 flex items-center justify-between">
          <h2 className="font-semibold">快捷键（🔨 Hammerspoon，按模块分组）</h2>
          <span className="text-xs text-[#86868b]">勾选即生效，本地 5 分钟内回灌</span>
        </div>
        <CardContent className="p-0 divide-y divide-white/60">
          {Array.from(byModule.entries()).map(([mod, keys]) => (
            <div key={mod} className="px-5 py-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-[#1d1d1f]">{mod}</span>
                <Badge variant="muted">{keys.length}</Badge>
              </div>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                {keys.map((h) => {
                  const id = hotkeyId(h)
                  const enabled = prefs.hotkeys[id]?.enabled !== false
                  return (
                    <li key={id} className="flex items-center gap-2">
                      <ShortcutToggle id={id} kind="hotkeys" initialEnabled={enabled} />
                      <kbd className="font-mono text-xs px-1.5 py-0.5 rounded bg-white/60 border border-white/80 shrink-0">
                        {h.mods_display || ""}{(h.key || "").toUpperCase()}
                      </kbd>
                      <span className="text-[#1d1d1f] truncate">{h.desc}</span>
                      <span className="text-[11px] text-[#86868b] ml-auto shrink-0">
                        🔨 {(h.scope || "").toLowerCase() === "finder" ? "🖥" : "🌐"}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>

      {raycast.length > 0 && (
        <Card>
          <div className="p-5 border-b border-white/60 flex items-center justify-between">
            <h2 className="font-semibold">Raycast 脚本（🚀 来自各项目 raycast/commands/）</h2>
            <span className="text-xs text-[#86868b]">{raycast.length} 条</span>
          </div>
          <CardContent className="p-0 divide-y divide-white/60">
            <ul className="text-sm">
              {raycast.map((r) => {
                const id = r.file
                const enabled = prefs.raycast[id]?.enabled !== false
                return (
                  <li key={id} className="flex items-center gap-2 px-5 py-1.5">
                    <ShortcutToggle id={id} kind="raycast" initialEnabled={enabled} />
                    <span className="text-base shrink-0 w-5 text-center">{r.icon || "•"}</span>
                    <span className="font-medium text-[#1d1d1f] shrink-0">{r.title}</span>
                    <span className="text-[#86868b] truncate">{r.description || "—"}</span>
                    <Badge variant="muted" className="ml-auto shrink-0">{r.project}</Badge>
                    <span className="text-[11px] text-[#86868b] shrink-0">🚀</span>
                  </li>
                )
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      {passive.length > 0 && (
        <Card>
          <div className="p-5 border-b border-white/60">
            <h2 className="font-semibold">被动特性（不可在网页启停）</h2>
          </div>
          <CardContent>
            <ul className="text-sm space-y-1">
              {passive.map((p, i) => (
                <li key={i}>
                  <span className="font-medium">{p.name}</span>
                  <span className="text-[#86868b] ml-2">({p.module})</span>
                  <span className="text-[#86868b] ml-2">— {p.desc}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="metric-label mb-1">{label}</div>
        <div className="metric-value">{value}</div>
      </CardContent>
    </Card>
  )
}
