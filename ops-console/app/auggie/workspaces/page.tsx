import { promises as fs } from "node:fs"
import path from "node:path"
import { Card, CardContent } from "@/components/ui/card"
import WorkspacesTable from "./table"

export const revalidate = 60

export interface Workspace {
  id: string
  path: string
  abs_path?: string
  github: string | null
  visibility: string
  status: string
  type: string
  indexable: boolean
  notes?: string
}

export interface HealthRecord {
  warmup_at: string
  duration_s: number
  status: string
  avg_relevance: number
  result_count: number | null
  error: string | null
}

const REGISTRY_CANDIDATES = [
  path.join(process.cwd(), "data/auggie-workspaces.json"),
  "/opt/ops-console/data/auggie-workspaces.json",
  path.join(process.env.HOME || "", "Dev/tools/configs/auggie-workspaces.json"),
]

const HEALTH_CANDIDATES = [
  path.join(process.cwd(), "data/auggie-health.json"),
  "/opt/ops-console/data/auggie-health.json",
  path.join(process.env.HOME || "", "Dev/tools/configs/auggie-health.json"),
]

interface RegistryFile {
  version: number
  updated: string
  by_id: Record<string, Workspace>
}

interface HealthFile {
  version: number
  updated: string
  by_id: Record<string, HealthRecord>
}

async function loadJSON<T>(candidates: string[]): Promise<{ data?: T; source?: string }> {
  for (const p of candidates) {
    try {
      return { data: JSON.parse(await fs.readFile(p, "utf-8")) as T, source: p }
    } catch {}
  }
  return {}
}

export default async function WorkspacesPage() {
  const [registry, health] = await Promise.all([
    loadJSON<RegistryFile>(REGISTRY_CANDIDATES),
    loadJSON<HealthFile>(HEALTH_CANDIDATES),
  ])

  if (!registry.data) {
    return (
      <div className="glass-card p-8 text-center text-[#86868b]">
        auggie-workspaces.json 未找到 — 跑 <code>python3 ~/Dev/devtools/lib/tools/auggie_workspaces.py build</code>
      </div>
    )
  }

  const workspaces = Object.values(registry.data.by_id).sort((a, b) => a.id.localeCompare(b.id))
  const healthByID = health.data?.by_id ?? {}

  const total = workspaces.length
  const indexable = workspaces.filter((w) => w.indexable).length
  const okCount = Object.values(healthByID).filter((r) => r.status === "ok").length
  const timeoutCount = Object.values(healthByID).filter((r) => r.status === "timeout").length

  const healthUpdated = health.data?.updated
    ? new Date(health.data.updated).toLocaleString("zh-CN", { hour12: false })
    : "—"
  const registryUpdated = registry.data.updated
    ? new Date(registry.data.updated).toLocaleDateString("zh-CN")
    : "—"

  return (
    <div className="space-y-6">
      <header className="flex items-baseline justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Auggie Workspaces</h1>
          <p className="text-xs text-[#86868b] mt-1">
            ~/Dev workspace 注册表 SSOT · registry {registryUpdated} · health {healthUpdated}
          </p>
        </div>
        <span className="text-xs text-[#86868b]">{registry.source?.split("/").slice(-3).join("/")}</span>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Metric label="总数" value={total} />
        <Metric label="✅ Indexable" value={indexable} />
        <Metric label="🟢 Health ok" value={okCount} />
        <Metric label="🟡 Timeout" value={timeoutCount} />
      </div>

      <Card>
        <div className="p-5 border-b border-white/60 flex items-center justify-between">
          <h2 className="font-semibold">Workspace 清单</h2>
          <span className="text-xs text-[#86868b]">按 type / indexable / health 过滤</span>
        </div>
        <CardContent className="p-0">
          <WorkspacesTable workspaces={workspaces} healthByID={healthByID} />
        </CardContent>
      </Card>
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
