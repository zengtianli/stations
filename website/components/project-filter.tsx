"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { ProjectContent } from "@/lib/content"
import { ProjectGrid } from "./card-components"

interface ProjectFilterProps {
  projects: ProjectContent[]
}

export function ProjectFilter({ projects }: ProjectFilterProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  
  // 提取所有分类
  const categories = Array.from(
    new Set(projects.map(p => p.category).filter(Boolean))
  ).sort() as string[]
  
  // 筛选项目
  const filteredProjects = activeCategory
    ? projects.filter(p => p.category === activeCategory)
    : projects
  
  // 计算每个分类的数量
  const getCategoryCount = (category: string | null) => {
    if (!category) return projects.length
    return projects.filter(p => p.category === category).length
  }

  return (
    <div className="space-y-6">
      {/* 分类筛选 */}
      <div className="flex flex-wrap gap-2">
        <Badge
          variant={activeCategory === null ? "default" : "outline"}
          className="cursor-pointer hover:bg-primary/80 transition-colors"
          onClick={() => setActiveCategory(null)}
        >
          全部 ({projects.length})
        </Badge>
        {categories.map(category => (
          <Badge
            key={category}
            variant={activeCategory === category ? "default" : "outline"}
            className="cursor-pointer hover:bg-primary/80 transition-colors"
            onClick={() => setActiveCategory(category)}
          >
            {category} ({getCategoryCount(category)})
          </Badge>
        ))}
      </div>
      
      {/* 项目网格 */}
      <ProjectGrid projects={filteredProjects} />
      
      {/* 无结果提示 */}
      {filteredProjects.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          暂无 "{activeCategory}" 分类的项目
        </div>
      )}
    </div>
  )
}
