# Round 51 — bounded second-stage adaptive raster rescue (candidate)

Date: November 1, 2026. Fixed visual bar: [official *Snake Pass* imagery](https://store.steampowered.com/app/544330/Snake_Pass/) and secondary official *ASTRO BOT* game craft. No copyrighted reference assets enter the game.

## Selection / measured problem

The finished R50 focused Chromium run [41279575228](https://github.com/my-edutu/Ai_games/actions/runs/41279575228) has **38/39 PASS** but its required default live 1920×1080 window reaches only **15 real renderer submissions / 1003.0 ms against unchanged minimum 17**; the **61 requestAnimationFrame callbacks are not rendered or display-present frames**. It had already selected low scale 0.53188 from first median 116.65 ms, yet settled with GPU queue pending 2, 249 skipped callbacks total and max observed fence latency 1763.8 ms. The same exact-head frozen initial low-0.4 full application diagnostic reached 41 actual draws/1307.7ms with its own GPU timer measurements (8 samples, p50 9.37 ms); a different workload and warmed/fenced state, **not causal proof** that lowering live raster will fix the strict gate. See actual job log and [R50 screenshot/metric artifacts](https://github.com/my-edutu/Ai_games/actions/runs/41279575228).

## Smallest independent production slice

The original one-shot quality controller only lowers the buffer once, commonly from native DPR to an insufficient intermediate ratio. Add exactly one **bounded** second median of 8 further genuinely submitted-frame intervals after a 3-draw post-change warmup. If its median exceeds **48ms**, lower the already-low raster by the same area-cost hypothesis **only to the existing 0.4 device-aware floor**, with a 0.025 minimum meaningful change. This is one second chance, not continuous flapping, a larger GPU fence queue, a new test-specific rendering path or a reduced acceptance gate. Low-quality shadows remain 1024, the original static cache is disposed/rebuilt once if resolution materially changes, and unchanged animation, 3D meshes, physically present cues, water, portal geometry and public captions remain.

R51 blocks in `public/snake-stream/renderer.mjs` are mechanically reversible; stripping exactly five blocks must reproduce exact R50 renderer Git blob `01b67f66c6212d4d416013558650965420e77b93`. Historical pre-R49/R46/R43/R38 SHA tests explicitly remove only this newer optional raster policy first; their original expected hashes, graphics and behavioral assertions remain unchanged.

## Regression and visual/runtime evidence contract

New existing-renderer VM timing tests check (1) 62ms median -> first measured scale then one further refinement and 140 more draws with no extra allocation/resize; (2) 200ms case already at 0.4 -> no redundant second resize, native 60fps case stays balanced; (3) visibility resume throws away incomplete rescue samples without treating long hidden time as a slow frame. The new source-controlled real Chromium/SwiftShader WebGL test saves matched-source 0.53-ratio overview screenshots, rescued 0.4-ratio overview and 390×844 portrait screenshots, preserving 3D hazard/portal/serpent, caption, no horizontal overflow, exact same source/raster control pixels, GL0 errors and GPU resource counts. These **frozen-public synthetic captures** are NOT a substitute for actual live autonomous pacing and cannot prove device-present FPS.

**Verification status at candidate creation:** New R51 test suite, screenshots and strict live CI **PENDING**. Existing R50 evidence is not to be represented as an R51 win. The source-vs-source visual consequence test may show noticeable softness at 0.4; if head, fruit, danger or path become unreadable, reject or revise despite throughput. Additional capture, p50/p95/p99, real GPU queue/fence data, and repeat exact-head strict 17-submission runs are required before claiming a causal performance benefit.

## Two-pass source / product self-critique

Spec: presentation-only raster change; no state mutation, seeded AI, score, portal discontinuity, snapshots, paid influence, reduced-motion, captions, fallback, context-loss recovery or dynamic feature removal. Frame gate remains `maxFrames=2`, `timeoutMs=5000` and strict browser minimum **17 actual renderer submissions** unchanged. This remains a cost inference from submitted intervals, **not** display-present FPS.

Quality: a second quality downshift makes edges/stone texture/expressive skull softer and could deepen the existing loss against *Snake Pass* and *ASTRO BOT*. It does not increase environment richness or quality. Prior actual R50 mineral wash changed only 2.77% of detail pixels subtly; entire game still fails reference on varied stage composition, serpentine articulation and environmental depth. No fresh independent reviewer is available because the shared worker tunnel is offline; this is self-review, not independent signoff. Long soak, physical GPU present, sustained FPS and R5 remain **OPEN**.

Rollback: revert the self-contained R51 production blocks and matching test/archive/docs updates; no schema migration or gameplay changes. PR #52 stays **DRAFT**, unmerged and undeployed.
