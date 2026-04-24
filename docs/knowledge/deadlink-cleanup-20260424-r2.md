# Dead Link 清剿 v0.2 → v0.3 · Path Registry Playbook

> 2026-04-24 轮 2 · 173 → 21（-88%） · 7 repo 推完 · 0.99% dead ratio
>
> 本文档**双用途**：
> 1. **Retro**：这轮为什么做、怎么做的（谁在未来再打开 `paths.yaml` 时能接得上）
> 2. **Playbook**：以后每次大规模搬迁 / 重构后，按这个流程清死链

---

## Context（为什么要做）

`~/Dev` 在 2026-04-20 做了分层重构（`stations/` / `labs/` / `tools/` / `content/`），大量老路径散落在文档、skill、playbook、HANDOFF 里。指着旧路径的引用就是"死链"——文档看起来有用，真点进去是 404。

2026-04-24 立了 **路径注册表 SSOT**（`~/Dev/paths.yaml` + `devtools/lib/tools/paths.py`），核心协议：

```
paths.yaml  ←  手写唯一
   │
   ├─► paths_const.py       (build-const 派生出 Python 常量)
   ├─► allow_missing        (故意不存在的路径 → scanner 跳过)
   └─► migrations            (old → new 搬迁映射 → rewrite-dead 批量重写)
```

**CLI 4 件套**（都在 `~/Dev/devtools/lib/tools/paths.py`）：

| 命令 | 用途 |
|---|---|
| `resolve <id>` | 查单条 path |
| `build-const -w` | 派生 `paths_const.py` |
| `audit` | 扫 CLAUDE.md + playbooks + commands 里**未登记**的硬编码候选 |
| `scan-dead` | 扫 `~/Dev` 全量**指向不存在路径**的死链 |
| `rewrite-dead` | 按 `migrations:` 批量重写（backtick-aware） |

轮 1（上一会话）砍到 166 条。本轮（轮 2）砍到 **21 条 · 0.99%**。

---

## 战果一览

| 指标 | 数字 |
|---|---|
| scan-dead dead 数 | 350 (起点) → 166 (轮 1) → **21 (轮 2)** |
| dead ratio | ~10% → **0.99%** |
| allow_missing entries | 9 → **40+** |
| migrations 条目 | 25 → **45+** |
| 推的 GH repo | 7（dev-meta / devtools / cc-configs / configs / stations / cockpit / dockit-ext） |

---

## 本轮做了什么（Playbook 式编排图）

```
/warmup                           # 看 git + HANDOFF 状态
   │
   ▼
Plan mode + ExitPlanMode           # 先确认范围再动手（破坏性 = commit 动 7 repo）
   │
   ▼
┌─────────── Phase 1 ───────────┐
│ Edit paths.py                  │   加 4 个 SCAN_EXCLUDE_FILENAMES
│ scan-dead                      │   173 → 136 (-37)
└────────────────────────────────┘
   │
   ▼
┌─────────── Phase 2+3 ──────────┐
│ Edit paths.yaml                │   allow_missing +30 / migrations +7
│ rewrite-dead (dry-run → apply) │   136 → 98 (-38)
│ + 发现 backtick bug 补 regex   │   98 → 76 (-22)
└────────────────────────────────┘
   │
   ▼
┌─────────── Phase 4 ────────────┐
│ Glob 各脚本实际现址           │   8 个 Glob 并行
│ Write repo-manage.md 整改      │   11 refs 清
│ Edit bid/SKILL.md（部分 🚧）   │   7 refs 清
│ Edit scan.md / auggie-map.md…  │   散件
│ scan-dead                      │   76 → 21 (-55)
└────────────────────────────────┘
   │
   ▼
┌─────────── Phase 5 ────────────┐
│ 并行 7 × git add/commit/push   │   run_in_background，同 message 7 个 Bash
│ (1 失败: bids/ 被 gitignore)   │   序列修一次
└────────────────────────────────┘
   │
   ▼
┌─────────── Phase 6 ────────────┐
│ Write _deadlinks-remaining.md  │   新剩余报告（按 8 类 + 下轮策略）
│ Edit HANDOFF.md v0.3           │   关 TODO#1 + 更新 decision#5
│ git commit + push dev-meta     │
└────────────────────────────────┘
```

---

## 分阶段拆解

### Phase 1 · Scanner 排除（`~/Dev/devtools/lib/tools/paths.py`）

**本次怎么做**：`SCAN_EXCLUDE_FILENAMES` 追加 4 条。

