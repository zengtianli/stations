# HANDOFF · VPS 同步会话（下次专门做）

> 2026-04-22 生成。本地 monorepo 合并 + Phase 0-4 重构已 push（stations 4 commits + devtools 3 commits），VPS 端未做任何改动。本文档是**专门针对 VPS 侧清理 + deploy** 的下次会话入场指南。

---

## Context

- 本地 + github 已完成：
  - `github.com/zengtianli/stations` 单 monorepo 合并（6689a7b..e455a78）
  - 12 个旧 repo archived 只读
  - Phase 0: 删 oauth-proxy 整站（本地 + github）
  - Phase 1: 9 孤儿 st_utils + _archive-streamlit 清理
  - Phase 2.1: cc-options + hydro-toolkit 共享 read_version
  - Phase 3: 8 hydro-* 迁 `make_service_app` factory（hydro-toolkit / hydro-risk / cc-options 跳过）
  - Phase 4: docs/ 3 份过时知识库清理
  - 累计 stations repo: **-4,869 行**

- VPS 端完全没动：
  - `oauth-proxy.service` 仍 active + enabled，https://proxy.tianlizeng.cloud 仍可访问
  - `/var/www/oauth-proxy/` 源码还在
  - 7 hydro-* 跑的还是旧 api.py（迁 factory 的新代码未部署）
  - 10 个已 archived 旧 repo 的 webhook 已失效
  - 新 stations repo **未配 webhook**（也没必要配，见下文）

---

## 关键约束

1. **Next.js 站必须本地 build + rsync**（VPS 无 pnpm/node_modules），不可靠 webhook git pull
2. **金融保护**：cc-options/.env 永不上 VPS，走白名单 rsync
3. **硬性 4 项验证**（`~/Dev/CLAUDE.md` 有详细）：bundle 干净 / origin-aware fetch / 首屏 endpoint / SPA 标记
4. 破坏性操作前**一定要用户明示批准**（rm VPS 服务 / rm nginx vhost / CF DNS 删除）

---

## Tier 1 · 必做：清 VPS 上 oauth-proxy 残留

### 现状扫描（入场先跑）

```bash
source ~/Dev/devtools/lib/vps_config.sh

# 1.1 service 状态
ssh "$VPS" "systemctl status oauth-proxy.service --no-pager -l | head -20"

# 1.2 nginx vhost
ssh "$VPS" "ls -la /etc/nginx/sites-enabled/proxy* /etc/nginx/sites-available/proxy* 2>&1"

# 1.3 代码目录
ssh "$VPS" "ls -la /var/www/oauth-proxy/ | head -10"

# 1.4 当前线上可访问性
curl -sI https://proxy.tianlizeng.cloud 2>&1 | head -3
```

### 清理步骤（按顺序，每步确认无误再下一步）

```bash
# Step 1: 停 + 禁用 service
ssh "$VPS" "systemctl stop oauth-proxy.service && systemctl disable oauth-proxy.service"
ssh "$VPS" "systemctl status oauth-proxy.service --no-pager | head -5"   # 应显 inactive/disabled

# Step 2: 删 systemd unit
ssh "$VPS" "rm /etc/systemd/system/oauth-proxy.service && systemctl daemon-reload"

# Step 3: 删 nginx vhost
ssh "$VPS" "rm /etc/nginx/sites-enabled/proxy.tianlizeng.cloud"
ssh "$VPS" "rm /etc/nginx/sites-available/proxy.tianlizeng.cloud 2>/dev/null || true"
ssh "$VPS" "nginx -t && systemctl reload nginx"   # nginx -t 必须绿

# Step 4: 删代码目录
ssh "$VPS" "rm -rf /var/www/oauth-proxy"

# Step 5: 更新 webhook receiver 映射（删 oauth-proxy 条目）
ssh "$VPS" "grep -n oauth /var/www/github_webhook_receiver.py"
# 然后用 sed 或 scp 编辑后的版本删掉 REPO_PATHS + RESTART_SERVICES 的 oauth-proxy 条目
# 改完重启 webhook：
ssh "$VPS" "systemctl restart github-webhook.service"

# Step 6: 验证已彻底清干净
curl -sI https://proxy.tianlizeng.cloud 2>&1 | head -3   # 应 404 或超时（DNS 还在但无 backend）
ssh "$VPS" "find /etc /var/www -name '*oauth*' 2>/dev/null | head"   # 应返回空
```

