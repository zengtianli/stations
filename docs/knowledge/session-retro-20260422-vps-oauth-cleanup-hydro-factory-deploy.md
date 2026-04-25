# Session Retro · 2026-04-22 · VPS oauth-proxy 清理 + hydro-* factory deploy

> 这类任务的标准编排：**HANDOFF 驱动的 VPS 破坏性清理 + 批量 deploy** — 下次用户说"按 HANDOFF_*.md 做掉 VPS 侧的事"时，抄这份走。

---

## 核心编排（本次应该这样跑）

```
用户口令「按 HANDOFF_vps.md 开工」
  ↓
【入场 · 并行 3 路】
  /warmup                           — 环境 snapshot
  Read HANDOFF_vps.md              — 读专题 handoff
  Read ~/Dev/stations/HANDOFF.md   — 读通用 handoff 兜底（本次 HANDOFF_vps 是专题，通用也要瞄一眼）
  ↓
【Pre-flight · 并行 4 路】
  /services-health --json          — 11 hydro baseline 版本
  /sites-health --no-traffic        — edge HTTP 基线
  ssh VPS: 扫待拆服务 systemctl/nginx/www 三态
  ssh VPS: 扫 git log（factory/webhook 代码同步性）
  ↓
【Plan Gate】
  AskUserQuestion 对决策点拍板
  （或：HANDOFF 默认决策 + 用户一句 "ok" 生效）
  ↓
【Tier 1 · 破坏性拆服务（逐步，非并行）】
  Step 1-2  ssh VPS: stop + disable + rm unit              ← 可逆
  Step 3    ssh VPS: rm nginx vhost + nginx -t + reload    ← 要绿灯
  Step 4    ssh VPS: rm -rf 代码目录                        ← 不可逆（github archived 可取回）
  Step 5    Edit ~/Dev/tools/vps/github_webhook_receiver.py — 清 REPO_PATHS 僵尸 + RESTART_SERVICES
            scp → VPS + systemctl restart github-webhook
  Step 6    ssh VPS: find /etc /var/www 验证无残留
  ↓
【Tier 1 收尾】
  cd ~/Dev/tools/vps && git add + commit + push
  （或一条：/ship tools/vps）
  ↓
【Tier 2 · 批量 deploy】
  bash web-stack/infra/deploy/deploy-batch.sh <site1> <site2> ...
  （run_in_background=true — 4-8 min, 等通知）
  ↓
【Tier 5 · 验证 · 并行 4 路】
  curl /api/metadata × N           — 每站 version/service_id/port
  ssh VPS: grep factory on active path  — 确认新代码真在
  /menus-audit                      — 13/13 漂移
  /sites-health --filter hydro      — edge 200 确认
  ↓
【收尾】
  /retro <topic>   或   /handoff
  归档 HANDOFF_vps.md（已完成使命）
```

**关键数字**：本次会话 **6 个现成 skill 漏了没用** / **3 个新姿势应该固化成 skill**。

---

## Phase-by-phase · 本次怎么做的 vs 正确姿势

### Phase 1 · 入场 · `/warmup` + 读 HANDOFF

**触发时机**：任何新会话的第一动作，进 `~/Dev/stations/` 或任何项目根。

**本次怎么做的**：✅ 正确 — 并行读了 HANDOFF_vps.md + 跑了 /warmup + pre-flight ssh 三件事。

**正确姿势**：
- 同 message 三并行：`/warmup` + Read HANDOFF_vps.md + 手工 pre-flight（ssh VPS 看目标服务状态）
- HANDOFF 专题文档（如 `HANDOFF_vps.md` / `HANDOFF_mobile.md`）优先于通用 HANDOFF.md

**下次记得**：看到 `HANDOFF_*.md` 就当 playbook 读（含 bash 命令可复制），对决策点默认值有疑问再问。

---

### Phase 2 · Pre-flight · `/services-health` + `/sites-health`

**触发时机**：改 VPS 任何服务前的 baseline 快照。

**本次怎么做的**：✅ 并行跑了 `/services-health` + `/sites-health` + 手工 curl 4 站 /api/metadata 做 pre-deploy version baseline。

**正确姿势**：
- `/services-health` 本机跑会全红（因为 FastAPI port 只在 VPS localhost 可达），但 **menus-audit 列全绿 + 端口配置有效** 就是合格 baseline
- `/sites-health --no-traffic` 是 edge 视角，真正告诉你"用户看到的状态"
- 手工 curl `/api/metadata` 记录 pre-deploy version — 这一步 **没有 skill**（services_vs_live.py 只给 VPS localhost 视角，不给公网）

**下次记得**：pre-deploy baseline 先跑这两个 skill；事后比对"版本没变 = deploy 白做了"。

---

### Phase 3 · Plan Gate · `AskUserQuestion` / 默认决策表

