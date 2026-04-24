# Playbook · mass-migration · 大规模批量迁移/改造

> 2026-04-20 立。第一次应用：11 个 Streamlit → Next.js（session-retro-20260420-mass-migration.md）

## § 定位

**是**：把 N 个相似项目（N ≥ 3）从技术栈 A 批量迁到技术栈 B 的编排模板。以"**手工 pilot 1 个 → 抽 scaffold 脚本 + 通用组件 → 批量刷余下**"为核心节奏。

**典型场景**：
- 11 个 Streamlit 站 → Next.js（`~/Dev/stations/web-stack/`）
- hydro-xxx Streamlit 逻辑 → Tauri 桌面 app
- Vue 2 项目 → Vue 3
- Django templates → React SPA
- Makefile → Justfile

**不是**：单项目的重构（走 `/simplify` + 手工）、新建一个站（走 `web-scaffold.md`）、小样式微调（走 `frontend-tweak`）。

---

## § 入场判断

**trigger words**：
- 「把 N 个 X 迁成 Y」「全改」「批量改造」「统一成 Y」
- 「不想用 X 了」+ 「现有有 N 个」
- 「架构换掉」+ 涉及多 repo

**反例**（看似相关但应走别的 playbook）：
- 「新建一个站」→ `web-scaffold.md`
- 「统一 navbar 视觉」→ `stations.md`
- 「单个 hydro 站改 bug」→ `hydro.md`（未立，走 Step 4）

---

## § 编排图

```
用户口令「把 N 个 A 迁成 B」
  ↓
【入场】       /warmup
  ↓
【规划】       Plan mode (plan-first skill)
               AskUserQuestion × 4-5
               → 收敛：范围 / 存量处置 / 技术组合 / Pilot 选谁
               ExitPlanMode
  ↓
【清单】       /stack-classify            ← 扫全范围分类
  ↓
【基建】       Write 共享骨架（monorepo / packages）
               pnpm -r typecheck / cargo check / ...   ← 基建门
  ↓
【Pilot × 1】  手工端到端迁一个代表      ← 关键节点，必须先 pilot
               踩完坑：bug / 编码 / 依赖 / 配置
               本地联调
  ↓
【抽 pattern】 Write scaffold 脚本（读 SSOT 生成 N 份模板）
               Write 通用组件（props ≤ 5）
               更新 scaffold 用通用组件
  ↓
【批量刷】     scaffold <A2> <A3> ... --force
               typecheck 全 workspace     ← 质量门 1
               /menus-audit                ← 质量门 2（如涉及站群 SSOT）
  ↓
【收尾】       /ship <所有改动 repo>       ← 必做
               /handoff                    ← 列 TODO + symlink 到子 repo
               /retro                      ← 抽 playbook（更新本文件）
```

**分支**：
- N < 3：退化到手工迁 + 不抽 scaffold
- 业务差异极大（如 hydro-risk 4-phase）：每个单 pilot，不强行通用

---

## § 复用清单

| 动作 | skill / command |
|---|---|
| 看状态 | `/warmup` |
| 规划 + 澄清 | Plan mode (`plan-first`) + `AskUserQuestion` × 4-5 |
| 全范围分类 | **`/stack-classify`**（本次新建，`~/Dev/devtools/lib/tools/classify.py`） |
| 批量 scaffold | **`/stack-migrate <repo>`**（本次新建，`~/Dev/devtools/lib/tools/stack_migrate_hydro.py`；跨栈时需新写 migrate 脚本） |
| 质量门 1 — 类型 | `pnpm -r typecheck` / `cargo check` / 目标栈的类型检查器 |
| 质量门 2 — SSOT | `/menus-audit` / `/cf-audit` / `/audit` |
| 代码质量复查 | `/simplify`（大量新代码后） |
| 提交 | **`/ship <repo1> <repo2> ...`**（必做，收尾前） |
| 收尾 | `/handoff` + `/retro` |
| 长会话监控 | `/context health`（每 50 轮跑一次） |

---

## § 改动边界矩阵

| 改什么 | 文件 | 破坏性 | 入口 |
|---|---|---|---|
| 共享基建（monorepo 骨架） | `<workspace>/package.json + turbo.json + packages/*` | **高** | Plan mode + 基建门 |
| 通用组件（props 签名） | `packages/ui/src/patterns/*.tsx` | **中** | 通过 scaffold 模板传导，typecheck 门 |
| Scaffold 脚本 | `~/Dev/devtools/lib/tools/stack_migrate_*.py` | **中** | dry-run 先看，再 --force |
| 单站 Pilot | `apps/<pilot>/*` + `<repo>/api.py` | 低 | 手工 + 本地 smoke |
| 批量 scaffold 产物 | `apps/*-web/` × N | 中（一次刷 N 份） | `/stack-migrate --force` + typecheck |
| SSOT 消费者接入 | `packages/menu-ssot` + yaml loader | **高**（可能破坏现有站群） | **必须 `/menus-audit` 8/8 绿** |
| 原 app.py / 原 src/ | `~/Dev/<repo>/` | **零改动原则** | 只加 wrapper，不改原码 |
| 部署 systemd / nginx | VPS `/etc/systemd/*`, `/etc/nginx/*` | **极高** | Plan mode + 回滚预案 + 灰度 |

---

## § 踩坑 anti-patterns

### ❌ 先写批量脚本再测试
**现象**：看到 "N 个要做的" 就想一把梭，写通用脚本跑 N 次。
**根因**：N 个站的坑会被放大 N 倍（本次 reservoir 踩了 3 个坑：`res_up_res` / CJK header / `python-multipart`，如果先写脚本 × 8 会踩 24 次）。
**下次**：**必须先手工 pilot × 1**，踩完所有坑再抽脚本。

