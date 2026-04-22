# 2026-04-19 会话 Playbook · 三幕：换汇研究 → 新站上线 → slash 生态治理

> 一次会话完整横跨 **具体问题求解** → **生产系统上线** → **meta 层工具治理** 三个维度。本 retro 按 slash command / skill 编排把三幕串起来，诚实标漏用的 skill，沉淀可复用的 playbook。
> 关联文件：
> - `~/Dev/docs/knowledge/session-retro-20260419-assets-launch.md`（Phase 2 专属 retro，本文是总览）
> - `~/Dev/tools/configs/playbooks/web-scaffold.md`（Phase 2 沉淀的通用 playbook）
> - `~/.claude/plans/ibkr-twinkly-bachman.md`（Phase 3 的 plan 文件）

---

## 核心编排（一眼看完）

```
【Phase 1 · 换汇研究（Forex Research）】
用户：IBKR 换汇 + SWIFT 到 HSBC HK 太麻烦，HK 银行换汇有多差？
  ↓
Plan mode + AskUserQuestion（无）
  ↓
Agent × 2 subagent 并行       ← 应该用 ✓ （做对了）
  ├─ Explore: 读现有 forex 文档
  └─ general-purpose: WebSearch HK 银行 spread
  ↓
Edit docs/forex-spread.md     ← 加 HK 银行对比章节
Edit docs/ibkr-forex.md       ← 加跨文跳转
Write memory/reference_hk_fx_channels.md
Edit memory/MEMORY.md         ← 加新 memory 索引行
  ↓
ExitPlanMode（plan 已批准）
  ↓
（用户追加：Forex Club 开通了 + 想把内容发成网站）
Edit memory 标记 ✅ 2026-04-19 已开通

【Phase 2 · assets.tianlizeng.cloud 上线】
（详细 retro 见 session-retro-20260419-assets-launch.md）
  ↓
Plan mode + AskUserQuestion × 2（7 个选项拍板规格）
  ↓
手工 mkdir + Write generate.py ← 漏 /site-add（根因：无 md-docs 模板）
  ↓
Edit 源仓 9 篇 md 加 frontmatter public: true
  ↓
手工 ssh VPS + /cf dns + /cf origin + bash deploy.sh   ← 漏 /ship-site（最重）
  ↓
Edit navbar.yaml / services.ts + menus.py 三连
  ↓
/menus-audit ✓
/navbar-refresh ✓（bash 形式）
/cf-audit ✓
  ↓
手工 git commit + gh repo create   ← 漏 /ship
  ↓
curl 验证 200 OK

【Phase 3 · Playbook + slash 生态治理（meta）】
用户："你把你做的事情 playbook 下给我看，有对应的 slash command 吗"
  ↓
Agent × 2 subagent 并行          ← 应该用 ✓（做对了）
  ├─ Explore: 盘点 52 个 slash command 生态
  └─ general-purpose: 深读 ship-site/launch/distill/retro/recap/handoff 源文件
  ↓
（发现 /ship-site 本就覆盖我全程手工做的 8 步 —— 是漏用不是缺 skill）
  ↓
Plan mode（覆写前一个 plan）
+ AskUserQuestion × 4（范围 / 管理落点 / playbook 范围 / retro 定位，全选推荐）
+ ExitPlanMode
  ↓
五件套并行执行：
  ├─ D1 Edit /site-add.md 加 md-docs template
  ├─ D2 Write web-scaffold.md（META §3 八节齐备）
  ├─ D3 Write assets-launch retro
  ├─ D4 Edit /distill.md 泛化 + 加 Phase 3.5 Slash 生态审计
  └─ D5 Edit META.md §5 web-scaffold 🚧→✅
  ↓
手工 git commit + push 3 repos   ← 仍漏 /ship

【总体收尾】
  ↓
本 retro
  ↓
下次同类任务按 playbook + retro 抄作业
```

