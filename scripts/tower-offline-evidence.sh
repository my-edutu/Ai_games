#!/usr/bin/env bash
# Source-pinned Tower WebM capture when GitHub-hosted Actions remain queued.
# Only detached local worktrees are created. No branch movement, network push,
# game-source substitution, time acceleration or fabricated review outcomes.
set -Eeuo pipefail
FROZEN=1731b380851162741761c5569e2bc152a0869ca9
if [[ "${1:-}" == "--help" ]]; then
  echo "Usage: bash scripts/tower-offline-evidence.sh <exact-40-character-candidate-commit-SHA>"
  echo "Run from a clone containing both the frozen baseline and candidate commits, with Node >=22, npm and Playwright Chromium prerequisites."
  exit 0
fi
if [[ $# -ne 1 || ! "$1" =~ ^[0-9a-f]{40}$ ]]; then
  echo "Specify exactly one immutable candidate commit SHA (40 lowercase hex characters)." >&2
  exit 2
fi
CANDIDATE=$1
REPO=$(git rev-parse --show-toplevel)
cd "$REPO"
for sha in "$FROZEN" "$CANDIDATE"; do
  git cat-file -e "${sha}^{commit}" || { echo "Commit $sha not locally available; fetch it before starting." >&2; exit 2; }
done
git merge-base --is-ancestor "$FROZEN" "$CANDIDATE" ||
  { echo "Candidate must descend from frozen baseline." >&2; exit 2; }
NODE_MAJOR=$(node -p 'Number(process.versions.node.split(".")[0])')
if [[ "$NODE_MAJOR" -lt 22 ]]; then
  echo "Node.js >=22 is required." >&2; exit 2
fi
command -v npm >/dev/null
command -v npx >/dev/null
RUN_ID=$(date -u +%s)
OUTPUT="$REPO/artifacts/tower-offline-$RUN_ID-${CANDIDATE:0:12}"
if [[ -e "$OUTPUT" ]]; then echo "Output exists: $OUTPUT" >&2; exit 2; fi
mkdir -p "$OUTPUT/tower-event-pair-input"
SCRATCH=$(mktemp -d)
cleanup() {
  for source in baseline candidate; do
    if git worktree list --porcelain | grep -Fqx "worktree $SCRATCH/$source"; then
      git worktree remove --force "$SCRATCH/$source" || true
    fi
  done
  rm -rf "$SCRATCH"
}
trap cleanup EXIT
git worktree add --detach "$SCRATCH/baseline" "$FROZEN"
git worktree add --detach "$SCRATCH/candidate" "$CANDIDATE"
BASE_DIR="$SCRATCH/baseline"
NEW_DIR="$SCRATCH/candidate"
# The frozen ORIGINAL application/engine/stream host are never overwritten.
# Copy only the neutral evidence recorder used for BOTH sources in CI.
HARNESS_FILES=(
  tests/browser/tower-live-motion.spec.cjs
  scripts/tower-motion-evidence.cjs
  scripts/tower-crossfire-evidence.cjs
  scripts/tower-event-alignment.cjs
  scripts/tower-event-pairing.cjs
  scripts/tower-capture-window.cjs
  scripts/tower-fixed-step-trace.cjs
  tests/phase3/tower-fixed-step-trace.test.cjs
  tests/phase3/tower-event-alignment.test.cjs
  tests/phase3/tower-capture-window.test.cjs
  scripts/tower-source-capture-server.cjs
  playwright.tower.config.cjs
)
for path in "${HARNESS_FILES[@]}"; do
  mkdir -p "$BASE_DIR/$(dirname "$path")"
  cp "$NEW_DIR/$path" "$BASE_DIR/$path"
done
for source in baseline candidate; do
  if [[ "$source" == baseline ]]; then DIR="$BASE_DIR"; SHA="$FROZEN"; else DIR="$NEW_DIR"; SHA="$CANDIDATE"; fi
  ORIGIN_HOST=$(git rev-parse "$SHA:scripts/serve-tower-stream.cjs")
  ACTUAL_HOST=$(git hash-object "$DIR/scripts/serve-tower-stream.cjs")
  if [[ "$ORIGIN_HOST" != "$ACTUAL_HOST" ]]; then
    echo "$source SOURCE HOST MUTATED; refusing recording" >&2; exit 3
  fi
  if [[ -n "$(git -C "$DIR" diff --name-only -- games/infinite-tower-climb/src public/infinite-tower-climb/visuals scripts/serve-tower-stream.cjs)" ]]; then
    echo "$source gameplay or renderer differs from pinned checkout" >&2; exit 3
  fi
  printf '%s\n' "$SHA" > "$OUTPUT/$source-source-sha.txt"
  printf '%s\n' "$ORIGIN_HOST" > "$OUTPUT/$source-original-host-blob.txt"
  echo "Installing/building the unmodified $source gameplay at $SHA"
  INTEGRITY_TESTS=(tests/phase3/tower-motion-evidence.test.cjs tests/phase3/tower-event-alignment.test.cjs tests/phase3/tower-capture-window.test.cjs tests/phase3/tower-fixed-step-trace.test.cjs)
  if [[ "$source" == candidate ]]; then INTEGRITY_TESTS+=(tests/phase3/tower-campaign-audit.test.cjs); fi
  (cd "$DIR" && npm ci --no-audit --no-fund && npm run build &&
    node --test "${INTEGRITY_TESTS[@]}") \
    > "$OUTPUT/$source-build-and-integrity.log" 2>&1 ||
    { echo "$source build or source-integrity tests failed; see $OUTPUT/$source-build-and-integrity.log" >&2; exit 4; }
done
# The previous offline fallback only recorded film and source-event names.
# When hosted jobs cannot start, we must ALSO run the unmodified candidate's
# real 3,200-tick guardian expedition twice. Exact JSON replay equality checks
# deterministic game truth; a failed floor-nine/restart causal episode is
# retained as a BLOCKER, not rewritten as completion. Never alter the seed,
# replay clock, authority, or frozen baseline to make these probes pass.
FAILED=0
for replica in 1 2; do
  echo "Source-only 3,200-tick candidate guardian expedition, replica $replica"
  if ! (cd "$NEW_DIR" && node scripts/tower-guardian-source-witness.cjs) \
      > "$OUTPUT/candidate-guardian-campaign-$replica.json" \
      2> "$OUTPUT/candidate-guardian-campaign-$replica.stderr"; then
    echo "Source campaign replica $replica failed; preserving stderr and any partial output." >&2
    FAILED=1
  fi
done
if [[ -s "$OUTPUT/candidate-guardian-campaign-1.json" &&
      -s "$OUTPUT/candidate-guardian-campaign-2.json" ]]; then
  if ! (cd "$NEW_DIR" && node scripts/tower-campaign-audit.cjs \
       "$OUTPUT/candidate-guardian-campaign-1.json" \
       "$OUTPUT/candidate-guardian-campaign-2.json" \
       "$OUTPUT/candidate-source-campaign-audit.json" "$CANDIDATE") \
       > "$OUTPUT/source-campaign-audit.log" 2>&1; then
    echo "Incomplete/non-deterministic real source episode; inspect candidate-source-campaign-audit.json." >&2
    FAILED=1
  fi
else
  echo 'NO COMPLETE SOURCE CAMPAIGN RESULTS — NOT EVALUATED' > "$OUTPUT/source-campaign-audit.log"
  FAILED=1
fi
(cd "$NEW_DIR" && npx playwright install chromium) > "$OUTPUT/chromium-install.log" 2>&1 ||
  { echo "Chromium unavailable; see $OUTPUT/chromium-install.log" >&2; exit 4; }
for scenario in ascent danger outcome moving; do
  case "$scenario" in danger) FLOOR=8;; moving) FLOOR=7;; *) FLOOR=0;; esac
  for source in baseline candidate; do
    if [[ "$source" == baseline ]]; then DIR="$BASE_DIR"; SHA="$FROZEN"; else DIR="$NEW_DIR"; SHA="$CANDIDATE"; fi
    ARTIFACT="tower-motion-$source-$scenario-$RUN_ID"
    DEST="$OUTPUT/tower-event-pair-input/$ARTIFACT"
    mkdir -p "$DEST/$scenario"
    printf '%s\n' "$SHA" > "$DEST/source-sha.txt"
    printf '%s\n' "$CANDIDATE" > "$DEST/evidence-harness-sha.txt"
    echo "Recording $source / $scenario / $SHA — desktop and portrait at real time"
    if ! (cd "$DIR" &&
      env CI=true TOWER_CAPTURE_UNALTERED_SOURCE=1 TOWER_SOFTWARE_GL=1 \
        TOWER_LAUNCH_FLOOR="$FLOOR" TOWER_MOTION_SCENARIO="$scenario" \
        TOWER_SEED=tower-transformation-capture-v1 TOWER_CAPTURE_SOURCE_SHA="$SHA" \
        npx playwright test --config=playwright.tower.config.cjs tests/browser/tower-live-motion.spec.cjs) \
        > "$DEST/capture.log" 2>&1; then
      echo "Capture failed: $ARTIFACT (retaining any authentic files)" >&2
      FAILED=1
    fi
    if [[ -d "$DIR/artifacts/tower-motion/$scenario" ]]; then
      cp -a "$DIR/artifacts/tower-motion/$scenario/." "$DEST/$scenario/"
    fi
    if [[ -d "$DIR/test-results" ]]; then
      cp -a "$DIR/test-results" "$DEST/test-results"
    fi
    if [[ "$(git hash-object "$DIR/scripts/serve-tower-stream.cjs")" != "$(git rev-parse "$SHA:scripts/serve-tower-stream.cjs")" ]]; then
      echo "Host changed during recording; provenance invalid." >&2; exit 5
    fi
  done
