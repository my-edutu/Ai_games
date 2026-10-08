# AI Battle Royale — 3D Gauntlet Loop

**Branch:** `gauntlet/battle-royale-3d-broadcast-v1`  
**Starting implementation:** `agent/game-6-ai-battle-royale-phases-2-6` (software-candidate gameplay and 2D broadcast)  
**Goal:** complete, original, autonomous, visually exceptional 3D battle royale built on the existing deterministic rules.

## Benchmark

**Primary:** official Fortnite Chapter 4 UE5.1 screenshots and running gameplay; recreate comparable camera framing, environment density, surface fidelity, lighting, depth, action readability and cinematic composition in *our own original art*. Secondary references: Apex Legends character differentiation, Warzone combat response, THE FINALS environmental interactivity, and PUBG survival pacing.

Reference URLs:

- https://www.fortnite.com/news/drop-into-the-next-generation-of-fortnite-battle-royale-powered-by-unreal-engine-5-1
- https://www.fortnite.com/news/welcome-to-fortnite-battle-royale-chapter-4-season-1

**Do not claim victory from similarity by assertion.** Critic must inspect the running candidate, same-composition captures and unedited full matches; use blind randomized A/B review with independent human reviewers. Record winning selections, reviewer sample size, viewport, source, seed, camera, GPU, frame-time budget and open gaps. Never copy Fortnite assets.

## Viewer promise and art direction

Viewers watch intelligent autonomous contenders survive an increasingly lethal 3D arena and return for surprising tactics, decisive fights, individual identities and unexpected champions. Differentiators: autonomous AI decisions are visible and explainable; replayable and fair outcomes; cinematic hands-free OBS coverage.

- Shape language: readable original role-specific silhouettes and consistent physical geometry.
- Color hierarchy: zone danger > elimination/important combat > fighter identity > loot > atmospheric decoration.
- Camera: stable broadcast overview, bounded intense action closeups, clear final-circle escalation. Never hide the decisive event.
- Modes: full broadcast; clean 16:9 feed; 2D compatibility fallback; reduced-motion, reduced-flash and muted captions.
- Forbidden shortcuts: fake gameplay footage, copyrighted models, scripted wins, unexplained hero rescues, misleading production claims, or non-deterministic authority.

## Gauntlet phases and hard gates

| Gate | Measured output | Current |
| --- | --- | --- |
| Functionality | Autonomous complete matches, real state snapshots and safe spectator feed | Existing game software on feature branch; not production validated |
| Native 3D viewport | GPU-backed depth, mesh scene, 3D obstacles, loot and world; reversible 2D mode | Implemented on branch; browser CI pending |
| Character identity | Original per-archetype detailed modeled/rigged characters, movement cycles, aim/reload/recoil/hits, accessories, expressive reactions | **Not met**; initial procedural humanoid primitives |
| World quality | Authored terrain/structures, believable materials, atmospheric lighting, landscape detail, shadows, weather, multi-biome and destruction | **Not met**; first-pass procedural stage |
| Combat spectacle | Visible weapon/action types, recoil/impact responses, tracers, audio, danger telegraphs, decisive elimination VFX | **Not met**; limited semantic rings |
| Cinematic spectator | Stable multi-shot action direction, kill replays, adaptive camera and safe-zone emphasis | **Not met**; bounded final-circle focus only |
| Presentation | Readable 4K/1080p HUD, mobile stream capture, subtitles, visual accessibility and no secret/state leakage | Prior 2D foundation exists; 3D capture pending |
| Performance | p95 CPU submit <=8 ms and p95 frame <=16.7 ms at representative 1080p 60FPS hardware (measure actual GPU before claiming); bounded memory and resource cleanup | CPU submit telemetry added; no benchmark evidence yet |
| Reliability | Context loss fallback/restore; sustained gameplay, GPU soak, OBS capture, 72-hour elapsed endurance and recovery | Fallback code present; real endurance not yet run |
| Visual bar | Five-or-more blinded independent reviewers consistently select our frame/footage in matched reference comparisons | **Not met**; no external review evidence |

## Actual work performed

- **Loop 0**: inspected existing authoritative simulation and top-down Canvas browser source; selected working Game 6 feature branch, not incomplete default-main directory.
- **Loop 1**: native WebGL2 renderer with 3D geometry, themed floor, collidable obstacle *depictions*, visible cover, units, loot, zone boundary and perimeter towers. No third-party runtime dependency.
- **Loop 2**: optional 2D fallback on WebGL failure/context loss and explicit `?visual=2d`; side-by-side `/battle/gauntlet` page and a first static + browser test contract.
- **Loop 3**: cosmetic per-fighter movement interpolation driven by consecutive immutable snapshots; restrained final-circle camera; semantic elimination/shield ring visuals; 90-frame bounded p95 CPU-submit telemetry. Presentation cannot alter the state checksum.

`/battle/gauntlet` fetches operational progress every 5 seconds; its quality ledger must only reflect verified improvements. Comparison frames on the dashboard are **not a substitute for independent blind reviews**.

