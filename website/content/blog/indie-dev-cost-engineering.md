---
title: "月均 $31 运维 28 个线上服务的成本工程"
date: "2026-04-11"
author: "曾田力"
excerpt: "一台 $30/月的 VPS + $1/年的域名，承载 24 个 systemd 服务和 4 个 Docker 容器——独立开发者的成本控制方法论。"
tags: ["独立开发", "VPS", "产品", "DevOps"]
published: true
---

## 成本结构

先看账单：

| 项目 | 月均成本 | 说明 |
|------|---------|------|
| VPS | $30 | PureVoltage, 4C/8G, Ubuntu 22.04 |
| 域名 | ~$0.08 | tianlizeng.cloud, Cloudflare 注册 |
| **合计** | **~$31** | |

没有 Vercel Pro、没有 AWS Lambda、没有 Supabase、没有 Render。所有服务跑在一台机器上。

## 28 个服务怎么塞进一台 VPS

### systemd 服务（24 个）

按用途分类：

- **Web 应用**（6）：个人网站、Dashboard、文档站、n8n、代理管理、状态页
- **API 服务**（4）：灌溉计算、搜索、联系表单、webhook receiver
- **自动化**（8）：briefing 生成、数据同步、证书更新、日志轮转、备份…
- **基础设施**（6）：Nginx、Node.js 运行时、Python 服务、监控…

每个服务都是独立的 systemd unit，挂了自动重启，日志进 journald。

### Docker 容器（4 个）

需要隔离环境的服务用 Docker：n8n（工作流引擎）、Uptime Kuma（状态监控）等。

## 关键决策

### 为什么不用 Serverless

1. **延迟可控**：VPS 上的 Node.js 进程常驻内存，没有冷启动
2. **成本可预测**：$30/月固定，不怕流量峰值账单爆炸
3. **全部可观测**：`journalctl -u xxx` 即可看日志，不需要 CloudWatch
4. **可以 SSH**：出了问题直接登上去排查，不用猜

### Cloudflare 免费套餐的威力

- **DNS + CDN**：全球边缘节点，不花钱
- **SSL**：Origin Certificate，免费且自动
- **CF Access**：零信任认证，不需要自建登录系统
- **Origin Rules**：回源到 8443 端口，Nginx 统一入口

### Nginx 统一网关

所有服务通过 Nginx 反代暴露，一个 8443 端口对外。子域名路由到不同 upstream：

```
docs.tianlizeng.cloud → localhost:3001
status.tianlizeng.cloud → localhost:3002
n8n.tianlizeng.cloud → localhost:5678
```

## 资源使用情况

实测 4C/8G 的利用率：

- CPU：日常 5-10%，build 时峰值 60%
- 内存：常驻 3.2GB，还有 4.8GB 余量
- 磁盘：40GB 用了 18GB
- 网络：日均 2GB 出站

## 扩容策略

当一台 VPS 不够时：

1. **垂直扩容**：升级到 8C/16G（约 $60/月），覆盖大部分场景
2. **水平拆分**：把计算密集型服务（build）移到第二台
3. **最后才考虑云服务**：只有当单个服务需要弹性伸缩时

## 总结

独立开发者不需要"云原生"。一台 VPS + Cloudflare 免费套餐，就能构建可靠的生产环境。关键不是技术选型多先进，而是**每一分钱都花在刀刃上**。
