# AI Dungeon — Gauntlet Round 032: Sculpted wall relief (partial acceptance)

**Date:** 2026-10-31 · **Draft PR:** [#49](https://github.com/my-edutu/Ai_games/pull/49), keep open/draft/unmerged. **Implementation SHA:** [`cdf91123d`](https://github.com/my-edutu/Ai_games/commit/cdf91123ddb0cb9a96971ff7226d2e42394d0514). **Visual quality bar:** authentic Diablo IV **NOT MET**. **Production:** NOT READY.

## Evidence-first goal

The inspected actual Dungeon WebGL screenshots still show large uniform cuboidal wall slabs despite existing bump textures, windows and varied parapet heights. This round adds *original physical geometry* to exposed walls, not another cosmetic UI claim. Proportional response: maximum 96 beveled stone spalls, 48 irregular broken coping pieces per floor, rendered in exactly two instanced batches using shared physically shaded materials. The plan depends only on finite wall-face positions, direction and floor, never on gameplay RNG or the frame clock.

Every stone is anchored to an existing wall face; no collisions, navigation, AI, hit points, economy, save format, assets or external licensing are changed. Both batches use the parent wall's real multi-hero camera cutaway mask and shrink when the wall itself is lowered, retaining character sightlines. Cleanup uses existing floor lifecycle.

## Observable red-green and local verification

- **Test-first before code:** [`c376dbeb`](https://github.com/my-edutu/Ai_games/commit/c376dbeb4c624db87f06e5908c8c898e04ec331b) added 3 focused real-map/bounds/renderer contracts and one new dedicated authentic WebGL screenshot assertion. Initial [CI 41210378508](https://github.com/my-edutu/Ai_games/actions/runs/41210378508) genuinely recorded **589/592 pass and 3 intended failures**: missing stone planner and renderer integration. Do not relabel red pass.
- **Implementation:** [`cdf91123d`](https://github.com/my-edutu/Ai_games/commit/cdf91123ddb0cb9a96971ff7226d2e42394d0514). The original chipped-edge geometry is procedurally sculpted and instanced. Deterministic selection changes with floor; invalid faces and bad caps yield no unsafe geometry.
- **Exact-implementation source archive:** [visual workspace 41210589710](https://github.com/my-edutu/Ai_games/actions/runs/41210589710) captured a source archive whose `review-source-revision.txt` is **cdf91123ddb0cb9a96971ff7226d2e42394d0514**. Locally executing that archive, `npm run dungeon:test` **70/70 passed**, separate presentation/interface **17/17 passed**, and `npm run dungeon:gauntlet` finished **24 × 900**, **zero** deterministic failures, highest floor **9**, 401 advances and 89 restarts.
- **Genuine browser evidence at the same implementation:** the separate [reproducible visual workflow 41210589710](https://github.com/my-edutu/Ai_games/actions/runs/41210589710) passed **10/10** real Chromium interface tests, decoded all 20 pinned CC0 source assets and built the actual scene. Inspected the new 1440×900 `artifacts/dungeon-immersive-desktop.png` alongside Round 31's genuine same-test screenshot (seed `dungeon-ui-round17`, 18 public authority ticks, same viewport; animation/particle timing differs). [Current browser artifact 13046033362](https://github.com/my-edutu/Ai_games/actions/runs/41210589710/artifacts/13046033362). Spall surfaces look somewhat more broken, but the scene remains cartoon-like and overwhelmingly blocky; no blind artistic preference is established.
- **Known validation limitation:** [dedicated workflow 41210589649](https://github.com/my-edutu/Ai_games/actions/runs/41210589649) was queued and then cancelled when a new Round 33 code head arrived; **the new stone-specific browser test has no successful dedicated CI receipt yet**. [Integrated workflow 41210589598](https://github.com/my-edutu/Ai_games/actions/runs/41210589598) was queued when reviewed. A local Chromium attempt reached `ERR_BLOCKED_BY_ADMINISTRATOR` on the container loopback URL, **not a game test assertion**. A local full repository test attempt was timed out after partial execution and is **not** counted as passing.

## Harsh art and engineering audit

The actual screenshot demonstrates only incremental local weathering, not more believable architecture or Diablo IV fidelity. Stone pieces are still evenly distributed within a regular maze; flat wall tops, large dark empty quadrants, low-resolution hero/enemy anatomy, oversized bright effects and short/simple combat animations dominate. Shadows and surface roughness are still not grounded in an authored lighting design. The two instanced batches are bounded, but GPU p95, memory slope, mobile hardware sustained capture, true blinded reference comparison and independent critic/ultracode review are **not available**. The worker tunnel was offline.

**Next blocker:** detailed original humanoid models, natural skin/cloth/armor surfaces and convincingly retargeted attack/cast/hit animations, then room-specific irregular stone architecture, controlled boss VFX and measured performance. Keep PR draft; no production or merge claim.

## Separate concurrent work

A subsequent head [`e90ae5d`](https://github.com/my-edutu/Ai_games/commit/e90ae5d5b7295805d5bd4985414c76739f3271cb) adds floor-ruin work under a **distinct Round 33** review. It is not evidence that Round 32's pending dedicated WebGL test passed. Preserve round-specific attribution, source licensing and verification boundaries.

