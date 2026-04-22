# 个人作品集网站

> 曾田力的个人作品集网站，展示水利工程领域的研究成果和项目经验

[![Next.js](https://img.shields.io/badge/Next.js-15.2.4-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

## 项目简介

基于 Next.js 15 构建的现代化个人作品集网站，融合水利工程专业背景与前沿 Web 技术，展示：

- 🚀 **项目案例** - 数字孪生、水资源评价、GIS 应用等
- 📚 **研究成果** - 学术论文、专利、软件著作权
- 📝 **技术博客** - 开发经验与技术分享
- 👤 **个人简历** - 多版本在线简历系统
- 🛠️ **开发工具** - Neovim 配置、Shell 脚本等

## 技术栈

### 核心框架
- **Next.js 15** - React 全栈框架 (App Router)
- **React 19** - 现代化 UI 库
- **TypeScript** - 类型安全

### UI 与样式
- **Tailwind CSS** - 原子化 CSS 框架
- **shadcn/ui** - 高质量组件库
- **Radix UI** - 无障碍组件基础
- **Lucide React** - 图标库

### 内容管理
- **Markdown** - 内容编写格式
- **Gray Matter** - 元数据解析
- **Remark** - Markdown 处理

### 功能特性
- **Resend** - 邮件服务
- **Zod** - 数据验证
- **next-themes** - 主题切换
- **Google Analytics** - 网站分析

## 快速开始

### 环境要求
- Node.js >= 18
- pnpm (推荐) 或 npm

### 本地开发

```bash
# 克隆项目
git clone https://github.com/zengtianli/web.git
cd portfolio

# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填写必要的 API 密钥

# 启动开发服务器
pnpm dev

# 访问 http://localhost:3005
```

### 可用命令

```bash
pnpm dev          # 启动开发服务器
pnpm build        # 构建生产版本
pnpm start        # 启动生产服务器
pnpm lint         # 代码检查
```

## 项目文档

完整的开发文档位于 `docs/` 目录：

- **[系统架构](docs/ARCHITECTURE.md)** - 技术架构、目录结构、组件关系
- **[开发指南](docs/DEVELOPMENT.md)** - 开发流程、测试、部署、故障排查
- **[内容管理](docs/CONTENT_MANAGEMENT.md)** - 如何添加博客、项目、更新简历

### 快速导航

- **添加博客文章** → [内容管理指南](docs/CONTENT_MANAGEMENT.md#添加博客文章)
- **添加项目案例** → [内容管理指南](docs/CONTENT_MANAGEMENT.md#添加项目案例)
- **更新个人信息** → [内容管理指南](docs/CONTENT_MANAGEMENT.md#更新个人信息)
- **部署到 Vercel** → [开发指南](docs/DEVELOPMENT.md#部署流程)
- **故障排查** → [开发指南](docs/DEVELOPMENT.md#故障排查)

## 项目结构

```
portfolio/
├── app/                    # Next.js 应用页面
├── components/             # React 组件
│   ├── atoms/              # 原子组件
│   ├── molecules/          # 分子组件
│   ├── resume/             # 简历组件
│   └── ui/                 # 基础 UI 组件
├── content/                # Markdown 内容
│   ├── about/              # 关于页面
│   ├── blog/               # 博客文章
│   ├── projects/           # 项目案例
│   ├── research/           # 研究成果
│   └── resume/             # 简历内容
├── lib/                    # 工具库
├── public/                 # 静态资源
├── docs/                   # 项目文档
└── scripts/                # 构建脚本
```

## 核心特性

### 🎨 现代化设计
- 响应式布局，适配所有设备
- 明暗主题切换
- 流畅的页面动画
- 遵循无障碍标准

### 📝 内容驱动
- Markdown 内容管理
- 动态路由生成
- 元数据支持
- SEO 优化

### 🚀 性能优化
- 静态生成 (SSG)
- 图片优化 (WebP)
- 代码分割
- 字体优化

### 📄 简历系统
- 多版本简历（综合/工作/学术/体育）
- 在线预览和 PDF 导出
- 模块化数据管理
- 打印优化

## 提交与部署

项目通过 Vercel 自动部署，push 到 `main` 分支即触发构建和上线。

```bash
# 1. 本地构建验证（必须通过再推送，避免线上构建失败）
pnpm build

# 2. 查看改动
git status
git diff

# 3. 暂存文件（指定具体文件，避免误提交敏感文件）
git add <文件名>

# 4. 提交（使用语义化前缀）
git commit -m "feat: 描述你的修改"

# 5. 推送到 GitHub，Vercel 自动部署
git push origin main
```

提交信息前缀：`feat:` 新功能 / `fix:` 修复 / `docs:` 文档 / `chore:` 杂项 / `refactor:` 重构

部署状态可在 [Vercel Dashboard](https://vercel.com/dashboard) 查看，通常 1-2 分钟完成。

### 环境变量

在 Vercel 或 `.env.local` 中配置：

```bash
# Resend API (联系表单)
RESEND_API_KEY=re_xxxxxxxxxxxxx
CONTACT_EMAIL=your-email@gmail.com

# Google Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

## 贡献

这是一个个人项目，主要用于展示个人作品。如果您有任何建议或发现问题，欢迎提出 Issue。

## 许可证

© 2025 曾田力. All rights reserved.

---

**在线访问**: [tianlizeng.cloud](https://tianlizeng.cloud)