**关键数字**：
- **6 个现成 skill 本该用但漏了**（`/warmup` 全程 · `/site-add` Phase 2 · `/ship-site` Phase 2 · `/ship` × 2 phases 提交 · `/menus-audit` Phase 2 走了 bash · `/handoff` 最后没调）
- **0 个新造 skill**（全部是已有 skill 的漏用 / 已有 skill 的扩展）
- **1 个空隙标记**（`/menus-refresh` 薄封装，/distill Phase 3.5 已记录建议补，未动手）
- **5 件套完成**（D1-D5，全部 pushed）
- **3 个 Plan mode**（每一幕主要决策都 Plan）

---

## Phase 1 · 换汇研究（Forex Research）

### 应该用 `/warmup`（漏了，全程都漏）

> warmup: 进项目先跑一句 — 告诉你当前加载的 skills、CLAUDE.md、HANDOFF、git 状态和建议动作

**触发时机**：进项目 / 开新任务首条消息。
**本次怎么做的**：直接从 SessionStart hook 拿 HANDOFF 快照就进任务。
**正确姿势**：`/warmup` 一句摆出当前状态，再进规划。
**替代方案**：长会话接着干可以不跑，但新主题必跑。
**下次记得**：新任务第一句永远 `/warmup`。

### 做对了 · Agent subagent 并行探索

**触发时机**：研究类任务跨领域知识（web + 本地文档 + memory）。
**本次怎么做的**：一条消息里并发 Explore（读现有文档）+ general-purpose（WebSearch HK 银行 spread），两个 agent 各自独立跑，结果合并。
**正确姿势**：subagent 用于保护主上下文 + 并行独立查询。本次用得对。
**替代方案**：如果都能靠本地 Read 解决就不用 Agent；反之若涉及 web 一定要用。
**下次记得**：跨领域研究 → 多个 Explore/general-purpose agent 并行。

### 做对了 · Plan mode 前置 + 研究后产出双轨（文档 + memory）

**触发时机**：调研类任务。
**本次怎么做的**：
- plan 写在 `~/.claude/plans/ibkr-twinkly-bachman.md`（含 Context/Deliverables/验证/回滚）
- 产出：`docs/forex-spread.md` 扩 HK 银行对比章节 + `docs/ibkr-forex.md` 跨文跳转 + 新 memory `reference_hk_fx_channels.md` + `MEMORY.md` 索引加一行
- 用户反馈 "Forex Club 已开通" 后立刻更新 memory 标 ✅

**正确姿势**：研究任务 = 研究 + 落盘 + memory 双轨。
**下次记得**：调研产出一定要**同时**更新 memory（下次会话能接上）与文档（可搜索）。

---

## Phase 2 · assets.tianlizeng.cloud 上线

> **Phase 2 的 6 要素完整节见** `session-retro-20260419-assets-launch.md`。本节只摘要本 session 视角的关键观察。

### 应该用 `/site-add` + `/ship-site`（漏了最重要的两个）

**本次最大教训**：新站从零上线要 ssh VPS 写 nginx、手动调 `/cf dns add` + `/cf origin add`、自己跑 `bash deploy.sh` —— 这 **全部** 都是 `/ship-site` 内部做的 8 步。**漏用不是因为缺 skill，是因为前一步漏了 `/site-add`，连带跳过了 /ship-site 的心智链路**。

根因：`/site-add` 之前只有 `stack|changelog|docs` 三个 template，没有 md-docs 类型 → 脑子跳过 /site-add → 跳过整个 /site-add + /ship-site 默认链路 → 手工做到底。

**Phase 3 的 D1 已修**：`/site-add` 加 `--template md-docs --source <repo>` + 完整「md-docs 模板说明」。

### 做对了 · Plan mode + AskUserQuestion × 2 轮

- 第一轮 4 问：子域 / 内容范围 / 同步机制 / navbar 位置
- 第二轮 3 问：页面结构 / 首页分组 / repo 公开度
- 7 个拍板，规格完全锁定

**正确姿势**：新站涉及 CF + VPS + SSOT + 新 repo 四个生产系统，必须 Plan mode。7 个 AskUserQuestion 看起来多，实际一次性锁规格远比边做边改快。

---

## Phase 3 · Playbook + slash 生态治理

### 做对了 · 用户口令触发 meta 维度 + 我及时识别

