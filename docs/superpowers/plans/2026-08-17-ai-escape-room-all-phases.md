# AI Escape Room Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Game 8, AI Escape Room, from a deterministic symbolic-puzzle foundation through a reviewed R4 production candidate with premium livestream presentation, bounded audience interaction, durable recovery and truthful release validation.

**Architecture:** Add an isolated `games/ai-escape-room/` module that consumes shared seeded RNG, replay, audience, durability, operations and release-governance contracts. One fixed-step runtime owns authoritative room truth; the normal AI sees only a serialized observation and bounded belief graph, while an isolated oracle proves generated-room solvability. Immutable render snapshots feed a dependency-free Canvas browser source, and external influence reaches authority only through prevalidated, durable, idempotent commands.

**Tech Stack:** TypeScript 5.8, Node.js 22, strict CommonJS compilation, Node test runner, Playwright 1.55, dependency-free HTML/CSS/Canvas, existing catalogue shared packages.

## Global Constraints

- All authoritative time is integer logical ticks; wall-clock and render delta cannot change outcomes.
- Every authoritative random draw uses a named `NamedRng` stream and is included in snapshot/replay state.
- Identical version, configuration, content, seed and normalized command log must reproduce accepted actions, results and checksums.
- Normal AI, public intent and presentation cannot access hidden solutions, unopened contents, future draws or oracle routes.
- Generation has bounded attempts, typed diagnostics and a versioned known-good fallback; invalid rooms are technical failures, never fair losses.
- Presentation consumes immutable public snapshots and cannot mutate authority.
- Provider payloads, entitlement/payment details, remote model responses and browser state never enter authoritative truth directly.
- Audience effects must preserve at least one valid solution, action/timer response budgets and non-terminal outcome uncertainty.
- Remote inference is optional, asynchronous and non-authoritative; the complete run works without it.
- Every collection, queue, journal, history, cache, snapshot set and render trail has an explicit bound.
- R5 and `productionReady=true` remain blocked until primary 72-hour soak, seven-day canary, witnessed drills, credentialed provider checks and independent signed exact-candidate review exist.

---

### Task 1: Phase 1 contracts, configuration and deterministic room generator

**Files:**
- Modify: `packages/game-contracts/src/index.ts`
- Create: `games/ai-escape-room/src/config/schema.ts`
- Create: `games/ai-escape-room/src/state/types.ts`
- Create: `games/ai-escape-room/src/generation/templates.ts`
- Create: `games/ai-escape-room/src/generation/generator.ts`
- Create: `games/ai-escape-room/src/generation/solver.ts`
- Create: `games/ai-escape-room/src/generation/validator.ts`
- Create: `games/ai-escape-room/src/manifest.ts`
- Test: `tests/escape-room/phase1-generation.test.cjs`

**Interfaces:**
- Produces shared `EscapeRoomConfig`, `EscapeAction`, `EscapeRunResult`, `EscapeTheme` and `EscapeStrategy` contracts.
- Produces `parseEscapeRoomConfig(input: unknown): EscapeRoomConfig`.
- Produces `generateEscapeRoom(config: EscapeRoomConfig, rng: NamedRng): GeneratedEscapeRoom`.
- Produces `solveEscapeRoom(room: EscapeRoomDefinition): EscapeSolution | null`.
- Produces `validateEscapeRoom(room: EscapeRoomDefinition, config: EscapeRoomConfig): EscapeValidation`.

- [ ] **Step 1: Write invalid-config and determinism tests.** Add tests equivalent to:

```js
assert.throws(() => parseEscapeRoomConfig({schemaVersion:1, difficulty:0}), /difficulty/)
const a = generateEscapeRoom(config, NamedRng.fromSeed('vault-17'))
const b = generateEscapeRoom(config, NamedRng.fromSeed('vault-17'))
assert.deepEqual(a, b)
```

Also assert theme, puzzle-depth, object-count, timer, hazard, decoy, intermission, attempt and history bounds.

