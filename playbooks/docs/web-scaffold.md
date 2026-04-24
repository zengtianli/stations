# Playbook · web-scaffold · 新站上线

> tianlizeng.cloud 新子域 + 静态内容站从零到 HTTPS 在线的完整编排。
> 首次立于 2026-04-19，基于 assets.tianlizeng.cloud 上线复盘。
> 关联 domain：stations（站群治理，已有站改造走那边）。

---

## § 定位

**这类任务是**：在 `tianlizeng.cloud` 下**新加一个子域**，上线一个**静态内容站**。站点内容从**已有 repo / 现有内容源**来，或**从零脚手架**。

典型场景：
- 把某个 private repo 的部分 markdown 发布成公开静态站（assets.tianlizeng.cloud 于 2026-04-19 首发）
- 新建一个 yaml→HTML 卡片站（stack.tianlizeng.cloud 模式）
- 新建一个 changelog / 文档站
- 复活一个归档站（跟 `/site-activate` 不是一回事：那个只动 projects.yaml）

**不是**：
- 改已有站的 navbar / mega / 共享 CSS → **stations.md**
- 改某个业务 app 的计算/逻辑 → 各自领域 playbook（hydro.md / bid.md 等）
- 重命名子域 → **`/site-rename`**（原子流程，不走本 playbook）
- 下线子域 → **`/site-archive`**

---

## § 入场判断

**trigger words**（用户原话含这些 → 走本 playbook）：
- "新站 / 新子域 / 搭个站 / site-add / launch"
- "上线 / 发布 / publish / deploy 新站"
- "<name>.tianlizeng.cloud 做一个 / 建一个"
- "把 X 内容发成公开站"
- "静态站 / HTML 站"
- "md-docs / markdown → HTML / 把 docs 发布"

**反例**：
- "改 navbar 的颜色" → stations.md
- "hydro-annual 的计算不对" → hydro playbook
- "assets.tianlizeng.cloud 的内容更新一下" → 不是新站，直接 `bash deploy.sh` 即可

---

## § 编排图

**路径 A · 完整新站**（从零，90% 场景）

```
用户: "我想把 X 内容发成 Y.tianlizeng.cloud"
  ↓
/warmup
  ↓
Plan mode
  ├─ AskUserQuestion × N（子域名 / 内容范围 / template 类型 / navbar 位置）
  ├─ 写 plan + 风险回滚
  └─ ExitPlanMode
  ↓
/site-add <name> [--template md-docs|stack|changelog|docs] [--source <repo>]
                            ← 脚手架本地骨架 + generate.py + deploy.sh
  ↓
（仅 md-docs）源仓给要公开的 .md 加 frontmatter `public: true`
  ↓
bash deploy.sh 之前：本地 python3 generate.py 验证
  ↓
/ship-site <name>           ← 一条龙：CF DNS + Origin Rule + nginx + rsync + 验证
                              自动调 /cf dns add, /cf origin add
  ↓
改 SSOT 登记 navbar 入口：
  ├─ Edit ~/Dev/tools/configs/menus/navbar.yaml（content/投资 等合适 section）
  ├─ Edit ~/Dev/tools/configs/menus/navbar.yaml current_host_map
  ├─ Edit ~/Dev/stations/website/lib/services.ts 加 service 条目
  └─ python3 ~/Dev/devtools/lib/tools/menus.py render-navbar -w
     python3 ~/Dev/devtools/lib/tools/menus.py build-website-navbar -w
  ↓
/menus-audit                ← 8/8 全绿，否则回头查
  ↓
/navbar-refresh             ← 推到所有消费者 repo（commit+push 自动）
  ↓
/cf-audit                   ← 4 源对账（services.ts ↔ CF DNS ↔ nginx ↔ Origin Rule）
                              新站应该 0 drift
  ↓
/ship cc-configs configs website   ← SSOT 各 repo commit+push
                                     （/navbar-refresh 已经 commit 过下游静态消费者）
  ↓
curl 验证 https://<name>.tianlizeng.cloud
```

