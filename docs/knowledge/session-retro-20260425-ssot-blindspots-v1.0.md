# Session Retro · SSOT 盲区补救 v0.1→v1.0 一次合并

> 2026-04-25（同日第 4 份 retro，主题独立） · 4 轮路线图（v0.1 / v0.2 / v0.3 / v1.0）一次合并落地，搞定 `/refactor-dir` 的 3 类盲区：symlink target / `allow_missing:` / 运行时拼装路径。

---

## 主题与编排

```
/warmup
  └─ HANDOFF.md (paths v1.1 已 ship 55/0/0)
  └─ HANDOFF-ssot-blindspots-v0.1-2026-04-25.md（4 轮路线图待落）
        │
        └─ 用户：「一次性完成」
              │
              ↓
        Plan mode (auto)
          ├─ Read paths.py + refactor-dir.md + paths.yaml + paths.md  ← 直读，没派 Explore
          ├─ Bash: find ~/Dev -type l (70 symlinks 全量)
          ├─ Bash: 验证 5 个 migration-hit symlink 的 new target 存在性
          └─ 写 plan：4 增量（A paths.py / B refactor-dir / C paths.md / D HANDOFF）
                │
                ↓
          ExitPlanMode → 实施
                │
       ┌────────┼────────┬─────────┐
       ↓        ↓        ↓         ↓
   Edit paths.py  Edit refactor-dir  Edit paths.md  Write HANDOFF v1.0
   (4 子命令      (Step 6.5/6.6/6.7   (§ symlink     (4 轮全合并)
    + audit 5/5)   + 回滚矩阵)         + § 运行时)
       │        │        │         │
       └────────┴────────┴─────────┘
                ↓
          验收 (硬性 5 项)
            ├─ scan-symlinks 列 70 ✓
            ├─ rebuild-symlinks --apply 修 5 ✓
            ├─ scan-symlinks --strict pass ✓
            ├─ audit --brief 55/0/0 ✓
            └─ scan-dead --strict CLEAN ✓
                │
                └─ 中途踩 3 次"路径示例污染 scan-dead"，逐个修
                │
                ↓
          ~/Dev commit + push (edcf586)
          devtools / cc-configs / tools/configs 走 auto-sync hook 自动 push
```

---

## 通用 Playbook · "盲区分类 → 工具增量" 4 步法

> 适用：发现某个工作流的多类盲区时（不只是一类）。

```
1. /warmup  — 看现状（baseline 数字 + HANDOFF 路线图）
        ↓
2. 识别盲区分类（每类一段 1-句话陈述）
        ↓
3. 盲区 N 类 → 工具子命令 N+1 个（每类一个修复 + 一个验收）
        ↓
4. /refactor-dir 类编排 skill 加 N 步（每个盲区一个硬阻塞 step）
        ↓
5. Verification：跑全套 audit，每个盲区都得有专属 exit-0 信号
```

**关键设计选择**（每个都验证过反例）：

| 选择 | 选了 | 反面 |
|---|---|---|
| `--strict` 严格度 | 仅 migration-hit 未修才 fail | 任何 dangling 都 fail（会被历史 orphan 噎死） |
| 默认行为 | dry-run；apply 显式 | 默认 apply（破坏性，回滚成本高） |
| YAML 重写 | 行级正则保留注释 | PyYAML load+dump 丢注释、丢顺序 |
| 启发式扫描 | informational 不 exit 1 | 严格 fail（合法模板必有 FP） |
| 历史兜底 entry | dry-run 验功能，不 apply（保留 reason 语义） | 自动 apply 改路径 → 丢 "历史兜底" 语义 |

---

## 本次怎么做（实际路径）

### 阶段 1 · 勘察（直读 + Bash）

直接 Read `paths.py` / `refactor-dir.md` / `paths.yaml` / `paths.md` + `find -type l` 全量扫 symlink。**没派 Explore agent**——目标文件已知 4 份，scope 明确，直读最快。

输出：
- 70 个 symlink 的全量分类（OK 48 / DANGLING 22）
- 5 个真实 migration-hit dangling（precise predict）
- 验证 5 个新 target 都存在（dissect-report.md 例外，target 已不存在 = 历史 orphan，独立问题）

