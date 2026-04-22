# 会话复盘 · 2026-04-21 · 台州水预算名录回填（recap）

> 主题：把按行业分 sheet 的独立水预算名录表，回填到跨行业汇总的下发模板（1976 行 9 列）；收尾阶段封装 skill + memory + retro。

---

## 1. 做对了什么

### 对齐放在动手前
两轮结构化对话：第一轮复述理解 + 列 2 个疑问（K 列填啥 / Q/T 默认值 / 写入策略 — 副本还是覆盖）；第二轮给 3 个方案（A/B/C）让用户点。第一轮被用户确认「明白」了才开始摸数据，之后方案 A/B/C 直接让用户"点选 B"。

**值得保留的模式**：数据类任务**永远 ≥1 轮对齐**。字段语义、默认值、互斥规则都不要猜。开放式问题用文本表格列举，三选一用 A/B/C。

### 输出不覆盖原文件
从方案阶段就约定"另存副本"，原模板零改动。用户明确首选后者，省去后悔空间。

**值得保留的模式**：数据处理任务的默认写入策略 = 产新文件 + 保留原件。除非用户明确说覆盖。

### 迭代修正围着单点 failing case 转
三轮修正都不是凭空推逻辑：
- R1（22 未命中）：抓具体 float 信用代码、非标 `PDY...` 代码 → 放宽 by_name 索引
- R2（4 行空）：用户给 `浙江仙居抽水蓄能有限公司` → 跨 sheet grep → 发现覆盖 bug → 写 `merge_rec`
- R3（2 行仍空）：识别"非常规水"特征 → 加 L 列规则

**值得保留的模式**：**从单一样本反推**，不从"应该是这样"推测。尤其是数据类 bug，永远比想象中更奇怪。

### skill 等价对比验证
封装 skill 后没有光说"应该等价"，而是跑了一遍 skill、diff 对比老输出，**0 差异**才标完成。

**值得保留的模式**：任何"重构 / 搬家 / 参数化"的脚本 → 必须跑等价对比。不对比 = 有内鬼。

---

## 2. 走了哪些弯路（和为什么）

### 弯路一：初版脚本扔 `/tmp`

用户的输入里「台州」只是 10 个地市之一，源文件夹目录 `04-1 全省水预算管理单位-初始表/10 台州/` —— 前缀 `10` 就明示有其它 9 个。我没把这个信号连到"复用脚本位置"。

**正确做法**：看到编号前缀（`01 杭州 / 02 宁波 / ...`）或"全省 / 全国 / 全部"字样 → 脚本直接写到 `.claude/skills/`。

**根因**：把"第一次解决"优先级放得比"可复用设计"高。没建立"看目录命名推断复用面"的反射。

### 弯路二：第一次报告只给 98% 没列 unmatched 清单

第一次跑出 1954/1976 (98%)，我主动打印了 `first 20 unmatched` —— 但**仅 20 条**。用户会看全部吗？当时没写到外部文件。第二版加了 `unmatched.log`，但是修 bug 的过程中才加的。

**正确做法**：第一次跑就要 `unmatched → log 文件`，不是"等用户要了才给"。

**根因**：把日志文件当成"debug 才用"的东西。实际数据任务，unmatched 清单是**输出产物的一部分**，不是 debug 痕迹。

### 弯路三：没考虑 L 列非常规水

目标表 header 清晰写着 `2026年水预算基准额度-合计 / 自备水 / 管网水 / 非常规水`。我在第一次摸数据时就看到了 20 列结构，但**规划阶段只提了 J/K**，漏了 L。

**正确做法**：摸数据时，先打印**完整的目标列 header**，把每一列都标注"怎么填"或"留空"，**不要有隐式选择性忽略**。

**根因**：心理偷懒 —— 用户只提了 J/K 两列分类，我就默认 L 和我无关。实际上用户没提不等于不该填，源数据里「非常规水」信号太明显，应主动询问。

### 弯路四：没用 `AskUserQuestion` 工具

两轮对齐都是文本列问题让用户回复。第二轮的 A/B/C 选项明显适合 AskUserQuestion 工具（结构化多选）。

**正确做法**：三选一用 AskUserQuestion，开放式复述用文本。

**根因**：手里的工具一多，用到哪算哪。没建立"选择题 = AskUserQuestion"的路由反射。

---

## 3. 值得学习的工程模式

