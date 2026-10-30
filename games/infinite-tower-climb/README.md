# Infinite Tower Climb — Game 3

An autonomous expedition through a fully modeled 3D tower. The AI climbs, fights, chooses upgrades, encounters guardians, ends runs and starts again. Viewers control the presentation; the existing seeded, fixed-step simulation decides gameplay.

**Implementation in review:** the 103 logical checks and the final two strong WebGL recovery tests pass. The commercial visual bar and complete moving-output review remain open. See the [review evidence and limits](../../docs/reviews/2026-10-30-tower-3d-gauntlet.md); still captures and recovery checks do not establish smooth full-run playback.

## Run the game

Requires Node.js 22 or later and a browser with WebGL 2.

```sh
npm ci
npm run build
node scripts/serve-tower-stream.cjs --port=4175
```

- Game: <http://localhost:4175/tower>
- Live Gauntlet journal: <http://localhost:4175/tower/gauntlet>
- Public stream health: <http://localhost:4175/tower/health>

The progress page shows actual captures, references, critic verdicts and the next gap. It refreshes its journal every five seconds while open.

## Presentation controls

| Control | Behavior |
| --- | --- |
| Follow | Track the climber and the next landing. |
| Overview | See the current tower sector and its route. |
| Drag / scroll on the scene | Orbit within the supported view and adjust zoom. Camera buttons reset the view. |
| Sound | Enable or mute the synthesized ambience and gameplay cues. Audio starts only after this gesture. |
| Motion | Reduce decorative motion; retain meaningful action and danger poses. |
| Quality | Switch shadow/effect quality and render resolution limits. Phones start at low quality. |
| Fullscreen | Enter or leave the browser's fullscreen view when available. |

Captions work while sound is muted. Keyboard focus remains visible. Phone controls have at least 44 × 44 CSS-pixel targets. Compact phone telemetry leaves a central window for the climb.

Useful source URLs:

```text
/tower?quality=low
/tower?camera=overview
/tower?reducedMotion=1&highContrast=1
/tower?cleanFeed=1
```

## The 3D implementation

The original cobalt-and-ivory climber, shield-and-hammer sentinel, ranged shooter and heavy guardian are modeled and articulated in local Three.js modules. Poses cover locomotion, ascent/descent, landing, attacks, telegraphs, recoil, damage and defeat. Rigid bone weights batch each character by material while preserving its geometry.

Foundry, Ruins, Storm, Clockwork and Void have different environmental forms, materials, machinery, hazards and atmosphere. Platforms use the same tick-adjusted coordinates as authoritative collision. The camera, particles, lighting, sound and HUD consume public snapshots and cannot change an outcome.

The simulation retains the existing platformer movement. A curved coordinate mapping wraps that route around actual 3D geometry; it does not add free-roaming movement or a second physics system.

The browser loads Three.js from this host. The game has no runtime CDN, remote model call or commercial game asset dependency.

## Verification

```sh
npm run build
node --test --test-isolation=none tests/foundation/tower-*.test.cjs tests/phase2/tower-*.test.cjs tests/phase3/tower-*.test.cjs tests/phase4/tower-*.test.cjs tests/phase5/tower-*.test.cjs tests/phase6/tower-*.test.cjs
node scripts/serve-tower-stream.cjs --self-test
npx playwright install chromium
TOWER_SOFTWARE_GL=1 npx playwright test --config=playwright.tower.config.cjs
```

The software-GL flag is useful for headless CI without a GPU. Hardware frame-rate claims require measurement on the intended viewing device.

Browser diagnostics are available through `window.__TOWER_RENDER_DIAGNOSTICS__()`. The diagnostics expose renderer counters, frame-time samples, bounded resource counts and presentation status. They do not expose the private simulation seed or permit gameplay changes.

The stream host is an in-memory preview host. It consumes its private event queue once and retains a bounded public replay window. Production persistence, provider integrations and broadcast readiness continue to follow the existing [operations runbook](../../docs/operations/infinite-tower-climb-runbook.md).

## Gauntlet quality bar

The fixed primary reference is the official [ASTRO BOT — Rising Heat gameplay clip](https://gmedia.playstation.com/is/content/SIEPDC/global_pdc/en/games/pdps/a/as/astro-bot/dlc/video/astro-bot-dlc-05-rising-heat-en-29oct24.mp4), judged for character finish, visible action, material separation, environmental depth and clarity of the next move. [Jusant](https://dont-nod.com/en/games/jusant/) supports the scale/atmosphere comparison, and [Fall Guys](https://store.epicgames.com/en-US/p/fall-guys) supports obstacle readability.

These are reference works, not included assets. The journal records independent preferences honestly. A functioning 3D implementation, passing tests or improved screenshots do not by themselves establish a win against that commercial bar.

Design and implementation decisions: [3D specification](../../docs/superpowers/specs/2026-10-30-infinite-tower-climb-3d.md) and [implementation plan](../../docs/superpowers/plans/2026-10-30-infinite-tower-climb-3d.md).

Continue the builder/critic loop with [GAUNTLET.md](GAUNTLET.md). The separate progress page is an automatically refreshing journal; it does not launch background coding agents by itself.
