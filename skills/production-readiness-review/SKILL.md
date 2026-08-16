---
name: production-readiness-review
description: Use when assessing whether a game, platform subsystem, release candidate, phase, or livestream channel is ready for staging, canary, unattended operation, launch, promotion, or rollback
---

# Production Readiness Review

## Overview

Independently decide whether evidence supports the claimed readiness level. The core principle is **evidence before status, with no implementer optimism substituted for demonstrated operation**.

## Scope

Use at phase exits, R-level promotion, material authoritative/provider/recovery changes, canary completion, and launch. The reviewer consumes specialist evidence and challenges gaps; it does not rewrite missing implementation into a passing verdict.

## Independence Rule

The final R5 reviewer must not be the sole implementer or author of the evidence under review. When native independent review is unavailable, record the result as `candidate review` and keep final verification pending.

## Non-Negotiable Invariants

- “Tests pass” is not synonymous with production-ready.
- Every MUST requirement and stop-ship risk maps to reproducible evidence.
- Technical failures are not hidden as game losses or omitted from product metrics.
- Determinism, integrity, recovery, idempotency, safety, privacy, accessibility, audio, output, resource stability, and rollback are first-class gates.
- P0 and P1 findings cannot be risk-accepted.
- A P2 waiver requires bounded impact, mitigation, monitoring, owner, deadline, and safe disable/rollback.
- Required soak/canary clocks reset after material changes defined by the readiness standard.
- Provider/platform claims are verified against the current production configuration.
- Public status and business language must match the achieved readiness level.
- Missing, stale, incomparable, or unverifiable evidence fails the affected gate.

## Workflow

### 1. Establish review identity and scope

Record candidate commit/deployment, game/platform/config/content/schema versions, environment, channel, reference hardware, provider adapters, feature flags, review date, claimed readiness level, included/excluded changes, and reviewer roles.

Reject a moving target. Material changes after evidence collection require impact analysis and rerun.

### 2. Validate traceability

For every product and non-functional MUST:

- source requirement;
- owning phase;
- implementation reference;
- test/evidence artefact;
- result and date;
- version/environment;
- reviewer conclusion.

Sample source events, screenshots, profiles, logs, and runbooks rather than trusting summary tables alone.

### 3. Review gates in risk order

1. security/privacy/platform-policy blockers;
2. deterministic integrity, events, snapshots, restore, records;
3. autonomous fallback and invalid action handling;
4. paid/free interaction, moderation, idempotency, reversal;
5. crash/output/audio/provider recovery;
6. resource stability and capacity;
7. gameplay quality, balance, procedural validity, repetition;
8. broadcast readability, accessibility, audio/visual quality;
9. observability, ownership, runbooks, rollout/rollback;
10. product metrics and business operations.

A critical early failure stops promotion but review may continue to collect a complete remediation list.

### 4. Challenge evidence quality

Ask:

- Does it run production rules and representative configurations?
- Is the seed/event corpus stratified and versioned?
- Are tails and failure categories visible?
- Are commands, hardware, dates, artefact checksums, and expected thresholds recorded?
- Did the test actually inject the failure or only mock a response?
- Did restore compare checksums?
- Did captures traverse the actual streaming chain?
- Are provider duplicates/reconnect/reversal real or faithful contract fixtures?
- Did the soak include restarts, interactions, snapshots, scene changes, and progression?
- Is evidence independent from the metric/dashboard it is validating?

### 5. Run stop-ship review

Confirm absence of:

- hidden forced outcomes or guaranteed paid wins/losses;
- remote model required for continuity;
- ambient authoritative randomness or replay divergence;
- invalid content counted as fair loss;
- secrets/private data/public debug exposure;
- unsanitized audience text;
- duplicate paid effects;
- unbounded memory/queues/resources;
- crash loop, silent corruption, black/frozen/silent output without recovery;
- inaccessible critical information;
- unlicensed assets;
- missing operator owner/runbook/rollback.

### 6. Verify operational readiness

Observe dashboard/alerts and execute runbook drills for interaction disable, provider outage, renderer/audio restart, snapshot restore, safe intermission, fresh run, credential revocation, configuration/content rollback, previous deployment rollback, and emergency halt.

Confirm on-call/contact ownership and escalation during production windows.

### 7. Decide and document

Verdicts:

- `PASS`: all applicable gates pass; promote to claimed level.
- `CONDITIONAL PASS`: allowed only below R5 or for P2 operational constraints with exact monitored conditions; does not permit “production-ready” language unless R5 criteria still fully pass.
- `FAIL`: one or more load-bearing gaps.
- `BLOCKED`: external evidence/access required and no safe substitute exists.

List findings by severity, evidence, violated requirement, remediation, owner, retest, and status. State the highest truthful readiness level.

## Required Outputs

- signed/versioned review manifest;
- requirement traceability and evidence coverage matrix;
- gate-by-gate findings and stop-ship check;
- evidence-quality and staleness assessment;
- risk register and waiver record;
- operations/runbook/ownership/rollback drill record;
- verdict, truthful status wording, promotion/rollback action, and retest scope;
- residual monitoring plan and next mandatory review trigger.

## Review Gate

This skill is applied correctly only when:

- reviewer independence/status is honest;
- candidate versions are frozen and evidence matches them;
- every applicable catalogue gate is explicitly pass/fail, not omitted;
- summaries are sampled against primary artefacts;
- P0/P1 findings block promotion;
- P2 waivers meet all acceptance conditions;
- 72-hour soak/seven-day canary and rollback drill are verified for R5;
- current provider, security/privacy, moderation, accessibility, audio, and output evidence exists;
- operations ownership and emergency actions are demonstrated;
- final public status uses the exact readiness language allowed by the standard.

## Stop-Ship Review Errors

- implementer self-certifies R5 without independent review;
- green CI accepted instead of soak/canary;
- screenshots replace functional accessibility/output tests;
- “monitor after launch” accepts integrity/security/recovery defect;
- stale evidence from a previous deterministic/provider/config version;
- average performance accepted despite failing p99/memory slope;
- provider sandbox success assumed equivalent to production callbacks;
- rollback plan not rehearsed;
- P1 relabelled P2 to ship;
- missing evidence treated as no finding.

## Handoffs

- all specialist skills provide their evidence and stop-ship criteria.
- `simulation-qa`: traceability and reproducibility.
- `long-running-reliability` and `performance-optimization`: soak, chaos, capacity, output, rollback.
- `security-privacy`, `crowd-moderation`, `audience-interaction`: safety, provider, payment, and platform-policy evidence.
- `game-analytics-experimentation`: data quality and success/guardrail interpretation.
