# Infinite Tower Climb PR68 — source-selected airborne guardian camera continuation

**Stage:** P0 EVIDENCE + GAME-LOOP TRUTH — OPEN  
**Date:** 2026-11-09  
**Implementation:** [22a57d977ff0967a469ce6f6fe9664f633c64e57](https://github.com/my-edutu/Ai_games/commit/22a57d977ff0967a469ce6f6fe9664f633c64e57)  
**Base:** 1731b380851162741761c5569e2bc152a0869ca9 (unchanged)  
**Verdict:** **NOT EVALUATED**; this is not a transformation acceptance.

## Actual visual evidence and largest defect

Recovered two original, unedited 390×844 source-pinned normal-speed danger WebMs from [the November 7 capture workflow](https://github.com/my-edutu/Ai_games/actions/runs/42426089449): candidate [artifact 13594459833](https://github.com/my-edutu/Ai_games/actions/runs/42426089449/artifacts/13594459833) (renderer `e0fe77294359c32c84cdcff3c0698ba0c7e3a067`, ~71.12 seconds), baseline [artifact 13594988657](https://github.com/my-edutu/Ai_games/actions/runs/42426089449/artifacts/13594988657) (frozen `1731b380851162741761c5569e2bc152a0869ca9`, ~71.40 seconds). Both are historic, NOT current implementation. Sampling the temporal sequence shows oversized near-side clockwork/steel rim dominating the portrait image at ~16.5–18 seconds, and an airborne climber/guardian too small or obstructed for a credible two-body encounter. Later 3D gear and camera changes remain unverified. Event browser-observation offsets have NOT been certified to native WebM presentation timestamps. Floor-nine imagery in these older films is supporting observation, not evidence the latest source completes a real walkable threshold.

## Root cause addressed and actual committed playable-source change

The existing source-observed guardian duel close-up was restricted to `p.state === 'standing'`. On rapid, genuine airborne guardian exchanges the same camera-size correction was withheld just when the previous film showed the smallest foreground-obscured actors. Rather than another camera controller, this commit extends the SAME original world-space radial duel lens to airborne actors when their current `snapshot.intent.targetPlatformId` exactly matches a real positive-dimension target platform. The physical route is not inferred or modified.

- `visuals/duel-lens.mjs`: accepts an airborne step only with NDC-clipped real landing before and after. Rejects a landing outside the portrait action area or one whose distance from the viewport center worsens by over 0.045; existing guardian/player silhouette and solid-core constraints still veto.
- `visuals/scene.mjs`: samples authentic projected source landing before/after camera movement, caps midair radial movement to 0.46 (grounded remains 0.85), rolls back failed framing, reuses existing cached arrays, and records bounded `duelAirborneApplications`. No extra camera, render pass, animation clock, draw call, source tick, or gameplay mutation.
- `tests/phase4/tower-duel-lens.test.cjs`: additional genuine input accept/reject scenarios and exact source integration/rollback guards.

No action was taken on Tiny Kingdom, Maze, AI vs 1000 Floors, PR58, main, deploy, merge or draft status.

## Verification, compatibility, limitations

**Passed (isolated only):** 6 pure V8 red/green-style policy probes covering valid airborne, missing landing, unsafe/offscreen landing, drift, guardian occlusion, preserved grounded mode; exact GitHub readback; V8 parsing of full modified scene, lens and CJS test module. These are source checks, not the original repository Node/Three.js test runner.

**NOT RUN:** full Node22/Three tests, 3200-tick deterministic end-to-end original runtime, Chromium source capture, event-to-native PTS binding at this SHA, real 960×600 and 390×844 new 60+ second matched recordings, hardware p50/p95/p99 and memory; independent randomized fresh-context LOOKS 0/5, FEELS 0/5, PLAYS 0/5. Local coding tunnel reported disconnected; previous quality run [42551931345](https://github.com/my-edutu/Ai_games/actions/runs/42551931345) remained pending. A camera policy accepted by source tests can still produce visible oscillation, tiny actor or wheel occlusion; none is claimed solved.

**Safety:** authoritative 20-Hz physics, target selection, guardian HP, gateway, floor advancement, result/restart and immutable baseline unchanged. Reduced-motion, stale-state, overview/manual modes remain guarded by the scene's existing conditions. Full effect on future source-frame snapshots and WebGL runtime remains untested. No performance or UX benefit claimed absent current film.

**Next action:** restore an executable approved game checkout or assigned runner; run the full tests and two authentic same-run guardian/crusher-to-grounded-gateway/floor-nine/outcome/restart campaigns. Record new 60+s baseline/candidate desktop/portrait matched original gameplay with event-aligned native WebM. Inspect the full uncut action and rebuild the single largest visible systemic defect before advancing from P0. Separate actual-device and genuine blind acceptance criteria remain mandatory.
