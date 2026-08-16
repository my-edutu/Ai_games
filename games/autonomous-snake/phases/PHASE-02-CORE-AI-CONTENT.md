# Phase 2 — Survival AI, Progression, and Procedural Content

**Phase status:** Not started  
**Readiness target:** R2 headless/gameplay vertical slice  
**Viewer-visible outcome:** The snake behaves deliberately, preserves future space, adapts to varied boards and hazards, progresses through meaningful milestones, and produces diverse rule-driven runs instead of one greedy pattern.

## Objective

Replace the Phase 1 fallback as the normal policy with the layered production AI, expand deterministic content and progression, calibrate target run distributions, and prove that high occupancy, adversarial seeds, and no-progress states remain bounded and intelligible.

## In Scope

- full observation/action/intent contract;
- legal, immediate-safety, objective-path, tail-access, reachable-space, bottleneck, cycle, strategic-mode, stuck, and fallback components;
- versioned policy configuration and decision scheduler budgets;
- board profiles: open, corridors/chambers, rings, portals, and one additional validated topology;
- standard and special food families needed for the reference release;
- timed/static hazards with telegraph and recovery semantics;
- milestone/progression bands, records candidate logic, dramatic-pattern instrumentation;
- generator validators, deterministic repair, known-good fallback, feature extraction;
- accelerated seed campaigns and initial balance targets;
- a minimal local debug visualizer/replay inspector sufficient to review AI decisions, not the final stream presentation.

## Explicit Non-Scope

Final art/audio/HUD, live providers, gifts, production database, operator dashboard, seven-day canary, and public launch.

## Requirements Addressed

All `FR-SNK-AI-*`, `FR-SNK-PROG-*`, core gameplay requirements, deterministic/performance/testing requirements, and the AI/content portions of production readiness.

## Workstreams

### 1. Observation and Policy State

Implement serializable observations, strategic mode, goal/plan age, confidence, invalidation reason, recent progress/loop hashes, and public intent keys. Prove hidden/provider/presentation data is absent.

### 2. Safety and Path Planning

Implement candidate legal filter, flood-fill reachable-space estimate, future-tail reachability, bottleneck/partition risk, time-aware bounded BFS/A*, and path-prefix safety validation. Hard survivability constraints remain separate from candidate score.

### 3. High-Occupancy Strategy

Implement cycle/Hamiltonian support for compatible board profiles, safe shortcut rules, cycle repair or graceful rejection, and transition into/out of cycle mode using occupancy and topology signals. Non-cycle boards use tail-follow and region-preservation strategies.

### 4. Strategic Modes and Fallback

Implement deterministic transitions among seek-food, preserve-space, follow-tail, cycle-fill, escape-hazard, replan, and fallback-survival. Add time/node budgets, late-work rejection, telemetry, and local deterministic fallback that is always available.

### 5. Stuck and Pathology Recovery

Detect no meaningful progress, repeated state/action cycles, failed route churn, excessive tail-follow, objective invalidity, fallback storms, and planning-budget violations. Recovery changes plan/strategy; it cannot teleport or secretly alter content. Content defects trigger repair/quarantine.

### 6. Procedural Boards and Objectives

Add constructive topology grammar, obstacle/portal/hazard anchors, validation, deterministic repair/fallback, feature extraction, seed preview, and regression bank. Objective placement ranks reachable valid candidates and supports risk/reward special food with expiry.

### 7. Progression and Balance

Implement small/medium/major milestones, progression bands, speed and hazard profiles, record eligibility, no-progress and long-run caps, conquest and endless-cycle boundaries, and dramatic-pattern event classification. Establish target distributions through stratified campaigns.

### 8. Debugging Tools

Provide seed/config replay, board/state inspector, AI candidate scoring/constraint explanation, path/region/cycle overlay, event timeline, checksum tree, and export of anomalous runs. Debug data stays outside public render snapshots.

## Test-First Sequence

- legal/hidden observation and action schema;
- reachable-space, tail-access, bottleneck, and path tests on hand-built fixtures;
- one-safe-move and tempting-trap adversarial states;
- cycle construction/order/shortcut safety and incompatible-board fallback;
- strategic transition/hysteresis and timeout fallback;
- repeated-state/stuck recovery;
- generator connectivity, clearance, reachability, repair, termination, feature extraction;
- objective/special-food/hazard validity and expiry;
- policy checksum determinism and random-stream isolation;
- maximum board/high-occupancy decision budget;
- stratified campaign distributions and representative replay review.

## Metrics and Initial Targets

Define and approve bands for decision p50/p95/p99/max, node expansions, fallback/timeout/stuck/oscillation, objective fallback, invalid boards, run duration, occupancy, terminal causes, milestones, records, dramatic patterns, strategy usage, repeated content, and excessively short/long runs. Targets remain hypotheses until supported by evidence; they may not be tuned through forced deaths.

## Acceptance Criteria

- [ ] The normal AI uses layered safety/planning and the Phase 1 fallback only on declared degraded paths.
- [ ] Legal action rate, decision budgets, and replay checksums pass the entire benchmark corpus.
- [ ] The AI rejects at least the documented greedy trap fixtures and explains the selected safe mode accurately.
- [ ] Eligible high-occupancy boards use cycle or equivalent long-horizon space-preserving behavior.
- [ ] Planner timeout/exception/model absence cannot freeze a run.
- [ ] Stuck/oscillation cases recover within game-specific bounds or resolve through a legitimate terminal state.
- [ ] Every generated board and objective satisfies hard validity constraints; generator/repair terminate.
- [ ] Diversity and feature distributions show materially distinct profiles rather than cosmetic seed variation.
- [ ] At least three dramatic patterns appear across the approved campaign without hidden outcome forcing.
- [ ] Invalid content and technical failures remain excluded from normal loss metrics.
- [ ] Headless maximum-load profiles meet the approved tick/AI/memory budgets.
- [ ] Spec and quality reviews have no P0/P1 finding.

## Evidence Bundle

Add AI fixtures, decision traces, path/cycle visualizations, generator reports, seed corpus manifest, campaign statistics/confidence, representative/tail replays, performance profiles, balance decision record, and reviews under `phase-02/`.

## Rollback

Policy, generator, hazard, and balance configurations are versioned. A candidate can roll back to the Phase 1 rules/policy or the prior Phase 2 version only when snapshot/event compatibility is declared; otherwise start a fresh run boundary. Do not rewrite historical records across incompatible modes.

## Exit and Handoff

Phase 2 exits at R2 gameplay quality when the headless/reference debug stream demonstrates diverse complete runs with validated AI and content. Phase 3 consumes semantic events, render snapshots, signals, intent, and result contracts to build the premium broadcast experience.
