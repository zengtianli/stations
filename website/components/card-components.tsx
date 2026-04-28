/**
 * 卡片类组件集合
 * Apple 风格：白卡、阴影、大圆角
 */

import Image from "next/image"
import Link from "next/link"
import { Calendar, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { BlogPost, ProjectContent, LatestUpdatesContent, LatestUpdate } from "@/lib/content"
import { CATEGORY_META } from "@/lib/content-meta"

// ============== 博客卡片 ==============
interface BlogCardProps {
  post: BlogPost
}

export function BlogCard({ post }: BlogCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <div className="bg-white/50 backdrop-blur-xl border border-white/60 shadow-sm rounded-2xl overflow-hidden h-full
        transition-all duration-300 hover:shadow-lg">
        {post.image && (
          <div className="relative h-44 overflow-hidden">
            <Image src={post.image} alt={post.title} fill className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
          </div>
        )}
        <div className="p-6">
          {post.category && CATEGORY_META[post.category] && (
            <div className="mb-2">
              <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${CATEGORY_META[post.category].color}`}>
                {CATEGORY_META[post.category].label}
              </span>
            </div>
          )}
          <h3 className="text-base font-semibold text-[#1d1d1f] mb-2 line-clamp-2">{post.title}</h3>
          <p className="text-sm text-[#86868b] mb-4 line-clamp-2">{post.excerpt}</p>
          <div className="flex items-center gap-3 text-xs text-[#86868b] mb-3">
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formatDate(post.date)}</span>
            </div>
            {post.readingTime && (
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>{post.readingTime} 分钟</span>
              </div>
            )}
          </div>
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {post.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-xs text-[#86868b] border border-[#d2d2d7] rounded-full px-2.5 py-0.5">{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

// ============== 项目网格 ==============
interface ProjectGridProps {
  projects: ProjectContent[]
}

export function ProjectGrid({ projects }: ProjectGridProps) {
  const getProjectImage = (project: ProjectContent) => {
    return project.thumbnail || project.image || "/placeholder.svg"
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((project: ProjectContent) => (
        <Link key={project.slug} href={`/projects/${project.slug}`} className="group block">
          <div className="bg-white/50 backdrop-blur-xl border border-white/60 shadow-sm rounded-2xl overflow-hidden h-full
            transition-all duration-300 hover:shadow-lg">
            <div className="relative h-44 overflow-hidden">
              <Image
                src={getProjectImage(project)}
                alt={project.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              {(project.featured || project.highlight) && (
                <div className="absolute top-3 right-3">
                  <span className="text-xs bg-white/80 backdrop-blur-md text-[#1d1d1f] rounded-full px-2.5 py-1">
                    {project.featured ? '精选' : '重点'}
                  </span>
                </div>
              )}
            </div>
            <div className="p-6">
              <h3 className="text-base font-semibold text-[#1d1d1f] mb-1 line-clamp-1">{project.title}</h3>
              <p className="text-xs text-[#86868b] mb-3">
                {project.role}
                {project.period && ` · ${project.period}`}
              </p>
              {project.brief && (
                <p className="text-sm text-[#86868b] mb-3 line-clamp-2">{project.brief}</p>
              )}
              <div className="flex flex-wrap gap-1.5">
                {project.category && (
                  <span className="text-xs text-[#86868b] border border-[#d2d2d7] rounded-full px-2.5 py-0.5">{project.category}</span>
                )}
                {project.tags?.slice(0, 2).map((tag: string) => (
                  <span key={tag} className="text-xs text-[#aeaeb2] border border-[#d2d2d7] rounded-full px-2.5 py-0.5">{tag}</span>
                ))}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

// ============== 最新动态 ==============
interface LatestUpdatesProps {
  data: LatestUpdatesContent
}

export function LatestUpdates({ data }: LatestUpdatesProps) {
  return (
    <section className="py-24 md:py-32">
      <div className="container mx-auto px-6 md:px-8">
        <h2 className="text-3xl font-semibold text-[#1d1d1f] text-center mb-12">{data.title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.items.map((update: LatestUpdate, index: number) => (
            <div key={index} className="bg-white/50 backdrop-blur-xl border border-white/60 shadow-sm rounded-2xl overflow-hidden
              transition-all duration-300 hover:shadow-lg">
              <div className="relative h-44">
                <Image src={update.image || "/placeholder.svg"} alt={update.title} fill className="object-cover" priority={index === 0} sizes="(max-width: 768px) 100vw, 50vw" />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-[#1d1d1f] mb-2">{update.title}</h3>
                <p className="text-sm text-[#86868b] mb-4">{update.description}</p>
                <Link href={update.link} className="text-sm text-[#0071e3] font-medium hover:underline">
                  阅读更多 →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