done
echo "Auditing same-scenario source event pairs, NOT judging gameplay quality."
if ! (cd "$NEW_DIR" &&
  TOWER_EXPECTED_CANDIDATE_SHA="$CANDIDATE" \
    node scripts/tower-event-pairing.cjs "$OUTPUT/tower-event-pair-input" "$OUTPUT/event-pair-manifest.json") \
    > "$OUTPUT/event-pair-audit.log" 2>&1; then
  FAILED=1
fi
cat > "$OUTPUT/VERDICT.txt" <<EOF
Stage: P0 — source-pinned evidence collection
Frozen baseline: $FROZEN
Candidate: $CANDIDATE
Video: original real-time Chromium WebM, desktop 960x600 + portrait 390x844
Gameplay source hosts: original git blobs recorded above
3200-tick same-run floor-eight guardian/crusher -> floor-nine -> outcome/restart:
  AUDIT AT candidate-source-campaign-audit.json (source-only, two unchanged expeditions).
  Missing real events or divergent replicas BLOCK completion; source chain is not painted video.
Independent LOOKS / FEELS / PLAYS reviews: 0/5, 0/5, 0/5
Actual supported-device p50 / p95 / p99 and memory: NOT EVALUATED
Video visual continuity and timecode review: NOT EVALUATED
Leading transformation verdict: NOT EVALUATED
Do not publish blind preference, gameplay completion or hardware claims from this script.
EOF
echo "Source capture saved at $OUTPUT. Read each capture.log and event-pair-manifest.json; watch original WebMs at normal speed."
exit "$FAILED"
