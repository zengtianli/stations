# Playbook · cc-options P1 + P2 · Streamlit 要素照搬 + benchmark 数据扩展

**场景**：cc-options 昨天刚从 Streamlit 迁成 Next.js P0（4 StatCards + 持仓表）。本轮一口气做完 P1（5 个新 section 填补 MVP）+ P2（用户否掉 P1 的方向错位后，回头把 Streamlit 5 tab 全部要素精确照搬 + 换 benchmark + 加 SPY/TQQQ 历史价格 + 前端刷新按钮）。

**本轮触发点**：用户 `@HANDOFF.md` 让继续 P1 → P1 上线后用户否了 3 点（Theta 名义值无意义、Margin 不该放主位、要 SPY/QQQ/TQQQ benchmark）→ 进入 P2 精确照搬 Streamlit 旧版。

---

## 核心编排

```
P1 阶段（用户说"列计划 操作"）
  ↓
【Plan-1】    3 个 Explore agent 并发探前端/后端/部署
             Plan agent 设计 → AskUserQuestion 拍板 → ExitPlanMode
  ↓
【P1.1-1.4】 NLVChart (recharts) + ScenariosCard + RollSignalsCard
             + MarginSavingsCard + ActivitiesTable（5 新组件）
             api.py +3 端点（scenarios / roll-signals / margin-savings）
             顺手修了 /api/activities 排序 bug（老数据在前）
  ↓
【Deploy】   2 commit push / bash deploy.sh / VPS 内部 curl 验证
             verify.py 302 是 CF Access 预期，非故障
  ↓
【P1.5】     /site-archive cc 清旧备用域
             ⚠ "dry-run → --yes" 被权限系统拦（共享基础设施破坏性）
             展示 dry-run 结果给用户批准后再 --yes
  ↓
【用户反馈 1】 HIBOR vs RH 不要放主位、主要是 Theta 收租 + Delta 对冲
             → 拆 ThetaDeltaCard 为 Income + Risk section
             → NLV 加 range 按钮
  ↓
【用户反馈 2】 Theta 算错了、对比 SPY/QQQ/TQQQ 不要 Cash/b1/b2、2025 起点
             → 进入 P2：完整读 5 tab → 写 UI-SPEC plan → 实现
  ↓
P2 阶段（用户说"很好，怎么拉取我现在的持仓"）
  ↓
【Plan-2 · 重】深读旧 app.py 1282 行 → UI-SPEC 每 tab 精确字段 + 公式
             AskUserQuestion 3 问（架构/预测虚线/期权排版）
             写 plan 覆盖旧 P1 plan → ExitPlanMode
  ↓
【Step 1】   phase2_equity_curve.py 改 7 处（fetch_ticker 泛化 + SPY/TQQQ
             + CSV 瘦身 >= 2025-01-01 + daily 行加列）
             Full rebuild 325 行 CSV
  ↓
【Step 2】   api.py +effective_theta（DTE≥1 过滤）+ opt_rows
             + /api/twr + /api/perf-metrics（纯 Python TWR，不引 pandas）
             pcts 参数化
  ↓
【Step 3】   前端 4 批 Write（并发 section 组件）
             types.ts 统一类型 + 8 个新 section + page.tsx 重组
             删 ThetaDeltaCard / RollSignalsCard / MarginSavingsCard
  ↓
【Step 4】   commit cafd3fc / deploy / VPS 端点全绿
  ↓
【数据刷新】 用户问"怎么拉取我现在的持仓"
             触发 daily_update.sh → st_activities 504 Gateway Timeout
             → activities 重试 → full rebuild CSV → sync
             → 暴露 && 链条坏 → 改 daily_update.sh 加 retry
             → 加前端刷新按钮（modal 显示命令 + 一键复制）
```

---

## Phase 编排（按"照搬 Streamlit 要素"场景）

### Phase A · 照搬前读全源

**正确姿势**：用户说"要素直接照搬"时，**一次性把源文件全读完**，不要采样。

**本次怎么做的**：
- Phase 1 快扫 → 写 P1 plan（架构对了但**要素覆盖不全**）
- 用户否 P1 方向 → 我才完整读 app.py 的 L567-800 / L1020-1280
- 两个 Plan agent 都没拿到 Table A / Table B / compute_twr_curve / twr_metrics 精确字段

