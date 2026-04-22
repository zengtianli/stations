# Session Retro · HANDOFF 按项目落地（2026-04-20）

> 把 `/handoff` 从「无脑写 CWD / ~/Dev」改成「按主项目智能落地」；`~/Dev/HANDOFF.md` 只留根级重构场景用；`/warmup` 能扫多位置 HANDOFF。

---

## § 核心编排（本轮实际跑的路径）

```
用户："HANDOFF 以后按项目放，你明白我意思吗"
  ↓
【颗粒度对齐】  AskUserQuestion × 3
                - 落地规则（CWD / 智能判 / 每次问）
                - 旧 HANDOFF 去处（留根 / 归档 / 拆分）
                - symlink 策略（不做 / 反向 / 扫多位置）
  ↓
【规划】        Plan mode
                Edit /Users/tianli/.claude/plans/piped-tinkering-nest.md
                ExitPlanMode
  ↓
【PR1 · skill 行为】
                Edit ~/Dev/tools/cc-configs/commands/handoff.md
                  └─ Phase 3 加 Step 3.0 判主项目
                Edit ~/Dev/devtools/lib/tools/warmup.py
                  └─ _scan_other_handoffs() + section_handoff() 分 "本项目 / 其他活跃"
  ↓
【PR2 · 旧数据归档】
                Bash mv ~/Dev/HANDOFF.md → ~/Dev/stations/docs/handoffs/20260420-dev-reorg.md
  ↓
【PR3 · playbook 固化】
                Edit ~/Dev/tools/configs/playbooks/stations.md
                  └─ § HANDOFF 分布规范（对齐 skill 逻辑）
  ↓
【验证】         python3 ~/Dev/devtools/lib/tools/warmup.py（~/Dev + stations/web-stack）
                确认本项目段 + 其他活跃段分离正确
  ↓
【交付】         scoped commit × 3：cc-configs / devtools / configs
                （stations/docs repo 有无关脏状态 → 留给用户 /ship）
  ↓
【复盘】         /retro（本文）
```

**关键数字**：4 个文件改动（1 skill / 1 helper / 1 playbook / 1 归档）、3 repo push、0 个新 skill 造出、0 个现成 skill 漏用。

---

## § 每个 Phase 详解

### Phase 1 · AskUserQuestion（**核心控制流**，不是 skill）

**触发时机**：用户提的需求含多个**未定的设计参数**（落地规则、旧数据、关联机制...）。

**本次怎么做的**：开场就发了一个 3 问的 AskUserQuestion block，一次问完"落地规则 / 旧 HANDOFF / symlink 策略"。

**正确姿势**：✓ 本次做对了。避开了 "先问第一个 → 等答 → 再问第二个" 的串行模式。用户答完 3 题后直接进 Plan mode，0 轮返工。

**下次记得**：**用户说"你推荐"不等于让你跳过 AskUserQuestion** — 要把"我推荐这个"带 **Why** 写进 plan file，让用户审。

### Phase 2 · Plan mode（内置控制流）

**触发时机**：破坏性改动 / 跨 repo / 流程设计类任务。

**本次怎么做的**：`/handoff` 结束后延续了 plan mode → 写 plan file → ExitPlanMode 批准。

**正确姿势**：✓ plan file 含 Context / 改动列表 / 关键文件表 / 验证清单 / 不做 / 回滚 — 齐全可审。

**下次记得**：plan file **不是 AI 交流纸**，是**用户批改的合同** — 每节都要能被单独反对。

### Phase 3 · 核心改造：Edit（**无可 skill 化**）

**触发时机**：改 skill 行为本身（`.md` 文件）+ 改 helper Python（辅助扫描逻辑）。

**本次怎么做的**：
- `Edit handoff.md` — Phase 3 加 Step 3.0 判主项目启发式 + 规则节加落地规则
- `Edit warmup.py` — 抽 `_first_h1()` / `_scan_other_handoffs()` helper，`section_handoff()` 改成"本项目 + 其他活跃"双段

**为什么无 skill**：这是**写代码**（skill 描述文案 + Python 函数），不是编排动作。没有 "/edit-skill" 之类的 skill，也不该有。

**下次记得**：遇到"改 skill 定义"任务 → 直接 Edit；别想着"是不是要走某个 skill"。

### Phase 4 · 旧数据归档：Bash mv（**无可 skill 化**）

**触发时机**：话题换了但旧文档有保留价值 → 归档路径 `stations/docs/handoffs/{YYYYMMDD}-{topic}.md`。

**本次怎么做的**：`mkdir -p stations/docs/handoffs && mv ~/Dev/HANDOFF.md ...`

**正确姿势**：✓ 归档路径固定、带日期 + 话题 slug。

**下次记得**：新 skill 文案里已写明"归档优于覆盖"，执行时照做就好。

### Phase 5 · playbook 固化：Edit（**无可 skill 化**）

**触发时机**：本轮定的**新规矩** → 同步到对应 domain 的 playbook，让未来会话能查到。

**本次怎么做的**：`stations.md` 加 § HANDOFF 分布规范（3 行表 + 反模式）。

**正确姿势**：✓ playbook 和 skill 双写一致 — 用户可查 playbook，CC 自动读 skill。

**下次记得**：**改了 skill 行为**就顺手**更 playbook § 节**，别只改一半 — 两处漂移会把下一轮会话搞糊涂。

### Phase 6 · 验证（**无 skill，走 bash**）

