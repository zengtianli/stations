---
name: website-context
description: 网站部项目上下文。技术栈、目录结构、常用命令、数据来源。当在个人网站项目工作时触发。
---

# 网站部项目上下文

> 📍 项目：`~/Downloads/personal_site/`  
> 🎯 定位：一人集团 **网站部**  
> 🔧 职责：个人网站开发与维护

## 部门职责

**负责**：
- ✅ Next.js 页面 + React 组件开发
- ✅ Tailwind CSS 样式
- ✅ Markdown 内容管理
- ✅ SEO 优化
- ✅ Vercel 部署

**不负责**：
- ❌ 简历内容撰写（总部 → `content/resume-source/`）
- ❌ 档案材料管理（总部 → `public/archives/`）

## 技术栈

- Next.js 14+
- React 18+
- TypeScript
- Tailwind CSS
- MDX

## 目录结构

```
personal_site/
├── app/                    # Next.js 页面
├── components/             # React 组件
├── content/                # 内容文件
│   ├── blog/               # 博客
│   ├── projects/items/     # 项目
│   ├── research/           # 研究成果
│   ├── about/              # 关于页
│   └── resume-source/      # → 总部软链接
├── public/
│   ├── images/             # 图片
│   └── archives/           # → 总部软链接
├── lib/                    # 工具函数
│   ├── content.ts          # 内容读取
│   ├── seo-config.ts       # SEO 配置
│   └── design-system/      # 设计令牌
└── .cursor/
    ├── PRD.md              # 项目需求
    └── TASKS.md            # 任务列表
```

## 数据来源

| 内容 | 来源 | 链接方式 |
|------|------|----------|
| 简历素材 | `~/cursor-shared/personal/resume/` | 软链接 → `content/resume-source/` |
| 档案扫描件 | `~/cursor-shared/archives/` | 软链接 → `public/archives/` |

## 常用命令

```bash
pnpm dev      # 开发
pnpm build    # 构建
git push      # 部署（Vercel 自动）
```

## 快速参考

| 任务 | 文件 |
|------|------|
| 添加页面 | `app/xxx/page.tsx` |
| 添加组件 | `components/xxx.tsx` |
| 写博客 | `content/blog/xxx.md` |
| 添加项目 | `content/projects/items/xxx.md` |
| SEO 配置 | `lib/seo-config.ts` |
| 样式变量 | `app/globals.css` |
| Tailwind | `tailwind.config.ts` |

## 开发规范

1. 组件放在 `components/` 下，按原子设计分层
2. 页面放在 `app/` 下，使用 App Router
3. 内容更新先更新总部，再同步到网站
