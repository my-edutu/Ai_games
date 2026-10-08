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
