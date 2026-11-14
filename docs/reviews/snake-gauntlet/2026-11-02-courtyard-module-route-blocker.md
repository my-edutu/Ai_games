# P1 whole-game 3D availability incident — November 2, 2026

**Draft PR:** https://github.com/my-edutu/Ai_games/pull/52
**Exact inspected failed head:** `0865217416e00841439881b0c19654bd2a004d70` (source and ESM reference).
**Status:** T0/T1 BUILDING; preceding head 3D STARTUP REGRESSED. Recovery source candidate NOT YET VERIFIED. No merge/deploy.


## November 2 — P1 live WebGL availability regression, targeted recovery inside continuing T1

Inspected live draft PR #52 at exact parent `0865217416e00841439881b0c19654bd2a004d70`, all governing documents, recent quality reviews, source, actual current-head Actions job logs and artifact index. [Focused browser 41424227069](https://github.com/my-edutu/Ai_games/actions/runs/41424227069) completed **6/66 passes, 60 failures**: real gameplay launched the safe `canvas-fallback` rather than WebGL, and newly requested genuine current-head WebGL stills/film could not be considered valid. The first failure waited for `data-renderer=webgl`; subsequent tests saw missing WebGL contexts. The production renderer imports `./courtyard-ecology.mjs`, but the stream host's explicit same-origin route list omitted it. This is a **P1 complete 3D availability regression**, not a visual benchmark improvement or an FPS sample.

[General CI 41424227056](https://github.com/my-edutu/Ai_games/actions/runs/41424227056) completed **616/624 Node pass; 8 failures**, all in `snake-render-timing.test.cjs`: the VM strips ESM imports, then the new factory is undefined during `draw`. Focused RED is grounded in these actual failures, not an invented local test. The current corrective candidate restores the original restrictive host route and asset readiness list; updates the GPU-free timing harness's mocked scene factory; adds regression checks to require both integration paths; and keeps the existing actual WebGL preview assertions and original one-second ≥17 genuine full-desktop submission gate **unchanged**. No autonomous game rules, AI/scoring, seeded simulation, snapshots, portal discontinuities, cues, accessibility, GPU geometry or rendering quality are removed or weakened.

**Acceptance truth:** isolated development workspace remains disconnected; no local new-head GREEN, true current-head WebGL before/after stills, authentic 55-second after-film, repeat useful-resolution strict pass, device present FPS/p95, long soak or independent visual review is claimed. The old 736×336 strict 7/17 failure belongs to earlier `a93938e`, NOT this head's fallback test; do not call the fallback 0 FPS or a strict-gate numeric sample. Reverify the actual module GET/MIME/import, WebGL startup, focused Node/real-browser green, then proceed with same **T1 BUILDING / SELF-REJECTED whole-game** environment, hero and GPU work. T2–T4 remain unaccepted. Never merge/deploy.


## Exact correction, narrowly scoped and test-protected

1. `scripts/serve-snake-stream.cjs`: make the new original ESM available on the same origin with the previously restricted module allowlist; include it in the actual host readiness self-test without introducing wildcard/file traversal.
2. `tests/phase3/snake-render-timing.test.cjs`: inject a GPU-free scene factory for the new presentation-only environment in the VM that intentionally removes imports. Do not replace any real WebGL performance test or alter the original one-second desktop ≥17 metric.
3. `tests/phase3/snake-t1-asset-route.test.cjs`: assert that the renderer imports the real authored module, host self-test and static route name it, GPU-free harness accounts for it, CSP and no-wildcard route remain.
4. `tests/browser/snake-t1-courtyard-ecology.spec.cjs`: require a successful real HTTP ES module response with script MIME, dynamic import in the browser, and actual `data-renderer=webgl` plus runtime WebGL stats. The existing eight matched WebGL captures and authentic 55-second runtime film are still mandatory.

These changes restore production 3D startup needed to assess the large T1 world/hero work; they do **not** themselves qualify as a whole-game transformation. No reduction to polygons, textures, original cues, test assertions, fixed-step simulation, seed ownership, fair viewer influence, accessibility or security. Run and inspect real new-head Actions before accepting any claim.