- [ ] **Step 2: Run the focused test in the red state.** Run `npm run build && node --test tests/escape-room/phase1-generation.test.cjs`; expect missing exports and modules, not syntax or harness errors.
- [ ] **Step 3: Add exact contracts and configuration parsing.** Use integer bounds: difficulty 1–20, max ticks 50–1,000,000, intermission 0–10,000, puzzle depth 2–12, object count 6–48, decoys 0–12, hazards 0–6, hint budget 0–6, generation attempts 1–32, no-progress 20–100,000, fact history 16–512 and command history 16–4,096.
- [ ] **Step 4: Implement authored puzzle templates.** Define sequence, cipher, shape-order, tool dependency, switch network, balance, directional-pattern and final-vault primitives with stable IDs, public surfaces, hidden solution data, prerequisites and legal actions.
- [ ] **Step 5: Implement constructive generation.** Build a dependency DAG first, place mandatory clues/tools before locks, add optional clues/decoys/hazards on separate named streams, extract measurable features and use a known-good fallback after the configured bounded attempts.
- [ ] **Step 6: Implement isolated solver and typed validator.** Prove dependency reachability, solution existence, required clue redundancy, timer/action budget, hazard response window, object uniqueness and bounded sizes. Return diagnostics such as `missing-prerequisite`, `ambiguous-final-code`, `timer-budget`, `untelegraphed-hazard` and `duplicate-id`.
- [ ] **Step 7: Run focused and compile checks.** Run `npm run build && node --test tests/escape-room/phase1-generation.test.cjs`; expect all tests green and no ambient `Math.random` or wall-clock use in the module.
- [ ] **Step 8: Commit.** Commit `feat(escape-room): add deterministic puzzle generation`.

### Task 2: Phase 1 authoritative rules, runtime, replay and headless evidence

**Files:**
- Create: `games/ai-escape-room/src/rules/actions.ts`
- Create: `games/ai-escape-room/src/rules/step.ts`
- Create: `games/ai-escape-room/src/runtime/run.ts`
- Create: `games/ai-escape-room/src/persistence/snapshot.ts`
- Create: `games/ai-escape-room/src/testing/headless.ts`
- Create: `games/ai-escape-room/src/index.ts`
- Create: `scripts/run-escape-room-headless.cjs`
- Modify: `package.json`
- Modify: `tsconfig.json`
- Create: `games/ai-escape-room/phases/PHASE-01-FOUNDATION.md`
- Create: `evidence/ai-escape-room/r1-phase-01/phase-01/README.md`
- Test: `tests/escape-room/phase1-runtime.test.cjs`

**Interfaces:**
- Consumes Task 1 generation/validation contracts.
- Produces `createInitialEscapeState(config, seed, runId, rng): EscapeState`.
- Produces `listLegalEscapeActions(state): EscapeAction[]` and `applyEscapeAction(state, action, rng): EscapeStepResult`.
- Produces `EscapeRuntime.create`, `step`, `applyAction`, `restart`, `drainEvents`, `signals`, `snapshotMaterial` and exact restore.
- Produces `encodeEscapeSnapshot(runtime): EscapeSnapshotEnvelope` and `restoreEscapeRuntime(envelope): EscapeRuntime`.

- [ ] **Step 1: Write failing lifecycle and action tests.** Cover inspect, take, combine, use, enter-code, activate, wait and exit; reject stale/illegal targets atomically; assert result → intermission → new seeded room lifecycle.
- [ ] **Step 2: Write replay tests before implementation.** Run the same seed/action log twice, restore at a midpoint, corrupt checksum/schema/config hash and assert uninterrupted/restored equivalence or typed quarantine.
- [ ] **Step 3: Confirm red.** Run `npm run build && node --test tests/escape-room/phase1-runtime.test.cjs`; expected failures name missing runtime/rules/snapshot exports.
- [ ] **Step 4: Implement fixed system order.** For each tick process lifecycle command, due audience command placeholder, selected action, item/puzzle resolution, hazard update, timer/progress/result, bounded events and checksum in stable-ID order.
- [ ] **Step 5: Implement versioned snapshot envelope.** Include game/schema/determinism/config/content versions, run/room IDs, root seed, named RNG snapshot, tick, state, next event sequence, accepted command sequence and canonical checksum.
- [ ] **Step 6: Implement headless oracle-test policy.** Keep the oracle path behind explicit `policy:'oracle-test'`; production defaults must not import or receive it. Add a runner that emits seed, result, action count and checksum.
- [ ] **Step 7: Run verification twice.** Run the focused test, `npm run build`, `npm run escape-room:headless` twice and compare final checksums.
- [ ] **Step 8: Update phase/evidence and commit.** Record only observed commands/results, then commit `feat(escape-room): complete deterministic foundation runtime`.

