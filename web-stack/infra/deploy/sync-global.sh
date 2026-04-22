#!/usr/bin/env bash
# Sync shared ~/Dev/devtools/lib → VPS:/var/www/devtools/lib
# Extracted from deploy.sh step [0] so batch deploys can run it once instead of N times.
#
# Usage:
#   bash sync-global.sh                      # sync now
#   TLZ_SKIP_GLOBAL_SYNC=1 bash deploy.sh x  # skip from caller
set -euo pipefail

VPS="${VPS:-root@104.218.100.67}"

echo ">>> [global] Syncing shared devtools/lib → $VPS:/var/www/devtools/lib"
ssh "$VPS" "mkdir -p /var/www/devtools/lib"
rsync -az --delete --exclude '__pycache__' --exclude '*.pyc' \
  "$HOME/Dev/devtools/lib/" "$VPS:/var/www/devtools/lib/"
echo ">>> [global] done"
