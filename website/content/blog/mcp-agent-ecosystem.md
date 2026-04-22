---
title: "MCP 协议实战：从 auggie 到 gmail 的 Agent 生态"
date: "2026-04-12"
author: "曾田力"
excerpt: "3 个 MCP Server、512+ 会话记录、语义搜索——一套真正用起来的 AI Agent 工具生态是怎么搭的。"
tags: ["AI", "Agent", "MCP", "LLM", "Claude"]
published: true
---

## MCP 不只是协议，是生态

Model Context Protocol (MCP) 让 LLM 能调用外部工具，但真正的价值不在协议本身，而在于**围绕它构建的工具生态**。我目前在 Claude Code 中集成了 3 个 MCP Server，它们覆盖了日常工作的三个核心场景。

## 三个 MCP Server

### 1. auggie — 代码库语义搜索

auggie 为 Git 仓库建立语义索引，让 Claude 能用自然语言搜索代码。

**典型用法**：
- "找到处理 cookie 的中间件代码"
- "哪些文件涉及 track 切换逻辑"
- "水资源承载力计算的核心公式在哪"

auggie 的限制是只能索引 Git 仓库（安全策略），不能搜 `~/.personal_env` 等配置文件。这反而是个好设计——敏感信息天然隔离。

### 2. cclog — 会话历史搜索

cclog 是我写的 MCP Server，基于 SQLite 索引 Claude Code 的 512+ 历史会话。

**核心 API**：
- `search_sessions(query)` — 按关键词搜会话
- `get_session_detail(id)` — 拉取完整对话记录
- `get_daily_digest(date)` — 某天做了什么

**为什么需要它**：Claude Code 会话结束后上下文就丢了。cclog 让我能跨会话检索，比如"上周修 deploy.sh 的那次会话具体改了什么"。

### 3. gmail — 邮件读写

node 实现的 Gmail MCP，支持搜索、读取、发送、打标签。配合每日 Briefing 系统，实现自动化信息推送。

## 注册与管理

MCP Server 注册在 `~/.claude.json` 的 `mcpServers` 字段：

```bash
claude mcp add auggie -- auggie --mcp --mcp-auto-workspace
claude mcp add cclog -- python3 ~/Dev/cclog/src/cclog/mcp_server.py
claude mcp list  # 验证
```

**修改后必须重启 CC 会话**，否则新 Server 不会加载。

## Agent 工作流实例

一个典型的跨 MCP 工作流——"检查上周的部署问题"：

1. **cclog**: `search_sessions("deploy 失败")` → 找到相关会话
2. **cclog**: `get_session_detail(id)` → 获取完整对话，发现是 CSS 哈希不匹配
3. **auggie**: `codebase-retrieval("deploy.sh rsync")` → 找到部署脚本
4. 修复后 → **gmail**: 发通知邮件

整个流程 Claude 自主完成，不需要我手动切换工具。

## 经验总结

1. **MCP Server 要小而专**：每个 Server 只做一件事，组合起来才灵活
2. **注册在全局而非项目**：`~/.claude.json` 而不是 `.mcp.json`，这样所有项目都能用
3. **安全边界要清晰**：auggie 不索引非 Git 目录，gmail 走 OAuth 不存密码
4. **失败要优雅**：MCP Server 挂了不应该阻塞整个会话

下一步计划：接入 Cloudflare API 和 VPS 状态监控的 MCP Server，让 Claude 能直接管理基础设施。
