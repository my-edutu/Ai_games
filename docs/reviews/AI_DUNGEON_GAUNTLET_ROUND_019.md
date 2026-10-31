# AI Dungeon — Gauntlet Round 019: Physical Wall Silhouette Breakup

**Branch:** `feat/ai-dungeon-3d-gauntlet-foundation` · **PR:** #49 (draft) · **Date:** 2026-10-31.

## Gap and quality bar

Round 18's authentic browser screenshots show repeated ruler-straight, uniformly tall rectangular corridors and low-detail characters. The primary comparison remains actual [Diablo IV gameplay](https://store.steampowered.com/app/2344520/Diablo_IV/) and [official environment gameplay](https://www.gamespot.com/videos/diablo-4-new-environmental-gameplay-showcase/2300-6457759/), with No Rest for the Wicked and Path of Exile 2 secondary. Reference art was not copied. The goal of this small increment is more physically varied masonry, not a false claim of comparable art.

## Test-first incremental implementation

1. Added focused pure-map RED tests before implementing the planner (3 failed because the module did not yet exist), then GREEN **3/3** under Node 22 on a local representative 19×19 grid. This isolated test is not a full repository or WebGL run.
2. Added a read-only deterministic wall-profile plan: exposed walls get bounded height changes across five bands (2.50–3.01m); buried wall tiles stay 2.60m. The collision grid, walkable cells, seed streams, combat, persistence and authoritative simulation remain untouched.
3. The existing instanced walls render their per-tile heights; decorative crowns/caps follow those heights. Existing multi-hero camera sightline cutaway also reads each wall/crown's actual rest height. No new geometry, draw calls, materials or external asset licenses.
4. Exposes actual renderer masonry metrics and adds a Chromium screenshot gate for exposed-wall variation and hero visibility. The dedicated browser workflow must inspect the **real** output file `artifacts/dungeon-wall19-world-only.png`, not a mockup.
5. Includes planner tests in `npm run dungeon:test`; the standalone new route is explicitly allowed by the CSP-constrained stream server.

## Evidence ledger and critic

**Implemented; full repository/Chromium/seed campaign results not yet established at this document's creation.** Actual before/after screenshots at equal seed and camera have **not** been independently viewed. New browser workflow and complete CI must run before any numerical renderer claim. No independent worker or ultracode was available (worker tunnel disconnected), and no blind matched A/B was performed.

**Harsh self-critic:** height variation alone does not produce carved natural stone, layered rooflines, or high-end asset material sophistication; the regular grid and low-poly heroes remain obvious. Next biggest blocker: artist-quality hero/enemy rigs, procedural wall contour/stone face treatment, authored animations, and professional 3D performance/visual comparison. Diablo IV fidelity **NOT MET**, production readiness **NOT MET**, leave draft PR open. Roll back this increment by reverting its cohesive commit. Retain exact-head video/screenshot artifacts and update this report/ledger only after tests complete.

## First exact-head browser pass and screenshot review (commit `8c29d54`)

From [Gauntlet workflow 41175209773](https://github.com/my-edutu/Ai_games/actions/runs/41175209773): authority passes, 24 × 900 deterministic seeded ticks with no failures and highest floor nine. The first browser run executes **42/43 tests successfully**, with **one browser test failure**: `camera and environment expose real sightlines instead of foreground wall slabs` times out at 60 seconds while taking its **second, full-page screenshot** after the canvas screenshot; the log does not show a renderer exception or visual assertion failure. The 14-test shard 3 finished 13 pass/1 timeout; shards 1 and 2 passed. This must not be reported as a green full-browser gate. The follow-up gives this real WebGL screenshot audit a 120-second budget and uses a viewport capture, preserving both screenshots, all original assertions and real rendering. A fresh CI rerun is required.

[Verified full-catalogue CI 41175209778](https://github.com/my-edutu/Ai_games/actions/runs/41175209778) passed **538 software tests** and **15 unrelated browser tests**. [Dedicated immersive interface 41175209789](https://github.com/my-edutu/Ai_games/actions/runs/41175209789) passed **10/10**.

Actual (not generated) screenshot evidence reviewed: [Round 18 raw WebGL baseline](https://github.com/my-edutu/Ai_games/actions/runs/41170512135/artifacts/13030967805) and [Round 19 immersive screenshot/video set](https://github.com/my-edutu/Ai_games/actions/runs/41175209789/artifacts/13032609012) use the same deterministic `dungeon-ui-round17` seed at 18 ticks, 1440×832 canvas. The new skyline has some bounded height variation at exposed walls. A direct pixel comparison shows ~4.33% of full-canvas pixels changing above mean absolute RGB difference 12, including ~7.91% in the upper-masonry region. These are **change metrics**, not measures of artistic quality. Genuine R19 mobile and desktop UI/screenshots and gameplay video were inspected; live play advanced from floor 1 to 3 and showed a terminal defeat/restart. The image is still very dark, rectilinear and visibly below the primary reference. No independent blind assessment.

The initial browser failure was a screenshot automation timeout; its fix does not relax hero visibility, authority, camera or art acceptance assertions. All 43 browser results remain **PENDING a successful rerun** at the follow-up head.

## Second exact-head browser run — independent test-harness bottleneck

The follow-up head [`a9b71fb`](https://github.com/my-edutu/Ai_games/commit/a9b71fbace81b10ffd905f999eeffb79f0174e67) was also **42/43 browser tests**, despite the first screenshot case being fixed. [Workflow 41175823238](https://github.com/my-edutu/Ai_games/actions/runs/41175823238) passed all 14 tests in shard 2, all 15 in shard 1, and 13/14 in shard 3. This time `actual class footprints, spells and character-close camera are inspectable` reached all its live camera/AI-state assertions but started a **full-page** screenshot at approximately 46.22s and hit the generic 60s total test timeout. The failure is verifiable in the uploaded Playwright trace; not proof of a changed player simulation or rendering parity.

The third increment addresses the *underlying fixture budget*: increase the dedicated browser test's overall timeout to **120 seconds**, while leaving each assertion/poll deadline (8–25s) unchanged, and capture the **actual browser viewport** rather than a much costlier full-page image for the ranger-close scene. No acceptance assertions, authority, camera maths, raster graphics or assets are changed. The run remains gated on 43/43 real Chromium tests; screenshot failure will still fail. A fresh third exact-head Chromium run is required.

For `a9b71fb`, the [full-catalogue workflow](https://github.com/my-edutu/Ai_games/actions/runs/41175823240) independently passed **538/538 software + 15/15 shared browser**; dedicated immersive review [41175823332](https://github.com/my-edutu/Ai_games/actions/runs/41175823332) passed. This strong coverage does **not** override the one failing specialized screenshot.
