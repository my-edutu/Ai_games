# AI Ant Colony / Ecosystem All-Phases Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver Game 12 as a deterministic, autonomous, livestream-ready ant-colony ecosystem through all six software phases, then complete independent architecture, gameplay, UI, security, reliability and production-readiness reviews.

**Architecture:** A single fixed-step TypeScript authority owns a bounded grid, ants, queen, brood, predators, resources, pheromone fields, scheduled influence and lifecycle. Pure policy/rules functions produce stable intents and events; immutable presentation snapshots, CJS stream host, durable evidence adapters and release assessor remain outside gameplay truth.

**Tech Stack:** TypeScript 5.8, Node.js 22 built-in test runner, shared catalogue `NamedRng` and replay checksum, Canvas 2D, generated Web Audio, Playwright Chromium, GitHub Actions.

## Global Constraints

- Branch: `agent/ant-colony-all-phases`; never implement on `main`.
- No game-private import from Autonomous Snake or AI Maze Escape.
- No ambient random/time/timers in authoritative state, rules, runtime, AI, generation or progression.
- Every behaviour increment follows a witnessed red-green-refactor cycle.
- No network, filesystem or model call in the authoritative tick.
- All collections and entity populations have explicit caps.
- Audience effects cannot guarantee terminal outcomes, prizes or records.
- Production readiness remains false until genuine external R5 evidence passes.

---

## File structure

### Game-owned runtime

- `games/ai-ant-colony/src/config/schema.ts` — versioned validated configuration.
- `games/ai-ant-colony/src/state/types.ts` — authoritative schemas and public action/event contracts.
- `games/ai-ant-colony/src/generation/world.ts` — constructive world and initial-colony generation.
- `games/ai-ant-colony/src/ai/strategy.ts` — bounded colony strategy planner.
- `games/ai-ant-colony/src/ai/policy.ts` — caste observation, action scoring and fallback.
- `games/ai-ant-colony/src/rules/pheromones.ts` — double-buffered field updates.
- `games/ai-ant-colony/src/rules/step.ts` — ordered authoritative reducer.
- `games/ai-ant-colony/src/runtime/run.ts` — lifecycle, event sequencing and restart.
- `games/ai-ant-colony/src/persistence/snapshot.ts` — checksummed snapshot/restore.
- `games/ai-ant-colony/src/presentation/*` — render snapshot, layout, camera, audio and health.
- `games/ai-ant-colony/src/influence/*` — normalized gateway, votes, candidates and application.
- `games/ai-ant-colony/src/operations/*` — bounded journal, leases, recovery and supervisor.
- `games/ai-ant-colony/src/release/*` — frozen manifest, drills, canary and readiness assessor.
- `games/ai-ant-colony/src/testing/*` — headless, campaign, chaos and release evidence.
- `games/ai-ant-colony/src/index.ts` — public exports and initialization.

### Stream and automation

- `public/ai-ant-colony/{index.html,styles.css,app.js}` — public/clean/operator browser source.
- `scripts/run-ant-colony-headless.cjs`
- `scripts/run-ant-colony-campaign.cjs`
- `scripts/serve-ant-colony-stream.cjs`
- `scripts/run-ant-colony-phase5-chaos.cjs`
- `scripts/run-ant-colony-phase6-validation.cjs`

### Tests and docs

- `tests/foundation/ant-colony-*.test.cjs`
- `tests/phase2/ant-colony-*.test.cjs`
- `tests/phase3/ant-colony-*.test.cjs`
- `tests/phase4/ant-colony-*.test.cjs`
- `tests/phase5/ant-colony-*.test.cjs`
- `tests/phase6/ant-colony-*.test.cjs`
- `tests/browser/ant-colony-stream.spec.cjs`
- complete game documents, six phase documents, operations handoff/runbook/rollback/evidence-intake and final review.

---

### Task 1: Phase 1 deterministic foundation

**Produces:** `AntColonyRuntime.create(config, seed)`, `step()`, `restart()`, deterministic state/events, `createAntSnapshot()` and `restoreAntSnapshot()`.

- [ ] Write failing config/generation tests for invalid bounds, deterministic output, connected entrance, valid entity IDs and bounded arrays.
- [ ] Run the focused tests against missing exports and record the expected module/API failures.
- [ ] Implement config, schemas, constructive world generation and initial colony creation using named RNG streams.
- [ ] Write failing reducer tests for forage pickup/deposit, excavation, energy, lifecycle terminal and invariant detection.
- [ ] Implement stable ordered tick resolution and semantic events.
- [ ] Write failing twin-run, snapshot-boundary, corruption and automatic restart tests.
- [ ] Implement runtime lifecycle, checksums and snapshot validation.
- [ ] Run `npm run build` and all `ant-colony` foundation tests; run a multi-seed headless corpus twice and compare byte-identical summaries.
- [ ] Commit Phase 1 with evidence and zero open P0/P1 findings.

### Task 2: Phase 2 autonomous intelligence, ecosystem and progression

**Produces:** `chooseColonyStrategy()`, `decideAntIntent()`, pheromone updates, brood/predator/weather systems and `runAntCampaign()`.

