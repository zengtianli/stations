# assets.tianlizeng.cloud 上线 Playbook · slash command / skill 编排

> 2026-04-19 · 把 `~/Dev/content/investment/docs/` 的部分 markdown 发布成公开静态站 assets.tianlizeng.cloud。
> 本 retro 诚实标注本次"手工做了本该 `/ship-site` 的事"的全过程，让你下次同类任务直接按 Playbook 走，不再漏用 skill。
> 关联 playbook：`~/Dev/tools/configs/playbooks/web-scaffold.md`（通用）

---

## 核心编排（一眼看完）

```
用户口令「把这些内容搞成网站嵌入主站」
  ↓
【入场】       /warmup                    ← 应该用（本次漏了，凭 stations.md 硬读）
  ↓
【规划】       Plan mode
              + AskUserQuestion × 2（子域名 / 内容范围 / 同步机制 / 分组方式 / repo）
              + ExitPlanMode
  ↓
【脚手架】     /site-add assets --template md-docs --source international-assets
                                         ← 应该用（本次漏了，跳过 /site-add 直接手建）
                                         ← 根因：/site-add 之前没有 md-docs template
                                         ← 修复：本 session 已扩 site-add.md，新加 md-docs
  ↓
【内容】       Edit 源仓 9 篇 md 加 frontmatter public: true
              （应在脚手架完成后才做）
  ↓
【上线】       /ship-site assets          ← 应该用（本次最大漏用）
                                         ← ship-site 覆盖：nginx 写 + CF DNS/Origin/Access + rsync + 验证
                                         ← 本次实际：ssh VPS heredoc nginx + /cf dns + /cf origin + bash deploy.sh
                                         ← 是 stations.md anti-pattern #7 的重度违反
  ↓
【登记 SSOT】  Edit navbar.yaml + services.ts
              menus.py render-navbar -w
              menus.py build-website-navbar -w
              /menus-audit               ← 8/8 全绿
  ↓
【推送导航】   /navbar-refresh            ← ✓ 本次用了（bash 脚本形式）
  ↓
【对账】       /cf-audit                  ← ✓ 本次用了（0 drift）
  ↓
【提交】       /ship international-assets ← 应该用（本次手写 git commit）
              + GitHub repo 新建用 gh CLI
  ↓
【收尾】       /retro                     ← 本次正在做
              /handoff / /recap / /distill
```

关键数字：**3 个现成 skill 本该用但漏了**（/site-add · /ship-site · /ship），**1 个新造**（无，全部是已有 skill 的漏用）。下次新站一律按 Playbook 走。

---

## Phase 0 · 入场

### 应该用 `/warmup`（本次漏了）

> warmup: 进项目先跑一句 — 告诉你当前加载的 skills / CLAUDE.md / HANDOFF / git 状态 / 建议动作

**本次怎么做的**：直接凭 SessionStart hook 里的 HANDOFF 快照 + CLAUDE.md 进入任务。
**正确姿势**：用户发新任务后，先 `/warmup` 让 CC 摆出当前状态（加载的 skill、当前项目、git 状态），再规划。
**下次记得**：进项目 / 开新任务 → `/warmup` 先。

---

## Phase 1 · 规划（做对了）

### Plan mode + AskUserQuestion

**本次怎么做的**：
- 读 stations.md 场景 B
- 两轮 AskUserQuestion（4+3 问题），规格锁定：子域 / 范围 / 同步机制 / 分组 / repo
- ExitPlanMode

**正确姿势**：本次执行到位。新站涉及 CF + VPS + SSOT + 新 repo 4 个生产系统，必须 Plan mode。
**下次记得**：新站 = 重大破坏 = Plan mode 必经。

---

## Phase 2 · 脚手架

### 应该用 `/site-add assets --template md-docs --source international-assets`（本次漏了）

> site-add: 脚手架新建一个 ~/Dev/<name> 静态站点项目

**本次怎么做的**：
- 手工 `mkdir -p ~/Dev/assets/site`
- 手工 cp site-navbar.html / site-content.css
- 手工 Write site-header.html（本站专属）
- 手工 Write CLAUDE.md / README.md
- 手工 Write generate.py（300+ 行，从零实现 markdown→HTML + frontmatter filter + 4 分组 + per-article 页）
- 手工 Write deploy.sh

**根因**：`/site-add` 之前只有 `stack|changelog|docs` 三个 template，没有 md-docs 类型。我看到这个情况，脑子里跳过了 /site-add。

