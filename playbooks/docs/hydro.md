# Playbook · hydro · 水利站 FastAPI + Next.js 迁移 / 改造

> 2026-04-20 立。沉淀自 Streamlit → Next.js 10 站全迁（session-retro-20260420-streamlit-to-nextjs.md）。

## § 定位

**是**：`~/Dev/stations/web-stack/services/hydro-*/api.py` + `~/Dev/stations/web-stack/apps/hydro-*-web/app/page.tsx` 的日常改造、新增、修复、验证编排。覆盖 compute 流程 / 数据预览 / 结果展示 / 图表 / 部署。

**2026-04-20 后端迁移**：10 站后端已从独立 `~/Dev/hydro-*/` 合并进 `~/Dev/stations/web-stack/services/<name>/`（见档 D）。原 `~/Dev/hydro-*/` 保留到 2026-05-04 作 fallback，改动请去新位置。VPS 路径同步到 `/var/www/web-stack/services/<name>/`。

**典型场景**：
- 新加一站 hydro-xxx（先 `/stack-migrate xxx` 再走本 playbook）
- 修一个站的 compute 逻辑 bug
- 加一个 form 参数 / 换一种输出格式
- 改前端预览区 / 新增 chart / 调 tab 顺序

**不是**：
- 第一次做 Streamlit→Next.js 批量迁移 → `mass-migration.md`
- 新建"非水利"主题站 → `web-scaffold.md`
- 站群菜单 / 子域治理 → `stations.md`

---

## § 入场判断

**trigger words**：
- 「hydro-<xxx> 的 api」/「水利站 compute」/「格式化数据 → JSON」
- 「预览区加个表」/「结果 tab 调整」/「加个图表」/「加个参数」
- 「web-stack apps/hydro-*-web」
- 「迁某 streamlit → next」（如果只一站，走 hydro）

**反例**：
- 「把 N 个 hydro 全换掉」→ `mass-migration.md`
- 「nginx 挂了 / ssl 过期」→ `stations.md`
- 「菜单漂移 / navbar」→ `stations.md`

---

## § 编排图

```
用户意图「改/加 hydro-xxx」
  ↓
【入场】          /warmup
  ↓
【定位】          /stack-classify --filter hydro       (确认 repo 存在)
  ↓
【后端】          Edit ~/Dev/stations/web-stack/services/hydro-xxx/api.py
                  ├─ import hydro_api_helpers (df_to_json_safe / build_json_response / cjk_header_safe / cors_origins)
                  └─ format=json 分支返 {preview, meta, results, xlsxBase64|zipBase64}
  ↓
【烟测】          /api-smoke hydro-xxx --compute       (FAIL 回 Edit)
  ↓
【前端】          Edit ~/Dev/stations/web-stack/apps/hydro-xxx-web/app/page.tsx
                  └─ <HydroComputePage config={{…}}/> 50 行配置
                     特殊站留 renderCharts / renderPreview / renderResults 钩子
  ↓
【类型 + build】  pnpm --filter hydro-xxx-web typecheck && build
  ↓
【部署】          bash ~/Dev/stations/web-stack/infra/deploy/deploy.sh hydro-xxx
                  (内含 rsync devtools/lib + verify.py 浏览器闸)
  ↓
【生产验】        curl -F 'file=@sample' -F 'format=json' https://hydro-xxx.tianlizeng.cloud/api/compute
  ↓
【收口】          /ship hydro-xxx web-stack             → git commit + push
```

## § 复用清单

| 动作 | 工具 |
|---|---|
| 进项目看状态 | `/warmup` |
| 搞脚手架（新站） | `/stack-migrate hydro-xxx` |
| 本地 API 烟测 | `/api-smoke hydro-xxx [--compute]` |
| 类型 + build | `pnpm --filter hydro-xxx-web build`（`NEXT_PUBLIC_API_BASE=""` 覆盖 .env.local） |
| 部署 | `bash ~/Dev/stations/web-stack/infra/deploy/deploy.sh hydro-xxx` |
| 浏览器端验证 | `python3 ~/Dev/stations/web-stack/infra/deploy/verify.py hydro-xxx`（deploy.sh 末尾自带） |
| 菜单不漂移 | `/menus-audit` |
| 子域状态 | `/sites-health` |
| 收尾 | `/ship hydro-xxx web-stack` |

## § 共享模块