**路径 B · 本地已有骨架，只需上线**

```
/ship-site <name>           ← 跳过 /site-add，直接上线
  ↓
（剩余 navbar + ship 步骤同路径 A）
```

**路径 C · 新项目一条龙（含 GitHub repo + webhook）**

```
/launch <name> --kind static
  ├─ 内部链：/site-add → /groom（含 /promote + /ship）→ /repo-map add → /ship-site → /deploy
  └─ 每阶段幂等，失败可中断后单步续
```

---

## § 复用清单

| skill / command | 用法 | 现有 or 本次新建 |
|---|---|---|
| `/warmup` | 入场看环境 | 现有 |
| `/site-add <name> [--template] [--source]` | **脚手架**本地项目骨架 | 现有（本次扩了 md-docs template） |
| `/ship-site <name>` | **一键上线**：CF DNS/Origin/Access + nginx + rsync + 验证 | 现有 |
| `/launch <name> --kind static` | 新项目一条龙编排 | 现有 |
| `/cf dns add / origin-rules add / access add` | CF 三联操作 | 现有（ship-site 内部调用） |
| `/menus-audit` | 导航漂移审计 | 现有 |
| `/navbar-refresh` | 推 navbar 到消费者 | 现有 |
| `/cf-audit` | services.ts / CF / nginx / Origin 对账 | 现有 |
| `/deploy <name>` | 通用部署（仅 deploy.sh 存在即可） | 现有 |
| `/ship <repo1> <repo2>` | 多 repo commit+push | 现有 |
| `/sites-health` | 全站健康巡检（可选验收） | 现有 |

---

## § 改动边界矩阵

| 改什么 | 文件 | 破坏性？| 入口 |
|---|---|---|---|
| 加新子域 | CF DNS + Origin Rule + nginx + services.ts + navbar.yaml | **重大破坏** | Plan mode + `/launch` 或 `/site-add + /ship-site` |
| 改站内内容（已上线站） | `~/Dev/<name>/` 内容文件 | 非破坏 | `bash deploy.sh` 或 `/deploy <name>` |
| 改 template | `~/Dev/tools/cc-configs/commands/site-add.md` + 模板源 | **半破坏**（影响未来新站） | Plan mode + 测试：`/site-add <tmp>` 跑一遍验证 |
| 换站点内容源仓 | `~/Dev/<name>/generate.py` 的 DOCS_DIR | 半破坏（会重渲染） | Edit + bash deploy.sh 验证 |
| 加 navbar 入口 | `navbar.yaml` + `services.ts` | 半破坏（影响所有站 navbar） | Edit + `/menus-audit` + `/navbar-refresh` |

---

## § 踩坑 anti-patterns

**1. 漏用 `/ship-site`，手工 ssh VPS 写 nginx + 手工调 /cf** — 2026-04-19 assets 上线踩
- 现象：把 `/ship-site` 内部做的 8 步都手工跑了（ssh VPS + heredoc nginx + systemctl reload + /cf dns add + /cf origin add + rsync + curl）
- 根因：`/site-add` 不支持 md-docs template，自然跳过 `/site-add`，连带跳过 `/ship-site` 的心智默认
- 下次：**新站一律先 `/site-add <name> --template X`，然后 `/ship-site <name>`**。就算 /site-add 的模板不完美，也要**走一遍**让 /ship-site 能无缝接上

