# Game 2 Gauntlet — pass 24: raised key beside Pip, true sealed-gate render

**2026-10-31; fixed Captain Toad bar NOT PASSED.** No merge, deployment or transition out of draft.

## Reproducible source and smallest pieces

- [Gameplay/test commit e0237ec](https://github.com/my-edutu/Ai_games/commit/e0237ecb4bbd92a9f167f8060bb875bab5bd725d) changes only `public/ai-maze-escape/characters.js` and its source tests. A left shoulder/elbow pose lifts the existing glove-held matching key beside the helmet, rather than into the foreground sandstone; the held mesh is counter-rotated upright and scaled 1.25 at full public cue strength.
- Existing `publicCarriedGateCue` still requires an **already-disclosed closed gate and exactly carried matching key**; guardian attention, terminal states, absent or distant keys and reduced-motion static poses preserve prior semantics. The mesh/materials were already created once, with no extra per-frame geometry, no camera or authority change and no private topological access.
- The independently judgeable subpieces are glove height/continuity, key bow orientation, clearance past masonry in desktop and portrait, and no stale key when the public cue clears. Source tests verify both character LODs, 3D transforms and reset behaviour; rendered captures are required for actual occlusion.

## Exact-source verification and authentic browser frames

[Autonomous Games CI 41204087109](https://github.com/my-edutu/Ai_games/actions/runs/41204087109) **PASSED** for source `e0237ec`: build, **526/526 Node tests, 25/25 browser checks**, four host self-tests and authoritative nondeterminism scan. The original [maze phase-3 evidence artifact 13043996998](https://github.com/my-edutu/Ai_games/actions/runs/41204087109/artifacts/13043996998) was downloaded and the real native-size PNG bytes independently SHA-256 checked against the individual production capture manifests.

Both shots use production `maze-visual-reference-13`, actual public tick **21**, genuinely disclosed still-sealed `door-2`, identical camera framing and original WebGL rendering, without inserting a character or editing game state.

| Evidence | Previous pass 23 | Current pass 24 |
| --- | --- | --- |
| Desktop 1280×900 UTC | 2026-10-31T12:04:51.888Z | **2026-10-31T13:10:48.299Z** |
| Desktop PNG SHA-256 | `80209adb5eec1a7b99755c4ae73513e151dc8c776e0eceece69f278e8eebab38` | **`1f499c06e58eb3e08b00119a60a5303caa025487b9da2df4bd80f856babad00b`** |
| Portrait 390×844 UTC | 2026-10-31T12:04:55.569Z | **2026-10-31T13:10:50.129Z** |
| Portrait PNG SHA-256 | `a95676e71b8273f7088e95fb13b9b2cff9929c16e6f8223cd643ca1aeb726c64` | **`c0d40923250d564dae606da9fafe779efdff93a0ae5088b7138187335df1007c`** |

The pass-24 capture manifest hashes `characters.js` as `140a02efd186345a1ae76bcb77fe0f0e73eb19f331311b9e5e5eca8cc097bbbd`; the unchanged `scene.js` hash is `1a2cba4406a615329e5b2cd9ccac15712ea5e308401b82d365f33ebb4cb8a4ac`. New PNG hashes were recomputed locally rather than copied unverified.

## Actual image judgment — lead-only, not independent

Side-by-side *same seed/tick native-source screenshots* show the raised mint key bow above the foreground sandstone post, adjacent to Pip's helmet, rather than largely behind the post. This is a tangible improvement on both desktop and 390px portrait. The crossed gate and lock remain genuinely closed, and the camera/world composition stays identical. At gameplay size the key can still resemble a floating turquoise loop, the glove-to-key/lock interaction is hard to parse, the subjects remain small and left-biased, and large blank lagoon areas remain. **The frozen Nintendo Captain Toad imagery still wins on physical storytelling, subject scale and scene hierarchy. No benchmark parity.**

Fresh-context subagents were attempted but the shared-workspace tunnel rejected them (`Tunnel-client has not been seen for 300 seconds`); Ultracode is not available. This inspection is by the lead, not a fabricated independent or blinded A/B. CI's software-rendered frame medians (e.g. 183ms for this desktop scene) are **not hardware/GPU FPS**, and no repeated throttled performance probe was launched.

**Next independent pieces:** make a real key-to-lock action understandable at native mobile size while maintaining a closed barrier until authoritative state changes; recover environmental/character scale without hiding disclosed context; then conduct fresh-context masked A/B of actual output against this same prior source and both unchanged, hash-pinned official Nintendo frames. Keep the Gauntlet active, PR draft/unmerged/undeployed.
