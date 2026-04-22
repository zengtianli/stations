---
title: "开发者工具四件套"
slug: "devtools-suite"
role: "独立开发"
tags: ["CLI", "Python", "Shell", "Raycast", "自动化"]
period: "2024-2026"
category: "开发工具"
highlight: true
featured: false
thumbnail: "/images/projects/placeholder.svg"
brief: "从原 scripts 仓库拆分为 4 个独立 repo（doctools/devtools/mactools/clashx），覆盖文档处理、开发效率、系统管理、网络代理的全链路 CLI 工具集。"
tracks:
  devtools:
    highlight: true
    featured: true
  indie:
    brief: "44 个 CLI 脚本 + 58 个 Raycast wrappers，一个人的全栈效率工具体系。"
    highlight: true
---

## 背景

日常开发中积累了大量自动化脚本，最终从单一 scripts 仓库拆分为 4 个独立项目，每个聚焦一个领域，统一架构、独立演进。

## 四个仓库

### doctools (17 脚本)

文档处理与数据转换：
- Word 文档批处理（标题修复、文献引用角标、编号修复）
- MD/DOCX 互转工作流（套模板 + 文本修复 + 图名居中）
- Excel 数据提取与转换
- LLM 深度审阅（4 维度评审 + Word 批注输出）

### devtools (10 脚本)

开发工具与基础设施：
- repo_manager.py — 29 个仓库的统一管理（audit/promote/sync）
- health_check.py — 系统健康检查
- cf_api.py — Cloudflare API 操作（DNS/Access）
- briefing 系统 — 每日信息汇总自动推送

### mactools (11 脚本)

macOS 日常效率：
- 文件管理（批量重命名、目录整理、downloads 自动归类）
- 系统管理（窗口管理、进程监控、剪贴板增强）

### clashx (6 脚本)

ClashX 代理管理：
- 配置切换、节点测速、规则更新

## 技术架构

- 统一结构：`scripts/category/` + `lib/` + `raycast/commands/`
- Raycast Wrapper：每个 CLI 脚本对应一个 Raycast 快捷命令
- 公共库：共享的 Python 工具函数

## 源代码

- [doctools](https://github.com/zengtianli/doctools)
- [devtools](https://github.com/zengtianli/devtools)
- [mactools](https://github.com/zengtianli/mactools)
- [clashx](https://github.com/zengtianli/clashx)
