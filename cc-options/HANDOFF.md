# Handoff · cc-options · 2026-04-21

> P2 上线：Streamlit 5 tab 要素全部照搬 + SPY/QQQ/TQQQ benchmark + 刷新按钮。用户说"还有些要微调的地方"留给新会话。

## 当前进展

### 已上线（commits: `7c7127d` → `292c357` → `4be8383` → `cafd3fc` → `28b7865`）

**数据管道**（本地，非 git 仓库）：
- `phase2_equity_curve.py` · `fetch_qqq` → `fetch_ticker(ticker, range)` 泛化，同时拉 QQQ / SPY / TQQQ（Yahoo Finance chart API）
- `daily_nlv.csv` · 加列 `spy_close, tqqq_close`，瘦身到 **>= 2025-01-01**（325 行，去掉 2021-2024）
- `daily_update.sh` · 给 `st_activities.py` 加了 1 次重试（防 SnapTrade 504 把 `&&` 链打断）

**后端**（`~/Dev/stations/web-stack/services/cc-options/api.py`）：
- `/api/scenarios` · `current` 补 `effective_theta`（DTE≥1 过滤）+ `opt_rows` 全字段
- `/api/scenarios` · 接 `pcts` 参数（`-2,-1,-0.5,0,0.5,1,2`）
- `/api/twr?start=` · CC/SPY/QQQ/TQQQ 4 条归一化曲线（base=100）
- `/api/perf-metrics?start=` · 4 策略 annual/sharpe/sortino/max_dd/total（纯 Python，无 pandas）
- `/api/activities` · P1 修了排序 bug（按 trade_date desc）

**前端**（`~/Dev/stations/web-stack/apps/cc-options-web/app/`）：
- 重组为 **9 个章节单页滚动**（不用物理 tabs）：资产结构 → 收支 → 风险 → 绩效（NLV+metrics）→ 收益对比 bar → 情景分析 → 期权（Roll 信号+Table A+Table B+Roll 明细+Summary）→ 持仓 → 历史流水
- `types.ts` · 共享类型（Current / OptRow / PerfMetric / RollSignal 等）
- `RefreshButton.tsx` · SiteHeader 右上角，点击弹 modal 显示命令 + 一键复制 + alias 建议
- `NLVChart` · 重写 4 条归一化曲线 + Range 按钮（1M/3M/6M/1Y/YTD）
- 删：`ThetaDeltaCard.tsx` / `RollSignalsCard.tsx` / `MarginSavingsCard.tsx`（被 section 组件取代）

**数据最新**（VPS 当前值）：
- NLV **$1,063,990**（4800 股 @ $649.77）
- 期权 **9 张** · 有效 Theta（DTE≥1）**$487.25/day**
- 绩效 · CC 实盘 2025 以来 +31.18% 年化 23.7% Sharpe 0.88 · SPY +21.55% · QQQ +27.02% · TQQQ +48.54%

**运维清理**：
- `cc.tianlizeng.cloud` 旧备用域已 `/site-archive cc --yes` 清退（CF DNS + Origin Rule 都删了，`scheduled-archives.json` 已清空）
- cc-chat + rh-dashboard systemd service 继续 inactive+disabled（迁移前就这样）

## 待完成

用户说"还有些要微调的地方"——具体微调项未明。下面是**已知可能的微调点**，新会话开始前先确认用户想改什么：

- [ ] **Scenarios 情景网格默认值调整**
  - 当前默认 `"-2,-1,-0.5,0,0.5,1,2"` + 天数默认 30 天
  - 用户可能想改默认、或加快捷预设（例如 "窄幅""宽幅""黑天鹅"三个按钮）
  - 改点：`app/components/ScenariosCard.tsx` L32 `pctsInput` initial state

- [ ] **NLVChart TQQQ 归一化视觉**
  - 2025 累计 +48% vs CC +31% · 视觉上 TQQQ 线会明显跳出
  - 若嫌跳跃可给 TQQQ 右 Y 轴单独 scale（已在 plan §12 #2 标记为"实测看"）
  - 改点：`app/components/NLVChart.tsx` 加 `yAxisId="right"` 给 TQQQ Line

- [ ] **OptionsSection · Roll 信号卡"目标合约"缺失**
  - 旧 Streamlit `render_signal_card` L730-747 会根据 action 给出 `target`（"→ 585C 05/21 ~12%年化"）
  - 当前新版 SignalCard 没展示 target（只有 action + reasons + TV 进度条）
  - 改点：`app/components/OptionsSection.tsx` 补 `target` 字段计算 + 展示
  - 公式：ASSIGN 默认目标 `round(qqq_price)` strike 30 DTE；ROLL 保持当前 strike 30 DTE；其它 "-"

