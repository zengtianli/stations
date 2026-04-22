# Stations · CLAUDE.md

`~/Dev/stations/` — 生产站群根目录（13 个子项目对应 13 个在线子域）。**本目录是 monorepo** → `github.com/zengtianli/stations`（2026-04-22 从 12 个独立 repo 合并；旧 repo archived 只读）。

> 父级规范见 `~/Dev/CLAUDE.md`（菜单 SSOT 整章在父级，不在此重复）。全局偏好见 `~/.claude/CLAUDE.md`。

## 子项目速查

| 目录 | 子域 | 技术栈 | 说明 |
|---|---|---|---|
| `website/` | tianlizeng.cloud | Next.js | 主站 + mega-navbar |
| `ops-console/` | dashboard.tianlizeng.cloud | Next.js | 运维面板 |
| `web-stack/` | *.tianlizeng.cloud (10 hydro-*) | Next.js + FastAPI services/ | 水利站群后端 + 前端 |
| `audiobook/` | audiobook.tianlizeng.cloud | Next.js | 有声书 |
| `cmds/` | cmds.tianlizeng.cloud | 静态站 | 命令速查 |
| `stack/` | stack.tianlizeng.cloud | 静态站 | 项目索引 |
| `logs/` | logs.tianlizeng.cloud | 静态站 | 会话/工程日志 |
| `assets/` | assets.tianlizeng.cloud | 静态站 | 素材 |
| `playbooks/` | playbooks.tianlizeng.cloud | 静态站 | 工作手册 |
| `cclog/` | cclog.tianlizeng.cloud | FastAPI | CC 会话日志服务 |
| `dockit/` | dockit.tianlizeng.cloud | Next.js | 文档工具 |
| `cc-options/` | — | 本地（含金融 .env） | `.env` 进 `.gitignore`，永不 track |
| `docs/` | — | MD | 跨站归档/知识库（含本次 retro） |

## 入场 3 步（硬性）

1. `/warmup` — 本目录环境 snapshot（skills / HANDOFF / git）
2. 读 `HANDOFF.md`（本目录）— 上次会话状态 + Tier 2 待办
3. 跑 `/menus-audit` 确认 11/11 绿基线

## 常用跨站命令

| 场景 | Skill |
|---|---|
| 菜单/子域 SSOT 改完全同步 | `/site-refresh-all`（11 步） |
| 13 类漂移检测 | `/menus-audit` |
| 全景健康扫描（menus + live API） | `/services-health` |
| navbar SSOT 推 6 个消费者 | `/navbar-refresh` |
| 健康扫描 | `/sites-health` |
| 批量 deploy | `/deploy <name>` 或 `/ship-site <name>` |
| 提交 + push | `git add . && git commit && git push`（单 repo，不再需要 `/ship <a> <b> ...`） |
| 会话收尾 | `/handoff` |

## 派生产物（AUTO-GENERATED，不手改）

完整清单见父级 CLAUDE.md § 菜单 SSOT。关键位于本目录内：

- `website/lib/services.ts`
- `website/lib/shared-navbar.generated.ts`
- `website/components/mega-navbar.tsx`
- `ops-console/components/mega-navbar.tsx`
- `website/lib/catalog.generated.ts`

## Pre-commit gate 覆盖

本 monorepo 单 hook 在 `.git/hooks/pre-commit`（symlink → `~/Dev/tools/configs/menus/.pre-commit-hook.sh`），任何修改触发 menus audit。原先 4 子 repo 各装一份的旧模式已并成一份。

外部仓库的 gate 继续独立：`~/Dev/devtools` + `~/Dev/tools/configs` + `~/Dev/tools/cc-configs`。

## 当前待办（截至最近 HANDOFF）

见 `HANDOFF.md` 的 Tier 2 清单（#6–#9）+ 小瑕疵（cmds `.gitignore` / frontend-tweak skill 描述）。

## 架构深读

- 图文并茂地图：`docs/knowledge/station-architecture-20260422.md`
- Roadmap 调查报告：`docs/knowledge/station-refactor-roadmap-20260422.md`
- 菜单图模型拆解：`~/Dev/tools/configs/menus/ARCHITECTURE.md`
