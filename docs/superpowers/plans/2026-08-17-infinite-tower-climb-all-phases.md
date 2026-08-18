# Infinite Tower Climb All-Phases Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build catalogue Game 3, Infinite Tower Climb, from deterministic physics foundation through complete autonomous gameplay, premium broadcast, bounded audience interaction, durable operations, and truthful production-readiness scoring.

**Architecture:** A game-owned fixed-step kinematic simulation owns authoritative truth. Seeded chunk generation, bounded AI, combat, audience commands and presentation communicate through serializable schemas. Shared platform packages provide RNG, replay checksums, audience contracts, durability, operations and release governance; no game imports another game’s private code.

**Tech Stack:** TypeScript 5.8, Node.js 22, CommonJS output, Node test runner, HTML5 Canvas, Web Audio API models, Playwright Chromium, existing provider-neutral platform packages.

## Global Constraints

- Authoritative time step is 50 ms and all outcome-relevant values are integer fixed-point.
- All randomness uses named seeded streams.
- No network, provider SDK, renderer handle, wall clock or executable closure enters authoritative state.
- Presentation receives immutable sanitized snapshots and cannot mutate gameplay.
- Every generated chunk is validated for traversability, reaction time, entity bounds and safe spawn/exit.
- Every audience effect is prevalidated, idempotent, bounded, expiring, reversible where required and incapable of guaranteeing a terminal outcome.
- Histories, queues, chunks, contacts, entities, replay frames and audit records are bounded.
- Technical faults are quarantined and never reported as normal game losses or records.
- `productionReady: true` requires genuine external R5 evidence; CI fixtures cannot satisfy it.

---

### Task 1: Phase 1 deterministic foundation

**Files:**
- Create: `games/infinite-tower-climb/src/config/schema.ts`
- Create: `games/infinite-tower-climb/src/state/types.ts`
- Create: `games/infinite-tower-climb/src/generation/chunks.ts`
- Create: `games/infinite-tower-climb/src/generation/validator.ts`
- Create: `games/infinite-tower-climb/src/physics/step.ts`
- Create: `games/infinite-tower-climb/src/rules/step.ts`
- Create: `games/infinite-tower-climb/src/runtime/run.ts`
- Create: `games/infinite-tower-climb/src/persistence/snapshot.ts`
- Create: `games/infinite-tower-climb/src/testing/headless.ts`
- Create: `games/infinite-tower-climb/src/index.ts`
- Create: `tests/foundation/tower-physics.test.cjs`
- Create: `tests/foundation/tower-generation.test.cjs`
- Create: `tests/foundation/tower-runtime.test.cjs`
- Modify: `tsconfig.json`
- Modify: `package.json`

**Interfaces:**
- Produces `TowerRuntime.create(config, seed)`, `TowerRuntime.step(action?)`, `createTowerSnapshot`, `restoreTowerSnapshot`, `generateTowerChunk`, `validateTowerChunk`, `stepTowerPhysics`, and `runTowerHeadless`.

- [ ] Write tests for config rejection, exact seeded chunks, safe connectors, swept floor/wall collision, one-way platform landing, moving-platform carry, fall terminal, checkpoint restore, lifecycle restart, snapshot replay and corruption/version rejection.
- [ ] Run `npm run build && node --test tests/foundation/tower-*.test.cjs`; confirm failures are missing Tower modules.
- [ ] Implement minimal fixed-point schemas, generator, validator, physics, rules, runtime and snapshot logic.
- [ ] Run the focused command until all Tower Phase 1 tests pass.
- [ ] Run `npm test` to preserve Snake and Maze regressions.
- [ ] Commit `feat(tower): implement deterministic Phase 1 foundation`.

### Task 2: Phase 2 autonomous gameplay, combat and progression

**Files:**
- Create: `games/infinite-tower-climb/src/ai/observation.ts`
- Create: `games/infinite-tower-climb/src/ai/graph.ts`
- Create: `games/infinite-tower-climb/src/ai/policy.ts`
- Create: `games/infinite-tower-climb/src/ai/stuck.ts`
- Create: `games/infinite-tower-climb/src/combat/step.ts`
- Create: `games/infinite-tower-climb/src/generation/content.ts`
- Create: `games/infinite-tower-climb/src/progression/builds.ts`
- Create: `games/infinite-tower-climb/src/testing/campaign.ts`
- Create: `tests/phase2/tower-ai.test.cjs`
- Create: `tests/phase2/tower-content-campaign.test.cjs`
- Modify: `games/infinite-tower-climb/src/rules/step.ts`
- Modify: `games/infinite-tower-climb/src/runtime/run.ts`
- Modify: `games/infinite-tower-climb/src/state/types.ts`

