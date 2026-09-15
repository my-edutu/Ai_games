# Eko Run Phase 0–1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` task-by-task. Behaviour changes use `superpowers:test-driven-development`. Every Eko Run task also obeys `games/eko-street-run/AGENTS.md`.

**Goal:** Establish the complete, executable Eko Run game contract and research/evidence pack, then implement a deterministic headless simulation foundation that can run, replay, checksum, snapshot, restore, and emit presentation snapshots without Three.js.

**Architecture:** Eko Run is a new game module. Authoritative gameplay lives in a fixed-step 60 Hz TypeScript simulation using serializable state, validated commands, named seeded random streams, stable system ordering, kinematic movement primitives, semantic events, render snapshots, checksums, and versioned snapshots. Rendering, audio, external providers, analytics, and future AI policies remain outside authority and consume explicit contracts.

**Tech Stack:** Node.js >=22, TypeScript 5.8.3, Node test runner, existing `Ai_games` package patterns. Three.js is intentionally absent from Phase 1 authority and is introduced only after the deterministic foundation gate.

**Spec:** `docs/superpowers/plans/2026-09-14-eko-run-master-plan.md`, `games/eko-street-run/AGENTS.md`, `games/eko-street-run/docs/EKO_EXPERIENCE_STANDARD.md`.

## Global Constraints

- Load all 22 catalogue skills once at programme start; before each task actively apply the skills named in that task.
- No Nintendo/Mario names, code, artwork, level layouts, music, sounds, or copied characters in the implementation.
- 60 Hz authoritative fixed step; render cadence cannot change outcomes.
- Human and future AI modes must enter the same command contract.
- All authoritative randomness uses versioned named streams.
- Presentation consumes immutable render snapshots and semantic events only.
- Stock imagery is reference-only by default; direct runtime use requires provenance, licence review, third-party-rights review, and an explicit ledger decision.
- Runtime behaviour follows red-green-refactor.
- Phase gates require evidence, not completion labels.

---

## File Map Locked for Phase 0–1

### Programme documents

- `games/eko-street-run/README.md` — game entrypoint and current truthful status.
- `games/eko-street-run/PRD.md` — stable product and non-functional requirements.
- `games/eko-street-run/GAME_DESIGN.md` — rules, loops, districts, hazards, progression and fairness.
- `games/eko-street-run/AI_SYSTEM.md` — future Tayo/traffic/crowd agent contracts and Phase 1 no-remote-AI boundary.
- `games/eko-street-run/VIEWER_INTERACTION.md` — future provider-neutral influence contract and current disabled state.
- `games/eko-street-run/AUDIO_VISUAL.md` — art, animation, camera, audio, HUD and accessibility constitution.
- `games/eko-street-run/TECHNICAL_ARCHITECTURE.md` — authority, schemas, system order, modules and budgets.
- `games/eko-street-run/TESTING_STRATEGY.md` — TDD, replay, invariant, browser, performance, chaos and release evidence.
- `games/eko-street-run/PRODUCTION_READINESS.md` — readiness levels, evidence and stop-ship rules.
- `games/eko-street-run/ASSET_LEDGER.md` — external reference/runtime asset provenance and rights decision.
- `games/eko-street-run/REQUIREMENT_TRACEABILITY.md` — requirement → phase → implementation → evidence map.
- `games/eko-street-run/docs/LAGOS_REFERENCE_PACK.md` — visual/behavioural Lagos research translated into design decisions.
- `games/eko-street-run/phases/PHASE-00-CONSTITUTION.md` — Phase 0 executable gate.
- `games/eko-street-run/phases/PHASE-01-FOUNDATION.md` — Phase 1 executable gate.
- `evidence/eko-run/phase0/PHASE-00-REVIEW.md` — documentation/research gate evidence.

### Phase 1 implementation

