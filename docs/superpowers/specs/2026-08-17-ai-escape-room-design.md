# AI Escape Room — Production-Candidate Design

**Date:** 2026-08-17  
**Catalogue position:** Game 8  
**Game slug:** `ai-escape-room`  
**Approval:** The product owner delegated approval to the strongest production-ready option and instructed the implementation to continue without preference questions.

## 1. Product Decision

AI Escape Room is an autonomous, endlessly replayable puzzle spectacle for long-running livestreams. Each run places an observable AI agent inside a themed room containing objects, clues, locks, tools, decoys, hazards and an exit. The audience should understand the current objective within ten seconds, follow the AI's reasoning without seeing hidden answers, anticipate breakthroughs or mistakes, and influence bounded aspects of the run without buying a guaranteed outcome.

The game must remain entertaining with no chat, no remote model, no provider connection and no operator present. It must restart automatically, preserve deterministic replay, expose clear health state, and degrade to a safe scene rather than silently freezing or showing invalid game truth.

## 2. Approaches Considered

### A. Deterministic symbolic puzzle graph — selected

A room is generated from validated puzzle templates and a dependency graph. The authoritative engine knows the hidden solution; the normal AI receives only observations and builds a bounded belief model. A separate oracle validates solvability but is unavailable to production policy code.

**Advantages:** deterministic, testable, stream-safe, replayable, inexpensive, bounded, compatible with audience influence, and capable of meaningful visible reasoning.  
**Trade-off:** authored puzzle primitives must be deliberately expanded over time.

### B. Free-form model-generated escape rooms — rejected for the authoritative path

A language model would invent rooms, clues and solutions in real time.

**Advantages:** high novelty and expressive narration.  
**Trade-offs:** hidden nondeterminism, invalid or contradictory puzzles, latency, provider cost, content-safety risk, difficult replay, and a continuity dependency. A model may later propose optional cosmetic narrative that passes deterministic validation, but it cannot own game truth.

### C. Full 3D physics escape room — deferred

A first-person or physics-heavy room would provide richer spatial spectacle.

**Advantages:** strong visual novelty and tactile interactions.  
**Trade-offs:** substantially larger asset, physics, camera, accessibility, performance and browser-source surface. It is not required to prove the catalogue's symbolic-reasoning capability. The selected 2D room theatre preserves a future renderer replacement behind immutable render snapshots.

## 3. Viewer Experience

The visual identity is **The Cipher Vault**: a premium dark control-room aesthetic with brass, cyan and warm amber accents, layered room lighting, legible object silhouettes, animated reasoning links and restrained particle effects. The stream source is dependency-free HTML, CSS and Canvas so it can run reliably as an OBS browser source.

The default desktop layout contains:

1. a large room stage with the AI avatar, interactive objects, locks, clues, hazard telegraphs and exit;
2. a compact mission header showing room, theme, elapsed time, streak and current objective;
3. a reasoning panel showing only public observations, current hypothesis, confidence and next action;
4. inventory, discovered-clue and puzzle-progress strips;
5. a caption/event rail that remains sufficient when muted;
6. a health indicator that distinguishes normal failure from technical degradation.

Phone landscape, clean-feed, high-contrast, color-safe, reduced-motion and muted-caption modes preserve essential game truth. Decorative animation never carries unique information.

## 4. Core Loop

1. Generate a deterministic room from a seed, difficulty and theme.
2. Validate the complete room with an isolated solution oracle.
3. Spawn the AI with no hidden solution knowledge.
4. Observe visible objects and clue surfaces.
5. Update a bounded belief graph.
6. Select one legal action: inspect, move, take, combine, use, enter-code, activate, wait or exit.
7. Apply the action atomically and emit structured events.
8. Update timers, hazards, puzzle dependencies, score and public presentation.
9. Repeat until escape, fair failure, technical quarantine or maximum-tick boundary.
10. Show an explainable result/intermission and automatically start the next seeded room.