**Interfaces:**
- Produces `createTowerObservation`, `chooseTowerAction`, `stepTowerCombat`, `generateTowerContent`, `offerTowerUpgrades`, and `runTowerCampaign`.

- [ ] Write tests proving observation privacy, legal actions, ledge/hazard reflexes, timing waits, route progress, stuck recovery, melee/projectile exactly-once damage, invulnerability windows, upgrade determinism, five themes, checkpoint progression, guardian outcomes and deterministic campaigns.
- [ ] Run `npm run build && node --test tests/phase2/tower-*.test.cjs`; confirm expected missing-behaviour failures.
- [ ] Implement the bounded policy stack, combat, enemies, hazards, builds, guardians and streaming progression.
- [ ] Run focused tests, then `npm test`.
- [ ] Generate a deterministic campaign report with zero technical outcomes, invalid chunks or replay divergence.
- [ ] Commit `feat(tower): complete autonomous Phase 2 gameplay`.

### Task 3: Phase 3 premium broadcast experience

**Files:**
- Create: `games/infinite-tower-climb/src/presentation/snapshot.ts`
- Create: `games/infinite-tower-climb/src/presentation/layout.ts`
- Create: `games/infinite-tower-climb/src/presentation/camera.ts`
- Create: `games/infinite-tower-climb/src/presentation/audio.ts`
- Create: `games/infinite-tower-climb/src/presentation/controller.ts`
- Create: `public/infinite-tower-climb/index.html`
- Create: `public/infinite-tower-climb/styles.css`
- Create: `public/infinite-tower-climb/app.js`
- Create: `scripts/serve-tower-stream.cjs`
- Create: `tests/phase3/tower-presentation.test.cjs`
- Create: `tests/browser/tower-stream.spec.cjs`
- Modify: `package.json`
- Modify: `playwright.config.cjs`

**Interfaces:**
- Produces `createTowerRenderSnapshot`, `TowerPresentationController`, responsive layout/camera/audio models, `/tower/state`, and an OBS-ready browser source.

- [ ] Write tests for immutable privacy-safe render snapshots, ten-second HUD hierarchy, camera bounds, reduced motion, high contrast, captions, mute, clean feed, replay bounds, stale snapshot rejection, output recovery and serialized polling.
- [ ] Run focused Node tests and confirm missing presentation behavior.
- [ ] Implement the presentation model and dependency-free Canvas source.
- [ ] Run `npm run tower:stream:self-test` and `npm run test:browser`.
- [ ] Retain desktop, phone-landscape and clean-feed screenshots in `artifacts/tower-phase3`.
- [ ] Commit `feat(tower): deliver Phase 3 broadcast experience`.

### Task 4: Phase 4 bounded audience interaction

**Files:**
- Create: `games/infinite-tower-climb/src/influence/types.ts`
- Create: `games/infinite-tower-climb/src/influence/catalogue.ts`
- Create: `games/infinite-tower-climb/src/influence/candidates.ts`
- Create: `games/infinite-tower-climb/src/influence/apply.ts`
- Create: `games/infinite-tower-climb/src/influence/director.ts`
- Create: `games/infinite-tower-climb/src/influence/index.ts`
- Create: `tests/phase4/tower-influence.test.cjs`
- Create: `tests/phase4/tower-pressure.test.cjs`
- Modify: `games/infinite-tower-climb/src/runtime/run.ts`
- Modify: `games/infinite-tower-climb/src/state/types.ts`

**Interfaces:**
- Produces ten effect definitions, prevalidated candidates, `createTowerInfluenceCommand`, `applyDueTowerInfluences`, and deterministic decision windows.

- [ ] Write tests for all ten effect families, traversability preservation, minimum reaction windows, one vote per viewer, deterministic ties, rate/cooldown/pressure caps, expiry, reversal, snapshot restore, exactly-once application, prohibited terminal outcomes and no-audience continuity.
- [ ] Run focused tests and observe expected failures.
- [ ] Implement provider-neutral influence logic using existing audience contracts/gateway boundaries.
- [ ] Run focused tests and full `npm test`.
- [ ] Run maximum-pressure and zero-audience campaigns twice and compare checksums.
- [ ] Commit `feat(tower): implement safe Phase 4 audience interaction`.

### Task 5: Phase 5 durability, recovery and operations

**Files:**
- Create: `services/tower-channel/src/index.ts`
- Create: `games/infinite-tower-climb/src/operations/health.ts`
- Create: `games/infinite-tower-climb/src/operations/drills.ts`
- Create: `games/infinite-tower-climb/src/operations/chaos.ts`
- Create: `scripts/run-tower-phase5-chaos.cjs`
- Create: `tests/phase5/tower-channel.test.cjs`
- Create: `tests/phase5/tower-recovery-chaos.test.cjs`
- Create: `tests/phase5/tower-transactional-boundaries.test.cjs`
- Modify: `package.json`

