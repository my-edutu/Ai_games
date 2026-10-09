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


## Iterations 08–11 — 3D skyline, filmic events and wounded-world visual feedback

**Loop 08 — skyline & camera (committed):** `web/world-setpieces.js` adds authored 3D setpieces: an industrial water tower, evacuation gate with emergency barricades, hospital helipad, collapsed overpass, destroyed metro access, water plaza, road excavator and large illuminated communications sign. These are different landmarks per district rather than duplicate cube buildings. `web/camera-rig.js` resolves opaque roof obstacles against actual building bounds and prevents hero-follow views from entering walls; unit tests cover both blocked and unobstructed cameras. Art still uses procedural geometry, no real sculpted/photogrammetric assets.

**Loop 09 — lighting & live story (committed):** per-fragment nighttime cyan/amber rescue and medical district practical lighting, deterministic storm flashes and an authoritative event chronicle. It reports actual game events such as rescue, weapon fire, horde alert and safehouse fortification — **never fictionalized scripted NPC actions**.

**Loop 10 — tactical cinema (committed):** world-space mission locator rings, trapped-civilian rescue signals, injured/infected survivor health/infection indicators, pressured barricade meters, actual nearby horde centroid signal; they are all non-colliding cosmetic geometry from the authoritative state. Added keyboard M or on-screen Cinema button to minimize game panels while keeping controls available (especially for OBS/mobile).

**Loop 11 — wounded environment (committed):** `web/environment-vfx.js` adds visually reactive ruined-building smoke, flickering flames, embers, emergency lights and debris from actual nearby breach/horde events; budgets cap effect geometry and distance cull far ruin sites. A Node contract test checks reproducible effect counts and strict game-state nonmutation.

**Independent developer-side verification:** JS syntax checks passed for new `world-setpieces.js`, `environment-vfx.js`, `camera-rig.js` and `world-overlays.js`. Pure geometry mocks rendered **185** deterministic landmark primitives (60 valid distinct color swatches), and **52** bounded world marker primitives without simulation mutation. These are **source-level implementation checks, not real browser render results**.

**Visual stop ship:** Latest GitHub Actions runners remain queued; superseded CI runs have been cancelled by concurrency policy. Latest full Playwright browser gameplay screenshots, daylight color metrics, reference A/B, FPS and 24-hour live-stream soak have *not* passed. Compare the newly captured screenshots with official Days Gone gameplay and insist on another art iteration if they remain crude or unreadable.


## Iterations 12–13 — fully varied interiors and material-depth pass (committed)

**Loop 12:** `web/interior-art.js` adds recognizably different **hospital treatment, apartment living, supermarket aisles, police precinct, fuel station and warehouse scenes** revealed by the authoritative roof-cutaway mechanic. Specific geometry includes clinic beds, IV stands, diagnostic screens, couches, lamps, stocked shelves, counters, registers, lockers, crates, industrial barrels and shelves. Geometry-contract tests exercise six kinds with **41–80** primitive placements per illustrative interior, verify distinct palettes and no world-state writes. This is a real 3D cutaway layout, but remains procedural art rather than authored production environment meshes.

**Loop 13:** upgraded terrain/building shader with subtle masonry courses on high walls, varying ground/asphalt roughness, and rain-responsive top-surface glints; distant/fallen infected draw only within a bounded visual distance and camera-near alive zombies are prioritized when the headless CPU/software GPU renderer struggles. This sacrifices invisible background infected detail under load **only in the render buffer**, never in the AI/physics simulation.

**Gate:** The newest GitHub Actions run has not produced screenshots or a completed build; full WebGL shader compilation, pixel metrics, controls and FPS must still pass Chromium. Source syntax and source-level mock geometry checks are not a substitute for real screenshots. Independent Days Gone comparison remains a large open goal.


## Loops 14–19 — screenshot-driven gameplay/hardware critique

**Real Chromium CI evidence inspected**, not artist mockups:
- Run `37769270488` on an earlier branch revision generated authentic day, night, large-horde, hero and interior scenes, but failed because `renderSquad()` rebuilt every survivor card every 450ms and Playwright could not click a moving DOM target. This also harmed real users; replaced with a stable, keyed dossier cache and delegated event handler.
- Run `37782493776` generated actual **hero-clear-view.png** after the first HQ cutaway, showing an identifiable six-person squad in a physical 3D courtyard, but failed because clicking Pause only refreshed its DOM label, leaving a stale telemetry tick until the 450ms HUD timer. Pause now publishes the exact authoritative tick immediately. This test failure did **not** prove AI kept advancing; it proved the cached stats were stale.
- Real `37782493776` scene scores: daytime world-only screenshot median luminance **0.367**, colorful pixel fraction **0.2405** (pixel-level quantization metrics). `day.png` frame stats reported **27 FPS and CPU P95 50.2ms**; `large-horde.png` reported **27 FPS and CPU P95 238.1ms** in the software rendering environment. These are **older measured captures**, not new-build performance claims. They reveal a serious CPU-throughput quality gap and explain the new adaptive mesh-update throttle and close-camera zombie LOD. This is still visually boxy and nowhere near the *Days Gone Remastered* screenshot quality bar.