### Task 3: Phase 2 observation, belief graph and bounded autonomous planner

**Files:**
- Create: `games/ai-escape-room/src/ai/observation.ts`
- Create: `games/ai-escape-room/src/ai/belief.ts`
- Create: `games/ai-escape-room/src/ai/planner.ts`
- Create: `games/ai-escape-room/src/ai/policy.ts`
- Create: `games/ai-escape-room/src/ai/stuck.ts`
- Modify: `games/ai-escape-room/src/runtime/run.ts`
- Modify: `games/ai-escape-room/src/state/types.ts`
- Test: `tests/escape-room/phase2-ai.test.cjs`

**Interfaces:**
- Produces `createEscapeObservation(state): EscapeObservation`.
- Produces `updateEscapeBelief(previous, observation, limits): EscapeBelief`.
- Produces `planEscapeAction(observation, belief, budget): EscapeDecision`.
- Produces `detectEscapePathology(state, decisionHistory): EscapePathology | null`.

- [ ] **Step 1: Write recursive hidden-information leakage tests.** Scan observation, belief public projection, decision and intent for hidden code values, unopened contents, undiscovered clues, oracle route and future hazard state.
- [ ] **Step 2: Write planner behavior tests.** Cover information-gain inspection, prerequisite ordering, tool combination, lock/code execution, immediate hazard reflex, deterministic ties, expansion cap, stale-plan invalidation and no legal action fallback.
- [ ] **Step 3: Write loop/pathology tests.** Force repeated inspect, contradictory hypothesis, exhausted plan and no-progress states; require bounded recovery through plan reset, alternate clue, safe wait or technical quarantine.
- [ ] **Step 4: Confirm red.** Run `npm run build && node --test tests/escape-room/phase2-ai.test.cjs`.
- [ ] **Step 5: Implement serialized observation and bounded belief.** Retain at most configured facts/hypotheses/history, age facts deterministically and expose only templated public intent fields: goal, observation, intent, confidence band, fallback and plan-change reason.
- [ ] **Step 6: Implement deterministic best-first planner.** Rank legal actions by information gain, prerequisite progress, unlock value, action cost, timer/hazard risk and repetition penalty; cap expansions and use stable action-key ordering.
- [ ] **Step 7: Switch production runtime to the bounded policy.** Oracle-test remains explicit and test-only; policy returns actions for validation rather than mutating state.
- [ ] **Step 8: Run focused and regression checks, then commit.** Commit `feat(escape-room): add bounded symbolic puzzle AI`.

### Task 4: Phase 2 content progression, hazards and deterministic campaign

**Files:**
- Create: `games/ai-escape-room/src/content/progression.ts`
- Create: `games/ai-escape-room/src/hazards/step.ts`
- Create: `games/ai-escape-room/src/testing/campaign.ts`
- Create: `scripts/run-escape-room-campaign.cjs`
- Modify: `package.json`
- Create: `games/ai-escape-room/phases/PHASE-02-CORE-AI-CONTENT.md`
- Create: `evidence/ai-escape-room/r2-phase-02/phase-02/README.md`
- Test: `tests/escape-room/phase2-campaign.test.cjs`

**Interfaces:**
- Produces deterministic theme/difficulty rotation and `deriveEscapeDifficulty(roomIndex, streak)`.
- Produces `stepEscapeHazards(state): HazardStepResult`.
- Produces `runEscapeCampaign(options): EscapeCampaignSummary`.