**触发时机**：HANDOFF 列了决策点时。

**本次怎么做的**：✅ HANDOFF_vps.md 自带决策表（L319-327），用户一句 "ok" 生效默认值，无需再问。

**正确姿势**：
- HANDOFF 列了决策点 + 给了"建议"列 → 用户若"按默认"或"ok"一句话，直接按建议走
- HANDOFF 没列决策点 / 用户模糊 → 必用 `AskUserQuestion` 拍板

**下次记得**：HANDOFF 文档自带决策表的，不要重复提问。

---

### Phase 4 · Tier 1 拆服务 · ❌ 无对应 skill

**触发时机**：下线一个 VPS 服务（systemd + nginx + code + webhook 四件套清理）。

**本次怎么做的**：手工 6 个 ssh bash steps。

**可能的 skill**：`/site-archive` — 描述是"下线一个闲置子域 — 停服务/删 nginx/CF DNS+Origin+Access/移 /var/www 到归档"。

**但不完全匹配**：
- `/site-archive` 面向 **web 子域站点**（有 CF DNS + Origin + Access），oauth-proxy 也是子域，勉强能用
- 但 oauth-proxy 额外要：**更新 webhook receiver** REPO_PATHS/RESTART_SERVICES（`/site-archive` 不涉及）
- 同时这是"干净下线非流量站"，`/site-archive` 的 "移 /var/www 到归档" 步骤和本次 "直接 rm -rf"（github archived 兜底）语义略不同

**正确姿势**：
- 可以**尝试** `/site-archive proxy.tianlizeng.cloud` 看看它做到哪步 — 如果覆盖了 systemd + nginx + code，那剩下的 webhook receiver 清理手工补
- 或者**新立 skill `/service-decommission`**（专为非 web 服务/后端的下线）

**下次记得**：下一次清 VPS 某服务，**先试 `/site-archive`**，看它支持到什么程度；不够用再手工补 + 记入 skill backlog。

---

### Phase 5 · Tier 1 收尾 · `/ship` 漏用

**触发时机**：`github_webhook_receiver.py` 本地改完，需要 commit + push。

**本次怎么做的**：手工 `cd ~/Dev/tools/vps && git add + git commit + git push`。

**正确姿势**：`/ship tools/vps` 一句话。

**下次记得**：webhook receiver 或任何单 repo 改完，`/ship <repo>` 替代三步手工 git。

---

### Phase 6 · Tier 2 batch deploy · `/deploy` 漏用（半对）

**触发时机**：批量 deploy 多个 hydro-* 站。

**本次怎么做的**：手工 `bash web-stack/infra/deploy/deploy-batch.sh <8 sites>` 跑后台。

**可能的 skill**：
- `/deploy <name>` — 通用部署 wrapper（本来就是 deploy.sh 的编排）
- `/deploy-changed` — 自动扫 git diff，决定 deploy 哪些站（**本次更合适**：8 站都因 Phase 3 refactor 改过，auto-detect 会全选）

**本次选 `deploy-batch.sh` 没错**：比 `/deploy` × 8 次更高效（global sync 只跑 1 次而不是 8 次，ssh 复用）。

**但 `/deploy-changed` 可能更自动**：
```
/deploy-changed   # 扫本地 git diff 和 VPS 最后 deploy 状态，自动选要 deploy 的站
```

**下次记得**：
- 改了 ≥ 3 站 Python 后端 + 不想手点站名 → `/deploy-changed`
- 改了 1-2 站 → `/deploy <name>`
- 改了巨多但要完全控制 → `deploy-batch.sh <a> <b> ...`

---

### Phase 7 · Tier 5 验证 · `/menus-audit` 手调了底层

**触发时机**：deploy 或 SSOT 改完的漂移检测。

**本次怎么做的**：`python3 ~/Dev/devtools/lib/tools/menus.py audit`（直接调 python 模块）。

**正确姿势**：`/menus-audit` — 同样的输出，是 skill 化的薄 wrapper。

**下次记得**：改 menus/ 或 deploy 完，直接 `/menus-audit`，不要手工 `python3 menus.py audit`。

---

### Phase 8 · 会话收尾 · `/retro` ✅（本次用户明确指定）

用户说了 "1 /retro 下归档" → 直接跑 `/retro` 写本 MD。

如果用户说 "结个尾"（没指定 retro vs handoff）：
- 本次是**一次性清理任务 + 纯 VPS 动作** → `/retro`（归档"这类任务怎么做"）
- 本次是**多 PR 工程 + 需要下次接**续 → `/handoff`（写 HANDOFF.md + recap + harness 三合一）

---

## 通用 Playbook · 下次 "按 HANDOFF_xxx.md 做 VPS 侧" 抄这个

