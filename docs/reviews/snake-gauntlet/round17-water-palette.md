# Round 17 — precomposed original water color (candidate)

**Base exact-source head:** `418d49562fc69b0d7e4fddd119d6b0bcd054d0f7`. **Source water blob:** `f4a994aa17d7a9c762d20cf0c210dc81b7972033`. Original water already uses one 256×256 periodic texture sample, animated UV flow, distance fog and reduced-motion freezing. Full desktop performance, independent whole-game review and commercial-reference victory remain open.

## Measured reason for the bounded slice

The latest exact-head initial Round 16 [focused browser run 41172211493](https://github.com/my-edutu/Ai_games/actions/runs/41172211493) passed 15 of 16, but the unchanged desktop gate **failed** with **16 actual submitted draws over 1003.5ms**, below 17. The ~60.79 animation callbacks per second do not count as rendered frames. The same isolated run's diagnostic-only fixed-DPR 0.4, minimal frozen page reported **45.75 submitted FPS with full rendering** versus **54.32 with water omitted**, and estimated mean non-disjoint GPU query work of 10.38ms versus 7.04ms. These different composition paths are a cost clue, **not** evidence that removing water is safe or a proven production speed gain. The water stays fully present.

## Implementation and explicit invariants

Water's original fragment mix is affine in a quantized broad-field and foam-channel pair. At creation, keep generating the **same deterministic periodic 256×256 broad/foam fields**, quantize those two original channels first, and precompose the **same opaque aqua RGB palette** into the same-size RGBA8 texture. The fragment shader now samples this existing filtered RGB texture once and applies the **same fog**, instead of separately computing depth, color interpolation and foam addition at every displayed water pixel. UV movement, time-uniform update, reduced-motion freeze, geometry, water extent, draw calls, textures, allocation count, gameplay snapshots, scoring, portal continuity, character, audience and recovery are unchanged.

Across all 65,536 combinations of quantized broad/foam bytes, the change's maximum introduced per-channel palette bake quantization is **0.5/255** before texture filtering; this is a static arithmetic bound, **not** a screenshot parity verdict. No copied reference artwork is used.

## Tests, captures and review gate

New `tests/phase3/snake-water-palette.test.cjs` checks one RGB lookup (a RED expectation on base source, where blue was zero and the palette was calculated in fragment GLSL), fog, animated/reduced-motion time, original palette channel bounds, cross-channel affine relationship, independent color variation, data wrap/filtering, budget and disposal. Existing seam, original water texture and full Snake suites must still pass. CI and **real new WebGL screenshots/motion** are **pending at publication**; this text does not claim Node tests or visual/motion success before a real run.

Critique against [official Snake Pass](https://store.steampowered.com/app/544330/Snake_Pass/) (ASTRO BOT secondary): previous real capture retains opaque rather than richly refractive water, too regular pale courtyard and a comparatively amphibian face. Packing the identical color palette is deliberately **not** a visual win. Independent critic is unavailable via the disconnected worker tunnel. Reject/revert this narrow optimization if live capture, reduced-motion, headland revision 2 visual quality, rendering latency or resource counts regress. Preserve **≥17 actual desktop submissions**, existing FPS/gap checks and bounded 2-frame GPU queue. PR remains draft, unmerged and undeployed.