### Cloudflare DNS（可选，非必须）

```bash
# 删 DNS 记录（让子域完全下线）
python3 ~/Dev/devtools/lib/tools/cf_api.py list | grep proxy
python3 ~/Dev/devtools/lib/tools/cf_api.py delete <record-id>
# 或保留 DNS（子域仍解析到 VPS，但 nginx 无 vhost → 返回默认 403/404，也可接受）
```

### 回滚方案

如果发现 oauth-proxy 其实还有在用：

```bash
# github 归档 repo 取回
cd /tmp && git clone https://github.com/zengtianli/oauth-proxy
scp -r oauth-proxy root@VPS:/var/www/
ssh "$VPS" "cd /var/www/oauth-proxy && pip3 install -r requirements.txt"
# 重建 service + nginx
# 详见 `github_webhook_receiver.py` 历史 git log 里的 REPO_PATHS 映射
```

---

## Tier 2 · 重要：deploy 7 hydro-* 生效 factory 改动

### 前置检查

```bash
# 2.1 本地改动已 push？
cd ~/Dev/stations && git status && git log --oneline -5
# 应显示 main 干净，最新 commit 是 e455a78 (refactor Phase 3+4)

# 2.2 ~/Dev/devtools 也已 push？（factory 源在这里）
cd ~/Dev/devtools && git status && git log --oneline -3
# 应显示 3266532 (audit: recognize make_service_app) 是最新

# 2.3 VPS 端 devtools 同步状态（factory 必须先到 VPS）
ssh "$VPS" "cd /var/www/devtools && git log --oneline -3"
# 如果没有 3266532 → VPS 端 devtools 过时，下面 deploy 会用旧 helpers
```

### VPS devtools 先同步

```bash
# 方案 A（推荐）：webhook 触发（devtools 有 webhook 映射）
# 无需操作，push 已触发 git pull

# 方案 B（保底）：手动 pull
ssh "$VPS" "cd /var/www/devtools && git pull origin main"

# 验证 factory 能从 VPS 读到
ssh "$VPS" "grep -c 'def make_service_app' /var/www/devtools/lib/hydro_api_helpers.py"
# 应 = 1
```

### 批量 deploy 7 hydro-*

```bash
cd ~/Dev/stations/web-stack

for s in hydro-annual hydro-capacity hydro-district hydro-efficiency \
         hydro-geocode hydro-irrigation hydro-rainfall hydro-reservoir; do
  echo "=== deploy $s ==="
  bash infra/deploy/deploy.sh $s
  sleep 2
done
```

**每站 deploy.sh 会自动做的**：
1. rsync `services/<name>/api.py` + `src/` 到 `/var/www/web-stack/services/<name>/`
2. `pnpm --filter <name>-web build` → rsync standalone → `/var/www/<name>-web/`
3. systemd restart `tlz-api@<name>` + `tlz-web@<name>`
4. smoke test `<api-port>/api/health` + `<web-port>/` HTTP 200

### 验证（每站 + 全局）

```bash
# 单站快查
for s in hydro-annual hydro-capacity hydro-district hydro-efficiency \
         hydro-geocode hydro-irrigation hydro-rainfall hydro-reservoir; do
  echo -n "$s: "
  curl -s "https://$s.tianlizeng.cloud/api/metadata" | python3 -c "
import json, sys
d = json.load(sys.stdin)
print(f\"v={d['version']} id={d['service_id']} type={d['service_type']} port={d['port']}\")
"
done

# 全景健康
/services-health
# 应: 11/11 HTTP 200, version 统一 0.1.0

# 硬性 4 项（挑 1 个 Next.js 站深验）
bash ~/Dev/devtools/scripts/web-deploy-verify.sh hydro-capacity 2>/dev/null || echo "skill 可能不存在，手动跑 4 项"
```

