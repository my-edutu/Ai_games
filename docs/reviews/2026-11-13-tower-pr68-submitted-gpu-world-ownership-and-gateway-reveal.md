# Tower PR68 — Original GPU-submitted gateway/world handoff, no RAF-time scene cut

**2026-11-13 — P0 EVIDENCE + GAME-LOOP TRUTH: OPEN. Leading independent assessment: NOT EVALUATED.**

## Evidence inspected before implementation

- [Previous exact original eight-film campaign 43399201247](https://github.com/my-edutu/Ai_games/actions/runs/43399201247): all eight source-pinned normal-speed matched baseline/candidate ascent, moving, danger and outcome recordings completed. Their final independent source-to-native pairing job **FAILED**, reporting **0/2 desktop/portrait viewports** accepted. Recording completion is not quality acceptance.
- [Previous exact-head quality contract 43399201299](https://github.com/my-edutu/Ai_games/actions/runs/43399201299): integrity and eight catalogue shards succeeded, Phase3 shard2 received an external GitHub runner shutdown/cancellation, so the full quality gate **FAILED**. Do not call it green.
- Prior **original** candidate desktop 960×600 and portrait 390×844 native 1× Floor8 guardian/outcome footage still made an abrupt bronze-to-violet Floor9 switch around 25–26 seconds without a continuous full-body passage through the same original bronze arch. Verified authentic source HP-zero crossing at tick 451 and retained GPU object identities were insufficient to establish film continuity.
- Inspected `AGENTS.md`, `games/infinite-tower-climb/GAUNTLET.md`, binding transformation spec, current world/scene/crossfloor source and authentic Three.js world integration assertions. Frozen baseline **`1731b380851162741761c5569e2bc152a0869ca9`**, PR68 remains draft over active PR58.

## Selected ONE systemic production defect

The original roof/gallery were visually aged on every `world.update(snapshot, dt)`, even when **no actual WebGL frame had returned**. The distant cliffs and citadels faded on that same unsubmitted render-loop clock, and the original noninteractive Floor9 monumental shaft appeared immediately opaque when its deferred CPU construction happened. In slow or stalled GPU submission, these disagreeing clocks made the actual old bronze doorway/structural context disappear visually before the first real new-floor picture could share the old and new world. This is a connected world ownership and submitted-picture problem, not an additional gateway-state cue.

## Production implementation (coherent across real rendering modules)

1. **Source old gateway + bronze gallery:** `public/infinite-tower-climb/visuals/world.mjs` now advances its bounded `visibleSeconds` ONLY inside `noteFrameSubmitted()` after an actual successful `renderer.render()` and only for correct running same-run, same-floor source snapshots. A source tick, browser response, stalled RAF and failed render cannot exhaust the historical old roof/arch.
2. **Real Floor9 architectural reveal:** The actual original incoming noninteractive shaft is still created by `buildTower()`, with its original batched geometry and animated elements. After batching, materials are **cloned for this shaft only**, initially transparent at zero alpha and without depth writes/casting shadows. Returned WebGL submissions reveal the actual shaft over bounded 0.8s and restore original opacity/transparency/depth/shadow flags. The *authoritative* F9 ground, moving platforms, real hazards, climber and guardian do **not** share the fading shell material and remain fully rendered and opaque.
3. **Synchronized panorama/citadels:** The independently deferred real panorama and citadel materials no longer advance on mere JS render updates; they advance with the same source-valid returned-frame time instead.
4. **Real integration wiring:** `public/infinite-tower-climb/visuals/scene.mjs` passes the actual current bounded `dt` only after `renderer.render(scene,camera)` has successfully returned. No extra render pass, camera jump, colliders, rule edits, simulated poses or fake gateway introduced.
5. **Hard limits and cleanup:** The prior <=4096 triangles, <=10 material batches, no shadow casters for the original extracted gallery remain. New shaft material clones are floor-owned, reused per material and disposed with the source floor; normal materials/shadow-casting state are restored after reveal. **Actual GPU allocation/frame-time/memory not measured.**

**Production commits:** [0e754fde](https://github.com/my-edutu/Ai_games/commit/0e754fdede8e7319a857f5f263d8dcc677e79778), [38d4720b](https://github.com/my-edutu/Ai_games/commit/38d4720bbb8b7e08b303fb529690238a8c6c37d7).
**Focused source contracts:** [0c8c1252](https://github.com/my-edutu/Ai_games/commit/0c8c12528823021b78d295b49742d27711775b4f) and [5a2f7262](https://github.com/my-edutu/Ai_games/commit/5a2f726285d1715dc92d31a622b178d1935e6bf8) assert that numerous undrawn RAF updates do NOT fade the old bronze GPU world or expose the violet shaft, the incoming shell starts transparent and only real successful submissions advance the reveal, and retained resources retire. These tests are not evidence of visual success.

## Test, capture and review status

- [New source quality run 43403516867](https://github.com/my-edutu/Ai_games/actions/runs/43403516867) was **PENDING** when checked. No local test-run claim; GitHub runner availability can veto full CI. No bypassing unrelated tests.
- A *new* exact SHA pinned 9-job full-motion capture is requested via the existing capture-request evidence file. Required 1× source/authentic 60+ seconds baseline/candidate with seed `tower-transformation-capture-v1`, low graphics, 960×600 desktop and 390×844 portrait; ascent, moving obstacles, real Floor8 guardian/crusher -> walkable bronze door -> Floor9 onward, outcome/restart. Review complete original WebMs including native PTS, original source tick451 and later real WebGL submit positions/geometry, not synthetic/video-cut/diagnostic substitutes.
- **New candidate original native crossing:** NOT EVALUATED. Previous authentic strict acceptance: **0/2**. Do not award even 1/2 without actual continuous passage in an independently inspectable 1× film.
- Independent randomized genuinely fresh blind critics: **LOOKS 0/5; FEELS 0/5; PLAYS 0/5**, no votes collected. Source-pinned 60+s original films, real supported-device p50/p95/p99 frame time, memory, low/high tier, desktop/portrait, accessibility/restart, security/privacy and outcome clock all remain acceptance blockers.

## Next highest-impact action

**First:** inspect latest exact-source CI failures and correct Tower-specific real issues without weakening gates or touching unrelated games. **Then:** inspect full normal-speed candidate desktop+portrait films from the new immutable SHA against source events and original old gateway/floor9 shaft material/depth, first successful renderer return and native pixel PTS. The old bronze arch, real full-body climber and actual walkable shared roof must coexist in one continuous crossing, with genuine Floor9 onward and eventual result/restart. If one view still jumps, P0 remains OPEN for shared spatial geometry/camera-depth reconstruction, not another independent fade timer. Frozen baseline outcome native-video clock remains a veto until truly repaired.

**Safety:** No baseline move; no PR58 rewrite or Tiny Kingdom/Maze/AI vs 1000 Floors edits; no merge, deploy, force-push or draft promotion. Keep PR68 open and draft. Leading verdict **NOT EVALUATED**.
