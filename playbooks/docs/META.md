# Playbook OS · 元协议

> 任何任务的入场协议。Claude Code 来到新任务时，**第一动作**必须是查这份文档。

---

## §1 · Playbook 是什么 / 不是什么

**Playbook 是** — 一类任务的**编排模板**，以 slash command / skill 为主角串成动作链。模块化、可复用、每次相同类任务照它走。

**Playbook 不是** —
- 不是事后的复盘流水账（那是 session-retro，用 `/retro` 生成）
- 不是散装 bash 步骤清单（工具调用细节交给 skill 实现）
- 不是一次性脚本（次性操作走 ad-hoc）
- 不是项目源码 README（那是代码说明）

**判断标准**：若同一类操作未来会**重复出现 2 次以上**，就应该有 playbook。

---

## §2 · 任何任务的入场 4 步

**Step 1** — `/warmup`
- 看当前加载的 skills、CLAUDE.md、HANDOFF、git 状态
- （短任务可略，多步/陌生项目必做）

**Step 2** — 查 `~/Dev/tools/configs/playbooks/META.md` 的 §5 domains 索引
- 按 **trigger words** 匹配用户意图到对应 domain
- 读该 domain 的 playbook 文件（`stations.md` / `hydro.md` / ...）

**Step 3** — 按 playbook 的**编排图**执行
- slash command / skill 链式调用
- 每步验证预期（audit / curl / build 状态）
- 遇到 playbook 边界外的情况 → 回 Step 4

**Step 4** — 无匹配 playbook OR 越界
- `AskUserQuestion` 复述理解 + 拍板新 playbook 结构
- 写 playbook 草案 → 执行
- 事后按 §3 骨架补全，登记入 §5 索引

**反模式**（不允许）：
- ❌ 跳过 Step 1-2 直接 Edit/Bash 动手
- ❌ 不匹配 playbook 就开始"临时发挥"
- ❌ 觉得 playbook 不合适就擅自偏离（应先 AskUserQuestion）

---

## §3 · Playbook 骨架模板（所有 domain 文件必须含）

每个 `playbooks/<domain>.md` 必须有这 8 小节（顺序固定）：

### § 定位
- 这类任务是什么 / 不是什么
- 典型场景（1-3 个真实例子）

### § 入场判断
- **trigger words**（用户原话里含这些词就走本 playbook）
- **反例**（哪些 trigger words 看似相关但应走其他 playbook）

### § 编排图
- ASCII 流程图
- slash command / skill 为主角，`/warmup` 为起点，`/ship` 或 `/handoff` 为收口
- 常见分支（破坏性路径 vs 非破坏性路径）

### § 复用清单
- 现有 skill / command / MCP 工具清单（本 domain 会用到的）
- 每个说明：何时用 / 替代方案

### § 改动边界矩阵
| 改什么 | 文件 | 破坏性？| 入口 skill |
- 破坏性 = 数据结构、schema、接口契约改动 → 必须 Plan mode + AskUserQuestion
- 非破坏 = 样式、文案、参数调整 → 直接走对应 skill

### § 踩坑 anti-patterns
- 本 domain 踩过的坑（历史性 / 重复发生的）
- 每条：**现象 + 根因 + 下次怎么办**

### § 文件索引
- 关键文件绝对路径
- 每个说明：作用 / 谁消费

### § 扩展机制
- 未来新增子能力要动哪些点
- 如何新增类别 / 新增消费者 / 新增 skill

---

## §4 · 全局硬规则（任何 domain 通用）

**对齐**
- 不确定 → AskUserQuestion 复述 + 问
- 颗粒度对齐才深入实现
- 收到截图/PRD → 先按图**复述**再说方案，不靠猜

**工具选择**
- 先查 available-skills 有没有对应 skill，有就用，没有再 bash
- 手工 bash 做本该有 skill 的事 = 错，用户可直接说「用 /xxx」纠正
- 常见动作对应 skill 见各 domain playbook § 复用清单

**破坏性操作**
- 数据结构、接口契约、生产部署、git 强制操作 = 破坏性
- 必须先 AskUserQuestion 确认 或 Plan mode
- 回滚预案必须写在 plan 里

**复盘**
- 复盘默认 Playbook 风格（见 `/retro`），不写工具调用清单
- 诚实标出"本该用 skill 却走了 bash"的地方

**Plan mode**
- 多步 / 跨 repo / 破坏性 / 视觉规格 → 必须 Plan mode
- Plan 里必有：Context / Deliverables / Critical Files / Verification / 执行编排 / 回滚预案

---

## §5 · 当前 domains 索引

| domain | playbook 文件 | trigger words | 状态 |
|---|---|---|---|
| **stations** | `stations.md` | navbar / 菜单 / 站群 / 子域 / mega / site-header / 玻璃卡片 / SSOT yaml / cmds/stack/logs/website/ops-console/audiobook | ✅ 已立 |
| **hydro** | `hydro.md` | 水利 / 计算 / 年报 / hydro-xxx / Streamlit / Tauri / format=json / page.tsx / api.py | ✅ 已立（2026-04-20） |
| bid | `bid.md` | 标书 / 投标 / 副标 / 雷同破除 / track-changes | 🚧 未立 |
| docx | `docx.md` | DOCX 转 Word / 批注 / 修订 / 章节对比 | 🚧 未立 |
| **web-scaffold** | `web-scaffold.md` | 新站 / site-add / 搭建 / launch / 子域 / 静态站 / md-docs / ship-site / assets-like | ✅ 已立 |
| **mass-migration** | `mass-migration.md` | 批量迁移 / 全迁 / 把 N 个 X 改成 Y / Streamlit→Next / Vue2→3 / 架构换掉 / 不想用 X 了 | ✅ 已立 |
| **web-content** | `web-content.md` | 改 blog / 改文章 / 改 dashboard 卡片 / 改 audiobook 参数 / 改 docs 条目 / 站内文案 | ✅ 已立（2026-04-20） |
| dotfiles | `dotfiles.md` | nvim / zsh / yabai / karabiner / 配置 | 🚧 未立 |

未列出的 domain → Step 4 走 AskUserQuestion + 立新 playbook。

---

## §6 · 如何新建一个 domain playbook

1. 在 `~/Dev/tools/configs/playbooks/<domain>.md` 按 §3 骨架写
2. 回到本 META.md §5 加一行索引
3. 引入第一批 skill（至少 2-3 个常见动作）
4. 第一次使用时跑一遍全流程，发现漏洞补 § 踩坑 和 § 扩展机制
5. `/ship configs`

**不要**：一开始就把 playbook 写完美 — 允许迭代，每次用完增补

---

## §7 · 读这份文档的时机

- **每次**进入新项目目录 → 先 `/warmup` 再查本文 §5
- **每次**用户说新任务类型 → 先查 §5 匹配，无则 Step 4
- **定期**（比如每月一次或完成一类大任务后）review §5 状态，把已实践的 domain 状态从 🚧 改 ✅

---

**文件位置**：`~/Dev/tools/configs/playbooks/META.md`
**全局引用**：`~/.claude/CLAUDE.md` 的「工作字典」节指向本文
