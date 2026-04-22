# Session Retro · 2026-04-21 · 台州水预算名录回填

> 场景：两张 xlsx（源=按行业分 sheet 的独立名录表，目标=跨行业汇总的下发模板），按信用代码 + 名称匹配，9 列回填，1976 行 100% 命中。

## 核心编排

```
用户口令「根据 A 里的 X 字段回填 B 的 Y 列」
  ↓
【入场】     /warmup                          # 看 CLAUDE.md / skills / 项目状态
             /harness audit                   # SIMPLE 级，识别缺 CLAUDE.md
  ↓
【摸数据】   Bash python3 (openpyxl)          # 读两张表结构、列位、行业分布
             — 无法 skill 化（一次性探查）
  ↓
【对齐】     AskUserQuestion（文本形式）      # 2 轮澄清：K 列填啥 / 默认值 / 写入策略
             复述理解 + 列疑问点
  ↓
【规划】     plan-first（文本方案）            # 列字段规则矩阵 + 输出路径 + 匹配策略
             用户「ok」 → 进入执行
  ↓
【执行】     Write /tmp/fill_xxx.py           # 一次性脚本跑批
             Bash python3 script              # 跑
  ↓
【迭代修正】 用户提示「漏了 X」→ Bash 调试 → Edit 脚本 → 再跑
             本次迭代 3 轮：
               R1: 22 未匹配（float 信用代码 + 非标代码） → 放宽 by_name 索引
               R2: 4 行 J/K 全空（多 sheet 同名被覆盖） → merge lookup
               R3: 2 行仍空（非常规水未考虑） → 增加 L 列规则
  ↓
【收尾】     /harness 创建 .claude/ + CLAUDE.md
             Write skill（SKILL.md + fill.py + data/）
             Bash 跑 skill 对比输出（0 diff）
             /retro（本文件）
             /recap（memory + HANDOFF）
```

关键数字：**3 个现成 skill 用上了**（/warmup、/harness、/retro），**1 个新造 skill**（fill-water-budget），**0 个应有却漏用**（数据处理类任务浙江水利项目暂无同领域 skill）。

---

## Phase 1 · 入场 · `/warmup` + `/harness audit`

**触发时机**：进到新项目目录，第一个动作。

**本次怎么做的**：两个并发跑。`/warmup` 给出"SIMPLE 项目、无 CLAUDE.md、engineering-mode 已加载"。`/harness audit` 进一步出六维度报告。

**正确姿势**：✓ 就是这样。engineering-mode 加载意味着后续破坏性操作走 plan-first。

**下次记得**：进 `~/Work/*` 数据处理类目录，默认 `/warmup` 即可；复杂多步任务再 `/harness audit` 看分级。

---

## Phase 2 · 摸数据 · Bash + openpyxl（无法 skill 化）

**触发时机**：未知结构的 xlsx/csv/json 文件，需要探查 sheet/字段/分布。

**本次怎么做的**：多次 `Bash python3 -c` 跑 openpyxl，`iter_rows`、`Counter` 统计县/行业、对比源目标覆盖。

**正确姿势**：✓ 这是必要的工程工作。openpyxl 一次性脚本比手写 skill 更灵活。**不要**为了"都走 skill"把探查也封装。

**下次记得**：探查用 heredoc，**不落盘**。真正要复用的才封装 skill。

---

## Phase 3 · 对齐 · `AskUserQuestion` 风格的"复述+问"（本次走了文本）

**触发时机**：任务含隐式假设（字段语义、默认值、互斥 vs 共存）—— **必问**。

**本次怎么做的**：
- R1 问：K 管网水填什么？推送/时间默认值？原文件 vs 副本？
- R2 问：用户指出"有许可证却无自备水"的具体公司 → 查源数据 → 发现 merge bug
- 用 markdown 表格罗列规则方案（A/B/C），让用户点。

**正确姿势**：✓ 方向对。本 CLI 有 `AskUserQuestion` 工具（多选问答），结构化复述时更规范，但文本形式也行（尤其需要贴数据表）。

**下次记得**：
- 数据类任务**必有 ≥1 轮对齐**。字段语义不能自己猜。
- 如果问题是多选题（A/B/C 三选一）→ 考虑 `AskUserQuestion` 工具。开放式复述 → 文本。

---

## Phase 4 · 规划 · plan-first（本次走了文本方案）

**触发时机**：破坏性 / 多步 / 跨文件操作。engineering-mode 已加载时，硬要求。

**本次怎么做的**：用 markdown 列「字段写入规则矩阵 + 匹配策略 + 输出策略 + 脚本位置」，等用户「ok」再执行。

**正确姿势**：✓ plan-first skill 已加载就自动触发。可以**更严格**走 Plan mode（`ExitPlanMode` 工具），但文本 Plan 对一次性脚本足够。

**替代方案**：如果任务要写多文件/改 skill，正式 Plan mode 更合适（CC 会被限制只读直到 Exit）。

**下次记得**：数据处理脚本级别 → 文本 Plan；改基础设施/多 repo → 正式 Plan mode。

---

## Phase 5 · 执行 · Write + Bash（工程工作）

**触发时机**：已对齐、已规划，写代码。

**本次怎么做的**：Write `/tmp/fill_taizhou_budget.py`（一次性脚本），Bash 跑。

**正确姿势**：✓ 一次性脚本放 `/tmp` OK。**但是**如果能预见复用，从一开始就写到 `.claude/skills/<name>/`，避免后期挪位置。

**下次记得**：用户说"以后还要处理其它"这种信号 → **从第一版就写在项目目录**，不要 `/tmp`。判断关键词：「以后」「下次」「其它市/区/批」。

---

## Phase 6 · 迭代修正 · 三轮调试

