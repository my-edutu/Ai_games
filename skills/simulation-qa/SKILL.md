---
name: simulation-qa
description: Use when planning or reviewing tests for game rules, invariants, seeds, replay, procedural content, autonomous agents, statistical balance, interactions, UI, audio, soak, chaos, restore, or production evidence
---

# Simulation QA

## Overview

Test autonomous and emergent games through invariants, reproducible seeds, statistical campaigns, adversarial systems, and full broadcast flows. The core principle is **prove properties and distributions, not only scripted examples**.

## Scope

Use for test strategy, TDD, contract/property/replay tests, procedural and agent benchmarks, statistical balance, provider interactions, UI/audio/output, performance, soak, chaos, security, and evidence. It does not replace specialist design review; it makes claims falsifiable.

## Non-Negotiable Invariants

- Behaviour changes begin with a focused failing test and verified expected failure.
- Tests use production rules; headless mode cannot implement an easier alternate game.
- Seeds, versions, configurations, content, normalized events, and expected checksums are recorded.
- Every critical invariant, terminal state, fallback, degradation, restore, and rollback path has a test.
- Emergent claims use declared sample size/confidence/effect thresholds and inspect tails.
- Flaky tests are defects; rerunning until green is prohibited.
- Technical/integrity failures are distinguished from legitimate game loss.
- Test environments do not expose production secrets or mutate production data.
- Evidence is machine-readable where possible and retained with a reproducible manifest.
- Production readiness requires realistic capture/provider/host tests beyond unit CI.

## Workflow

### 1. Build requirement traceability

Map every MUST requirement and phase criterion to:

- test type;
- fixture/seed/event scenario;
- command/environment;
- expected result/threshold;
- evidence path;
- owner and execution cadence.

A prose review cannot close runtime behaviour.

### 2. Design the test layers

Use the appropriate combination:

- unit tests for rules and pure utilities;
- schema/contract tests for game/shared/provider interfaces;
- property/invariant tests for broad state spaces;
- deterministic replay and random-stream isolation;
- snapshot round-trip/migration/restore;
- procedural validity/diversity/performance;
- agent benchmark/stuck/fallback/adversarial;
- accelerated simulation and statistical balance;
- audience moderation/idempotency/cooldown/reversal/provider reconnect;
- render snapshot/UI/accessibility/mobile/visual regression;
- semantic audio/mix/loudness/health;
- integration/end-to-end stream and operator flows;
- performance/load/memory/soak/chaos;
- security/privacy/supply-chain;
- deployment/canary/rollback drills.

### 3. Practice test-first behaviour

For each behaviour:

1. write one minimal test naming the expected outcome;
2. run it and confirm it fails for the missing behaviour, not a setup error;
3. implement the smallest change;
4. run focused test and affected suite;
5. refactor while green;
6. add property/adversarial coverage if the behaviour has a state space;
7. commit test and implementation together.

Generated/configuration-only artefacts still require schema and review checks proportional to risk.

### 4. Build seed and event corpora

Maintain:

- smoke seeds;
- regression seeds for every discovered defect;
- stratified seeds by generated-content features;
- extreme/pathological seeds;
- long-run/max-progression seeds;
- no-audience, typical, burst, adversarial, and provider-outage event logs;
- restore/migration fixtures by supported version;
- deterministic AI/model fallback fixtures.

Do not blacklist a bad seed merely to make tests green unless content policy explicitly quarantines it with evidence and a safe generator fix/fallback.

### 5. Test properties

Examples:

- legal state remains legal after any legal action;
- resources never go below floor/above bounded cap;
- mandatory goal remains reachable;
- events and sequence are unique/ordered;
- duplicate influence applies at most once;
- identical replay matches checkpoints;
- no entity remains in mutually exclusive states;
- terminal result is immutable;
- restore equals uninterrupted run;
- renderer/audio failure cannot change authority;
- collections/queues/resources remain bounded.

Shrink failing property cases into reproducible seeds/actions.

### 6. Analyze distributions

Predeclare populations, stratification, sample size or sequential rule, confidence intervals, effect-size thresholds, tails, failure categories, and guardrails. Compare candidate/baseline on identical corpora.

Inspect representative replays from median, tails, each terminal reason, each dramatic pattern, and anomalies. Aggregate success cannot excuse invalid individual outcomes.

### 7. Exercise failure and operations

Inject process kills, provider disconnect/reorder/duplicate, database lag, moderation/model outage, queue overflow, corrupt snapshots, renderer/audio crash, black/frozen/silent output, host restart, credential rotation, incompatible deployment, and rollback.

Verify expected health state, public scene, alert, automated action, recovery objective, idempotency, and evidence.

### 8. Gate and triage

Classify failures:

- P0 integrity/security/data corruption or unsafe production action;
- P1 requirement violation, unrecoverable failure, major gameplay defect;
- P2 meaningful bounded quality defect;
- P3 refinement.

Quarantine flaky tests, identify root cause, and block affected confidence rather than deleting coverage.

## Required Outputs

- requirement-to-test traceability matrix;
- test pyramid and environment matrix;
- fixtures/seed/event/replay corpus manifest;
- invariant/property catalogue;
- TDD task sequence for each implementation phase;
- statistical analysis plan and thresholds;
- provider/audience/moderation/security scenario matrix;
- UI/audio/accessibility/output capture matrix;
- performance/load/soak/chaos/restore/rollback plan;
- CI/scheduled/canary execution cadence;
- evidence manifest, failure triage, flake policy, and release gate.

## Review Gate

Pass only when:

- every MUST requirement has runtime or proportionate static evidence;
- focused tests were observed failing before implementation for behaviour changes;
- deterministic replay passes across uninterrupted/restore/render-schedule scenarios;
- property tests exercise state spaces and preserve shrunk failures;
- seed campaigns cover feature strata and pathological tails;
- balance conclusions meet declared statistical thresholds and replay review;
- provider duplicates/reorder/reconnect/reversal and abuse tests pass;
- UI/audio/output/accessibility evidence uses representative capture chain;
- soak/chaos/rollback tests meet reliability objectives;
- no flaky/ignored test masks a load-bearing requirement.

## Stop-Ship Failures

- tests written only after implementation and immediately pass;
- mocks verify calls instead of rule outcomes where real code is available;
- one golden seed represents emergent quality;
- headless runner uses different rules;
- average hides infinite/stuck tail;
- bad seeds removed without diagnosis;
- provider callbacks tested only once/in order;
- screenshot at desktop resolution only;
- soak skipped because unit coverage is high;
- flaky replay rerun until green.

## Handoffs

- every specialist skill supplies invariants, metrics, and scenarios.
- `game-analytics-experimentation`: statistical contracts and data quality.
- `performance-optimization`: representative profiles and budgets.
- `long-running-reliability`: chaos, soak, recovery, and operations.
- `security-privacy` and `crowd-moderation`: adversarial corpora and safe environments.
- `production-readiness-review`: independent evidence and stop-ship decision.
