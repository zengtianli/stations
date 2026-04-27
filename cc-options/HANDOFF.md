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
- 重组为 **8 个章节单页滚动**（不用物理 tabs）：资产结构 → 收支 → 风险 → 绩效（NLV+metrics）→ 收益对比 bar → 期权（Roll 信号+Table A+Table B+Roll 明细+Summary）→ 持仓 → 历史流水
- ⏸️ **§6 情景分析（Scenarios）暂未渲染** — `/api/scenarios` 端点已实现（用于取 `current` 字段），但 ScenariosCard 组件未建。延后到用户对实际页面提需求时再补（参考旧 Streamlit `_archive-streamlit/app.py` Tab5）
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

## 待完成（2026-04-27 复核现状）

HANDOFF 写于 P2 上线时（2026-04-21）。**本次 agent 逐项核对代码后发现 7 个候选已 3 ✅ + 1 ⚠️ + 3 ❌**：

| # | 微调 | 状态 | 证据 / 备注 |
|---|---|---|---|
| 1 | Scenarios 快捷预设 + 默认值 | ❌ **整个 ScenariosCard 组件没建** | `page.tsx` 加载 `/api/scenarios` 但**未渲染** §6；只有 `types.ts` 有类型定义。本质是 §6 章节缺失，不是微调 |
| 2 | NLVChart TQQQ 右 Y 轴 | ✅ 已做 | `NLVChart.tsx:201-282` 完整双 Y 轴 + TQQQ 独立 domain |
| 3 | Roll 信号 "目标合约" target | ✅ 已做 | `OptionsSection.tsx:283-287` + `api.py:_compute_target` (L263-286) |
| 4 | StatCard 趋势箭头 | ⚠️ 部分 | NLV/Leverage 已动态（接 `summary.prev_*`）；Theta/Margin/Sharpe 仍硬编 trend |
| 5 | ReturnBarChart SPY/TQQQ | ✅ 已做（更好）| `ReturnBarChart.tsx:27-31, 201-206` 4 条 + checkbox 过滤（默认 CC+QQQ） |
| 6 | 风险区 Sharpe RangeSelector | ❌ 未做 | Sharpe 数据已跟全局 Range，但 `IncomeSection.tsx` 无 UI 控件 |
| 7 | 持仓表合计行 | ❌ 未做 | `page.tsx:182-206` tbody 后直接闭合，无 total row |

### 本轮（2026-04-27）已完成

- [x] **C1 微调 4**：`api.py /api/summary` 加 `prev_margin_debt` 字段；`IncomeSection.tsx` Margin 卡 hint 加"较昨日 ±$x.xx/天"（Theta/Sharpe 没历史快照故保 trend=flat，Sharpe hint 改为"基于 ${rangeKey} TWR"）
- [x] **C2 微调 7**：持仓表加 `<tfoot>` 合计行（Total MV + Total PnL + 持仓数）
- [x] **C3 微调 6**：`IncomeSection.tsx` import `useRange()`，Sharpe 卡 hint 显示当前全局 RangeKey（用户改 NLVChart 的 Range 时同步显示）
- [x] **C4 微调 1（方案 B）**：HANDOFF 描述从「9 章节」→「8 章节」，§6 Scenarios 组件延后到用户对实际页面提需求时再补；page.tsx 的 `/api/scenarios` fetch 保留（取 `current` 字段），scenarios 数组当前未渲染

部署：commit + push + `bash deploy.sh` → standalone bundle 0 dev URL · CF Access 302 拦截（已知行为，service 活）· smoke `/api/health` 200。

详见 plan：`/Users/tianli/.claude/plans/purrfect-nibbling-patterson.md`

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
