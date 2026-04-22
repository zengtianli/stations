---
title: 站群架构 · 2026-04-22 重构后
date: 2026-04-22
category: architecture
tags: [ssot, architecture, after-refactor, stations]
---

# 站群架构 · 2026-04-22 重构后

> 本轮总共完成 **8 条** 重构（菜单图模型 Phase A–E + Tier 1 的 #1–#5）。
> 本文用图表展示现在的架构，对比之前的状态，让后续维护有一张清晰地图。

---

## 0. 一页总览 · 改了什么 / 省了什么

```
┌───────────────────────────────────────────────────────────────────────┐
│                    本轮重构前 → 后                                      │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  菜单 / 导航    :  手工维护在 services.ts + 6 处消费者                 │
│                 →  entities/ + relations/ 图模型，group_id 稳定引用    │
│                                                                       │
│  services.ts   :  手写 TypeScript 28 子域                              │
│                 →  AUTO-GENERATED from entities/*.yaml                │
│                                                                       │
│  静态站 deploy :  4 份 deploy.sh × 29 行 = 116 行 95% 雷同            │
│                 →  1 份共享 30 行 + 4 份 2 行 wrapper = 38 行（省 78） │
│                                                                       │
│  静态站模板加载 :  4 份 generate.py × ~20 行 _load_*() 雷同            │
│                 →  1 个共享 site_templates.py + 1 行 import × 4       │
│                                                                       │
│  repo-map.json :  手维护，30 条漂移（19 过期 + 8 缺 + 3 dead）         │
│                 →  merge-aware 自动生成 + 保留手工字段                │
│                                                                       │
│  mega-navbar   :  2 份 282 行完全相同的 React 组件                     │
│                 →  devtools SSOT + menus.py sync + audit              │
│                                                                       │
│  nginx vhosts  :  web-stack 私有 render.py 硬编码旧路径                │
│                 →  devtools 共享 + group 过滤 + /nginx-regen          │
│                                                                       │
│  Audit 覆盖    :  5 类漂移                                             │
│                 →  11 类（加图不变量 / consumer-registry / react）    │
│                                                                       │
│  Pre-commit    :  无                                                  │
│                 →  7 个 repo 自动 audit gate                          │
│                                                                       │
│  累计代码 diff :  +1900 行新骨架 / −1300 行重复 = 净 +600 抽象层       │
│  新站上线成本  :  从 ~400 行 → ~50 行                                 │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 1. 整体架构 · 从 yaml SSOT 到浏览器

```
        用户编辑（唯一入口）                        自动派生                           消费点
  ──────────────────────────────       ──────────────────────────           ─────────────────────

