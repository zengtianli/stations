# Session Retro · ssot-os v0.1 · 2026-04-27

> 一个会话内 4 subagent 并发 ship + auggie warmup 探坑 + 切官方 Augment Indie Plan。
> v0.1 主体 ✅；A1 暴露 augment cold-start 限制 → 调 acceptance → v0.2。

## 大事记

| 时段 | 事件 |
|---|---|
| 入场 | /warmup → 错过 ROADMAP.md（用户手动提醒） |
| 计划 | 4 subagent 写区互斥分析 → ship plan 给用户拍板 → "做，并行" |
| 并发 | 1 message 起 B1/B2/B3 前台 + A1 后台 → 全返回 audit 通过 |
| 收尾 1 | ship 3 commit（dev-meta / configs / devtools） |
| A1 卡 | A1 subagent hung（13/24，nvm 0.19.0 + brew 0.24.0 + augmentproxy 反代多重故障） |
| 切换 | 用户切官方 Augment Indie Plan ($20/月 40k credits) → CLI/MCP smoke 通过 |
| 重跑 | `auggie_warmup.py run` 后台跑 → 13/24（7 ok / 5 timeout / 1 429）→ 用户中止收尾 |
| 收尾 2 | /handoff 三合一（recap + harness + HANDOFF） |

## 编排图

```
/warmup ─→ 读 HANDOFF（漏 ROADMAP，用户提醒）
        ↓
   plan + 写区互斥分析 + AskUserQuestion 跳过（ROADMAP 已答）
        ↓
   并发 4 subagent (B1/B2/B3 前台 + A1 后台)
        ↓                    ↓
   B1/B2/B3 返回         A1 hung（augmentproxy 反代故障）
        ↓                    ↓
   audit 14/14 ✓         诊断:binary 版本/flag 组合/MCP 残留/反代
        ↓                    ↓
   ship 3 commits       用户切官方 Augment ($20 Indie Plan)
        ↓                    ↓
   Step A: resources 撤   auggie_warmup.py 重跑
        ↓                    ↓
   ship d563078         13/24 数据 → /handoff
        ↓                    ↓
   ←──────── /handoff ────────→
```

## 阶段复盘

### Phase 1 · 4 subagent 并行 ship（B1+B2+B3）

**本次怎么做**：
1. 读 ROADMAP § B/A1 → 列 4 任务 → **写区互斥分析**（B1 改 SSOT-INDEX/CLAUDE / B2 改 5 SSOT yaml + 模板 / B3 改 META.md / A1 写 warmup.py + health.json）
2. 1 message 起 4 Agent（3 前台 + 1 后台 `run_in_background`）
3. 等返回 → 跑 `menus.py audit` + `auggie_workspaces.py audit` + `paths.py audit` + `ssot_banner_audit.py` 全绿
4. 3 个 repo 各自 commit + push

**正确姿势**：
- 写区互斥是关键 — subagent prompt 强调 "DO NOT 改 X/Y"
- 每个 subagent prompt 自包含（subagent 无前文上下文，要给完整 inputs/outputs/constraints/report 格式）
- audit 收口前先看 `git status` 排除非自己改的文件（auto-stage hook 抓的旧改动要 unstage）

**下次记得**：
- 如果某个 subagent 任务远比其他重（A1 25 query × ~30s = 12 min），明确背景化
- 多 subagent 时若有真实交集（共同改 CLAUDE.md），提前指定独占者，不要靠 last-write-wins

### Phase 2 · A1 多坑（auggie 调用）

**本次怎么做**：
1. A1 subagent 在 augmentproxy 反代上 hung（first workspace devtools 90s timeout）
2. 二分诊断踩了 4 个坑：
   - **binary 版本**：brew 0.24.0 跟反代不兼容；nvm 0.19.0 工作
   - **flag 组合**：`-p -a -q --output-format json` 卡死；删 -q 修复
   - **MCP 残留**：4 个 auggie MCP server 同时跑（CC 历史 session）
   - **反代限流**：试错并发触发 augmentproxy throttle，连小仓也 timeout
3. 反代彻底不工作时，用户切官方 Augment Indie Plan
4. 重跑得 13/24 真数据