### 阶段 2 · Plan 写完 ExitPlanMode

Plan 4 个增量明确到「文件 × 行数」，验收 6 步明确到「期望 exit code 与输出」。

### 阶段 3 · paths.py 5 处 Edit

按顺序：
1. docstring + import json
2. 大块插入（symlink helpers + 4 个 cmd_xxx + audit 第 5 项）— 用「`# main` 之前」做 anchor 一次性插入约 340 行
3. 小块改 cmd_audit（4 处 `[N/4]` → `[N/5]` + 加 5/5 输出）
4. main() 加 4 个 subparsers + 4 个 dispatch
5. paths.yaml 加 1 条 allow_missing（forward-ref `_archive/symlink-rewrites`）

### 阶段 4 · refactor-dir.md / paths.md 编辑

- refactor-dir：Step 6 后插 3 步、回滚矩阵补 3 行、frontmatter 描述更新、不做清单加 1 条
- paths.md：加 § symlink 维护、§ 运行时拼装路径限制；§ 一分钟健康体检加第 3 行；§ 特殊段表格加"自动维护"列

### 阶段 5 · 验收 + 实修

`rebuild-symlinks --apply --backup` 实修 5 个 dangling（backup tsv 留底）。`rewrite-allow-missing --dry-run` 出 1 条命中（`~/Work` 历史兜底），**故意不 --apply**：reason 语义层有意识保留。

### 阶段 6 · push

`~/Dev/paths.yaml` 一条手动 commit（edcf586，语义 message）。其他 3 repo（devtools / cc-configs / configs）由 auto-sync hook 在 Edit 期间自动 commit + push（message `sync: <ts>`，不漂亮但内容到位）。

---

## 弯路与正确姿势

### 弯路 #1 · 同 session 3 次「路径字面值污染 scan-dead」

| # | 字面值 | 哪里 | 触发 audit |
|---|---|---|---|
| 1 | `~/Dev/_archive/symlink-rewrites` | paths.py 自身代码注释/help 串 | rebuild-symlinks help 加完后 |
| 2 | `/Users/tianli/Dev/foo/bar` | paths.md 新增章节示例 | playbook 改完后 |
| 3 | `~/Dev/tools/cc-configs/commands/dissect-report.md` + `~/.claude/skills/website-dev` | HANDOFF v1.0 内文（举 ORPHAN 例子） | HANDOFF 写完 |

**3 次同根因**：写工具/playbook/HANDOFF 时引用「示意路径」忘了它会被 scan-dead 抓。

**正确姿势**：

| 场景 | 用什么字面值 |
|---|---|
| 代码 forward-ref（runtime 创建的 dir） | 加 `paths.yaml` allow_missing 条目，reason 写明「help 字符串引用」 |
| playbook 反例代码块 | 用已 allow_missing 的字面值（如 `/Users/tianli/foo`），不发明新的 |
| HANDOFF 描述 dangling 状态 | 用模板占位（`<project>/.claude/skills/<name>`），不写真实路径 |

**根因**：写新内容时大脑在「文档表达力」mode，没切到「scan-dead 视角」。**自检套路**：写完任何 .md / .py / .sh 后跑一次 `paths.py audit --brief`，1 dead 立刻定位+修。

→ 已抽 memory：`feedback_path_examples_scandead.md`。

### 弯路 #2 · zsh `status` 是 read-only

```zsh
local status=$(...)  # zsh: read-only variable: status
```

并行 batch 里第 1 条命令崩 → 其他 3 条 cancel 浪费一轮（已在 memory `feedback_parallel_batch_safety` 里讲过 zsh noclobber，这次是另一个特殊变量）。

**正确姿势**：zsh 下避免 reserved 变量名当 local 变量。常见雷区：`status` / `path` / `argv` / `_`。换名（用 `s` / `p` / 等）即可。

→ 已 append 到 `feedback_parallel_batch_safety.md`（zsh reserved vars section）。

---

## 漏了什么 skill

**没有需要新建的 skill**。本次工作的工具落点：
- 升级 `/refactor-dir` skill（加 3 步）
- 加 `paths.py` CLI 4 个子命令（CLI，不是 slash command）
- 升级 `paths.md` playbook（doc）