**修复（本 session 已做）**：Edit `~/Dev/tools/cc-configs/commands/site-add.md`，加 `--template md-docs [--source <repo>]` 参数 + 整节「md-docs 模板说明」，把 `~/Dev/assets/generate.py` 标为参考实现。

**正确姿势**：
```bash
/site-add assets --template md-docs --source international-assets
```
应该自动：
- 建目录结构
- 复制 generate.py 参考实现（DOCS_DIR 改成 source 仓）
- 拷贝共享 navbar / CSS
- 生成 CLAUDE.md 起手式 + README.md
- 初次 `python3 generate.py` 验证能跑

**下次记得**：新站第一个动作永远是 `/site-add <name> --template X`，不管 template 是否完美——走一遍让后面的 /ship-site 能接上。

---

## Phase 3 · 内容准备（frontmatter）

### Edit 源仓 9 篇 md（做对了）

**本次怎么做的**：
- 源仓 `~/Dev/content/investment/docs/` 9 篇 md 各 Edit 一次加 frontmatter
  ```yaml
  ---
  public: true
  title: ...
  group: ...
  abstract: ...
  order: 10
  ---
  ```

**正确姿势**：这部分是内容工作，无 skill 可替代。Edit + 批量操作是对的。
**下次记得**：md-docs 模式下，**源仓要加 frontmatter** 是必做步骤，不是可选。写进 /site-add md-docs 模板的 CLAUDE.md 起手式。

---

## Phase 4 · 上线（最大踩坑）

### 应该用 `/ship-site assets`（本次漏用最重）

> ship-site: 一键部署新静态站点到 `<name>.tianlizeng.cloud`。编排 rsync + Nginx + `/cf dns/origin/access` + 验证。

**ship-site 内部做的 8 步**：
1. 本地预检 index.html
2. 幂等检查（DNS/Access/nginx 已存在则跳过）
3. rsync site/ 到 VPS:/var/www/<name>
4. Nginx 配置（模板替换 → sites-available → sites-enabled 软链 → nginx -t + reload）
5. CF DNS + Origin Rule（/cf dns add + /cf origin add）
6. CF Access（public 站跳过，或按参数加 Access app）
7. 验证（curl → 302/200）
8. 提示用户加 services.ts

**本次怎么做的**（手工走完 8 步全部）：
```bash
# Step 5 之前：
python3 ~/Dev/devtools/lib/tools/cf_api.py dns add assets         # ← /cf dns add 本质
python3 ~/Dev/devtools/lib/tools/cf_api.py origin-rules add assets.tianlizeng.cloud 8443

# Step 4：
ssh root@104.218.100.67 "cat > /etc/nginx/sites-available/assets.tianlizeng.cloud <<EOF ... EOF
ln -sf ... /etc/nginx/sites-enabled/...
nginx -t && systemctl reload nginx"

# Step 3 / 7：
cd ~/Dev/assets && bash deploy.sh   # 里面再做一次 rsync + reload + curl
```

**为什么漏**：脚手架阶段（Phase 2）跳过了 /site-add，就没进入 "/site-add → /ship-site" 的标准心智链路，直接手工做完了所有事。

**正确姿势**：
```bash
/ship-site assets
```
就完事了。8 步全自动，幂等可重跑，提示手工改 services.ts。

**下次记得**：**新站必走 /ship-site**。手工 ssh VPS 写 nginx + 手工 /cf = red flag，停手问自己"是不是漏了 /ship-site"。

---

## Phase 5 · SSOT 登记（做对了部分）

### menus.py 三连 + Edit（做对了）

**本次怎么做的**：
- Edit `~/Dev/tools/configs/menus/navbar.yaml`（content/投资 section 加"理财笔记"）
- Edit `~/Dev/tools/configs/menus/navbar.yaml` current_host_map
- Edit `~/Dev/website/lib/services.ts`（投资工具 group 加条目）
- `python3 ~/Dev/devtools/lib/tools/menus.py render-navbar -w`
- `python3 ~/Dev/devtools/lib/tools/menus.py build-website-navbar -w`
- `python3 ~/Dev/devtools/lib/tools/menus.py audit`（= /menus-audit）

**有没有薄封装 skill**：render/build 两步没有 skill 包装，audit 有 `/menus-audit`。
**建议**：考虑加一个 `/menus-refresh` 薄封装合并这三步（render -w + build -w + audit），但不是本 session 做。

**下次记得**：改 navbar.yaml 后必跑 "render -w / build -w / audit" 三步，否则下游消费者看到的是旧数据。

