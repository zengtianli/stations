---
title: Session Retro · 2026-04-22 SSOT 图模型 + Tier 1 静态站整合
date: 2026-04-22
category: retro
tags: [ssot, refactor, menus, graph-model, static-sites, nginx]
---

# Session Retro · 2026-04-22 SSOT 图模型 + Tier 1 整合

## 发生了什么

从用户的一个问题起步：
> "1，你列出所有是 menu 就是我站群里嵌套的所有的
> 2，我经常有飘逸的情况，有什么办法可以不要硬编码，搞个地图这样。这样也好维护
> 我这样的想法成熟 合适吗 工程化了吗？"

用户的直觉是对的 — 他想要"搭积木一样模块化调整"。我的回答是：地图其实已经在 `~/Dev/tools/configs/menus/`，但不够彻底。然后分两大阶段推进：

**阶段 A · 菜单图模型（Phase A–E）**
把已有的 yaml SSOT 从"集中+散落"升级为**实体-关系图模型**：entities/ + relations/ + consumers.yaml + graph-invariants audit + pre-commit hook。services.ts 从手写变成 AUTO-GENERATED。navbar.yaml 所有中文 group 引用改成 `group_id` 稳定 slug。

**阶段 B · Tier 1 静态站整合（#1–#5）**
先做 3 个 agent 调查 → 产出 10 条重构清单（refactor-roadmap-20260422.md）→ 用户选 Tier 1 全做。
- #1 deploy.sh 归一（116→8 行）
- #2 模板加载器抽共享
- #3 repo-map.json 自动生成（merge-aware）
- #4 mega-navbar 抽 devtools SSOT + sync command
- #5 nginx vhost 生成器迁 devtools + group 过滤

最后产出 2 份图文 MD：
- `menus/ARCHITECTURE.md`（菜单图模型拆解）
- `stations/docs/knowledge/station-architecture-20260422.md`（站群整体地图）

## 做对的

1. **第一轮回答就坦诚说"你已经有了地图，别重起"** — 没有按用户字面意思去"再搞一个地图"。识别出真正的问题是"最后一公里对账闭环缺失"，给出 5 个漏洞清单。
2. **分阶段 ship** — Phase A/B/C/D/E 每 phase 独立可 ship；Tier 1 #1+#2+#3 一批、#4+#5 一批；每批 audit 绿再动下一批。没有一口气搞崩。
3. **Pre-commit hook 作为最后保险** — 即使有人手改 services.ts 或忘记跑 refresh，commit 时 audit 拦截。这是真正的"不会漂移"底线。
4. **用图文 MD 主动对齐用户理解** — 用户一句 "图文并茂" 我就产出 ARCHITECTURE.md；"改完之后说下效果" 又产出 station-architecture。两份 MD 都用 ASCII 图 + 场景演示 + 目录树，不是散文。
5. **3 个 Explore agent 并行调查** — Tier 1 之前的调查分 3 个独立领域（静态站 / Next.js+FastAPI / 配置漂移+skills），并行跑，不污染主对话上下文。
6. **repo-map.json 发现回归自动撤回** — 第一版生成器丢了手工字段（vps/category/auto_push），发现后 `git checkout` 撤回，改造成 merge-aware 版本。没有硬推坏数据。
7. **nginx 生成器发现 infra 误套模板自动收窄 scope** — 发现 n8n/panel/proxy/status 被套上 Next.js 模板，立刻加 `group_id == "infra"` 过滤，只生成 15 个真正吃动态模板的站。

## 做错的 / 差点翻车

1. **第一版 repo_map_gen 用新 schema** — 手工维护的 vps/category/auto_push 字段直接被扔掉。git_smart_push.py 依赖 `info["auto_push"]`/`info["local"]`，差点 break 批量推送。幸好发现了改 merge 策略。
   - **教训**：改 SSOT 文件**前**必须 grep consumers 看字段依赖，而不是写完发现不对再补。
2. **cmds/__pycache__ 被 git 看到** — 重 deploy 后残留的 .pyc 不该 track，应 gitignore 但没配。小瑕疵。
3. **oauth-proxy CLAUDE.md 含错路径** — Reorg 后把 `~/Dev/scripts/lib/tools/` 改成 `~/Dev/tools/scripts/lib/tools/`（前者旧，后者也不对；真路径是 `~/Dev/devtools/lib/tools/`）。顺手修了，但说明路径更新不是 atomically 一次到位。
4. **build_services_ts() 首轮输出和现有 services.ts 差一个 AUTO-GEN header** — 不是逻辑 bug，但提醒我：当 SSOT 提升一层抽象时，派生文件需要**显式标识**（header 注释），让未来的编辑者知道不能手改。