3 类盲区都收口在已有 skill / CLI 里，没出现「重复 2+ 次手动操作」的可抽象模式。skill-candidates 不增。

---

## 成果清单

| 产物 | 路径 | 说明 |
|---|---|---|
| paths.py +4 子命令 | `~/Dev/devtools/lib/tools/paths.py` | scan-symlinks / rebuild-symlinks / rewrite-allow-missing / audit-runtime；audit 4→5 项；约 +340 行 |
| /refactor-dir 11 步 | `~/Dev/tools/cc-configs/commands/refactor-dir.md` | 加 Step 6.5/6.6/6.7 + 回滚矩阵 |
| paths.md +2 节 | `~/Dev/tools/configs/playbooks/paths.md` | § symlink 维护 / § 运行时拼装路径限制 |
| paths.yaml | `~/Dev/paths.yaml` | allow_missing +1 条（symlink-rewrites backup forward-ref） |
| HANDOFF v1.0 | `~/Dev/HANDOFF-ssot-blindspots-v1.0-2026-04-25.md` | 4 轮收口 final handoff |
| symlink rebuild backup | `~/Dev/_archive/symlink-rewrites/20260425-201102.tsv` | 5 条 rewrite 备份，1 行命令回滚 |
| memory feedback | `feedback_path_examples_scandead.md` | 写文档/代码引用路径示例的 scan-dead 防雷规范（新增） |
| memory feedback | `feedback_parallel_batch_safety.md` | append zsh reserved vars 段（更新） |

实修 5 个真实 dangling symlinks（Work/zdys + Work/risk-map ×2 + Work/eco-flow ×2）。

Push：`zengtianli/dev-meta` `edcf586` 手动；`devtools / cc-configs / configs` auto-sync hook 推送。

---

## 验收终态

```
paths: 55 registered / 0 dead / 0 drift          ← audit --brief
[scan-dead] 4941 files / 2298 refs / 424 allow_missing → CLEAN
[scan-symlinks] 70 / 52 OK / 5 ALLOW / 13 ORPHAN / 0 MIG → exit 0
[5/5] symlink integrity: OK 70 scanned, 0 migration-hit dangling
audit-runtime: 12 hits 全在合法模板（station-promote.sh / menus.py / paths.py 自身）
```

13 个 ORPHAN 是历史/外部 dangling（项目级 `.claude/skills/` 链 / cursor-shared 外部 / risk-map vendored 资料），不归 v1.0，paths.md 注明「manual review」。

---

## 未完成项 / 下轮备忘

- [ ] `~/Dev/HANDOFF-ssot-blindspots-v0.1-2026-04-25.md` 待用户拍板删/归档（gitignore 不入 git，本地物理文件）
- [ ] 13 个 ORPHAN symlinks 历史/外部 dangling，需用户 review 决定是否手动清理（一类是 `~/.claude/skills/<name>` 项目级 skill 链，可能是 harness 状态滞后）
- [ ] `tools/configs` repo 有 hammerspoon submodule modified content（与本次工作无关，预存）
- [ ] dissect-report.md 在 cc-configs/commands 不存在（已搬到 archive plugin 命名空间），3 个 Work/eco-flow 引用现在指向不存在的目标 — 独立 cleanup 任务

---

## 下次记得

1. **写代码/skill/handoff 引用路径示例时**：先想"这字面值会不会被 scan-dead 抓"。3 个套路：用已 allow_missing 的字面值 / 用模板占位 (`<name>`) / 加 allow_missing 条目。
2. **zsh 写 local 变量**：避开 `status` / `path` / `argv` / `_` 等 reserved。
3. **多盲区路线图**：如果范围小 + 用户授权，可一次合并到 final handoff（v0.1→v1.0），不强制分轮。
4. **rewrite-allow-missing apply 决策**：单看是否要保留历史兜底语义。dry-run 验功能 ≠ 必须 apply；自动重写会丢 reason。
5. **auto-sync hook 行为**：sub-repo 改动会被自动 commit `sync: <ts>` push。要语义 message 必须在 hook 触发前手动 commit；`~/Dev` 自身（dev-meta）不在 auto-sync 范围，仍需手动。
