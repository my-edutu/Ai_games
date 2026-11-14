# Static 3D cache — independent actual-image review

Date: 2026-10-30. Reviewer: `snake_cache_critic`.

## Verdict

**The cached frame preserves the scene and visible gameplay content in this comparison. No gross depth-compositing failure, missing serpent path, missing fruit/portal/hazard, or broad color/fog shift is visible. It is not pixel-identical: fine static foliage, flowers, and stone silhouettes render harder and somewhat brighter in the cached image.**

That edge-treatment difference is the strongest visible discrepancy. It is a cosmetic issue in this fixture, not evidence that the cache hides authoritative gameplay. Strict appearance-equivalence should not be claimed without acknowledging it. The separate desktop frame-rate gate still fails; this image review does not turn the optimization into a performance pass or a Snake Pass benchmark win.

No repository files were edited and no browser was started for this review. The original PNGs were inspected directly, followed by explicitly enlarged nearest-neighbor inspection crops and numerical RGB comparisons.

## Exact evidence

- Feature commit: `c07c4123d3a28e505c1f089465c07f455cbe3486`.
- CI records the synthetic merge commit `d16d1398916e6861162fc991fa08ec16270a7924`, whose subject identifies that feature head merged into the target branch.
- Reviewed renderer SHA-256: `ac983a03fe9b60c2a1f6e3ff5ddf544e62e783a8db1f81f89817a7db82bd950e` (351 lines). This review applies to that renderer, not a subsequently edited optimization candidate.
- Before: `/tmp/snake-3d-ci-round5/artifacts/phase3/cache-before.png`.
- After: `/tmp/snake-3d-ci-round5/artifacts/phase3/cache-after.png`.
- Metrics: the corresponding `cache-before-metrics.json` and `cache-after-metrics.json` in the same directory.
- Browser results: `/tmp/snake-3d-ci-round5/artifacts/phase3/browser-results.json`.
- Detailed pixel measurements: `/tmp/snake-cache-pixel-diff.json`.

PNG hashes:

| Image | SHA-256 |
|---|---|
| Before | `192001f3cc64654e6ea59cf9b2b6599aada5b5134a6209ee10d8e55e6810e4f9` |
| After | `f478af986326516f9723066d32acaf0a6863f2fe167d48c2991f8b75448a3983` |

Both images are 960×640. The browser test uses the same public round-4 snapshot, the same viewport, low quality, overview camera, and reduced-motion preference. The direct condition disables `cacheSupported` in the same renderer source; the cached condition uses the ordinary implementation. This is a useful isolation of the cache path.

The test does not freeze the wall clock or force identical warm-up counts: metrics show frame 3 before and frame 5 after. Reduced motion fixes the water time, body lift, fruit pose, and main head pose. Small head-expression differences cannot be attributed solely to caching because the source still eases danger-related eye/brow expression with elapsed updates. Static-scene comparison is not affected by that caveat.

## Visible findings

### 1. Fine static edges differ visibly — cosmetic issue

The rear row of pale pink flowers appears more pronounced and brighter after caching. Small leaves, the rear terrace/water boundary, the lower stone steps, and the front/right island silhouette have harder pixel transitions. The effect is evident in the original-size pair and is clearer in the enlarged inspection crops.

The rear flower rectangle, `(x=320..666, y=198..242)`, has an RGB mean absolute difference of **9.899 / 255**. **18.815%** of its pixels differ by more than 24 levels in at least one RGB channel. This is the most useful localized regression target because it contains many small lit forms against contrasting backgrounds.

Across the larger gameplay rectangle, **97.541% of pixels with a channel difference above 24 are within a high-contrast edge neighborhood**. For this measurement, an edge neighborhood means the direct image's 3×3 neighborhood spans more than 30 levels in at least one channel. This supports the visual assessment that the discrepancy is concentrated at boundaries rather than a uniform color-grading error.

The code provides a plausible mechanism: static HDR color is resolved before final tone mapping, and a single resolved depth value is copied into the final framebuffer. Direct drawing shades and resolves its samples through a different sequence. Different MSAA sample/coverage behavior and nonlinear tone mapping can therefore change subpixel static geometry. This is an inference from source and the edge-localized image difference, not a controlled identification of one specific GPU mechanism.

Recommended treatment: retain this as a minor visual-quality item and use the rear-flower/front-silhouette crops when evaluating later resolve/composite changes. A short direct-to-cache camera transition capture would establish whether the difference produces a visible appearance change as overview settles; that transition was not inspected here.

### 2. Broad lighting, color, and visible fog are preserved

