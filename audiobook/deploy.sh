#!/bin/bash
set -e
source ~/Dev/devtools/lib/vps_config.sh
REMOTE_DIR="/var/www/audiobook"

echo ">>> Syncing files to VPS..."
rsync -avz --exclude '.git' --exclude '.venv' --exclude '__pycache__' \
    "$(dirname "$0")/" "$VPS:$REMOTE_DIR/"

echo ">>> Installing dependencies..."
ssh "$VPS" "cd $REMOTE_DIR && pip3 install fastapi uvicorn python-multipart pydantic edge-tts httpx -q"

echo ">>> Ensuring ffmpeg..."
ssh "$VPS" "which ffprobe > /dev/null 2>&1 || apt-get install -y ffmpeg"

echo ">>> Installing systemd service..."
ssh "$VPS" "cp $REMOTE_DIR/audiobook.service /etc/systemd/system/ && systemctl daemon-reload && systemctl enable audiobook"

echo ">>> Restarting service..."
ssh "$VPS" "systemctl restart audiobook"
sleep 2
ssh "$VPS" "systemctl status audiobook --no-pager -l"

echo ""
echo ">>> Deployed! https://audiobook.tianlizeng.cloud"