- [ ] **Step 1: Write failing hazard and progression tests.** Prove telegraph-before-active, configured response ticks, non-mandatory unavoidable damage, deterministic theme rotation and bounded difficulty.
- [ ] **Step 2: Write stratified campaign tests.** Use declared seeds across every theme, difficulty bands 1–5, 6–10, 11–15 and 16–20, with technical failures excluded from fair-loss statistics.
- [ ] **Step 3: Require campaign metrics.** Measure validity/fallback rate, solve/fair-failure/technical outcome, planner expansion tails, action legality, stuck recovery, room diversity features and at least four dramatic-pattern classes.
- [ ] **Step 4: Confirm red, implement minimum progression/hazard/campaign behavior, then rerun.** Use the same rules and planner as streamed runtime; do not create fast-mode logic.
- [ ] **Step 5: Run the campaign twice.** Require identical summary checksum and bounded runtime/memory counters.
- [ ] **Step 6: Update phase evidence and commit.** Commit `feat(escape-room): complete puzzle content and progression`.

### Task 5: Phase 3 immutable render contract and premium browser source

**Files:**
- Create: `games/ai-escape-room/src/presentation/snapshot.ts`
- Create: `games/ai-escape-room/src/presentation/layout.ts`
- Create: `games/ai-escape-room/src/presentation/camera.ts`
- Create: `games/ai-escape-room/src/presentation/audio.ts`
- Create: `games/ai-escape-room/src/presentation/controller.ts`
- Create: `public/ai-escape-room/index.html`
- Create: `public/ai-escape-room/styles.css`
- Create: `public/ai-escape-room/app.js`
- Create: `scripts/serve-escape-room-stream.cjs`
- Modify: `package.json`
- Modify: `playwright.config.cjs`
- Create: `games/ai-escape-room/phases/PHASE-03-BROADCAST-EXPERIENCE.md`
- Create: `evidence/ai-escape-room/r2-phase-03/phase-03/README.md`
- Test: `tests/escape-room/phase3-presentation.test.cjs`
- Test: `tests/browser/escape-room-stream.spec.cjs`

**Interfaces:**
- Produces immutable `EscapeRenderSnapshot` with visible room objects, avatar, objective, progress, inventory, public reasoning, semantic events and health only.
- Produces `computeEscapeLayout(viewport, mode)`, `updateEscapeCamera`, `deriveEscapeAudioCues` and `EscapePresentationController`.
- Serves `/escape-room`, `/escape-room/state`, `/escape-room/health` and a deterministic `--self-test`.

- [ ] **Step 1: Write snapshot privacy/immutability tests.** Verify deep-copy/freeze semantics, hidden-solution exclusion, bounded objects/reasoning/events and idempotent projection.
- [ ] **Step 2: Write layout/accessibility tests.** Assert desktop, phone landscape, clean feed, high contrast, reduced motion and muted-caption modes keep objective, progress, timer, intent, inventory and technical health visible.
- [ ] **Step 3: Confirm red, then implement the TypeScript presentation contracts.** Camera and animation are cosmetic and cannot alter state or RNG streams.
- [ ] **Step 4: Implement The Cipher Vault UI.** Use semantic icon/shape/texture distinctions, large room stage, compact mission header, inventory/progress strips, public reasoning panel, captions, restrained VFX and no external asset dependency.
- [ ] **Step 5: Implement serialized polling and safe output behavior.** One in-flight state request maximum, timeout/abort, stale/black/frozen/silent classification, latest-valid snapshot recovery and visible safe scene.
- [ ] **Step 6: Add browser tests.** Check no overflow, essential copy, canvas visibility, keyboard/focus semantics, public-state privacy, state polling concurrency, reduced motion, muted comprehension and clean feed.
- [ ] **Step 7: Run strict build, unit test, browser test and stream self-test.** Retain captures/reports in CI artifacts rather than fabricating committed screenshots.
- [ ] **Step 8: Update phase evidence and commit.** Commit `feat(escape-room): deliver premium broadcast experience`.

### Task 6: Phase 4 bounded audience influence and Chat vs AI strategy votes

