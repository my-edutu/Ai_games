# Phase 2 — Core AI, Hordes, Economy and Progression

**Target:** R2 gameplay vertical slice  
**Software status:** Complete  
**Verified source:** `54aa4790ec6c7db364b615dbcf8f6c818e59bd91`  
**Workflow:** Autonomous Games CI run `32039259064`  
**Closed:** 2026-08-17

## Delivered

- hidden-information-safe survivor observations with fog-limited zombie visibility;
- deterministic role-specialized Scout, Builder, Medic and Guard utility policies;
- team strategies for balanced preparation, fortification, stockpiling, rescue and last stand;
- bounded horde scheduling, Walker/Runner/Brute composition, stable IDs and gate spawning;
- deterministic movement, combat, ammunition, damage, defense breach, core damage and causal terminal outcomes;
- scavenging, carrying, delivery, food/power upkeep, starvation, healing, repair and multi-level perimeter construction;
- deterministic weather, daily progression, evacuation, automatic continuation and technical-outcome separation;
- stuck/no-route accumulation, deterministic alternate-position recovery and reset after successful movement;
- fresh `zombie-v2` deterministic/snapshot compatibility boundary for material rule changes;
- stratified Phase 2 campaigns and long bounded execution tests.

## Acceptance evidence

- [x] Survivor observations omit unspawned horde truth and provider/renderer state.
- [x] Every selected action is legal, bounded, serializable and deterministic.
- [x] Four survivor roles perform materially different useful work.
- [x] Hordes, combat, resources, healing, repair, construction and upkeep remain within declared caps.
- [x] Technical and quarantined outcomes never count as fair gameplay losses.
- [x] Builder construction, stuck-loop recovery and successful-movement reset pass focused regressions.
- [x] `zombie-v1` evidence is rejected after the Phase 2 rules boundary moves to `zombie-v2`.
- [x] Full catalogue tests and browser regressions pass with Zombie authority included in nondeterminism scanning.

## Verification

- Node: 281 passed, 0 failed, 0 skipped.
- Zombie Phase 2 focused tests: 16 passed, 0 failed.
- Browser regression: 8 passed.
- CI job, stream regressions, release-evidence regressions and artifact uploads: pass.
- Open implementation P0/P1 after review: zero.

## Exit

`PASS / R2 gameplay`. Phase 3 may begin. Every Phase 1 and Phase 2 test remains a permanent regression gate.