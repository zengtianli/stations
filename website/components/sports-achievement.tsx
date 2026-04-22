/**
 * 体育成就组件 - 简化版
 */

import { Trophy, Medal, Star } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export interface SportsAchievement {
  category: string
  icon: string
  isCompact?: boolean
  sports?: string[]
  description?: string
  achievements?: {
    title: string
    year: string
    level: string
    description: string
    highlight?: boolean
  }[]
}

export interface SportsAchievementContent {
  title: string
  subtitle: string
  totalChampionships: number
  officialHonor: {
    title: string
    year: string
    organization: string
    description: string
  }
  categories: SportsAchievement[]
}

const iconMap = {
  Trophy,
  Medal,
  Star,
}

interface SportsAchievementProps {
  content: SportsAchievementContent
}

export default function SportsAchievement({ content }: SportsAchievementProps) {
  return (
    <section>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">{content.title}</h2>
        <p className="text-muted-foreground">{content.subtitle}</p>
      </div>

      {/* 官方荣誉 */}
      <Card className="max-w-2xl mx-auto mb-8 border-orange-500/20 bg-gradient-to-r from-orange-500/10 to-red-500/10">
        <CardContent className="p-6 text-center">
          <Star className="h-8 w-8 text-orange-400 mx-auto mb-4" />
          <h3 className="font-bold text-lg mb-1">{content.officialHonor.title}</h3>
          <p className="text-sm text-muted-foreground mb-2">
            {content.officialHonor.organization} · {content.officialHonor.year}
          </p>
          <p className="text-sm">{content.officialHonor.description}</p>
        </CardContent>
      </Card>

      {/* 统计 */}
      <div className="flex justify-center mb-8">
        <Badge variant="outline" className="px-4 py-2 text-lg bg-orange-500/10 border-orange-500/30">
          <Trophy className="h-4 w-4 mr-2" />
          总冠军数: {content.totalChampionships}次
        </Badge>
      </div>

      {/* 成就分类 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {content.categories.map((category, index) => {
          const IconComponent = iconMap[category.icon as keyof typeof iconMap] || Trophy
          
          return (
            <Card key={index} className="border-secondary hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-full bg-accent/10">
                    <IconComponent className="h-5 w-5 text-accent" />
                  </div>
                  <h3 className="font-semibold">{category.category}</h3>
                </div>
                
                {category.isCompact ? (
                  <>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {category.sports?.map((sport, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {sport}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                  </>
                ) : (
                  <div className="space-y-3">
                    {category.achievements?.map((achievement, i) => (
                      <div 
                        key={i} 
                        className={`p-3 rounded-lg border ${
                          achievement.highlight 
                            ? 'border-accent/30 bg-accent/5' 
                            : 'border-secondary bg-secondary/5'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <span className="font-medium text-sm">
                            {achievement.highlight && '🏆 '}{achievement.title}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {achievement.year}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{achievement.level}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
