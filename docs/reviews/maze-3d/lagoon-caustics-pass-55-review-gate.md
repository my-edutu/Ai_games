# Game 2 Gauntlet — Pass55 original lagoon caustics and water-only current contours (2026-11-01)

## Unchanged reference / acceptance

The fixed external comparison remains the real [Captain Toad: Treasure Tracker Nintendo gameplay](https://www.nintendo.com/us/store/products/captain-toad-treasure-tracker-switch/) and [SHA-pinned image identity manifest](./reference-manifest.json); Luigi's Mansion 3 and ASTRO BOT are supporting references. No reference assets or textures are copied. No benchmark pass has been established. [PR #53](https://github.com/my-edutu/Ai_games/pull/53) stays OPEN DRAFT and will not be merged or deployed.

## Actual inspected baseline: 00578f0, not Pass55

[Focused workflow 41339985008](https://github.com/my-edutu/Ai_games/actions/runs/41339985008) SUCCESS and [artifact 13096719428](https://github.com/my-edutu/Ai_games/actions/runs/41339985008/artifacts/13096719428): downloaded authentic originals and independently recomputed **10/10 PNG SHA-256 hashes** against original dated JSON sidecars. Native 320×740 public guardian tick13, 844×390, 390×844 and full 1280×900 3D gameplay verify a genuine full-bleed, low-text HUD, visible public characters and user touch actions without a masked canvas. Their UTC capture times are 2026-11-01 19:14–19:15Z. These renders are **earlier source** and must not be represented as images of the Pass55 water candidate.

## Independently judgeable builder slices

1. **Water material** — [commit 44ec1a1](https://github.com/my-edutu/Ai_games/commit/44ec1a1e8176b0c3f6fb8db2e9404ae5d9c0749b) introduces a deterministic 128×128 bounded water raster with two crossed periodic curved caustic families, replacing nearly flat blue-green values without a per-fragment trigonometric shader, external image assets or per-frame material rebuilding.
2. **Physical water-only environmental detail** — the same commit adds one 44-instance shared ring-material draw batch, below all walkable floors, never a stepping stone or key/route marker. Coordinates derive solely from publicly available dimensions, not any private maze structure, discovered coastline, AI motion or seed; stable per run and through public-discovery changes.
3. **Boundary/lifecycle contract** — a separate Node regression proves same-dimension hidden/revealed knowledge and reset do not alter current positions/colors, new runs restore exactly the same water pattern, only actually public terrain is rendered, resources stay fixed and animation does not rebuild the contours.

## Critic acceptance gates still open

- [Exact Pass55 focused run 41341337582](https://github.com/my-edutu/Ai_games/actions/runs/41341337582) and independently separate full CI must complete, with actual original full-resolution WebGL stage screenshots, UTC timestamps and source hashes recomputed from untouched evidence.
- Compare **native** 320×740, 390×844, 844×390, 1280×900 same-seed encounter and exit against the Pass54 baseline, then fixed Nintendo screenshots. Count material water improvement only if actual composition reads better without repeated bright rings, fake affordance, obscured/wrapped actors, HUD obstruction or excessive water coverage.
- Keep original real guardian full-body margin and public exit/closed gate framing, 44px touch controls, focus, contrast, reduced motion, captions, clean feed and reconnect. No test-threshold relaxation; no cropped reference images. Separately assess hardware GPU (software SwiftShader stalls are inconclusive).
- Fresh-context delegated builder/critic, blind A/B and Ultracode remain unavailable from the disconnected shared workspace tunnel; none is falsely claimed. This is a testable candidate, **not** a passed scene or independent critic win. The deeper remaining gap is original character reaction and memorable playable authored scenarios.
