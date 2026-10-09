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


## Loops 33–36 — interface Gauntlet from real 1280×720 and 390×844 browser captures

**Actual baseline browser build:** GitHub Actions `37870064320` finished **successfully** on commit `aa320884`. We retrieved its *actual* Playwright WebGL2 screenshots for day/night, large horde, hero, live HUD, cinema, mobile and progress. The 390×844 mobile screenshot was legible but *visually obstructed*—two big opaque survival/AI panels filled the scene's top half, and footer buttons were tiny; its actual CPU frame-time p95 was also unacceptably high. The screenshot scoring returned daylight world-only median luminance **0.3686**, colorful fraction **0.241**; these are modest chromatic metrics, not proof of Days Gone–quality artistry.

**Loop 33 — mobile playfield first:** Shifted the phone UI from permanent stacked telemetry panels to an always-visible three-number vitals strip and large thumb-target panel navigation. Survival and AI Intel are mutually exclusive, scrollable sheets; Tactical Map jumps to the actual authoritative map inside Intel. The cinematics and main 3D scene remain visible by default. Implemented keyboard Escape/close buttons, stateful `aria-expanded`, mobile panel folding, safe-area-aware horizontal controls, and crisis-only banners from *real horde pressure/base damage* (no invented events).

**Loop 34 — usable tactical operator command:** Live survivor roster shows click-to-follow call signs, health condition and selected-camera highlighting; the three reserve cards reflect food, ammo and medicine from authoritative resources, with shortage colours. The source uses stable keyed DOM for every interactive portrait to avoid reintroducing the earlier detached-button runtime regression.

**Loop 35 — cinematic overlay:** Stream-oriented cinema HUD has a low-coverage, legible real AI decision ticker. Nonessential controls hide to prioritize gameplay. The ticker uses the same real selected survivor and intent as the full AI panel, and never scripts fictional dialogue/actions.

**Loop 36 — honest mode state + quality inspection:** Director/Hero controls now highlight only their actual mode; paused state changes both control `aria-pressed` and visible LIVE/PAUSED text. The progress page embeds an interactive actual running build inspector for daylight, night, horde, interior and critical seeded scenarios, and collapses old milestone records while keeping independent acceptance/criticism available.

**New screenshot gates:** The Playwright suite checks no permanently visible mobile sidebars at 390×844; genuine clickable and exclusive mobile sheets; live vitals and resource cards; quick-roster camera selection; cinema ticker and pause controls; scenario-inspector navigation. It captures `mobile-survival-panel.png`, `mobile-ai-intel-panel.png`, `mobile-tactical-map.png`, `squad-quick-command.png` and `progress-night-critic.png`.

**Visual comparison remains OPEN:** The refreshed build has *not yet* had a completed latest browser-artifact review. Major AAA 3D character/environment/lighting, device FPS and OBS endurance gaps remain. A successful prior commit is not proof that the current UI branch passes.


## Loop 38 — 2026-10-09: actual CI failure first, then rooftop urban silhouette (AWAITING NEW CAPTURES)

**Inspected exact PR #50 HEAD** `93bd869b8277026730b56626b79914456646b0d2`. The latest `Zombie 3D Gauntlet` Actions run `37898260875` **failed** at `tests/gauntlet-browser.mjs:132`: the autonomous tick did not increase within a hardcoded 750 ms sleep on headless SwiftShader. Deterministic game tests and JS syntax passed; the 3D screenshots through `cinema-mode.png` were generated and inspected. This failure is **not proof that the game logic stopped**: heavy software rendering may take longer than the test's short observation interval, and a prior session snapshot could be restored. The browser gate now clears only the test's prior recovery snapshot and waits up to 30 seconds for a real strictly increasing authoritative tick; it still fails if the simulation is genuinely stuck, and the subsequent reload still tests persistence. Do not report CI success before the new run completes.

**Evidence actually inspected:** `day.png` 1280×720 from run `37898260875` shows giant plain foreground rooftops, simplified boxes and low-detail human silhouettes, with two information panels taking substantial horizontal space. The old successful run `37870064320` supplied the 390×844 `mobile.png` baseline: opaque permanent survival/intel panels obscured the playfield. This old mobile screenshot is **not** evidence that the current mobile-drawer fix passes; the failed HEAD run never reached its mobile screenshot. Added an early `mobile-first-look.png` 390×844 browser capture with layout collision assertions so future test failures cannot silently erase phone evidence.

**One independently judgeable visual defect:** near-camera roofs look like enormous unbroken grey slabs, unlike the prop-dense, physically weathered environments in official Days Gone Remastered screenshots (PlayStation.Blog, 2025-04-09). Added deterministic per-building rooftop parapets, drain seams, HVAC with vents, water tanks or solar modules, and damage-conditioned repair patches in `web/scene-art.js`. Cutaway interiors and the HQ remain free of rooftop clutter. The new geometry is cosmetic only and bounded under 50 audit calls per building; dedicated tests check deterministic geometry, roof cutaway exclusion, damage variation and no authoritative mutation.

