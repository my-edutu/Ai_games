# Pass108 — Pass107 genuine gate frames audited; root the visible doorway forecourt

**Date:** November 3, 2026 UTC. **Draft:** [PR #53](https://github.com/my-edutu/Ai_games/pull/53). No merge or deploy.

## Original exact-source image audit (Pass107)

- [Focused WebGL run 41614656500](https://github.com/my-edutu/Ai_games/actions/runs/41614656500) **SUCCESS** at exact production head `a425763`; original [artifact 13220269001](https://github.com/my-edutu/Ai_games/actions/runs/41614656500/artifacts/13220269001), 17 MB, created 2026-11-03T10:00:06Z.
- Independently extracted 23 **distinct native PNG captures** and recomputed SHA-256 for every image against dated screenshot sidecars and the genuine same-run gate before/mid/after manifest. **23/23 MATCH, zero mismatches.** One mid-lift image appears in both individual sidecar and three-frame manifest (24 matching references, 23 unique PNGs).
- Real 1280×900 gate mid-lift at **2026-11-03T09:59:26.071Z**, SHA `166c8b8006d7331466328af467f5db19195a40e50ed188d7f3c7d2a99520098f`, true authority CLOSED→OPEN ticks 7→8, portcullis height ratio **0.5100** at capture. Other actual frames BEFORE SHA `a89c5086ec379014aa16d631da71b1270ce997bf8ae6a4b1ddabadb9cdf187f7`, AFTER `9af350d9ba3a6eb0df580ba46af8757dddd0373bc6f7aca7e5b77cf7902d8257`.
- Source-bound native 390×844 witnessed key at **09:58:19.889Z** SHA `888eb90cdbd7ad7d19f7750930e5a2c06d2a0c13fe2352e2847d59bf0b17f25a`: eight genuine fragments, 69.31px spread, Pip whole in-frame, camera hero-facing 0.956, actual half-height 5.70. Genuine 320×740 Follow guardian at **09:55:36.855Z** SHA `193611461be0867c67bd7da72c5463246271fdc3550b6d6063abc846e137d940`: full Pip and Thornback physical bounds + 44px controls. 844×390 and 1280 gameplay also captured.
- **Actual visual critic rejects fixed benchmark:** The new camera now views the real public gate more frontally than Pass106; however prominent **tall garden masses still overlap Pip's torso and legs** in the verified mid-lift image. It still lacks the varied authored story-stage and expressive action density of [Nintendo's official Captain Toad game imagery](https://www.nintendo.com/us/store/products/captain-toad-treasure-tracker-switch/). This is a lead original-image critique, not an independent fresh-context blind A/B victory. `Pass107` whole-repository CI run **41614656497 was cancelled**, not all-green.

## Largest actionable gap and production response

**Builder piece A — physical forecourt/camera readability.** In `public/ai-maze-escape/world.js`, replace the tall leaf/sphere wall garden and extra protruding plant on **already disclosed gate approaches** with original low-rooted stone, ivory and moss planters. Exact public *adjacent* gate endpoints must both appear as known, unblocked cells; the one-step skirt accepts only actually disclosed walkable neighbors. Preserve the original surrounding gardens everywhere else. Real instances only, materials/geometries reused, no extra gameplay overlay, AI, collision change, inferred route, secret cell, invented action or shader. Critical for the original 1280 gate mid-lift image, not just CSS.

**Builder piece B — deterministic visibility semantics.** Terrain signatures now include only *already disclosed* valid gate endpoint pairs. Newly revealed public gates rebuild the actual forecourt, without every CLOSED→OPEN triggering visual foliage popping. The generated low garden stays a meaningful physical silhouette rather than deleting architecture.

**Separate source critic:** `tests/phase6/maze-public-gate-forecourt.test.cjs` uses actual production Three.js world construction. It judges physical foliage instance reduction, retained GPU geometry/material family, no hidden cell rendering, stable known-gate opening, repeatability/restoration and failure closed for partial/invalid public endpoints. It does **not** replace a real WebGL image critic.

## Pending exact-source acceptance

- Source commits: [933d9d2](https://github.com/my-edutu/Ai_games/commit/933d9d24e6e4c73024d7e679ad5d26b9654fa1d8), [2d1f52c](https://github.com/my-edutu/Ai_games/commit/2d1f52c450c7cb9f4033e2deb92dcd0cc47a675b).
- New-source [focused WebGL 41627915220](https://github.com/my-edutu/Ai_games/actions/runs/41627915220) and [whole-repository 41627915449](https://github.com/my-edutu/Ai_games/actions/runs/41627915449) were queued when recorded. **No Pass108 screenshot approval yet**. New 1280 gate before/mid/after plus 320/390/844 must be individually hashed and visually compared at native full resolution before accepting the forecourt. Reject Pip/guardian cropping, blocked gate action, HUD excess, privacy leakage and source test failures. Do not lower thresholds.
- Shared game workspace connector returned **NOT_FOUND, tunnel disconnected over 300s**; subagents and Ultracode unavailable in this pass. No independent blind A/B or direct hardware GPU FPS inference. CPU-throttled SwiftShader cannot be treated as product performance evidence.

**Fixed Nintendo benchmark: NOT MET. Draft PR remains OPEN, unmerged and undeployed.**
