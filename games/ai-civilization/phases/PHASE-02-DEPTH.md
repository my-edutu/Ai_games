# Phase 2 — Autonomous Civilization Depth

## Objective

Turn the deterministic Phase 1 settlement into a bounded civilization simulation with meaningful growth, dynasties, diplomacy, conflict, crises, and multi-run quality evidence.

## Implemented contracts

- Tier-gated building catalogue with terrain, resource, worker, uniqueness, and count preconditions.
- Daily production, consumption, construction, upkeep, trade, spoilage, and history ledgers.
- Housing-capped cohort population with bounded seasonal birth, migration, health, and death changes.
- Diminishing repetitive renown, seven settlement tiers, and three Great Work paths.
- Deterministic ruler ageing, succession, unique dynasty identities, and bounded reign compaction.
- Three rival realms with limited strength bands, treaties, trade, aid, hostility, war, and causal losses.
- Authored crises with warnings, response choices, recovery payment, conflict-group cooldowns, and no hidden terminal result.
- Bounded ruler-trait utility, public plan-change explanations, and semantic character expression.
- Deterministic campaign reporting for outcomes, goals, tiers, succession, crises, Great Works, dramatic patterns, checksum uniqueness, throughput, and tick latency.

## Acceptance evidence

- 24 foundation/Phase 2 tests pass; 0 fail.
- 500 generated worlds and 10,000 production-rule steps remain valid.
- 144 campaign seeds across five declared scenarios have zero invalid world, action, or invariant result.
- Two terminal reasons and at least five strategic goals exist across the corpus.
- Throughput is above 2,000 game-days/second in every scenario.
- p99 tick latency is below 8 ms in every measured scenario.
- Separate specification and engineering/gameplay reviews pass after all P1 remediation.

## Readiness boundary

Phase 2 is R2. Phase 3 presentation, Phase 4 audience safety, Phase 5 durability/operations, and Phase 6 release governance remain required. R5 is not claimed.
