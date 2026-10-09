# Marble Survival — Gauntlet run log

**Baseline:** `agent/marble-survival-2-5d-mainline` / PR #38. This baseline is a WebGL2 presentation on top of a fixed-step deterministic tournament. It is **not** proven visually equivalent to commercial references, and its authority is **not** a full vertical rigid-body 3D simulation.

## Inspectable standards

- **Primary visual:** Marble It Up! Ultra — compare actual 3D sphere detail, lighting, arena construction, moving machinery, camera composition and effects.
- **Primary experience:** Marbles on Stream — compare actual autonomous tournament legibility, eliminations, streamer controls and viewer entertainment.
- **Optional obstacle-showmanship:** Fall Guys — comparison of elimination timing and readable obstacle silhouettes, not a mandate to copy proprietary art.

Only compare real captures at identical or documented viewport and quality settings. Never confuse CSS concept art, source tests, mockups, or render predictions with real gameplay. Score mechanics separately from visual presentation. Do not proclaim a win unless blinded independent reviewers consistently select the candidate.

## Current delivered passes (2026-10-08)

| Pass | Implementation | Current proof | Critic's open challenge |
| --- | --- | --- | --- |
| 1 · Character optics | Clearcoat specularity, fresnel edge light, secondary illumination and rolling internal ribbons in WebGL shader | Source exists, JS parse checked | Compare screenshots of different identities against Marble It Up! Ultra; fix muddy/dull/rubber-like material |
| 2 · Measurable rendering | Real FPS samples, draw calls and triangle counts broadcast to a same-origin viewer page | Source exists, JS parse checked | Profile 1920×1080 and mobile GPU; verify no frame regressions |
| 3 · Tournament arena | Quality-scaled stands, emissive rails and floodlight gantries outside collision geometry | Source exists, JS parse checked | Browser-review occlusion, camera framing, arena visibility and readability |
| 4 · Camera | Frame-rate-normalized pursuit easing for server camera directives | Source exists, JS parse checked | Confirm the camera remains stable during cut-line and victory transitions at 30/60/144 Hz |
| 5 · Label/renderer parity | Exact WebGL matrix and interpolated 3D positions drive projected competitor labels; authority/HUD tick data exposed | Source logic and headless assertions added | Verify labels stay locked in recorded moving-camera frames and after tournament restarts |
| CI browser evidence | Push/PR workflow builds authority and runs Playwright screenshots, logs and metrics | Workflow queued; **not a browser pass** | Read artifacts and reject any rendering or clip-space mismatch |
| 7 · Volumetric impact | 3D fixed-point sphere overlap, vertical bounce momentum, airborne clearance above low obstacles | Tests committed, browser results pending | Confirm no phantom collisions and preserve 32-marble tournament balance |
| 10 · Replay/version integrity | New marble-physics-v3 authority/snapshot contract; old v2 snapshots explicitly rejected | Source/regression tests committed, CI pending | Validate restore/replay and migration story before merge |
| 9 · Champion reveal | Animated 3D gold-ring podium and orbiting crown placed around the real authority champion | Source check committed; browser screenshots pending | Blind-review readability, premium optics, scene occlusion and performance |
| 8 · Spring survival | Later-round electric bumpers, vertical launch and gameplay-backed event/VFX/audio | Tests committed, screenshots pending | Verify launch arc, audio timing, broadcast camera and competition fairness |
| 6 · Critic workstation | Local PNG/JPEG/WebP import, cryptographic A/B shuffle, manual winner/tie vote, gap notes and JSON export | Source implemented; browser UI check pending | Review independent critics' verdicts against real reference images; same-image smoke test is not a quality comparison |
| Lab | `/gauntlet.html` page, `/gauntlet-progress.json` status log, authority metrics refresh and sourced journal | Source exists, JSON shape checked | Run and screenshot dashboard + compare honest evidence |

**Unverified:** Visual parity, GLSL compilation on a live GPU, Playwright browser results, game stability, screen captures, comparative critic verdict, source-test pass in CI, and actual FPS on target devices.

