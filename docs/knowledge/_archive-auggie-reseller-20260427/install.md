# Auggie 安装与登录（从零）

> 目标受众：换新机 / 重装系统 / 帮别人配。读完照做能起一个能用的 auggie CLI + Claude Code MCP 检索。

## 0. 前置

- Node.js ≥ 18（brew `node` 或 nvm 都行；用 nvm 时记下绝对路径）
- 已有 augmentproxy 反代地址 + 卡密（自部署或卖家发的；前缀随发行批次变化，见过 `TIAN-` / `MON-` 等）

## 1. 安装 binary

```bash
npm install -g @augmentcode/auggie
auggie --version   # 应该 ≥ 0.24
which auggie       # 记下绝对路径，MCP 注册时要用
```

brew 装 node 的路径通常是 `/opt/homebrew/bin/auggie`；nvm 是 `~/.nvm/versions/node/<ver>/bin/auggie`。

## 2. 配置会话（关键步骤）

**首选：augmentproxy 自家的交互登录脚本**（自动验证卡密、列节点、写 session.json）：

```bash
curl -sL "https://www.augmentproxy.com/cli_login_interactive.js" -o /tmp/l.js \
  && node /tmp/l.js \
  && rm /tmp/l.js
```

按提示输卡密 → 选节点（延迟最低的那个）→ 自动写入 `~/.augment/session.json`。这条比手写 JSON 稳，会顺带告诉你余额和过期时间。

**不要跑 `auggie login`** —— 那是官方 OAuth 流程，配反代会被域校验拦下来。

如果交互脚本不可用 / 想完全离线，手写 `~/.augment/session.json`：

```bash
mkdir -p ~/.augment
cat > ~/.augment/session.json <<'EOF'
{
  "accessToken": "MON-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "tenantURL": "https://www.augmentproxy.com/tenant-proxy/",
  "scopes": ["email"]
}
EOF
chmod 600 ~/.augment/session.json
```

字段说明：
- `accessToken`：augmentproxy 卡密本身就是 token（前缀随批次变；`TIAN-` / `MON-` 都见过），无需另外换
- `tenantURL`：必须末尾带斜杠；用自己的反代域名（卖家给的也行，但隐私走第三方）
- `scopes`：固定 `["email"]`

可选索引白名单（防止 auggie 索引 `~` 整盘）：

```bash
cat > ~/.augment/settings.json <<'EOF'
{
  "indexingAllowDirs": ["/Users/$(whoami)/Dev"]
}
EOF
```

## 3. 验证 CLI

```bash
auggie -p -a -q "list paths.py CLI subcommands" -w ~/Dev/devtools
```

期望：返回多个真实代码段引用 + 文件路径。如果返 `429 / 402 / out of credits` → 见 [troubleshooting.md](troubleshooting.md)。

## 4. 注册 MCP（Claude Code 用）

编辑 `~/.claude.json`，在 `mcpServers` 加：

```json
{
  "mcpServers": {
    "auggie": {
      "command": "/opt/homebrew/bin/auggie",
      "args": ["--mcp", "--mcp-auto-workspace"],
      "env": {}
    }
  }
}
```

**关键陷阱：`env` 必须 `{}`**。任何 `AUGMENT_API_TOKEN` / `AUGMENT_API_URL` env var 都会**优先于** `session.json` 且走 deprecated 路径，结果就是无论怎么改 session 都 429。2026-04-25 因此踩过 1 天弯路（详见 `auggie-reseller-investigation-20260425.md`）。

`command` 用第 1 步 `which auggie` 拿到的**绝对路径**，不要用 `auggie`（CC spawn 时 PATH 不一定有 npm 全局 bin）。

## 5. 验证 MCP

重启 Claude Code 后在新会话里调用：

```
mcp__auggie__codebase-retrieval
  directory_path: ~/Dev/devtools
  information_request: list paths.py CLI subcommands
```

期望：返回带 `relevance` 字段的多个代码段。低于 0.65 → workspace 选错了，换路径重问。

## 6. 加固（可选）

- **CLAUDE.md 使用规范**：`~/.claude/CLAUDE.md` 已写好「auggie 优先」与「失败立即报告」纪律，新机器 sync 这份就行
- **archived 历史 session 备份**：旧 session 切换前 `cp ~/.augment/session.json ~/.augment/archived/session.json.bak-$(date +%Y%m%d-%H%M%S)` 留底
- **不要把卡密写进 shell rc**：`~/.zshrc` 不设 `AUGMENT_*` env，永远靠 session.json

## 7. 排错入口

任何异常先按 [troubleshooting.md](troubleshooting.md) 的诊断树走一遍：

1. binary 存在 + 版本对
2. `~/.augment/session.json` 是反代 URL
3. `~/.claude.json` mcpServers.auggie.env 是 `{}`
4. printenv 没有 AUGMENT_* 残留
5. CLI 直跑能不能过

四层都对仍 429 → 反代后端问题，找运维/卖家。
