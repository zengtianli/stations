# OpenClaw + 飞书 架构参考（2026-03-23）

## 架构

```
飞书 App → 飞书服务器 → OpenClaw Gateway (VPS:18789, Node.js)
                              ↓
                         太子 Agent (default) → Claude API → 回复飞书
                              ↓ (快捷指令时)
                         feishu_commands (VPS:9002, HTTP)
```

## 已部署服务

| 服务 | 端口/说明 |
|------|----------|
| openclaw-gateway | 18789，Node.js，systemd user service |
| feishu-commands | 9002，指令路由 |
| github-webhook | 9000，接收 push 事件自动 pull |
| workspace-watcher | inotifywait 监控 taizi workspace，新文件自动发飞书 |
| edict-refresh | 每 15s 同步 edict SOUL.md → openclaw |
| edict-dashboard | 看板服务 |
| cc-chat | CC 产物管理后端 |
| alert-webhook | Uptime Kuma 告警 |

## SOUL.md 同步链路

```
/opt/edict/agents/taizi/SOUL.md  ← 改这里
        ↓ edict-refresh 每 15s
~/.openclaw/agents/main/SOUL.md  ← openclaw 实际读取（勿直接改）
        ↓ github_webhook_receiver.py push 时额外同步
~/.openclaw/workspace-taizi/soul.md
```

改 SOUL.md 必须改 `/opt/edict/agents/taizi/SOUL.md`，改其他地方 15s 后被覆盖。

## feishu_commands 指令（端口 9002）

| 指令 | 说明 |
|------|------|
| `/rebuild` | 重建 docs.tianlizeng.cloud 站点 |
| `/status` | VPS 磁盘/内存/服务状态 |
| `/review` | 触发今日学习回顾并发邮件 |
| `/morning` | 手动触发早朝简报 |
| `/clear` | 清空太子对话历史 |
| `/log [服务名]` | 查看 journalctl 日志（无参数列可用服务） |
| `/restart [服务名]` | 重启服务（白名单内） |
| `/git [repo名]` | git pull 指定 repo（无参数列可用 repo） |
| `/save 标题\n内容` | 保存 Markdown 为 HTML，返回 HTTPS 链接 |
| `/ts 内容` | 翻译（中↔英自动判断），保存文件返回链接 |
| `/help` | 显示所有指令 |
| 中文别名 | `重建/状态/回顾/早朝/清空/日志/重启/拉取/保存/帮助` |

## Workspace Watcher

- 监控目录：`/root/.openclaw/workspace-taizi/`
- 触发条件：文件写入/移入（`close_write`, `moved_to`）
- 动作：转 HTML → 存 `/var/www/outputs/` → 发飞书消息（含链接）
- 服务：`workspace-watcher.service`

太子在 workspace 写文件 → watcher 自动推飞书链接。这是绕过"AI 不可控"的确定性方案：不依赖 AI 调 curl，而是监控 AI 的副产品（workspace 文件）。

## 关键路径速查

| 文件 | 说明 |
|------|------|
| `~/.openclaw/openclaw.json` | API Key、默认模型 |
| `/opt/edict/agents/taizi/SOUL.md` | 太子 SOUL.md 源文件（改这里） |
| `~/.openclaw/agents/main/SOUL.md` | openclaw 实际读取（勿直接改） |
| `/var/www/feishu_commands.py` | 指令路由服务 |
| `/var/www/github_webhook_receiver.py` | webhook 接收，push 后自动 pull |
| `/var/www/workspace_watcher.py` | workspace 文件监控 |
| `/var/www/morning_briefing.py` | 早朝简报（已改版：CC复盘+学习复盘） |
| `/var/www/outputs/` | /save /ts 生成的 HTML 文件 |
| `/var/log/webhook_build.log` | webhook 触发日志 |

## 模型配置

- 当前：`anthropic/claude-sonnet-4-5-20250929`
- opus-4-6 不可用：飞书场景下 over-thinking 导致 replies=0（空回复）

三层 key 位置（必须全部更新）：
1. `~/.openclaw/openclaw.json` → `agents.defaults.model.primary`
2. `~/.openclaw/agents/taizi/agent/auth-profiles.json`
3. `~/.openclaw/agents/taizi/agent/models.json`

## API 踩坑

1. **`No available accounts` ≠ 余额耗尽**：该模型在 relay 池没账户，先用 `/v1/models` 查可用模型名
2. **中文 prompt**：中转站对纯中文 prompt 可能空回复，用英文 prompt + 要求中文输出
3. **urllib + User-Agent**：feishu_commands.py 已加 `User-Agent: curl/7.88.1` 绕过 403
4. **thinking 块**：解析响应只取 `type=="text"` 的块

## 自动化时刻表

| 北京时间 | 事件 |
|---------|------|
| 06:00 | 早朝简报（CC会话复盘+学习复盘）→ 邮件 |
| 08:00 | VPS 日报（磁盘/内存/服务状态）→ 邮件 |
| 22:00 | 学习回顾（今日 CC 会话总结）→ 邮件 |
| 周日 23:00 | 周汇总 → 邮件 |
| 实时 | 服务告警（Uptime Kuma → 邮件） |
| 5min/push | Docs 站点重建 |
