#!/usr/bin/env bash
# Batch deploy multiple sites in a single pipeline, parallelising the parts that
# can safely run concurrently.
#
# Usage:
#   bash deploy-batch.sh <site1> <site2> ...
#   bash deploy-batch.sh all                    # all hydro-* + audiobook from services.ts
#
# Flow:
#   [A] Run sync-global.sh ONCE up front (not N times).
#   [B] Per-site rsync (Python + Next standalone) — SERIAL. rsync over ssh is I/O
#       bound and parallel rsync to the same host fights for disk/ssh channels.
#   [C] systemd restart — PARALLEL via background ssh + wait. Many short ssh calls.
#   [D] verify.py (public) — PARALLEL via xargs -P 4. Each is HTTPS-bound, independent.
#   [E] Pretty summary table: site × duration × pass/fail.
#
# Each per-site deploy.sh is called with TLZ_SKIP_GLOBAL_SYNC=1 (step [A] did it).
# Flags after the site list are passed through to deploy.sh (e.g. --fast, --no-build).
#
# NOTE: We use deploy.sh per site in steps [B]+[C] together (because splitting rsync
# from restart would duplicate all the port/path plumbing). The parallelism win comes
# from running deploy.sh invocations concurrently but capped at N=3 so ssh/rsync don't
# saturate. verify runs separately at higher N=4.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_STACK_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
# shellcheck source=ports.sh
source "$SCRIPT_DIR/ports.sh"

# Locate services.ts via website station (honours stations/ promotion).
if command -v python3 >/dev/null 2>&1 && [[ -f "$HOME/Dev/devtools/lib/station_path.py" ]]; then
  WEBSITE_DIR="$(python3 "$HOME/Dev/devtools/lib/station_path.py" website 2>/dev/null || true)"
fi
SERVICES_TS="${WEBSITE_DIR:-$HOME/Dev/stations/website}/lib/services.ts"

# --- parse: sites before --flags ---
SITES=()
EXTRA_FLAGS=()
for arg in "$@"; do
  if [[ "$arg" == --* ]]; then
    EXTRA_FLAGS+=("$arg")
  else
    SITES+=("$arg")
  fi
done
[[ ${#SITES[@]} -eq 0 ]] && { echo "usage: deploy-batch.sh <site1> ... [--fast|--no-build|--force-build]" >&2; exit 1; }

# Expand 'all' → list of migrated sites (must have ~/Dev/stations/web-stack/apps/<name>-web).
if [[ "${SITES[0]}" == "all" ]]; then
  SITES=()
  while IFS= read -r sub; do
    [[ -z "$sub" ]] && continue
    if [[ "$sub" =~ ^hydro- || "$sub" == "audiobook" ]]; then
      if [[ -d "$WEB_STACK_ROOT/apps/${sub}-web" ]]; then
        SITES+=("$sub")
      fi
    fi
  done < <(grep -oE 'subdomain:[[:space:]]*"[a-z0-9-]+"' "$SERVICES_TS" \
             | sed -E 's/subdomain:[[:space:]]*"([^"]+)"/\1/' \
             | sort -u)
  echo ">>> 'all' expanded to ${#SITES[@]} sites: ${SITES[*]}"
fi

PARALLEL_DEPLOY="${TLZ_PARALLEL_DEPLOY:-3}"   # concurrent deploy.sh invocations
PARALLEL_VERIFY="${TLZ_PARALLEL_VERIFY:-4}"   # concurrent verify.py runs

TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

echo "============================================================"
echo "  batch deploy: ${SITES[*]}"
echo "  flags passed to deploy.sh: ${EXTRA_FLAGS[*]:-(none)}"
echo "  concurrency: deploy=$PARALLEL_DEPLOY verify=$PARALLEL_VERIFY"
echo "============================================================"

# ---------- [A] Shared sync, once ----------
echo ">>> [A] sync-global (once)"
bash "$SCRIPT_DIR/sync-global.sh"

# ---------- [B/C] Per-site deploy, bounded parallelism ----------
# Each deploy.sh contains rsync (I/O bound) + restart (fast) + smoke. Running 3 in
# parallel is a safe default — above that ssh/rsync starts contending.
echo ">>> [B/C] Per-site deploy (parallel=$PARALLEL_DEPLOY)"

# When --fast is passed we don't want to also run public verify step [D] — it would
# undo the --fast savings. Detect:
SKIP_PUBLIC_VERIFY=0
for f in "${EXTRA_FLAGS[@]}"; do
  [[ "$f" == "--fast" ]] && SKIP_PUBLIC_VERIFY=1
done

run_one() {
  local name="$1"
  local start end rc logf
  logf="$TMPDIR/$name.log"
  start=$SECONDS
  if TLZ_SKIP_GLOBAL_SYNC=1 bash "$SCRIPT_DIR/deploy.sh" "$name" "${EXTRA_FLAGS[@]}" > "$logf" 2>&1; then
    rc=0
  else
    rc=$?
  fi
  end=$SECONDS
  printf '%s\t%d\t%d\n' "$name" "$rc" "$((end - start))" > "$TMPDIR/$name.status"
  if (( rc == 0 )); then
    echo "  [ok] $name ($((end - start))s)"
  else
    echo "  [FAIL] $name ($((end - start))s) — see $logf"
  fi
}

pids=()
active=0
for name in "${SITES[@]}"; do
  run_one "$name" &
  pids+=($!)
  ((active++)) || true
  if (( active >= PARALLEL_DEPLOY )); then
    wait -n 2>/dev/null || wait "${pids[0]}" || true
    active=$((active - 1))
  fi
done
wait || true

# ---------- [D] Public verify in parallel (only if not --fast) ----------
if (( ! SKIP_PUBLIC_VERIFY )); then
  echo ">>> [D] Public verify.py (parallel=$PARALLEL_VERIFY) — redundant with step [7/8] above, skipped"
  # deploy.sh already ran verify.py for each site synchronously in step [7/8].
  # Re-running here would just double the wall time. Kept as a reserved hook for
  # "--deferred-verify" mode later if we decouple per-site verify from deploy.sh.
fi

# ---------- [E] Summary ----------
echo ""
echo "============================================================"
echo "  summary"
echo "============================================================"
printf '  %-25s %-6s %-8s\n' "site" "exit" "seconds"
total_fail=0
total_sec=0
for name in "${SITES[@]}"; do
  if [[ -f "$TMPDIR/$name.status" ]]; then
    IFS=$'\t' read -r s rc secs < "$TMPDIR/$name.status"
    label=$([[ "$rc" == 0 ]] && echo "OK" || echo "FAIL")
    printf '  %-25s %-6s %-8s\n' "$s" "$label($rc)" "$secs"
    (( rc != 0 )) && total_fail=$((total_fail + 1))
    total_sec=$((total_sec + secs))
  else
    printf '  %-25s %-6s %-8s\n' "$name" "?" "?"
    total_fail=$((total_fail + 1))
  fi
done
echo "  ----"
echo "  total wall-time-sum: ${total_sec}s (sum across sites; real wall < this due to parallelism)"
echo "  failures: $total_fail / ${#SITES[@]}"

exit $(( total_fail > 0 ))