### 模式：Excel float 信用代码容错
18 位统一社会信用代码（纯数字形式）被 Excel 存成 number → openpyxl 读出来是 `float` → str 化得 `9.13e+17`。两种应对：
1. **by_name 回退索引**（本轮用的）：by_code 严格，by_name 宽容；lookup 时先试 code，再试 name
2. 整行预处理：把看起来是代码的 float 转回 18 位 str（数字溢出了也无解，用方案 1 更稳）

### 模式：多源 merge_rec
聚合表常见场景 —— 同一个实体在多张源表出现，字段互补（A 表有 X 没 Y，B 表有 Y 没 X）。错误姿势：直接 `dict[key] = rec` 后来者覆盖先前。正确姿势：

```python
def merge_rec(old, new):
    if not old: return new
    m = dict(old)
    for k, v in new.items():
        if v and not m.get(k):  # 不空字段优先
            m[k] = v
    return m
```

**适用场景**：xlsx/csv 多源 join、API 响应合并、配置文件多层覆盖。

### 模式：参数化前的等价对比
一次性脚本 → skill 化 三步走：
1. **先跑老脚本**，保存输出 A
2. skill 化后跑新 skill，输出 B
3. **逐 cell diff A vs B**，0 差异才算完

没 3，就说"等价"都是嘴炮。

---

## 4. 沟通层面的反思

**用户偏好信号**：
- 「你先看下，然后明白我的意思了吗」—— 用户明确要求**先复述理解再动手**。我第一次就做对了（写了"我的理解"+"两个疑问"）。这是这类沟通的正确打开方式。
- 「浙江仙居抽水蓄能有限公司，你查下，有取水许可证的啊」—— 用户抽查的具体单位会成为 bug 定位的 root sample。**永远要认真对待用户抽查的具体名字**，不要回"我的算法应该对了"。
- 「把你这些脚本 skills 做好，放到本目录里」—— 用户清晰区分了"工作产物（xlsx 回填结果）"和"工具产物（可复用 skill）"。CC 要建立这两个层次的意识。

**CC 改进点**：
- 规划阶段列字段矩阵要**把所有目标列都列上**，哪怕只标"留空"，避免隐式遗漏。
- 选择题用 AskUserQuestion，不要光文本。
- "以后还要用"的暗示要接住 —— 信号关键词：「以后」「下次」「其它」「全部」「每个」+ 目录含编号前缀。

---

## 5. 成果清单

| 产物 | 路径 | 说明 |
|------|------|------|
| 回填后 xlsx | `04-2 .../已下发-台州市...-已回填-2026-04-21.xlsx` | 台州 1976 行 100% 回填（独立 sheet） |
| skill SKILL.md | `.claude/skills/fill-water-budget/SKILL.md` | 规则矩阵 + 用法 + 限制 |
| skill fill.py | `.claude/skills/fill-water-budget/fill.py` | CLI 参数化 `--source --target --city --date --output` |
| county_codes.json | `.claude/skills/fill-water-budget/data/county_codes.json` | 浙江 11 市县→区码映射 |
| 项目 CLAUDE.md | `~/Work/04 水预算单位名录整理/CLAUDE.md` | 项目结构、规则、命令 |
| 项目 memory | `~/.claude/projects/-Users-tianli-Work-04---/memory/` | 5 条（project×2 + feedback×2 + reference×1） |
| /retro playbook | `~/Dev/stations/docs/knowledge/session-retro-20260421-taizhou-water-budget.md` | 下次做类似任务的编排图 |
| /recap 本文件 | `~/Dev/stations/docs/knowledge/session-retro-20260421-taizhou-water-budget-recap.md` | CC 侧的做对/做错/学习复盘 |
| skill-candidates 更新 | `~/Dev/tools/cc-configs/skill-candidates.md` | +1 候选「xlsx 多 sheet 匹配回填」 |
| skill-tracker 更新 | `~/Dev/tools/cc-configs/skill-tracker.json` | /warmup /harness /plan-first /recap /retro 计数 +1 |

---

## 6. 未完成项

- [ ] 台州打捆 sheet（`其他预算单位（打捆管理）基准额度`）— 源 `2 台州市其他（打捆）水预算单位名录表.xlsx`，结构未摸
- [ ] 台州生态流量 sheet（`生态流量预算单位`）
- [ ] 台州公共供水 sheet（`公共供水预算单位`）— 源表 sheet 7 已知结构，可直接扩 skill
- [ ] 其它 10 市的独立 sheet 回填（01 杭州 / 02 宁波 / 03 温州 / ... / 11 丽水）
- [ ] 把 fill-water-budget skill 扩展成支持上述多种 sheet 的统一入口（或拆成 4 个 skill）
