# Dungeon Floor Ruins Round 33 Implementation Plan

> **For agentic workers:** Follow superpowers subagent-driven-development or executing-plans in test-first stages.

**Goal:** Add physically present, stone-finished wear and seepage to AI Dungeon floors while preserving truth and mobile visual hierarchy.

**Architecture:** A pure deterministic planner reads the existing map and exit. A read-only Three.js scene adapter uses two instanced materials and owns its resources, with snapshot diagnostics. The existing stream server serves its modules, and the existing Gauntlet captures actual WebGL.

**Tech Stack:** Three.js 0.186, Node 22, Playwright Chromium.

**Spec:** `docs/superpowers/specs/2026-10-31-dungeon-floor-ruins-design.md`

## Global constraints
No simulation/save/model changes, <=144 shallow stone pavers, <=22 damp patches, <=2 draw calls, biome variation, no obstructed heroes, no extra unsafe asset downloads.

## Review focus
All-open invalid maps; malformed/small grids; exit/spawn safety; identical seed/floor; WebGL overdraw; cleanup when autonomous floors change; mobile hero and HUD readability.

### Task 1: Pure procedural wear plan
- [x] Add three TDD tests for real seeded map anchors, limits, repeatability, themes and invalid input. Observe RED for missing module.
- [x] Implement `planFloorRuins(map,floor,exit,{maxPavers,maxPuddles})` and verify GREEN.

### Task 2: Actual authored materiality
- [x] Add `createFloorRuins(world,map,floor,exit)` with original beveled geometry and subdued wet shading, two instanced GPU batches, disposal and metrics.
- [x] Integrate under real `app.js` world state, expose strict same-origin server modules, retain existing camera and 3D simulation.

### Task 3: Test and capture the running game
- [ ] Add real Playwright desktop+mobile screenshot/visibility tests; enroll them in the dedicated suite.
- [ ] Run complete relevant Node tests, actual Chromium captures, deterministic campaign, and compare to baseline.
- [ ] Record remaining harsh critic gaps and evidence in progress ledger, commit to existing draft PR without merging.
