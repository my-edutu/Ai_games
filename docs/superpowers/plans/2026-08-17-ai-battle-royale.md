# AI Battle Royale Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Game 6 as a deterministic, autonomous, broadcast-ready battle royale with safe audience influence, verified recovery and evidence-gated release governance.

**Architecture:** A game-owned TypeScript module holds authoritative grid state and advances through one fixed ordered reducer. Named seeded RNG streams, serializable state, stable checksums and immutable render snapshots keep simulation, presentation, provider inputs and operations independent. A dependency-free browser source renders snapshots with Canvas and WebAudio, while scripts exercise headless, campaign, stream, chaos and release-validation paths.

**Tech Stack:** TypeScript 5.8, Node.js 22 test runner, HTML5 Canvas, WebAudio API, Playwright browser tests, repository shared `NamedRng`.

## Global Constraints

- Authoritative time is integer logical ticks; render delta and wall clock never determine results.
- All rule-affecting randomness uses named seeded streams and is snapshot/restorable.
- Presentation consumes immutable sanitized snapshots and cannot mutate game state.
- No remote model or provider is required for continuity.
- Fixed-choice audience effects are global, bounded, disclosed, idempotent and non-terminal.
- Technical failures are classified separately from legitimate game outcomes.
- Every collection, queue, event history, audit and retry path has an exact bound.
- Phase completion requires focused tests, affected regression tests, specification review, quality review and evidence.
- R5 production-ready language is prohibited without exact-candidate external evidence and independent review.

---

### Task 1: Phase 1 deterministic foundation

**Files:**
- Create: `games/ai-battle-royale/src/config/index.ts`
- Create: `games/ai-battle-royale/src/state/types.ts`
- Create: `games/ai-battle-royale/src/state/create.ts`
- Create: `games/ai-battle-royale/src/generation/arena.ts`
- Create: `games/ai-battle-royale/src/rules/geometry.ts`
- Create: `games/ai-battle-royale/src/rules/invariants.ts`
- Create: `games/ai-battle-royale/src/rules/checksum.ts`
- Create: `games/ai-battle-royale/src/runtime/runtime.ts`
- Create: `games/ai-battle-royale/src/index.ts`
- Create: `games/ai-battle-royale/src/manifest.ts`
- Test: `tests/foundation/battle-foundation.test.cjs`

**Interfaces:**
- Produces: `createBattleConfig`, `validateBattleConfig`, `createInitialBattleState`, `generateArena`, `assertBattleInvariants`, `battleChecksum`, `BattleRoyaleRuntime`.

- [ ] Write tests proving config rejection, connected generation, unique spawns, identical-seed checksums, different-seed variation, bounded histories and snapshot/restore equality.
- [ ] Run `tsc` and the focused test before implementation; confirm failure is missing Battle Royale modules.
- [ ] Implement the minimum serializable state, generator, invariant/checksum and runtime shell needed to pass.
- [ ] Run the focused suite and a 100-seed generation property campaign.
- [ ] Review exact Phase 1 criteria and separately review ownership, determinism, bounds and naming; fix all P0/P1 findings.
- [ ] Commit as `feat(battle-royale): complete deterministic foundation`.

### Task 2: Phase 2 autonomous combat, zone and progression

**Files:**
- Create: `games/ai-battle-royale/src/ai/pathfinding.ts`
- Create: `games/ai-battle-royale/src/ai/policy.ts`
- Create: `games/ai-battle-royale/src/rules/combat.ts`
- Create: `games/ai-battle-royale/src/rules/step.ts`
- Create: `games/ai-battle-royale/src/testing/campaign.ts`
- Create: `scripts/run-battle-royale-headless.cjs`
- Create: `scripts/run-battle-royale-campaign.cjs`
- Test: `tests/phase2/battle-core-ai.test.cjs`

**Interfaces:**
- Consumes: Phase 1 state, geometry, RNG and runtime.
- Produces: `chooseBattleAction`, `stepBattleState`, `runBattleCampaign`, complete autonomous terminal runs.

- [ ] Write failing tests for legal observation/action boundaries, simultaneous combat, cover, cooldown/ammunition, movement conflicts, zone damage, loot, no-progress escalation, result immutability and automatic intermission.
- [ ] Confirm expected red failures.
- [ ] Implement bounded BFS utility AI, deterministic combat/movement reduction, zone/supply/progression rules and semantic events.
- [ ] Run focused tests, 200-run campaign and same-seed replay comparison.
- [ ] Critique archetype behaviour, dominant strategies, unfair ID ordering, instant/long-tail runs and causal terminal evidence; fix load-bearing findings.
- [ ] Commit as `feat(battle-royale): add autonomous combat and progression`.

### Task 3: Phase 3 premium broadcast experience

**Files:**
- Create: `games/ai-battle-royale/src/presentation/snapshot.ts`
- Create: `games/ai-battle-royale/src/presentation/audio.ts`
- Create: `public/ai-battle-royale/index.html`
- Create: `public/ai-battle-royale/styles.css`
- Create: `public/ai-battle-royale/app.js`
- Create: `scripts/serve-battle-royale-stream.cjs`
- Test: `tests/phase3/battle-presentation.test.cjs`
- Test: `tests/browser/battle-royale.spec.cjs`

