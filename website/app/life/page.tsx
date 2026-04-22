import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import PageHeader from "@/components/page-header"
import SportsAchievement from "@/components/sports-achievement"
import { InvestmentOverview, type InvestmentContent } from "@/components/investment-overview"
import { getNestedContent } from "@/lib/content"
import { SportsAchievementContent } from "@/components/sports-achievement"
import { getServerTrack } from "@/lib/track-server"
import { TRACK_PAGE_BG } from "@/lib/track-theme"

export const metadata = {
  title: "个人生活 | 曾田力",
  description: "体育成就、投资实践——工作之外的生活。",
}

export default async function LifePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const track = await getServerTrack(params)

  const sportsContent = await getNestedContent<SportsAchievementContent>('about/sports')
  const investmentContent = await getNestedContent<InvestmentContent>('about/investment')

  const showInvestment = track === 'indie' && investmentContent

  return (
    <main className={`min-h-screen flex flex-col ${TRACK_PAGE_BG[track]}`}>
      <Navbar />
      <div className="flex-grow max-w-5xl mx-auto px-6 md:px-8 py-24 md:py-32">
        <PageHeader
          title="个人生活"
          description="工作之外的热爱与实践"
        />
        <div className="space-y-16">
          {/* 投资实践 (indie only) */}
          {showInvestment && (
            <section>
              <h2 className="text-2xl font-semibold mb-8">投资实践</h2>
              <InvestmentOverview content={investmentContent} />
            </section>
          )}

          {/* 体育成就 */}
          {sportsContent && (
            <section>
              <SportsAchievement content={sportsContent} />
            </section>
          )}
        </div>
      </div>
      <Footer />
    </main>
  )
}
