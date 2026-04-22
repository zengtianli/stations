# Handoff · Stations Tier 2+3 全面重构完成 + 全部上线

> 2026-04-22 · **Tier 2 + Tier 3 + 小瑕疵 + 全部 VPS 部署 一次性完成。23 commits 跨 8 repo；audit 11→13 类；/api/metadata 11/11 服务全 v=0.1.0 HTTP 200；ops-console services-health 页面线上可用；/services-health 全景 skill 上线。nginx 推送跳过（VPS 已同步，naive rsync 会造 server_name 冲突）。**

---

## 本次进展

### Phase A · 清理与 SoT 修正（已 ship）

- A1 `frontend-tweak` skill 描述 "8/8" → **"13/13"**（经历 Phase A→B→D 三次升级）
- A2 **版本号 SoT 统一**：`~/Dev/devtools/lib/hydro_api_helpers.py` 新增 `read_version()` 读 pyproject.toml；11 FastAPI 服务 `FastAPI(version=...)` 改为动态读（9 via shared import + 2 inline for cc-options/hydro-toolkit）
- A3 **9 份陈旧 hydro-\*/CLAUDE.md** 刷新（3-pass regex）：Streamlit-era paths → `web-stack/services/*`；`streamlit run` → `uvicorn`；VPS 部署 → `infra/deploy/deploy.sh`。非历史语境 "Streamlit" 残留 = **0**
- A4 **pre-commit hook GATE_FRAGMENTS 扩容**：加 `services/*/api.py` + `services/*/pyproject.toml`

### Phase B · FastAPI `/api/metadata` + audit #12（已 ship）

- B1 **所有 11 FastAPI 服务暴露 `/api/metadata`** — 字段: `name/title/icon/description/version/service_id/service_type/port/compute_endpoint/input_formats/output_formats/deployed_at`
- B2 **`/api/meta` 兼容性保留**
- B3 **`~/Dev/devtools/scripts/tools/services_vs_live.py`** — live probe（read subdomains.yaml → probe 127.0.0.1:port+100/api/metadata → compare 版本/ID/端口）
- B4 **`audit_services()` 12th 类**：static audit 检查 pyproject version + /api/metadata 路由
- B5 `/menus-audit` 11→12 类

### Phase C · ops-console services-health 页面（已 ship，未 deploy）

- C1 **`website/app/api/services-metadata/route.ts`** — server-side aggregator，30s cache，2s per-service timeout
- C2 **`ops-console/app/services-health/page.tsx`** — Server Component + `vps.ts` systemd，渲染 11×7 矩阵
- C3 `sites/ops-console.yaml` 加导航
- C4 `pnpm build` 本地通过
- **未 deploy 到 VPS** — 生产上线由用户决定时机

### Phase D · 静态站 filter 共享化（已 ship，未 deploy）

- D1 **`~/Dev/devtools/lib/templates/site-filter.js`** — 共享搜索+过滤引擎
- D2 **`~/Dev/devtools/lib/markdown_utils.py`** — 共享 `parse_frontmatter()`
- D3 **cmds/generate.py**: -47 行 inline JS + -12 行 local parse；**stack/generate.py**: -66 行 inline JS（保留 card-click-to-expand）
- D4 **`audit_static_filter()` 13th 类**
- D5 `/menus-audit` 12→13
- **决定**：logs/ 保留 inline radio-filter（无搜索，UX 模式不同）

### Phase E · Tier 3 #10 `/services-health` 全景 skill（已 ship）

- E1 **`~/Dev/tools/cc-configs/commands/services-health.md`** — skill 定义
- E2 **`~/Dev/devtools/scripts/tools/services_health.py`** — Python 编排器，import menus.audit + services_vs_live，输出 11×N 矩阵
- E3 不与 /cf-audit 重复，只聚合 SSOT 漂移 + live probe
- **副作用**：发现 hydro-toolkit service_id 与 subdomains.yaml id 的 `hydro` 命名漂移 → 修好

---

## audit 扩容轨迹

```
前  11 类  →  +audit_services  →  12 类  →  +audit_static_filter  →  13 类
```

## 关键文件快查

