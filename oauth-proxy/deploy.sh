#!/bin/bash
set -e

source ~/Dev/devtools/lib/vps_config.sh
REMOTE_DIR="/var/www/oauth-proxy"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Parse flags
BACKEND_ONLY=false
NO_RESTART=false
for arg in "$@"; do
  case $arg in
    --backend-only) BACKEND_ONLY=true ;;
    --no-restart)   NO_RESTART=true ;;
  esac
done

# Build frontend (unless --backend-only)
if [ "$BACKEND_ONLY" = false ] && [ -d "$SCRIPT_DIR/frontend" ]; then
  echo ">>> 构建前端..."
  cd "$SCRIPT_DIR/frontend" && npm run build
  cd "$SCRIPT_DIR"
fi

# Sync files
echo ">>> 同步文件到 VPS..."
ssh $VPS "mkdir -p $REMOTE_DIR/frontend"
scp "$SCRIPT_DIR/oauth_proxy.py" "$SCRIPT_DIR/config.json" $VPS:$REMOTE_DIR/

if [ "$BACKEND_ONLY" = false ] && [ -d "$SCRIPT_DIR/frontend/dist" ]; then
  echo ">>> 同步前端 dist..."
  scp -r "$SCRIPT_DIR/frontend/dist" $VPS:$REMOTE_DIR/frontend/
fi

# Restart (unless --no-restart)
if [ "$NO_RESTART" = false ]; then
  echo ">>> 重启服务..."
  ssh $VPS "systemctl restart oauth-proxy"
  ssh $VPS "systemctl status oauth-proxy --no-pager -l"
fi

echo ">>> 部署完成 ✓"
