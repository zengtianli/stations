# 开发维护指南

> 项目开发、测试、部署的完整指南

---

## 🎯 黄金法则

> **在推送代码到 GitHub 之前，务必先在本地测试构建！**

这样可以在本地发现并修复问题，避免 Vercel 部署失败。

---

## 🚀 快速开始

### 环境要求

- **Node.js**: >= 18.x
- **包管理器**: pnpm (推荐) 或 npm
- **Git**: 最新版本

### 初始化项目

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
```

访问 `http://localhost:3000` 查看网站。

---

## 🛠️ 开发流程

### 标准开发流程（重要！）

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 安装依赖（如果有更新）
pnpm install

# 3. 启动开发服务器
pnpm dev

# 4. 进行修改...
# 在 VSCode 或其他编辑器中修改代码

# 5. 测试构建（关键步骤！）
pnpm run build

# 6. 如果构建成功，提交代码
git add -A
git commit -m "feat: 描述你的修改"

# 7. 推送到 GitHub
git push origin main
```

### 开发服务器

```bash
# 启动开发服务器（端口 3000）
pnpm dev

# 启动并指定端口
pnpm dev -- -p 3001
```

**开发服务器特点**:
- ✅ 热重载 (HMR) - 修改代码自动刷新
- ✅ 快速刷新 (Fast Refresh) - 保持组件状态
- ✅ TypeScript 错误提示
- ✅ Linter 错误提示

---

## 🧪 测试与构建

### 本地构建测试

**在每次推送前必须运行**:

```bash
# 构建生产版本
pnpm run build
```

**构建成功的标志**:
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (24/24)
✓ Finalizing page optimization

Route (app)                Size  First Load JS
┌ ○ /                      5.12 kB         132 kB
├ ○ /about                 7.97 kB         135 kB
...
```

**构建失败的处理**:
1. 仔细阅读错误信息
2. 定位到错误的文件和行号
3. 修复问题
4. 再次运行 `pnpm run build`
5. 重复直到构建成功

### 预览生产版本

```bash
# 先构建
pnpm run build

# 启动生产服务器
pnpm start
```

访问 `http://localhost:3000` 查看生产版本。

### 类型检查

```bash
# TypeScript 类型检查
pnpm run type-check  # 如果配置了该命令
```

或者在 VSCode 中查看红色波浪线提示。

### Linter 检查

```bash
# 检查代码风格
pnpm run lint

# 自动修复部分问题
pnpm run lint:fix  # 如果配置了该命令
```

---

## 🐛 常见构建错误及解决方案

### 错误 1: 语法错误

**症状**:
```
Error: Expected ',', got '体育之星'
    at /lib/resume-data.ts:609:1
```

**原因**: 中文引号与 JavaScript 字符串引号冲突

**解决**:
```typescript
// ❌ 错误
zh: "浙江省水利厅"体育之星""

// ✅ 正确 - 使用单引号包裹含有双引号的字符串
zh: '浙江省水利厅"体育之星"'
```

---

### 错误 2: 服务器组件事件处理器

**症状**:
```
Error: Event handlers cannot be passed to Client Component props.
  {className: ..., ref: undefined, onClick: function c, children: ...}
```

**原因**: 服务器组件中使用了 `onClick` 等事件处理器

**解决**: 将交互部分拆分为客户端组件

```typescript
// 在文件顶部添加
'use client'

export default function MyComponent() {
  const handleClick = () => {
    console.log('clicked')
  }
  
  return <button onClick={handleClick}>Click</button>
}
```

---

### 错误 3: 数据结构不匹配

**症状**:
```
TypeError: Cannot read properties of undefined (reading 'map')
    at page.tsx:23:15
```

**原因**: 组件期望的数据结构与实际数据不匹配

**解决**:
1. 检查组件代码，确认期望的数据格式
2. 确保 Markdown 文件的数据结构匹配
3. 添加数据验证和默认值

```typescript
// ✅ 使用可选链和默认值
{data.items?.map((item) => (
  <div key={item.id}>{item.title}</div>
)) ?? <p>暂无数据</p>}
```

---

### 错误 4: TypeScript 类型错误

**症状**:
```
Type 'string' is not assignable to type 'number'.
```

**解决**: 修正类型定义或进行类型转换

```typescript
// ❌ 错误
const year: number = "2024"

// ✅ 正确
const year: number = 2024
// 或
const year: number = parseInt("2024", 10)
```

---

### 错误 5: 模块导入错误

**症状**:
```
Module not found: Can't resolve '@/components/MyComponent'
```

**解决**:
1. 检查文件路径是否正确
2. 检查文件是否存在
3. 检查 `tsconfig.json` 中的路径别名配置

---

### 错误 6: 环境变量未定义

**症状**:
```
Error: Missing API key
```

**解决**:
1. 检查 `.env.local` 文件是否存在
2. 确认环境变量名称正确
3. 重启开发服务器

---

## 🔧 环境变量配置

