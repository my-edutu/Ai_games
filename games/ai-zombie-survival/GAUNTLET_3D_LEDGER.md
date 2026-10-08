# AI Zombie Survival — 3D Gauntlet Ledger

## Reference and verdict

- Primary external quality bar: official Days Gone Remastered gameplay and unmodified in-game screenshots.
- Secondary systems bar: State of Decay 2 survival communities and decision-making.
- **Verdict: NOT WON.** This iteration delivers a functioning native 3D rendering path, not art parity with either reference.
- Compare equivalent daylight street combat, night siege, character closeups, horde overview, interiors, and mobile/broadcast-size scenes. Never label a screenshot as a win without a blinded reviewer and source capture.

## Iteration 01 — builder pass

| Independently judgeable piece | Work committed | Evidence gate | Status |
|---|---|---|---|
| True 3D projection | WebGL2 perspective + depth buffer + lit 3D geometry | Browser GPU smoke and screenshots | CI pending |
| City | District meshes, streets, crosswalks, roof silhouettes, windows, damaged architectural palettes, street lamps, cars | Day / night / interior captures | CI pending |
| 3D characters | Role-colored articulated survivor/civilian/infected primitives, gait, zombie archetype scaling, weapon/carry states | Near-death and large-horde captures; character fidelity review | Geometry present, fidelity below bar |
| Living AI world | Existing seeded authoritative survival logic reused unchanged; viewer is read-only | Existing test suite and live tick progression | CI pending |
| Cinematic direction | Autonomous tactical focus with user orbit/zoom controls | Playwright camera, pause and HUD checks | CI pending |
| Progress page | Embedded running scene, latest tick, survivor/zombie counts, render FPS, transparent acceptance ledger | Live telemetry browser smoke | CI pending |
| Safety | WebGL2 fallback link to original 2.5D, no external runtime assets and bounded visible crowds | Fallback and performance review | Partially complete |

## Iteration 02 — visual critic response

Inspected real browser captures from an earlier CI attempt: `day.png`, `night.png`, and `large-horde.png` were valid 1280×720 rendered screenshots, but the environment read as an almost monochrome, foggy overhead miniature rather than the requested cinematic survival scene. An earlier workflow failed on the pause assertion even though gameplay scene captures were produced. This is a **failed visual comparison** against Days Gone Remastered, not a quality win.

Builder response:
- increased actual geometric visibility with warm materials, clearer sunlit streets, colored shop awnings, tree canopies, safer road markings, and contrasted windows;
- reduced overbearing distance fog and moved the camera closer to character scale;
- enriched tactical outfit and infected archetype distinctions;
- added simplified LOD for distant infected to reduce dynamic geometry pressure;
- fixed paused HUD feedback to update immediately instead of waiting on a throttled FPS interval.

## Iteration 03 — autonomous broadcast critic response

- Hero-follow camera, horde overview, alternate survivor cycling, orbit and zoom controls.
- Visible live AI decisions and latest authoritative events.
- Unattended deterministic restart following an overrun; no invisible script rescues agents or changes the underlying outcome.
- Opt-in horde ambience and bounded combat event audio.
- Additional Playwright checks for hero closeups, actual paused tick state and restart continuity.
- Progress page now includes the iteration trail and live public GitHub Actions status.

**Not independently validated:** the newest 3D screenshots, browser stress results, visual reference A/B, real-world stream capture, and long-duration memory trends. Workflow checks are pending, not accepted as passed.

## Independent critic pass — known blockers

1. **P0 visual parity**: procedural meshes have no production sculpting, skeletal rigs, facial performance, believable clothing physics, authentic infected silhouettes, PBR textures, photogrammetry or environment dressing at AAA density.
2. **P1 lighting quality**: shader uses one diffuse key + distance fog, not a physically based renderer with cascaded shadows, atmospheric scattering, volumetric fog, reflections and exposure control.
3. **P1 combat presentation**: no volumetric muzzle flashes, weapon trajectories, hit reactions per body part, damage decals, ragdolls or cinematic audiovisual impacts.
4. **P1 verification**: render screenshot capture and comparison against the official bar cannot be claimed until CI/browser evidence is inspected; actual screenshot assets must be retained.
5. **P1 throughput**: maximum zombie visibility is bounded but GPU profiling, mobile FPS percentiles and multi-hour soak have not been measured.
6. **P2 design**: building roofs are opaque even for some interior camera moments; add cutaway/occlusion treatment in a future critic-driven iteration.

## Loop acceptance protocol

For each piece: builder patch -> fresh-code spec review -> browser capture -> harsh screenshot/gameplay critic -> largest-gap fix -> repeat without fixed round count. A source inspection is NOT a visual review. No replay-equivalence or performance claim without measured evidence.

## CI and replay

