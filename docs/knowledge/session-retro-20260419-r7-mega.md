# R7 Playbook · Mega Menu 重构 · slash command / skill 编排

> 2026-04-19 R7 · 把双行 navbar 重构为单行 5 分类 mega menu。本 MD 用 **slash command / skill** 为主角串成流程，让你下次同类任务（站群改造、navbar 变更、SSOT + 多消费者同步）直接按 playbook 走。

## 核心编排（一眼看完）

```
用户口令「@HANDOFF.md 列计划 操作」
  ↓
【入场】       /warmup                    ← 应该用（本次漏了）
  ↓
【规划】       Plan mode
              + AskUserQuestion（拍板方案）
              + ExitPlanMode
  ↓
【PR1 · SSOT】 Edit yaml/schema/renderer
              /menus-audit               ← 每次改完跑
              /ship configs devtools     ← 替代手工 git
  ↓
【PR2 · 静态】 /navbar-refresh            ← 一条命令同步 5 消费者
              /deploy stack
              /deploy cmds
              /deploy logs
              /deploy audiobook
  ↓
【PR3 · React】Edit mega-navbar.tsx / navbar.tsx
              /deploy website
              /deploy ops-console
              /menus-audit               ← 再跑一次
  ↓
【收尾】       /handoff                   ← 应该用（本次漏了，手写的）
              或 /recap + /retro
```

关键数字：**4 个现成 skill 本该用但漏了**（/warmup · /ship · /deploy · /handoff），**1 个新造**（/retro）。下次 R8 同类任务按此编排就不会再漏。

---

## Phase 0 · 入场

### 应该用 `/warmup`（本次漏了）

> warmup: 进项目先跑一句 — 告诉你当前加载的 skills、CLAUDE.md、HANDOFF、git 状态和建议动作

**本次怎么做的**：直接读 HANDOFF + PROGRESS + 4 个源文件，人肉过一遍。
**正确姿势**：先 `/warmup` 让 CC 自己把当前状态摆出来（加载了哪些 skill、HANDOFF 里在做什么、git 状态），再看要不要进 Plan mode。
**下次记得**：进项目第一条消息就是 `/warmup`，再给任务口令。

---

## Phase 1 · 规划（Plan Mode）

### 用 Plan mode + `AskUserQuestion` + `ExitPlanMode`

**触发时机**：任务涉及多 repo、多 PR、不可逆改动 → 必须 Plan mode。
**关键动作**：
1. 读 HANDOFF + 关键源文件（并行 Read 提速）
2. 写 plan 文件（`~/.claude/plans/<slug>.md`）
3. **遇到主观决策** → `AskUserQuestion` 带 ASCII preview 让用户拍板（本次问了 5 分类划分 + PR 切片方式）
4. `ExitPlanMode` 提交批准

**替代方案**：任务简单（单文件、小改动）跳过 Plan mode 直接动手；但只要跨 2 repo 就值得 Plan。

**相关 skill**：`engineering-mode`（长会话/破坏性改动必触发）· `plan-first`（批量操作规范）—— 这两个是被动触发，你不用显式调用。

---

## Phase 2 · PR1 · SSOT 改造

### Edit / Write · `/menus-audit` · `/ship`

**核心工作**（必须手工）：
- Edit `navbar.yaml`（数据模型）
- Edit `schema/navbar.schema.json`
- Edit `menus.py`（新增渲染函数）
- Write `PLAN-round7.md`
- Bash `menus.py render-navbar -w`（写 SSOT 模板）

→ 这些是**真正的工程工作**，没有 slash command 能替代。Edit/Write 就是干这个的。

### 验证：`/menus-audit`（本次跑了，但走的 Bash）

> menus-audit: 检测站群菜单/导航 yaml SSOT 与各消费者源码的漂移

**本次怎么做的**：直接 `python3 menus.py audit`（走 Bash）。
**正确姿势**：改完 yaml/schema/renderer → **立刻跑 `/menus-audit`** → 看 8 类 drift 是否符合预期。
**关键理解**：PR1 之后 `website-shared-nav-drift` 红是**预期**（PR3 补），其他 7 项应绿。红得对 = 进度正确。

