---
title: 站群重构路线图 · 2026-04-22
date: 2026-04-22
category: architecture
tags: [refactor, roadmap, ssot, stations]
---

# 站群重构路线图（2026-04-22）

> 基于对 ~/Dev/stations 下 17 个 repo 的全面调查，列出**10 条**重构机会，按 ROI 排序。
>
> 调查范围：4 静态站（stack/cmds/logs/assets）+ 2 Next.js 站（website/ops-console）+ 1 FastAPI 多站容器（web-stack 含 10 个 hydro-*）+ 独立站（audiobook / oauth-proxy / cc-options / playbooks / cclog / dockit / docs）+ 基础设施（devtools / tools/configs / tools/cc-configs）。

---

## 0. TL;DR · 一页总览

```
════════════════════════════════════════════════════════════
Tier 1 · 高 ROI / 低风险 / 现在就做（累计 ~8 小时）
════════════════════════════════════════════════════════════
  #1  静态站 deploy.sh 归一      省 78 行   0.5h  低风险
  #2  静态站模板加载归一          省 40 行   0.5h  低风险
  #3  repo-map.json 自动生成     消 22 漂移  1h   低风险
  #4  mega-navbar 抽共享组件      省 282 行   2h   中风险
  #5  services.ts → nginx/systemd 自动派生（audiobook 类）  消漂移源  3h  中风险

════════════════════════════════════════════════════════════
Tier 2 · 中期应做（累计 ~15 小时）
════════════════════════════════════════════════════════════
  #6  静态站搜索 JS / utils 抽共享库                  省 240 行   3h
  #7  @tlz/shared-lib monorepo 包（两个 Next.js 共享）  4h
  #8  FastAPI 反向 metadata API + 自动同步校验          4h
  #9  ops-console 获得 services.ts 消费能力             3h

════════════════════════════════════════════════════════════
Tier 3 · 可选（想搞再搞）
════════════════════════════════════════════════════════════
  #10 /services-health 全景健康扫描（cf-audit + sites-health + vps）
════════════════════════════════════════════════════════════
```

---

## 1. 现状诊断 · 3 张图看懂站群分裂

### 1.1 站群分两个时代（关键洞察）

```
                        ┌──────────────────────────────┐
                        │    services.ts (SSOT)         │
                        │    ~/Dev/stations/website/    │
                        │    lib/services.ts            │
                        └──────────┬───────────────────┘
                                   │
          ┌────────────────────────┴─────────────────────────┐
          ▼                                                   ▼
┌──────────────────────────────┐      ┌────────────────────────────────┐
│   🆕 现代化体系               │      │   📦 老式体系                   │
│   (web-stack/infra/)          │      │   (独立 deploy.sh + unit)      │
│                               │      │                                 │
│ ✓ render.py                   │      │ ✗ 每站手写 .service             │
│   → nginx vhosts              │      │ ✗ 每站手写 deploy.sh            │
│ ✓ tlz-api@.service template   │      │ ✗ port 硬编码在多处             │
│ ✓ tlz-web@.service template   │      │                                 │
│ ✓ ports.sh 集中派生           │      │ 成员：                          │
│ ✓ /etc/tlz/ports/*.env        │      │   audiobook (独立 FastAPI)      │
│                               │      │   oauth-proxy                   │
│ 成员：                        │      │   stack / cmds / logs / assets  │
│   hydro-toolkit               │      │     (静态站，deploy.sh 95% 同)  │
│   hydro-* × 9                 │      │   website / ops-console         │
│   (10 个服务)                 │      │     (Next.js，自己 deploy)      │
└──────────────────────────────┘      └────────────────────────────────┘
```

**结论**：**10 个 hydro 已进现代化体系，其余 7-8 个站还在老式体系**。重构核心方向是**把现代化体系的抽象反哺回 devtools/lib**，让老式体系逐步迁入。

### 1.2 重复代码热力图