- [ ] Write failing tests for caste-specific legal actions, stable ties, hidden-state boundary, fallback, stuck recovery and strategy transitions.
- [ ] Implement bounded utility policy and strategic planner; expose only validated intent summaries.
- [ ] Write failing tests for pheromone deposit/diffusion/decay, brood stages, food regrowth, weather, predator cap/combat and progress bands.
- [ ] Implement ecosystem and progression in the declared system order.
- [ ] Write failing campaign tests for deterministic replay, no illegal actions, bounded population/resources, multiple dramatic patterns and reference performance.
- [ ] Implement campaign/benchmark reports and seed feature extraction.
- [ ] Run focused and full Phase 1–2 tests plus reference campaign; fix all P0/P1 findings and commit Phase 2.

### Task 3: Phase 3 premium broadcast experience

**Produces:** privacy-safe immutable render snapshots, semantic camera/audio/health, responsive browser source and stream host.

- [ ] Write failing presentation tests for immutability, privacy exclusions, entity stability, scene transitions, caption/audio cues and layout breakpoints.
- [ ] Implement presentation adapters without authority mutation.
- [ ] Build the ant-farm Canvas UI, premium HUD, narrative rail, clean feed, high contrast, reduced motion, mute/captions and hidden operator controls.
- [ ] Write Playwright tests for desktop, phone landscape and clean feed, no overflow, public-control separation, state movement and recovery.
- [ ] Implement the timeout-bounded serialized polling host and `/ant/health`, `/ant/state`, `/ant/command` endpoints.
- [ ] Run Node presentation tests, stream self-test and Chromium capture; commit Phase 3 with retained capture metadata.

### Task 4: Phase 4 bounded audience interaction

**Produces:** provider-neutral normalized events, moderation/idempotency gateway, deterministic vote windows and ten safe effects.

- [ ] Write failing validation, sanction, dedupe, rate, age-window, one-viewer-one-vote and deterministic tie tests.
- [ ] Implement normalized gateway and bounded vote resolution.
- [ ] Write failing effect-candidate tests proving placement validity, magnitude/cooldown/expiry, exactly-once application and terminal-state protection.
- [ ] Implement the ten-effect catalogue and pre-authority scheduled command path.
- [ ] Add zero-audience, maximum-pressure and provider-outage campaigns.
- [ ] Run all Phase 1–4 tests, nondeterminism scan and stream tests; fix P0/P1 findings and commit Phase 4.

### Task 5: Phase 5 reliability and operations

**Produces:** checksummed bounded journal/audit, writer leases, recovery/quarantine, supervisor/output health and deterministic chaos evidence.

- [ ] Write failing tests for sequence gaps, duplicates/conflicts, bounded retention, generation fencing and typed audits.
- [ ] Implement journal, command reservation and writer lease contracts.
- [ ] Write failing recovery tests for exact snapshot continuation, older-snapshot fallback, corruption, replay divergence and quarantine.
- [ ] Implement recovery and startup integrity gates.
- [ ] Write failing supervisor tests for stale output, provider degradation, crash-loop breaker, queue pressure and safe-scene recovery.
- [ ] Implement supervisor/health policy and operator commands.
- [ ] Build and run the deterministic chaos harness; commit Phase 5 only with zero P0/P1 software findings.

### Task 6: Phase 6 release validation and launch governance

**Produces:** exact-candidate release manifest, traceability, final campaigns, drills/canary semantics and fail-closed readiness assessor.

- [ ] Write failing manifest/evidence tests for wrong source, stale evidence, material changes, missing P0/P1 requirements and prohibited waivers.
- [ ] Implement frozen manifest and traceability checks.
- [ ] Write failing tests for final deterministic/max-pressure campaigns, capacity budget semantics, synthetic endurance rejection, drill provenance and canary reset.
- [ ] Implement validation evaluators, drill catalogue and canary controller.
- [ ] Write failing assessor tests for `FAIL`, `BLOCKED_EXTERNAL` and genuine-evidence `PASS` paths.
- [ ] Implement readiness assessment with `productionReady: false` by default and explicit external blockers.
- [ ] Generate release validation JSON, operations docs and software handoff; commit Phase 6.

### Task 7: Independent full-codebase review and remediation

**Consumes:** complete Phase 1–6 branch. **Produces:** `docs/reviews/AI_ANT_COLONY_FINAL_REVIEW.md` and regression fixes.

- [ ] Apply `game-architecture`, `deterministic-simulation`, `autonomous-agent-design`, `procedural-generation`, `gameplay-progression`, `game-creative-direction`, `game-feel-vfx`, `livestream-hud`, `audience-interaction`, `security-privacy`, `performance-optimization`, `long-running-reliability`, `simulation-qa` and `production-readiness-review` gates.
- [ ] Review specification compliance separately from engineering/viewer-experience quality.
- [ ] Record every finding with severity, evidence, owner and disposition.
- [ ] Add a failing regression test for every load-bearing code defect before fixing it.
- [ ] Re-run full Node, browser, headless, campaign, chaos, release and nondeterminism gates.
- [ ] Commit review fixes and final evidence; open a pull request to `main` with exact verification results and honest R5 blockers.