**触发时机**：skill/helper 改完，确认新行为符合预期。

**本次怎么做的**：`cd ~/Dev && python3 warmup.py` → 看 "本项目 HANDOFF" 段 + "其他活跃" 段；再 `cd ~/Dev/stations/web-stack && python3 warmup.py` 对比。

**正确姿势**：✓ skill 行为类的验证只能人工跑 + 肉眼核对输出。没有对应 skill。

**下次记得**：skill 行为改动**必须实跑一次**看真实输出，不能只 "Read 代码自信它对"。

### Phase 7 · 交付：scoped commit（**本可用 /ship，这次故意没用**）

**触发时机**：多 repo push。

**本次怎么做的**：手工 `cd` + `git add <file> + commit + push` × 3。

**为什么没用 /ship**：`stations/docs` repo 有**本轮无关的脏状态**（9 个 session-retro、index.md、\_files.md 删除）+ 新增 `handoffs/` 目录。`/ship` 风险会把这些一起打包。scoped commit 更安全 → 只 push 本轮相关文件。

**下次记得**：
- 受影响 repo **只有我本轮改的东西** → `/ship repo1 repo2 repo3`，一条命令
- 受影响 repo **还有无关脏状态** → 手工 `git add <file>` + commit + push，别用 /ship 无差别打包

---

## § 本次漏了什么 skill（诚实盘点）

**结论：0 个漏用**。本轮任务是 skill 行为改造，动作性质是"写代码 + 改 playbook + 归档 + 验证"，都落在**现有 skill 覆盖不到的工程工作**范畴。

唯一**有条件能用 skill** 的地方是 Phase 7 的 `/ship`，但因 `stations/docs` repo 脏状态与本轮无关，故意绕开。这是**判断而非漏用**。

**反过来做对的**：
1. ✓ 开场 AskUserQuestion 3 问打包（避免串行提问）
2. ✓ 进 Plan mode + 写 plan file（破坏性改动走规范）
3. ✓ skill 改完同步 playbook（SSOT 双写）
4. ✓ 改完真跑 warmup.py 验证（没偷懒 Read 代码自信）
5. ✓ scoped commit（识别无关脏状态）

---

## § 通用 Playbook · "改 CC skill 行为规则"

下次遇到 "改某个 /<skill> 的行为 / 加规则 / 调落地" 类任务 → 抄这个走：

```
1. AskUserQuestion × N       ← 把未定的设计参数一次问清（落地规则 / 旧数据 / 关联）
2. Plan mode                 ← 写 plan file：Context / 改动 / 文件表 / 验证 / 不做 / 回滚
3. ExitPlanMode
4. Edit skill .md            ← ~/Dev/tools/cc-configs/commands/<skill>.md
                               （Phase 定义 + 规则节两处都要改）
5. Edit helper (若有)        ← ~/Dev/devtools/lib/tools/<helper>.py
6. Bash mv 旧数据            ← 归档到 ~/Dev/stations/docs/<category>/{YYYYMMDD}-{topic}.md
7. Edit playbook § 节        ← ~/Dev/tools/configs/playbooks/<domain>.md 对齐新规
8. 实跑 helper 验证           ← 至少两个 CWD 对比（根 vs 子项目）
9. scoped commit + push      ← 纯净 repo 用 /ship；脏 repo 走手工
10. /retro                   ← 本文
```

**关键节点的判断**：
- **Step 1 问多少** — 凡是用户原话里含糊的设计参数都问（"合适的规则"、"怎么处理"）；用户说"你推荐"→ 依然走 AskUserQuestion，推荐作默认选项，但留选择权
- **Step 4 改两处** — skill .md 里 **Phase 描述**（怎么做）和**规则节**（硬性约束）经常脱节，一次改齐
- **Step 7 更 playbook** — 这一步最容易漏，skill 改完忘了 playbook 就会**两边漂**
- **Step 9 /ship 还是手工** — 看目标 repo 有没有无关脏状态，脏就手工

---

## § 关键文件索引

| 用途 | 绝对路径 |
|---|---|
| skill 落地规则 | `/Users/tianli/Dev/tools/cc-configs/commands/handoff.md` § Phase 3 Step 3.0 |
| warmup 扫多位置 | `/Users/tianli/Dev/devtools/lib/tools/warmup.py` `_scan_other_handoffs()` |
| playbook 新节 | `/Users/tianli/Dev/tools/configs/playbooks/stations.md` § HANDOFF 分布规范 |
| 旧 HANDOFF 归档 | `/Users/tianli/Dev/stations/docs/handoffs/20260420-dev-reorg.md` |
| 本轮 plan 文件 | `/Users/tianli/.claude/plans/piped-tinkering-nest.md` |

---

## § 下次会话示例

```
用户："改下 /warmup 让它也显示 launchagents 状态"

CC 应自动走：
1. AskUserQuestion：扫哪些 agents？全显 vs 只显异常？
2. Plan mode：plan 文件列改动 + 关键文件 + 验证清单
3. ExitPlanMode
4. Edit ~/Dev/tools/cc-configs/commands/warmup.md（skill 文档）
5. Edit ~/Dev/devtools/lib/tools/warmup.py（section_launchagents()）
6. (无归档需求，跳过)
7. Edit ~/Dev/tools/configs/playbooks/stations.md 或 META.md（新功能记录）
8. 实跑 warmup.py 看输出
9. /ship configs devtools （若纯净）
10. /retro
```
