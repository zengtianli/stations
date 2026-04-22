import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import HeroSection from "@/components/hero-section"
import { DirectionCards } from "@/components/direction-card"
import { TrackClearer } from "@/components/track-clearer"
import { getAllProjects } from "@/lib/content"
import { SERVICE_GROUPS } from "@/lib/services"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export const metadata = {
  title: "曾田力 — 水利工程师 · AI 工程师 · 独立开发者",
  description: "融合水利工程专业智慧与前沿信息技术，致力于通过数据分析、智能模型及软件系统研发，解决复杂水资源挑战。",
}

export default async function Home() {
  const allProjects = await getAllProjects()
  const featured = allProjects.filter(p => p.featured).slice(0, 4)

  return (
    <main className="min-h-screen">
      <TrackClearer />
      <Navbar />

      {/* Hero */}
      <HeroSection />

      {/* Direction Cards */}
      <section className="py-12 md:py-20 px-6 md:px-8">
        <div className="max-w-5xl mx-auto">
          <DirectionCards />
        </div>
      </section>

      {/* 站群导航 — services.ts SSOT 派生，新增子域只需改 services.ts */}
      <section className="py-12 md:py-16 px-6 md:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
            <div>
              <h2 className="text-2xl md:text-3xl font-semibold text-[#1d1d1f]">站群</h2>
              <p className="text-sm text-[#86868b] mt-1">主站之外的工具与服务，按方向分组</p>
            </div>
            <Link
              href="/services"
              className="inline-flex items-center gap-1.5 text-[#0071e3] text-sm font-medium hover:underline"
            >
              查看全部
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {SERVICE_GROUPS.filter((g) => g.title !== "主站").map((group) => (
              <Link
                key={group.title}
                href={`/services#${encodeURIComponent(group.title)}`}
                className="block bg-white/50 backdrop-blur-xl border border-white/60 shadow-sm rounded-2xl p-5
                  transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
              >
                <h3 className={`text-base md:text-lg font-semibold mb-1 ${group.color}`}>
                  {group.title}
                </h3>
                <p className="text-xs text-[#86868b]">{group.services.length} 个服务</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

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
