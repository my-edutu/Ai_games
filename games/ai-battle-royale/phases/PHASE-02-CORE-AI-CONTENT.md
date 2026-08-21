# Phase 2 — Autonomous Combat, AI and Progression

**Target:** R2 gameplay  
**Status:** Complete on the feature branch; R2 gameplay candidate evidence passed locally on 2026-08-17.  
**Exit rule:** Every criterion must have reproducible evidence plus separate specification and quality reviews.

## Acceptance criteria

- [x] Four archetypes choose only validated bounded actions.
- [x] Simultaneous combat, deterministic movement conflicts, cover, loot and supplies.
- [x] Declared shrinking-zone and no-progress escalation.
- [x] Causal terminal results, intermission and automated continuation contract.
- [x] Seeded campaigns record balance tails and no illegal actions.

## Evidence

- Strict TypeScript compilation passed.
- Phase 1 + Phase 2 suites: 14/14 tests passed.
- Same-seed full matches and snapshot continuations match checksums.
- 100 default-seed matches: 100 terminal, 0 integrity failures, 0 technical results, 97 last-standing wins and 3 draws.
- Archetype wins: Vanguard 16, Ranger 31, Scavenger 31, Tactician 19.
- Run ticks: minimum 56, average 137, maximum 424 under the default configuration.
- Authoritative nondeterminism scan passed.

## Specification review

The action boundary, bounded pathfinding, simultaneous combat, movement conflict rotation, loot/supply rules, zone escalation, causal terminal results and automatic lifecycle transition all have executable coverage. No remote inference or presentation dependency enters authority.

## Quality review

Three important issues were challenged and closed:

1. Short-corpus results hid default-profile archetype imbalance. A deterministic 40-seed guardrail was added before tuning visible stats and policy priorities. The 100-seed distribution now keeps all archetypes viable.
2. Multi-attacker kill attribution initially favored stable ID order. A failing focus-fire regression now requires attribution to the highest declared simultaneous damage, with proportional actual-damage accounting.
3. Direct combat/movement fixtures initially placed agents without clearing generated obstacles. Fixtures now preserve valid geometry.

No P0/P1 findings remain. Phase 3 may consume only semantic events and immutable snapshots; it cannot own rules.