**Still missing:** authoritative vertical 3D rigid-body simulation and collision, ramps/jumps as real physics, richer mechanical obstacles, cinematic replay system, audio and scene art maturity, long-session and accessibility evidence.

## Launch and view

From repository root on Node 22+:

```sh
npm ci
npm run build
node --test tests/foundation/marble-gauntlet.test.cjs tests/foundation/marble-3d-presentation.test.cjs
node games/marble-survival/scripts/serve-complete-runtime.cjs --self-test
node games/marble-survival/scripts/serve-complete-runtime.cjs
```

Open `http://localhost:4317/` for the actual game and `http://localhost:4317/gauntlet.html` for the live lab. Open both tabs on the same origin to observe broadcast FPS. If the actual arena falls back to Canvas 2D, FPS is intentionally unavailable, not fabricated.

The lab reads `/api/snapshot` every 2 seconds, source-backed progress JSON every 15 seconds, and live WebGL performance messages when a running arena tab is open. Iteration status is **explicitly committed to source**, not automatically asserted by agents or manufactured by the dashboard.

## Required next builder / critic cycles

1. **Run** the real server and inspect desktop + mobile viewport screenshots, video, shader compilation, authority/HUD parity, native frame time, FPS, and draw calls.
2. **Blind A/B:** strip brand labels; compare equivalent race camera scenes against the two reference games; have an independent critic pick the biggest perceptual/gameplay mismatch with evidence.
3. **Fix one judged gap**, add a focused regression check, update `gauntlet-progress.json`, capture before/after evidence and repeat.
4. **Keep authority honest:** presentation can decorate positions, but cannot fabricate a marble's outcome, obstacle collision or terrain height.
5. **Never close visual acceptance** on source checks alone. The user can stop the loop at any time.

## Repository safety

This Gauntlet branch is based on PR #38's isolated Marble implementation, not current `main`. Bring it into that PR's base branch after review, then resolve any divergence with current main separately. Do not blindly merge old game revisions over newer Eko or unrelated projects.

## Loop 5 findings

The original identity layer independently fetched state and reconstructed its own camera. That could make numbered competitor tags drift away from marbles during a cut-line or victory camera move, especially across slow frames or ramp elevations. The renderer now publishes its exact current public snapshot, interpolated marbles and WebGL view-projection matrix to the in-page overlay. The overlay projects labels through that same matrix and uses the same elevation. It retains a polling fallback if the renderer has not produced a fresh frame. The HUD and renderer now expose source-backed tick and arena identifiers for browser tests.

A new GitHub Actions workflow is triggered by pushes to the Gauntlet branch and pull requests against its Marble base. Its pass/fail result is independent evidence; it does not by itself establish visual parity with commercial references.

## Loop 6 — Manual blind comparison

The Gauntlet Lab now includes an on-device A/B critic workstation. Use actual game output from the browser evidence artifacts and a lawful reference screenshot at a comparable camera angle. It randomizes image A/B positions, hides identity labels until the vote and records the strongest visual deficiency. Critic votes and the optional note remain in local storage; use the JSON export to share review evidence. No images are uploaded, no score is manufactured, and merely using the tool does not count as an independent blind visual pass.

## Loops 7–8 — What changed and what remains

The original vertical physics implementation already had ramp heights, gravity and a vertical velocity field but its marble-to-marble collision ignored most height differences. Loop 7 preserves the planar solver for co-height contacts while using full fixed-point 3D sphere distances when two competitors differ in height; non-grounded vertical impulses are replay deterministic and capped. It also makes low blocks, sweepers and bumpers non-collidable when a marble's bottom has cleared their physical top. This does **not** make the entire level a rigid-body 3D world: upper-face contact and moving swept volumes are still incomplete.

Loop 8 builds gameplay atop those capabilities: selected bumpers in the later rounds have bounded, genuinely authoritative vertical launch speed; only an approaching grounded contact launches. The generated bumpers are visually distinguished in the WebGL scene. A new sanitized `marble-launched` authority event drives turquoise VFX, a spatial rising launch cue, and broadcast reporting. The state and presentation layer expose launch metadata without inventing outcomes. A later same-tick authoritative spring launch is retained over an earlier no-impulse overlapping contact in the bounded contact recorder.