- [ ] **指标卡的"涨/跌"趋势箭头**
  - StatCard 有 `trend: "up" | "down" | "flat"` 但当前所有卡硬编码
  - NLV / Theta / Leverage 应该对比昨日 · 要查 `daily_nlv.csv` 倒数第二行
  - 可加 `/api/summary` 的 prev_nlv 字段，前端算 trend

- [ ] **ReturnBarChart 少了 SPY/TQQQ**
  - 当前只画 CC vs QQQ 两条
  - 用户可能想要 4 条全在（但 grouped bar 4 色会拥挤）
  - 或给 SPY/TQQQ 一个过滤 checkbox

- [ ] **风险区 Sharpe 数据源**
  - 当前 `IncomeSection` 直接用 `perf-metrics` 的 CC Sharpe
  - 旧 Streamlit 是按 sidebar 的 "Performance 起点" 动态算，当前硬编 `start=2025-01-01`
  - 可加 `<RangeSelector>` 跟 NLVChart 联动

- [ ] **持仓表加总行**
  - 当前 positions table 只显示逐行，没有 Total Market Value / Total PnL 行

## 关键文件

### 数据管道（本地，非 git repo，不同步 GitHub）
| 文件 | 说明 |
|---|---|
| `/Users/tianli/Dev/stations/cc-options/phase2_equity_curve.py` | 全量 / 增量 replay 生成 daily_nlv.csv，含 3-ticker fetch 泛化 |
| `/Users/tianli/Dev/stations/cc-options/daily_update.sh` | LaunchAgent 17:00 触发，含 activities 重试 |
| `/Users/tianli/Dev/stations/cc-options/sync-data.sh` | 3 产物白名单 rsync 到 VPS（不传 .env） |
| `/Users/tianli/Dev/stations/cc-options/lib_greeks.py` | 原源，已 copy 到 services/cc-options/（不 symlink） |
| `/Users/tianli/Dev/stations/cc-options/st_snapshot.py` | SnapTrade 拉 portfolio.json |
| `/Users/tianli/Dev/stations/cc-options/st_activities.py` | SnapTrade 拉 activities.json |
| `/Users/tianli/Dev/stations/cc-options/_archive-streamlit/app.py` | **UI spec 真源**（L1-1282，Tab1 总览 / Tab2 风险 / Tab3 期权 / Tab4 绩效 / Tab5 情景） |

### 后端（web-stack repo）
| 文件 | 说明 |
|---|---|
| `/Users/tianli/Dev/stations/web-stack/services/cc-options/api.py` | FastAPI · 11 个端点（health / meta / portfolio / activities / equity-curve / summary / scenarios / roll-signals / twr / perf-metrics） |
| `/Users/tianli/Dev/stations/web-stack/services/cc-options/lib_greeks.py` | 计算核心副本（跟本地一致） |
| `/Users/tianli/Dev/stations/web-stack/services/cc-options/pyproject.toml` | `scipy>=1.14` 是唯一新 dep |

### 前端（web-stack repo）
| 文件 | 说明 |
|---|---|
| `/Users/tianli/Dev/stations/web-stack/apps/cc-options-web/app/page.tsx` | 主页挂载 9 章节 + 顶层 5 路并行 fetch |
| `/Users/tianli/Dev/stations/web-stack/apps/cc-options-web/app/types.ts` | 共享 TS 类型 + 格式化 fmtMoney/fmtSigned/fmtPct |
| `/Users/tianli/Dev/stations/web-stack/apps/cc-options-web/app/components/AssetStructureSection.tsx` | §1 资产结构 4 卡+说明表 |
| `/Users/tianli/Dev/stations/web-stack/apps/cc-options-web/app/components/IncomeSection.tsx` | §1b 收支 4 卡+5 行表，用 effective_theta |
| `/Users/tianli/Dev/stations/web-stack/apps/cc-options-web/app/components/RiskSection.tsx` | §2 风险 5+4 卡+3 解释表+±1% P&L 分解 |
| `/Users/tianli/Dev/stations/web-stack/apps/cc-options-web/app/components/NLVChart.tsx` | §4.1 · 4 条归一化曲线 + Range 选择器 |
| `/Users/tianli/Dev/stations/web-stack/apps/cc-options-web/app/components/PerformanceMetricsTable.tsx` | §4.2 · 4 策略 metrics 表 |
| `/Users/tianli/Dev/stations/web-stack/apps/cc-options-web/app/components/ReturnBarChart.tsx` | §4.3 · CC vs QQQ grouped bar（日/周/月/年） |
| `/Users/tianli/Dev/stations/web-stack/apps/cc-options-web/app/components/ScenariosCard.tsx` | §5 · 情景，pcts 可配置 + days slider |
| `/Users/tianli/Dev/stations/web-stack/apps/cc-options-web/app/components/OptionsSection.tsx` | §3 · Roll 信号卡 + Table A + Table B + Roll 明细 + Summary 3 格 |
| `/Users/tianli/Dev/stations/web-stack/apps/cc-options-web/app/components/RefreshButton.tsx` | 刷新按钮 · modal 显示命令 + 复制 |
| `/Users/tianli/Dev/stations/web-stack/apps/cc-options-web/app/components/ActivitiesTable.tsx` | 历史流水分页表 |

