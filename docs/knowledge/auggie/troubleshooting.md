# Auggie 排错速查

按症状查；找到匹配条目按提示动作。

## 配置层级关系（必须先记住）

调用时优先级 **从高到低**：

```
~/.claude.json mcpServers.auggie.env (AUGMENT_API_TOKEN / AUGMENT_API_URL)
  ↓ 高于
shell env vars (printenv | grep AUGMENT)
  ↓ 高于
~/.augment/session.json (accessToken / tenantURL)
  ↓ 高于
内置 defaults
```

**改 session 不生效 ≈ 99% 是上层有残留。** 排错从上往下查，不要从下往上。

## 症状 1: MCP 调用全 429

```
mcp__auggie__codebase-retrieval → 429 Too Many Requests
```

**第一动作**（不要先改 session.json）：

```bash
jq '.mcpServers.auggie.env' ~/.claude.json
```

不是 `{}` → 改成 `{}`，重启 Claude Code。这是 2026-04-25 踩过 1 天的坑（详见 `../auggie-reseller-investigation-20260425.md`）。

第二动作：

```bash
printenv | grep -i augment
```

有 `AUGMENT_API_TOKEN` / `AUGMENT_API_URL` → 从 `~/.zshrc` / `~/.bashrc` 删，新开 shell。

第三动作：

```bash
jq '.tenantURL, .accessToken' ~/.augment/session.json
```

URL 不是反代地址 / token 不是 `TIAN-` 开头 → 重写 session.json。

## 症状 2: CLI 跑得通，MCP 跑不通

CLI 用的是当前 shell 的 PATH + session.json；MCP 是 Claude Code 启动的子进程，PATH 可能没 `/opt/homebrew/bin`。

```bash
which auggie  # 拿绝对路径
jq '.mcpServers.auggie.command' ~/.claude.json  # 比对
```

`command` 字段必须是绝对路径，不能光写 `"auggie"`。

## 症状 3: 402 Payment Required / out of credits

token 余额耗尽。换一张卡密或充值。CLI 跑 `auggie -p -a -q "test" --show-credits` 看消耗。

注意官方 docs：MCP 检索每次 40-70 credits，没有独立免费额度。

## 症状 4: 检索召回质量差 / relevance < 0.65

不是 token 问题，是 **workspace 选错了**。

- `directory_path` / `-w` 必须指真正含目标代码的 repo，不是 yaml/配置 SSOT 目录
- 跨 monorepo 时只指根，子项目识别失败 → 直接指子目录

立即换 workspace 重问，不要硬刚低质量结果（CLAUDE.md 硬规则）。

## 症状 5: `auggie login` 卡 OAuth

不要跑 `auggie login`。反代场景下 OAuth 走的是官方域校验，会失败。直接写 `session.json`（见 install.md §2）。

## 症状 6: timeout / 反代连不上

```bash
curl -sI -m 5 https://www.augmentproxy.com/tenant-proxy/ | head -3
```

非 2xx/3xx → 反代后端问题，不是本地配置；找运维或卖家。

## 症状 7: indexing 卡死 / 索引整个 ~

```bash
cat ~/.augment/settings.json
```

没有 `indexingAllowDirs` → 加上：

```json
{ "indexingAllowDirs": ["/Users/<you>/Dev"] }
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

四块全绿仍报错 → 反代后端问题。
