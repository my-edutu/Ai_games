# Thirteenth-pass public key and sealed-gate staging — real browser evidence, Nintendo still wins

**Gameplay source:** [`c072f0a`](https://github.com/my-edutu/Ai_games/commit/c072f0a95204010cb178d9193bb2aedba231c7f4), branch `feat/maze-3d-gauntlet`. Fixed reference: the two exact Nintendo **Captain Toad: Treasure Tracker** original images pinned with dimensions/SHA-256 in [reference-manifest.json](./reference-manifest.json), supported by Luigi's Mansion 3 and ASTRO BOT. **Fixed bar NOT PASSED.** No merge or deployment.

## Independently judgeable changes

1. **Closed barrier silhouette:** the original publicly observed locked gate now shows a coral crossed brace within its physical dark bars, a more conspicuous lock plate, and a raised stone frame; the bar/cross assembly fully disappears on the public `open=true` state. The renderer does not choose a route, change locks, or create unknown doors.
2. **Transition and privacy regressions:** a new source-side world test exercises closed, opened and undisclosed gate states, proves only known door props render, proves world geometry/material budgets remain fixed, and proves snapshots are not mutated.
3. **Real camera evidence:** `window.__MAZE_3D__` now reports `keysInFrame` and `closedGatesInFrame` by projecting only actual known key/gate meshes. The *existing* production-frame browser check captures four scene types from unaltered public `MazeRuntime` snapshots on one browser/page, with UTC timestamp, seed, tick, source hashes and SHA-256 per PNG. On-screen projection is **not** an occlusion or perceptual-quality guarantee.

## Actual output inspected by lead (2026-10-31)

All screenshots below are **1280×900 actual browser PNGs**, extracted from genuine [CI artifact 13030701894](https://github.com/my-edutu/Ai_games/actions/runs/41169676492/artifacts/13030701894) on source `c072f0a`. The PNG SHA-256 hashes were rechecked against their JSON manifests; no actor, key, door, or disclosed route was inserted into snapshots.

| Evidence | Public source frame | UTC screenshot time | Verified PNG SHA-256 |
| --- | --- | --- | --- |
| `known-key.png` | `maze-visual-reference-13`, tick 16; disclosed uncollected key in cell 37, one legally known step, `keysInFrame=1` | 2026-10-31T04:49:01.092Z | `6cdc984a165b036c20fc090f5abc0d7aad5d2a610fb616bf691c1394a1434b55` |
| `sealed-gate.png` | same genuine production seed, tick 21; publicly seen closed `door-2`, `closedGatesInFrame=1` | 2026-10-31T04:49:08.171Z | `157d9127446bd49abbda53a2f0183309596a50e5b36d5fb6727dfccf26088613` |
| `observed-landmark.png` | same seed, tick 26; exit cell 69, one legally known step | 2026-10-31T04:48:53.512Z | `e7c84ac1c4cf48ee6efc434b8a7411a37b25e026ef323ebc72ef0a2c5a3f44f7` |
| `encounter-public.png` | same seed, tick 13; two original disclosed actors | 2026-10-31T04:48:45.395Z | `7e811af06d90c87a0d0f7c3f79bc156d758d44f886907e4b8caad0a9b522f379` |

The current image manifests independently pin `scene.js=f6d50ba3b4d543fffde5eb085848485bea565996e480c971fe4a094af5200a91`, `world.js=08bc7cbdfa95dcc5728b2d8b49f39c44f2036191cb88e0835101a97b4cba7fbe`, `map-view.mjs=297f5bacb099205bcd2fc291cfc1e46cd3098a0d2fabe8b204742aefd8ca5895`. The exit and encounter images are byte-identical to the previously verified source-independent pass twelve/pass eight views respectively, appropriate because this pass changes only door props and observability.

**Lead's native-size review of actual output:** the golden key is now unmistakably a three-dimensional collectible, adjacent to the real small Pip on a raised garden platform. The sealed-gate screenshot confirms a dark barred physical opening with some coral crossed accents, but the gate is **near the left edge**, largely seen obliquely and the X is too small/partly obscured to read immediately as the main blocked path. Relative to the exact Nintendo Captain Toad gameplay images, character expression, stage silhouette, objective/obstacle hierarchy and camera balance still fall short. This is a lead inspection, **not** a separate critic, anonymous comparison or Nintendo win.

## Functional validation and remaining evidence gates

[Autonomous Games CI run 41169676492](https://github.com/my-edutu/Ai_games/actions/runs/41169676492) completed successfully on `c072f0a`: **523/523 Node tests, 25/25 browser tests**, built source, all four stream host self-tests, nondeterminism scan, evidence generation and release checks. The specific new browser evidence case ran successfully and saved all four images and manifests. Three Eko workflows are separate from the fixed-bar verdict. No test thresholds were lowered. `known-key` and `sealed-gate` recorded software-renderer frame median samples of about 366.7ms and 283.3ms; these highly CPU-throttled SwiftShader CI numbers **do not represent hardware GPU FPS** or classify any product graphics defect.

The shared-workspace tunnel was attempted again and returned `Tunnel-client has not been seen for 300 seconds`; fresh separate builder/critic subagents and Ultracode were unavailable. Consequently no blind A/B with the SHA-pinned Nintendo images has run, and the last independently completed critics **still prefer Nintendo**.

**Feed the biggest remaining gap back:** frame a nearby publicly disclosed shut gate next to Pip more legibly without implying a viable passage; consider moving the modeled crossed braces toward the visible side and making the physical blockage clear from the actual camera. Verify the real native-size gate before claiming the improvement. Then capture a real portrait key/blocked-gate view and fresh independent blind Nintendo comparison. Keep unknown geometry, locked links, deterministic game state and old source-bound journal images untouched. PR remains draft, unmerged, undeployed; Gauntlet continues.
