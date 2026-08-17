# AI Maze Escape — Six-Phase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build AI Maze Escape from deterministic headless foundation through production-validation software, preserving truthful R4/R5 evidence boundaries and emitting a quantitative production-readiness score.

**Architecture:** Add an isolated `games/ai-maze-escape/src/` module that consumes shared seeded RNG, replay/checksum, audience, durable-store, recovery, observability, operator-control and release-governance packages. Authoritative maze truth, partial-observation belief, presentation snapshots and external provider inputs remain separate. Each phase adds one end-to-end vertical slice, tests it, records evidence, updates the active phase document, and keeps prior phases green.

**Tech Stack:** TypeScript 5.8, Node.js 22 fixed-step simulation, deterministic grid/graph algorithms, dependency-free Canvas browser source, Node test runner, Playwright, existing catalogue operations and release packages.

## Global Constraints

- Every authoritative random draw uses a named seeded stream.
- Identical version, configuration, content, seed and normalized event input must reproduce truth, belief, actions, results and checksums.
- Normal AI and public presentation may not access hidden maze truth or oracle output.
- Technical failures, invalid content, replay divergence and unsolvable states are not fair game losses.
- Audience effects must preserve at least one valid solution and a declared response window.
- Optional renderer, audio, provider, model, telemetry and payment services may not be required for autonomous continuity.
- Collections, histories, caches, queues, route trails, snapshots and public entities must be explicitly bounded.
- No R5 or `productionReady=true` claim may be emitted without production-reference capacity, credentialed providers, external attestations, witnessed drills, 72 real soak hours, seven real canary days and independent exact-candidate review.

---

### Task 1: Phase 1 Contracts, Generator and Oracle

**Files:**
- Modify: `packages/game-contracts/src/index.ts`
- Create: `games/ai-maze-escape/src/config/schema.ts`
- Create: `games/ai-maze-escape/src/state/types.ts`
- Create: `games/ai-maze-escape/src/generation/topology.ts`
- Create: `games/ai-maze-escape/src/generation/solver.ts`
- Create: `games/ai-maze-escape/src/generation/validator.ts`
- Create: `games/ai-maze-escape/src/manifest.ts`
- Test: `tests/foundation/maze-generation.test.cjs`

**Interfaces:**
- Produces `MazeConfig`, `MazeProfile`, `MazeAction`, `MazeRunResult` in game contracts.
- Produces `parseMazeConfig(input): MazeConfig`.
- Produces `generateMaze(config, rng): GeneratedMaze` with diagnostics, features and bounded fallback.
- Produces `solveMaze(world, options): MazeSolution | null` and `validateGeneratedMaze(world): MazeValidation`.

- [ ] Write failing tests for invalid configuration, same-seed topology equality, stream isolation, graph connectivity, start/exit clearance, bounded attempts, fallback diagnostics and valid oracle route.
- [ ] Run `npm run build && node --test tests/foundation/maze-generation.test.cjs`; confirm failures identify missing Maze contracts and generator functions.
- [ ] Implement contract/config types with integer bounds: width/height 5–96, intermission 0–1,000, max ticks 10–1,000,000, visibility 1–8, loop chance 0–1,000 permille, keys 0–4, traps 0–256, threats 0–8 and no-progress 10–100,000.
- [ ] Implement deterministic DFS topology, profile-specific loop/chamber edits, farthest-cell exit selection, feature extraction and a deterministic known-good fallback.
- [ ] Implement stable BFS/oracle validation with door/key-ready extension points and no normal-policy export.
- [ ] Run the focused test, full foundation suite and strict build; keep every result green.
- [ ] Commit `feat(maze): add deterministic solvable maze foundation`.

### Task 2: Phase 1 Rules, Runtime, Snapshot and Headless Evidence

**Files:**
- Create: `games/ai-maze-escape/src/index.ts`
- Create: `games/ai-maze-escape/src/rules/step.ts`
- Create: `games/ai-maze-escape/src/runtime/run.ts`
- Create: `games/ai-maze-escape/src/persistence/snapshot.ts`
- Create: `games/ai-maze-escape/src/testing/headless.ts`
- Create: `scripts/run-maze-headless.cjs`
- Modify: `package.json`
- Modify: `tsconfig.json`
- Modify: `games/ai-maze-escape/phases/PHASE-01-FOUNDATION.md`
- Create: `evidence/ai-maze-escape/r1-phase-01/phase-01/README.md`
- Test: `tests/foundation/maze-runtime.test.cjs`

