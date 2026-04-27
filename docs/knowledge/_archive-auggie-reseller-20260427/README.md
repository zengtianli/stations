# Auggie 反代时代档案 · 已归档（2026-04-27）

> **本目录是历史档案，配置已不再适用。** 2026-04-27 切到正版 [Augment Code Indie Plan](https://app.augmentcode.com/account/subscription)（40k credits/月，$20）。新流程见 `docs/knowledge/auggie/`（Phase 4 立的正版 playbook）。

## 时间线

- **~2026-04 之前**：通过第三方反代 `augmentproxy.com/tenant-proxy/` + 卡密（`MON-` / `TIAN-` 前缀）调用 Augment 后端，按月充值 5w credits 左右
- **2026-04-25**：MCP 全 429 弯路 1 天，根因在 `~/.claude.json` mcpServers.auggie.env 残留 deprecated env vars（`AUGMENT_API_TOKEN` / `AUGMENT_API_URL`）优先于 session.json
- **2026-04-27**：充值正版 Indie Plan，反代相关全部归档（本目录）

## 文件清单

| 文件 | 说明 |
|---|---|
| `install.md` | 反代版 auggie 安装/登录流程（手写 session.json + 卡密） |
| `install.sh` | 一键安装脚本（反代版） |
| `README-OLD.md` | 旧版目录 README |
| `session.json.example` | 反代版 session.json 模板（tenantURL=augmentproxy） |
| `troubleshooting.md` | 反代版排错速查（429 / 402 / 反代连不上） |
| `auggie-reseller-investigation-20260425.md` | 4-25 弯路完整调查 |
| `session-retro-20260425-auggie-mcp-fix.md` | 4-25 修复 retro |

## 仍然有效的部分（未归档）

- `~/Dev/stations/docs/knowledge/session-retro-20260420-auggie-mcp-ops.md` — MCP 通用操作经验
- `~/Dev/stations/docs/knowledge/session-retro-20260427-auggie-workspace-registry.md` — workspace dispatch 协议（正版仍 SSOT）
- `~/Dev/tools/configs/auggie-workspaces.yaml` — workspace 注册表
- 场景判别表（CLI / MCP / Grep / Read 选哪个）— 与凭证形态无关，保留在 `~/.claude/CLAUDE.md`

## 为什么保留

`/critique` 风险审计要溯源；本目录所有内容禁止当作当前指令使用。