**Files:**
- Create: `games/ai-escape-room/src/influence/types.ts`
- Create: `games/ai-escape-room/src/influence/catalogue.ts`
- Create: `games/ai-escape-room/src/influence/candidates.ts`
- Create: `games/ai-escape-room/src/influence/apply.ts`
- Create: `games/ai-escape-room/src/influence/director.ts`
- Create: `games/ai-escape-room/src/influence/index.ts`
- Modify: `games/ai-escape-room/src/runtime/run.ts`
- Modify: `games/ai-escape-room/src/state/types.ts`
- Modify: `games/ai-escape-room/src/presentation/snapshot.ts`
- Create: `games/ai-escape-room/phases/PHASE-04-AUDIENCE-INTERACTION.md`
- Create: `evidence/ai-escape-room/r3-phase-04/phase-04/README.md`
- Test: `tests/escape-room/phase4-influence.test.cjs`

**Interfaces:**
- Produces effect types `spotlight-object`, `reveal-clue-fragment`, `timer-extension`, `suppress-hazard`, `add-decoy`, `shuffle-labels`, `next-theme` and `strategy-vote`.
- Produces `buildEscapeInfluenceCandidates`, `queueEscapeInfluence`, `applyDueEscapeInfluence` and `EscapeInfluenceDirector`.

- [ ] **Step 1: Write solvability-preservation tests for every effect.** Apply each candidate to cloned state and rerun the solver/validator; reject complete-answer reveal, terminal forcing, missing response budget and invalid arbitrary target/text.
- [ ] **Step 2: Write transaction tests.** Cover duplicate retry, reordered delivery, stale room/tick, snapshot restore, expiry, reversal, cap, cooldown, deterministic tie and immutable command ID.
- [ ] **Step 3: Write dependency-failure tests.** Provider, moderation, entitlement and durable-audit uncertainty must reject before sequence/journal/state mutation; no-audience mode must continue normally.
- [ ] **Step 4: Confirm red and implement prevalidated candidates only.** Accepted commands are scheduled and applied exactly once in authoritative order.
- [ ] **Step 5: Run no-audience and maximum-pressure campaigns.** Require zero duplicate authoritative application, zero unsolvable rooms and zero guaranteed terminal effects.
- [ ] **Step 6: Update phase evidence and commit.** Commit `feat(escape-room): add fair audience influence`.

### Task 7: Phase 5 durable channel, health classification and verified recovery

**Files:**
- Create: `services/escape-room-channel/src/index.ts`
- Create: `games/ai-escape-room/src/operations/health.ts`
- Create: `games/ai-escape-room/src/operations/drills.ts`
- Create: `games/ai-escape-room/src/operations/chaos.ts`
- Create: `scripts/run-escape-room-phase5-chaos.cjs`
- Modify: `package.json`
- Modify: `.github/workflows/ci.yml`
- Create: `docs/operations/ai-escape-room-runbook.md`
- Create: `docs/operations/ai-escape-room-rollback-matrix.md`
- Create: `games/ai-escape-room/phases/PHASE-05-RELIABILITY-OPERATIONS.md`
- Create: `evidence/ai-escape-room/r4-phase-05/phase-05/README.md`
- Test: `tests/escape-room/phase5-operations.test.cjs`

**Interfaces:**
- Produces `EscapeRoomChannelService.start`, exactly-once `tick`, `submitInfluence`, `captureSnapshot`, verified `recover`, `executeControl`, `status` and `stop`.
- Produces health levels `healthy`, `degraded`, `safe-scene`, `quarantined` and typed reasons.
- Produces deterministic `runEscapeChaosSuite(options): EscapeChaosSummary`.

