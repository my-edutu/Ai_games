# AI Zombie Survival — Last Light Protocol

Game 10 is an autonomous day/night survival simulation designed for continuous livestreaming. Four role-specialized survivors prepare a bounded refuge by day, defend it against deterministic escalating hordes by night, and automatically resolve, summarize, and restart each run.

## Primary progress

The primary progress unit is **Day**. Base integrity, survivors alive, horde remaining, resources, current strategy, audience pressure, and the next phase are secondary explanatory signals.

## Authority model

`ZombieRuntime` is the only gameplay authority. It advances on a fixed logical tick, uses named seeded random streams, emits append-only semantic events, and restores only from verified versioned snapshots. Browser, audio, provider, moderation, persistence, and operator integrations never mutate game state directly.

## Phase status

| Phase | Target | Software status |
|---|---|---|
| 1 — Deterministic Foundation | R1 | Complete |
| 2 — AI, Hordes, Economy, Progression | R2 gameplay | Complete |
| 3 — Broadcast Experience | R2 streamed | Complete; verified through Node, stream-host, and Chromium contracts |
| 4 — Audience Interaction | R3 | Complete; deterministic, bounded, privacy-safe, and exactly-once |
| 5 — Reliability and Operations | R4 | Complete; durable recovery, fencing, supervision, chaos, and runbook gates |
| 6 — Production Validation | R5 software gate | Software complete; truthful readiness remains **R4 / BLOCKED_EXTERNAL** |

## Commands

```bash
npm run test:zombie:all
npm run zombie:stream:self-test
npm run zombie:headless
npm run zombie:phase5:chaos
CANDIDATE_SOURCE_SHA=<40-character-git-sha> npm run zombie:phase6:validate
```

The stream source is served by `npm run zombie:stream`; the unified Playwright suite starts it on port `4177` to avoid collisions with Snake (`4173`), Maze (`4174`), Ant Colony (`4175`), and Infinite Tower (`4176`).

## Production boundary

Green CI establishes software evidence, not R5. Production readiness additionally requires current credentialed YouTube/Twitch evidence, production-reference capacity and audiovisual evidence, external security/privacy/moderation/accessibility/licensing/supply-chain attestations, independently witnessed drills, a real 72-hour endurance run, a clean seven-real-day canary, and an independent signed exact-candidate review. Missing evidence must return `BLOCKED_EXTERNAL` and `productionReady=false`.
