# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

水利工程师（曾田力）的个人作品集网站。基于 Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS + shadcn/ui。

**部署**: VPS standalone（`bash deploy.sh`）→ /opt/website → systemd `website` → Nginx 8443 → CF
**域名**: tianlizeng.cloud
**搜索**: SQLite FTS5（data/search.db，deploy 时自动构建）
**CMS**: /admin（CF Access 保护）→ content/blog/*.md

## 常用命令

```bash
pnpm dev          # 开发服务器，端口 3005
pnpm build        # 生产构建（推送前必须本地验证）
pnpm start        # 启动生产服务器
pnpm lint         # ESLint 检查
```

包管理器使用 pnpm，不要用 npm。

## 架构

### 内容驱动

所有页面内容存储在 `content/` 目录的 Markdown 文件中，通过 `lib/content.ts` 加载：
- `getContent<T>(path)` — 解析单个 md 文件（gray-matter frontmatter + remark 转 HTML）
- `getNestedContent<T>(path)` — 仅提取 YAML frontmatter 数据（用于 skills、timeline、research 等结构化内容）
- `getAllBlogPosts()` / `getBlogPostBySlug(slug)` — 博客专用
- `getAllProjects()` / `getProjectBySlug(slug)` — 项目专用，优先读 `content/project-source/`，回退到 `content/projects/items/`

### 外部 Symlinks（重要）

部分内容通过符号链接引入外部目录：
- `content/project-source/` → `~/cursor-shared/personal/projects`
- `content/resume-source/` → `~/cursor-shared/personal/resume`
- `public/archives/` → `~/cursor-shared/archives/`

修改这些目录的内容会影响外部仓库。

### 页面路由

动态路由使用 `generateStaticParams()` 实现 SSG：
- `/projects/[slug]` — 项目详情
- `/blog/[slug]` — 博客文章
- `/resume/[version]` — 简历版本（comprehensive, work, sports）
- `/tools/irrigation` — 农灌需水计算工具

### 组件结构

- `components/ui/` — shadcn/ui 基础组件（通过 `npx shadcn-ui@latest add` 管理）
- `components/resume/` — 简历渲染组件
- 页面级组件直接放 `components/` 根目录（navbar, footer, hero-section 等）
- 路径别名 `@/*` 映射到项目根目录

### 方向系统（Track）

4 个职业方向：hydro / ai / devtools / indie。Cookie 持久化，middleware rewrite 注入 searchParams。
- `lib/track.ts` — Track 类型、元数据、博客标签映射
- `lib/track-theme.ts` — 方向主题色（TRACK_PAGE_BG）
- `lib/track-server.ts` — 服务端读 track（从 searchParams）
- `lib/track-content.ts` — content overlay 解析（resolveTrackContent）
- `components/track-provider.tsx` — 客户端 context（activeDirection + clearTrack）
- `components/track-clearer.tsx` — 首页清 cookie
- `components/theme-color.tsx` — 浏览器地址栏颜色
- `middleware.ts` — rewrite（非 redirect）+ `url.protocol = 'http'`（standalone SSL 修复）

### 样式

- Apple 风格**纯亮色**主题，`forcedTheme="light"`，**不要暗色模式**
- 页面背景：方向主题色铺满（hydro=#E3F0FF, ai=#F0E8FF, devtools=#DFFBE9, indie=#FFF3D6）
- 卡片：liquid glass（`bg-white/50 backdrop-blur-xl border border-white/60 shadow-sm rounded-2xl`）
- 文字：#1d1d1f（主）/ #86868b（次）/ #0071E3（链接），不用 opacity 做文字色
- Navbar/地址栏：滚动背景和 theme-color 都跟方向色走
- `cn()` 工具函数（`lib/utils.ts`）合并类名
- 项目详情页有独立 CSS：`app/projects/[slug]/project-content.css`
- 全局 Markdown 渲染样式在 `app/globals.css`

### 导航

5 项：关于我 / 作品 / 研究 / 博客 / 生活。联系方式在 footer。配置在 `lib/profile-config.ts` 的 `navigationConfig`。

### 简历系统

模块化简历：`lib/resume-data.ts`（数据）→ `lib/resume-builder.ts`（构建器）→ `components/resume/`（渲染组件）。支持多版本简历模板。

### 数据验证与表单

联系表单：react-hook-form + zod 验证 → `/api/contact` → Resend 发送邮件。

## 内容格式

### 博客文章 frontmatter

```yaml
title: "标题"
date: "2025-10-11"
excerpt: "摘要"
tags: ["tag1", "tag2"]
image: "/images/blog/cover.jpg"  # 可选
published: true                   # 可选
```

### 项目 frontmatter

```yaml
title: "项目名"
slug: "project-slug"
role: "角色"
tags: ["tag1"]
period: "2024-2025"      # 可选
category: "水资源规划"    # 可选
highlight: true           # 可选
featured: true            # 可选
```

### 研究内容（YAML-only）

awards、patents、software-copyrights、academic-papers 使用纯 YAML frontmatter 结构，通过 `getNestedContent()` 读取。

## 部署（硬规则）

**唯一部署方式：`cd ~/Dev/website && bash deploy.sh`**

- 绝对不能 SSH 到 VPS 上 build。VPS 的 `/var/www/web` 只是源码镜像，systemd 跑的是 `/opt/website`（standalone 产物）
- deploy.sh 流程：rm -rf .next → pnpm build → rsync standalone+static+public 到 VPS → restart → 自动验证
- GitHub webhook 只做 git pull，不做 build/deploy，对 website 无效
- 部署后 deploy.sh 会自动验证 HTTP 200 + CSS 哈希匹配 + 服务端日志

**已知陷阱：**
- CSS 哈希不匹配：standalone 和 static 必须来自同一次 build，否则页面无样式（2026-04-12 事故）
- cookies() ByteString：Next.js 15 的 `cookies()` 遇到非 ASCII cookie 会崩溃，不要在 server component 里调 `cookies()`（2026-04-13 事故）

## 构建注意事项

- `next.config.mjs` 中 ESLint 和 TypeScript 错误在构建时被忽略（`ignoreDuringBuilds: true`）
- 图片未启用 Next.js 优化（`unoptimized: true`）
- 中文引号与 JS 字符串冲突时，用单引号包裹：`'浙江省水利厅"体育之星"'`
- 服务器组件不能使用事件处理器，需要交互的组件加 `'use client'`

## 验证规则

任务完成前必须通过：
1. `pnpm build` 无报错（本地构建验证）
2. 新增/修改页面需在 `pnpm dev` 下目视检查渲染效果
3. 内容变更确认 frontmatter 格式符合上方规范
4. 涉及 symlink 目录的改动需确认不影响外部仓库

## Compact Instructions

会话压缩时保留以下关键上下文：
- **项目**: Next.js 15 个人网站，pnpm，部署到 VPS（`bash deploy.sh`）
- **内容系统**: `content/` 下 Markdown，`lib/content.ts` 加载，部分目录是外部 symlink
- **路由**: `/projects/[slug]`, `/blog/[slug]`, `/resume/[version]`, `/tools/irrigation`
- **样式**: Tailwind + shadcn/ui，明暗主题，`cn()` 合并类名
- **验证**: 改动后必须 `pnpm build` 通过
- **包管理**: 只用 pnpm，不用 npm
