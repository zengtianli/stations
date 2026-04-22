# 系统架构文档

> 个人作品集网站的技术架构和项目结构说明

---

## 📖 项目概览

这是一个基于 **Next.js 15** 的现代化个人作品集网站，展示水利工程领域的研究成果和项目经验。

### 核心特点

- **框架**: Next.js 15 (App Router) + React 19
- **类型安全**: TypeScript
- **样式方案**: Tailwind CSS + shadcn/ui
- **内容管理**: Markdown + Gray Matter
- **渲染策略**: SSG (静态生成) + 部分 SSR
- **部署平台**: Vercel

---

## 🏗️ 技术架构设计

### 整体架构思路

项目采用现代前端开发的最佳实践：

1. **服务器端渲染 (SSR/SSG)**
   - 利用 Next.js App Router 实现 SSG/SSR
   - 提高首屏加载速度和 SEO 效果

2. **组件化开发**
   - 原子化设计体系 (Atoms → Molecules → Organisms)
   - 提高代码复用性和可维护性

3. **内容与代码分离**
   - 使用 Markdown 管理内容
   - 便于非技术人员更新内容

4. **类型安全**
   - 全面使用 TypeScript
   - 减少运行时错误

5. **响应式设计**
   - 移动优先的设计理念
   - 适配所有设备尺寸

6. **性能优化**
   - 图片优化 (WebP 格式)
   - 代码分割和懒加载
   - 字体优化 (display: swap)

---

## 📁 项目结构详解

### 核心目录说明

```
portfolio/
├── app/                    # Next.js App Router 目录
│   ├── layout.tsx          # 全局布局
│   ├── page.tsx            # 首页
│   ├── about/              # 关于页面
│   ├── projects/           # 项目展示
│   │   └── [slug]/         # 动态项目详情
│   ├── research/           # 研究成果
│   ├── blog/               # 技术博客
│   │   └── [slug]/         # 动态博客文章
│   ├── resume/             # 简历中心
│   │   └── [version]/      # 动态简历版本
│   ├── tools/              # 开发工具
│   ├── partners/           # 合作伙伴
│   ├── contact/            # 联系方式
│   └── api/                # API 路由
│       ├── contact/        # 联系表单 API
│       ├── debug/          # 调试 API
│       └── tools/          # 工具 API
│
├── components/             # React 组件
│   ├── atoms/              # 原子组件 (最小单位)
│   │   ├── AnimatedElement.tsx
│   │   └── IconWrapper.tsx
│   ├── molecules/          # 分子组件 (组合原子)
│   │   ├── AnimatedSection.tsx
│   │   ├── ExpandableCard.tsx
│   │   ├── FeatureCard.tsx
│   │   ├── ResponsiveGrid.tsx
│   │   └── Tag.tsx
│   ├── organisms/          # 有机体组件 (复杂功能模块)
│   ├── resume/             # 简历相关组件
│   │   ├── ResumeLayout.tsx
│   │   ├── ResumeHeader.tsx
│   │   ├── ResumeActions.tsx
│   │   ├── EducationSection.tsx
│   │   ├── WorkSection.tsx
│   │   ├── PublicationSection.tsx
│   │   ├── SkillSection.tsx
│   │   ├── HonorSection.tsx
│   │   └── SportsSection.tsx
│   ├── ui/                 # shadcn/ui 基础组件
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── ... (50+ 组件)
│   ├── navbar.tsx          # 导航栏
│   ├── footer.tsx          # 页脚
│   ├── hero-section.tsx    # 首页英雄区
│   ├── project-grid.tsx    # 项目网格
│   ├── contact-form.tsx    # 联系表单
│   ├── blog-card.tsx       # 博客卡片
│   └── ...
│
├── content/                # 网站内容 (Markdown)
│   ├── home/               # 首页内容
│   │   ├── hero.md
│   │   └── latest-updates.md
│   ├── about/              # 关于页面内容
│   │   ├── intro.md
│   │   ├── skills.md
│   │   ├── timeline.md
│   │   ├── sports.md
│   │   └── future.md
│   ├── projects/           # 项目内容
│   │   ├── _index.md
│   │   └── items/
│   │       ├── project-1.md
│   │       └── ...
│   ├── research/           # 研究成果内容
│   │   ├── _index.md
│   │   ├── academic-papers.md
│   │   ├── patents.md
│   │   ├── awards.md
│   │   └── software-copyrights.md
│   ├── blog/               # 博客文章
│   │   └── welcome.md
│   ├── resume/             # 简历内容
│   │   ├── _index.md
│   │   ├── comprehensive.md
│   │   ├── work.md
│   │   ├── academic.md
│   │   └── sports.md
│   ├── resume-materials/   # 简历素材库
│   │   ├── 01-personal-info.md
│   │   ├── 02-education.md
│   │   ├── 03-work-experience.md
│   │   └── ...
│   ├── tools/              # 工具页面内容
│   └── global/             # 全局内容
│       └── navbar.md
│
├── lib/                    # 工具库
│   ├── content.ts          # 内容管理工具
│   ├── utils.ts            # 通用工具函数
│   ├── profile-config.ts   # 个人配置
│   ├── ui-texts.ts         # UI 文本配置
│   ├── seo-config.ts       # SEO 配置
│   ├── analytics.ts        # 分析工具
│   ├── resume-data.ts      # 简历数据模型
│   ├── resume-builder.ts   # 简历构建器
│   └── design-system/      # 设计系统
│       ├── colors.ts
│       ├── typography.ts
│       ├── spacing.ts
│       └── animations.ts
│
├── data/                   # 静态数据
│   └── projects.ts         # 项目数据
│
├── hooks/                  # 自定义 React Hooks
│   ├── use-mobile.tsx      # 移动设备检测
│   └── use-toast.ts        # Toast 提示
│
├── public/                 # 静态资源
│   ├── images/             # 图片资源
│   │   ├── optimized/      # 优化后的图片
│   │   └── compressed-images/ # 压缩图片
│   ├── project/            # 项目图片
│   ├── soft_copyright/     # 软件著作权证书
│   ├── favicon.ico
│   ├── robots.txt
│   └── site.webmanifest
│
├── scripts/                # 构建脚本
│   └── optimize-images.mjs # 图片优化脚本
│
├── styles/                 # 全局样式
│   └── globals.css
│
├── docs/                   # 项目文档
│   ├── ARCHITECTURE.md     # 本文档
│   ├── DEVELOPMENT.md      # 开发指南
│   └── CONTENT_MANAGEMENT.md # 内容管理指南
│
└── 配置文件
    ├── next.config.mjs     # Next.js 配置
    ├── tailwind.config.ts  # Tailwind 配置
    ├── tsconfig.json       # TypeScript 配置
    ├── components.json     # shadcn/ui 配置
    ├── package.json        # 项目依赖
    └── .gitignore          # Git 忽略规则
```

