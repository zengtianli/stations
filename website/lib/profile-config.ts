/**
 * 个人资料配置文件
 * 统一管理个人信息、联系方式、核心能力等相对稳定的内容
 */

import { Brain, Code, Droplets, Mail, Phone, MapPin, Linkedin, Github, MessageCircle, Code2, Zap, Terminal, Package, Bot, Wrench, Rocket, Cpu, Workflow, Globe, Layers, Server, TrendingUp } from "lucide-react"
import type React from "react"
import type { Track } from "./track"

// Hero 配置类型
export interface HeroConfig {
  name: string
  tagline: string
  description: string
  buttons: { text: string; href: string; variant: "default" | "outline" }[]
  highlights: string[]
  track: Track
}

// 核心能力配置
export interface StrengthConfig {
  icon: any
  title: string
  description: string
}

export const strengthsConfig: StrengthConfig[] = [
  {
    icon: Brain,
    title: "智能水资源建模",
    description: "结合LSTM、数字孪生等先进技术，构建智能水资源模型，提供精准预测与决策支持。",
  },
  {
    icon: Code,
    title: "软件与系统开发", 
    description: "全栈开发能力，专注于水利行业专业软件系统研发，提升工程效率与管理水平。",
  },
  {
    icon: Droplets,
    title: "水利专业解决方案",
    description: "深厚的水利专业背景，提供承载力评价、岸线规划等专业解决方案，解决行业痛点。",
  },
]

// 联系信息配置
export interface ContactItem {
  icon: any
  title: string
  content: string | React.ReactNode
  delay: number
  href?: string
  type?: "email" | "phone" | "link" | "text"
}

export const contactConfig = {
  title: "联系方式",
  description: "我对水利科技的未来充满期待，欢迎随时与我联系，探讨行业发展、技术创新或合作机会。",
  contacts: [
    {
      icon: Mail,
      title: "电子邮箱",
      content: "zengtianli1@126.com",
      delay: 100,
      href: "mailto:zengtianli1@126.com",
      type: "email" as const,
    },
    {
      icon: Phone,
      title: "电话",
      content: "15957183444",
      delay: 200,
      href: "tel:15957183444", 
      type: "phone" as const,
    },
    {
      icon: MapPin,
      title: "地址",
      content: "浙江省杭州市",
      delay: 300,
      type: "text" as const,
    },
    {
      icon: Linkedin,
      title: "LinkedIn",
      content: "linkedin.com/in/tianlizeng",
      delay: 400,
      href: "https://www.linkedin.com/in/tianli-zeng-4068a7190/",
      type: "link" as const,
    },
    {
      icon: Github,
      title: "GitHub", 
      content: "github.com/zengtianli",
      delay: 500,
      href: "https://github.com/zengtianli",
      type: "link" as const,
    },
    {
      icon: MessageCircle,
      title: "微信",
      content: "zengtracy",
      delay: 600,
      type: "text" as const,
    },
  ]
}

// 工具概览配置
export interface ToolFeature {
  icon: any
  title: string
  description: string
}

export const toolsOverviewConfig = {
  title: "开发工具集合",
  description: "精心打磨的开源工具集，涵盖 macOS 自动化、编辑器配置、命令行环境等各个方面",
  features: [
    {
      icon: Code2,
      title: "实用性强",
      description: "解决实际开发中的痛点问题"
    },
    {
      icon: Zap,
      title: "高度优化", 
      description: "注重性能和用户体验"
    },
    {
      icon: Terminal,
      title: "模块化设计",
      description: "易于扩展和维护"
    },
    {
      icon: Package,
      title: "开源共享",
      description: "MIT 协议，欢迎贡献"
    }
  ] as ToolFeature[],
  techStack: [
    "Shell", "Python", "Lua", "TypeScript", "AppleScript",
    "Yabai", "Raycast", "Neovim", "Zsh", "FZF"
  ],
  footerText: "所有工具都在 GitHub 和 Gitee 上开源，采用 MIT 协议，欢迎 Star、Fork 和贡献代码！每个工具都经过长期使用和优化，具有完整的文档和使用说明。"
}

