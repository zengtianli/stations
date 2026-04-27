import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import HeroSection from "@/components/hero-section"
import { DirectionCards } from "@/components/direction-card"
import { TrackClearer } from "@/components/track-clearer"
import { getAllProjects, getAllBlogPosts } from "@/lib/content"
import { SERVICE_GROUPS } from "@/lib/services"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export const metadata = {
  title: "曾田力 — 水利工程师 · AI 工程师 · 独立开发者",
  description: "融合水利工程专业智慧与前沿信息技术，致力于通过数据分析、智能模型及软件系统研发，解决复杂水资源挑战。",
}

function StatBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/60 backdrop-blur-xl border border-white/70 shadow-sm rounded-2xl px-5 py-4 text-center">
      <div className="text-2xl md:text-3xl font-semibold text-[#1d1d1f] tabular-nums">{value}</div>
      <div className="text-xs text-[#86868b] mt-1">{label}</div>
    </div>
  )
}

export default async function Home() {
  const allProjects = await getAllProjects()
  const featured = allProjects.filter(p => p.featured).slice(0, 4)
  const allBlogPosts = await getAllBlogPosts()
  const latestPosts = allBlogPosts.slice(0, 3)

  // Stats: 子站数、博文数、项目数（来自 SSOT 派生）
  const subdomainCount = SERVICE_GROUPS
    .filter((g) => g.title !== "主站")
    .reduce((sum, g) => sum + g.services.length, 0)
  const blogCount = allBlogPosts.length
  const projectCount = allProjects.length

  return (
    <main className="min-h-screen">
      <TrackClearer />
      <Navbar />

      {/* Hero */}
      <HeroSection />

      {/* Stats Bar — 数据徽章 */}
      <section className="px-6 md:px-8 -mt-2">
        <div className="max-w-5xl mx-auto grid grid-cols-3 gap-3 md:gap-4">
          <StatBadge label="生产子站" value={`${subdomainCount}+`} />
          <StatBadge label="精选项目" value={`${projectCount}`} />
          <StatBadge label="博文笔记" value={`${blogCount}`} />
        </div>
      </section>

      {/* Direction Cards */}
      <section className="py-12 md:py-20 px-6 md:px-8">
        <div className="max-w-5xl mx-auto">
          <DirectionCards />
        </div>
      </section>

      {/* Latest Updates — 最新博文 */}
      {latestPosts.length > 0 && (
        <section className="py-12 md:py-16 px-6 md:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
              <div>
                <h2 className="text-2xl md:text-3xl font-semibold text-[#1d1d1f]">最新更新</h2>
                <p className="text-sm text-[#86868b] mt-1">工程笔记 · 思考记录 · 技术复盘</p>
              </div>
              <Link
                href="/blog"
                className="inline-flex items-center gap-1.5 text-[#0071e3] text-sm font-medium hover:underline"
              >
                查看全部博客
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {latestPosts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group block bg-white/50 backdrop-blur-xl border border-white/60 shadow-sm rounded-2xl p-5
                    transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
                >
                  <div className="text-[11px] text-[#86868b] mb-2">{post.date}</div>
                  <h3 className="text-base font-semibold text-[#1d1d1f] mb-2 line-clamp-2">{post.title}</h3>
                  <p className="text-xs text-[#86868b] line-clamp-3">{post.excerpt}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Work */}
      {featured.length > 0 && (
        <section className="py-24 md:py-32 px-6 md:px-8">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-semibold text-[#1d1d1f] mb-4">精选作品</h2>
            <p className="text-[#86868b] mb-12">跨领域的代表性项目</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {featured.map((project) => (
                <Link
                  key={project.slug}
                  href={`/projects/${project.slug}`}
                  className="group block bg-white/50 backdrop-blur-xl border border-white/60 shadow-sm rounded-2xl p-6 md:p-8
                    transition-all duration-300 hover:shadow-lg"
                >
                  <h3 className="text-lg font-semibold text-[#1d1d1f] mb-2">
                    {project.title}
                  </h3>
                  <p className="text-sm text-[#86868b] mb-4 line-clamp-2">
                    {project.brief || project.description}
                  </p>
                  <div className="flex items-center gap-1.5 text-[#0071e3] text-sm font-medium">
                    查看详情
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </main>
  )
}
