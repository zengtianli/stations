---
title: "Multi-Track 个人网站"
slug: "personal-website"
role: "独立开发"
tags: ["Next.js", "React", "TypeScript", "Tailwind", "VPS"]
period: "2025-2026"
category: "Web 开发"
highlight: true
featured: false
thumbnail: "/images/projects/placeholder.svg"
brief: "基于 Next.js 15 的个人作品集网站，支持 4 个就业方向的动态内容切换，Markdown 驱动，SQLite 全文搜索，VPS 独立部署。"
tracks:
  devtools:
    highlight: true
  indie:
    brief: "从设计到部署的完整网站产品——Next.js SSG、VPS 部署、Cloudflare CDN、CMS 后台。"
    highlight: true
    featured: true
---

## 背景

个人网站需要同时展示水利工程、AI 工程、开发工具、独立开发四个方向的能力。传统的单一叙事无法满足多方向求职需求，因此设计了 Multi-Track 架构。

## 核心功能

### Multi-Track 方向切换

- 4 个就业方向：水利数字化、AI 工程、开发工具、独立开发
- 切换后 Hero、核心能力、技能排序、项目筛选、博客过滤全部响应
- URL query + cookie 持久化，可分享特定方向的链接
- 默认水利方向，保持 SEO 不变

### 内容系统

- Markdown + YAML frontmatter 驱动所有内容
- `tracks` overlay 字段实现按方向的内容变体
- gray-matter + remark 解析管线

### 搜索与 CMS

- SQLite FTS5 全文搜索
- /admin CMS 后台（Cloudflare Access 保护）
- 博客 CRUD 操作

### 部署

- Next.js standalone 输出
- VPS systemd 服务 + Nginx 反向代理
- Cloudflare CDN + Origin 证书
- `bash deploy.sh` 一键部署

## 技术栈

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS + shadcn/ui
- SQLite (better-sqlite3) + FTS5
- Resend (邮件) + Google Analytics

## 在线访问

[tianlizeng.cloud](https://tianlizeng.cloud)

## 源代码

[GitHub](https://github.com/zengtianli/web)
