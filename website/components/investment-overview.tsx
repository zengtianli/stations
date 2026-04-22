/**
 * 投资概览组件（indie 方向专属）
 * 展示 QQQ Covered Call 策略的核心指标
 */

import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, Shield, BarChart3, Clock } from "lucide-react"

export interface InvestmentContent {
  title: string
  subtitle: string
  strategy: string
  period: string
  description: string
  metrics: {
    annualReturn: string
    sharpeRatio: string
    maxDrawdown: string
    years: string
    cumulativeReturn: string
    avgLeverage: string
  }
}

const metricConfig = [
  { key: 'annualReturn' as const, label: '年化收益', icon: TrendingUp },
  { key: 'sharpeRatio' as const, label: 'Sharpe Ratio', icon: BarChart3 },
  { key: 'maxDrawdown' as const, label: '最大回撤', icon: Shield },
  { key: 'years' as const, label: '运行时间', icon: Clock },
]

export function InvestmentOverview({ content }: { content: InvestmentContent }) {
  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-xl font-bold">{content.title}</h3>
        <span className="text-sm text-muted-foreground">{content.period}</span>
      </div>
      <p className="text-sm text-muted-foreground">{content.description}</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {metricConfig.map(({ key, label, icon: Icon }) => (
          <Card key={key} className="bg-white/50 backdrop-blur-xl border border-white/60 shadow-sm">
            <CardContent className="p-4 text-center">
              <Icon className="h-5 w-5 text-accent mx-auto mb-2" />
              <div className="text-2xl font-bold text-accent">{content.metrics[key]}</div>
              <div className="text-xs text-muted-foreground mt-1">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        策略: {content.strategy} · 平均杠杆: {content.metrics.avgLeverage} · 区间 TWR: {content.metrics.cumulativeReturn}
      </p>
    </div>
  )
}
