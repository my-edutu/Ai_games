# PR68 P0: portrait original-game render budget from true source-pinned film

2026-11-09. Stage **P0 OPEN**; assessor **NOT EVALUATED**. Same draft PR #68 branch, PR58/main unchanged.

## Evidence read before implementation

Immutable candidate source `3ed44c36086cb015b8d833eae0ec45fe2f0b3885` and baseline `1731b380851162741761c5569e2bc152a0869ca9` were recorded in the original 10-job workflow https://github.com/my-edutu/Ai_games/actions/runs/42658123598 . Every job completed successfully; the source-pair manifest records 8 comparable scenario/viewport chains, still **ungraded** and without independent full-motion review. Candidate original danger artifact: https://github.com/my-edutu/Ai_games/actions/runs/42658123598/artifacts/13692763346 . Source pair index: https://github.com/my-edutu/Ai_games/actions/runs/42658123598/artifacts/13692793236 .

From the original **390×844, 71.68-second, unchanged WebM**: sampled native 10–31-second frames show a large decorative steel wheel dominating the action at about 14–18s. Source-attested floor-nine threshold tick 451 is CALIBRATED as a video search time of ~22.73s, but sampled film first shows the nine-floor HUD around ~25s. Native calibration is a search window, NOT proof a source event is actually visible; exact cause of the gap remains unproven.

More importantly, the source-linked existing `motion.json` rendering diagnostic reports **JS render-submission intervals**, p50 **216.5ms**, p95 **596.1ms**, p99 **808ms**, sample count 240; scene submits roughly 100 draw calls and 160,000 triangles during floor eight. The 3D canvas is clearly struggling in Chromium software WebGL. This does NOT represent hardware/compositor FPS or measured display frame pacing, and does not prove it alone caused the floor-nine discrepancy.

## Connected implementation

Source commit: `df509f2329df9c50660218c30c009e29e1b1f4da` `perf(tower): make phone WebGL action budget responsive to measured overload`.

- `public/infinite-tower-climb/visuals/scene.mjs`: low-tier startup no longer requests expensive MSAA color buffers. The existing hysteretic JS update/render-submission overload policy now protects mobile too, with a **78% linear resolution minimum** for compact layouts, compared with the existing 60% desktop emergency bound. Recompute from CSS canvas dimensions rather than `innerWidth`, reset budget on actual mobile↔desktop viewport changes, restore resolution after sustained healthy submissions, and retain user-selected art quality and the native DOM/HUD text. No gameplay or tick authority touched.
- `tests/phase3/tower-adaptive-resolution.test.cjs`: same original Three-scene fixture now checks initial low-tier MSAA, live 390px resize and reduced pixel density floor, orientation reset, plus a source-measured 216/596ms overload sequence. Existing desktop policy tests retained.
- `tests/browser/tower-live-motion.spec.cjs`: every original source-timed viewport observation now records `renderResolution` so actual adaptive behavior can be checked against the unmodified WebM without guessing that frame calls imply GPU FPS.

No new geometry, characters, camera cuts, simulation decisions, guardian mechanics, route platform or actual gate acceptance are asserted. No positive LOOKS / FEELS / PLAYS score is awarded.

## Unproven and highest-impact next step

The change is source-committed but **new exact-HEAD original Node22/Three/browser tests, desktop/portrait film and device results are NOT YET VERIFIED**. Run fresh source-pinned original 9/10-job workflow with the frozen 1731b380 baseline, verify `renderResolution` on mobile, and visually inspect every original 60+s ascent/danger/outcome segment including earned gateway and floor-nine on both viewports. Measure p50/p95/p99 submission intervals as a conditional diagnostic, not hardware FPS. If source-to-visible delay and giant occluder remain, tackle camera/world action visibility rather than tuning tests.

Independent randomized fresh-context votes: LOOKS **0/5**, FEELS **0/5**, PLAYS **0/5**. Supported hardware performance/memory: **NOT EVALUATED**. Transformation verdict **NOT EVALUATED**. No merge, deployment, force-push, baseline move or draft-status change.
