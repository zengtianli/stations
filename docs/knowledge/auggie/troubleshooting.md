# Auggie 正版排错速查

按症状查；找到匹配条目按提示动作。**反代时代的 troubleshooting 在 `../_archive-auggie-reseller-20260427/troubleshooting.md`，部分症状（429/低 relevance）共通，但根因排查路径不一样。**

## 配置层级关系（必须先记住）

调用时优先级 **从高到低**：

```
~/.claude.json mcpServers.auggie.env (AUGMENT_API_TOKEN / AUGMENT_API_URL)
  ↓ 高于
shell env vars (printenv | grep AUGMENT)
  ↓ 高于
~/.augment/session.json (OAuth 写入：accessToken / tenantURL)
  ↓ 高于
内置 defaults
```

**`auggie login` 不生效 ≈ 99% 是上层有 deprecated env 残留。** 排错从上往下查。

## 症状 1: MCP 调用全 401/429

```
mcp__auggie__codebase-retrieval → 401 Unauthorized / 429 Too Many Requests
```

**第一动作**（不要先 `auggie login` 重试）：

```bash
jq '.mcpServers.auggie.env' ~/.claude.json
```

不是 `{}` → 改成 `{}`，重启 Claude Code。这是 2026-04-25 反代时代踩过 1 天的坑，正版仍然适用。

第二动作：

```bash
printenv | grep -i augment
```

有 `AUGMENT_API_TOKEN` / `AUGMENT_API_URL` → 从 `~/.zshrc` / `~/.bashrc` 删，新开 shell。

第三动作：

```bash
jq '.tenantURL' ~/.augment/session.json
```

不是 augmentcode.com 域 → 残留反代 session，跑 `auggie logout && auggie login` 重新走 OAuth。

## 症状 2: CLI 跑得通，MCP 跑不通

CLI 用的是当前 shell 的 PATH + session.json；MCP 是 Claude Code 启动的子进程，PATH 可能没 `/opt/homebrew/bin`。

```bash
which auggie  # 拿绝对路径
jq '.mcpServers.auggie.command' ~/.claude.json  # 比对
```

`command` 字段必须是绝对路径，不能光写 `"auggie"`。

## 症状 3: 402 Payment Required / out of credits

Indie Plan 40k credits/月用完了。看：

```
https://app.augmentcode.com/account/subscription
```

- 还在订阅期 → 等次月重置（每月 X 号充值，看 Billing 页）
- 已 cancel（如本号 5/27/26 转 Free Plan）→ 网页 "Undo Subscription Cancellation" 续订，或忍到下个 cycle
- Free Plan credits 极少 → 跨文件搜全走 Grep + Read 兜底

## 症状 4: 检索召回质量差 / relevance < 0.65

不是 token 问题，是 **workspace 选错了**。

- `directory_path` / `-w` 必须指真正含目标代码的 repo，不是 yaml/配置 SSOT 目录
- 跨 monorepo 时只指根，子项目识别失败 → 直接指子目录
- 查注册表：`python3 ~/Dev/devtools/lib/tools/auggie_workspaces.py resolve <id>`

立即换 workspace 重问，不要硬刚低质量结果（CLAUDE.md 硬规则）。

## 症状 5: `auggie login` 浏览器卡住 / OAuth 死循环

```bash
auggie logout
rm -f ~/.augment/session.json
auggie login
```

仍卡 → 浏览器隐身模式重试（Cookie 冲突）。Cloudflare/代理影响 OAuth callback → 临时关 ClashX 系统代理。

## 症状 6: indexing 卡死 / 索引整个 ~

```bash
cat ~/.augment/settings.json
```

没有 `indexingAllowDirs` → 加上：

```json
{ "indexingAllowDirs": ["/Users/<you>/Dev"] }
```

## 症状 7: `auggie` interactive 模式（无 -p）首启 confirmation 卡住

正常行为：进 chat 模式时弹 indexing confirmation。加 `--allow-indexing` 跳过：

```bash
auggie --allow-indexing -w ~/Dev/<repo>
```

## 完整诊断脚本

```bash
echo "=== binary ==="
which auggie && auggie --version

echo "=== session ==="
jq '{tenantURL, scopes, hasToken: (.accessToken | length > 0)}' ~/.augment/session.json

echo "=== MCP env (must be {}) ==="
jq '.mcpServers.auggie.env' ~/.claude.json

echo "=== shell env leak ==="
printenv | grep -i augment || echo "none ✓"

echo "=== smoke ==="
auggie -p -a -q "list 3 files" -w ~/Dev/devtools 2>&1 | head -10
```

四块全绿仍报错 → 看 [augmentcode.com/status](https://status.augmentcode.com/) 后端是否挂了。
