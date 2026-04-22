# 个人网站部署架构演变：从 Vercel 到 VPS Standalone

> 记录 tianlizeng.cloud 的部署方式变迁，解释每个阶段做了什么、为什么变、核心概念是什么。

---

## 第一阶段：Vercel（2025.05 — 2026.04.12）

### 架构图

```
你的电脑                     GitHub                      Vercel
┌──────────┐    git push    ┌──────────┐    webhook     ┌──────────────────┐
│ ~/Dev/    │ ──────────▶  │  web repo │ ──────────▶  │ Vercel 平台       │
│ website/  │               │          │               │                  │
│           │               │          │               │ 1. git clone     │
│ 你只做:   │               │          │               │ 2. pnpm install  │
│ 写代码    │               │          │               │ 3. pnpm build    │
│ git push  │               │          │               │ 4. 部署到 CDN    │
│           │               │          │               │ 5. 分配 HTTPS    │
└──────────┘               └──────────┘               └──────────────────┘
                                                              │
                                                              ▼
                                                      tianlizeng.cloud
                                                      (DNS 指向 Vercel)
```

### 你做什么

写代码 → git push。结束。

### Vercel 做什么

Vercel 监听 GitHub push 事件，自动完成：

1. **Clone** — 从 GitHub 拉取最新代码
2. **Install** — `pnpm install` 安装依赖
3. **Build** — `pnpm build` 编译 Next.js 应用
4. **Deploy** — 把构建产物部署到 Vercel 的全球 CDN
5. **Serve** — 处理用户请求，自动 HTTPS，自动扩缩容

你不需要任何服务器、不需要 Nginx、不需要 systemd、不需要 SSL 证书。**Vercel 就是一个"push 了就上线"的平台**。

### 为什么离开 Vercel

| 问题 | 具体表现 |
|------|---------|
| **Symlink 不支持** | `content/project-source/` 是指向 `~/Personal/projects` 的 symlink。Vercel clone 时拿不到 symlink 指向的文件。你为此做过两次 workaround（2026-01-09、2026-02-27），把 symlink 替换成文件复制，但维护成本高 |
| **无服务端持久化** | 不能跑 SQLite（全文搜索需要 `data/search.db`）。Vercel 是无状态 serverless，每次请求可能在不同机器 |
| **无 CMS 后台** | `/admin` 后台需要读写服务器上的 markdown 文件，Vercel 的文件系统是只读的 |
| **费用不可控** | Free plan 有带宽和构建时间限制，超出后按量计费 |

---

## 第二阶段：VPS Standalone（2026.04.12 — 至今）

### 架构图

```
你的电脑                                              VPS (104.218.100.67)
┌──────────────┐                                     ┌──────────────────────────┐
│ ~/Dev/website│                                     │                          │
│              │    bash deploy.sh                    │  /var/www/web/ (源码)    │
│ 1. 写代码    │ ─────────────────────────▶          │    ↑ webhook git pull    │
│ 2. pnpm build│    rsync 构建产物到 VPS              │    (对 website 没用)     │
│ 3. rsync     │                                     │                          │
│ 4. restart   │                                     │  /opt/website/ (运行)    │
│              │                                     │    ├── server.js         │
└──────────────┘                                     │    ├── .next/            │
                                                     │    └── public/           │
                                                     │         │                │
                                                     │   systemd → node :3000  │
                                                     │         │                │
                                                     │   Nginx :8443 反代      │
                                                     └──────────────────────────┘
                                                              │
                                                     Cloudflare (CDN + SSL + DNS)
                                                              │
                                                              ▼
                                                      tianlizeng.cloud
```

### 你做什么

写代码 → git push → `bash deploy.sh`。

### deploy.sh 做什么

```bash
# 1. 清理旧构建（防止 CSS 哈希残留）
rm -rf .next

# 2. 在你的 Mac 上构建
pnpm build
# → 产出 .next/standalone/（自包含服务器）
# → 产出 .next/static/（CSS/JS/字体）

# 3. 构建搜索索引
python3 scripts/build-search-index.py
# → 产出 data/search.db

# 4. 用 rsync 把构建产物传到 VPS
rsync .next/standalone/ → VPS:/opt/website/      # 服务器代码
rsync .next/static/     → VPS:/opt/website/.next/static/  # 静态资源
rsync public/           → VPS:/opt/website/public/        # 图片等
rsync data/             → VPS:/opt/website/data/          # 搜索数据库

# 5. 重启 VPS 上的 Node.js 服务
ssh VPS "systemctl restart website"

# 6. 自动验证
# → HTTP 200？
# → CSS 文件哈希匹配？
# → 服务端日志有无报错？
```

### VPS 上的请求链路

```
用户浏览器
    │
    ▼
Cloudflare（CDN + DDoS 防护 + SSL 终止）
    │  Origin Rule: 回源到 VPS:8443
    ▼
Nginx（VPS 上，监听 8443）
    │  server_name tianlizeng.cloud
    │  proxy_pass http://127.0.0.1:3000
    ▼
Node.js（/opt/website/server.js，由 systemd 管理）
    │  Next.js standalone 服务器
    ▼
返回 HTML/CSS/JS 给用户
```

