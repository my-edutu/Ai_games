# AI City Traffic Experiment Production Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Game 11 as a deterministic, watchable, audience-safe, recoverable AI traffic experiment and complete all six software phases through an evidence-gated R4 production candidate.

**Architecture:** A fixed-step lane-cell authority owns a generated connected road graph, many vehicles, signals, incidents, metrics, and results. Bounded adaptive control and congestion-aware routing submit legal decisions; immutable snapshots drive a dependency-free canvas stream host, while normalized audience input, verified persistence, health supervision, and release validation remain behind explicit contracts.

**Tech Stack:** TypeScript 5.8, Node.js 22 CommonJS, Node test runner, repository `NamedRng` and replay checksum packages, dependency-free HTTP/canvas stream source, Playwright in CI.

## Global Constraints

- Work only on `feat/ai-city-traffic-production`; do not write implementation directly to `main`.
- Authoritative state advances at fixed logical ticks and never reads wall clock, render delta, provider payloads, or ambient randomness.
- Every authoritative random draw uses a named `NamedRng` stream recorded by snapshot.
- Games may import public packages but never another game's private implementation or a provider SDK.
- Every phase starts with focused failing tests and ends with focused, affected, and full proportional verification.
- Public snapshots contain no raw run ID, seed, provider payload, viewer identity, moderation evidence, or private diagnostics.
- Free and paid-eligible effects share validation, moderation, idempotency, eligibility, caps, cooldowns, expiry, reversal, and audit.
- No effect, director, test mode, or operator action can secretly force a terminal result.
- R5 remains blocked until real 72-hour endurance, seven-day canary, current provider evidence, witnessed drills, and independent review exist.

---

### Task 1: Phase 1 deterministic foundation

**Files:**
- Modify: `packages/game-contracts/src/index.ts`
- Modify: `tsconfig.json`
- Modify: `package.json`
- Create: `games/ai-city-traffic/src/manifest.ts`
- Create: `games/ai-city-traffic/src/config.ts`
- Create: `games/ai-city-traffic/src/state/types.ts`
- Create: `games/ai-city-traffic/src/generation/city.ts`
- Create: `games/ai-city-traffic/src/rules/routing.ts`
- Create: `games/ai-city-traffic/src/rules/invariants.ts`
- Create: `games/ai-city-traffic/src/runtime/run.ts`
- Create: `games/ai-city-traffic/src/index.ts`
- Create: `tests/foundation/traffic-foundation.test.cjs`
- Create: `scripts/run-city-traffic-headless.cjs`

**Interfaces:**
- Produces `parseTrafficConfig(input): TrafficConfig`.
- Produces `generateTrafficCity(config, rng): TrafficCity` with connected gateways and stable lane IDs.
- Produces `TrafficRuntime.create(config, seed, options?)`, `step()`, `state`, `events`, and `checksum()`.
- Produces `assertTrafficInvariants(state): void` and `runTrafficHeadless(config, seed)`.

- [ ] Write tests that require config bounds, connected bidirectional lanes, collision-free movement, fixed-tick results, identical-seed checksums, different-seed demand, and automatic intermission/restart.
- [ ] Run `tsc -p tsconfig.json && node --test tests/foundation/traffic-foundation.test.cjs` and observe an assertion failure because the traffic exports do not exist.
- [ ] Implement the minimal connected grid, BFS route, fixed-cycle signals, propose/resolve/commit movement, bounded demand, result lifecycle, events, and checksum.
- [ ] Run the focused command and require all Phase 1 tests to pass twice with matching checksum output.
- [ ] Run the headless script and record its deterministic summary.
- [ ] Commit `feat(traffic): complete deterministic foundation`.

### Task 2: Phase 2 adaptive AI, incidents, and campaigns

**Files:**
- Create: `games/ai-city-traffic/src/ai/controller.ts`
- Create: `games/ai-city-traffic/src/ai/observation.ts`
- Create: `games/ai-city-traffic/src/generation/demand.ts`
- Create: `games/ai-city-traffic/src/rules/director.ts`
- Create: `games/ai-city-traffic/src/testing/campaign.ts`
- Modify: `games/ai-city-traffic/src/runtime/run.ts`
- Modify: `games/ai-city-traffic/src/index.ts`
- Create: `tests/phase2/traffic-ai-content.test.cjs`
- Create: `scripts/run-city-traffic-campaign.cjs`

**Interfaces:**
- Produces `chooseSignalDecisions(state): TrafficSignalDecision[]` with bounded pressure observations and public intent.
- Produces `findCongestionAwareRoute(state, origin, destination, budget): RouteDecision`.
- Produces deterministic wave and incident scheduling.
- Produces `runTrafficCampaign(options): TrafficCampaignReport` with patterns and technical-outcome exclusions.

