# VPS 新服务指南：Uptime Kuma / PostgreSQL + pgvector / n8n

> 2026-03-20 部署，三个服务都跑在 VPS（104.218.100.67）的 Docker 中。

---

## 1. Uptime Kuma — 你的服务看门狗

**一句话**：7x24 盯着你的所有站点和服务，挂了立刻通知你。

**解决什么问题**：之前你的 docs 站点、Marzban、Edict 看板如果挂了，你完全不知道，只能靠自己打开网页碰运气发现。现在 Uptime Kuma 每 60 秒检查一次，挂了可以自动发通知。

**你现在有 8 个监控项**：

| 监控项 | 检查方式 | 说明 |
|--------|----------|------|
| docs 站点 | HTTPS 访问 | CC 产物管理中心 |
| status 监控 | HTTPS 访问 | Uptime Kuma 自己（元监控） |
| n8n 自动化 | HTTPS 访问 | n8n 工作流平台 |
| Edict 看板 | HTTPS 访问 | 水利项目看板 |
| Marzban 面板 | HTTPS 访问 | 代理面板 |
| CC Chat API | TCP 端口 7892 | docs 站点的聊天后端 |
| Edict Dashboard | HTTP 内部 7891 | Edict 看板后端 |
| PostgreSQL | TCP 端口 5432 | 数据库 |

**下一步可以做**：
- 设置通知渠道（设置 → 通知 → 添加 Telegram/邮件/Webhook），这样服务挂了会推送给你
- 创建公开状态页（状态页面 → 新建），可以分享给别人看你的服务状态

**地址**：https://status.tianlizeng.cloud（Cloudflare Access 保护，Gmail OTP 登录）

---

## 2. PostgreSQL + pgvector — 你的学习数据库 + 未来 RAG 基座

**一句话**：一个真正的生产级数据库，自带向量搜索能力。

**解决什么问题**：你正在学两条路线——全栈开发和 AI 应用开发。PostgreSQL 同时覆盖两个方向：

| 学习路线 | PostgreSQL 的角色 |
|----------|-------------------|
| **全栈开发**（learn-fullstack） | 学 SQL、表设计、索引、ORM、migration — 最主流的关系型数据库 |
| **AI 应用开发**（learn-ai） | pgvector 扩展支持向量存储和相似度搜索 — 不需要单独装 Pinecone/Weaviate |

**pgvector 是什么**：传统数据库存的是数字、文字。pgvector 让你能存"语义向量"——把一段文字通过 embedding 模型转成一组数字（比如 1536 维），然后数据库可以搜"语义最接近的内容"。这就是 RAG（检索增强生成）的核心能力。

**你能拿它做什么（按难度递增）**：

1. **练 SQL 基本功**：建表、查询、JOIN、索引优化
2. **给 docs 站点加语义搜索**：把你的知识库文档向量化存进去，用户搜索时找语义最近的文档，而不是关键词匹配
3. **给 CC 会话加语义检索**：把 176 条会话摘要向量化，"找我之前讨论 Nginx 配置的会话"
4. **完整 RAG pipeline 实战**：embedding → 存储 → 检索 → 交给 Claude 生成回答

**连接信息**：

```bash
# 从 VPS 本地连接
psql -h 127.0.0.1 -U tianli -d main

# 从本地电脑通过 SSH 隧道连接（推荐）
ssh -L 5432:127.0.0.1:5432 root@104.218.100.67
# 然后另一个终端
psql -h 127.0.0.1 -U tianli -d main
# 密码: 30a2d17361e5ae6d0d83b51dc6442e7b

# Python 连接
pip install psycopg2-binary
```

```python
import psycopg2
conn = psycopg2.connect(
    host="127.0.0.1", port=5432,
    user="tianli", password="30a2d17361e5ae6d0d83b51dc6442e7b",
    dbname="main"
)
```

**注意**：5432 端口没有对外暴露（没有 Nginx 反代），只能从 VPS 本地或 SSH 隧道访问，这是安全的。

---

## 3. n8n — 你的自动化中枢

**一句话**：可视化的自动化工作流平台，用拖拽代替写脚本来连接各种服务。

**解决什么问题**：你现在的自动化是 cron + bash 脚本（比如每 5 分钟跑 `build_docs.sh`）。这种方式能用但有局限：

| | cron + 脚本 | n8n |
|--|------------|-----|
| 触发方式 | 只能定时 | 定时 / Webhook / 事件触发 |
| 错误处理 | 自己写 | 内置重试、错误分支 |
| 可视化 | 看日志 | 拖拽流程图，一眼看到哪步失败 |
| 连接服务 | 自己写 API 调用 | 400+ 内置集成（GitHub/Telegram/邮件/数据库...） |

**适合你的使用场景**：

1. **GitHub Push → 自动重建 docs 站点**（替代 5 分钟轮询 cron）
   - GitHub 仓库有 push → Webhook 触发 n8n → SSH 执行 `build_docs.sh` → 即时更新
   - 比现在的每 5 分钟轮询更快、更省资源

2. **Uptime Kuma 告警 → Telegram/邮件通知**
   - 服务挂了 → Uptime Kuma Webhook → n8n → 发 Telegram 消息

3. **定时汇总**
   - 每天早上自动检查：VPS 磁盘使用、服务状态、最近 git 提交 → 发一封汇总邮件

4. **学习价值**
   - 理解事件驱动架构（面试解决方案工程师加分）
   - 理解 Webhook、API 编排、工作流引擎的概念

**地址**：https://n8n.tianlizeng.cloud（Cloudflare Access 保护，Gmail OTP 登录）

**注意**：n8n 首次访问需要创建管理员账号（和 Uptime Kuma 一样）。

---

## 三者的关系

```
                    ┌─────────────┐
                    │  n8n 自动化  │ ← 编排工作流，连接一切
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
     ┌──────────────┐ ┌────────┐ ┌──────────────┐
     │ Uptime Kuma  │ │  PG +  │ │  其他服务     │
     │ 监控 & 告警   │ │ vector │ │ (GitHub etc) │
     └──────────────┘ └────────┘ └──────────────┘
           │               │
           ▼               ▼
     服务挂了通知你    存数据 + 向量搜索
```

- **Uptime Kuma** 是眼睛 — 监控一切
- **PostgreSQL** 是大脑 — 存储和检索数据
- **n8n** 是手脚 — 自动执行工作流

---

## 资源占用

部署前后对比（2026-03-20）：

| 指标 | 部署前 | 部署后 | 剩余 |
|------|--------|--------|------|
| 内存 | 1.0 GB | 1.4 GB | 6.4 GB |
| 磁盘 | 38 GB | 41 GB | 56 GB |

三个服务加起来只用了 ~400MB 内存和 ~3GB 磁盘，VPS 资源依然非常充裕。
