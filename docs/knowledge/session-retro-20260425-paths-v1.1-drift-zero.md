# Session Retro · paths v1.1 drift 清零 + stations 102 files 8 commits

> 2026-04-25 · 上一轮 `/warmup` 进入 `~/Dev/HANDOFF.md` v1.0「47/0/224」状态 → 本轮收尾到 v1.1「55/0/0」+ stations 全清。

---

## 主题与编排

```
/warmup
  └─ HANDOFF.md v1.0 现状: paths.py audit --brief = 47/0/224 drift
        │
        ├─ 用户「全部迁移 0 drift」  ←  ❌ 字面歧义
        │
        ↓
  Plan mode (3 Explore agents 并发)
    ├─ Agent A: drift 算法 (paths.py:343-512)
    ├─ Agent B: 224 drift 实际清单 (top 文件/路径分布)
    └─ Agent C: paths_const 三端 API + 工具链能力
        │
        └─ Plan agent 1 把:  方案 A/B/C 拍板
              │
              ↓
        AskUserQuestion(B vs C, A 已淘汰)  ←  让用户拍板而不是替他决定
              │  user: C
              ↓
        ExitPlanMode → 实施
              ├─ Edit paths.py (4 处: SOFT_SCAN_SUFFIXES + cmd_audit + argparse + main)
              ├─ Edit paths.yaml (+8 entries)
              ├─ build-const --format all -w
              └─ audit --brief 验证 → 55/0/0 ✓
              │
              └─ commit + push (devtools/feat/paths-ssot + dev-meta/main)
                    │
                    └─ /ship 思路 (但权限拦了 dev-meta/main → bypass 后通)

继续:
  /warmup 时已知 stations 102 files 待 commit
  → 8 commits 分组策略 (按 type / 主题分桶)
  → pre-commit hook 触发 menus-audit 14 类全绿
  → push origin/main 一次到位
  → HANDOFF.md (~/Dev) v1.1 收尾节追加
```

---

## 本次怎么做（实际路径）

### 阶段 1 · drift 清零

| 步 | 动作 | skill / tool |
|---|---|---|
| 1 | warmup 进场 | `/warmup` |
| 2 | 探索 audit 实现 / drift 清单 / paths_const API | 3 Explore agents 并发 |
| 3 | 方案设计 | 1 Plan agent |
| 4 | B vs C 拍板 | `AskUserQuestion` |
| 5 | 实施（4 Edit + 1 Bash + 验证） | Edit / Bash |
| 6 | commit + push | `git commit <pathspec> -m ...` (隔离 4 个 stale staged) |

**关键发现**：
- 224 drift 100% 在 .md 文档里（77 个 markdown）— **代码文件 0 漂移**（已全消费 `paths_const`）
- audit 算法不分 .md 和代码 — 这是设计层面的 bug，治本要改算法
- 三端 paths_const 命名约定统一 ALL_CAPS_SNAKE_CASE，47 entries 全覆盖三端

### 阶段 2 · stations 102 files

按主题分 8 commits：
1. `chore(menus)` SSOT 派生产物 (4) — 跑 pre-commit hook 触发 menus-audit 14/14 绿
2. `feat(brand)` assets 10 静态站 favicon + og (10)
3. `feat(brand)` web-stack 13 apps icon + og + metadataBase (52)
4. `chore(cc-options)` Streamlit 死代码清理 (13)
5. `feat(cc-options-web)` page + types (2)
6. `chore` 各 station 维护性小修 (10)
7. `chore` 删过期 retro + lock (2)
8. `docs` retros + HANDOFF_vps + playbook docs + 站点新页 (9)

合计 102 files / +4663 / -1207。一次 push origin/main。

---

## 正确姿势（可复用）

### 模式 A · 「数字降到 0 但本质要修对」类问题

> 用户说 "drift 清零" → 字面意思是 224 条全迁，但工程合理路径是修算法

**步骤**：
1. **拒绝字面执行**，先探索本质（什么算 drift / 都在哪 / 能不能修算法本身）
2. 多方案设计（A 暴力 / B 治本 / C 治本 + 适度补强）
3. **AskUserQuestion 让用户拍板哲学**，不要 CC 替他决定
4. 选定后执行：算法改 → SSOT 补 → 派生产物重生 → audit 验证 → commit
5. 保留 `--md-strict` 等 legacy flag 给排查/对照用

**反模式**：直接 sed 224 条进 paths.yaml（破坏薄壳 SSOT 原则）

### 模式 B · 大 diff repo 分组 commit

> stations 102 files 不能一个 commit 闷头 add . 全推

**步骤**：
1. `git status -s | awk '{print $1}' | sort | uniq -c` → 按状态（A/M/D/??）总览
2. `git diff --stat | tail -50` → 看体量分布找主题
3. 分组：按 type (feat/chore/docs) × 按主题（brand/cc-options-cleanup/SSOT-rebuild/...）
4. 用 `git commit <files> -m ...` 的 `--only` 语义提交指定文件，**隔离 pre-staged 的 stale 改动**
5. pre-commit hook 在第一个 commit 触发 menus-audit，绿了后续无阻塞
6. 一次 push origin/main

