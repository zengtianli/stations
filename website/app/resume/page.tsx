/**
 * 简历中心页面
 * 从 content/resume-source/_生成简历/ 自动读取可用版本
 */

import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import PageHeader from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Eye, Download, FileText } from "lucide-react"
import { loadResumeVersions } from "@/lib/resume-loader"
import Link from "next/link"

export const metadata = {
  title: "简历中心 | 曾田力",
  description: "在线查看和下载曾田力的不同版本简历。支持在线预览和PDF导出。",
}

// 版本配置映射（可扩展）
const VERSION_CONFIG: Record<string, { 
  description: string
  color: string
  icon: string
}> = {
  '综合版': {
    description: '全面展示个人能力、经历和成就，适合综合性展示',
    color: 'purple',
    icon: '📋',
  },
  '售前方案版': {
    description: '侧重解决方案能力和客户服务经验，适合售前/咨询岗位',
    color: 'blue',
    icon: '💼',
  },
  '算法研发版': {
    description: '侧重技术能力和算法经验，适合研发岗位',
    color: 'green',
    icon: '🔬',
  },
  '学术版': {
    description: '侧重学术成果和研究经历，适合学术申请',
    color: 'amber',
    icon: '🎓',
  },
  '体育版': {
    description: '突出体育成就和综合素质',
    color: 'orange',
    icon: '🏆',
  },
}

// 默认配置
const DEFAULT_CONFIG = {
  description: '个人简历',
  color: 'gray',
  icon: '📄',
}

export default async function ResumePage() {
  const versions = await loadResumeVersions()

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow max-w-5xl mx-auto px-6 md:px-8 py-24 md:py-32">
        <PageHeader 
          title="简历中心" 
          description="根据不同场景需求，提供多种简历版本。支持在线预览和打印导出 PDF。" 
        />

        {/* Resume Cards */}
        {versions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p>暂无可用的简历版本</p>
            <p className="text-sm mt-2">请在 content/resume-source/_生成简历/ 添加简历文件</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {versions.map((version) => {
              const config = VERSION_CONFIG[version.name] || DEFAULT_CONFIG
              
              return (
                <Card 
                  key={version.id} 
                  className="hover:shadow-lg transition-shadow border-secondary bg-secondary/10"
                >
                  <CardHeader>
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-2xl">{config.icon}</span>
                      <CardTitle className="text-xl">{version.name}</CardTitle>
                    </div>
                    <CardDescription className="text-base">
                      {config.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button variant="default" className="flex-1" asChild>
                        <Link href={`/resume/${encodeURIComponent(version.id)}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          在线预览
                        </Link>
                      </Button>
                      <Button variant="outline" className="flex-1" asChild>
                        <Link href={`/resume/${encodeURIComponent(version.id)}?print=true`}>
                          <Download className="h-4 w-4 mr-2" />
                          打印/导出
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Tips */}
        <div className="text-center p-6 border border-border/50 rounded-lg bg-card/50">
          <h3 className="text-lg font-semibold mb-3">💡 使用提示</h3>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>• 点击「在线预览」查看简历内容</p>
            <p>• 点击「打印/导出」后使用浏览器打印功能导出 PDF</p>
            <p>• 打印时建议选择「背景图形」以保留完整样式</p>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
