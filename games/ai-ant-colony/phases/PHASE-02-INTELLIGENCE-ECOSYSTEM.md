# Phase 2 — Swarm Intelligence, Ecosystem and Progression

## Objective

Replace the minimal foundation policy with a bounded, explainable colony intelligence and a complete ecosystem loop that can produce credible growth, adaptation, defense, ascension and extinction across deterministic seed campaigns.

## Implemented scope

- Bounded ant observations containing only local legal neighbors, public colony pressure and immediate threats.
- Caste-aware utility policy for workers, scouts, nurses, diggers and soldiers.
- Pheromone-guided foraging, home return, alarm response and excavation.
- Stable action scoring, deterministic ties, per-decision evaluation caps and safe fallback.
- Two-cell oscillation detection, stale-goal invalidation and bounded stuck recovery.
- Strategic colony director with recovery, defense, brood-boom, expansion and foraging modes.
- Double-buffered integer pheromone diffusion, decay and source reinforcement.
- Logical-time day, season and weather progression with bounded moisture, water and food regrowth.
- Brood health, egg/larva/pupa stages, nurse support, food consumption and caste recruitment.
- Deterministic predator spawn, pathing through the entrance/tunnels, ant and queen attacks, alarm pressure, soldier combat and population caps.
- Progress bands, semantic milestones, legitimate ascension, extinction and stagnation.
- Stratified campaign reporting for strategy distribution, dramatic patterns, results, bounds, illegal actions and replay checksums.

## Verification evidence

Fresh local reference verification:

- strict TypeScript build: pass;
- Phase 1–2 Node tests: 16/16 pass;
- authoritative ambient nondeterminism scan: pass;
- 50-seed campaign: 21,162 authoritative ticks;
- results: 45 extinction, 5 ascension;
- invariant failures: 0;
- illegal actions: 0;
- dramatic pattern classes: 8;
- maximum population: 64 of configured cap 128;
- maximum simultaneous predators: 1;
- campaign rerun: byte-identical;
- 384-ant / 2,560-cell reference probe: p50 1.02 ms, p95 3.19 ms, p99 4.10 ms, max 9.81 ms;
- probe process maximum RSS: 73,524 KB.

Reference timings are development-container measurements, not production encoder or host claims.

## Review fixes completed

Two important behavior defects were found through new failing tests and fixed before exit:

1. Ants could alternate forever in a two-cell corridor because `lastCell` tracked the destination rather than the previous position. Movement history now detects immediate oscillation and the policy performs a bounded recovery.
2. Predators stopped permanently at the surface entrance. A deterministic bounded path search now advances them through valid tunnels toward the queen chamber.

## Exit verdict

**Software gate:** PASS for R2 gameplay candidate.  
**Open software P0:** 0.  
**Open software P1:** 0.  
**Production ready:** No.

Phase 3 must add the renderer-independent presentation contract, premium stream UI, accessible layouts, semantic camera/audio/captions, output-health classification and browser evidence without weakening simulation authority.
