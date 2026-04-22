#!/bin/bash
# cc-options 数据同步（本地 → VPS）
#
# 金融安全：永不 rsync .env / .venv / data/*.raw.* / settings。
# 只传 3 个产物：portfolio.json / activities.json / daily_nlv.csv。
#
# 由 daily_update.sh 在本地 17:00 触发（LaunchAgent）。也可以手动跑。
set -euo pipefail

source ~/Dev/devtools/lib/vps_config.sh
REMOTE_DATA="/var/www/cc-options/data"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cd "$SCRIPT_DIR"

echo "→ Ensuring remote data dir exists: $REMOTE_DATA"
ssh "$VPS" "mkdir -p $REMOTE_DATA"

echo "→ Syncing 3 data artifacts (whitelist, no .env/.raw.*)"
MISSING=0
for f in portfolio.json activities.json daily_nlv.csv; do
  if [ ! -f "data/$f" ]; then
    echo "  ⚠ data/$f not found locally — skip (daily_update.sh 有没有跑过？)"
    MISSING=$((MISSING + 1))
    continue
  fi
  rsync -avz "data/$f" "$VPS:$REMOTE_DATA/$f"
done

if [ $MISSING -gt 0 ]; then
  echo "⚠ $MISSING file(s) missing — VPS 数据可能不完整"
  exit 1
fi

echo "✓ Data synced. VPS /api/meta 可查新鲜度："
echo "  curl https://cc-options.tianlizeng.cloud/api/meta"