```
                          ┌─────────┐
                          │ 重复度   │
                          └─────────┘

 deploy.sh (4 静态站)          ███████████████████████  95% (116→38 行)
 mega-navbar.tsx (2 Next.js)   ████████████████████████ 100%(564→282 行)
 模板加载函数 (4 静态站)        █████████████████████     85% (80→40 行)
 搜索过滤 JS (3 静态站)         █████████████████        70% (150→90 行)
 frontmatter parse (3 站)      █████████████            60% (30→10 行)
 YAML load 异常处理 (3 站)      ████████████             55% (45→15 行)
 HTML esc() (4 站)             ████████                 100%但 3 行太短
 host 判断硬编码 (2 站)         ██████████████           100%(14→0 行)

 共 ~ 1 000 行重复代码，可省 ~ 500 行
```

### 1.3 SSOT 状态矩阵

```
┌─────────────────────┬──────────┬─────────┬──────────┬───────────┐
│ SSOT               │  存在？  │ 消费者  │  自动派生│  漂移风险 │
├─────────────────────┼──────────┼─────────┼──────────┼───────────┤
│ services.ts         │  ✓       │  19 处  │  部分    │  低（hook）│
│ vps_config.sh       │  ✓       │  12 处  │  -       │  无       │
│ menus/entities/     │  ✓ 新建  │  9 处   │  是      │  无       │
│ navbar.yaml         │  ✓       │  6 处   │  是      │  无       │
│ sites/*.yaml        │  ✓       │  4 处   │  是      │  无       │
│ repo-map.json       │  ✓       │  /ship  │  ❌ 手维│  高(22 条)│
│ nginx vhosts        │  ✓ web-stack│  VPS │  ✓ web-stack │ 中（老站）│
│                     │  ❌ 老站  │        │  ❌ 老站│           │
│ systemd units       │  ✓ web-stack│  VPS │  ✓ template │ 中（老站）│
│                     │  ❌ 老站  │        │  ❌ 老站│           │
│ next.config API port│  ❌ hardcode│ 11 份│  ❌     │  高       │
│ CORS origins        │  ❌ hardcode│ 每 api.py│ ❌ │  高       │
└─────────────────────┴──────────┴─────────┴──────────┴───────────┘

4 个黑洞：repo-map / 老站 nginx / 老站 systemd / Next API port + CORS
```

---

## 2. Tier 1 · 高 ROI 立即做（预计 8 小时）

### 🎯 Refactor #1 · 静态站 deploy.sh 归一

**现状**：4 个静态站（stack / cmds / logs / assets）各有 `deploy.sh`，95% 内容相同。

| 文件 | 行数 | 差异点 |
|---|---|---|
| `stack/deploy.sh` | 29 | `REMOTE_DIR=/var/www/stack` |
| `cmds/deploy.sh` | 29 | `REMOTE_DIR=/var/www/cmds` |
| `logs/deploy.sh` | 29 | `REMOTE_DIR=/var/www/logs` + 1 行错误文案 |
| `assets/deploy.sh` | 29 | `REMOTE_DIR=/var/www/assets` + 1 行 CF 302 提示 |

**改造方案**：

新建 `~/Dev/devtools/lib/deploy-static-site.sh`（共享脚本）：

```bash
#!/usr/bin/env bash
# deploy-static-site.sh — 静态站统一部署骨架
# 用法：bash ~/Dev/devtools/lib/deploy-static-site.sh <REMOTE_DIR> <DOMAIN>
set -e
source ~/Dev/devtools/lib/vps_config.sh

REMOTE_DIR="${1:?need REMOTE_DIR}"
DOMAIN="${2:?need DOMAIN}"
SITE_DIR="$(cd "$(dirname "$0")" && pwd)"

cd "$SITE_DIR"
echo "→ Generating site..."
/opt/homebrew/bin/python3 generate.py

echo "→ Syncing to $VPS:$REMOTE_DIR..."
ssh "$VPS" "mkdir -p $REMOTE_DIR"
rsync -avz --delete site/ "$VPS:$REMOTE_DIR/"

echo "→ Reloading nginx..."
ssh "$VPS" "nginx -t && systemctl reload nginx" > /dev/null

echo "→ Verifying $DOMAIN..."
sleep 1
HTTP_CODE=$(curl --noproxy '*' -s -o /dev/null -w "%{http_code}" "https://$DOMAIN" || echo "000")
case "$HTTP_CODE" in
  200) echo "✓ Deployed https://$DOMAIN (HTTP 200)" ;;
  302) echo "✓ Deployed https://$DOMAIN (CF Access 302)" ;;
  000) echo "✗ DNS/network error" ; exit 2 ;;
  *)   echo "⚠ HTTP $HTTP_CODE — check nginx logs" ; exit 3 ;;
esac
```

