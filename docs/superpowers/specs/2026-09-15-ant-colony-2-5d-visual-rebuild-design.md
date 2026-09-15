# AI Ant Colony 2.5D Visual Rebuild Design

**Date:** 2026-09-15  
**Approved source:** User-provided implementation specification in this task.  
**Scope boundary:** Ant Colony presentation/public/test surfaces only. `games/eko-street-run/**` and other games are read-only.

## Viewer promise

Viewers watch an autonomous ant civilization grow from a small queen-led nest into a large living ecosystem while weather, food pressure, excavation, predators, seasons and collective intelligence continuously reshape the world.

The adversary is ecological pressure, not a scripted villain: scarcity, predators, weather, colony congestion and survival tradeoffs arise from authoritative simulation state.

## Architecture decision

Keep the current fixed-step simulation as the only gameplay authority. Extend the immutable render snapshot only with presentation-safe derived values that cannot alter outcomes. Build a layered 2.5D browser renderer downstream of the snapshot:

`authoritative simulation → immutable render snapshot → presentation adapter → layered world renderer → entity animation/LOD → camera director → VFX/audio → compact broadcast HUD`

The browser may interpolate positions and excavation transitions between accepted snapshots, but it may never invent authoritative entities, resources, outcomes or state transitions.

## Rendering approach

Use the existing dependency-free browser host and introduce a hybrid renderer optimized for OBS longevity:

- Canvas 2D terrain/world layer for organic soil strata, tunnels, chamber walls, roots, vegetation, water, food and lighting masks.
- WebGL2 instanced entity layer when available for large ant populations and bounded particle batches; deterministic Canvas 2D fallback when WebGL2 is unavailable.
- DOM overlay only for compact broadcast data, captions and operator controls.
- No dependency on Eko or Infinite Tower assets/systems.

This avoids adding a heavy framework/runtime dependency while still gaining GPU batching and LOD for large ant populations.

## Presentation contract extensions

Add only public derived fields:

- `environment.dayProgress` in `[0,1)` derived from authoritative tick/day length.
- `environment.seasonProgress` in `[0,1)` derived from authoritative tick/season length.
- `queen.eggsLaid` for truthful milestone choreography.
- stable chamber presentation descriptors derived from existing chamber/tunnel geometry and authoritative resource/brood state; descriptors are presentation metadata, not new simulation state.

Existing private configuration and seed remain excluded.

## World composition

### Surface foreground

Use layered grass, leaves, stems, stones, roots, twigs and occasional foreground occluders. Elements are seeded from the public run token + stable cell/entity IDs so presentation reconstruction is stable without affecting simulation RNG.

### Surface gameplay

Show entrance, food sources, predators, moisture/puddles, vegetation, carcass/organic matter proxies only when supported by authoritative resources/events. Never add a creature that implies a gameplay threat if no threat exists.

### Soil cross-section

Render topsoil, loam/compact soil, clay/deep earth bands, moisture tint, embedded rock/water and root silhouettes. Tile geometry becomes carved tunnel/chamber space with soft irregular edges rather than grid rectangles.

### Colony interior

Derive chamber presentation identity from location and state:

- nest-center chamber → queen chamber;
- brood-heavy adjacent chamber → nursery;
- chamber nearest high food-store traffic → food storage;
- entrance-adjacent chamber under high threat → soldier staging;
- new/edge chamber with dig traffic → expansion chamber.

These labels affect visuals/camera only and do not modify simulation rules.

## Ant rendering

Each visible ant must read as an ant: head, thorax, abdomen, six legs, antennae and orientation. Role readability uses natural distinctions:

- worker: balanced small body;
- scout: slimmer body, longer antennae, faster visual cadence;
- nurse: smaller mandibles, brood-tending animation;
- digger: larger foreleg/mandible silhouette, soil-carrying behavior;
- soldier: larger head/mandibles and heavier gait.

Near/mid/far LOD:

- Near: full articulated procedural ant silhouette + shadows + carried object.
- Mid: simplified instanced ant silhouette with leg cadence.
- Far: bounded density/traffic marks that preserve count and route direction without silently deleting authoritative ants.

## Queen and brood

Queen is a distinct elongated ant form with abdomen breathing motion and attendants selected from nearby nurse/worker entities. Brood stages have distinct shape/size. Nurses visibly tend/rearrange brood using presentation-only interpolation.

Queen danger increases visual urgency through nearby ant convergence, camera priority, audio state and local lighting—not fabricated damage.

## Excavation

When a tile changes from undug to tunnel/chamber between accepted snapshots, animate a bounded excavation transition:

- wall recedes over time;
- diggers at/near the cell receive dig cadence;
- soil particles fall;
- carried soil/debris moves away from the face;
- dust clears;
- authoritative completed geometry is revealed.

The transition duration is visual-only; the simulation tile is already authoritative.

## Pheromones

Default view keeps pheromones subtle. Show contextual routes when:

- a food route is active/focused;
- alarm pressure is high;
- excavation focus is active;
- observer/debug mode is explicitly enabled.

Intensity maps directly to authoritative fields.

## Weather, day/night and seasons

World lighting derives from day progress. Weather modifies surface lighting, rain/heat/drought effects and moisture appearance. Seasons alter vegetation density/palette, leaf litter/frost-like treatment where appropriate and ambient lighting while preserving the same authoritative geometry.

No weather or season outcome is created by presentation.

## Camera / broadcast director

Maintain a bounded shot scheduler with priorities, dwell windows and cooldowns. Candidate shots are derived from semantic events and current state:

1. queen danger;
2. predator/combat;
3. major food discovery/foraging route;
4. active excavation/chamber completion;
5. brood/queen milestone;
6. population milestone;
7. overview/quiet colony.

The director controls framing only. Reduced-motion mode disables shake and shortens/softens transitions.

## HUD

Target 90% world / 10% UI. Replace permanent sidebars with:

- small top-left colony identity + population/food/brood;
- small top-right day/season/weather/threat;
- short lower caption/event strip;
- transient strategy/event cards;
- optional detailed observer panel behind a toggle/query parameter;
- clean-feed mode with world + captions only.

## Audio

Retain semantic cue derivation but add aggregate soundscape layers: wind/surface insects, digging/soil, rain, threat/combat and queen/milestone beds. Avoid per-ant clicking. Music remains optional, restrained and state-layered.

## Performance budgets

At 1920×1080 on CI/reference desktop:

- target 60 FPS, acceptable sustained floor 45 FPS during heavy scenes;
- renderer hard cap 2 DPR;
- bounded particle pool;
- no unbounded event/ant visual history;
- one ant batch per LOD tier when WebGL2 is available;
- deterministic fallback remains functional without WebGL2;
- no silent removal of simulation entities from counts or public state.

## Verification

Evidence must include browser screenshots for overview, foraging, chamber activity, queen, excavation, predator, defense/combat, weather, lighting/season variation and milestone. The HUD-hidden screenshot is a stop-ship visual test.

Three-pass quality loop:

1. Build and capture.
2. Critique flatness/readability/dashboard residue; fix.
3. Polish animation, depth, lighting, VFX, camera, audio and performance; recapture.

Completion claims require fresh build/test/browser/CI evidence and an explicit incomplete-items list if any acceptance item remains partial.
