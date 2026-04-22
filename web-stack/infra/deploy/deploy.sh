#!/usr/bin/env bash
# Deploy a single site: FastAPI (from ~/Dev/<name>) + Next.js (from web-stack/apps/<name>-web).
#
# Usage:
#   bash deploy.sh <name> [--fast] [--no-build|--force-build]
#
# Flags:
#   --fast          Skip public verify.py (step [7/8]); instead extend step [5] smoke
#                   with an ssh-local bundle-clean check. Mirrors verify.py check [2]
#                   but over VPS localhost so SSL handshake latency (~4-8s/fetch × 3
#                   = ~15-25s) is avoided. Use for rapid iteration; drop for "ship it".
#   --no-build      Skip pnpm build unconditionally (use when you know it's Python-only).
#   --force-build   Force pnpm build even if standalone looks fresh.
#   (default)       mtime-aware: build only if standalone is older than app/ components/
#                   package.json tsconfig*.json next.config.*.
#
# Env:
#   TLZ_SKIP_GLOBAL_SYNC=1   Skip step [0] devtools/lib rsync (set by deploy-batch.sh).
#   VPS=root@...             Override VPS host.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# web-stack root, derived from script location so this works whether the repo
# lives at ~/Dev/web-stack or ~/Dev/stations/web-stack.
WEB_STACK_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
# shellcheck source=ports.sh
source "$SCRIPT_DIR/ports.sh"

# --- parse args ---
NAME=""
FAST=0
NO_BUILD=0
FORCE_BUILD=0
for arg in "$@"; do
  case "$arg" in
    --fast) FAST=1 ;;
    --no-build) NO_BUILD=1 ;;
    --force-build) FORCE_BUILD=1 ;;
    -*) echo "unknown flag: $arg" >&2; exit 1 ;;
    *) [[ -z "$NAME" ]] && NAME="$arg" || { echo "extra arg: $arg" >&2; exit 1; } ;;
  esac
done
[[ -n "$NAME" ]] || { echo "usage: deploy.sh <site-name> [--fast] [--no-build|--force-build]" >&2; exit 1; }
(( NO_BUILD && FORCE_BUILD )) && { echo "--no-build and --force-build are mutually exclusive" >&2; exit 1; }

VPS="${VPS:-root@104.218.100.67}"

API_PORT=$(api_port "$NAME")
WEB_PORT=$(web_port "$NAME")
LEGACY_PORT=$(streamlit_port "$NAME")

SRC_PY="$WEB_STACK_ROOT/services/$NAME"
SRC_WEB="$WEB_STACK_ROOT/apps/${NAME}-web"
SRC_WEB_STANDALONE="$SRC_WEB/.next/standalone"
SRC_WEB_STATIC="$SRC_WEB/.next/static"
SRC_WEB_PUBLIC="$SRC_WEB/public"

[[ -d "$SRC_PY" ]] || { echo "missing $SRC_PY"; exit 1; }
[[ -d "$SRC_WEB" ]] || { echo "missing $SRC_WEB — is it a Next.js app?"; exit 1; }

# --- conditional build (mtime-aware) ---
# Skip `pnpm build` if standalone/server.js exists and is newer than every source we care
# about (app/, components/, package.json, tsconfig*.json, next.config.*). Saves ~30-60s
# per site when only Python or sibling sites changed.
build_needed() {
  (( FORCE_BUILD )) && return 0
  (( NO_BUILD )) && return 1
  local sentinel="$SRC_WEB_STANDALONE/server.js"
  [[ -f "$sentinel" ]] || return 0
  local src
  for src in "$SRC_WEB/app" "$SRC_WEB/components" "$SRC_WEB/package.json" \
             "$SRC_WEB"/tsconfig*.json "$SRC_WEB"/next.config.*; do
    [[ -e "$src" ]] || continue
    if [[ -d "$src" ]]; then
      # any file inside newer than sentinel?
      if [[ -n "$(find "$src" -type f -newer "$sentinel" -print -quit 2>/dev/null)" ]]; then
        return 0
      fi
    else
      [[ "$src" -nt "$sentinel" ]] && return 0
    fi
  done
  return 1
}

if build_needed; then
  echo ">>> Building $NAME-web..."
  (cd "$WEB_STACK_ROOT" && pnpm --filter "${NAME}-web" build)
else
  echo ">>> Skipping pnpm build (standalone up to date; use --force-build to override)"
fi

REMOTE_PY="/var/www/web-stack/services/$NAME"
REMOTE_WEB="/var/www/${NAME}-web"

if [[ "${TLZ_SKIP_GLOBAL_SYNC:-0}" == "1" ]]; then
  echo ">>> [0/7] Skipping global devtools/lib sync (TLZ_SKIP_GLOBAL_SYNC=1)"
else
  bash "$SCRIPT_DIR/sync-global.sh"
fi

echo ">>> [1/7] Syncing Python ($NAME) → $VPS:$REMOTE_PY"
ssh "$VPS" "mkdir -p $REMOTE_PY"
# IMPORTANT: no --delete — VPS may have .venv or data/ mounted that we don't want to wipe.
rsync -az \
  --exclude '.git' --exclude '.venv' --exclude 'node_modules' \
  --exclude '__pycache__' --exclude '*.pyc' \
  --exclude '.next' --exclude '.turbo' \
  "$SRC_PY/" "$VPS:$REMOTE_PY/"