| 模块 | 作用 | 位置 |
|---|---|---|
| `hydro_api_helpers.py` | 所有 api.py 共享：df_to_json_safe / CJK header / CORS origins / base64 wrapper | `~/Dev/devtools/lib/` |
| `<HydroComputePage>` | 所有 page.tsx 共享：3-step UI + SimpleTable + tabs + base64 下载 + RunProgress | `~/Dev/stations/web-stack/packages/ui/src/patterns/` |
| `RunProgress` | elapsed + estimated 进度条 | 同上 |
| `verify.py` | 部署闸 | `~/Dev/stations/web-stack/infra/deploy/` |

## § 改动边界矩阵

| 要改 | 能动吗 | 改动后要跑 |
|---|---|---|
| `api.py` 的 compute 逻辑 | ✓ | `/api-smoke X --compute` |
| 返回 JSON 的字段（preview/meta/results keys） | ✓ 但要同步改 page.tsx | typecheck + build |
| `page.tsx` 的 UI / chart 渲染 | ✓ | build |
| Form 参数（paramFields） | ✓ | `/api-smoke` |
| `services.ts` 端口 | ✗ 基建稳定，除非加全新站 | `render.py` 重跑 nginx conf + 推 vps |
| nginx / systemd 模板 | ✗ | — |
| `@tlz/ui` 的共享组件 | ⚠️ 动了影响全部消费者 | 全 repo 全 build |
| `hydro_api_helpers.py` | ⚠️ 动了影响全部 api.py | `/api-smoke all` + 重部 |

## § 踩坑清单

1. **`.env.local` 烤 dev URL 进 production bundle** — build 时必须 `NEXT_PUBLIC_API_BASE=""` 覆盖，否则浏览器报"Failed to fetch"。`verify.py` 已加闸。
2. **CJK 不能直接放 HTTP header**（latin-1 only）→ `from hydro_api_helpers import cjk_header_safe` + `Access-Control-Expose-Headers` 列出。
3. **zsh noclobber 挡 `> file` 覆盖** → 脚本一律用 `>|`。
4. **clashx 代理挡 localhost** → `curl` 加 `--noproxy '*'`。
5. **Edit 前必须 Read**（Claude Code harness）— 否则报 "File has not been read yet"。
6. **Next.js standalone 放在 `apps/<name>-web/` 子目录** — systemd 的 `WorkingDirectory` 必须是 `/var/www/%i-web/apps/%i-web`（tlz-web@.service 已对）。
7. **端口按 SSOT**：`services.ts` port + 100 = FastAPI / - 5400 = Next.js dev。`ports.sh` 已实现。
8. **AMAP_API_KEY / 外部凭证**：走 `/etc/tlz/secrets.env`，systemd `EnvironmentFile` 自动加载。
9. **hydro-toolkit 例外**：子域是 `hydro.tianlizeng.cloud`（不是 hydro-toolkit），`/api/plugins` 而非 `/api/meta`。render.py / api-smoke 已特判。

## § 最小 api.py 模板（~50 行）

```python
from __future__ import annotations
import io, sys, time
from pathlib import Path
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
import pandas as pd

for _p in [Path.home()/"Dev/devtools/lib", Path("/var/www/devtools/lib")]:
    if _p.exists(): sys.path.insert(0, str(_p)); break
from hydro_api_helpers import df_to_json_safe, build_json_response, cors_origins

PROJECT_ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(PROJECT_ROOT))
from src.xxx.calc import my_compute  # 替换

app = FastAPI(title="hydro-xxx-api", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=cors_origins("hydro-xxx", 31XX),
                   allow_methods=["GET", "POST"], allow_headers=["*"])

@app.get("/api/health")
def health(): return {"status": "ok"}

@app.get("/api/meta")
def meta(): return {"name": "xxx", "title": "...", "icon": "🌊", "description": "...", "version": "1.0.0"}

@app.post("/api/compute")
async def compute(file: UploadFile = File(...), format: str = Form("xlsx")) -> Response:
    content = await file.read()
    t0 = time.perf_counter()
    df_out, xlsx_bytes = my_compute(content)
    meta = {"elapsedMs": int((time.perf_counter()-t0)*1000)}
    if format == "json":
        return JSONResponse(build_json_response(
            preview={"input": df_to_json_safe(pd.read_excel(io.BytesIO(content)), limit=10)},
            meta=meta,
            results={"计算结果": df_to_json_safe(df_out)},
            xlsx_bytes=xlsx_bytes,
        ))
    return Response(xlsx_bytes, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    headers={"Content-Disposition": 'attachment; filename="result.xlsx"'})
```

