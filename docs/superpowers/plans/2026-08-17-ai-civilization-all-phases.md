# AI Civilization / Tiny Kingdom Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. A native parallel subagent runner is not available in this session, so execution is inline with separate specification and quality-review passes at every phase boundary. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Game 5 as a deterministic, autonomous, broadcast-ready Tiny Kingdom simulation and advance it through six reviewed software phases to the highest truthful R4 evidence-gated candidate state.

**Architecture:** One fixed-day authoritative simulation owns world, economy, population, characters, diplomacy, crises, progression, influence, events, and results. Game-owned modules reuse only stable provider-neutral shared RNG and replay packages; presentation consumes immutable snapshots, integrations remain outside authority, and all collections/resources are bounded.

**Tech Stack:** TypeScript 5.8.3, Node.js 22.16.0 CommonJS output, Node test runner, Playwright 1.55 Chromium, HTML/CSS/SVG/Canvas browser source, Web Audio API, existing catalogue packages and CI.

## Global Constraints

- One authoritative tick equals one game day; wall clock and render delta never affect outcomes.
- All rule randomness uses named `NamedRng` streams; no `Math.random`, `Date.now`, `new Date`, `setTimeout`, or `setInterval` exists in authoritative Game 5 source.
- Default world is 12×8; hard maximum is 16×10.
- Live key characters are bounded to ruler, heir, four councillors, and three rival leaders.
- Live authoritative event queue is capped at 512; presentation cues are capped at 96.
- Snapshot payload target is below 256 KiB; headless default throughput target is above 2,000 game-days/second; authoritative tick p99 target is below 8 ms on CI-class hardware.
- Technical failures use abort/quarantine outcomes and never count as game losses.
- Audience choices are fixed, bounded, moderated, idempotent, replay-safe, and cannot guarantee victory, defeat, succession, war outcome, record, prize, or cash-equivalent result.
- Raw provider payloads, payment details, arbitrary viewer text, secrets, private IDs, prompts, chain-of-thought, stack traces, and host paths never enter authority or public snapshots.
- Public gameplay remains complete with provider, model, audio, renderer, telemetry, or analytics unavailable.
- Every behavior change follows observed red-green-refactor and every phase receives separate specification and engineering/viewer-experience reviews.
- No phase or final review claims R5 without exact-candidate real-duration production evidence and independent sign-off.

---

## File and Ownership Map

### Game-owned authority

- `games/ai-civilization/src/manifest.ts` — version and capability identity.
- `games/ai-civilization/src/config/schema.ts` — complete validated configuration and defaults.
- `games/ai-civilization/src/state/types.ts` — serializable authority, actions, events, results, invariants.
- `games/ai-civilization/src/generation/world.ts` — deterministic topology, resources, rivals, repair, fallback.
- `games/ai-civilization/src/characters/cast.ts` — approved names, deterministic portrait recipes, bounded traits, succession.
- `games/ai-civilization/src/ai/policy.ts` — legal candidate generation, emergency reflex, utility scoring, deterministic fallback, public intent.
- `games/ai-civilization/src/rules/step.ts` — exact daily system order and terminal precedence.
- `games/ai-civilization/src/runtime/run.ts` — lifecycle, RNG, sequence, influence scheduling, restart, signals.
- `games/ai-civilization/src/persistence/snapshot.ts` — versioned snapshot, checksum, restore validation.
- `games/ai-civilization/src/testing/headless.ts` — production-rule accelerated runs and campaigns.
- `games/ai-civilization/src/index.ts` — stable public exports and initial-state factory.

### Depth, interaction, presentation, and operations

- `games/ai-civilization/src/influence/system.ts` — effect catalogue, bounded queue, idempotency, eligibility, apply/reverse.
- `games/ai-civilization/src/presentation/snapshot.ts` — immutable privacy-safe render model and scene derivation.
- `games/ai-civilization/src/presentation/audio.ts` — semantic cue, music-state, voice/cooldown/priority policy.
- `games/ai-civilization/src/operations/durability.ts` — event journal, snapshot store, lease fencing, restore/quarantine, supervisor probes.
- `games/ai-civilization/src/release/readiness.ts` — evidence model and honest R-level assessor.

