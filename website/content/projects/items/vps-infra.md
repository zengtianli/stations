---
title: "VPS 全栈基础设施"
slug: "vps-infra"
role: "独立搭建与运维"
tags: ["VPS", "Docker", "Nginx", "Cloudflare", "systemd"]
period: "2024-2026"
category: "基础设施"
highlight: true
featured: false
thumbnail: "/images/projects/placeholder.svg"
brief: "一台 VPS 上运行 24 个 systemd 服务 + 4 个 Docker 容器，Cloudflare 域名管理 + CF Access 认证，零依赖第三方平台的完整生产环境。"
tracks:
  devtools:
    highlight: true
  indie:
    highlight: true
    featured: true
    brief: "一个人的生产环境——从域名购买到服务部署，全部自主可控。"
---

## 背景

所有 Web 服务都部署在一台 PureVoltage VPS 上（Ubuntu 22.04, 4C/8G），通过 Cloudflare 提供域名解析、CDN 加速和访问控制。目标是零依赖第三方 PaaS 平台，全部自主可控。

## 架构

### 网络层

- 域名：tianlizeng.cloud (Cloudflare NS)
- SSL：Cloudflare Origin 证书
- CDN：Cloudflare 代理，Origin Rule 回源 8443
- 认证：Cloudflare Access (Zero Trust 邮箱验证码)

### 服务层

24 个 systemd 服务 + 4 个 Docker 容器：
- **Web 应用**：个人网站、Dashboard、水利工具集
- **API 服务**：OAuth Proxy、n8n 自动化
- **数据服务**：水利计算引擎（hydro-* 系列）
- **监控**：状态页、健康检查

### 管理工具

- Nginx 反向代理（监听 8443，统一入口）
- systemd 管理所有服务生命周期
- CF API 脚本管理 DNS 记录和 Access 策略
- deploy.sh 标准化部署流程

## 域名矩阵

| 子域名 | 服务 |
|--------|------|
| tianlizeng.cloud | 个人网站 |
| dashboard.tianlizeng.cloud | Repo Dashboard |
| status.tianlizeng.cloud | 状态页 |
| docs.tianlizeng.cloud | 文档站 |
| hydro-*.tianlizeng.cloud | 水利工具集 |

## 运维实践

- 自动化部署：每个项目标配 deploy.sh
- 监控告警：health_check.py 定期巡检
- 备份策略：Git 推送 + 数据库定期备份
- 安全：CF Access 统一认证，不暴露裸 IP
