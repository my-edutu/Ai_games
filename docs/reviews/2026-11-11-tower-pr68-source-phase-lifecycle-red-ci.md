# Tower PR68 — P0 first submitted 3D phase and lifecycle CI veto

**Date:** 2026-11-11. **Stage:** P0 OPEN. **Verdict:** NOT EVALUATED.

### Evidence inspected before work

The [real 10-job source-pinned capture](https://github.com/my-edutu/Ai_games/actions/runs/43108948655) has all eight original baseline/candidate films and passes source-chain integrity but **fails guardian/native event acceptance 0/2 viewports**. At source tick 451 Floor 9 is logged ~23.3198s desktop and ~23.0791s portrait, while native video drawn HUD/violet scene appears ~26s and ~25.75s. Approximate source-to-raster discrepancy **2.68/2.67s**. Actual physical crossing and fullscreen combat legibility are NOT accepted.

The [exact source quality run](https://github.com/my-edutu/Ai_games/actions/runs/43108948807) **FAILED** 16 lifecycle tests with `ReferenceError: createPresentedPhaseLatch is not defined`, because the old VM harness stripped ESM imports without supplying the recently added real latch module.

Code review also found a real viewer-truth bug: a pending *first normal* frame changed `scene` to recovery but kept the **unsubmitted** `snapshot`, allowing the HUD to display its Floor 9/tick/score while Three.js had never submitted it. The provider status branch could claim LIVE in that state.

### Changes

- Execute the actual shipped ESM latch and cadence helpers in the lifecycle VM fixture, preserving behavior instead of stubbing the contract.
- Its scene test boundary separates HTTP acceptance from an explicitly controllable Three.js render return, letting old lifecycle tests and new delayed-frame tests represent their intended behavior.
- On a normal first frame with no accepted render submission, show a source-neutral recovery placeholder, suppress source-derived floor/tick/height/run token, and keep provider status degraded. After exact snapshot submission, render the matching HUD; stale submissions cannot advance it. Real result, intermission, recovery, upgrades and failed WebGL retain source-only accessibility.
- Add source-identity Floor 8→9 and true result→restart client integration tests. No authority, hero, collision, replay, capture, PR58, or baseline change.

**Code commits:** test `47ae57011994d1a5f77fa9ba97375d631b6ba298`; app `45d2e562f62d7ce4f495dbfc87f590b021fdbdd2`. Source acceptance is not GPU-present or video-pixel proof.

**After-change full CI:** NOT VERIFIED at review time; the previous 16 failures are not marked resolved by assertion. **After-change original WebM:** NOT CAPTURED. **Device p50/p95/p99 and memory:** NOT EVALUATED.

LOOKS 0/5 · FEELS 0/5 · PLAYS 0/5. **Next:** obtain passing full CI, new 60s+ real A/B films with native PTS and source/render receipts, inspect all phases in full motion, and fix the real guardian/gateway and 2.7s event alignment defect before advancing P0.
