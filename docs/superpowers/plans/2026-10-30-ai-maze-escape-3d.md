# AI Maze Escape 3D Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox syntax for tracking.

**Goal:** Deliver a complete 3D presentation of the existing autonomous maze with independently reviewed characters, world, spectator UI and a live progress page.

**Architecture:** Preserve the TypeScript authority and sanitized snapshot contract. Browser ES modules use the pinned Three package through explicit local asset routes. Separate original character/world builders from the renderer host, public HUD, presentation-only audio, and progress data.

**Tech Stack:** Existing Node/TypeScript simulation, Three 0.186.0, browser ES modules/CSS, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-30-ai-maze-escape-3d.md`

## Global Constraints

- Presentation consumes immutable public snapshots and cannot mutate authority or expose hidden state.
- Preserve other games, serialized polling, public recovery/result/restart semantics, and bounded resource cleanup.
- Use original assets, explicit self-hosted module routes and existing CSP.
- Preserve `#maze`, existing HUD test IDs, `__MAZE_PUBLIC_STATE__`, and `__MAZE_VIEW__` contracts.
- Captain Toad is the fixed deciding reference; only real output can support critic verdicts.
- The user authorized implementation and the builder/critic loop. No further design-approval pause is needed.

## Review Focus

- Polls can skip several turns: movement must follow observed traveled route edges, never cut through walls.
- Hidden or remembered cells: decorative geometry cannot reveal hidden topology, threats or the exit.
- Repeated runs/context loss: dispose the retired scene and rebuild from the latest public snapshot.
- Small viewports and reduced motion: protagonist, objective, captions and focusable controls remain legible.
- Missing WebGL/audio: visible fallback/retry state without stopping authority or accumulating polls.

## Task 1: Original animated characters

**Files:** Create `public/ai-maze-escape/characters.js`.

**Interfaces:** Import `./vendor/three.module.js`. Export `createExplorer()` and `createWarden()` returning `{group, update(options), dispose()}`. `group` stands at floor y=0, approximately 1.6 world units tall, fitting a cell of size 2.4. `update({time,delta,moving,heading,danger,result,reducedMotion})` receives seconds and a facing angle; the host owns world position. Models are original articulated groups with physically coherent material finishes, expression, walk/idle/result states and bounded cleanup.

- [ ] Build expressive complete explorer and threat models.
- [ ] Exercise both through the actual 3D host and capture close-up/motion evidence.
- [ ] Independent critic compares real output with fixed character reference; fix biggest gap.

## Task 2: 3D maze environment and objects

**Files:** Create `public/ai-maze-escape/world.js`.

**Interfaces:** Import `./vendor/three.module.js`. Export `CELL_SIZE=2.4`, `cellPosition(cell,width,height)` returning `{x,z}`, and `createMazeWorld()` returning `{group, update(snapshot), animate(time,options), dispose(), stats()}`. Coordinates are centered on grid dimensions: `(column-(width-1)/2)*CELL_SIZE`, `(row-(height-1)/2)*CELL_SIZE`; walk surface y=0. `update` accepts only MazeRenderSnapshot. Host owns camera/light and characters. Environment owns known floor/walls, decoration, water/terrain base, keys/doors/traps/checkpoints/clues/exit. Only disclosed cells/topology/entities may influence gameplay geometry.

- [ ] Build richly finished original ruin environment and semantic props from public knowledge.
- [ ] Use batched/reused geometry and dispose retired runs; remembered cells remain readable.
- [ ] Independent critic checks real ordinary/close/wide output and hidden-state handling; fix biggest gap.

## Task 3: Spectator interface, audio and progress page

**Files:** Modify `public/ai-maze-escape/index.html`, `styles.css`, `ux-v2.css`; create `audio.js`, `progress.html`, `progress.css`, `progress.js`, `progress.json`.

**Interfaces:** Keep existing DOM IDs consumed by app.js. Add buttons `camera-toggle`, `sound-toggle`, `motion-toggle`, `contrast-toggle`, `fullscreen-toggle`, and `feed-toggle`; add a `minimap` canvas and an accessible settings panel. All toggles controlled by host. `audio.js` exports `createMazeAudio()` returning `{setEnabled(boolean), update(frame), dispose()}` with user-gesture activation, event deduplication and bounded voices. Progress JSON contains truthful dated captures/reviews and reference URLs, polled without overlap by the separate progress page.

- [ ] Design game-first responsive layout with compact understandable objective, discovery, inventory and AI intent.
- [ ] Add accessible presentation controls and restrained original semantic audio.
- [ ] Build separate live progress view with explicit unknown/unreviewed states.
- [ ] Independent critic checks actual desktop/mobile/UI/audio output; fix biggest gap.

## Task 4: Renderer integration and verification

**Files:** Modify `public/ai-maze-escape/app.js`, `scripts/serve-maze-stream.cjs`; create `scene.js`, `map-view.js`, `tests/browser/maze-3d.spec.cjs`, `tests/phase3/maze-3d-presentation.test.cjs`, capture/evidence files under `evidence/maze-3d/`.

**Interfaces:** `scene.js` hosts Three, composed world/characters, camera, interpolation and performance/cleanup. It consumes existing public frames and publishes bounded renderer diagnostics. `map-view.js` provides pure public-view/route interpolation helpers importable by Node tests and browser. The server allows only named local module/assets and Three module files, without exposing arbitrary node_modules paths.

- [ ] Capture baseline and run baseline suite.
- [ ] Write failing browser/contract regressions for WebGL loading, public-knowledge rendering, route-aware movement, controls and context recovery.
- [ ] Integrate scene, controls/audio, minimap and safe fallback; run focused tests to green.
- [ ] Capture real desktop/mobile, character, danger, result/restart and no-WebGL output; measure bounded resources.
- [ ] Fresh reviewers inspect actual game, reference comparisons and diff. Repair findings and recapture without a preset round limit.
- [ ] Run affected full verification, commit coherent changes, and make the branch and evidence reviewable. Keep unresolved quality gaps explicit.
