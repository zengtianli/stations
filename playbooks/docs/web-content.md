# Playbook · web-content · 站内业务文案 / 内容 / 参数改动

> 2026-04-20 立。解决"改 blog 文案 / dashboard 卡片 / audiobook 参数"这类业务内容改动没入口的盲区。

---

## § 定位

**是**：**改已上线站的业务内容 / 文案 / 默认参数**，不动导航、不动样式基建、不动计算逻辑。改完走轻量 build + deploy。

**典型场景**：
- 改 website 的一篇 blog 文章或新增一篇
- 改 ops-console dashboard 某张卡片的标题 / 描述 / 链接
- 改 audiobook 默认朗读参数（speed / voice / pitch）
- 改 docs / knowledge 站的一条条目
- 改 cmds 站某条 slash command 的说明文案

**不是**：
- 改 navbar / mega / 子域 / SSOT yaml → `stations.md`
- 改 hydro 计算逻辑 / api.py / 前端组件 → `hydro.md`
- 改前端视觉参数（颜色/间距/字号） → `stations.md` 的 `/frontend-tweak` 分支
- 新建站 → `web-scaffold.md`
- 批量迁移 → `mass-migration.md`

---

## § 入场判断

**trigger words**（用户原话含这些 → 走本 playbook）：
- "改 blog / 改文章 / 加一篇 / 博客内容"
- "改 dashboard 卡片 / ops-console 哪个 section 的文案"
- "改 audiobook 默认参数 / 朗读参数 / voice"
- "改 docs / 知识库 / 条目 / 说明"
- "改 cmds 某条说明 / 加条命令解释"
- "改 <站名> 首页文案 / 标题 / 描述"

**反例**：
- "改 navbar 颜色 / 加 section" → `stations.md`
- "hydro-annual 的计算不对 / compute 报错" → `hydro.md`
- "加新子域 / 新站" → `web-scaffold.md`
- "重命名 / 下线站" → `/site-rename` `/site-archive`

---

## § 编排图

**轻量分支 · 单站内容改动**（90% 场景）

```
用户: "改 <站> 的 <文案/内容>"
  ↓
/warmup
  ↓
【定位入口文件】参考本文 § 改动边界矩阵 找对应站的文案源文件
  ↓
Edit <文件>                                  # 文案 / MD / JSON / config
  ↓
【本地验证】分两种：
  ├─ Next.js 站（website / ops-console / audiobook web / hydro-*-web）
  │    pnpm --filter <app> build            # 或 dev 预览
  └─ Python 静态站（stack / cmds / assets / docs）
       cd ~/Dev/<name> && python3 generate.py
       open out/index.html                   # 本地瞄一眼
  ↓
【commit】 /ship <repo>                      # 或 git commit + push
           （website blog 若走 content/project-source symlink，要 commit 外部 repo）
  ↓
【部署】 bash ~/Dev/<name>/deploy.sh         # Python 静态站
        或 /ship-site <name>                 # 薄封装 deploy + 验证
        或 /deploy-changed                   # 多站改动批量（少见）
  ↓
【验收】 curl https://<name>.tianlizeng.cloud/<具体页>   # 200 + 含新文案
         浏览器打开人眼看一遍
```

**批量分支 · 跨站内容刷新**（如升级所有站某条默认参数）

```
改 N 个站的文案
  ↓
逐站 Edit
  ↓
各自 commit（/ship <repo1> <repo2> ...）
  ↓
/deploy-changed          # 批量识别扇出
  ↓
/sites-health            # 总体验收
```

---

## § 复用清单

| skill / command | 用法 |
|---|---|
| `/warmup` | 入场看环境 |
| `/deploy <name>` | 通用部署（任何有 deploy.sh 的站） |
| `/deploy-changed` | 多站改动一次批量部署（读 git diff 扇出） |
| `/ship-site <name>` | 站点部署 + CF + 验证薄封装 |
| `/ship <repo> ...` | commit + push 多 repo |
| `/simplify` | 改完文案顺手跑一下，看是否有重复/冗余段落 |
| `/sites-health` | 跨站 HTTP / Access / Navbar 巡检 |

---

## § 改动边界矩阵（按站列文案入口）

