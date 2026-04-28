"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Search, Calendar, Clock } from "lucide-react"
import { CATEGORY_META, type ContentCategory } from "@/lib/content-meta"

interface SearchablePost {
  slug: string
  title: string
  date: string
  excerpt: string
  tags: string[]
  category?: ContentCategory
  readingTime?: number
}

export default function BlogSearchClient({ posts }: { posts: SearchablePost[] }) {
  const [query, setQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<ContentCategory | 'all'>('all')

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return posts.filter(p => {
      if (activeCategory !== 'all' && (p.category || 'local') !== activeCategory) return false
      if (!q) return true
      const haystack = `${p.title} ${p.excerpt} ${(p.tags || []).join(' ')}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [posts, query, activeCategory])

  const categories: (ContentCategory | 'all')[] = ['all', 'local', 'essays', 'learn', 'analysis', 'investment']
  const labelOf = (c: ContentCategory | 'all') => c === 'all' ? '全部' : CATEGORY_META[c].label

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div>
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="输入关键词…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          className="w-full pl-12 pr-4 py-3 rounded-2xl border border-white/80 bg-white/60 backdrop-blur-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1d1d1f]/20 text-base"
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map(c => {
          const isActive = c === activeCategory
          return (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className={`px-3 py-1 rounded-full text-sm transition-all ${
                isActive
                  ? 'bg-[#1d1d1f] text-white'
                  : 'bg-white/60 text-[#1d1d1f] border border-white/80 hover:bg-white/80'
              }`}
            >
              {labelOf(c)}
            </button>
          )
        })}
        <span className="ml-auto text-sm text-muted-foreground self-center">命中 {results.length} 篇</span>
      </div>

      {results.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          {query ? '无匹配结果' : '开始输入关键词…'}
        </div>
      ) : (
        <ul className="space-y-3">
          {results.map(post => (
            <li key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="block p-5 rounded-2xl border border-white/60 bg-white/50 backdrop-blur-xl hover:bg-white/80 transition-all"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  {post.category && CATEGORY_META[post.category] && (
                    <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${CATEGORY_META[post.category].color}`}>
                      {CATEGORY_META[post.category].label}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {formatDate(post.date)}
                  </span>
                  {post.readingTime && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {post.readingTime} 分钟
                    </span>
                  )}
                </div>
                <h3 className="text-base font-semibold text-[#1d1d1f] mb-1">{post.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {post.tags.slice(0, 5).map(tag => (
                      <span key={tag} className="text-xs text-muted-foreground border border-[#d2d2d7] rounded-full px-2 py-0.5">{tag}</span>
                    ))}
                  </div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
