"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import PageHeader from "@/components/page-header"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Loader2 } from "lucide-react"

interface SearchResult {
  slug: string
  url: string
  title: string
  description: string
  category: string
  snippet: string
}

export default function SearchPage() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([])
      setSearched(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults(data.results || [])
    } catch {
      setResults([])
    } finally {
      setLoading(false)
      setSearched(true)
    }
  }, [])

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => doSearch(query), 300)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [query, doSearch])

  // Group results by category
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.category]) acc[r.category] = []
    acc[r.category].push(r)
    return acc
  }, {})

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow container mx-auto px-4 py-16 max-w-4xl">
        <PageHeader title="搜索" description="在博客、项目、论文中查找内容" />

        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="输入关键词搜索博客、项目、论文..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 h-12 text-base"
            autoFocus
          />
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              未找到与 &ldquo;{query}&rdquo; 相关的结果
            </p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="space-y-8">
            {Object.entries(grouped).map(([category, items]) => (
              <section key={category}>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  {category}
                  <span className="ml-2 text-xs">({items.length})</span>
                </h2>
                <div className="space-y-4">
                  {items.map((item) => (
                    <Link
                      key={item.slug + item.url}
                      href={item.url}
                      className="block p-4 rounded-lg border border-border hover:border-accent/50 hover:bg-accent/5 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-grow min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-foreground truncate">
                              {item.title}
                            </h3>
                            <Badge variant="secondary" className="shrink-0 text-[10px]">
                              {item.category}
                            </Badge>
                          </div>
                          {item.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1 mb-1">
                              {item.description}
                            </p>
                          )}
                          {item.snippet && (
                            <p
                              className="text-sm text-muted-foreground/80 line-clamp-2 [&_mark]:bg-accent/30 [&_mark]:text-foreground [&_mark]:rounded-sm [&_mark]:px-0.5"
                              dangerouslySetInnerHTML={{ __html: item.snippet }}
                            />
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {!loading && !searched && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              输入关键词搜索博客、项目、论文...
            </p>
          </div>
        )}
      </div>
      <Footer />
    </main>
  )
}