echo ">>> [2/7] Fixing standalone pnpm symlinks (Next.js 15 + pnpm trace quirk)"
# Next.js standalone 下 .pnpm/ 里有包但顶层 node_modules 没 symlink，
# server.js require('styled-jsx/package.json') 等会 MODULE_NOT_FOUND。
# 给每个 .pnpm/<entry> 的主包在顶层 node_modules 建 symlink 还原 pnpm 结构。
node ~/Dev/devtools/lib/fix-standalone-pnpm-symlinks.js "$SRC_WEB_STANDALONE"

echo ">>> [2/7] Syncing Next.js standalone → $VPS:$REMOTE_WEB"
ssh "$VPS" "mkdir -p $REMOTE_WEB"
rsync -az --delete "$SRC_WEB_STANDALONE/" "$VPS:$REMOTE_WEB/"
rsync -az "$SRC_WEB_STATIC/" "$VPS:$REMOTE_WEB/apps/${NAME}-web/.next/static/" 2>/dev/null || \
rsync -az "$SRC_WEB_STATIC/" "$VPS:$REMOTE_WEB/.next/static/"
[[ -d "$SRC_WEB_PUBLIC" ]] && rsync -az "$SRC_WEB_PUBLIC/" "$VPS:$REMOTE_WEB/public/"

echo ">>> [3/7] Writing port env files"
ssh "$VPS" "mkdir -p /etc/tlz/ports && echo 'PORT=$API_PORT' > /etc/tlz/ports/$NAME.env && echo 'PORT=$WEB_PORT' > /etc/tlz/ports/$NAME-web.env"

echo ">>> [4/7] pip deps + systemd restart"
# VPS uses system python3; fastapi/uvicorn/pandas/numpy/openpyxl already installed.
# Any new deps added by stack_migrate: python-multipart (for UploadFile). Idempotent install.
ssh "$VPS" "pip3 install -q fastapi uvicorn python-multipart --break-system-packages 2>/dev/null || pip3 install -q fastapi uvicorn python-multipart"
ssh "$VPS" "systemctl daemon-reload && systemctl enable --now tlz-api@$NAME tlz-web@$NAME && systemctl restart tlz-api@$NAME tlz-web@$NAME"

echo ">>> [5/7] Smoke test"
sleep 2
ssh "$VPS" "curl -fsS http://127.0.0.1:$API_PORT/api/health && echo ' [api ok]'" || echo "!! api health failed"
ssh "$VPS" "curl -fsSI http://127.0.0.1:$WEB_PORT/ | head -1" || echo "!! web failed"

if (( FAST )); then
  echo ">>> [5b] Fast gate: ssh-local bundle clean check (replaces verify.py)"
  # Mirror verify.py check [2]: fetch / from VPS localhost, then grep page-*.js bundle for
  # dev URL leaks (127.0.0.1:port / localhost:port baked into production build).
  # Saves the ~15-25s of public HTTPS handshakes that verify.py does.
  if ! ssh "$VPS" WEB_PORT="$WEB_PORT" bash -s <<'SSH'
set -eo pipefail
HTML=$(curl -fsS "http://127.0.0.1:$WEB_PORT/")
echo "$HTML" | grep -q "_next/static" || { echo "!! [fast] no _next/static in HTML"; exit 1; }
BUNDLE=$(echo "$HTML" | grep -oE "_next/static/chunks/app/page-[a-f0-9]+\.js" | head -1)
[[ -n "$BUNDLE" ]] || { echo "!! [fast] no app/page-*.js ref in HTML"; exit 1; }
LEAKS=$(curl -fsS "http://127.0.0.1:$WEB_PORT/$BUNDLE" | grep -oE "127\.0\.0\.1:[0-9]+|localhost:[0-9]+" | sort -u || true)
if [[ -n "$LEAKS" ]]; then
  echo "!! [fast] bundle has dev URLs baked in: $LEAKS"
  exit 1
fi
echo "  [fast] bundle clean ($BUNDLE)"
SSH
  then
    echo "!! fast gate failed — rerun without --fast for full verify.py diagnosis"
    exit 2
  fi
fi

echo ">>> [6/7] Summary (devtools/lib synced)"
echo "  API:    127.0.0.1:$API_PORT  (tlz-api@$NAME)"
echo "  Web:    127.0.0.1:$WEB_PORT  (tlz-web@$NAME)"
echo "  Legacy: 127.0.0.1:$LEGACY_PORT  (original Streamlit, unchanged)"
echo "  URL:    https://$NAME.tianlizeng.cloud"

if (( FAST )); then
  echo ">>> [7/8] Skipped (--fast; step [5b] ran ssh-local bundle check instead)"
  exit 0
fi

echo ">>> [7/8] Browser-like verification (mandatory gate)"
# Memory rule: feedback_web_deploy_verify.md — API 200 is NOT enough, check bundle + UI fetch
VERIFY_ARGS=("$NAME")
# Per-site overrides: toolkit served at hydro.tianlizeng.cloud + endpoint is /api/plugins
case "$NAME" in
  hydro-toolkit) VERIFY_ARGS+=(--domain hydro --api-path /api/plugins --required-field name) ;;
esac
if ! python3 "$SCRIPT_DIR/verify.py" "${VERIFY_ARGS[@]}"; then
  echo ""
  echo "!! verify.py FAILED — do not report success until all checks pass."
  echo "!! Common causes: .env.local baked dev URLs into bundle; fetch URL wrong; CORS origin mismatch."
  exit 2
fi
