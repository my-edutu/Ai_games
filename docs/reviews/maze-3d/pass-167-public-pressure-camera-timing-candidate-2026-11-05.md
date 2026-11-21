# Pass167 — source-bound public pressure camera responsiveness (2026-11-05 UTC)

**Status:** source candidate, NOT yet native-render-approved. Fixed bar: actual [Nintendo Captain Toad: Treasure Tracker](https://www.nintendo.com/us/store/products/captain-toad-treasure-tracker-switch/) gameplay; Luigi's Mansion 3 and ASTRO BOT are supporting craft references. Nintendo parity remains UNMET.

## Independent visual critic — real 320px original (not a generated concept)

The complete WebGL source screenshot from [run 42004111609](https://github.com/my-edutu/Ai_games/actions/runs/42004111609), [artifact 13403717656](https://github.com/my-edutu/Ai_games/actions/runs/42004111609/artifacts/13403717656), dated **2026-11-05T09:45:26.851Z**, tick 5, seed `maze-visual-reference-3`, trap 59, source `80c6bdf`, was part of 32/32 SHA-verified originals. At 320×740, the genuinely disclosed physical jaw projected to **+1.45667 NDC**, beyond the existing +.95 acceptance boundary, while Pip remained visible. The actual screenshot shows the mechanism blending into repetitive architecture and disappearing off the right edge. This is a genuine camera/composition failure, not CPU SwiftShader speed.

Pass166's candidate [f9b86bf](https://github.com/my-edutu/Ai_games/commit/f9b86bffff47f737d709d8ec65be52a47d58ee4b) increased the *target pan* for a published diagonal jaw while preserving the known one-cell camera. Source inspection identified a separate temporal risk: for a public pressure stage, the camera still used generic 4.5/s easing as the autonomous hero advanced on its 180ms public poll cadence. During 180ms, generic easing settles about **55.5%** of the new target, but the existing guardian-like 10/s easing settles **83.5%**. This is a timing/lag hypothesis from actual source math, **not a claim of newly observed rendering**.

## Builder — minimal independently judgeable change

- [ec9f917](https://github.com/my-edutu/Ai_games/commit/ec9f91786127bf37c3826e3dd3df4528de24461b): a pure presentation-only `publicCameraSettleRate` selector. Priority remains witnessed pickup 12/s, public guardian 10/s, active published pressure stage 10/s, gate opening 8/s, ordinary autonomous discovery 4.5/s.
- [4368f71](https://github.com/my-edutu/Ai_games/commit/4368f715fcde02bcd0fa9e22fe8aa3fa2cb6c77e): enable the quicker response **only** when the actual published `publicObservedTrapCameraFocus` shot is selected. Reduced-motion and first-frame immediate settling retain priority. No new AI choices, scene geometry, collider, secret data, screen HUD, invisible trap or acceptance threshold.
- [e226b27](https://github.com/my-edutu/Ai_games/commit/e226b27d3f7aec500e1df1fed383188b76969321): Node regression assertions for deterministic selector/priority and actual 180ms settling fraction, alongside the existing diagonal public-knowledge tests.

The modified production JS, ESM helper and new Node test passed V8 parser preflight; the pure selector passed focused truth-table evaluation. This does **not** substitute for installed-Three.js tests, complete browser CI, real screenshots or fresh-context independent visual judgement. The shared coding tunnel returned `NOT_FOUND`, and GitHub Actions were queued when reviewed; no fabricated source-bound captures or FPS figures.

## Separate fresh critic / exact screenshot acceptance

First inspect the final head's real 320, 390, 844×390 and 1280×900 full-resolution original PNGs and hash sidecars. For the same 320×740 diagonal approach require **full Pip and the complete physical paired shear within original ±.95 NDC** at the sampled frame, unchanged 44px controls, active stage covering viewport, no text/footer occlusion. Look for a fast yet smooth actual one-cell→diagonal→withdrawal camera response, source privacy and deterministic replay. If the camera still crops, fix real camera bounds/sampling, NEVER relax actor/hazard thresholds. Critic must compare actual images against official Nintendo and refuse overall win for repetitive environments and indistinct motion.

**No independent blind A/B or fresh-context subagent/Ultracode approval is claimed.** Remain on draft PR #53, unmerged/undeployed, active Gauntlet.
