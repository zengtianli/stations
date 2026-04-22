/**
 * 简历详情页面
 * 直接渲染 content/resume-source/_生成简历/ 中的 Markdown 文件
 * 
 * 使用方式：
 * - /resume/综合版 → 渲染 _生成简历/综合版.md
 * - /resume/售前方案版 → 渲染 _生成简历/售前方案版.md
 */

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ResumeLayout from '@/components/resume/ResumeLayout'
import PrintButton from '@/components/shared/PrintButton'
import { loadResumeVersion, loadResumeVersions } from '@/lib/resume-loader'
import { remark } from 'remark'
import html from 'remark-html'
import remarkGfm from 'remark-gfm'

interface PageProps {
  params: Promise<{ version: string }>
}

// 静态生成所有版本
export async function generateStaticParams() {
  const versions = await loadResumeVersions()
  return versions.map((v) => ({
    version: v.id,
  }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { version } = await params
  const decodedVersion = decodeURIComponent(version)
  const resumeVersion = await loadResumeVersion(decodedVersion)

  if (!resumeVersion) {
    return { title: '简历未找到' }
  }

  return {
    title: `${resumeVersion.name} | 曾田力`,
    description: `曾田力的${resumeVersion.name}简历 - 水利工程师、数据科学专家`,
  }
}

// Markdown 转 HTML（支持 GFM 表格）
async function markdownToHtml(markdown: string): Promise<string> {
  const result = await remark()
    .use(remarkGfm)  // 支持表格、删除线等 GFM 语法
    .use(html)
    .process(markdown)
  return result.toString()
}

export default async function ResumeVersionPage({ params }: PageProps) {
  const { version } = await params
  const decodedVersion = decodeURIComponent(version)
  const resumeVersion = await loadResumeVersion(decodedVersion)

  if (!resumeVersion) {
    notFound()
  }

  const htmlContent = await markdownToHtml(resumeVersion.content)

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      {/* 工具栏（打印时隐藏） */}
      <div className="no-print sticky top-0 z-10 bg-white/95 backdrop-blur border-b shadow-sm">
        <div className="max-w-[210mm] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/resume">
                <ArrowLeft className="h-4 w-4 mr-1" />
                返回
              </Link>
            </Button>
            <span className="text-sm text-muted-foreground">
              当前版本：<strong>{resumeVersion.name}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <PrintButton />
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <Home className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* 简历内容 */}
      <div className="py-8 print:py-0">
        <ResumeLayout>
          {/* 渲染 Markdown 内容 */}
          <article 
            className="resume-content prose prose-sm max-w-none
              prose-headings:text-gray-900 prose-headings:font-bold
              prose-h1:text-2xl prose-h1:mb-4 prose-h1:pb-2 prose-h1:border-b-2 prose-h1:border-gray-800
              prose-h2:text-lg prose-h2:mt-6 prose-h2:mb-3 prose-h2:pb-1 prose-h2:border-b prose-h2:border-gray-300
              prose-h3:text-base prose-h3:mt-4 prose-h3:mb-2
              prose-p:text-gray-700 prose-p:my-2 prose-p:leading-relaxed
              prose-ul:my-2 prose-ul:pl-5
              prose-li:text-gray-700 prose-li:my-1
              prose-strong:text-gray-900
              prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
              prose-hr:my-4 prose-hr:border-gray-300
              prose-table:text-sm
              prose-th:bg-gray-100 prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:font-semibold
              prose-td:px-3 prose-td:py-2 prose-td:border-b prose-td:border-gray-200
              print:prose-sm print:prose-h1:text-xl print:prose-h2:text-base print:prose-h3:text-sm
            "
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />

          {/* 页脚 */}
          <div className="mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
            <p>生成于 {new Date().toLocaleDateString('zh-CN')} | {resumeVersion.name}</p>
            <p className="mt-1">在线访问: https://tianlizeng.cloud/resume/{encodeURIComponent(resumeVersion.id)}</p>
          </div>
        </ResumeLayout>
      </div>
    </div>
  )
}
