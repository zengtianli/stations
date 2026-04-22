# HANDOFF · cc-options · 2026-04-21

> 上次会话把 cc-options 从 Streamlit 迁成 Next.js + FastAPI。**MVP（P0）已上线**，你要做的是 **P1 细化**。

## 线上现状（不要动，除非你要 rollback）

| 项 | 值 |
|---|---|
| 域名 | https://cc-options.tianlizeng.cloud（CF Access 邮箱验证码） |
| 前端 | Next.js 15 standalone · port **3121** · systemd `tlz-web@cc-options` |
| 后端 | FastAPI · port **8621** · systemd `tlz-api@cc-options` |
| 数据 | `/var/www/cc-options/data/{portfolio,activities}.json + daily_nlv.csv` |
| 数据刷新 | 本地 LaunchAgent 17:00 → `daily_update.sh` → `sync-data.sh` → VPS |
| 旧 Streamlit | 2 units（`cc-chat` + `rh-dashboard`）**inactive + disabled**；旧代码在 `_archive-streamlit/` |

## 你手里的 3 个工作目录

**主目录**（读 README.md / DOMAIN.md / MIGRATE-PLAN.md 对齐上下文）：
```
~/Dev/stations/cc-options/
```

**前端代码**（要加 NLV 曲线图 / scenarios 卡 / roll signals）：
```
~/Dev/stations/web-stack/apps/cc-options-web/
  └─ app/page.tsx        ← 目前只有 P0 (4 卡 + 持仓表)
  └─ app/layout.tsx
  └─ next.config.mjs     ← rewrites /api/* → 127.0.0.1:8621
```

**后端代码**（要加 `/api/scenarios` 等 Greeks 端点）：
```
~/Dev/stations/web-stack/services/cc-options/
  └─ api.py              ← 目前 5 个只读端点
  └─ pyproject.toml
```

`lib_greeks.py` 还在 `~/Dev/stations/cc-options/lib_greeks.py`，P1 会被 FastAPI import（要么 copy 到 services/cc-options/，要么 sys.path trick）。

---

## P1 任务清单（按难度排）

### P1.1 · NLV 曲线图（约 30 min）

**目标**：page.tsx 新增"NLV 曲线"卡，显示 `daily_nlv.csv` 的时间序列（nlv / qqq_close / cash）

**步骤**：
1. `cd ~/Dev/stations/web-stack` → `pnpm --filter cc-options-web add recharts`（或 `lightweight-charts` 更专业，看偏好）
2. 改 `apps/cc-options-web/app/page.tsx`：
   - 新加 `useState<Row[]>` for equity curve
   - 新 `fetch("/api/equity-curve")` 拉 `rows` 数组
   - 加一个 `<LiquidGlassCard>` 包着 `<LineChart>`（recharts 示例）
3. 测：`pnpm --filter cc-options-web dev`（先 `/api-smoke cc-options` 确保后端跑）
4. 部署：`cd ~/Dev/stations/cc-options && bash deploy.sh`
5. `/ship web-stack`

**后端不用改** — `/api/equity-curve` 已经返全量 rows。

---

### P1.2 · Greeks 场景分析（约 60 min）

**目标**：加 `/api/scenarios?delta_shift=0.05`，调用 `lib_greeks.compute_scenarios`，前端渲染一张场景表

**步骤**：
1. **后端**：
   - 把 `~/Dev/stations/cc-options/lib_greeks.py` `cp` 到 `~/Dev/stations/web-stack/services/cc-options/lib_greeks.py`（独立副本，不 symlink — deploy 要上 VPS）
   - 同步把 `lib_greeks.py` 的 pandas/numpy/scipy 依赖加进 `services/cc-options/pyproject.toml`：
     ```toml
     dependencies = [
         "fastapi>=0.115.0",
         "uvicorn>=0.32.0",
         "pandas>=2.0",
         "numpy>=1.24",
         "scipy>=1.11",
     ]
     ```
   - `api.py` 加：
     ```python
     from lib_greeks import process_portfolio, compute_scenarios
     
     @app.get("/api/scenarios")
     def scenarios(delta_shift: float = 0.05):
         p = _read_json(DATA_DIR / "portfolio.json")
         processed = process_portfolio(p)
         return compute_scenarios(processed, delta_shift=delta_shift)
     ```
   - **本地验**：`cd ~/Dev/stations/web-stack/services/cc-options && CC_OPTIONS_DATA_DIR=~/Dev/stations/cc-options/data uv run uvicorn api:app --port 8621` → `curl http://127.0.0.1:8621/api/scenarios`
   - 若 `lib_greeks` 依赖 `st_snapshot.py` 的 data loader，抽出来放 `lib_portfolio_loader.py` 纯数据读取（不能有 Streamlit）

