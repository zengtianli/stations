# Paths SSOT v0.6 全量重构 · 9-Agent × 3-Wave Playbook

> 2026-04-24 · 从 "装个 pre-commit hook" 起步，发现 git-lfs 全局 hooksPath 旁路，最终收束为 paths SSOT 三端闭环

## 场景

用户在 `~/Dev` 下反复重构目录，HANDOFF v0.4 遗留 v0.5 计划：装 pre-commit hook 让 md 文档里老路径引用跟 paths.yaml migrations map 自动走。第一次尝试发现 **5 个 repo 装 `.git/hooks/pre-commit` 从 Apr 22 起从未真正生效** —— git-lfs install 设了全局 `core.hooksPath=~/.git-hooks`，局部 hook 被完全旁路。

## 产出（一行一件）

- `paths.py`: regex 三形式覆盖（`~/` / 绝对 / `$HOME/`）/ SCAN_EXTS 22 + SCAN_FILENAMES 白名单 / `audit --brief` / `build-const --format py|shell|ts|all`
- `paths_const.{py,sh,ts}` 三端派生产物（Python / Shell source / TS import）
- `~/.git-hooks/pre-commit` 全局 dispatcher（按 repo case 分发到 `pre-commit-multi.sh`）
- `menus.py audit` 第 14 类 `paths-drift`（subprocess → `paths.py audit --strict`）
- 5 skill md 防线：`/refactor-dir` Step 7 硬阻塞 + `/handoff` `/recap` `/warmup` 加 `audit --brief` + `/menus-audit` 指向 paths 域
- devtools 硬编码 -17（-27%）：`station_path.sh` / `deploy-changed.sh` / `station-promote.sh` / `menus.py` 改用 `paths_const.*`
- CLAUDE.md / `playbooks/paths.md` / HANDOFF.md v0.6 同步落盘
- `scan-dead --strict` **51→0**，menus audit **14/14 全绿**

## 编排图

```
入场  →  /warmup (HANDOFF v0.4 → v0.5 计划)
        ↓
侦察  →  4-路 subagent 并行（Explore medium）
        · Git hook 全景（发现 core.hooksPath 旁路，核心认知修正）
        · paths.py 能力（regex bug + SCAN_EXTS 漏 + migrations 分布）
        · 非 md 硬编码（Shell 67 / Py 179 / TS 370 盘点）
        · Skills 防线（几乎空白）
        ↓
决策  →  用户拍板"最全面重构"
        ↓
Plan mode → 9-agent × 3-wave 蓝图 + 依赖拓扑 + 回滚策略
        ↓
Wave 1 基础（并行 3, 文件互斥）:
  α paths-py-fix     ┐
  β skills-guard     ├─→ checkpoint (α 单测 / β 5 md 语法 / γ baseline)
  γ recon-baseline   ┘
        ↓
Wave 2 基础设施（并行 3）:
  δ paths-const-multi (扩三端 + $HOME/ 形式)   ┐
  ε hook-dispatcher   (全局 hook + 5 repo 恢复)├─→ checkpoint
  ζ yaml-cleanup      (51 dead 清零)           ┘
        ↓
Wave 3 集成（并行 3）:
  η hardcode-migrate  (devtools -17 硬编码)    ┐
  θ menus-paths-audit (14 类 paths-drift)      ├─→ checkpoint
  ι docs-sync         (3 md 同步 v0.6)         ┘
        ↓
Wave 4 主线（冒烟 + Ship）:
  · 真实 commit 冒烟（三形式路径全命中 rewrite）
  · 4 repo 精选 commit+push（devtools / cc-configs / tools/configs / dev-meta）
        ↓
/handoff
```

## 本次怎么做 · 正确姿势 · 下次记得

### Wave 0 · 入场踩雷

- **本次**：开局直接装 5 repo 的 `.git/hooks/pre-commit` symlink，冒烟 commit 发现 hook 没跑
- **根因**：`core.hooksPath=~/.git-hooks` 全局（git-lfs install 设的），`.git/hooks/*` 被完全旁路
- **正确姿势**：装 hook 前必查 `git config --show-origin --get-all core.hooksPath`
- **下次记得**：任何涉及 git hook 的任务，Wave 0 先确认全局 hooksPath 状态 — **原计划的"装局部 hook"可能从第一天就是错的假设**

### Wave 1 · 文件级互斥并行

- **本次**：3 agent 同时改 α(`paths.py`) / β(5 skill md) / γ(只读) — 零冲突一波过
- **正确姿势**：并行 subagent prompt 里明确声明"只改 X 文件，不动其他"，supervisor 核对互斥
- **下次记得**：并行 agent 互斥靠 prompt 约束 + 自觉，不靠 git worktree 隔离（成本太高）

