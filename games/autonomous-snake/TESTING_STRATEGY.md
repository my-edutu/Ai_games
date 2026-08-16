# Autonomous Snake — Testing Strategy

**Status:** Approved strategy  
**Quality rule:** Runtime claims close only through reproducible tests and evidence. Headless and streamed modes use the same authoritative rules.

## Traceability

Every `FR-SNK-*` and `NFR-SNK-*` requirement maps to one or more tests, a phase, an expected threshold, and an evidence path. The implementation ledger records exact commands, commit, versions, configuration, seed/event corpus, environment, hardware, results, and artefact checksums.

## Test Layers

### 1. Unit and Contract Tests

Cover:

- coordinate/index conversion and neighbor tables;
- direction/reversal and tail-vacate rules;
- body movement, growth, occupancy, score, milestone, and terminal precedence;
- food/hazard/portal/modifier semantics;
- configuration and content schemas;
- GameModule, command, event, render, audio, snapshot, and influence contracts;
- public intent and result summaries;
- record eligibility and tie rules.

Each behavior change begins with a focused failing test, verified to fail for the intended missing behavior.

### 2. Property and Invariant Tests

Generate legal states/actions and assert:

- body cells are unique except explicitly permitted transient representation;
- head/body remain in playable cells;
- length equals body plus declared pending-growth semantics;
- occupancy counts match the authoritative map;
- resources/timers remain within bounds;
- no food/objective overlaps an illegal cell;
- a legal action either produces a valid next state or a typed terminal result;
- terminal result is immutable;
- event sequences and entity IDs remain unique/ordered;
- collections and coordinates remain bounded;
- renderer/audio/provider availability cannot change state.

Shrunk failures become permanent regression fixtures.

### 3. Deterministic Replay

Fixtures compare initialization, milestone, snapshot, and final hierarchical checksums across:

- repeated execution in one process;
- process restart;
- uninterrupted versus snapshot restore;
- different render frame schedules;
- headless versus streamed host;
- duplicated/reordered/delayed normalized audience delivery producing the same scheduled commands;
- supported runtime/host matrix;
- previous compatible snapshot/event fixtures.

Random-stream isolation tests prove cosmetic draws do not perturb board, food, hazards, AI, or results.

### 4. AI Benchmarks

Seed corpora include open boards, bottlenecks, chambers, rings, portals, timed hazards, near-complete boards, one-safe-move traps, tail-vacate edges, risky food, maximum allowed audience pressure, no-audience, restore-at-risk, and every discovered defect.

Measure:

- legal/stale/invalid actions;
- decision latency/nodes and budget violations;
- progress, length, occupancy, duration, terminal reason;
- tail reachability and reachable space near failure;
- strategy usage/transitions;
- fallback, stuck, oscillation, recovery;
- path efficiency and diversity;
- checksum repeatability.

A remote model remains disabled for the full suite.

### 5. Procedural Content Tests

For every profile and stratified seed sample:

- connectivity and playable capacity;
- valid start/body placement;
- reachable objective under spawn policy;
- obstacle/hazard/portal clearance and safe response window;
- generator/repair termination;
- feature distribution and duplicate/near-duplicate rate;
- generation p50/p95/p99/max and memory;
- fallback rate and diagnostic quality;
- AI success/stuck distribution by feature band.

Broken seeds remain reproducible and join the regression bank.

### 6. Balance and Statistical Campaigns

Predeclare seed stratification, configurations, event scenarios, sample size or sequential rule, confidence intervals, practical effect thresholds, tails, and stop conditions. R4 requires at least 100,000 lightweight runs or a statistically justified larger-equivalent tick workload.

Compare identical corpora for:

- run duration/progress/outcome/failure reason;
- milestone and record cadence;
- dramatic-pattern and strategy diversity;
- excessively short/long/stalled/runaway cases;
- no-audience, typical interaction, maximum allowed pressure, provider outage, AI fallback, and each mode/profile;
- economy/reward/effect contribution where applicable;
- performance and invariant failures.

