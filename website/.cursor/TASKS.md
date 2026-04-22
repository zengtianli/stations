# 网站重构任务清单

## 当前状态

- ✅ 软链接已配置：`content/resume-source/` → 总部简历模块
- ✅ 软链接已配置：`public/archives/` → 总部档案库
- ✅ .cursor 规则已配置
- ⏳ 待清理冗余文件
- ⏳ 待重构组件架构

---

## 立即执行

### 1. 清理冗余

```bash
# 删除已迁移到总部的内容（现在是软链接了）
rm -rf content/resume-materials/  # 如果还存在

# 检查 docs/ 大文件
du -sh docs/*
```

### 2. 查看总部简历结构

```bash
# 了解可用的简历模块
ls content/resume-source/
```

---

## 重构优先级

### P0 - 必须做
1. 实现 `lib/resume-loader.ts` 读取总部简历模块
2. 重构 `/resume` 页面，从软链接读取内容
3. 统一组件目录结构

### P1 - 应该做
4. 实现多版本简历（综合版/售前版）
5. 设计系统统一
6. PDF 导出功能

### P2 - 可以做
7. 博客功能
8. 工具展示页
9. SEO 优化

---

## 关键文件

| 文件 | 作用 |
|------|------|
| `.cursor/PRD.md` | 完整需求文档 |
| `.cursor/rules/website-architecture.mdc` | 架构规范 |
| `.cursor/agents/website_developer.md` | 开发角色定义 |
| `content/resume-source/` | 简历内容（软链接到总部） |
| `public/archives/` | 档案扫描件（软链接到总部） |

---

## 开始重构

在 Cursor 中打开此项目后，可以这样开始：

```
@PRD.md @website_developer.md 
帮我按照 PRD 重构网站，从实现 resume-loader 开始
```