### 提交：`/ship configs devtools`（本次漏了，手写 git）

> ship: Commit and push changes in one or more projects under ~/Dev.

**本次怎么做的**：分别 `cd ~/Dev/tools/configs && git add ... && git commit && git push`，两 repo 各一遍。
**正确姿势**：`/ship configs devtools` 一条搞定双 repo commit + push，commit message 会自动生成（或按规范填）。
**为什么本次漏了**：有 auto-sync 机制已经捎带提交过几次，我想"手工写 commit message 更精确"——但 `/ship` 本身支持自定义 message，不用绕开。

**下次记得**：PR 级交付 → `/ship <repo1> <repo2> ...` 而不是手工 git。

---

## Phase 3 · PR2 · 4 静态站切换

### `/navbar-refresh`（本次漏了，走的 bash）

> navbar-refresh: 把共享 navbar 模板同步到 4 个消费者 repo，有变更就 commit+push

**本次怎么做的**：`bash ~/Dev/devtools/scripts/tools/navbar_refresh.sh`。
**正确姿势**：`/navbar-refresh` ——**这就是同一件事的 skill 封装**。
**区别**：skill 形式更标准，会在 available-skills 里被识别、统计、组合。bash 是 skill 内部实现。
**下次记得**：同步任何 SSOT 到多消费者 → 找对应 skill（还有 `/site-header-refresh` / `/site-content-refresh` / `/menus-audit`）。

### `/deploy <site>`（本次漏了 × 4，手工 cd + bash deploy.sh）

> deploy: 通用部署，适配任意有 deploy.sh 的项目

**本次怎么做的**：4 次 `cd ~/Dev/<site> && bash deploy.sh` 串行。
**正确姿势**：`/deploy stack` / `/deploy cmds` / `/deploy logs` / `/deploy audiobook`。
**价值**：`/deploy` 是通用 skill，**任何带 deploy.sh 的项目**它都能跑。不用记路径不用手工 cd，参数就是子域名/repo 名。
**下次记得**：部署单个项目 → `/deploy <name>`；多项目串行 → 连续发 4 条 `/deploy` 指令即可。

### 选择不做 ops-console

**判断**：ops-console 的 `shared-navbar.tsx` 用 `dangerouslySetInnerHTML` 并**剥 `<script>`** → mega 需要 JS → 必须换成原生 React 组件。
**决策**：PR2 不部署 ops-console，推到 PR3 一并改。
**教训**：遇到"消费者实现方式不同"时，分批部署而不是强行兼容旧接入方式。

---

## Phase 4 · PR3 · 2 React 站切换

### 核心工作（Edit/Write，无 slash）

- Write `mega-navbar.tsx`（新 React 共享组件）
- Edit `navbar.tsx`（website 的壳，改单行 + Track 色线）
- cp `mega-navbar.tsx` + `shared-navbar.generated.ts` → ops-console
- Write `shared-navbar.tsx`（ops-console 的壳，3 行包装）
- Edit `layout.tsx` × 2（加 `pt-11`）

### 构建 + 部署：`/deploy website` · `/deploy ops-console`

**本次怎么做的**：`cd <repo> && pnpm build && bash deploy.sh`。
**正确姿势**：`/deploy website` 内部会自动 build + deploy + 线上验证 CSS 哈希。
**下次记得**：React/Next.js 站也适用 `/deploy`，不用手工 pnpm build。

### 验证：`/menus-audit`

PR3 收尾跑 `/menus-audit` → **必须 8/8 全绿**（website-shared-nav-drift 已由 PR3 的 TS 更新抹平）。红了说明 PR3 没收干净。

---

## Phase 5 · 收尾

### `/handoff`（本次漏了，手写 HANDOFF.md）

> handoff: 会话收尾与交接。一步完成复盘、配置升级、交接文件生成。

**本次怎么做的**：手写 HANDOFF.md 覆盖 + 手写 PROGRESS.md round 7 段落 + 手工 git commit + push。
**正确姿势**：`/handoff` 三合一：
1. `/recap`（复盘、更新 memory/skills）
2. `/harness`（项目级 CC 配置升级）
3. 生成 HANDOFF.md