Inspect median, tails, every terminal reason, each dramatic pattern, and anomalies through replay.

### 7. Audience Interaction Tests

Test every effect for eligibility, placement validity, bounds, cooldown, conflict, cap, queue, expiry, cancellation, reversal, record mode, acknowledgement, and replay.

Provider scenarios include forged, duplicated, delayed, reordered, retried, reconnected, burst, sanctioned, moderated, pending entitlement, reversed, unavailable audit, queue overflow, and full outage. Assertions include zero duplicate authoritative applications and no unavoidable immediate death from obstacle/hazard placement.

### 8. Presentation, Audio, and Accessibility

Automated and review evidence covers:

- lifecycle/HUD scene contracts;
- stale/out-of-order render snapshots;
- entity/effect cleanup on restart/restore;
- desktop, mobile-size, crop, low-bitrate, bright/dark, dense-VFX captures;
- color-safe, grayscale, reduced-motion, reduced-flash, captions, localization expansion;
- camera target loss/bounds/rapid milestones;
- semantic cue priority, voice stealing, ducking, adaptive music hysteresis;
- integrated loudness, true peak, intended silence, clipping, underrun, missing cue;
- renderer/audio crash and reconstruction;
- public-data exposure scan.

Uninstructed reviewers must identify goal, progress, danger, and outcome within the defined comprehension target.

### 9. Performance and Resource Tests

Representative workloads profile:

- ordinary and high-occupancy ticks;
- worst safe-path search and cycle strategy;
- objective generation/repair;
- maximum board/segments/hazards/effects;
- snapshot write/restore/replay;
- audience burst and provider reconnect;
- peak VFX/audio/HUD;
- quality-tier transition;
- long-run memory, handles, timers, listeners, textures, buffers, caches, logs, queues, and snapshot growth.

Budgets use p50/p95/p99/max and reference hardware. Monotonic unexplained growth is a stop-ship defect.

### 10. Reliability, Chaos, and Operations

Inject:

- simulation, renderer, audio, gateway, persistence writer, telemetry, and dashboard process failures;
- tick/AI/render/output stalls;
- database lag/unavailability;
- provider/moderation/entitlement/model outage;
- duplicate event storm and bounded queue saturation;
- corrupt/incompatible snapshot and deliberate replay divergence;
- black/frozen/wrong-scene/silent output;
- host restart and credential rotation;
- configuration/content/deployment rollback.

Verify expected health state, public scene, alert, automated action, recovery objective, idempotency, evidence preservation, and operator runbook.

## Execution Cadence

- per change: focused unit/property/contract/replay tests;
- per pull request: affected integration, headless smoke corpus, type/lint/security/documentation checks;
- nightly: stratified AI/content campaigns, performance regressions, provider fixtures;
- scheduled: long campaign, memory/resource and replay compatibility;
- R4: full statistical campaign, 24-hour engineering and 72-hour candidate soak;
- R5: seven-day canary plus rollback and incident drills.

## Flake and Failure Policy

A flaky test blocks confidence in the affected gate. It is isolated only with an owner and incident, then fixed through root-cause analysis; it is not rerun until green or weakened. Technical failures are never reclassified as game losses. Missing/stale evidence fails the requirement.

## Evidence Structure

```text
evidence/autonomous-snake/<release-id>/
├── manifest.md
├── traceability.csv
├── tests/
├── seeds-and-replays/
├── simulations/
├── interactions/
├── audiovisual-accessibility/
├── performance/
├── soak-chaos/
├── security-privacy/
├── operations-rollback/
└── reviews/
```

## Exit Standard

The test strategy is satisfied only when all MUST requirements have passing current-version evidence, deterministic restore/replay matches, target distributions and tails are supported, interaction duplicate application is zero, broadcast/audio/accessibility captures pass, resources remain bounded, common failures recover, and no ignored/flaky/load-bearing finding remains.