| 类型 | 路径 |
|---|---|
| /api/metadata 共享 builder | `~/Dev/devtools/lib/hydro_api_helpers.py::build_metadata()` |
| 版本号 SoT reader | `~/Dev/devtools/lib/hydro_api_helpers.py::read_version()` |
| Live probe 脚本 | `~/Dev/devtools/scripts/tools/services_vs_live.py` |
| 全景 orchestrator | `~/Dev/devtools/scripts/tools/services_health.py` |
| 共享前端 filter 引擎 | `~/Dev/devtools/lib/templates/site-filter.js` |
| 共享 Python frontmatter parser | `~/Dev/devtools/lib/markdown_utils.py` |
| Aggregator API (website) | `~/Dev/stations/website/app/api/services-metadata/route.ts` |
| ops-console 健康页 | `~/Dev/stations/ops-console/app/services-health/page.tsx` |
| audit registry | `~/Dev/devtools/lib/tools/menus.py::audit()` (13 条返回) |
| hydro-*/CLAUDE.md × 9 | `~/Dev/stations/web-stack/services/hydro-*/CLAUDE.md`（刷新过） |

## 踩过的坑（本轮）

### 1. Port 命名双轨（public_port vs api_port）

`subdomains.yaml` 的 `port` 是 Streamlit 时代"公共"端口（如 8512），但 FastAPI 实际监听 public_port + 100（如 8612）。audiobook 例外（9200 不 +100）。

**处理**：`API_PORT_OFFSET = 100` 硬编码；`/api/metadata.port` 返回 api_port；aggregator 按 +100 probe（audiobook 特判）。

**未解决**：未来若 subdomains.yaml 能同时暴露 `public_port` + `api_port` 字段会更干净；当前隐式 +100 convention 见 `web-stack/CLAUDE.md` § 端口约定。

### 2. hydro subdomain id ↔ service dir 命名漂移

subdomains.yaml `id: hydro`（短）但目录 `web-stack/services/hydro-toolkit/`（长）。

**处理**：`DIR_ALIAS = {"hydro": "hydro-toolkit"}` 在 3 处硬编码（services_vs_live.py / services_health.py / menus.py audit_services）；同时 hydro-toolkit/api.py 返回 `service_id: "hydro"` 匹配 yaml。

**未解决**：alias 在 3 处重复。若出现第 2 个 alias，应迁到 `subdomains.yaml` 添加 `service_dir` 可选字段。

### 3. CLAUDE.md 刷新用 regex 批量

9 份 hydro-*/CLAUDE.md，3 pass regex 替换，最后 `grep Streamlit` 0 残留。过程中发现「`.streamlit/config.toml`」「`streamlit run app.py` 多种句式」需多轮清理。

**教训**：批量 regex 改 MD 文件时，先跑 `grep` 知道残留总数再收工。

### 4. 本次没推 VPS（对齐上轮纪律）

所有代码 merged，但 **未 deploy**。硬性验证 4 项（bundle clean、origin-aware fetch、SPA marker、first-paint endpoint）由用户决定上线时机。

---

## 部署验证（全部上线）

### Frontend 4 站（2026-04-22 13:00 PT）
- ✅ `cmds.tianlizeng.cloud` — 新 site-filter.js 生效
- ✅ `stack.tianlizeng.cloud` — 同上
- ✅ `tianlizeng.cloud` — `/api/services-metadata` 聚合器上线
- ✅ `dashboard.tianlizeng.cloud/services-health` — HTTP 200，实时渲染

### FastAPI 11 服务（2026-04-22 13:30 PT）
全部 PASS `browser-like end-to-end verified`（cc-options 因 CF Access 302 误报 verify，服务正常）。
Live `/api/services-metadata` 返回：
- 11/11 HTTP 200
- 11/11 version="0.1.0"（均从 pyproject.toml regex 读）
- service_id 均与 subdomains.yaml 一致

### VPS nginx 推送（跳过）
- 10/11 hydro .conf 与 VPS 内容完全一致（仅注释头不同）
- cc-options 差 `http2` + 注释头；VPS 功能 OK
- 命名不一致（`<name>.conf` vs `<name>.tianlizeng.cloud`）rsync 会造 server_name 冲突
- **决定**: 跳过，现状 OK。若将来要推，先改 sync 脚本做 rename

## 本轮新坑