// 页脚配置
export const footerConfig = {
  copyright: {
    text: "All Rights Reserved.",
    name: "曾田力"
  },
  links: [
    {
      text: "下载完整简历 (PDF)",
      href: "/zengtianli-cv.pdf",
      icon: "FileDown" as const,
      download: "曾田力-简历.pdf"
    },
    {
      text: "LinkedIn", 
      href: "https://www.linkedin.com/in/tianli-zeng-4068a7190/",
      icon: "Linkedin" as const,
      external: true
    },
    {
      text: "GitHub",
      href: "https://github.com/zengtianli", 
      icon: "Github" as const,
      external: true
    }
  ]
}

// Hero区配置
export const heroConfig: HeroConfig = {
  name: "曾田力",
  tagline: "数据驱动水利创新 | AI赋能未来水务",
  description: "融合**水利工程**专业智慧与**前沿信息技术**，致力于通过**数据分析**、**智能模型**及**软件系统**研发，解决复杂水资源挑战，驱动行业变革。",
  buttons: [
    {
      text: "深入了解",
      href: "/about",
      variant: "default" as const
    },
    {
      text: "查看项目",
      href: "/projects",
      variant: "outline" as const
    }
  ],
  highlights: ["水利工程", "前沿信息技术", "数据分析", "智能模型", "软件系统"],
  track: 'hydro',
}

// 各 Track 的 Hero 变体
const heroTrackOverrides: Record<Exclude<Track, 'hydro'>, Partial<HeroConfig>> = {
  ai: {
    tagline: "AI 工程 | LLM 工具链架构师",
    description: "构建**企业级 LLM 应用**与 **AI Agent 工作流**，从**提示工程**到**模型部署**的全链路解决方案。43 个 Claude Code skills、14 套自动化流水线、完整的 MCP 生态集成。",
    highlights: ["企业级 LLM 应用", "AI Agent 工作流", "提示工程", "模型部署"],
    buttons: [
      { text: "AI 项目", href: "/projects?track=ai", variant: "default" as const },
      { text: "技术博客", href: "/blog?track=ai", variant: "outline" as const },
    ],
  },
  devtools: {
    tagline: "开发者工具产品工程师",
    description: "打造提升**开发者生产力**的工具链——从 **CLI 脚本**到 **Raycast 集成**，从**自动化工作流**到**可观测性平台**。58 个 Raycast wrappers、4 个工具仓库、完整的 DevOps 闭环。",
    highlights: ["开发者生产力", "CLI 脚本", "Raycast 集成", "自动化工作流", "可观测性平台"],
    buttons: [
      { text: "工具集", href: "/projects?track=devtools", variant: "default" as const },
      { text: "开发工具", href: "/tools", variant: "outline" as const },
    ],
  },
  indie: {
    tagline: "全栈独立开发者 · 量化投资实践者 | One-person Company",
    description: "一个人的**全栈闭环**：**产品设计**、**开发**、**部署**到**运维**，同样的工程思维也延伸到**量化投资**——QQQ Covered Call 策略 5 年实盘，年化 +23.95%。29 个 GitHub 仓库、24 个 systemd 服务、跨境三地资产系统，全部自己搞定。",
    highlights: ["全栈闭环", "产品设计", "开发", "部署", "运维", "量化投资"],
    buttons: [
      { text: "作品集", href: "/projects?track=indie", variant: "default" as const },
      { text: "关于我", href: "/about", variant: "outline" as const },
    ],
  },
}

/** 获取 track 解析后的 heroConfig */
export function getTrackHeroConfig(track: Track): HeroConfig {
  if (track === 'hydro') return heroConfig
  const overrides = heroTrackOverrides[track]
  return { ...heroConfig, ...overrides, track }
}

