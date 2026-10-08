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

## Gauntlet continuation

Primary bar: official *Manor Lords* captured gameplay and screenshots, camera-matched with our game (https://www.hoodedhorse.com/games/manor-lords). Secondary: Foundation for autonomous labor behavior, The Universim for character emergence. Keep original assets; do not copy proprietary models or textures.

Every important subsystem should have an isolated builder and a fresh-context critic. The critic must inspect actual game output, give the largest gap relative to the reference, and return it for the next pass. Before claiming any win, record screenshots, matched-angle captures, action logs, deterministic replays, performance/soak checks, and blind A/B results. Maintain `progress.html` as the visible chronological evidence ledger. Do not label milestones complete without artifacts.

Follow the repository's `AGENTS.md` simulation, determinism, safety and production rules; the definitive contract is `docs/architecture/GAME_MODULE_CONTRACT.md`. This prototype is a starting point to be replaced or integrated, not an exception to the contract.