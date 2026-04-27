# Auggie 正版安装与登录（OAuth）

> 目标：换新机 / 重装系统 / 帮别人配。**正版 Augment Code Indie Plan**（[app.augmentcode.com](https://app.augmentcode.com/account/subscription)，$20，40k credits/月）。
> 反代时代档案在 `../_archive-auggie-reseller-20260427/`，配置不通用，别套用。

## 0. 前置

- Node.js ≥ 18（brew `node` 或 nvm 都行；用 nvm 时记下绝对路径）
- 已注册 augmentcode.com 账号 + 订阅了 Indie Plan（或起码 Free Plan，credits 见 subscription 页）

## 1. 安装 binary

```bash
npm install -g @augmentcode/auggie
auggie --version   # 应该 ≥ 0.30
which auggie       # 记下绝对路径，MCP 注册时要用
```

brew 装 node 通常是 `/opt/homebrew/bin/auggie`；nvm 是 `~/.nvm/versions/node/<ver>/bin/auggie`。

## 2. 登录（OAuth）

```bash
auggie login
```

会弹浏览器到 `app.augmentcode.com/auth/...`，已登录的账号点 Authorize → 终端自动写 `~/.augment/session.json`：

```json
{
  "accessToken": "<official-jwt>",
  "tenantURL": "https://app.augmentcode.com/...",
  "scopes": ["..."]
}
```

**不要手写 session.json**（反代时代才需要）；OAuth 自动写最稳。

可选索引白名单（防 auggie 索引整盘）：

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

期望：返回多个真实代码段引用 + 文件路径。401/429 → 见 [troubleshooting.md](troubleshooting.md)。

查看 credits 余额：[app.augmentcode.com/account/subscription](https://app.augmentcode.com/account/subscription)。

## 4. 注册 MCP（Claude Code 用）

编辑 `~/.claude.json`，在 `mcpServers` 加：

```json
{
  "mcpServers": {
    "auggie": {
      "command": "/Users/tianli/.nvm/versions/node/v22.21.1/bin/auggie",
      "args": ["--mcp", "--mcp-auto-workspace"],
      "env": {}
    }
  }
}
```

**关键陷阱：`env` 必须 `{}`**。任何 `AUGMENT_API_TOKEN` / `AUGMENT_API_URL` env var 都会**优先于** `session.json` 且走 deprecated 路径，结果就是无论怎么 `auggie login` 都 401/429。2026-04-25 因此踩过 1 天弯路（详见 `../_archive-auggie-reseller-20260427/auggie-reseller-investigation-20260425.md`，反代时代但根因相同）。

`command` 用第 1 步 `which auggie` 拿到的**绝对路径**，不要写 `"auggie"`（CC spawn 时 PATH 不一定有 npm 全局 bin）。

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
- **登录 session 备份**：`cp ~/.augment/session.json ~/.augment/archived/session.json.bak-$(date +%Y%m%d-%H%M%S)`
- **不要把 token 写进 shell rc**：`~/.zshrc` 不设 `AUGMENT_*` env，永远靠 OAuth + session.json

## 7. 排错入口

任何异常先按 [troubleshooting.md](troubleshooting.md) 的诊断树走一遍：

1. binary 存在 + 版本对
2. `~/.augment/session.json` 是 augmentcode.com 官方 URL
3. `~/.claude.json` mcpServers.auggie.env 是 `{}`
4. printenv 没有 AUGMENT_* 残留
5. CLI 直跑能不能过

四层都对仍报错 → 看 [chat-cli-mcp-usage.md](chat-cli-mcp-usage.md) 选错工具，或 augmentcode.com status 页。
