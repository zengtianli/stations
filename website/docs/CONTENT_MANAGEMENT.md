# 内容管理指南

> 如何添加、修改和管理网站内容

---

## 📖 内容管理概述

本网站采用 **内容与代码分离** 的架构，所有文字内容都存储在 `content/` 目录的 Markdown 文件中。

### 为什么使用 Markdown？

- ✅ **简单易学** - 比 HTML 简单，比 Word 更轻量
- ✅ **版本控制** - 方便追踪内容变更历史
- ✅ **纯文本** - 任何文本编辑器都能编辑
- ✅ **跨平台** - 支持所有操作系统
- ✅ **专注内容** - 不需要关心样式细节

---

## 📁 内容目录结构

```
content/
├── home/                   # 首页内容
│   ├── hero.md             # 英雄区介绍
│   └── latest-updates.md   # 最新动态
│
├── about/                  # 关于页面
│   ├── intro.md            # 个人介绍
│   ├── skills.md           # 技能清单
│   ├── timeline.md         # 时间线（教育/工作经历）
│   ├── sports.md           # 体育成就
│   └── future.md           # 未来展望
│
├── projects/               # 项目展示
│   ├── _index.md           # 项目页面介绍
│   └── items/              # 具体项目
│       ├── project-1.md
│       ├── project-2.md
│       └── ...
│
├── research/               # 研究成果
│   ├── _index.md           # 研究页面介绍
│   ├── academic-papers.md  # 学术论文
│   ├── patents.md          # 专利
│   ├── awards.md           # 获奖情况
│   └── software-copyrights.md # 软件著作权
│
├── blog/                   # 博客文章
│   ├── article-1.md
│   ├── article-2.md
│   └── ...
│
├── resume/                 # 简历内容
│   ├── _index.md           # 简历中心介绍
│   ├── comprehensive.md    # 综合简历
│   ├── work.md             # 工作导向简历
│   ├── academic.md         # 学术导向简历
│   └── sports.md           # 体育导向简历
│
├── resume-materials/       # 简历素材库
│   ├── 01-personal-info.md
│   ├── 02-education.md
│   └── ...
│
├── tools/                  # 工具页面
│   ├── _index.md
│   ├── neovim.md
│   ├── zsh.md
│   └── execute.md
│
└── global/                 # 全局内容
    └── navbar.md           # 导航栏配置
```

---

## ✍️ Markdown 基础语法

### 标题

```markdown
# 一级标题
## 二级标题
### 三级标题
#### 四级标题
```

### 文本样式

```markdown
**粗体文本**
*斜体文本*
~~删除线~~
`代码`
```

### 列表

```markdown
# 无序列表
- 项目 1
- 项目 2
  - 子项目 2.1
  - 子项目 2.2

# 有序列表
1. 第一项
2. 第二项
3. 第三项
```

### 链接和图片

```markdown
# 链接
[链接文字](https://example.com)

# 图片
![图片描述](/images/photo.jpg)
```

### 引用

```markdown
> 这是一段引用文字
> 可以多行
```

### 代码块

````markdown
```javascript
const greeting = "Hello, World!"
console.log(greeting)
```
````

### 表格

```markdown
| 列1 | 列2 | 列3 |
|-----|-----|-----|
| 数据1 | 数据2 | 数据3 |
| 数据4 | 数据5 | 数据6 |
```

---

## 📝 添加博客文章

### 1. 创建新文章文件

在 `content/blog/` 目录下创建新文件，文件名使用 kebab-case（短横线分隔）：

```bash
content/blog/my-new-article.md
```

### 2. 添加 Front Matter

在文件开头添加元数据（用 `---` 包裹）：

```markdown
---
title: "我的新文章标题"
date: "2025-10-11"
author: "曾田力"
excerpt: "这是文章的简短摘要，会显示在列表页面"
tags: ["Next.js", "React", "Web开发"]
image: "/images/blog/article-cover.jpg"
published: true
---

# 文章正文从这里开始

这是文章的第一段内容...
```

### 3. 编写文章内容

使用 Markdown 语法编写文章：

```markdown
## 章节标题

这是段落内容。可以包含**粗体**和*斜体*文字。

### 子章节

- 列表项 1
- 列表项 2

```code
代码示例
```

![图片](/images/example.jpg)
```

