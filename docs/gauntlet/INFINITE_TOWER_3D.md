# Infinite Tower Climb — 3D Gauntlet

Status: **active improvement, not yet independently approved**  
Benchmark: DON'T NOD's **Jusant** official gameplay and screenshots; secondary gameplay references: **Chained Together** and **PEAK**.  
Project: `my-edutu/Ai_games` → `games/infinite-tower-climb` and `public/infinite-tower-climb`

## Goal and authoritative boundaries

Build an original, cinematic, fully 3D autonomous tower-climbing game with expressive characters, animated traversal, visually distinct biome floors, tactical encounters, readable level geometry, and strong streaming presentation. Preserve seeded fixed-step simulation, immutable render snapshots, deterministic replays, transparent audience influence, and existing recovery behaviour. A graphical improvement must not change game outcomes.

## Live review

Run `npm ci && npm run build && node scripts/serve-tower-stream.cjs --port=4176`.

- Live game: `http://127.0.0.1:4176/tower`.
- Live progress and blind first-pass A/B: `http://127.0.0.1:4176/tower/gauntlet`.
- Deliberate original renderer baseline: `http://127.0.0.1:4176/tower?renderer=2d`.
- Clean livestream source: `http://127.0.0.1:4176/tower?cleanFeed=1`.
- Ledger: `public/infinite-tower-climb/gauntlet.json`.

The side-by-side page compares the same live simulation viewed through the original and replacement renderers. It is **not** a Jusant comparison. For the actual external quality gate, a separate critic must bring official Jusant screenshots/gameplay captured from a corresponding camera distance and lighting condition and rate the original output without knowing which side is which when feasible.

## Initial independent improvement lanes

These are improvement lanes, not a rigid architecture or a required number of rounds.

| Lane | First implementation | Completion evidence |
| --- | --- | --- |
| Tower environment | Actual 3D stage, multi-plane shaft, materials, atmospheric fog, lights and biome dressing | Full-size gameplay capture, look/lighting/geometry score against Jusant |
| Character | Articulated humanoid climber tied to authority position and facing | Up-close motion footage, silhouette/anatomy and movement comparison |
| Enemies and obstacles | 3D hazard models, enemy rigs, projectiles and pickups generated from immutable snapshots | Screenshot and gameplay event correspondence |
| Autonomous runtime | Original simulation untouched | Test suite, replay/determinism/self-test results |
| Streaming and fallback | 3D WebGL with 2D baseline/fallback | Desktop + mobile, lost/unavailable GL graceful recovery |
| Critic feedback | Snapshot-driven screenshots and a versioned review dashboard | Independent critique, one largest gap, builder revision and retest |

## Round 1 ledger

**Builder output:** Added a Three.js scene that consumes public snapshots without mutating gameplay; local pinned-module serving; articulated character; distinct biome set dressing; actual 3D platform meshes, enemies, hazards, pickups and projectiles; moving cinematic camera; renderer fallback; a live A/B progress page; and Playwright screenshot and negative-path tests.

**Lead's code review:** The simulation logic is unchanged; 3D transport remains same-origin with the package's pinned Three.js dependency; no private seed/run id is used in the client scene. The authoritative platforms, player and entities remain sourced from `TowerRenderSnapshot`, not recreated independently.

**Critic verdict:** **UNVERIFIED.** A separate, fresh-context visual critic has not yet run the game or performed an official Jusant screenshot comparison. Source inspection is not an adequate substitute. The new geometry and primitive-based character rig are not evidence of AAA-quality modeling.

**Likely largest visible gap to investigate on the next real screenshot:** character rig and animation sophistication (currently an articulated procedural rig, not authored hero-quality character art). This is a hypothesis to be validated by the screenshot critic, not a pass/fail judgment.

## Required ongoing loop

1. Select the strongest independently judgeable remaining visual or gameplay gap.
2. Assign an independent builder and a fresh-context critic; have the critic review captured gameplay, not the builder's prose.
3. Capture desktop 1920×1080, portrait/mobile, and clean feed; record frame stability, camera, lighting, silhouettes, environmental variety, collision truth and spectator readability.
4. For the visual gate, compare real rendered frames and actual climbing footage directly against appropriate official Jusant reference; conceal A/B labels where feasible and document the source.
5. Name **one highest-impact shortfall**, give it back to the builder, implement, capture again, and log the evidence under the next round. Avoid fixed iteration limits.
6. Stop only when the independent critic can demonstrate the bar has been reached across the actual running game, or the operator explicitly stops. Passing tests is necessary but not sufficient.

## Acceptance thresholds for each round

- A playable, non-black 3D WebGL canvas when browser support exists, verified through browser inspection and nonzero draw/triangle metrics; legacy 2D display when WebGL fails.
- No private authoritative data exposed in the public render snapshot.
- No simulation changes attributable to camera, interpolation, animations or presentation.
- CI build, tower stream self-test, and Playwright desktop/mobile/recovery captures pass.
- On comparable real screenshots, an independent blinded quality review can show progression; no speculative victory claims.

## Commands and artifacts

```bash
npm ci --no-audit --no-fund
npm run build
npm run tower:stream:self-test
npm run test:browser
```

Browser test artifacts are written under `artifacts/tower-phase3/`. CI publishes them as the `infinite-tower-climb-phase3-capture` artifact. Browser GPU support may vary; fallback is an intentional supported mode but is not proof that the 3D milestone passed.

## Operational rollback

The original 2D renderer is preserved at `/tower?renderer=2d`. If GPU creation or the ES module fails, the browser attempts to continue on 2D automatically. If the new presentation degrades live broadcasts, route operators to the 2D URL; the original authority and public snapshot remain unchanged.

## Next code review and visual critique

Await the first Chromium artifact. Compare physical character footprint, platform legibility and camera framing against the old renderer, then compare the strongest actual frame against official Jusant. Record an honest verdict and keep looping.