---

## 🔄 路由结构

### 页面路由

```
/                           # 首页
/about                      # 关于页面
/projects                   # 项目列表
/projects/[slug]            # 项目详情 (动态)
/research                   # 研究成果
/blog                       # 博客列表
/blog/[slug]                # 博客文章 (动态)
/resume                     # 简历中心
/resume/[version]           # 简历详情 (动态: comprehensive, work, academic, sports)
/tools                      # 开发工具
/partners                   # 合作伙伴
/contact                    # 联系方式
```

### API 路由

```
/api/contact                # 联系表单提交
/api/debug                  # 环境变量调试
/api/tools/[id]             # 工具执行接口
```

---

## 🧩 组件层次关系

### 组件设计体系

项目采用 **原子化设计 (Atomic Design)** 理念：

```
页面 (Pages)
  ↓
模板 (Templates)
  ↓
有机体 (Organisms) - 复杂功能模块
  ↓
分子 (Molecules) - 组合组件
  ↓
原子 (Atoms) - 基础组件
```

### 具体示例

**首页组件结构**:
```
HomePage (app/page.tsx)
  ├── Navbar (组织级)
  │   ├── Logo
  │   ├── NavigationMenu (分子级)
  │   │   └── Link (原子级)
  │   └── ThemeToggle (原子级)
  ├── HeroSection (组织级)
  │   ├── AnimatedSection (分子级)
  │   │   └── AnimatedElement (原子级)
  │   ├── Button (原子级)
  │   └── Particles (原子级)
  ├── StrengthsSection (组织级)
  │   └── ResponsiveGrid (分子级)
  │       └── FeatureCard (分子级)
  ├── LatestUpdates (组织级)
  │   └── ExpandableCard (分子级)
  └── Footer (组织级)
```

---

## 💾 数据流向

### 1. 静态内容流

```
Markdown 文件 (content/)
  ↓
gray-matter 解析
  ↓
lib/content.ts 处理
  ↓
页面组件获取数据
  ↓
渲染展示
```

