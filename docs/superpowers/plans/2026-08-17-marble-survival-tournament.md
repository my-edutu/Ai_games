# Marble Survival Tournament Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Game 7 as a deterministic, autonomous, five-round marble survival tournament with premium broadcast presentation, safe audience influence, verified recovery, and release-candidate production evidence.

**Architecture:** A game-owned TypeScript runtime advances custom fixed-point circle physics at a stable tick rate. Autonomous marble policies emit bounded actions; the runtime alone mutates state and emits semantic events. Presentation, audio, audience adapters, persistence, HTTP hosting, analytics, and operations consume explicit sanitized contracts and cannot mutate authority outside validated scheduled commands.

**Tech Stack:** TypeScript 5.8, Node.js 22 built-in test runner, repository `NamedRng` and replay checksum packages, browser Canvas 2D/Web Audio, Playwright, GitHub Actions.

## Global Constraints

- Authoritative state advances at a fixed 60 Hz logical tick and never uses render delta or wall-clock time.
- All authoritative randomness uses named `NamedRng` streams; `Math.random`, `Date.now`, timers, and provider callbacks are forbidden in game authority.
- Fixed-point scale is 1,000 units per metre; positions and velocities are bounded integers.
- The runtime is the only state writer; public render snapshots are immutable, sanitized, and exclude seeds, config, influence internals, provider data, and audit IDs.
- Tournament launch roster is 32 marbles; round quotas are 16, 8, 4, 2, and 1.
- Audience influence is fixed-choice, idempotent, scheduled, capped, replayable, and cannot guarantee a winner or loss.
- Paid-eligible authoritative assistance moves the run into a separate `assisted` record category.
- Every queue/history/effect/resource is bounded and cleanup is tested.
- Critical meaning must survive audio mute, colour-vision differences, reduced motion/flash, stream compression, and mobile viewing.
- Technical/integrity failure is never counted as a game loss.
- A 72-hour soak and seven-day canary are required for production promotion and may not be marked passed without elapsed evidence.

---

## File Map

### Game source

- `games/marble-survival/src/config/schema.ts` — configuration types, defaults, validation, deterministic hash input.
- `games/marble-survival/src/state/types.ts` — authoritative state, entity, arena, event, result, and command contracts.
- `games/marble-survival/src/generation/roster.ts` — authored names and deterministic character creation.
- `games/marble-survival/src/generation/arena.ts` — constructive arena generation, validation, repair, feature extraction.
- `games/marble-survival/src/physics/fixed.ts` — integer vector math, square root, clamps, and quantization.
- `games/marble-survival/src/physics/solver.ts` — fixed-step integration, swept world/obstacle contacts, stable marble-pair resolution.
- `games/marble-survival/src/ai/policy.ts` — bounded observations, personality policy, public intent, staggered decisions.
- `games/marble-survival/src/rules/tournament.ts` — checkpoints, finish quota, eliminations, round ranking, bracket and restart progression.
- `games/marble-survival/src/influence/director.ts` — effect catalogue, validation, idempotency, votes, schedule, apply/reverse.
- `games/marble-survival/src/runtime/run.ts` — system order, lifecycle, semantic events, checksums, signals, restart.
- `games/marble-survival/src/persistence/snapshot.ts` — versioned snapshot, checksum validation, restore, typed errors.
- `games/marble-survival/src/presentation/snapshot.ts` — privacy-safe immutable render contract.
- `games/marble-survival/src/presentation/layout.ts` — 16:9/mobile/clean-feed layout.
- `games/marble-survival/src/presentation/camera.ts` — camera mode derivation and hysteresis-friendly targets.
- `games/marble-survival/src/presentation/audio.ts` — semantic cue and adaptive music state derivation with caps.
- `games/marble-survival/src/presentation/controller.ts` — monotonic snapshot acceptance, recovery, reset cleanup.
- `games/marble-survival/src/operations/readiness.ts` — bounded resource/health/readiness assessment.
- `games/marble-survival/src/manifest.ts` — game identity and capability manifest.
- `games/marble-survival/src/index.ts` — public exports.

