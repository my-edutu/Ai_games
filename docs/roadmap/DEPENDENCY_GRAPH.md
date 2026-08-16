# Portfolio Dependency Graph

```text
Catalogue Standards and Contracts
  ├─ Simulation / RNG / Events / Replay
  │   └─ Autonomous Snake
  │       ├─ Audience / Presentation / Audio / Analytics / Recovery / Operator
  │       ├─ Marble Survival → deterministic tournament physics and camera
  │       └─ Maze Escape → content oracle and partial observation
  ├─ Marble Physics
  │   ├─ Infinite Tower → platform/combat physics, room streaming, builds
  │   │   └─ AI vs 1,000 Floors → persistent finite campaign and checkpoints
  │   └─ Battle Royale → many-agent combat, fairness and camera
  ├─ Maze Oracle / Symbolic State
  │   └─ AI Escape Room → puzzle solvers and model boundary
  ├─ Tower Combat / Builds + Maze Content
  │   └─ Endless Dungeon → RPG content and economy
  └─ Persistent Simulation Foundation
      ├─ Zombie Survival → base, economy and hordes
      ├─ Traffic Experiment → reconciled large-scale flow
      ├─ Ant Colony → swarm fields, tunnels and ecosystem
      └─ Tiny Civilization → hierarchical agents, economy, history and diplomacy
```

## Shared Package Maturity

A package moves through experimental → game-private → shared-candidate → shared-stable. Promotion requires two consumers or a strong platform reason, public contract tests, deterministic and version compatibility, performance and failure evidence, ownership, and migration and rollback policy. Avoid premature generic abstraction.

## Critical Path

Simulation, RNG, events and replay → Snake headless → Snake AI and content → presentation and audio → audience gateway and Event Director → persistence, recovery and operator control → Snake R5.

This is the first complete implementation path and the next execution target.