### Browser source and executables

- `public/ai-civilization/index.html` — semantic public surface and accessibility controls.
- `public/ai-civilization/styles.css` — responsive 16:9/mobile-safe design, reduced motion/flash, character/map hierarchy.
- `public/ai-civilization/app.js` — SVG world, HUD, portrait recipes, semantic audio, SSE recovery.
- `scripts/run-civilization-headless.cjs` — deterministic CLI.
- `scripts/run-civilization-campaign.cjs` — seeded statistical campaign.
- `scripts/serve-civilization-stream.cjs` — browser source, health, state/events/SSE, self-test.
- `scripts/run-civilization-chaos.cjs` — Phase 5 injections and evidence JSON.
- `scripts/run-civilization-validation.cjs` — Phase 6 release evidence JSON.

### Tests and evidence

- `tests/foundation/civilization-config-world.test.cjs`
- `tests/foundation/civilization-rules-replay.test.cjs`
- `tests/phase2/civilization-depth.test.cjs`
- `tests/phase2/civilization-campaign.test.cjs`
- `tests/phase3/civilization-presentation.test.cjs`
- `tests/browser/civilization-broadcast.spec.cjs`
- `tests/phase4/civilization-influence.test.cjs`
- `tests/phase5/civilization-reliability.test.cjs`
- `tests/phase6/civilization-readiness.test.cjs`
- `evidence/ai-civilization/r4-candidate/phase-01` through `phase-06` — manifests, reports, reviews, campaigns, captures, chaos, and release validation.

### Catalogue integration

- Modify `tsconfig.json` to include `games/ai-civilization/src/**/*.ts`.
- Modify `package.json` to add Game 5 build/run/test/self-test/campaign/chaos/validation scripts without changing dependency versions.
- Modify `playwright.config.cjs` to start Game 5 on port 4175 and retain reports under `artifacts/civilization-phase3`.
- Modify `.github/workflows/ci.yml` to run Game 5 self-test, nondeterminism scan, chaos, validation, browser capture, and artifact upload.
- Modify `README.md` only after verified Phase 6, reporting Game 5 as R4 software candidate and R5 externally blocked.

---

# Phase 1 — Deterministic Headless Foundation

## Task 1: Configuration, Manifest, and Authoritative Types

**Files:**
- Create `games/ai-civilization/src/manifest.ts`
- Create `games/ai-civilization/src/config/schema.ts`
- Create `games/ai-civilization/src/state/types.ts`
- Modify `tsconfig.json`
- Test `tests/foundation/civilization-config-world.test.cjs`

**Interfaces:**
- `parseCivilizationConfig(input: Partial<CivilizationConfig>): CivilizationConfig`
- `CivilizationState`, `CivilizationAction`, `CivilizationEvent`, `CivilizationResult`
- `civilizationManifest`

- [ ] Write a failing test that rejects a 5×5 world, a 17×10 world, non-integer storage caps, invalid tick/season relationships, and missing positive terminal windows.
- [ ] Run `npm run build && node --test tests/foundation/civilization-config-world.test.cjs`; confirm failure because the module does not exist.
- [ ] Implement exact defaults: 12×8, max 16×10, 30-day season, 120-day year, 512 live-event cap, 96 cue cap, population safety cap, crisis cooldowns, 18-day intermission, and deterministic version `civilization-r1-v1`.
- [ ] Add state types containing only serializable primitives, arrays, and records; exclude wall-clock, provider, renderer, audio, function, class, and secret objects.
- [ ] Run the focused test and TypeScript build; confirm pass.
- [ ] Commit `feat(civilization): define deterministic authority contracts`.

## Task 2: Constructive World and Character Generation

**Files:**
- Create `games/ai-civilization/src/generation/world.ts`
- Create `games/ai-civilization/src/characters/cast.ts`
- Create `games/ai-civilization/src/index.ts`
- Extend `tests/foundation/civilization-config-world.test.cjs`

