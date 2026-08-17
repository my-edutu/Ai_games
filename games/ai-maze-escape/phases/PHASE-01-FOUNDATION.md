# Phase 1 — Deterministic Maze Foundation

**Target:** R1 headless prototype  
**Software status:** Complete

## Delivered

- versioned bounded Maze configuration;
- integer grid/graph authority and stable rule ordering;
- named seeded random streams;
- deterministic tree, loops, chambers, layers, and hunter topology profiles;
- connectedness checks, exact start-to-exit solution oracle, bounded generation and deterministic fallback;
- legal movement, wall rejection, start/exit, typed result, result/intermission/restart lifecycle;
- checksums, event sequence, snapshots, corruption/version rejection, exact restore and replay;
- deterministic headless runner and baseline evidence.

## Acceptance evidence

- [x] Every generated fixture has a validated solution and bounded generation.
- [x] Full headless runs escape or produce a typed result and automatically restart.
- [x] Identical version/config/seed/input produces identical state and event checksums.
- [x] Corrupt and unsupported snapshots fail safely.
- [x] The solution oracle is isolated from normal AI/public state.
- [x] Baseline generation, tick, memory and throughput checks pass.

Phase evidence: `evidence/ai-maze-escape/r1-phase-01/phase-01/`.

## Exit

R1 is complete. Later phases retain all Phase 1 regression tests and may not update golden evidence to hide incompatibility or divergence.