**Interfaces:**
- Produces `createInitialMazeState(config, seed, runId, rng): MazeState`.
- Produces `applyMazeAction(state, action, rng): MazeStepResult`.
- Produces `MazeRuntime.create(...)`, `step()`, `restart()`, `drainEvents()`, `signals()` and exact restore constructor.
- Produces `encodeMazeSnapshot(runtime)` and `restoreMazeRuntime(envelope)`.

- [ ] Write failing tests for legal/illegal movement, atomic wall rejection, typed escape, result→intermission→restart, deterministic headless execution, snapshot checksum, corrupt/unsupported snapshot failure and restored/uninterrupted equivalence.
- [ ] Run the focused test and confirm expected red state.
- [ ] Implement authoritative lifecycle and a Phase 1 complete-information test policy that consumes only the validator-owned route through an explicit `policy: 'oracle-test'` option.
- [ ] Implement snapshot envelope version 1 with complete state, RNG streams, event sequence and canonical checksum.
- [ ] Add `maze:headless` script, TypeScript include path and a deterministic evidence runner.
- [ ] Run focused tests, all foundation tests, `npm test`, and the headless command twice; compare final checksums.
- [ ] Update Phase 1 acceptance boxes and evidence with exact commands/results only after verification.
- [ ] Commit `feat(maze): complete Phase 1 deterministic runtime`.

### Task 3: Phase 2 Partial Observation, Dependencies, Threats and Progression

**Files:**
- Create: `games/ai-maze-escape/src/ai/observation.ts`
- Create: `games/ai-maze-escape/src/ai/belief.ts`
- Create: `games/ai-maze-escape/src/ai/pathing.ts`
- Create: `games/ai-maze-escape/src/ai/policy.ts`
- Create: `games/ai-maze-escape/src/ai/stuck.ts`
- Create: `games/ai-maze-escape/src/generation/content.ts`
- Create: `games/ai-maze-escape/src/threats/step.ts`
- Create: `games/ai-maze-escape/src/testing/campaign.ts`
- Modify: `games/ai-maze-escape/src/runtime/run.ts`
- Modify: `games/ai-maze-escape/src/rules/step.ts`
- Modify: `games/ai-maze-escape/phases/PHASE-02-CORE-AI-CONTENT.md`
- Create: `evidence/ai-maze-escape/r2-phase-02/phase-02/README.md`
- Test: `tests/phase2/maze-observation-ai.test.cjs`
- Test: `tests/phase2/maze-content-campaign.test.cjs`

**Interfaces:**
- Produces `createMazeObservation(state): MazeObservation`, containing visible/remembered truth only.
- Produces `updateBelief(previous, observation): MazeBeliefState` with bounded cells/frontiers/confidence.
- Produces `chooseMazeAction(state, observation): MazeDecision` with public intent and expansion count.
- Produces constructive keys/doors/clues/checkpoints/traps/threat routes and `runMazeCampaign(options)`.

- [ ] Write hidden-information leakage tests that recursively scan observations and public intent for undiscovered exit, cell truth and future threat state.
- [ ] Write failing tests for frontier selection, known-space BFS, key-before-door construction, collection/unlock, trap telegraph, deterministic patrol, threat evasion, contradicted-plan revision, loop recovery and no teleport.
- [ ] Write campaign tests across tree, loops, chambers, layers and hunter profiles with declared seed strata, zero invalid content counted as fair loss and at least three classified dramatic patterns.
- [ ] Implement visibility, memory ageing, belief updates, frontier utility, dependency planning, bounded threat prediction, strategic modes and deterministic fallback.
- [ ] Construct dependencies before locks, keep traps off mandatory untelegraphed paths, and require safe threat spawn/response distance.
- [ ] Replace production runtime default with partial-observation policy; retain oracle policy only behind explicit test/debug mode.
- [ ] Run both Phase 2 files, full regression, deterministic campaign rerun and latency/resource assertions.
- [ ] Update Phase 2 evidence and commit `feat(maze): complete partial-observation AI and progression`.

### Task 4: Phase 3 Broadcast Source, Accessibility and Output Recovery