每个站的 `deploy.sh` 变成：

```bash
#!/bin/bash
# stack/deploy.sh
bash ~/Dev/devtools/lib/deploy-static-site.sh /var/www/stack stack.tianlizeng.cloud
```

**收益**：116 行 → 38 行（省 78 行）；4 站 bug 修一次就修完；新静态站只要 2 行 deploy.sh。

**风险**：低。老 deploy.sh 保留 fallback（同一 commit 带 git 历史）。

**执行步骤**：
1. 写共享脚本
2. 依次在 stack / cmds / logs / assets 替换 deploy.sh，每替换一个跑一次 `bash deploy.sh` 做 smoke test
3. `/ship devtools stack cmds logs assets`

---

### 🎯 Refactor #2 · 静态站模板加载归一

**现状**：4 站都有 `_load_navbar()` / `_load_site_header()` / `_load_site_content_css()` 之类的重复函数，共 ~80 行。

**证据**：
- `stack/generate.py:34-55`（22 行）
- `cmds/generate.py:20-41`（22 行，**100% 相同**）
- `logs/generate.py:33-35`（3 行内联版）
- `assets/generate.py:42-49`（8 行简化版）

**改造方案**：

新建 `~/Dev/devtools/lib/site_templates.py`：

```python
"""共享静态站模板加载器。"""
from __future__ import annotations
from pathlib import Path

DEVTOOLS_TEMPLATES = Path.home() / "Dev" / "devtools" / "lib" / "templates"


def load_template(name: str, script_dir: Path) -> str:
    """本地副本优先（支持站内覆盖），否则从 devtools 共享读。"""
    for p in (script_dir / name, DEVTOOLS_TEMPLATES / name):
        if p.exists():
            return p.read_text(encoding="utf-8")
    return ""


def load_site_templates(script_dir: Path) -> dict[str, str]:
    """一次加载 navbar / site-header / site-content.css 三件套。"""
    return {
        "navbar": load_template("site-navbar.html", script_dir),
        "header": load_template("site-header.html", script_dir),
        "css":    load_template("site-content.css", script_dir),
    }
```

各站 `generate.py` 顶部变成：

```python
import sys; sys.path.insert(0, str(Path.home() / "Dev" / "devtools" / "lib"))
from site_templates import load_site_templates
_TPL = load_site_templates(Path(__file__).parent)
NAVBAR_HTML      = _TPL["navbar"]
SITE_HEADER_HTML = _TPL["header"]
SITE_CONTENT_CSS = _TPL["css"]
```

**收益**：80 行 → 30 行（省 50 行）；各站本地副本没了之后 `/site-header-refresh` 和 `/site-content-refresh` 可以简化（甚至删除 — 改模板即时生效）。

**风险**：低。fallback 到本地副本的逻辑保留，兼容现状。

---

### 🎯 Refactor #3 · repo-map.json 自动生成

**现状**：`~/Dev/tools/configs/repo-map.json` 手工维护，漂移严重：

```
本地实际 stations/（14 个）    repo-map.json 登记
─────────────────────────      ──────────────────
assets            ✓            ✗ 缺
audiobook         ✓            ✓
cc-options        ✓            ✗ 缺
cclog             ✓            ✗ 缺
cmds              ✓            ✗ 缺
dockit            ✓            ✓
docs              ✓            ✓
logs              ✓            ✗ 缺
oauth-proxy       ✓            ✓
ops-console       ✓            ✓
playbooks         ✓            ✗ 缺
stack             ✓            ✗ 缺
web-stack         ✓            ✗ 缺
website           ✓ (→ web)    ✓ web

另外：repo-map 有 19 个 hydro-* 指向 ~/Dev/hydro-*（已迁 web-stack，本地不存在）
      + 3 个 (essays, learn, downloads-organizer) 不存在
```

**漂移总量**：**8 缺 + 22 陈旧 = 30 条错项**。

**改造方案**：

新建 `~/Dev/devtools/lib/tools/repo_map_gen.py`：

