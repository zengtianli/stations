# Playbook · stations · 站群治理

> tianlizeng.cloud 26+ 子域 · 6 活跃站 · yaml SSOT + renderer + audit + sync + deploy 5 步协议
> 首个按 META.md §3 骨架沉淀的 playbook · R1-R7.2 实战经验凝练

---

## § 定位

**这类任务是**：改 `tianlizeng.cloud` 站群的**共享 UI / 导航 / 子域 / 视觉**。

6 活跃站：
- `tianlizeng.cloud`（website · React/Next.js）
- `dashboard.tianlizeng.cloud`（ops-console · React/Next.js）
- `stack.tianlizeng.cloud`（stack · Python 静态）
- `cmds.tianlizeng.cloud`（cmds · Python 静态）
- `logs.tianlizeng.cloud`（logs · Python 静态）
- `audiobook.tianlizeng.cloud`（audiobook · FastAPI）

典型场景：
- 改 navbar 颜色/间距/字号 / hover 效果 / 列数 / mega panel 布局
- 加/删/改 mega 分类 · 加/删子域
- 改 site-header 图标/标题/副标题
- 调 .tlz-card / .tlz-btn 等站内统一组件样式
- 部署某站 / 全部站

**不是**：改单站业务代码（如 hydro 计算 / website blog 内容 / audiobook TTS 逻辑）— 那走各自项目的 playbook。

---

## § 入场判断

**trigger words**（用户原话含这些 → 走本 playbook）：
- "改 navbar / menu / 菜单 / 导航"
- "站群 / 所有站 / 全部子域 / 统一"
- "mega / hover / 下拉"
- "site-header / 卡片 / tlz- 开头的样式"
- "加/删子域 / SSOT yaml / navbar.yaml"
- "部署 cmds / stack / logs / website / dashboard / audiobook"
- "颜色/间距/字号/断点 改一下"（若上下文是站群）

**反例**：
- "改 hydro-annual 的计算" → hydro playbook
- "改首页 blog 内容" → 主站 content 改动（按需建 playbook）
- "改某个组件 React 业务逻辑" → 项目内 playbook

---

## § 编排图

**路径 A · 前端微调**（90% 场景 · 非破坏）

```
用户: "改下 mega menu 的 hover 色 / 间距 / 字号 / ..."
  ↓
/warmup
  ↓
/frontend-tweak            ← 守门 skill。禁改数据结构
  ├─ grep CSS 变量 / Tailwind 类
  ├─ Edit NAVBAR_CSS (menus.py) / site-content.css / mega-navbar.tsx
  └─ /menus-audit            ← 必 8/8 全绿（drift=0 证明结构未动）
  ↓
/site-refresh-all          ← 一键 render + navbar-refresh + catalog + ...
  ↓
/deploy <name> × N         ← 手工指定受影响的站（不自动，避免破坏）
  ↓
/ship <repo1> <repo2> ...  ← scoped commit + push
```

**路径 B · 数据结构变更**（10% 场景 · 破坏性）

```
用户: "加个 AI 分类 / 删某子域 / 换某 URL / 改 yaml 结构 ..."
  ↓
/warmup
  ↓
Plan mode
  ├─ AskUserQuestion 拍板（带 ASCII preview 让用户选）
  ├─ 写 plan file 含回滚预案
  └─ ExitPlanMode
  ↓
Edit navbar.yaml / sites/*.yaml / schema/*.json
  ↓
/site-refresh-all
  ↓
pnpm build × 2（website + ops-console，若涉及 React）
  ↓
/deploy <name> × N
  ↓
/menus-audit               ← 确认 drift=0
  ↓
/ship
```

---

## § 复用清单

| skill / command | 用法 | 现有 or 本次新建 |
|---|---|---|
| `/warmup` | 入场看环境 | 现有 |
| `/frontend-tweak` | **守门**（视觉微调，禁改数据结构） | **本次新建** |
| `/site-refresh-all` | SSOT 改完一键同步（含 audit，不含 deploy） | **本次新建** |
| `/menus-audit` | 8 类 drift 检测 | 现有 |
| `/navbar-refresh` | site-navbar.html 同步到消费者 | 现有 |
| `/site-header-refresh` | site-header.html 同步 | 现有 |
| `/site-content-refresh` | site-content.css 同步 | 现有 |
| `/deploy <name>` | 通用部署（带 deploy.sh 的项目） | 现有 |
| `/ship <repo1> <repo2>` | 多 repo commit + push | 现有 |
| `/cf-audit` | CF DNS / services.ts / nginx 对账 | 现有 · 动 DNS/子域时用 |
| `/sites-health` | 扫 28 子域 HTTP/Access 状态 | 现有 · 验收时用 |
| `/retro` | 大改完 playbook 风格复盘 | 现有 |