**Acceptance still OPEN:** The changed rooftop geometry and mobile-first capture are committed but have **not** yet been seen in a completed fresh WebGL2 browser run. Latest measured headless large-horde screenshot had ~75.4 ms CPU p95 (single screenshot telemetry; software GPU) and no hardware GPU p95 or 24–72 h OBS soak. Production characters, rigging, authored photoreal textures, horde animation, occlusion-safe camera composition and Days Gone blind A/B remain major gaps. The independent reference comparison is qualitative only; **no AAA parity claim**.


## Loop 38 — VERIFIED actual browser evidence (run 37902832842, commit 6402b546)

**Fresh CI completed SUCCESS** on 2026-10-09. Full Playwright WebGL2 suite, deterministic tests, shader and browser controls passed; browser-report.json has 19 true checks and zero console/page errors. Both 1280×720 `day.png` and 390×844 `mobile.png` / `mobile-first-look.png` were downloaded and visually inspected. Rooftop HVAC, parapets, solar modules and repair patches are visibly present in the new day screenshot, replacing previously featureless slab sections. This is a real incremental urban silhouette improvement, **not a premium environment**.

**Measured headless SwiftShader evidence** (single-scenario p95; do not generalize to hardware): day ~58.6ms CPU p95 / 25 reported FPS / 130,732 triangles; large horde ~93.1ms CPU p95 / 19 reported FPS / 230,086 triangles; night reached ~1,388.3ms CPU p95 in a heavy capture. These values are **worse than production targets**, and the old run's 75.4ms horde p95 is not a controlled matched-pair performance baseline. Autonomous liveness, reload recovery, pause state, mobile drawers, restart, progress inspector and screenshot creation all passed. Performance remains STOP-SHIP.

**Independent critic:** The actual new mobile capture shows the game world substantially more visible than the earlier baseline, but the bottom command bar ends in a half-visible cyan button and requires sideways scrolling to reach commands. That looks broken and obscures control discoverability. This is the next independently judgeable defect.

## Loop 39 — mobile command rail without clipped buttons (NEW CODE; awaiting browser capture)

Reorganized phone footer into four complete thumb-sized primary controls (Pause, Cinema, Hero, More). The More button exposes an explicit three-column secondary command tray for Sound, Director, Squad, Gauntlet and 2.5D; all original actions remain present. Escape, panel opening and cinema mode close the tray. Desktop retains all controls in one row. New Playwright checks assert >=44px complete buttons, no footer overflow, actual secondary-action visibility, and capture `mobile-more-controls.png` at 390×844.

**Gate:** The new Loop 39 screenshot and CI have not completed at commit time; visual/performance impact remains unverified. No merge or deployment approved. Official Days Gone Remastered still exceeds this game in facial/garment detail, vegetation, PBR surfaces, camera staging, animation, VFX and hardware performance.


## Loop 39 — VERIFIED actual mobile command tray (run 37903755529, commit d6d66ab4)

**Fresh GitHub Actions passed**, with 20 browser checks true and zero console/page errors. Downloaded and visually inspected current 390×844 `mobile.png`, `mobile-first-look.png` and `mobile-more-controls.png`. The earlier chopped cyan footer button is gone; Pause, Cinema, Hero and More are now all fully visible and thumb-sized. More reveals five real controls in a bounded on-demand tray without obscuring the primary footer or mobile mission deck. Desktop day/horde screenshots and 2.5D fallback remain accessible. This resolves a specific phone usability defect, **not** overall premium visual parity.

**Important new visual critic finding:** The actual expanded tray shows SOUND incorrectly colored bright amber despite `aria-pressed=false`; the global `.controls button:first-child` rule accidentally matches the first nested secondary button. Also the closed MORE button inherits a bright active-looking fourth-child highlight. These are dishonest operator-state cues and should be corrected before treating the UI as polished.

**Measured headless p95 remains severe:** the 2026-10-09 SwiftShader run reported large-horde CPU p95 ~1,434.4ms and night ~1,412.1ms (individual screenshots; not representative hardware or matched benchmark). The previous run was substantially faster on the same nominal runner class, so performance variability needs disciplined repeated profiling and GPU/CPU separation. No 60 FPS claim.

## Loop 40 — correct nested control highlights (NEW CODE; browser retest pending)

