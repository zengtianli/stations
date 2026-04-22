import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { Track } from "@/lib/track"

interface DirectionCardProps {
  track: Track
  title: string
  subtitle: string
  description: string
  bg: string
  href: string
}

const directions: DirectionCardProps[] = [
  {
    track: 'hydro',
    title: '水利数字化',
    subtitle: 'Water Resources',
    description: '数字孪生 · 智慧水利 · 水文预测',
    bg: 'bg-[#E3F0FF]',
    href: '/hydro',
  },
  {
    track: 'ai',
    title: 'AI 工程',
    subtitle: 'AI Engineering',
    description: 'LLM 工具链 · Agent 工作流 · MCP 生态',
    bg: 'bg-[#F0E8FF]',
    href: '/ai',
  },
  {
    track: 'devtools',
    title: '开发工具',
    subtitle: 'DevTools',
    description: '44 脚本 · 58 Raycast · CLI-first',
    bg: 'bg-[#DFFBE9]',
    href: '/devtools',
  },
  {
    track: 'indie',
    title: '独立开发',
    subtitle: 'Indie Dev',
    description: '全栈开发 · 量化交易 · 跨境资产 · 一人闭环',
    bg: 'bg-[#FFF3D6]',
    href: '/indie',
  },
]

function Card({ title, subtitle, description, bg, href }: DirectionCardProps) {
  return (
    <Link href={href} className="group block">
      <div className={`${bg} rounded-2xl p-8 md:p-10 h-full
        transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`}>
        <div className="flex flex-col h-full min-h-[180px] md:min-h-[220px]">
          <p className="text-xs tracking-widest uppercase text-[#86868b] mb-3">{subtitle}</p>
          <h3 className="text-2xl md:text-3xl font-semibold text-[#1d1d1f] mb-3">{title}</h3>
          <p className="text-[#86868b] text-sm md:text-base flex-grow">{description}</p>
          <div className="mt-6 flex items-center gap-2 text-[#86868b] group-hover:text-[#1d1d1f] transition-colors duration-300">
            <span className="text-sm font-medium">探索</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    </Link>
  )
}

export function DirectionCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
      {directions.map((dir) => (
        <Card key={dir.track} {...dir} />
      ))}
    </div>
  )
}