**Interfaces:**
- `generateWorld(config, rng): GeneratedWorld`
- `validateWorld(world, config): WorldValidation`
- `createFoundingCast(rng): CivilizationCharacters`
- `createInitialCivilizationState(config, seed, runId, rng?): CivilizationState`

- [ ] Add failing assertions that the capital is on land, every generated world has food/wood/stone/water access, all land is reachable from the capital, rivals meet minimum separation, names/traits/portrait recipes are deterministic, and generator attempts are bounded.
- [ ] Run the focused test and observe the missing behavior failure.
- [ ] Build land constructively from a connected expansion walk, layer river/lake/coast and resource features with dedicated streams, validate hard constraints, apply at most three deterministic repairs, and use one versioned fallback map without changing the seed.
- [ ] Generate the bounded founder, heir, councillors, and rival leaders from approved name/trait/portrait tables with stable IDs and no audience text.
- [ ] Create initial resources, population cohorts, capital camp, progression, AI status, influence shell, chronicle, and lifecycle.
- [ ] Run build/test and a 500-seed generation loop; require zero invalid worlds and zero unbounded retry.
- [ ] Commit `feat(civilization): generate valid worlds and founding dynasties`.

## Task 3: Economy, Rules, and Bounded Kingdom Policy

**Files:**
- Create `games/ai-civilization/src/ai/policy.ts`
- Create `games/ai-civilization/src/rules/step.ts`
- Test `tests/foundation/civilization-rules-replay.test.cjs`

**Interfaces:**
- `decideCivilizationAction(state): PolicyDecision`
- `legalCivilizationActions(state): CivilizationAction[]`
- `applyCivilizationAction(input, action, rng): StepOutput`
- `assertCivilizationInvariants(state): void`

- [ ] Write failing tests for daily production/consumption/upkeep order, storage caps, no negative resources, legal building placement, starvation impact, emergency food action, stable tie-break, result immutability, and technical-failure exclusion.
- [ ] Run the focused test and verify expected missing implementation.
- [ ] Implement legal actions for reserve, build, enact policy, trade, research, diplomacy, defence, crisis response, and Great Work contribution.
- [ ] Implement policy layers: legality, emergency reflex, tactical utility, strategic goal, stable action-key tie-break, and `reserve-and-repair` fallback.
- [ ] Implement the exact system order and emit semantic events with no presentation logic.
- [ ] Add cheap invariants for resource ranges, unique IDs, tile occupancy, population/housing, lifecycle/result consistency, bounded arrays, and valid progression.
- [ ] Run focused tests plus 10,000 legal property steps; require no invariant failure.
- [ ] Commit `feat(civilization): run causal economy and kingdom policy`.

## Task 4: Runtime, Snapshot, Replay, and Headless CLI

**Files:**
- Create `games/ai-civilization/src/runtime/run.ts`
- Create `games/ai-civilization/src/persistence/snapshot.ts`
- Create `games/ai-civilization/src/testing/headless.ts`
- Create `scripts/run-civilization-headless.cjs`
- Modify `package.json`
- Extend `tests/foundation/civilization-rules-replay.test.cjs`

**Interfaces:**
- `CivilizationRuntime.create(config, seed)`
- `runtime.step()`, `runtime.restart(seed)`, `runtime.drainEvents(limit)`, `runtime.signals()`
- `createCivilizationSnapshot(runtime): CivilizationSnapshot`
- `restoreCivilizationSnapshot(snapshot): CivilizationRuntime`
- `runCivilizationHeadless(options): HeadlessSummary`

- [ ] Add failing tests for identical-seed checkpoint/final checksums, event-sequence continuity, snapshot round trip, corruption rejection, unsupported version rejection, uninterrupted-versus-restored equality, result/intermission/restart, and bounded event drain.
- [ ] Run tests and confirm expected failures.
- [ ] Implement runtime ownership of RNG, event sequence, lifecycle, policy decision, rule step, progression band, no-progress resolution, and deterministic restart seed.
- [ ] Implement checksummed snapshots including RNG stream state and next sequence; validate schema/deterministic/config/checksum/invariants before restore.
- [ ] Implement a headless runner that uses production rules and outputs JSON with outcome, tier, renown, population, tick timing, checksum, fallback, events, and invariant status.
- [ ] Run `npm run civilization:headless -- --seed=phase1 --days=1000` and the full Phase 1 suite.
- [ ] Record Phase 1 evidence and separate specification/quality reviews; fix every P0/P1 finding and rerun from a clean build.
- [ ] Commit `feat(civilization): complete deterministic headless Phase 1`.

