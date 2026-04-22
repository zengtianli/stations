import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { DirectionHero } from "@/components/direction-hero"
import { TrackSetter } from "@/components/track-setter"
import { getTrackHeroConfig } from "@/lib/profile-config"
import { getAllProjectsForTrack } from "@/lib/content"
import type { Track } from "@/lib/track"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export async function DirectionPage({ track }: { track: Track }) {
  const heroConfig = getTrackHeroConfig(track)
  const projects = await getAllProjectsForTrack(track)
  const featured = projects.filter(p => p.featured || p.highlight).slice(0, 5)

  return (
    <main className="min-h-screen">
      <TrackSetter track={track} />
      <Navbar />

      <DirectionHero config={heroConfig} />

      {/* Projects */}
      {featured.length > 0 && (
        <section className="py-24 md:py-32 px-6 md:px-8">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-semibold text-[#1d1d1f] mb-10">精选项目</h2>
            <div className="space-y-4">
              {featured.map((project) => (
                <Link
                  key={project.slug}
                  href={`/projects/${project.slug}`}
                  className="group flex items-center justify-between bg-white/50 backdrop-blur-xl border border-white/60 shadow-sm rounded-2xl p-6 md:p-8
                    transition-all duration-300 hover:shadow-lg"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-[#1d1d1f] mb-1.5">{project.title}</h3>
                    <p className="text-sm text-[#86868b] line-clamp-1">
                      {project.brief || project.description}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#86868b] group-hover:text-[#0071e3] transition-all duration-300 group-hover:translate-x-1 ml-4 shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-24 md:py-32 px-6 md:px-8 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold text-[#1d1d1f] mb-4">感兴趣？</h2>
          <p className="text-[#86868b] mb-8">查看更多项目或直接联系我</p>
          <div className="flex justify-center gap-4">
            <Link href={`/projects?track=${track}`}>
              <Button variant="outline" className="border-[#0071e3] text-[#0071e3] hover:bg-[#0071e3]/5 rounded-full px-6">
                全部项目
              </Button>
            </Link>
            <Link href="/contact">
              <Button className="bg-[#0071e3] text-white hover:bg-[#0077ED] rounded-full px-6">
                联系我
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
