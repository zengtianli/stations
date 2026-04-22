'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  ExternalLink, Lock, Search, Activity, Server, RefreshCw,
  Droplets, Code2, BookOpen, Shield, Globe, TrendingUp, ChevronDown,
} from 'lucide-react'
import type { ServiceConfig, ServiceGroupConfig } from '@/lib/services'
import { CATALOG, type CatalogSubPage } from '@/lib/catalog.generated'

const DOMAIN = 'tianlizeng.cloud'

// Lookup: subdomain → sub_pages from catalog.yaml (e.g. dashboard → 概览/Auggie/Hammerspoon)
const SUB_PAGES_BY_SUB: Record<string, CatalogSubPage[]> = Object.fromEntries(
  CATALOG.entries
    .filter((e) => e.subdomain && e.sub_pages && e.sub_pages.length > 0)
    .map((e) => [e.subdomain!, e.sub_pages!])
)

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  globe: Globe,
  droplets: Droplets,
  code2: Code2,
  'trending-up': TrendingUp,
  'book-open': BookOpen,
  shield: Shield,
}

interface ServiceStatus {
  status: 'up' | 'down' | 'unknown'
  responseTime?: number
  checkedAt: string
}

function StatusDot({ status, loading }: { status?: ServiceStatus; loading: boolean }) {
  if (loading) {
    return <span className="relative flex h-2.5 w-2.5 shrink-0">
      <span className="absolute inline-flex h-full w-full rounded-full bg-gray-300 animate-pulse" />
    </span>
  }
  if (!status) {
    return <span className="h-2.5 w-2.5 rounded-full bg-gray-300 shrink-0" title="未监测" />
  }
  if (status.status === 'up') {
    return <span className="relative flex h-2.5 w-2.5 shrink-0" title="在线">
      <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
    </span>
  }
  return <span className="h-2.5 w-2.5 rounded-full bg-red-500 shrink-0" title="离线" />
}

function ServiceCard({
  service, status, loading,
}: {
  service: ServiceConfig; status?: ServiceStatus; loading: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const url = service.url || `https://${service.subdomain}.${DOMAIN}`
  const subPages = SUB_PAGES_BY_SUB[service.subdomain] || []
  const hasSubPages = subPages.length > 0

  return (
    <div className="group bg-white/50 backdrop-blur-xl border border-white/60 rounded-xl
      transition-all duration-200 hover:shadow-md hover:bg-white/70">
      <div className="flex items-center gap-3 px-4 py-3">
        <StatusDot status={status} loading={loading} />
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="min-w-0 flex-1"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[#1d1d1f] truncate">{service.name}</span>
            <span className="text-[10px] text-[#86868b] font-mono shrink-0">{service.subdomain}</span>
            {service.accessType === 'cf-access' && (
              <Lock className="h-3 w-3 text-[#86868b] shrink-0" title="Cloudflare Access" />
            )}
          </div>
          <p className="text-xs text-[#86868b] mt-0.5 truncate">{service.description}</p>
        </a>
        <div className="flex items-center gap-2 shrink-0">
          {status?.status === 'up' && status.responseTime != null && (
            <span className="text-[10px] text-[#86868b] font-mono tabular-nums">
              {status.responseTime}ms
            </span>
          )}
          {hasSubPages ? (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setExpanded((v) => !v) }}
              className="p-1 -m-1 text-[#86868b] hover:text-[#1d1d1f] transition-colors"
              title={`${subPages.length} 个子页面`}
              aria-expanded={expanded}
            >
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
          ) : (
            <ExternalLink className="h-3.5 w-3.5 text-[#86868b] opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
      </div>
      {hasSubPages && expanded && (
        <ul className="border-t border-black/5 px-4 py-2 flex flex-wrap gap-x-4 gap-y-1">
          {subPages.map((sp) => (
            <li key={sp.path} className="text-xs">
              <a
                href={sp.path.startsWith('/') ? `${url}${sp.path}` : sp.path}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0071e3] hover:underline"
              >
                {sp.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function ServiceDashboard({ groups }: { groups: ServiceGroupConfig[] }) {
  const [statuses, setStatuses] = useState<Record<string, ServiceStatus>>({})
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/service-status')
      if (res.ok) {
        setStatuses(await res.json())
        setLastRefresh(new Date())
      }
    } catch { /* dev mode or network error */ }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 60_000)
    return () => clearInterval(interval)
  }, [fetchStatus])

  // Filter
  const q = search.toLowerCase()
  const filteredGroups = groups.map(g => ({
    ...g,
    services: g.services.filter(s =>
      !q || s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.subdomain.toLowerCase().includes(q)
    ),
  })).filter(g => g.services.length > 0)

  // Stats
  const allServices = groups.flatMap(g => g.services)
  const withPort = allServices.filter(s => s.port)
  const online = withPort.filter(s => statuses[s.subdomain]?.status === 'up').length
  const offline = withPort.filter(s => statuses[s.subdomain]?.status === 'down').length

  return (
    <>
      {/* Stats bar */}
      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-8 text-sm text-[#86868b]">
        {!loading && (
          <>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              {online} 在线
            </span>
            {offline > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                {offline} 离线
              </span>
            )}
          </>
        )}
        <span className="flex items-center gap-1.5">
          <Server className="h-4 w-4" />
          {allServices.length} 服务
        </span>
        <a href={`https://status.${DOMAIN}`} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-[#0071e3] hover:underline">
          <Activity className="h-4 w-4" />
          Uptime Kuma
        </a>
        {lastRefresh && (
          <button
            onClick={fetchStatus}
            className="flex items-center gap-1 text-[#86868b] hover:text-[#1d1d1f] transition-colors"
            title={`上次刷新: ${lastRefresh.toLocaleTimeString('zh-CN')}`}
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md mx-auto mb-12">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#86868b]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索服务..."
          className="w-full pl-10 pr-4 py-2.5 bg-white/50 backdrop-blur-xl border border-white/60 rounded-xl
            text-sm text-[#1d1d1f] placeholder:text-[#86868b]/60 outline-none
            focus:ring-2 focus:ring-[#0071e3]/20 focus:border-[#0071e3]/30 transition-all"
        />
      </div>

      {/* Service groups */}
      <div className="space-y-10 pb-24">
        {filteredGroups.map((group) => {
          const Icon = ICON_MAP[group.icon]
          return (
            <section key={group.title}>
              <div className="flex items-center gap-2 mb-4">
                <span className={group.color}>
                  {Icon && <Icon className="h-5 w-5" />}
                </span>
                <h2 className="text-lg font-semibold text-[#1d1d1f]">{group.title}</h2>
                <span className="text-xs text-[#86868b] ml-1">{group.services.length}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {group.services.map((service) => (
                  <ServiceCard
                    key={service.subdomain}
                    service={service}
                    status={statuses[service.subdomain]}
                    loading={loading}
                  />
                ))}
              </div>
            </section>
          )
        })}
        {filteredGroups.length === 0 && (
          <p className="text-center text-[#86868b] text-sm py-12">
            没有匹配的服务
          </p>
        )}
      </div>
    </>
  )
}
