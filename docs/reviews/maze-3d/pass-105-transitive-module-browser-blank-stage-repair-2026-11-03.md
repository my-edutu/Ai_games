# Pass105 — fix the real 3D stage import, not the SwiftShader thresholds (2026-11-03 UTC)

## Material gameplay blocker discovered from real GitHub Actions

The [Pass103 focused WebGL run 41590979922](https://github.com/my-edutu/Ai_games/actions/runs/41590979922) and [Pass104 exact-source focused run 41592753200](https://github.com/my-edutu/Ai_games/actions/runs/41592753200) **FAILED**, despite successful Node/Three.js build, presentation tests, stream-host self-test and Chromium setup. Actual Playwright failures:
- Native game-first viewport never observed `window.__MAZE_3D__.renderer === 'webgl'` with a rendered frame and hidden loading card within 30 seconds.
- Genuine disclosed guardian encounter never observed three WebGL frames and the expected public tick/run token, even after eight minutes.
- **No screenshot artifacts were produced**. The last valid original 23/23 native screenshot archive remains Pass102, and may not be relabeled Pass103/104/105.

Investigating actual branch source revealed a deterministic **transitive ES module serving defect**, distinct from a slow GPU. Pass103's `scene.js` newly imports `./pickup-story-camera.mjs` in the browser. However, `scripts/serve-maze-stream.cjs` enumerated `PUBLIC_ASSETS` explicitly and OMITTED `pickup-story-camera.mjs`; its route map therefore returned 404 for the imported module. The scene's dynamic import failed, causing the real 3D renderer to fall back to the map. No amount of waiting or lowering the physical framing threshold could fix that.

## Builder fix and separate browser critic gate

- [Production host fix 3b8dd1e](https://github.com/my-edutu/Ai_games/commit/3b8dd1e1c869d2d1af5d89e7c91fefea30f7bd21) includes `pickup-story-camera.mjs` in the source-owned public route allowlist. The file remains served as `text/javascript` with the existing self-only CSP, `nosniff`, no-store rules as applicable, and no source/private state leak.
- [Independent-path browser regression 2d3cc0d](https://github.com/my-edutu/Ai_games/commit/2d3cc0d5dc0ec986492480b7442b2d3850a02ed7) extends the existing **real HTTP Playwright server test**: verify the transitive story-camera route returns 200/JavaScript with its named exported function and that the served production scene imports exactly that module. The prior gate-animation MIME check remains in place. No browser viewport/occlusion/privacy test was weakened.
- Built/source-tested work is awaiting new GitHub-hosted CI browser output. The focused workflow source changes include `tests/browser/maze-review.spec.cjs` and should trigger a native 320/390/844/1280 source-bound capture attempt. **Do not treat the corrective commit or a successful static route test alone as a rendered gameplay pass.**

## Current acceptance and next split

First independently verify that the corrected **real 3D** WebGL scene runs and publishes all dated original screenshots with 23/23 source-bound hashes, fully visible Pip/Thornback, genuine collection, true gate frame trio, tight HUD, 44px controls, reduced motion and full native 320/390/844/1280 composition. Review the true 390 key/face angle and 320 guardian against official [Captain Toad](https://www.nintendo.com/us/store/products/captain-toad-treasure-tracker-switch/) before planning more stage art. Separately judge whether more distinctive explorable worlds and legible physical gameplay still require major transformation. **Do not lower the Nintendo bar to test-count success.**

The shared graphics workspace returned `NOT_FOUND: Tunnel-client has not been seen for 300 seconds`, so local WebGL capture, fresh-context subagents, blind artistic A/B and Ultracode were not available. CI SwiftShader CPU time is not hardware FPS; this specific issue was a proven missing-module route, not a graphics performance diagnosis. The benchmark remains **NOT MET** and PR #53 must remain **open draft, unmerged, undeployed**.