### Executables and browser source

- `scripts/run-marble-headless.cjs`
- `scripts/run-marble-campaign.cjs`
- `scripts/serve-marble-stream.cjs`
- `scripts/run-marble-phase5-chaos.cjs`
- `scripts/run-marble-phase6-validation.cjs`
- `public/marble-survival/index.html`
- `public/marble-survival/styles.css`
- `public/marble-survival/app.js`

### Tests

- `tests/foundation/marble-config-generation.test.cjs`
- `tests/foundation/marble-physics.test.cjs`
- `tests/foundation/marble-runtime.test.cjs`
- `tests/phase2/marble-ai-progression.test.cjs`
- `tests/phase2/marble-campaign.test.cjs`
- `tests/phase3/marble-presentation.test.cjs`
- `tests/phase3/marble-stream-host.test.cjs`
- `tests/phase4/marble-influence.test.cjs`
- `tests/phase5/marble-recovery-operations.test.cjs`
- `tests/phase6/marble-release-validation.test.cjs`
- `tests/browser/marble-survival.spec.cjs`

### Documentation and repository integration

- Required game docs and six phase ledgers under `games/marble-survival/`.
- Operations runbook, rollback matrix, handoff, evidence intake, and review reports under `docs/operations/` and `docs/reviews/`.
- Modify `package.json`, `tsconfig.json`, `.github/workflows/ci.yml`, `playwright.config.cjs` only where needed, and catalogue/readme status.

---

## Phase 1 — Deterministic Foundation

### Task 1: Configuration, character roster, and constructive arena

**Interfaces**

- Produces `parseMarbleConfig(input): MarbleConfig`.
- Produces `createRoster(config, rng): MarbleCompetitor[]`.
- Produces `generateArena(config, roundIndex, rng): ArenaDefinition` and `validateArena(arena, config): ArenaValidationReport`.

- [ ] Write `marble-config-generation.test.cjs` asserting default validation, invalid bounds, same-seed roster/arena equality, unique identifiers, spawn safety, finish reachability, collider budgets, and fallback diagnostics.
- [ ] Run the focused test and confirm failure because Marble exports do not exist.
- [ ] Implement config, roster, arena types, constructive lanes, hazards, typed validation, two bounded repairs, and known-good fallback.
- [ ] Compile and rerun the focused test until green.
- [ ] Refactor only after green and record generator version/features.

### Task 2: Fixed-point physics and stable contacts

**Interfaces**

- Produces `stepPhysics(state, actions): PhysicsStepResult`.
- Consumes only serializable state/actions; emits semantic contacts without applying tournament consequences twice.

- [ ] Write `marble-physics.test.cjs` for fixed-step frame independence, wall bounce, bumper collision, thin-gate sweep, stable pair ordering, no persistent penetration, speed clamp, contact cap, and invalid-range quarantine signal.
- [ ] Run the test and confirm expected missing-export failures.
- [ ] Implement integer math and the minimum solver behaviour to satisfy one test at a time.
- [ ] Run the focused test after each behaviour and the complete foundation subset after refactor.
- [ ] Add adversarial fixtures for corners, high velocity, simultaneous contacts, spawn overlap repair, and maximum population.

### Task 3: Runtime lifecycle, replay, and snapshot restore

**Interfaces**

- Produces `MarbleRuntime.create(config, seed)`, `.step()`, `.drainEvents()`, `.restart()`, `.signals()`.
- Produces `createMarbleSnapshot(runtime)`, `restoreMarbleSnapshot(snapshot)`, `marbleStateChecksum(state)`.

