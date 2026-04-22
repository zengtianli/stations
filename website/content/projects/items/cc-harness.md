---
title: "Claude Code Harness 体系"
slug: "cc-harness"
role: "独立设计与开发"
tags: ["Claude Code", "LLM", "AI Agent", "MCP", "Prompt Engineering"]
period: "2025-2026"
category: "AI 工程"
highlight: true
featured: true
thumbnail: "/images/projects/placeholder.svg"
brief: "企业级 LLM 工具链架构——43 个 commands、14 个 skills、完整的 hooks/memory/MCP 生态，将 Claude Code 从对话工具升级为生产级开发基础设施。"
tracks:
  ai:
    highlight: true
    featured: true
  devtools:
    brief: "Claude Code 的 harness engineering 实践——skill 分发、hooks 自动化、session 管理的工具链设计。"
    highlight: true
    featured: true
  indie:
    brief: "一个人用 AI 工具链替代团队——从文档生成到代码审查，全自动化。"
    highlight: true
---

## 背景

Claude Code 是 Anthropic 的 CLI 开发工具。原生功能强大但缺乏系统化的工程架构。本项目在其基础上构建了一套完整的 harness 体系，将 AI 对话能力转化为可复用、可管理、可扩展的工程基础设施。

## 核心架构

### Commands (43 个)

覆盖日常开发全流程的 slash commands，按领域组织：
- **文档处理**：draft、review、fix-refs、fix-heading、md2word
- **项目管理**：ship、deploy、audit、promote、groom
- **数据准备**：prep-basic-info、prep-engineering
- **水利专业**：eco-flow、capacity、water-quality、zdys
- **系统工具**：tidy、health、scan、recap、handoff

### Skills (14 个)

带有触发条件的智能 skill，在匹配场景时自动激活：
- `context` — 项目上下文与架构注入
- `bid` — 标书四阶段写作管线
- `migrate` — Python/Streamlit 到 Tauri 迁移
- `harness` — 配置脚手架自动生成

### Hooks

Git 和会话生命周期的自动化：
- **pre-commit**: 代码质量检查
- **session-reflect**: 会话结束时自动分析 + macOS 通知
- **startup**: HANDOFF.md 自动加载

### Memory 体系

结构化记忆系统，跨会话持久化：
- user / feedback / project / reference 四种类型
- MEMORY.md 索引 + 独立 md 文件存储
- 自动更新、去重、过期清理

### MCP 生态

- **auggie**: Git 仓库语义搜索
- **cclog**: 512+ 会话历史搜索与分析
- **gmail**: 邮件读写集成

## 技术亮点

- **Skill 分发**: cc-configs 仓库统一管理，一键同步到所有项目
- **Session 管理**: cclog MCP 提供会话搜索、日度摘要、任务追踪
- **Dashboard**: 可视化监控所有 repo 的 skill 配置状态

## 源代码

- [cc-configs](https://github.com/zengtianli/cc-configs) — Skill 配置仓库
- [cclog](https://github.com/zengtianli/cclog) — 会话日志 MCP
- [devtools](https://github.com/zengtianli/devtools) — 开发工具集