---

## 核心概念：什么是 Standalone 模式

### 普通 Next.js 构建

```
pnpm build 产出：
  .next/              ← 编译后的页面代码
  
运行需要：
  .next/              ← 编译产物
  node_modules/       ← 300MB+ 的全部依赖
  package.json        ← 入口配置
  next.config.mjs     ← Next.js 配置
  
→ 你不能把这堆东西搬到另一台机器直接跑
→ 另一台机器也需要 pnpm install
```

### Standalone 构建（`output: "standalone"`）

```
pnpm build 产出：
  .next/standalone/           ← 自包含目录
    ├── server.js             ← 一个入口文件，node server.js 就能跑
    ├── node_modules/         ← 只包含运行时必需的依赖（很小）
    └── .next/server/         ← 编译后的页面代码
  
  .next/static/               ← CSS/JS/字体（需要单独复制）
  
→ rsync 这个目录到任何有 Node.js 的机器，node server.js 就跑起来了
→ 不需要 pnpm install，不需要源码，不需要 node_modules 全量
```

**一句话**：standalone 就是 Next.js 帮你把整个应用打成一个"可移植包"，只要有 Node.js 就能跑。类似于 Go 的单二进制编译。

### 为什么需要单独 rsync static

standalone 目录里**不包含** `.next/static/`（CSS、JS chunk、字体文件）。这是 Next.js 的设计——它假设你会用 CDN 托管静态文件。

但我们的方案是让 Node.js 同时处理静态文件，所以需要把 `.next/static/` 手动复制到 standalone 目录内的 `.next/static/`。

**关键约束**：standalone 和 static 必须来自**同一次 `pnpm build`**。因为 CSS 文件名包含内容哈希（如 `94745d2661a2fdea.css`），每次 build 都不同。如果 HTML 引用的是新 build 的 CSS 哈希，但 VPS 上的 static 目录还是旧 build 的文件，页面就会完全没样式——这就是 2026-04-12 和 2026-04-13 两次事故的原因。

---

## 两个阶段对比

| 维度 | Vercel 时期 | VPS Standalone 现在 |
|------|------------|-------------------|
| **谁做 build** | Vercel 服务器自动做 | 你的 Mac 本地做 |
| **谁做部署** | Vercel 自动（push 触发） | `bash deploy.sh`（rsync 到 VPS） |
| **谁做 restart** | Vercel 自动 | `systemctl restart website` |
| **谁管 SSL** | Vercel 自动签发 | Cloudflare Origin 证书 |
| **谁管 CDN** | Vercel 全球 CDN | Cloudflare |
| **能跑 SQLite** | ❌ 无状态 serverless | ✅ 持久化文件系统 |
| **能用 symlink** | ❌ clone 时丢失 | ✅ 本地 build 能读 symlink |
| **能写文件（CMS）** | ❌ 只读文件系统 | ✅ /admin 可写 content/ |
| **费用** | Free plan 有限制 | VPS $30/月（固定） |
| **部署复杂度** | 零（push 即上线） | 一条命令（`bash deploy.sh`） |
| **Webhook 有用吗** | 不需要（Vercel 自带 GitHub 集成） | 对 website 没用（只 git pull，不 build） |

---

## Webhook 的角色

### VPS 上的 GitHub Webhook Receiver

```python
# /var/www/github_webhook_receiver.py
# 监听 GitHub push 事件，对所有 repo 做 git pull

REPO_PATHS = {
    "web": "/var/www/web",        # ← 只 pull 源码，不 build
    "docs": "/var/www/docs",      # ← pull 就够（纯静态）
    "oauth-proxy": "/opt/...",    # ← pull + restart（简单 Node 服务）
}

RESTART_SERVICES = {
    "oauth-proxy": "oauth-proxy", # ← pull 后自动 restart
    # "web" 不在这里 → 不会 restart
}
```

**对其他服务**：有用。比如 `docs`（MkDocs 纯静态站）push 后 pull 就能更新；`oauth-proxy` push 后 pull + restart 就行。

**对 website**：没用。因为 website 需要 `pnpm build` 生成 standalone 产物，webhook 只做 git pull 不做 build，pull 完了 `/opt/website` 里还是旧的构建产物。

---

## 现在的部署流程（最终版）

```bash
# 在你的 Mac 上
cd ~/Dev/website

# 1. 改代码、测试
pnpm dev              # 本地开发
pnpm build            # 验证构建

# 2. 提交推送
git add . && git commit -m "xxx" && git push

# 3. 部署（一条命令搞定）
bash deploy.sh
# 或者在 Claude Code 里用 /deploy

# deploy.sh 自动完成：
# rm -rf .next → pnpm build → rsync → restart → 验证
```

**不需要 SSH 到 VPS。不需要在 VPS 上 build。不需要手动 restart。deploy.sh 全包了。**