## § 最小 page.tsx 模板（~30 行）

```tsx
"use client"
import { HydroComputePage } from "@tlz/ui"

export default function Page() {
  return (
    <HydroComputePage config={{
      title: "计算任务名",
      subtitle: "一句话描述",
      uploadMode: "xlsx",
      resultKind: "xlsx",
      runLabel: "运行 计算",
      resultPrefix: "hydro-xxx_result",
      estimatedSeconds: 30,
      // 可选：paramFields / renderCharts / renderPreview / renderResults
    }} />
  )
}
```

## § 不做（范围外）

- 不引入新图表库（recharts 已够）
- 不搞 SSE / WebSocket 进度（RunProgress 够）
- 不动其他站（改哪站测哪站）
- 不绕过 verify.py 闸

---

## § 跨站共享改动（动一文件影响 N 站）

> 2026-04-20 补。解决"改 1 文件要手写 11 站 build+deploy"的盲区。

**触发场景**（动这些 = 改所有下游消费者）：
- `~/Dev/stations/web-stack/packages/ui/src/patterns/hydro-compute-page.tsx` — 全 hydro 前端共用 UI
- `~/Dev/stations/web-stack/packages/ui/src/**` — `@tlz/ui` 任何被 hydro-*-web 消费的文件（liquid-glass-card / run-progress / stat-card / xlsx-compute-form / ...）
- `~/Dev/devtools/lib/hydro_api_helpers.py` — 全 api.py 共用后端工具（df_to_json_safe / build_json_response / cors_origins / cjk_header_safe）
- `~/Dev/devtools/lib/**` — devtools/lib 任何 Python 模块（被 VPS rsync 到 /var/www/devtools/lib）

**编排图**

```
用户: "我改了 HydroComputePage / hydro_api_helpers"
  ↓
/warmup
  ↓
Edit <shared file>                      # packages/ui/* 或 devtools/lib/*
  ↓
【类型】pnpm --filter '@tlz/ui' typecheck    # packages/* 改必跑
        pnpm -r typecheck                    # 或全量 monorepo 类型
  ↓
【本地烟测】/api-smoke all [--compute]        # devtools/lib 改必跑；packages/* 可略
  ↓
【commit】 cd ~/Dev/stations/web-stack && git add -A && git commit
           cd ~/Dev/devtools  && git add -A && git commit    (若动 lib/)
  ↓
【批量部】/deploy-changed                      # 自动识别扇出：
          ├─ devtools/lib/*     → 全 10 站 hydro + audiobook
          ├─ packages/ui/*      → 全 hydro-*-web（apps 里的前端站）
          ├─ apps/<name>-web/*  → 单 <name> 站
          └─ hydro-<name>/*     → 单 <name> 站
  ↓
【验收】 /sites-health                         # 全站 HTTP 绿
         或逐站 curl https://<name>.tianlizeng.cloud/api/meta
  ↓
/ship web-stack devtools                      # 收口
```

**为什么不手写站名**：`/deploy-changed` 读 `git diff --name-only` 自动映射扇出；动 `devtools/lib` → 全量，动 `packages/*` → 全前端，动单 `apps/<name>-web/` → 单站。脚本在 `~/Dev/devtools/scripts/deploy-changed.sh`。

**改动边界矩阵补一行**（与上方 § 改动边界矩阵合读）：

| 要改 | 能动吗 | 改动后要跑 |
|---|---|---|
| `packages/ui/src/patterns/hydro-compute-page.tsx` | ⚠️ 影响全 hydro 前端 | typecheck → commit → `/deploy-changed` |
| `devtools/lib/hydro_api_helpers.py` | ⚠️ 影响全 api.py | `/api-smoke all --compute` → commit → `/deploy-changed` |
| `packages/ui/src/*`（非 hydro 专用） | ⚠️ 影响所有消费者（含 audiobook） | typecheck → commit → `/deploy-changed` |

**踩坑提醒**：
- `/deploy-changed` 默认 `HEAD~1..HEAD`；如果改跨多 commit 要 `--since origin/main`
- 动 `packages/ui/*` 时要先 `pnpm -r build` 过一遍，防 monorepo workspace symlink 缓存旧产物
- devtools/lib 改后，VPS 端 deploy.sh 会 rsync 到 `/var/www/devtools/lib`，systemd 不需 reload（Python 下次调用新文件即生效）

---

## § 新站脚手架编排（从 0 到在线验收）