```python
"""扫本地 ~/Dev 生成 repo-map.json。"""
import json, subprocess
from pathlib import Path

DEV_ROOT = Path.home() / "Dev"
OUT = DEV_ROOT / "tools" / "configs" / "repo-map.json"

def git_remote(d: Path) -> str | None:
    try:
        r = subprocess.run(
            ["git", "-C", str(d), "config", "--get", "remote.origin.url"],
            capture_output=True, text=True, check=True,
        )
        return r.stdout.strip() or None
    except Exception:
        return None

def scan() -> dict:
    out = {"stations": {}, "tools": {}, "content": {}, "labs": {}}
    for category in ("stations", "tools", "content", "labs"):
        base = DEV_ROOT / category
        if not base.exists():
            continue
        for d in sorted(base.iterdir()):
            if not (d / ".git").exists():
                continue
            name = d.name
            remote = git_remote(d)
            out[category][name] = {
                "path": f"~/Dev/{category}/{name}",
                "remote": remote,
            }
    return out

if __name__ == "__main__":
    data = scan()
    OUT.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {OUT} with {sum(len(v) for v in data.values())} entries")
```

加 slash command `/repo-map-refresh` 调用此脚本 + diff + 确认后替换。

**收益**：消除 30 条漂移；新 repo 自动登记；`/ship all` 之类命令从此可信。

**风险**：低（替换前让用户看 diff）。

---

### 🎯 Refactor #4 · mega-navbar.tsx 抽共享组件

**现状**：`website/components/mega-navbar.tsx`（282 行）和 `ops-console/components/mega-navbar.tsx`（282 行）**100% 完全相同**，含硬编码：

```typescript
// 两个文件的 line 25-26
if (host === "hydro.tianlizeng.cloud" || host.indexOf("hydro-") === 0) return "hydro"
if (host === "tianlizeng.cloud") return "home"
```

**问题**：改 navbar 要改两处；host 判断规则与 `navbar.yaml` 的 `current_host_map` 重复。

**改造方案**：

**选项 A（推荐，最小侵入）**：把 mega-navbar.tsx 搬到 `devtools/lib/templates/react/`，两站做 symlink 或在 `next.config.mjs` 加 webpack alias。

**选项 B（长期正道）**：`@tlz/shared-lib` monorepo 包（见 Tier 2 #7）。

**选项 A 具体操作**：

```
1. 把 website/components/mega-navbar.tsx 搬到
   ~/Dev/devtools/lib/react/mega-navbar.tsx
2. 两个 tsconfig.json 加 path alias:
   "paths": {
     "@tlz/react/*": ["../../devtools/lib/react/*"]
   }
3. 两站 import 改为: import MegaNavbar from "@tlz/react/mega-navbar"
4. 删 ops-console/components/mega-navbar.tsx（删 282 行）
```

**进一步**：把 resolveCurrentKey 的硬编码改成从 `SHARED_CURRENT_HOST_MAP`（已在 navbar.yaml 生成的数据里）读 — 消除第二层硬编码。

**收益**：省 282 行；navbar 逻辑单源；host 判断与 navbar.yaml SSOT 对齐。

**风险**：中。Next.js 的 path alias 跨 repo 引用需验证；build 时需确保 devtools 目录可访问。

---

### 🎯 Refactor #5 · services.ts → nginx / systemd 自动派生（给老站）

**现状对比**：

```
          现代化站（hydro-*）            老式站（audiobook, oauth-proxy）
──────────────────────────────────────────────────────────────────
nginx    ✓ web-stack/infra/nginx/       ✗ VPS 上 /etc/nginx/sites-*/
          render.py 从 services.ts 生     手工维护，services.ts 改了
                                          不同步

systemd  ✓ tlz-api@.service template    ✗ audiobook.service 写死
          + /etc/tlz/ports/*.env         /var/www/audiobook 和 port

port     ✓ ports.sh 从 services.ts 派生 ✗ 手填 next.config.mjs、CORS
```

**改造方案**：

把 `web-stack/infra/nginx/render.py` 的能力**提升到 devtools**，让所有站（包括 audiobook）共用：

