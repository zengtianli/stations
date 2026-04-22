# Playbook · cc-options Streamlit → Next.js 迁移

**场景**：把一个跑了一段时间的 Streamlit 仪表盘站（带金融凭证，`.env` 永不上 VPS）迁到 web-stack 标准 Next.js + FastAPI 架构，流量平滑切换。

**本次 triggers**：用户问"cc-options 的 Next 版怎么更新、数据怎么拉？" → 一查没有 Next 版 → 触发整套迁移。

---

## 核心编排

```
用户口令「换 Next.js 版本，不要 streamlit，数据怎么拉」
  ↓
【探查】     grep / ls web-stack/apps 确认是否已有 Next 版
             ⚠️ 开头没跑 /warmup，直接进了调研
  ↓
【规划-1】   Plan mode（轻量）+ 判断要 A（迁移）还是 B（不迁）
             AskUserQuestion（隐式：写在文本里让用户选）
             用户回"A 详细计划操作"
  ↓
【规划-2】   Plan mode（重）+ 并发 Read 模板
             写 MIGRATE-PLAN.md 放到 cc-options/（让用户审）
             ExitPlanMode
  ↓
【脚手架】   抄 apps/hydro-toolkit-web + services/hydro-toolkit
             Write 12 新文件（8 Next + 4 FastAPI）
             Edit infra/deploy/ports.sh + services/pyproject.toml（加新站 member）
  ↓
【MVP 代码】 api.py（5 端点，只读 /var/www/<name>/data/*.json）
             page.tsx（4 metric + 持仓表，用 @tlz/ui 共享包）
             sync-data.sh（白名单 rsync，禁 .env/raw）
             daily_update.sh 末尾追加 sync-data.sh
  ↓
【本地跑通】 pnpm install（monorepo 加入）
             uv sync --all-packages（加 cc-options 进 services workspace）
             ⚠️ 本地 API 验证走 bash uvicorn + curl 循环 —— 应该用 /api-smoke
             pnpm dev 起 3121 + curl / → 200
             pnpm build → standalone 产出
  ↓
【Cutover】  bash sync-data.sh                              ← 白名单传数据
             bash infra/deploy/deploy.sh cc-options --fast  ← 应该用 /deploy cc-options
             ssh VPS sed nginx proxy_pass 8521→3121 + reload
             ssh VPS systemctl stop+disable cc-chat + rh-dashboard
             curl HTTPS 302 ✓
  ↓
【Commit】   ⚠️ git add/commit/push × 2 repo 手工跑 —— 应该用 /ship
  ↓
【归档】     mv app.py → _archive-streamlit/
             cp 旧 deploy.sh → _archive-streamlit/deploy.sh.streamlit
             重写 deploy.sh 为薄包装（sync-data + web-stack deploy）
             更新 README / DOMAIN / MIGRATE-PLAN 3 份文档
  ↓
【收尾】     /retro（本文）+ /handoff → cc-options/HANDOFF.md
```

**关键数字**：**3 个现成 skill 本该用但漏了**（`/warmup` / `/api-smoke` / `/ship`）；`/deploy` 等价用了但没用 slash 别名；12 个新文件（8 Next + 4 FastAPI）是工程工作，无 skill 可替代。

---

## Phase 编排

### Phase 1 · 探查（是否已有 Next 版）

**应用**：无专用 skill，`/warmup` 可做入场诊断但不覆盖"有没有 X 项目"的调研

**触发时机**：用户提到"迁 X 到新架构"、"为什么 Y 在旧实现"，先确认**有没有已经迁了**

**本次怎么做的**：`ls -d web-stack/apps/*cc*` + `Glob services.ts` 查 entry → 确认不存在

**正确姿势**：会话开头应该 `/warmup` 先把项目地图拉出来，再做具体调研；本次跳过了直接进调研，是延续 retro §6 的上下文压力

**下次记得**：**任何新会话第一件事 `/warmup`**，再谈任务

---

### Phase 2 · 规划（Plan mode + AskUserQuestion）

**应用**：Plan mode（内置）+ ExitPlanMode + AskUserQuestion（内置控制流）

**触发时机**：**跨 repo + 破坏性 + >5 min** 任务，先进 Plan mode

**本次怎么做的**：**两次** Plan mode 很对。第一次给用户选"A 继续迁移 / B 只下线旧"，第二次写详细 MIGRATE-PLAN.md（纯文件，不动 system）

