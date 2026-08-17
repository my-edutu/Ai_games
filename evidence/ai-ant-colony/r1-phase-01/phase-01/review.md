# AI Ant Colony Phase 1 Evidence Review

## Candidate scope

This evidence covers the deterministic Ant Colony foundation only: configuration, constructive generation, stable state schemas, fixed-step rules, foundation agent behavior, invariants, lifecycle, snapshots, restore and accelerated headless execution.

## Commands and results

```text
npm run build
PASS — TypeScript strict compilation

node --test tests/foundation/ant-colony-*.test.cjs
PASS — 7 tests, 0 failures

node scripts/run-ant-colony-headless.cjs 100 1000
PASS — 100 runs, 100,000 ticks, 0 invariant failures

cmp headless-corpus.json independent-rerun.json
PASS — byte-identical

grep authoritative directories for Math.random, Date.now, new Date, setTimeout, setInterval
PASS — no matches
```

## Corpus summary

- Runs: 100
- Authoritative ticks: 100,000
- Invariant failures: 0
- Maximum population observed: 61
- Maximum food store observed: 249
- Distinct final checksums: 100/100
- First reference run: 22.24 seconds; 94,984 KB maximum RSS
- Independent rerun: 14.28 seconds; 96,236 KB maximum RSS

## Review findings

A foundation review identified and fixed one important boundary defect before exit: tile code `surface` initially made every row above ground walkable. A failing regression now proves movement is constrained to the configured ground row and invariants reject ants placed in air.

No open P0 or P1 software findings remain within Phase 1 scope.

## Honest boundary

The current agent is intentionally minimal. Phase 1 does not claim complete swarm intelligence, predators, weather pressure, premium stream UI, audience providers, durable production persistence, operational recovery, soak, canary or R5 production readiness.
