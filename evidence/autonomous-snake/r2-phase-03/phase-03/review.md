# Autonomous Snake Phase 3 Review

**Release:** `r2-phase-03`  
**Review type:** Specification-compliance review followed by engineering-quality review  
**Reviewed implementation head:** `c55cd0f57544270a0ee0736dcdabb08185d4de7d`  
**CI run:** `31964576797`  
**Verdict:** PASS for the R2 broadcast-candidate scope. No P0/P1 finding remains.

## Specification-Compliance Review

### Authority separation — PASS

The renderer consumes deeply frozen public snapshots. Presentation frame cadence, polling, interpolation, camera, VFX, audio, replay, failure, and reconstruction do not call authoritative reducers or change state checksums. Twin runtimes remained checksum-identical while one runtime produced presentation output.

### Immutable render snapshot and privacy — PASS

Snapshots are versioned, checksummed, deeply frozen, and ordered by a monotonic presentation revision. Public state excludes seed, raw run ID, recent hashes, AI search internals, provider/user/payment data, stack traces, and internal failure text. A privacy-safe hashed run token permits autonomous tick reset across run boundaries.

### Entity lifecycle and complete reconstruction — PASS

The entity registry deterministically creates, updates, removes, interpolates, bounds, and clears entities. A renderer failure switches to a public recovery scene and rebuilds the complete view from the latest verified snapshot. A complete victory → result → intermission → new run path is tested.

### HUD, scenes, mobile hierarchy, clean feed — PASS

The public source implements goal/length, percentage/profile, record, AI intent, danger/result/recovery/intermission state, captions, integrity, and reserved future audience space. Actual Chromium capture passed at 1920×1080 and 640×360 with no overflow or console errors. Clean feed removes every overlay and control.

### Camera, VFX, audio, replay, accessibility — PASS within Phase 3 scope

Camera bounds, reduced impulse, semantic cue priorities, dedupe, expiry, voice stealing, mute/caption preservation, music dwell, and bounded replay are tested. The browser uses generated Canvas/Web Audio output and ships no third-party media asset. Reduced motion and public/operator separation are implemented.

### Output health and degradation — PASS within local browser-source scope

Stale, black, frozen, wrong-scene, and unintended-silence classifications produce deterministic rebuild or safe-slate actions. Local renderer reconstruction is verified. Production capture-card, encoder, OBS and platform-output probes remain Phase 5–6 work.

## Engineering-Quality Review

### Strengths

- Authority and presentation remain separately testable.
- Snapshot ordering handles same-tick lifecycle transitions without weakening same-revision divergence detection.
- New run boundaries are privacy-safe and clear run-scoped replay/entity state.
- Public output defaults to no operator controls; controls require explicit `?controls=1`.
- Dependency versions and integrity hashes are locked.
- CI verifies Node models, stream self-test, nondeterminism scan and real Chromium capture.
- Resource ceilings are explicit for particles, VFX, voices, replay, DPR, polling, text, cue durations and snapshot ordering.

### Findings Found and Resolved

1. **P1 — Valid result-to-intermission snapshot rejected as divergence.**  
   Root cause: presentation ordering used only game tick, but lifecycle may change without advancing that tick.  
   Resolution: introduced deterministic monotonic `revision` derived from movement step, lifecycle and intermission progress; retained divergent-same-revision rejection.

2. **P1 — Automated self-test did not prove a full restart.**  
   Root cause: the long reference run could legitimately remain active for the whole observation window.  
   Resolution: added a deterministic short victory probe that verifies result, intermission, new run token, tick-zero acceptance, scene restoration and replay reset.

3. **P1 — Browser tests waited for network idle on a continuously polling app.**  
   Root cause: `/snapshot` polling intentionally prevents network-idle state.  
   Resolution: use `domcontentloaded` plus explicit public-state assertions.

4. **P2 — CI frame threshold assumed 30 FPS on a shared headless runner.**  
   Resolution: use a measured frozen/starvation gate—at least 18 frames, at least 17 average FPS, and no frame gap of 250 ms or more—while recording exact cadence for later production-reference validation.

5. **P1 — Public source could reveal low-opacity operator controls.**  
   Resolution: controls are now `display:none` unless `?controls=1` is supplied; clean feed hides them unconditionally.

6. **P2 — Particle bonus-color expression referenced a nonexistent root snapshot field.**  
   Resolution: reference `snapshot.food?.kind`.

7. **P2 — Initial GitHub Actions cache setup required a lockfile that did not exist.**  
   Resolution: committed a complete npm lockfile, moved to `npm ci`, and pinned current Node-24 GitHub actions.

### Open P2 Items Accepted for Later Phases

- Production GPU, encoder and end-to-end output-frame budgets need production-reference hardware.
- Long-duration browser/GPU/audio resource slope belongs to the Phase 5 engineering soak.
- Calibrated loudness/true-peak and real capture-chain silence detection remain production validation.
- Independent uninstructed comprehension and actual audience accessibility feedback remain Phase 6 evidence.
- YouTube/Twitch provider and audience behavior are explicitly Phase 4.

## Final Classification

- **P0:** 0 open
- **P1:** 0 open
- **P2:** accepted later-phase items listed above
- **Highest truthful readiness:** R2 complete autonomous broadcast candidate
- **Not claimed:** R3 interaction candidate, R4 infrastructure candidate, or R5 production ready