## Next priority review tasks

1. **Critic (fresh context):** inspect desktop and mobile Chromium captures, real live stream recording and official primary benchmark. Identify one largest perceptual gap, no invented scores.
2. **Builder:** address that single largest gap in a visual or behavioral slice, with a focused failing test and recorded before/after capture.
3. **Independent critic:** rerun blinded A/B and full-match inspection, compare actual outputs, record verdict and next largest defect.
4. Repeat while resources and session remain available; never declare victory without independent evidence. Reviewers must be different from the corresponding builders.

Parallel worker orchestration through the connected coding workspace could not start because its tool tunnel was unavailable during these commits. **No independent reviewer, actual browser screenshots, CI pass or long-running autonomous worker is claimed until observed.**

## Run, verify and roll back

```bash
npm ci
npm run build
npm run battle:stream
# open http://localhost:4176/battle and http://localhost:4176/battle/gauntlet
npm test
npm run battle:stream:self-test
npm run test:browser
```

Use `/battle?visual=2d` to disable the 3D layer instantly if a browser/GPU is unsupported; this never alters outcomes. Roll back this branch independently of the underlying R4 candidate if stream capture or performance fails.

**External production readiness:** remains blocked by the existing exact-candidate R5 gates; this document authorizes no release.


## Critic pass — captured real Chromium output, October 8