- [ ] Write failing tests for min/max green legality, pressure adaptation, reroute budgets, distinct waves, reproducible incidents, stuck recovery, and at least three campaign patterns.
- [ ] Run `npm run test:traffic:phase2` and observe the expected missing-policy assertion.
- [ ] Implement queue-pressure signal control, bounded weighted routing, calm/rush/surge/incident/recovery demand, closures, rerouting, and public intent.
- [ ] Run focused tests, then Phase 1 plus Phase 2; compare identical seed corpora and require zero invariant or technical outcomes.
- [ ] Run the campaign script with ordinary and pressure configurations and capture distribution summaries.
- [ ] Commit `feat(traffic): add adaptive control and city-scale pressure`.

### Task 3: Phase 3 premium broadcast experience

**Files:**
- Create: `games/ai-city-traffic/src/presentation/snapshot.ts`
- Create: `games/ai-city-traffic/src/presentation/controller.ts`
- Create: `games/ai-city-traffic/src/presentation/audio.ts`
- Create: `public/ai-city-traffic/index.html`
- Create: `public/ai-city-traffic/styles.css`
- Create: `public/ai-city-traffic/app.js`
- Create: `scripts/serve-city-traffic-stream.cjs`
- Modify: `playwright.config.cjs`
- Create: `tests/phase3/traffic-broadcast.test.cjs`
- Create: `tests/browser/traffic-stream.spec.cjs`

**Interfaces:**
- Produces `buildTrafficRenderSnapshot(state)` with privacy-safe geometry, HUD, intent, incidents, audience state, and semantic cues.
- Produces `TrafficPresentationController.accept(snapshot, events)`, `frame()`, `failOutput()`, `rebuildFromLatest()`, and bounded replay.
- Serves `/traffic`, `/traffic/state`, `/traffic/health`, and `/traffic/replay`.

- [ ] Write failing snapshot privacy, mobile hierarchy, bounded replay, cue priority, recovery-scene, and source self-test assertions.
- [ ] Run `npm run test:traffic:phase3` and observe the missing snapshot/controller assertion.
- [ ] Implement the immutable snapshot, cue router, controller, canvas scene, accessible HUD, clean-feed/reduced-motion variants, and secure HTTP host.
- [ ] Run Node Phase 3 tests and `npm run traffic:stream:self-test`.
- [ ] Run Playwright in CI against desktop and phone-size views; require no console errors, no overflow, and evidence screenshots.
- [ ] Commit `feat(traffic): deliver premium broadcast experience`.

### Task 4: Phase 4 audience interaction

**Files:**
- Create: `games/ai-city-traffic/src/influence/catalogue.ts`
- Create: `games/ai-city-traffic/src/influence/types.ts`
- Create: `games/ai-city-traffic/src/influence/controller.ts`
- Modify: `games/ai-city-traffic/src/state/types.ts`
- Modify: `games/ai-city-traffic/src/runtime/run.ts`
- Modify: `games/ai-city-traffic/src/presentation/snapshot.ts`
- Create: `tests/phase4/traffic-audience.test.cjs`

**Interfaces:**
- Produces `queueTrafficInfluence(state, input)`, `applyDueTrafficInfluence(state)`, `reverseTrafficInfluence(state, reversal)`, and `resolveTrafficVote(ballots, rng)`.
- Accepts only normalized envelopes with stable ID, tokenized viewer reference, moderation/authentication status, fixed effect ID, source class, and logical tick.

- [ ] Write failing tests for authentication/moderation rejection, exactly-once duplicate handling, rate/cooldown/queue caps, deterministic ties, expiry, reversal, safe bounds, and provider outage continuity.
- [ ] Run `npm run test:traffic:phase4` and observe the missing interaction-controller assertion.
- [ ] Implement the six-effect catalogue and ordered eligibility/application pipeline with no free text.
- [ ] Run Phase 4, then all traffic tests; replay identical normalized logs and require matching checksums.
- [ ] Verify challenge effects cannot directly set lifecycle/result and paid-eligible inputs receive no bypass.
- [ ] Commit `feat(traffic): add bounded audience policy influence`.

### Task 5: Phase 5 durability, recovery, and operations

**Files:**
- Create: `games/ai-city-traffic/src/persistence/snapshot.ts`
- Create: `games/ai-city-traffic/src/operations/health.ts`
- Create: `games/ai-city-traffic/src/testing/chaos.ts`
- Modify: `games/ai-city-traffic/src/runtime/run.ts`
- Create: `tests/phase5/traffic-recovery-operations.test.cjs`
- Create: `scripts/run-city-traffic-chaos.cjs`
- Create: `docs/operations/ai-city-traffic-runbook.md`
- Create: `docs/operations/ai-city-traffic-rollback-matrix.md`

**Interfaces:**
- Produces `runtime.snapshot()`, `TrafficRuntime.restore(snapshot)`, and typed quarantine errors.
- Produces `assessTrafficHealth(input): TrafficHealthReport` and `runTrafficChaosSuite(seed)`.

