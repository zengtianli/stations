---
title: "每日 Briefing 自动推送系统"
slug: "briefing-system"
role: "独立开发"
tags: ["自动化", "Python", "Gmail", "VPS", "cron"]
period: "2026"
category: "自动化"
highlight: true
featured: false
thumbnail: "/images/projects/placeholder.svg"
brief: "Mac 本地收集 + VPS 渲染 + Gmail 推送的每日信息汇总系统，自动整合天气、日历、任务、Git 活动等信息。"
tracks:
  ai:
    brief: "LLM 驱动的每日信息汇总——自动收集、智能摘要、定时推送。"
    highlight: false
  devtools:
    highlight: true
  indie:
    brief: "个人效率基础设施——每天早上收到一封定制化的工作日报。"
    highlight: false
---

## 背景

每天早上需要了解当天的日程、待办、天气、项目动态等信息。手动查看多个来源效率低下，于是构建了一套全自动的 briefing 系统。

## 架构

```
Mac (cron) → 收集本地数据 → SSH 推送到 VPS
VPS (cron) → 渲染 HTML 模板 → Gmail API 发送
```

### 数据源

- 系统日历事件
- Claude Code 会话摘要（cclog MCP）
- Git 仓库活动（最近 commits）
- 天气预报（API）
- 待办事项（Apple Reminders）

### 渲染与推送

- Jinja2 HTML 模板，响应式邮件格式
- Gmail API 发送（OAuth2 认证）
- VPS 定时任务（每天早 7:00）

## 技术栈

- Python 3.9+
- Gmail API (google-auth)
- Jinja2 模板引擎
- SSH/rsync 数据传输

## 源代码

[devtools/briefing/](https://github.com/zengtianli/devtools)