### 本地开发配置

创建 `.env.local` 文件:

```bash
# Resend API (联系表单)
RESEND_API_KEY=re_xxxxxxxxxxxxx
CONTACT_EMAIL=zengtianli1@gmail.com

# Google Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# 代理配置（如需要）
http_proxy=http://127.0.0.1:7890
https_proxy=http://127.0.0.1:7890
```

### Shell 环境变量 (可选)

编辑 `~/.zshrc` 或 `~/env.zsh`:

```bash
# 项目相关环境变量
export RESEND_API_KEY=re_xxxxxxxxxxxxx
export CONTACT_EMAIL=zengtianli1@gmail.com
```

重新加载配置:
```bash
source ~/.zshrc
```

### Vercel 生产环境配置

1. 访问 Vercel Dashboard
2. 选择项目 → Settings → Environment Variables
3. 添加环境变量:
   - `RESEND_API_KEY`
   - `CONTACT_EMAIL`
   - `NEXT_PUBLIC_GA_ID`
4. 选择环境: Production / Preview / Development
5. 保存并重新部署

**验证配置**:
访问 `https://你的域名/api/debug` 查看环境变量是否正确加载。

---

## 📝 Git 工作流

### 提交规范

使用语义化提交信息:

```bash
# 功能开发
git commit -m "feat: 添加博客文章列表页面"

# 问题修复
git commit -m "fix: 修复移动端导航栏显示问题"

# 文档更新
git commit -m "docs: 更新开发指南文档"

# 样式调整
git commit -m "style: 优化项目卡片间距"

# 重构代码
git commit -m "refactor: 重构简历数据结构"

# 性能优化
git commit -m "perf: 优化图片加载性能"

# 测试相关
git commit -m "test: 添加联系表单单元测试"

# 构建配置
git commit -m "chore: 更新依赖版本"
```

### 常用 Git 命令

```bash
# 查看修改状态
git status

# 查看具体修改
git diff

# 查看某个文件的修改
git diff path/to/file

# 添加文件到暂存区
git add <file>
git add -A  # 添加所有修改

# 提交
git commit -m "提交信息"

# 推送到远程
git push origin main

# 拉取最新代码
git pull origin main

# 查看提交历史
git log
git log --oneline  # 简洁模式

# 撤销未提交的修改
git checkout -- <file>
git restore <file>  # 新版本 Git

# 撤销已添加到暂存区的文件
git reset HEAD <file>
git restore --staged <file>  # 新版本 Git

# 撤销最后一次提交（保留修改）
git reset --soft HEAD~1

# 撤销最后一次提交（丢弃修改）
git reset --hard HEAD~1  # ⚠️ 危险操作！
```

### 分支管理

```bash
# 查看分支
git branch

# 创建并切换到新分支
git checkout -b feature/new-feature
git switch -c feature/new-feature  # 新版本 Git

# 切换分支
git checkout main
git switch main  # 新版本 Git

# 合并分支
git checkout main
git merge feature/new-feature

# 删除分支
git branch -d feature/new-feature
```

---

## 🚢 部署流程

### Vercel 自动部署

项目配置了 Vercel 自动部署：

1. **触发条件**: Push 到 `main` 分支
2. **构建命令**: `pnpm run build`
3. **输出目录**: `.next`
4. **部署时间**: 约 1-2 分钟

**部署状态查看**:
- Vercel Dashboard: https://vercel.com/dashboard
- GitHub Checks: 在 Pull Request 或 Commit 页面查看

### 部署前检查清单

在推送代码前，确认：

- [ ] ✅ 代码没有语法错误
- [ ] ✅ `pnpm run build` 构建成功
- [ ] ✅ 本地开发服务器正常运行
- [ ] ✅ 页面显示正确，无样式错乱
- [ ] ✅ 没有控制台错误（F12 打开开发者工具查看）
- [ ] ✅ TypeScript 类型检查通过
- [ ] ✅ 所有新增功能已测试
- [ ] ✅ 图片正常加载
- [ ] ✅ 链接跳转正常
- [ ] ✅ 移动端显示正常（使用响应式设计模式测试）

### 部署失败处理

**查看部署日志**:
1. 访问 Vercel Dashboard
2. 找到失败的部署
3. 点击查看详细日志
4. 定位错误原因

**常见部署失败原因**:
- 构建错误（语法错误、类型错误）
- 环境变量未配置
- 依赖包版本冲突
- 内存不足（大型项目）

**回滚到上一个版本**:
1. 在 Vercel Dashboard 找到上一个成功的部署
2. 点击 "Promote to Production"
3. 或者在本地回滚代码后重新推送

---

## 🗂️ 项目维护

### 依赖更新

```bash
# 查看过期依赖
pnpm outdated

# 更新所有依赖到最新版本（谨慎使用）
pnpm update

# 更新特定依赖
pnpm update next react react-dom

# 更新到指定版本
pnpm add next@latest
```

### 清理缓存