| 站 | 文案入口文件 | 部署 |
|---|---|---|
| **website** (`tianlizeng.cloud`) | `~/Dev/stations/website/content/blog/*.md`（可能 symlink 到外部 repo）<br>`~/Dev/stations/website/content/project-source/` → 外部 repo<br>`~/Dev/stations/website/app/**/page.tsx`（页面硬编码文案） | `pnpm build` → `bash deploy.sh` |
| **ops-console** (`dashboard.tianlizeng.cloud`) | `~/Dev/stations/ops-console/app/<section>/page.tsx`<br>`~/Dev/stations/ops-console/data/*.json`（卡片数据） | `pnpm build` → `bash deploy.sh` |
| **audiobook** (`audiobook.tianlizeng.cloud`) | 后端默认参数：`~/Dev/stations/audiobook/api/config.py` 或等价<br>前端 UI 文案：`~/Dev/stations/web-stack/apps/audiobook-web/app/page.tsx` | `/deploy audiobook` 或 `bash deploy.sh audiobook` |
| **stack** (`stack.tianlizeng.cloud`) | `~/Dev/stations/stack/projects.yaml` + `~/Dev/tools/configs/menus/sites/stack.yaml` | `python3 generate.py && bash deploy.sh` |
| **cmds** (`cmds.tianlizeng.cloud`) | `~/Dev/tools/configs/menus/sites/cmds.yaml` + `~/Dev/stations/cmds/generate.py` 扫 cc-configs | `python3 generate.py && bash deploy.sh` |
| **assets** (`assets.tianlizeng.cloud`) | 外部 repo `docs/*.md`（frontmatter `public: true`） | `bash deploy.sh` |
| **docs / knowledge** (`docs.tianlizeng.cloud` 若有) | `content/*.md` 或 `~/Dev/stations/docs/knowledge/*.md` | `bash deploy.sh` |
| **hydro-*** | **不在本 playbook** — 去 `hydro.md`（文案改动也算 compute UI 一部分） |

---

## § 踩坑 anti-patterns

**1. website 的 content symlink 会影响外部 repo**
- `~/Dev/stations/website/content/project-source/` 是 symlink 到 `~/cursor-shared/` 或外部 repo。改动其中的 `.md` 实际上改的是 **外部 repo**。
- 根因：website 的 blog 内容源分散在多个 repo，symlink 保持内容 SSOT。
- 下次：改前先 `ls -la ~/Dev/stations/website/content/` 确认 symlink 指向；若改目标是外部 repo，要去那个 repo 单独 commit + push。

**2. Next.js 15 `cookies()` ByteString 坑 — 文案含非 ASCII 要小心**
- 现象：改 Next.js 页面文案带中文/emoji 放进 `cookies().set(...)` 或某些 header 链路会 ByteString 崩溃。
- 下次：文案就放 JSX / props / 静态 content，不要塞进 server-side cookies / headers。遇到用户设置持久化，走客户端 localStorage。
- 关联 memory：`feedback_nextjs_cookies_bytestring.md`

**3. 改 JSON 数据文件（ops-console/data/*.json）忘重 build**
- Next.js 静态站 JSON 在 build 时烘进 bundle，改完必 `pnpm build` 再部署。
- 下次：改 data/*.json 后不跑 build 就 deploy = 旧 bundle，用户看到的还是老文案。

**4. 改了不登记 SSOT**
- 新增一篇 blog / 加一个卡片入口可能需要同步 `configs/menus/sites/<name>.yaml`。改完跑 `/menus-audit` 看有没有 drift。
- 下次：改完跑 `/menus-audit`，出现 8/8 才算完。

**5. audiobook 前后端参数不一致**
- 改默认 voice 只改了前端 UI，后端 api/config.py 没改 → 用户点默认按钮时后端仍按旧参数跑。
- 下次：audiobook 改参数**前后端一起改**，或把参数收敛到后端 `/api/meta` 由前端拉取。

---

## § 文件索引

**Next.js 站**：
- `~/Dev/stations/website/` — 主站（app router）
- `~/Dev/stations/ops-console/` — dashboard
- `~/Dev/stations/web-stack/apps/audiobook-web/` — audiobook 前端

**Python 静态站**（generate.py 渲染模式）：
- `~/Dev/stations/stack/` — 项目卡片站
- `~/Dev/stations/cmds/` — cc-configs slash command 索引站
- `~/Dev/stations/assets/` — md-docs 发布站

**后端 / 参数**：
- `~/Dev/stations/audiobook/api/` — FastAPI
- `~/Dev/stations/audiobook/` — 主 repo

**部署工具**：
- `~/Dev/devtools/scripts/deploy-changed.sh` — 批量扇出
- `~/Dev/stations/web-stack/infra/deploy/deploy.sh` — web-stack 单站
- 各站根目录 `deploy.sh` — 站内部署

**SSOT（文案有时需要同步）**：
- `~/Dev/tools/configs/menus/sites/*.yaml` — 各站菜单 / 项目分组

---

## § 扩展机制

**新加一个站到本 playbook**：
1. 在本文件 § 改动边界矩阵 加一行：站名、文案入口文件（绝对路径）、部署命令
2. 若该站的文案源有特殊规则（如 frontmatter 过滤 / symlink / 数据库），在 § 踩坑加对应条目
3. `/ship configs` 收口

**新类型的文案改动**（比如新增 i18n）：
1. 走 Step 4 立子 playbook 或扩展本文
2. AskUserQuestion 确认：要不要引入翻译工具链？是否影响多个站？
3. 扩 § 复用清单 加新 skill

**配合 cclog memory**：
- 每次踩新坑 → `memory` 记一条 → 回填本文 § 踩坑