### 4. 添加文章图片

将图片放到 `public/images/blog/` 目录：

```
public/images/blog/
├── article-1-cover.jpg
├── article-1-diagram.png
└── article-2-screenshot.jpg
```

在文章中引用：

```markdown
![文章配图](/images/blog/article-1-diagram.png)
```

### 5. 预览和发布

```bash
# 启动开发服务器
pnpm dev

# 访问博客页面
http://localhost:3000/blog

# 查看新文章
http://localhost:3000/blog/my-new-article
```

### Front Matter 字段说明

| 字段 | 必填 | 说明 | 示例 |
|------|------|------|------|
| `title` | ✅ | 文章标题 | "Next.js 性能优化指南" |
| `date` | ✅ | 发布日期 | "2025-10-11" |
| `author` | ❌ | 作者 | "曾田力" |
| `excerpt` | ✅ | 摘要 | "本文介绍 Next.js 的性能优化技巧" |
| `tags` | ❌ | 标签 | ["Next.js", "性能优化"] |
| `image` | ❌ | 封面图 | "/images/blog/cover.jpg" |
| `published` | ❌ | 是否发布 | true / false |

---

## 🚀 添加项目案例

### 1. 创建项目文件

在 `content/projects/items/` 目录下创建新文件：

```bash
content/projects/items/my-awesome-project.md
```

### 2. 添加项目元数据

```markdown
---
title: "我的新项目"
slug: "my-awesome-project"
description: "项目简短描述"
image: "/images/projects/my-project.jpg"
tags: ["Python", "Machine Learning", "Data Analysis"]
date: "2025-10-11"
status: "completed"  # 或 "in-progress"
featured: true
---

## 项目概述

详细描述项目背景和目标...

## 技术栈

- Python 3.9
- TensorFlow 2.0
- PostgreSQL

## 主要功能

1. 功能一
2. 功能二
3. 功能三

## 项目成果

- 成果指标 1
- 成果指标 2

## 相关链接

- [项目演示](https://demo.example.com)
- [GitHub 仓库](https://github.com/username/repo)
```

### 3. 添加项目图片

```
public/images/projects/
├── my-project-main.jpg      # 主图
├── my-project-screenshot1.jpg
└── my-project-diagram.png
```

推荐图片尺寸：
- 主图：1200x800px (3:2 比例)
- 截图：任意，但保持清晰

### 4. 更新项目数据

如果需要在项目列表页显示，同时更新 `data/projects.ts`：

```typescript
export const projects = [
  // ... 现有项目
  {
    id: "my-awesome-project",
    title: "我的新项目",
    description: "项目简短描述",
    image: "/images/projects/my-project.jpg",
    tags: ["Python", "Machine Learning"],
    link: "/projects/my-awesome-project",
    featured: true,
  },
]
```

---

## 📊 更新研究成果

### 添加学术论文

编辑 `content/research/academic-papers.md`：

```yaml
papers:
  - title: "论文标题"
    authors: "作者1, 作者2, 作者3"
    journal: "期刊名称"
    year: "2025"
    volume: "45"
    issue: "3"
    pages: "123-145"
    doi: "10.1234/example.2025.123"
    role: "第一作者"
    status: "published"
    keywords: ["关键词1", "关键词2", "关键词3"]
    impact_factor: "5.2"
    citation_count: 15
    link: "https://doi.org/10.1234/example.2025.123"
    pdf: "/papers/my-paper.pdf"
    significance: "论文的重要意义和贡献"
```

### 添加专利

编辑 `content/research/patents.md`：

```yaml
patents:
  - title: "专利名称"
    patent_number: "ZL202410123456.7"
    inventors: "曾田力, 发明人2"
    applicant: "申请人单位"
    filing_date: "2024-03-15"
    grant_date: "2025-06-20"
    status: "授权"
    type: "发明专利"
    abstract: "专利摘要描述"
    application_field: "应用领域"
```

### 添加获奖情况

编辑 `content/research/awards.md`：

```yaml
items:
  - title: "奖项名称"
    year: "2025"
    organization: "颁发机构"
    level: "国家级"
    rank: "一等奖"
    note: "补充说明"
```

### 添加软件著作权

编辑 `content/research/software-copyrights.md`：