- [ ] Write `marble-runtime.test.cjs` for twin checksums/events, result→intermission→restart, snapshot-boundary replay, corruption rejection, and technical quarantine classification.
- [ ] Confirm red failures.
- [ ] Implement the runtime system order, semantic event sequence, lifecycle, bounded events, snapshot metadata/checksum/invariants, and typed errors.
- [ ] Run all foundation Marble tests and verify zero failures.
- [ ] Add `run-marble-headless.cjs`, Phase 1 docs, evidence summary, and perform specification then engineering review; fix all critical/important findings before the Phase 1 commit.

---

## Phase 2 — Tournament Intelligence and Progression

### Task 4: Bounded autonomous personality policies

**Interfaces**

- Produces `observeMarble(state, marbleId): MarbleObservation` and `chooseMarbleAction(observation, competitor, tick): MarbleAction`.
- Public intent is one allowlisted key and confidence band.

- [ ] Write `marble-ai-progression.test.cjs` asserting legal bounded actions, deterministic tie-breaks, archetype differentiation, hidden-state exclusion, staggered decision cadence, fallback, and anti-stall behaviour.
- [ ] Confirm red failures.
- [ ] Implement legality filter, immediate hazard reflex, utility steering, archetype traits, deterministic fallback, intent summaries, and bounded computation.
- [ ] Run focused and foundation tests.
- [ ] Review character readability and fairness; fix dominance or indistinguishable behaviour.

### Task 5: Five-round bracket, records, and dramatic patterns

**Interfaces**

- Runtime advances quotas `[16, 8, 4, 2, 1]`, emits round/tournament events, and derives auditable records.
- Produces `runMarbleCampaign(options): MarbleCampaignReport` and `classifyTournamentPattern(events)`.

- [ ] Extend tests for checkpoint progress, finish quota, timeout ranking, eliminations, bracket advancement, champion, automatic next tournament, record categories, and technical-failure exclusion.
- [ ] Confirm failures before implementation.
- [ ] Implement tournament progression, deterministic ranking, anti-stall recovery/resolution, records, pattern classifiers, and headless campaign runner.
- [ ] Run a local stratified campaign and assert no quarantine, bounded duration, archetype share guardrails, and at least three pattern classes in the sample.
- [ ] Critique pacing and balance using generated report; adjust only versioned parameters and rerun the identical corpus.
- [ ] Write Phase 2 evidence/review and commit only after tests and review pass.

---

## Phase 3 — Broadcast Experience

### Task 6: Sanitized presentation contracts

**Interfaces**

- Produces `createMarbleRenderSnapshot(state, events)`, `computeMarbleLayout(width,height,cleanFeed)`, `deriveMarbleCamera(current,previous)`, `deriveMarbleAudioCues(current,previous)`, and `MarblePresentationController`.

- [ ] Write `marble-presentation.test.cjs` for privacy exclusion, immutable data, monotonic revisions, scene state, card/text caps, mobile layout, clean feed, camera target validity, cue priority/voice cap/dedupe, reduced-motion, and restart cleanup.
- [ ] Confirm red failures.
- [ ] Implement snapshot/layout/camera/audio/controller one failing behaviour at a time.
- [ ] Run Phase 3 and prior Marble tests.
- [ ] Perform separate UI, character, VFX, audio, accessibility, and broadcast-compression critique; fix load-bearing issues.

### Task 7: Premium browser/OBS stream source

**Interfaces**

- `serve-marble-stream.cjs` serves `/marble/state`, `/marble/health`, token-protected `/marble/command`, and static assets.
- Browser source draws from sanitized snapshots only.

- [ ] Write `marble-stream-host.test.cjs` and Playwright contract for CSP, health, privacy-safe state, operator authentication, pause/resume/restart, responsive hierarchy, canvas rendering, no raw `innerHTML`, reduced motion, colour-safe labels, muted-audio legibility, result/intermission, and screenshot artifacts.
- [ ] Confirm red failures or missing assets.
- [ ] Implement semantic HTML, responsive CSS, bounded Canvas/Web Audio client, status rail, bracket, favourite/leader/danger cards, captions, event rail, and cleanup.
- [ ] Run the host self-test and all available local static/contract tests; CI will execute Playwright with Chromium.
- [ ] Record Phase 3 review findings and commit after fixes.

