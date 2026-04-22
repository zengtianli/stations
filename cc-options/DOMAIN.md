# cc-options 域名 / 部署 说明

## 当前状态（2026-04-21 迁移后）

**架构已从 Streamlit 切到 Next.js + FastAPI**（见 `MIGRATE-PLAN.md`）。

| 组件 | 当前值 | 来源 SSOT |
|---|---|---|
| 子域 | `cc-options.tianlizeng.cloud` | `~/Dev/stations/website/lib/services.ts:65`（`port: 8521` 是 legacy 标记，实际前端在 3121） |
| 备用子域 | `cc.tianlizeng.cloud` | nginx 独立 vhost（历史遗留，未迁走，待 `/site-archive cc` 下线） |
| API 端口 | `8621`（Streamlit 8521 + 100） | FastAPI `services/cc-options/api.py` |
| Web 端口 | `3121`（Streamlit 8521 - 5400） | Next.js `apps/cc-options-web/` |
| 认证 | CF Access（邮箱码：`zengtianli1@gmail.com`，session 24h） | CF Access `cc-options.tianlizeng.cloud` |
| CF DNS | `cc-options.tianlizeng.cloud` A → 104.218.100.67（橙云 proxy） | CF |
| Nginx | `/etc/nginx/sites-enabled/cc-options.tianlizeng.cloud` → `proxy_pass :3121` | VPS |
| systemd units | `tlz-api@cc-options` + `tlz-web@cc-options`（均 active） | VPS |
| 旧 units（已停） | `cc-chat.service` / `rh-dashboard.service`（inactive + disabled） | VPS |

实测：
```
curl https://cc-options.tianlizeng.cloud → 302（未登录，CF Access 拦截，OK）
VPS 内 curl http://127.0.0.1:3121        → 200（Next standalone）
VPS 内 curl http://127.0.0.1:8621/api/health → {"status":"ok","data_available":true}
```

---

## 场景 1 — 只是要改子域名（例如 `cc-options` → `qqq-cc`）

**用 `/site-rename` skill（原子操作，自带 14 天 301 回流）：**

```bash
python3 ~/Dev/devtools/lib/tools/site_rename.py cc-options qqq-cc --dry-run    # 先看计划
python3 ~/Dev/devtools/lib/tools/site_rename.py cc-options qqq-cc --yes        # 执行
```

脚本自动做 9 步：

1. Pre-flight：services.ts 干净 / old 存在 / new 不存在
2. CF DNS 加 `qqq-cc.tianlizeng.cloud`
3. CF Origin Rule 加 `qqq-cc → 127.0.0.1:8521`（如 old 有 port）
4. CF Access 给 `qqq-cc` 加同一应用（如 old 有 cf-access）
5. VPS nginx：复制 vhost、sed server_name、symlink `/var/www/qqq-cc` → `/var/www/cc-options`、`nginx -t` + reload
6. 加临时 redirect vhost：`cc-options.tianlizeng.cloud` → `301 → qqq-cc.tianlizeng.cloud`
7. `services.ts`: in-place rewrite subdomain + name
8. `projects.yaml`: rename entry + notes
9. 调度表加一条：14 天后 `scheduled-archives.json` 自动下线 old subdomain

**14 天过后**，旧 `cc-options.tianlizeng.cloud` 会被 `/site-archive` 自动清理（DNS + nginx + /var/www）。

---

## 场景 2 — 要 deploy 新代码（不改域名）

```bash
cd ~/Dev/stations/cc-options
bash deploy.sh
```

流程（deploy.sh 薄包装，内部调 web-stack 新流水线）：

1. `bash sync-data.sh` — 白名单 rsync 3 个产物到 VPS `/var/www/cc-options/data/`
2. `bash ~/Dev/stations/web-stack/infra/deploy/deploy.sh cc-options` — 触发：
   - Next.js pnpm build + fix-standalone-pnpm-symlinks
   - rsync `.next/standalone/` → `/var/www/cc-options-web/`
   - FastAPI Python rsync → `/var/www/web-stack/services/cc-options/`
   - `systemctl restart tlz-api@cc-options tlz-web@cc-options`
   - smoke test 8621/3121 + public 302

`--fast` 模式跳过 public verify（节约 15-25s），仅做 VPS 内 bundle-clean 检查。

---

## 场景 3 — systemd unit 管理（tlz-api@ / tlz-web@ 模板）

已经跑起来的 2 个 unit（deploy.sh 自动创建 symlinks）：

```bash
systemctl status tlz-api@cc-options   # FastAPI :8621
systemctl status tlz-web@cc-options   # Next standalone :3121
```

两个 template unit 的源文件：`/etc/systemd/system/tlz-api@.service` + `tlz-web@.service`（VPS 全局，hydro-* 也用同一套）。不需要为 cc-options 单独建 unit。

**重启 VPS 后自动拉起**（`systemctl enable --now tlz-api@cc-options tlz-web@cc-options` 已做）。

---

## 场景 4 — 把 `cc.tianlizeng.cloud` 这条旧链路退役

目前 nginx 上同时有两份 vhost 指向 8521，`cc.tianlizeng.cloud` 是历史残留：

```bash
# 下线旧子域（14 天 301 保护，自动清理）
/site-archive cc
# 或用绝对路径：
python3 ~/Dev/devtools/lib/tools/site_archive.py cc
```

如果确认 `cc.tianlizeng.cloud` 没外部链接引用，直接 `/site-archive` 就可以。

---

## 参考：这个项目被哪些 SSOT 引用

| 文件 | 记录了什么 |
|---|---|
| `~/Dev/stations/website/lib/services.ts:65` | subdomain / port / accessType（**改这里触发 stack 首页卡片更新**） |
| `~/Dev/stations/stack/projects.yaml` | name / path / purpose / status（不再存 domain/port，按 name 反查 services.ts 派生） |
| `~/Dev/stations/cc-options/deploy.sh` | REMOTE_DIR / DOMAIN / SERVICE（改域名要同步改这里的 DOMAIN） |
| CF DNS | 子域 A 记录 |
| CF Access | 认证应用 |
| CF Origin Rules | 把 `<sub>.tianlizeng.cloud` 路由到 `127.0.0.1:8521` |
| VPS `/etc/nginx/sites-enabled/<host>` | vhost + SSL + proxy_pass |
| VPS `/etc/systemd/system/cc-options.service` | 进程管理（**目前缺** — 见场景 3） |

`/site-rename` 会一次性改前面 7 个；systemd unit 文件名跟 subdomain 同名，rename 后可能要手动改一下（脚本目前不动 systemd）。