**Versioning caveat for promotion:** the new collision model uses an explicit `marble-physics-v3` state/snapshot identity and strictly rejects stale `v2` checkpoints; no migration exists yet. Keep this in draft until downstream users can handle that incompatibility and restore/replay evidence is collected.

**Evidence caveat:** source test cases were committed but the real Node/Chromium suites have not been observed completing in this session. Do not infer 3D correctness or visual parity from their existence.

## Loop 9 — Champion showmanship

The WebGL director now renders a quality-scaled, three-dimensional gold-ring ceremony around a winning marble only when the authority explicitly reports a champion and a resolved/intermission lifecycle. It does not relocate or fabricate the winner. Record real output across normal and clean-feed variants before accepting the result.

## Loop 10 — Deterministic-version boundary

The 3D collision change invalidates the checksums/outcomes of historical v2 replays. The runtime now creates v3 states and v3 snapshots; restore refuses v2 checkpoints with an explicit version error. v3 snapshot roundtrip and stale v2 rejection tests were added. This is safer than silently claiming old races are replay-identical, but any existing persisted v2 operator checkpoint needs a deliberate migration or fresh tournament restart. Validation remains pending a completed CI run.

## Loops 11–14 — Visual rescue against the commercial bar

The reference screenshots demonstrate a specific shortfall in the old game: they show saturated environments, spectacular floating/circular structures, luminous backgrounds, strongly differentiated racing surfaces and legible short HUD information. Our old game had mostly grey rectangular panels and a dark sky; the criticism that it still looked basic was warranted.

**Inspectable reference frames:**
- The Quantum Astrophysicists Guild (publisher) visual: https://www.qag.io/images/marble-it-up-ultra/MarbleItUpUltraScreenshot4.jpg
- Gallery/game overview: https://marbleitup.com/
- Marble It Up! Ultra Steam media: https://store.steampowered.com/app/864060/

These are **quality comparisons**, not source assets to reuse. All new art is rendered from original shaders and procedural geometry.

| Pass | Source-level result | Next harsh critic gate |
| --- | --- | --- |
| 11 · Biome identity | Five distinct richly coloured scene palettes, exterior constructed landmarks, arc portals, sky monuments and lane lights | Can you identify the round with all labels hidden? Is there actual depth, colour, spectacle and visual hierarchy? |
| 12 · HUD visual rescue | Gradient header, 3D logo artwork, responsive colour-changing broadcast overlays, leaderboard treatments, real threat state, qualifying progress | Real 1920×1080 and 390×844 screenshots: text contrast, no horizontal scroll, no obscured leaders, at least 78% arena coverage on desktop |
| 13 · Atmosphere and materials | GPU sky gradient with clouds/star/haze/sun, 3D coloured fog, fine-checker procedural tiles | Confirm correct GLSL compilation, no flicker, no sterile uniform grey track, and reasonable hardware frame times |
| 14 · Kinetic spectacle | Angular crystal landmark mesh and stage orbital sculptures, throttled marble velocity streaks | Compare actual marble identity, visual motion, background richness and camera readability against official screenshots |

**Stop/go:** Source inspection and test assertions are **not** a real graphics critic. The 3D screenshots and performance tests have not been independently reviewed in this session. Keep this PR as a draft. Next iteration must prioritize in-browser capture, visual side-by-side critique and eliminating the largest observed weakness—not adding more arbitrary decorations.

**Render-budget rule:** `low` skips procedural sky detail and velocity trails and uses fewer monuments, `balanced` caps scene densities, and `high/ultra` are opt-in. No aesthetic comparison may assume an unavailable GPU. The authority simulation and official outcomes are unchanged by loops 11–14.

## Loops 15–18 — Physical 3D rescue and live spectator world

