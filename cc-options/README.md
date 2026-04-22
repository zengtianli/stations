# cc-options

QQQ Covered Call Dashboard — 期权交易追踪 + 风险监控 + 每日 NLV 曲线。

## 在线访问

- https://cc-options.tianlizeng.cloud（CF Access 邮箱验证码）
- 架构：**Next.js 15 standalone**（前端）+ **FastAPI**（后端，只读 `data/*.json`）
- 旧 Streamlit 版本已归档到 `_archive-streamlit/`（2026-04-21 迁移）

## 架构（2026-04-21 起）

```
┌────────────────────────────────────┐
│ 本地（有金融凭证 .env）            │
│  LaunchAgent 17:00 触发            │
│    daily_update.sh                 │
│      ├─ st_snapshot.py (持仓)      │
│      ├─ st_activities.py (流水)    │
│      ├─ phase2_equity_curve.py (NLV)│
│      ├─ dashboard.py (CLI md)      │
│      └─ sync-data.sh (rsync 白名单)│
└─────────────┬──────────────────────┘
              │ 只传 3 个产物
              ▼
┌────────────────────────────────────┐
│ VPS /var/www/cc-options/data/      │
│  portfolio.json / activities.json  │
│  daily_nlv.csv                     │
└─────────────┬──────────────────────┘
              ▼
┌────────────────────────────────────┐
│ FastAPI :8621                      │
│  (~/Dev/stations/web-stack/        │
│     services/cc-options/api.py)    │
└─────────────┬──────────────────────┘
              ▼
┌────────────────────────────────────┐
│ Next.js :3121 (standalone)         │
│  (~/Dev/stations/web-stack/apps/   │
│     cc-options-web/)               │
│  nginx 8443 → 3121 → /api/* → 8621 │
└────────────────────────────────────┘
```

## 项目结构

```
cc-options/
├── lib_greeks.py           # 期权 Greeks 计算（未来 FastAPI /api/scenarios 用）
├── st_snapshot.py          # 拉持仓快照 → data/portfolio.json
├── st_activities.py        # 拉交易流水 → data/activities.json
├── phase2_equity_curve.py  # 重建 NLV 曲线 → data/daily_nlv.csv
├── dashboard.py            # 生成 CLI dashboard.md
├── daily_update.sh         # LaunchAgent 17:00 串联以上 + sync-data.sh
├── sync-data.sh            # 白名单 rsync 3 个产物 → VPS /var/www/cc-options/data/
├── deploy.sh               # 薄包装：sync-data + web-stack deploy
├── data/                   # 本地产物（.gitignore，永不 rsync 整目录）
├── .env                    # ⚠️ 凭证：HSBC + IBKR + wire routing。永不入 git / VPS
└── _archive-streamlit/     # 旧 Streamlit 代码（app.py + 旧 deploy.sh）
```

前端 + 后端代码在别处：
- Next.js: `~/Dev/stations/web-stack/apps/cc-options-web/`
- FastAPI: `~/Dev/stations/web-stack/services/cc-options/`

## 凭证管理

- `.env` 含 HSBC US/HK + IBKR + wire routing + SWIFT 等敏感金融账号
- `.gitignore` 已排除 `.env` / `.env.*` / `.streamlit/secrets.toml` / `data/` / `.DS_Store`
- **本仓库当前不是 git repo**（未推 GitHub）
- `sync-data.sh` 白名单只传 `portfolio.json` / `activities.json` / `daily_nlv.csv`，`.env` + 数据源脚本永不上 VPS

## 每日数据流

LaunchAgent 17:00（美股收盘后）触发 `daily_update.sh`：

1. `st_snapshot.py` — 拉持仓 → `data/portfolio.json`
2. `st_activities.py` — 拉交易流水 → `data/activities.json`
3. `phase2_equity_curve.py` — 重建历史 NLV → `data/daily_nlv.csv`
4. `dashboard.py` — 生成本地 CLI `dashboard.md`
5. `sync-data.sh` — 白名单 rsync 前 3 个 → VPS

## 部署 / 重新生成前端

```bash
# 标准部署（data + Next + FastAPI 一把）
bash deploy.sh

# 等价于：
# bash sync-data.sh
# bash ~/Dev/stations/web-stack/infra/deploy/deploy.sh cc-options
```

第一次部署后（2026-04-21 完成），日常只需要等 17:00 LaunchAgent 自动跑，前端会读新数据自动刷新（无需重新 build，除非 Next 代码改了）。

## 数据源

- Robinhood（持仓 + 交易流水）
- 美股价格：从 Robinhood snapshot 派生
- 凭证读 `~/Dev/stations/cc-options/.env`（不入 git / VPS）

## 依赖

- 本地：Python 3.14+，`uv` 管理 `.venv`
- 本地数据脚本：pandas / scipy（Greeks）/ blinker
- VPS FastAPI：fastapi / uvicorn（见 `web-stack/services/cc-options/requirements.txt`）
- VPS Next：Next 15 + React 19 + @tlz/ui（见 `web-stack/apps/cc-options-web/package.json`）

## 域名 / 下线流程

见 `DOMAIN.md`。迁移过程见 `MIGRATE-PLAN.md`。
