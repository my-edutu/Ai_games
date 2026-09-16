# AI Dungeon — Endless Adventure 2.5D Rebuild Implementation Plan

> Execute on `agent/ai-dungeon-2-5d-rebuild`. Preserve deterministic authority and treat all other active game directories as read-only.

## Goal
Transform the existing deterministic Canvas/vector broadcast experience into a world-first autonomous 2.5D dungeon crawler while keeping gameplay authority, replay, fairness, persistence and audience-integrity behavior unchanged.

## Architectural decision
The authoritative TypeScript simulation remains grid/integer based. A new deterministic presentation projection maps immutable public snapshots into room, biome, elevation, prop, interactable, entity animation, combat cue, camera and ambience descriptors. Rendering consumes only this projection; no renderer randomness may feed back into authority.

## Task 1 — Baseline audit and red tests
1. Record current visual/system gaps in `VISUAL_REBUILD_AUDIT.md`.
2. Add tests requiring deterministic biome selection, room archetype projection, world coordinates/elevation, physical objective/interactable descriptors, entity animation/action states, boss presentation state and bounded presentation collections.
3. Verify tests fail before implementation.

## Task 2 — Presentation-world projection
1. Add a presentation-only world contract (`world.ts`).
2. Deterministically classify rooms into corridor/combat/treasure/shrine/crypt/library/forge/prison/ritual/boss/sanctuary archetypes according to existing objective placement and floor depth.
3. Derive biome from floor/chapter plus audience cosmetic theme without changing authority.
4. Project grid cells to isometric/world coordinates with deterministic elevation tiers.
5. Emit doors/arches, objectives, chests, shrines, boss gates, traps already present in authoritative state, props and lighting anchors.
6. Keep collections capped and immutable.

## Task 3 — Character/combat presentation adapter
1. Extend public render snapshot with presentation-only hero/enemy state.
2. Map semantic events, telegraphs, AI intent and cooldowns to idle/walk/attack/cast/guard/dodge/hit/loot/interact/death/victory states where evidence exists.
3. Expose tactical roles and facing targets so AI behavior can be communicated visually.
4. Add equipment-profile descriptors from relic/build state without inventing authoritative stats.

## Task 4 — 2.5D renderer
1. Replace the flat tiled board as the primary scene with an isometric 2.5D scene graph.
2. Build modular floor/wall/arch/pillar/door/stair/pit/bridge/rubble/statue/bookshelf/torch/altar primitives.
3. Render biome-specific materials, ambient fog, local-light glows, shadows, occlusion/cutaway behavior and height variation.
4. Replace symbolic hero/enemies with layered articulated silhouettes and state-driven animation.
5. Add physical loot/chest/shrine/gate/trap presentation.

## Task 5 — Combat, VFX, camera and audio
1. Add semantic attack anticipation, arcs/trails, projectile travel, impact, stagger, knockback cues and bounded particles.
2. Add smart camera modes for exploration, reveal, combat, boss, loot, trap, near-death and result states.
3. Add boss arena framing, phase-change cues, lighting/music state changes and death sequence.
4. Expand Web Audio toward biome ambience, positional semantic cues and adaptive music-state transitions while preserving silent degradation.

## Task 6 — HUD reduction and livestream composition
1. Target 85–90% world, 10–15% permanent HUD.
2. Move build/resources/recent events to collapsible/temporary observer overlays.
3. Preserve health/resource/floor/objective/boss/AI-intent essentials.
4. Preserve reduced-motion, colour-safe and caption alternatives.

## Task 7 — Procedural visual quality and performance
1. Add validation for obstructed mandatory paths, duplicate props, invalid doors, prop/entity intersections and unreachable interactables at the presentation projection layer.
2. Add deterministic variety budgets per biome/room.
3. Use batching/instancing/object pools/shared materials/culling concepts appropriate to the renderer.
4. Add stress tests for deep floors and repeated biome transitions.

## Task 8 — Three-pass quality loop
1. Build and capture baseline/current evidence where runtime infrastructure permits.
2. Critique against high-quality action roguelites/dungeon ARPG reference set.
3. Fix flatness, repetition, unreadable combat, weak silhouettes, excessive HUD, weak boss presentation and performance regressions.
4. Repeat a final polish pass.

## Task 9 — Documentation and acceptance
Create/update:
- `VISUAL_REBUILD_AUDIT.md`
- `VISUAL_ARCHITECTURE.md`
- `ART_DIRECTION.md`
- `PROCEDURAL_WORLD_SYSTEM.md`
- `HERO_ANIMATION_SYSTEM.md`
- `ENEMY_COMBAT_SYSTEM.md`
- `BOSS_PRESENTATION.md`
- `CAMERA_DIRECTOR.md`
- `VFX_AUDIO_SYSTEM.md`
- `PERFORMANCE_REPORT.md`
- `VISUAL_ACCEPTANCE_REPORT.md`

Do not mark runtime/browser/screenshot acceptance items complete without actual evidence. R5/production readiness remains governed by the existing release evidence gates.