| Pass | Source-level delivery | Unclosed acceptance requirement |
| --- | --- | --- |
| 15 · Actual 3D holes | `arena-geometry.js` carves a tiled WebGL deck around valid authoritative pit rectangles; the 3D render models deep reactor floors, four inner walls, warnings and quality-tiered moving glow | Inspect real pit screenshots to ensure deck cutouts and inner walls align perfectly; the **authoritative pit still eliminates on entry** instead of using a falling-body simulation |
| 16 · Character finish | Dual studio softboxes, stage-tinted environment rim, ground-elevation-aware softened shadows; live spectator marble dossier with number, archetype, progress, measured movement and mobile support | Compare marble identity, glass clarity, lighting, rolling movement and silhouette against the high-quality commercial reference; no invented competitor traits |
| 17 · Arena signage and finishing | Real Canvas2D-generated `gl.TEXTURE_2D` scoreboard displayed **inside the 3D world**, fed from public arena/round snapshots; glowing torus finish-gate geometry | Verify texture orientation, perspective legibility, eventual scoreboard update, device memory and ring occlusion in real captures |
| 18 · Test what is actually visible | Actual screenshot-pixel hue/saturation/luminance gate added to Playwright, plus Node-compatible pure-geometry cases and VM-driven all-stage renderer smoke | Gather GitHub Actions Chromium artifacts and blind reference votes; mocked WebGL execution proves JS logic, **not shader compilation, device FPS or premium visual quality** |

**Executed this turn:** Seven actual geometry unit cases were run in a JavaScript harness and passed. An instrumented mock-WebGL runtime executed the WebGL render path for all five stage types, including one illuminated pit, a public live 3D billboard texture upload, and the final championship; all five completed without a JavaScript exception. In the mocked renderer, Balanced consumed ~219–225 mesh draws and Ultra Championship ~403; **these numbers are simulated counts, not measured device performance**.

**Outstanding highest-impact work:** Real WebGL2 compilation in Chromium, actual screenshot inspection and contrast critique, physical marbles descending into actual 3D holes, production-grade 3D colliders, sophisticated stage art and hero models, reference A/B and long-session soak. No Gauntlet completion or release quality is asserted.

All geometry, public billboards, spotlight/cinema interactions, effects and art remain presentation-only and never inject marbles, votes, winners or movement into the deterministic authority.

## Loops 19–21 — Real gravity through the track, character by character

The earlier dramatic reactor well was only a **visual cavity**; elimination occurred upon entering the zone regardless of height. In loop 19 we changed the authoritative simulation so an unshielded marble detaches from the missing floor and accumulates signed negative elevation under integer/fixed-point gravity. It is eliminated only when its centre reaches the depth of the actually modelled reactor floor (model depth 780 mm minus marble radius 280 mm). A competitor travelling *above* the cutout can cross safely, and a protected racer consumes a shield at the lip without client-side teleportation. Falling marbles lose ground-supported shadow and stop colliding with above-ground machinery while well below the surface.

**Replay version:** Physics outcomes now use `marble-physics-v4`. This intentionally refuses all older v3 checkpoints because they would silently replay old immediate-pit eliminations under the new falling simulation. The snapshot validator accepts signed height only inside a real pit to prevent corrupt state injection. Mid-fall save/restore tests have been added; production migration for existing tournaments remains an open release gate.

Loop 20 adds a once-per-entry `marble-pit-falling` event, saved within the deterministic state, exposed only through the sanitized presentation event map. The crowd hears a descending audio cue and sees the fall ticker and reactive reactor effects derived from that **actual** authority event; airborne competitors cannot generate it.

Loop 21 adds distinctive 3D character silhouettes tied to actual archetypes and marble velocity: navigating instrument halos, sprinter turbine fins, bruiser armour and survivor shield rings. These visual models are budgeted by the graphics quality tier and do not change the sphere colliders. Industrial obstacles now have layered armour, emissive vents and bold silhouette parts instead of uniformly grey blocks.