---

# Phase 2 — Autonomous Civilization Depth

## Task 5: Buildings, Cohorts, Tiers, and Great Works

**Files:**
- Extend `state/types.ts`, `config/schema.ts`, `rules/step.ts`, `ai/policy.ts`
- Test `tests/phase2/civilization-depth.test.cjs`

**Interfaces:**
- Versioned building catalogue and `tierForRenown(renown)`
- `availableActions(state)` respects tier, biome, resource, labour, and uniqueness constraints.

- [ ] Write failing tests for all building preconditions, source/sink ledgers, spoilage, housing cap, births/deaths/migration bounds, diminishing repetitive renown, tier unlocks, and three Great Work paths.
- [ ] Observe red, implement the minimum complete catalogue, run green, then refactor tables without changing replay fixtures.
- [ ] Commit `feat(civilization): add bounded growth and Great Works`.

## Task 6: Succession, Rival Realms, Diplomacy, Conflict, and Crises

**Files:**
- Extend `characters/cast.ts`, `rules/step.ts`, `ai/policy.ts`, `runtime/run.ts`
- Test `tests/phase2/civilization-depth.test.cjs`

**Interfaces:**
- `advanceCharactersAtYearBoundary(state, rng)`
- `resolveDiplomacyAndConflict(state, actions, rng)`
- `selectEligibleCrisis(state, rng)`

- [ ] Write failing tests for ruler ageing, deterministic heir selection, reign compaction, trait utility caps, rival observation limits, treaty/trade/aid states, causal war resolution, crisis warning/eligibility/cooldown/conflict groups, recovery cost, and no hidden rescue/kill.
- [ ] Implement bounded succession, three rival realms, diplomacy state machine, strategic conflict, and authored crisis families.
- [ ] Add public plan-change reasons and character expression state driven only by semantic authority.
- [ ] Run replay and invariant regressions; increment deterministic version only if authoritative fixtures intentionally change.
- [ ] Commit `feat(civilization): add dynasties diplomacy and causal crises`.

## Task 7: Statistical Campaign and Character/Game Quality Review

**Files:**
- Create `scripts/run-civilization-campaign.cjs`
- Test `tests/phase2/civilization-campaign.test.cjs`
- Create `evidence/ai-civilization/r4-candidate/phase-02/review.md`

**Interfaces:**
- `runCivilizationCampaign({ seeds, maxDays, scenario }): CampaignSummary`

- [ ] Write failing tests that demand deterministic aggregate output, zero invalid actions/worlds, bounded duration tails, multiple terminal reasons, multiple strategic goals, succession occurrence, and at least three dramatic patterns across a declared corpus.
- [ ] Implement campaign metrics for outcomes, duration percentiles, tier, renown, population, failure taxonomy, crises, recovery, strategy diversity, succession, fallback, tick timing, and checksum uniqueness.
- [ ] Run no-audience, typical-pressure, fallback-policy, max-world, and pathological-seed campaigns.
- [ ] Review character causality, attachment, silhouette recipe diversity, trait dominance, economy runaway/starvation, crisis cadence, and failure fairness; fix load-bearing findings.
- [ ] Record commands, corpus, thresholds, results, and review verdict.
- [ ] Commit `feat(civilization): complete autonomous depth Phase 2`.

---

# Phase 3 — Premium Broadcast Experience

## Task 8: Immutable Render Snapshot and Semantic Audio Model

**Files:**
- Create `games/ai-civilization/src/presentation/snapshot.ts`
- Create `games/ai-civilization/src/presentation/audio.ts`
- Test `tests/phase3/civilization-presentation.test.cjs`

**Interfaces:**
- `createCivilizationRenderSnapshot(state, recentEvents): Readonly<CivilizationRenderSnapshot>`
- `deriveCivilizationAudioFrame(snapshot, events, previous): AudioFrame`