**Interfaces:**
- Produces `TowerChannelService`, exact reconstruction, lease fencing, durable command reservation, health evaluation, drill catalogue and `runTowerPhase5Chaos`.

- [ ] Write tests for append-only events, bounded snapshots/audit, command sequence, process reconstruction, corrupt-newest fallback, stale-writer fencing, replay divergence quarantine, dependency-outage rejection-before-reservation, audit-before-operator-mutation, output safe scene, resource pressure and deterministic chaos.
- [ ] Run focused tests and observe missing service behavior.
- [ ] Implement the service by composing public durable-store, recovery, operations, observability, output-health and operator-control packages.
- [ ] Run focused tests, full tests and `npm run tower:phase5:chaos -- tower-phase5-ci`.
- [ ] Commit `feat(tower): complete Phase 5 reliability and operations`.

### Task 6: Phase 6 release governance and readiness score

**Files:**
- Create: `games/infinite-tower-climb/src/release/validation.ts`
- Create: `games/infinite-tower-climb/src/release/score.ts`
- Create: `scripts/run-tower-phase6-validation.cjs`
- Create: `tests/phase6/tower-validation.test.cjs`
- Create: `tests/phase6/tower-readiness-score.test.cjs`
- Create: `tests/phase6/tower-release-evidence.test.cjs`
- Create: `docs/operations/infinite-tower-climb-runbook.md`
- Create: `docs/operations/infinite-tower-climb-rollback-matrix.md`
- Create: `docs/operations/infinite-tower-climb-r5-evidence-intake.md`
- Modify: `.github/workflows/ci.yml`
- Modify: `package.json`

**Interfaces:**
- Produces `createTowerReleaseManifest`, `createTowerValidationBundle`, `scoreTowerReadiness`, exact-candidate artifacts and CI evidence.

- [ ] Write tests for immutable exact-SHA manifests, candidate-bound evidence, complete traceability, deterministic final baseline/pressure campaigns, zero software blockers, synthetic evidence remaining R4/BLOCKED, integrity failures returning FAIL, and score caps.
- [ ] Run focused tests and observe missing validation behavior.
- [ ] Implement validation and score using release-governance, release-validation, canary-control and readiness-assessor packages.
- [ ] Run `npm run tower:phase6:validate` with the exact branch SHA in CI.
- [ ] Update CI with Tower self-test, nondeterminism scan, Phase 5/6 evidence generation and artifact upload.
- [ ] Commit `feat(tower): complete Phase 6 release governance`.

### Task 7: Documentation, phase evidence and final review

**Files:**
- Create: `games/infinite-tower-climb/README.md`
- Create: `games/infinite-tower-climb/PRD.md`
- Create: `games/infinite-tower-climb/GAME_DESIGN.md`
- Create: `games/infinite-tower-climb/AI_SYSTEM.md`
- Create: `games/infinite-tower-climb/VIEWER_INTERACTION.md`
- Create: `games/infinite-tower-climb/AUDIO_VISUAL.md`
- Create: `games/infinite-tower-climb/TECHNICAL_ARCHITECTURE.md`
- Create: `games/infinite-tower-climb/TESTING_STRATEGY.md`
- Create: `games/infinite-tower-climb/PRODUCTION_READINESS.md`
- Create: `games/infinite-tower-climb/phases/PHASE-01-FOUNDATION.md` through `PHASE-06-RELEASE.md`
- Create: `evidence/infinite-tower-climb/phase-01/README.md` through `phase-06/README.md`
- Create: `docs/reviews/INFINITE_TOWER_CLIMB_FINAL_REVIEW.md`
- Modify: `README.md`
- Modify: `docs/catalogue/FOUNDATION_STATUS.md`

- [ ] Review exact specification compliance against the design and every phase criterion.
- [ ] Review architecture ownership, fixed-step physics, AI legality/privacy, generation validity, combat ordering, audience fairness, UI hierarchy, accessibility, resource bounds, recovery, security/privacy and release truthfulness.
- [ ] Add red-green regression tests for every Critical or Important finding and fix them.
- [ ] Run `npm ci --no-audit --no-fund`, `npm test`, all stream self-tests, `npm run test:browser`, nondeterminism scan, Tower chaos and Tower Phase 6 validation.
- [ ] Confirm zero open software P0/P1 findings and record exact test counts, workflow/job IDs, artifact IDs/digests and score.
- [ ] Open a reviewed PR to `main`, wait for green exact-head CI, and keep genuine external R5 gates blocked rather than fabricating them.