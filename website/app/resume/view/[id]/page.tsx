import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Share2 } from "lucide-react"
import Link from "next/link"
import { getContent } from "@/lib/content"
import { notFound } from "next/navigation"
import DownloadPDFButton from "@/components/download-pdf-button"

interface ResumeViewPageProps {
  params: {
    id: string
  }
}

const resumeMap = {
  comprehensive: {
    title: "综合简历",
    filename: "曾田力-综合简历",
    contentPath: "resume/comprehensive"
  },
  work: {
    title: "工作简历", 
    filename: "曾田力-工作简历",
    contentPath: "resume/work"
  },
  sports: {
    title: "体育简历",
    filename: "曾田力-体育简历", 
    contentPath: "resume/sports"
  }
}

export async function generateMetadata({ params }: ResumeViewPageProps) {
  const resume = resumeMap[params.id as keyof typeof resumeMap]
  if (!resume) {
    return {
      title: "简历未找到 | 曾田力"
    }
  }
  
  return {
    title: `${resume.title} | 曾田力`,
    description: `查看曾田力的${resume.title}`,
  }
}

export default async function ResumeViewPage({ params }: ResumeViewPageProps) {
  const resume = resumeMap[params.id as keyof typeof resumeMap]
  
  if (!resume) {
    notFound()
  }

  // 获取简历内容
  const contentResult = await getContent<{ content: string }>(resume.contentPath)
  
  if (!contentResult?.content) {
    notFound()
  }

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/resume">
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回简历中心
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{resume.title}</h1>
              <p className="text-sm text-muted-foreground">曾田力</p>
            </div>
          </div>
          
          <div className="flex space-x-2 no-print">
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              分享
            </Button>
            <DownloadPDFButton filename={resume.filename} />
          </div>
        </div>

        {/* Resume Content */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
            <div className="p-8 md:p-12">
              <div 
                className="prose prose-neutral dark:prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-h1:text-3xl prose-h1:mb-6 prose-h1:border-b prose-h1:border-border prose-h1:pb-3 prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:border-b prose-h2:border-border/50 prose-h2:pb-2 prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3 prose-h4:text-lg prose-h4:mt-4 prose-h4:mb-2 prose-p:leading-relaxed prose-p:mb-4 prose-ul:my-4 prose-li:my-1 prose-strong:text-foreground prose-strong:font-semibold prose-em:text-muted-foreground prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic print:prose-h1:text-black print:prose-h2:text-black print:prose-h3:text-black print:prose-p:text-black print:prose-li:text-black print:prose-strong:text-black"
                dangerouslySetInnerHTML={{ __html: contentResult.content }}
              />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
