---
name: audience-interaction
description: Use when designing or reviewing chat commands, votes, gifts, memberships, redemptions, viewer-triggered events, Chat vs AI, provider adapters, effect eligibility, cooldowns, idempotency, acknowledgements, or monetization-safe influence
---

# Audience Interaction

## Overview

Let viewers matter without letting provider quirks, abuse, duplicate callbacks, or spending destroy gameplay truth. The core principle is **normalize first, decide eligibility inside the game, schedule one bounded effect, and make the consequence visible**.

## Scope

Use for YouTube/Twitch inputs, chat decisions, votes, gifts, memberships, redemptions, operator events, Chat vs AI, effect catalogues, acknowledgement, reversals, and provider degradation. It does not set moderation policy alone or permit guaranteed outcomes.

## Non-Negotiable Invariants

- Provider payloads never enter game modules directly.
- Payment/gift/membership is entitlement evidence, not an authoritative command.
- Every input is authenticated where applicable, normalized, schema-validated, rate-limited, moderated, idempotent, and audited.
- The game owns state eligibility; the Event Director owns pacing/cooldown/conflict scheduling.
- Paid and free interactions pass through the same safety, legality, and integrity layer.
- Effects have disclosed bounds, caps, expiry, queue, conflict, reversal, and replay representation.
- No purchase guarantees a winner, loss, prize, cash-equivalent result, or secret probability change.
- Duplicate, delayed, reordered, retried, disconnected, and reversed provider events cannot duplicate or corrupt effects.
- The game remains entertaining and continues autonomously when audience services are unavailable.

## Workflow

### 1. Define viewer roles and desired agency

Choose roles such as supporter, challenger, strategist, spectator-voter, team member, historian, or cosmetic patron. State what viewers can influence and what remains beyond their control.

Do not begin from provider event types. Begin from meaningful game decisions that fit the fantasy.

### 2. Design the effect catalogue

For each effect specify:

- stable ID and plain-language display;
- free, paid-eligible, membership, redemption, operator, or scheduled source;
- authoritative, vote/choice, cosmetic, informational, or presentation-only class;
- parameters and disclosed minimum/maximum consequence;
- eligibility predicate;
- danger/progress/novelty budget;
- cooldown, conflict group, per-viewer/per-run/global cap;
- immediate, queued, next-safe-window, or next-run application;
- expiry and cancellation;
- reversal/refund handling;
- acknowledgement copy keys;
- replay command representation;
- accessibility/moderation/security requirements;
- required tests and telemetry.

Prefer choices and trade-offs over raw power.

### 3. Normalize provider inputs

Adapters verify signatures/authenticated connections, deduplicate provider IDs, tokenize identity, sanitize display metadata, and emit the shared `AudienceInput`. Game code never sees raw payment data, emails, tokens, or provider-specific callbacks.

Provider differences remain in adapter configuration and entitlement mapping.

### 4. Process eligibility in ordered stages

1. authentication and replay protection;
2. schema and payload limits;
3. identity and entitlement;
4. regional/platform policy;
5. moderation;
6. per-user/effect/channel/global rate limits;
7. idempotency lookup;
8. game-state eligibility;
9. Event Director cooldown/conflict/pacing budget;
10. schedule and durable acknowledgement.

Every rejection has a stable reason code and safe user-facing message.

### 5. Design votes and collective choices

Specify window start/end in authoritative logical terms, eligible options, identity policy, one-person/entitlement weighting, update cadence, privacy, tie-break using named randomness or a fixed rule, quorum if any, late/reconnect handling, and command scheduling.

Show consequence before opening another competing vote. Never parse arbitrary free text into unrestricted game commands.

### 6. Handle paid-eligible interactions

Disclose what is purchased: an eligible effect, queue position, cosmetic acknowledgement, or bounded voting weight—not a guaranteed outcome. Define duplicate callback, pending payment, failure, reversal, chargeback, provider correction, and effect-unavailable behaviour.

If an authoritative effect cannot be safely durably audited, reject/defer it rather than applying and hoping persistence recovers.

### 7. Present acknowledgement lifecycle

Public states include received, validating, accepted, queued, applied, rejected, expired, cancelled, and reversed. Keep acknowledgements bounded and lower priority than critical gameplay. Sanitized names may appear only according to privacy/moderation policy.

### 8. Test provider degradation and abuse

Cover reconnect storms, duplicate delivery, out-of-order delivery, stale events, burst traffic, bot brigades, many gifts at once, conflicting effects, queue overflow, moderation outage, entitlement outage, database lag, refund/reversal, malicious text, provider API limits, and full outage.

## Required Outputs

- viewer-role and agency model;
- complete effect catalogue;
- provider adapter and normalized envelope map;
- ordered eligibility pipeline and reason codes;
- vote/tally/tie-break/window contract;
- paid-influence disclosure and reversal policy;
- rate-limit, cooldown, cap, conflict, queue, expiry, and overflow tables;
- public acknowledgement state machine;
- provider degradation and autonomous fallback plan;
- audit, telemetry, privacy, moderation, and test matrix;
- Chat vs AI policy showing powers the audience can never receive.

## Review Gate

Pass only when:

- identical provider events apply at most once across retries/reconnects;
- every authoritative effect is eligible, scheduled, recorded, replayable, and auditable;
- provider-specific data is absent from game state and render snapshots;
- paid/free interactions share safety and cannot guarantee results;
- vote windows/ties/late arrivals produce deterministic outcomes;
- moderation, identity, entitlement, and persistence outages have explicit safe behaviour;
- burst/conflict/overflow tests preserve tick and presentation budgets;
- consequence is visible and acknowledged accurately;
- privacy-safe data minimization and retention are explicit;
- autonomous gameplay remains complete with interactions disabled.

## Stop-Ship Failures

- payment webhook changes health/score directly;
- arbitrary chat strings execute commands;
- duplicate gift applies twice;
- high payment bypasses cooldown/moderation;
- effect chooses a guaranteed winner or loss;
- votes use unsynchronized wall-clock with ambiguous cutoff;
- raw display text reaches overlays;
- queue grows without bound;
- reversal deletes history or leaves no audit;
- provider outage stops or invalidates the game.

## Handoffs

- `game-architecture`, `deterministic-simulation`: normalized contracts, scheduling, replay.
- `gameplay-progression`, `viewer-retention`, `difficulty-failure-balancing`: meaningful eligible effects and pacing.
- `game-economy-rewards`: value, sinks, entitlements, and non-exploitability.
- `crowd-moderation`, `security-privacy`: identity, abuse, text, payment/provider trust.
- `livestream-hud`, `game-audio`, `game-feel-vfx`: decision and acknowledgement presentation.
- `long-running-reliability`, `simulation-qa`, `production-readiness-review`: outages, load, reversals, and evidence.