```bash
# 清理 Next.js 缓存
rm -rf .next

# 清理 node_modules
rm -rf node_modules
pnpm install

# 清理所有（完全重置）
rm -rf .next node_modules pnpm-lock.yaml
pnpm install
```

### 数据库备份（如有）

目前项目是静态网站，无数据库。未来如添加数据库，记得定期备份。

---

## 📋 开发最佳实践

### ✅ 应该做的

1. **始终先在本地测试构建** - 避免部署失败
2. **修改数据文件前先查看组件代码** - 确保数据结构匹配
3. **一次只修改一个功能** - 便于调试和回滚
4. **写清晰的 commit 信息** - 方便追溯历史
5. **遇到错误先仔细阅读错误信息** - 90% 的错误信息都有明确提示
6. **保存重要文件的备份** - 尤其是配置文件
7. **使用 TypeScript 类型** - 利用类型系统避免错误
8. **及时提交代码** - 不要积累太多修改
9. **使用 VSCode 的 TypeScript 检查** - 实时发现问题
10. **测试移动端显示** - 使用浏览器开发者工具

### ❌ 不应该做的

1. **不要直接修改就推送** - 必须先本地构建测试
2. **不要随意改变数据结构** - 可能导致页面崩溃
3. **不要忽略构建错误** - 解决后再推送
4. **不要在服务器组件中使用事件处理器** - 使用客户端组件
5. **不要使用中文引号包裹含有中文引号的字符串** - 使用单引号
6. **不要提交敏感信息** - 使用 .env.local 和 .gitignore
7. **不要强制推送到 main 分支** - 除非确实需要
8. **不要修改 node_modules** - 所有修改都会丢失
9. **不要忽略 TypeScript 错误** - 运行时可能出问题
10. **不要在生产环境测试** - 使用本地或 Preview 部署

---

## 🆘 故障排查

### 开发服务器无法启动

**可能原因**:
- 端口被占用
- Node.js 版本不兼容
- 依赖未安装

**解决**:
```bash
# 杀掉占用端口的进程
lsof -ti:3000 | xargs kill -9

# 检查 Node.js 版本
node -v  # 应该 >= 18

# 重新安装依赖
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### 页面显示异常

**排查步骤**:
1. 打开浏览器开发者工具 (F12)
2. 查看 Console 是否有错误
3. 查看 Network 标签页，检查资源加载情况
4. 清除浏览器缓存并刷新
5. 检查 CSS 是否正确加载

### 图片不显示

**可能原因**:
- 图片路径错误
- 图片文件不存在
- `next.config.mjs` 配置问题

**解决**:
1. 检查图片路径是否以 `/` 开头
2. 确认图片在 `public/` 目录下
3. 检查图片文件名大小写是否匹配

---

## 📚 相关资源

### 官方文档

- [Next.js 文档](https://nextjs.org/docs)
- [React 文档](https://react.dev)
- [TypeScript 手册](https://www.typescriptlang.org/docs/)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [shadcn/ui 文档](https://ui.shadcn.com)

### 学习资源

- [Next.js 教程](https://nextjs.org/learn)
- [React 教程](https://react.dev/learn)
- [TypeScript for Beginners](https://www.typescriptlang.org/docs/handbook/typescript-from-scratch.html)
- [Git 教程](https://git-scm.com/book/zh/v2)

### 工具推荐

- **编辑器**: VSCode
- **浏览器**: Chrome / Edge (开发者工具)
- **API 测试**: Postman / Thunder Client
- **Git GUI**: GitHub Desktop / SourceTree

---

## 🎓 开发技巧

### VSCode 快捷键

```
Cmd/Ctrl + P      # 快速打开文件
Cmd/Ctrl + Shift + P  # 命令面板
Cmd/Ctrl + `      # 打开终端
Cmd/Ctrl + B      # 切换侧边栏
Cmd/Ctrl + /      # 注释/取消注释
Alt + ↑/↓         # 移动行
Shift + Alt + ↑/↓ # 复制行
Cmd/Ctrl + D      # 选中下一个相同单词
```

### 浏览器开发者工具

```
F12 / Cmd+Option+I  # 打开开发者工具
Cmd/Ctrl + Shift + M  # 切换设备模拟
Cmd/Ctrl + Shift + C  # 选择元素
Cmd/Ctrl + R          # 刷新页面
Cmd/Ctrl + Shift + R  # 强制刷新（清除缓存）
```

---

## 📞 获取帮助

### 遇到问题时

1. **查看本文档** - 大部分问题都有解答
2. **查看错误信息** - 仔细阅读，通常有明确提示
3. **搜索错误信息** - Google / Stack Overflow
4. **查看官方文档** - Next.js / React 文档
5. **询问 AI** - ChatGPT / Claude
6. **查看 GitHub Issues** - 看看是否有人遇到过同样问题

---

**文档版本**: v1.0  
**最后更新**: 2025-10-11  
**维护者**: Claude AI Assistant

