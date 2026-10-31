# Infinite Tower Climb — Game 3

An autonomous expedition through a fully modeled 3D tower. The AI climbs, fights, chooses upgrades, encounters guardians, ends runs and starts again. Viewers control the presentation; the existing seeded, fixed-step simulation decides gameplay.

**Implementation in review:** the current pass reduces gameplay text and improves the camera, landing cues and character silhouettes. The build, 129 Tower logical tests, 19 browser cases and host self-test pass. See the [2026-10-31 clarity review](../../docs/reviews/2026-10-31-tower-scene-clarity.md) for scoped verification and remaining findings, and the [original 3D review](../../docs/reviews/2026-10-30-tower-3d-gauntlet.md) for earlier evidence. The commercial visual bar, complete moving-output review and intended-device performance measurements remain open. Still captures and recovery checks do not establish smooth full-run playback.

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

The default HUD keeps floor, peak height, floor progress and icon vitals near the edges of the scene. Guardian/Danger alerts, captions, upgrade choices and results appear when the public game state calls for them. Intent, milestones and secondary status are available through **Expedition details**.

The control dock has seven icon controls:

| Control | Behavior |
| --- | --- |
| Follow camera | Track the climber, the active landing target and nearby threats. |
| Overview camera | See the current tower sector and its route. |
| Sound | Enable or mute the synthesized ambience and gameplay cues. Audio starts only after this gesture. |
| Reduced motion | Calm the camera and decorative effects while retaining meaningful action and danger poses. |
| Low graphics quality | Switch shadow/effect quality and render resolution limits. Phones start at low quality. |
| Fullscreen | Enter or leave the browser's fullscreen view when available. |
| Expedition details | Open intent, next guardian, progress, score, build, graphics/connection status and the control guide. Escape closes the panel and returns focus to its control. |

Drag or scroll on the scene to orbit within the supported view and adjust zoom. Camera buttons reset the view. Each dock control has a 44 × 44 CSS-pixel target, an accessible name and a tooltip available on keyboard focus. Toggle names stay stable while their pressed state reports the current setting.

Captions work while sound is muted. Upgrade choices and captions share a responsive event area so both remain available in portrait and short landscape layouts. Graphics recovery preserves known Guardian/Danger alerts and genuine upgrade/result content. A lost connection labels the retained phase **Last known** and clears current captions until fresh state arrives.

Failed sound or fullscreen actions display one replaceable six-second message, independently of healthy state polling. Its explanation remains in Details under **Last control message**. Opening Details deliberately brings secondary information over the scene; closing it restores the compact gameplay layout.

Useful source URLs:

```text
/tower?quality=low
/tower?camera=overview
/tower?reducedMotion=1&highContrast=1
/tower?cleanFeed=1
```

## The 3D implementation

The original cobalt-and-ivory climber, shield-and-hammer sentinel, ranged shooter and heavy guardian are modeled and articulated in local Three.js modules. Poses cover locomotion, ascent/descent, landing, attacks, telegraphs, recoil, damage and defeat. Rigid bone weights batch each character by material while preserving its geometry.

The climber's ascent pose uses the actual camera angle to separate the reaching hand from the helmet and pack. Sentinel and guardian mauls have a distinct grip, visible shaft and separate head. These changes improve the inspected silhouettes; continuous attack timing and the full range of moving poses remain review work.

Foundry, Ruins, Storm, Clockwork and Void have different environmental forms, materials, machinery, hazards and atmosphere. Platforms use the same tick-adjusted coordinates as authoritative collision. The camera, particles, lighting, sound and HUD consume public snapshots and cannot change an outcome.

Follow framing uses the local climber, actual active landing target and bounded nearby threats, including an oblique phone view. Contrasting top-corner cues mark that target at its real current platform coordinates and disappear when the traversal target is no longer active. Enemy health fills draw above their backing so the displayed fraction remains visible. Exact next-landing recognition and the nearby guardian's full head silhouette still have open composition findings in the clarity review.

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