**下次记得**：
- 用户说"照搬" → **立即完整 Read** 源文件所有 tab / section
- Plan 文件第一节就是"§1 · Tab X 要素清单"（字段 + 公式 + 行号引用）
- 让 Plan agent 做 spec 抽取，不要让它做实现规划（实现简单，spec 难）

---

### Phase B · BS 公式 T→0 炸裂问题

**症状**：`net_theta = $2475/day` 中 $1359（55%）来自一张 DTE=0 的 ATM call（-6.80 单日 theta × -2 qty × 100）。

**根因**：Black-Scholes 的 theta 公式：
```
theta = -(S × pdf(d1) × sigma) / (2 × sqrt(T)) - r × K × exp(-rT) × N(d2)
```
T → 0 时 `sqrt(T)` → 0，theta 分母趋零，数值爆炸。

**正解**：定义"有效 Theta" = `sum(qty * theta * 100 for r in opt_rows if r["dte"] >= 1)`。UI 只展示有效值，DTE≤0 合约标灰不计入。

**下次记得**：金融计算看到巨大不合理数 → **先问"是不是边界炸裂"**，不要立即改公式。

---

### Phase C · 用户偏好"直接照搬现有实现"

用户原话："之前写的 streamlit 里的要素你直接照搬过来就行了"。这句话等于：
1. **不要创造新架构**（旧的已验证）
2. **字段/公式精确一致**（包括 corner case）
3. **现有解释文案也搬**（旧版 markdown 表的"怎么算的"列是产品的一部分）

**本次怎么做的**：P2 plan 里把旧 app.py 的 L938-966 解释表**逐字照搬**为 Next.js 的 3 个 `<table>` 组件。

**下次记得**：迁移类任务 → **保留文案 + 公式的字面准确性** > 重新设计的漂亮。用户对"熟悉的语言"敏感。

---

### Phase D · SnapTrade 504 的链条脆弱

**症状**：`daily_update.sh` 用 `&&` 串 4 步。st_activities.py 吃 504 → 后续 phase2 + dashboard 全跳过，但 sync-data.sh 不在 `&&` 链里仍跑 → portfolio.json 新、activities/CSV 旧，UI 看像"只刷了一半"。

**解法**：
```bash
$PYTHON "$DIR/st_snapshot.py" && \
{ $PYTHON "$DIR/st_activities.py" \
  || { sleep 10; $PYTHON "$DIR/st_activities.py"; }; } && \
$PYTHON "$DIR/phase2_equity_curve.py" && ...
```
一次 retry 吃掉 transient 504。

**下次记得**：外部 API 链条中断 → **加一次 retry** 而不是降级容错（因为下游严格依赖上游产物）。

---

### Phase E · "前端按钮"被 `.env` 规则堵死

**场景**：用户想要"页面点一下刷新数据"。

**评估**：
- 真触发要求 VPS 能调 SnapTrade → 需要凭证
- `.env` 永不上 VPS 是硬规则（金融安全）
- 真触发路径 = 本地守护进程 + Cloudflare Tunnel / SSH reverse tunnel + nginx 路由 + launchd/autossh 保活 — ~1h + 常驻维护

**折中**：按钮点击 → modal 显示命令 + 一键复制 + alias 建议 → 用户 cmd-tab 到终端粘贴 → 60s 后刷页面。

**下次记得**：用户说"要 UI 按钮" → **先评估后端路径通不通**。不通时显式告诉用户"真触发代价"，给弹 modal 当折中。

---

### Phase F · 并行度用户问责

**用户原话**："你并行操作了吗，怎么感觉那么慢"

**真相**：
- 并行度已经拉满（同 message 多 Edit / typecheck + smoke 并发）
- **慢在 `pnpm build` (~30s) → `git push` → `deploy.sh` (~40s) 串行链**
- 这 3 个互相依赖，无法并行

**应对**：
- 显式告诉用户"哪一段慢、为什么不能并行"（避免他以为我偷懒）
- build 内置 typecheck，不单跑 typecheck 再跑 build
- deploy 单次覆盖多个前端变动（不要每个组件 commit 后就 deploy）

**下次记得**：用户问"为什么慢" → **直接点出串行链的阻塞点**，不要狡辩"我并行了"。

