'use client'

import { useState } from 'react'
import { ExternalLink, Wrench, Layers, FileText, Lightbulb, Archive, Github } from 'lucide-react'
import { CATALOG, type CatalogEntry } from '@/lib/catalog.generated'

const TYPE_META: Record<
  CatalogEntry['type'],
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string; visible: boolean }
> = {
  'subdomain':       { label: '在线服务',  icon: ExternalLink, color: 'text-[#0071e3]', visible: false },
  'vps-only':        { label: '基础设施',  icon: ExternalLink, color: 'text-gray-500',  visible: false },
  'tool-lib':        { label: 'CLI 工具库', icon: Wrench,     color: 'text-purple-600', visible: true },
  'raycast-wrapper': { label: 'Raycast 包', icon: Layers,     color: 'text-orange-600', visible: true },
  'config-repo':     { label: '配置仓库',   icon: FileText,   color: 'text-emerald-600',visible: true },
  'knowledge':       { label: '知识与文档', icon: FileText,   color: 'text-amber-600',  visible: true },
  'app-candidate':   { label: '候选 App',  icon: Lightbulb,   color: 'text-sky-600',    visible: true },
  'archived':        { label: '已归档',     icon: Archive,    color: 'text-gray-400',   visible: false },
  'dormant':         { label: '已合并/休眠',icon: Archive,    color: 'text-gray-400',   visible: false },
}

function CatalogCard({ entry }: { entry: CatalogEntry }) {
  const gh = entry.links?.find((l) => l.label === 'GitHub')
  return (
    <div className="flex items-center gap-3 bg-white/50 backdrop-blur-xl border border-white/60
      rounded-xl px-4 py-3 transition-all duration-200 hover:shadow-md hover:bg-white/70">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[#1d1d1f] truncate">{entry.name}</span>
          {entry.path && (
            <span className="text-[10px] text-[#86868b] font-mono shrink-0">{entry.path}</span>
          )}
        </div>
        {entry.description && (
          <p className="text-xs text-[#86868b] mt-0.5 truncate">{entry.description}</p>
        )}
      </div>
      {gh && (
        <a
          href={gh.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#86868b] hover:text-[#1d1d1f] transition-colors shrink-0"
          title="GitHub"
        >
          <Github className="h-4 w-4" />
        </a>
      )}
    </div>
  )
}

export default function LocalCatalog() {
  const [showArchived, setShowArchived] = useState(false)

  // 只展示 type ∈ { tool-lib, raycast-wrapper, config-repo, knowledge, app-candidate }（默认）
  // 加 archived/dormant（折叠）
  const visibleTypes = (Object.keys(TYPE_META) as CatalogEntry['type'][])
    .filter((t) => TYPE_META[t].visible || (showArchived && (t === 'archived' || t === 'dormant')))

  const archivedCount = CATALOG.entries.filter(
    (e) => e.type === 'archived' || e.type === 'dormant'
  ).length

  const groupedByType = visibleTypes
    .map((t) => ({
      type: t,
      meta: TYPE_META[t],
      entries: CATALOG.entries.filter((e) => e.type === t),
    }))
    .filter((g) => g.entries.length > 0)

  if (groupedByType.length === 0) return null

  return (
    <section className="pb-24 border-t border-black/5 pt-12 mt-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-[#1d1d1f]">本地工具与项目</h2>
          <p className="text-xs text-[#86868b] mt-1">
            ~/Dev 下未发布为子域的工具库、配置仓库、知识库与候选 app
          </p>
        </div>
        {archivedCount > 0 && (
          <button
            onClick={() => setShowArchived((v) => !v)}
            className="text-xs text-[#86868b] hover:text-[#1d1d1f] transition-colors"
          >
            {showArchived ? '隐藏归档' : `显示 ${archivedCount} 个归档`}
          </button>
        )}
      </div>

      <div className="space-y-10">
        {groupedByType.map(({ type, meta, entries }) => {
          const Icon = meta.icon
          return (
            <section key={type}>
              <div className="flex items-center gap-2 mb-4">
                <span className={meta.color}>
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="text-base font-semibold text-[#1d1d1f]">{meta.label}</h3>
                <span className="text-xs text-[#86868b] ml-1">{entries.length}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {entries.map((entry) => (
                  <CatalogCard key={entry.id} entry={entry} />
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </section>
  )
}
