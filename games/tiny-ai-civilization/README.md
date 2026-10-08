# Tiny AI Civilization — Living Valley Gauntlet (Prototype)

The playable browser build and its evidence ledger live under `public/tiny-kingdom/` as `index.html` and `progress.html`. The game currently uses original procedural 3D geometry in WebGL and provides a constrained-browser software-projection fallback. **It is a playable visual/behavioral vertical slice, not a complete AAA game, and it has not beaten Manor Lords.**

## Play & inspect

Open `public/tiny-kingdom/index.html` directly in a modern browser or serve `public/tiny-kingdom/` using any local HTTP server. No network or asset downloads are needed. Orbit by dragging, zoom with the scroll wheel, speed up simulated time, follow a villager, enable cinematic mode, or restart. To review actual output and the harsh critic record, open `progress.html`.

## Current capabilities

- Original 3D meshes rendered via WebGL; fallback 3D software projection for headless browsers without WebGL.
- Procedural valley with village cottages, great hall, forest, waterways, roads, wheat fields, and animated villagers.
- Self-running role-driven agents, resource production/consumption, growth, proximity-based social ties, character needs, trading, role-specific work, and story announcements, and simulation clock.
- Fixed-step advancement at 30 ticks/second and seed-based initial generation; controls for pause, speeds, and camera.

Run browser regression tests with `npm run test:browser` (requires Playwright browser installation). A local Chromium smoke and 400-hour accelerated simulation were inspected; a CI/browser validation on GitHub has not yet been confirmed.

## Limitations / reviewer warning

This is not the final game package or a conforming `GameModule` yet. Character models and landscapes remain simplified; no rigorous replay, large-world pathfinding, persistence, physical environment simulation, live provider integration, animation blending, full behavioral ecology, accessibility review, load test, or production sign-off exists. Rendering may vary by device. A separate independent critic has not been run because the local agent tunnel was disconnected in this session. Current benchmark verdict: **FAIL**.

## Latest inspected rounds (003–004)

- Added role-specific citizens with individual proportions, face geometry, hats, carried tools, and articulated procedural walking poses.
- Added differentiated broadleaf/conifer forest cover, buildings with gables, roof seams, framing and foundations, soft sampled turf, foreground fence, market, well and quarry props.
- Captured actual Chromium-wide and close-camera frames in `public/tiny-kingdom/progress.html`; neither passes the visual bar.
- Verified deterministic seeded reset, 400 simulated game hours, village growth and friendships in Chromium; in the same run, food became scarce while gold accumulated, exposing an unsolved economy failure.
- Added browser tests of social connections and economy progression. Real WebGL GPU capture, rigged character models, blind comparison, production harness integration and fresh-context external critic are still pending. Do not confuse procedural face geometry with animated AAA characters.

## Gauntlet 006 — Route-safe autonomous life

**Repository implementation:** Villagers now use seeded, bounded 2D A* route planning with continuous collision checks against the hall, cottages, market, well and river. Market and well placements were corrected to stop overlap with building collision footprints, housing expands west of farmland, and blocked job destinations snap to reachable working positions. On day-boundary transitions the HUD now updates even during accelerated headless simulation.

**Inspected browser evidence (Chromium software rasterizer):** A real 90-day run reached 27 citizens, 20 buildings, 25 recorded friendships, 452.49 food, 17.9 wood, and 633.15 gold. At the checkpoint, no villagers occupied blocked geometry and none reported a missing safe route; browser console had no JavaScript page errors. A repeated 10-day seeded run produced byte-identical metrics and navigation observations. A 400-day stress attempt exceeded the local time budget, so long-horizon performance is a known open issue.

**Remaining critical failures:** primitive low-poly models and stylized/no real material assets, unverified GPU/WebGL rendering quality, weak agriculture/timber economics and missing production-grade world persistence/24-7 reliability. No blind matched-reference victory is claimed. The local fresh-context subagent runner was unavailable; this review is internal and deliberately marked FAIL. Visual reference remains the official Manor Lords gallery.

See the new Gauntlet 006 section and actual captured screenshot in `public/tiny-kingdom/progress.html`. Browser tests now exercise path validity, deterministic replay, and 90-day growth; CI outcome must be confirmed independently.

