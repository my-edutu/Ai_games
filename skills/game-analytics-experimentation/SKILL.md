---
name: game-analytics-experimentation
description: Use when defining or reviewing gameplay metrics, retention measures, event taxonomies, records, dashboards, balance analyses, experiments, cohorts, statistical confidence, privacy-safe telemetry, or decision criteria
---

# Game Analytics and Experimentation

## Overview

Turn authoritative events and broadcast signals into trustworthy decisions about comprehension, balance, novelty, interaction, reliability, and business performance. The core principle is **define the decision first, measure from stable events, and protect conclusions with statistical and ethical guardrails**.

## Scope

Use for event taxonomy, metrics, records, dashboards, simulation analysis, livestream/product experiments, and evidence. It does not authorize collecting unnecessary viewer data or optimizing hidden outcome manipulation.

## Non-Negotiable Invariants

- Every metric has a decision, definition, population, window, source event, exclusions, owner, and guardrail.
- Authoritative gameplay metrics derive from versioned events/results, not presentation impressions alone.
- Technical failures, quarantined runs, test runs, bots, and provider outages are classified rather than silently counted as normal gameplay.
- Metrics avoid unbounded cardinality and sensitive/raw viewer data.
- Experiments declare hypothesis, variants, unit, allocation, sample size, duration, guardrails, stop rule, analysis, and rollback before launch.
- Balance conclusions use identical seed/event corpora or control for content/config/version differences.
- Correlation is not presented as causation; external stream factors are noted.
- Revenue/retention goals cannot override fairness, accessibility, moderation, security, policy, or deterministic truth.
- Records are deterministic projections with reconciliation and version semantics.

## Workflow

### 1. Start from decisions

For each question state the action that changes based on the answer. Examples:

- Are new viewers understanding the objective?
- Are runs too long at high progression?
- Which failure categories are unfair defects?
- Is one generated pattern or strategy dominating?
- Do viewers see the consequence of a vote?
- Is audio/VFX density harming comprehension?
- Is provider degradation affecting participation?

Delete telemetry with no credible decision or operational obligation.

### 2. Define the event taxonomy

Use stable semantic events with game/platform/version/run/tick/sequence/correlation context. Separate:

- authoritative gameplay;
- audience input/decision/application;
- presentation/audio;
- operational/recovery;
- moderation/security;
- experiment exposure;
- aggregate viewer/channel outcomes.

Document schema, required fields, privacy class, retention, sampling, dedupe, late-arrival, and migration.

### 3. Write metric contracts

For every metric specify:

- name and plain-language meaning;
- numerator/denominator or calculation;
- unit and direction;
- eligible population and exclusions;
- time/run/session window;
- segmentation dimensions with bounded cardinality;
- source events and required versions;
- freshness/latency;
- expected range and alert/decision threshold;
- limitations/confounders;
- dashboard and owner.

Use percentiles, distributions, rates, and confidence intervals where averages hide tails.

### 4. Measure autonomous-game quality

Catalogue metrics include:

- run duration/progress/win/loss/draw/abort/quarantine;
- failure reason and recovery;
- milestone/record frequency;
- meaningful-event interval;
- dramatic-pattern and strategy/content diversity;
- stuck/loop/fallback/decision-budget rate;
- procedural validity/fallback/features;
- influence requested/accepted/queued/applied/rejected/expired/reversed;
- vote consequence visibility;
- tick/frame/audio/output/recovery health;
- resource slope and queue limits;
- ten-second comprehension and mobile-legibility review scores.

### 5. Design simulation analyses

Declare seed sampling/stratification, configurations, event scenarios, run count or sequential stopping, confidence method, multiple-comparison handling, effect size, tail/pathology criteria, and representative replay selection.

Store versioned manifests and machine-readable results. Never compare candidate and baseline on unrelated seed corpora.

### 6. Design live experiments responsibly

Choose unit—run, channel time block, viewer, or stream session—while avoiding contamination. Record exposure only after the variant is actually delivered. Use feature flags with owner/expiry and preserve deterministic run configuration.

Guardrails include integrity, crash/recovery, performance, accessibility, moderation, provider errors, paid-effect fairness, and viewer complaints, not only watch time/revenue.

### 7. Interpret and decide

Check data quality, sample ratio, missing/late events, novelty effects, seasonality, stream title/thumbnail/schedule, outages, version drift, and practical effect size. Combine aggregates with representative replays and qualitative comprehension review.

Document decision, uncertainty, rejected interpretations, rollout/rollback, and follow-up measurement.

### 8. Protect privacy and operations

Use tokenized identities only when needed, aggregate early, avoid raw chat/payment, enforce retention/deletion, and restrict dashboards. Metrics labels use bounded enums rather than run/user/text values.

## Required Outputs

- decision/question inventory;
- event taxonomy and schema registry;
- metric dictionary with contracts;
- records/projection/reconciliation specification;
- gameplay, interaction, broadcast, reliability, and business dashboard plan;
- simulation analysis protocol and manifest;
- experiment design template with guardrails and rollback;
- data-quality checks, exclusions, and version handling;
- privacy/retention/access/cardinality plan;
- decision report template and evidence links.

## Review Gate

Pass only when:

- every metric maps to a decision and versioned source events;
- technical/quarantined/test/provider-degraded cases are correctly classified;
- distributions and tails support balance/reliability claims;
- simulation comparisons share the same stratified corpus;
- experiments have valid unit/allocation/exposure, adequate power or justified sequential method, and guardrails;
- no dashboard exposes unnecessary identities/raw text/payment data;
- cardinality and telemetry volume meet budgets;
- records reconcile from authoritative events;
- conclusions state uncertainty/confounders and include replay review;
- launch/rollback decisions are predeclared and auditable.

## Stop-Ship Failures

- “engagement” metric with no definition;
- average run length hides infinite tail;
- crash counted as loss;
- different seeds/configs compared as variants;
- experiment starts before exposure logging/rollback;
- optimize revenue while fairness/complaints regress;
- run ID or user ID used as metric label;
- raw chat/payment stored for hypothetical analysis;
- p-value alone with no effect size/guardrails;
- dashboard becomes source of truth instead of authoritative events.

## Handoffs

- all game/system skills: event and evidence definitions.
- `difficulty-failure-balancing`, `viewer-retention`, `game-economy-rewards`: target metrics and experiments.
- `simulation-qa`: seed campaigns and data-quality validation.
- `security-privacy`, `crowd-moderation`: collection, identity, retention, access.
- `long-running-reliability`, `production-readiness-review`: operational dashboards and evidence manifests.