### ❌ 原代码盲信
**现象**：假定原 app.py 里的字段名、函数签名都对。
**根因**：原代码可能有 dead branch 未被触发（如 `result['res_up_res']` 实际 key 是 `up_res`）。
**下次**：翻译前对着 `xlsx_bridge.py` 等真实模块检查 key/签名，别只读调用点。

### ❌ CJK 字符塞 HTTP response header
**现象**：`UnicodeEncodeError: 'latin-1' codec can't encode ...`。
**根因**：HTTP header 只允许 latin-1 范围。
**下次**：**`urllib.parse.quote(value)` + `Access-Control-Expose-Headers`**，前端 `decodeURIComponent`。

### ❌ FastAPI 上传文件没装 python-multipart
**现象**：启动时 `RuntimeError: Form data requires "python-multipart"`。
**根因**：FastAPI 不预装，需单独 `uv add python-multipart`。
**下次**：scaffold 脚本自动在 pyproject patch 里加，或 check-list 提醒。

### ❌ 端口凭感觉猜
**现象**：plan 里按字母序猜 hydro-* port，实际和 `services.ts` 对不上。
**根因**：没读 SSOT。
**下次**：**scaffold 脚本必须读 `~/Dev/stations/website/lib/services.ts`** 拿原 port，派生 FastAPI/Next dev port。

### ❌ clashx 代理挡 localhost 导致 curl 503
**现象**：`curl http://localhost:3100/` 挂 5 秒超时返回 503。
**根因**：`http_proxy=http://127.0.0.1:7890` 被 curl 自动拾取。
**下次**：本地 smoke **永远**加 `--noproxy '*'`。

### ❌ Edit 前忘记 Read
**现象**：`File has not been read yet` 错误，Edit 失败。
**根因**：Claude Code 规则 — Edit 前必 Read。Plan agent 写的、Bash 生成的、之前 Write 没 Read 的，都要先 Read。
**下次**：习惯 Edit 前先 `Read(file_path, limit=5)` 建立上下文。

### ❌ 批量刷完不跑质量门就汇报
**现象**：跑完 scaffold × N 就说"完成了"，结果 3 个 typecheck 错。
**根因**：没跑 `pnpm -r typecheck` 或 `/menus-audit` 确认门槛。
**下次**：批量操作完 **立即两个门**：`pnpm -r typecheck` + `/menus-audit`。

### ❌ 收尾漏 `/ship`
**现象**：`/handoff` 写完就结束，GitHub 还是脏 repo。
**根因**：`/handoff` 只管交接文件，不管代码提交。
**下次**：**`/handoff` 和 `/ship` 成对**。handoff 前必 ship 全部改动过的 repo。

---

## § 文件索引

### 本 playbook 第一次应用（Streamlit → Next.js）的关键文件

| 文件 | 作用 |
|---|---|
| `~/Dev/stations/web-stack/` | 新 Turborepo monorepo（5 packages + 11 apps） |
| `~/Dev/stations/web-stack/packages/tokens/` | design tokens SSOT |
| `~/Dev/stations/web-stack/packages/ui/src/patterns/xlsx-compute-form.tsx` | 通用上传+计算+下载组件（props = 5 个） |
| `~/Dev/stations/web-stack/packages/menu-ssot/scripts/sync-menu.ts` | 桥现有 menus.py SSOT，不破坏 |
| `~/Dev/devtools/lib/tools/classify.py` | `/stack-classify` 底层（纯 stdlib） |
| `~/Dev/devtools/lib/tools/stack_migrate_hydro.py` | `/stack-migrate` 底层（生成 13 文件/repo） |
| `~/Dev/stations/web-stack/services/hydro-reservoir/api.py` | **FastAPI wrapper 参考实现**，复制到其他 repo 改 src.* |
| `/Users/tianli/.claude/plans/tidy-slash-shimmying-bengio.md` | 原始 Plan mode 方案 |
| `~/Dev/stations/docs/knowledge/session-retro-20260420-mass-migration.md` | 首次应用的完整复盘 |

### 通用（跨 domain）

| 文件 | 作用 |
|---|---|
| `~/Dev/stations/website/lib/services.ts` | **子域/端口 SSOT**，scaffold 必读 |
| `~/Dev/tools/configs/menus/navbar.yaml` | 站群 navbar SSOT |
| `~/Dev/devtools/lib/tools/menus.py` | navbar 渲染 + audit |

---

## § 扩展机制

### 新增一个迁移场景（比如 Vue 2 → Vue 3）

1. 判断基建是否复用现有 `~/Dev/stations/web-stack/`（Vue 不合适，需要独立 monorepo 如 `~/Dev/vue-stack/`）
2. 新写 scaffold 脚本 `~/Dev/devtools/lib/tools/stack_migrate_vue.py`（参考 `stack_migrate_hydro.py`）
3. 新写对应通用组件（如 Vue 版 UploadForm）
4. 遵循本 playbook §3 编排图
5. 完成后回本文件 § 文件索引 补一节"Vue 2 → Vue 3 关键文件"

### 新增一个质量门（比如生产部署 audit）

在 § 编排图「批量刷」节后加一步：
```
→ /deploy <name> × N
→ /sites-health              ← 新增门
→ 验证子域 HTTP 200
```
同时在 § 改动边界矩阵 加一行部署动作。

### 本 playbook 自身的迭代

每次"大规模迁移"任务完成后：
- 更新 § 踩坑 anti-patterns（加新踩的坑）
- 更新 § 文件索引（如基建有演进）
- 如果流程本身变了（比如改成 3-pilot 而不是 1-pilot），更新 § 编排图
- **不要重写**整个 playbook — 增补为主，让它带时间戳演化

---

**维护者**：任何跑过这类任务的 session  
**索引**：META.md §5
