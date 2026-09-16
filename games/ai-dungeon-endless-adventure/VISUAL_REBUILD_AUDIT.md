# AI Dungeon — Endless Adventure Visual Rebuild Audit

Date: 2026-09-16
Branch: `agent/ai-dungeon-2-5d-rebuild`

## Executive finding

The existing game is substantially stronger as a deterministic autonomous simulation than as a visual dungeon game. Authority, replay, bounded AI, progression, audience integrity, persistence and release evidence are mature. The Phase 3 browser experience is a competent broadcast dashboard/vector visualization, but it does not meet the newer requirement for a world-first cinematic 2.5D dungeon crawler.

The rebuild therefore keeps authority intact and raises the presentation layer rather than replacing the simulation.

## Baseline classification

| System | Baseline | Finding | Rebuild action |
|---|---|---|---|
| Deterministic floor generation | PASS | Connected rooms/corridors, bounded generation, reachability validation and safe fallback exist. | Preserve authority; add presentation-only archetypes, biome dressing and spatial validation. |
| Hero AI | PASS | Bounded autonomous policy and intent presentation already exist. | Make decisions visible through animation, positioning, camera and combat staging. |
| Combat authority | PASS | Integer grid combat, cooldowns and semantic events exist. | Add presentation timing, anticipation, trails, impact, stagger and state-driven animation without changing hit truth. |
| Public snapshot privacy | PASS | Hidden enemies/topology are excluded and public collections are capped. | Preserve the same boundary for world projection. |
| World rendering | PLACEHOLDER | Flat Canvas cells and grid strokes are the primary world representation. | Replace primary scene with isometric/extruded world projection. |
| Physical room identity | PARTIAL | Generator has room rectangles but no visual archetype system. | Deterministically derive room presentation roles and environment kits. |
| Biomes | MISSING | No true biome presentation contract. | Add seven biome identities and scalable material/prop/light palettes. |
| Elevation/depth | MISSING | World state is 2D cell-only. | Add presentation-only elevation and isometric world coordinates. |
| Hero character | PARTIAL | Vector hood/lantern silhouette exists. | Add state-driven motion, equipment cues and articulated animation layers. |
| Enemy characters | PARTIAL | Distinct vector silhouettes exist. | Add tactical-role presentation, locomotion/attack states, stronger scale/material variation. |
| Enemy AI visibility | PARTIAL | Telegraphs and positions are visible. | Add flanking/spacing/controller/swarm behavior cues and intent-readable movement. |
| Loot in world | PLACEHOLDER | Rewards/builds mostly appear as state/UI. | Add physical pickup/chest/relic presentation and temporary pickup cards. |
| Traps | PARTIAL | Authoritative triggered trap state exists. | Add telegraph/activation/reset visual states tied to authoritative trap events. |
| Doors/gates | PARTIAL | Gate objective exists symbolically. | Add physical door/gate geometry and sealed/open states. |
| Boss presentation | PARTIAL | Boss HP, phase and telegraph exist. | Add arena identity, reveal, camera mode, lighting/music state, phase cue and death choreography. |
| Camera | PARTIAL | Smooth 2D cell viewport exists. | Move to world-space isometric follow/director modes, occlusion and encounter framing. |
| Lighting | PLACEHOLDER | Canvas gradients/glows exist. | Build biome lights, emissive anchors, fog and shadow/depth cues. |
| VFX | PARTIAL | Bounded particles/floaters exist. | Tie effects to semantic envelopes and weapon/spell/event identities. |
| Audio | PARTIAL | Adaptive synthesized Web Audio states exist. | Add biome ambience, positional cues, layered boss/combat states and richer semantic identity. |
| HUD | PARTIAL | Accessible but too much permanent broadcast chrome for world-first target. | Reduce persistent HUD; world should occupy ~85–90% of composition. |
| Long-session reliability | PASS/PARTIAL | Operations, restart, chaos and bounded systems are strong; new renderer has not yet earned the same evidence. | Add renderer-specific soak/performance budgets and leak checks. |
| Runtime visual evidence | INCOMPLETE FOR REBUILD | Existing Phase 3 capture evidence applies to old renderer only. | Capture new exploration/combat/loot/trap/biome/elite/boss/near-death/result evidence after CI/browser pass. |

## Rebuild implemented in first pass

- Added deterministic public world projection with biome, world/isometric coordinates, elevation, room presentation roles, props, lights and physical interactable descriptors.
- Added enemy tactical roles and animation-state descriptors.
- Added hero presentation animation state and world coordinates.
- Added presentation director modes for exploration, danger, combat, boss, near-death and result.
- Reworked permanent layout so the world dominates the viewport.
- Replaced primary flat cell rendering with extruded isometric Canvas geometry, biome atmosphere, depth ordering, environmental props, local glows and world-space objectives.

## Truthful current status

The first pass materially changes the visual architecture, but the complete acceptance checklist is **not yet satisfied**. In particular, browser screenshots for the new renderer, full animation coverage, physical trap lifecycle, explicit modular doors/stairs/bridges/pits, richer boss choreography, spatial audio, Three.js/WebGL migration decision, deep performance profiling and three complete visual quality passes still require evidence or implementation.

No claim of final completion should be made until CI, browser capture and the acceptance report demonstrate those requirements.
