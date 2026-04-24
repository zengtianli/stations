# CLAUDE.md — logs

This file provides guidance to Claude Code when working with the `logs` station.

## 项目概述

站群的**合并时间线** — 把 HANDOFF.md + `.claude/plans/*.md` + cc-evolution/changes.yaml 按时间降序渲染成一份只读页面。

**替代**：旧的 `journal.tianlizeng.cloud`（手写 HANDOFF）+ `changelog.tianlizeng.cloud`（CC 自演进日志）。

**部署**：`bash deploy.sh` → `python3 generate.py` 生成 `site/` → rsync 到 `/var/www/logs/` → 走 Nginx → CF（logs.tianlizeng.cloud，CF Access 保护）。

## 架构

数据扫描源（`generate.py` 里硬编码的 HOME 路径扫描）：

- `~/Dev/HANDOFF.md`                   — 主 session handoff
- `~/Dev/*/HANDOFF.md`                 — 每项目 handoff
- `~/Work/*/HANDOFF.md` / `~/Work/bids/*/HANDOFF.md`
- `~/.claude/plans/*.md`               — 每次会话的 plan
- `~/Dev/_archive/cc-evolution-20260419/changes.yaml`    — CC 自演进（当前已归档，文件可能不存在）

渲染：
- `site/index.html` — 密集时间线，带 filter chips（全部 / HANDOFF / Plan / CC 进化 + per-project）
- `site/d/<slug>.html` — 每条详情

## 常用命令

```bash
/opt/homebrew/bin/python3 generate.py   # 生成 site/
bash deploy.sh                          # 生成 + 部署
open site/index.html                    # 本地预览
```

## 文件

- `generate.py` — 扫描 + 渲染器
- `deploy.sh` — 部署脚本（带 CF/HTTP 验证）
- `site-navbar.html` / `site-header.html` / `site-content.css` — 共享 UI（由 `/navbar-refresh` / `/site-header-refresh` / `/site-content-refresh` 同步）
- `data/` — 缓存或外部拉取的临时数据
- `site/` — 生成产物（.gitignore）

## 添加数据源

改 `generate.py` 里的扫描表达式（HOME、pattern 变量），重跑 `deploy.sh`。

## 部署注意

- CF Access 登录后可见（不公开索引）
- 部署后 HTTP 302 表示 CF Access 门禁在工作，不是 bug；200 是已登录的状态