2. **前端**：`page.tsx` 加 `<ScenariosCard />` 组件，`fetch("/api/scenarios")` + 渲染表（delta / gamma / theta / vega 按合约）

3. `bash deploy.sh` + `/ship web-stack`

**⚠️ 坑位**：
- `lib_greeks.py` 可能用到本地 `.env`（读 HSBC/IBKR 利率）→ **绝不要** `.env` 上 VPS。改成从 JSON 读常量或硬编码
- 旧 `app.py` 的 `compute_scenarios` 调用参数翻出来看一遍，端点签名对齐

---

### P1.3 · Roll signals + Margin savings 卡（约 30 min）

**目标**：加 `/api/roll-signals` + `/api/margin-savings` 两个端点，前端加两张卡

直接照抄 P1.2 的路线：
- `api.py` 新 endpoint 调 `lib_greeks.compute_roll_signals` / `compute_margin_savings`
- `page.tsx` 新 `<RollSignalsCard />` + `<MarginSavingsCard />`

---

### P1.4 · 历史交易流水大表（约 30 min）

**目标**：底部加一张分页表，列 recent 100 条 activities

**步骤**：
1. 后端已有 `/api/activities?limit=100` ✓ 不用改
2. 前端 page.tsx 加 `<ActivitiesTable />`（分页列 symbol / option_symbol / side / quantity / price / created_at）
3. 可以用 shadcn/ui Table + pagination，或简单 10 行 `<table>`

---

### P1.5 · 清退 `cc.tianlizeng.cloud` 旧备用 vhost（5 min）

**目标**：下线历史遗留的备用子域

**步骤**：
```bash
python3 ~/Dev/devtools/lib/tools/cf_api.py dns list | grep "cc\.tianlizeng"
# 如果还在：
python3 ~/Dev/devtools/lib/tools/cf_api.py dns delete cc.tianlizeng.cloud
# nginx vhost：
ssh root@104.218.100.67 "rm /etc/nginx/sites-enabled/cc.tianlizeng.cloud && nginx -t && systemctl reload nginx"
# 或用 /site-archive cc（会自动走完 DNS + Origin + nginx）
```

---

## 本地验证口令（每做完一个 P1 都跑）

```bash
# FastAPI 端点烟测
/api-smoke cc-options

# 本地 Next dev 验页面
cd ~/Dev/stations/web-stack
pnpm --filter cc-options-web dev       # 另一个 terminal curl http://127.0.0.1:3121/

# 生产发布
cd ~/Dev/stations/cc-options
bash deploy.sh                          # 自动 sync-data + web-stack deploy cc-options

# 跨 repo 提交
/ship web-stack                         # 或 /ship web-stack cc-options（后者不是 git repo，会跳过）

# 全站健康
/sites-health
```

---

## Rollback（页面挂了回滚到 Streamlit）

```bash
ssh root@104.218.100.67 '
  sed -i "s|:3121;|:8521;|" /etc/nginx/sites-available/cc-options.tianlizeng.cloud
  nginx -t && systemctl reload nginx
  systemctl enable --now cc-chat
'
```

这会把 nginx proxy_pass 切回 8521 + 重启旧 Streamlit service。

---

## 参考文档

- `~/Dev/stations/cc-options/README.md` — 当前架构图
- `~/Dev/stations/cc-options/DOMAIN.md` — 域名 / 部署 / 切换流程
- `~/Dev/stations/cc-options/MIGRATE-PLAN.md` — 原迁移计划（含 P0/P1/P2 优先级表）
- `~/Dev/stations/docs/knowledge/session-retro-20260421-cc-options-migrate.md` — 本次 retro playbook
- `~/Dev/stations/web-stack/services/cc-options/CLAUDE.md` — FastAPI wrapper 说明 + 端点清单

---

## 给下一个 session CC 的一句话

> "继续 cc-options 的 P1。读 `~/Dev/stations/cc-options/HANDOFF.md` 和 `MIGRATE-PLAN.md`。先做 P1.1 NLV 曲线，再 P1.2 Greeks scenarios。本地验证先 `/api-smoke cc-options`，最后 `bash deploy.sh` 走 web-stack 统一部署。"
