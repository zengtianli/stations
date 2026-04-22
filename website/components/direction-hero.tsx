import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import type { HeroConfig } from "@/lib/profile-config"

const TRACK_ACCENT: Record<string, string> = {
  hydro: 'text-blue-600',
  ai: 'text-purple-600',
  devtools: 'text-emerald-600',
  indie: 'text-amber-600',
}

const TRACK_BG: Record<string, string> = {
  hydro: 'bg-[#E3F0FF]',
  ai: 'bg-[#F0E8FF]',
  devtools: 'bg-[#DFFBE9]',
  indie: 'bg-[#FFF3D6]',
}

export function DirectionHero({ config }: { config: HeroConfig }) {
  const accent = TRACK_ACCENT[config.track] || 'text-[#86868b]'
  const bg = TRACK_BG[config.track] || ''

  return (
    <section className={`min-h-[70vh] flex items-center pt-24 pb-16 px-6 md:px-8 ${bg}`}>
      <div className="max-w-4xl mx-auto animate-[fadeIn_0.6s_ease]">
        <p className={`text-sm tracking-widest uppercase mb-4 ${accent} opacity-60`}>
          {config.tagline?.split('|')[0]?.trim()}
        </p>
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-[#1d1d1f] mb-6">
          {config.name}
        </h1>
        <p className={`text-lg md:text-xl ${accent} mb-4`}>
          {config.tagline}
        </p>
        <p className="text-base md:text-lg text-[#86868b] max-w-2xl mb-10 leading-relaxed">
          {config.description.replace(/\*\*/g, '')}
        </p>
        <div className="flex flex-wrap gap-4">
          {config.buttons.map((button, i) => (
            <Link key={i} href={button.href}>
              <Button
                variant={i === 0 ? "default" : "outline"}
                size="lg"
                className={i === 0
                  ? "bg-[#0071e3] text-white hover:bg-[#0077ED] rounded-full px-6"
                  : "border-[#0071e3] text-[#0071e3] hover:bg-[#0071e3]/5 rounded-full px-6"
                }
              >
                {button.text}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
