# Session Retro · 2026-04-20 · Streamlit → Next.js 全迁 + `~/Dev/web-stack` Monorepo

> 单日长会话。从「整理 Dev 目录 + 统一两栈视觉」的模糊请求起步，拍板"不要 Streamlit 了"，落地成 Turborepo monorepo + `stack_migrate_hydro.py` 批量迁移脚手架 + `/stack-classify` 分类清单。2 站端到端跑通，9 站骨架就位，明确 TODO 交接。

## 主题与脉络

1. **Plan mode 澄清**（4 轮 AskUserQuestion）→ 从"整理 + 风格统一"精确收敛到"全迁 Next.js，后端保留，Turborepo，hydro-reservoir/audiobook 并行 pilot"
2. **基建搭骨**：`~/Dev/web-stack/`（5 packages + 2 pilot apps）
3. **Pilot 打通**：audiobook（已有 FastAPI，UI 迁移）+ hydro-toolkit（插件网格）
4. **抽 pattern → 批量复制**：`stack_migrate_hydro.py` + 9 个 hydro-* scaffold
5. **真·端到端**：hydro-reservoir 的 `/api/compute` 实测产出 1.77MB xlsx，9.8s
6. **抽通用组件**：`XlsxComputeForm` 让后续 8 个 hydro-*-web 的 page.tsx ≈ 50 行
7. **清单化**：`/stack-classify` 扫描 47 项目，streamlit 11 个待迁清单出炉
8. **收尾**：全 workspace typecheck 绿、menus-audit 8/8 绿

## 做对的

- **问够了再动**：4 轮 AskUserQuestion 精确到"视觉基准/统一深度/存量处置/pilot 选谁/后端组织/通信方式"，避免"整理 ≠ 重构"的歧义
- **pilot 先于 pattern**：hydro-reservoir 手工完整跑一遍（踩 `res_up_res` bug、CJK header latin-1 崩、缺 `python-multipart`），再抽 `stack_migrate_hydro.py` 批量复制。如果反过来先写脚本，这 3 个坑会 × 9 次
- **后端零改动原则**：api.py 全部以 `_run_xxx(bytes, params) → (xlsx_bytes, meta...)` 形态独立实现，原 app.py 原封不动，Streamlit 侧可 `/legacy/` 灰度共存
- **通用组件节制抽象**：`XlsxComputeForm` 3 个 props（params / headers / footerSlot）覆盖 90% hydro-* 形态，不给复杂 hydro-risk 的 4-phase 强行通用
- **stack-classify 命名决策**：没改 `/tidy`（破坏性文档清理语义不能污染），新建 `/stack-*` 系列和 `stack.tianlizeng.cloud` 同前缀
- **/menus-audit 8/8 绿**确认 monorepo 新增的 `@tlz/menu-ssot` 消费者没破坏现有 SSOT 工作流

## 做错/绕弯的

- **Edit/Write 没先 Read** 翻了 3 次（stack_migrate_hydro.py 的 page_tsx、hydro-reservoir/api.py、hydro-reservoir-web/page.tsx）→ 第二次 migrate 用了旧模板，浪费一次 `--force` 刷新
- **port 映射首次搞错**：plan 里按字母序猜 port，实际应当从 `services.ts` 读。修正方案：`stack_migrate_hydro.py` 里 `parse_services_port()` 正则抽，Next.js dev port = streamlit port - 5400
- **clashx 代理挡 localhost** 害 curl 503 5s 超时，花了 1 轮才定位到 `http_proxy=127.0.0.1:7890`。以后本地 smoke 直接 `--noproxy '*'`
- **原 app.py 的 `res_up_res` bug**：xlsx_bridge 返回 `up_res`/`down_res`，app.py 写成 `res_up_res` 从未触发——说明原 Streamlit 的"开始计算"按钮按下去就 KeyError，但没人跑过。教训：不能假定原代码正确
- **没早点抽 XlsxComputeForm**：第一次 pilot reservoir-web 写了 250 行自定义 UI，抽组件后 50 行，复用到 8 站省了 1600+ 行重复

## 工程模式（可复用）

### A. "先 pilot 再 pattern"
```
1. 挑 1 个代表性站做端到端
2. 坑全踩完后，把 pilot 的非业务部分抽成脚本/组件
3. 批量生成其余（可能 N=10+）
4. 留 TODO 指针：每个剩余站的业务 compute 怎么填
```

