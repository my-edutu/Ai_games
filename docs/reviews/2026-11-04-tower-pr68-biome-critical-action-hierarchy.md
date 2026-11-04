# Infinite Tower Climb — source-observed quiet / crisis / release composition
2026-11-04 • Existing transformation initiative • draft PR #68 only

## Experience finding
Moment: a real climber rises through foundry, ruins, storm, clockwork and void, then encounters a charged shutter or live guardian.
Expected: the real route, skinned character, enemy and actionable hazard become the visual subject without requiring another HUD.
Observed in prior source-pinned portrait capture: giant gearwork and ambient machinery can compete with the autonomous characters; preserving screen coordinates alone does not eliminate moving background distraction.
Why: biome scenery, constantly turning ambient rotors, bright furnace core and particulate air operated at full emphasis even when a more urgent source event appeared.
Severity: high experience-readability concern, but NOT independently scored or proven remedied.
Verification: matched normal-speed real browser video across desktop 960×600 and portrait 390×844, each >=60 s, and blind five-critic panels for LOOKS, FEELS and PLAYS.

## Actual playable vertical slice
Source: playable Three.js source commits 5f799e8, 9084633 and dd21e9c (on top of the current true 3D tower head).
- `visuals/scene-hierarchy.mjs`: observes only published immutable run/floor/tick, actual present guardian telegraph/health or live/evasive trap pressure and confirmed terminal result. No speculative enemy, damage, rescue, landing or win.
- `visuals/world.mjs`: the *same physical tower* quiets decorative 3D furnace emission, motes, clouds, ambient rotating gearwork and suspended crystals when a source-relevant danger/combat event genuinely appears. Rapid danger onset; damped recovery after threat. No new geometry, lights, shadow pass, draw or HUD. Mechanical deck undercarriage, pressure chamber, source guardian gate, physics and autonomous authority remain unchanged.
- `visuals/atmosphere.mjs`: the source-owned single-instanced-draw biome weather yields during real danger and its fast near wake stops competing with the combat silhouette. Native five-biome material identity and true vertical altitude parallax remain.
- New `tests/phase3/tower-scene-hierarchy.test.cjs`: negative controls for stale/cross-run/far/early warnings, guardian and terminal priority, weather opacity, one-draw and immutable sources. Safety only: unit assertions do not score the game.

## Real capture and technical integrity
- Frozen comparison build: **1731b380851162741761c5569e2bc152a0869ca9**. Do not change it.
- Last completed original-host capture: [41878838668](https://github.com/my-edutu/Ai_games/actions/runs/41878838668), 9/9 jobs successful, with source-pin candidate **8e2e89b50f78f973f9cefa2233ecd7543daabd9d**; contains actual desktop/portrait ascent, moving, danger and outcome artifacts. These PRE-DATE the new hierarchy slice and are NOT candidate evidence for it. Video has not received blinded independent full-motion scoring.
- A newer exact **dd21e9c** capture job [41889543364](https://github.com/my-edutu/Ai_games/actions/runs/41889543364) was pending at inspection. Its outcome must be checked before any current-source claims.
- Previous exact 3d243fd integrity job [41879218635](https://github.com/my-edutu/Ai_games/actions/runs/41879218635) FAILED 24/951: 19 old VM audio fixture errors parsing a new native ESM import, 1 stale source-contract suite, 3 stub Three lighting fixtures missing the imported traversal source and 1 low-tier particle burst regression. Existing fixture commits resolve ESM import and module relocation, and load the real traversal helper; **latest exact-head CI not yet known**, including whether particle regression persists. CI is solely a stop-ship veto, never visual evidence.
- Tests temporarily copying `world.mjs` to a scratch directory now explicitly resolve the new source-observer import, instead of accidentally testing a different helper.
- No manual software-browser or physical-device frame-time/performance measurement: independent browser/worker tunnel unavailable. No fabricated FPS, memory or independent critic response.

## Acceptance / next evidence
QUALITY STATUS: **NOT EVALUATED**.
0/5 independent candidate preferences for LOOKS, 0/5 for FEELS, 0/5 for PLAYS because no judgments were obtained, not because five critics rejected the game. Require >=4/5 in EACH.

Biggest remaining experience gap: prove that the *whole* ascent, physically selected moving landing, source-observed hazard response, live guardian, terminal result and restart become significantly clearer and more engaging in event-paired authentic normal-speed mobile and desktop output, without drowning the character in scenery or losing tower scale. Capture >=60 s per scenario with identical seed/view/quality, frozen original source and exact new source; separately blind randomized reviewers must judge full motion. Supported-device p50/p95/p99 and memory, source replay, accessibility, recovery and privacy checks still outstanding.

No modification to PR #58. No merge, force-push, deploy or quality PASS. Preserve the existing hourly transformation Gauntlet.
