# AI Zombie Survival Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Game 10 as a deterministic, autonomous, livestream-ready day/night survival game whose software completes Phases 1–6 and whose final R5 status remains fail-closed until genuine external production evidence exists.

**Architecture:** A single TypeScript `ZombieRuntime` owns fixed-step authoritative state. Focused modules provide versioned configuration, constructive grid generation, survivor utility policy, horde flow fields, combat/economy rules, immutable presentation snapshots, bounded audience influence, verified snapshots/recovery, operations supervision, and release governance. The dependency-free Node stream host and headless runner execute the same compiled rules.

**Tech Stack:** TypeScript 5.8 strict CommonJS, Node.js 22.16 native test runner, HTML5 Canvas, Playwright Chromium, repository shared RNG/checksum/contracts and release/operations packages where their public interfaces fit.

## Global Constraints

- Work on `agent/game-10-ai-zombie-survival`, based on `main@68493d9d90d244797f052ebe2bb1d8b1895a64c8`.
- Use a fixed 10 Hz logical tick; render delta and wall clock never change authority.
- Route every authoritative random draw through a named seeded stream.
- Keep provider SDKs, DOM, renderer, audio, wall clock, secrets, and remote models outside authoritative state.
- Use test-first red-green-refactor for every behavior change; do not advance a phase without fresh focused and affected-suite verification.
- Keep technical/integrity failures distinct from legitimate game losses.
- Paid/free influence cannot guarantee survival, death, evacuation, a record, or unavoidable terminal outcome.
- Every queue, collection, cache, event history, snapshot set, entity population, listener, timer, and retry has a bound.
- Final public status must remain `BLOCKED_EXTERNAL` until real R5 evidence passes; no synthetic elapsed timestamp may satisfy endurance/canary gates.

---

## File map

### Game-owned source

- `games/ai-zombie-survival/src/config/schema.ts` — configuration types, defaults, profiles, validation and config hash input.
- `games/ai-zombie-survival/src/state/types.ts` — authoritative entities, world, economy, AI, events, snapshots and public types.
- `games/ai-zombie-survival/src/generation/world.ts` — constructive map, feature extraction, validation, deterministic repair/fallback.
- `games/ai-zombie-survival/src/rules/grid.ts` — coordinates, stable neighbors, occupancy, BFS/flow fields and path bounds.
- `games/ai-zombie-survival/src/rules/step.ts` — ordered phase, movement, task, horde, combat, economy, result and invariant rules.
- `games/ai-zombie-survival/src/ai/policy.ts` — team strategy, role utilities, legality, fallbacks, stuck/loop recovery and public intent.
- `games/ai-zombie-survival/src/runtime/run.ts` — sole authority, command ordering, lifecycle, event sequence and signals.
- `games/ai-zombie-survival/src/runtime/headless.ts` — production-rules accelerated run/campaign summaries.
- `games/ai-zombie-survival/src/replay/snapshot.ts` — versioned snapshot, checksum, restore validation and divergence errors.
- `games/ai-zombie-survival/src/influence/index.ts` — fixed effect catalogue, validation, dedupe, rate/caps, votes, scheduling and reversal.
- `games/ai-zombie-survival/src/presentation/snapshot.ts` — immutable privacy-safe render/audio/caption snapshot.
- `games/ai-zombie-survival/src/operations/supervisor.ts` — progress/output/resource probes, recovery/quarantine, RBAC controls and chaos contracts.
- `games/ai-zombie-survival/src/release/readiness.ts` — candidate manifest, traceability, capacity, endurance/canary evidence and assessor.
- `games/ai-zombie-survival/src/index.ts` and `manifest.ts` — public package exports and game manifest.

### Runtime applications

- `scripts/run-zombie-headless.cjs`
- `scripts/serve-zombie-stream.cjs`
- `scripts/run-zombie-phase5-chaos.cjs`
- `scripts/run-zombie-phase6-validation.cjs`
- `public/zombie/index.html`
- `public/zombie/styles.css`
- `public/zombie/client.js`

### Test and evidence surfaces

- `tests/foundation/zombie-*.test.cjs`
- `tests/phase2/zombie-*.test.cjs`
- `tests/phase3/zombie-*.test.cjs`
- `tests/phase4/zombie-*.test.cjs`
- `tests/phase5/zombie-*.test.cjs`
- `tests/phase6/zombie-*.test.cjs`
- `tests/browser/zombie-stream.spec.cjs`
- `fixtures/ai-zombie-survival/`
- `evidence/ai-zombie-survival/`

### Product, phase, review and operations documents

The game directory receives every document required by `AGENTS.md`, six phase ledgers, final specification/quality reviews, runbook, rollback matrix, evidence intake and handoff.

### Root integration

Modify `package.json`, `tsconfig.json`, `playwright.config.cjs`, `.github/workflows/ci.yml`, `README.md`, and `docs/catalogue/GAME_CATALOGUE.md` only where needed to build, test, serve, validate and truthfully list Game 10.

