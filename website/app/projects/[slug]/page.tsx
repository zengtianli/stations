import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { getProjectBySlug, getAllProjects, ProjectContent } from "@/lib/content"
import { getServerTrack } from "@/lib/track-server"
import { TRACK_PAGE_BG } from "@/lib/track-theme"

// 导入项目内容样式
import "./project-content.css"

export async function generateMetadata({ params }: { params: { slug: string } }) {
  // Next.js 15中需要特殊处理params对象
  const safeParams = await Promise.resolve(params);
  const slug = safeParams.slug;
  const projectResult = await getProjectBySlug(slug);

  if (!projectResult) {
    return {
      title: "项目不存在",
    }
  }

  const project = projectResult.metadata;
  
  return {
    title: `${project.title} | 曾田力项目案例`,
    description: project.brief,
  }
}

export async function generateStaticParams() {
  const projects = await getAllProjects();
  return projects.map((project: ProjectContent) => ({
    slug: project.slug,
  }))
}

export default async function ProjectPage({ params, searchParams }: { params: { slug: string }, searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  // Next.js 15中需要特殊处理params对象
  const safeParams = await Promise.resolve(params);
  const slug = safeParams.slug;
  const track = await getServerTrack(await searchParams);
  const projectResult = await getProjectBySlug(slug);

  if (!projectResult) {
    notFound()
  }

  // 获取项目元数据和内容
  const project = projectResult.metadata;
  const content = projectResult.content; // HTML格式的内容

  // 获取项目图片（兼容新旧格式）
  const projectImage = project.thumbnail || project.image || "/placeholder.svg";

  return (
    <main className={`min-h-screen flex flex-col ${TRACK_PAGE_BG[track]}`}>
      <Navbar />
      <div className="flex-grow container mx-auto px-4 py-16 max-w-4xl">
        <Link href="/projects">
          <Button variant="ghost" className="mb-6">
            <ChevronLeft className="mr-2 h-4 w-4" />
            返回项目列表
          </Button>
        </Link>

        <h1 className="text-4xl font-bold mb-4">{project.title}</h1>

        {/* 项目元信息 */}
        <div className="mb-6 flex flex-wrap items-center gap-4 text-muted-foreground">
          <span className="font-medium text-foreground">{project.role}</span>
          {project.period && (
            <>
              <span>|</span>
              <span>{project.period}</span>
            </>
          )}
          {project.category && (
            <>
              <span>|</span>
              <span>{project.category}</span>
            </>
          )}
        </div>

        {/* 标签 */}
        <div className="mb-6 flex flex-wrap gap-2">
          {project.tags?.map((tag: string) => (
            <span key={tag} className="skill-tag">
              {tag}
            </span>
          ))}
        </div>

        {/* 项目图片 */}
        <div className="mb-8 rounded-lg overflow-hidden">
          <Image
            src={projectImage}
            alt={project.title}
            width={800}
            height={450}
            className="w-full object-cover"
          />
        </div>

        {/* 使用从项目 Markdown 内容加载的HTML */}
        <div className="project-content space-y-6" dangerouslySetInnerHTML={{ __html: content }} />
      </div>
      <Footer />
    </main>
  )
}