┌──────────────────────────────┐
│ ~/Dev/tools/configs/menus/   │   ┌─► services.generated.ts ──────────► Next.js pages (website)
│                              │   │                                     ├─► navbar auto_source
│  entities/                   │   │                                     └─► catalog index
│    subdomains.yaml   ──┬─────┼─┐ │
│    groups.yaml       ──┤     │ │ │  ┌─► site-navbar.html ──► 6 静态站 vendor (stack, cmds,
│    consumers.yaml    ──┘     │ │ │  │                       logs, assets, audiobook, ops-console)
│                              │ │ │  │
│  relations/                  │ │ ├──┤   ┌─► shared-navbar.generated.ts ──► website + ops-console 的
│    subdomain-group.yaml ─────┼─┘ │  │   │                                   React mega-navbar
│                              │   │  │   │
│  navbar.yaml (mega menu) ────┼───┤  │   │  ┌─► mega-navbar.tsx (website)    ┐ React component
│                              │   │  │   │  │                                │ 两处 byte-equal
│  sites/*.yaml (site menus) ──┼───┼──┘   │  └─► mega-navbar.tsx (ops-console)┘
│                              │   │      │
│  catalog.yaml (只读派生)     │   │      │   ┌─► nginx/out/*.conf (15 份 vhost)  ──► rsync to
└──────────────────────────────┘   │      │   │                                      /etc/nginx/
                                   │      │   │                                      sites-enabled/
                                   └──┬───┴───┤
                                      │       │
                                      ▼       ▼
                          ┌───────────────────────────────────┐
                          │ ~/Dev/devtools/lib/tools/menus.py │
                          │   (loader + renderer + auditor)   │
                          │                                   │
                          │   + services_to_nginx.py          │
                          │   + repo_map_gen.py               │
                          │                                   │
                          │   templates:                      │
                          │     site-navbar.html              │
                          │     site-content.css              │
                          │     site-header.html              │
                          │     nginx-dynamic.conf.tmpl       │
                          │   react:                          │
                          │     mega-navbar.tsx               │
                          │   shared scripts:                 │
                          │     deploy-static-site.sh         │
                          │     site_templates.py             │
                          │     vps_config.sh                 │
                          └───────────────────────────────────┘
```

**核心协议**：所有箭头都是**单向**，SSOT 只在左侧 yaml；所有派生产物都打 `AUTO-GENERATED` 标；`/menus-audit` 检查 11 条不变量。

---

## 2. SSOT 分层 · 谁是谁的源头

```
┌─────────────────────────────────────────────────────────┐
│                   最根本（手工编辑）                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  entities/subdomains.yaml      28 个子域实体             │
│  entities/groups.yaml          6 个服务分组              │
│  entities/consumers.yaml       22 个下游消费者声明        │
│  relations/subdomain-group     1:1 归属关系              │
│  navbar.yaml                   mega menu 结构            │
│  sites/*.yaml                  各站点站内菜单             │
│  menus/.pre-commit-hook.sh     audit gate               │
│  devtools/lib/react/mega-navbar.tsx  React 组件 SSOT    │
│  devtools/lib/templates/*.{html,css,tmpl}  布局模板     │
│  devtools/lib/*.sh + *.py     共享工具库                 │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                  第一层派生（脚本生成）                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  stations/website/lib/services.ts             ← menus.py │
│                    shared-navbar.generated.ts ← menus.py │
│                    menu.generated.ts          ← sync-menu│
│  stations/ops-console/lib/menu.generated.ts   ← sync-menu│
│                  components/mega-navbar.tsx   ← menus.py │
│  stations/website/components/mega-navbar.tsx  ← menus.py │
│  stations/{stack,cmds,logs,assets,audiobook,ops-console}│
│    /site-navbar.html      ← menus.py render-navbar      │
│  stations/{stack,cmds,logs,ops-console,assets}          │
│    /site-header.html      ← menus.py render-site-header  │
│    /site-content.css      ← menus.py build-site-content  │
│  tools/configs/menus/catalog.yaml       ← menus.py build │
│  tools/configs/nginx/out/*.conf         ← services_to_nginx│
│  tools/configs/repo-map.json            ← repo_map_gen   │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                  第二层（运行时消费）                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  浏览器：看到 mega menu + 站群导航                        │
│  VPS nginx：static file serving + upstream proxy        │
│  VPS systemd：tlz-api@ + tlz-web@ + 独立 unit           │
│  /ship / /deploy / /pull：从 repo-map.json 查路径        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**检索规则**：

- 要改子域？→ `entities/subdomains.yaml`
- 要改分组名/颜色？→ `entities/groups.yaml`
- 要改 mega menu 结构？→ `navbar.yaml`
- 要改站内导航？→ `sites/<name>.yaml`
- 要改 React navbar UI？→ `devtools/lib/react/mega-navbar.tsx`
- 要改静态站部署流程？→ `devtools/lib/deploy-static-site.sh`
- 要改 nginx 模板？→ `devtools/lib/templates/nginx-dynamic.conf.tmpl`
- 要改 repo-map？→ 跑 `/repo-map-refresh`（自动）+ 按需手改字段

---

## 3. Audit 11 层保险网

```
       改 SSOT → git commit → pre-commit hook → menus.py audit
                                     │
                                     ▼
    ┌─────────────────────────────────────────────────────────────┐
    │                     11 个 audit 类别                         │
    ├─────────────────────────────────────────────────────────────┤
    │                                                             │
    │  ┌─── 图层不变量 (本轮新增) ───┐                            │
    │  │ graph-invariants          │ id 引用完整性                │
    │  │ consumer-registry          │ path 存在 + auto-discovery   │
    │  │ react-mega-navbar-drift   │ 两站组件 ↔ devtools SSOT      │
    │  └─────────────────────────────┘                            │
    │                                                             │
    │  ┌─── 原有 8 类漂移 ───┐                                     │
    │  │ navbar-drift              │ navbar.yaml ≠ site-navbar.html│
    │  │ website-nav-drift         │ website.yaml ≠ profile-config │
    │  │ website-shared-nav-drift  │ navbar.yaml ≠ shared-navbar.ts│
    │  │ ops-console-drift         │ ops-console.yaml ≠ section-nav│
    │  │ cmds-drift                │ cmds.yaml ≠ CATEGORY_MAP      │
    │  │ stack-drift               │ stack.yaml ≠ projects.yaml    │
    │  │ site-header-drift         │ header yaml ≠ site-header.html│
    │  │ site-content-drift        │ css template ≠ 各站 css       │
    │  └──────────────────────────┘                                 │
    │                                                             │
    └─────────────────────────────────────────────────────────────┘
                                     │
            ┌─ 全绿 ──► 提交通过                                   │
            │                                                      │
            └─ 任何红 ──► 拒绝 commit + 打印具体漂移 + 修复命令提示 │
```

Pre-commit hook 装在 7 个 repo：
`stations/{website, cmds, stack, ops-console}` + `devtools` + `tools/{configs, cc-configs}`。

---

## 4. 单向数据流 · 改一处，世界自动对齐

### 场景 A：分组改名 "水利工具" → "水利套件"

```
改 1 处：                              自动同步：
entities/groups.yaml                  ──► services.ts (label 更新)
  - id: hydro-tools                   ──► catalog.yaml (label 更新)
    label: 水利套件    ← 只改这里      ──► site-navbar.html (显示文本)
                                      ──► shared-navbar.generated.ts
                                      ──► mega-navbar.tsx 渲染（自动）

navbar.yaml 不用动（用 group_id: hydro-tools 引用，id 没变）
```

### 场景 B：加新子域 `hydro-sediment` + 上架

```
改 3 处：                                  跑 2 个命令：
entities/subdomains.yaml     (加实体)     python3 menus.py build-services-ts -w
  - id: hydro-sediment                    python3 menus.py render-navbar -w
    subdomain: hydro-sediment             python3 menus.py build-website-navbar -w
    name: 泥沙模型                         python3 menus.py build-catalog -w
    port: 8523                           python3 services_to_nginx.py
                                         
relations/subdomain-group.yaml  (挂组)    自动产出：
  hydro-sediment: hydro-tools            ──► services.ts 多一行
                                         ──► catalog.yaml 多一条
navbar.yaml sections_by    (上 mega)     ──► site-navbar.html 多一项
  水资源/调度: [..., hydro-sediment]     ──► shared-navbar.generated.ts 多项
                                         ──► nginx/out/hydro-sediment.conf 新建

最后：rsync conf 到 VPS + 部署 hydro-sediment 代码
```

### 场景 C：改 mega-navbar 样式

```
改 1 处：                                 跑 1 个命令：
devtools/lib/react/mega-navbar.tsx       python3 menus.py build-react-mega-navbar -w

自动同步：
  ──► stations/website/components/mega-navbar.tsx (byte-equal)
  ──► stations/ops-console/components/mega-navbar.tsx (byte-equal)

audit: react-mega-navbar-drift 应该 green
pnpm build 两站验证无回归
```

### 场景 D：改静态站部署流程（比如加 healthcheck）

```
改 1 处：                                   自动生效：
devtools/lib/deploy-static-site.sh         ──► 4 个静态站下次 deploy 自动带上
                                          
（不用改 4 个站的 deploy.sh — 它们只是 2 行 wrapper 而已）
```

---

## 5. 新增 slash command 清单

本轮重构新增/升级 4 个 command：

| command | 作用 | 执行脚本 |
|---|---|---|
| `/menus-audit` | 11 类漂移检测 | `menus.py audit` |
| `/repo-map-refresh` | 扫本地 ~/Dev 重生成 repo-map.json | `repo_map_gen.py` |
| `/nginx-regen` | services.ts → 15 个动态子域 nginx vhost | `services_to_nginx.py` |
| `menus.py build-react-mega-navbar -w` | 同步 React navbar 到两站 | 自己 |

加上既有的 `/navbar-refresh`、`/site-header-refresh`、`/site-content-refresh`、`/site-refresh-all`、`/cf-audit`、`/sites-health` — 现在站群有**10+ 个自动化 slash command** 围绕 SSOT 运转。

---

## 6. 目录结构 · 目标态（现在）

```
~/Dev/
├── stations/                       ← 14 个生产站群 repo（业务代码）
│   ├── website/
│   │   ├── lib/services.ts              ← AUTO-GEN from yaml
│   │   ├── lib/shared-navbar.generated.ts  ← AUTO-GEN
│   │   ├── lib/menu.generated.ts           ← AUTO-GEN
│   │   └── components/mega-navbar.tsx      ← AUTO-GEN (new!)
│   ├── ops-console/
│   │   ├── lib/menu.generated.ts           ← AUTO-GEN
│   │   ├── lib/shared-navbar.generated.ts  ← AUTO-GEN
│   │   └── components/mega-navbar.tsx      ← AUTO-GEN (new!)
│   ├── web-stack/
│   │   └── infra/
│   │       ├── deploy/                     ← 保留（hydro-* 部署编排）
│   │       ├── systemd/tlz-{api,web}@.service  ← template，已经工程化
│   │       └── nginx/README.md             ← 说明迁到 devtools
│   ├── stack/
│   │   ├── deploy.sh                       ← 2 行（调 devtools/lib/deploy-static-site.sh）
│   │   ├── generate.py                     ← template 加载从 devtools import
│   │   ├── site-navbar.html                ← AUTO-GEN
│   │   ├── site-header.html                ← AUTO-GEN
│   │   └── site-content.css                ← AUTO-GEN
│   ├── cmds / logs / assets / ...  (其他静态站同上)
│   └── ...
│
├── devtools/                       ← 共享基建（跨 repo 提取的抽象层）
│   └── lib/
│       ├── deploy-static-site.sh         ← 新增 (Refactor #1)
│       ├── site_templates.py             ← 新增 (Refactor #2)
│       ├── vps_config.sh                 ← SSOT（VPS IP / user）
│       ├── react/mega-navbar.tsx         ← 新增 (Refactor #4) · React 组件 SSOT
│       ├── templates/
│       │   ├── site-navbar.html          ← SSOT（render 产物）
│       │   ├── site-header.html
│       │   ├── site-content.css
│       │   └── nginx-dynamic.conf.tmpl   ← 新增 (Refactor #5)
│       └── tools/
│           ├── menus.py                  ← 图 loader + renderer + auditor
│           ├── services_to_nginx.py      ← 新增 (Refactor #5)
│           ├── repo_map_gen.py           ← 新增 (Refactor #3)
│           ├── cf_api.py / cf_audit.py   ← CF 相关
│           └── vps_cmd.py / sites_health.py
│
└── tools/
    ├── configs/                    ← 纯配置 SSOT（yaml / json）
    │   ├── menus/                        ← 菜单 / 导航 图模型
    │   │   ├── entities/{subdomains,groups,consumers}.yaml
    │   │   ├── relations/subdomain-group.yaml
    │   │   ├── navbar.yaml
    │   │   ├── sites/*.yaml
    │   │   ├── catalog.yaml              ← AUTO-GEN
    │   │   ├── schema/*.json
    │   │   └── .pre-commit-hook.sh       ← 7 repo 共享 gate
    │   ├── nginx/out/*.conf              ← 新增（15 份 AUTO-GEN vhost）
    │   └── repo-map.json                 ← merge-maintained
    │
    └── cc-configs/                 ← slash commands / skills
        ├── commands/
        │   ├── repo-map-refresh.md       ← 新增
        │   ├── nginx-regen.md            ← 新增
        │   ├── menus-audit.md
        │   ├── navbar-refresh.md
        │   └── ...
        └── skills/
```

---

## 7. 新站上线成本 · 从 ~400 行 → ~50 行

对比：加一个新的静态子域 `example.tianlizeng.cloud`

### 以前（手工 400+ 行）

```
~/Dev/stations/example/deploy.sh       29 行手写
~/Dev/stations/example/generate.py     ~300 行（含 _load_navbar/_load_site_header/
                                        _load_site_content_css + 业务逻辑）
~/Dev/stations/example/site-navbar.html  静态副本
~/Dev/stations/example/site-header.html  手写
~/Dev/stations/example/site-content.css  手写

修改 website/lib/services.ts  加一段
修改 ~/Dev/tools/configs/menus/navbar.yaml  加引用
修改 repo-map.json  加条目
修改 VPS nginx   手写 vhost
```

### 现在（50 行骨架）

```bash
# 1. 加实体（3 行 yaml）
cat >> ~/Dev/tools/configs/menus/entities/subdomains.yaml <<'EOF'
  - id: example
    subdomain: example
    name: 示例站
    description: ...
    port: 8522
EOF

echo "  example: dev-ai" >> ~/Dev/tools/configs/menus/relations/subdomain-group.yaml

# 2. 建站骨架（generate.py 20 行业务 + deploy.sh 2 行 wrapper）
mkdir -p ~/Dev/stations/example
cat > ~/Dev/stations/example/deploy.sh <<'EOF'
#!/bin/bash
bash ~/Dev/devtools/lib/deploy-static-site.sh /var/www/example example.tianlizeng.cloud
EOF

# 3. 自动 propagate
python3 ~/Dev/devtools/lib/tools/menus.py build-services-ts -w
python3 ~/Dev/devtools/lib/tools/menus.py render-navbar -w
python3 ~/Dev/devtools/lib/tools/menus.py build-website-navbar -w
/repo-map-refresh
/nginx-regen  # 如果是 Next.js 站
/menus-audit

# 4. 部署
bash ~/Dev/stations/example/deploy.sh
```

---

## 8. 接下来还能做什么（Tier 2/3）

| # | 重构 | 收益 | 依赖 |
|---|---|---|---|
| #6 | 静态站搜索 JS 抽共享库 | 省 60 行 JS × 3 站 | 无 |
| #7 | `@tlz/shared-lib` monorepo 包（两 Next 共享 utils / types） | 彻底消除重复 | pnpm workspace |
| #8 | FastAPI 反向 `/api/metadata` | 后端自述 + 对账 | 批改 10 个 api.py |
| #9 | ops-console 吃 services.ts（服务健康页） | 运维中心化 | 依赖 #7 |
| #10 | `/services-health` 全景扫描 | 单命令看全站状态 | 依赖 #3 #8 |

Tier 1 完成后，可以观察 1–2 周新骨架是否有 corner case 暴露，再动 Tier 2。

---

## 9. 查问题的入场三件套

任何跟站群相关的问题，按这三步走：

1. **`/warmup`** — 看当前环境 + skills + git 状态
2. **`/menus-audit`** — 11 项全绿确认 SSOT 一致
3. **`~/Dev/tools/configs/menus/ARCHITECTURE.md`** — 菜单图模型详细拆解

对于重构历史（为什么变成现在这样），看：
- `station-refactor-roadmap-20260422.md` — 当时 3 Agent 调查报告
- 本文档 — 重构完成后的状态
