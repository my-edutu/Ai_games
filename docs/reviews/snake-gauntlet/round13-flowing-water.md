# Round 13 — precomposited one-lookup flowing water

**Base:** PR 52 feature head `ffe44de2ca27997c260d8a4ce261fe09fc0866a2` (2026-10-31), exact `world.mjs` Git blob `639b5918bb1135de93178d841182d85f2d0e9614`. The isolated source matches the published feature file; no concurrent workspace modifications were incorporated.

## Slice and production change

Compared with the official [Snake Pass reference](https://store.steampowered.com/app/544330/Snake_Pass/), this original water and stone garden remain visually flatter. The water covers many pixels in an already frame-limited renderer. The old 256×256 seamless organic texture was sampled twice per fragment with independently transformed UVs. The new version precomposes two differently warped periodic base fields and two crest contours into one 256×256 RGBA map, reducing `texture2D` calls **from two to one**. Baking in the original periodic UV domain avoids the rotated second-layer seam. Fog, color, geometry, bounded material/texture counts, reduced-motion freeze and presentation-only authority are preserved; no gameplay rules, score, AI, snapshots, portals or recovery schema change.

## Evidence and exact limits

- TDD red: on the original shader the new focused regression failed `2 !== 1`. Green: the new regression and all existing isolated Snake tests passed **37/37**, zero fails/skips. The TypeScript `npm run build` and `node --check public/snake-stream/world.mjs` passed.
- The regression verifies one fragment read, periodic horizontal and vertical wrapping, mipmap filter, organic variation, crest seam bound at the 98th percentile, time uniform and reduced-motion freeze, resource counts and disposal.
- Real local Chromium/SwiftShader WebGL captures used the project's offline Blob-module harness, 1440×900, fixed 0.5 pixel scale, retained public snapshot, overview camera. They are real rendered game frames, not mockups, but **not** live HTTP/CI or continuous autonomous-play performance acceptance. Before and after screenshots and logs are retained in the local evidence ZIP. No page errors were recorded.
- In two separate untraced 2.6-second sessions, source before submitted **42 and 40** actual draws; candidate after submitted **42 and 44**. These short cross-session software-renderer samples are inconclusive and do **not** establish a performance win or display-present FPS. RAF callbacks are not renders. Only the lowered shader texture-fetch count is established.
- The preceding `ffe44de` passed **539/539** local repository tests; current-head full-repository and live-host CI were pending when this review was written. Last verified browser run [41167550976](https://github.com/my-edutu/Ai_games/actions/runs/41167550976) failed the unchanged pacing gate: **8 submitted frames / 1008.2ms**, needing 17. General CI [41167551002](https://github.com/my-edutu/Ai_games/actions/runs/41167551002) failed browser verification.

## Self-criticism, independent review and rollback

The revised organic ripples are visible, but translucent shallows, shoreline integration, expressive serpent close-ups, the pale courtyard's material detail and full-game motion are still below the commercial visual bar. The original independent counterflow of the second water texture is replaced by joint flow; moving-water fidelity must be judged separately. Extra one-time CPU pre-bake is not a claimed startup win. The shared specialist/critic tunnel reported `tunnel_client_not_seen`; **no independent fresh whole-game reviewer and no WIN verdict** are claimed.

Remain **draft, unmerged and undeployed**. Revert this single `world.mjs` shader/field patch and its one-fetch expectation to roll back. Fixed desktop pacing, mobile legibility, recovery, sustained hardware/device profiling, independent whole-game verdict and production R5/soak remain open.
