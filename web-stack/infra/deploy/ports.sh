#!/usr/bin/env bash
# Port mapping from ~/Dev/stations/website/lib/services.ts (SSOT).
# FastAPI port = Streamlit port + 100 (audiobook exception: both 9200)
# Next.js dev port = Streamlit port - 5400
# This file is hand-maintained; services.ts is the SSOT.
# To regenerate nginx vhosts from services.ts:
#   /nginx-regen   (or: python3 ~/Dev/devtools/lib/tools/services_to_nginx.py)

declare -A STREAMLIT_PORT=(
  [audiobook]=9200
  [cc-options]=8521
  [hydro-annual]=8514
  [hydro-capacity]=8511
  [hydro-district]=8516
  [hydro-efficiency]=8513
  [hydro-geocode]=8517
  [hydro-irrigation]=8515
  [hydro-rainfall]=8518
  [hydro-reservoir]=8512
  [hydro-risk]=8519
  [hydro-toolkit]=8510
)

api_port() {
  local name="$1"
  local s="${STREAMLIT_PORT[$name]:-}"
  [[ -z "$s" ]] && { echo "unknown site: $name" >&2; return 1; }
  # audiobook is special — FastAPI also runs on 9200 (same port)
  if [[ "$name" == "audiobook" ]]; then
    echo "9200"
  else
    echo $((s + 100))
  fi
}

web_port() {
  local name="$1"
  local s="${STREAMLIT_PORT[$name]:-}"
  [[ -z "$s" ]] && { echo "unknown site: $name" >&2; return 1; }
  echo $((s - 5400))
}

streamlit_port() {
  local name="$1"
  echo "${STREAMLIT_PORT[$name]:-}"
}

all_sites() {
  printf '%s\n' "${!STREAMLIT_PORT[@]}" | sort
}
