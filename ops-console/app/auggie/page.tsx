import { promises as fs } from "node:fs"
import path from "node:path"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import AuggieTable from "./table"

export const revalidate = 60

interface Repo {
  name: string
  visibility: string
  language: string | null
  pushed_at: string
  description: string | null
  html_url: string
  archived: boolean
}

const DATA_CANDIDATES = [
  path.join(process.cwd(), "data/auggie-scan.json"),
  "/opt/ops-console/data/auggie-scan.json",
  path.join(process.env.HOME || "", "Dev/labs/auggie-dashboard/data/scan.json"),
]

async function loadScan(): Promise<{ repos: Repo[]; source?: string; error?: string }> {
  for (const p of DATA_CANDIDATES) {
    try {
      const repos: Repo[] = JSON.parse(await fs.readFile(p, "utf-8"))
      return { repos, source: p }
    } catch {}
  }
  return { repos: [], error: "scan.json not found; run /auggie dash" }
}

export default async function AuggiePage() {
  const { repos, source, error } = await loadScan()

  if (error) return <div className="glass-card p-8 text-center text-[#86868b]">{error}</div>

  const total = repos.length
  const publicCount = repos.filter((r) => r.visibility === "public").length
  const privateCount = repos.filter((r) => r.visibility === "private").length
  const archivedCount = repos.filter((r) => r.archived).length

  return (
    <div className="space-y-6">
      <header className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">GitHub Repos</h1>
          <p className="text-xs text-[#86868b] mt-1">zengtianli · auggie 可检索的全部仓库 · 每 60s 自动刷新</p>
        </div>
        <span className="text-xs text-[#86868b]">{source?.split("/").slice(-3).join("/")}</span>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Metric label="总数" value={total} />
        <Metric label="🟢 公开" value={publicCount} />
        <Metric label="🔒 私有" value={privateCount} />
        <Metric label="📦 归档" value={archivedCount} />
      </div>

      <Card>
        <div className="p-5 border-b border-white/60 flex items-center justify-between">
          <h2 className="font-semibold">仓库清单</h2>
          <span className="text-xs text-[#86868b]">按最近推送时间降序</span>
        </div>
        <CardContent className="p-0">
          <AuggieTable repos={repos} />
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
