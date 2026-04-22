/**
 * 工具卡片组件 - Apple 风格
 */

import { Github, ExternalLink } from "lucide-react"

interface Tool {
  id: string
  name: string
  description: string
  techs: string[]
  github?: string
  gitee?: string
  link?: string
}

interface ToolCardProps {
  tool: Tool
}

export default function ToolCard({ tool }: ToolCardProps) {
  return (
    <div className="bg-white/50 backdrop-blur-xl border border-white/60 shadow-sm rounded-2xl p-6 md:p-8
      transition-all duration-300 hover:shadow-lg">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-[#1d1d1f] mb-2">{tool.name}</h3>
          <p className="text-sm text-[#86868b] leading-relaxed">{tool.description}</p>
        </div>

        <div className="flex gap-2 shrink-0">
          {tool.link ? (
            <a href={tool.link} className="flex items-center gap-1.5 text-sm text-[#0071e3] hover:text-[#0077ED] transition-colors border border-[#0071e3]/30 rounded-full px-4 py-1.5">
              <ExternalLink className="h-3.5 w-3.5" />
              打开
            </a>
          ) : (
            <>
              {tool.github && (
                <a href={tool.github} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-[#0071e3] hover:text-[#0077ED] transition-colors border border-[#0071e3]/30 rounded-full px-4 py-1.5">
                  <Github className="h-3.5 w-3.5" />
                  GitHub
                </a>
              )}
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {tool.techs.map((tech) => (
          <span key={tech} className="text-xs text-[#86868b] border border-[#d2d2d7] rounded-full px-2.5 py-0.5">
            {tech}
          </span>
        ))}
      </div>
    </div>
  )
}
