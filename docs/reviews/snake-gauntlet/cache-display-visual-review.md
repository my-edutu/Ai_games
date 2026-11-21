# Display-color cache — actual CI image review

Date: 2026-10-30. Reviewer: `snake_cache_critic`. Read-only; no browser run or repository edit.

## Verdict

**PASS for visual preservation against the previous cached renderer in this supplied fixture.** Round 6's `cache-after.png` is byte-for-byte identical to round 5's `cache-after.png`. There is no newly visible or measurable display-color quantization, color/fog, occlusion, foliage, water, serpent, or prop change in this pair.

The previously reported harder/brighter fine static edges relative to direct rendering remain unchanged. This is not a pixel-equivalence pass against direct rendering, a performance pass, or a whole-game benchmark win.

## Evidence and comparison

- Feature commit: `c953c64d21059fe6eb2dc9f7cb094655ddaba48e`.
- CI synthetic merge: `8b17439f1046b9c0c9296ab58d82e215ecd238fd`; report subject identifies the feature commit above.
- New captures and metrics: `/tmp/snake-3d-ci-round6/artifacts/phase3/cache-before.png`, `cache-after.png`, and their corresponding metrics JSON files.
- Previous cached frame: `/tmp/snake-3d-ci-round5/artifacts/phase3/cache-after.png`.
- Detailed comparison data: `/tmp/snake-cache-display-pixel-diff.json`.

I inspected all three requested original images directly and compared decoded RGB without registration, resampling, or color conversion. Images are 960×640, showing the same reduced-motion, low-quality overview replay fixture.

| Comparison | Mean absolute RGB difference, 0–255 | Maximum channel difference | Exactly matching pixels |
|---|---:|---:|---:|
| Round 6 cached versus round 5 cached | **0.000** | **0** | **100%** |
| Round 6 direct versus round 5 direct | **0.000** | **0** | **100%** |
| Round 6 direct versus round 6 cached, full image | 1.782 | 174 | 54.155% |
| Round 6 direct versus round 6 cached, gameplay rectangle `(20,93)-(940,550)` | 2.604 | 174 | 33.006% |

All **614,400 pixels** of the cached output match the previous cached image. Their PNG SHA-256 hashes also match: `f478af986326516f9723066d32acaf0a6863f2fe167d48c2991f8b75448a3983`. Both direct captures share hash `192001f3cc64654e6ea59cf9b2b6599aada5b5134a6209ee10d8e55e6810e4f9`.

Thus the earlier edge finding is quantitatively unchanged: 3.831% of gameplay-rectangle pixels differ from direct rendering by more than 24 levels in at least one channel; the rear flower-band mean absolute RGB difference remains 9.899 / 255. These differences were present before the display-color bake.

The new cached metrics show 14 textures, compared with 13 in the previous cached run, along with an active 690×342, four-sample static cache, two hits, and two builds. Dynamic geometry is still submitted: 51 calls and 11,498 triangles, with matching world and body counts. This is consistent with the additional display target being exercised rather than the new result merely being another direct-render condition.

## Performance remains failed

Round 6 now records the desktop measurement before asserting the gate, so its values are available:

| Recorded desktop measure | Result |
|---|---:|
| Viewport / canvas CSS size | 1920×1080 / 1842×842 |
| Active cache size | 1381×631 |
| Measurement duration | 1144.6 ms |
| Actual draws | 6 |
| Average rate | **5.242 FPS** |
| Maximum observed gap | **266.6 ms** |
| Cache reuse at end | Active; 22 hits / 4 builds |

The result fails both the existing 17 FPS minimum and the below-250 ms maximum-gap requirement. The browser report remains 11 passed / 1 failed, with zero flaky or skipped tests. Pixel identity does not compensate for that pacing failure, and these runs do not establish a controlled speedup percentage.

## Scope limit

This is one fixed overview fixture at low quality and reduced motion. It resolves the display-color cache's previously missing actual-output check for that fixture. It does not cover other cameras, animated states, arbitrary device/color configurations, or a soak. Queued water, dynamic-resolution, face, and camera changes are not present in this evidence and are not reviewed here.
