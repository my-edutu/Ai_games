# Arena System

## Authoritative generation

Five seeded round archetypes are preserved: `seeding-sprint`, `gate-gauntlet`, `hazard-circuit`, `final-four`, and `championship`. Each arena carries bounded dimensions, deterministic spawn points, checkpoints, two declared safe lanes, obstacles, bumpers, hazards, wind zones, sweepers and feature-budget metadata.

`validateMarbleArena` rejects or repairs invalid world bounds, spawn count/overlap, finish ordering, collider/contact budgets, blocked safe lanes and out-of-bounds geometry. Invalid procedural output falls back to a known-good deterministic arena rather than silently running impossible content.

## 2.5D presentation

The renderer maps authoritative plan geometry into a segmented elevated track. The elevation profile is presentation-only and varies by round archetype to create slopes/steps/waves/raised finals while keeping tournament truth unchanged.

## Spawn safety

Spawn circles are validated against marble radius and world bounds and checked pairwise for overlap. Presentation never adds an initial impulse.

## Theme variation

Themes alter track geometry profile, structural supports, lighting, fog, machinery treatment and environmental dressing. They are not just color swaps.

## Current limit

The generated authority does not yet contain explicit ramp meshes or material-zone polygons. Those remain future authoritative schema extensions; the current 2.5D elevation is visual depth, not hidden physics.