**Files:**
- Create: `games/ai-maze-escape/src/presentation/snapshot.ts`
- Create: `games/ai-maze-escape/src/presentation/layout.ts`
- Create: `games/ai-maze-escape/src/presentation/camera.ts`
- Create: `games/ai-maze-escape/src/presentation/audio.ts`
- Create: `games/ai-maze-escape/src/presentation/controller.ts`
- Create: `public/ai-maze-escape/index.html`
- Create: `public/ai-maze-escape/styles.css`
- Create: `public/ai-maze-escape/app.js`
- Create: `scripts/serve-maze-stream.cjs`
- Modify: `package.json`
- Modify: `playwright.config.cjs`
- Modify: `games/ai-maze-escape/phases/PHASE-03-BROADCAST-EXPERIENCE.md`
- Create: `evidence/ai-maze-escape/r2-phase-03/phase-03/README.md`
- Test: `tests/phase3/maze-presentation.test.cjs`
- Test: `tests/browser/maze-stream.spec.cjs`

**Interfaces:**
- Produces immutable `MazeRenderSnapshot` exposing public knowledge, entities, intent, route state and semantic events only.
- Produces responsive `computeMazeLayout(viewport, options)` and bounded presentation controller/audio/camera models.
- Serves `/maze`, `/maze/state`, `/maze/health` and self-test output.

- [ ] Write failing unit tests for hidden-truth exclusion, snapshot immutability/idempotency, entity bounds, route trail bounds, mobile layout, reduced motion, muted captions and output-health transitions.
- [ ] Implement the dependency-free Canvas source with semantic texture/icon distinctions, orientation-preserving camera, HUD, lifecycle scenes, replay/intermission and clean feed.
- [ ] Add intentional safe-scene behavior for stale, black, frozen or silent output and reconstruct from the latest valid snapshot.
- [ ] Add Playwright checks for desktop, phone landscape, color-safe/reduced-motion/muted modes and public-state privacy.
- [ ] Run strict build, Phase 3 tests, browser tests and stream self-test; retain captures and reports.
- [ ] Update Phase 3 evidence and commit `feat(maze): complete premium broadcast experience`.

### Task 5: Phase 4 Audience Influence and Chat vs AI

**Files:**
- Create: `games/ai-maze-escape/src/influence/types.ts`
- Create: `games/ai-maze-escape/src/influence/catalogue.ts`
- Create: `games/ai-maze-escape/src/influence/candidates.ts`
- Create: `games/ai-maze-escape/src/influence/apply.ts`
- Create: `games/ai-maze-escape/src/influence/director.ts`
- Create: `games/ai-maze-escape/src/influence/index.ts`
- Modify: `games/ai-maze-escape/src/runtime/run.ts`
- Modify: `games/ai-maze-escape/src/state/types.ts`
- Modify: `games/ai-maze-escape/src/presentation/snapshot.ts`
- Modify: `games/ai-maze-escape/phases/PHASE-04-AUDIENCE-INTERACTION.md`
- Create: `evidence/ai-maze-escape/r3-phase-04/phase-04/README.md`
- Test: `tests/phase4/maze-influence.test.cjs`
- Test: `tests/phase4/maze-pressure.test.cjs`

**Interfaces:**
- Produces fixed effects: `reveal-frontier`, `directional-hint`, `open-eligible-door`, `fog-pulse`, `threat-pulse`, `safe-obstacle`, `resource-choice`, `next-profile`.
- Produces `buildMazeInfluenceCandidates(state)`, `queueMazeInfluence(state, command)`, `applyDueMazeInfluence(state, rng)` and director/vote adapters.
- Every command carries immutable ID, scheduled/expiry tick, validated candidate ID and record category.

- [ ] Write failing tests proving each effect preserves solver validity and required response distance.
- [ ] Write idempotency tests across duplicate retry, reordered delivery, snapshot restore, expiry and reversal.
- [ ] Write deterministic vote/tie/cap/cooldown tests and outage tests for provider, moderation, entitlement and audit uncertainty.
- [ ] Implement only prevalidated candidates; arbitrary coordinates/text/provider payloads never enter authority.
- [ ] Run no-audience and maximum-pressure campaigns; require zero duplicate authoritative applications and zero guaranteed terminal effects.
- [ ] Update Phase 4 evidence and commit `feat(maze): complete bounded audience interaction`.

### Task 6: Phase 5 Durable Channel, Recovery and Operations

**Files:**
- Create: `services/maze-channel/src/index.ts`
- Create: `games/ai-maze-escape/src/operations/health.ts`
- Create: `games/ai-maze-escape/src/operations/drills.ts`
- Create: `scripts/run-maze-phase5-chaos.cjs`
- Modify: `package.json`
- Modify: `.github/workflows/ci.yml`
- Modify: `games/ai-maze-escape/phases/PHASE-05-RELIABILITY-OPERATIONS.md`
- Create: `docs/operations/ai-maze-escape-runbook.md`
- Create: `docs/operations/ai-maze-escape-rollback-matrix.md`
- Create: `evidence/ai-maze-escape/r4-phase-05/phase-05/README.md`
- Test: `tests/phase5/maze-channel.test.cjs`
- Test: `tests/phase5/maze-recovery-chaos.test.cjs`

