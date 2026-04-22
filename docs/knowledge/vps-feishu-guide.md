# 飞书 Bot 使用指南

## 架构

```
你（飞书 App）→ 飞书服务器 → OpenClaw Gateway（VPS:18789）→ 太子 Agent（Claude API）→ 回复
                                                                    ↓（快捷指令时）
                                                              feishu_commands（VPS:9002）
```

## 找到 Bot

飞书搜索 **OpenClaw**，或打开历史对话。

> 找不到时：飞书开放平台 → 应用 → `cli_a925c58f64f95cc7` → 版本管理 → 确保已上线

## 快捷指令

| 指令 | 效果 |
|------|------|
| `/rebuild` 或 `重建` | 重建 docs.tianlizeng.cloud 站点 |
| `/status` 或 `状态` | VPS 磁盘/内存/服务状态 |
| `/review` 或 `回顾` | 生成今日 CC 学习回顾并发邮件 |
| `/morning` 或 `早朝` | 手动触发早朝简报（每天 06:00 自动发） |
| `/clear` 或 `清空` | 清空太子对话历史 |
| `/log [服务名]` 或 `日志` | 查看服务日志 |
| `/restart [服务名]` 或 `重启` | 重启服务 |
| `/git [repo名]` 或 `拉取` | git pull 指定 repo |
| `/save 标题\n内容` 或 `保存` | 保存内容为网页，返回 HTTPS 链接 |
| `/ts 内容` | 翻译（中↔英自动判断），返回链接 |
| `/help` 或 `帮助` | 显示所有指令 |

## 快速验证

在飞书发 `/help`，预期收到指令列表。

## 排查

```bash
# 1. 服务是否在跑
ssh root@104.218.100.67 "systemctl is-active feishu-commands && ps aux | grep openclaw | grep -v grep"

# 2. 手动测试指令路由
ssh root@104.218.100.67 'curl -s -X POST http://127.0.0.1:9002/ \
  -H "Content-Type: application/json" \
  -d "{\"command\": \"/status\"}" | python3 -m json.tool'

# 3. 查 openclaw 日志
ssh root@104.218.100.67 "npx openclaw logs --limit 100 --token 9e9f284a6a4d1424d4020e086219bb352186da63b871092a"

# 4. 重启 openclaw
ssh root@104.218.100.67 "systemctl --user restart openclaw-gateway"
```

### 指令不生效（太子没有调用 feishu_commands）

先查日志确认 feishu_commands 是否收到请求：
```bash
ssh root@104.218.100.67 "journalctl -u feishu-commands -n 30 --no-pager"
```

如果完全没收到请求 → 问题在 SOUL.md 没有正确的路由规则。检查：
```bash
ssh root@104.218.100.67 "grep -n 'curl.*9002\|快捷指令' /opt/edict/agents/taizi/SOUL.md | head -5"
```

## SOUL.md 修改注意

edict-refresh 每 15s 自动覆盖 `~/.openclaw/agents/main/SOUL.md`，改 SOUL.md 必须改源文件：

```bash
# 本地改（推荐）：
vim ~/Dev/vps-scripts  # 不存在，edict 在 VPS 上
# 正确路径：
ssh root@104.218.100.67 "vim /opt/edict/agents/taizi/SOUL.md"

# 改完手动同步（否则等 15s 自动同步）
ssh root@104.218.100.67 "cd /opt/edict && python3 scripts/sync_agent_config.py"
```

edict 仓库 remote 是 `zengtianli/edict`，push 后 webhook 自动 pull /opt/edict 并同步 SOUL.md。

## 自动化时刻表

| 北京时间 | 事件 |
|---------|------|
| 06:00 | 早朝简报（CC会话复盘+学习复盘）→ 邮件 |
| 08:00 | VPS 日报（磁盘/内存/服务状态）→ 邮件 |
| 22:00 | 学习回顾（今日 CC 会话总结）→ 邮件 |
| 周日 23:00 | 周汇总 → 邮件 |
| 实时 | 服务告警（Uptime Kuma → 邮件） |
| 5min/push | Docs 站点重建 |
