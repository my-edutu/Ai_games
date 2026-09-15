# Physics Architecture

## Decision

Marble Survival keeps the recovered deterministic fixed-point physics solver as the authoritative competition engine and uses Three.js as a presentation consumer of immutable snapshots.

Rapier and Cannon-es were evaluated conceptually but not selected for authority in this pass because replacing the solver would change replay semantics, introduce floating-point/platform risk, and unnecessarily discard tested tournament logic. The repository-compatible fixed-point solver already provides bounded substeps, collision iterations, penetration correction, world contacts, marble contacts, obstacle contacts, bumper restitution, moving sweeper contacts, wind forces, friction, speed caps, and integrity quarantine.

## Authority boundary

Authoritative:
- seeded roster and arena generation;
- fixed-step movement and contacts;
- qualification/elimination;
- shields/recovery;
- round/tournament progression;
- champion result;
- sanitized semantic events.

Presentation-only:
- 3D elevation profile;
- marble visual rolling quaternion;
- camera position/shake;
- lights/shadows;
- particles;
- decorative structures and theme dressing.

Presentation cannot mutate authority or decide outcomes.

## Timestep and fairness

The simulation advances exactly one deterministic authority step per configured tick. Render FPS, browser resize, quality preset, camera mode, particles and clean-feed state do not enter the solver. Tests compare identical-seed checksums after a long fixed-step window.

## Current physics capabilities

PASS: inertia/velocity, friction, restitution, collision response, moving sweepers, bumpers, wind forces, wall/obstacle contacts, marble-marble contacts, hazard consequence mapping, bounded substeps and collision budgets.

PARTIAL: named material zones. Theme materials are currently visual; the solver has global friction plus collider-specific restitution rather than authoritative metal/ice/sand/mud zones.

NOT IMPLEMENTED: vertical rigid-body gravity. The authority is a 2D tournament plane. The Three.js layer turns that plane into 2.5D broadcast space while preserving results.

## Stop-ship rules

Do not silently migrate outcomes to a floating-point renderer physics world. Do not let camera/VFX affect state. Do not label visual elevation as authoritative gravity. Any future Rapier/3D authority migration must ship behind deterministic corpus comparison, replay-versioning and result-integrity tests.
