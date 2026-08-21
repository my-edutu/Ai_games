# Game 4 — AI vs 1,000 Floors

AI vs 1,000 Floors is an autonomous deterministic tactical roguelite for long-running livestreams. Astra, a signal knight controlled by a bounded AI policy, climbs a living tower made of 1,000 compact tactical floors.

## Viewer promise

A viewer arriving mid-run can understand the objective immediately: the dominant HUD signal is `FLOOR n / 1000`; Astra's health, energy, current goal, danger, loadout and next audience window explain the immediate stakes.

## Technical identity

- fixed-step authoritative TypeScript simulation;
- named seeded random streams and exact replay checksums;
- constructive floor generation with reachability and spawn-safety validation;
- layered autonomous planner with deterministic fallback;
- immutable presentation snapshots and semantic audio cues;
- provider-neutral, idempotent and bounded audience influence;
- verified restore, quarantine, health probes and finite recovery;
- evidence-gated R-level readiness.

## Status

| Phase | Status | Highest truthful level |
|---|---|---|
| 1 — deterministic foundation | complete and reviewed | R1 |
| 2 — production AI/content | planned | not started |
| 3 — broadcast experience | planned | not started |
| 4 — audience interaction | planned | not started |
| 5 — reliability/operations | planned | not started |
| 6 — production validation | planned | not started |

The game is not yet production-ready. R5 always requires the exact deployed candidate to complete real provider verification, a real 72-hour endurance run, a real seven-day guarded canary and independent review.

## Phase 1 commands

```bash
npm run build
npm run test:floors:phase1
npm run floors:headless -- --seed=phase1-evidence --runs=3 --maxTicks=30000
```

## Module boundaries

`config` validates bounds; `state` owns serializable truth; `generation` constructs and validates floors; `ai` chooses legal actions; `rules` is the only gameplay mutation pipeline; `runtime` owns lifecycle; `persistence` verifies snapshots; `testing` produces reproducible corpus evidence. Later phases add `content`, `presentation`, `influence`, `operations` and `release` without weakening these boundaries.
