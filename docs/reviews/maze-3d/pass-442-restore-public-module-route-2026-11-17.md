# Pass442 — restore real browser module resolution before any art acceptance (2026-11-17)

## Exact-HEAD failure evidence
- PR #53 production HEAD **`4bbbb688c7e0420ac8c9ea444bf3b2a080779f22`** failed [Maze WebGL Actions run 44022782832](https://github.com/my-edutu/Ai_games/actions/runs/44022782832) on 2026-11-17: the strict six-run reset and seven of eight live browser tests failed with `window.__MAZE_PUBLIC_STATE__` absent, `window.__MAZE_3D__` absent, and source card stuck on "Opening the garden". Chromium WebGL smoke passed, so this is not a proven GPU or geometry budget failure. No trustworthy new native screenshots were produced by that run. Whole-repo run [44022782625](https://github.com/my-edutu/Ai_games/actions/runs/44022782625) separately failed Tiny Kingdom OBS and artifact upload steps.
- The new `app.js` import of `./public-counter-moment.mjs` exists in the repo, but `scripts/serve-maze-stream.cjs` uses an explicit `PUBLIC_ASSETS` allowlist and **omitted that module**. As a result, its `/maze/public-counter-moment.mjs` route returned 404 and the browser module graph could not start. This is the material player-visible blocker, ahead of cosmetic work.

## Production fix and regression guard
- Admit only the required **existing** new module in the explicit server asset list, preserving the public/private boundary and CSP. Do **not** open wildcard access to the source tree.
- The server's already-required `--self-test` now inspects every allowlisted first-party JS/MJS static or dynamic relative import and rejects any unresolved module route. No relaxed WebGL/camera/geometry assertions, and no AI, path, private map, HUD, or player behavior changes.
- No independent visual critique is possible until new source-matched native full-frame gameplay evidence exists. This candidate has **not** yet passed exact-HEAD WebGL/6-run/320/390/844/1280 tests and must not be counted as a Nintendo-quality win. Coding-worker and fresh critic tunnel unavailable (`NOT_FOUND`).

## Next validation gate
Use the **new** exact-HEAD Actions run: verify `missingRoutes: []` in the real server self-test, browser snapshot + strict six-run reset (<100 geometries), then SHA-verify unaltered full-resolution frames of the earned counter at each native viewport. If CI still fails, diagnose the original failure without lowering thresholds. PR remains **open draft, unmerged, undeployed**.