**Interfaces:**
- Produces `MazeChannelService` with `start`, exactly-once `tick`, `captureSnapshot`, verified `recover`, dependency health and bounded status.
- Produces progress-loop/output/resource health classification and deterministic operational drill runner.

- [ ] Adapt the existing durable-store, lease, recovery, supervisor, output-health and operator-control contracts rather than creating game-private infrastructure.
- [ ] Write failing tests for process reconstruction, post-snapshot replay, corrupt-newest fallback, divergence quarantine, writer fencing, command dedupe, bounded retention and provider/persistence degradation.
- [ ] Write failure tests for stalled exploration, repeated loop, stale render, black/frozen/silent output, queue pressure and crash loop.
- [ ] Implement typed safe scene, verified restore, older snapshot fallback, fresh-run boundary, component restart, rollback and halt controls with append-only audit.
- [ ] Run Phase 5 chaos twice and require identical summary checksum, zero integrity loss and bounded counters.
- [ ] Update Phase 5 evidence and commit `feat(maze): complete reliable channel operations`.

### Task 7: Phase 6 Release Validation and Readiness Score

**Files:**
- Create: `games/ai-maze-escape/src/release/validation.ts`
- Create: `games/ai-maze-escape/src/release/score.ts`
- Create: `scripts/run-maze-phase6-validation.cjs`
- Modify: `package.json`
- Modify: `.github/workflows/ci.yml`
- Modify: `games/ai-maze-escape/README.md`
- Modify: `games/ai-maze-escape/PRODUCTION_READINESS.md`
- Modify: `games/ai-maze-escape/phases/PHASE-06-PRODUCTION-LAUNCH.md`
- Create: `docs/operations/ai-maze-escape-r5-evidence-intake.md`
- Create: `docs/operations/ai-maze-escape-handoff.md`
- Create: `evidence/ai-maze-escape/r5-phase-06/phase-06/README.md`
- Test: `tests/phase6/maze-validation.test.cjs`
- Test: `tests/phase6/maze-readiness-score.test.cjs`

**Interfaces:**
- Produces exact-SHA `MazeValidationBundle` with manifest, traceability, final campaigns, capacity, endurance semantics, provider/safety/drill/canary evidence and deterministic checksum.
- Produces `scoreMazeReadiness(bundle): {score:number; grade:string; verdict:'PASS'|'BLOCKED'|'FAIL'; highestTruthfulReadiness:'R3'|'R4'|'R5'; productionReady:boolean; categories; blockers; failures}`.

- [ ] Write failing tests that synthetic timestamps, fixture providers, unwitnessed drills and missing independent review cannot produce R5.
- [ ] Write tests that P0/P1, hidden-information leakage, unsolvable content, replay divergence, duplicate paid effect, failed endurance or canary rollback return `FAIL`.
- [ ] Implement generic release-governance reuse plus Maze-specific evidence categories and weighted score; cap any externally blocked candidate below 90 and any integrity failure below 60.
- [ ] Run final stratified campaign, Phase 5 chaos, stream self-test, browser suite and exact-source validation bundle.
- [ ] Record software verdict separately from external R5 verdict; retain all artifact digests.
- [ ] Update docs with exact verified head and score, then commit `feat(maze): complete production validation and readiness scoring`.

### Task 8: Independent Review, Full Verification and Integration

**Files:**
- Modify only files required by review findings.
- Create: `evidence/ai-maze-escape/r5-phase-06/phase-06/review.md`
- Create: `evidence/ai-maze-escape/r5-phase-06/phase-06/phase-gate.json`

- [ ] Run specification review against every Maze MUST requirement and phase acceptance criterion.
- [ ] Run engineering review for determinism, hidden-information isolation, solver correctness, bounded resources, security/privacy, accessibility, failure recovery and truthful production claims.
- [ ] Fix every P0/P1 and rerun affected focused tests before full regression.
- [ ] Run `npm ci --no-audit --no-fund`, `npm test`, Maze headless, Maze stream self-test, Playwright, Phase 5 chaos and Phase 6 validation.
- [ ] Verify CI artifacts are candidate-bound and all workflow steps are successful.
- [ ] Merge only with zero open implementation P0/P1. Keep `productionReady=false` and R5 blocked when external real-world evidence remains incomplete.
