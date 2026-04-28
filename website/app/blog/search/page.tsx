/**
 * Blog 搜索页 — 客户端即时过滤所有文章
 * 数据由服务端预渲染，客户端按 title/excerpt/tags 实时过滤
 */

import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import PageHeader from "@/components/page-header"
import { getAllBlogPosts } from "@/lib/content"
import BlogSearchClient from "@/components/blog-search-client"

export const metadata = {
  title: "搜索博客 | 曾田力",
  description: "在所有博客文章中即时搜索",
}

export default async function BlogSearchPage() {
  const all = await getAllBlogPosts()
  // 只传客户端必需字段（去掉大字段），确保 hydration 体积可控
  const data = all.map(p => ({
    slug: p.slug,
    title: p.title,
    date: p.date,
    excerpt: p.excerpt,
    tags: p.tags || [],
    category: p.category,
    readingTime: p.readingTime,
  }))

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow max-w-5xl mx-auto px-6 md:px-8 py-24 md:py-32 w-full">
        <PageHeader title="搜索博客" description={`共 ${all.length} 篇 · 标题 / 摘要 / 标签全文搜索`} />
        <BlogSearchClient posts={data} />
      </div>
      <Footer />
    </main>
  )
}
