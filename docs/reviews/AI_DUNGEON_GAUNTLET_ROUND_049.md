# AI Dungeon — Gauntlet Round 049: Cutaway Instance-Upload Discipline

**Date:** 2026-11-01 · **Target:** [draft PR #49](https://github.com/my-edutu/Ai_games/pull/49), branch `feat/ai-dungeon-3d-gauntlet-foundation`. **Keep draft; do not merge.** Diablo IV gameplay remains the primary visual bar; No Rest for the Wicked composition and Path of Exile 2 combat remain secondary. **No reference parity or production-readiness claim.**

## Observed gap and scope

[Round 048 real Chromium evidence](https://github.com/my-edutu/Ai_games/blob/feat/ai-dungeon-3d-gauntlet-foundation/docs/reviews/AI_DUNGEON_GAUNTLET_ROUND_048.md) measured an eight-interval foreground rAF sample with a 2366.6 ms tail and visibly softened software-WebGL raster. Source inspection confirmed that four instanced masonry batches were rewriting all matrices / uploading GPU instance buffers every rendered frame even in an unchanged camera/hero scene. This is a **proven redundant work pattern**, **not** a measured attribution of the 2.37-second stall. Keep the cutaway thresholds every frame to preserve real sightlines.

## Independent verifiable changes

1. **Test specified before implementation** in [`12f156a6`](https://github.com/my-edutu/Ai_games/commit/12f156a6af14b9afef7f4529df160a03ca7a3fe0): first/unchanged/nearby/sightline/restored transitions, out-of-range and malformed indices, per-instance independence, and real scene wiring. **The initial CI was canceled after further commits before an observed RED result; do not describe RED as verified.**
2. [`fb7cb689`](https://github.com/my-edutu/Ai_games/commit/fb7cb689edf4ba3b1ee6501f503a1719ebf0ce91) creates a bounded per-floor `Uint8Array` GPU-band tracker (0 intact, 1 nearby, 2 sightline, 255 initially unknown); no state mutation beyond cosmetic cache and no random source.
3. [`5c32a933`](https://github.com/my-edutu/Ai_games/commit/5c32a9335e2b6a079d83df48ad882fc14f8c6ba3) gates `setMatrixAt` and `instanceMatrix.needsUpdate` on changed bands for fractured stone walls and parapet crowns. It still evaluates all living hero/boss sightlines each frame. World rebuilds allocate fresh trackers, and diagnostics expose actual last-frame `wallMatrixWrites` and `parapetMatrixWrites`.
4. [`5bfe8632`](https://github.com/my-edutu/Ai_games/commit/5bfe863265a124c212fec7d2610e50b8dc1c7523) applies the same rule to the textured facade. Original spalls and coping only reupload when their real occlusion mask changes. The existing dressing metrics report separate facade/weathering matrix counts.
5. [`9b3000ff`](https://github.com/my-edutu/Ai_games/commit/9b3000ffc2d3fa9fa55b083a02a51c62885aafac) adds a genuine Playwright seeded-3D case: wait for the actual renderer, require all four upload counters to settle at zero in a static authoritative snapshot, continue checking unoccluded living characters and save the actual WebGL screenshot and JSON evidence. No mockup or synthetic 3D rendering.

## Validation status at documentation checkpoint

This commit records **what changed**, **not a passing gate**. Authoritative build/foundation, 24×900 seeded replay, three-shard Chromium, dedicated visual screenshots and shared catalogue checks are **NOT VERIFIED at this exact head**. The unit test was committed before implementation, but a failing RED execution was **not observed** because branch concurrency canceled that run. Genuinely captured previous-round images are not evidence of this optimization's visual outcome. Only mark the exact-head runs green after reading completed jobs and reviewing real artifacts.

## Two-pass critique and safety

**Specification:** cosmetic floor-scoped state only. Every frame still recomputes scene visibility; a changed reveal band still forces a transform write. No grid, health, combat, AI, hitbox, fixed-step clock, seed stream, save, replay schema, payment, audience event, or asset licence changes. Numerical and cache size guards cap state to 16,384 instances. Roll back commits `fb7cb689`, `5c32a933`, `5bfe8632` and tests to restore previous eager uploads.

**Harsh quality review (self-review, not independent):** No measured before/after CPU/driver/GPU delta, no 30–60-minute live soak, no real hardware context-loss injection, no blind matched Diablo IV A/B and no inspected new screenshots. The optimisation can reduce buffer churn on static shots yet leave expensive fragment raster, hero overlap, near-black startup and coarse rig/anatomy unaddressed. The remote coding-worker tunnel was offline; **no separate worker critic or ultracode was run**.

**Next priority:** finish exact-head verification, inspect real scene evidence, and profile sustained actual output freshness / 30–60-minute frame tails before making claims about smoothness. Continue original sculpted hero/enemy detail and physically readable weapon contact afterwards. **PR stays draft and unmerged.**
