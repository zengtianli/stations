"use client"

import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"

interface Repo {
  name: string
  visibility: string
  language: string | null
  pushed_at: string
  description: string | null
  html_url: string
  archived: boolean
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / 86400000)
  if (days < 1) return "今天"
  if (days < 30) return `${days}d ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

export default function AuggieTable({ repos }: { repos: Repo[] }) {
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return repos
    return repos.filter((r) =>
      r.name.toLowerCase().includes(q) ||
      (r.description || "").toLowerCase().includes(q) ||
      (r.language || "").toLowerCase().includes(q)
    )
  }, [repos, query])

  return (
    <>
      <div className="px-5 py-3 border-b border-white/60">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索 name / description / language…"
          className="w-full px-3 py-1.5 text-sm bg-white/60 border border-white/80 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0071E3]/30"
        />
        <div className="text-xs text-[#86868b] mt-1">{filtered.length} / {repos.length}</div>
      </div>
      <div className="max-h-[620px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-white/80 backdrop-blur">
            <tr className="text-left text-xs text-[#86868b]">
              <th className="py-2 px-4">名称</th>
              <th className="py-2 px-4">可见性</th>
              <th className="py-2 px-4">语言</th>
              <th className="py-2 px-4">最近推送</th>
              <th className="py-2 px-4">描述</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.name} className={`border-t border-white/60 ${r.archived ? "opacity-50" : ""}`}>
                <td className="py-2 px-4 font-medium text-[#1d1d1f]">
                  <a
                    href={r.html_url}
                    target="_blank"
                    rel="noopener"
                    className="text-[#0071E3] hover:underline"
                  >
                    {r.name}
                  </a>
                  {r.archived && <span className="ml-2 text-xs text-[#86868b]">📦</span>}
                </td>
                <td className="py-2 px-4">
                  <Badge variant={r.visibility === "public" ? "success" : "muted"}>
                    {r.visibility === "public" ? "🟢 public" : "🔒 private"}
                  </Badge>
                </td>
                <td className="py-2 px-4 text-[#86868b]">{r.language || "—"}</td>
                <td className="py-2 px-4 text-[#86868b] tabular-nums">{formatDate(r.pushed_at)}</td>
                <td className="py-2 px-4 text-[#86868b] max-w-md truncate" title={r.description || ""}>
                  {r.description || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