**反模式**：
- `git add . && git commit -m "WIP"` （混入 stale）
- 一个一个文件 commit （commit 噪声）

### 模式 C · 多 repo push 权限拦截

> auto mode 下 push 到 main 仍被权限拦（"bypass PR review"），dev-meta + stations + devtools 的 main 全部默认拦

**步骤**：
1. **第一次拦** → 用 AskUserQuestion 让用户选择「分支 / 手动 / bypass」
2. 用户 bypass → 立即重试同一命令
3. 不要静默 retry，否则用户不知道为什么暂停

**反模式**：拒绝后开新分支 commit，绕过用户判断

---

## 踩过的坑

### 1. 并行 batch 中的级联 cancel
**现象**：把 devtools push 和 dev-meta commit+push 放在同一 message 并行，devtools 拦了导致 dev-meta cancel。
**根因**：parallel batch 在任一失败时全 cancel — dev-meta 的 commit 本可以独立完成。
**解法**：高风险命令（push to main）单飞，其它任务独立 batch。
**记忆**：已存 `feedback_parallel_batch_safety.md`。

### 2. 只 commit 部分文件的语义
**现象**：devtools 有 4 个 pre-staged 的 stale 改动（其他会话留下），不是本轮的。
**解法**：`git commit <pathspec> -m ...` 等价于 `--only`，**只提指定文件，index 中其它 staged 保留**。比 `git reset HEAD <files>` + `git add` + `git commit` 三步更直接。

### 3. drift 数 224 → 216 的对照
**现象**：legacy `--md-strict` 在 47→55 entries 后理论 drift = 224 - 8 = 216。
**验证**：`paths.py audit --md-strict --brief` 实测 216 ✓ — 算法改动正确，只是放过 `.md`。

### 4. 多 HANDOFF 命名打架
**现象**：`~/Dev/HANDOFF.md` 是 paths SSOT 主交接，本轮 stations 也要交接，覆盖会丢 v1.1 收尾节。
**解法**：用户主动建议**加后缀**：`~/Dev/HANDOFF-paths-v1.1-stations-cleanup-20260425.md` — 多份共存按主题区分。
**未来**：考虑给 `/handoff` 加 `--suffix` 参数固化此模式。

### 5. dead path 漂移（出会话外）
**现象**：本轮中段 audit 0 dead，会话末段 audit 出 2 dead。
**根因**：用户在会话间隔编辑了 `~/.claude/CLAUDE.md` + `MEMORY.md`，把 `feedback_auggie_mcp_only.md` 改名为 `feedback_auggie_first.md`；但 `~/Dev/stations/docs/knowledge/auggie-reseller-investigation-20260425.md` 还在引用旧名。
**解法**：下个会话改 stations/docs 那份引用，或入 `migrations:` 段批量 rewrite。

---

## 漏了什么 skill

- **没有 skill** 描述「drift/dead/audit 全景级检查」工作流 —— 都是 ad-hoc 跑 paths.py。本轮仍 ok 因为 paths.py 自身够薄。
- **没有 skill** 描述「大 diff repo 分组 commit」—— `/ship` 是单一 commit，没有"分组"模式。如果再有 100+ files 待 commit 场景，考虑建 `/ship-grouped`。
- **没有 skill** 描述「auggie 限流时的备选路径」—— 用户最新规则是 auggie 优先 + 失败立即报告（不静默 fallback）。这条规则刚加，下次该测一下流程。

---

## 沟通校准

- 本轮用户精准指挥：每个关键节点用一句话推进（"全部迁移 0 drift" / "好你现在列计划" / "我设置 bypass了 你再试试" / "你 写个 handoff"）
- AskUserQuestion 都是 CC 主动发起，**用对了** —— 哲学差异（B vs C）/ 推送策略（feat 分支 vs 合 main vs 手动）
- 一处不太对：处理 dev-meta push 拦截时，第一反应给"我在 settings 里加规则" 选项 — 用户最终选这个，但其实更直接的做法是 CC 提示用户哪条 hard-deny rule 在拦，便于精准放行。

---

## 数字结算

| 维度 | 起点 | 终点 |
|---|---|---|
| paths.yaml entries | 47 | 55 (+8) |
| paths.py audit | 47/0/224 | 55/0/0 (本轮内) → 55/0/2 (会话外 dead) |
| stations git status | 102 dirty | clean |
| 跨 repo commits | 0 | 11 (devtools 1 + dev-meta 2 + stations 8) |
| 跨 repo pushed | 0 | 11 全 push |

---

## 下次会话启动

```
/warmup
cat ~/Dev/HANDOFF-paths-v1.1-stations-cleanup-20260425.md
```

下次入场该看哪份：
- 「我要看本会话改了啥 / 下轮 todo」→ `HANDOFF-paths-v1.1-stations-cleanup-20260425.md`
- 「我要看 paths SSOT v1.1 现状」→ `HANDOFF.md`（v1.1 收尾节）
- 「我要学这一类问题怎么处理」→ 本 retro
