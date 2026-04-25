#!/usr/bin/env bash
set -e
source ~/Dev/devtools/lib/vps_config.sh
REMOTE_DIR="/opt/ops-console"
SERVICE="ops-console"
DOMAIN="dashboard.tianlizeng.cloud"

echo "📊 Rebuild Raycast index (for Hammerspoon page)"
python3 "$(dirname "$0")/scripts/build_raycast_index.py" || echo "  · build_raycast_index.py failed, using stale index"

echo "🧹 Clean build"
rm -rf .next

echo "📦 Build"
pnpm build

echo "📂 Ensure remote dir"
ssh "$VPS" "mkdir -p $REMOTE_DIR"

echo "📦 Rsync standalone (--delete would wipe data/, so do data dir AFTER)"
rsync -avzL --delete --exclude=data .next/standalone/ "$VPS:$REMOTE_DIR/"
rsync -avz --delete .next/static/ "$VPS:$REMOTE_DIR/.next/static/"
rsync -avz --delete public/ "$VPS:$REMOTE_DIR/public/" 2>/dev/null || true

echo "📂 Create data dir (post-rsync)"
ssh "$VPS" "mkdir -p $REMOTE_DIR/data"

echo "📊 Sync data files (Auggie scan + hs_config)"
# Prefer local dev copies (fresher than whatever's on VPS)
for spec in \
  "$HOME/Dev/labs/auggie-dashboard/data/scan.json:auggie-scan.json" \
  "$HOME/Dev/stations/ops-console/data/hs_config.json:hs_config.json" \
  "$HOME/Dev/stations/ops-console/data/raycast_index.json:raycast_index.json" \
; do
  src="${spec%%:*}"
  name="${spec##*:}"
  if [ -f "$src" ]; then
    scp -q "$src" "$VPS:$REMOTE_DIR/data/$name"
    echo "  · $name synced from $src"
  else
    echo "  · skipped $name (no local source)"
  fi
done

echo "⚙️  Ensure systemd unit"
ssh "$VPS" "set -e
  if [ ! -f /etc/systemd/system/$SERVICE.service ]; then
    cat > /etc/systemd/system/$SERVICE.service <<UNITEOF
[Unit]
Description=Ops Console (Next.js)
After=network.target

[Service]
Type=simple
WorkingDirectory=$REMOTE_DIR
Environment=NODE_ENV=production PORT=8520 HOSTNAME=127.0.0.1
ExecStart=/usr/bin/node $REMOTE_DIR/server.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
UNITEOF
    systemctl daemon-reload
    systemctl enable $SERVICE
  fi
"

echo "🔄 Stop old repo-dashboard, start ops-console on port 8520"
ssh "$VPS" "systemctl stop repo-dashboard 2>/dev/null || true; systemctl restart $SERVICE"

echo "🔍 Verify"
sleep 3
CODE=$(curl --noproxy '*' -s -o /dev/null -w '%{http_code}' https://$DOMAIN)
echo "HTTP $CODE  https://$DOMAIN"
if [ "$CODE" != "200" ] && [ "$CODE" != "302" ]; then
  echo "❌ Non-OK status. Check: ssh $VPS journalctl -u $SERVICE -n 40"
  exit 1
fi
echo "✅ Deploy OK"
