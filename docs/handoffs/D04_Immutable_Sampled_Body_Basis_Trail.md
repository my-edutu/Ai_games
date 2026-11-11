# D04 — Immutable Authored-Body Basis for Measured Air Passage

Status: **independent D04 source fix; genuine Dungeon audiovisual acceptance UNVERIFIED**  
Owner: Session 4 — original combat feedback/foley only  
Branch: `feat/dungeon-d04-combat-feedback-realism-20261108`  
Inspected starting HEAD: `086274f6d92aec3b457ada78cb8c6f8966ac6dac`  
Pinned BEFORE: `281735d0910c6b2443648af976003d50412ee324`  
Acceptance: `docs/handoffs/D04_Real_3D_Preview_Acceptance.md`

## Selected defect, evidence classification

The D04 authored-body path already records an immutable twelve-scalar affine snapshot at the same time as its skinned-wrist position, and the frame receipt compares that snapshot with the actual body transform. But `planMeasuredHandTrail()` *still projected local wrist travel using the live mutable `poseFrameMatrix` pointer*. A parent/body matrix changed after the wrist sample could therefore recalculate a different trail direction/length without another observed hand movement. This threatens the provenance of the drawable path that later gates original whoosh. This is a **reproduced source-level mutation defect**, not an observed real GLB gameplay artifact.

Adapted production-source red checks, run **before** the fix, failed for: (1) changed matrix pointer producing a different/dropped stroke; (2) captured 90° body basis being ignored; (3) NaN captured coefficient accepted; (4) fully captured immutable pose without a matrix pointer being rejected. An older matrix-only adapter continued to pass.

## Scope of changes

- `tests/foundation/dungeon-d04-sampled-body-basis-trail.test.cjs`: six new test-first `node:test` contracts for immutable sample provenance, rotated basis, malformed/partial snapshots, captured-only use, legacy authored-body matrix fallback and non-body numeric fallback.
- `public/ai-dungeon/measured-weapon-trail.js`: when captured authored-body coefficients are available, use those **existing read-only scalar values** for local-delta projection, independently of the mutable `Matrix4.elements` reference. Reject partial/nonfinite captured affine witnesses. Keep prior validated live-matrix behavior only for older adapters with *no captured coefficients*. The existing submission receipt continues to reject post-sampling body drift.

No new weapon mesh, guessed tip/socket, visual pool, GPU draw, sound source, audio buffer, event, callback, listener or authoritative actor rule was created. The ribbon is **still only a measured wrist proxy**, never certified blade-tip geometry or a hit. An actual HP decrease remains the sole injury authorization.

## Verification — what actually ran

1. Read `AGENTS.md`, this branch's D04 preview acceptance criteria, frozen BEFORE commit metadata, live source, recent handoff, game-audio and simulation-QA skill guides.
2. Coding-tunnel attempt returned `Tunnel-client has not been seen for 300 seconds`; local `git ls-remote` failed DNS. GitHub connector successfully read and wrote only the isolated branch.
3. Pre-fix red: four targeted evaluations against fetched production source reproduced the violated contracts in detached JavaScript/V8.
4. Post-fix green: **6/6 newly committed test bodies** executed in an **adapted V8 harness**, loading the actual fetched production `planMeasuredHandTrail`. Separately, seven targeted source-backed verification cases passed.
5. Deterministic property probes: **300/300** bounded local-travel cases kept their original expected length despite subsequent mutation of the live model matrix reference.
6. Fetched JavaScript source and authored tests parsed in the detached JS evaluator.
7. GitHub comparison from `086274f` showed only D04 production and foundation-test files changed before this handoff; GitHub commit status endpoint returned zero statuses.

**Not run:** native `node --test`, `npm ci`, build, Playwright, genuine Three.js WebGL, original WebAudio playback, captured PCM, frame-matched browser movie or the 20-minute soak. Source-backed V8 execution cannot establish motion quality, sound synchronization, performance or successful gameplay capture.

### Native reproduction for integration reviewer

```sh
npm ci
npm run build
node --test tests/foundation/dungeon-d04-sampled-body-basis-trail.test.cjs
node --test tests/foundation/dungeon-d04-body-matrix-submission-receipt.test.cjs tests/foundation/dungeon-d04-wrist-parent-motion-rejection.test.cjs tests/foundation/dungeon-d04-wrist-parent-motion-integration.test.cjs
npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs
```

Once the *actual licensed/approved Dungeon GLB inputs* are available, run the authenticated `/dungeon?feedback=d04` preview in 1440×900 and 390×844; capture synchronized original canvas/video and opt-in FX-bus PCM for three fixed camera directions and the same seed/run/floor/tick/checksum. Compare with pinned BEFORE for miss/no damage, HP-confirmed damage, block, dodge, arrow, cast, Warden warning/release/recovery/counter/restart and ambiguous injury. Exercise mute/reload, reduced-motion/flash, audio-context interruption, WebGL recovery and the 20-minute dense-combat soak.

## Review / limits

**Specification:** presentation only; no modification to `games/ai-dungeon/src`, main, Draft PR #49, animation/character art, camera or lighting. No invented attacker, contact, wound, audio source or event. Default spectator unchanged; `?feedback=d04` opt-in remains required.

**Engineering:** bounded branch-local computation using the already captured 12 numbers; no new retained resources or authority/replay changes. Frozen resource caps remain seven visual pools, 102 reserved instances, no more than seven new VFX draw calls and eight original foley voices at **source level**, not verified by hardware telemetry. The fallible mutable-pointer path remains for older adapters without captured data; the production authored-body path supplies snapshots. Legitimate new matrix animation after the sample should be rejected by the existing presentation receipt, not incorporated silently.

**Rollback:** revert the production code commit together with its focused regression contracts only on this D04 branch. Do not merge to main/PR #49 before final D10 review.

## Next dominant physical-realism weakness

The **actual animated sword tip** has still not been identified or measured from the genuine licensed GLB and cannot be inferred from a planted wrist. The repository's tracked `public/ai-dungeon/models` directory exposed only `.gitignore`; requested authentic GLB-backed combat clips were not available here. Prioritize asset provenance and authentic three-viewpoint playback before changing wrist proxy proportions or declaring visible/sonic parity. The acceptance checklist remains **OPEN**.