### 跳过的 3 站（不需要 deploy）

- `hydro-risk`: factory 不适用（/api/meta 动态 phases 字段），代码未改，VPS 无需动
- `hydro-toolkit`: 同上（portal 类型）
- `cc-options`: 已做 Phase 2.1 shared `read_version`，代码改了但只是 `_read_version()` → `read_version()`，功能等价。**可选 deploy**，ROI 低

想 deploy cc-options：
```bash
cd ~/Dev/stations/web-stack && bash infra/deploy/deploy.sh cc-options
# 前置：确认 VPS /var/www/cc-options/data/ 有最新 json（由本地 sync-data.sh 生成）
bash ~/Dev/stations/cc-options/sync-data.sh   # 若数据陈旧
```

---

## Tier 3 · 可选：webhook receiver 升级以支持 monorepo

### 现状问题
`/var/www/github_webhook_receiver.py` 的 `REPO_PATHS` 按老 per-repo 模型设计：
- `"audiobook": "/var/www/audiobook"` ← 对应老 `zengtianli/audiobook` repo
- 这些老 repo archived 不再 push，映射无实际作用
- 新 `stations` repo **不在映射里**，push 无效果

### 升级方案（ROI 评估）

**推荐：不升级**。理由：
1. 站群 Next.js 部分必须本地 `pnpm build` + rsync，webhook 帮不上
2. 剩余 FastAPI services 已经走 `deploy.sh` 模式稳定 2+ 年
3. monorepo 需要按子目录 dispatch，webhook 代码复杂度显著升
4. 金融 .env 保护依赖本地 rsync 白名单

**如果真想做**（低优先级备选）：

```python
# 在 /var/www/github_webhook_receiver.py 追加
STATIONS_MONOREPO = "/opt/stations"   # 新加 clone 路径

def handle_stations_push(payload):
    """stations monorepo 按 changed files dispatch"""
    changed = {f for commit in payload["commits"] for f in commit.get("modified", []) + commit.get("added", [])}
    
    # 按 path prefix 触发
    for prefix, action in [
        ("web-stack/services/", restart_fastapi),
        ("docs/",                rebuild_mkdocs),
        # Next.js 站不触发（本地 deploy）
    ]:
        affected = [f for f in changed if f.startswith(prefix)]
        if affected:
            action(affected)

def restart_fastapi(files):
    services = {f.split("/")[2] for f in files}  # web-stack/services/hydro-capacity/api.py → "hydro-capacity"
    for s in services:
        subprocess.run(["systemctl", "restart", f"tlz-api@{s}"])
```

**改完要测**：
1. 造一个只改 README 的 test commit → 触发 webhook → 验证没误触发 restart
2. 造一个改 hydro-annual/api.py 的 commit → 验证只 restart `tlz-api@hydro-annual`

---

## Tier 4 · 清理 webhook receiver 里的僵尸条目

本项 Tier 1 Step 5 已含，单独列出便于清单：

```python
# 本地修好 + scp 上去
# /var/www/github_webhook_receiver.py

# 删：
REPO_PATHS.pop("oauth-proxy", None)
REPO_PATHS.pop("web", None)        # = website，已迁 monorepo
REPO_PATHS.pop("cclog", None)      # 同
REPO_PATHS.pop("dockit", None)     # 同
REPO_PATHS.pop("hydro-annual", None)  # 同
# ... 10 + 个已 archived 的 repo 全清

RESTART_SERVICES.pop("oauth-proxy", None)
RESTART_SERVICES.pop("audiobook", None)    # 若保留老 webhook 模式；否则清
RESTART_SERVICES.pop("dockit", None)
```