- [ ] **Step 1: Write recovery tests.** Cover post-snapshot replay, corrupt-newest fallback, unsupported schema, config/content mismatch, event discontinuity, divergence quarantine, stale writer fencing and fresh-run boundary.
- [ ] **Step 2: Write control and durability tests.** Commands are audited before mutation, duplicate IDs are idempotent, unavailable durable audit fails closed, retained snapshots/events/commands respect declared bounds.
- [ ] **Step 3: Write health/chaos tests.** Inject stalled AI, repeated loop, invalid room, persistence outage, provider outage, stale/black/frozen/silent output, queue pressure, memory threshold and crash loop; assert typed degradation and recovery ownership.
- [ ] **Step 4: Confirm red, then adapt shared durability/lease/observability/output-health/operator contracts.** Do not create provider SDK or database coupling inside the game.
- [ ] **Step 5: Implement safe-scene and quarantine behavior.** Integrity failures stop authoritative continuation; optional dependency failures preserve truthful autonomous play when possible.
- [ ] **Step 6: Run chaos twice.** Require identical summary checksum, zero integrity loss, bounded counters and successful declared recovery/rollback paths.
- [ ] **Step 7: Update runbook, rollback matrix and evidence, then commit.** Commit `feat(escape-room): complete durable channel operations`.

### Task 8: Phase 6 exact-candidate release validation and truthful readiness score

**Files:**
- Create: `games/ai-escape-room/src/release/validation.ts`
- Create: `games/ai-escape-room/src/release/score.ts`
- Create: `scripts/run-escape-room-phase6-validation.cjs`
- Modify: `package.json`
- Modify: `.github/workflows/ci.yml`
- Create: `games/ai-escape-room/README.md`
- Create: `games/ai-escape-room/PRD.md`
- Create: `games/ai-escape-room/GAME_DESIGN.md`
- Create: `games/ai-escape-room/AI_SYSTEM.md`
- Create: `games/ai-escape-room/VIEWER_INTERACTION.md`
- Create: `games/ai-escape-room/AUDIO_VISUAL.md`
- Create: `games/ai-escape-room/TECHNICAL_ARCHITECTURE.md`
- Create: `games/ai-escape-room/TESTING_STRATEGY.md`
- Create: `games/ai-escape-room/PRODUCTION_READINESS.md`
- Create: `games/ai-escape-room/phases/PHASE-06-PRODUCTION-LAUNCH.md`
- Create: `docs/operations/ai-escape-room-r5-evidence-intake.md`
- Create: `docs/operations/ai-escape-room-handoff.md`
- Create: `evidence/ai-escape-room/r5-phase-06/phase-06/README.md`
- Test: `tests/escape-room/phase6-release.test.cjs`

**Interfaces:**
- Produces exact-candidate `EscapeValidationBundle` with manifest, traceability, deterministic campaigns, capacity, endurance semantics, provider/safety/drill/canary evidence and checksum.
- Produces `scoreEscapeReadiness(bundle): {score:number; softwareScore:number; grade:string; verdict:'PASS'|'BLOCKED_EXTERNAL'|'FAIL'; highestTruthfulReadiness:'R1'|'R2'|'R3'|'R4'|'R5'; productionReady:boolean; blockers:string[]}`.

- [ ] **Step 1: Write failing manifest and traceability tests.** Require candidate SHA/version/config/content hashes, command/environment details, thresholds, artifact digests and complete Phase 1–6 requirement mapping.
- [ ] **Step 2: Write readiness-truth tests.** Full software evidence without primary soak/canary/witness/provider/independent-review artifacts must yield software-complete R4, `BLOCKED_EXTERNAL`, `productionReady:false`; invalid software evidence must yield `FAIL`.
- [ ] **Step 3: Write external evidence anti-forgery tests.** Synthetic timestamps, fixtures, self-attestation, mismatched SHA/config or unwitnessed drills award zero external points.
- [ ] **Step 4: Confirm red and implement validation/score.** Cap immediately available software points at 88 and external primary evidence at 12; list exact blockers rather than generic messages.
- [ ] **Step 5: Run validation twice and compare bundle checksums.** Run strict build, all Escape Room tests, catalogue regression, stream self-test, browser tests, campaign and chaos before generating the bundle.
- [ ] **Step 6: Complete all required game documentation.** Each document states actual interfaces, commands, limits, ownership, SLOs, rollback and readiness truth without placeholders or unsupported production claims.
- [ ] **Step 7: Update Phase 6 evidence and commit.** Commit `feat(escape-room): complete release validation and documentation`.