```
~/Dev/devtools/lib/tools/
├── services_to_nginx.py       # 从 services.ts → /tmp/nginx-vhosts/
├── services_to_systemd.py     # 从 services.ts + 模板 → /tmp/systemd-units/
└── services_to_vps_diff.py    # ssh 拉 VPS 现状 vs expected，输出 diff
```

对应 `/services-vps-sync` slash command：
- 跑 3 个 gen 脚本
- diff VPS 现状
- 用户确认后 `rsync + systemctl reload`

**收益**：消除最后一个重大漂移源；新站加到 services.ts 自动有 nginx + systemd unit。

**风险**：中。改 nginx/systemd 触达 VPS，必须有 dry-run + 强制 diff 审阅。

**执行顺序**：先做 audiobook 一个站（测通跑通），再推广。

---

## 3. Tier 2 · 中期应做（预计 15 小时）

### 🔨 Refactor #6 · 静态站搜索 JS + utils 抽共享库

**现状**：
- 搜索/过滤 JS 在 stack / cmds / logs 各 ~50 行，逻辑相同（只是 data-attr 名字不同）
- frontmatter parse 在 cmds / logs / assets 各 ~10 行
- YAML load + ImportError 处理在 3 站各 ~15 行

**改造**：

```
~/Dev/devtools/lib/
├── site_templates.py         # Refactor #2 已建
├── yaml_utils.py             # load_yaml_safe() / parse_frontmatter()
├── html_utils.py             # esc() / render_meta_tags()
└── templates/
    └── site-filter.js        # 通用搜索/过滤初始化器
```

`site-filter.js`：

```javascript
window.initSiteFilters = function({cardSelector='.tlz-card', searchInputId='#search', filterGroups=[]}={}){
  const cards = Array.from(document.querySelectorAll(cardSelector));
  const search = document.getElementById(searchInputId);
  const filters = Object.fromEntries(filterGroups.map(g => [g.name, 'all']));
  function apply(){
    const q = (search?.value||'').trim().toLowerCase();
    for (const c of cards) {
      let ok = true;
      for (const [k,v] of Object.entries(filters))
        if (v !== 'all' && c.dataset[k] !== v) { ok = false; break; }
      if (ok && q) ok = (c.dataset.search||'').toLowerCase().includes(q);
      c.classList.toggle('hidden', !ok);
    }
  }
  // 绑定事件、按钮切换...
};
```

**收益**：搜索代码 150→90 行；3 处 utils 90→30 行；新静态站直接继承搜索能力。

---

### 🔨 Refactor #7 · @tlz/shared-lib monorepo 包

**现状**：两个 Next.js 站（website / ops-console）各自维护 `lib/utils.ts`、`components/mega-navbar.tsx`、`lib/shared-navbar.generated.ts`。

**改造**：

```
~/Dev/devtools/packages/shared-lib/
├── package.json
├── src/
│   ├── utils.ts                 (cn)
│   ├── services.ts              (SERVICE_GROUPS 从 website 搬来)
│   ├── design-system/           (从 website 搬来)
│   ├── navbar/
│   │   ├── mega-navbar.tsx      (Refactor #4 成果)
│   │   ├── resolve-current-key.ts
│   │   └── shared-navbar.generated.ts
│   └── track/                   (仅 website 需要)
└── dist/  (tsup 构建产物)
```

两站 package.json：

```json
"dependencies": {
  "@tlz/shared-lib": "file:../../devtools/packages/shared-lib"
}
```

**收益**：彻底消除 Next 站之间的代码重复；Type 跨站安全。

**风险**：pnpm workspace 配置；build 要跑 shared-lib 的 tsup；monorepo 的学习曲线。

---

### 🔨 Refactor #8 · FastAPI 反向 metadata API

**现状**：每个 hydro-* 的 `api.py` 知道自己的 port 和 subdomain 却不暴露；外部想知道"这个服务到底在哪个 port 上"只能看 services.ts。

**改造**：每个 api.py 加：

```python
@app.get("/api/metadata")
def metadata() -> dict:
    return {
        "service":     "hydro-capacity",       # 从环境变量或启动参数读
        "subdomain":   "hydro-capacity",
        "port":        int(os.environ["PORT"]),
        "group":       "水利工具",
        "version":     "1.0.0",
        "started_at":  START_TS.isoformat(),
    }
```