Reviewed the real `webgl3d-desktop.png` from [GitHub Actions run #37745187741](https://github.com/my-edutu/Ai_games/actions/runs/37745187741). At this point it showed a working 3D scene with fighting characters, tactical structures, genuine event cues and a live closeup. It was **not visually competitive with Fortnite Chapter 4**: the terrain read as a dark uniform board, architecture was repeated primitive blocks, the cinematic inset obstructed the battlefield, and characters lacked professional skinned animation, textures, facial rigs and believable equipment.

**Biggest observed gap:** the stage and people still read as a procedural toy battlefield rather than a living high-production-quality 3D world. This is a self-review grounded in an actual screenshot, **not** a blind independent critic pass, and there is no A/B win claim.

## Subsequent loops: 7–15

- **7 — Framing and material response:** atmospheric fill/rim lighting, procedural surface microtexture, warmer sky background, compact cinematic inset positioned in unused upper screen space; fixed CI's stale dashboard-verdict expectation.
- **8 — Environment design:** unique 3D terrain marks, ground vegetation, debris, concrete fortification details, thematic horizon props, architectural detailing. All new ground/sky props remain visual only.
- **9 — Character expressiveness:** authored procedural rig-style geometry now faces known attackers, targets and movement direction; bounded facing cache resets on new match.
- **10 — GPU budgeting:** static arena geometry is uploaded once per immutable arena fingerprint; dynamic combatants/effects/loot update in a separate GPU buffer. Context restoration invalidates the GPU cache. The dashboard and unit/browser tests inspect the static mesh rebuild count.
- **11 — Honest winner cinematic:** show a 3D ceremonial motif and champion focus only when a game result declares a real winner, never on technical failure. Spectator labels identify real combatants.
- **12 — Stream robustness:** prevent overlapping asynchronous match-state fetches; slow-network browser regression added.
- **13 — Meaningful fighter identities:** show the focused contender's public weapon, ammunition, medkits and AI confidence in the broadcast panel; no hidden model or operator fields.
- **14 — Accessibility and performance:** optional `?quality=low` reduces decorative GPU geometry, preserving full simulation, safe-zone representation and contenders.
- **15 — Distinct environments:** biome-specific palm trees, crystalline energy pylons and snowy conifers beyond playable boundaries; focused screenshot CI workflow.

### Evidence gates

| Evidence | Status |
| --- | --- |
| Baseline 3D renderer Chromium CI | **Passed** on `97550ec` |
| Real browser frame of loop 6 | **Inspected**; recorded above |
| Focused native WebGL synthetic harness after mesh caching | **Passed** (two viewport passes, static scene rebuilt once) |
| All loop 7–15 GitHub CI/browser tests | **Pending until exact-head run finishes** |
| Blind reference comparison using independent reviewers | **Not run** |
| High-poly assets, authored animation, AAA benchmark superiority | **Not achieved** |
| 24/7 production GPU/OBS streaming evidence | **Not run** |

The gameplay authority remains unchanged. There is no 24/7 autonomous code-editing worker running: continue iterations during actual coding sessions or in a user-authorized persistent agent workspace. Keep this record truthful.

### Focused screenshot loop

```bash
npm ci
npm run build
npm run battle:stream
npx playwright test tests/browser/battle-royale-3d.spec.cjs --workers=1
```

Inspect `artifacts/battle-gauntlet/` and GitHub Actions' `battle-royale-gauntlet-current` artifact. Compare fixed-state `matched-baseline-2d.png` against `matched-candidate-3d.png`, and the new high-vs-low quality captures. These confirm visual behavior and performance tiers, **not** AAA reference superiority. R5 remains separately blocked by real production evidence.

## Loop 16 — 3D camera correction

The first 3D viewport used 3D geometry projected with an orthographic isometric camera. To move away from the prior 2.5D impression, the lead agent updated the WebGL2 camera to explicit yaw, pitch and perspective division using real mesh depth. The stable overview and action inset now use different physical viewpoints. Autonomous camera motion is reduced when reduced-motion is requested. This is not proof of a AAA camera: screenshot comparison, occlusion review and GPU frame timing for the exact revision remain mandatory. The focused WebGL2 regression workflow records desktop 3D, exact-state high/low, and baseline comparisons when CI completes.


## Gauntlet loops 22–29 — visual production pass

**User criticism:** the renderer had recognizably simple board-like scenery and dull stream interface colors compared with Fortnite-quality visual references. Prior real screenshot was used as the critic's starting evidence (not as a claim of current visual success).

### Implemented changes
- **22 — Premium broadcast design:** `ux-v3.css` introduces intentionally saturated sapphire/cyan/violet/magenta/lime/amber esports hierarchy. Branded on-air masthead, survivor hero card, separated tactical metrics, contrasting focused fighter, scoreboard/event feeds, captions and camera status. Responsive 16:9, small landscape and OBS clean feed remain supported.
- **23 — Color/lighting:** brighter original ember/neon/arctic world palettes, stronger ambient/fill/rim color, less gray depth haze and clearer materials in WebGL fragment shading.
- **24 — World dressing:** added original cybercity skyline with lit windows, arctic ice shelves, ember badlands, road markings, landing pads and perimeter gantries. Geometry is cached; cosmetic only.
- **25 — Weather:** bounded procedural snowfall, neon rain and cinders derived from biome, with reduced-motion and low-quality controls.
- **26 — Grounded environments:** expanded biomes into lower 3D terrain surrounding the arena, with scenic hills, connecting roads, cliffs and stage edges, replacing the previously isolated dark tabletop presentation.
- **27 — Dynamic UI color:** theme-specific accents now follow the currently published biome rather than a generic permanently turquoise UI. High-contrast mode remains explicit.
- **28 — Directional shadows:** added stable low ground shadows for legitimate barricades and pose-aware characters to improve depth/readability; these are mesh decals, not a true engine shadow-mapping system.
- **29 — Audio correction:** normalized procedural sound noise into the intended bipolar range; WebAudio no external downloads.

### Safety and benchmark discipline
No environment dressing, cosmetic shadow, UI display or audio function can change agent actions, damage, map collisions, RNG state, winner selection or authoritative replay. Terrain beyond the map is labeled in code as **out-of-bounds decorative geometry**, not new traversable game space. Assets remain original procedural code-generated meshes, not imports from Fortnite.

**Execution evidence:** all targeted new source files parsed; local source-backed static acceptance contracts for v3 routing, biome weather and terrain expansion passed in an isolated harness. Exact-head GitHub Actions desktop/landscape/clean-feed screenshot suites and broader tests must run before this branch can be considered tested. No independent A/B comparator or 24/7 soak was run.

### Critic's next largest gaps
1. Actual new screenshot vs Fortnite Chapter 4 UE5 reference: high-poly authored characters, texture detail, lighting and animation remain nowhere close; do not claim wins.
2. Authoring new scene assets/rigging with original materials/meshes that are not just deterministic primitive geometry.
3. Validating the active stage and HUD readability on representative 1080p/4K OBS conditions and an automated multi-hour GPU memory/latency soak.

**Rollbacks:** `/battle?visual=2d` for rendering, `/battle?quality=low` for reduced geometry. Avoid merging the draft PR until real browser/production gates are satisfied.

## Gauntlet loop 30–32 — sculpted biome terrain and material uplift

- **Loop 30**: outside the real tactical grid, replace low flat tiles with a two-triangle-per-cell tessellated heightfield using deterministic sinusoidal ridges and genuine computed world-space normals. Terrain smoothly returns toward platform elevation near the grid border. Decorative terrain remains non-traversable; *agent navigation and collisions are unchanged*. Out-of-bounds visual flora/structures now settle on landscape height.
- **Loop 31**: fragment shading uses two scales of deterministic material-grain noise, a sun + bounce light, half-vector specular reflection with approximate varying roughness, colored rim light and restrained stylized emissive accents. Blend terrain tiles more coherently to reduce checkerboard imagery. It is an original stylized material, **not commercial physically based material assets**.
- **Loop 32**: original biome hero signatures designed outside the arena: suspended neon entrance/skybridge and twin towers, faceted glacier gateway/cathedral, rusted dual-tower badlands refinery with luminous overhead platform. They are unambiguously scenery; **not** new playable buildings.

**QA still required**: real browser shader compilation, exact-head CI, 1080p screenshot A/B, occlusion and mobile responsiveness, and independent Fortnite Chapter 4 visual comparison. Synthetic JS parsing and stub GPU tests are insufficient to claim production-grade rendered fidelity.