## Gauntlet 007 — Persistent civilization, navigation performance, directional citizens

- **Saved authoritative world:** `window.__tinyKingdom.exportSnapshot()` returns a schema-tagged, checksummed JSON checkpoint containing the seed/RNG state, complete citizens and relationships, current paths and actions, buildings, resources and chronicles. `restoreSnapshot(snapshot)` validates before mutating state; corrupt saves fail atomically. In-game Save world / Restore world buttons use browser localStorage. Persistent storage behavior across a browser restart has **not** yet been tested in this restricted environment.
- **Repeatable browser evidence:** Local headless Chromium validated a checkpoint at day 19, replayed four additional simulated days, restored the checkpoint, replayed the same days, and reproduced byte-identical world snapshots. Corruption rejection also left the running world byte-identical. Software Chromium reported no page errors.
- **Bounded route cache:** Improved short-distance direct routing, binary-heap A*, 1,800-entry maximum cached paths scoped to the building layout revision. A 50-day local run recorded **2,155 path-cache hits / 703 misses**; restoring the world cleared cached routes. At 90 simulated days, a single measured run took approximately six seconds, but this is not a 400-day or production soak success.
- **3D directional citizen animation:** Procedurally assembled villager meshes and normals now face the actual next waypoint. Walking poses remain basic, not production-rigged characters. Real close-camera capture showed software-projection artifacts (roof/ground occlusion); unverified WebGL quality cannot be inferred from these captures.
- **Browser tests added:** seed-replay snapshots, corrupted-save atomicity, path-cache bounds and invalidation, navigation, and existing simulation tests. GitHub CI conclusion must be checked separately; the tests were not manually run on a GPU.
- **Critic verdict:** **FAIL against Manor Lords**. Significant art, character rigging, texturing, vegetation, atmospheric rendering, depth/clipping, persistent storage endurance, provider independence, 24/7 uptime and independent fresh-context review are still missing. The worker tunnel remains disconnected.

## Gauntlet 008 — Dynamic seasons and weather as simulated reality

Added deterministic 36-day years with spring/summer/autumn/winter, reproducible daily rain/cloud/snow, and climate-adjusted farming yields. A new seasonal arrival story originates from actual calendar change, not scripted outcome. Original 3D vegetation, wheat and turf change palettes, and procedural bounded 3D weather particles plus moving sun/sky tint respond to world time. The WebGL shader now consumes runtime sun direction and ambient tone; the restricted Chromium environment continued to use a software projection fallback, so final GPU visuals remain unverified.

**Inspected locally:** headless browser screenshots of rainy spring dawn and a winter night at day 28. The 27-day headless probe produced 16 villagers, 19 structures and 13 relationships. Two seeded 30-day runs (with snapshot restore) were byte-identical, and there were no page JavaScript errors. A 400-day local stress attempt timed out; neither performance nor Manor Lords visual parity passed.

**Tests:** added Playwright checks for yearly season boundaries, temperature and crop multiplier, calendar/UI alignment and deterministic multi-season replay. GitHub CI conclusions are tracked separately. Critic result: FAIL; high-fidelity human models, textures, atmospheric art direction, verifiable GPU evidence, night lighting, roof overlap, and sustainable economy still require work.

## Gauntlet 009 — Lit windows, settlement lamps, timber economy

After dark, the material palette of actual dwelling window meshes changes to warm amber and a small set of original 3D town lanterns marks working paths, the market and well. This is deliberately a lightweight night readability improvement, **not real emissive lighting, global illumination, or a substitute for real WebGL frame evidence**.

Autonomous merchants now import timber when per-citizen reserves fall critically low and the treasury can pay for it. The purchase is a real state transaction and can generate an honest village chronicle; builder and craftsperson resource usage remains governed by the same stored inventory.

**Observed local browser evidence:** 70 simulated days in ~4.5 seconds of synchronous simulation; 23 villagers, 22 buildings, 22 recorded friendship relationships, food ~498, timber ~22, gold ~486, zero JavaScript page errors. A real close-camera software fallback frame was captured locally, showing better occupancy but substantial primitive geometry and painter occlusion defects. Added a browser test asserting population, buildings, positive winter-capable food/wood and solvent treasury at day 71.

