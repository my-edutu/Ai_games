# Game 2 Gauntlet pass 19 — source-only gate/hero framing candidate

**Review status: pending real browser output; fixed Nintendo benchmark NOT PASSED.** Draft [PR #53](https://github.com/my-edutu/Ai_games/pull/53) remains unmerged and undeployed.

## Evidence-based reason for this slice

Pass-18 genuine 1280×900 and 390×844 screenshots (production seed `maze-visual-reference-13`, tick 21, disclosed closed `door-2`) showed more already-known sandstone and less blank lagoon, but pushed both Pip and the real crossed gate left. See [pass-18 review](./gate-stage-pass-18-review.md) and CI [artifact 13037025673](https://github.com/my-edutu/Ai_games/actions/runs/41184813290/artifacts/13037025673). The desktop camera projection measured Pip x=-0.3276 and gate x=-0.4592 in normalized device coordinates; portrait framing also remained off-center. These are real browser observations, not fabricated stage data.

## Smallest independently judgeable candidate

- Builder [`396ceb6`](https://github.com/my-edutu/Ai_games/commit/396ceb6f46a6d359825c4d8eeb5c191208b7aad8): in `composePublicSealedGateFocus`, reduce the over-dominant known-stage camera pull and modestly increase the camera weight of an **actually disclosed and physically modeled closed gate**. New desktop stage/gate weights are .85/.34 (formerly 1.05/.23); portrait .44/.30 (formerly .48/.24). This affects visual camera framing only. The 2.6/1.1-world-unit camera bound, sealed-gate eligibility, actual gate geometry, AI authority and public knowledge remain unchanged.
- Separate contract/regression commit [`384f7b2`](https://github.com/my-edutu/Ai_games/commit/384f7b25917d08bc8abf7e2daa5c1b730bfb07a6) checks the new shot retreats from the excessive terrain-only camera displacement without discarding the observed coastal stage. [Source CI run 41189735556](https://github.com/my-edutu/Ai_games/actions/runs/41189735556) was queued during this review preparation; **do not interpret queued or in-progress CI as success**.

## Required critic gate — not yet satisfied

1. Obtain fresh, source-hashed native 1280×900 desktop and 390×844 portrait screenshots from the real app, **same seed, tick 21, genuine closed door**. Record capture timestamps, image hashes, source hashes and CI status; do not reuse the pass-18 screenshot as candidate evidence.
2. Compare both original pass-18 and current native frames at equal size; inspect *Pip's body, face, closed coral X and gold lock*, obstacle/terrain visibility, water occupancy and screen-coordinate positions. Do not substitute a crude color mask or passing tests for visible physical storytelling.
3. Have a **fresh separate critic** inspect real rendered A/B images with pass identity concealed where feasible, plus both unchanged, hash-pinned official [Captain Toad references](./reference-manifest.json). Pass only if the critic independently prefers the candidate over the fixed bar on character, scene, objective clarity and gameplay visual coherence. Current bar remains **NOT PASSED**.
4. Inspect motion, audio and hardware-GPU cadence separately; severe shared-host SwiftShader CPU throttle cannot establish a product FPS issue or hardware pass.

## Availability and safety boundary

The live shared-workspace tunnel returned `Tunnel-client has not been seen for 300 seconds`; the separate builder/critic workers and Ultracode cannot be invoked there in this pass. GitHub source edits and CI orchestration remain available. No fresh independent visual verdict, actual candidate capture or performance claim is asserted here. Never infer hidden doors or route legality from camera staging. Continue on draft PR; **no merge/deployment**.


## Actual browser verification completed (2026-10-31, 09:49 UTC)

The original code-only gate above has now been partially satisfied by genuine source-tested browser images: [Autonomous Games CI 41189735556](https://github.com/my-edutu/Ai_games/actions/runs/41189735556) **passed 524/524 Node and 25/25 Playwright browser checks**. [Artifact 13038422543](https://github.com/my-edutu/Ai_games/actions/runs/41189735556/artifacts/13038422543) holds native desktop and portrait screenshots with matching image/source SHA-256, both original production seed `maze-visual-reference-13`, tick21, truly disclosed/closed gate `door-2`. The desktop and portrait PNGs captured **09:49:38.913Z** and **09:49:42.604Z**. Full exact hashes, camera x measurements and scene-occupancy tradeoff are in [pass-19 actual-output review](./gate-composition-pass-19-review.md). Both subjects move modestly toward the screen center but some empty lagoon returns; the physical next action is still unclear. **A fresh independent, context-isolated visual critic and fixed-reference win remain missing.** Keep the Nintendo bar unchanged and do not infer hardware GPU FPS.
