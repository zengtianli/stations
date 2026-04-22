import { listSystemdServices, listDocker, systemMetrics } from "@/lib/vps"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function HomePage() {
  const [services, docker, metrics] = await Promise.all([
    listSystemdServices().catch(() => []),
    listDocker().catch(() => []),
    systemMetrics().catch(() => ({ disk: "—", mem: "—", uptime: "—" })),
  ])

  const activeSystemd = services.filter((s) => s.status === "active").length
  const failedSystemd = services.filter((s) => s.status === "failed").length
  const runningDocker = docker.filter((d) => d.status === "running").length

  return (
    <div className="space-y-6">
      <header className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">VPS 控制台</h1>
        <span className="text-xs text-[#86868b]">动态发现，不硬编码服务列表</span>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Metric label="Systemd 活跃" value={`${activeSystemd}`} />
        <Metric label="Systemd 故障" value={`${failedSystemd}`} />
        <Metric label="Docker 运行" value={`${runningDocker}/${docker.length}`} />
        <Metric label="磁盘" value={metrics.disk} />
        <Metric label="内存" value={metrics.mem} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="p-5 border-b border-white/60 flex items-center justify-between">
            <h2 className="font-semibold">Systemd 服务 ({services.length})</h2>
            <span className="text-xs text-[#86868b]">{metrics.uptime}</span>
          </div>
          <CardContent className="p-0 max-h-[480px] overflow-y-auto divide-y divide-white/60">
            {services.length === 0 ? (
              <Empty>没有发现服务（是否运行在 VPS 上？）</Empty>
            ) : (
              services.map((s) => (
                <Row key={s.service}>
                  <StatusDot status={s.status} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[#1d1d1f] truncate">{s.service}</span>
                      {s.domain && (
                        <a
                          href={`https://${s.domain}`}
                          target="_blank"
                          rel="noopener"
                          className="text-xs text-[#0071E3] hover:underline truncate"
                        >
                          {s.domain}
                        </a>
                      )}
                    </div>
                    <div className="text-xs text-[#86868b]">
                      {s.status}
                      {s.memory && ` · ${s.memory}`}
                    </div>
                  </div>
                </Row>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <div className="p-5 border-b border-white/60">
            <h2 className="font-semibold">Docker 容器 ({docker.length})</h2>
          </div>
          <CardContent className="p-0 divide-y divide-white/60">
            {docker.length === 0 ? (
              <Empty>无 Docker 容器或 docker 不可用</Empty>
            ) : (
              docker.map((d) => (
                <Row key={d.name}>
                  <StatusDot status={d.status === "running" ? "active" : "inactive"} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[#1d1d1f] truncate">{d.name}</div>
                    <div className="text-xs text-[#86868b] truncate">{d.detail}</div>
                  </div>
                </Row>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="metric-label mb-1">{label}</div>
        <div className="metric-value">{value}</div>
      </CardContent>
    </Card>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-3 px-5 py-3 hover:bg-white/40 transition">{children}</div>
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="p-8 text-center text-sm text-[#86868b]">{children}</div>
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === "active" ? "bg-emerald-500" : status === "failed" ? "bg-red-500" : "bg-gray-400"
  return <span className={`w-2 h-2 rounded-full ${color} shrink-0`} aria-hidden />
}
