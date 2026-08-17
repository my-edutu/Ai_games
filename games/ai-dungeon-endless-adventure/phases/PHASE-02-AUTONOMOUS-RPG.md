# Phase 2 — Autonomous RPG, Combat, Economy and Progression

## Exit gate

Phase 2 adds a bounded partial-observation policy, deterministic encounter population, five distinct standard enemy behaviours, chapter bosses, causal integer combat, visible telegraphs, auditable gold/XP rewards, capped relic builds, chapter choices and automatic deep-floor progression.

## Review and correction loop

The first broad campaign exposed excessive fallback loops: all 50 runs timed out and the worst run used 1,817 fallbacks. Investigation found that frontier selection preferred a Manhattan-near cell that could be disconnected inside Astra's known map. The policy now performs bounded breadth-first search and selects only reachable frontiers. A regression fixture preserves the failing seed.

Two architecture findings were also closed before promotion:

- The rule reducer no longer attaches an RNG handle to serializable authority; RNG is passed explicitly through function boundaries.
- The AI policy is a pure proposal function. Runtime authority applies its bounded public goal, intent, confidence, plan reason and counters.

## Verification

- Strict TypeScript build: passed.
- Phase 1 and Phase 2 focused suites: 18 passed, 0 failed.
- Authoritative nondeterminism/schema scan: passed; no ambient randomness, wall-clock authority or hidden `_rng` state.
- Deterministic replay: paired runs match checksums.
- 50-seed, 12,000-tick campaign: 50/50 cleared a floor, 50/50 reached a boss, 338 bosses defeated, 6 legitimate terminals, minimum floor 5, median floor 35, maximum floor 35 and maximum fallback count 16.

## Readiness

R2 software gate passed with zero open P0/P1 gameplay or architecture findings. Broadcast UI/audio, audience interaction, durability, operations and production evidence remain out of scope for this phase.