```yaml
copyrights:
  - name: "软件名称"
    registration_number: "2024SR1234567"
    owner: "著作权人"
    registration_date: "2024-08-15"
    version: "V1.0"
    category: "应用软件"
    certificate_pdf: "/certificates/software-copyright-001.pdf"
```

---

## 👤 更新个人信息

### 修改首页介绍

编辑 `content/home/hero.md`：

```yaml
name: "曾田力"
title: "水利工程博士 | 全栈开发者"
subtitle: "专注于水利信息化与智能决策系统开发"
description: |
  具有水利工程和计算机科学交叉背景，
  致力于用技术解决水资源管理问题。
  
cta_primary:
  text: "查看项目"
  link: "/projects"
  
cta_secondary:
  text: "联系我"
  link: "/contact"
```

### 修改关于页面

编辑 `content/about/intro.md`：

```markdown
---
name: "曾田力"
title: "水利工程博士"
bio: |
  简短的自我介绍...
---

## 个人简介

详细的个人介绍内容...

## 研究方向

- 方向 1
- 方向 2
```

### 更新技能清单

编辑 `content/about/skills.md`：

```yaml
categories:
  - name: "编程语言"
    skills:
      - name: "Python"
        level: "精通"
        years: 5
        description: "数据分析、Web开发、机器学习"
        projects: ["项目1", "项目2"]
      
      - name: "JavaScript/TypeScript"
        level: "熟练"
        years: 3
        description: "前端开发、Node.js"
```

### 更新时间线

编辑 `content/about/timeline.md`：

```yaml
timeline:
  - period: "2020 - 至今"
    title: "职位/学位"
    organization: "单位/学校"
    location: "地点"
    type: "work"  # 或 "education"
    description: |
      工作内容描述...
    achievements:
      - "成就1"
      - "成就2"
    technologies: ["技术1", "技术2"]
```

---

## 📄 更新简历

### 简历系统说明

项目采用 **模块化简历系统**：

- **素材库**: `content/resume-materials/` - 存储所有简历原始数据
- **数据模型**: `lib/resume-data.ts` - 结构化的简历数据
- **构建器**: `lib/resume-builder.ts` - 根据模板组装简历
- **展示组件**: `components/resume/` - 简历各部分的显示组件

### 更新简历数据

编辑 `lib/resume-data.ts`：

```typescript
// 个人信息
export const personalInfo: PersonalInfo = {
  name: { zh: "曾田力", en: "Zeng Tianli" },
  email: "zengtianli1@gmail.com",
  phone: "+86 138-xxxx-xxxx",
  // ...
}

// 教育经历
export const education: Education[] = [
  {
    id: "edu-1",
    degree: { zh: "博士", en: "Ph.D." },
    major: { zh: "水利工程", en: "Hydraulic Engineering" },
    institution: { zh: "浙江大学", en: "Zhejiang University" },
    // ...
  },
]

// 工作经历
export const workExperience: WorkExperience[] = [
  {
    id: "work-1",
    position: { zh: "全栈开发工程师", en: "Full Stack Developer" },
    company: { zh: "公司名称", en: "Company Name" },
    // ...
  },
]
```

### 创建新简历模板

编辑 `lib/resume-builder.ts`：

```typescript
export function getAllTemplates(): ResumeTemplate[] {
  return [
    // ... 现有模板
    {
      id: "custom",
      name: { zh: "自定义简历", en: "Custom Resume" },
      description: { zh: "根据特定需求定制", en: "Customized for specific needs" },
      icon: "FileText",
      modules: [
        { type: "personalInfo", required: true },
        { type: "education", required: true },
        { type: "workExperience", required: true },
        // 选择要包含的模块
      ],
    },
  ]
}
```

---

## 🖼️ 管理图片资源

### 图片命名规范

使用 **kebab-case**（短横线分隔）：

```
✅ 好的命名
water-network-system.jpg
project-screenshot-01.png
profile-photo-2024.jpg

❌ 不好的命名
水网系统.jpg (中文)
ProjectScreenshot.png (驼峰)
IMG_1234.jpg (无意义)
```

### 图片存放位置

```
public/images/
├── profile/           # 个人照片
├── projects/          # 项目图片
├── blog/              # 博客配图
├── research/          # 研究成果图片
├── optimized/         # 优化后的图片
└── compressed-images/ # 压缩图片
```