- `games/eko-street-run/src/config/version.ts` — game/schema/deterministic/content version constants and tick rate.
- `games/eko-street-run/src/config/default-config.ts` — validated minimal run configuration.
- `games/eko-street-run/src/state/types.ts` — authoritative state, player, route, command, event and snapshot types.
- `games/eko-street-run/src/state/create-state.ts` — pure initial state creation.
- `games/eko-street-run/src/runtime/prng.ts` — deterministic named stream PRNG.
- `games/eko-street-run/src/runtime/checksum.ts` — canonical authoritative checksum material and hash.
- `games/eko-street-run/src/runtime/commands.ts` — validation, scheduling and stable command ordering.
- `games/eko-street-run/src/physics/kinematic.ts` — minimal deterministic horizontal movement/gravity/ground collision for the headless slice.
- `games/eko-street-run/src/rules/route.ts` — tiny deterministic Foundation Route with ground, checkpoint and finish trigger.
- `games/eko-street-run/src/runtime/simulation.ts` — one authoritative 60 Hz tick and system order.
- `games/eko-street-run/src/presentation/snapshot.ts` — immutable render snapshot projection.
- `games/eko-street-run/src/persistence/replay.ts` — replay log, snapshot/restore and checksum validation.
- `games/eko-street-run/src/index.ts` — public game exports.
- `tests/foundation/eko-run-state.test.cjs` — initial state and invariant tests.
- `tests/foundation/eko-run-determinism.test.cjs` — repeatability, named-stream isolation and render-schedule independence.
- `tests/foundation/eko-run-commands.test.cjs` — validation/order/duplicate handling.
- `tests/foundation/eko-run-replay.test.cjs` — uninterrupted vs replay vs restore checksum equivalence.
- `tests/foundation/eko-run-presentation.test.cjs` — snapshot immutability and authority separation.
- `tests/foundation/eko-run-architecture.test.cjs` — forbidden import and boundary checks.
- `scripts/run-eko-run-headless.cjs` — reproducible Phase 1 headless demonstrator.
- `evidence/eko-run/phase1/PHASE-01-RESULTS.md` — commands, checksums, budget and gate outcome.

---

## Task 1 — Phase 0 product constitution

**Skills:** `game-creative-direction`, `gameplay-progression`, `difficulty-failure-balancing`, `platformer-experience-review`, `game-analytics-experimentation`, `simulation-qa`.

**Files:** create `README.md`, `PRD.md`, `GAME_DESIGN.md`, `REQUIREMENT_TRACEABILITY.md`, `phases/PHASE-00-CONSTITUTION.md`.

**Produces:** stable viewer promise, product principles, requirements IDs, mode definitions, district ladder, challenge/failure taxonomy, success metrics and traceability.

- [ ] Write measurable requirements and acceptance criteria with no placeholder language.
- [ ] Define moment/tactical/run/session loops and primary progress as district distance/checkpoints.
- [ ] Define player mode, AI Street Run and future viewer mode while keeping one ruleset.
- [ ] Define explicit stop-ship conditions for unfair hazards, camera-caused failure, copied IP, weak Lagos identity and non-deterministic gameplay.
- [ ] Map every Phase 0/1 MUST to a phase and evidence path.
- [ ] Review for five-second comprehension and catalogue differentiation.

## Task 2 — Lagos reference and asset provenance pack

**Skills:** `game-creative-direction`, `platformer-experience-review`, `security-privacy`, `game-feel-vfx`, `game-audio`, `performance-optimization`.

**Files:** create `ASSET_LEDGER.md`, `docs/LAGOS_REFERENCE_PACK.md`, `AUDIO_VISUAL.md`.

**Produces:** a reference-only stock shortlist and a design constitution that translates Lagos references into original 3D/vector assets instead of photo-copying people/brands.

- [ ] Record Pexels/Unsplash licence policies and third-party-rights caveat.
- [ ] Record source URL, creator, subject, intended use, rights risk and approval state for each candidate.
- [ ] Default identifiable people, logos and branded vehicles to `REFERENCE_ONLY`.
- [ ] Define original Tayo silhouette and four outfit families without copying a photographed person.
- [ ] Define Lagos environment pillars: transport motion, commerce/markets, drainage/weather, modern skyline/waterfront, residential/commercial texture, street typography/signage, night lighting and soundscape.
- [ ] Define SVG → preview/contact sheet → runtime derivative pipeline.
- [ ] Define camera, VFX, audio, HUD, accessibility and low-tier degradation constitution.