---

## § 改动边界矩阵

| 改什么 | 文件 | 破坏性？| 入口 |
|---|---|---|---|
| hover 色 / 字号 / 间距 / 字重 / 字体 | `NAVBAR_CSS` in menus.py · `site-content.css` · `mega-navbar.tsx` 视觉 props | **非破坏** | `/frontend-tweak` |
| 响应式断点 / 动画时长 / 阴影 | 同上 | **非破坏** | `/frontend-tweak` |
| mega panel 列数 / 布局参数 | `menus.py resolve_mega_categories` 的 `num_cols` 参数 | **半破坏**（影响所有 panel） | Plan mode 轻 · 确认后改 |
| 加 / 删 / 改分类 / 子项 | `navbar.yaml` `sites/*.yaml` | **破坏** | Plan mode + AskUserQuestion |
| 改 label / url / access 标记 | 同上 | **破坏**（影响消费者显示） | Plan mode |
| site-header icon/title/tagline 文案 | `sites/<name>.yaml.header` | 半破坏（文案） | Edit + `/site-header-refresh` |
| 加新子域 | `website/lib/services.ts` + CF DNS + nginx + 新 repo | **重大破坏** | Plan mode + `/site-add` + `/ship-site` |
| 删子域 | 反向 + `/site-archive` | **重大破坏** | Plan mode 必需 |
| 加新 SSOT 类别（footer 等） | 见 § 扩展机制 | **重大破坏** | Plan mode + 专门 design |

---

## § 踩坑 anti-patterns

**1. 截图 / PRD 不复述就动手** — R4/R6/R7 连踩 3 次
- 现象：用户发截图 + 说"参考 X"，CC 用主观理解实现，结果跑偏
- 根因：没把截图的**视觉要素逐条列出**就当"我懂了"
- 下次：**按图复述** "我看到 X 布局 / Y 配色 / Z 字号，对吗"，用户确认再动

**2. 用主观风格替代甲方风格** — R7 踩
- 现象：做 mega menu 做成 Apple liquid glass（CC 习惯），汇丰是扁平左白右深色
- 根因：CC 惯性审美替代 spec
- 下次：**"像 X" = 照抄 industry standard**，不自由发挥

**3. 像素级规格不死抠** — R7 踩（64px 做成 44px）
- 现象：PRD 明确数字，CC 做"大致相似"
- 下次：PRD / spec 给的数字直接用，不打折

**4. `width: 100vw` 配滚动条必横滚** — R7.1 踩
- 现象：`.tlz-mega-dark::after { width: 100vw; left: 100% }` 出血 trick 在有滚动条的页面触发横滚
- 根因：100vw = 视口宽度（含滚动条），超出 document width
- 下次：**除非父级 `overflow: hidden`，不用 `width: 100vw`**；兜底永远 `html, body { overflow-x: hidden }`

**5. React panel 全渲染 + visibility hidden 仍 DOM 泄露** — R7.1 → R7.2
- 现象：桌面端 5 个 panel 全 SSR，visibility hidden 遮住但 DOM 抓取可见
- 根因：visibility hidden 不移除 DOM，`innerText/outerHTML` 仍能读到
- 下次：**关闭 panel 用条件渲染** `{active && <Panel />}`，closed 时零 DOM

**6. min-width 默认 auto 撑开容器** — R7.2 踩
- 现象：flex/grid 子项含长文本，父容器被撑出横滚
- 根因：浏览器默认 `min-width: auto`（flex/grid 子项里）
- 下次：**所有 flex/grid 子项 `min-width: 0`**，grid 用 `minmax(0, 1fr)`

