---
name: game-economy-rewards
description: Use when designing or reviewing resources, rewards, upgrades, loot, currencies, shops, unlocks, persistent value, entitlements, gift-linked effects, sinks, inflation, exploits, or progression economies
---

# Game Economy and Rewards

## Overview

Create resources and rewards that generate meaningful trade-offs, support long-term variety, and remain fair under autonomous and audience-influenced play. The core principle is **every source creates a decision, every sink preserves value, and no entitlement guarantees the outcome**.

## Scope

Use for in-run resources, upgrades, loot, shops, unlocks, persistent collections, achievements, audience-linked entitlements, and economy telemetry. It does not set provider pricing or legal terms; it defines game-side value and integrity.

## Non-Negotiable Invariants

- Every authoritative resource has a stable unit, source, sink, cap/growth rule, owner, and event trail.
- Resources cannot be created or destroyed by presentation/provider callbacks.
- Paid entitlements grant only disclosed bounded eligibility or cosmetics; they never guarantee victory, survival, winner selection, prizes, or cash-equivalent returns.
- Persistent power is capped and cannot make new runs predetermined.
- The economy remains functional when audience spending is zero.
- Duplicate, delayed, reversed, or replayed provider events cannot duplicate value.
- Sources and sinks are balanced as distributions across seeds and strategies.
- Inflation, hoarding, starvation, runaway compounding, negative balances, overflow, and exploit loops are tested.
- Long-term ledgers and inventories are bounded, archived, or aggregated.

## Workflow

### 1. Define the economy’s purpose

For each resource state which decision it creates: safety versus speed, upgrade versus reserve, exploration versus progress, offence versus defence, short-term survival versus long-term growth, or audience choice versus AI autonomy.

Remove currencies that exist only because games “usually have coins.”

### 2. Specify the ledger

Document:

- stable resource ID and unit;
- scope: entity, team, run, season, channel, or account;
- authoritative owner and schema;
- sources and exact triggering events;
- sinks and exact consuming commands;
- balance range, cap, floor, precision, and overflow;
- transfer/trade/decay rules;
- reset, checkpoint, restore, and migration behaviour;
- public visibility;
- analytics and reconciliation.

Use append-only transactions or events sufficient to rebuild balances.

### 3. Design source and sink loops

Every common source needs recurring value-preserving sinks. Classify:

- deterministic earned sources;
- risk/reward sources;
- milestone/boss sources;
- audience-influenced sources;
- catch-up/recovery sources;
- cosmetic/meta sources.

Classify sinks by tactical choice, maintenance, upgrade, reroll, unlock, recovery, entry, cosmetic, or irreversible commitment. Avoid mandatory spending disguised as a choice.

### 4. Build reward grammar

Rewards may provide:

- immediate capability;
- strategic option;
- information;
- checkpoint/protection;
- temporary modifier;
- content/theme unlock;
- record/achievement identity;
- cosmetic spectacle.

Define rarity weights, pity/bad-luck protection only when transparent and replayable, duplicate handling, choice count, inventory pressure, and synergy caps. Random rewards use named streams and recorded tables/versions.

### 5. Control compounding

Model additive, multiplicative, exponential, and feedback-loop effects. Set caps, diminishing returns, mutually exclusive groups, duration, stacking order, and reset. Simulate extreme combinations and long runs.

For persistent worlds, use taxes, upkeep, attrition, succession, ageing, storage loss, maintenance, scarcity cycles, or era resets only when they create understandable decisions rather than arbitrary punishment.

### 6. Integrate audience entitlements safely

Map provider entitlement bands to a catalogue of eligible effects, vote weights, cosmetics, or queue privileges under the audience-interaction policy. Record entitlement evidence, idempotency, policy version, expiry, reversal, and acknowledgement.

Never convert exact monetary amount directly into unbounded authoritative power.

### 7. Simulate the economy

Across declared seed/strategy/event scenarios measure:

- source/sink rates and net flow;
- balance/inventory distributions over time;
- purchase/upgrade choice frequency;
- starvation and hoarding;
- compounding and cap saturation;
- reward diversity and duplicate frustration;
- effect of zero, typical, burst, and adversarial audience activity;
- comeback strength and runaway leader rate;
- run duration/win rate by economy path;
- persistent state growth and migration.

### 8. Detect and respond to exploits

Threat-model duplication, rollback/replay, race conditions, integer overflow, negative spend, stale price, double claim, provider retry, reversal after use, bot farming, circular trades, guaranteed loops, and configuration mismatch. Define reconciliation and quarantine rather than silent balance edits.

## Required Outputs

- economy purpose and resource inventory;
- authoritative ledger and transaction schemas;
- source/sink diagrams with rate targets;
- reward/rarity/choice/duplicate grammar;
- stacking, cap, decay, reset, and persistence rules;
- upgrade/shop/loot tables with versioning;
- audience entitlement mapping and non-guarantee disclosures;
- exploit/threat catalogue and reconciliation policy;
- seeded simulation scenarios, metrics, thresholds, and representative replays;
- telemetry, operator controls, migration, rollback, and evidence plan.

## Review Gate

Pass only when:

- every balance rebuilds from authoritative events;
- duplicate/reversed inputs cannot create permanent duplicate value;
- the game remains viable and entertaining with no paid activity;
- persistent/meta power remains bounded and does not predetermine runs;
- source/sink distributions avoid sustained unintended inflation or starvation;
- extreme combinations respect caps and cannot overflow or create infinite loops;
- audience entitlements have disclosed bounded effects and shared safety checks;
- reward diversity and choice remain meaningful across long campaigns;
- live state and ledgers meet retention/resource budgets;
- economy configuration changes are versioned, testable, and rollback-safe.

## Stop-Ship Failures

- exact donation amount maps linearly to unlimited power;
- balance stored only as mutable total with no auditable events;
- reward callback fires before idempotency/durability;
- multiplicative modifiers have no stacking order/cap;
- persistent upgrades make loss nearly impossible;
- zero-audience run cannot progress;
- arbitrary inflation fixed by hidden balance deletion;
- negative price/balance or integer overflow untested;
- chargeback/reversal has no policy;
- every historical transaction retained forever in hot memory.

## Handoffs

- `gameplay-progression` and `difficulty-failure-balancing`: role, pacing, comeback, target distributions.
- `audience-interaction` and `crowd-moderation`: entitlement, idempotency, abuse, disclosure.
- `deterministic-simulation` and `game-architecture`: ledger, ordering, snapshots, replay.
- `game-analytics-experimentation` and `simulation-qa`: economy simulation and experiment guardrails.
- `security-privacy` and `production-readiness-review`: fraud, payment data boundary, audit, policy evidence.
