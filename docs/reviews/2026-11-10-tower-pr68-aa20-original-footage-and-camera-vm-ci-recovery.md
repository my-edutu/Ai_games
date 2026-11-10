# Infinite Tower Climb PR68 — P0 authentic film comparison and camera VM integrity recovery (2026-11-10)

**Stage:** P0 EVIDENCE + GAME-LOOP TRUTH **OPEN**. **Leading verdict: NOT EVALUATED**. Same open DRAFT PR #68, no main/PR58 edits. Frozen baseline `1731b380851162741761c5569e2bc152a0869ca9` unchanged. This commit is an observed CI blocker correction, **not** a game-transformation claim or a new game-production change.

## Actual video and source inspection

Source-pinned [10-job original-host workflow](https://github.com/my-edutu/Ai_games/actions/runs/42802266846) completed all 10 jobs at candidate **`aa20f168581995eed5161ce62974afc49597dc4a`** and frozen baseline. Its [source/video pairing index](https://github.com/my-edutu/Ai_games/actions/runs/42802266846/artifacts/13756739756) reports 16 unmodified WebMs, 8/8 calibrated native timebases, zero source-story or provenance defects, but explicitly `fullMotionPaired=false`. This is **source sequence and recording transport**, not a visual assessment of event causality or reviewer preference.

Downloaded original [candidate danger 960×600 and 390×844 WebMs](https://github.com/my-edutu/Ai_games/actions/runs/42802266846/artifacts/13755854596), compared directly against the [frozen baseline danger WebMs](https://github.com/my-edutu/Ai_games/actions/runs/42802266846/artifacts/13756513832) at native 10,12,14,16,18,20,22,24,26,28 seconds. At **portrait 12–24 seconds**, candidate hero/guardian are often small and separated by large stretches of air, a bright cyan lattice, bronze arms and dominant steel. The frozen baseline more consistently puts the hero and antagonist near readable size. The later candidate landscape/machinery does not by itself demonstrate quality improvement. **Important visual defect: the live guardian exchange loses its two-body readability despite source-credible combat.** Desktop candidate also frequently makes the active figures small relative to machinery. These are actual native-frame observations, **not** a full-speed reviewed, event-to-pixel-certified clip or independent blind vote.

Candidate danger portrait source floor8→9 **tick451** is aligned to native ~**22.18s** by the calibrated source index; sampled later frames at 26s already show floor nine. Candidate [outcome video](https://github.com/my-edutu/Ai_games/actions/runs/42802266846/artifacts/13756204076) is retained, but its complete result/intermission/restart cinematics and guardian threshold have NOT been accepted as independently matched full-motion causality. Do not infer every source beat appears clearly on screen.

## Exact-head CI veto and source-correct fix

[Exact candidate quality 42802266727](https://github.com/my-edutu/Ai_games/actions/runs/42802266727) completed with **9 of 1313 Node tests failing**. All nine identified failures are `ReferenceError: guardianLiveFightLockPriority is not defined` in the following source-scene VM regressions:

- `tests/phase3/tower-character-rig.test.cjs` (2 projections)
- `tests/phase3/tower-encounter-composition.test.cjs` (4 camera tests)
- `tests/phase3/tower-landing-beacon.test.cjs` (3 destination tests)

Production `public/infinite-tower-climb/visuals/scene.mjs` already imports `guardianLiveFightLockPriority` and related functions from `guardian-gate-intrusion.mjs`. Each failing VM harness removed ESM imports then forgot to inject that genuine module into the evaluation context. This correction loads the actual shipping pure module in each harness and passes its unchanged exports into the production scene VM; it does **not** substitute mock values, loosen tests, or modify any source-authoritative rule.

**Verification limits:** exact-patch test execution, quality workflow result, new after-patch source-pinned capture and physical-device data are **NOT EVALUATED** at this commit's authorship. Already completed capture remains tied to the exact **unchanged production game source** at `aa20f168581995eed5161ce62974afc49597dc4a`; the test-fixture commit changes only quality harnesses and evidence. No fabricated green CI or gameplay upgrade.

## Spec, risk and next

Specification: retain P0 until full original loop evidence, genuine physical gateway crossing, video clarity, and restart all accept. Test harness must evaluate all relevant shipping imports, preserve authoritative snapshot invariants, and must not silently convert a missing import into a fake camera policy. No game rendering, replay, gameplay, audio, privacy or accessibility code changed; resource impact of this commit is test-run-only. The major gameplay shortfall **remains**. Next, verify exact-HEAD CI, then pursue one holistic original upper-cap fight reconstruction with closely readable authentic hero/guardian, faithful stage geometry, source crusher feedback, grounded lock passage and floor-nine landing. Film again in matched desktop/portrait normal speed. LOOKS **0/5**, FEELS **0/5**, PLAYS **0/5** independent blind reviewers. Actual physical-device frame-time p50/p95/p99 and memory **NOT EVALUATED**. Full transformation **NOT EVALUATED**.
