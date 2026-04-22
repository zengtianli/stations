#!/usr/bin/env bash
# cc-options Streamlit → Next.js 迁移后（2026-04-21）的部署入口。
# 实际构建与部署在 web-stack 里做：apps/cc-options-web (Next) + services/cc-options (FastAPI)
# 保留本脚本只为肌肉记忆 —— `bash deploy.sh` 仍可直接用。
#
# 金融 .env / data/*.raw.* 绝不上 VPS（硬规则）。sync-data.sh 只 rsync 白名单产物。
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "→ 1/2 同步数据到 VPS（portfolio.json / activities.json / daily_nlv.csv）"
bash "$DIR/sync-data.sh"

echo "→ 2/2 部署 Next + FastAPI（via web-stack）"
bash ~/Dev/stations/web-stack/infra/deploy/deploy.sh cc-options "$@"