加对账脚本 `~/Dev/devtools/lib/tools/services_vs_live.py`：

```python
# 对每个 services.ts 里的 entry，请求 /api/metadata，对比字段
# 漂移输出报告 → /menus-audit 加这一项
```

**收益**：后端自述；新增 hydro-* 时可以写个 bootstrap 脚本让服务自注册到 services.ts（可选）。

---

### 🔨 Refactor #9 · ops-console 获得 services.ts 消费能力

**现状**：ops-console（dashboard 站）grep `services.ts` / `SERVICE_GROUPS` / `DOMAIN` 都是 0 结果，只能看 systemd + docker。应该能看"全站 28 个服务的 health 一览"。

**改造**：

```typescript
// ops-console/lib/services.ts（改成 re-export）
export { SERVICE_GROUPS, DOMAIN } from "@tlz/shared-lib/services"

// ops-console/app/services-health/page.tsx
export default async function ServicesHealth() {
  const services = SERVICE_GROUPS.flatMap(g => g.services)
  const systemdByName = await listSystemdServices()
  
  return services.map(s => (
    <ServiceHealthCard
      service={s}
      systemd={systemdByName[`tlz-api@${s.subdomain}`]}
      metadata={s.port ? await fetch(`https://${s.subdomain}.tianlizeng.cloud/api/metadata`) : null}
    />
  ))
}
```

**依赖**：Refactor #7 (shared-lib) + #8 (metadata API)。

**收益**：ops-console 真正成为运维中心。

---

## 4. Tier 3 · 可选（想搞再搞）

### 💡 Refactor #10 · /services-health 全景扫描

合并 `/cf-audit`、`/sites-health`、`/menus-audit` 成一个大体检命令：

```
/services-health [--deep]

 1. services.ts ✦ 本地 repo 对账         (repo-map check)
 2. services.ts ✦ CF DNS / Origin / Access
 3. services.ts ✦ VPS nginx / systemd / ports 占用  (--deep 才 ssh)
 4. services.ts ✦ 各站 /api/metadata 实际值        (Refactor #8 之后)
 5. navbar.yaml ✦ 10 层 menus audit
 6. consumers.yaml ✦ path 存在性 + auto-discovery 对账
 
 → 汇总成一张表，漂移配上修复命令建议
```

---

## 5. 执行顺序图

```
时间轴：
────────────────────────────────────────────────────────────▶

Week 1 (低风险打底)：
   │
   ├─ #1 deploy.sh 归一           [0.5h] ────┐
   ├─ #2 模板加载归一              [0.5h] ───┤ 可并发
   └─ #3 repo-map 自动生成        [1.0h] ───┘

Week 1-2：
   │
   ├─ #4 mega-navbar 抽共享        [2h]  依赖 tsconfig alias 验证
   └─ #5 services.ts → vps 派生    [3h]  ★ 先做 audiobook 单站验证
                                            再推广

Week 3-4 (深度改造)：
   │
   ├─ #6 搜索 JS / utils 库        [3h]  依赖 #1#2 生态稳定
   ├─ #7 @tlz/shared-lib monorepo  [4h]  依赖 pnpm workspace
   ├─ #8 FastAPI metadata API      [4h]  批量改 10 个 api.py
   └─ #9 ops-console 用 services   [3h]  依赖 #7 #8

可选 (Week 5+)：
   └─ #10 /services-health         [4h]  依赖 #3 #5 #8
```

---

## 6. 不做的选项（主动拒绝）

| 想法 | 为什么拒 |
|---|---|
| 把 4 个静态 `generate.py` 合并成 `BaseStaticSite` 基类 | 业务差异太大（stack=yaml分组 / cmds=混合分类 / logs=多源聚合 / assets=frontmatter 文章），继承反而坏事。只抽函数级 util，不抽类。|
| 强制统一所有站用 Next.js | 静态站 `generate.py` + nginx 足够了，Next.js 会增加构建复杂度。现状 "对的工具用在对的站" 挺好。|
| 合并 site-* 10 个 slash command | Agent 3 查证这些命令**不冗余**，是有意的原子操作（site-header-refresh 单独存在允许"只改 header 不动其他"）。合并会降低灵活性。|
| CLAUDE.md 从 yaml 派生 | 目前 CLAUDE.md 的主要信息都准确，硬编码 VPS IP 一处而已（且已有 vps_config.sh），ROI 极低。|
| FastAPI 服务注册中心（Consul / etcd） | 28 个服务还没到分布式中心的量级。Refactor #8 的 `/api/metadata` 端点 + cron 对账就够了。|

---

## 7. 改动量估算

| Refactor | 新代码 | 删代码 | 净省 | 影响面 |
|---|---|---|---|---|
| #1 deploy.sh | +30 | -116 | -86 | 4 站 |
| #2 模板加载 | +25 | -80 | -55 | 4 站 |
| #3 repo-map | +60 | -22 旧项 | +38 | 工具层 |
| #4 mega-navbar | +5 tsconfig | -282 | -277 | 2 Next 站 |
| #5 services→vps | +300 脚本 | -100 手写 unit/conf | +200 | 老 3-4 站 |
| #6 搜索 JS | +90 | -240 | -150 | 3 站 |
| #7 shared-lib | +400 packaging | -200 复制代码 | +200 | 2 Next 站 |
| #8 metadata API | +100 | 0 | +100 | 10 FastAPI |
| #9 ops-console | +150 页面 | 0 | +150 | 1 站 |
| **累计** | **+1160** | **-1040** | **+120** | 净增代码 120 行 |

**解读**：表面上净增 120 行，但：
- 删的是**重复代码**（debug 要改多份）
- 增的是**框架 / 包 / 一次性**代码（改一份多站受益）
- 新站上线成本：**从 ~400 行 → ~50 行**

---

## 8. 最终落脚点 · 想象中的目标态

```
~/Dev/
├── stations/
│   ├── stack/
│   │   ├── deploy.sh          # 2 行（调共享）
│   │   ├── generate.py        # 仅业务逻辑（~300 行）
│   │   └── projects.yaml
│   ├── ...
│   ├── website/
│   │   ├── lib/
│   │   │   ├── services.ts     # ← AUTO-GEN from menus/entities/
│   │   │   └── content.ts      # website 独有
│   │   └── package.json        # 依赖 @tlz/shared-lib
│   ├── ops-console/            # 依赖 @tlz/shared-lib（共享 navbar、types）
│   └── web-stack/
│       ├── services/hydro-*/api.py   # 都有 /api/metadata
│       └── infra/               # 模板化 deploy/nginx/systemd
│
├── devtools/
│   ├── lib/
│   │   ├── site_templates.py    # Refactor #2
│   │   ├── yaml_utils.py        # Refactor #6
│   │   ├── deploy-static-site.sh # Refactor #1
│   │   ├── tools/
│   │   │   ├── menus.py
│   │   │   ├── repo_map_gen.py  # Refactor #3
│   │   │   ├── services_to_nginx.py    # Refactor #5
│   │   │   ├── services_to_systemd.py  # Refactor #5
│   │   │   └── services_vs_live.py     # Refactor #8
│   │   └── templates/
│   │       ├── site-navbar.html
│   │       ├── site-content.css
│   │       └── site-filter.js   # Refactor #6
│   ├── packages/
│   │   └── shared-lib/          # Refactor #7（@tlz/shared-lib）
│   │       ├── src/
│   │       │   ├── services.ts
│   │       │   ├── navbar/
│   │       │   ├── design-system/
│   │       │   └── utils.ts
│   │       └── package.json
│   └── scripts/
│
└── tools/
    └── configs/
        ├── menus/               # Phase A-E 已做
        │   ├── entities/
        │   ├── relations/
        │   └── ...
        └── repo-map.json        # Refactor #3 自动生成
```

---

## 9. 第一铲下去选哪里？

**我的建议**：**Tier 1 的 #1 / #2 / #3 一起做**（累计 2 小时，低风险，高可见收益）。

- #1 + #2 一起改，同一批 commit，4 站各跑 deploy.sh smoke test
- #3 单独做（只动 repo-map.json + 加脚本），可独立 ship
- 做完 3 条，让系统在新骨架上稳定一周
- 再动 #4（mega-navbar 共享） — 触及 Next.js build，需要更长观察期
- 最后攻 #5（VPS 派生） — 有碰 VPS 的风险

想开工的话，回我一句，我按上面顺序开干。