**触发时机**：匹配率 < 100% 或用户指出遗漏。

**本次怎么做的**：
- **R1**（22 未匹配）：Bash 抓未匹配记录 → 定位根因（Excel float + 非标代码）→ Edit 放宽索引 → 再跑
- **R2**（4 行空）：用户给了 1 个具体公司 → 跨 sheet grep → 发现多 sheet 同名覆盖 → Edit 加 merge → 再跑
- **R3**（2 行仍空）：识别为"非常规水"类 → Edit 加 L 列规则 → 再跑

每轮都先**查一个具体样本**再改逻辑，不凭空推测。

**正确姿势**：✓ 数据匹配类问题，**永远从单一 failing case 反推**，不从总数倒推。

**下次记得**：
- 匹配率 99% 不代表完事 —— 用户会抓具体名字验证。**必须**列出 unmatched 清单让用户看。
- 聚合表（多源 merge 到一个单位）永远要防"后来者空字段覆盖先前非空" —— merge 函数而不是直接赋值。

---

## Phase 7 · 收尾 · `/harness` + skill 封装 + `/retro` + `/recap`

**触发时机**：任务完成，用户说"做好 skills / 下次还要用" / 主动收尾。

**本次怎么做的**：
1. 创建 `.claude/skills/fill-water-budget/` 结构
2. 抽出 `county_codes.json`（浙江 11 市全覆盖，支持复用）
3. 参数化 CLI（`--source / --target / --city / --date / --output`）
4. 跑一次对比老输出（**0 diffs** 验证等价）
5. `/retro`（本文件）+ `/recap`（记忆 + HANDOFF）

**正确姿势**：✓ skill 封装时记得**对比测试**—— 重构后输出必须与原脚本一致才能说"等价"。

**下次记得**：任何 `/tmp` 一次性脚本，如果**用户暗示要复用** → 收尾时封装到 `.claude/skills/`，做等价对比。

---

## 通用 Playbook · xlsx 数据回填/匹配类任务

**下次你说「根据 A 里 X 字段，回填 B 的 Y 列」，抄这个走：**

```
1. /warmup                                   # 看环境
2. Bash + openpyxl 摸结构                     # 列位、sheet、覆盖率、分布
3. AskUserQuestion 风格对齐（1-2 轮）         # 字段语义、默认值、互斥规则、写入策略
4. plan-first 列方案矩阵                     # 字段映射表 + 匹配键 + 输出路径
5. 用户 ok → 执行
   - 如果信号「以后还要用」→ 直接写 .claude/skills/<name>/ 而不是 /tmp
6. 跑 → 看 matched% + unmatched 清单         # 不要只看总数
7. 迭代修正（必来 1-2 轮）：
   - Excel float / 非标代码 → by_name 回退
   - 多 sheet 同单位 → merge 而不是覆盖
   - 漏字段（非常规水、跨 sheet 持证）→ 用户抽查反馈
8. 封装 skill（如果要复用）
   - SKILL.md 写清规则矩阵 + 关键实现点 + 限制
   - 参数化 CLI（--source --target --city --date --output）
   - 数据文件外挂（county_codes.json 等）
   - 对比老输出 0 diff 验证
9. /retro（本文件）+ /recap（记忆 + HANDOFF）
```

关键检查点：
- **永远输出 unmatched 清单**（Excel 数据必有 float/非标/重名坑）
- **merge 而不是覆盖**（多源同键必然发生）
- **1 次成功不算成功**，要跑用户的抽查 case

---

## 本次漏了什么 skill

诚实清单：

1. **开头没开 `TaskCreate`** — 到后期封装 skill 阶段才建 task 列表。虽然前期 3 步迭代不算复杂，但一旦进入"搭 skill + /retro + /recap" 多步就应该 `TaskCreate`。**下次多步任务第一动作就 TaskCreate**。

2. **初版脚本丢在 `/tmp`** — 用户显然是浙江 11 市项目，第一眼就该在项目目录写。linter 已经帮忙同步了改动，这次没造成麻烦，但**下次见到「全省 / 11 市 / 下发模板」这种信号，从一开始就写在 `.claude/skills/`**。

3. **没正式进 Plan mode（`ExitPlanMode` 工具）** — 走了"文本 Plan + 等 ok"模式。engineering-mode 说"破坏性操作走 plan mode"，虽然"输出到新文件不算真破坏"，但 **如果涉及 skill 封装/多 repo 修改**，下次该用正式 Plan mode，让用户在专门 UI 里批准。

4. **没一开始就考虑"非常规水"第三类** — 目标表摆明了有 L 列。如果开场摸数据时就把**所有待回填列**列表化，R3 就不会发生。**下次摸表结构时，先打印目标 sheet 的全部列 header**。

5. **没用 `AskUserQuestion` 工具** — 走了文本提问。这次问题较复杂需要贴数据样本，文本 OK。**但选择题式对齐（A/B/C 选一）应该用 AskUserQuestion 工具**，界面更清晰。

**用户纠正权**：下次看到我手工 bash 摸数据而不 TaskCreate 跟踪、或把脚本扔 /tmp 而不直接落项目目录，直接说"**用 TaskCreate**" / "**写到 .claude/skills/**"。

---

## 可抽出的跨项目知识（candidate for /distill）

- **浙江省行政区域代码表**（`county_codes.json`）— 其它省项目可以照抄结构扩展
- **openpyxl Excel float 科学计数法 gotcha** — 18 位信用代码被 Excel 当数字存时会变 `9.13e+17`，必须 by_name 回退
- **多 sheet 同单位 merge 范式** — 一个 `merge_rec(old, new)` 不空字段优先，几行代码解决掉一大类 bug

这 3 条如果之后还遇到，值得 `/distill` 到全局知识库。
