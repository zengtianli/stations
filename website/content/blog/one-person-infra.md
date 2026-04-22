---
title: "一个人的全栈基础设施"
date: "2026-04-08"
author: "曾田力"
excerpt: "24 个 systemd 服务、4 个 Docker 容器、29 个 GitHub 仓库——独立开发者如何用最小成本构建可靠的生产环境。"
tags: ["独立开发", "DevOps", "VPS", "自动化"]
published: true
---

## 为什么不用 PaaS

Vercel、Railway、Render 这些平台确实方便，但有几个问题：

1. **成本不可控**：流量突增时账单会吓人
2. **厂商锁定**：迁移成本随时间指数增长
3. **灵活性不足**：想跑个 cron job 或 websocket 都有限制
4. **学习深度不够**：对底层一无所知，出问题时无从排查

一台 VPS（$30/月）就能跑所有服务，完全自主可控。

## 架构全景

```
                    ┌─── Cloudflare ───┐
                    │  DNS + CDN       │
                    │  CF Access       │
                    │  Origin Rule     │
                    └────────┬─────────┘
                             │ :8443
                    ┌────────┴─────────┐
                    │     Nginx        │
                    │  (反向代理)       │
                    └────────┬─────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
     ┌─────┴─────┐   ┌─────┴─────┐   ┌──────┴──────┐
     │  systemd   │   │  Docker   │   │   Static    │
     │  (24)      │   │  (4)      │   │   Files     │
     └───────────┘   └───────────┘   └─────────────┘
```

### 网络层

- **Cloudflare**：DNS 解析 + CDN 缓存 + DDoS 防护
- **CF Access**：Zero Trust 认证（邮箱验证码），替代自建认证
- **Origin Rule**：所有流量通过 CF 代理，回源到 VPS 的 8443 端口

### Nginx

单一入口，按子域名路由到不同后端：

```nginx
server {
    server_name tianlizeng.cloud;
    location / { proxy_pass http://127.0.0.1:3000; }
}
server {
    server_name dashboard.tianlizeng.cloud;
    location / { proxy_pass http://127.0.0.1:3001; }
}
# ... 更多子域名
```

### 服务管理

所有服务用 systemd 管理：

```bash
# 查看所有服务状态
systemctl list-units --type=service --state=running | grep -E "website|dashboard|hydro"

# 部署新版本
cd /var/www/website && bash deploy.sh
# deploy.sh 自动: git pull → build → restart
```

## 自动化

### 部署

每个项目标配 `deploy.sh`：
```bash
git pull origin main
pnpm install --frozen-lockfile
pnpm build
sudo systemctl restart website
```

### 监控

- `health_check.py`：定期检查所有服务的 HTTP 响应
- `status.tianlizeng.cloud`：公开状态页
- `briefing 系统`：每天早上邮件推送系统状态摘要

### DNS 管理

```bash
# 列出所有 DNS 记录
python3 ~/Dev/devtools/lib/tools/cf_api.py dns list

# 添加新子域名
python3 ~/Dev/devtools/lib/tools/cf_api.py dns add hydro-new A 104.218.100.67
```

## 成本

| 项目 | 月费 |
|------|------|
| VPS (PureVoltage 4C/8G) | $30 |
| 域名 (tianlizeng.cloud) | ~$1 |
| Cloudflare | $0 (Free plan) |
| **合计** | **~$31/月** |

$31/月跑 24 个服务，每个服务月均 $1.3。任何 PaaS 平台都做不到这个成本。

## 经验

1. **systemd 是最好的进程管理器**——不需要 PM2、supervisor 等额外工具
2. **Cloudflare Free 够用**——CDN、DDoS 防护、SSL、Access 全免费
3. **标准化部署脚本**——每个项目的 deploy.sh 结构一致，降低心智负担
4. **不要过度容器化**——简单的 Node.js/Python 应用直接 systemd 就行，Docker 留给真正需要隔离的场景