### 图片优化

在添加图片前，建议先优化：

```bash
# 使用项目提供的脚本
node scripts/optimize-images.mjs

# 或使用在线工具
# - TinyPNG: https://tinypng.com
# - Squoosh: https://squoosh.app
```

**推荐图片格式**：
- WebP（推荐）- 体积小，质量好
- JPEG - 照片
- PNG - 需要透明背景

**推荐图片尺寸**：
- 头像：400x400px
- 项目封面：1200x800px
- 博客配图：800x600px
- 缩略图：400x300px

### 在内容中引用图片

```markdown
# 相对路径（推荐）
![项目截图](/images/projects/screenshot.jpg)

# 外部链接
![外部图片](https://example.com/image.jpg)

# 带标题
![项目截图](/images/projects/screenshot.jpg "项目主界面")
```

---

## 🔍 SEO 优化

### 页面元数据

每个内容文件都应该包含 SEO 相关的元数据：

```yaml
---
title: "页面标题 - 不超过60字符"
description: "页面描述，不超过160字符，包含关键词"
keywords: ["关键词1", "关键词2", "关键词3"]
author: "曾田力"
og_image: "/images/og-image.jpg"  # Open Graph 图片
---
```

### 编写 SEO 友好的内容

1. **使用清晰的标题层次**
   ```markdown
   # H1 - 页面主标题（每页只有一个）
   ## H2 - 主要章节
   ### H3 - 子章节
   ```

2. **添加替代文本 (Alt Text)**
   ```markdown
   ![项目架构图](/images/architecture.jpg)
   # 好的 alt text: 描述性强，包含关键词
   ```

3. **使用内部链接**
   ```markdown
   详见[项目详情页](/projects/water-system)
   ```

4. **控制内容长度**
   - 博客文章：800-2000 字
   - 项目介绍：300-800 字

---

## ✅ 内容发布检查清单

在发布新内容前，检查：

### 文本内容
- [ ] 标题清晰准确
- [ ] 没有错别字
- [ ] 语句通顺
- [ ] 格式正确（标题层次、列表等）
- [ ] Front Matter 完整

### 图片
- [ ] 图片已优化（文件大小合理）
- [ ] 图片路径正确
- [ ] Alt text 已添加
- [ ] 图片清晰可见

### 链接
- [ ] 所有链接有效
- [ ] 内部链接使用相对路径
- [ ] 外部链接在新标签打开

### SEO
- [ ] 标题包含关键词
- [ ] 描述简洁有力
- [ ] URL 简短易读

### 测试
- [ ] 本地预览正常
- [ ] 移动端显示正常
- [ ] 构建测试通过 (`pnpm run build`)

---

## 🔧 常见问题

### Q: Markdown 文件修改后页面没有更新？

**A**: 重启开发服务器：
```bash
# 按 Ctrl+C 停止
# 重新启动
pnpm dev
```

### Q: 图片显示不出来？

**A**: 检查：
1. 图片路径是否正确（必须以 `/` 开头）
2. 图片文件是否在 `public/` 目录下
3. 文件名大小写是否匹配

### Q: 如何批量修改内容？

**A**: 使用文本编辑器的查找替换功能：
- VSCode: Cmd/Ctrl + Shift + F
- 可以跨文件批量替换

### Q: 内容太长，如何分页？

**A**: 目前不支持分页，建议：
1. 将长内容拆分成多篇文章
2. 使用折叠组件（`<details>` 标签）
3. 添加目录导航

---

## 📚 参考资源

### Markdown 学习

- [Markdown 官方教程](https://www.markdownguide.org)
- [Markdown 速查表](https://www.markdownguide.org/cheat-sheet/)
- [GitHub Flavored Markdown](https://github.github.com/gfm/)

### YAML 学习

- [YAML 官方文档](https://yaml.org)
- [YAML 教程](https://www.runoob.com/w3cnote/yaml-intro.html)

### 内容写作

- [写作风格指南](https://developers.google.com/style)
- [技术写作最佳实践](https://www.writethedocs.org/guide/)

---

**文档版本**: v1.0  
**最后更新**: 2025-10-11  
**维护者**: Claude AI Assistant

