# Infinite Tower Climb PR68 — P0 source-snapshot gallery prestaging blocker, 20 Nov 2026

**Stage: P0 OPEN. Leading assessor: NOT EVALUATED.** Original frozen baseline `1731b380851162741761c5569e2bc152a0869ca9` unchanged; Draft PR68 remains distinct from PR58.

## Original 1× footage and CPU evidence

[Candidate-vs-frozen exact-source native film campaign 44697479639](https://github.com/my-edutu/Ai_games/actions/runs/44697479639), immutable candidate `e0b3ff7675ca6626bcc43d16381f7921c8d1a14e`, completed all eight original 60s+ A/B films plus source ledge. Its stringent native/source event pairing **FAILED both desktop and portrait (0/2)**. Real-motion screenshots sampled across 23.5–30.3 seconds show an abrupt bronze-to-violet handoff. The complete skinned climber is intermittently masked by bronze foreground posts on portrait. No accepted sustained frame sequence yet proves the ORIGINAL opened bronze guardian gateway, the full moving climber and walkable successor together. Projected source coordinates are not pixel evidence.

Raw real-time scene diagnostics from **both** original candidate danger recordings show `firstF9OriginalOwnerPath.originalGalleryPreparation = cold-fallback-original-source-rebuild` for **all four observed F9 episodes**. Exact browser CPU substage milliseconds (not hardware GPU timing):

| First F9 original episode | Old gateway/gallery transfer | Old-floor teardown | Rigid batching |
|---|---:|---:|---:|
| Desktop source tick 475 | 151.9 | 0.4 | 83.8 |
| Desktop source tick 316 | 178.1 | 0.1 | 48.2 |
| Portrait source tick 483 | 142.7 | 0.1 | 54.4 |
| Portrait source tick 319 | 100.0 | 0.1 | 38.4 |

**Found causality:** `games/infinite-tower-climb/src/presentation/snapshot.ts` emits the guardian in a `state.enemies.filter(e => e.floor === state.floor)` projection **without enemy.floor**. The source-owned world F8 prebuild guard required `e.floor===8`, impossible for ALL legitimate render snapshots. Thus the expected early prestage never started. The existing real-Three test fixture included an invented `floor:8` enemy property, so its passing tests had masked the production regression.

## Production repair and safety

[Source+fixture commit `170403ec12731d14b0ad924dc417edb776f3b764`](https://github.com/my-edutu/Ai_games/commit/170403ec12731d14b0ad924dc417edb776f3b764) removes the impossible mandatory enemy.floor check for the already current-floor filtered snapshot; if an optional numeric floor does appear it still must match current floor. Requires authentic guardian id, nonnegative finite health, proper F8 cap geometry, genuine guardian gate, same run, low tier and valid source. **The original CPU prestage is STILL INELIGIBLE for F9 reuse until an actual returned F8 WebGL submission certifies it**; missing return falls back to exact source extraction, not a fake gateway or floor. Tests now use the real published enemy shape, with explicit no-floor assertion and existing returned/never-returned cache contracts. No game simulation, guardian rules, physics, snapshots, platform geometry or PR58 changed.

The [exact-code quality workflow](https://github.com/my-edutu/Ai_games/actions/runs/44699865746) was **QUEUED at code commit**. This is a safety veto, not a quality score. A new 9-job immutable candidate/baseline recording is requested by the updated capture-request ledger; evaluate the resulting workflow/artifacts, not a pending claim. The preceding green quality workflow [44697587666](https://github.com/my-edutu/Ai_games/actions/runs/44697587666) predated the repaired source contract.

## Separate specification / engineering / experience reviews

**Specification:** Genuine published snapshot contract, no synthesized guardian, no future F9 prebuild, frozen baseline and PR58 untouched, same-run F8 WebGL return required for reuse. No unrelated games, merge, deployment, draft change or force-push.

**Engineering:** The repaired guard is necessary to enable the original bounded GPU source-owner reuse, but not sufficient proof of decreased CPU latency. Moving extraction from F9 to F8 may frontload a CPU spike. Inspect first-F8 costs alongside first-F9 costs, real renderer-return latencies and full-motion pixels. The old-room optical handoff remains a separate P0 defect.

**Acceptance/next highest-impact action:** For exact new source SHA, verify `prepared-from-actual-floor-eight-source-awaiting-webgl-return` → `source-built-gallery-confirmed-by-real-floor-eight-return` → `reused-on-real-floor-nine-rebuild` in actual candidate danger A/B desktop+portrait. Quantify CPU and render work; inspect unmodified frames for consecutive actual source-aligned full-body hero, opened original bronze gate and real walkable F9. If optical 0/2 remains, rebuild physical scene/camera/foreground composition together before P1. LOOKS/FEELS/PLAYS independent critics **0/5 each**; supported-device p50/p95/p99/memory **NOT EVALUATED**. Full transformation **NOT EVALUATED**.
