# Pass201 — release only GPU geometry not used by surviving public meshes (2026-11-08 UTC)

**Scope:** Same OPEN DRAFT PR #53, branch `feat/maze-3d-gauntlet`. Official Nintendo Captain Toad benchmark **NOT MET**. Never merge, deploy, force-push or weaken tests/framing.

## Grounded exact-source failure

[Pass200 exact-HEAD WebGL run 42422976996](https://github.com/my-edutu/Ai_games/actions/runs/42422976996) FAILED the six-run maximum geometry spread: **37,37,42,42,46,46**, spread **9 > unchanged 8**, while every sample was **<100**. Each sampled start referenced **37 live scene geometry objects** and one visible Pip; public guide geometry ID 148 remained stable. Pass200 improved the previous 98-geometry regression, but did NOT close Phase-0. The dedicated Maze Node/Three tests and stream passed before the browser failure. [Whole-repo CI 42422976901](https://github.com/my-edutu/Ai_games/actions/runs/42422976901) independently fails at missing unrelated Tiny Kingdom `tiny:stream:self-test`.

The physical CPU rig shares primitive cache references between Pip and Thornback, but `finish()` rigid-batches some meshes and removes their original geometry from the RENDER scene. Therefore `refs > 1` does not necessarily mean a live Pip GPU user exists. Pass200's detached-rig GPU release incorrectly preserved some rendered-only Warden resources across resets.

## Smallest worthwhile correction (new-HEAD verdict pending)

Immediately after disconnecting a **publicly witnessed** Warden from the scene, collect the **surviving visible scene mesh geometries** and protect only those from GPU eviction; safely dispose other Warden-owned registration buffers even with stale shared CPU references. Keep the exact original Warden rig and immutable CPU vertex arrays for actual subsequent public redisclosure, while protecting Pip and other visible actors. Strict installed-Three regression now attaches both actors, checks that ALL guardian-only geometries release and actually Pip-shared shapes remain, then checks physical rig identity after redisclosure in balanced and full modes. No simulation/AI/collision/hidden-route/observable camera/44px HUD/acceptance-threshold changes.

**Not approved yet:** no connected local Node/Chromium workspace or fresh-context workers/Ultracode. No claim of new-HEAD WebGL six-run pass, full-screen source screenshots, independent image judgment, hardware GPU FPS or Nintendo-level gameplay. Previous authentic mobile pressure scenes remain visually crowded. Next gate: exact new-HEAD source-bound CI, six-run counts and SHA-verified no-crop 320/390/844/1280 WebGL captures. If Phase-0 passes, next largest player-visible gap is clear mechanism/Pip/Thornback causal scene readability, not ornament count.
