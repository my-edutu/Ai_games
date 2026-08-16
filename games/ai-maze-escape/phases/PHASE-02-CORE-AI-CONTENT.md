# Phase 2 — Partial-Observation AI, Threats, and Progression

**Target:** R2 gameplay vertical slice  
**Software status:** Complete and repository-CI verified  
**Verified implementation head:** `ae01d676e2feb4a7d3501a1c522e429a423fe0c3`  
**Verification workflow:** GitHub Actions `31974631975`

## Outcome

AI Maze Escape now plays autonomously from permitted observations. It reveals local passages, updates a bounded ageing belief graph, selects reachable frontiers, collects keys before opening dependent doors, avoids known traps, reacts to visible threats, revises repeated routes and reaches the exit without remote services or hidden-map access.

## Implemented

- radius-limited visibility and remembered public knowledge;
- bounded belief cells, doors, keys, threats, confidence and frontier sets;
- known-map BFS with locked-edge, trap and inventory constraints;
- nearest-frontier exploration and loop-aware route revision;
- constructive key/door dependency chains;
- clues, checkpoints and non-critical telegraphed traps;
- deterministic threat spawn, patrol and visible-threat evasion;
- typed key collection, door opening, trap death and capture outcomes;
- invalid-content technical quarantine rather than false game loss;
- stratified deterministic campaigns across all five launch profiles;
- public observations and AI explanations that exclude oracle data.

## Verified Campaign

Reference command:

```bash
npm run maze:campaign -- phase2-proof
```

Result:

```text
runs: 25
escapes: 24
game failures: 1
technical outcomes: 0
invalid content: 0
hidden-information violations: 0
campaign checksum: 545a5ec1
```

Observed dramatic patterns:

- deep-map discovery;
- dependency breakthrough;
- efficient solve;
- threat-driven escape;
- threat near-failure;
- wrong-turn recovery.

## Acceptance

- [x] Hidden truth is absent from observations and public AI intent.
- [x] Decision search and belief collections remain bounded.
- [x] Locks, keys, traps and threats remain constructively solvable and fair.
- [x] Contradicted plans and repeated routes recover without teleport or remote dependency.
- [x] At least three dramatic patterns and diverse topology/route outcomes are demonstrated.
- [x] Invalid content and technical failures never count as fair losses.
- [x] Deterministic replay, campaigns and the complete repository workflow pass.

## Exit

Phase 2 is complete. Phase 3 owns public render snapshots, mobile-first broadcast composition, audio/captions, replay and safe output recovery. Rollback remains versioned by policy/generator/content identity and may require a fresh-run boundary.