Persistent broadcast progress includes room index, successful streak, best solve time, difficulty tier, theme rotation and classified dramatic moments. These records are replay-derived rather than client-owned.

## 5. Puzzle System

### Puzzle primitives

The first production candidate supports:

- sequence lock;
- symbol-to-number cipher;
- color or shape ordering with redundant non-color cues;
- item-tool dependency;
- switch network;
- weight or balance clue;
- directional pattern;
- final multi-clue vault code.

### Room dependency graph

Every room is a directed acyclic dependency graph with optional side clues and decoys. Mandatory solution depth, clue redundancy, decoy count, hazard pressure and timer budget scale by difficulty. The generator constructs prerequisite facts and tools before dependent locks, then validates that at least one legal solution path exists from the initial observation state.

### Solvability and fairness

- The validator checks reachability, inventory dependencies, code derivation, action budget, timer budget and exit accessibility.
- Mandatory clues cannot depend on color alone.
- Hazards are telegraphed and leave the configured response window.
- Technical errors, corrupt content and replay divergence are not counted as player losses.
- A deterministic known-good room is used when bounded generation attempts fail.

## 6. AI Architecture

### Observation boundary

`createEscapeObservation` exposes only currently visible objects, previously inspected facts, inventory, public timers, active hazard telegraphs and legal interaction affordances. It excludes hidden solutions, unopened contents, future random draws, oracle routes and undiscovered clue values.

### Belief model

The AI stores bounded facts, hypotheses, unresolved locks, clue relationships, confidence, failed attempts and recent action history. Contradicted hypotheses are downgraded rather than silently retained.

### Planner

A deterministic bounded best-first planner ranks actions by:

- information gain;
- prerequisite progress;
- confidence-weighted unlock value;
- travel/action cost;
- hazard and timer risk;
- repetition penalty;
- completion probability.

The planner never requires a remote model. A remote model may later provide optional narration from the public snapshot, but cannot select or execute authoritative actions.

### Pathology handling

The runtime detects repeated action loops, no-information periods, impossible hypotheses, exhausted plans and risk spirals. It responds through deterministic plan reset, alternate clue exploration, safe waiting, bounded hint consumption or technical quarantine depending on the cause.

## 7. Authoritative State and Data Flow

The authoritative state contains configuration, lifecycle, room graph, object state, inventory, discovered facts, AI belief, timer/hazard state, audience-command journal, score, event sequence and result. All random draws use named streams from the shared seeded RNG.

Data flow:

`normalized config + seed -> generator -> validator -> authoritative state -> observation -> belief -> planner -> legal action -> rules -> events -> immutable render snapshot -> browser source`

External audience data follows a separate path:

`provider adapter -> normalized/moderated event -> vote/effect director -> prevalidated candidate -> durable command -> authoritative apply-once boundary`

Presentation cannot mutate state. Provider payloads, entitlement details and payment data never enter replay truth.

## 8. Audience Interaction

Fixed bounded effects are:

- spotlight one eligible visible object;
- reveal one non-terminal clue fragment;
- grant a small timer extension;
- suppress one eligible hazard cycle;
- add one validated decoy;
- shuffle labels on eligible unsolved non-terminal objects while preserving clue mappings;
- vote for the next theme;
- vote for one of two eligible AI strategies.

Each effect has a candidate ID, eligibility proof, cap, cooldown, schedule, expiry, reversal semantics, audit category and idempotency key. No purchase or vote can reveal the complete final answer, guarantee escape, guarantee failure, create an unsolvable room or bypass the configured response window. No-audience operation is a first-class mode.

## 9. Runtime, Persistence and Recovery

The fixed-step runtime owns exactly one authoritative writer. Snapshots include schema version, game version, configuration hash, seed, named RNG streams, state, command journal position, event sequence and canonical checksum.

Recovery verifies snapshot compatibility and checksum, restores the latest valid snapshot, replays accepted commands exactly once, checks state divergence and resumes at a declared safe boundary. Corrupt newest snapshots fall back to older valid snapshots. Divergence quarantines the candidate and presents a safe scene rather than inventing continuity.

