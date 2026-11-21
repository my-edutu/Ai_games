# Pass99 — Traversable tideglass stair architecture / real model and native image gate

**Date:** 2026-11-03 (Africa/Lagos). **Existing draft:** [PR #53](https://github.com/my-edutu/Ai_games/pull/53) on `feat/maze-3d-gauntlet`. **Primary fixed bar:** [Nintendo Captain Toad: Treasure Tracker gameplay](https://www.nintendo.com/us/store/products/captain-toad-treasure-tracker-switch/); Luigi's Mansion 3 and ASTRO BOT remain supporting references. This is not a Nintendo-quality success claim.

## First: current source/CI boundary

Re-read live PR head and the Pass98 review, live progress JSON, source camera, terrain and portrait HUD contract before touching this branch. Pass98 previous-source focused original WebGL workflows [41566701046](https://github.com/my-edutu/Ai_games/actions/runs/41566701046) and [41567028678](https://github.com/my-edutu/Ai_games/actions/runs/41567028678) are **SUCCESS** and have original capture ZIPs [13199957507](https://github.com/my-edutu/Ai_games/actions/runs/41566701046/artifacts/13199957507) and [13199348842](https://github.com/my-edutu/Ai_games/actions/runs/41567028678/artifacts/13199348842). Artifact 13199957507 was downloaded to the conversation file service, but the container/image inspection backend returned ConnectionError; **its dated PNGs have NOT been independently SHA-recomputed or visually inspected this pass**. Do not borrow older screenshot conclusions as Pass98 or Pass99 visual acceptance. Earlier full-repo workflows were cancelled amid concurrent runs; that is not a monorepo pass or a proven Maze failure.

## Builder: a physical *playable* level link, not more offshore detail

The largest ongoing visible weakness is a flat/repetitive stage and small physical gameplay interaction. In source [ba55fad](https://github.com/my-edutu/Ai_games/commit/ba55fad150e0e61861e4240de6ef52c70e84deb5), the existing **legally traversable, publicly disclosed elevation stair** is now connected to **two actual 3D sloping stone/sea-glass handrails**. Each rail has three rooted masonry uprights and ivory caps, following the real 1.4-unit rise of the existing eight-step passage. A side offset of 0.99 units keeps every upright outside the authoritative 1.56-unit walkable centerline. Reuses the world's existing batched Box geometry/materials: no new texture, material, geometry, collision, AI authority or per-frame GPU allocation.

The further [public-reciprocity correction 775a87e](https://github.com/my-edutu/Ai_games/commit/775a87e41fbd7ff27372bfeba18a656043c896c7) requires **both** disclosed cells to report the passage before the new balustrade appears. Unknown, nonreciprocal, ordinary flat or blocked routes must not acquire visual false bridges. Existing stair movement and the simulation are untouched.

## Separate objective code-level critic

[Production Three.js tests 996978e](https://github.com/my-edutu/Ai_games/commit/996978e60c904d11c4325a9b8caf904992011697) instantiate the actual `world.js`, decompose real GPU instanced-mesh matrices and require one physically full-length rail on **each** side of the true public stair, not a test stub or a narrative counter. Assert original snapshots never mutate, missing/nonreciprocal cells never create rails, fixed geometry/material/texture budgets and fresh-run cleanup. [Supplement b095bac](https://github.com/my-edutu/Ai_games/commit/b095bac60f632a80e02b00329429b76dcbb743d3) explicitly rejects a one-sided route disclosure. These checks do not substitute for actual native WebGL criticism.

At writing, **Pass99 exact-source focused WebGL [41573952556](https://github.com/my-edutu/Ai_games/actions/runs/41573952556) and separate whole CI [41573952500](https://github.com/my-edutu/Ai_games/actions/runs/41573952500) were in progress**, not asserted green. No Pass99 original screenshots yet independently downloaded, hashed or judged. Do not merge/deploy.

## Full-resolution acceptance gate for next loop

1. From exact-source focused successful CI, download the original dated PNG/JSON ZIP. Recompute every SHA-256 and confirm the same actual branch commit and no cropping/resizing. Inspect full-screen **320×740, 390×844, 844×390 and 1280×900** WebGL, true public steps/guardian, Pip, key pickup and gate before/mid/after. Ensure 44px one-handed controls, no bottom dashboard, event-only captions, reduced motion, keyboard focus and accurate AI source privacy remain.
2. In an actually public connected elevated two-cell scene, inspect the real two physical rail meshes and their relation to Pip's feet; reject clipping, floating supports, mistaken secret passages, excess HUD occlusion or a camera that still leaves the subject too small. The tests' transform data is not the visual result. Do not relax existing margins or image thresholds.
3. Compare unedited current and prior same-seed native screenshots to the frozen official Nintendo reference. Use blind A/B only with a truly separate critic and original images. If this architectural change is mostly invisible or unattractive, reject it and target larger authored characters and acted moments instead. No fixed number of Gauntlet rounds, no acceptance from counts or SwiftShader frame time.

**Capabilities:** shared interactive workspace and local container remained disconnected. Fresh-context builder/critic subagents and Ultracode were unavailable. Remote GitHub writes and GitHub Actions did operate; no independent artistic verdict, hardware GPU FPS conclusion or finished game claim.

**Status:** Pass99 physical source + independent real-model assertions **COMMITTED**; source-bound rendered appearance **PENDING**; Nintendo fixed benchmark **NOT MET**; PR **open draft, unmerged, undeployed**.