用户发了两句**关键 meta 层口令**：
1. "你把你做的事情 playbook 下给我看，有对应的 slash command 吗"
2. "都做。都得用 playbook 的方法，这样我好明确工作流。最后 playbook 和事情的顺序调用也要 md 写出来。这个也加到合适的 slash 命令了 handoff distill recap 啥的。你自己也 slash command 好好严格的管理下，各司其职。合并管理删除等，且说明理由"

**触发时机**：执行完一个非平凡任务，用户要求反思性产出（playbook / retro / 知识沉淀）。
**本次怎么做的**：
1. 第一轮用户口令 → 先输出复盘 + 识别 "本该有 slash 没用" 的地方
2. 第二轮用户口令 → 认识到这是 meta 治理任务，升维为 5 件套（D1-D5）

**正确姿势**：meta 层任务本身也要 Plan mode（重点不是代码多，是影响面 —— distill / META.md / playbook 全局生效）。

### 做对了 · Plan mode（覆写前一个 plan）+ AskUserQuestion × 4

- 上一个 plan（forex 研究）已完成 → 覆写
- 4 个问题：范围 / 管理落点 / playbook 范围 / retro 定位
- 用户全选推荐 → 规格锁定 → 执行

**正确姿势**：Plan 文件同名覆写是正常操作（plan 文件是 per-session 的）。不要为了保留历史就硬开新文件。

### 应该用 `/ship`（仍漏了）

Phase 3 提交阶段我手工 git commit + push 了 3 个 repo。正确姿势是 `/ship cc-configs configs docs`。

**为什么又漏**：muscle memory 还没改过来。/ship 是 P1 级要养成的习惯。
**下次记得**：**任何 2+ 个 repo 同时 commit 场景 → /ship**，不手工 cd 切仓。

### 应该用 `/handoff`（漏了，虽然还没到收尾但…）

本次到 "本 retro 生成" 阶段，已经进入收尾。完整收尾流程：
```
/retro（本操作）
  ↓
/handoff（生成 HANDOFF.md）
```

**本次走到 /retro 就停了**，HANDOFF.md 没更新。下次会话 SessionStart hook 读不到今天的新状态。
**下次记得**：长会话末尾 `/retro` + `/handoff` 连跑。

---

## 通用 Playbook

### Template A · 研究 + 文档产出（Phase 1 抽象）

```
1. /warmup
2. Plan mode
3. Agent × N subagent 并行（Explore 查本地 + general-purpose 查 web）
4. 根据结果产出：
   · Edit 领域文档（加章节 / 跨文跳转）
   · Write memory/<topic>.md
   · Edit memory/MEMORY.md 索引加一行
5. ExitPlanMode
6. 用户反馈后 → 立刻 Edit memory 标注实测结果
7. /ship <repo>（如产出落在某个 repo 内）
```

### Template B · 新静态站上线（Phase 2 抽象，已沉淀为 web-scaffold.md）

详见 `~/Dev/tools/configs/playbooks/web-scaffold.md`。核心 12 行：

```
/warmup
Plan + AskUserQuestion
/site-add <name> --template <type> [--source <repo>]
（md-docs 模式）源仓加 frontmatter public: true
/ship-site <name>
Edit navbar.yaml + services.ts
menus.py render-navbar -w + build-website-navbar -w
/menus-audit
/navbar-refresh
/cf-audit
/ship <涉及的 repos>
curl 验证
```

### Template C · meta 层治理 / playbook 立项（Phase 3 抽象）

```
1. /warmup
2. 识别 meta 触发词：playbook / skill / 合并管理删除 / 各司其职 / slash audit
3. Agent × 2（盘点清单 + 深读关键 skill 源文件）
4. Plan mode
   - 覆写已完成的旧 plan（不开新文件）
   - AskUserQuestion 拍板：范围 / 落点 / 归类 / 受众
5. 执行 D1..DN（并行无依赖的先做完）
6. /retro 本次
7. /ship cc-configs configs docs
8. /handoff（如会话收尾）
```

---

## 本次漏了什么 skill

