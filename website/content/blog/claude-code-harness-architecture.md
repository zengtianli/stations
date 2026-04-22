---
title: "如何构建企业级 Claude Code Harness 体系"
date: "2026-04-13"
author: "曾田力"
excerpt: "从 43 个 commands 到 14 个 skills，从 hooks 自动化到 MCP 生态集成——一套完整的 LLM 工具链工程化方法论。"
tags: ["AI", "LLM", "Claude", "开发工具", "自动化"]
published: true
---

## 为什么需要 Harness Engineering

Claude Code 原生是一个强大的 AI 对话工具，但直接使用存在几个问题：

1. **上下文丢失**：每次新会话都从零开始，需要重新解释项目背景
2. **操作重复**：相同的工作流每次手动描述，效率低下
3. **质量不稳定**：没有标准化的流程，输出质量取决于 prompt 质量
4. **知识孤岛**：会话之间的经验无法传递

Harness Engineering 就是解决这些问题的系统化方法——把 AI 对话能力封装为可复用、可管理、可扩展的工程基础设施。

## 架构设计

### 三层体系

```
Commands (43)  → 用户触发的标准化操作
Skills (14)    → 场景感知的智能激活
Hooks          → 生命周期自动化
Memory         → 跨会话持久化记忆
MCP            → 外部系统集成
```

### Commands：标准化操作

Commands 是最直接的交互层。每个 command 是一个 markdown 文件，定义了完整的 prompt、输入输出规范和约束条件。

按领域组织：

- **文档处理** (8)：draft、review、fix-refs、fix-heading、md2word、review-deep、edit-docx、fix-numbering
- **项目管理** (7)：ship、deploy、audit、promote、groom、health、tidy
- **系统工具** (5)：scan、recap、handoff、context、harness

设计原则：
- 单一职责：每个 command 做一件事
- 可组合：groom = pull + audit + fix + review + ship
- 幂等性：重复执行不会产生副作用

### Skills：智能激活

Skills 比 commands 更高级——它们带有触发条件，在匹配场景时自动激活。

```yaml
# 示例：bid skill
name: 标书撰写
trigger: "当处理 ~/Work/bids/ 下的标书项目时"
phases: [解析招标文件, 搭建章节框架, 盘点参考资料, 四阶段写作]
```

关键 skills：
- `context`：项目上下文注入（识别项目类型，加载相关配置）
- `migrate`：Python/Streamlit → Tauri 迁移（自动分析计算逻辑，生成 Rust + React 代码）
- `harness`：配置脚手架生成（根据项目性质自动生成 CLAUDE.md + skills）

### Hooks：生命周期自动化

Hooks 在特定事件触发时自动执行：

- **startup**：检测 HANDOFF.md，自动加载上次会话的上下文
- **session-reflect**：会话结束时分析本次工作，生成摘要，发送 macOS 通知
- **pre-commit**：代码提交前的质量检查

### Memory：跨会话记忆

结构化的记忆系统，分为四种类型：

| 类型 | 用途 | 示例 |
|------|------|------|
| user | 用户画像 | "深度 Go 经验，React 新手" |
| feedback | 行为校准 | "commit+push 一步到位" |
| project | 项目动态 | "merge freeze 3月5日开始" |
| reference | 外部指针 | "pipeline bugs 在 Linear INGEST 项目" |

每条记忆是独立的 md 文件，MEMORY.md 作为索引。系统自动检测过期记忆并清理。

### MCP 集成

通过 Model Context Protocol 连接外部系统：

- **auggie**：Git 仓库的语义搜索（比 grep 更智能）
- **cclog**：512+ 历史会话的搜索与分析
- **gmail**：邮件读写（用于 briefing 系统）

## 工程化实践

### Skill 分发

所有 skills 集中在 cc-configs 仓库管理，通过 sync 机制一键分发到所有项目：

```bash
# 检查所有项目的 skill 配置状态
python3 ~/Dev/devtools/scripts/tools/skill_sync.py status

# 同步到指定项目
python3 ~/Dev/devtools/scripts/tools/skill_sync.py sync hydro-toolkit
```

### 会话管理

cclog MCP 提供完整的会话生命周期管理：

- `search_sessions`：按关键词搜索历史会话
- `get_session_detail`：获取会话完整上下文
- `get_daily_digest`：生成每日工作摘要

### Dashboard 监控

dashboard.tianlizeng.cloud 可视化展示：
- 所有 repo 的 skill 配置状态
- 最近的任务和进度
- 系统健康状况

## 效果

这套体系让我一个人能够：
- 管理 29 个 GitHub 仓库
- 维护 24 个线上服务
- 每天产出高质量的技术文档
- 在水利、DevTools、AI 三个领域并行工作

核心价值不是"会用 AI"，而是"把 AI 做成了生产级工具链"。