**为什么本次漏了**：我以为"手写更可控"——但 `/handoff` 的输出格式是团队约定好的，手写容易漏字段（比如踩过的坑、commits 汇总）。

### `/recap` vs `/retro` vs `/handoff`

| 命令 | 受众 | 产出 |
|---|---|---|
| `/recap` | CC 自己下次进入会话 | session-retro MD + 更新 memory/skills |
| `/retro`（本次新造）| 用户看懂 CC 用了什么流程 | slash command 编排 playbook MD |
| `/handoff` | 团队/下次会话 | HANDOFF.md + recap + harness 三合一 |

**组合建议**：单次任务结束 → `/handoff`（含 recap）。想让用户读懂流程 → 额外 `/retro`。

---

## 通用 Playbook · 下次同类任务（站群 / navbar / SSOT 改造）

抄这个走，不会漏 skill：

```
1. /warmup
     ↓ 看当前状态
2. Plan mode + AskUserQuestion + ExitPlanMode
     ↓ 决策拍板
3. 核心改造（Edit/Write yaml + schema + renderer）
     ↓
4. /menus-audit
     ↓ 验证 drift 预期状态
5. /ship <核心改造 repo>
     ↓ 提交 SSOT
6. /navbar-refresh（或 /site-header-refresh / /site-content-refresh）
     ↓ 同步到消费者
7. /deploy <消费者 1>
   /deploy <消费者 2>
   /deploy <消费者 N>
     ↓ 部署
8. /menus-audit（再跑）
     ↓ 全绿
9. /handoff
     ↓ 收尾
（可选）/retro   → 产出这份 playbook 给用户看
```

## 本次没用但下次该考虑的 skill

| skill | 场景 |
|---|---|
| `/cf-audit` | 动了子域/DNS/CF Access 时 → 跑一次确保 services.ts / CF / nginx 对账 |
| `/sites-health` | 多站改动后 → 扫 28 子域 HTTP/Access/Navbar 状态 |
| `/tidy` | 会话结束前整理目录 |
| `/simplify` | 改完代码过一遍"是否可以复用/简化" |
| `/audit` | repo 级完整性检查（README/metadata/hooks） |

## 我在本次犯的"流程错误"

不是代码错，是**该用 skill 却手工 bash**的失误：

1. 开头没 `/warmup` → 凭印象读文件，漏了 skill 列表
2. 验证用 `python3 menus.py audit` → 应 `/menus-audit`
3. 同步用 `bash navbar_refresh.sh` → 应 `/navbar-refresh`
4. 部署 4 次 `cd + bash deploy.sh` → 应 `/deploy <name>` × 4
5. 提交用手工 git → 应 `/ship <repo1> <repo2>`
6. 收尾手写 HANDOFF → 应 `/handoff`

**根因**：我倾向于"直接调 bash 更透明"，但这等于跳过 skill 层 → 失去统一、可观测、可组合。下次你看到我手工 bash 做本该有 skill 的事，直接说 "用 /xxx"。

## 附：本次实际产出（参考，不是流程重点）

| 资产 | 路径 |
|---|---|
| mega SSOT | `~/Dev/tools/configs/menus/navbar.yaml` |
| PLAN | `~/Dev/tools/configs/menus/PLAN-round7.md` |
| PROGRESS round 7 段落 | `~/Dev/tools/configs/menus/PROGRESS.md` |
| renderer | `~/Dev/devtools/lib/tools/menus.py` |
| HTML 模板 | `~/Dev/devtools/lib/templates/site-navbar.html` |
| React 组件（源） | `~/Dev/website/components/mega-navbar.tsx` |
| React 组件（copy） | `~/Dev/ops-console/components/mega-navbar.tsx` |
| HANDOFF | `~/Dev/HANDOFF.md` |
| 新 slash command | `~/Dev/tools/cc-configs/commands/retro.md` |
| 本 playbook | `~/Dev/docs/knowledge/session-retro-20260419-r7-mega.md` |

---

**下次读这份 MD 的正确姿势**：对照「核心编排」图 + 「通用 Playbook」章节即可。其他章节是解释"本次为什么这样走"的背景。