### Task 9: Independent specification, architecture, UI and production-readiness review

**Files:**
- Create: `docs/reviews/AI_ESCAPE_ROOM_FINAL_REVIEW.md`
- Create: `evidence/ai-escape-room/r5-phase-06/phase-06/review.md`
- Modify any code/test/document files required by review findings.

**Interfaces:**
- Consumes the exact branch candidate after Tasks 1–8.
- Produces a severity-ranked review, resolved-finding ledger, verification snapshot and truthful readiness verdict.

- [ ] **Step 1: Run specification-compliance review.** Map every approved design section and six phase exit criteria to code, tests, docs and evidence; record missing or contradictory implementation as P0/P1/P2/P3.
- [ ] **Step 2: Run engineering review.** Inspect authority ownership, observation privacy, deterministic ordering, generator proof, planner budgets, influence transactions, durability, recovery, bounded resources, security/privacy and release governance.
- [ ] **Step 3: Run viewer-experience review.** Inspect desktop, phone landscape, clean feed, high contrast, reduced motion and muted comprehension; check hierarchy, room-stage use, public reasoning accuracy, caption density, color-independent cues and output-safe behavior.
- [ ] **Step 4: Add a failing regression test for each load-bearing finding before fixing it.** Confirm each red state, apply the root-cause fix and rerun focused/full suites.
- [ ] **Step 5: Require zero open software P0/P1.** P2/P3 may remain only with explicit owner, risk, mitigation and target; external R5 blockers remain truthful rather than treated as software defects.
- [ ] **Step 6: Commit final fixes/review.** Commit `fix(escape-room): resolve final production-candidate review` or `docs(escape-room): record clean final review` as appropriate.

### Task 10: Verify branch, publish PR and integrate

**Files:**
- No new product files unless verification uncovers a defect.

**Interfaces:**
- Produces a reviewable pull request from `agent/ai-escape-room-all-phases` to `main`, with exact test results, rollout/rollback and remaining external evidence blockers.

- [ ] **Step 1: Run final local verification from a clean build.** Run `npm run clean`, strict build, every Node test, Escape Room focused tests, browser tests, headless/campaign/stream self-test/chaos/release validation and ambient nondeterminism/placeholder scans.
- [ ] **Step 2: Check the exact branch diff.** Confirm no generated secrets, local runtime data, oversized artifacts, provider SDK coupling, hidden oracle import in production policy or unrelated game mutation.
- [ ] **Step 3: Open a draft PR with full traceability.** Include requirement/phase, files/interfaces, tests, determinism, performance, stream UX/accessibility, moderation/security/privacy, observability/recovery, rollout/rollback and remaining R5 blockers.
- [ ] **Step 4: Inspect CI and review feedback.** Fix actual failures through red-green-refactor; do not rerun flaky checks until green without root-cause analysis.
- [ ] **Step 5: Mark ready and merge only when required checks pass and no open P0/P1 remains.** Prefer squash merge for a cohesive Game 8 delivery unless repository policy requires otherwise.
- [ ] **Step 6: Verify `main` after integration.** Confirm the merge commit contains the Game 8 directory, browser source, scripts, tests, docs, evidence and final review, then report the highest truthful readiness and ask the product owner to proceed to Game 7 — Marble Survival.

## Plan Self-Review

- **Spec coverage:** Product fantasy, puzzle generation, hidden-information AI, all eight puzzle primitives, accessibility, browser source, audience effects, persistence, recovery, operations, six phases, release scoring and final review each have an implementing task and evidence gate.
- **Placeholder scan:** The plan contains no deferred implementation placeholder; every behavior names an exact file, interface, command, bound or verification result.
- **Type consistency:** `EscapeRoomConfig`, `EscapeState`, `EscapeObservation`, `EscapeBelief`, `EscapeDecision`, `EscapeRenderSnapshot`, `EscapeValidationBundle` and readiness output are introduced once and consumed consistently by later tasks.
- **Truthfulness:** The plan completes all software phases while preserving the repository rule that real elapsed soak/canary and independent exact-candidate evidence cannot be simulated.
