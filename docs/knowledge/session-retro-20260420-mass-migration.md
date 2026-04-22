# Retro · 大规模迁移 N 个相似项目（Streamlit → Next.js）

> 2026-04-20 · 单日长会话 · 11 个 Streamlit 站 → 3 端到端 + 9 scaffold + 2 新 slash command。本 playbook 抽象成：**"把 N 个 XXX 迁成 YYY"类任务的 CC 编排 SOP**。

## 关键数字

| | 数 | 说明 |
|---|---|---|
| 本该用却漏了的 skill | **4** | `/ship`、`/simplify`、`/audit`、`/context` |
| 新造的 slash command | **2** | `/stack-classify`、`/stack-migrate` |
| 纯工程工作（无法 skill 化）占比 | ~60% | 基建 Write / 通用组件 / Pilot A 真 compute |
| 编排动作（该走 skill）占比 | ~40% | 规划 / 分类 / 批量刷 / 验证 / 收尾 |

---

## 核心编排（下次抄这个）

```
用户口令「把 N 个 A 迁成 B，一次做完」
  ↓
【入场】       /warmup                   ← 看 HANDOFF / skills / git 状态
  ↓
【规划】       Plan mode (plan-first)
               AskUserQuestion × 4-5     ← 把"模糊"收敛到"可执行"
               ExitPlanMode
  ↓
【清单】       /stack-classify            ← 扫全范围，分技术栈 × 活跃度 × 部署
  ↓
【基建】       Write 共享基础设施        ← 通用 tokens/组件/脚手架（工程，无 skill）
               pnpm -r typecheck          ← 基建质量门
  ↓
【Pilot ×1】   手工端到端迁一个代表       ← 不要直接写批量脚本！
               (踩完 bug、坑、配置问题)
               本地 curl 联调
  ↓
【抽 pattern】 Write scaffold 脚本        ← 把 pilot 的非业务部分固化
               Write 通用组件到共享包     ← 覆盖 80% 场景的 props
               修 scaffold 模板用通用组件
  ↓
【批量刷】     scaffold <A2> <A3> ... --force
               pnpm -r typecheck          ← 全绿才 OK
               /menus-audit               ← 确认 SSOT 未破坏
  ↓
【收尾】       /ship <所有改动的 repo>
               /handoff                   ← 列 TODO + symlink 到子 repo
               /retro                     ← 抽 playbook 给未来
```

**关键数字**：10 步编排，其中 4 个 slash command + 2 个质量门 + 2 个工程段。

---

## Phase 1 · /warmup（本次做了 ✓）

### 触发时机
进入长会话前、陌生项目前、不确定 HANDOFF 状态时。

### 本次怎么做的
开头跑了 `/warmup`，拉出 4 个全局 skill 已载入 + HANDOFF（R7 站群治理遗留）+ 提示该跑 `/harness`。

### 正确姿势
任何"我要改一堆东西"的任务，**第一个动作就是 `/warmup`**。不问时间长短，30 秒。

### 下次记得
看不到 HANDOFF 或 skills 载入列表前，别着急动手。

---

## Phase 2 · Plan mode + AskUserQuestion × 4（本次做了 ✓）

### 触发时机
"做 X"里的 X 有歧义（整理？重构？还是删除？），或涉及多 repo 多天的改造。

### 本次怎么做的
- 自动进入 Plan mode（系统提示"Plan mode active"）
- 4 轮 AskUserQuestion，每轮 2-4 个问题：
  1. 视觉基准 / 统一深度 / Streamlit pilot / Next.js pilot
  2. 存量处置 / 组织形式 / 整理目标（用户答"我不想用 streamlit 了"→ 大拐点）
  3. 后端组织 / Pilot 项目
  4. （隐含）补充意图
- ExitPlanMode 批准 → 进 auto mode

### 正确姿势
**4-5 轮是经验值**。每轮 ≤ 4 个问题，推荐选项放第一个加 "(推荐)"。
- 第 1 轮：范围/深度（规模定在哪）
- 第 2 轮：存量处置（全改 vs 新项目 vs 分梯度）
- 第 3 轮：技术组合（monorepo / 通信 / 语言）
- 第 4 轮：Pilot 样板选谁

### 替代方案
单文件小改不用 Plan mode，`AskUserQuestion` 一轮就够。

### 下次记得
用户说"模糊话"（如"整理"、"统一"、"改好"）时，别猜意图，**一定进 Plan mode + AskUserQuestion**。用户本轮明确说过"不确定就多问"。

---

## Phase 3 · /stack-classify（本次新造 ⭐）

### 触发时机
需要知道"我有多少个 X 要处理"、"哪些该迁、哪些归档"时。

### 本次怎么做的
之前无此 skill。新造了 `~/Dev/tools/cc-configs/commands/stack-classify.md` + `~/Dev/devtools/lib/tools/classify.py`（纯 stdlib），扫出 47 项目 · 11 streamlit 待迁 · 2 archive 候选。