```python
"search_index.json",          # MkDocs 搜索索引（生成物）
"_deadlinks-remaining.md",    # 本 SSOT 报告自己列 dead path 作为样例，反被扫成 dead
"PROGRESS.md",                # menus/ PROGRESS 是历史快照
"entries.json",               # cclog/logs 数据流
```

**正确姿势**：凡是**生成物** / **历史快照** / **以 dead path 为数据的元文档**，都属于"看起来像但不该被扫"的类别，第一时间加 exclude，而不是想办法让内容不死。

**下次记得**：MkDocs / Vitepress / Sphinx 等文档站构建后都会产生 `search_index.json` 类文件，每接入一个新文档站就预添加。元报告（本文档 / `_deadlinks-*.md` 等）用 `SCAN_EXCLUDE_FILENAMES` 盖住，别让 scanner 扫自己的输出。

---

### Phase 2 · allow_missing 扩充（`~/Dev/paths.yaml`）

**本次怎么做**：追加 30 条 `allow_missing`，全部带 `reason` + `added` 日期。

三类典型：

```yaml
# 1. 模板占位符（泛指符）
- path: ~/Dev/xxx
  reason: 各 README/HANDOFF 的 <name> 泛指符
  added: 2026-04-24

# 2. 🚧 未立的前瞻脚本
- path: ~/Dev/devtools/scripts/web-deploy-verify.sh
  reason: 🚧 HANDOFF_vps 提到的验证脚本，未立
  added: 2026-04-24

# 3. docs 示例前缀
- path: ~/Dev/stations/example
  reason: docs 示例路径（station-architecture 讲解用），非真实项目
  added: 2026-04-24
```

**正确姿势**：`allow_missing` 用 **startswith 前缀匹配**，一条登记可盖一批 ref（如 `~/Dev/stations/example` 盖住 `example/deploy.sh` / `example/generate.py` / ... 8 条）。

**下次记得**：新立未来要做的脚本、写 README 模板、做架构 demo 文档时，**先登 `allow_missing` 再写文档**，不要等 scan-dead 报错再补。`reason` 字段必写，未来 3 个月后你不记得为什么"允许"它。

---

### Phase 3 · migrations + rewrite-dead（`~/Dev/paths.yaml` + CLI）

**本次怎么做**：加 7 条 migrations，然后 `rewrite-dead --dry-run` 预览 → 实跑。

```yaml
- {from: /Users/tianli/Dev/cockpit, to: /Users/tianli/Dev/labs/cockpit}
- {from: ~/Dev/cockpit,             to: ~/Dev/labs/cockpit}
- {from: ~/Dev/essays,              to: ~/Dev/content/essays}
# ...
```