## 工程模式 · 可复用出去

### 1. **"实体 + 引用 + 派生 + audit" 四件套**

任何看起来"SSOT 已在但仍漂移"的系统，套这个公式：

```
(1) 抽实体：每个概念给稳定 id（slug）
(2) 关系走引用：禁止用 label 字符串跨文件引用
(3) 派生标 AUTO-GEN：所有下游产物头部有注释说"此文件自动生成"
(4) Audit 图不变量：引用完整性 + 孤儿检测 + 派生对账
```

本轮是菜单 + 子域 + 消费者。未来任何类似场景（比如 playbook 依赖图 / skill 目录结构 / VPS systemd unit）都能套。

### 2. **Pre-commit hook 作为 audit 触发器**

改动 SSOT / 派生产物 → hook 自动跑 audit。用户不用记得跑；audit 不绿就拦 commit；逃生门 `--no-verify`。

模板在 `~/Dev/tools/configs/menus/.pre-commit-hook.sh`，可复用到任何其他 SSOT 目录。

### 3. **Sync command 而非 tsconfig alias**

Next.js 跨 repo 共享组件最简路径：**别搞 webpack / tsconfig alias / symlink**。用一个 `menus.py build-xxx -w` 把 canonical 拷到每站。派生产物头部打 AUTO-GEN。Audit 对账 canonical vs copies。避免构建复杂度。

### 4. **Merge-aware generator（保留手工字段）**

auto-scan 生成器常见陷阱：覆盖手工字段。解法：

```
(1) 先 load 现有 JSON/yaml
(2) auto-discover 新项目
(3) 对已有 entry：preserve 手工字段 + refresh scanable 字段
(4) 已有但扫不到：按 path 是否在 scan scope 决定 drop / keep
```

本轮 `repo_map_gen.py` 是样例。下次遇到类似"自动化但别覆盖人工"就抄。

### 5. **路线图 MD 先行 · 让用户选 scope**

大型重构不是上来就改。先：
- 3 Explore agent 调查（独立领域）
- 汇总成 roadmap MD（Tier 1/2/3 + 收益估算 + 风险）
- 用户选 tier
- 每做完一 tier 写 architecture MD 总结

本轮全套走通。下次任何跨 3+ repo 的重构都按这个模板。

## 踩过的坑 · 下次避

### 1. SSOT 生成器改动必须 grep consumers

写 `repo_map_gen.py` 新 schema 时没 grep 旧字段消费者。差点 break `git_smart_push.py`。

**正确姿势**：
```bash
# 改 repo-map.json schema 前：
grep -r "info\[.auto_push.\]\|info\[.local.\]\|info\[.vps.\]" ~/Dev
# 看到消费者再决定是否保留字段
```

### 2. 审视派生产物格式差别

`services.ts` 从手写变 AUTO-GEN，有个小 diff：4220 bytes vs 4217（就是 AUTO-GEN header）。任何提升到 SSOT 的现有文件都会有这个"加头"微差。确保 audit 把这当成"合格的差异"而不是漂移。

### 3. nginx 模板不适合所有子域

services_to_nginx.py 第一版把 n8n / Marzban / status / webhook / oauth-proxy 全套 Next.js + FastAPI + Streamlit 三位一体模板 — 彻底错。**添加过滤规则比通用化模板更稳**。

### 4. Refactor 顺序：低风险先 · 观察再推深

Tier 1 #1/#2/#3 都是本地脚本级改动，风险低；先做 + ship + audit 绿后再动 #4（跨 Next.js repo）和 #5（触 VPS 生产层）。没有跳步。

## 本轮关键文件索引

| 类型 | 文件 |
|---|---|
| Roadmap（重构前） | `~/Dev/stations/docs/knowledge/station-refactor-roadmap-20260422.md` |
| Architecture（重构后） | `~/Dev/stations/docs/knowledge/station-architecture-20260422.md` |
| 菜单图模型 | `~/Dev/tools/configs/menus/ARCHITECTURE.md` |
| 本 Retro | 本文件 |
| 关键 commit 起点 | devtools `1d15706` / tools/configs `42bb48d` / web-stack `67f5baa` |

## 交付数字

- 重构条数：8（Phase A–E + Tier 1 #1–#5）
- 触达 repo：13
- Ship commit：18+
- Audit 覆盖：5 → 11
- 新增 slash command：`/repo-map-refresh` / `/nginx-regen` + `menus.py build-react-mega-navbar`
- Pre-commit gate：0 → 7 repo
- 静态站新上线成本：~400 行 → ~50 行
- 代码净变化：+1900 骨架 / −1300 重复 = +600 抽象层
