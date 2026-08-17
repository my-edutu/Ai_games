# Phase 1 — Deterministic Foundation

**Target:** R1  
**Status:** Complete on the feature branch; R1 candidate evidence passed locally on 2026-08-17.  
**Exit rule:** Every criterion must have reproducible evidence plus separate specification and quality reviews.

## Acceptance criteria

- [x] Validated configuration and versioned serializable authoritative state.
- [x] Connected deterministic arena with 24 unique legal spawns and reachable loot.
- [x] Named RNG state, invariant catalogue and stable checksum.
- [x] Headless runtime shell, snapshot/restore and identical-seed replay tests.
- [x] 100-seed generation property campaign with zero invalid maps.

## Evidence

- `tsc -p tsconfig.json` — strict compilation passed.
- `node --test tests/foundation/battle-foundation.test.cjs` — 5/5 tests passed.
- 100 seeded arenas passed connectivity, reachability, unique-spawn, bounds and invariant checks.
- Same-seed and restored-continuation checksums matched.
- Authoritative source scan found no `Math.random`, wall-clock or timer use.

## Specification review

All five acceptance criteria are covered by executable tests or the deterministic scan. State, configuration, arena, RNG, event and snapshot contracts are versioned and serializable.

## Quality review

One P1 boundary defect was found: caller mutation of the configuration could alter authoritative state. A failing regression test reproduced the issue; the runtime now validates and owns a copy. No P0/P1 findings remain. The generator’s connectivity validation is intentionally cold-path work and completed the 100-seed corpus within the phase budget.
