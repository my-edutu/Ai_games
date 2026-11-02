# Pass59 — authored terrace-court palette and real native screenshot rejection gate

Review date: **2026-11-01 UTC**. Work branch `feat/maze-3d-gauntlet`, existing [DRAFT PR #53](https://github.com/my-edutu/Ai_games/pull/53). Fixed official Nintendo *Captain Toad: Treasure Tracker* [two SHA-pinned comparison frames](./reference-manifest.json). **User benchmark NOT PASSED.** No merge or deployment.

## Small independently judgeable art and correctness pieces

1. **Physical environment:** make public three-altitude court boundaries distinct with shared baked/instanced actual 3D floors, not HUD text, camera trickery or shader fake. Leave actors, topology, AI authority, deterministic replay, memory budget, 44px buttons, on-demand Map/Details/Settings and private maze out of it.
2. **Visual judgment:** authentic WebGL at desktop 1280×900, native 390×844 / 320×740, 844×390, same public seed `maze-visual-reference-13`, tick 13, plus key and sealed-gate states. Check canvas full-viewport, full guardian margins and occlusion, natural court color hierarchy against unchanged Nintendo fixed bar.
3. **Source integrity:** full/balanced test actual instanced floor surfaces in each disclosed terrace, exact count/height, baseline upper clay focal island, inlays only on safe public rooms, public snapshot unchanged, fixed material/geometry budgets, withdrawal and disposal, no per-frame resource creation.
4. **Full-catalogue CI correctness:** diagnose whole-monorepo failure rather than confuse it with the successful focused 3D screenshots. Preserve strict public HUD/viewport/privacy acceptance.

## Builder and image critic — first iteration rejected

Commit [22af496](https://github.com/my-edutu/Ai_games/commit/22af49607aa89ca0e4b2b653c58f2bd39ac60f11) introduced ivory upper, orange middle, sea-glass lower court floors, with low physically instanced original stone edge engraving, and added focused exact public-safe 3D regressions. [Focused exact-game-source CI 41359259606](https://github.com/my-edutu/Ai_games/actions/runs/41359259606) succeeded on source checks, live host and native full-res Chromium WebGL; [unaltered original 10 PNGs/dated manifests 13104697373](https://github.com/my-edutu/Ai_games/actions/runs/41359259606/artifacts/13104697373) individually SHA-256 checked 10/10. **Direct reviewer REJECTED** the artifact, not the CI: at native 320 the original contrasting large orange guardian court had become a washed-out grey/beige island. At native 320 the first candidate changed 18.487% of screenshot pixels with >12RGB change, desktop 21.067%; sheer changed pixel count did not mean visual improvement. Its richer live contrast was worse than the authentic Pass58 baseline.

## Corrected source, new genuine evidence

Commit [9293164](https://github.com/my-edutu/Ai_games/commit/9293164463c3a6716ad3e20e1a3f26861d198994) specifically restores the **original upper warm-clay guardian focal island** while introducing one contiguous public middle clay district and one tidal sea-glass lower district, plus only shallow physical ivory edge inlays on safe low cells. Existing buffered materials and shared mesh geometry reused. It now has more discriminating 3D regression: upper ivory and upper warm-clay both present, middle substantial orange **and** ivory, lower green, true instance world-space y, full and balanced modes, cleanup and public privacy. Existing tests, 320/390 actor margins and full-screen constraints were **not lowered**.

Exact source [focused CI 41359791341](https://github.com/my-edutu/Ai_games/actions/runs/41359791341) **SUCCESS** on new strict source checks, real live host and authentic ten original full-size WebGL captures in [artifact 13105020624](https://github.com/my-edutu/Ai_games/actions/runs/41359791341/artifacts/13105020624). Independent byte rehash **10/10 original PNGs equal each recorded UTC/source JSON SHA256**.

| Genuine capture | Original UTC capture time | PNG SHA-256 |
| --- | --- | --- |
| 1280×900 public guardian | 2026-11-01T22:59:45.599Z | `fee5884c6190a82e54cb85a913c1574f8eb3f94a1e9480a15343d47d8bfdd8ef` |
| 390×844 public guardian | 2026-11-01T22:59:51.181Z | `335d7706805f2e59e42005620bd9077d5aab65c4b9b387fef55d3099d766d906` |
| 320×740 public guardian | 2026-11-01T22:59:55.036Z | `51edceae6a103a900b548d459df5a96ea2607172cce39aed25566e82d4805bbf` |
| 844×390 public guardian | 2026-11-01T22:59:59.021Z | `f78a14d29992bbaa993434efdf3d5088325fb366e4fd013f4fb6ac31d3fe5222` |

Source manifest `world.js` SHA-256 `b582e6793fee98bbcfe2869796b11e2d0a8764c6968c94f1e0bb43a70d002da8`. The real 320×740 and 844×390 sidecars explicitly report `renderer=webgl`, `explorerInFrame=true`, `wardensInFrame=1`, `wardensWithMargin=1`, stage/canvas exact viewport dimensions, four measured 44×44px top controls; no persistent bottom prose panel. The dated six additional key/goal/gate shots remain truly source-selected, not composed. The real 320 Pip and Thornback remain quite small on the stage, however, and the native world still needs richer authored storytelling.

Quantified genuine pixel changes from actual Pass58 original same-seed PNGs, any RGB component >12: **desktop guardian 0.457%, native 390 guardian 0.166%, native 320 guardian 0.402%, 844 landscape 1.069%, known-key desktop 4.476%, known-key portrait 6.906%, known exit desktop 4.478%, known exit portrait 3.503%, closed gate desktop/portrait 0.000%**. These are source-bound image-differences, not visual ratings, gameplay authority, frame rates or Nintendo-quality scores. Direct full-resolution reviewer accepts only limited physically authored relief/context; **rejects benchmark parity**.

## Actual full-suite failure and source-correct repair

Pass58 full-monorepo [CI 41358518064](https://github.com/my-edutu/Ai_games/actions/runs/41358518064) was **red**, despite its separate focused proof. Actual full browser [`tests/browser/maze-stream.spec.cjs`](../../../../tests/browser/maze-stream.spec.cjs) waited 10s for `[data-testid="objective"]` to contain `escape`; the current true gameplay-first UI gives actionable `1 known step away` / `3 known steps away`. This is a **stale assertion, not a lost character, hidden-state leak or graphics performance failure**. Commit [af1a3b5](https://github.com/my-edutu/Ai_games/commit/af1a3b544871d1ba2a6a1bd829f554f1d6c2513b) replaces the outdated generic-text assertion with exact allowed public goal title *and* concise objective value assertions. It retains all nonempty intent, animation/tick progression, no-secret-state, 1920 viewport/no horizontal scrolling, canvas-size, console-error and other regression checks; no product code changed. The **new af1a3b5 full CI needs its own result** and cannot be presumed green.

## Formal critic verdict and next gap

The fixed [Nintendo product imagery](https://www.nintendo.com/us/store/products/captain-toad-treasure-tracker-switch/) remains the stronger visual: unmistakable themed landmarks, physically legible action and tighter two-character composition. Current work repaired an actual negative art shift and conservatively enriched public terrain. **No Gauntlet win.** Fresh-context worker/critic and Ultracode were attempted; workspace tunnel remains disconnected (`Tunnel-client has not been seen for 300 seconds`). Only lead direct, **unblinded** full-resolution screenshot review occurred; cannot claim independent A/B. Long CPU-throttled SwiftShader times in CI are infrastructure limitations, not a hardware GPU frame-rate verdict or reason to weaken real in-frame gates.

**Next builder/critic slice:** game-scale public guardian/Pip focal composition at 320 with preserved full-model positive margins (no false crop/zoom) and a substantially more authored physical encounter landmark/causal action without inventing movement. Strict real native screenshot judge again against the unchanged pinned official Nintendo frames. Keep all source-privacy and replay gates and the branch DRAFT, unmerged and undeployed.
