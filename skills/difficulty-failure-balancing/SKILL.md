---
name: difficulty-failure-balancing
description: Use when designing or reviewing challenge curves, fail rates, win rates, run duration, adaptive difficulty, comeback mechanics, hazard scaling, boss tuning, frustration, recovery, or statistical game balance
---

# Difficulty and Failure Balancing

## Overview

Shape challenge so outcomes remain uncertain, causal, varied, and satisfying across long-running autonomous play. The core principle is **target distributions and readable trade-offs, never a hidden script for who wins or loses**.

## Scope

Use for difficulty axes, failure causes, run-duration targets, win/loss rates, adaptive challenge, comeback mechanics, bosses, checkpoints, and balancing simulations. It does not authorize deceptive retention manipulation or override deterministic truth.

## Non-Negotiable Invariants

- Difficulty targets are distributions segmented by phase, seed features, strategy, and audience conditions.
- Every terminal failure has a rule-based cause visible in replay evidence.
- Adaptive systems select only declared, bounded, recorded, replayable changes.
- Directors cannot secretly change collisions, probabilities, records, or force terminal results.
- Challenge grows across decisions and complexity, not only raw speed/health/damage.
- Comeback mechanics preserve stakes and eligibility; they do not grant invisible immunity.
- No-progress, runaway, impossible, and excessively long/short runs have explicit handling.
- Paid/free audience effects cannot purchase guaranteed wins or losses.
- Balance changes are versioned and compared on identical seed/event corpora.

## Workflow

### 1. Define outcome targets

For each mode and major progression band declare target ranges for:

- win/loss/draw/abort/quarantine;
- run duration and progress;
- milestone arrival;
- failure reason;
- setback/recovery;
- record frequency;
- dominant strategy/content;
- stuck/no-progress/runaway;
- audience-effect contribution;
- agent fallback/timeouts;
- viewer-visible tension and quiet intervals.

Use percentiles and confidence intervals, not only means.

### 2. Build a difficulty model

List challenge axes such as space, time, hazard density, enemy intelligence, resource scarcity, information, coordination, objective concurrency, precision, punishment, and recovery cost.

For each axis define observable state features, parameter range, change rate, interactions, cap, and accessibility impact. Use mechanics that create new decisions before stat inflation.

### 3. Create the failure taxonomy

Classify failures:

- informed risk accepted;
- tactical execution error;
- strategic planning error;
- resource/economy collapse;
- content/seed pressure;
- audience-induced complication;
- agent timeout/fallback;
- unavoidable/invalid content defect;
- technical/integrity failure.

Technical/integrity failures never count as game losses. Unavoidable invalid-content failures are defects, not difficulty.

### 4. Design adaptive difficulty safely

Use only authoritative signals available to the policy: progress, recent damage/setback, resource state, repeated failure category, run age, novelty, and declared audience intensity. Define hysteresis, minimum dwell, per-axis change cap, cooldown, and event record.

Prefer choosing future eligible encounters/rewards/routes over changing already-resolved outcomes. Display or document adaptation when platform policy or viewer trust requires it.

### 5. Design recovery and anti-spiral rules

Options include earned shields, checkpoints, safer route choices, resource conversion, temporary retreat, bounded assist window, adaptive content eligibility, or audience vote. For each state activation, cost, cap, visibility, and interaction with records.

Test whether recovery creates a plausible comeback rather than inevitable victory or a prolonged doomed run.

### 6. Tune with seeded campaigns

Use stratified seeds representing feature bands and pathological cases. Run baseline, candidate, no-audience, typical-audience, burst-audience, provider-outage, fallback-AI, and maximum-progression scenarios.

Compare:

- distribution shift and confidence;
- failure-category mix;
- strategy/content diversity;
- long-tail duration;
- recovery success and repeat activation;
- difficulty spikes at milestones;
- performance and stuck rate;
- representative replays for causal quality.

Do not tune on production engagement data alone; investigate confounders such as stream schedule, title/thumbnail, outages, and layout changes.

### 7. Establish change controls

Every balance change records hypothesis, parameters, affected requirement, simulation corpus, expected distribution shift, guardrails, rollout percentage, rollback threshold, and replay compatibility. Use feature flags only with owner and expiry.

## Required Outputs

- target outcome/distribution table;
- difficulty-axis model and parameter bounds;
- failure taxonomy and technical-failure exclusions;
- progression-band challenge curve;
- adaptive-policy signals, eligibility, caps, cooldowns, and disclosure;
- recovery/comeback/anti-stall rules;
- seed corpus, sample-size/confidence method, scenarios, and metrics;
- representative replay review rubric;
- balance-change experiment, rollout, and rollback template;
- stop-ship thresholds and traceability to game phases.

## Review Gate

Pass only when:

- target distributions include tails and failure categories;
- identical corpus comparison shows the intended shift without unacceptable guardrail regression;
- technical failures and invalid content are excluded from legitimate losses;
- adaptive decisions are bounded, recorded, replayable, and cannot force outcomes;
- challenge expands across multiple axes and remains readable;
- comeback activation/cost/cap preserve uncertainty and records integrity;
- no-audience and provider-outage runs remain balanced enough to entertain;
- dominant strategies/content and pathological duration stay below declared limits;
- representative replays confirm failures feel causal rather than arbitrary;
- rollback conditions and prior compatible configuration are ready.

## Stop-Ship Failures

- manually set “fail once per hour” without rule-based causality;
- director secretly kills/rescues the agent;
- average win rate is the only metric;
- one fixed showcase seed;
- difficulty means only faster/more health;
- invalid generated level counted as a fair loss;
- repeated assist creates inevitable win;
- paid event guarantees terminal outcome;
- long-tail infinite/instant runs ignored;
- balance shipped without versioned corpus comparison.

## Handoffs

- `gameplay-progression`: loops, milestones, setbacks, records.
- `autonomous-agent-design`, `procedural-generation`, `game-physics`: capability and content/physical difficulty features.
- `viewer-retention`: dramatic pattern and pacing goals without outcome forcing.
- `game-economy-rewards` and `audience-interaction`: recovery/resources/effects.
- `game-analytics-experimentation` and `simulation-qa`: statistical design, campaigns, and regressions.