The warm pale playing surface, green/gold serpent, turquoise water, stone ruins, and foliage retain the same broad palette and lighting direction. There is no broad washed-out, double-tonemapped, or black-frame result.

The distant banks visible along the top retain their cyan-green appearance. Their coverage in these captures is small and partly clipped by the top of the stage, so this is limited fog evidence. It is consistent with the corrected post-tonemapping fog path, but does not validate every possible fog depth/camera composition.

The broad left-water patch differs by only **0.398 / 255 mean absolute RGB**, with a maximum channel difference of **7** and no pixels differing by more than 8 levels. Its ripple pattern is in the same phase. The top HUD and caption/footer comparison rectangles are byte-identical in decoded RGB.

### 3. No gross occlusion or dynamic-object omission in this fixture

The cached island remains in front of the water, rather than being overwritten by the later water draw. Trees, arch, foreground stone, and foliage retain their positions and recognizable silhouettes. The serpent remains above the playing surface, with its head at the same board position and the same disconnected portal paths. The visible food, portal circles, and hazard symbols remain present and similarly placed.

Metrics corroborate matching represented content: both worlds report 6270 static placements, 13 static meshes, five hazards, four portal ends, and no obstacles; both serpents report three paths, 213 rings, 1917 vertices, 3360 body triangles, and no truncation. Object counts alone are not treated as proof of visibility; they agree with the inspected pair.

This fixture contains no obstacles and only one settled overview. It does not prove all future foreground/dynamic overlap cases, active-hazard appearances, arbitrary dimensions, camera paths, or animation states.

## Quantitative image comparison

Differences use decoded 8-bit RGB values without registration, resampling, or color-space conversion. Mean absolute RGB difference averages all three channels; the threshold columns use the maximum absolute channel difference per pixel. Rectangle end coordinates in the data file are exclusive.

| Region | Mean absolute RGB difference, 0–255 | Pixels with any channel difference >8 | Pixels with any channel difference >24 |
|---|---:|---:|---:|
| Full 960×640 image | 1.782 | 7.218% | 2.622% |
| Gameplay rectangle `(20,93)-(940,550)` | 2.604 | 10.548% | 3.831% |
| Left water `(25,155)-(165,515)` | 0.398 | 0.000% | 0.000% |
| Central garden `(300,260)-(630,380)` | 2.327 | 10.280% | 2.129% |
| Rear flowers `(320,198)-(667,243)` | 9.899 | 40.282% | 18.815% |
| Front foliage/stone `(175,416)-(740,524)` | 2.693 | 12.911% | 2.855% |
| Top HUD `(0,0)-(960,90)` | 0.000 | 0.000% | 0.000% |
| Caption/footer `(0,552)-(960,640)` | 0.000 | 0.000% | 0.000% |

The gameplay rectangle's RGB RMS difference is **8.143 / 255**. Its maximum single-channel difference is **174**, and **0.535%** of its pixels differ by more than 64 levels. These localized large differences are why the small mean error should not be described as pixel identity.

## Runtime evidence and performance limits

The cached metrics report `supported=true`, `active=true`, three hits, two builds, a 690×342 cache, and four MSAA samples. The direct metrics report the cache disabled. The cached frame reports 51 calls / 11,498 triangles versus 63 / 74,935 in the direct condition. The world and body statistics are otherwise matching. This supports that the cache is actually active and dynamic 3D geometry is still being submitted; fewer submitted triangles do not establish a frame-rate pass.

The CI report contains **11 passed, one failed, zero flaky/skipped** browser tests. It records passing cache reuse/resize/context-loss and matching-capture tests. The cache lifecycle test checks a rebuild after resizing, bounded texture growth, WebGL error zero, and the application's Canvas fallback after forced context loss. It does not perform a pixel comparison itself; that was the purpose of this independent review.

The sole failing test is the 1920×1080 desktop pacing gate. Its first assertion required at least 18 animation callbacks in the measurement window and observed **5**. The full desktop metrics file was not written because that assertion failed before the write; therefore this report does not turn the count into a precise measured FPS or claim the later actual-draw/max-gap assertions passed. The fixed 17 FPS and sub-250 ms requirements remain unmet by the recorded run.

The small before/after `frameMs` samples include startup and contain only three/five frames. They are not a useful controlled steady-state speedup measurement.

## Acceptance statement

The previous complete absence of actual cache-output evidence is now resolved for this one reduced-motion, low-quality overview fixture. Actual images support preservation of broad scene appearance and visible gameplay content. A cosmetic edge/antialiasing difference remains documented. The desktop performance failure, broader animation/camera coverage, long-run resource stability, and whole-game Snake Pass comparison remain separate gates.