1. **/warmup 全程漏** — 三幕开头都没跑，凭 SessionStart hook 硬读
2. **/site-add Phase 2 漏** — 根因：无 md-docs 模板（Phase 3 已补）
3. **/ship-site Phase 2 漏（最严重）** — 手工 ssh + /cf × 2 + bash 全做一遍 ship-site 内部 8 步
4. **/ship × 2 phases 漏** — Phase 2 手工 gh repo create + git commit × 2；Phase 3 手工 git commit × 3
5. **menus.py 三连没有 /menus-refresh 薄封装** — render-navbar -w + build-website-navbar -w + audit 是高频三步，值得薄封装（Phase 3 /distill 已标记为空隙但未动手实现）
6. **/handoff 会话收尾漏** — 跑完 /retro 应该立刻 /handoff 更新 HANDOFF.md

**下次你看到我**：
- ssh VPS 写配置 → 说"用 /ship-site"
- 手工 cd 两个以上 repo 跑 git → 说"用 /ship"
- 开新任务不先摆状态 → 说"先 /warmup"
- 跑完 retro 不收尾 → 说"/handoff"

---

## 本次做对的事

1. **Plan mode × 3 幕** — 三次主要决策（forex / assets / meta）都进 Plan
2. **AskUserQuestion × 12 题 + 全部推荐落地** — 每次 Plan 前都拍板推荐，0 分歧
3. **TaskCreate/TaskUpdate 跟踪** — 两次分别 9 个 + 6 个 task，逐个完成
4. **Agent subagent 并行** — Phase 1 / Phase 3 各用 2 个 agent 并发，省主上下文
5. **/cf 三联都走 skill** — Phase 2 的 CF DNS / Origin Rule 部分是本次用对的 skill
6. **/navbar-refresh / /cf-audit / /menus-audit 走 skill**（Phase 2）
7. **Memory 实时更新** — Forex Club 开通消息立刻标 ✅
8. **Plan 覆写**（Phase 3 的 meta 任务） — 认识到这是新任务不是 forex plan 延续
9. **诚实标注漏用 skill** — 三个 retro + playbook 都明确列 anti-pattern，不粉饰

---

## 心智模型 · 本次会话的独特价值

这不是普通的"一个任务完成"复盘。是一个 **三幕升维** 闭环：

| 幕 | 维度 | 用户口令 | CC 动作 | 产出 |
|----|-----|---------|---------|------|
| 一 | **具体问题求解** | "IBKR 换汇 vs HK 银行，哪个好" | 调研 + 量化 + 建议 | 研究文档 + memory |
| 二 | **生产系统上线** | "把这些内容发成网站" | Plan + 执行 + 验证 | assets.tianlizeng.cloud 上线 |
| 三 | **meta 层治理** | "你把做的事情 playbook 一下" | 复盘 + 识别漏用 skill + 补齐 playbook + 扩 slash 自审 | 5 件套 + playbook + 本 retro |

**关键洞察**：第三幕的 **长期价值** 超过前两幕。前两幕是"一次性产出"；第三幕把"下次"变成了"按 playbook 走"。这种 **从具体任务升维到工具治理** 的习惯，是 CC 长期生产力的复利来源。

**触发第三幕的用户口令是"meta 信号"**：
- "你把做的事情 playbook 一下"
- "有对应的 slash 吗"
- "各司其职，合并管理删除"
- "你自己 slash command 好好严格管理"

看到这些口令 → 识别为 meta 治理任务 → Plan 升维 → 执行 → 写 retro + playbook 沉淀。

---

## 本次 session 完整 slash / skill / bash 调用次序

> 本节只列 slash / skill / subagent / 关键 bash 里程碑，**不列** Read/Edit/Write/Grep 等底层工具细节。

