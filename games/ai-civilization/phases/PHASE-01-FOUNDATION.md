# Phase 1 — Deterministic Headless Foundation

**Status:** Complete  
**Readiness achieved:** R1 headless prototype  
**Deterministic version:** `civilization-r1-v1`

## Delivered

Phase 1 establishes one authoritative fixed-day kingdom simulation with a validated configuration, bounded 12×8 default world, deterministic procedural generation, founding dynasty and rival cast, resource economy, population cohorts, legal-action policy, terminal results, lifecycle/intermission/restart, semantic events, checksummed snapshots, verified restore, production-rule headless execution, and invariant/property coverage.

The simulation remains provider-, renderer-, audio-, wall-clock-, and model-independent. All gameplay randomness is owned by named seeded streams supplied through the shared `NamedRng` package.

## Viewer-visible headless loop

A new dynasty starts from a camp, gathers and consumes resources, builds farms and infrastructure, expands population and housing, researches, manages food pressure, advances through civilization tiers, reaches a causal result, enters intermission, and restarts from a deterministic successor seed without operator input.

## Test-first evidence

The foundation suites were first run before the Game 5 modules existed and failed with missing-module errors. The minimum authority was then implemented and reviewed. A restore review identified that the restored state retained a separately deserialized configuration object rather than the validated frozen runtime configuration. A focused test was added, observed failing, and the restore path was fixed to rebind the validated configuration before runtime ownership.

Final focused evidence:

- 10 passing foundation, property, replay, snapshot, and headless tests;
- 500 deterministic generated-world seeds with zero invalid topology/resource/capital/rival results;
- 10,000 production-rule authoritative steps with zero illegal selected actions or invariant failures;
- uninterrupted and restored runs produce equal state checksums and named RNG snapshots;
- corrupt and unsupported snapshots reject with typed failures;
- authoritative ambient-nondeterminism scan is clean.

## Representative run

Seed `phase1-review` completed 1,200 game days at the configured era boundary:

- result: `era-timeout`;
- tier: City;
- renown: 879;
- population: 64;
- stability: 100;
- integrity failures: 0;
- event sequence: 3,646;
- final checksum: `88fd5ce9`.

This result is a causal scored resolution, not a technical failure.

## Review decision

### Specification review

**PASS.** One authoritative owner, serializable versioned state, fixed logical time, named streams, validated legal actions, bounded collections, semantic events, checksum material, restore validation, and technical/game outcome separation are present.

### Engineering and simulation-quality review

**PASS AFTER FIX.** The configuration ownership issue found during restore review is corrected and regression-protected. No open P0 or P1 finding remains for the R1 scope.

### Deferred by design

Advanced buildings, full succession, diplomacy, crises, conflict, Great Works, premium presentation, semantic audio output, audience interaction, production durability, operator controls, real soak/canary, and R5 evidence belong to later phases.

## Handoff to Phase 2

Phase 2 may extend the authoritative schema and deterministic version to add complete civilization depth, but must preserve one rule implementation, legal policy boundaries, replayable outcomes, bounded live history, and validated restore. Any intentional replay change requires an explicit deterministic-version increment and full regression campaign.