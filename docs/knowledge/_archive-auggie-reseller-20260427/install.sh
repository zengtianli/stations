#!/usr/bin/env bash
# Auggie 一键安装 / 配置（幂等，重跑不破坏现有 session）
# 用法: bash install.sh
#       或: TIAN_TOKEN=TIAN-xxx TENANT_URL=https://... bash install.sh

set -euo pipefail

DEFAULT_TENANT="https://www.augmentproxy.com/tenant-proxy/"

say()  { printf '\033[36m▸\033[0m %s\n' "$*"; }
warn() { printf '\033[33m!\033[0m %s\n' "$*" >&2; }
die()  { printf '\033[31m✗\033[0m %s\n' "$*" >&2; exit 1; }

# ── 1. binary ──────────────────────────────────────────────
if ! command -v auggie >/dev/null 2>&1; then
  say "auggie 未安装，npm 全局安装中..."
  command -v npm >/dev/null || die "需要 Node.js + npm，先装 node"
  npm install -g @augmentcode/auggie
else
  say "auggie 已安装: $(auggie --version 2>&1 | head -1)"
fi

AUGGIE_BIN="$(command -v auggie)"
say "binary 路径: $AUGGIE_BIN"

# ── 2. session.json ────────────────────────────────────────
SESSION="$HOME/.augment/session.json"
mkdir -p "$HOME/.augment/archived"

if [[ -f "$SESSION" ]]; then
  ts="$(date +%Y%m%d-%H%M%S)"
  cp "$SESSION" "$HOME/.augment/archived/session.json.bak-$ts"
  say "已备份旧 session → archived/session.json.bak-$ts"
fi

TIAN_TOKEN="${TIAN_TOKEN:-}"
TENANT_URL="${TENANT_URL:-$DEFAULT_TENANT}"

if [[ -z "$TIAN_TOKEN" ]]; then
  printf '\nTIAN- 卡密 (输入后回车，不会回显): '
  read -rs TIAN_TOKEN
  printf '\n'
fi

[[ "$TIAN_TOKEN" =~ ^TIAN- ]] || warn "卡密通常以 TIAN- 开头，确认你输的对"

cat > "$SESSION" <<EOF
{
  "accessToken": "$TIAN_TOKEN",
  "tenantURL": "$TENANT_URL",
  "scopes": ["email"]
}
EOF
chmod 600 "$SESSION"
say "已写入 $SESSION (tenantURL=$TENANT_URL)"

# ── 3. settings.json (索引白名单) ──────────────────────────
SETTINGS="$HOME/.augment/settings.json"
if [[ ! -f "$SETTINGS" ]]; then
  cat > "$SETTINGS" <<EOF
{
  "indexingAllowDirs": ["$HOME/Dev"]
}
EOF
  say "已写入索引白名单 $SETTINGS"
fi

# ── 4. 检查 ~/.claude.json MCP env 残留 ────────────────────
CLAUDE_JSON="$HOME/.claude.json"
if [[ -f "$CLAUDE_JSON" ]] && command -v jq >/dev/null 2>&1; then
  env_val="$(jq -r '.mcpServers.auggie.env // "null"' "$CLAUDE_JSON")"
  if [[ "$env_val" != "{}" && "$env_val" != "null" ]]; then
    warn "~/.claude.json mcpServers.auggie.env 不是 {}，会覆盖 session.json！"
    warn "当前值: $env_val"
    warn "手动改成 \"env\": {} 后再重启 Claude Code"
  else
    say "~/.claude.json mcpServers.auggie.env 检查通过"
  fi
fi

# ── 5. 验证 ────────────────────────────────────────────────
say "跑一发 retrieval 验证..."
if [[ -d "$HOME/Dev/devtools" ]]; then
  TEST_WS="$HOME/Dev/devtools"
elif [[ -d "$HOME/Dev" ]]; then
  TEST_WS="$HOME/Dev"
else
  warn "找不到 ~/Dev 测试 workspace，跳过验证"
  exit 0
fi

if auggie -p -a -q "list any 3 source files" -w "$TEST_WS" 2>&1 | head -20; then
  say "验证通过 ✓"
else
  warn "验证失败 — 看 troubleshooting.md"
  exit 1
fi
