# P0 — Reconstruct the authentic Clockwork load path at the Floor 8→9 threshold

**13 November 2026. Stage: P0 EVIDENCE + GAME-LOOP TRUTH OPEN. Leading transformation verdict: NOT EVALUATED.**

## Observed before change (unaltered original-source video)
[Original nine-job campaign 43466814378](https://github.com/my-edutu/Ai_games/actions/runs/43466814378) produced eight >=60s baseline/candidate 1× normal-speed videos. The real floor-eight guardian HP-zero and Floor9 progression are source-observed, but the **native pixels do not show the same bronze doorway and full climber continuously in either 960×600 desktop or 390×844 portrait**. At approximately 25.0–25.5s desktop and 24.5–25.0s portrait, the original bronze world becomes a disjoint violet ninth-floor composition; event-matched native acceptance **0/2**. This remains the dominant experience defect, not a shader-score problem.

## The renderer-system defect selected this run
The already-installed original-world continuation kept the actual source-owned `f8:cap` deck and `AuthoritativeGuardianGate`. It also extracted a source-original structural gallery, but previously gathered only the **first eligible triangles in order of the scene's rigid material batches** until the 3,600-face cap. The retained architectural load path therefore depended on material enumeration instead of physical proximity to the actual doorway. Nested and instanced genuine original supports were not selected. This can leave a retained gate surrounded by missing or irrelevant structures even while source and camera report both subjects in-frustum.

## Implementation
Production commit [98828d00](https://github.com/my-edutu/Ai_games/commit/98828d00eb4b43798e32e185b3fc3cbd57b32638) in `public/infinite-tower-climb/visuals/world.mjs` reconstructs the bounded historical gallery **from original floor-eight Three.js meshes**, selecting eligible source structural and rigid-batched triangles by nearest real door/cap corridor, not material traversal order. Original mesh parent transforms and instance transforms are honored; position, normal and UV are copied from original source geometry. A modest per-material structural share preserves multiple nearby bearing elements before remaining faces are distance-ranked. Original platform, hazards, gate and ambient FX are excluded; the true cap/gate remain managed by their preexisting source owner.

The same limits remain: at most 4,096 original source triangles and 10 material batches (3,600/8 default), no extra shadow casting, no independent camera or post-process, no invented actor, collision, route, platform, boss defeat, floor, authority or gameplay time. Retained 3D resources still retire via the existing source- and real renderer-submission-bounded handoff.

Focused real-THREE regression contract committed at [0bc98c4f](https://github.com/my-edutu/Ai_games/commit/0bc98c4f6d2c3e67847d90b964cc6457752bd431) in `tests/phase3/tower-original-threshold-gallery-priority.test.cjs`; verifies nearest-original selection instead of first batch, authentic nested instance transform, strict cap, and no copies of gameplay or boss gateway. **These tests require actual CI execution; committing is not passing.**

## Verification and vetoes
- [Exact-source quality 43488353746](https://github.com/my-edutu/Ai_games/actions/runs/43488353746) at production SHA: in progress at inspection.
- [Exact-source quality 43488848063](https://github.com/my-edutu/Ai_games/actions/runs/43488848063) at focused test SHA: pending at inspection.
- Previous [quality 43485277658](https://github.com/my-edutu/Ai_games/actions/runs/43485277658) passed all 13 real retained-world tests in phase3-3 and 9/10 jobs total, **FAILED** phase6-0 due to an unrelated Maze test timeout. We are not authorized to edit Maze, exclude tests, or claim overall CI green.
- Native source-pinned full-film inspection for **this changed renderer is NOT EVALUATED**. No frame-rate, GPU time, memory, human review or 4/5 vote is claimed; new source-selected faces might or might not improve real 1× pixels. The local coding tunnel was inaccessible; independent local Node execution was unavailable.

## Next acceptance action (remain P0)
Request new **nine-job exact-SHA 1× real capture** against this change, with unchanged baseline `1731b380851162741761c5569e2bc152a0869ca9`, seed, low tier, 960×600 and 390×844, ascent/moving/danger/outcome+restart 60s+ each. Inspect authentic 22–31s passage frames and full native video including Floor9 onward. Join actual source guardian crossing, browser acceptance, Three.js return, native compositor PTS and pixels; reject a new violet cut even if 3D structure counts improve. Reopen architecture/camera-depth reconstruction if the original doorway/body shot still breaks. Verify resource budgets and correct any genuine CI regression, never alter forbidden Maze or PR58.

Independent blinded reviewer counts: **LOOKS 0/5; FEELS 0/5; PLAYS 0/5**. Target hardware p50/p95/p99 and memory **NOT EVALUATED**. No blind votes or favorable results inferred.

**Safety:** PR #68 stays open and draft on PR58, frozen baseline unchanged; no deployment, merge, force-push or other-game edit.