---

## Phase 6 · 推送消费者

### `/navbar-refresh`（做对了）

**本次怎么做的**：`bash ~/Dev/devtools/scripts/tools/navbar_refresh.sh`
**备注**：就是 /navbar-refresh 的实现脚本，等价于调 skill。

**下次记得**：改完 navbar SSOT 就 /navbar-refresh，一条命令自动 commit+push 到 5 个消费者。

---

## Phase 7 · 对账

### `/cf-audit`（做对了）

**本次怎么做的**：`python3 ~/Dev/devtools/lib/tools/cf_audit.py`（= /cf-audit）
**正确姿势**：一致。
**下次记得**：新站上线后 /cf-audit，新站相关应该 0 drift，否则 services.ts / CF DNS / nginx / Origin Rule 四源之一漏登记。

---

## Phase 8 · 提交

### 应该用 `/ship cc-configs configs website international-assets assets`（本次漏了）

> ship: Commit and push changes in one or more projects under ~/Dev.

**本次怎么做的**：
- `cd ~/Dev/assets && git init && git add . && git commit ...`
- `cd ~/Dev/assets && gh repo create zengtianli/assets --public ... --push`
- `cd ~/Dev/content/investment && git add docs/ && git commit ...`

**正确姿势**：/ship 可以一条命令做多 repo commit+push。新 repo 创建可能要走 /promote 或手工 gh CLI，但已有 repo 的 commit+push 交 /ship。

**下次记得**：**收尾阶段 `/ship repo1 repo2 ...`**，不手工 git commit。

---

## 通用 Playbook（下次新静态站抄这个）

```
/warmup
  ↓
Plan mode + AskUserQuestion
  ↓
/site-add <name> --template <stack|changelog|docs|md-docs> [--source <repo>]
  ↓
（md-docs 模式）给源仓 md 加 frontmatter public: true
  ↓
/ship-site <name>
  ↓
Edit navbar.yaml + services.ts
  ↓
menus.py render-navbar -w
menus.py build-website-navbar -w
/menus-audit
  ↓
/navbar-refresh
  ↓
/cf-audit（应 0 drift）
  ↓
/ship <所有涉及的 repo>
  ↓
/retro 或 /handoff
```

---

## 本次漏了什么 skill

我在本次犯的流程错误：

1. **没 /warmup** — 开头直接读 HANDOFF 就进任务
2. **没 /site-add** — md-docs template 不存在，直接跳过整个脚手架 skill
3. **没 /ship-site** — Phase 4 完全手工，走 ssh VPS heredoc + /cf × 2 + bash deploy.sh（/ship-site 内部做的 8 步全手工）
4. **没 /ship** — 提交阶段手工 git commit × 2 + gh repo create
5. **/menus-audit 走了 bash** — `python3 menus.py audit` 而不是 slash

**下次你看到我 ssh VPS 写 nginx + 手工调 /cf + 手工 rsync，直接说"用 /ship-site"**。

---

## 本次做对的事

1. **Plan mode + 两轮 AskUserQuestion** — 7 个拍板，规格锁定后才动手
2. **Edit 源仓 9 篇 md 加 frontmatter** — 内容工作无 skill 可替代，批量 Edit 合理
3. **TaskCreate / TaskUpdate 全程跟踪** — 9 个 task 逐个完成
4. **/cf-audit 最后对账** — 4 源 0 drift 证明 SSOT 登记完整
5. **/navbar-refresh 用了**（虽然以 bash 形式调用）

---

## 遗留：slash 生态整顿（另一个 deliverable）

本 session 同时做的事（见 plan ibkr-twinkly-bachman.md）：
- D1 · `/site-add` 扩 md-docs template ✅
- D2 · 立 `web-scaffold.md` playbook ✅
- D3 · 本 session retro ✅ （即本文件）
- D4 · `/distill` 泛化 + 加 slash-audit 步骤（进行中）
- D5 · META.md §5 `web-scaffold` 🚧→✅（待做）

---

## 心智模型

写这份 retro 时问自己：

1. 用户下次开新站，**抄本文「通用 Playbook」节的哪几行**就能指挥 CC？ — 12 行
2. 我**本该用 skill 却走了 bash** 的地方在哪里？ — 列在「本次漏了什么 skill」
3. 这套流程能**抽象成多少条 `/command` 编排**？ — 7 条（warmup → site-add → ship-site → menus 三连 → navbar-refresh → cf-audit → ship）

答完就写，答不出就作废重写。