**本次发现的 regex bug**：rewrite-dead 原来的 lookahead 字符集 `[/\s'\"()\[\]|,;:.]` **漏了 backtick** `` ` `` 。Markdown 表格 / inline code 里的 `` `~/Dev/cockpit` `` 不会被 rewrite。补了一字符搞定：

```diff
- r"(?=[/\s'\"()\[\]|,;:.]|$)"
+ r"(?=[/\s'\"`()\[\]|,;:.]|$)"
```

加了这个字符后，`rewrite-dead` 又清出 5 条之前漏的。

**正确姿势**：
1. 搬目录 / 改名时，**先登 `migrations:`** 一条，再 `rewrite-dead --dry-run` 看影响面，再实跑
2. 同一目录同时登 `~/Dev/xxx` 和 `/Users/tianli/Dev/xxx` 两个 from（因为文档里两种写法都有）
3. `migrations` 按**具体路径放前面、通用路径放后面**，避免父路径误伤子路径（`~/Dev/hydro-*` 先于 `~/Dev/*`）

**下次记得**：任何 `mv ~/Dev/<name> ~/Dev/<subdir>/<name>` 的动作，配套 3 步：
```bash
# 1. paths.yaml 加 migration（双写 ~/ 和 /Users/tianli/）
# 2. 预览影响
python3 ~/Dev/devtools/lib/tools/paths.py rewrite-dead --dry-run
# 3. 实跑 + commit
python3 ~/Dev/devtools/lib/tools/paths.py rewrite-dead
```

---

### Phase 4 · 热点文件手工修

剩下的死链按"文件引用密度"排序，Top N 文件逐个决策。本次 3 个热点：

#### 4.1 `repo-manage.md` · 11 refs

**根因**：3 个老脚本（`repo_audit.py` / `repo_screenshot.py` / `promote_repos.py`）早就合进 `~/Dev/devtools/repo_manager.py`，但 skill 文档没更新。

**本次怎么做**：整篇重写，统一成 `python3 ~/Dev/devtools/repo_manager.py {audit|screenshot|promote}` 三 subcommand 风格。

**正确姿势**：脚本合并 / 抽象成 subcommand 后，**当时就要更 skill 文档**。脚本迁移时 git log 能看到但 skill md 不会自动跟上。

#### 4.2 `bid/SKILL.md` · 7 refs

**根因**：7 个脚本里 4 个真不存在（未立 / 归档）。技能描述的是**半成品 pipeline**。

**本次怎么做**：
- 存在的（`report_quality_check.py` / `md_docx_template.py` / `chart.py`）→ 改对路径
- 未立的 → 标 `🚧` + 降级指令（"手工过一遍"）
- 归档的（`bid_standardize.py` in `_archive/`）→ 注释行 + 标 🚧 待重立

**正确姿势**：**写 skill 时明确区分"已实现" vs "想实现"**。用 `🚧` 标记未立脚本，降级成手工流程，而不是写一个跑不通的一键管线骗自己。

#### 4.3 散件路径错写

零碎修了 6 个文件（scan.md / auggie-map.md / station-refactor-roadmap.md / _commands-cheatsheet.md / 2 个 stations.md / dev-reorg.md / website-deploy-evolution.md），模式都是相同的：**文档里老路径没跟上搬迁**。

**正确姿势**：做完一个目录搬迁后：
```bash
python3 ~/Dev/devtools/lib/tools/paths.py scan-dead 2>&1 | tail -3
# 看 Summary，超过 20 条就该开始清；不是让它持续涨到 350 才动手
```

---

### Phase 5 · 分 repo commit + push

**本次怎么做**：7 个 repo 用同一 message 里的 7 个 `Bash(run_in_background=true)` 并行发。

**一个踩坑**：`stations/playbooks/docs/bids/` 在 `playbooks/.gitignore` 里（MkDocs 的 sync 产物）。我的 `_commands-cheatsheet.md` 修改在那层，`git add` 被拒。改 SSOT 应该去 `~/Work/_playbooks/` 或 `~/Dev/tools/configs/playbooks/`，而不是直接改 stations 里的 docs/ 构建产物。

**正确姿势**：
- `git add <specific files>` 而不是 `git add -A`（避免误提其他 pending 改动）
- 多 repo commit **天然并行**，用 `run_in_background=true`
- 改到 sync 产物时，`git add` 会报 gitignored，这是**正确报警**——应该改真正的 SSOT

**下次记得**：`~/Dev/stations/playbooks/docs/` 是 MkDocs 站的 docs 源。看起来像源码实际是 sync 产物的目录：
- `docs/bids/` / `docs/eco-flow/` / `docs/reclaim/` 都是 **gitignore 的**
- 剩下 `docs/stations.md` / `docs/hydro.md` / `docs/web-scaffold.md` 才是真源码

---

## 关键决策 & 为什么

### 为什么不直接改 scanner 识别 md-link web route（CONTENT_MANAGEMENT.md 的 `/images/...`）？

**成本 vs 收益不成比例**。改 scanner 要加正则规则 + 单测，且容易误伤。剩下的 7 条 md-link web route 几乎不构成维护负担。**记在 `_deadlinks-remaining.md` 作为 Pareto 尾部**，下次真觉得烦了再做 scanner 增强。

### 为什么用 `allow_missing` 而不是**删**文档里的 placeholder？

模板占位符（`~/Dev/xxx` / `~/Dev/hydro-xxx`）是**教学符号**，删掉文档就没法讲了。`allow_missing` 是针对这类"故意不存在"的**白名单机制**，比改文档干净。

### 为什么 meta repo（`zengtianli/dev-meta`）要 private？

`paths.yaml` 含 VPS IP / SSH 用户 / 域名，虽然不是硬密钥，**不必要地公开没收益**。public 之前至少先 audit 清 paths.yaml + CLAUDE.md 里的潜在敏感信息。

### 为什么 `rewrite-dead` 只改 `from→to`，不改代码逻辑？

**边界清晰**。scanner 只负责"检测 + 迁址"，不猜"未来脚本应该放哪"。未实现的脚本靠 🚧 + `allow_missing`，人工决策。

---

## 通用 Playbook — 以后怎么维护路径健康

### 日常（每周一次）

```bash
# 一分钟体检
python3 ~/Dev/devtools/lib/tools/paths.py scan-dead 2>&1 | tail -3
# 看 Summary；超过 30 条就该修了
```

### 做任何搬迁前

```bash
# 1. 进 plan mode 想清楚搬哪里
# 2. 批准后，第一步更新 paths.yaml 的 migrations
vim ~/Dev/paths.yaml    # 加 migration

# 3. 实际 mv
mv ~/Dev/<old> ~/Dev/<newpath>/<old>

# 4. 批量 rewrite
python3 ~/Dev/devtools/lib/tools/paths.py rewrite-dead --dry-run
python3 ~/Dev/devtools/lib/tools/paths.py rewrite-dead

# 5. 验证
python3 ~/Dev/devtools/lib/tools/paths.py scan-dead
```

### 写新文档 / 新 skill 时

- **引用路径前先查 `paths.yaml`**：`python3 ~/Dev/devtools/lib/tools/paths.py list` 看 ID
- **未实现脚本先登 `allow_missing`**，标 `🚧`
- **用 backtick 包路径**（scanner 识别友好）：`` `~/Dev/stations/hydro-reservoir` ``

### 做 refactor 收尾时

```bash
cd ~/Dev
python3 devtools/lib/tools/paths.py scan-dead > /tmp/before.txt

# ...做 refactor...

python3 devtools/lib/tools/paths.py scan-dead > /tmp/after.txt
diff /tmp/before.txt /tmp/after.txt | head -50
# dead 涨了就该在本会话内清，不留给下次会话
```

### 搬目录后的搭配 skill

当前 `/station-promote` skill 已经做了一部分（mv + python sed 重写），但 **它不消费 `paths.yaml` 的 migrations**。未来可以改成：

```
/station-promote <name>
  ├─► station_path.py 解析目标
  ├─► mv 到 stations/
  ├─► 往 paths.yaml 追加 migration 条目   ← 目前缺这步
  └─► rewrite-dead 自动跑
```

---

## 漏了什么 skill / 反思

### 本应该用但没用的

| skill | 本应该做什么 |
|---|---|
| `/retro` | 产出 Playbook 式复盘 — 本文档就是它该产出的东西，**应该先跑 `/retro` 再手写**。这是第二次漏了（首次是上轮 session 结尾），该记到 feedback memory。 |
| `/distill` | "从当前项目提炼可复用知识到全局" — rewrite-dead 的 backtick bug 修复是通用经验，应该写进全局 playbook（`~/Dev/tools/configs/playbooks/paths.md` 或 META.md 的 domains 索引） |

### 建议新立的 skill

- **`/paths-audit`** — 薄包装 `python3 ~/Dev/devtools/lib/tools/paths.py audit + scan-dead`，一键跑俩检查。目前两个命令分离，日常只用 scan-dead，audit（检查硬编码候选）经常被忘。

### 本应该做但延后的

- **Shell / TS 扩展**（`paths_const.sh` + `paths_const.ts`）：本次没做，但一旦 shell 脚本里要硬编码路径时就应该立。触发条件：下次改 `~/Dev/stations/*/deploy.sh` 发现有硬编码路径时
- **Pre-commit hook**：scan-dead 现在是手动跑；未来如果 scan-dead 稳定在 < 5 条，可以挂 `tools/configs` 或 `devtools` 的 pre-commit，新增 dead 时直接拒 commit

---

## 给下次会话的 QuickRef

```bash
# 进入点（任意目录）
cd ~/Dev