## Task 3 — Future-system contracts before implementation

**Skills:** `autonomous-agent-design`, `audience-interaction`, `game-economy-rewards`, `crowd-moderation`, `security-privacy`, `livestream-hud`, `viewer-retention`, `long-running-reliability`.

**Files:** create `AI_SYSTEM.md`, `VIEWER_INTERACTION.md`, `PRODUCTION_READINESS.md`.

**Produces:** boundaries that Phase 1 must not violate.

- [ ] Specify future AI observation/action contract and deterministic fallback; no remote model dependency.
- [ ] Specify future audience input normalization, moderation, idempotency and effect limits; viewer integration remains disabled in Phase 1.
- [ ] Specify Eko Token/cosmetic economy non-pay-to-win boundary without implementing it.
- [ ] Specify public/operator separation and privacy-safe telemetry.
- [ ] Specify reliability states, restore/quarantine behaviour and evidence required for later R-levels.

## Task 4 — Technical architecture and test strategy

**Skills:** `game-architecture`, `deterministic-simulation`, `game-physics`, `performance-optimization`, `simulation-qa`, `production-readiness-review`.

**Files:** create `TECHNICAL_ARCHITECTURE.md`, `TESTING_STRATEGY.md`, `phases/PHASE-01-FOUNDATION.md`.

**Produces:** exact Phase 1 contracts.

- [ ] Lock 60 Hz tick and system order.
- [ ] Lock state/command/event/render/snapshot version fields.
- [ ] Lock named random streams: `route`, `traffic`, `ai`, `reward`, `audience`, `cosmetic` with cosmetics excluded from authoritative checksum.
- [ ] Lock kinematic swept-shape direction for future platforming; Phase 1 implements only minimal ground movement required by the deterministic demonstrator.
- [ ] Define quantization and canonical checksum order.
- [ ] Define performance baseline targets for Phase 1 headless tick and memory/resource bounds.
- [ ] Define tests and exact evidence destinations.

## Task 5 — Phase 0 review gate

**Skills:** all 22, with `platformer-experience-review`, `simulation-qa`, `production-readiness-review` acting as reviewers.

**File:** create `evidence/eko-run/phase0/PHASE-00-REVIEW.md`.

- [ ] Scan required documents and prohibited placeholders.
- [ ] Verify every Phase 0/1 MUST is traced.
- [ ] Verify the mechanics-only quality rule and Lagos-identity rule coexist without contradiction.
- [ ] Verify licence/reference decisions do not imply stock-photo subjects endorse Eko Run.
- [ ] Record Phase 0 verdict. Runtime-only experience evidence is explicitly owned by later phases and cannot be claimed here.

---

## Task 6 — Phase 1 RED: deterministic foundation tests

**Skills:** `deterministic-simulation`, `game-architecture`, `game-physics`, `simulation-qa`, `performance-optimization`.

**Tests:** create all six `tests/foundation/eko-run-*.test.cjs` files before production implementation.

**Required initial failures:** imports or functions are absent; failures must not be syntax/setup errors.

Test contracts include:

```js
assert.equal(TICK_RATE_HZ, 60);
assert.deepEqual(runA.checksums, runB.checksums);
assert.equal(restored.finalChecksum, uninterrupted.finalChecksum);
assert.equal(render30.finalChecksum, render120.finalChecksum);
assert.throws(() => mutateRenderSnapshot(), TypeError);
```

- [ ] Commit RED tests before implementation.
- [ ] Use GitHub Actions result/logs to confirm expected RED failure because local network cloning is unavailable in this environment.

## Task 7 — Phase 1 GREEN: versions, state, PRNG and checksum

**Skills:** `deterministic-simulation`, `game-architecture`, `security-privacy`.

**Files:** `config/version.ts`, `config/default-config.ts`, `state/types.ts`, `state/create-state.ts`, `runtime/prng.ts`, `runtime/checksum.ts`.