**正确姿势**：✅ 本次规范。Plan 写在 `cc-options/MIGRATE-PLAN.md`（**项目里而不是 ~/.claude/plans/**，用户进项目能看到）

**下次记得**：**迁移类任务 Plan 写进项目 root**，让用户推开门就能读

---

### Phase 3 · 脚手架（抄模板 / 无 skill）

**应用**：无直接 skill。有 `/stack-migrate` 但偏 hydro-* Streamlit，cc-options 金融数据管道特殊（凭证不能上 VPS），手工抄更合适

**触发时机**：新建 web-stack 子项目

**本次怎么做的**：Read `hydro-toolkit-web` 所有配置文件 → Write 对应的 `cc-options-web` 8 个 + `services/cc-options/` 4 个 → Edit `ports.sh` 加 `[cc-options]=8521`（端口 SSOT）+ `services/pyproject.toml` 加 workspace member

**正确姿势**：抄模板是对的。每个 new Next app 的三处改动：
1. `package.json` name + `dev -p <port>`
2. `next.config.mjs` rewrites `destination: http://127.0.0.1:<api-port>/api/:path*`
3. `layout.tsx` `data-track="..."` + `currentKey="..."`（导航高亮）

**下次记得**：新 web-stack app = **抄 hydro-toolkit-web + 改 3 处**

---

### Phase 4 · MVP 代码（无 skill）

**应用**：无 skill，纯工程。但 **API 写完就 `/api-smoke <name>`** 是后面 Phase 5 前该做的

**本次怎么做的**：
- api.py 5 端点（health / meta / portfolio / activities / equity-curve / summary）只读 `/var/www/<name>/data/`
- page.tsx 用 `@tlz/ui` 的 `SiteHeader`, `StatCard`, `LiquidGlassCard`（对齐 website Apple 风格）
- sync-data.sh 白名单 3 个 artifact（不要 `data/` 整个目录）

**正确姿势**：✅ MVP 取 P0（卡片 + 表），P1 留后。代码量小 = rollback 便宜

**下次记得**：**MVP = P0（概览卡 + 核心表）**，图表/scenarios 等 P1 分批来

---

### Phase 5 · 本地验证（漏了 `/api-smoke`）

**应用**：`/api-smoke <name>` — 自动起停 uvicorn + health/meta/compute 端点校验 + 踩坑封装（zsh noclobber、clashx、CJK）

**本次怎么做的**：
- 手工 `uv run uvicorn api:app --port 8621 &` + `sleep 4` + `curl /api/health/meta/summary`
- 手工 `pnpm dev &` + `sleep 20` + `curl / + grep 'NLV'`
- 手工 `pkill -f 'next dev'` + `pkill -f 'uvicorn'`

**正确姿势**：**`/api-smoke cc-options`** 一条命令跑完 FastAPI 端检查。Next 端目前无专门 skill，保留手工

**下次记得**：**建新 FastAPI 就 `/api-smoke <name>`**，封装了所有我重造的轮子

---

### Phase 6 · Cutover（混合：`/deploy` 用了但没别名 + ssh 手工）

**应用**：
- 部署：`/deploy cc-options` 或 `bash infra/deploy/deploy.sh cc-options`（后者是前者的等价物）
- 切 nginx `proxy_pass`：无 skill（SSH 级单独命令合理）
- 停 systemd：无 skill

**本次怎么做的**：用了 `bash ...deploy.sh cc-options --fast`（绕开了 slash 别名，但等价 OK）。nginx sed + systemctl stop 都是 ssh one-liner

**踩过的坑**：
1. **vps_config.sh 的 `set -u` 守卫变量炸了**（`_VPS_CONFIG_LOADED: unbound variable`）→ 修为 `${VAR:-}` 默认空
2. **pkill `streamlit.*8521` 把自己的 ssh 也杀了**（命令字符串匹配到 pattern）→ 改用 `systemctl stop <unit>` 更干净
3. **找错 unit 名**：以为是 `cc-options.service`（按 subdomain 推），实际是 `cc-chat.service` + `rh-dashboard.service`（历史命名）

**正确姿势**：cutover 流程固化为 5 步
```
1. bash sync-data.sh                   # 预热数据
2. bash deploy.sh cc-options --fast    # 新版上线，旧版不受影响
3. nginx sed proxy_pass old→new + reload   # 切流量
4. systemctl stop + disable 旧 unit    # 清进程
5. curl HTTPS + 浏览器人肉验证
```

**下次记得**：**pkill 前先 `systemctl cat <unit>` 找准 unit 名**，别猜；cutover 前先 `cp <nginx-config>{,.bak-$(date +%F)}`

---

### Phase 7 · Commit（漏了 `/ship`）

**应用**：`/ship <repo1> <repo2> ...` — 一条命令跨 repo commit + push

**本次怎么做的**：`cd web-stack && git add ... && git commit -m HEREDOC && git push` 然后 `cd devtools && ...` 手工跑 2 遍

**正确姿势**：`/ship web-stack devtools` 一条命令，自带消息模板 + push 并发

**下次记得**：**PR 级 commit 到 ≥ 2 repo 就 `/ship`**

---

### Phase 8 · 归档（无 skill，纯文件）

**应用**：无 skill。mv + rewrite deploy.sh + docs 更新

**本次怎么做的**：
- `mkdir _archive-streamlit/` → `mv app.py` + `cp deploy.sh` 进去
- 重写 `deploy.sh` 为薄包装（`sync-data.sh` + `web-stack/.../deploy.sh cc-options`），保留用户肌肉记忆
- 更新 `README.md` / `DOMAIN.md` / `MIGRATE-PLAN.md` 三份

**正确姿势**：✅ 归档到 `_archive-*/` 前缀下划线（被 `/audit` 排除、被 `navbar_refresh` 排除），符合项目约定

**下次记得**：**归档目录永远用 `_archive-<topic>/`**（`_` 开头），保证所有批量工具自动跳过

---

## 通用 Playbook（Streamlit → web-stack Next.js 迁移抄这个）

任何 `hydro-*` / `cc-*` / `rh-*` 站从 Streamlit 搬到 web-stack 都抄这条链：

```
0. /warmup                                            # 入场
1. grep web-stack/apps/<name>-web 确认没 Next 版
2. Plan mode → 选 A 迁移 / B 不迁
   Plan mode → 写 <project>/MIGRATE-PLAN.md（不是 ~/.claude/plans）
   ExitPlanMode