# 看当前健康度（0.99% 是本次尾状）
python3 devtools/lib/tools/paths.py scan-dead 2>&1 | tail -3

# 看某条 path
python3 devtools/lib/tools/paths.py resolve menus_ssot --expand

# 全量列表（有 ID 的 path 才在列表）
python3 devtools/lib/tools/paths.py list

# 扫硬编码候选（audit unregistered）
python3 devtools/lib/tools/paths.py audit

# Python 脚本里 import paths
python3 -c "
import sys; sys.path.insert(0, '/Users/tianli/Dev/devtools/lib')
from paths_const import MENUS_SSOT, CLAUDE_MD_DEV, VPS_SSH
print(MENUS_SSOT)
"
```

## 剩余 21 条与下次会话

详见 `~/Dev/_deadlinks-remaining.md`。按 8 类分布，全部属于 Pareto 尾部。

可选 4 项优化（全做完可降 < 5 条）：
1. scanner 增强：识别 `/images/*` / `/projects/*` 等 web 路由前缀
2. scanner 增强：识别 `[bold red](#)` 这类 markdown 格式化非链接
3. 删 `stations/docs/projects/` 下 3 个死 symlink
4. 补 LICENSE 文件到 yabai / karabiner

**不建议做**：如果追求 0 dead 会让 scanner 过度耦合到具体文档风格，**0.99% 已经是 Pareto 最优解**。