- [ ] Write failing tests for deep immutability, privacy-field absence, goal/progress/danger hierarchy, bounded text, bounded tiles/characters/events, scene state, caption alternatives, music hysteresis, cue priority, cooldown, dedupe, and 16-voice cap.
- [ ] Implement sanitized copy keys and derived presentation values without authority references or mutation.
- [ ] Implement audio states and semantic cue policy; ensure muted/missing audio changes no authoritative checksum.
- [ ] Commit `feat(civilization): add immutable broadcast and audio contracts`.

## Task 9: Responsive Browser Source, Characters, World, VFX, and Stream Host

**Files:**
- Create `public/ai-civilization/index.html`
- Create `public/ai-civilization/styles.css`
- Create `public/ai-civilization/app.js`
- Create `scripts/serve-civilization-stream.cjs`
- Modify `package.json`, `playwright.config.cjs`
- Test `tests/browser/civilization-broadcast.spec.cjs`

**Interfaces:**
- HTTP `GET /civilization/health`, `/civilization/state`, `/civilization/events`, `/civilization/stream`
- CLI `node scripts/serve-civilization-stream.cjs --port=4175 --self-test`

- [ ] Write browser tests for 1920×1080 and 390×844 viewport comprehension, no overflow, minimum primary-text size, goal/tier/renown/danger/ruler visibility, character role/trait/intent, captions, reduced motion, audio controls, provider-degraded copy, reconnect recovery, and no debug/private fields.
- [ ] Build semantic HTML and SVG world with tile/building/road/border/hazard layers, deterministic geometric portrait cards, contextual event rail, one audience slot, live captions, clean-feed class, and safe recovery slate.
- [ ] Implement bounded map transitions, construction/crisis/milestone effects, camera focus with dwell, and cosmetic degradation tiers.
- [ ] Implement Web Audio synthesized/adapter-ready cues with volume/mute, context resume, voice cleanup, ducking, and failure isolation.
- [ ] Implement the stream server with authoritative runtime outside browser, bounded SSE clients, state/events endpoints, health probes, static assets, and self-test.
- [ ] Run static presentation tests, self-test, and Playwright capture.
- [ ] Commit `feat(civilization): deliver premium broadcast Phase 3`.

## Task 10: UI, Character, Audio, and Accessibility Critique Loop

**Files:**
- Modify Phase 3 presentation files as findings require
- Create `evidence/ai-civilization/r4-candidate/phase-03/quality-review.md`

- [ ] Critique hierarchy, map readability, mobile compression, character distinction, trait legibility, repetitive motion, visual density, crisis causality, muted comprehension, sonic fatigue, cue masking, reduced-motion/flash, color-safe meaning, caption collision, reconnect/restart cleanup, and result closure.
- [ ] Classify findings P0–P3 with exact evidence and violated criterion.
- [ ] Fix every P0/P1 and high-value bounded P2 finding.
- [ ] Re-run browser, presentation, build, and authoritative replay tests to prove presentation changes did not alter gameplay.
- [ ] Commit `fix(civilization): improve broadcast character and audio quality`.

---

# Phase 4 — Audience Interaction

## Task 11: Bounded Effect Catalogue, Voting, Idempotency, and Reversal

**Files:**
- Create `games/ai-civilization/src/influence/system.ts`
- Extend `state/types.ts` and `runtime/run.ts`
- Test `tests/phase4/civilization-influence.test.cjs`

**Interfaces:**
- `submitCivilizationInfluence(state, request): InfluenceDecision`
- `applyDueCivilizationInfluence(state, rng): StepOutput`
- `openCivilizationVote(state, options, closesAtTick): VoteState`
- `resolveCivilizationVote(state, rng): ScheduledInfluence`