Bounded structures include event history, reasoning history, clue facts, failed hypotheses, command IDs, render trails, telemetry buffers, snapshots and recovery attempts.

## 10. Health and Operations

Health classification covers:

- simulation progress;
- AI progress and loop detection;
- room validity;
- event backlog;
- snapshot age and persistence;
- provider/moderation availability;
- render freshness;
- black, frozen, stale or silent output;
- memory/resource budget;
- restart and crash-loop state.

Operator controls are audited, idempotent and fail closed when durable audit is unavailable. Controls include pause, resume, restart component, restart room, fresh-run boundary, safe-scene, quarantine, rollback and halt.

## 11. Phase Plan

### Phase 1 — Foundation

Deliver configuration validation, deterministic room generation, isolated solver/validator, authoritative rules, runtime lifecycle, snapshots, replay checksum, headless runner and foundation tests.

### Phase 2 — Core AI and content

Deliver partial observation, belief graph, deterministic planner, puzzle primitives, hazards, difficulty progression, campaign tests, loop recovery and fair-failure classification.

### Phase 3 — Broadcast experience

Deliver immutable privacy-safe render snapshots, responsive layout, camera/audio/caption models, premium browser source, clean feed, accessibility modes, output health and browser tests.

### Phase 4 — Audience interaction

Deliver prevalidated influence candidates, durable apply-once commands, caps/cooldowns/expiry/reversal, vote strategy, no-audience/provider-outage behavior and pressure campaigns.

### Phase 5 — Reliability and operations

Deliver durable channel service, writer fencing, verified recovery, health classification, chaos drills, runbook, rollback matrix, bounded retention and deterministic chaos evidence.

### Phase 6 — Production launch validation

Deliver exact-candidate validation bundle, software readiness score, capacity/endurance semantics, drill catalogue, evidence intake, handoff, final review and release governance.

## 12. Testing Strategy

Tests use Node's built-in test runner, strict TypeScript and Playwright for the browser source. Required coverage includes:

- configuration bounds and invalid input;
- same-seed equality and named-stream isolation;
- generator validity, fallback and oracle route;
- legal/illegal atomic actions;
- snapshot corruption and restore equivalence;
- hidden-information leakage scans;
- planner legality, dependency order and loop recovery;
- campaign determinism and classified outcomes;
- immutable render snapshots and accessibility layouts;
- audience idempotency, caps, expiry, reversal and solvability preservation;
- provider and moderation failure closure;
- writer fencing, corrupt-newest fallback and divergence quarantine;
- output-health, crash-loop and resource-bound tests;
- release-manifest, readiness-score and external-evidence truthfulness tests.

Every behavior change follows red-green-refactor. Phase evidence records exact commands and results; generated evidence cannot claim elapsed soak or canary time that did not occur.

## 13. Readiness Truth

All six software phases can be completed in this implementation loop. The highest truthful immediate state is an internally reviewed **R4 production candidate** with `productionReady=false` until the exact candidate completes the required real 72-hour soak, seven-day canary, witnessed rollback/incident drills, credentialed provider checks and independent signed R5 review. The release assessor must block R5 when those primary artifacts are absent rather than awarding synthetic points.

## 14. Acceptance Summary

The design is accepted when:

- Game 8 exists as an isolated module and deployable browser source;
- identical inputs reproduce authoritative outcomes and checksums;
- normal AI and presentation cannot access hidden solutions;
- generated rooms are solvable or rejected as technical failures;
- the AI can autonomously complete varied rooms and recover from planning pathologies;
- the stream remains comprehensible on desktop and phone landscape, including muted and reduced-motion modes;
- audience influence is bounded, disclosed, idempotent and non-terminal;
- snapshots, replay, recovery, health, chaos and rollback behavior are implemented and tested;
- all six phase documents and evidence are complete;
- final specification, architecture, code, UI, accessibility, security and production-readiness reviews have no open P0 or P1 software findings;
- the readiness output truthfully distinguishes software completion from external R5 evidence.
