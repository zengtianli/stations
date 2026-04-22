# cc-options — QQQ CC Dashboard API

FastAPI 只读 wrapper，暴露 `~/Dev/stations/cc-options/data/*.json` + `daily_nlv.csv`。**永不需要金融凭证** — 所有 HSBC/IBKR 拉数据脚本留在本地。

## Quick Reference

| 项目 | 路径/值 |
|------|---------|
| 入口 | `api.py` (FastAPI，VPS 上由 `tlz-api@cc-options.service` 拉起) |
| 前端 | `~/Dev/stations/web-stack/apps/cc-options-web/` |
| 生产 URL | https://cc-options.tianlizeng.cloud（CF Access） |
| API 端口 | 8621（原 Streamlit 8521 + 100） |
| Web 端口 | 3121（8521 - 5400，按 ports.sh 约定） |
| 数据源路径 | VPS: `/var/www/cc-options/data/` · 本地 dev: `~/Dev/stations/cc-options/data/` |
| 数据同步 | `~/Dev/stations/cc-options/sync-data.sh`（本地 LaunchAgent 17:00 触发，白名单 rsync） |

## 端点

| Path | 返回 |
|---|---|
| `/api/health` | `{status, data_dir, data_available}` |
| `/api/meta` | 每个数据文件的 size+mtime（前端用来显示新鲜度） |
| `/api/portfolio` | `portfolio.json` 原文（账户 + 持仓） |
| `/api/activities?limit=100` | `activities.json` 的 `activities[:limit]` |
| `/api/equity-curve` | `daily_nlv.csv` 转 JSON 行数组 |
| `/api/summary` | 一次性汇总：最新 NLV 行 + 账户总值（用于顶部 metric 卡） |

## 常用命令

```bash
cd ~/Dev/stations/web-stack/services/cc-options

# 本地起（指向本地数据）
CC_OPTIONS_DATA_DIR=~/Dev/stations/cc-options/data \
    uv run uvicorn api:app --host 127.0.0.1 --port 8621 --reload

# 本地烟测（自动起停 + 端点校验）
bash ~/Dev/devtools/scripts/api-smoke.sh cc-options

# 查数据新鲜度
curl http://127.0.0.1:8621/api/meta
```

## 部署

走 web-stack/infra/deploy/deploy.sh:

```bash
cd ~/Dev/stations/web-stack
bash infra/deploy/deploy.sh cc-options
```

它会：
1. rsync Python → `/var/www/web-stack/services/cc-options/`
2. `pnpm --filter cc-options-web build` → rsync standalone → `/var/www/cc-options-web/`
3. systemd restart `tlz-api@cc-options` + `tlz-web@cc-options`
4. smoke test 8621 `/api/health` + 3121 `/`

**前置条件**：VPS `/var/www/cc-options/data/` 已有最新 JSON（由本地 sync-data.sh rsync）。

## 金融安全约束（硬规则）

- `.env` / `.streamlit/secrets.toml` / `data/*.raw.*`：**永远不上 VPS**，不入任何 rsync
- 只传产物：`portfolio.json`, `activities.json`, `daily_nlv.csv`（白名单）
- FastAPI 不 import 任何 `st_*.py`（那些需要凭证）
- `lib_greeks.py` 如果 P1 要用，只做纯数值计算，不读 .env

## 未来（P1/P2）

- `/api/scenarios` — 调 `lib_greeks.compute_scenarios` 做 Greeks 场景分析（需把 `lib_greeks.py` 拷到本目录或 symlink）
- `/api/roll-signals` — `compute_roll_signals`
- `/api/margin-savings` — `compute_margin_savings`
