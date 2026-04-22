# CLAUDE.md — tlz-web-stack

Turborepo monorepo 承载 tianlizeng.cloud 所有 Next.js apps。

## Quick Reference

| 项目 | 路径/值 |
|------|---------|
| 工具链 | pnpm 10 · turbo 2 · Next.js 15 · React 19 · TypeScript 5 |
| 视觉 SSOT | `~/Dev/stations/website` (tailwind HSL + shadcn + Inter + radius 1rem) |
| Menu SSOT | `~/Dev/tools/configs/menus/navbar.yaml` via `python3 ~/Dev/devtools/lib/tools/menus.py` |
| Design tokens | `packages/tokens/` (`@tlz/tokens`) |
| UI 组件 | `packages/ui/` (`@tlz/ui`) |
| API clients | `packages/api-clients/` (`@tlz/api-clients`) |
| Menu bridge | `packages/menu-ssot/` (`@tlz/menu-ssot`) |
| Python 后端 | `services/<name>/` (monorepo，10 站合一；2026-04-20 迁入，原 `~/Dev/hydro-*/` 留 2 周 fallback) |
| Python workspace | `services/pyproject.toml` (uv workspace) → 共享 `.venv`，`uv sync --all-packages` 一次装完 |

## 常用命令

```bash
pnpm install
pnpm dev                          # turbo 并行所有 apps
pnpm --filter audiobook-web dev
pnpm --filter hydro-toolkit-web dev
pnpm build
pnpm sync-menu                    # 同步 navbar SSOT

# Python 后端
cd services && uv sync --all-packages        # 一次装全部 10 站依赖
cd services/hydro-capacity && uv run uvicorn api:app --port 8611  # 本地起某站
bash ~/Dev/devtools/scripts/api-smoke.sh hydro-capacity --compute  # 本地烟测
```

## 约束

- **不启用暗色模式**：website 是 `forcedTheme="light"`，tokens 不写 `.dark` 变体
- **不改原 Python 逻辑**：每个 repo 只加 `api.py` wrapper 暴露纯数据 API，`import` 现成模块
- **视觉零 drift**：所有 tokens 统一走 `@tlz/tokens`，tailwind preset 继承，改 token 全局传导
- **Menu SSOT 不破坏**：`packages/menu-ssot/scripts/sync-menu.ts` spawn 现有 `menus.py build-website-navbar`；`/menus-audit` / `/navbar-refresh` / `/site-refresh-all` 工作流保持
- **端口约定**：Python FastAPI = 原 Streamlit 端口 + 100（audiobook 例外 9200）；Next.js dev 从 3100 起，与 API 8600+ 错开
- **API 同源**（2026-04-20 重构）：11 app 全部走 Next.js rewrites — `next.config.mjs` 配 `/api/* → 127.0.0.1:$port`，client fetch 用 same-origin `/api/*`。**不要再写 `NEXT_PUBLIC_API_BASE_*`**（会烤进 client bundle 暴露 dev URL；`verify.py` check [2] 会拒绝 deploy）。dev/prod 一套配置，`.env.local` 已全删

## 迁移节奏

Pilot A audiobook + Pilot B hydro-toolkit 并行 → 抽 `~/Dev/devtools/lib/tools/stack_migrate_hydro.py` → 批量迁 9 个 hydro-* → `/stack-classify` 出全局清单。

完整 plan 见 `/Users/tianli/.claude/plans/tidy-slash-shimmying-bengio.md`。