### B. "后端 wrapper 不动原码"（Streamlit → FastAPI 解耦）
```
~/Dev/<repo>/
├── app.py         (原 Streamlit，保留不动)
├── src/           (原 core 模块，保留不动)
└── api.py         (新加 — FastAPI wrapper)
    ├── /api/health
    ├── /api/meta
    └── /api/compute  ← 调 src.* 核心函数，不 import streamlit
```

### C. "monorepo + 独立后端" 架构
```
~/Dev/web-stack/     (Next.js 全家桶，前端统一)
  apps/
  packages/{tokens, ui, api-clients, menu-ssot, config}
~/Dev/<repo>/        (Python 后端，各站独立 repo)
  + api.py
  
前后端通过 HTTP 通讯：
  - 开发：127.0.0.1:86xx
  - 线上：Nginx 同域 /api/* 反代
```

### D. "URL-encoded CJK headers" 套路
```python
# 后端
from urllib.parse import quote
headers["X-Up-Res"] = quote(cjk_value)
headers["Access-Control-Expose-Headers"] = "X-Up-Res, ..."
```
```ts
// 前端
decodeURIComponent(r.headers.get("x-up-res") ?? "")
```

## 沟通

- 用户偏好短 `ok` / `ok 可以 继续` 类确认；不需要我每次分叉都停下 AskUserQuestion
- "一次性全部完成"意味着：能自动化的全做掉，不能一次完成的（8 个 hydro-* compute）留清晰 TODO，不再拉轮次
- auto mode + plan mode 混用顺序：plan 走完 ExitPlanMode 后自动进 auto，用户 `ok` 视为批准每个中间步骤

## 关键产物清单

| 产物 | 路径 | 备注 |
|---|---|---|
| Monorepo | `~/Dev/web-stack/` | 5 packages + 11 apps |
| 共享 tokens | `~/Dev/web-stack/packages/tokens/` | HSL + 4 accent + Inter + radius |
| 共享 UI | `~/Dev/web-stack/packages/ui/` | SiteNav/Header/Footer + LiquidGlass/StatCard + **XlsxComputeForm** |
| Menu SSOT 桥 | `~/Dev/web-stack/packages/menu-ssot/` | spawn `menus.py build-website-navbar -w` 同步 |
| API clients | `~/Dev/web-stack/packages/api-clients/` | `audiobook` / `hydro-toolkit` typed |
| Pilot A | `~/Dev/web-stack/apps/audiobook-web/` (3100) + `~/Dev/audiobook/app/main.py` (9200) | 端到端 · 书架/播放器/上传 |
| Pilot B | `~/Dev/web-stack/apps/hydro-toolkit-web/` (3110) + `~/Dev/hydro-toolkit/api.py` (8610) | 端到端 · 插件网格/管理 |
| Hero pilot | `~/Dev/web-stack/apps/hydro-reservoir-web/` (3112) + `~/Dev/hydro-reservoir/api.py` (8612) | **真计算 1.77MB xlsx 9.8s** |
| 批量 scaffold | `~/Dev/web-stack/apps/hydro-{annual,capacity,district,efficiency,geocode,irrigation,rainfall,risk}-web/` | 骨架 + 501 stub |
| Pattern 脚本 | `~/Dev/devtools/lib/tools/stack_migrate_hydro.py` | 一条命令生成 Next app + FastAPI wrapper |
| Classify 工具 | `~/Dev/devtools/lib/tools/classify.py` | 纯 stdlib，`/stack-classify` 底层 |
| Slash command | `~/Dev/tools/cc-configs/commands/stack-classify.md` | |
| Plan | `/Users/tianli/.claude/plans/tidy-slash-shimmying-bengio.md` | 750 行完整方案 |

## TODO 交接 (下个会话)

**一次性全部完成 + 部署到网站**：

1. 8 个 hydro-* 的 `/api/compute` 实现（每站 ~1h，参考 `~/Dev/hydro-reservoir/api.py::_run_reservoir()`）
2. VPS 部署（systemd `tlz-api@.service` 模板已预留在 `infra/systemd/` 位置概念；nginx path-based `/` → Next.js / `/legacy/` → 原 Streamlit）
3. CF Origin Rule 子域 → Nginx 8443
4. 灰度 2-4 周后下线 Streamlit

## 给"未来的我"

遇到"迁移一堆类似项目"的活：
1. 先列清单（`/stack-classify` 风格），别凭感觉
2. 挑最典型的 1 个做端到端（坑全踩完）
3. 非业务部分抽脚本（`stack_migrate_hydro.py` 风格）
4. 业务部分抽通用组件（`XlsxComputeForm` 风格，props 节制）
5. 批量跑脚手架，业务空位用 501 + TODO 标记
6. 最后统一部署