```
[Phase 1 · Forex]
1.  Agent × Explore    → 读现有 forex 文档
2.  Agent × general    → WebSearch HK 银行 spread
3.  Plan mode
4.  Write plan 文件
5.  ExitPlanMode
6.  Edit docs/forex-spread.md
7.  Edit docs/ibkr-forex.md
8.  Write memory/reference_hk_fx_channels.md
9.  Edit memory/MEMORY.md
10. Edit memory (用户反馈后) 标记 Forex Club ✅

[Phase 2 · assets launch]
11. Agent × general-purpose（验证主站 navbar / 旧文档盘点）
12. Plan mode + AskUserQuestion × 4
13. Plan mode + AskUserQuestion × 3
14. ExitPlanMode
15. Skill: /site-add（只读了文档，没真跑）
16. 手工 scaffold（mkdir + cp + Write × 3）← 漏 /site-add
17. Edit × 9（给 9 篇 md 加 frontmatter）
18. bash generate.py（本地验证）
19. 手工 /cf dns add + /cf origin-rules add（这两步走 skill 了）
20. 手工 ssh VPS 写 nginx + reload（漏 /ship-site）
21. bash deploy.sh
22. curl 200 验证
23. Edit navbar.yaml + services.ts
24. bash menus.py render-navbar -w
25. bash menus.py build-website-navbar -w
26. /menus-audit（走了 bash）
27. /navbar-refresh（bash 脚本形式）
28. /cf-audit
29. 手工 git commit + push（漏 /ship）× 2 repos
30. 手工 gh repo create（未走 /promote）

[Phase 3 · meta 治理]
31. Agent × Explore（slash 生态盘点）
32. Agent × general-purpose（深读 ship-site/launch/distill/retro）
33. Plan mode（覆写 forex plan）
34. AskUserQuestion × 4
35. Write plan 文件（覆写）
36. ExitPlanMode
37. Edit cc-configs/commands/site-add.md（加 md-docs template）
38. Write configs/playbooks/web-scaffold.md（META §3 八节）
39. Write docs/knowledge/session-retro-20260419-assets-launch.md
40. Edit cc-configs/commands/distill.md（泛化 + slash-audit Phase 3.5）
41. Edit configs/playbooks/META.md（§5 🚧→✅）
42. 手工 git commit + push × 3 repos（仍漏 /ship）

[收尾]
43. /retro（本文件）← 当前
44. /handoff（应该）
```

**统计**：
- 用了 slash / skill：约 10 次（/menus-audit ✓ · /navbar-refresh ✓ · /cf-audit ✓ · /cf dns/origin × 2 ✓ · Skill:/site-add 打开但没跑 · …）
- 漏用 slash：约 8 次（/warmup × 3 幕 · /site-add × 1 · /ship-site × 1 · /ship × 3 phases · /handoff × 1）
- 手工 bash 做本该有 skill 的事：8 处

---

## 下次抄作业（总 Playbook）

如果下次用户开一条"类似 arc"的会话（研究 → 上线 → meta 治理），按这个节奏：

```
【Phase 0 每次都做】
/warmup

【Phase 1 · 研究类】
Plan mode
→ Agent × N 并行（本地 + web）
→ 产出文档 + memory
→ ExitPlanMode

【Phase 2 · 上线类】
Plan mode
→ AskUserQuestion 锁规格
→ 按 web-scaffold.md 路径 A 走：/site-add → /ship-site → navbar SSOT 三连 → /navbar-refresh → /cf-audit → /ship

【Phase 3 · meta 治理】
识别 meta 触发词
→ Agent × 2 盘点
→ Plan mode（覆写旧 plan）
→ 执行 D1..DN
→ /retro 本次
→ /ship 所有改动 repo
→ /handoff 收尾
```

看到"用户问 X 合不合理 / 建不建议" → Phase 1
看到"用户想发布 X / 建站 X" → Phase 2（按 web-scaffold.md）
看到"用户说 playbook / 合并管理 / 各司其职" → Phase 3

---

## 答自检 3 问

1. **用户下次遇到类似任务，抄本文的哪几行就能指挥 CC？** — 「下次抄作业」节 3 个 Phase 共 ~25 行。
2. **我本该用 skill 却走了 bash 的地方在哪？** — 「本次漏了什么 skill」节 6 条 + 「完整调用次序」节标 ← 漏。
3. **这套流程能抽象成多少条 /command 编排？** — Phase 1 ≈ 5 条，Phase 2 ≈ 12 条（web-scaffold.md），Phase 3 ≈ 8 条。

三问都有明确答案 → retro 可交付。
