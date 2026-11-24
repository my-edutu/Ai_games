# Fourteenth-pass sealed gate — authentic same-frame foreground comparison

**Source:** [`e309c66`](https://github.com/my-edutu/Ai_games/commit/e309c6657ee2d17040440c82643ecc3ea42ce9c1) on `feat/maze-3d-gauntlet`, [draft PR #53](https://github.com/my-edutu/Ai_games/pull/53). **Primary fixed visual bar:** the two SHA-pinned official Nintendo *Captain Toad: Treasure Tracker* screenshots in [reference-manifest.json](./reference-manifest.json), with Luigi's Mansion 3 and ASTRO BOT as supporting references. **Nintendo still wins overall.** The work is not merged or deployed.

## Independently judgeable source slice

The previous sealed gate's physical coral X and gold lock were placed behind its dark bars from the fixed isometric camera's viewpoint. The viewer could see the closure only as small orange shapes partly occluded inside the gate. On the same *already disclosed* closed gate, both diagonals now sit on the positive local-Z front face, with the lock outside the braces. The near face is positive world Z for a north/south doorway and positive world X after the east/west doorway group rotation; both face the unchanged isometric camera offset (+15,+21,+18). The original reusable gate meshes, open-gate clearance, deterministic authority, known-cell constraints and game rules are unchanged.

The existing world regression additionally checks: two visible crossed braces ahead of the bars; a foreground lock on the gate's near face; both orthogonal gate orientations; barrier absence when the door opens; absence when neither endpoint is public; unchanged source snapshots and fixed shared GPU resource counts. No test threshold was relaxed.

## Genuine rendered output and source provenance

Source-bound [GitHub CI artifact 13031426025](https://github.com/my-edutu/Ai_games/actions/runs/41170583499/artifacts/13031426025) includes an actual **1280×900** sealed-gate PNG and machine-readable JSON capture manifest, from the same unaltered production MazeRuntime seed `maze-visual-reference-13`, **tick 21**, observed closed gate `door-2`. No actors, route, gates or keys were inserted into the public snapshot. The browser capture was taken **2026-10-31T05:04:37.546Z**, source `e309c66`; `closedGatesInFrame=1`.

| Image | Capture | SHA-256 |
| --- | --- | --- |
| Thirteenth pass, real original gate | 2026-10-31T04:49:08.171Z, same seed/tick | `157d9127446bd49abbda53a2f0183309596a50e5b36d5fb6727dfccf26088613` |
| Fourteenth pass, real forward-facing seal | 2026-10-31T05:04:37.546Z, same seed/tick | `3ef0814c04f38a2465687b7feded50c6d8b7dc24c3da6ed2278de74f356ef668` |

The current manifest records `world.js` SHA-256 `76970e2a38badaf8edcd7cb8639f2a6a86f26bdc4df3f0cfc709bb371218f002`. The other renderer and public mapping source hashes are unchanged since the thirteenth pass: `scene.js=f6d50ba3b4d543fffde5eb085848485bea565996e480c971fe4a094af5200a91`; `map-view.mjs=297f5bacb099205bcd2fc291cfc1e46cd3098a0d2fabe8b204742aefd8ca5895`. Both PNG SHA-256 values were checked against the saved bytes. An aligned same-frame RGB threshold calculation finds **about 0.218%** of pixels change by more than 12 intensity levels in any channel. This is only a localization/provenance diagnostic, **not** a perceptual quality score.

**Lead native-size visual inspection:** the new coral X and gold padlock now appear on the observer-facing side of the barred gate and are substantially easier to distinguish. The image still has a small, left-edge obstruction and a Pip partially obscured by its lintel. Much of the field is water, and the obstacle/next-action relationship is not clear enough unaided at gameplay scale. The fixed Nintendo diorama still has stronger hero-action readability, compositional focus and expressive character design. **The benchmark is NOT PASSED.** These observations are by the lead; there is no fresh independent critic verdict or blind Nintendo A/B.

## Actual CI and remaining gates

[Autonomous Games CI run 41170583499](https://github.com/my-edutu/Ai_games/actions/runs/41170583499) **completed successfully on this exact source**: **523/523 Node tests and 25/25 Playwright browser checks**, build, four stream self-tests, deterministic scan, phase evidence generation and artifact upload. This establishes the observed closed/open/undisclosed gate contract and successful browser renderer operation, **not** art quality. The sealed-gate CI software frame-time median was around 316.6 ms on an unusually CPU-throttled SwiftShader host. This is not a hardware GPU FPS or a diagnosed graphics regression.

The fresh-context workspace/subagent tunnel was attempted and failed with `Tunnel-client has not been seen for 300 seconds`; independent builder/critic A/B and Ultracode are therefore **unavailable**, not silently counted. The next smallest visual slice is to make Pip and the now-clear barred gate share a stronger **public-state-only** camera composition without suggesting that a shut gate is traversable; then capture actual portrait gate/key frames and obtain independent blinded visual opinions against the fixed Nintendo images. Never substitute these older dated journal captures as new screenshots. The branch and PR remain **draft, unmerged and undeployed**.