**Critic:** Manor Lords parity remains FAIL, GPU/WebGL capture and independent blind A/B unverified. Priority gaps: rigged character assets, PBR-style architectural materials, terrain mesh/material quality, correct shadowing/lighting, GPU screenshot reproducibility, saved-world longevity, longer population stress tests, and authoritative shared engine integration.

## Gauntlet 011 — Browser livestream deployment surface

Created `scripts/serve-tiny-kingdom-stream.cjs`, a minimal local HTTP/OBS browser-source host with `/tiny/`, `/tiny/progress` and `/tiny/health`. It serves only whitelisted assets, returns no-cache HTML, hashes inline scripts/styles in its CSP rather than enabling unsafe-inline, and provides a fail-closed asset-health report. The status explicitly declares `serverAuthoritative:false` and `productionReady:false`; a process serving HTML is **not** the same thing as a 24/7 durable authoritative simulation.

Start after npm installation using `npm run tiny:stream` (defaults to 127.0.0.1:4177), then add `http://127.0.0.1:4177/tiny/` as an OBS Browser Source. `npm run tiny:stream:self-test` validates access boundaries, the page's required functions, progress-page presence and CSP, and is wired into GitHub CI. A syntax parse of the server script passed, while the GitHub CI run and real OBS integration remain unverified.

**Additional performance evidence:** An inspected 150-day local browser simulation using Gauntlet 009 reached 28 citizens, 37 structures, 27 relationships, 699 food, 99 timber and 674 gold without JavaScript page errors; the step loop took ~20.5 seconds. Long-duration service continuity, browser restarts, saved-game durability under power loss and production WebGL are still open.

## Gauntlet 023–024 — Real GPU material channels and static world buffering

This milestone adds eight explicitly tagged procedural material classes to the browser WebGL scene, carrying 10 floats per vertex instead of nine. The fragment shader derives world-space grass breakup, rippled and sunlit water, granular road surfaces, irregular foliage, worn stone and slate, and timber/cloth fiber variation. This is original non-PBR procedural shading; no external copyrighted asset textures were imported.

A second rendering iteration separates fixed seasonal terrain, houses, rivers, landmark architecture and vegetation from continually moving citizens, windmills and fluttering banners. A static WebGL VBO is uploaded only when climate, daylight/night stage, building count or saved world changes; active objects are streamed through a separate dynamic VBO. Software canvas fallback keeps combined painter sorting. Both paths use the same authoritative deterministic world; neither changes save-format contracts.

**Critical real GPU finding:** The first shader GPU run failed to link because `sunDirection` had mismatched precision in the two shader stages. The actual GitHub failure artifact was downloaded and examined, and `uniform highp vec3 sunDirection` was added to the fragment shader to match the vertex stage. CI has new shader-attribute and static-VBO invariant checks, but no green post-fix GPU evidence has yet been verified. Do not assume the visual effect or frame-rate improvement is real until its uploaded screenshots and jobs are inspected.

The visual gauntlet remains **FAIL**. Before believing fidelity claims, an independent critic must compare repeatable actual frames against official Manor Lords captures and show measurable improvement to real architecture, vegetation, rigged character performance, shadows and streaming reliability. See `public/tiny-kingdom/progress.html#gauntlet-024` for details.

## Gauntlet continuation

Primary bar: official *Manor Lords* captured gameplay and screenshots, camera-matched with our game (https://www.hoodedhorse.com/games/manor-lords). Secondary: Foundation for autonomous labor behavior, The Universim for character emergence. Keep original assets; do not copy proprietary models or textures.

Every important subsystem should have an isolated builder and a fresh-context critic. The critic must inspect actual game output, give the largest gap relative to the reference, and return it for the next pass. Before claiming any win, record screenshots, matched-angle captures, action logs, deterministic replays, performance/soak checks, and blind A/B results. Maintain `progress.html` as the visible chronological evidence ledger. Do not label milestones complete without artifacts.

Follow the repository's `AGENTS.md` simulation, determinism, safety and production rules; the definitive contract is `docs/architecture/GAME_MODULE_CONTRACT.md`. This prototype is a starting point to be replaced or integrated, not an exception to the contract.