# AI Dungeon — Gauntlet Round 036: Soft cloth silhouettes on true textured rigs

**Branch:** `feat/ai-dungeon-3d-gauntlet-foundation` · **PR:** #49 (draft). **Benchmark:** Diablo IV authentic dungeon captures primary; No Rest for the Wicked environments and Path of Exile 2 combat secondary. **NOT MET.**

## Proven gap and bounded increment

The preceding actual Chromium WebGL evidence (Round 34), inspected for Round 35, shows textured heroes but rigid hanging cloth silhouettes. Round 35's party-space architectural cutaway helps expose the encounter, but it does not make cape/robe motion convincing. This increment deforms the vertices of the *original existing* six archetypes' cloth panels, keeping the shoulders pinned and bending hem weight by authoritative action type (idle/move/attack/cast/hurt/guard). It is secondary render-only motion, not a gameplay cloth solver.

A pure finite function `planDrapeVertexBend` defines up to 0.145m displacement plus small lateral/vertical sway. Each panel stores immutable reference coordinates and resets from that base every frame: no integrated drift, no physics/tick coupling and a stationary reduced-motion variant. The existing WebGL meshes and materials are reused; no new actors, lights, draw calls, meshes, textures, asset dependencies or outside licenses. Normal vectors update after vertex changes. Each rig's allocated arrays are retired with the actor's asset geometry.

## Test-first and verification contract

Separate test-first commit introduced three focused Node test contracts and a real Chromium diagnostic gate *before* the planner and renderer code. It checks six actions and finite ages, pinned seams, movement distinction, per-vertex bounded offsets, deterministic recomputation, input safety, GPU buffer update integration, actual test discovery and a real WebGL trace metric. This is a deliberate TDD red stage; no suite pass is claimed until observed.

Exact new browser capture must continue to show genuine three-dimensional heroes, cloth counts, `draperyPeakDeformationMeters` between 0.005 and 0.19m, mobile readability, zero missing assets/page errors and bounded draw calls. The updated `dungeon:test` script also runs the previously omitted existing fabric-panel foundation suite; validation counts must not be inferred.

## Harsh quality and release verdict

This improves a specific stiffness defect but **does not** create anatomically rich hero/enemy GLBs, physically simulated textiles, high-fidelity PBR textures, fluid motion-matched strikes, realistic stone lighting or Diablo IV parity. A fresh-context critic and ultracode are unavailable because the worker tunnel is offline. No blind matched A/B, long soak, mobile p95, full CI success, or production certification is claimed. Review real exact-head screenshot/video before accepting artistic benefit. **Do not merge.**
