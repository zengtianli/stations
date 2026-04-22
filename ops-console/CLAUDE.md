# CLAUDE.md — ops-console

This file provides guidance to Claude Code when working with the `ops-console` station.

## 项目概述

**运维控制台** — `dashboard.tianlizeng.cloud`（CF Access）。Next.js 15 standalone + App Router + TypeScript + Tailwind + shadcn/ui。

整合多个运维数据源到一个 dashboard：

- **Auggie scan**：`~/Dev/labs/auggie-dashboard/data/scan.json` 的 GitHub repo 快照
- **Hammerspoon config**：macOS 窗口管理配置
- **Raycast index**：扩展 + 快捷键

## 架构

- **框架**：Next.js 15 standalone（`output: "standalone"`，systemd 起 `node server.js`）
- **端口**：VPS 8520（反代走 Nginx）
- **服务**：`systemctl status ops-console`
- **部署**：`bash deploy.sh` → `pnpm build` → rsync `.next/standalone/` → systemd restart

## 数据目录

`data/` 非 rsync `--delete`（deploy.sh 特意 post-sync 保护）。3 类数据源：

- `auggie-scan.json`  — 每次部署刷新自 `~/Dev/labs/auggie-dashboard/data/scan.json`
- `hs_config.json`    — Hammerspoon 配置镜像
- `raycast_index.json` — Raycast 扩展索引

部署前自动跑：
```bash
python3 scripts/build_raycast_index.py   # 重建 raycast_index.json
```

## 常用命令

```bash
pnpm dev          # 本地开发（端口见 package.json）
pnpm build        # 生产构建
bash deploy.sh    # 完整部署（rebuild index + build + rsync + restart）
```

## 页面

- `/` — dashboard 首页（aggregated view）
- `/auggie` — Auggie repo 分析
- `/hammerspoon` — HS 配置
- `/raycast` — Raycast 扩展 + 快捷键

详见 `app/` 目录下各 route。

## 部署注意

- systemd unit 自动创建（deploy.sh 内联 UNITEOF），端口 8520
- CF Access 门禁：未登录 302，登录后 200
- **Next.js + pnpm + standalone symlink trace 问题**：已在 `~/Dev/devtools/lib/fix-standalone-pnpm-symlinks.js` 解决。本 repo 的 `deploy.sh` 尚未集成该脚本 — 若 deploy 后 systemd `ops-console.service` 报 `Cannot find module 'styled-jsx/package.json'`，在 `pnpm build` 后追加：
  ```bash
  node ~/Dev/devtools/lib/fix-standalone-pnpm-symlinks.js .next/standalone
  ```
