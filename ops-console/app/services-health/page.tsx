import { listSystemdServices } from "@/lib/vps"

interface ServiceMetadata {
  name?: string
  title?: string
  version?: string
  service_id?: string
  service_type?: string
  port?: number
}

interface ServiceReport {
  subdomain: string
  public_port: number
  api_port: number
  http_status: number | null
  response_ms: number | null
  metadata: ServiceMetadata | null
  error: string | null
}

interface AggregatorPayload {
  timestamp: string
  scan_duration_ms: number
  summary: { total: number; healthy: number; slow: number; down: number }
  services: ServiceReport[]
}

const WEBSITE_API_BASE = process.env.WEBSITE_API_BASE || "https://tianlizeng.cloud"

async function fetchAggregate(): Promise<AggregatorPayload | null> {
  try {
    const res = await fetch(`${WEBSITE_API_BASE}/api/services-metadata`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return null
    return (await res.json()) as AggregatorPayload
  } catch {
    return null
  }
}

function statusBadge(r: ServiceReport): string {
  if (r.http_status === 200) {
    if (r.response_ms !== null && r.response_ms > 1000) return "🟡 slow"
    return "🟢 ok"
  }
  if (r.http_status) return `🔴 ${r.http_status}`
  return "⚫ down"
}

export default async function ServicesHealthPage() {
  const [agg, systemd] = await Promise.all([
    fetchAggregate(),
    listSystemdServices().catch(() => [] as Awaited<ReturnType<typeof listSystemdServices>>),
  ])

  const systemdByName = new Map(systemd.map((s) => [s.service, s]))

  return (
    <div className="max-w-[1500px] mx-auto px-5 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-[#1f2328]">Services Health</h1>
        <p className="text-sm text-[#6b7280] mt-1">
          Aggregated via <code className="text-xs bg-black/5 px-1 rounded">{WEBSITE_API_BASE}/api/services-metadata</code>
        </p>
      </header>

      {!agg ? (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
          Aggregator unreachable. Check website service status.
        </div>
      ) : (
        <>
          <div className="flex gap-4 mb-6 text-sm">
            <div className="rounded-xl bg-white/60 border border-black/5 px-4 py-2">
              <span className="text-[#6b7280]">Total: </span>
              <span className="font-medium">{agg.summary.total}</span>
            </div>
            <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-2">
              <span className="text-green-700">Healthy: </span>
              <span className="font-medium">{agg.summary.healthy}</span>
            </div>
            {agg.summary.slow > 0 && (
              <div className="rounded-xl bg-yellow-50 border border-yellow-200 px-4 py-2">
                <span className="text-yellow-700">Slow: </span>
                <span className="font-medium">{agg.summary.slow}</span>
              </div>
            )}
            {agg.summary.down > 0 && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-2">
                <span className="text-red-700">Down: </span>
                <span className="font-medium">{agg.summary.down}</span>
              </div>
            )}
            <div className="rounded-xl bg-white/60 border border-black/5 px-4 py-2 text-[#6b7280]">
              Scan: {agg.scan_duration_ms}ms
            </div>
          </div>

          <div className="rounded-2xl bg-white/60 backdrop-blur-xl border border-white/60 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-black/5 text-[#6b7280]">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium">Subdomain</th>
                  <th className="text-left px-4 py-2.5 font-medium">Version</th>
                  <th className="text-left px-4 py-2.5 font-medium">Port</th>
                  <th className="text-left px-4 py-2.5 font-medium">Type</th>
                  <th className="text-left px-4 py-2.5 font-medium">HTTP</th>
                  <th className="text-left px-4 py-2.5 font-medium">Response</th>
                  <th className="text-left px-4 py-2.5 font-medium">systemd</th>
                </tr>
              </thead>
              <tbody>
                {agg.services.map((r) => {
                  const sd = systemdByName.get(`tlz-api@${r.subdomain}`) || systemdByName.get(r.subdomain)
                  return (
                    <tr key={r.subdomain} className="border-t border-black/5">
                      <td className="px-4 py-2.5 font-mono text-[13px]">{r.subdomain}</td>
                      <td className="px-4 py-2.5">{r.metadata?.version || "—"}</td>
                      <td className="px-4 py-2.5 font-mono text-[13px]">{r.public_port} → {r.api_port}</td>
                      <td className="px-4 py-2.5 text-[#6b7280]">{r.metadata?.service_type || "—"}</td>
                      <td className="px-4 py-2.5">{statusBadge(r)}</td>
                      <td className="px-4 py-2.5 font-mono text-[13px] text-[#6b7280]">
                        {r.response_ms !== null ? `${r.response_ms}ms` : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-[#6b7280]">
                        {sd ? `${sd.status}${sd.memory ? ` · ${sd.memory}` : ""}` : "—"}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-xs text-[#6b7280]">
            Updated: {agg.timestamp} · Cache TTL 30s · /api/metadata contract: <code>{"{"}service_id, port, version, service_type, compute_endpoint{"}"}</code>
          </p>
        </>
      )}
    </div>
  )
}