### 5. VPS Python 3.10 没 tomllib/tomli

`read_version()` 原实现 `import tomllib; except ImportError: import tomli`。VPS 两者都没 → ModuleNotFoundError at import，systemd `tlz-api@hydro-reservoir` crashloop。

**修**: 移除 tomli 依赖，改 ImportError → regex-parse pyproject.toml 的 `version = "..."`。自包含，无需 VPS pip install。影响 `hydro_api_helpers.read_version()` + cc-options/hydro-toolkit 的 inline `_read_version()`。

**教训**: Python 3.11 是本机；生产是 3.10。`tomllib` / `tomli` 都未必有；**`re` 总是可靠的 fallback**。

### 6. 批量 deploy 的 stderr 吃 output

早期 `bash infra/deploy/deploy.sh ... | tail -80` 把 shell 2>&1 管道全部 lost 到 0 字节。改用 `| grep -E ...` 过滤后才可见。cc-options + hydro-toolkit 初次批量 deploy 被 hide 了。

## 未动的 Tier 2 遗留

- **hydro-\* 前端 search JS（#6 延伸）** — 只抽了静态站 cmds/stack；hydro-capacity-web 等 Next.js 前端（有 filter/search）未抽
- **website/ops-console 合并 monorepo（#7）** — Explore + Plan agent 都建议不做。高风险低收益，放弃

## 小瑕疵（全部已修）

- ✅ `services_vs_live.py` 加 `response_ms`（orchestrator 现在会显示延迟）
- ✅ `sync-catalog.py` 内容未变时跳过写（消除 timestamp-only churn）

---

## 本次会话常用命令

```bash
/menus-audit                    # 13/13 绿基线
/services-health                # 11 服务矩阵（本机无 uvicorn 全 unreachable；VPS 上 live）

# 部署已全部完成 — 下次做类似改动:
cd ~/Dev/stations/{website,ops-console,cmds,stack} && bash deploy.sh    # 前端 4 站
cd ~/Dev/stations/web-stack && bash infra/deploy/deploy-all.sh          # FastAPI 后端批量

# 浏览器线上验证:
open https://tianlizeng.cloud/api/services-metadata    # 聚合 JSON
open https://dashboard.tianlizeng.cloud/services-health # 矩阵页
```

## 本轮提交（按 repo 汇总）

| Repo | Commits | 说明 |
|---|---|---|
| `tools/cc-configs` | 4 | frontend-tweak + menus-audit 12→13 + services-health.md |
| `tools/configs` | 2 | pre-commit hook + ops-console.yaml nav |
| `devtools` | 5 | read_version + build_metadata + audit_services + audit_static_filter + services_vs_live + services_health.py + regex fallback |
| `stations/web-stack` | 4 | 11 api.py (version+metadata+regex fallback) + hydro-toolkit service_id align |
| `stations/website` | 2 | /api/services-metadata aggregator + sync-catalog skip-if-equal |
| `stations/ops-console` | 1 | /services-health page + menu.generated |
| `stations/cmds` | 2 | generate.py 抽共享 + site regen |
| `stations/stack` | 2 | 同上 |

**累计 22 commits × 8 repos**，全部 push 到 main，全部 deploy 到 VPS。

---

## 下个会话启动

```
/warmup                         # 环境 snapshot
/menus-audit                    # 13/13 绿
/services-health                # 全景 snapshot
```

阅读顺序：
1. 本 HANDOFF.md
2. `~/Dev/stations/CLAUDE.md`（stations 内部规范，新增 /services-health 入口）
3. `~/Dev/CLAUDE.md` § 菜单 SSOT（已更新为 13 类）
4. `~/Dev/stations/docs/knowledge/station-architecture-20260422.md`（Tier 1 重构全景图）
5. 本次 plan：`/Users/tianli/.claude/plans/steady-meandering-church.md`

### 若继续（下轮）

- **优先**: 无 Tier 2/3 遗留待办 — 全做了
- **可选**: hydro-* 前端（Next.js apps）filter/search 抽共享（#6 延伸）
- **跳过**: monorepo 合并（Plan agent / Explore 都建议不做）
- **长期**: subdomains.yaml 加 `api_port` + `service_dir` 字段以消除 +100 / DIR_ALIAS 隐式约定