---

## Phase 4 — Audience Interaction

### Task 8: Idempotent fixed-choice influence director

**Interfaces**

- Produces `submitInfluence`, `openVoteWindow`, `castVote`, `resolveVote`, `applyDueInfluence`, `reverseInfluence`, and public acknowledgement projection.

- [ ] Write `marble-influence.test.cjs` for schema limits, fixed choices, duplicate/reordered/stale requests, caps, cooldown/conflicts, vote tie determinism, safe scheduling, assisted records, reversal audit, queue bound, burst load, and no-provider continuity.
- [ ] Confirm red failures.
- [ ] Implement the catalogue and ordered eligibility/scheduling pipeline with stable reason codes and bounded maps/queues.
- [ ] Verify that no effect can directly set finish/elimination/champion and decisive championship boundary rejects new power effects.
- [ ] Integrate visible acknowledgements and effect consequence into semantic events/presentation with priority below danger/results.
- [ ] Run all Marble tests, perform fairness/moderation/privacy review, fix critical/important findings, document Phase 4, and commit.

---

## Phase 5 — Reliability and Operations

### Task 9: Health, recovery, chaos, and bounded resources

**Interfaces**

- Produces `assessMarbleReadiness(runtime, presentationState)` and `runMarbleChaosScenario(name, seed)`.
- Stream host exposes truthful healthy/degraded/quarantined status and authenticated audited commands.

- [ ] Write `marble-recovery-operations.test.cjs` for corrupt snapshot quarantine, previous-valid restore, event overflow policy, idempotency bound, renderer/audio/provider outage, stalled presentation recovery, invalid operator token/command/body, restart cleanup, and memory/resource slope proxies.
- [ ] Confirm red failures.
- [ ] Implement readiness probes, recovery paths, chaos scenarios, health classifications, safe scene, and command audit projection.
- [ ] Add `run-marble-phase5-chaos.cjs` and require every scenario to produce exact pass/fail evidence.
- [ ] Run repeated accelerated tournaments and assert bounded buffers/maps/counters.
- [ ] Create runbook, rollback matrix, evidence intake, Phase 5 review, fix all load-bearing findings, and commit.

---

## Phase 6 — Production Launch Candidate

### Task 10: Release validator, CI, and final review

**Interfaces**

- `run-marble-phase6-validation.cjs` emits a machine-readable report with build/test/self-test/campaign/chaos/privacy/security/readiness evidence and explicit temporal-gate status.

- [ ] Write `marble-release-validation.test.cjs` asserting required evidence keys, source SHA binding, no false production claim, temporal soak/canary state, rollback readiness, and stop-ship failure propagation.
- [ ] Confirm red failures.
- [ ] Implement release validation and production-readiness assessment.
- [ ] Update root scripts, TypeScript include, CI test/self-test/nondeterminism/chaos/release/browser artifact steps, and repository catalogue status.
- [ ] Run fresh full local Marble build/tests/self-test/campaign/chaos/release validation.
- [ ] Perform final specification compliance review, then engineering/gameplay/UI/characters/audio/accessibility/security/operations quality review; fix every critical and important item.
- [ ] Push the phase commit, open a draft pull request, inspect GitHub Actions, fix failures, and rerun until the available automated checks pass.
- [ ] Mark the codebase `release-candidate ready`; leave 72-hour soak and seven-day canary as explicit unpassed promotion gates until real evidence exists.

## Plan Self-Review

- **Spec coverage:** every design section maps to a phase task and executable evidence.
- **Placeholder scan:** no deferred implementation language or undefined follow-up steps.
- **Type consistency:** runtime, snapshot, presentation, influence, operations, and script interfaces use one naming scheme throughout.
- **Isolation:** each phase ends with a running vertical increment and may be reviewed or reverted independently.
- **Temporal honesty:** release automation is complete, but elapsed soak/canary cannot be simulated or marked passed in this session.
