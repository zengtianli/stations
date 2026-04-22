#!/usr/bin/env bash
# 一键同步 + 构建 + 部署 playbooks 站点。
set -euo pipefail

cd "$(dirname "$0")"

echo "=== 1/3 同步 _playbooks ==="
bash scripts/sync.sh

echo "=== 2/3 MkDocs build ==="
~/.local/bin/mkdocs build --strict

echo "=== 3/3 rsync 到 VPS ==="
source ~/Dev/devtools/lib/vps_config.sh
rsync -avz --delete site/ "$VPS:/var/www/playbooks/"

echo "✅ 完成 → https://playbooks.tianlizeng.cloud"