**Loop 15:** live AI-director and hero camera now use conditional HQ cutaways whenever a roof would block foreground characters; this addresses the original screenshot where the entire view was an opaque beige HQ wall. Screenshots are explicit for hero full HUD and distraction-free Hero Cinema. Added render-only mesh caching to avoid rebuilding identical paused geometry and to use measured mesh-build cost for LOD.

**Loop 16:** `web/shadow-pass.js` adds native WebGL2 FBO directional shadow depth texture with 2x2 PCF, usable with `?lighting=shadows` or `?quality=cinematic`. This is experimental and defaults OFF on software/mobile GPUs until real FPS and picture quality are verified; browser suite includes `cinematic-shadows.png` and WebGL error check. Close-camera 3D survivors have ellipsoidal shoulder/torso/head forms, 3D faces and more distinct role hues rather than only a box torso; these are still procedural, not production sculpted, rigged people.

**Loop 17:** launching the server's `/` root now serves `web/3d.html` instead of the old 2.5D viewer, with a browser assertion; the original 2.5D stays reachable from its explicit `/web/index.html` fallback.

**Loop 18:** horde director shots now focus on actual infected approach positions rather than an anonymous building rooftop center. Framing logic does not add entities or alter their movement.

**Loop 19:** close dead infected and survivor models now have posed fallen bodies and contact marks instead of a single rectangular 'corpse' placeholder.

**Current STOP-SHIP:** Newest CI after these changes has not been visually inspected, shadow FBO browser compilation is not verified, and software renderer horde throughput remains the largest measured performance blocker. Continue comparing screenshots against official reference rather than using implementation count as an art-quality score.


## Loops 20–26 — mobile renderer throughput, animation, material/weather identity and real asset integration

**Loop 20 — performance and motion:** The renderer moved from thousands of temporary JS array-of-number vertex allocations to a packed growable `Float32Array` uploaded directly to the WebGL2 buffer. Independent 20,000-triangle tests exercise buffer growth and stable vertex values. `animation-pose.js` drives striding, body bob, combat recoil, rescue/healing gesture and injury crouch from authoritative action/state, without modifying outcomes. The performance benefit is NOT yet measured on the newest browser/runner.

**Loop 21 — surface direction:** Replaced the highly repetitive old brick grid on all upright buildings with procedurally weathered concrete variation, rainfall-influenced glints and light-emissive saturated storefront cues. This is more physically motivated, but still far from AAA authored surface textures and photographic urban materials.

**Loops 22–25 — authentic CC0 3D pipeline:** `gltf-assets.js` parses bounded embedded GLB 2.0 (indexed triangle meshes, normals, base PBR color factors and scene node transforms) with strict malicious/corrupt payload rejection; it also decodes embedded PNG/JPEG/WebP base-color atlases via secure browser `ImageBitmap` and samples UVs into real WebGL mesh colors. `cc0-models.js` loads three **pinned CC0** minion characters (variants for brute, runner and shambler) from `Ariescar/gobkit-free-assets`, git commit `0d654ab3306515b1b63621a5c6548554034482dc`, license `CC0-1.0` (verified against original source `LICENSE`). They render only on close infected in **opt-in `?models=cc0` mode**, with a maximum of three actors and 900 triangles per imported actor. The old procedural characters remain a deterministic fallback when network, decoded geometry or GPU capacity fails. This is a genuine asset bridge, but neither full skeletal animation nor an AAA visual model. Do **not** assume remote assets are bundled; for production they must be licensed, pinned, vendored, and quality-tested on all target devices.

**Loop 26 — audio design:** `audio-foley.js` generates noncopyrighted per-event sound textures in WebAudio, with 3D-distance-aware stereo placement, a capped 16-voice budget, event-category filtering, rain and storm noise. It is activated only by direct audience interaction (browser audio permission) and does not alter the game.