**Interfaces:**
- Consumes: authoritative state and semantic events.
- Produces: `createBattleRenderSnapshot`, `planBattleAudioCues`, `/battle/state`, `/battle/health`, responsive browser source.

- [ ] Write failing snapshot sanitation, immutability, cue-priority/deduplication and stream-host tests.
- [ ] Confirm red failures.
- [ ] Implement HUD snapshots, procedural role silhouettes, safe-zone/cover/loot rendering, focus/leaderboard/kill-feed/vote/caption scenes, synthesized semantic audio, mute and reduced-motion controls.
- [ ] Run focused tests, stream self-test and browser checks at desktop and mobile landscape.
- [ ] Critique visual hierarchy, character differentiation, focus framing, event density, sound fatigue, captions, colour-only meaning and low-bitrate readability; implement the fixes.
- [ ] Commit as `feat(battle-royale): deliver premium broadcast experience`.

### Task 4: Phase 4 safe audience interaction

**Files:**
- Create: `games/ai-battle-royale/src/influence/gateway.ts`
- Create: `games/ai-battle-royale/src/influence/reducer.ts`
- Modify: `games/ai-battle-royale/src/rules/step.ts`
- Modify: `games/ai-battle-royale/src/presentation/snapshot.ts`
- Test: `tests/phase4/battle-influence.test.cjs`

**Interfaces:**
- Produces: normalized fixed-choice ballots, logical vote windows, deterministic tally, bounded scheduled effects and privacy-safe acknowledgement.

- [ ] Write failing tests for duplicates, stale/late/reordered ballots, one-viewer-one-ballot, paid weight cap, deterministic ties, global effect bounds, emergency disable, audit bounds and provider-outage continuity.
- [ ] Confirm red failures.
- [ ] Implement normalization, token hashing, validation/reason codes, idempotency, rate/cap/window logic, tally and five non-terminal effects.
- [ ] Run focused and Phase 1–3 regression suites plus burst scenarios.
- [ ] Review for pay-to-win, targeting, raw text/identity leakage, queue growth, moderation dependency and ambiguous acknowledgement; fix all P0/P1 findings.
- [ ] Commit as `feat(battle-royale): add safe audience influence`.

### Task 5: Phase 5 persistence, recovery and operations

**Files:**
- Create: `games/ai-battle-royale/src/persistence/snapshot.ts`
- Create: `games/ai-battle-royale/src/persistence/replay.ts`
- Create: `games/ai-battle-royale/src/operations/supervisor.ts`
- Create: `scripts/run-battle-royale-chaos.cjs`
- Create: `docs/operations/ai-battle-royale-runbook.md`
- Create: `docs/operations/ai-battle-royale-rollback-matrix.md`
- Create: `docs/operations/ai-battle-royale-handoff.md`
- Test: `tests/phase5/battle-recovery.test.cjs`

**Interfaces:**
- Produces: validated snapshot envelope, replay manifest, deterministic restore, progress-aware supervisor, finite breaker and chaos report.

- [ ] Write failing tests for snapshot corruption, incompatible versions, uninterrupted-versus-restored checksum, duplicate input replay, stalled tick/render/audio/persistence detection, finite restart breaker and bounded journals.
- [ ] Confirm red failures.
- [ ] Implement verified snapshot/replay, quarantine, output-health samples, supervisor actions and operations documentation.
- [ ] Run focused tests and chaos script; inspect every injected transition and evidence record.
- [ ] Review crash-loop, silent corruption, optional-service degradation, public safe scenes, resource bounds and rollback compatibility; fix load-bearing findings.
- [ ] Commit as `feat(battle-royale): add verified recovery and operations`.

### Task 6: Phase 6 release governance and final candidate review

**Files:**
- Create: `games/ai-battle-royale/src/operations/readiness.ts`
- Create: `scripts/run-battle-royale-validation.cjs`
- Create: `docs/operations/ai-battle-royale-r5-evidence-intake.md`
- Create: `docs/reviews/AI_BATTLE_ROYALE_FINAL_REVIEW.md`
- Modify: root `README.md`, `package.json`, `tsconfig.json`, `playwright.config.cjs`, `.github/workflows/ci.yml`
- Test: `tests/phase6/battle-readiness.test.cjs`

**Interfaces:**
- Produces: frozen candidate manifest, traceability matrix, R1–R5 assessor, validation evidence and truthful catalogue status.

- [ ] Write failing tests proving missing software evidence fails, synthetic complete software evidence returns `BLOCKED/R4`, lack of independent review blocks R5 and only complete exact-candidate external evidence can return `PASS/R5`.
- [ ] Confirm red failures.
- [ ] Implement readiness assessor, campaign/chaos/browser evidence ingestion, release-validation script, CI jobs, artefact retention and operational evidence intake.
- [ ] Run all focused tests, full available local suite, stream self-test, nondeterminism scan, campaign, chaos and validation.
- [ ] Perform separate specification, engineering, gameplay, UI, character, audio, accessibility, interaction, security, reliability and release reviews; close every P0/P1 and record bounded P2 risks.
- [ ] Open a pull request, inspect checks and fix failures before merge eligibility.
- [ ] Commit as `feat(battle-royale): complete release governance`.