---

## 通用 Playbook · Streamlit → Next.js 要素照搬

任何"把 Streamlit 展示要素搬到 Next"的任务抄这条链：

```
0. /warmup                                         # 入场
1. 完整 Read 旧 Streamlit app.py 所有 tab 的 L
   → 不是采样，是全读（~1500 行可接受）
2. Plan mode → 写"要素清单 spec"到 plan 文件
   每个要素：字段名 + 公式 + 数据源 + 行号引用
3. AskUserQuestion 拍板
   - UI 架构（单页滚动 vs 物理 tabs）
   - 取舍项（哪些本轮做、哪些 P3）
4. 数据管道先行（CSV 加列 / 源端 fetch 加 ticker）
5. 后端 API 加字段 + 新端点（effective_* / twr / perf-metrics）
6. 前端分批：每批 2-3 个 section 组件
   - types.ts 共享类型（避免每组件重复定义）
   - page.tsx 顶层 fetch 并行，数据传 prop 给纯组件
7. 本地 typecheck + build + /api-smoke 或手写 uvicorn+curl
8. /ship <repo> → bash deploy.sh
9. VPS 内部 curl 验证（CF Access 挡外部是预期，不是故障）
10. /handoff
```

---

## 本轮漏的 skill / 技巧

| 节点 | 本次做法 | 应该做法 | 原因 |
|---|---|---|---|
| 会话开头 | 直接进 P1 任务 | `/warmup` | HANDOFF.md 自动加载但 git 状态/skills 没看 |
| /api-smoke | skill 对 cc-options 路径判断错（找 stations/cc-options 没 api.py）| 手动 uvicorn+curl 兜底 | skill 的 `find_sample` 路径逻辑没覆盖 cc-options（非 hydro-*），**可 upgrade skill 或加 case** |
| 旧 HANDOFF 覆盖 | 本会话后 /handoff 才归档 | Phase 开始就归档（旧 P1 话题已换 P2） | 避免新写的跟旧 HANDOFF 串话题 |
| Plan agent 利用 | Plan agent 报告偏"大纲描述"，缺精确字段 | prompt 里明说"报告按字段 + 公式 + 行号格式，不要大纲"  | LLM default 会泛化 |

---

## 方法论抽象

**迁移任务的"忠诚度 vs 创新"轴线**：

1. **高忠诚度路径**（用户说"照搬"）— 字段、公式、文案、layout 都复刻。工作量大但零需求讨论。
2. **中忠诚度路径**（用户说"迁移到 X 架构"）— 保留业务语义，换技术栈。允许 UI 风格升级。
3. **低忠诚度路径**（用户说"重新设计"）— 重新思考。罕见。

**识别信号**：
- "**照搬** / **直接搬** / **之前就这样**" → 高忠诚度
- "**迁成** / **换成** / **用 X 重写**" → 中忠诚度
- "**重新做** / **现代化** / **重新设计**" → 低忠诚度

本次用户第一次说"列计划" → 我按中忠诚度做 P1（重新设计了 5 个 section）→ 用户否了 → 纠正成高忠诚度（P2 照搬 Streamlit 5 tab 全部要素）。

**下次记得**：迁移任务开头就问清"忠诚度" —— 不然 MVP 做了一轮白做。

---

## 数据真实性敏感度（用户特质）

用户本轮 catch 了 3 个数据正确性问题，CC 都没察觉：
1. `net_theta = $2475` 太大 → BS T→0 炸裂，该算 effective_theta
2. `/api/activities?limit=100` 显示 2021 老数据 → 后端没按时间排降序
3. `compute_roll_signals` 返回的 dict 含 `exp_date: datetime.date` → FastAPI 能序列化但不稳，显式 isoformat

**下次记得**：金融/分析类项目 — **UI 展示前先手算验证一个 sample**（不是信公式）。`$2475` 看一眼是否合理？一张 DTE=0 的 ATM call 贡献 $1359 合理吗？不合理就查根因。

---

## 给下一个 session CC 的一句话

> "继续 cc-options 的微调。读 `~/Dev/stations/cc-options/HANDOFF.md`。用户说新会话接着这里的 TODO 列表走。本地 `cc-refresh` alias 已建议（看 HANDOFF 里是否已配）。"
