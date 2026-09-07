# Infinite Tower Climb Cinematic Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn Infinite Tower Climb into a visually deep, route-aware, broadcast-ready autonomous tower ascent while preserving deterministic simulation rules and low-end compatibility.

**Architecture:** Keep authoritative state, physics constants, collision geometry, RNG and persistence independent from presentation quality. Improve AI using deterministic risk-ranked reachable platforms; expose only state-derived route/zone metadata to presentation; render a procedural multi-layer tower in Canvas 2D with bounded detail budgets; synthesize bounded Web Audio cues without feeding anything back into simulation.

**Tech Stack:** TypeScript simulation/presentation modules, Node `node:test`, browser Canvas 2D, Web Audio API, Playwright browser tests, existing GitHub Actions pipeline.

**Spec:** User request in the review conversation, grounded against `polish/tower-maze-2026-09-07` head `665981b80b69fb09c6ea349bd00401911c5de449`.

## Global Constraints

- Do not change graphics quality in any way that can alter physics, AI decisions, RNG, scoring, collision, persistence or game outcomes.
- Preserve the current movement envelope and gameplay distances unless a failing behavioral regression demonstrates a correctness problem.
- Public AI reasoning must be concise, state-derived summaries; never expose or fabricate hidden chain-of-thought.
- All procedural visual detail is bounded and non-collidable.
- Low quality must remain readable and stable; Ultra must cap render pixel budgets rather than allocate unbounded 4K+ buffers.
- No automatic merge.

---

### Task 1: Deterministic safer route selection

**Files:**
- Modify: `games/infinite-tower-climb/src/ai/observation.ts`
- Modify: `games/infinite-tower-climb/src/ai/graph.ts`
- Modify: `games/infinite-tower-climb/src/ai/policy.ts`
- Modify: `tests/phase2/tower-ai.test.cjs`

**Interfaces:**
- Produces `TowerObservation.platforms[].vx` as observed horizontal platform velocity.
- Produces `rankTowerPlatformRoutes(observation, config, currentId)` returning stable route candidates with integer risk metadata.
- `nextTowerPlatform` remains backwards compatible and returns the top-ranked platform.

- [ ] Write failing tests proving an active hazard can make a later reachable platform preferable and equal inputs produce identical route rankings.
- [ ] Run the Phase 2 Tower AI test and verify the new assertions fail because route-risk ranking does not exist yet.
- [ ] Add observed moving-platform velocity and stable risk ranking using only current observation data.
- [ ] Update policy summaries to state when a safer route is selected; keep summaries short and causal.
- [ ] Run Tower AI tests plus the deterministic content campaign.
- [ ] Commit the AI slice.

### Task 2: Zone-scale tower presentation contract

**Files:**
- Create: `games/infinite-tower-climb/src/presentation/environment.ts`
- Modify: `games/infinite-tower-climb/src/presentation/snapshot.ts`
- Modify: `tests/phase3/tower-presentation.test.cjs`

**Interfaces:**
- Produces `towerEnvironmentForFloor(floor)` with stable `id`, `name`, `material`, `structure`, `atmosphere`, `epoch`, `localFloor`, `span`.
- Adds `snapshot.zone` and `snapshot.intent.targetPlatformId`; neither enters `authorityChecksum`.

- [ ] Write failing presentation tests proving zone identity persists across a floor band, changes at its boundary, and target platform ID is exported only from current AI state.
- [ ] Run the targeted presentation test and observe the missing-contract failures.
- [ ] Implement six deterministic architectural zones with an eight-floor span and epoch variation.
- [ ] Add the zone and target route fields to the immutable public snapshot while preserving authority checksum semantics.
- [ ] Run presentation/platform/privacy tests.
- [ ] Commit the presentation-contract slice.

### Task 3: Route-aware cinematic camera

**Files:**
- Modify: `games/infinite-tower-climb/src/presentation/camera.ts`
- Modify: `tests/phase3/tower-presentation.test.cjs`
- Modify: `tests/phase3/game-feel-regression.test.cjs`

**Interfaces:**
- Camera continues returning `centerX`, `centerY`, `zoom`, `impulse`, `lookAheadY`.
- Route target is read from `snapshot.intent.targetPlatformId` and `snapshot.platforms`.

