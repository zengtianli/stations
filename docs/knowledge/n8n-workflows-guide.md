# n8n 三个工作流配置指南

> 地址：https://n8n.tianlizeng.cloud
> 账号：zengtianli1@gmail.com / Tl888888!

---

## 工作流 1：服务挂了 → 邮件通知（最重要）

### 步骤

1. **n8n 里新建 Workflow**，命名 `Service Down Alert`
2. 添加节点：**Webhook**
   - Method: POST
   - Path: `uptime-alert`
   - 记下生成的 Webhook URL（格式：`https://n8n.tianlizeng.cloud/webhook/uptime-alert`）
3. 添加节点：**Send Email**（连接 Webhook → Send Email）
   - To: `zengtianli1@gmail.com`
   - Subject: `🚨 {{ $json.heartbeat.msg }}`
   - Body: `Monitor: {{ $json.monitor.name }}  Status: {{ $json.heartbeat.status === 1 ? 'UP' : 'DOWN' }}  Time: {{ $json.heartbeat.time }}`
4. **Activate** 工作流
5. 去 **Uptime Kuma** → 设置 → 通知 → 添加通知：
   - 类型：Webhook
   - URL：上面的 Webhook URL
   - Method: POST
   - 勾选"Default Enabled"，应用到所有监控项

### 前置：配置 SMTP

n8n 发邮件需要 SMTP。在 n8n → Settings → SMTP：
- Host: `smtp.gmail.com`
- Port: `587`
- User: `zengtianli1@gmail.com`
- Password: Gmail 应用专用密码（Google 账号 → 安全 → 应用专用密码 → 生成一个）
- Sender: `zengtianli1@gmail.com`

---

## 工作流 2：GitHub Push → 立即重建 docs

### 步骤

1. 新建 Workflow，命名 `GitHub Push → Build Docs`
2. 添加节点：**Webhook**
   - Method: POST
   - Path: `github-build`
3. 添加节点：**Execute Command**（连接 Webhook → Execute Command）
   - Command: `cd /var/www && bash build_docs.sh 2>&1 | tail -10`
4. **Activate** 工作流
5. 去 **GitHub** → 每个仓库 → Settings → Webhooks → Add webhook：
   - URL: `https://n8n.tianlizeng.cloud/webhook/github-build`
   - Content type: `application/json`
   - Events: Just the push event
   - 需要配的仓库：`docs`, `claude-config`（其他仓库按需加）

### 可选：配好后删 cron

docs 站点的 5 分钟 cron 就可以删了（或改成兜底 30 分钟一次），因为 push 时已经即时触发。

---

## 工作流 3：每天早上发 VPS 日报

### 步骤

1. 新建 Workflow，命名 `Daily Morning Digest`
2. 添加节点：**Schedule Trigger**
   - Rule: 每天 08:00（注意 n8n 用 UTC，中国时间 8 点 = UTC 0 点，Cron: `0 0 * * *`）
3. 添加节点：**Execute Command**
   - Command:
   ```
   echo "=== Disk ===" && df -h / | tail -1 && echo "=== Memory ===" && free -h | head -2 && echo "=== Docker ===" && docker ps --format "{{.Names}}: {{.Status}}" && echo "=== Recent Commits ===" && cd /var/www/claude-config && git log --oneline -5
   ```
4. 添加节点：**Send Email**（连接 Execute Command → Send Email）
   - To: `zengtianli1@gmail.com`
   - Subject: `📊 VPS Daily Digest - {{ new Date().toISOString().slice(0,10) }}`
   - Body: `{{ $json.stdout }}`
5. **Activate** 工作流

---

## 优先级

1. **先配 SMTP**（三个工作流中两个需要发邮件）
2. **再做工作流 1**（服务告警，最关键）
3. **工作流 2 和 3** 按需做
