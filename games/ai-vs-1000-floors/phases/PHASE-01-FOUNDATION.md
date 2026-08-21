# Phase 1 — Deterministic Headless Foundation

**Status:** COMPLETE — candidate review PASS / R1  
**Deterministic version:** `floors-r1-v1`

## Delivered

Validated configuration, serializable authority, named RNG, constructive floor generation, validator/repair, basic enemies/hazards/rewards, legal actions, fallback AI, ordered rules, 1,000-floor victory, defeat/timeout/stagnation, result/intermission/restart, ordered events, checksummed snapshot/restore, invariants, headless corpus and command.

## Acceptance evidence

- `npm run test:floors:phase1`: 16 passed, 0 failed;
- 128 generated seed/floor combinations valid;
- three full 1,000-floor evidence runs, 24,938 ticks;
- zero invariant, replay and generator failures;
- authoritative nondeterminism scan clean;
- candidate review fixed RNG continuity, enemy goal pathing and cross-run event-window defects;
- no open P0/P1.

## Deferred by design

Production content/planner and >10k ticks/s target: Phase 2. Character, UI, VFX, audio and browser output: Phase 3. Interaction: Phase 4. Durability/chaos: Phase 5. Exact release governance: Phase 6.
