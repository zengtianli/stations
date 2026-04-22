#!/usr/bin/env bash
# 从 ~/Work/_playbooks/ 同步内容到 docs/ 供 MkDocs 构建。
# 幂等：每次全量覆盖（_playbooks 是唯一事实源）。
set -euo pipefail

SRC="$HOME/Work/_playbooks"
DST="$HOME/Dev/playbooks/docs"

[ -d "$SRC" ] || { echo "❌ 源不存在: $SRC"; exit 1; }

# 清空 docs，保留 index.md（本地维护）
find "$DST" -mindepth 1 -maxdepth 1 ! -name "index.md" -exec rm -rf {} +

# 复制除 README 外所有 .md（README.md 是元说明，index.md 当首页）
rsync -a --include='*/' --include='*.md' --exclude='*' "$SRC/" "$DST/"

echo "✓ 同步完成: $SRC → $DST"
ls -R "$DST" | head -30