- [ ] Write failing tests proving the camera leaves more space above when the actual target platform is above the climber and follows a fast fall without excessive impulse.
- [ ] Run the camera tests and verify RED.
- [ ] Blend bounded route lead, velocity lead and fall lead into the existing absolute-coordinate camera director.
- [ ] Preserve reduced-motion behavior and existing high-floor coordinate regressions.
- [ ] Run all Tower camera/presentation regressions.
- [ ] Commit the camera slice.

### Task 4: Procedural tower renderer and quality presets

**Files:**
- Modify: `public/infinite-tower-climb/app.js`
- Modify: `public/infinite-tower-climb/index.html`
- Modify: `public/infinite-tower-climb/ux-v2.css`
- Modify: `scripts/serve-tower-stream.cjs`
- Modify: `tests/phase3/game-feel-regression.test.cjs`
- Modify: `tests/browser/tower-stream.spec.cjs`

**Interfaces:**
- Query `quality=low|balanced|high|ultra|auto` controls presentation only.
- `window.__TOWER_RENDER_DIAGNOSTICS__` exposes current quality, internal pixel count, decorative object budget and whether context recovery was observed; it contains no private simulation data.

- [ ] Write failing source/browser regressions for four named quality presets, pixel-budget caps, no quality parameter in `/tower/state`, world depth layers, and context recovery hooks.
- [ ] Run targeted Phase 3 tests and verify RED.
- [ ] Add bounded render profiles: Low, Balanced, High, Ultra; choose Auto from viewport/device hints without changing server state requests.
- [ ] Replace the schematic shaft background with procedural far tower mass, midground buttresses/windows/pipes/cables, zone-specific atmosphere, contact shadows, surface variation and bounded foreground occlusion.
- [ ] Improve platform materials and climber silhouette/velocity lean/landing compression while drawing strictly inside or around authoritative collision envelopes.
- [ ] Add offscreen culling, reusable deterministic decoration seeds, particle caps and render pixel budgets.
- [ ] Add `contextlost/contextrestored`, resize and visibility recovery handling.
- [ ] Run source-contract and browser viewport tests.
- [ ] Commit the renderer slice.

### Task 5: Bounded audible feedback and altitude ambience

**Files:**
- Modify: `public/infinite-tower-climb/app.js`
- Modify: `games/infinite-tower-climb/src/presentation/audio.ts`
- Modify: `tests/phase3/tower-presentation.test.cjs`
- Modify: `tests/phase3/game-feel-regression.test.cjs`

**Interfaces:**
- Existing `TowerAudioFrame` remains the server/public cue contract.
- Browser maps cue IDs and current zone/height into bounded synthesized voices; mute remains authoritative for presentation output only.

- [ ] Write failing tests for new jump/landing/zone/altitude-capable cue metadata and browser voice limits.
- [ ] Run targeted audio tests and verify RED.
- [ ] Extend semantic cue coverage only for observable events already present or derivable from confirmed consecutive public frames.
- [ ] Implement a small Web Audio mixer with strict simultaneous-voice cap, minimum repeat intervals, altitude wind bed and material-aware landing timbre; degrade to captions when audio is unavailable/suspended.
- [ ] Verify mute produces no browser audio nodes while captions remain available.
- [ ] Run presentation/browser tests.
- [ ] Commit the audio slice.

### Task 6: Edge cases, full verification and visual evidence

**Files:**
- Modify: `tests/browser/tower-stream.spec.cjs`
- Modify: `tests/phase3/game-feel-regression.test.cjs`
- Modify documentation only if verification uncovers a persistent limitation.

**Interfaces:**
- Existing stream host and public snapshot endpoints remain backwards compatible.

- [ ] Add browser cases for 320×180, portrait, ultrawide, resize, visibility pause/resume, Low and Ultra quality, and a forced canvas context recovery path where supported by the fixture.
- [ ] Add a deterministic test comparing authority checksums across presentation quality choices to prove rendering does not enter authoritative state.
- [ ] Run `npm test`, Tower stream self-test, nondeterminism scan, Phase 5 chaos evidence and Phase 6 validation.
- [ ] Run Playwright browser suite and capture fresh Tower screenshots.
- [ ] Visually inspect desktop, portrait, landscape and clean-feed captures; fix any regression through a new failing test first.
- [ ] Inspect CI job results/artifacts, record exact pass/fail counts and evidence hashes.
- [ ] Commit final verification fixes and open a Tower-only PR without merging.
