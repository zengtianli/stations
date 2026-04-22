import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import PageHeader from "@/components/page-header"
import { Awards, Patents, AcademicPapers, SoftwareCopyrights } from "@/components/research-sections"
import { getResearchIndex, getAcademicPapers, getAwards, getPatents, getSoftwareCopyrights } from "@/lib/content"
import { getServerTrack } from "@/lib/track-server"
import { TRACK_PAGE_BG } from "@/lib/track-theme"
import { resolveTrackContent } from "@/lib/track-content"
import { TRACK_RESEARCH_ORDER } from "@/lib/track"

export const metadata = {
  title: "学术与成果 | 曾田力",
  description: "曾田力的学术成果、专利发明、软件著作权和荣誉奖项展示。",
}

export default async function ResearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const track = await getServerTrack(params)

  const indexRaw = await getResearchIndex()
  const indexContent = indexRaw ? resolveTrackContent(indexRaw as any, track) : indexRaw
  const softwareCopyrights = await getSoftwareCopyrights()
  const patents = await getPatents()
  const papers = await getAcademicPapers()
  const awards = await getAwards()

  const { sections, highlighted } = TRACK_RESEARCH_ORDER[track]

  const sectionMap: Record<string, React.ReactNode> = {
    papers: papers && <AcademicPapers key="papers" data={papers} compact={!highlighted.includes('papers')} />,
    patents: patents && <Patents key="patents" data={patents} compact={!highlighted.includes('patents')} />,
    copyrights: softwareCopyrights && <SoftwareCopyrights key="copyrights" data={softwareCopyrights} compact={!highlighted.includes('copyrights')} />,
    awards: awards && <Awards key="awards" data={awards} compact={!highlighted.includes('awards')} />,
  }

  return (
    <main className={`min-h-screen flex flex-col ${TRACK_PAGE_BG[track]}`}>
      <Navbar />
      <div className="flex-grow max-w-5xl mx-auto px-6 md:px-8 py-24 md:py-32">
        <PageHeader
          title={(indexContent as any)?.title || "学术与成果"}
          description={(indexContent as any)?.description || "我的学术研究和知识产权成果展示"}
        />
        <div className="space-y-16">
          {sections.map((key) => sectionMap[key])}
        </div>
      </div>
      <Footer />
    </main>
  )
}
