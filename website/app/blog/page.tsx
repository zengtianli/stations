import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import PageHeader from "@/components/page-header"
import { getAllBlogPosts } from "@/lib/content"
import BlogListClient from "@/components/blog-list-client"

export const metadata = {
  title: "技术博客 | 曾田力",
  description: "技术博客 — 水利工程 / AI 工程 / 投资笔记 / 论文与学习笔记，统一阅读入口",
}

export default async function BlogPage() {
  const all = await getAllBlogPosts()
  // 把所有文章数据 ship 到客户端做过滤（category tabs / 实时切换）
  const data = all.map(p => ({
    slug: p.slug,
    title: p.title,
    date: p.date,
    excerpt: p.excerpt,
    tags: p.tags || [],
    image: p.image,
    category: p.category,
    readingTime: p.readingTime,
  }))

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow max-w-6xl mx-auto px-6 md:px-8 py-24 md:py-32 w-full">
        <PageHeader
          title="技术博客"
          description="水利工程 / AI / 投资 / 学习笔记 — 统一阅读入口"
        />
        <BlogListClient posts={data} />
      </div>
      <Footer />
    </main>
  )
}