> 2026-04-20 补。解决"加新 hydro 站全流程分散"的盲区。整合 /stack-migrate + services.ts 登记 + menus-audit + deploy + /api-smoke。

**触发**：要新加一个 `hydro-<name>`，后端进 `~/Dev/stations/web-stack/services/hydro-<name>/`（monorepo），前端进 `~/Dev/stations/web-stack/apps/hydro-<name>-web/`。

**编排图**

```
【前置】Python 计算逻辑放 ~/Dev/stations/web-stack/services/hydro-<name>/src/xxx/calc.py 形态
  ↓
/warmup
  ↓
/stack-migrate <name>                    # 脚手架两件事：
  ├─ 生成 ~/Dev/stations/web-stack/services/hydro-<name>/api.py  （FastAPI，用 hydro_api_helpers）
  └─ 生成 ~/Dev/stations/web-stack/apps/hydro-<name>-web/
        ├─ app/page.tsx （<HydroComputePage config={...}/>）
        ├─ package.json / next.config.mjs
        └─ .env.local（NEXT_PUBLIC_API_BASE=http://127.0.0.1:<port+100>）
  ↓
【登记 SSOT】Edit ~/Dev/stations/website/lib/services.ts
              加条目：{ name: "hydro-<name>", port: 31XX, kind: "hydro", ... }
                     （端口规则：services.ts port + 100 = FastAPI, -5400 = Next dev）
  ↓
【烟测后端】/api-smoke hydro-<name> --compute
              FAIL → Edit api.py 修
  ↓
【菜单不漂】/menus-audit                  # 8/8 全绿
              （hydro 站自动挂在 navbar.yaml "工具" section，render-navbar -w）
  ↓
【CF 三联】 /cf dns add hydro-<name>
            /cf origin add hydro-<name> <port>
            /cf access add hydro-<name>    # 如需登录保护
            （可并行）
  ↓
【首次部】 bash ~/Dev/stations/web-stack/infra/deploy/deploy.sh hydro-<name>
              内部：rsync + nginx + systemd + verify.py 浏览器闸
  ↓
【生产验】 curl https://hydro-<name>.tianlizeng.cloud/api/meta
            curl -F 'file=@sample' https://hydro-<name>.tianlizeng.cloud/api/compute
  ↓
【导航同步】/navbar-refresh               # 推 navbar 到消费者 repo
  ↓
/ship web-stack hydro-<name> website configs    # 收口
```

**每步要改的文件（绝对路径）**

| 步骤 | 文件 / 命令 | 破坏性？|
|---|---|---|
| 脚手架 | `~/Dev/stations/web-stack/services/hydro-<name>/api.py`（新建）+ `~/Dev/stations/web-stack/apps/hydro-<name>-web/` 整个目录 | 非破坏（新建） |
| SSOT 登记 | `~/Dev/stations/website/lib/services.ts`（加 entry） | **半破坏**（影响全站目录） |
| 菜单检查 | `~/Dev/tools/configs/menus/navbar.yaml`（可能自动）+ 跑 `menus.py render-navbar -w` | 半破坏 |
| CF 配置 | CF DNS + Origin Rule + Access（API 写入） | **破坏性**（生产） |
| 部署 | VPS `/var/www/web-stack/services/hydro-<name>/` (API) + `/var/www/hydro-<name>-web/` (Next) + nginx conf + systemd | **破坏性**（生产） |

**并行窗口**：
- `/cf dns add` `/cf origin add` `/cf access add` 三步互不依赖，可同 message 并发
- `/menus-audit` 和 `/api-smoke` 独立，可并发

**模板引用**（别复制）：
- 最小 api.py → 见本文件 § 最小 api.py 模板
- 最小 page.tsx → 见本文件 § 最小 page.tsx 模板
- `/stack-migrate` 会从这两个模板生成初版，只需按业务改 `my_compute` 入口和 `config={}` 字段

**踩坑提醒**：
- `services.ts` 端口必须唯一；查现有端口用 `grep -E "port:" ~/Dev/stations/website/lib/services.ts`
- 新站第一次 deploy.sh 前确认 `/etc/tlz/secrets.env` 没漏（AMAP_API_KEY 等）
- `hydro-toolkit` 是特例（子域是 `hydro.`，非 `hydro-toolkit.`），新站别学它
- `verify.py` 部署闸会 `curl bundle`；若 `.env.local` 烤了 dev URL 会 FAIL，build 时 `NEXT_PUBLIC_API_BASE=""` 覆盖
