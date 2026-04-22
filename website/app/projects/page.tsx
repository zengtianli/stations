import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import PageHeader from "@/components/page-header"
import { ProjectFilter } from "@/components/project-filter"
import { getProjectIndex, getAllProjectsForTrack } from "@/lib/content"
import { getServerTrack } from "@/lib/track-server"
import { TRACK_PAGE_BG } from "@/lib/track-theme"

export const metadata = {
  title: "项目案例 | 曾田力",
  description: "探索曾田力的水利工程项目案例，包括数字孪生浙东引水、水资源承载力评价、钱塘江岸线规划等创新项目。",
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const track = await getServerTrack(params)
  const indexContent = await getProjectIndex()
  const projects = await getAllProjectsForTrack(track)

  return (
    <main className={`min-h-screen flex flex-col ${TRACK_PAGE_BG[track]}`}>
      <Navbar />
      <div className="flex-grow max-w-5xl mx-auto px-6 md:px-8 py-24 md:py-32">
        <PageHeader
          title={indexContent?.title || "项目案例"}
          description={indexContent?.description || "探索曾田力的水利工程项目案例"}
        />
        <ProjectFilter projects={projects} />
      </div>
      <Footer />
    </main>
  )
}