---

## Task 1 — Phase 1 deterministic foundation

**Produces:** `ZombieConfig`, `ZombieState`, `ZombieRuntime`, world generator, fixed-step rules, headless runner, snapshot/restore and R1 evidence.

- [ ] Write failing native Node tests for config rejection, same-seed world equality, required resource reachability, stable neighbors/path bounds, deterministic lifecycle, automatic restart, terminal immutability, same-seed checksums, random-stream isolation, snapshot round trip, corrupt/version rejection, and invariant detection.
- [ ] Run only `tests/foundation/zombie-*.test.cjs` against the branch and retain the expected missing-module failures as red evidence.
- [ ] Implement the smallest versioned config, state, grid, generator, runtime, replay and headless APIs needed by those tests.
- [ ] Add typed generation diagnostics, bounded attempts/repair/fallback, stable entity IDs, event sequence, result/intermission/restart and cheap invariants.
- [ ] Run build plus focused foundation tests; fix only failing Phase 1 behavior through new or existing reproducing tests.
- [ ] Run the complete existing Node suite to detect catalogue regressions.
- [ ] Record Phase 1 commands, versions, seed corpus, checksums, performance sample and separate specification/quality review.
- [ ] Commit `feat(zombie): complete deterministic foundation Phase 1` and advance only when R1 acceptance is evidenced.

## Task 2 — Phase 2 AI, hordes, economy and progression

**Produces:** bounded survivor policy, horde flow fields, combat, construction/repair/healing, resources, weather, waves, evacuation progression, campaigns and R2 evidence.

- [ ] Write failing tests for role legality, hidden-state exclusion, utility priorities, deterministic ties, stuck recovery, stable flow fields, spawn caps, simultaneous conflict order, damage/cooldown correctness, resource conservation, no-negative balances, building/repair, healing, daily upkeep, wave composition, weather bounds, evacuation/loss causes, technical-failure exclusion and dramatic-pattern campaigns.
- [ ] Verify expected red failures with `tests/phase2/zombie-*.test.cjs`.
- [ ] Implement policy and rules in the declared total order with at most 64 candidate evaluations per survivor and bounded grid traversal.
- [ ] Add standard, endurance, scarcity, siege and accessibility-safe profiles plus stratified smoke/pathological seed corpora.
- [ ] Add campaign reports for day reached, terminal reasons, breach/recovery, strategy diversity, fallback/stuck rate, resource flows, tick percentiles and entity caps.
- [ ] Run Phase 1+2 focused suites, full Node suite and deterministic replay comparison.
- [ ] Review representative median/tail/loss/evacuation runs; fix load-bearing findings test-first.
- [ ] Commit `feat(zombie): complete survival AI and horde progression Phase 2` only after R2 gameplay criteria pass.

## Task 3 — Phase 3 broadcast experience

**Produces:** immutable public snapshot, semantic audio/captions, responsive Canvas stream, clean feed, accessibility and output-recovery evidence.

- [ ] Write failing tests proving presentation cannot mutate authority, private/internal fields are absent, day/phase/base/survivors/danger/intent remain present, captions mirror critical audio, cards/effects are bounded, clean-feed semantics hold, stale snapshots are rejected, and recovery reconstructs from the latest accepted public snapshot.
- [ ] Write Playwright expectations for 16:9 desktop, phone-landscape viewport, high contrast, reduced motion, muted/caption comprehension, clean feed, result/restart and recovery scenes.
- [ ] Verify red failures before adding the presentation module or Zombie web server.
- [ ] Implement immutable snapshot projection, camera focus, HUD hierarchy, Canvas scene renderer, semantic audio state, caption queue, quality tiers, polling serialization and safe slate.
- [ ] Add `zombie:stream`, `zombie:stream:self-test` and browser-server entry at port 4175 without affecting existing Snake/Maze hosts.
- [ ] Run stream self-test, focused Node tests and Playwright; inspect generated captures for clipping, overlap, hidden truth, low contrast and stale state.
- [ ] Fix all P0/P1 and material visual defects, then record capture manifest and review.
- [ ] Commit `feat(zombie): complete broadcast experience Phase 3` only after streamed R2 evidence passes.

## Task 4 — Phase 4 audience interaction

**Produces:** provider-neutral fixed-choice influence, deterministic votes, exactly-once application/reversal, no-audience/outage modes and R3 evidence.