- [ ] Write failing tests for fixed schema, idempotency, duplicate/reordered/stale delivery, queue cap, expiry, cooldown/conflict groups, state eligibility, deterministic vote cutoff/tie, paid/free shared safety, bounded application, acknowledgement lifecycle, reversal audit, provider outage, and zero-audience completeness.
- [ ] Implement civic focus, relief/festival/research/fortification, future challenge, diplomatic posture, banner/theme, and bounded Chat-vs-AI pressure effects.
- [ ] Prohibit raw text, exact amount mapping, terminal guarantees, direct resource mutation before scheduling, and unsafe application without durable audit state.
- [ ] Integrate sanitized consequence visibility in render snapshots and browser source.
- [ ] Run burst, bot-like duplicate, conflict, reconnect, outage, and restore tests.
- [ ] Review fairness, moderation, disclosure, privacy, and visual priority; fix all P0/P1.
- [ ] Commit `feat(civilization): complete safe audience interaction Phase 4`.

---

# Phase 5 — Reliability and Operations

## Task 12: Durable Journal, Lease, Verified Recovery, and Quarantine

**Files:**
- Create `games/ai-civilization/src/operations/durability.ts`
- Extend `persistence/snapshot.ts`
- Test `tests/phase5/civilization-reliability.test.cjs`

**Interfaces:**
- `InMemoryCivilizationStore` production-neutral contract fixture
- `acquireLease`, `appendEvents`, `writeSnapshot`, `restoreLatestVerified`, `quarantineRun`

- [ ] Write failing tests for single-writer fencing, monotonic event sequence, bounded journal window, snapshot checksum/invariant/version verification, replay after snapshot, older-snapshot fallback, divergence quarantine, influence idempotency after restore, and fresh-run truth.
- [ ] Implement durable-contract behavior without database SDK imports.
- [ ] Run uninterrupted versus kill/restore checksum comparisons and corruption injections.
- [ ] Commit `feat(civilization): add fenced durability and verified recovery`.

## Task 13: Supervisor, Probes, Bounds, Chaos, and Runbook

**Files:**
- Extend `operations/durability.ts`
- Create `scripts/run-civilization-chaos.cjs`
- Modify `.github/workflows/ci.yml`, `package.json`
- Test `tests/phase5/civilization-reliability.test.cjs`
- Create `docs/operations/ai-civilization-runbook.md`

**Interfaces:**
- `CivilizationSupervisor.observe(sample): SupervisorDecision`
- chaos JSON containing scenario, expected transition, observed transition, checksum, recovery, queue/resource maxima, and pass.

- [ ] Write failing tests for independent tick, meaningful-progress, render, audio-intent, durability, provider, and output probes; hysteresis; finite restart/backoff; breaker; safe intermission; public/operator status separation; queue overflow; and emergency controls.
- [ ] Implement supervisor states healthy, degraded, recovering, safe-intermission, quarantined, and halted with bounded actions.
- [ ] Implement chaos scenarios for worker kill, provider duplicate/reorder/outage, persistence lag, corrupt snapshot, render stale, audio stale, output frozen, queue saturation, and incompatible restore.
- [ ] Add explicit resource caps and degradation order; capture heap/handle/queue maxima in accelerated soak.
- [ ] Write exact operator actions for interaction disable, renderer/audio restart, verified restore, fresh run, rollback, and halt.
- [ ] Run Phase 5 suite and chaos evidence; fix all P0/P1 review findings.
- [ ] Commit `feat(civilization): complete reliability and operations Phase 5`.

---

# Phase 6 — Production Validation and Launch Governance

## Task 14: Readiness Assessor and Release Validation

**Files:**
- Create `games/ai-civilization/src/release/readiness.ts`
- Create `scripts/run-civilization-validation.cjs`
- Test `tests/phase6/civilization-readiness.test.cjs`
- Modify `.github/workflows/ci.yml`, `package.json`

**Interfaces:**
- `assessCivilizationReadiness(evidence): ReadinessAssessment`
- Output fields `verdict`, `highestReadiness`, `productionReady`, `openP0`, `openP1`, `softwareGates`, `externalGates`, `reasons`.

