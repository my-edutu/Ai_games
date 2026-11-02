# AI Dungeon — Gauntlet Round 036: Soft cloth silhouettes on true textured rigs

**Branch:** `feat/ai-dungeon-3d-gauntlet-foundation` · **PR:** #49 (draft). **Benchmark:** Diablo IV authentic dungeon captures primary; No Rest for the Wicked environments and Path of Exile 2 combat secondary. **NOT MET.**

## Proven gap and bounded increment

The preceding actual Chromium WebGL evidence (Round 34), inspected for Round 35, shows textured heroes but rigid hanging cloth silhouettes. Round 35's party-space architectural cutaway helps expose the encounter, but it does not make cape/robe motion convincing. This increment deforms the vertices of the *original existing* six archetypes' cloth panels, keeping the shoulders pinned and bending hem weight by authoritative action type (idle/move/attack/cast/hurt/guard). It is secondary render-only motion, not a gameplay cloth solver.

A pure finite function `planDrapeVertexBend` defines up to 0.145m displacement plus small lateral/vertical sway. Each panel stores immutable reference coordinates and resets from that base every frame: no integrated drift, no physics/tick coupling and a stationary reduced-motion variant. The existing WebGL meshes and materials are reused; no new actors, lights, draw calls, meshes, textures, asset dependencies or outside licenses. Normal vectors update after vertex changes. Each rig's allocated arrays are retired with the actor's asset geometry.

## Test-first and verification contract

Separate test-first commit introduced three focused Node test contracts and a real Chromium diagnostic gate *before* the planner and renderer code. It checks six actions and finite ages, pinned seams, movement distinction, per-vertex bounded offsets, deterministic recomputation, input safety, GPU buffer update integration, actual test discovery and a real WebGL trace metric. This is a deliberate TDD red stage; no suite pass is claimed until observed.

Exact new browser capture must continue to show genuine three-dimensional heroes, cloth counts, `draperyPeakDeformationMeters` between 0.005 and 0.19m, mobile readability, zero missing assets/page errors and bounded draw calls. The updated `dungeon:test` script also runs the previously omitted existing fabric-panel foundation suite; validation counts must not be inferred.

## Harsh quality and release verdict

This improves a specific stiffness defect but **does not** create anatomically rich hero/enemy GLBs, physically simulated textiles, high-fidelity PBR textures, fluid motion-matched strikes, realistic stone lighting or Diablo IV parity. A fresh-context critic and ultracode are unavailable because the worker tunnel is offline. No blind matched A/B, long soak, mobile p95, full CI success, or production certification is claimed. Review real exact-head screenshot/video before accepting artistic benefit. **Do not merge.**


## Exact-code acceptance evidence and actual image/video critique

**Verified code:** [`9c395523c`](https://github.com/my-edutu/Ai_games/commit/9c395523c866e8c688fc427cfa98bd7443469a95). Dedicated [run 41217522937](https://github.com/my-edutu/Ai_games/actions/runs/41217522937) completed successfully: **79/79 Dungeon foundation tests** (including the three new test-first cases), **17/17 presentation/interface/progress tests**, **55/55 genuine Chromium tests** across three independent browser shards (19+18+18), and **24 seeds × 900 authority ticks, zero deterministic discrepancies, highest floor 9, 401 advances, 89 restarts**. The browser suite exercised new real-geometry `draperyPeakDeformationMeters` bounds (above 0.005 m and at most 0.19 m) along with the pre-existing real asset, mobile, hero visibility, and GPU-budget assertions; no test was skipped or mocked.

Actual exact-code fabric [desktop/mobile captured WebGL images](https://github.com/my-edutu/Ai_games/actions/runs/41217522937/artifacts/13048709176) and real [desktop/mobile world and browser-playback evidence](https://github.com/my-edutu/Ai_games/actions/runs/41217522922/artifacts/13048484151) were downloaded and inspected. A frame from actual Playwright video around 8 s showed live three-hero/enemy scene, ongoing autonomous combat and minimalist HUD. No visually obvious torn cloth, stretched neck seam, missing assets or blank screen was seen. However, the new movement is hard to distinguish at the wide spectator camera distance. Character mesh anatomy is still stylized and underspecified; shadowy slablike walls, bright overhead orbs and square hallways dominate the composition. **No independent visual-preference or Diablo IV parity improvement is proven.** A Round 34 comparison screenshot includes intervening Round 35 visibility changes; it cannot isolate cloth quality in a blind A/B.

The [separate visual review run 41217522922](https://github.com/my-edutu/Ai_games/actions/runs/41217522922) passed. The [full catalogue CI 41217522923](https://github.com/my-edutu/Ai_games/actions/runs/41217522923) is still running as of this review receipt; **do not count it green**. An independent fresh-context critic/ultracode still could not connect (worker tunnel offline). The game is not production ready; keep PR #49 draft and unmerged.

**Priority after this increment:** original higher-definition, distinct hero and enemy anatomy plus readable hand-to-target attack/cast/recovery motion, supported by multi-seed long-running performance capture and independently judged genuine gameplay reference frames.