3. cp apps/hydro-toolkit-web → apps/<name>-web（改 3 处：name+port / rewrites / track）
   cp services/hydro-toolkit/api.py → services/<name>/（改 endpoints）
4. 改 infra/deploy/ports.sh 加 [<name>]=<streamlit-port>
   改 services/pyproject.toml 加 workspace member
5. 写 sync-data.sh（白名单 rsync，禁 .env/raw/整个 data/）
   daily_update.sh 末尾加一行 bash sync-data.sh
6. pnpm install && uv sync --all-packages
7. /api-smoke <name>                                  # 验 FastAPI
8. pnpm --filter <name>-web build                     # 验 standalone 产出
9. bash sync-data.sh                                  # 首次同步数据到 VPS
10. /deploy <name> --fast                             # 或 bash web-stack/infra/deploy/deploy.sh <name>
11. ssh VPS: cp nginx-config{,.bak-$(date)} → sed proxy_pass old→new → nginx -t → reload
12. ssh VPS: systemctl stop + disable 旧 Streamlit unit（先 systemctl cat 找准 unit 名）
13. curl HTTPS 302 + 浏览器登录验 ✓
14. /ship web-stack devtools                          # 跨 repo 提交
15. mv app.py + 旧 deploy.sh → _archive-streamlit/
    rewrite deploy.sh 为薄包装
    更新 README / DOMAIN / MIGRATE-PLAN
16. /retro（playbook）+ /handoff（下次 entry point）
```

---

## 本次漏了什么 skill

| 节点 | 本次做法 | 应该做法 | 原因 |
|---|---|---|---|
| 会话开头 | 直接进任务 | **`/warmup`** | 从 retro §6 的上下文压力来，忽略了入场规范 |
| FastAPI 本地验证 | 手写 `uvicorn & + sleep + curl + pkill` | **`/api-smoke cc-options`** | 惯性，忘了这个封装 |
| 跨 repo commit | 手写 `git add/commit/push × 2` | **`/ship web-stack devtools`** | 习惯 bash |
| deploy 入口 | `bash infra/deploy/deploy.sh cc-options --fast` | 等价但 `/deploy cc-options --fast` 更短 | 次要 |
| pkill 误杀 ssh | `pkill -f 'streamlit.*8521'` 匹配到自己 | `systemctl stop <unit>` 更安全 | 现场 bug |

**下次你看到我这几种情况，直接叫停：**
- 开新会话没 /warmup → "先 /warmup"
- 新建 FastAPI 后手工 curl → "用 /api-smoke"
- `git commit` 多 repo 手跑 → "用 /ship"
- 看到 `pkill -f <process>` 且 process 名常见字符 → "危险，改 systemctl stop"

---

## 方法论抽象

**迁移任务的心智模型**：

1. **双轨运行** — 新站起来 ≠ 切流量。先把新站 standalone 跑起来（端口不冲突），再在 nginx 层一次原子切 proxy_pass。**永远不先停旧的再起新的**（哪怕 1 秒空窗也会被 oncall 发现）
2. **数据管道 vs 服务进程要分开思考** —
   - cc-options 的 `.env` + 数据拉取在本地
   - data/*.json 是"产物"，rsync 上 VPS
   - FastAPI 在 VPS 读产物
   - **3 层关注点**：**凭证（本地）/ 产物（中转）/ 服务（VPS）**。迁移时先问"哪层在哪"，再画管道
3. **肌肉记忆保护** — 用户习惯的 `bash deploy.sh` 不要破坏。底层可以彻底换，**入口名字和位置保持不变**。本次 `deploy.sh` 从 Streamlit 部署改成 Next 部署，但路径+名字不变，用户 Raycast hotkey 不用改
4. **归档比删除好** — `_archive-streamlit/` 留原件，出问题能 `mv` 回来；真确定没用，下次迁移再统一清