**Evidence:** The previous 5-stage VM render smoke suite passed 9 of 9 cases against current GitHub source, and the existing visual-source suite passed 9 of 9, with post-check additions parsed as JavaScript. The real TypeScript build and WebGL2 screenshot job are still not observed completing. These are *not* evidence of parity with Marble It Up! Ultra; continue judging against real frames, not pass counts.

## Loops 22–27 — Prove the spectacle, not just the shaders

These six passes target the recurring criticism that the environment is plain, characters lack detailed identity and the palette/interface feels lifeless:

| Loop | Actual implementation | Quality critic |
| --- | --- | --- |
| 22 · Racer materials | Multiple sphere LOD meshes up to 50×72 quads, internal glass detailing, dedicated feathered shadow shader. Recovered a **real regression** where the shadow edit removed the four-archetype drawing routine. | No broken runtime symbols; translucent shadows soften with true airborne height and disappear above real 3D holes. |
| 23 · Living stadium | One-draw `gl.POINTS` spectator cloud; 64/320/660/1100 points by quality; stage-tinted lighting, animated human wave and winner excitement tied solely to official competition. | Must look like an inhabited stadium without thousands of uniform calls/draws. |
| 24 · Course integrity and wind | A `solidLineSegments` topology planner breaks 3D LED edge lines around real pits. A sanitized real wind-zone vector feeds animated directional energy geometry and the live HUD. | 3D track markings may not float over voids; arrows must reflect the actual solver force vector. |
| 25 · 3D machines | Factory ramps re-sculpted with explicit steel bases, slope-following rails and velocity markings; launching bumpers now have layered electric coil/ring geometry. Short CSS stage-title reveal only on official arena ID change. | Physical geometry must correspond to authoritative gameplay rather than generic decorative clutter. |
| 26 · Cinematography and runtime budget | Camera has velocity look-ahead and a separate spectator-only, low-angle lens when Cinema Mode is chosen. Balanced GPU render scale recovers cautiously under sustained low FPS, while High and Ultra remain manual. | Exact frame-matched identity overlay, stable visibility, and 30/60 Hz frame-rate behavioural acceptance. |
| 27 · Kinetic race energy and tougher critic | Actual momentum drives continuous, tapering WebGL glass-racer ribbons. Playwright image-gate now requires average luminance >30, saturation >0.16, colourful pixel fraction >0.10, dark pixels <0.72, and ≥15 mean-RGB separation across stages. | These are *proposed* hard screenshot thresholds, not achieved scores; actual browser execution and blinded official-reference comparison remain pending. |

**Verification performed while authoring:** The renderer smoke suite exposed a genuine `ReferenceError: drawArchetypeAccents is not defined` across all stages; the missing function was restored from earlier GitHub history. Following the fix, **12/12 mocked-WebGL scene-path tests passed**. The pure track/geometry tests passed **10/10**. The visual source regression suite passed **14/14** before its latest velocity-camera test addition (which still requires rerun). These are isolated JavaScript test-harness executions, **not** a full Node/TypeScript build, real WebGL shader compilation, observed GPU FPS or commercial image match.

**Open blockers:** GitHub Actions jobs remain queued; no completed native Chromium captures have been reviewed. The visual asset system is still procedurally modelled rather than commercial-grade handcrafted meshes/materials. Independent A/B review, pit side-wall physics, deeper rigged animations, lighting calibration, desktop/mobile performance testing and an end-to-end tournament soak remain mandatory. PR #45 must remain draft until proof exists.


## Loops 36–41 — Third-dimensional scene rescue, antialiasing and longevity

Real Chromium screenshots of earlier builds clearly showed empty, almost monochromatic raceway surfaces overwhelming the broadcast image; the game did not reach the `Marble It Up! Ultra` reference. These six passes implement a larger physical 3D visual world while **leaving authority, marbles, physics, winners and selected camera targets with the tournament server**.