- [ ] Write failing tests for snapshot round-trip, uninterrupted/restore equality, corruption/version rejection, provider degradation, duplicate replay, queue pressure, stalled progress, renderer failure, and bounded resources.
- [ ] Run `npm run test:traffic:phase5` and observe the missing snapshot/health assertion.
- [ ] Implement verified snapshot/RNG restore, invariant quarantine, progress/output probes, breakers, safe degradation, and chaos scenarios.
- [ ] Run focused and complete traffic tests plus `npm run traffic:phase5:chaos`; require expected transitions and zero duplicate effects.
- [ ] Exercise headless accelerated soak and verify bounded vehicles, queues, events, replay frames, and snapshot size.
- [ ] Commit `feat(traffic): add verified recovery and operations`.

### Task 6: Phase 6 release candidate and production governance

**Files:**
- Create: `games/ai-city-traffic/src/release/validation.ts`
- Create: `tests/phase6/traffic-production-validation.test.cjs`
- Create: `scripts/run-city-traffic-validation.cjs`
- Modify: `.github/workflows/ci.yml`
- Modify: `README.md`
- Create: `docs/operations/ai-city-traffic-r5-evidence-intake.md`
- Create: `docs/operations/ai-city-traffic-handoff.md`
- Create: `docs/reviews/AI_CITY_TRAFFIC_FINAL_REVIEW.md`

**Interfaces:**
- Produces `validateTrafficRelease(input): TrafficReleaseAssessment` with traceability, campaign, integrity, security, performance, operations, external blockers, readiness, verdict, and `productionReady`.
- The validator may return R5 only when exact-candidate external evidence is present, current, independently reviewed, and passes every gate.

- [ ] Write failing tests that reject synthetic elapsed timestamps, stale provider evidence, missing independent review, missing rollback drill, any P0/P1, replay divergence, private exposure, or duplicate effect.
- [ ] Run `npm run test:traffic:phase6` and observe the missing validator assertion.
- [ ] Implement frozen-manifest validation, software gate scoring, evidence freshness, candidate SHA binding, and fail-closed R5 rules.
- [ ] Extend CI with traffic tests, nondeterminism scan, stream self-test, chaos evidence, validation evidence, browser capture, and artifact upload.
- [ ] Run `npm test`, every traffic script, authoritative nondeterminism scan, and production validation; require software gates to pass and external R5 blockers to remain explicit.
- [ ] Commit `feat(traffic): complete production candidate validation`.

### Task 7: Required game documentation and phase ledger

**Files:**
- Create: `games/ai-city-traffic/README.md`
- Create: `games/ai-city-traffic/PRD.md`
- Create: `games/ai-city-traffic/GAME_DESIGN.md`
- Create: `games/ai-city-traffic/AI_SYSTEM.md`
- Create: `games/ai-city-traffic/VIEWER_INTERACTION.md`
- Create: `games/ai-city-traffic/AUDIO_VISUAL.md`
- Create: `games/ai-city-traffic/TECHNICAL_ARCHITECTURE.md`
- Create: `games/ai-city-traffic/TESTING_STRATEGY.md`
- Create: `games/ai-city-traffic/PRODUCTION_READINESS.md`
- Create: `games/ai-city-traffic/phases/PHASE-01-FOUNDATION.md` through `PHASE-06-PRODUCTION-LAUNCH.md`
- Create: `games/ai-city-traffic/phases/PHASE-LEDGER.md`

**Interfaces:**
- Documents exact implemented contracts, commands, thresholds, ownership, evidence, and readiness language; no aspirational claim may contradict runtime.

- [ ] Map every MUST to a phase, implementation path, test, command, and evidence location.
- [ ] Record each phase's red/green evidence and commit SHA in the ledger after implementation.
- [ ] Scan all game documentation for `TBD`, `TODO`, `implement later`, `handle appropriately`, and unsupported production-ready claims; require zero matches.
- [ ] Commit `docs(traffic): complete game and operations documentation`.

### Task 8: Independent-style two-pass review and publication

**Files:**
- Create: `evidence/ai-city-traffic/r4-phase-06/manifest.md`
- Create: `evidence/ai-city-traffic/r4-phase-06/traceability.csv`
- Create: `evidence/ai-city-traffic/r4-phase-06/reviews/specification-review.md`
- Create: `evidence/ai-city-traffic/r4-phase-06/reviews/quality-review.md`

**Interfaces:**
- Produces a frozen candidate evidence manifest and honest candidate review. Because the implementer is the reviewer in this session, the final R5 review status remains `candidate review`, never independent `PASS`.

- [ ] Run specification review against the design, plan, AGENTS rules, phase checklist, and production standard; fix every P0/P1 finding with a reproducing test.
- [ ] Run engineering/viewer-quality review across architecture, AI, performance, UI, audio, accessibility, interaction, security, recovery, operations, and rollback; fix every load-bearing finding.
- [ ] Run final full verification from a clean build and capture commands/results/checksums.
- [ ] Freeze the runtime candidate SHA, generate traceability and review artefacts, and confirm R4 truthful status.
- [ ] Publish cohesive commits to the feature branch and open a draft pull request with determinism, performance, stream UX, safety, observability, rollout, rollback, and residual-risk sections.
