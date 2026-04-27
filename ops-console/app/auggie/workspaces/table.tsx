"use client"

import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import type { Workspace, HealthRecord } from "./page"

function formatRelative(iso: string | undefined): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (isNaN(d.getTime())) return "—"
  const diff = Date.now() - d.getTime()
  const days = Math.floor(diff / 86400000)
  if (days < 1) return "今天"
  if (days < 30) return `${days}d ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

function relevanceColor(rel: number): string {
  if (rel >= 0.7) return "text-emerald-600"
  if (rel >= 0.5) return "text-amber-600"
  if (rel > 0) return "text-red-600"
  return "text-[#86868b]"
}

function typeBadgeVariant(type: string): "success" | "default" | "warn" | "muted" {
  if (type === "code") return "success"
  if (type === "docs") return "default"
  if (type === "data") return "warn"
  return "muted"
}

function healthBadge(status: string | undefined): { label: string; variant: "success" | "warn" | "danger" | "muted" } {
  if (status === "ok") return { label: "🟢 ok", variant: "success" }
  if (status === "timeout") return { label: "🟡 timeout", variant: "warn" }
  if (status === "429") return { label: "🟠 429", variant: "warn" }
  if (status === "error" || status === "empty") return { label: "🔴 " + status, variant: "danger" }
  return { label: "—", variant: "muted" }
}

type IndexableFilter = "all" | "true" | "false"

export default function WorkspacesTable({
  workspaces,
  healthByID,
}: {
  workspaces: Workspace[]
  healthByID: Record<string, HealthRecord>
}) {
  const [query, setQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [indexableFilter, setIndexableFilter] = useState<IndexableFilter>("all")

  const types = useMemo(() => {
    const s = new Set(workspaces.map((w) => w.type))
    return ["all", ...Array.from(s).sort()]
  }, [workspaces])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return workspaces.filter((w) => {
      if (typeFilter !== "all" && w.type !== typeFilter) return false
      if (indexableFilter === "true" && !w.indexable) return false
      if (indexableFilter === "false" && w.indexable) return false
      if (!q) return true
      return (
        w.id.toLowerCase().includes(q) ||
        w.path.toLowerCase().includes(q) ||
        (w.notes || "").toLowerCase().includes(q) ||
        (w.github || "").toLowerCase().includes(q)
      )
    })
  }, [workspaces, query, typeFilter, indexableFilter])

  return (
    <>
      <div className="px-5 py-3 border-b border-white/60 space-y-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索 id / path / github / notes…"
          className="w-full px-3 py-1.5 text-sm bg-white/60 border border-white/80 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0071E3]/30"
        />
        <div className="flex flex-wrap gap-3 items-center text-xs">
          <span className="text-[#86868b]">type:</span>
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-2 py-0.5 rounded-md transition ${
                typeFilter === t ? "bg-[#0071E3] text-white" : "bg-white/60 hover:bg-white/80"
              }`}
            >
              {t}
            </button>
          ))}
          <span className="text-[#86868b] ml-2">indexable:</span>
          {(["all", "true", "false"] as IndexableFilter[]).map((v) => (
            <button
              key={v}
              onClick={() => setIndexableFilter(v)}
              className={`px-2 py-0.5 rounded-md transition ${
                indexableFilter === v ? "bg-[#0071E3] text-white" : "bg-white/60 hover:bg-white/80"
              }`}
            >
              {v}
            </button>
          ))}
          <span className="ml-auto text-[#86868b]">
            {filtered.length} / {workspaces.length}
          </span>
        </div>
      </div>
      <div className="max-h-[640px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-white/80 backdrop-blur z-10">
            <tr className="text-left text-xs text-[#86868b]">
              <th className="py-2 px-4">id</th>
              <th className="py-2 px-4">type</th>
              <th className="py-2 px-4">indexable</th>
              <th className="py-2 px-4">github</th>
              <th className="py-2 px-4">health</th>
              <th className="py-2 px-4 text-right">duration</th>
              <th className="py-2 px-4 text-right">relevance</th>
              <th className="py-2 px-4">last warmup</th>
              <th className="py-2 px-4">notes</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((w) => {
              const h = healthByID[w.id]
              const hb = healthBadge(h?.status)
              return (
                <tr
                  key={w.id}
                  className={`border-t border-white/60 ${!w.indexable ? "opacity-60" : ""}`}
                  title={w.path}
                >
                  <td className="py-2 px-4 font-medium text-[#1d1d1f]">
                    {w.id}
                  </td>
                  <td className="py-2 px-4">
                    <Badge variant={typeBadgeVariant(w.type)}>{w.type}</Badge>
                  </td>
                  <td className="py-2 px-4">
                    {w.indexable ? (
                      <Badge variant="success">true</Badge>
                    ) : (
                      <Badge variant="muted">false</Badge>
                    )}
                  </td>
                  <td className="py-2 px-4">
                    {w.github ? (
                      <a
                        href={`https://github.com/${w.github}`}
                        target="_blank"
                        rel="noopener"
                        className="text-[#0071E3] hover:underline"
                      >
                        {w.github}
                      </a>
                    ) : (
                      <span className="text-[#86868b]">—</span>
                    )}
                  </td>
                  <td className="py-2 px-4">
                    <Badge variant={hb.variant}>{hb.label}</Badge>
                  </td>
                  <td className="py-2 px-4 text-right tabular-nums text-[#86868b]">
                    {h ? `${h.duration_s.toFixed(1)}s` : "—"}
                  </td>
                  <td className={`py-2 px-4 text-right tabular-nums ${h ? relevanceColor(h.avg_relevance) : "text-[#86868b]"}`}>
                    {h ? h.avg_relevance.toFixed(2) : "—"}
                  </td>
                  <td className="py-2 px-4 text-[#86868b] tabular-nums">
                    {formatRelative(h?.warmup_at)}
                  </td>
                  <td className="py-2 px-4 text-[#86868b] max-w-md truncate" title={w.notes || ""}>
                    {w.notes || "—"}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