// 各 Track 的核心能力变体
const strengthsTrackConfig: Record<Track, StrengthConfig[]> = {
  hydro: [
    {
      icon: Brain,
      title: "智能水资源建模",
      description: "结合LSTM、数字孪生等先进技术，构建智能水资源模型，提供精准预测与决策支持。",
    },
    {
      icon: Code,
      title: "软件与系统开发",
      description: "全栈开发能力，专注于水利行业专业软件系统研发，提升工程效率与管理水平。",
    },
    {
      icon: Droplets,
      title: "水利专业解决方案",
      description: "深厚的水利专业背景，提供承载力评价、岸线规划等专业解决方案，解决行业痛点。",
    },
  ],
  ai: [
    {
      icon: Bot,
      title: "LLM 应用架构",
      description: "Claude Code harness 体系设计——43 个 commands、14 个 skills、完整的 hooks/memory/MCP 生态集成。",
    },
    {
      icon: Cpu,
      title: "AI Agent 工作流",
      description: "从单轮对话到多 Agent 协作，构建生产级 AI 自动化流水线，覆盖文档生成、代码审查、数据分析全场景。",
    },
    {
      icon: Workflow,
      title: "提示工程与评估",
      description: "系统化的 prompt 设计方法论，配合自动化评估体系，持续优化 LLM 输出质量。",
    },
  ],
  devtools: [
    {
      icon: Terminal,
      title: "CLI 工具链",
      description: "4 个独立工具仓库（doctools/devtools/mactools/clashx），覆盖文档处理、开发效率、系统管理全链路。",
    },
    {
      icon: Wrench,
      title: "Raycast 集成",
      description: "58 个 Raycast wrappers，将命令行工具一键封装为 GUI 操作，极致的开发者体验。",
    },
    {
      icon: Layers,
      title: "自动化基础设施",
      description: "repo 管理工具链（audit/promote/groom）、CI/CD、dashboard、briefing 系统——开发运维一体化。",
    },
  ],
  indie: [
    {
      icon: Rocket,
      title: "端到端交付",
      description: "从需求分析到产品上线的完整闭环——设计、开发、测试、部署、运维全部独立完成。",
    },
    {
      icon: Server,
      title: "全栈基础设施",
      description: "VPS 上运行 24 个 systemd 服务 + 4 个 Docker 容器，Cloudflare 域名管理，零依赖第三方平台。",
    },
    {
      icon: TrendingUp,
      title: "量化投资系统",
      description: "HSBC 三地跨境资产管道、QQQ Covered Call 期权策略 5 年实盘、自建 Streamlit 风控仪表盘——工程思维驱动的投资闭环。",
    },
  ],
}

/** 获取 track 对应的核心能力配置 */
export function getTrackStrengths(track: Track): StrengthConfig[] {
  return strengthsTrackConfig[track]
}

// 导航配置 — SSOT: ~/Dev/tools/configs/menus/sites/website.yaml
// 实际数组由 scripts/sync-menu.py 生成到 lib/menu.generated.ts，prebuild hook 触发
import { navigationConfig as _navigationConfig } from "./menu.generated"
export const navigationConfig = _navigationConfig

// 品牌配置
export const brandConfig = {
  name: "曾田力",
  logo: "/images/zengtianli.jpg", // 如果有logo的话
  favicon: "/favicon.ico"
}



// 表单配置
export const contactFormConfig = {
  title: "发送消息",
  fields: [
    { 
      id: "name", 
      label: "姓名", 
      placeholder: "请输入您的姓名", 
      required: true, 
      type: "text" 
    },
    { 
      id: "email", 
      label: "邮箱", 
      placeholder: "请输入您的邮箱", 
      required: true, 
      type: "email" 
    },
    { 
      id: "subject", 
      label: "主题", 
      placeholder: "请输入消息主题", 
      required: false, 
      type: "text" 
    },
    { 
      id: "message", 
      label: "内容", 
      placeholder: "请输入您的消息内容", 
      required: true, 
      type: "textarea" 
    }
  ],
  submitButton: { 
    text: "发送消息", 
    loadingText: "发送中...",
    icon: "Send" as const
  },
  messages: {
    success: {
      title: "消息已发送",
      description: "感谢您的留言，我会尽快回复。"
    }
  }
}

// PDF下载配置
export const downloadConfig = {
  text: "下载PDF",
  filename: "zengtianli-cv",
  fullPath: "/zengtianli-cv.pdf"
}