### 正确姿势
```
/stack-classify                        # md 表格
/stack-classify --format table         # 命令行快看
/stack-classify --format json --filter hydro   # 筛 hydro 子集
```

### 替代方案
真想简单用 `ls ~/Dev/ | wc -l` 可以拿总数，但**拿不到技术栈 + 部署 + 活跃度**三维分类。

### 下次记得
做"治理 / 整理 / 批量迁"前先 `/stack-classify`。别凭感觉列 repo。

---

## Phase 4 · 基建 Write（纯工程，无 skill 化）

### 本次怎么做的
手工 Write：
- `~/Dev/web-stack/pnpm-workspace.yaml + turbo.json + package.json + CLAUDE.md`
- 5 packages × 各自 `package.json + tsconfig.json + src/*`
- 全局跑 `pnpm install` × 若干次

### 质量门：pnpm -r typecheck
跑完 typecheck 11 apps + 5 packages 全绿才进下一步。

### 正确姿势（没 skill，但有 pattern）
基建骨架文件必然是纯手写，但**每改一个 workspace 就跑一次 typecheck**——这是廉价的基建质量门。

### 下次记得
大量 Write 之后**不 typecheck 别走**。typecheck 过了再进 Pilot 节省调试时间。

---

## Phase 5 · Pilot × 1（本次手工做 ✓）

### 触发时机
N > 3 的批量迁移时，**必须**先手工做一个完整端到端。

### 本次怎么做的
hydro-reservoir 手工迁：
- 读 app.py + core 模块（Read × 5）
- 写 api.py 从 app.py 的 `run_calculation_from_xlsx` 翻译
- 前端 page.tsx 上传 / 步长 / 结果 3 卡片
- 本地 `uvicorn + pnpm dev` 双终端
- `curl --noproxy '*'` 测 end-to-end
- 踩坑 3 个（`res_up_res` bug / CJK header latin-1 / 缺 `python-multipart`）

### 正确姿势
**不要直接写批量脚本！** 先手工完整跑一个，记录所有坑。**如果这步跳过，N 个站会把同样的坑踩 N 次。**

### 替代方案
如果 pilot 的业务逻辑真的无法手工翻译（比如原码是黑箱），可以先写"echo mode"占位，至少把基建 + 通信 + 部署链路打通。

### 下次记得
Pilot 阶段是**踩坑补贴**——花的时间不白费，之后批量阶段省 N 倍。

---

## Phase 6 · 抽 pattern（新造 `/stack-migrate` ⭐）

### 触发时机
Pilot 成功后，要把"非业务的骨架"固化成脚本。

### 本次怎么做的
- Write `~/Dev/devtools/lib/tools/stack_migrate_hydro.py` — 读 plugin.yaml + services.ts，写 13 个文件（Next app 10 + api.py + pyproject patch）
- Write `~/Dev/tools/cc-configs/commands/stack-migrate.md` — 薄封装调脚本
- Write `~/Dev/web-stack/packages/ui/src/patterns/xlsx-compute-form.tsx` — 通用 form 组件（196 行）

### 正确姿势
通用组件 props 数 **≤ 5**。本次 XlsxComputeForm：`apiBase` / `computePath` / `params` / `headers` / `footerSlot`，覆盖 90% hydro-* 场景（9 站里 ~6 站直接用，3 站 annual/rainfall/risk 需定制）。

### 替代方案
如果 pilot 的业务差异太大（比如 hydro-risk 的 4-phase），**别强行通用**——给它留定制路径，其他走通用。

### 下次记得
抽 pattern 前先问自己："这个 prop 数量是不是超过 5 了？" 是 → 拆成两个组件。

---

## Phase 7 · 批量刷（`/stack-migrate --force`）

### 触发时机
Pilot 验证 + 通用组件抽完后。

### 本次怎么做的
```bash
for r in hydro-annual hydro-capacity hydro-district ...; do
  /stack-migrate "$r" --force
done
# 8 站 × 13 文件 = 104 个文件，~5 秒跑完
```

然后 `pnpm install + pnpm -r typecheck` 确认 11 apps 全绿。

### 质量门 1：pnpm -r typecheck
全 workspace 类型检查。本次全绿。

### 质量门 2：/menus-audit
确认新基建（`@tlz/menu-ssot`）没破坏现有 SSOT 的 8 个 drift 项。本次 8/8 全绿 ✓。

### 正确姿势
```
/stack-migrate <repo> --force     # 单个覆盖
循环跑 × N 站
pnpm -r typecheck                  # 质量门 1
/menus-audit                       # 质量门 2
```

### 下次记得
批量跑完**立即**两个质量门。不跑就汇报的话，用户会发现你"完成"了但没验证。

