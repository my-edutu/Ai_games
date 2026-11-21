# Pass157 — original native guardian-motion audit and real CI regression (2026-11-05 UTC)

**Source and benchmark:** AI Maze Escape draft PR #53, branch \`feat/maze-3d-gauntlet\`. Fixed comparison: [official Nintendo Captain Toad: Treasure Tracker gameplay](https://www.nintendo.com/us/store/products/captain-toad-treasure-tracker-switch/); supporting Luigi's Mansion 3 / ASTRO BOT. **Nintendo quality benchmark NOT MET. Do not merge or deploy.**

## Authentic exact-source image evidence, not fabricated frames

- [Successful exact-source WebGL run 41949829044](https://github.com/my-edutu/Ai_games/actions/runs/41949829044), production source \`13c12864\`, [original artifact 13381360848](https://github.com/my-edutu/Ai_games/actions/runs/41949829044/artifacts/13381360848) (captured 2026-11-05 01:48–01:51 UTC).
- Recovered the original 20.2 MB ZIP and verified **28 of 28 unmodified full-resolution original PNG SHA-256 digests** against 26 dated source sidecars plus true gate BEFORE/MID/AFTER transition manifest. No missing or mismatched original. No screenshot synthesis.
- The same original 390×844 public tick 13, seed \`maze-visual-reference-13\`, run token \`5e87cabf\` yielded three real phases: **notice 0.00198** at 01:49:21.665Z; **brace 0.45007** at 01:49:24.457Z; **shell-release 0.87380** at 01:49:26.371Z. Both Pip and Thornback were entirely within unchanged ±0.95 NDC physical bound and all four control targets measured 44px.
- A separate locally executed, source-bound PNG audit/critic helper is committed at [\`scripts/maze-native-critic.py\`](../../scripts/maze-native-critic.py) (commit \`caa41476\`). It fails closed for altered screenshot SHA, wrong original run, 43px control and out-of-frame physical guardian; all four adversarial local checks were performed, in addition to original 28/28 successful artifact validation. It reads the original ZIP; no browser/heavy software graphics probe.

### Native-pixel motion (descriptive, NOT a visual quality score)

| Real 390×844 stage ROI | Changed pixels (>11 max channel delta) | Changed share | Model-screen center drift |
| --- | ---: | ---: | ---: |
| Notice → brace, actual Thornback physical region | 16,540 / 31,824 | 51.97% | 10.60 CSS px |
| Brace → shell release, Thornback region | 8,391 / 33,755 | 24.86% | 4.36 CSS px |
| Notice → brace, actual Pip region | 12,206 / 21,228 | 57.50% | 8.89 CSS px |
| Brace → shell release, Pip region | 2,804 / 21,240 | 13.20% | 1.72 CSS px |

These source-bound native-pixel differences mix camera movement, materials, shadows and actual connected 3D animation. **They cannot independently prove artistically readable gestures or Nintendo parity.** The lead inspected the entire original 390 frames: physical shell release is visible, but the middle brace is weak at normal size. Original fossil-world 320/390/844/1280 screenshots keep the low-text full-screen stage but oversized repeating facades and too little consequential stage interaction remain far below the reference.

## Actual CI failure, root cause, correction

Two exact-source focused runs [41955194380](https://github.com/my-edutu/Ai_games/actions/runs/41955194380) and [41955671258](https://github.com/my-edutu/Ai_games/actions/runs/41955671258), plus full CI [41955194500](https://github.com/my-edutu/Ai_games/actions/runs/41955194500) and [41955671355](https://github.com/my-edutu/Ai_games/actions/runs/41955671355), **FAILED** during the build/test stage before new real WebGL rendering. This is a source animation reset regression, NOT CPU-throttled SwiftShader. The independent installed-Three guardian planting test at \`tests/phase3/maze-3d-guardian-planting.test.cjs:57\` requires the foreleg hinge to reset to exact **+0**, but the new initial branch evaluated \`-0*.32-0*.60\` to JavaScript **-0**, violating terminal/hidden deterministic reset.

[Source fix \`72e0693f\`](https://github.com/my-edutu/Ai_games/commit/72e0693f7982fe8df7880df28acc6a6638cb8d6b) gates the negative foreleg expression behind genuine \`alert>0\`; when unseen/terminal it assigns literal +0. This preserves all nonzero physical poses, existing tests, public source privacy, reduced-motion and no-new-resource restrictions. A local Node expression test verified +0 in all leg index branches and bit-identical active values; **the actual installed-Three exact-source CI and original screenshots are still PENDING**. No quality win from source assertions.

## Fresh-context status, next pieces, and acceptance

The shared \`chat_on_steriod\` coding workspace tunnel returned **NOT_FOUND (not connected for over 300 seconds)**; fresh-context builder/critic workers and Ultracode could not be used. This quantitative assessment is a direct lead critic, NOT a detached blind A/B or Nintendo parity judgment.

Next acceptance is (1) a **green exact-head installed-Three test**, (2) actual hash-verified native 320×740, 390×844, 844×390 and 1280×900 updated Pip–Thornback frames from the \`72e0693f\` source, no cropped model or HUD occlusion, then (3) a truly separate full-frame image critic vs the frozen Nintendo images. If the foreleg plant remains unreadable, improve **physically staged mutual acting and nearby publicly witnessed environmental consequence**, not dashboard prose, risky camera cropping or abstract test counts. The current artifact predates the newest foreleg animation; do not pass the new pose on the older screenshots.

The live gameplay remains full-viewport with actionable low-text HUD, Details/Map on demand and four 44px controls. Keep strict public knowledge, determinism, reduced motion, keyboard/focus, high contrast, fallback/reconnect, real-event captions, source privacy, tested physical bounds and source-bound provenance. **Draft PR open; automation active; no merge/deployment/claimed win.**
