# Phase 4 — Audience Interaction and Chat vs AI

**Phase status:** Not started  
**Readiness target:** R3 interaction candidate  
**Viewer-visible outcome:** Viewers can vote, trigger eligible bounded effects, and compete against the autonomous snake through a clear Chat vs AI loop while every event remains moderated, idempotent, replayable, fair, and visibly consequential.

## Objective

Connect the shared audience gateway and Event Director to Snake’s effect catalogue, build complete vote and acknowledgement experiences, prove provider-neutral delivery and failure handling, and validate that the game remains entertaining with zero or maximum allowed audience pressure.

## In Scope

- provider-neutral normalized audience contracts and faithful YouTube/Twitch fixtures;
- authentication/replay/idempotency integration boundaries;
- privacy-safe identity and entitlement bands;
- fixed-option votes and deterministic tally/ties;
- launch effect catalogue from `VIEWER_INTERACTION.md`;
- placement candidates/eligibility, cooldowns, conflicts, caps, queues, expiry, reversal, and record categories;
- Chat vs AI pressure rounds;
- moderation/rate-limit/sanction/public-text constraints;
- HUD/audio/VFX for preview, vote, result, queued/applied/rejected/degraded states;
- interaction audit, telemetry, operator test controls, and replay;
- provider/moderation/entitlement/audit outage degradation;
- sandbox/production-equivalent provider verification plan.

## Explicit Non-Scope

Unrestricted free-text commands, direct winner selection, wagering/cash prizes, guaranteed paid outcomes, final production launch, and permanent unbounded account progression.

## Requirements Addressed

All `FR-SNK-INT-*`, audience-facing progression/presentation requirements, provider/security/privacy/moderation requirements, and the interaction portions of operations and production readiness.

## Workstreams

### 1. Gateway and Provider Adapters

Implement or integrate the normalized `AudienceInput` path, provider fixture suites, signature/authentication interface, dedupe, timestamp/replay windows, identity tokenization, entitlement normalization, rate limits, reconnect/backoff, and privacy-safe audit correlation. No provider SDK type enters the game package.

### 2. Snake Effect Catalogue

Implement typed definitions and pure eligibility for bonus food, safe hint, shield token, speed shift, fog field, obstacle choice, portal pulse, food choice, theme vote, and next challenge. Generate valid placement/choice candidates before exposing options. Define record impact and reversal for each effect.

### 3. Event Director Integration

Use game signals, effect budgets, recent history, lifecycle, cooldowns, conflicts, visual/audio density, AI recovery, and provider/audit health to choose safe windows. Record candidate exclusions, selection, queue/apply tick, and reason codes. No director action may rewrite a resolved result.

### 4. Votes and Chat vs AI

Implement authoritative windows, fixed options, identity/weight policy, capped entitlements, deterministic dedupe and ties, late/reconnect behavior, result scheduling, pressure budget, consequence visibility, and cooldown. Chat vs AI records/configuration remain distinct.

### 5. Moderation and Public Acknowledgement

Apply sanctions, fixed-token validation, safe display names, text omission/generic fallback, bounded cards, public/operator reason separation, provider/moderation outage policy, and emergency interaction/public-text disable. Payment support never bypasses moderation or eligibility.

### 6. Durability, Idempotency, Reversal, and Replay

Define when authoritative paid-eligible effects require durable decision state before public confirmation. Ensure retries, crashes, restore, reconnect, and duplicate callbacks return the original decision and never apply twice. Reversal appends a new event and follows effect-specific policy without erasing history or invisibly rewinding completed gameplay.

### 7. Interaction UX

Build contextual vote previews, plain-language effect bounds, countdown, status, aggregate tally, result, telegraph, application, AI intent change, consequence highlight, acknowledgement, and degraded/no-effect fallback. Critical collision/result remains the highest priority.

### 8. Balance and Abuse Campaigns

Run no-audience, typical, maximum allowed pressure, burst, conflicting effects, bot/brigade, provider outage, moderation/audit outage, reversal, and long-run interaction scenarios. Measure progress/outcome shifts, stacking, AI recovery, consequence latency, queues, duplicate application, fairness, accessibility, and performance.

## Test-First Sequence

- provider envelope normalization and forged/replayed/duplicate rejection;
- identity/entitlement/privacy/redaction;
- each effect’s eligibility and invalid placement/pathology fixtures;
- cooldown/conflict/cap/queue/expiry/cancellation/reversal;
- vote window/tally/tie/late/reconnect determinism;
- crash/restore/retry idempotency across gateway and simulation;
- moderation/rate/sanction/public-text behavior;
- Chat vs AI pressure and prohibited-terminal assertions;
- HUD/audio/VFX priority and mobile comprehension;
- burst/load/queue/memory performance;
- no-provider full-run continuity and provider recovery.

## Acceptance Criteria

- [ ] Every authoritative interaction is traceable from verified normalized input to one scheduled command and one result.
- [ ] Duplicate application remains zero across retry, reconnect, crash, restore, and reversal tests.
- [ ] All launch effects satisfy bounds, safe placement, cooldown, conflict, cap, expiry, record, and replay requirements.
- [ ] No paid or free effect can guarantee victory, death, record, or an unavoidable immediate collision.
- [ ] Vote cutoff, tie, weighting, late arrival, and reconnect outcomes are deterministic and disclosed.
- [ ] Moderation, identity, entitlement, audit, provider, and queue failures degrade according to policy.
- [ ] Public text/names are sanitized, bounded, optional, and privacy-safe.
- [ ] Consequences are visible before another competing major interaction window.
- [ ] The game remains complete and balanced enough with all interactions disabled.
- [ ] Maximum allowed Chat vs AI pressure remains within tick, AI, visual, audio, and balance guardrails.
- [ ] Spec, safety, and quality reviews have no P0/P1 finding.

## Evidence Bundle

Include provider fixtures, authentication/idempotency traces, effect matrix, vote/replay fixtures, moderation/adversarial corpus, reversal results, no-audience and pressure campaign reports, interaction videos, accessibility/performance evidence, security/privacy review, and specialist reviews under `phase-04/`.

## Rollback and Emergency Disable

Every provider, effect, paid-eligible class, public-text feature, and Chat vs AI mode has an independently audited disable switch. Rollback may preserve autonomous play while disabling interactions. Incompatible influence schemas require existing queued events to expire/reject safely; they cannot be coerced into the new schema.

## Exit and Handoff

Phase 4 exits at R3 only when sandbox/faithful provider paths and complete game consequences pass. Phase 5 makes the entire channel durably persistent, observable, automatically recoverable, and operable under realistic failures.
