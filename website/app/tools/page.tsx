import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import PageHeader from "@/components/page-header"
import ToolCard from "@/components/tool-card"
import { getServerTrack } from "@/lib/track-server"
import { TRACK_PAGE_BG } from "@/lib/track-theme"
import type { Track } from "@/lib/track"

export const metadata = {
  title: "开发工具 | 曾田力",
  description: "曾田力的开源开发工具集合，包括水利计算工具、AI工具链、macOS效率工具、编辑器配置等。",
}

interface Tool {
  id: string
  name: string
  description: string
  techs: string[]
  link?: string
  github?: string
  gitee?: string
}

const irrigationTool: Tool = {
  id: "irrigation",
  name: "农田灌溉需水计算",
  description: "浙东河网平原农田灌溉需水量在线计算系统，支持多作物类型、灌溉保证率配置，可视化展示需水量趋势和分布。",
  techs: ["Next.js", "TypeScript", "Recharts", "Python API"],
  link: "/tools/irrigation",
}

const executeTool: Tool = {
  id: "execute",
  name: "Execute - macOS 效率工具集",
  description: "一套完整的 macOS 自动化工具集合，通过 Raycast 集成提供强大的文件处理、窗口管理、宏录制等功能。",
  techs: ["macOS", "Raycast", "Python", "Shell", "AppleScript"],
  github: "https://github.com/zengtianli/execute",
  gitee: "https://gitee.com/zengtianli/execute",
}

const neovimTool: Tool = {
  id: "neovim",
  name: "现代化 Neovim 配置",
  description: "高度优化、模块化、功能完整的 Neovim 配置，提供现代 IDE 级开发体验。",
  techs: ["Neovim", "Lua", "LSP", "TreeSitter"],
  github: "https://github.com/zengtianli/nvim",
  gitee: "https://gitee.com/zengtianli/nvim",
}

const zshTool: Tool = {
  id: "zsh",
  name: "ZSH 配置",
  description: "基于 Zim 框架的 ZSH 配置，集成现代命令行工具和 FZF 增强功能。",
  techs: ["ZSH", "Zim", "FZF", "现代CLI工具"],
  github: "https://github.com/zengtianli/zsh",
  gitee: "https://gitee.com/zengtianli/zsh",
}

const claudeCodeTool: Tool = {
  id: "claude-code",
  name: "Claude Code Harness 工具链",
  description: "43 个 commands、14 个 skills、完整的 hooks/memory/MCP 生态——将 Claude Code 从对话工具升级为生产级开发基础设施。",
  techs: ["Claude Code", "MCP", "TypeScript", "Shell"],
  link: "/blog/claude-code-harness-architecture",
}

const ccDashboardTool: Tool = {
  id: "cc-dashboard",
  name: "QQQ Covered Call 仪表盘",
  description: "期权卖方策略实时监控系统——Greeks 计算、Roll 信号、P&L 曲线、情景分析。5 年实盘数据驱动，Sharpe 0.89。",
  techs: ["Streamlit", "Python", "Options Greeks", "Plotly"],
}

const TRACK_PAGE_CONFIG: Record<Track, { title: string; description: string }> = {
  hydro: {
    title: "水利工具",
    description: "水利工程计算与分析工具，将专业计算流程产品化",
  },
  ai: {
    title: "AI 工具链",
    description: "Claude Code 驱动的 AI 开发工具链，从 LLM 工程到日常开发效率",
  },
  devtools: {
    title: "开发工具",
    description: "精心打磨的开源工具集，涵盖 macOS 自动化、编辑器配置、命令行环境等各个方面",
  },
  indie: {
    title: "独立开发工具箱",
    description: "从开发到部署到投资的全栈工具概览——一个人的完整工具链",
  },
}

const TOOLS_BY_TRACK: Record<Track, Tool[]> = {
  hydro: [irrigationTool],
  ai: [claudeCodeTool, neovimTool, executeTool],
  devtools: [neovimTool, zshTool, executeTool, irrigationTool],
  indie: [claudeCodeTool, ccDashboardTool, irrigationTool, executeTool, neovimTool, zshTool],
}

export default async function ToolsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const track = await getServerTrack(params)
  const pageConfig = TRACK_PAGE_CONFIG[track]
  const tools = TOOLS_BY_TRACK[track]

  return (
    <main className={`min-h-screen flex flex-col ${TRACK_PAGE_BG[track]}`}>
      <Navbar />
      <div className="flex-grow max-w-5xl mx-auto px-6 md:px-8 py-24 md:py-32">
        <PageHeader
          title={pageConfig.title}
          description={pageConfig.description}
        />
        <div className="space-y-8">
          {tools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </div>
      <Footer />
    </main>
  )
}