### 2. 表单提交流

```
用户填写表单
  ↓
客户端验证 (Zod)
  ↓
API 路由 (/api/contact)
  ↓
服务端验证 (Zod)
  ↓
发送邮件 (Resend)
  ↓
返回结果
```

### 3. 简历生成流

```
简历原始数据 (lib/resume-data.ts)
  ↓
简历构建器 (lib/resume-builder.ts)
  ↓
选择模板 (comprehensive/work/academic/sports)
  ↓
动态页面 (/resume/[version])
  ↓
组装组件渲染
```

---

## 🎨 样式系统

### Tailwind CSS 配置

1. **主题配置** (`tailwind.config.ts`)
   - 自定义颜色系统
   - 字体定义
   - 间距系统
   - 动画效果

2. **CSS 变量** (`app/globals.css`)
   - 支持明暗主题切换
   - 语义化颜色命名

3. **响应式断点**
   ```
   sm: 640px   # 手机横屏
   md: 768px   # 平板
   lg: 1024px  # 桌面
   xl: 1280px  # 大屏
   2xl: 1536px # 超大屏
   ```

### 组件样式规范

- 使用 `cn()` 工具函数合并类名
- 优先使用 Tailwind 原子类
- 复杂动画使用 `@keyframes`
- 打印样式使用 `print:` 前缀

---

## 📦 构建流程

### 开发模式

```bash
pnpm dev
```

1. 启动开发服务器 (端口 3000)
2. 热重载 (HMR)
3. 实时 TypeScript 检查

### 生产构建

```bash
pnpm build
```

1. TypeScript 类型检查
2. Next.js 构建
3. 静态页面生成 (SSG)
4. 代码压缩和优化
5. 生成静态资源

### 部署流程

- **平台**: Vercel
- **触发**: Git push 到 main 分支
- **流程**: 
  1. 自动检测 Next.js 项目
  2. 安装依赖 (pnpm)
  3. 运行构建
  4. 部署到全球 CDN
  5. 自动配置域名和 SSL

---

## 🔧 技术栈总结

### 核心框架

| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js | 15.2.4 | React 框架 |
| React | 19.1.1 | UI 库 |
| TypeScript | 5.x | 类型系统 |

### UI 和样式

| 技术 | 用途 |
|------|------|
| Tailwind CSS | 原子化 CSS 框架 |
| shadcn/ui | UI 组件库 |
| Radix UI | 无样式组件基础 |
| lucide-react | 图标库 |
| next-themes | 主题切换 |

### 数据处理

| 技术 | 用途 |
|------|------|
| gray-matter | Markdown 元数据解析 |
| remark | Markdown 处理 |
| zod | 数据验证 |

### 工具库

| 技术 | 用途 |
|------|------|
| clsx / cn | 类名合并 |
| date-fns | 日期处理 |
| react-hook-form | 表单管理 |

### 第三方服务

| 服务 | 用途 |
|------|------|
| Resend | 邮件发送 |
| Google Analytics | 网站分析 |
| Vercel | 部署托管 |

---

## 🚀 性能优化策略

### 1. 图片优化
- WebP 格式转换
- 响应式图片 (`sizes` 属性)
- 优先加载 (`priority` 属性)
- 懒加载

### 2. 字体优化
- `display: 'swap'` 防止阻塞
- 使用 Next.js 字体优化
- 本地字体托管

### 3. 代码优化
- 代码分割 (自动)
- 动态导入 (懒加载)
- Tree Shaking

### 4. 渲染策略
- 静态生成 (SSG) - 大部分页面
- 服务端渲染 (SSR) - API 路由
- 客户端渲染 (CSR) - 交互组件

### 5. SEO 优化
- 元数据配置
- Sitemap 生成
- Robots.txt
- 结构化数据

---

## 📈 未来扩展方向

### 短期优化
- [ ] 添加单元测试 (Jest + React Testing Library)
- [ ] 集成 E2E 测试 (Playwright)
- [ ] 添加更多动画效果
- [ ] 优化移动端体验

### 中期优化
- [ ] 国际化支持 (i18n)
- [ ] PWA 支持
- [ ] 离线模式
- [ ] 性能监控 (Sentry)

### 长期优化
- [ ] CMS 集成 (Headless CMS)
- [ ] 评论系统
- [ ] 全文搜索 (Algolia)
- [ ] AI 对话助手

---

**文档版本**: v1.0  
**最后更新**: 2025-10-11  
**维护者**: Claude AI Assistant