- **36 — Stadium-visible shot and five hero monuments.** A lower, farther broadcast lens shows the sidelines and horizon. New giant angular-gyro, cyber gateway, triple-forge, observatory and royal crown architectures lie safely outside race collision world.
- **37 — Safer premium optical finish.** Offscreen WebGL2 RGBA8 colour/depth targets apply selective neon light diffusion. The post fragment shader includes four-neighbour FXAA-inspired smoothing because offscreen colour texture MSAA cannot be assumed. All effects are skipped on Low, and incomplete FBOs fall back to direct rendering. This is **LDR postprocess**, not HDR and not a proof of commercial polish.
- **38 — Procedural 3D parallax horizon.** Cached mesh ridges behind the stage distinguish the silhouettes and colours, tiered by hardware quality. Old vertex buffers and VAOs are disposed at each biome swap.
- **39 — Browser screenshot critic resists false positives.** Each real captured WebGL frame must expose the correct 3D stage monument ID, hundreds of original stadium modules, actual horizon triangle counts, crowd and spotlights, active postprocessing, and a clean GPU error state alongside luminance/saturation checks.
- **40 — Long-session GPU resource audit.** The same instrumented renderer traverses every official biome without recreation, verifying per-stage geometry replacement, restored scoreboard identity, bounded render-path state and real freeing of expired buffer objects rather than accumulation across tournaments.
- **41 — Physically grounded prop detail and vivid surfaces.** Industrial obstacles and electric bumpers gain soft contact shadows only on solid track; five distinctly saturated floor colours make each championship phase more legible.

**Executed:** 15/15 instrumented renderer-path tests against the current GitHub source, including complete stage cycling without a renderer restart, passed. The visual source suite passed 19/19 in an isolated JS test harness before final track colour tweaks. Prior native CI had passed the TypeScript build and 116/116 Marble foundation tests, but new WebGL shaders still require fresh **actual Chromium** confirmation. Browser jobs are queued; do not call visual parity achieved. PR remains draft.

## Loops 52–54 — The screenshot-and-performance Gauntlet (2026-10-09)

**Evidence-first critique:** GitHub Actions Chromium run [37896488921](https://github.com/my-edutu/Ai_games/actions/runs/37896488921) completed real TypeScript build, foundation regressions and server self-test successfully. It recorded true WebGL2 pixels at desktop/mobile sizes, proving arena geometry, lights and crowd existed without GPU errors. It also **failed** its software performance gate: 90 recorded frame intervals, SwiftShader Low **p50=150ms / p95=200ms**, where the required p95 is below 140ms. Review of the real screenshot shows a camera-facing 3D foreground stadium wall and too much unreadable single-colour race surface, not a premium 3D shot.

**Loop 52: Fix physical visibility.** Removed the near-side exterior stadium wall from the 3D architectural batch, keeping the far wall and physically coherent side grandstands. Lowered the 32-racer overview camera from an overhead near-top-down look to a broadcast crane, retaining its focus exclusively on actual authoritative competitors and preserving the same projection for WebGL marbles and screen-space identity labels.

**Loop 53: Reduce actual scene work.** Low graphics now avoids decorative skyline and stand passes while preserving collision-relevant track/obstacle/ramps, the real 3D environment, public events, stadium scoreboard and the authority camera. Reduced Low pixel scale from 0.58 to 0.48. Added an original GLSL300 instanced coloured/patterned marble shader, using `gl.drawElementsInstanced` to draw the entire live competitor field in **one draw call** rather than repeating expensive glass meshes. Per-competitor glass shaders remain on Balanced, High and Ultra. The isolated JS mock recorded **129 Low 3D mesh draw calls versus 310 Balanced** (58.4% fewer direct mesh calls) with one extra instanced draw for Low; this is **not** a measured SwiftShader framerate.

**Loop 54: Return the screen to the competition.** Added a real mobile scoreboard toggle: three contender rows by default, expandable to all real standings, keyboard accessible with `aria-expanded`, and verified from Playwright scenario assertions when the next native CI run executes.

**Test status:** 20/20 isolated WebGL source-execution tests passed. Visual/source-contract checks also pass in an isolated harness. **Full native Chromium and no-compromises commercial visual acceptance are still open**; the newly queued Actions run must produce fresh real screenshots and a measured software p95 below the current 140ms gate before this iteration can pass. PR remains draft.