Scoped the Pause amber styling to direct child `.controls > button:first-child` only. Scoped the fourth-child bright cyan state to MORE only when `aria-expanded=true`; closed MORE and inactive SOUND remain dark until actually activated. Browser asserts inactive SOUND and MORE do not inherit the Pause background and that expanding MORE changes its computed visual state. This is purely CSS and browser assertions; simulation, recovery, 3D geometry, controls and 2.5D fallback are unchanged. Await the new CI and screenshot artifact before claiming verification.

## Loop 41 — 390×844 mobile HUD legibility hierarchy (NEW CODE; fresh CI pending)

**Independent visual critic input:** downloaded and inspected the successful Loop 39 actual `mobile-first-look.png` (390×844) and `day.png` (1280×720), plus `mobile-more-controls.png`. The phone now preserves most of the playfield, but the vital labels, director episode text, footer actions and performance badge were 8–10px and visually hard to distinguish at native resolution. This is a separate readability defect from the Loop 40 false button highlights.

**Change:** raised phone vitals to 15px, summary labels/navigation/command captions to at least 10px, director objective to 12px and compact frame badge to 11px; increased text contrast and retained compact overlay bounds. New Playwright computed-style assertions at **390×844** enforce the legibility floor and existing geometry tests still guard against header/footer collisions. The **1280×720** desktop HUD and 2.5D fallback are unchanged. No simulation, camera, AI or rendering pipeline changes.

**Evidence status:** existing Loop 39 screenshots are baseline only, not proof of this Loop 41 change. Fresh CI WebGL2 screenshots, mobile overlap inspection, hardware GPU p95 and 24–72 hour OBS soak remain required. Do not claim Days Gone Remastered parity: current models, motion, environment detail and CPU tails remain far below the visual/performance benchmark.

## Loop 41 — independently verified browser artifacts (2026-10-09)

Inspected exact draft PR #50 HEAD `2494b7f6f7a1928524cd4933089385503e54bd5e`. GitHub Actions run `37905454779` completed **SUCCESS**. Downloaded the 15 MB screenshot artifact and inspected actual 1280×720 daylight/night/hero views and 390×844 mobile, first-look and mobile-drawer views. Browser report recorded **21 passing checks and zero errors**. Mobile 10–15px telemetry is now visibly legible; on-demand panels do not permanently cover the scene. Seeded scenario screenshots correctly show PAUSED because they use freeze mode; autonomous tick advancement and refresh recovery were separately verified.

Measured software-renderer screenshot telemetry: daylight 58.8ms CPU p95 / 21 FPS; night 78.1ms / 19 FPS; large horde 111.4ms / 20 FPS. These are not hardware GPU frame times and remain below production goals. Official Days Gone Remastered gameplay has more realistic characters, fabrics, vegetation, lighting, action staging and restrained overlays. No blind reference A/B or OBS soak has passed.

## Loop 42 — mobile critical warning footprint (NEW CODE; fresh browser evidence pending)

**Independent screenshot critic:** the real 390×844 `mobile.png` capture shows a large, multi-row red warning panel covering the upper combat view beneath the vitals strip. It competes with already dense mobile overlays, reducing the visible survivor and infected action. This is one concrete, independently judgeable visual defect.

**Builder:** reduced the warning to a bounded **36–42px** two-line mobile panel, kept the 10px danger headline and 11px detail, and retained complete underlying alert text for assistive technology. Reduced shadow spread but retained danger contrast. Added a Playwright screenshot `mobile-critical-alert.png` from a real seeded large-horde scene at **390×844** and checks for height, separation from vitals, remaining playfield, width and typography. No changes to the fixed-step seeded simulation, authoritative persistence, 3D scene logic, desktop controls or 2.5D fallback.

**Verification OPEN:** new screenshot, visual comparison and Actions status must be inspected before declaring this fix successful. Character/urban asset quality, motion, hardware GPU p95 and unattended OBS stability remain major gaps. Do not merge or deploy.

## Loop 42 — VERIFIED native 390×844 critical view (2026-10-09)

GitHub Actions run `37909969872` on commit `db20403985172e4c6706962a6ec7ee9b2fb38eb8` completed **SUCCESS**. Downloaded the new 15.2 MB runtime artifact, inspected `mobile-critical-alert.png` at **390×844**, and checked `browser-report.json`: **22 passing browser checks, zero console/page errors**. The critical horde warning now occupies a compact two-line strip below the three survival counters, leaving more 3D horde and survivor action visible than the previous three-row warning. The screenshot confirms no visible alert/vitals overlap; the browser checks enforce a 32–42px alert and readable text. The 1280×720 `day.png` was also generated and the 2.5D fallback remains linked.

SwiftShader screenshot CPU p95: day **56.7ms** (19 reported FPS), night **96.6ms** (18 FPS), large horde **88.8ms** (20 FPS). These are noisy software-renderer measurements, **not evidence of improved hardware GPU frame time**. The newest horde screenshot still shows repeated low-poly infected bodies, simple urban blocks and insufficient facial, clothing and environmental material detail compared with official Days Gone Remastered imagery. **Gauntlet remains NOT WON**; no blind reference A/B, production GPU p95 or OBS multi-day soak. No merge/deploy.

