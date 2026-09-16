---
name: isometric-world-rendering
description: Use when building or reviewing isometric/2.5D world projection, modular environment geometry, elevation, depth ordering, occlusion, lighting, biome presentation, Canvas/WebGL/Three.js boundaries or renderer performance.
---

# Isometric World Rendering

## Objective
Turn authoritative world state into a spatially believable, readable and performant 2.5D scene without letting the renderer invent gameplay truth.

## Invariants
- Rendering consumes immutable public/presentation state only.
- Presentation-only randomness is deterministic or seeded from public identifiers and never feeds authority.
- Hidden authoritative topology stays hidden.
- Elevation is cosmetic unless a versioned authoritative height model explicitly supports traversal/collision.
- Hero, hazards, goals and attack telegraphs stay readable under all biome palettes.
- Geometry, props, lights, shadows and particles have hard budgets.
- Renderer failure must not stop autonomous gameplay.

## Workflow
1. Define world coordinate and isometric projection conventions.
2. Separate authoritative grid/topology from presentation geometry.
3. Build modular kit grammar: floors, walls, corners, arches, doors, pillars, stairs, bridges, pits, rubble, landmarks.
4. Define biome material/light/fog/prop palettes.
5. Establish depth sorting and occlusion rules.
6. Add camera-aware cutaway/fade behavior for walls/roofs.
7. Validate doors, objectives, props and entities do not create visual contradictions or block mandatory routes.
8. Budget visible tiles, draw calls, materials, lights, animated entities, particles and memory.
9. Test 16:9, mobile crop, clean feed, reduced motion, dark/bright scenes and long sessions.
10. Capture HUD-hidden screenshots as acceptance evidence.

## Canvas vs WebGL/Three.js decision
Use Canvas when the scene remains bounded, sprite/vector-based and can meet frame budgets with clear depth. Migrate to WebGL/Three.js when dynamic lights/shadows, many animated entities, instancing, skeletal models, camera perspective or material/shader requirements materially exceed Canvas capability. Never migrate merely for novelty.

## Review gate
Pass only when HUD-hidden captures unmistakably read as a dungeon world, not a board; occlusion does not hide critical action; repeated rooms still have compositional variation; geometry never contradicts authority; and target frame/memory budgets survive soak.
