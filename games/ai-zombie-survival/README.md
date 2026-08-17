# AI Zombie Survival — Last Light Protocol

Game 10 is an autonomous day/night survival simulation for continuous livestreaming. Four role-specialized survivors prepare a bounded refuge by day, defend it against deterministic escalating hordes by night, and automatically resolve, summarize, and restart each run.

## Primary progress

The stream’s primary progress unit is **Day**. Base integrity, survivors alive, horde remaining, resources, current strategy, and the next phase are secondary explanatory signals.

## Architecture

`ZombieRuntime` is the only gameplay authority. It advances at a fixed 10 Hz logical tick, uses named seeded random streams, emits append-only semantic events, and restores only from verified versioned snapshots. Provider, browser, audio, persistence and operator integrations never mutate game state directly.

## Phase status

| Phase | Target | Status |
|---|---|---|
| 1 — Deterministic Foundation | R1 | Complete — exact candidate `bd195967e2177ae9e7c57c7f70ad871e25f39177` |
| 2 — AI, Hordes, Economy, Progression | R2 gameplay | Complete — exact candidate `54aa4790ec6c7db364b615dbcf8f6c818e59bd91` |
| 3 — Broadcast Experience | R2 streamed | In implementation |
| 4 — Audience Interaction | R3 | Planned |
| 5 — Reliability and Operations | R4 | Planned |
| 6 — Production Validation | R5 candidate | Planned |

Phase 2 passed 281 catalogue-wide Node tests, 8 Chromium browser regressions, Zombie-inclusive authoritative nondeterminism scanning, deterministic AI/horde/economy/progression campaigns, construction and stuck-recovery regressions, and a fresh `zombie-v2` replay boundary.

The game is not production ready until the exact-candidate assessor returns `PASS / R5 / 100 / productionReady=true` with genuine provider, external review, real 72-hour endurance, witnessed drill and seven-day canary evidence.