## Loop 43 — desktop tactical-capsule composition (NEW CODE; awaiting fresh screenshots)

**First inspected PR HEAD and Actions:** draft PR #50 branch `agent/zombie-survival-3d-gauntlet-2026-10-08`, commit `7f5a1ed3b390285fc3ae427a7de75763915c0779`. GitHub Actions `37910894813` (Zombie 3D Gauntlet) and `37910889715` (Autonomous Games CI) completed **SUCCESS**. Downloaded latest `zombie-3d-gauntlet-evidence` archive and inspected real `day.png` **1280×720**, `mobile.png` and `mobile-critical-alert.png` **390×844**, plus `browser-report.json`: 22 true checks, zero reported console/page errors. No new failing tests, 404s or phone collisions were reported. Software-rendered screenshot CPU p95: daylight 68.4ms, night 82.2ms, large horde 79.3ms; hardware GPU p95 remains **unknown**.

**Single biggest independently judgeable defect:** in the real desktop daylight image, opaque left/right information dashboards together covered ~564px of the 1280px game frame and much of the middle vertical playfield. Survivors, streets and infected became secondary to operator UI. This contrasts with the restrained default combat HUD in Days Gone Remastered, although the underlying city and characters remain far below its art bar.

**Implemented:** wide desktop (>=1060px) defaults to narrow, translucent tactical capsules containing three live survival vitals, current AI actor/intent and horde pressure. Full squad call signs, live supplies, objectives, event chronicle and tactical map remain accessible via **DETAILS + / LESS −** buttons in each panel. At 1280px the intended clear central corridor is >=760px, compact cards end above y=430. Mobile <=740px retains existing drawers and full details; cinema mode, WebGL2 renderer, 2.5D fallback, fixed-step seeded simulation and recovery are untouched.

**New independent browser gate:** screenshots `desktop-hud-compact.png` and `desktop-hud-expanded.png`, bounding-box/central-corridor assertions, actual expand/collapse checks, roster/inventory/map visibility and mobile-only isolation. **These new screenshots and checks have NOT passed CI at commit time.** They must be downloaded and visually critiqued after a successful fresh browser run. Remaining gaps: procedural character/urban geometry, cinematic lighting, animation, CPU and hardware GPU p95, blind Days Gone A/B, 24–72h OBS unattended soak. No merge/deployment.

## Loop 43 — verified browser evidence, 2026-10-09

Draft PR #50 commit bda5288d: Actions 37915745664 and 37915740395 both passed. Downloaded actual 1280x720 desktop-hud-compact.png and desktop-hud-expanded.png, and 390x844 mobile-first-look.png and mobile-critical-alert.png. Browser report: 23 true checks, zero errors. Visual inspection confirms a larger unobstructed central scene in compact mode, functional detail expansion and unchanged mobile drawers. This resolves the specific desktop composition defect, not the full visual benchmark.

Software-rendered CPU p95: day 55.1ms; night 2882.5ms; large horde 3083.1ms; barricade 1747.1ms. Severe outliers require repeatable profiling; do not infer a GPU regression from these non-controlled samples. Production character/urban art, animation, hardware GPU profiling, blind reference A/B and unattended OBS soak remain open. No merge or deployment.

## Loop 44 — near-camera infected identity and clothing (2026-10-09; NEW CODE, awaiting screenshots)

**First inspected PR HEAD:** draft #50 `3a77f7c2`, Actions [37916677546](https://github.com/my-edutu/Ai_games/actions/runs/37916677546) SUCCESS. Downloaded and visually inspected actual 1280×720 `day.png` and `hero-closeup.png`, and 390×844 `mobile.png` and `mobile-critical-alert.png` from artifact `11610601358`. Browser report: 23 true checks, zero page/console errors; no observed failing test, 404 or mobile collision. **Software-rendered CPU p95 is not GPU timing:** day 4053.5ms, night 2743.7ms, large horde 96.4ms, barricade 1733.1ms, interior 57.2ms. Severe variable frame stalls remain uninvestigated.

**Single screenshot-judgeable defect:** hero-closeup infected have near-identical bald faceted heads and flat clothing, creating toy-soldier silhouettes instead of distinct infected humans. Mobile still reveals this low-fidelity character art. Days Gone Remastered remains far ahead in facial anatomy, hair, skin, cloth and animation.