**7. 手工 bash 做本该有 skill 的事** — R7 踩 6 处
- 现象：跑 bash 而不是用现成 `/deploy` `/ship` `/menus-audit` 等
- 下次：遇到编排动作先查 available-skills，用户看到也可纠正「用 /xxx」

---

## § 文件索引

**SSOT（yaml）**：
- `~/Dev/tools/configs/menus/navbar.yaml` — 顶级 mega SSOT（5 分类 × 4 列）
- `~/Dev/tools/configs/menus/sites/website.yaml` — 主站内导航
- `~/Dev/tools/configs/menus/sites/ops-console.yaml` — dashboard section-nav
- `~/Dev/tools/configs/menus/sites/cmds.yaml` — cmds 命令分类
- `~/Dev/tools/configs/menus/sites/stack.yaml` — stack 项目分组
- `~/Dev/tools/configs/menus/sites/logs.yaml` — logs site-header
- `~/Dev/tools/configs/menus/schema/*.json` — yaml 校验

**Renderer + 加载器**：
- `~/Dev/devtools/lib/tools/menus.py` — **核心文件**：validate / render-navbar / build-website-navbar / build-catalog / render-site-header / build-site-content / audit

**共享模板（SSOT 产物）**：
- `~/Dev/devtools/lib/templates/site-navbar.html` — navbar HTML + CSS + JS（自动生成）
- `~/Dev/devtools/lib/templates/site-content.css` — 站内 `.tlz-*` 统一样式
- `~/Dev/devtools/lib/templates/site-navbar-streamlit.py` — Streamlit 注入（如需）

**React 消费者**：
- `~/Dev/stations/website/components/mega-navbar.tsx` — **源组件**
- `~/Dev/stations/website/components/navbar.tsx` — 主站包装（带 Track 色线 + 搜索）
- `~/Dev/stations/website/lib/shared-navbar.generated.ts` — 自动生成 TS 数据
- `~/Dev/stations/ops-console/components/mega-navbar.tsx` — copy from website
- `~/Dev/stations/ops-console/components/shared-navbar.tsx` — 3 行包装

**静态消费者**：
- `~/Dev/{stack,cmds,logs,audiobook}/site-navbar.html` — 从 SSOT 同步
- `~/Dev/{stack,cmds,logs,audiobook}/site-header.html` — 各自渲染
- `~/Dev/{stack,cmds,logs,audiobook}/site-content.css` — SSOT copy

**编排脚本**：
- `~/Dev/devtools/scripts/tools/navbar_refresh.sh` — auto-scan 所有 `~/Dev/*/site-navbar.html` 并同步

**历史 / 记录**：
- `~/Dev/tools/configs/menus/PROGRESS.md` — 8 轮滚动进度（R1-R7.2）
- `~/Dev/tools/configs/menus/_archive/` — 历史 plan / audit 归档
- `~/Dev/stations/docs/knowledge/session-retro-20260419-r7-mega.md` — R7 playbook 风格复盘

---

## § 扩展机制

**场景 A · 加新共享 UI 类别**（如 footer / banner / 404 页）：
1. `~/Dev/tools/configs/menus/sites/<name>.yaml` 加对应字段（如 `footer: {...}`）
2. `menus.py` 加 `render_<x>()` 函数
3. `menus.py audit()` 字典加 `<x>-drift` 检查
4. 写 `~/Dev/tools/cc-configs/commands/<x>-refresh.md` slash skill
5. `/site-refresh-all` 里编排加一行
6. 每消费者 repo 接入（generate.py 或 React import）
7. `/menus-audit` 必须全绿
8. 更新本文 § 文件索引

**场景 B · 加新子域 / 站**：
1. `/site-add <name>` 脚手架
2. 改 `~/Dev/stations/website/lib/services.ts` 加 service 条目
3. CF DNS + Origin Rule + Access（用 `/cf` 三联）
4. VPS nginx 配置
5. `/navbar-refresh`（自动 include 新子域的 site-navbar.html）
6. `/cf-audit` 确认对账
7. `/ship-site <name>`

**场景 C · 退役子域**：
- `/site-archive <name>` 一键走 DNS 删 + nginx 删 + 归档 repo

---

## § Promote 新站入站群（2026-04-20 立）

**触发词**：「挪 X 到站群」「promote X」「把 X 加到 stations」「X 进 stations/」

