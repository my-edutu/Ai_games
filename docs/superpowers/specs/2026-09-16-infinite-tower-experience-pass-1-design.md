# Infinite Tower Climb Experience Pass 1 — Design

## Goal

Move Infinite Tower Climb from a technically strong autonomous prototype toward a commercial-quality vertical-action platformer by improving the things a viewer/player perceives every few seconds: traversal expression, room identity, landmark cadence, encounter composition, and boss/environment integration.

## Approved criticism being addressed

The current game is strongest in deterministic simulation, AI, validation, browser evidence, and livestream-safe presentation. Its largest remaining experiential gaps are: rectangular platform repetition, limited traversal vocabulary, weak room/landmark identity, encounters that are placed rather than choreographed, and insufficient environmental/mechanical distinction between sectors.

This pass deliberately does not attempt final authored music, a full skeletal animation asset pipeline, narrative campaign writing, or multi-hour R5 soak certification. Those remain later production passes.

## Non-negotiable constraints

- `games/eko-street-run/**` is read-only.
- Preserve deterministic authoritative state, replay checksums, named RNG, bounded entity counts, recovery behavior, and public/private state separation.
- No presentation code may mutate authoritative simulation.
- New generation must remain seed-stable and solvable by the autonomous agent.
- New traversal actions must be explicit in `TowerAction`, bounded by cooldown/stamina/contacts, and testable deterministically.
- Existing accessibility, clean-feed, portrait, reduced-motion, high-contrast, browser evidence, chaos, release-validation and nondeterminism gates remain mandatory.

## Design approach

### 1. Movement Mastery

Add two expressive actions that materially change route possibilities without exploding physics complexity:

- **wall jump** — when airborne and in contact with a solid wall, jump away from the wall with a deterministic horizontal impulse and normal jump vertical impulse;
- **mantle** — when the player reaches the side/top edge of a solid platform while rising or falling slowly, snap to a deterministic safe top position and transition to grounded state.

These are chosen before wall-running/grappling because they reuse the existing collision model and can be reasoned about by the current AI graph. The AI will use wall-jump only when a next platform is above and lateral reach is otherwise poor; mantle remains primarily contact-driven and needs no hidden look-ahead.

Movement state grows from `standing|airborne|dashing|hurt|dead` to include `wall-jumping|mantling`. New stats record wall jumps and mantles for experience telemetry.

### 2. Sector Room Grammar

Replace the single alternating six-platform layout with deterministic sector templates. Every generated chunk has a `roomArchetype` derived from theme + floor + named RNG.

Initial archetypes:

- Foundry: `conveyor-shaft`, `crusher-gallery`, `furnace-bridge`
- Ruins: `broken-arches`, `vine-well`, `statue-ascent`
- Storm: `coil-gauntlet`, `wind-gap`, `lightning-spine`
- Clockwork: `gear-stair`, `pendulum-well`, `moving-lift`
- Void: `fracture-crossing`, `phase-spine`, `gravity-rift`

The authoritative implementation uses only existing platform primitives (`solid`, `oneway`, `moving`) and hazard primitives in this pass. The archetype changes geometry, spacing, moving-platform axes, hazard placement, and encounter slots; theme presentation reads the archetype to render matching architecture. This avoids adding fake gameplay props that do not exist in authority.

Each template must expose a valid monotonic ascent route whose vertical gap stays within tested jump/wall-jump reach.

### 3. Landmark Floors

Every milestone floor in the existing milestone set becomes a deterministic `landmark` room. Landmark identity is carried in the public snapshot as sanitized display metadata, not seed/private config.

Examples:

- Floor 10: Furnace Gate
- Floor 25: Broken Observatory
- Floor 50: Storm Crown
- Floor 100: Clockwork Heart
- Floor 250: Void Cathedral

Landmarks alter geometry and presentation together: wider staging platforms, stronger vertical silhouette, controlled hazard count, and a short traversal reveal before normal pressure resumes.

### 4. Encounter Choreography

Enemy placement changes from index-based spawning to encounter slots derived from the room template.

Encounter roles:

- `pressure`: ranged enemy on protected/high ground;
- `blocker`: sentinel controlling a landing route;
- `crossfire`: two enemies on separated lanes;
- `guardian-stage`: guardian on a wide arena platform with ordinary enemies capped or removed.

The system remains deterministic and bounded by `maxEnemiesPerFloor`. Hazards and enemies are not allowed to create unavoidable spawn overlap around the player/checkpoint.

### 5. Presentation and evidence

The renderer exposes `roomArchetype`, `landmarkName`, `wallJumping`, `mantling`, and room/landmark diagnostics. Presentation adds room-specific structural motifs tied to authoritative room metadata rather than inferring a fake layout from theme alone.

Browser evidence adds:

- one wall-jump or mantle capture;
- one non-landmark sector room capture proving room grammar;
- one landmark capture with readable landmark identity;
- one encounter capture proving enemy/hazard composition remains on-screen and readable.

## Data model

`TowerChunk` gains:

- `roomArchetype: string`
- `landmarkName?: string`
- `encounterSlots: Array<{role:'pressure'|'blocker'|'crossfire'|'guardian-stage';platformId:string}>`

`TowerAction` gains:

- `wallJump: boolean`

Mantle is contact-driven and does not need a separate action.

`TowerPlayer.state` gains `wall-jumping|mantling`.

`TowerStats` gains `wallJumps` and `mantles`.

Public snapshot exposes sanitized `roomArchetype` and optional `landmarkName`.

## Testing and acceptance

1. Same seed/config/floor produces byte-identical room archetype, platforms, hazards and encounter slots.
2. Every theme produces at least two distinct tested room geometries across a deterministic floor sample.
3. Generated vertical gaps remain inside a reachability bound or provide a wall-jump route.
4. Wall jump is impossible without a wall contact, consumes no hidden randomness, and produces deterministic velocity.
5. Mantle only triggers at a solid platform edge and lands the player on a legal top position.
6. AI can clear seeded campaign samples containing the new room grammar without increasing technical outcomes.
7. Guardian rooms remain readable and bounded.
8. Browser evidence visibly distinguishes at least three room archetypes and a landmark.
9. All prior Tower source/self-test/nondeterminism/chaos/release/browser gates stay green.

## 22-skill review emphasis

This pass primarily exercises game-creative-direction, gameplay-progression, difficulty-failure-balancing, procedural-generation, platformer-experience-review, game-architecture, autonomous-agent-design, deterministic-simulation, game-physics, game-feel-vfx, viewer-retention, performance-optimization, game-analytics-experimentation, simulation-qa and production-readiness-review. Audio/HUD/security/reliability remain regression gates even where they are not directly changed.