**Implemented:** existing close-range animated rig now has jaw, cheek, ear and brow volumes; four deterministic scalp/wound profiles, double-sided torn jacket hems animated by pose stride; survivor throat guard and helmet straps. Added unit checks for four distinct bounded, reproducible geometry signatures and immutable authoritative actors. Added real 390×844 `mobile-character-study.png` Playwright capture beside existing 1280×720 `hero-closeup.png`. No changes to 30Hz seeded simulation, WebGL2 instancing, context recovery or 2.5D fallback.

**Verification:** previous screenshots inspected; changed-code screenshot success and visual improvement are **NOT YET VERIFIED**. Remain below benchmark. Open: production humanoid/urban art, hardware GPU p95, animation, unbiased reference A/B and 24–72h OBS soak. No merge/deploy.

## Loop 44 — independent browser verification (2026-10-09)

Source commit `af68e3a9` passed [Zombie 3D Gauntlet run 37921871245](https://github.com/my-edutu/Ai_games/actions/runs/37921871245) and [Autonomous Games CI 37921864492](https://github.com/my-edutu/Ai_games/actions/runs/37921864492). Downloaded fresh artifact `11613250133` and inspected actual `hero-closeup.png` (1280×720), `mobile.png` and newly added `mobile-character-study.png` (390×844). Browser report: **24 true checks, zero reported page/console errors**. Actual new close-up shows some differentiated scalp shapes and more anatomical cheek/jaw detail on near infected; this is a *local silhouette improvement only*, not realism parity. Mobile drawers, warning and control rail remain unobstructed in the inspected images; no visible 404/fallback regression. The procedural faces, hands, cloth, urban structures and lighting still read as low-poly stylization against [official Days Gone Remastered Horde Assault screenshots](https://blog.playstation.com/2025/04/09/days-gone-remastered-a-closer-look-at-the-horde-assault-modes-survival-arcade-action/).

**Performance is NOT improved or cleared:** latest SwiftShader CPU p95 day **62.4ms**, night **4175.1ms**, large horde **1726.9ms**, barricade **3314.8ms**, interior **55.5ms**, near-death **1625.8ms**, failure **4167.9ms**. Previous run had different severe outliers, so these are non-controlled software timings, not a valid real-hardware GPU p95 comparison. Measured triangle counts day **137,332**, night **201,386**, large horde **260,406**. Next defect to investigate: first-frame/renderer-stall distribution, steady-state GPU timer queries on hardware and actor LOD, before attempting further geometry-heavy realism. 24–72h OBS soak, blind reference comparison and real production humanoid/urban assets remain open. **Gauntlet NOT WON; draft PR, no merge/deployment.**

## Loop 45 — mobile horde signal grounding (2026-10-09; CODE COMMITTED, new screenshot verification PENDING)

**HEAD-first inspection:** draft PR #50 at `60d1153f`; both latest Actions runs passed: [Zombie 3D Gauntlet #37923029797](https://github.com/my-edutu/Ai_games/actions/runs/37923029797) and Autonomous Games CI #37923023155. Downloaded actual artifact `11612807074`, inspected `day.png` (1280×720), `mobile.png` (390×844), `browser-report.json`: **24 browser checks true, zero reported page/console errors**, no visible phone drawer collision or 404. SwiftShader CPU p95 in the latest report: day 34ms, night 63.5ms, large horde 783.2ms (screenshot text 79.8ms at a different sampling instant). These inconsistent software timings are not hardware GPU p95 and remain STOP-SHIP.

**Single largest independently judgeable mobile defect:** the dense-horde pink tactical ring and tall pink pillar cut across the central survivor bodies and faces in the actual 390×844 screenshot, unlike the restrained contextual threat indicators in the official [Days Gone Remastered Horde Assault reference](https://blog.playstation.com/2025/04/09/days-gone-remastered-a-closer-look-at-the-horde-assault-modes-survival-arcade-action/). The art fidelity gap is still much larger overall, but this occlusion can be fixed independently without changing game authority.

**Implemented:** on <=740px viewports, the real nearby-horde centroid is marked with a thin, broken, low-height coral ground perimeter and four short inward notches, replacing the elevated ring/pillar. Desktop retains the existing distant beacon. This reduces on-screen facial occlusion and does not alter AI, state, seed, WebGL2 crowd instancing, fallback or recovery. Added bounded deterministic unit geometry test and a true 390×844 dense-horde `mobile-ground-threat.png` browser capture. **This commit's changed-code CI and visual improvement have NOT been verified yet; inspect its artifact before claiming success.** Still open: production humanoid/environment art, mocap-quality motion, consistent hardware GPU p95, blind reference A/B and 24–72h OBS unattended soak. No merge/deploy.

## Loop 45 screenshot critique → Loop 46 correction (2026-10-09; new code pending fresh visual check)

**Independent Loop 45 evidence:** source commit `29eccb02`, [Gauntlet run 37927935609](https://github.com/my-edutu/Ai_games/actions/runs/37927935609) **SUCCESS**; Autonomous Games CI 37927931533 **SUCCESS**. Downloaded actual artifact `11615526311`, reviewed desktop 1280×720 and mobile 390×844 captures. `browser-report.json`: **25 checks true, zero reported page/console errors**, mobile-ground-threat.png exists. **But the actual 390×844 mobile.png STILL shows the large coral halo/pillar through survivors**, and mobile-ground-threat.png shows a huge cyan ring through the foreground. Therefore Loop 45's intended visual outcome **FAILED** despite passing CI. Root cause: Loop 45 grounded only horde-centroid markers; objective and trapped-civilian markers still used the same elevated `beam()` geometry. Do not claim mobile obstruction resolved.

**Loop 46 corrective code:** route **all three** world beacon categories (objective, trapped/escorting civilians, horde centroid) through short broken ground-level arcs at <=740px; keep wide-screen tall beacons. Expanded deterministic geometry tests to check trapped-civilian and objective height, rendering budget and authoritative state immutability. The existing mobile.png and mobile-ground-threat.png capture gates will show whether the obstruction is actually gone. Fresh CI/screenshots still required before verification.

**STOP-SHIP:** SwiftShader CPU p95 from Loop 45 artifact: day **4100.7ms**, night **3055.8ms**, large horde **1720.2ms**, barricade **1646.7ms**; other scenes varied dramatically (interior 54.6ms). These highly unstable software measurements are not production GPU frame times. Character/urban art, real skeletal fidelity, blinded reference A/B, hardware GPU p95 and 24–72h OBS soak remain unverified. No merge/deploy.

## Loop 46 screenshot critique → Loop 47 paused-viewport cache correction (2026-10-09; fresh CI pending)

**Verified prior HEAD:** draft PR #50 source `d53c459b`, [Gauntlet run 37928969488](https://github.com/my-edutu/Ai_games/actions/runs/37928969488) and Autonomous Games CI 37928962694 both **SUCCESS**. Downloaded and visually inspected artifact `11615383497` (desktop 1280×720 and mobile 390×844). Browser report: **25 checks true, zero reported errors**. The large-horde mobile-ground-threat.png shows the blue objective marker moved to low ground, but the live mobile.png **still shows a tall coral pillar and ring through survivors**. Therefore Loop 46 did not resolve the real paused phone capture. SwiftShader CPU p95 day 43.4ms, night 78.2ms, large horde 1210.7ms, barricade 2650.3ms, interior 40ms; not hardware GPU evidence.

**Root cause:** mobile.png is captured after pausing the running desktop scene and resizing from 1280px to 390px. The WebGL dynamic mesh cache only rebuilt on authoritative tick/focus changes when paused, so it retained the tall desktop marker vertices after the CSS viewport changed. This was a **real rendering-cache bug**, not another color/style issue.

**Loop 47 code:** track the last compact-signal breakpoint and rebuild dynamic geometry whenever it changes, including paused/frozen modes. The existing mobile screenshot now has a deterministic chance to show the correct low world signals immediately after resize. New Playwright assertion requires the real dynamic rebuild counter to increase after the paused 1280→390 resize; this tests the actual regression rather than only asserting file existence. The fixed-step seeded simulation, 2.5D fallback, WebGL2 instanced horde and recovery logic are unchanged. **Fresh Actions run and screenshot inspection are pending; do not claim the coral marker is fixed yet.**

**Open:** severe variable software frame-time p95, hardware GPU p95 unknown, stylized procedural characters and urban assets well below Days Gone Remastered, animation, blinded reference A/B and 24–72h OBS soak. No merge or deployment.


## Loop 48 — mobile director subject visibility (2026-10-09; implementation prepared, fresh screenshots required)

**HEAD-first defect verification:** The Loop 47 source `4fed376e` passed [GitHub Actions #37930718407](https://github.com/my-edutu/Ai_games/actions/runs/37930718407), with **26 browser checks true and zero page/console errors**. Downloaded artifact `11616860488` and inspected actual `day.png` (1280×720), `mobile.png` and `mobile-ground-threat.png` (390×844). The stale, tall coral pillar/ring is now absent in the real paused mobile.png; Loop 47's mobile-breakpoint dynamic mesh cache correction is therefore visually verified. The test baseline binding bug that blocked the first Loop 47 CI attempt was fixed separately. The latest baseline assertion correction `a0ffafa2` has a separate Actions run and must not be marked passed until it completes.

**One substantial remaining visual defect, chosen from actual captures:** The mobile dense-horde/defense screenshot is almost entirely an empty concrete parapet and roof; the living squad is cut off along the lower-right edge. This is an action-composition failure relative to the character-first compositions in [official Days Gone Remastered Horde Assault imagery](https://blog.playstation.com/2025/04/09/days-gone-remastered-a-closer-look-at-the-horde-assault-modes-survival-arcade-action/). The desktop scene also devotes excessive foreground area to rooftops. No AAA visual parity is claimed.

**Builder change for Loop 48:** In <=740px autonomous director defense/squad/survivor-follow shots, bias the read-only camera target toward the nearest *living* survivor when close to the chosen AI event, while leaving manual/hero/overview, distant events and the director's actual AI decisions untouched. Add a pure deterministic camera-focus contract test (dead/distant subjects, nonmutation), real mobile focus telemetry, and allow the actual phone screenshot camera to settle. Add an early `node --check` workflow gate so Playwright syntax errors are caught before expensive browser installation. **This new shot has not yet been independently verified in a running browser.** It must be judged against fresh 390×844 and 1280×720 artifacts before acceptance.

**Measured Loop 47 SwiftShader CPU frame p95 (not GPU):** day 44ms, night 137ms, large-horde **2511.3ms**, barricade 89.7ms, interior 57.6ms, near-death 76.1ms. Severe inconsistent long-tail stalls remain a STOP-SHIP; production GPU p95, 24–72h unattended OBS soak, realistic rigs/animation, high-detail city art and blinded reference A/B are still missing. **Gauntlet NOT WON. Draft PR only; no merge/deploy.**


## Loop 49 — mobile roof-clear sightline: independent verification (2026-10-09)

**HEAD inspected:** `fcd2f629`, draft PR #50. GitHub Actions [run #37935428293](https://github.com/my-edutu/Ai_games/actions/runs/37935428293) completed **success** with 27 browser checks and `errors: []`; its screenshot artifact `11618573589` was downloaded and inspected, including actual 1280×720 `day.png` and 390×844 `mobile.png`. The Loop 49 camera change is in HEAD, but a dedicated roof-ray regression test had not been committed; Loop 50 includes it.

**Reference critique:** Against [official Days Gone Remastered Horde Assault gameplay](https://blog.playstation.com/2025/04/09/days-gone-remastered-a-closer-look-at-the-horde-assault-modes-survival-arcade-action/), the game remains sharply below the character/material/lighting quality bar. The mobile screenshot shows recognizable survivors and infected but the foreground HQ is a broad empty pale slab, occupying much of the action composition. This is the selected independent visual defect for Loop 50.

**Measured latest SwiftShader-only CPU p95:** day 50.7ms; night 2870.8ms; large horde 3074.8ms; barricade 3158.9ms. GPU frame-time p95 remains **unmeasured**, and these unstable software outliers are stop-ship evidence, not acceptable performance.

## Loop 50 — authored emergency HQ staging courtyard (2026-10-09; fresh CI evidence pending)

**Builder:** Add original low-profile perimeter medical/communications gear, sandbag barricades, extraction markings, floodlights, supply crates and worn ground detail to the previously blank 3D HQ cutaway. All props are geometry-only and placed near courtyard edges, leaving the central squad and authoritative collision/navigation untouched. Add deterministic bounded geometry tests for day/night and a dedicated Loop 49 roof-ray obstruction regression test. Preserve seeded fixed-step AI, 2.5D fallback, recovery and WebGL2 horde instancing.

**Evidence gate:** Run new GitHub Actions browser suite; download and inspect fresh 1280×720 and 390×844 captures; check for console errors, missing assets, mobile overlays, improved courtyard legibility and frame-time regressions. **Do not mark the visual improvement verified until the new screenshots are actually reviewed.** Outstanding: photoreal original/licensed characters, urban assets, mocap-grade animation, real GPU p95, blind A/B and 24–72h OBS soak. **NOT WON. No merge/deploy.**

### Loop 50 independent browser verdict — verified 2026-10-09

GitHub Actions [run #37942234140](https://github.com/my-edutu/Ai_games/actions/runs/37942234140) completed **success** at commit `29551681`. Downloaded and reviewed screenshot artifact **11623046344**. The 1280×720 `day.png` and 390×844 `mobile.png` show the actual new medical table with red cross, perimeter bags, floodlights, radio unit and evacuation floor marks. Compared side-by-side with run #37935428293, the previously nearly empty phone courtyard has additional recognizable emergency staging props, and survivor faces remain unobscured. This is a verified incremental improvement in scene storytelling, **not** premium asset or AAA parity. The browser report contains **27/27 true checks and `errors: []`**; unit and browser jobs passed. No 404 or mobile overlay collision was reported by the automated browser suite, although exhaustive external asset coverage is not established.

**Measured SwiftShader CPU frame-time p95 in this run (not hardware GPU):** daylight **4095.5ms**, night **2823.5ms**, large horde **1681.0ms**, barricade **78.8ms**, interior **1716.3ms**. These extreme, variable long tails remain a critical stop-ship. The earlier baseline run also showed severe stalls, so do not attribute the differences to this art change without profiling. The next independently judgeable defect is software frame-time outliers/mesh rebuild stalls, followed by photoreal assets, believable humanoid animation and 24–72h OBS soak. **NOT WON; PR remains draft; no merge/deploy.**

## Loop 51 — reclaim the phone action viewport (2026-10-09; post-change CI pending)

**HEAD-first verification:** Draft PR #50 at `980d691a`; [Actions run #37943417151](https://github.com/my-edutu/Ai_games/actions/runs/37943417151) completed **success** with a downloadable screenshot artifact **11623038309**, 27 true browser checks and `errors: []`. I opened its actual 1280×720 `day.png` and 390×844 `mobile.png`. The desktop safehouse courtyard has recognizable emergency props; the mobile shot keeps the squad visible. No failing jobs or reported console errors were found in this run.

**Selected visual defect:** The phone masthead, three vital tiles and critical-warning banner occupy approximately the first **166px** of the 844px screen, obscuring upper horde silhouettes and leaving less room for the 3D encounter. This is a visibility/composition gap versus character-first Days Gone Remastered captures, not a claim of comparable fidelity. **Loop 51 implementation:** preserve EDUTU branding and the >=15px vital numerals, but compact header paddings, the vital strip and alert positions at portrait-phone heights; maintain the established <=610px short-screen layout and accessible drawers. Browser geometry assertions now check header/summary separation, maximum obstruction, typography and the critical alert bottom <=155px. The fixed-step AI, authoritative state, GPU instancing, 2.5D fallback and recovery logic are untouched.

**Evidence gate:** New Actions browser artifact must show 1280×720 and 390×844 renders; review `mobile.png` and `mobile-critical-alert.png` before claiming success. This commit is **not yet visually verified**. Baseline SwiftShader CPU p95 remains erratic: run #37943417151 measured day 51.5ms, night 3071.6ms, large horde 1640.5ms and barricade 1713.1ms. These are not hardware GPU p95; mesh build stalls, authentic assets/animation, and 24–72h unattended OBS remain STOP-SHIP. **Gauntlet NOT achieved; PR draft; no merge/deploy.**

### Loop 51 independent browser verdict — VERIFIED 2026-10-09

[Zombie 3D Gauntlet run #37949954028](https://github.com/my-edutu/Ai_games/actions/runs/37949954028) **SUCCESS** on `e4edcab6`, with screenshot artifact **11626046654** downloaded and independently opened. Browser report: **28/28 true checks, zero reported browser errors**, including the new `mobileVerticalPlayfield` assertion. The companion [Autonomous Games CI run #37949946643](https://github.com/my-edutu/Ai_games/actions/runs/37949946643) also completed **SUCCESS**.

**Actual 390×844 mobile screenshot comparison:** the critical-warning bottom shifts from approximately y=165 to y=144, reclaiming about **21px** of upper game visibility without sacrificing the 15px survival numerals or 44px control targets. The top of the horde and the safehouse remain visible; the compact header, three vital tiles and two-line alert do not overlap. The 1280×720 `day.png` still renders with its existing compact desktop panels and no newly observed HUD collisions. This verifies a small, concrete phone composition improvement, **not** AAA parity or broad hardware compatibility. The screenshots were reviewed from the actual CI artifact, not synthesized mockups.

**Performance stop-ship:** the same SwiftShader-only capture reports CPU p95 **3944.5ms day**, **3074.2ms night**, **132.5ms large horde**, **1724.1ms barricade** and **1724.4ms interior**. These highly variable software/browser capture measurements cannot establish GPU frame-time p95 or reliable OBS frame pacing. The next high-impact investigation is render-loop/capture stalls and actual hardware GPU profiling; additional major gaps remain character topology/textures, urban assets, animation, blind Days Gone reference comparisons, and 24–72h unattended OBS soak. **NOT WON. No merge/deploy.**


## Loop 52 — desktop director framing (2026-10-09; CI pending)

PR #50 baseline HEAD 77ebcad4, Actions run 37951519648: success; screenshot artifact 11626417866 inspected at 1280×720 and 390×844. Browser report: 28 checks true, zero reported errors. The desktop frame has excessive foreground rooftops and a distant squad. The phone frame has clearer survivors. This is below the Days Gone Remastered reference.

Implement desktop-only closer squad/defense/follow camera ranges with deterministic tests and browser camera telemetry. No mobile, manual, overview, simulation or 2.5D changes. New screenshots still require verification.

SwiftShader CPU p95: day 73.2ms, night 4820.1ms, large horde 104.9ms, defense 70.8ms. Hardware GPU p95, real assets, animation, long OBS soak and independent reference comparison remain unresolved. NOT ACHIEVED. Draft PR, no merge or deployment.
