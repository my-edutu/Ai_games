# Tower PR68 — P0 source-earned Floor 9 first playable 3D frame, far scenery deferred

**2026-11-12. Stage P0 OPEN. Assessor: NOT EVALUATED.** Branch: `feat/tower-transformation-gauntlet-20261101`. Frozen immutable source: `1731b380851162741761c5569e2bc152a0869ca9`.

## Verified actual evidence, not a test-score proxy

Inspected real source-pinned 10-job [43113060409](https://github.com/my-edutu/Ai_games/actions/runs/43113060409), candidate `3ffa8d797ac9a4042e9408eb4fd20b348695ddb2`. All eight original baseline/candidate normal-speed film jobs succeeded with authentic source trace; [exact-head quality 43113060331](https://github.com/my-edutu/Ai_games/actions/runs/43113060331) passed. Strict native event/raster alignment remains **0/2**. The unchanged candidate **portrait 73.2s** and **desktop 72.12s** source-original films show a real climber traversing the outer cap gallery and then a hard visual shift to purple Floor9. The actual grounded crossing at source tick451 is not a clearly legible physical door passage in either film. Narrow portrait guardians/crusher visuals remain busy with bronze scaffolding and a cyan seal. No credit for complete experience.

Authentic native scene phase around Floor9 tick451: portrait source *23.7937s* versus genuinely drawn HUD *25.50s* (1.706s gap); desktop source *23.0519s* versus drawn HUD *25.00s* (1.948s gap). The candidate browser source Floor9 HTTP acceptance followed the source event quickly, but returned WebGL submission only **~849ms portrait** and **~1168ms desktop** later. The gap between returned renderer and native film is also unresolved. These are **different clocks**; no one may claim CPU, GPU, GPU-present, or encoded-film causality without measured profiling. Full source→raster visual proof has not passed.

## Actual implementation — commit [`277ea360`](https://github.com/my-edutu/Ai_games/commit/277ea3605e1ee278c0b78532ef081635d678462f)

I separated **playable new-floor first presentation** from **distant cosmetic geometry creation** in the original `world.mjs` and native `scene.mjs`. After the *public, same-run, source-defeated, grounded* guardian cap and next-floor grounded handoff, the first Floor9 frame constructs normal physical tower architecture, platforms, hazards, canyon depth, lighting and real climber—without blocking on seven remote low-tier citadel silhouettes. Only when an **actual first `renderer.render` call returns successfully** may that far decorative batch build on a later frame, fading through scene fog over ~0.55s. Failed renderer, missing real guardian, other run, stale source, low/high switch or scene dispose never starts/leaks the job. The rest of the game is unchanged. Later floors, other game modules and the frozen baseline are untouched.

The deferred job is **one bound resource** with no new worker, setTimeout, authority tick, action, replay, GPU pass, shadow, collision, fabricated victory or extra cinematic camera. Its diagnostics report first-frame build CPU ms and deferred-far-build CPU ms, while explicitly **not** claiming presented FPS. The focused source+actual Three.js tests live at `tests/phase3/tower-earned-floor-arrival-budget.test.cjs`. This is a plausible scene-transition optimization and concrete **production change**, **not yet a demonstrated visual/performance improvement**.

At review time [CI `43121814838`](https://github.com/my-edutu/Ai_games/actions/runs/43121814838) was running. New original film from this implementation was NOT YET captured. A separate `capture-request.json` write explicitly asks the unchanged nine-job original-source run pinned to the request HEAD, without editing the frozen SHA.

## Hard gates and next action

Keep **P0 OPEN**. First check exact-head quality (a red CI vetoes this candidate) and all original WebMs in normal speed, compare source tick451, browser HTTP acceptance, returned WebGL frame, native encoded HUD and real body/threshold movement in 960×600 and 390×844. Preserve moving platforms, real hazards, Floor9 onward, genuine result/intermission/restart, reduced motion and low/high resources. If distant art pops or the full-body gateway gets worse, revert this staging; do not promote the stage based on metrics alone. Source baseline vs candidate must remain frozen.

**Independent LOOKS 0/5 · FEELS 0/5 · PLAYS 0/5. Actual physical-device p50/p95/p99 and memory NOT EVALUATED.** Real reviewer preferences ≥4/5 each cannot be inferred from code, tests or source traces. No merge, deployment, force-push, PR58 change, baseline move, or PR draft-status change.