**2. 漏给源仓 md 加 frontmatter（md-docs 模式）**
- 现象：generate.py 扫 docs/*.md 过滤 public: true，什么都不渲染
- 下次：**跑 generate.py 前先检查源仓 frontmatter**（grep 一下 `public: true`）

**3. 忘记登记 SSOT**（navbar.yaml + services.ts + current_host_map）
- 现象：站上线了但主站 navbar 看不到入口
- 下次：**登记 SSOT 三处**是 `/ship-site` 完成后的必做收尾；写进 CLAUDE.md 起手式

**4. /menus-audit 没跑就 /ship**
- 现象：navbar 本地改了但 rendered template 没重跑，出现 drift，其他站看到旧 navbar
- 下次：**改 navbar.yaml 后**必跑 `menus.py render-navbar -w` + `menus.py build-website-navbar -w` + `/menus-audit`

**5. /site-add 的 template 不适用自己场景时，直接自己写 generate.py**
- 现象：本次 md-docs 场景没模板，就跳过了 /site-add 直接 mkdir + 自己写 generate.py
- 下次：**先扩 /site-add 的 template 选项**（或给 site-add.md 加一个说明），让下次自己和后来者有模板可用

---

## § 文件索引

**编排命令源**：
- `~/Dev/tools/cc-configs/commands/site-add.md` — 脚手架规格
- `~/Dev/tools/cc-configs/commands/ship-site.md` — 一键上线规格
- `~/Dev/tools/cc-configs/commands/launch.md` — 一条龙编排

**CF / VPS 工具**：
- `~/Dev/devtools/lib/tools/cf_api.py` — CF API 统一入口
- `~/Dev/devtools/lib/templates/nginx-static.conf` — nginx 模板（ship-site 用）
- VPS nginx: `/etc/nginx/sites-available/<hostname>` + `/etc/nginx/sites-enabled/<hostname>` 软链

**SSOT**：
- `~/Dev/tools/configs/menus/navbar.yaml` — 顶级 mega + current_host_map
- `~/Dev/stations/website/lib/services.ts` — 子域服务目录
- `~/Dev/devtools/lib/templates/site-navbar.html`（派生，勿手改）
- `~/Dev/stations/website/lib/shared-navbar.generated.ts`（派生，勿手改）

**Template 参考**：
- `~/Dev/stations/stack/` — stack template（yaml → HTML 卡片）
- `~/Dev/stations/assets/` — **md-docs template 参考实现**（跨仓 md+frontmatter → HTML）
- `~/Dev/devtools/lib/templates/site-content.css` — 站内统一 CSS

**Renderer**：
- `~/Dev/devtools/lib/tools/menus.py` — validate / render-navbar / build-website-navbar / audit

**历史**：
- `~/Dev/stations/docs/knowledge/session-retro-20260419-assets-launch.md` — 本 playbook 立项的 session retro

---

## § 扩展机制

**场景 A · 加新 template 类型**（比如下次要加 `blog` / `gallery`）：
1. 在 `~/Dev/` 建参考实现（复制最近的同类 template 改造，如 assets）
2. 改 `~/Dev/tools/cc-configs/commands/site-add.md` 加 `--template <新名>` 选项
3. 本文档 § 编排图 + § 文件索引补一行
4. `/ship cc-configs configs`

**场景 B · /ship-site 不能覆盖的新能力**（比如给某类站加 systemd 管理）：
1. 改 `~/Dev/tools/cc-configs/commands/ship-site.md` 加对应 step
2. 如果涉及 CF 新能力（如 worker），扩 `cf_api.py`
3. 对已上线站回填：逐个跑一次 ship-site（幂等）

**场景 C · 加新域名（tianlizeng.cloud 之外）**：
- 这不再属于 "新站"，是 **新 zone** → 大改造，立独立 plan

---

## § 下次会话示例

```
> 我想把 ~/Dev/content/essays/ 的文章发布成 essays.tianlizeng.cloud

# CC 自动：
# 1. /warmup
# 2. 识别 "发布 / 新子域" = trigger word → 走 web-scaffold.md 路径 A
# 3. Plan mode
#    - AskUserQuestion：subdomain / 范围 / navbar 位置 / public 过滤方式
#    - Plan 写完 ExitPlanMode
# 4. /site-add essays --template md-docs --source essays
# 5. 给 essays/docs/*.md 加 frontmatter public: true（或用户手工）
# 6. /ship-site essays
# 7. Edit navbar.yaml + services.ts → render-navbar -w → build-website-navbar -w
# 8. /menus-audit 全绿
# 9. /navbar-refresh
# 10. /cf-audit 确认 0 drift
# 11. /ship cc-configs configs website
# 12. curl 验证
```
