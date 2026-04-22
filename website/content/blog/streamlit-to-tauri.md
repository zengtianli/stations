---
title: "从 Streamlit 到 Tauri：水利计算工具的桌面化之路"
date: "2026-04-10"
author: "曾田力"
excerpt: "将 12 个 Streamlit Web 应用迁移为 Tauri 桌面端的经验总结——计算引擎分离、React 前端重写、跨平台打包。"
tags: ["开发工具", "Tauri", "独立开发", "Streamlit", "React"]
published: true
---

## 背景

水利行业的计算工具有一个特殊需求：很多用户在**没有网络**的环境下工作（比如野外勘测现场）。Streamlit 版本虽然开发快，但必须联网使用。

于是我开始了 Streamlit → Tauri 的迁移计划，目标是将 12 个 hydro-* 水利计算工具逐步迁移为桌面应用。

## 迁移策略

### 不是重写，是分离

核心思路是**计算引擎与界面分离**：

```
Streamlit 版本:
  Python 计算逻辑 + Streamlit UI（耦合）

Tauri 版本:
  Python 计算引擎（独立模块，pip install）
  + React 前端（shadcn/ui）
  + Rust 后端（调用 Python 或内嵌计算）
```

### 分三步走

1. **提取计算引擎**：把 Streamlit 代码中的核心计算逻辑抽离为独立的 Python 模块
2. **React 前端重写**：用 shadcn/ui 复刻 Streamlit 界面，保持功能一致
3. **Tauri 集成**：Rust 后端通过 sidecar 调用 Python 计算引擎

## 踩过的坑

### 1. rsync 和 symlink

部署时 rsync 默认不跟踪 symlink，导致 node_modules 中的链接文件丢失。

解决：`rsync -aL`（L 参数跟踪 symlink）。

### 2. Native modules

better-sqlite3 等 native 模块在 Tauri 的 sidecar 环境中行为不同。

解决：计算层纯 Python，前端不依赖 native 模块。

### 3. Webpack crash

某些 React 组件在 Tauri 的 webview 中导致 webpack 内存溢出。

解决：拆分 chunk，按需加载大组件。

### 4. CSS 哈希不匹配

standalone 构建和 static 文件来自不同次构建时，CSS 文件名哈希不同，导致样式丢失。

解决：每次部署前 `rm -rf .next` 确保同一次构建。

## 迁移成果

目前已完成 2 个工具的迁移：
- **hydro-capacity**：纳污能力计算器
- **hydro-efficiency**：水效评估系统

每个工具都保持 Web + 桌面双端可用，Web 版在 VPS 上运行，桌面版可离线使用。

## 经验总结

1. **计算引擎独立是关键**——迁移的难度和风险主要在 UI，不在计算
2. **不要追求一步到位**——先迁移最常用的，验证模式后再批量推进
3. **Tauri 比 Electron 轻得多**——打包后 10MB 级别 vs 100MB+
4. **保持 Web 版不下线**——桌面版是补充，不是替代
