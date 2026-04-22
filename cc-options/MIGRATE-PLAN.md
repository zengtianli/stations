# cc-options 迁移计划：Streamlit → Next.js（走 web-stack）

> **✅ 2026-04-21 MVP 已上线**（Phase 1-6 全部落地，P0 卡片 + 持仓表可用）。P1（NLV 曲线图、scenarios、roll signals、margin savings）待后续迭代。
>
> 线上：https://cc-options.tianlizeng.cloud（CF Access）· 架构：Next.js 15 standalone + FastAPI wrapper

## 目标

把 `cc-options.tianlizeng.cloud` 从 Streamlit（端口 8521）切成 Next.js 14 + FastAPI wrapper（web-stack 模式），同 `hydro-toolkit-web` 那套架构。

**保持不变**：
- 子域 `cc-options.tianlizeng.cloud`
- CF Access 邮箱认证
- 本地 LaunchAgent 17:00 跑 `daily_update.sh` 生成 data/
- 金融 `.env` / data/ 绝不上 VPS 的 git 或 bundle

**预计时长**：~90 min 全部落完（含验证）。

---

## 端口 & 路径规划

| 组件 | 端口 | 路径 |
|---|---|---|
| 旧 Streamlit（下线） | 8521 | VPS `/var/www/cc-options`（streamlit 进程） |
| FastAPI wrapper（新） | **8621** | `~/Dev/stations/web-stack/services/cc-options/` |
| Next.js standalone（新） | **3121** | `~/Dev/stations/web-stack/apps/cc-options-web/` |
| Next.js dev | 3121 | 同上 |
| CF Origin Rule | → `127.0.0.1:3121` | 原来是 `:8521`，cutover 要切 |

`ports.sh` 要加：`[cc-options]=8521` 到 `STREAMLIT_PORT` 字典。

---

## 数据管道（关键 — 金融安全）

```
┌────────────────────────┐  LaunchAgent 17:00 (本地)
│ ~/Dev/stations/cc-options/daily_update.sh │
│  ├─ st_snapshot.py   → portfolio.json     │  需 HSBC/IBKR .env
│  ├─ st_activities.py → activities.json    │  本地跑不上 VPS
│  ├─ phase2_equity_curve.py → daily_nlv.csv│
│  └─ dashboard.py     → dashboard.md       │
└─────┬──────────────────┘
      │ (新加一步)
      ▼
┌──────────────────────────┐
│ sync-data.sh             │  rsync 本地 data/*.json,*.csv
│  (不含 .env, 只传产物)   │  → VPS /var/www/cc-options/data/
└─────┬────────────────────┘
      ▼
┌──────────────────────────┐
│ VPS FastAPI :8621        │  读 /var/www/cc-options/data/*.json
│  /api/portfolio          │  → 返 JSON
│  /api/activities         │  → 返 JSON
│  /api/equity-curve       │  → 返 JSON（csv 转 json）
│  /api/scenarios          │  → 调 lib_greeks 计算
└─────┬────────────────────┘
      ▼
┌──────────────────────────┐
│ Next.js :3121 (standalone)│  same-origin /api/* rewrites → :8621
│  app/page.tsx            │  渲染 Metric + 图 + 表
└──────────────────────────┘
```

**`.env` / `.venv` / `__pycache__` / `data/*.raw.*` 永不 rsync。** `sync-data.sh` 只 rsync 产出的 `portfolio.json` / `activities.json` / `daily_nlv.csv`，白名单 include，不 sync 全量 data/。

---

## 执行步骤

### Phase 0 — 前置（5 min，只读）
- [x] 已知 port 8521 被 streamlit 占着（pid 115998）
- [x] services.ts 已有 cc-options 条目（port 8521）
- [x] CF Access 已配（sess=24h）
- [ ] 拉 hydro-toolkit-web 作为脚手架模板：读 `next.config.mjs` / `package.json` / `app/page.tsx` / `app/layout.tsx`

### Phase 1 — 脚手架（15 min，新建文件，零破坏）
- [ ] `mkdir -p ~/Dev/stations/web-stack/apps/cc-options-web`，复制 hydro-toolkit-web 的：
  - `next.config.mjs`（改 rewrites destination 到 `127.0.0.1:8621`）
  - `package.json`（改 `name: "cc-options-web"`，`dev -p 3121`）
  - `tsconfig.json` / `postcss.config.mjs` / `tailwind.config.ts`
  - `app/layout.tsx` / `app/globals.css` / `app/page.tsx`（骨架，内容 TBD）
- [ ] `pnpm install`（一次，monorepo 自动 link）
- [ ] `mkdir -p ~/Dev/stations/web-stack/services/cc-options`，写 `api.py`：
  ```python
  from fastapi import FastAPI
  from pathlib import Path
  import json, csv
  app = FastAPI()
  DATA = Path(__file__).resolve().parent.parent.parent / "data"  # /var/www/cc-options/data
  # /api/health, /api/meta, /api/portfolio, /api/activities, /api/equity-curve
  ```
  - 头 3 个端点先只返读 JSON（不调 lib_greeks）
- [ ] `services/cc-options/requirements.txt`：`fastapi uvicorn pandas numpy`

### Phase 2 — 复刻 UI（30 min，最花时间的一步）
Streamlit `app.py` 1282 行分 ~8 个 section。按优先级先做 MVP：

