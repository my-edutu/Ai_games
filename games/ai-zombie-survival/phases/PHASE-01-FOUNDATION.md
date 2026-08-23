# Phase 1 — Deterministic Zombie Foundation

**Target:** R1 headless prototype  
**Software status:** Complete  
**Verified source:** `bd195967e2177ae9e7c57c7f70ad871e25f39177`  
**Workflow:** Autonomous Games CI run `32035008182`  
**Closed:** 2026-08-17

## Delivered

- versioned bounded configuration and fixed 10 Hz logical time;
- constructive grid refuge, four gates, five reachable resources, bounded obstacle placement, validation and deterministic fallback;
- stable survivor/world state, lifecycle, semantic event sequence, causal result/intermission and automatic restart;
- named seeded streams, canonical state checksums and cosmetic-stream isolation;
- complete snapshot envelope integrity, checksum/invariant/version/event-continuity validation and exact restore;
- production-rules headless runner, deterministic campaign runner and stable game manifest;
- focused native Node coverage across generation, lifecycle, replay, restore, corruption, tampering, invariants and bounded retention.

## Verification

| Gate | Evidence | Result |
|---|---|---|
| Strict TypeScript build | `npm test` in CI run `32035008182` | Pass |
| Catalogue-wide Node suite | 266 passed, 0 failed, 0 skipped | Pass |
| Zombie Phase 1 focused suite | 13 passed, 0 failed | Pass |
| Browser regression suite | 8 Chromium tests passed | Pass |
| World/property corpus | 32 generated world fixtures plus 100 campaign seeds | Pass |
| Replay determinism | 100 seeds, zero divergence | Pass |
| Snapshot integrity | payload, RNG, envelope, events and sequence tampering rejected | Pass |
| Ambient nondeterminism | authoritative scan clean | Pass |
| Tick budget sample | 20,000 ticks: p95 0.026 ms, p99 0.050 ms, worst 3.506 ms | Pass |
| Retention bounds | event history remained below configured 2,000 limit | Pass |
| Specification review | no missing R1 requirement | Pass |
| Quality review | snapshot integrity finding fixed test-first; no open P0/P1 | Pass |

## Phase decision

`PASS / R1`. Phase 2 may begin. Phase 1 evidence remains a permanent regression gate and any material deterministic, state-schema, generator or snapshot change must rerun this corpus.