**CI stability:** Real screenshot verification was repeatedly starved by rapid PR commits triggering `cancel-in-progress: true`. Changed Gauntlet workflow concurrency to `cancel-in-progress: false` so a running Chromium test can complete rather than being killed by every subsequent art commit, while pending runs are still deduplicated. Acceptance remains **NOT PASSED** until fresh captures, browser functionality, source unit tests and independent reference comparison are approved.

**Remaining stop-ship:** Need truly production-quality originally created/licensed human meshes, full skin animation, PBR textures and shadows with real hardware profiling, better kill animations, performance soak and reference screenshots. The CC0 minion models are intermediate assets, not the intended finished zombie look.


## Gauntlet loops 27–32 — four active quality barriers (current implementation)

**Measured blocker:** Browser workflow `37789586403` initially failed at the root because `serve.mjs` rendered the `/web/3d.html` markup at the bare `/` URL. The relative module and stylesheet paths were therefore requested as `/gauntlet3d.js` and `/gauntlet3d.css` and returned 404. Fixed with a canonical HTTP redirect from `/` to `/web/3d.html`. Later run `37869376408` passed **58/59 deterministic tests**, then failed solely because the new rig test’s audit mock did not implement `mesh.tri`; this mock now validates RGB triangle records and ellipsoid primitives as actual renderer API methods.

### Loop 28: Rendering throughput — real WebGL2 instancing

`web/instanced-horde.js` contains an original humanoid silhouette mesh with **812 triangles** and dedicated per-instance world transforms, scale and distinct infected palettes. A crowd of 100–500 distant infected is rendered by a **single `gl.drawArraysInstanced()` GPU command**, not rebuilt into a per-zombie CPU vertex array every animation frame. `partitionHorde` deterministically allocates camera-close actors to individually articulated geometry and sends other genuinely visible actors to the instanced buffer; every entity remains governed by the same fixed-step simulation and event logic. A Node acceptance test checks 260-actor horde nonmutation, unique visual representation and no dropped agents inside the documented view range. The browser test now records `gpuHordeInstances`, `gpuHordeTriangles`, mesh P95 and measured CPU P95 from a **real live large-horde scene**.

**Caveat:** GPU instancing decreases CPU scene-building volume but may still be fragment/vertex-bound in headless SwiftShader and has not yet passed a representative GPU/FPS benchmark. It is not evidence of production-level 60 FPS.

### Loop 29: Near-camera anatomical character reconstruction

`web/character-rig.js` builds tapered torso surfaces, distinct skinned faces, shoulder/neck attachments, posed elbow/wrist and hip/knee/ankle joints, medical/scouting/defender gear and asymmetric infected mutations using authored 3D surfaces. Role/action-linked poses are taken from the real simulation; mutation/death/attack do not modify game state. Near-camera actors use original anatomical geometry; distant infected are intentionally simplified and instanced for performance. An independent critic pass found inward-facing torso and infected head normals, and reversed the geometric winding; dedicated tests now enforce outward-facing normals.

**Caveat:** These are original organic procedural meshes, **not** scanned/hand-sculpted AAA characters, facial rigs, motion capture or premium texture sets.

### Loop 30: Material research implementation

`web/material-functions.js` adds a true GGX specular BRDF, Fresnel reflection model, variable surface roughness, procedural weathered concrete, leakage streaks and asphalt puddle wetness based on world-space positions. Full microtexture is gated to hardware GPUs; software headless GL keeps an inexpensive diffuse fallback. The shader is compiled during true Chromium WebGL2 screenshots; no claims are made about material parity before it passes.

### Loops 31–32: Rigged source assets and animation continuity

`web/gltf-assets.js` can now read GLB 2.0 `JOINTS_0`, `WEIGHTS_0`, inverse bind matrices and baked animation samplers. `web/skinning.js` implements joint palette evaluation, quaternion slerp interpolation, time-clamped death and CPU vertex deform for up to three close imported CC0 actors. `web/animation-mixer.js` smooths survivor and infected motion when real decisions change (aim/attack/rescue/retreat/injury). These animation transforms are explicitly cosmetic and bounded; they never affect game outcomes. License status: optional Gobkit low-poly source CC0 is pinned and verified; offline production bundling and bespoke final high-fidelity assets remain open.

### Harsh critic verdict — OPEN

The latest GPU-instanced, rigged-skinning and GGX visual systems are **committed but not end-to-end browser validated**. The earlier real failure at 238 ms CPU P95 in a large-horde software renderer is a baseline, **not an achieved improvement**. The next visual A/B must inspect day/night actual screenshots, horde crowds, UI, faces, animation, shadows and headless/hardware p95. Stop-ship until independent Days Gone comparison and performance/OBS soaking are passed. Do not mistake this implementation count for a 100% Gauntlet score.
