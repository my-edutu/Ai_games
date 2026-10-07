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

## Gauntlet continuation

Primary bar: official *Manor Lords* captured gameplay and screenshots, camera-matched with our game (https://www.hoodedhorse.com/games/manor-lords). Secondary: Foundation for autonomous labor behavior, The Universim for character emergence. Keep original assets; do not copy proprietary models or textures.

Every important subsystem should have an isolated builder and a fresh-context critic. The critic must inspect actual game output, give the largest gap relative to the reference, and return it for the next pass. Before claiming any win, record screenshots, matched-angle captures, action logs, deterministic replays, performance/soak checks, and blind A/B results. Maintain `progress.html` as the visible chronological evidence ledger. Do not label milestones complete without artifacts.

Follow the repository's `AGENTS.md` simulation, determinism, safety and production rules; the definitive contract is `docs/architecture/GAME_MODULE_CONTRACT.md`. This prototype is a starting point to be replaced or integrated, not an exception to the contract.