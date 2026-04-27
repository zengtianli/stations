# Auggie 安装 / 登录 / 排错索引

`auggie` (Augment Code CLI) 在本机的所有踩坑、安装步骤、登录方式、配置层级关系都收在本目录。

## 当前生效配置（2026-04-26）

- **二进制**：`/opt/homebrew/bin/auggie` → `lib/node_modules/@augmentcode/auggie/augment.mjs`（npm 包 `@augmentcode/auggie`）
- **接入路径**：augmentproxy 自部署反代 + TIAN- 卡密（**不走** `auggie login` OAuth）
- **会话文件**：`~/.augment/session.json`
- **MCP 注册**：`~/.claude.json` → `mcpServers.auggie`，**`env` 必须为 `{}`**
- **CLAUDE.md 使用规范**：`~/.claude/CLAUDE.md` § auggie 使用规范

## 文件清单

| 文件 | 用途 |
|---|---|
| [install.md](install.md) | 从零开始：npm 安装 → 写 session → 配 MCP → 验证 |
| [install.sh](install.sh) | 一键脚本（交互式填卡密；幂等，可重跑） |
| [session.json.example](session.json.example) | session.json 模板（占位 token） |
| [troubleshooting.md](troubleshooting.md) | 429 / 402 / 低 relevance / env 优先级踩坑速查 |

## 历史调查（深度背景）

- `../auggie-reseller-investigation-20260425.md` — 灰产中转调查 → 自部署反代落地全过程
- `../session-retro-20260425-auggie-mcp-fix.md` — MCP 恢复 retro
- `../session-retro-20260420-auggie-mcp-ops.md` — 首次 MCP ops 设置

## 快速诊断

```bash
# 1. binary 在不在
which auggie && auggie --version

# 2. session 是不是反代
jq '.tenantURL' ~/.augment/session.json
# 期望: "https://www.augmentproxy.com/tenant-proxy/"

# 3. MCP env 是不是空（关键陷阱！）
jq '.mcpServers.auggie.env' ~/.claude.json
# 期望: {}

# 4. 检索能不能跑
auggie -p -a -q "list top-level commands" -w ~/Dev/devtools
```
