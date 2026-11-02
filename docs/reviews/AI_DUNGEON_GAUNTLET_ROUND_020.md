# AI Dungeon — Gauntlet Round 020: Cinematic Readability + Bounded Bloom

**Date:** 2026-10-31 · **PR:** #49, draft · **Starting head:** `c3740d600c85aaa7430d8fc64dfaa6f94e1227a9`.

## Evidence-driven choice

Actual matched seeded R18/R19 browser screenshots show dark, blocky architecture and small simplified textured character rigs. The earlier genuine WebGL frame measured 85 px minimum hero height. A tighter cinematic camera directly addresses subject readability. This does not create high-detail assets or justify AAA comparison.

The third Round 19 browser run [41176391945](https://github.com/my-edutu/Ai_games/actions/runs/41176391945) failed **42/43**: after toggling optional bloom off and on, the actual browser diagnostics stayed `direct` instead of `bloom` (10-second assertion). The first two earlier failures were screenshot timeouts; this third one is a **real feature/assertion failure**. Cause remains unproven; never count it green.

## Small independent test-first increments

1. **Red → green focused test:** Three Node test cases first failed because the new module was missing (captured locally), then passed **3/3** after implementing the pure deterministic bloom-budget planner. This was a local representative standalone test under Node, not repository-wide CI.
2. The real Three.js composer now receives a `<=850000`-pixel offscreen budget, recomputed when the browser viewport resizes. The direct scene renderer retains its previous pixel ratio. Diagnostics expose the actual budget. On a thrown postFX render error, the composer is disposed, direct 3D is rendered and the toggle visibly reports fallback. This is a bounded mitigation for software-WebGL pressure, not an established root-cause fix of Round 19's toggle failure.
3. **Existing-model cinematic framing:** Default cinematic camera offsets changed from `[6.25,10.5,7.2]` to `[5.45,9.05,6.2]` metres before adaptive party spread. This makes existing textured rigs potentially more legible but may worsen scene clipping; real capture is a mandatory gate. Tactical and chase offsets and authoritative game logic remain unchanged.
4. Browser checks still exercise both directions of the real FX toggle, require an actual bounded budget and tighten the pinned hero-size check to **more than 90 pixels**. No screenshot simulations, test skips or acceptance bypass.

## Acceptance evidence / harsh self-critic

**Pending new exact-head browser and CI:** 43/43 dedicated real Chromium tests, immersive desktop/mobile screenshot review, 24×900 deterministic campaign, full catalogue checks, and independent blind visual preference. Do not equate local unit 3/3 with a browser pass. This round changed only read-only presentation, focused tests and ledger; it did not touch authority, combat, replay, saves, or external art licenses.

Current art remains stylized, low detail and far below actual Diablo IV, No Rest for the Wicked and Path of Exile 2 quality. Tighter framing can reveal these limitations rather than solve them. Greatest remaining blocker is artist-created hero and enemy geometry, materials and authored animation, plus professional environmental shading. Worker/ultracode connection unavailable; no independent critic or blinded A/B was conducted. PR remains draft, do **not** merge. Revert the cohesive Round 20 commit to roll back.

## Verified exact-code-head acceptance and screenshot critique (2026-10-31)

The actual implementation head **`c5f2cccd5de4509541c75b7f8b19a192a1d66055`** passed the full [Dungeon CI run 41178964343](https://github.com/my-edutu/Ai_games/actions/runs/41178964343):

- **43/43 real Chromium dedicated browser tests**, all three shards (15 + 14 + 14), including both directions of the previously failing optional-bloom toggle; the budget assertion passed.
- **20/20 authoritative Dungeon + focused geometry/budget tests**; **17/17 other Dungeon presentation/interface/progress tests**.
- **24 seeds × 900 ticks**, zero determinism failures, highest floor **9**, 401 floor advances and 89 restarts.
- [Integrated full-repository run 41178964256](https://github.com/my-edutu/Ai_games/actions/runs/41178964256) **542/542 software tests** and **15/15 shared browser tests**.
- [Visual-review workspace 41178964252](https://github.com/my-edutu/Ai_games/actions/runs/41178964252) passed. The [authentic browser screenshots/video artifact](https://github.com/my-edutu/Ai_games/actions/runs/41178964343/artifacts/13033044879) includes `dungeon-wall19-world-only.png`, `dungeon-desktop.png`, mobile captures, and genuine gameplay videos.

**Inspected matched unblinded A/B:** extracted raw WebGL canvas PNGs from the prior [Round 19 run 41176391945, artifact 13033741816](https://github.com/my-edutu/Ai_games/actions/runs/41176391945/artifacts/13033741816) and current Round 20 artifact. Both use **`visual-room-art-18`** seed, **18 authoritative ticks** and **1440×832** canvas; they are **not fabricated**. Current characters occupy visibly more of the frame (camera closer), while the view loses some wider spatial context and exposes repetitive square stone crowns. Using same-size PNGs reduced to 160×100 via Pillow bilinear filtering, mean pixel luminance changed **22.64→23.01/255**, bright-pixel fraction **29.4%→28.6%**, and bright-coloured fraction **26.9%→27.7%**. This narrow pixel audit is **not a perceived-fidelity metric**, and image captures can differ slightly in cosmetic animation frame and lighting state.

Also inspected frames of the *real* 14.84-second autonomous gameplay browser recording: initial loading, live boss fighting, authentic damage/warnings, and progression from Floor 1 to Floor 2. No mockup captures. The tighter view still feels visually simplified, with some enemies at the screen edges. There is no blind or independent Diablo IV comparison, no original AAA-resolution model production, and no FPS/memory profiling evidence; **bar not met**.

**Harsh critic verdict:** This is a bounded, verified presentation and browser-reliability improvement, not proof of professional 3D art parity. The highest-impact next gauntlet work remains complete original character/monster sculpts, readable combat silhouettes and authored reactions, richer physically based materials, environment shapes beyond rectilinear tiles and frame-aware camera tracking. Continue without touching deterministic authority or merging PR #49.
