#!/bin/bash
# 每日收盘后自动更新（LaunchAgent 17:00 触发）
# 1. 拉取最新持仓快照 → portfolio.json
# 2. 拉取全量交易流水 → data/activities.json
# 3. 重建历史 NLV 曲线 → data/daily_nlv.csv
# 4. 生成 CLI dashboard → dashboard.md
source ~/.personal_env
PYTHON=/opt/homebrew/bin/python3
DIR="$(cd "$(dirname "$0")" && pwd)"

echo "[$(date)] Starting daily update..."

# SnapTrade occasionally 504s on /activities — retry once after 10s before
# breaking the && chain (otherwise phase2_equity_curve skips and the UI looks
# "half-refreshed": portfolio new, activities+CSV stale).
$PYTHON "$DIR/st_snapshot.py" && \
{ $PYTHON "$DIR/st_activities.py" \
  || { echo "[$(date)] ⚠ activities failed, retrying after 10s..."; sleep 10; \
       $PYTHON "$DIR/st_activities.py"; }; } && \
$PYTHON "$DIR/phase2_equity_curve.py" && \
$PYTHON "$DIR/dashboard.py"

# Sync whitelisted artifacts to VPS (portfolio.json / activities.json / daily_nlv.csv)
echo "[$(date)] Syncing to VPS..."
bash "$DIR/sync-data.sh" || echo "[$(date)] ⚠ sync-data.sh failed"

echo "[$(date)] Done."