### 部署 + 运维
| 文件 | 说明 |
|---|---|
| `/Users/tianli/Dev/stations/cc-options/deploy.sh` | 薄包装 → `sync-data.sh + web-stack/infra/deploy/deploy.sh cc-options` |
| `/Users/tianli/Dev/stations/web-stack/infra/deploy/deploy.sh` | 7 步：Python rsync → Next build+rsync → systemd restart → smoke → verify.py |
| `/Users/tianli/Dev/stations/docs/handoffs/20260421-cc-options-p1.md` | 归档的 P1 阶段 HANDOFF（本次覆盖前存档） |

## 踩过的坑

### 1. BS 公式 T→0 数值炸裂
**现象**：`net_theta` 中一张 DTE=0 ATM call 单日 theta = -6.80，`qty × theta × 100` = +1359，占 net_theta 55%。  
**根因**：Black-Scholes 的 theta 分母 `sqrt(T)` → 0 时数值不稳。  
**解法**：定义 "有效 Theta" = `sum(... for r if r.dte >= 1)`。UI 只展示有效值，DTE≤0 行标灰不计入。  
**代码位置**：`api.py:186-190` effective_theta 计算 · `OptionsSection.tsx:88-90` DTE<1 灰化。

### 2. `/api/activities` 返老数据
**现象**：前端 activities table 全是 2021 年数据。  
**根因**：SnapTrade 返回的 activities 按时间**升序**排，后端 `items[:limit]` 取前 100 → 2021 年最早的。  
**解法**：`api.py:103` 加 `sorted(... key=trade_date, reverse=True)`。

### 3. SnapTrade 504 打断 `&&` 链
**现象**：`daily_update.sh` st_activities.py 偶尔吃 504 Gateway Timeout → 后续 phase2 + dashboard 全跳过，但 sync 不在链里仍跑 → portfolio 新、activities+CSV 旧，UI"半刷新"。  
**解法**：`daily_update.sh` 给 activities 加一次 retry：
```bash
{ $PYTHON "$DIR/st_activities.py" || { sleep 10; $PYTHON "$DIR/st_activities.py"; }; }
```

### 4. 前端"真刷新按钮"路径被 .env 规则堵死
**现象**：用户想"点按钮触发后端 daily_update"。  
**根因**：VPS 无 SnapTrade 凭证（.env 硬规则）。真触发需要本地守护进程 + CF Tunnel / SSH reverse + nginx 路由 + 保活。  
**折中**：按钮弹 modal 显示命令 + 一键复制 · 用户 cmd-tab 到终端粘贴。体验上差一小步，基础设施成本省下 1h。

### 5. `/api-smoke cc-options` skill 路径错
**现象**：`bash ~/Dev/devtools/scripts/api-smoke.sh cc-options` 找 `~/Dev/stations/cc-options/api.py`（旧 Streamlit 布局）而非 `web-stack/services/cc-options/api.py`。报 `Error loading ASGI app. Could not import module "api"`。  
**临时解法**：手写 `CC_OPTIONS_DATA_DIR=... uv run uvicorn api:app --port 8621` + curl。  
**永久解法**（待做）：改 `api-smoke.sh` `smoke_one()` 增加 `cc-options` case 走 `services/cc-options/` 路径。

### 6. 用户感知慢 — 串行链在 build → push → deploy
**用户反馈**："你并行操作了吗，怎么感觉那么慢"  
**真相**：所有 Edit / typecheck + smoke 都并发了。慢的是 `pnpm build ~30s` → `git push` → `deploy.sh ~40s` 的 3 个串行步骤。互相依赖，无法并行。  
**下次应对**：面对这种反馈直接点出串行链的阻塞点，不解释。

## 下个会话启动

1. 打开 `https://cc-options.tianlizeng.cloud` 对着页面，让用户指出"要微调的地方"（见上面待完成清单的 6 个候选方向）
2. 建议用户先加 alias（一次配置，终身受用）：
   ```bash
   echo "alias cc-refresh='bash ~/Dev/stations/cc-options/daily_update.sh'" >> ~/.zshrc && source ~/.zshrc
   ```
3. 微调类改动通常只涉及前端（组件样式 / 默认值 / 新字段），不需要改后端/数据管道 — deploy 一次即可
4. 多个微调 → **分批提交 commit 粒度保留回滚**（参考 P2 阶段的 4 批 commit 模式）
5. 每次改动后：`pnpm --filter cc-options-web typecheck` → `build` → `git push` → `bash ~/Dev/stations/cc-options/deploy.sh`
