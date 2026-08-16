---
name: game-physics
description: Use when creating or reviewing movement, collisions, rigid bodies, projectiles, platforms, vehicles, marbles, crowds, spatial queries, solver settings, or physically based game rules
---

# Game Physics

## Overview

Create motion and collision that are stable, readable, performant, and compatible with authoritative replay. The core principle is **use the simplest physical model that produces the intended decisions and spectacle, then constrain it with fixed-step budgets and testable invariants**.

## Scope

Use for grid movement, kinematic characters, platforming, marbles, vehicles, projectiles, crowds, obstacles, collision layers, and environmental forces. This skill decides physical representation and feedback contracts. It does not tune the whole game’s difficulty or render cosmetic particles.

## Non-Negotiable Invariants

- Authoritative physics advances with fixed logical time, never render delta.
- Collision, constraint, contact, and conflict ordering are stable or reconciled deterministically.
- Renderer interpolation cannot feed positions back into authority.
- Units, scales, coordinate systems, tolerances, and solver versions are explicit.
- High-speed objects cannot silently tunnel through outcome-critical geometry.
- Spawn, teleport, checkpoint, resize, and restore preserve valid non-overlapping state or resolve through a declared policy.
- Physical parameters remain within validated ranges; NaN/infinite/explosive states are detected.
- Maximum bodies, colliders, contacts, queries, iterations, and broadphase workload have budgets.
- Important interactions communicate anticipation, impact, and recovery without obscuring truth.

## Workflow

### 1. Choose the representation

Select by gameplay need:

- grid/cell rules for Snake, mazes, traffic lanes, colonies, and many tactical simulations;
- kinematic swept shapes for precise character/platform control;
- deterministic custom particles/constraints for simple marble or crowd systems;
- pinned physics engine for rich rigid-body spectacle where reproducibility is proven;
- hybrid model with authoritative simplified physics and presentation embellishment when exact rigid-body outcomes are unnecessary.

Avoid a full solver merely because the game contains movement.

### 2. Define physical vocabulary

Document:

- world and display coordinate systems;
- units and scale;
- fixed time step;
- shape catalogue and collision layers/masks;
- body types and ownership;
- velocity/acceleration/force limits;
- friction, restitution, drag, gravity, and constraint ranges;
- sleep/wake rules;
- trigger versus solid contacts;
- out-of-bounds and kill-plane policy;
- quantization/tolerance rules.

### 3. Specify integration and ordering

Declare the authoritative sequence for input, forces, integration, broadphase, narrowphase, continuous collision, constraints, contact resolution, triggers, gameplay consequences, and state quantization.

Use stable entity/contact ordering. If the engine does not guarantee it, sort inputs and reconcile outcome-relevant results through deterministic game rules.

### 4. Design collision policy

For each layer pair state:

- ignore, overlap, block, damage, collect, attach, bounce, or custom resolution;
- one-way/platform rules;
- friendly/self collision;
- simultaneous-contact precedence;
- projectile ownership and repeated-hit cooldown;
- sensor enter/stay/exit semantics;
- destruction/deactivation timing.

Gameplay consequences occur once through semantic contacts, not independently in render and physics callbacks.

### 5. Handle fast and dense cases

Use swept tests/CCD for fast outcome-critical objects; substeps only within budget. Apply spatial partitioning, lane/flow models, simplified proxies, sleeping, level of simulation, and contact limits for crowds or large worlds.

Degradation may reduce cosmetic debris or distant fidelity; it cannot change declared winner-critical rules without versioned policy.

### 6. Design feel separately from truth

Map semantic impacts to:

- pre-impact anticipation;
- hit stop or presentation slow motion that does not alter authority unless explicitly commanded;
- camera impulse with accessibility limits;
- VFX/SFX intensity derived from impulse/severity;
- squash/stretch and trails;
- recovery pose/state;
- captions or visual alternatives.

Clamp, prioritize, and deduplicate feedback during contact storms.

### 7. Test invariants and adversarial geometry

Cover:

- corners, edges, slopes, thin surfaces, moving platforms, stacked bodies, simultaneous contacts, high velocity, zero velocity, huge/small mass, teleports, spawn overlap, checkpoint restore, world origin/large coordinates, and maximum populations;
- conservation or bounded-energy expectations where applicable;
- no NaN/infinite positions or velocities;
- no unauthorized penetration beyond tolerance;
- deterministic terminal outcomes across replay fixtures;
- frame-drop independence;
- performance tails and contact storms.

### 8. Profile before optimizing

Capture broadphase pairs, narrowphase contacts, solver iterations, CCD count, queries, active/sleeping bodies, allocations, frame/tick time, and worst seeds. Simplify shapes and rules before increasing hardware requirements.

## Required Outputs

- representation decision and rejected alternatives;
- coordinate/unit/timestep specification;
- body/shape/layer matrix;
- integration and collision-resolution order;
- parameter ranges and configuration schema;
- CCD, substep, sleeping, partitioning, and degradation policy;
- semantic contact-to-gameplay and contact-to-feedback contracts;
- physics invariant catalogue and adversarial fixtures;
- determinism validation across supported hosts;
- CPU/GPU/memory/contact budgets and profile plan;
- restore/migration implications.

## Review Gate

Pass only when:

- outcomes are independent of render frame schedule;
- identical inputs match authoritative physics checkpoints on supported environments;
- high-speed, simultaneous, dense, and restore cases pass;
- no gameplay consequence fires twice from one contact;
- collision layers and precedence are exhaustively documented/tested;
- NaN, runaway energy, out-of-bounds, and persistent penetration trigger safe handling;
- peak body/contact/query load meets budget;
- degradation preserves authoritative rules;
- visual/audio feedback remains proportional, accessible, and bounded;
- the selected solver is no more complex than the game requires.

## Stop-Ship Failures

- gameplay position updated in animation frame callbacks;
- engine default settings left implicit;
- thin-wall tunneling can change survival/winner;
- unordered simultaneous contacts choose different winners;
- spawn/restore creates unresolved overlap;
- particles or camera shake drive collisions;
- unbounded substeps or solver iterations;
- distant entities use full expensive physics without need;
- “feels okay” replaces edge-case and replay evidence;
- physics upgrade ships without version/fixture comparison.

## Handoffs

- `deterministic-simulation` and `game-architecture`: tick, ordering, state, replay, boundaries.
- `autonomous-agent-design`: navigation, movement capabilities, prediction, control frequency.
- `procedural-generation`: clearances, reachability, collider and path budgets.
- `game-feel-vfx` and `game-audio`: semantic impact feedback.
- `difficulty-failure-balancing`: parameter ranges and fair challenge.
- `performance-optimization` and `simulation-qa`: profiles, stress fixtures, and regression gates.
