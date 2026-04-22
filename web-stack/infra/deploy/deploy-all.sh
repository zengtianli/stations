#!/usr/bin/env bash
# Deploy multiple sites in a loop. Usage: bash deploy-all.sh [sites...]
# Default: the 8 hydro-* sites that need FastAPI compute (excludes already-deployed).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

DEFAULTS=(
  hydro-capacity hydro-efficiency hydro-annual hydro-geocode
  hydro-irrigation hydro-district hydro-rainfall hydro-risk
)

SITES=("$@")
[[ ${#SITES[@]} -eq 0 ]] && SITES=("${DEFAULTS[@]}")

for name in "${SITES[@]}"; do
  echo "============================================================"
  echo "  deploying: $name"
  echo "============================================================"
  bash "$SCRIPT_DIR/deploy.sh" "$name" || echo "!! $name failed, continuing..."
done

echo ""
echo ">>> All done. Run /sites-health to verify subdomains."