### Wave 2 · 破坏性操作的 preflight

- **本次**：ε 装全局 dispatcher 前，γ 的 baseline recon 已确认 menus 13/13 绿（首次真跑），装完不会因历史漂移阻塞 commit
- **正确姿势**：破坏性系统改动前跑 baseline recon 是必须（手工做了，本可以用 `/preflight` skill）
- **下次记得**：改 hook / hooksPath / 全局 git config → `/preflight` skill

### Wave 3 · 大 diff repo 隔离

- **本次**：η 硬编码迁移明确**绕开 stations**（42 M + 12 D + 47 ?? 未 commit），避免本次改动混入用户 Phase 2/3/4 的大 diff
- **正确姿势**：大 diff 在身的 repo，新重构先不碰 — 保持 commit 边界干净
- **下次记得**：入场 `git status -s | wc -l` 每 repo，> 30 就列入"本次不碰"

### Wave 4 · 真实流程冒烟

- **本次**：Ship 前在 devtools 真实 commit 一次含三形式老路径的 md，证实 `~/.git-hooks/pre-commit → multi.sh → menus-audit + paths-rewrite → auto-stage` 完整链路
- **正确姿势**：基础设施类改完必须真实流程走一遍，unit test 不够（git hook 行为取决于 git config 实际状态）
- **下次记得**：涉及 hook / 全局配置 / 多工具链路的 skill，冒烟测必须真实调用

## 通用 Playbook · 基础设施全面重构（可复用模板）

适用：SSOT 升级 / 工具链重构 / 跨 repo 守门机制 / 目录结构变更

```
1. /warmup                         # 看 HANDOFF + CLAUDE.md + git 状态
2. 4-路 subagent 并发侦察          # Explore medium, 各 < 600 字
                                   # 维度：domain × 能力 × 集成点 × 防线
3. 用户决策 scope 级别（窄/中/宽） # AskUserQuestion 拍板
4. Plan mode 蓝图                  # 依赖拓扑图 + agent 分工 + 回滚策略
5. Wave 1 基础（3 agent 并行）     # 文件级互斥，含 baseline recon
6. Checkpoint 1: 验收脚本
7. Wave 2 基础设施（3 agent）
8. Checkpoint 2
9. Wave 3 集成（3 agent）
10. Checkpoint 3
11. Wave 4 主线: 冒烟 + /ship
12. /handoff
```

### 关键纪律

- 每 wave 结束 **checkpoint** 跑验收脚本，通过才进下波
- agent prompt 互斥文件区 **显式声明**
- 破坏性改动 wave 必含 baseline recon agent（只读）
- 最终 Ship 前 **真实流程冒烟**（不是 dry-run）
- commit 按 repo 精选本次改动文件，**不 `git add -A`**（防混入历史遗留）

## 漏了什么 skill（老实标）

1. **`/preflight` 没用**：Wave 2 ε 装全局 hook 是 preflight 级操作。下次装全局 hook / 改 `core.hooksPath` / 改全局 git config 应先跑 `/preflight`
2. **新 skill 候选 `/paths-audit`**：一条命串 `paths audit --strict` + `scan-dead --strict` + `brief` 三件套。当前是手敲三行
3. **`/ship` 没完整用**：本次 4 repo commit+push 手敲 HEREDOC。`/ship` skill 是否支持跨多 repo 各自 commit 不同精选文件值得确认
4. **`/ctx-monitor` 未启**：9 agent × 3 wave，context 占用大，应该开场挂上监控

## 关键认知沉淀

1. **git-lfs install 会偷偷设全局 `core.hooksPath`** → 以后任何"装 hook"任务，开场验证这点
2. **rewrite-dead 三形式覆盖是硬需求**（`~/` / 绝对 / `$HOME/`），缺一个就漏一大片 shell 脚本
3. **SCAN_EXTS 必须覆盖 dotfiles**（.zshrc / Makefile / .env 等），用白名单 set 而非扩展名集
4. **`_matches_allow` 用 raw literal startswith**（scanner 扫到的是未展开字面值，不要 expanduser）
5. **pre-commit hook 的 auto-rewrite + auto-stage 模式** > 纯阻塞式 audit —— 对用户重构工作流更友好，但需确保 rewrite 是幂等的

## 数据

- scan-dead: **51 → 0**（100% 清零）
- 硬编码：devtools 主要 5 文件 **64 → 47**（-27%）
- menus audit: **13 → 14 类**
- 文件改动：**~15 文件 modified / 4 新建 / 4 repo commit**
- 时间：入场到 push 完成约 2 小时（4 路侦察 + 9 agent × 3 wave + 4 repo ship）
