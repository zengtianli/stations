# Auggie 三件套使用 · 场景判别

> 用户花了 $20 买 Indie Plan（40k credits/月），**MCP / CLI / Code Review 三件套全用起来才物有所值**。本文是判别表 — 什么场景该用哪个。

## TL;DR

| 场景 | 用哪个 | 入口 |
|---|---|---|
| **CC 会话内**做跨文件语义搜 | MCP | `mcp__auggie__codebase-retrieval` |
| **终端**一次性问答（CC 之外做） | CLI print mode | `auggie -p -a -q "..." -w <repo>` |
| **长任务 / 让 auggie 干活**（写代码、改文件） | CLI agent | `auggie -w <repo>` 不带 `-p`，进 chat |
| **PR 审查 / Code Review** | 网页 + GitHub App | [augmentcode.com](https://app.augmentcode.com/account/subscription) |
| 已知 identifier / 文件名 / 单文件局部 | 不用 auggie | Grep / Glob / Read |

## 1. MCP（Claude Code 内调）— 默认主力

**用法**：CC 会话内调用 `mcp__auggie__codebase-retrieval` tool。

**适用**：
- 跨文件语义理解（"这功能怎么实现的"）
- 数据流追踪（"A → B 怎么走"）
- 不熟悉子项目入场（"找 X 模块在哪"）
- 模糊匹配（"看起来像 X 的代码段"）

**Credits**：每次检索 ~40-70 credits（官方文档说法）。40k/月 ≈ 600-1000 次检索。

**workspace 选择**：必查注册表 SSOT，不凭直觉：

```bash
python3 ~/Dev/devtools/lib/tools/auggie_workspaces.py resolve stations
```

返回的绝对路径塞 `directory_path`。

## 2. CLI print mode（一次性问答，CC 之外做）

**用法**：

```bash
auggie -p -a -q "解释一下 menus.py 的 build-services-ts 流程" -w ~/Dev/tools/configs
```

flags：
- `-p` print 模式（一次性输出，不进 chat）
- `-a` ask mode（只读检索 + 非编辑工具）
- `-q` quiet（只出最终答案，不显示中间过程）
- `-w` workspace（必传绝对路径）

**适用**：
- 不想用 CC 主上下文 token 时（在终端单独消化）
- 写文档前研究某个 repo 的入场理解
- shell 脚本里嵌入做批量检索

**与 MCP 区别**：MCP 把结果灌进 CC 上下文继续推理；CLI print 直接把答案给你看，不走 CC。**两者 credits 计费是同一个池**。

## 3. CLI agent（让 auggie 自己干活）

**用法**：

```bash
auggie -w ~/Dev/<repo>
# 进 interactive chat，让 auggie 改文件、跑命令
```

或：

```bash
auggie "重构 hydro-toolkit 的 plugins 加载逻辑成 entry-points" -w ~/Dev/stations/web-stack/services/hydro-toolkit
```

**适用**：
- 长会话任务（CC 太贵或上下文不够）
- 让 auggie 独立把活干完（agent 模式）
- 比 CC 更激进地直接编辑文件
- **承担 CC 干不动的工作 → 把工作分流出去，credits 比 CC token 便宜**

**注意**：
- 默认 agent 模式可写文件，不要在生产分支跑（用 git worktree 隔离）
- `--max-turns N` 限制 agentic 步数
- 想纯只读 → 加 `-a` ask mode

## 4. Code Review（PR 审查）

**用法**：[augmentcode.com](https://app.augmentcode.com/account/subscription) 装 GitHub App 到 repo，PR 自动审。

**注意**：网页公告"Code Review is now 50% cheaper"，但**仍消耗 Indie Plan credits 池**。

**适用**：
- 自己开 PR 让 auggie 先审一遍再 merge
- 跨 repo 的 monorepo PR 审查（比如 `stations/`）

**不适用**：
- CC 内即时审 → 用 MCP retrieval + CC 自己读 diff，不走 Code Review
- 想多人协作 review → 网页 review 看不到 CC 上下文

## 5. 反模式（不要做）

- ❌ 已知 identifier 找 references → 用 Grep，不要 auggie（精确度差）
- ❌ 已知文件路径 → 用 Read，不要 auggie（多绕一层）
- ❌ 文件名/路径模式（`**/*.tsx`）→ 用 Glob
- ❌ 单文件局部问题 → Read + Grep
- ❌ 数据型 repo（PDF/zip/shp）→ 不索引，直接 Grep（`auggie-workspaces.yaml` 里 `indexable: false` 的别走 auggie）
- ❌ 静默 fallback：低 relevance / 401 / 429 → **立即报告用户**，不偷偷换 Grep

## 6. credits 预算建议

40k/月 = 8w token 等价（粗算）。冲刺期（到 5/27/26）建议：

| 任务量 | 单日 credits 预算 | 单次会话上限 |
|---|---|---|
| 重日代码工作 | 1-2k | 5-10 次 retrieval |
| 普通日 | 500 | 2-3 次 retrieval |
| 文档/规划日 | <200 | 0-1 次 |

超预算了 → 当月剩余天数靠 Grep + Read 兜底。subscription 页随时看余额。