---

## Phase 8 · 收尾（本次做了 2/3 ✗）

### 做了的
- ✓ `/handoff`（三合一：recap + harness + HANDOFF.md）
- ✓ `/retro`（本文）

### 漏了的
- ✗ **`/ship`** — web-stack + 9 hydro-* repos 的所有改动还没 commit + push 到 GitHub

### 正确姿势
```
/ship web-stack \
      hydro-reservoir hydro-annual hydro-capacity hydro-district \
      hydro-efficiency hydro-geocode hydro-irrigation hydro-rainfall hydro-risk \
      hydro-toolkit audiobook \
      devtools cc-configs
```

一条命令 13 个 repo 并行 commit + push。

### 下次记得
`/handoff` 和 `/ship` **成对使用**。handoff 写完必 ship，否则下次 `/warmup` 看到"脏 repo"会再问一遍。

---

## 本次漏了什么 skill（教育节）

### 1. `/ship` 没用（最严重）

**本次做了**：全程 Write/Edit 改了 13 个 repo，一次都没 commit。

**正确姿势**：重要 phase 完成（如 Pilot 端到端跑通、批量刷完）后必 `/ship`。

**下次你看到我漏了**：直接说"**用 /ship**"。

### 2. `/simplify` 没跑

**本次做了**：大量新写代码（monorepo 基建 + 6 个 tsx + FastAPI wrapper + migrate 脚本），没复查。

**正确姿势**：大段新代码写完后 `/simplify` 做一次 reuse / quality 审查。

**下次你看到我连续写 > 200 行新代码**：说"**用 /simplify**"。

### 3. `/audit` 没跑（每个 hydro-* repo）

**本次做了**：新加的 `api.py` + `pyproject.toml` 修改，没做 repo 完整性审计。

**正确姿势**：改完 repo 文件结构，`/audit` 对照 `repo-standards.json`。

**下次你看到我动了 repo 根目录文件**：说"**用 /audit**"。

### 4. `/context` 没跑（长会话中期）

**本次做了**：单 session ~100+ 轮工具调用，没监控 context 健康。

**正确姿势**：长会话每 50 轮跑一次 `/context health` 看 token 余量，防 compact 丢关键状态。

**下次你看到会话超长**：说"**用 /context**"。

### 诚实承认：下次你看到我手工 bash 做本该有 skill 的事，直接说"用 /xxx"。

---

## 通用 Playbook · 下次抄这个

**任务类型**：大规模迁移/改造 N 个相似项目（N ≥ 3）。
**典型场景**：Streamlit → Next.js / Python CLI → Rust Tauri / Vue 2 → Vue 3 / ...

```
1. /warmup
2. Plan mode + AskUserQuestion × 4-5
3. /stack-classify                       ← 出清单
4. 基建 Write（工程） + pnpm -r typecheck  ← 基建质量门
5. 手工 Pilot × 1（端到端 + 踩坑）
6. 抽 scaffold 脚本 + 通用组件（props ≤ 5）
7. scaffold × N --force（批量刷）
8. pnpm -r typecheck + /menus-audit     ← 质量门 × 2
9. /ship <所有 repo>
10. /handoff + /retro
```

**时间分配**（本次实际）：
- 规划：10%（4 轮 AskUserQuestion）
- 基建：15%（monorepo + 5 packages）
- Pilot：25%（1 个完整端到端，含 3 个坑）
- 抽 pattern：15%（1 脚本 + 1 组件）
- 批量：10%（8 站一次性 --force）
- 收尾：5%（handoff + retro，漏了 ship）
- 研究/验证：20%（读 app.py、curl smoke、typecheck）

**判断何时退化**：
- N < 3 → 直接手工，不抽 pattern（省事）
- N > 3 但业务差异大 → 每个都单独 pilot（如 hydro-risk 4-phase 需单独处理）
- 基建 N 倍复杂 → 先只做基建+ 1 个 pilot，批量推迟下轮

---

## 附：关于 Plan-first 与本次的冲突

本次 CLAUDE.md 规则要求「任何新任务的第一动作必须是 3 步：/warmup → 查 playbook META → 按 playbook 执行」。

**本次 META.md 里没"大规模迁移"domain**（只有 stations / hydro / bid / docx / web-scaffold / dotfiles）。

所以走的是"Step 4 — 立新 playbook"路径。本文即是那个新 playbook 的草稿。

**下次请求**：把本文或其精简版加到 `~/Dev/tools/configs/playbooks/mass-migration.md`，并在 `META.md §5 domains 索引` 加一行：

```
| 迁移 / 批量改造 / 全迁 / Streamlit→Next / Vue2→Vue3 | mass-migration.md |
```

这样下次用户说"把 N 个 X 迁成 Y"时，CC 第一反应是打开 mass-migration.md 按 10 步走，而不是现场发明流程。
