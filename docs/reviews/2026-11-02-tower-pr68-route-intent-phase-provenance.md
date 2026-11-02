# Infinite Tower Climb PR68 — route-decision legibility and source-phase provenance
**Date:** 2026-11-02  
**Status:** TRANSFORMATION OPEN — NOT EVALUATED, not a Gauntlet quality win  
**Branch:** `feat/tower-transformation-gauntlet-20261101` (draft PR #68, based on PR #58)

## Frozen authority and decision

Baseline remains **`1731b380851162741761c5569e2bc152a0869ca9`**. Earlier real portrait footage showed the climber leaving the image and guardian/gate activity outside its crop. The recent 3D camera, HP-driven mechanical guardian and source-authentic terminal scene cannot be called a successful whole-game transformation from source code alone. This continuation improves a related systemic gameplay-viewer gap: a landing beacon can mark a deck without showing **which actual autonomous decision connected the climber to it**. The existing source choice is now rendered as a sparse 3D, depth-tested direction sequence. When a real attack telegraph or the climber's own attack happens, it yields the screen to danger. Genuine contact still uses the existing source-observed touchdown ring. No new text or progress tracker enters the game viewport.

## Real executable changes

- `public/infinite-tower-climb/visuals/route-intent.mjs`: original 5–12 instanced direction stones, bounded to one additional draw when active. Every marker is sampled from the immutable public player/platform/intention snapshot at the existing tower's exterior radius. Its vertical arc illustrates a **choice**, not predicted jump physics or a guaranteed landing; finite-depth-test occlusion remains enabled. A new run, lost/paused feed, terminal state, active attack, source telegraph or missing target removes it. A static reduced-motion variant does not pulse.
- `public/infinite-tower-climb/visuals/scene.mjs`: integrates the authored object with the **actual playable Three.js scene**, selected by `intendedLanding(snapshot)`, with ordinary world-graphics rebuild and teardown resource ownership; adds passive diagnostic state.
- `tests/phase3/tower-route-intent.test.cjs`: source-authentic frozen fixture, exterior geometry/one-batch bounds, combat priority, terminal/restart clearing, reduced-motion stability and once-only disposal contracts.
- The shared real-gameplay capture harness now includes the live route diagnostic per sampled WebGL view and a **CI-only bounded phase trace of every real 20 Hz simulation step** (run token, lifecycle, source result, guardian HP, platform target). The source trace is explicitly **not footage**. It is meant to explain why an immutable baseline with a 50ms source result can pass from running to intermission before the slower browser observer polls. It does not fake, extend, pause, replace or replay a source result. The same capture host code is copied to the baseline and candidate sources by the existing workflow.

## Evaluation and safety

This run successfully created the route module, integrated it into the scene, added source contract tests and extended the shared trace harness on the GitHub draft branch. The new and modified JavaScript was checked by V8 syntax parsing before publication. The independent workspace returned `NOT_FOUND: Tunnel-client has not been seen for 300 seconds`; a genuine browser/Three.js runtime check, complete unit-suite execution, exact-head CI, fresh randomized independent critiques and supported-device GPU timing were **not completed** in this execution.

One draw call and twelve small triangle meshes is a source-level cost estimate, **not** an FPS claim. Existing deterministic simulation, AI decisions, collisions, replay, config, recovery and privacy remain unchanged; CI trace is opt-in and bounded at 2,200 public-only ticks. Exact-head safety workflows are veto gates once completed. Roll back by reverting the four gameplay/harness changes in this continuation, not by rewriting PR58 or the frozen baseline.

## Fresh-context critic brief / next evidence

Watch unedited **normal-speed 60s+** desktop `960×600` and portrait `390×844` **baseline and new-source videos** for ordinary AI navigation, hazardous/guardian combat and genuine result/intermission/restart. Confirm route stones communicate current intent without implying guaranteed flight, do not obstruct danger cues or the climber, stay physically outside masonry, and disappear on actual landing or attack; see whether the current camera loses the actor or whips. Use source tick/target trace to align events, never to substitute for footage. The frozen baseline result's visual brevity remains a blocking comparison issue unless the actual video visibly contains it.

Five independent blind randomized full-motion judges must still separately prefer candidate for LOOKS, FEELS and PLAYS by 4/5 each, without P0/P1 regressions. No such judgment was available; each pillar remains **0/5**. Current source-pinned video for this change has not been watched, and real supported-device p50/p95/p99 plus memory remain missing. Maintain **NOT EVALUATED**. PR #58 is untouched, and this PR is not merged or deployed.
