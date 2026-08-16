# Phase 6 — Production Validation, Canary, and Launch

**Phase status:** Not started  
**Readiness target:** R5 production ready  
**Viewer-visible outcome:** Autonomous Snake operates continuously on a real canary channel with validated providers, stable resources, safe audience influence, automatic recovery, complete operations, and evidence-backed gameplay quality before broader promotion.

## Objective

Freeze a release candidate, close all requirement traceability, run the full statistical, accessibility, performance, security, moderation, provider, soak, chaos, rollback, and operational programme, complete a seven-day canary, and permit production-ready status only after independent review.

## Entry Preconditions

- Phases 1–5 are complete with current-version evidence;
- no P0/P1 finding is open;
- production environment, channel, provider credentials, domains/certificates, storage, observability, on-call ownership, content/assets, licences, privacy notices, platform configuration, and emergency controls are ready;
- last compatible deployment/config/content and fresh-run rollback boundary are identified;
- candidate commit and all versions are frozen.

## In Scope

- complete requirement-to-evidence traceability and documentation reconciliation;
- final stratified headless campaign and balance/AI/content report;
- production-reference performance/capacity and resource profiles;
- current YouTube/Twitch production-equivalent authentication, duplicate, reconnect, rate, reversal, and outage verification;
- full moderation, security, privacy, accessibility, audio/visual, asset/licence, and platform-policy review;
- 72-hour production-candidate soak with normal interactions, snapshots, restarts, and chaos schedule;
- launch, incident, credential-revocation, safe-intermission, fresh-run, and rollback drills;
- seven-day limited production canary with explicit promotion/rollback thresholds;
- independent production-readiness review;
- release notes, operational handoff, content/experiment guardrails, and post-launch monitoring.

## Explicit Non-Scope

New mechanics, new effects, large balance experiments, architecture refactors, schema migrations without necessity, or cosmetic expansion during candidate freeze. Material changes return to the owning phase and reset affected evidence.

## Workstreams

### 1. Freeze and Traceability

Create the release manifest with source commit, deployment, platform/game/config/content/deterministic/snapshot/event/provider/asset versions, reference hardware, feature flags, owners, and rollback. Verify every MUST requirement maps to current implementation and evidence. Correct documentation discrepancies before testing.

### 2. Final Simulation and Balance Evidence

Run the approved seed/event matrix at the declared sample size. Validate run duration, progress, outcomes, terminal causes, milestones, records, dramatic patterns, strategy/content diversity, AI budgets/fallback/stuck, generator validity/fallback, no-audience and maximum interaction pressure, and pathological tails. Review representative median/tail/anomaly replays.

### 3. Performance and Capacity

Profile maximum approved board/occupancy, worst pathfinding/generation, peak VFX/audio/HUD, audience bursts, persistence snapshots, restore/replay, and operator events on production-reference hosts. Confirm p99/worst headroom and bounded resource slopes.

### 4. Safety, Policy, and Experience

Complete threat model/data inventory, secret/role/provider tests, moderation adversarial corpus, payment/entitlement/reversal audit, privacy retention/deletion/access, dependency/content/asset licence scans, mobile comprehension, color-safe/reduced-motion/flash/captions/muted-audio, loudness/true peak, clean feed, and public-data exposure review.

### 5. 72-Hour Candidate Soak

Run the frozen candidate continuously with scheduled ordinary/peak interactions, provider reconnects, snapshots, result/restart cycles, scene/theme changes, quality transitions, component restarts, and bounded chaos injections. No unexplained monotonic resource growth, duplicate effect, replay divergence, unresolved output failure, or manual common recovery is allowed.

### 6. Operational Drills

Rehearse and record:

- provider/moderation/entitlement/audit outage;
- interaction/public-text emergency disable;
- simulation/renderer/audio/gateway/persistence failure;
- black/frozen/wrong-scene/silent output;
- verified snapshot restore and older-snapshot fallback;
- deliberate divergence quarantine and fresh run;
- credential rotation/revocation;
- configuration/content and full deployment rollback;
- emergency safe intermission and halt;
- alert acknowledgement, escalation, incident evidence, and communications.

### 7. Seven-Day Canary

Launch to a limited real channel/audience and monitor gameplay, integrity, interactions, provider behavior, output, resource slopes, recovery, accessibility complaints, moderation, records, and support. Promotion and automatic/manual rollback thresholds are fixed before start. Material candidate changes restart the affected canary clock.

### 8. Independent Review and Promotion

An independent reviewer samples primary evidence, verifies current versions, challenges tails/restore/provider/rollback, classifies findings, and states the highest truthful readiness level. Only `PASS` permits R5 and broader rollout.

## Acceptance Criteria

- [ ] The release manifest and traceability matrix cover every current MUST requirement and artefact checksum.
- [ ] Final simulation distributions, confidence intervals, tails, replays, and balance decisions pass approved targets.
- [ ] Deterministic replay, snapshot restore, record reconciliation, and idempotency remain exact under candidate versions.
- [ ] Current provider/authentication/reconnect/duplicate/reversal/outage paths pass in production-equivalent conditions.
- [ ] Security, privacy, moderation, platform policy, accessibility, audiovisual, asset, and supply-chain reviews have no blocking finding.
- [ ] Production-reference tick, AI, render, audio, snapshot, restore, queue, and resource budgets pass with headroom.
- [ ] The 72-hour frozen-candidate soak completes with bounded resources and all scheduled recovery checks.
- [ ] Every mandatory runbook, rollback, credential, safe-scene, and emergency drill succeeds and has an assigned owner.
- [ ] The seven-day canary remains within all promotion guardrails or is rolled back according to plan.
- [ ] No P0/P1 finding remains; any accepted P2 meets the catalogue waiver rules.
- [ ] Independent production-readiness review returns `PASS` for R5.
- [ ] Public/repository/dashboard status is updated to “production ready” only after that verdict.

## Canary Rollback Triggers

Immediate rollback, interaction disable, or safe halt as appropriate for replay divergence, duplicate paid-eligible effect, secret/private exposure, unauthorized control, unsafe moderation failure, unbounded resource growth, repeated crash loop, failed restore, persistent black/frozen/silent output, incompatible record corruption, platform-policy breach, or any P0/P1 finding. Quantitative performance/error-budget thresholds are recorded in the release manifest.

## Evidence Bundle

The final R5 bundle contains manifest and traceability, complete tests, seed/event corpora, statistical reports, representative replays, profiles/capacity, 72-hour soak/chaos timeline, canary dashboards and incidents, provider/moderation/payment evidence, accessibility/audiovisual captures, security/privacy/supply-chain reports, runbooks/drills, rollout/rollback artefacts, release notes, risk register, and independent verdict.

## Launch and Post-Launch

Promote gradually, preserve the canary, monitor guardrails, review records and effect outcomes, and run scheduled replay/resource/provider checks. Product experiments require predeclared hypotheses and cannot weaken integrity, fairness, accessibility, moderation, security, or recovery. Any material change re-enters the Ralph loop at the first affected phase criterion.

## Exit

Phase 6 is complete only at R5. Autonomous Snake then becomes the reference implementation whose proven shared packages are reused by the remaining catalogue games; it does not make those games production-ready automatically.
