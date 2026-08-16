# Portfolio Roadmap

## Strategy

Build one production-grade reference stack and reuse it incrementally. Do not start twelve codebases in parallel. Each game enters implementation only when the shared dependencies it needs are stable enough and its predecessor has produced reusable runtime evidence.

## Release Waves

### Wave 0 — Catalogue Foundation

Complete architecture, skills, platform subsystem designs, twelve game packages, six phase plans per game, policy, roadmap and review. Exit: documentation complete; implementation not started.

### Wave 1 — Reference and Participation

1. Autonomous Snake Phases 1–6.
2. Marble Survival Phases 1–6, reusing simulation, replay, audience, presentation, audio, analytics, recovery and operator packages while extending deterministic physics, tournament and camera systems.

Exit: two R5 channels, one optimization title and one high-participation tournament.

### Wave 2 — Exploration and Vertical Progression

3. AI Maze Escape.
4. Infinite Tower.
5. AI vs 1,000 Floors.

Exit: validated procedural oracles, partial observation, action physics, builds, floor streaming and long campaign persistence.

### Wave 3 — Competitive and Reasoning

6. AI Battle Royale.
7. AI Escape Room.
8. Endless AI Dungeon.

Exit: many-agent fair combat, bounded model-assisted reasoning, RPG economy and content, and rich viewer choices.

### Wave 4 — Persistent Worlds

9. AI Zombie Survival.
10. AI Traffic Experiment.
11. AI Ant Colony.
12. Tiny AI Civilization.

Exit: base survival and hordes, city-scale reconciled flows, swarm and ecosystem fields, and full hierarchical social simulation.

## Parallel Work Policy

Parallelize only independent workstreams with stable contracts: assets and themes, provider fixtures, dashboards, content authoring, QA corpora and documentation. Never implement multiple authoritative engines or change shared contracts concurrently without explicit compatibility ownership.

## Portfolio Gates

- A shared package is reusable only after contract, replay, performance and failure evidence in a real game.
- Each new game contributes a missing shared capability rather than forking the platform.
- Platform changes trigger affected game replay and compatibility tests.
- No game inherits another game’s balance, accessibility, provider, soak or canary sign-off.
- Portfolio scheduling follows production capacity and incident load; unattended channels need operational ownership before another channel launches.
