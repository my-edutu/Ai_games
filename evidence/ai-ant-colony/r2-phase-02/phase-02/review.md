# AI Ant Colony Phase 2 Evidence Review

## Candidate scope

This review covers colony strategy, caste policies, bounded observations, pheromone fields, stuck recovery, brood, weather, food regrowth, predators, progression, result balance and campaign performance.

## Fresh verification

```text
npm run build
PASS

node --test tests/foundation/ant-colony-*.test.cjs tests/phase2/ant-colony-*.test.cjs
PASS — 16 tests, 0 failures

grep authoritative directories for ambient random/time/timers
PASS — no matches

node scripts/run-ant-colony-campaign.cjs 50 1200
PASS — deterministic campaign, zero invariant or illegal-action failures
```

## Campaign results

- Runs: 50
- Authoritative ticks: 21,162
- Ascension: 5
- Extinction: 45
- Invariant failures: 0
- Illegal actions: 0
- Maximum population: 64 / 128 configured cap
- Maximum predators: 1
- Maximum brood: 5
- Distinct dramatic pattern classes: 8
- Byte-identical rerun: pass

Observed patterns were brood emergence, colony defense, excavation waves, harvest chains, population milestones, predator crises, strategic adaptation and weather shifts.

## Performance reference

A 384-ant, 64 x 40 world completed 220 measured ticks with p50 1.02 ms, p95 3.19 ms, p99 4.10 ms, max 9.81 ms and maximum process RSS 73,524 KB. This satisfies the Phase 2 software reference budget; it does not substitute for production-reference endurance or broadcast-chain measurements.

## Findings and dispositions

- **Important — oscillation recovery ineffective:** fixed with previous-cell semantics and a regression test.
- **Important — predators stalled at entrance:** fixed with bounded deterministic tunnel pathing and a regression test.
- **Minor — brood-boom was not naturally selected in the reference campaign:** retained as a reachable tested strategy; the selected stress profile correctly prioritizes defense and recovery.

No P0/P1 findings remain within Phase 2 scope.
