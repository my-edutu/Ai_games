# Snake compositor change — bounded builder report

## Candidate scope

Only these repository files were edited for this task:

- `public/snake-stream/styles.css`
- `public/snake-stream/viewer-overlays.css`

The candidate removes the stage's blurred outer shadow, the board inset's blurred shadow, and the scene card's blurred outer shadow. It removes backdrop blur from the viewer controls, scene card, and board inset. Previously translucent panels now use opaque dark-green fills: controls `#10221a`, board inset `#10271b`, strong panels `#0f1d17`, and result panels `#15281d`.

The stage's rounded clipping, responsive layouts, dimensions, borders, keyboard focus outlines, button states, and all controls remain unchanged. The zero-blur danger accent and scene card's zero-blur inset decoration remain. Renderer source, native antialiasing, simulation, 3D content, and the production FPS gate were not changed by this task.

## Prior local experiment motivating this change

This is relative evidence under shared host load, **not a 17 FPS pass** and not a measurement of the finished CSS candidate.

One bounded attempt completed in 36.064 seconds. Its owned browser and temporary server were closed. The real app used a frozen public frame from `docs/reviews/snake-gauntlet/round-4-public-frame.json`, tick 966, scene milestone, snake length 73. Viewport was 1920×1080, fixed DPR 0.4, and drawing buffer 736×336.

| Condition | Actual draws | Cadence FPS | FPS including GPU completion | Maximum gap | GL error |
|---|---:|---:|---:|---:|---:|
| Normal UI, native AA on | 6 | 3.248 | 3.199 | 449.9 ms | 0 |
| All CSS filters and box shadows removed, native AA on | 10 | 5.419 | 5.378 | 316.7 ms | 0 |
| Normal UI restored, native AA on | 5 | 2.393 | 2.380 | 583.3 ms | 0 |
| Normal UI, native AA off | 4 | 2.090 | 2.082 | 1166.6 ms | 0 |

Every condition retained 49 draw calls and 11,370 triangles. The CSS A/B/A sequence retained an active cache with three builds throughout. It also retained the stage's 17 px corner radius and hidden overflow. Each sample ended with `gl.finish()`; all GL error checks returned zero and no page/console errors were recorded.

The CSS override improved cadence by about 67% relative to the initial baseline; restoring normal CSS reduced it again. This combined experiment does not attribute the gain separately to backdrop blur and box shadows. The optional native-antialiasing-off sample showed no benefit, had only four frames, and included a long stall; no native antialiasing change is included in the candidate.

Host load rose from 17.20 to 22.24 during the attempt, while cgroup memory rose from 4,470,259,712 to 5,159,030,784 bytes. Absolute local cadence was worse than isolated CI. The local frame also differs from CI's frozen diagnostic frame, so the absolute values are not directly comparable across those runs.

The measured override removed all box shadows. The production candidate preserves zero-blur accents and makes panel fills opaque; its actual visual appearance and FPS must be verified on the next isolated CI run.

Raw evidence: `/tmp/snake-compositor-diagnostic.json`.
Reproduction harness: `/tmp/snake-compositor-diagnostic.cjs`.

## Verification of the CSS candidate

- `git diff --check -- public/snake-stream/styles.css public/snake-stream/viewer-overlays.css`: passed.
- Chromium's `CSSStyleSheet` parser, launched with GPU rendering disabled and no WebGL scene, parsed 73 style rules and 10 overlay rules.
- Compared parsed rules against immutable pre-edit Git blobs `6df7fcc` and `39689e4`: all selectors, media conditions, layout declarations, clipping, borders, and focus declarations remained identical. Exactly ten intended property changes were found.
- No backdrop filter declarations remain in either edited file.
- The later `ux-v2.css` layer was inspected and does not restore these effects.
- The CSS-parser browser was closed. No new 3D/GPU performance run was performed after editing.

Parsed-declaration evidence: `/tmp/snake-compositor-css-check.json`.

The unchanged isolated FPS gate and actual visual review remain pending with the parent agent. No visual or performance success is claimed from these syntax checks.
