#!/usr/bin/env bash
# 同步双源 playbook 到 docs/ 供 MkDocs 构建：
#   SRC_BIZ  = 业务 playbook (bids / eco-flow / reclaim)
#   SRC_META = 跨域 / 站群 playbook (hydro / stations / web-content ...)
# 幂等：每次全量覆盖。index.md 本地维护保留。
set -euo pipefail

SRC_BIZ="$HOME/Dev/Work/_playbooks"
SRC_META="$HOME/Dev/tools/configs/playbooks"
DST="$HOME/Dev/stations/playbooks/docs"

[ -d "$SRC_BIZ" ]  || { echo "❌ 业务源不存在: $SRC_BIZ"; exit 1; }
[ -d "$SRC_META" ] || { echo "❌ 跨域源不存在: $SRC_META"; exit 1; }

find "$DST" -mindepth 1 -maxdepth 1 ! -name "index.md" -exec rm -rf {} +

rsync -a --include='*/' --exclude='README.md' --include='*.md' --exclude='*' "$SRC_BIZ/"  "$DST/"
rsync -a --include='*/' --exclude='README.md' --include='*.md' --exclude='*' "$SRC_META/" "$DST/"

echo "✓ 同步完成: $SRC_BIZ + $SRC_META → $DST"
ls -R "$DST" | head -30
