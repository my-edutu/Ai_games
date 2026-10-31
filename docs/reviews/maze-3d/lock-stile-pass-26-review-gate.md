# Game 2 Gauntlet — pass 26 review gate: physical keyhole on camera-facing stile

**Date: 2026-10-31. New 3D source committed. Actual source-render inspection PENDING; independent critic PENDING; fixed benchmark NOT PASSED.** Draft PR #53 remains unmerged and undeployed.

## Frozen visual bar

Official Nintendo **Captain Toad: Treasure Tracker** gameplay frames, SHA-256 sandstone scene `b33003efa5e943e27ddc9daa9d1c9a396313d5f0ee7bd836c731c4cbfc286d9b` and water/explorer scene `4c6a3e171ebd4125cf16de29db54f22089f1ba6f3ae85cd5d6059f30f262e8b7`, are the unchanged primary benchmark. Luigi's Mansion 3 and ASTRO BOT remain secondary. Never replace the benchmark with generated renders or a softer target.

## Largest gap from the actual previous image

Pass-25 real 390×844 browser capture from [artifact 13046850726](https://github.com/my-edutu/Ai_games/actions/runs/41210379937/artifacts/13046850726) (2026-10-31 **14:38:41.987 UTC**, PNG SHA-256 `99ef106b256cbc347887de25c755c38a22b95e8123208ce98a383e6b53dc2401`) shows Pip's authentic matching key close to the still-shut door, but the socket sits on the crossing braces. The gesture is small and does not immediately communicate physical cause on a phone. Desktop same production seed/tick21 from **14:38:39.941 UTC**, SHA-256 `223fe47e9d443a6d83a0860746433f2d1bd2638318327ed600117541f46586f4`. These are the latest personally inspected render inputs, **not evidence of the new geometry's quality**.

## Independent judgeable pieces completed in source

1. **Stile location / occlusion:** [source commit fd2f0f7](https://github.com/my-edutu/Ai_games/commit/fd2f0f72aa3c2889aa253e785b0eefc152461853) moves the existing true sealed-door socket to local X +0.56 and near-face Z +0.18, away from crossing coral braces. Both cardinal orientations retain a camera-facing right stile. It is a cosmetic part of a gate already in the sanitized public snapshot, not a clue, route, unlock, or path authority.
2. **Native-size silhouette:** the existing layered frame/recess is modestly enlarged and the modeled torus socket ring increases from 0.18 to 0.23 local units, retaining a dark inset with mint only for the exact carried key. No extra materials, geometries, animations or draw-call families are introduced.
3. **Separate source contract:** [test commit 2e1443c](https://github.com/my-edutu/Ai_games/commit/2e1443cb5ce1a87d55ef6e2252bead8092969b85) adds focused socket placement/size assertions on top of existing open/closed, known/unknown, real inventory, geometry-budget and opposite-orientation checks. Tests do **not** prove visual quality.

## Mandatory actual-output acceptance gate

- [Exact-head Actions CI 41218924644](https://github.com/my-edutu/Ai_games/actions/runs/41218924644) must finish and provide actual source-bound desktop **1280×900** and native portrait **390×844** screenshot artifacts and manifests for real public seed `maze-visual-reference-13`, tick21, observed still-closed `door-2`. Verify source SHA, timestamps and PNG SHA-256; do not use a staged private map or a mocked open door.
- Compare unaltered frame pairs with pass25: does the socket leave the diagonal seal, visually approach the real gloved key, remain inside the stile, and maintain the obvious **physically blocked** gate at native size? Does any prop overlap Pip's face or disappear behind masonry? If worse, revert or iterate; do not claim success merely because the source test is green.
- Compare directly to both fixed Nintendo images, ideally with a separate fresh-context critic blind to candidate order; examine whole-frame hierarchy, scene occupancy, recognizable player pose, physical story and texture/lighting richness. The lead's prior judgment remains **Nintendo wins**. No independent A/B verdict exists for pass26.
- Audit full Maze action and stable authority/cadence without weakening assertions. [Prior head CI 41212489803](https://github.com/my-edutu/Ai_games/actions/runs/41212489803) had **104 browser passes**, three genuine **Tiny Kingdom** version/river-expectation failures and no Maze browser failure. That separate head makes the earlier pass25 600ms Maze stall non-reproduced, not proven to be solely host contention.
- The shared-workspace tunnel returned `Tunnel-client has not been seen for 300 seconds`; fresh-context subagent builders/critics and Ultracode cannot currently run. The CI SwiftShader/WebGL environment is heavily CPU-throttled. Do not present its frame latency as representative GPU FPS.

**Current verdict: REVIEW OPEN — no pass26 rendered victory, no independent critic, no merge, no deployment.**
