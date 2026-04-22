/**
 * 页面区块组件集合
 * Liquid Glass 风格：方向色背景 + 毛玻璃卡片
 */

import Image from "next/image"
import { GraduationCap, Briefcase, Sparkles, Brain, Workflow } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AboutIntroContent,
  FutureContent,
  SkillsContent,
  TimelineContent,
  TimelineItem
} from "@/lib/content"
import { StrengthConfig } from "@/lib/profile-config"
import type { Track } from "@/lib/track"

// ============== 方向主题色 ==============
const TRACK_THEME: Record<Track, { bg: string; iconText: string }> = {
  hydro:    { bg: 'bg-[#E3F0FF]', iconText: 'text-blue-500' },
  ai:       { bg: 'bg-[#F0E8FF]', iconText: 'text-purple-500' },
  devtools: { bg: 'bg-[#DFFBE9]', iconText: 'text-emerald-500' },
  indie:    { bg: 'bg-[#FFF3D6]', iconText: 'text-amber-500' },
}

// 毛玻璃卡片样式
const GLASS = 'bg-white/50 backdrop-blur-xl border border-white/60 shadow-sm'
const GLASS_PILL = 'bg-white/40 backdrop-blur-sm'

// ============== 关于页介绍 ==============
interface AboutIntroProps {
  content: AboutIntroContent
}

export function AboutIntro({ content }: AboutIntroProps) {
  const { subtitle, description, slogan, profileImage } = content

  return (
    <section className="flex flex-col md:flex-row items-center gap-10 md:gap-16">
      <div className="shrink-0">
        <div className="relative w-40 h-40 md:w-52 md:h-52 rounded-full overflow-hidden">
          <Image src={profileImage} alt={subtitle} fill className="object-cover" />
        </div>
      </div>
      <div>
        <h1 className="text-3xl md:text-4xl font-semibold text-[#1d1d1f] mb-3">{subtitle}</h1>
        <p className="text-[#86868b] text-base md:text-lg leading-relaxed mb-4">{description}</p>
        <p className="text-[#0071e3] font-medium">{slogan}</p>
      </div>
    </section>
  )
}

// ============== 时间线 ==============
const timelineIconMap = { GraduationCap, Briefcase }

interface TimelineProps {
  content: TimelineContent
  track?: Track
}

export function Timeline({ content, track = 'hydro' }: TimelineProps) {
  if (!content?.items?.length) return null
  const theme = TRACK_THEME[track]

  return (
    <section className="">
      <h2 className="text-2xl md:text-3xl font-semibold text-[#1d1d1f] mb-2">
        {content.title}
      </h2>
      <p className="text-[#86868b] mb-8">我的学习和职业发展旅程</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {content.items.map((item: TimelineItem, index: number) => {
          const IconComponent = timelineIconMap[item.icon as keyof typeof timelineIconMap] || GraduationCap
          return (
            <div key={index} className={`${GLASS} rounded-2xl p-6`}>
              <div className="flex items-center gap-3 mb-3">
                <IconComponent className={`h-5 w-5 ${theme.iconText} shrink-0`} />
                <span className="text-sm text-[#86868b]">{item.period}</span>
              </div>
              <h3 className="text-base font-semibold text-[#1d1d1f] mb-2">{item.title}</h3>
              <p className="text-sm text-[#86868b] leading-relaxed mb-3">{item.description}</p>
              {item.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {item.skills.map((skill, i) => (
                    <span key={i} className={`text-xs text-[#1d1d1f] ${GLASS_PILL} rounded-full px-2.5 py-1`}>
                      {skill}
                    </span>
                  ))}
                </div>
              )}
              {item.honors.length > 0 && (
                <ul className="text-sm text-[#86868b] space-y-0.5">
                  {item.honors.map((honor, i) => <li key={i}>· {honor}</li>)}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

// ============== 技能展示 ==============
interface SkillsVisualProps {
  content: SkillsContent
  track?: Track
}

export function SkillsVisual({ content, track = 'hydro' }: SkillsVisualProps) {
  if (!content?.categories?.length) return null
  const theme = TRACK_THEME[track]

  return (
    <section className="">
      <h2 className="text-2xl md:text-3xl font-semibold text-[#1d1d1f] mb-2">
        {content.title || "技能与专长"}
      </h2>
      {content.description && <p className="text-[#86868b] mb-8">{content.description}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {content.categories.map((category, index) => (
          <div key={index} className={`${GLASS} rounded-2xl p-6`}>
            <h3 className="font-semibold text-[#1d1d1f] mb-4">{category.name}</h3>
            <div className="flex flex-wrap gap-2">
              {category.skills.map((skill, skillIndex) => (
                <span key={skillIndex} className={`text-sm text-[#1d1d1f] ${GLASS_PILL} rounded-full px-3 py-1.5`}>
                  {skill.name}
                </span>
              ))}
            </div>
            {category.skills.some(s => s.projects?.length) && (
              <p className="text-xs text-[#86868b] mt-4">
                {category.skills.flatMap(s => s.projects || []).filter((v, i, a) => a.indexOf(v) === i).join(' · ')}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

// ============== 未来展望 ==============
const futureIconMap = { Sparkles, Brain, Workflow }

interface FutureOutlookProps {
  content: FutureContent
  track?: Track
}

export function FutureOutlook({ content, track = 'hydro' }: FutureOutlookProps) {
  if (!content?.visionPoints?.length) return null
  const theme = TRACK_THEME[track]

  return (
    <section className="">
      <h2 className="text-2xl md:text-3xl font-semibold text-[#1d1d1f] mb-2">{content.title}</h2>
      {content.description && <p className="text-[#86868b] mb-8">{content.description}</p>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {content.visionPoints.map((point, index) => {
          const IconComponent = futureIconMap[point.icon as keyof typeof futureIconMap] || Sparkles
          return (
            <div key={index} className={`${GLASS} rounded-2xl p-6`}>
              <IconComponent className={`h-6 w-6 ${theme.iconText} mb-4`} />
              <h3 className="font-semibold text-[#1d1d1f] mb-2">{point.title}</h3>
              <p className="text-sm text-[#86868b] leading-relaxed">{point.description}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

// ============== 核心能力（方向页用） ==============
interface StrengthsSectionProps {
  strengths: StrengthConfig[]
  track?: Track
}

export function StrengthsSection({ strengths, track = 'hydro' }: StrengthsSectionProps) {
  const theme = TRACK_THEME[track]

  return (
    <section className="py-24 md:py-32">
      <div className="container mx-auto px-6 md:px-8">
        <h2 className="text-3xl font-semibold text-center text-[#1d1d1f] mb-12">核心能力</h2>
        <div className="">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {strengths.map((strength: StrengthConfig, index: number) => (
              <div key={index} className={`${GLASS} rounded-2xl p-8 text-center`}>
                <div className={`mx-auto mb-4 p-4 rounded-2xl ${GLASS_PILL} w-fit`}>
                  <strength.icon className={`h-8 w-8 ${theme.iconText}`} />
                </div>
                <h3 className="text-lg font-semibold text-[#1d1d1f] mb-2">{strength.title}</h3>
                <p className="text-sm text-[#86868b]">{strength.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
