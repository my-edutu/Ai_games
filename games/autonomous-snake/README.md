# Autonomous Snake — Survival Intelligence

**Status:** Approved documentation; implementation not started  
**Slug:** `autonomous-snake`  
**Primary record:** Maximum verified length / board occupancy  
**Stream premise:** An autonomous snake tries to consume the board without trapping itself while the environment and audience steadily increase the pressure.

## Viewer Hook

A viewer should understand the stream immediately: the snake gets longer, space becomes scarcer, the next food or hazard matters, and one wrong route can end a record run. The permanent headline is:

> **HOW MUCH OF THE BOARD CAN THE AI CONQUER?**

## Core Run

1. Generate a deterministic board, food rules, theme, and challenge profile.
2. The AI plans a safe route to food while preserving future movement space.
3. Eating increases length, score, occupancy, speed pressure, and milestone difficulty.
4. Hazards, obstacles, special food, environmental phases, and eligible audience effects create strategic change.
5. The AI wins a configured conquest objective, loses through a rule-based collision/trap/starvation condition, or enters a new endless cycle.
6. The result, decisive replay, record, and audience contribution appear.
7. A new seed starts automatically.

## Distinctive Identity

Snake is the catalogue’s reference game: one protagonist, one immediately legible goal, deterministic grid rules, rich pathfinding, satisfying occupancy progress, and the simplest full proof of the shared platform. It should feel elegant and intelligent rather than noisy or arcade-random.

## Audience Interaction

Eligible examples include:

- vote for the next board modifier;
- reveal one safe-route hint to the AI;
- spawn bounded bonus food;
- add a disclosed obstacle at a validated safe location;
- temporary fog, speed, shield, magnet, or hazard modifier;
- choose the next visual theme or challenge lane;
- Chat vs AI complication round.

No event may place an unavoidable collision, guarantee survival, select a terminal outcome, or mutate the snake outside the validated influence catalogue.

## Documentation

- [Product Requirements](./PRD.md)
- [Game Design](./GAME_DESIGN.md)
- [Autonomous AI](./AI_SYSTEM.md)
- [Viewer Interaction](./VIEWER_INTERACTION.md)
- [Audio and Visual Direction](./AUDIO_VISUAL.md)
- [Technical Architecture](./TECHNICAL_ARCHITECTURE.md)
- [Testing Strategy](./TESTING_STRATEGY.md)
- [Production Readiness](./PRODUCTION_READINESS.md)
- [Implementation Phases](./phases/)

## Target Package Boundaries

```text
games/autonomous-snake/
├── src/rules
├── src/ai
├── src/generation
├── src/presentation
├── src/config
├── src/testing
└── docs represented by this directory
```

Shared simulation, audience, event-director, presentation, audio, analytics, persistence, recovery, and operator capabilities remain under `packages/` and `apps/`.

## Readiness Path

- Phase 1: deterministic headless Snake
- Phase 2: survival-grade autonomous AI and progression
- Phase 3: premium broadcast presentation and audio
- Phase 4: safe audience interaction and Chat vs AI
- Phase 5: persistence, records, recovery, and operator controls
- Phase 6: statistical balancing, soak, canary, and production launch

A phase is complete only when its evidence bundle passes both specification and quality review.
