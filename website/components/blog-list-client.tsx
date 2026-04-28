"use client"

import { useState } from "react"
import Link from "next/link"
import { Search } from "lucide-react"
import { BlogCard } from "@/components/card-components"
import { CATEGORY_META, type ContentCategory } from "@/lib/content-meta"
import type { BlogPost } from "@/lib/content"

interface BlogListPost {
  slug: string
  title: string
  date: string
  excerpt: string
  tags: string[]
  image?: string
  category?: ContentCategory
  readingTime?: number
}

const CATEGORY_ORDER: (ContentCategory | 'all')[] = ['all', 'local', 'essays', 'learn', 'analysis', 'investment']

const CATEGORY_LABEL: Record<ContentCategory | 'all', string> = {
  all: '全部',
  local: '技术',
  essays: '论文',
  learn: '学习笔记',
  analysis: '框架分析',
  investment: '投资',
}

export default function BlogListClient({ posts }: { posts: BlogListPost[] }) {
  const [activeCategory, setActiveCategory] = useState<ContentCategory | 'all'>('all')

  const counts: Record<string, number> = { all: posts.length }
  for (const p of posts) {
    const k = p.category || 'local'
    counts[k] = (counts[k] || 0) + 1
  }

  const filtered = activeCategory === 'all'
    ? posts
    : posts.filter(p => (p.category || 'local') === activeCategory)

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 mb-10">
        {CATEGORY_ORDER.map(cat => {
          const isActive = cat === activeCategory
          const label = CATEGORY_LABEL[cat]
          const count = counts[cat] || 0
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[#1d1d1f] text-white shadow-md'
                  : 'bg-white/60 text-[#1d1d1f] border border-white/80 hover:bg-white/80'
              }`}
            >
              {label}
              <span className="ml-1.5 text-xs opacity-70">{count}</span>
            </button>
          )
        })}
        <Link
          href="/blog/search"
          className="ml-auto flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm bg-white/60 border border-white/80 text-[#1d1d1f] hover:bg-white/80"
        >
          <Search className="h-3.5 w-3.5" />
          搜索
        </Link>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((post) => (
            <BlogCard key={post.slug} post={post as BlogPost} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">该分类下暂无文章</p>
        </div>
      )}
    </>
  )
}