---

## Tier 5 · 验证清单（做完全部 Tier 1-2 跑一遍）

```bash
# 5.1 线上全绿
/services-health          # 11/11 HTTP 200
/sites-health             # 13 子域基本扫描（静态 + Next.js）
/menus-audit              # 13/13（应一直绿）

# 5.2 oauth-proxy 确实下线
curl -sI https://proxy.tianlizeng.cloud 2>&1 | head -3   # 非 200 / 502
ssh "$VPS" "find /etc/systemd /etc/nginx /var/www -name '*oauth*' 2>/dev/null" | head
# 应返回空或只剩 log 文件

# 5.3 hydro-* 11 服务版本统一
curl -s https://tianlizeng.cloud/api/services-metadata | \
  python3 -c "
import json, sys
data = json.load(sys.stdin)['services']
for s in data:
    print(f\"{s['service_id']:24} v={s.get('version','?')} {s['http_status']}\")
"
# 应: 11 全 v=0.1.0 HTTP 200

# 5.4 Bundle 干净（website + ops-console，本轮没改但保险起见）
for host in tianlizeng.cloud dashboard.tianlizeng.cloud; do
  bundle=$(curl -sI "https://$host/_next/static/chunks/app/page-" -o /dev/null -w "%{http_code}")
  echo "$host static: $bundle"
done

# 5.5 webhook service 仍 active
ssh "$VPS" "systemctl status github-webhook.service --no-pager | head -5"
```

---

## 入场跑这 3 个命令

```bash
# 1. Warmup + 环境
/warmup

# 2. 当前 VPS 线上状态
/services-health && /sites-health

# 3. 读本文档（然后从 Tier 1 往下做）
open /Users/tianli/Dev/stations/HANDOFF_vps.md
```

---

## 决策点（需用户当面拍板，不要擅自做）

| 决策 | 选项 | 建议 |
|---|---|---|
| 清 oauth-proxy VPS | 做 / 不做 / 只停 service 保留代码备查 | 做（用户已明示 CF Access 接管不用） |
| CF DNS proxy.tianlizeng.cloud | 删 / 保留 | 保留（无害，删后子域 DNS 失效不可回头） |
| webhook receiver 升级 monorepo | 做 / 不做 | 不做（ROI 低，见 Tier 3 分析） |
| 清老 archived repo 在 webhook 的映射 | 一次清 / 分批 / 不清 | 一次清（Tier 4），反正 archived repo 不再触发） |
| cc-options 是否 deploy Phase 2.1 | deploy / 不 deploy | 看心情（仅把 inline `_read_version` 换成 shared import，行为等价） |

---

## 文件索引

- **本文档**：`/Users/tianli/Dev/stations/HANDOFF_vps.md`
- **上下文 handoff**：`/Users/tianli/Dev/stations/HANDOFF.md`（本地 + github 改动全景）
- **重构 plan**：`/Users/tianli/.claude/plans/functional-sleeping-dove.md`
- **本轮 commits**：
  - stations: `492790b` · `775fe96` · `47f8166` · `e455a78`
  - devtools: 2 oauth-proxy 相关 commit + `3266532`（audit 识别 factory）
- **webhook 源码**：`VPS:/var/www/github_webhook_receiver.py`
- **VPS 配置 SoT**：`~/Dev/devtools/lib/vps_config.sh`

---

## Backlog（Tier 6+，下下次会话）

- **Phase 2.3 tailwind preset 接入** website/ops-console（audit 过 100% 兼容，-128 行）
- **Phase 2.2 XlsxComputeHelper** 真正抽（实测 3 站有 pattern，-14 行 ROI 低，推迟）
- **Factory 升级**支持 `meta_extras: Callable` → 迁 hydro-risk + hydro-toolkit
- **docs 灰区**：`_archive/session-retros/` 30 份（-2,477 行）是否全删
- **assets repo 删除评估**（577 行，navbar 列了但访问量低）