**Interfaces:**

```ts
export const TICK_RATE_HZ = 60;
export type RunSeed = string;
export function createInitialState(config: EkoRunConfig): EkoRunState;
export function createRandomStreams(rootSeed: RunSeed): RandomStreams;
export function checksumState(state: EkoRunState): string;
```

- [ ] Implement versioned serializable state with bounded values.
- [ ] Implement deterministic named stream derivation without `Math.random` or wall clock.
- [ ] Implement canonical checksum excluding presentation-only data.
- [ ] Run focused CI and fix only requirements exposed by tests.

## Task 8 — Phase 1 GREEN: commands, route and minimal kinematic tick

**Skills:** `game-physics`, `deterministic-simulation`, `platformer-experience-review`, `difficulty-failure-balancing`.

**Files:** `runtime/commands.ts`, `rules/route.ts`, `physics/kinematic.ts`, `runtime/simulation.ts`.

**Interfaces:**

```ts
export function validateCommand(command: EkoRunCommand, state: EkoRunState): ValidatedCommand;
export function compareCommands(a: ValidatedCommand, b: ValidatedCommand): number;
export function stepSimulation(state: EkoRunState, commands: readonly EkoRunCommand[]): StepResult;
```

- [ ] Use stable `(tick, priority, sourceId, sequence)` ordering.
- [ ] Implement Foundation Route with flat ground, one checkpoint and finish.
- [ ] Implement horizontal intent, gravity, ground collision and checkpoint/finish consequences using fixed step.
- [ ] Emit typed semantic events once per rule consequence.
- [ ] Preserve future expansion seams for jump/slide without implementing Phase 2 early.

## Task 9 — Phase 1 GREEN: render snapshot, replay and restore

**Skills:** `game-architecture`, `deterministic-simulation`, `long-running-reliability`, `game-feel-vfx`, `livestream-hud`.

**Files:** `presentation/snapshot.ts`, `persistence/replay.ts`, `src/index.ts`.

**Interfaces:**

```ts
export function createRenderSnapshot(state: EkoRunState): Readonly<EkoRunRenderSnapshot>;
export function recordReplayStep(log: ReplayLog, step: ReplayStep): ReplayLog;
export function restoreSnapshot(snapshot: EkoRunSnapshot): EkoRunState;
export function replayRun(initial: EkoRunState, steps: readonly ReplayStep[]): ReplayResult;
```

- [ ] Deep-freeze presentation snapshot data in development/test paths.
- [ ] Validate snapshot version/checksum/invariants before restore.
- [ ] Replay only normalized commands; presentation events cannot feed authority.
- [ ] Detect checksum mismatch with a typed integrity error.

## Task 10 — Headless demonstrator and Phase 1 evidence

**Skills:** `simulation-qa`, `performance-optimization`, `game-analytics-experimentation`, `production-readiness-review`, `platformer-experience-review`.

**Files:** `scripts/run-eko-run-headless.cjs`, `evidence/eko-run/phase1/PHASE-01-RESULTS.md`.

- [ ] Run a deterministic Foundation Route command sequence and print seed, ticks, checkpoints and final checksum.
- [ ] Run same sequence twice; require matching checkpoints/final checksum.
- [ ] Run snapshot/restore path; require matching final checksum.
- [ ] Record CI commands, results, performance baseline and known Phase 1 exclusions.
- [ ] Phase 1 passes only if all Eko foundation tests and affected catalogue tests are green, no authority imports presentation/provider SDKs, and the headless route remains valid without Three.js.

## Phase 0 Exit

Phase 0 is complete only when the complete documentation contract, research/reference ledger, traceability and review evidence exist with no load-bearing contradiction or unowned requirement.

## Phase 1 Exit

Phase 1 is complete only when the headless simulation has reproducible checksums, stable command ordering, render-rate independence, validated snapshot/restore, immutable render projection, architecture-boundary tests, a working deterministic Foundation Route, and fresh GitHub Actions evidence.