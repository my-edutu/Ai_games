# Phase 1 — Deterministic Maze Foundation

**Target:** R1 headless prototype  
**Software status:** Complete and repository-CI verified  
**Verified implementation head:** `7b88e816777dc044f9d498bf2a3f7fad80247b15`  
**Verification workflow:** GitHub Actions `31974122058`

## Outcome

AI Maze Escape now generates deterministic connected mazes, validates an exact start-to-exit solution, executes an explicit complete-information test policy, resolves typed terminals, snapshots/restores complete authority and automatically advances through result, intermission and restart.

## Implemented

- versioned Maze contracts and bounded configuration;
- named-stream randomized DFS generation;
- tree, loops, chambers, layers and hunter topology profiles;
- symmetric-passage and connectedness validation;
- deterministic BFS oracle isolated from the normal production policy;
- bounded repair attempts and deterministic known-good fallback;
- atomic movement and wall rejection;
- typed escape, timer and stagnation results;
- canonical final checksums and ordered semantic events;
- complete state, RNG and pending-event snapshot/restore;
- typed corrupt and unsupported snapshot rejection;
- deterministic headless runner and automatic restart.

## Verification

Focused local Phase 1 suite:

```text
9 tests
9 passed
0 failed
```

Reference headless run, repeated twice:

```json
{"seed":"phase1-proof","steps":34,"ticks":34,"result":"escape","finalChecksum":"511bde2d","eventChecksum":"3a770e37"}
```

Both outputs were byte-identical. The exact pushed candidate then passed every step in the full repository workflow, including the existing Snake regression, stream self-test, nondeterminism gate, chaos/release validation, Chromium checks and artifact uploads.

## Acceptance

- [x] Every generated fixture has a validated solution and bounded generation.
- [x] Full headless runs escape or produce typed non-game failure and restart.
- [x] Identical inputs/checkpoints/results match checksums.
- [x] Corrupt/unsupported snapshots fail safely.
- [x] Oracle is isolated behind validation/testing interfaces.
- [x] Baseline generation/tick/memory/throughput evidence and clean reviews exist.

## Exit

Phase 1 is complete. Phase 2 owns production partial-observation intelligence, dependencies, hazards, threats and progression; the oracle test policy is not a production movement policy.
