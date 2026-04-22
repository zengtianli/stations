# tlz-web-stack

Turborepo monorepo for tianlizeng.cloud Next.js apps.

All Streamlit frontends are being migrated here; Python compute logic stays in their original repos, wrapped by ~30-line FastAPI shims (see `infra/systemd/tlz-api@.service`).

## 结构

```
apps/        每个子域一个 Next.js app
packages/
  tokens/     Design tokens SSOT（HSL 变量 + 4 方向 accent + Inter + radius）
  ui/         shadcn/ui + SiteNav/SiteHeader/SiteFooter + LiquidGlassCard/StatCard/DataTable/...
  api-clients/Python 后端 typed fetch 封装
  menu-ssot/  桥 ~/Dev/tools/configs/menus/ yaml SSOT → TypeScript
  config/     tsconfig / eslint 共享基座
infra/       nginx location 片段 / systemd 模板 / 批量 deploy 脚本
```

## 常用

```bash
pnpm install
pnpm dev                               # turbo 并行跑所有 apps
pnpm --filter audiobook-web dev        # 只跑一个
pnpm build
pnpm sync-menu                         # 把 ~/Dev/tools/configs/menus/navbar.yaml 同步成 generated.ts
```

## 视觉基准

以 `~/Dev/stations/website` 为视觉 SSOT：Apple 风亮色、Tailwind HSL 变量、shadcn/ui、Inter 字体、圆角 1rem、4 方向 accent 色（hydro / ai / devtools / indie）。**不启用暗色模式**（`forcedTheme="light"`）。

## 决策记录

完整计划见 `/Users/tianli/.claude/plans/tidy-slash-shimmying-bengio.md`。
