# Phase 1 — Deterministic Foundation

## Objective

Establish one replayable authoritative simulation capable of generating a valid colony, advancing fixed steps, applying legal ant actions, detecting integrity violations, snapshotting/restoring exactly, producing game results and restarting without human intervention.

## Implemented scope

- Strict versioned configuration with bounded dimensions, resources, populations, durations and pheromone values.
- Constructive seeded world generation with a guaranteed entrance-to-queen-chamber route, nest chambers, resource patches, rock and water layers.
- Stable queen, ant and brood entity IDs with explicit castes and bounded state.
- Fixed-step ordered foraging, food return, controlled excavation, energy, brood progression, colony strategy and milestone rules.
- Surface-ground boundary that prevents authoritative ants from occupying cosmetic air cells.
- Named seeded RNG streams and canonical state checksums.
- State invariants covering arrays, coordinates, entity IDs, tile legality, resources, lifecycle and queue bounds.
- Checksummed runtime snapshots with compatibility, corruption and invariant validation.
- Result, intermission and deterministic fresh-run lifecycle.
- Reproducible accelerated headless corpus and explicit game-versus-technical integrity semantics.

## Verification evidence

Fresh local reference verification on Node 22.16.0 and TypeScript 5.8.3:

- strict TypeScript build: pass;
- 7/7 focused foundation tests: pass;
- deterministic twin run: 300 matched checkpoints;
- uninterrupted versus restored run: 180 matched post-snapshot steps;
- corrupted snapshot: rejected;
- automatic result/intermission/restart: pass;
- 100-seed / 100,000-tick corpus: zero invariant failures;
- corpus rerun: byte-identical;
- 100 distinct final state checksums across 100 seeds;
- authoritative ambient nondeterminism scan: pass;
- first corpus reference: 22.24 seconds, 94,984 KB maximum RSS;
- independent rerun reference: 14.28 seconds, 96,236 KB maximum RSS.

The timings are development-container reference measurements, not production hardware claims.

## Exit verdict

**Software gate:** PASS for R1 deterministic foundation.  
**Open software P0:** 0.  
**Open software P1:** 0.  
**Production ready:** No.

Phase 2 must replace the minimal foundation policy with bounded pheromone-guided swarm intelligence, full ecosystem pressure, brood economy, predators, progression campaigns and declared performance distributions.