**背景**：`~/Dev/` 根是**孵化区**（试错项目随便起名），`~/Dev/stations/` 是**生产站群目录**。某项目稳定后从孵化区 → 站群。

**编排图**：

```
/warmup
  ↓
/station-promote <name> [--auto-fix] [--no-smoke] [--dry]
  ├─ 前置检查：~/Dev/<name> 存在 + stations/<name> 不存在 + git clean
  ├─ mv ~/Dev/<name> → ~/Dev/stations/<name>
  ├─ 扫 devtools / cc-configs / configs / memory 硬编码引用
  ├─ --auto-fix → python 正则替换（\b word-boundary 安全）
  ├─ 重建 raycast symlinks
  └─ api-smoke 烟测（可选）
  ↓
/menus-audit              确认 SSOT 无破坏
  ↓
/sites-health             公网 endpoint
  ↓
/ship devtools cc-configs configs   commit + push 三 repo 的 sed 结果
```

**路径发现原理**：
- `~/Dev/devtools/lib/station_path.py` + `~/Dev/devtools/lib/station_path.sh` 是 SoT：优先 `~/Dev/stations/<name>`，否则 `~/Dev/<name>`
- `menus.py` / `api-smoke.sh` / `deploy-changed.sh` / `deploy.sh` / `_services_ts.py` 都经 station_path 解析
- 核心脚本 mv 后**零代码改动**就工作；cc-configs/commands/*.md 是文档级引用，`--auto-fix` 负责
- `web-stack/infra/deploy/deploy.sh` 用 `$SCRIPT_DIR/../..` 推导 `WEB_STACK_ROOT`，自相对无论 web-stack 自己在哪

**不动**：VPS 路径（`/var/www/<name>/`）、nginx conf、systemd template — 与本地 `~/Dev` 路径解耦。

**回滚**：`mv ~/Dev/stations/<name> ~/Dev/<name>`；sed 过的文件 `git checkout --`。

**踩坑**：
- BSD sed 不认 `\b` word boundary（macOS 默认）→ 脚本用 **python 正则** 替换
- 移 web-stack 后 `.venv` shebang 失效（hardcoded 旧路径）→ `rm -rf .venv && uv sync --all-packages` 重建
- 非 git 目录（如 playbooks 本身曾经是纯目录）仍可 promote，脚本判空跳过 git 检查

---

## § HANDOFF 分布规范（2026-04-20 立）

**原则**：HANDOFF.md 越靠近具体改动 repo 越好。`/handoff` skill 的 Phase 3 Step 3.0 已实现判主项目逻辑，正常情况下自动落地。

| 改动范围 | HANDOFF 落地 |
|---|---|
| 单 station 改动（web-stack / audiobook / ops-console / ...）| `~/Dev/stations/<name>/HANDOFF.md` |
| 单 labs / content / tools 项目 | 对应项目根（如 `~/Dev/tools/cc-configs/HANDOFF.md`）|
| 跨站群 / `~/Dev` 结构级重构 / playbooks 本身 | `~/Dev/HANDOFF.md` |
| 模糊时 | `/handoff` 会 AskUserQuestion 给 top 3 候选让用户挑 |

**归档**：若 target dir 已有过时 HANDOFF（话题换了但有保留价值）→ `mv HANDOFF.md ~/Dev/stations/docs/handoffs/{YYYYMMDD}-{topic}.md` 再覆盖。

**反模式**：
- 别 symlink HANDOFF 到 `~/Dev/` 根 — 让它就待在归属的项目里
- 别在多个 repo 同时写 HANDOFF — 选一个最集中的

---

## § 下次会话示例

```
> 读 ~/Dev/tools/configs/playbooks/META.md + stations.md，我想把 mega panel 的 hover 色从红改成蓝

# CC 自动：
# 1. /warmup
# 2. 识别 "改颜色" = trigger word → 走 stations.md 路径 A
# 3. /frontend-tweak
#    - grep -n 'D40000' in menus.py + mega-navbar.tsx
#    - Edit 替换
#    - /menus-audit 全绿
# 4. /site-refresh-all
# 5. /deploy × 6（用户指定哪些受影响）
# 6. /ship configs devtools website ops-console
```
