# City Traffic Gauntlet Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development. The user has explicitly approved execution and independent builder/critic loops.

**Goal:** Build and iteratively review a working 3D autonomous city traffic game for catalogue Game 11.

**Architecture:** One deterministic TypeScript authority emits immutable snapshots. Three.js presents those snapshots through a locally served browser application; Node tests execute the same authority. A separate progress page records evidence and unresolved benchmark gaps.

**Tech Stack:** TypeScript 5.8.3, Three.js 0.186.0, Node >=22, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-30-city-traffic-gauntlet.md`

## Global Constraints

- Fixed-step 30Hz; seeded, named RNG streams; bounded entities/events; immutable render snapshots.
- No game-owned provider SDK, remote AI dependency, unlicensed external assets, or invented metrics.
- The main benchmark remains actual Cities: Skylines II gameplay. Missing reference media prevents a benchmark pass.
- Preserve unrelated games. User approval to apply the loop covers reversible implementation and an isolated branch/PR.
- Builders own disjoint files. Critics use fresh context. No predetermined number of improvement rounds.

## Review Focus

- Vehicle entry into a blocked junction: remain behind the stop line until signal, reservation and downstream space permit entry.
- Long queues/high demand: bounded populations and continuing honest completed-trip/queue metrics; no invisible clearing.
- Paused, hidden or slow browser: no variable physics timestep or unbounded catch-up.
- Mobile/keyboard/reduced-motion operation: controls remain usable and cameras respect input preferences.
- Missing graphics/assets or invalid requests: visible recoverable error and bounded safe static-file serving.

## Task 1: Simulation

**Files:** `games/ai-city-traffic/src/*.ts`, `tests/foundation/city-traffic-simulation.test.cjs`.

**Produces:** `createTrafficSimulation`, `STEP_SECONDS`, `ROAD_COORDS`; `step`, `snapshot`, `command`, serialization and restore; vehicle/citizen/signal/metrics snapshots documented in technical architecture.

- [x] Write failing tests for seeded repeatability, traffic progress, spacing/signal/crossing safety, command validation and bounded state.
- [x] Implement route graph, lane following, junction clearance, safe walk phases, demand/policy/incident changes and actual metrics.
- [x] Verify replay/restore and accelerated scenarios using the production authority.
- [x] Run independent correctness review; fix the largest supported gap and recheck.

## Task 2: 3D world and models

**Files:** `public/ai-city-traffic/world.mjs` and model helpers.

**Consumes:** immutable vehicles, pedestrians and signals. **Produces:** `createWorld(THREE,scene)` with `update(snapshot,elapsed,options)`, `dispose` and scene statistics.

- [x] Build connected dressed city blocks, roads, park/waterfront and varied architecture.
- [x] Model distinct vehicle classes, articulated walking citizens and actual signal states.
- [x] Batch static and moving geometry, bound instance counts and support day/night/flow presentation.
- [x] Inspect actual aerial and street captures with an independent critic, then revise supported findings.

## Task 3: Interface and running game

**Files:** `public/ai-city-traffic/{index.html,styles.css,main.mjs,audio.mjs}`.

**Consumes:** Tasks 1/2 APIs. **Produces:** functioning controls, cameras, honest HUD, opt-in audio, accessible layout and operator diagnostic API.

- [x] Implement bounded fixed-step scheduling and real camera/traffic/pause/sound interactions.
- [x] Implement mobile, keyboard, reduced-motion and startup-failure behavior.
- [x] Exercise real interactions in browser and inspect representative captures.
- [ ] Fix independent UI and integrated-game findings.

## Task 4: Runtime, evidence and handoff

**Files:** dedicated server/build/browser-test configuration, game documentation, `/traffic/progress/` page, reproducible evidence.

- [x] Add focused red tests for the traffic server's public routes and traversal/method boundaries.
- [x] Serve local Three.js and the same compiled simulation; verify existing catalogue baseline separately.
- [x] Maintain dated captures, test results, reference provenance and critic findings in the live progress page.
- [ ] Run affected integration checks and whole-branch review; resolve important supported findings.
- [ ] Save a cohesive commit on the isolated remote branch and open a reviewable PR with accurate results and blockers.

## Current evidence checkpoint

Iteration 4 has fourteen actual, error-free captures with stable source hashes. Independent fairness review closes C1–C3 and Q1, with congestion latency retained as a limitation. Vehicle and architecture revisions win local blind candidate comparisons; the fixed commercial reference remains ahead. Phone-junction and runtime-readiness closure reviews and integrated browser verification are recorded in the live journal. The remaining unchecked items are active work, not an approved quality win.
