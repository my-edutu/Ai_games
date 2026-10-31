# Arena System

## Current authoritative primitives
The arena generator already owns deterministic blocks, bumpers, hazards, wind zones, sweepers, spawn points, safe lanes and a finish line across five round archetypes. The rebuild maps those primitives into constructed 3D geometry without changing their collision footprint.

## 3D presentation
- deck and understructure establish scale and depth;
- guard rails and posts make the course read as built infrastructure;
- finish gate and checkered band provide an unmistakable objective;
- static blocks receive metallic housings and accent strips;
- bumpers render as cylindrical mechanical units;
- moving sweepers render as beams with hubs/support structure while matching authoritative triangle-wave timing;
- pits render as recessed danger zones with rim telegraphing.

## Theme architecture
Each existing round archetype selects a cosmetic deck/trim/rail/hazard/accent/clear-color theme. Theme values do not alter competition physics.

## Extension contract
New gameplay-affecting primitives such as ramps, crushers, pendulums, trapdoors, conveyors, tilting platforms, water, ice or destructible floors must be added to state schema, deterministic generation, physics, presentation snapshot and tests together. The renderer must not add a cosmetic obstacle that authority cannot collide with.

## Current limitation
The rebuilt arena proves genuine 3D presentation for existing authoritative primitives, but it does not yet claim the full obstacle catalogue in the product brief.