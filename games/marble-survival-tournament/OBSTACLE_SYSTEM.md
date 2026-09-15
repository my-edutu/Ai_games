# Obstacle System

## Authoritative modules preserved

- **Blocks:** static collision rectangles, rendered as raised mechanical barriers.
- **Bumpers:** circular restitution colliders, rendered as cylindrical impact posts.
- **Sweepers:** deterministic moving colliders driven by triangle-wave timing; rendered as moving mechanical arms/hubs.
- **Wind zones:** deterministic force regions exist in authority. Dedicated visible fan geometry is not yet exposed through the public snapshot and is therefore not claimed as complete.
- **Pits / kill zones:** authoritative elimination/recovery regions, rendered as emissive hazard wells with framed edges.
- **World boundaries:** fixed collision bounds with 3D rails/contact cues.

## Lifecycle

Arena modules are rebuilt only when the authoritative arena changes or presentation quality requires resource rebuilding. Visual objects are disposed when replaced. Moving sweepers are recalculated from authoritative tick, period, phase and amplitude; they are not free-running animations.

## Telegraphing

Hazards use emissive contrast and frames. Sweepers have a visible hub/ring and substantial arm silhouette. Finish architecture is physically prominent. Small contact VFX remain subordinate to obstacle readability.

## Missing modules

Pendulums, seesaws, crushers, conveyors, trapdoors, collapsing platforms and launchers are not fabricated in this pass. They should only be added when their authoritative state/collision model exists.