- [ ] Write failing tests for schema/auth evidence, raw-text rejection, privacy-safe viewer refs, sanitation, moderation, rate limits, queue caps, duplicate/reordered/stale IDs, deterministic vote cutoff/ties, cooldown/conflict/caps, effect eligibility, exactly-once restore/reconnect, expiry, append-only reversal, paid/free shared safety, outage fail-closed and autonomous continuity.
- [ ] Verify red failures before implementing effect code.
- [ ] Implement the ten approved effects with stable bounds and prevalidated anchors; prohibit direct terminal/result/record commands.
- [ ] Add acknowledgement lifecycle and render projection without raw provider payloads or exact monetary data.
- [ ] Run baseline, typical, burst, maximum-pressure, provider-outage, moderation-outage, persistence-outage and reversal campaigns on identical seeds.
- [ ] Prove zero duplicate authoritative applications and zero effects outside declared bounds.
- [ ] Run full suite and interaction security/moderation review; fix all P0/P1 test-first.
- [ ] Commit `feat(zombie): complete audience interaction Phase 4` only after R3 criteria pass.

## Task 5 — Phase 5 reliability and operations

**Produces:** append-only durable evidence, writer fencing, verified restore/quarantine, supervisor, output health, RBAC, bounded resources, chaos scripts and R4 evidence.

- [ ] Write failing tests for durable-before-mutation ordering, atomic snapshot indexes, single-writer lease renewal/fencing, exact post-snapshot replay, corrupt-newest fallback, incompatible/divergent quarantine, influence reservation recovery, RBAC deny-by-default, audit-before-control, progress/output/audio/provider/persistence probes, breakers/backoff, queue overflow and resource retention.
- [ ] Verify red failures before operations implementation.
- [ ] Implement repository-compatible file-backed evidence and supervisor contracts; no filesystem/network operation enters the authoritative tick.
- [ ] Add deterministic chaos runner covering worker kill, duplicate/reorder, provider/moderation outage, persistence lag, corrupt snapshot, renderer/audio/black/frozen/wrong-scene failure, queue saturation and stale writer.
- [ ] Add runbook, rollback matrix, on-call ownership, alerts/SLOs and handoff.
- [ ] Run focused tests, full suite, stream self-test and chaos script; compare recovered/uninterrupted state, RNG, event and influence checksums.
- [ ] Review bounds and failure transitions; fix all P0/P1 test-first.
- [ ] Commit `feat(zombie): complete reliability and operations Phase 5` only after R4 software evidence passes.

## Task 6 — Phase 6 production validation and launch governance

**Produces:** exact-source manifest, traceability, release validator, capacity/endurance/canary contracts, drill catalogue, fail-closed assessor and truthful R5 intake.

- [ ] Write failing tests for 40-character source identity, config/content/schema hashes, candidate-bound evidence, material-change invalidation, MUST traceability, deterministic baseline/pressure campaigns, p95/p99/headroom and memory-slope gates, real elapsed endurance rejection, credentialed provider evidence, external attestations, complete drills, seven-day canary thresholds, rollback triggers, independent review and 100-point assessor.
- [ ] Verify red failures before release implementation.
- [ ] Implement the manifest, evidence contracts, capacity evaluator, 26+ drill catalogue, canary controller and assessor.
- [ ] Add release validation script that emits machine-readable software evidence and returns `BLOCKED_EXTERNAL`, R4 and `productionReady=false` when genuine external evidence is absent.
- [ ] Update CI to build/test Zombie, scan authoritative code for ambient nondeterminism, run stream self-test, generate Phase 5 chaos and Phase 6 validation artifacts, execute browser checks and upload artifacts.
- [ ] Run the complete local/new-game verification available, then push and use GitHub Actions as the full repository verifier.
- [ ] Triage CI failures from logs, reproduce each with a failing test where behavioral, patch, rerun and repeat until green without deleting coverage.
- [ ] Perform separate specification-compliance and engineering/viewer-experience reviews against the exact candidate; close all P0/P1 findings.
- [ ] Commit `feat(zombie): complete production validation Phase 6` and publish a ready-for-review PR.

## Task 7 — Integration and truthful release handoff

- [ ] Rebase or update from current `main` without overwriting concurrent game work; rerun full CI on the exact PR head.
- [ ] Verify branch diff contains only Game 10 and intentional shared integration changes.
- [ ] Confirm every phase document cites reproducible commands/evidence and no placeholder or fabricated production claim remains.
- [ ] Confirm the final assessor reports the highest supported status; external missing evidence must remain explicit.
- [ ] Merge through the repository's allowed reviewed strategy only after required checks pass.
- [ ] Verify the merged commit/status and report branch, PR, merge commit, test totals, artifacts, readiness level, open external gates and exact operator commands.

## Self-review

- Spec coverage: all creative, gameplay, deterministic, AI, generation, economy, audience, presentation, accessibility, reliability, security, performance, analytics and R1–R5 requirements map to tasks above.
- Placeholder scan: no `TBD`, `TODO`, “handle appropriately,” “add tests,” or unsupported completion claim is permitted.
- Type consistency: the public center is `ZombieRuntime`; all later tasks consume its serialized state/events and never create a second authority.
- Phase independence: every phase ends with runnable production rules, retained prior regressions, evidence and a review gate.
- Production truth: software completion does not waive external provider, duration, canary, witness or independent-review requirements.