**正确姿势**：
- 远端付费 API 出问题时**第一动作 = 分隔变量**（binary / flag / 进程 / 后端 / 限流），一次列清不要串行试错
- "并行优先"是本地工具的规则，远端 API 反过来要节流
- 切官方 ≫ 救反代（投入比）

**下次记得**：
- 调 augment CLI 不要拷文档复合命令，先 `-p -i "hi" -w small-repo` 验通基础链路
- 检查 `pgrep -lf auggie` 是任何 augment 故障的标准动作（防 MCP 残留）
- 反代是省钱选项但也是基础设施债 — 投入到反代调试 4 小时不如 $20 切官方

### Phase 3 · /warmup 漏 ROADMAP

**本次怎么做**：
- /warmup 输出只列 HANDOFF.md，没显示 ROADMAP.md 摘要
- 用户问"你没看到 ROADMAP 吗"才反应过来
- 这导致最初我按"4 subagent 应该这么写"自己规划，应该先读 ROADMAP 拿用户的"v0.1 详细计划"

**正确姿势**：
- 多轮项目目录下 `/warmup` 应额外扫 ROADMAP.md 并列出 v0.X 当前进度
- 同样 `*-ROADMAP.md` `PLAN.md` `SPEC.md` 这类规划文档都该被 /warmup 感知

**下次记得**：
- v0.2 的 /warmup 改进 candidate：自动列同目录所有 `(ROADMAP|PLAN|SPEC|HANDOFF)*.md` 文件 + 第 1 行

## 通用 Playbook · 多 subagent 并发 + audit + ship

```
1. 列任务 (N 个独立子目标)
2. 写区互斥分析（每个 subagent 改哪些文件，零交集）
3. TaskCreate N+1（subagent N 个 + supervisor 收口）
4. 1 message 起 N subagent（前台 / 后台混搭）
5. 等返回（前台 block，后台 notify）
6. 跑全套 audit / smoke（每个 SSOT 各自 audit + 跨 SSOT 一致性 check）
7. 各 repo 独立 commit + push（注意 unstage 非本批的 auto-stage 抓的）
8. TaskUpdate 标 done + 报告
```

## 漏了什么 skill（candidate for v0.x）

| skill 提议 | 触发场景 | 本次教训 |
|---|---|---|
| `/auggie-warmup [--id <id>] [--retry-large 300]` | 单仓 / 全量预热 augment 索引 | 本次手工写 + 跑 13/24 |
| `/mcp-gc` | 检测多 auggie MCP 残留并 kill | 本次手工 pgrep + kill |
| `/augment-status` | 查 augmentcode.com 当前 plan / credits 余额 | 切官方时手工登录看 |
| `/warmup --multi-round` | 自动扫 ROADMAP/PLAN/SPEC 列进度 | 本次靠用户提醒 |

## 沟通节奏 · 用户耐心曲线

3 次降速信号（按时间顺序）：

1. **"靠谱点"**（v0.1 计划阶段）→ 我应该 plan 不要 over-engineer，但当时 plan 节奏 OK
2. **"你先不要做了，这个 auggie 很慢怎么回事"**（A1 探坑中）→ 我在原地试错，用户先感知到反代异常
3. **"你看你花了多时间了，还是卡了"**（重跑 warmup 中）→ 应该早早收尾，转 v0.2 而不是死磕

**下次记得**：用户 1 次提速信号 = 警告；2 次 = 转向；3 次 = 立即 stop + handoff。不要 streak 4 次。

## 内存写入候选

本轮的洞察已分别落到：

- **`~/.claude/CLAUDE.md`**（用户已手改，2026-04-27 切官方 Augment）：auggie 三件套 / Indie Plan / 反代时代档案
- **`ROADMAP.md`**：v0.1-v1.0 路线图 + 6 项验收
- **`HANDOFF.md`**：本轮闭环 + 待续

不另写新 memory（已固化的不重复）。

## 引用

- ROADMAP：`~/Dev/ROADMAP.md`
- HANDOFF：`~/Dev/HANDOFF.md`
- 本 retro：`~/Dev/stations/docs/knowledge/session-retro-20260427-v0.1-ssot-os.md`
- 上一轮归档：`~/Dev/stations/docs/handoffs/20260427-auggie-workspace-registry.md`
- 反代时代调查档（已弃）：`~/Dev/stations/docs/knowledge/_archive-auggie-reseller-20260427/`