- [ ] Write failing tests that block on any P0/P1, replay divergence, invalid generation, unsafe influence, unverified restore, performance breach, accessibility/audio/output failure, missing rollback, stale candidate SHA, missing independent review, incomplete 72-hour soak, or missing seven-day canary.
- [ ] Implement assessor states FAIL, BLOCKED, CONDITIONAL PASS below R5, and PASS; only exact external R5 evidence may return `productionReady: true`.
- [ ] Implement release validation that runs deterministic smoke, snapshot/restore, campaign, influence, chaos, presentation contract, performance baseline, evidence-manifest consistency, and assessor.
- [ ] Add CI artifact generation/upload and Game 5 nondeterminism scan.
- [ ] Commit `feat(civilization): add release governance Phase 6`.

## Task 15: Complete Documentation, Reviews, Handoff, and Catalogue Status

**Files:**
- Create all required game documents: `README.md`, `PRD.md`, `GAME_DESIGN.md`, `AI_SYSTEM.md`, `VIEWER_INTERACTION.md`, `AUDIO_VISUAL.md`, `TECHNICAL_ARCHITECTURE.md`, `TESTING_STRATEGY.md`, `PRODUCTION_READINESS.md`
- Create six phase documents under `games/ai-civilization/phases/`
- Create `docs/reviews/AI_CIVILIZATION_FINAL_REVIEW.md`
- Create `docs/operations/ai-civilization-r5-evidence-intake.md`
- Create `docs/operations/ai-civilization-rollback-matrix.md`
- Create `docs/operations/ai-civilization-handoff.md`
- Modify root `README.md`

- [ ] Write documents from the approved design and verified implementation only; every MUST maps to code/test/evidence and no placeholder language is permitted.
- [ ] Run a repository scan for `TBD`, `TODO`, unapproved asset URLs, raw provider fields, ambient nondeterminism, secrets, and Game 5 debug exposure.
- [ ] Perform separate final specification, architecture, gameplay, AI, economy, UI, character, audio, accessibility, interaction, security/privacy, reliability, performance, and release-evidence reviews.
- [ ] Fix every P0/P1 finding, rerun the complete relevant suites, and freeze the candidate commit.
- [ ] State the highest truthful result as R4 software candidate / R5 BLOCKED unless independent production evidence genuinely passes.
- [ ] Update catalogue status without altering the truthful status of other games.
- [ ] Commit `docs(civilization): complete reviewed release handoff`.

## Task 16: Full Verification, PR Review, and Integration Decision

**Files:**
- All changed files
- PR description and review comments

- [ ] Run clean build and all Node suites.
- [ ] Run Game 5 headless, campaign, stream self-test, chaos, validation, and Playwright browser tests.
- [ ] Inspect GitHub Actions logs and artifacts for the exact head SHA; do not accept stale or rerun-only evidence.
- [ ] Inspect PR patch file-by-file for scope, conflicts, secrets, accidental shared-game changes, duplicate rules, and incomplete docs.
- [ ] Record commands, counts, performance, checksum, review findings, rollout, rollback, and remaining external gates in the PR.
- [ ] Resolve all load-bearing review findings and rerun affected evidence.
- [ ] Mark the PR ready only after CI and review are clean. Merge only when branch protection, concurrent-game conflict check, and exact-head evidence permit; otherwise leave a complete merge-ready PR with the blocker stated precisely.

---

## Plan Self-Review

- **Spec coverage:** Every design section maps to Tasks 1–16, including authority, world, economy, AI, characters, succession, diplomacy, crises, progression, presentation, audio, audience, durability, operations, performance, evidence, and truthful R5 gating.
- **Placeholder scan:** The plan contains no `TBD`, `TODO`, “implement later,” unspecified error handling, or unnamed tests.
- **Type consistency:** Public interfaces use `CivilizationConfig`, `CivilizationState`, `CivilizationAction`, `CivilizationEvent`, `CivilizationRuntime`, `CivilizationSnapshot`, `CivilizationRenderSnapshot`, `InfluenceDecision`, and `ReadinessAssessment` consistently.
- **Conflict containment:** Game-private code owns Game 5 behavior; shared package source is not modified. Root integration changes are additive and reviewed against concurrent branches before merge.
- **Execution selection:** Inline execution with the `executing-plans` workflow is selected automatically under the user’s standing instruction to choose the best available approach and continue without confirmation.