- Workflow: `.github/workflows/zombie-3d-gauntlet.yml`.
- Screenshots: `evidence/3d-runtime/*.png` are generated by browser CI and uploaded as run artifacts, not checked in as fabricated images.
- Deterministic simulation seed: 2026; scenario query parameters use the existing official scenario fixture catalogue.
- Render module is decoupled from simulation; time, seed and status displayed by page are derived from authoritative state. No paid influence bypass or hidden scripted winner.

## Next critic priorities

1. Inspect CI screenshots and fix any blank canvas, z-fighting, clipping, or architecture visibility issue.
2. Upgrade character motion, silhouette and props and test a closeup against Days Gone.
3. Improve shadows, material variation, fog, night readability, camera occlusion.
4. Run GPU frame timing and 30–60 minute stress capture before escalating crowd population.

Status as of 2026-10-08: iterations 01–03 implemented and pushed for validation; visually compared older iteration and rejected it for weak art direction. Latest browser pass not yet independently verified; no AAA or production-readiness claim.

## Iterations 04–05 — implementation, awaiting browser verdict

**Iteration 04:** directional day/night shader and mild material wear; simple projected contact shadows rather than raytraced shadows; 3D rain and roadway wetness driven by live weather; camera zoom adapted to director mode; authoritative event-driven muzzle tracers, impact fragments and rescues; CPU render p95/triangles and bounded adaptive render scale; session-scoped snapshots and version-checked recovery on refresh/device loss. A terminal defeat remains terminal after recovery instead of being silently undone.

**Iteration 05:** all six survivors have a show/hide dossier accessible through the **S** key or Squad button. Dossiers consume authoritative state (name, role, current intent, health, infection and kills), and clicking a living survivor selects the hero-follow camera only. This does not modify any AI behavior or combat result.

**Concrete previous visual finding:** First-batch browser screenshots were small, low-contrast, gray miniature city scenes; the large-horde sample reported approximately 22 FPS on the earlier CI software renderer. The later visual improvements are not proven by those older images.

**Required next critic gate:** inspect new CI screenshots (day, night, storm, large horde, hero and squad) at 1280×720 and mobile; review gameplay camera readability, real simulation continuity and CPU p95. Raise any failing result as a new iteration. No blind A/B win or AAA quality claim can be inferred from adding assets/effects alone.


## Iteration 06 — major visual direction reset

The user's critique remains correct: the older actual rendered day/night/large-horde screenshots are dull, mostly monochromatic overhead dioramas. Their daylight screenshot had approximately 0.24 mean luminance and only about 0.2% of pixels with high channel-separated saturation (RGB max-minus-min > 0.22). These are measurements of the **older evidence artifact only**, not a claim that the newest build has improved them.

Builder work now committed:
- Replaced the entire game-facing UI with a brighter **signal cyan / warning coral / rescue amber / night violet** design language, including stronger information hierarchy, named objective, squad defense bar, event story card, director strip and mobile layout.
- Introduced a separate deterministic `web/scene-art.js` module with bespoke building identity (medical, market, industrial, apartment), awnings, shop signs built from physical 3D glyphs, quarantine banners, emergency vehicles, supply kiosks, lamps, detailed field architecture and a taller rescue HQ/beacon. All scene art is presentation-only and does not change collision or pathfinding.
- Added a dedicated atmospheric WebGL2 sky pass (`web/sky-pass.js`) and an HTML canvas tactical map (`web/tactical-map.js`) showing actual live zombies and survivor positions.
- Added static geometry-contract tests for finite transforms, bounds, deterministic colors and authoritative state purity.

### Reproducible visual metrics

The browser screenshot suite now captures `world-hud-hidden.png` (actual world without overlay) and `vibrant-ui.png`, and scores real PNG pixels with `tests/browser-scene-quality.mjs`. It records luminance, bright/dark fraction, colorful-pixel fraction, quantized palette size, and objective thresholds in `evidence/3d-runtime/browser-report.json`. Minimum readability and minimum saturation now fail the browser smoke if the scene regresses badly. More ambitious provisional goals are median luminance ≥0.34 and high-saturation pixels ≥18% for **daylight**, but meeting them is not sufficient for AAA or visual reference parity. The first full CI pass on this iteration is **pending**; no new measured score has been claimed.

## Iteration 07 — character identity

- Added `web/actor-art.js` as a standalone, simulation-pure cosmetic layer. Six survivor roles have distinct tactical vests, helmets/visors, medic packs, leader patches, engineer tools, scavenging pouches and individually visible injury/infection signs.
- Added asymmetric torn clothing, scars, eyes and silhouette mutations for shamblers, runners and brutes, with more geometry reserved for near-camera characters. Far hordes retain the simpler existing distance LOD.
- Added Node geometry-contract tests for every role/archetype and budgets. **This is still procedural stylized geometry** and nowhere close to finished rigged cinematic characters, facial performance or animations.

**Gate remains OPEN:** demand real updated CI screenshots, frame CPU p95 and headless/mid-range/mobile reviews, then side-by-side Days Gone Remastered reference comparisons. Do not rename this build “AAA” based on code volume or color saturation alone.
