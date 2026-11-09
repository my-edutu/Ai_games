# D04 — Warden warning markers use the actual hazard footprint

Branch: `feat/dungeon-d04-combat-feedback-realism-20261108`.
Starting HEAD: `ba75ae6f3a711b14754d2a12aed0d642115f3085`.
Frozen BEFORE: `281735d0910c6b2443648af976003d50412ee324`.
Status: **source correction, NOT accepted as genuine running-game audiovisual evidence**.

## Dominant source-observable defect

The D04 `boss-warning-rising` / `boss-warning-final` cue formerly carried only `shape` and `attackTick`, so its `signal` pool spawned a ground ring beneath the Warden's cell. This is a misaligned warning marker: the authority supplies an explicit `bossWarning.cells` footprint and that footprint need not include the Warden's position. In an actual moving game it could visually imply danger at an untargeted cell. The independent legacy Warden relief tiles continue to show the full set of dangerous cells; this preview improvement must not replace them.

## Implementation and test-first contract

- `tests/foundation/dungeon-d04-warden-warning-cells.test.cjs` was committed first at `ba75ae6`. It expects authority-backed immutable cell markers, explicit source filtering, one retained signal pool, and no invented boss-centre hazard. It was not executable in the disconnected repository tunnel before this patch; these were *expected* source-contract failures, not a claimed observed native red result.
- `physical-feedback-plan.js`: dedupe and sort genuine warning cells, select up to eight with stable spatially distributed indices, freeze copies, and add them to the cue `detail.cells` only under a live, validated Warden warning.
- `physical-feedback-visuals.js`: populate existing eight `signal` instances at precisely those cell positions; missing, malformed or forged warning footprints fail closed. All other cue categories keep their original anchor semantics.
- No new geometry, material, texture, effect draw call, audio bus, signal category, gameplay hazard, clock or combat ownership. Maximum seven retained pools, 102 instances, eight signals and eight original audio voices. GPU instance matrices still initialize before submission; muted sound, opt-in, dedup, reduced-motion/flash and scene cleanup are unchanged.

## Verification state and rejection

GitHub connector source review establishes the previous boss-centre anchoring and patch scope. **Native Node tests, full build, WebGL/WebAudio playback, actual three-viewpoint desktop/390px footage, PCM onset, authentic Warden warning/release/recovery/counter, miss/block/dodge/projectile/spell captures, and 20-minute soak remain UNVERIFIED.** The separate shell cannot resolve GitHub and therefore cannot check out this branch or obtain pinned GLBs. Do not treat synthetic test fixtures as captured gameplay.

If genuine recorded combat reveals duplicate light pools hiding floor warning tiles or performance degradation, rollback the marker commit on D04. D10 must judge it against the frozen BEFORE and default legacy spectator; D04 remains opt-in only through `?feedback=d04`.

## Next priority

A physical blade-tip rig/weapon transform and actual moving Three.js/WebAudio recordings are still unavailable. Validate real hazard marker visibility, audio timing and wrist-proxy visual behavior from three directions with the pinned GLBs before accepting any realism score.