```
1. 并行三读：/warmup + Read HANDOFF_xxx.md + Read stations/HANDOFF.md
2. 并行四 pre-flight：/services-health + /sites-health + ssh VPS 两类状态扫描
3. 对 HANDOFF 决策表：用户 "ok" 走默认 / "改一下" 走 AskUserQuestion
4. 破坏性清理逐步：stop → rm unit → rm vhost + nginx -t → rm code → 改 webhook → verify
5. 单 repo commit：/ship <repo>
6. 批量 deploy：deploy-batch.sh <a> <b> ...（>=3 站）或 /deploy <name>（1-2 站）
7. 并行四验证：curl /api/metadata × N + ssh 真代码确认 + /menus-audit + /sites-health
8. 归档：/retro（一次性任务）或 /handoff（需要接续）
```

**关键原则**：
- **HANDOFF 带 bash 命令是可复制**的，不用自己组装
- **破坏性改动要串行 + 每步验证**，不要 shell 一个 && 串完（卡住没得 rollback）
- **Batch deploy 必走 `deploy-batch.sh` 不是 `/deploy` × N**（global sync 只一次）
- **Pre-flight 与 Post-flight 跑同一组 skill**（/services-health + /sites-health），对比 diff 证明"动过了"

---

## 本次漏了什么 skill · 诚实清单

| # | 动作 | 本次做法 | 应该用 | 为什么漏 |
|---|---|---|---|---|
| 1 | commit webhook 改动 | 手工 `git add/commit/push` | `/ship tools/vps` | 手顺快了没想起 |
| 2 | menus-audit 验证 | `python3 menus.py audit` | `/menus-audit` | 底层跑也对，但不利于用户复用指令 |
| 3 | batch deploy | 手工 `deploy-batch.sh` | 可选 `/deploy-changed` | `/deploy-changed` 更自动化但本次参数明确也 OK |
| 4 | 清 oauth-proxy 服务 | 手工 6 step bash | 尝试 `/site-archive proxy` | 该 skill 不完全匹配非 web 服务，可能报 "not a standard web site"；但值得一试 |
| 5 | 本地 vs VPS 代码 hash diff | 手工 md5/md5sum | **无 skill**（候选：`/vps-drift <path>`） | 应该抽 skill：常需要对比本地文件 vs VPS 文件 |
| 6 | pre-deploy version baseline | 手工 `curl /api/metadata × 4` | **无 skill**（候选：`/services-snapshot`） | 没有公网视角的版本 snapshot skill |

**下次你看到我手工 bash 做本该有 skill 的事，直接说 "用 /xxx"，我立即切换。**

---

## 新 skill 候选（backlog）

1. **`/service-decommission <subdomain>`** — 非 web 服务下线（systemd + nginx + code + webhook receiver 四件套）。比 `/site-archive` 更普适。
2. **`/vps-drift <local-path>`** — 对比本地文件 / 目录与 VPS 对应路径的 diff（md5 + diff）。常用于"VPS 代码是最新吗"。
3. **`/services-snapshot`** — 公网视角扫 11 服务 `/api/metadata`，输出 version × service_id × port 表。pre/post-deploy baseline 专用。

---

## 本次会话真实数字

| 维度 | 数字 |
|---|---|
| Tier 1 拆 oauth-proxy | 6 steps, 全绿 |
| Tier 2 deploy 8 hydro-* | 629s sum / ~4 min wall, 0/8 失败 |
| webhook receiver 瘦身 | 26 → 10 REPO_PATHS, 3 → 0 RESTART_SERVICES |
| menus-audit | 13/13 全绿 |
| sites-health | 12/12 HTTP 200（hydro + dashboard + main） |
| 使用 skill 次数 | 4（/warmup, /services-health, /sites-health, /retro） |
| 漏用的 skill | 6（见上表） |
| HANDOFF_vps.md 决策执行 | 5/5 采默认值 |
| 新 backlog | 16 个 `/var/www/hydro-*` legacy dir 可清 · CF DNS `proxy.tianlizeng.cloud` 保留 · 3 个新 skill 候选 |

---

## 心智模型总结

**HANDOFF_vps.md 这类 "专题 handoff" 的 playbook 特征**：

- 文档本身已是可执行 bash **+** 决策表 **+** 回滚方案 → **不要二次规划**
- CC 的价值在于：**并行 pre-flight + 分步执行 + 并行 post-flight**（加速 + 减错）
- 遇到 **破坏性** step（rm -rf / nginx 删 vhost / daemon-reload）要拆成独立 bash call，每步验证绿再下一步
- 发现 HANDOFF 漏的（本次如 `/var/www/hydro-*` 16 legacy dirs）**不要自主清**，记到"意外收获"等用户拍板

**反例**：HANDOFF 明明给了 bash 命令你还要"重新想清理顺序" → 浪费 + 可能错过 edge case。文档作者（上轮的 CC）是你自己；相信它。