| Section | 优先级 | Next 组件 |
|---|---|---|
| Portfolio Overview（metric 卡） | P0 | `<Metric />` shadcn Card |
| 当前持仓表 | P0 | shadcn Table |
| NLV 曲线 | P1 | recharts / `react-plotly.js` |
| 场景分析（Greeks） | P1 | 依赖 FastAPI `/api/scenarios` |
| Roll signals | P2 | 同上 |
| Margin savings | P2 | 同上 |
| 历史交易流水 | P2 | 大表 |
| CSS + 主题 | P0 | 对齐 website 的 Apple 风（liquid glass） |

**MVP = P0**（卡片 + 表格，先能看到数据），其他留 TODO。

### Phase 3 — 数据管道（10 min）
- [ ] 写 `~/Dev/stations/cc-options/sync-data.sh`：
  ```bash
  #!/bin/bash
  set -e
  source ~/Dev/devtools/lib/vps_config.sh
  REMOTE_DATA="/var/www/cc-options/data"
  cd "$(dirname "$0")"
  # 只传白名单 — 不要 .env / raw_* / settings
  rsync -avz \
    data/portfolio.json \
    data/activities.json \
    data/daily_nlv.csv \
    "$VPS:$REMOTE_DATA/"
  ```
- [ ] 修 `daily_update.sh` 最后加一行：`bash sync-data.sh`（LaunchAgent 自动传）

### Phase 4 — 本地验证（10 min）
- [ ] `cd web-stack/services/cc-options && uv run uvicorn api:app --port 8621` 本地起
- [ ] `curl http://127.0.0.1:8621/api/portfolio` 返 JSON
- [ ] `cd web-stack/apps/cc-options-web && pnpm dev` 开 `http://127.0.0.1:3121/`
- [ ] 浏览器肉眼验 MVP 页面渲染出 Portfolio 卡 + 持仓表
- [ ] `pnpm build` 成功（standalone 能出包）
- [ ] `api-smoke` skill 跑一次

### Phase 5 — VPS 切换（cutover，10 min，**破坏性、要确认**）

⚠️ 这一步之前我会**暂停一次**问你 go/no-go。

1. **先传一次数据**（不破坏旧站）：
   ```bash
   bash ~/Dev/stations/cc-options/sync-data.sh
   ```
2. **deploy Next 版本**（同 hydro-capacity 那条路）：
   ```bash
   cd ~/Dev/stations/web-stack
   bash infra/deploy/deploy.sh cc-options
   ```
3. **切 CF Origin Rule**：`cc-options.tianlizeng.cloud` → `127.0.0.1:3121`（原 8521）
   ```bash
   python3 ~/Dev/devtools/lib/tools/cf_api.py origin update cc-options.tianlizeng.cloud 3121
   ```
4. **停旧 Streamlit**：
   ```bash
   ssh root@104.218.100.67 "pkill -f 'streamlit.*8521' || true"
   ```
5. **验证**：
   ```bash
   curl --noproxy '*' -sI https://cc-options.tianlizeng.cloud | head -1
   # 期望 302（CF Access 拦截未登录）
   ```
   然后浏览器登录看新页面。

### Phase 6 — 旧 Streamlit 代码收尾（5 min）
- [ ] 把 `app.py` / `rb_snapshot.py` 等 Streamlit only 文件移到 `~/Dev/stations/cc-options/_archive-streamlit/`（不删，留做参考）
- [ ] `README.md` 和 `DOMAIN.md` 更新：架构变成 Next.js + FastAPI
- [ ] 保留的核心文件：
  - `lib_greeks.py`（FastAPI 会 import）
  - `st_snapshot.py` / `st_activities.py` / `phase2_equity_curve.py` / `dashboard.py`（本地数据生成仍然用）
  - `daily_update.sh` / `deploy.sh`（旧 Streamlit deploy.sh 作废，改向 web-stack 那个）
  - `.env` / `.gitignore`（不变）

### Phase 7 — 提交（5 min）
- cc-options 不是 git repo：只需归档 Streamlit 代码到 `_archive-streamlit/`
- web-stack：commit 新 `apps/cc-options-web/` + `services/cc-options/` + `infra/deploy/ports.sh` → push
- website：commit services.ts 如有改动（若 port 从 8521 改到 3121 需同步；这一步后面决定）

---

## 回滚预案

如果 Phase 5 切完页面挂了：

```bash
# 1. 把 CF Origin Rule 切回 8521
python3 ~/Dev/devtools/lib/tools/cf_api.py origin update cc-options.tianlizeng.cloud 8521
# 2. 重启 streamlit（本机 .env 还在 VPS 上？要 check；若不在就从本地的 daily_update.sh 复现）
ssh root@104.218.100.67 "cd /var/www/cc-options && nohup streamlit run app.py --server.port 8521 &"
```

---

## 开干前要你决定的 3 件事

1. **MVP 范围**：P0（卡片 + 持仓表）够了，P1/P2 分批做？还是一次做到 P1（含 NLV 曲线）？
2. **Phase 5 cutover** 我做到之前会停下问你 — 是你手动切 CF Origin，还是我直接切？
3. **旧 Streamlit 代码归档位置**：`_archive-streamlit/`（本地保留）还是直接删除？

默认我会按：P0 MVP / 我帮你切 CF Origin / 归档到 `_archive-streamlit/`。你可以覆盖任何一项。
