# 个人网站重构 PRD

## 项目背景

个人网站需要重构，目标是：
1. 易于维护的组件化架构
2. 内容与代码分离，内容从总部同步
3. 统一的设计系统
4. 减少重复代码

---

## 数据来源

### 已配置的软链接

| 内容 | 源路径 | 网站路径 |
|------|--------|----------|
| 简历素材 | `~/cursor-shared/personal/resume/` | `content/resume-source/` |
| 项目展示 | `~/cursor-shared/personal/projects/` | `content/project-source/` |
| 档案扫描件 | `~/cursor-shared/archives/` | `public/archives/` |

### 简历模块结构（来自总部）

```
content/resume-source/
├── _基础信息/
│   ├── 个人信息.md
│   └── 教育经历.md
├── _技能模块/
│   ├── 水利专业.md
│   ├── 数据科学.md
│   ├── GIS空间.md
│   ├── 软件开发.md
│   └── 语言办公.md
├── _项目模块/
│   ├── 数字孪生/浙东引水.md
│   ├── 水资源规划/承载力评价.md
│   ├── 生态流量/省级生态流量.md
│   └── ...
├── _学术成果/
│   ├── 论文/
│   ├── 专利/
│   └── 软著/
├── _荣誉奖项/荣誉汇总.md
└── _科研经历/
```

**每个项目 .md 包含**：
- frontmatter（title, period, role, keywords, highlight）
- 技术向描述
- 方案向描述

---

## 重构目标

### 1. 组件化架构

```
components/
├── ui/                 # shadcn/ui 基础组件
├── atoms/              # 原子组件
│   ├── Tag.tsx
│   ├── Icon.tsx
│   └── Badge.tsx
├── molecules/          # 分子组件
│   ├── ProjectCard.tsx
│   ├── SkillBar.tsx
│   └── TimelineItem.tsx
├── organisms/          # 有机组件
│   ├── Header.tsx
│   ├── Footer.tsx
│   └── ProjectGrid.tsx
└── templates/          # 页面模板
    ├── ResumeLayout.tsx
    └── ProjectLayout.tsx
```

### 2. 内容渲染机制

**需求**：从 `content/resume-source/` 读取 markdown，渲染到页面。

**实现**：
```typescript
// lib/resume-loader.ts
export async function loadResumeModule(path: string) {
  // 读取 content/resume-source/ 下的 md 文件
  // 解析 frontmatter
  // 返回结构化数据
}
```

### 3. 简历生成器

**需求**：根据不同岗位，动态组合简历模块。

**页面**：`/resume/[version]`
- `/resume/comprehensive` - 综合版
- `/resume/solution` - 售前方案版
- `/resume/algorithm` - 算法研发版

**配置**：
```typescript
// lib/resume-config.ts
export const resumeVersions = {
  comprehensive: {
    name: '综合版',
    projects: ['highlight=true'],
    description: '技术向',
  },
  solution: {
    name: '售前方案版',
    projects: ['highlight=true'],
    description: '方案向',
  },
}
```

### 4. 设计系统

**需求**：统一的视觉风格。

**实现**：
- 使用 Tailwind CSS 变量
- 统一的色彩方案
- 统一的间距和字体

```css
/* 设计 tokens */
:root {
  --color-primary: ...;
  --color-secondary: ...;
  --spacing-unit: 4px;
  --font-heading: ...;
  --font-body: ...;
}
```

---

## 页面结构

### 必须页面

| 页面 | 路径 | 说明 |
|------|------|------|
| 首页 | `/` | 个人介绍 + 亮点项目 |
| 简历 | `/resume` | 简历列表，支持多版本 |
| 项目 | `/projects` | 项目展示 |
| 关于 | `/about` | 详细介绍 |

### 可选页面

| 页面 | 路径 | 说明 |
|------|------|------|
| 博客 | `/blog` | 技术博客 |
| 工具 | `/tools` | 开源工具展示 |
| 联系 | `/contact` | 联系方式 |

---

## 技术要求

### 框架
- Next.js 14+ (App Router)
- React 18+
- TypeScript

### 样式
- Tailwind CSS
- CSS Variables for theming
- shadcn/ui 组件库

### 内容
- MDX for content
- gray-matter for frontmatter parsing
- 从 `content/resume-source/` 读取

### 部署
- Vercel
- 自动部署

---

## 重构步骤

### Phase 1: 清理和准备
- [ ] 删除冗余的 `content/resume-materials/`（已迁移到总部）
- [ ] 清理 `docs/` 中的大文件
- [ ] 更新 .gitignore

### Phase 2: 内容加载器
- [ ] 实现 `lib/resume-loader.ts`
- [ ] 从 `content/resume-source/` 读取模块
- [ ] 解析 frontmatter 和 markdown

### Phase 3: 组件重构
- [ ] 统一组件目录结构
- [ ] 实现原子组件
- [ ] 实现分子组件
- [ ] 实现页面模板

### Phase 4: 简历页面
- [ ] 实现 `/resume` 列表页
- [ ] 实现 `/resume/[version]` 动态页面
- [ ] 支持 PDF 导出

### Phase 5: 设计系统
- [ ] 定义设计 tokens
- [ ] 统一组件样式
- [ ] 响应式适配

---

## 验收标准

1. **内容同步**：修改总部简历模块后，网站自动更新
2. **组件复用**：同一组件在多处使用，无重复代码
3. **多版本简历**：支持按配置生成不同版本简历
4. **PDF 导出**：简历页面可导出为 PDF
5. **响应式**：移动端和桌面端均可正常显示
6. **性能**：Lighthouse 评分 > 90

---

## 注意事项

1. **不要修改总部内容**：网站只负责渲染，内容修改在总部进行
2. **软链接**：`content/resume-source/` 和 `public/archives/` 是软链接，不要删除
3. **组件设计**：优先复用，避免重复造轮子

