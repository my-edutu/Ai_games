# Tower PR68 — source-observed landing and imminent hazard visibility in one 3D frame

**Run date:** 2026-11-09 · **Stage:** P0 OPEN · **Verdict:** NOT EVALUATED

**Source commit:** [f4f683ec89b30fb5a8e1412ef5378da22d2e2d7f](https://github.com/my-edutu/Ai_games/commit/f4f683ec89b30fb5a8e1412ef5378da22d2e2d7f) · **Parent:** `01f598a6c682e1af8143aa805cb8460c1151a2fc` · **Frozen baseline:** `1731b380851162741761c5569e2bc152a0869ca9`.

## Specification audit — actual source fault

The portrait guardian lens already recognized a physically selected midair target platform, but the final decorative-gear visibility pass only received its landing point when the separate `landingApproach.diagnostics().visible` beacon said yes. During a live shutter/hazard, the same mutable `actorOrbitTarget` was reused as a single target; the 3D world had two corridor slots for enemy and either landing or danger. A real landing behind a clock face could therefore remain unprotected, while retaining a real shutter cue required sacrificing the landing.

This is a **source-defined safety gap**, not proof that the exact current build has been watched failing. Older genuine 390×844 original-game candidate footage, renderer `e0fe7729`, around 16.5–18 s shows foreground clockwork masking airborne action. [Historical original-game recording](https://github.com/my-edutu/Ai_games/actions/runs/42426089449/artifacts/13594459833). No new video exists yet.

## Coherent actual implementation

- `public/infinite-tower-climb/visuals/critical-sightlines.mjs`: pure current-source priority contract; earned gateway yields to a genuine observed hazard, but a real landing can coexist with the danger.
- `public/infinite-tower-climb/visuals/scene.mjs`: the original source-selected airborne landing now participates in visibility even when decorative approach beacon is not drawn. The imminent source hazard owns a separate retained world-space vector, so it cannot overwrite the landing or guardian.
- `public/infinite-tower-climb/visuals/world.mjs`: three preallocated partner projections/rays now allow guardian, landing and imminent hazard to join the real actor in the same camera-relative decorative foreground protection. Source event tick diagnostics include endpoint count and whether a source hazard is present. No actor x-ray, extra HUD, fabricated positions, new collision, AI, source combat changes or renderer allocations beyond one retained scratch vector.
- `tests/phase4/tower-critical-sightlines.test.cjs`: seven semantic source-priority situations, including concurrent landing plus hazard, terminal refusal and authentic airborne gate priority.

All changes are contained on the existing draft PR68 branch based on PR58. No baseline move, main/PR58 edits, merge, deploy, forced branch rewrite or draft conversion.

## Verification performed and excluded

The authored helper and its original Node test file were copied byte-for-byte into a local isolated Node22 filesystem. Git blob hashes **matched the committed repository blobs** (`8821295888932e1cd0231862cea01027c4fdf698`, `b9dd63ec83b39fe499d4f396111644f295b46dc9`). Both syntax checks and **7/7 focused policy cases passed**. This does NOT verify the integrated 3D scene. The authenticated app-project development tunnel returned `Tunnel-client has not been seen for 300 seconds`; original Three.js runtime, full repo build, accurate source-pinned 3,200-tick campaigns, current 60s+ desktop/portrait WebMs, event alignment, physical devices and independent critics remain **NOT EVALUATED**.

Performance reasoning (unmeasured): three bounded corridor projections rather than two and up to one more source-target ray per decorative entry; the additional hazard vector is retained, not allocated per frame. Device p50/p95/p99, overdraw and camera stability require direct measurement before clearance.

## Required next observation

Execute current original production path at exactly `f4f683ec89b30fb5a8e1412ef5378da22d2e2d7f` (or the later evidence-only descendant), frozen baseline `1731b380851162741761c5569e2bc152a0869ca9`; use matched seed/tier, 960×600 desktop and 390×844 portrait. Verify real ascent/moving-deck, simultaneous hazard + selected airborne landing, source-earned guardian/crusher defeat, grounded gate walk, floor nine, outcome and restart in uninterrupted normal-speed film, with source ticks paired to actual WebM PTS and file hash. Review historical giant-wheel frames against the new geometry and measure actual device frame time. Only then decide whether the largest remaining systemic gap is occlusion, camera size, physical crossing legibility or another defect.

**Independent reviewers:** LOOKS 0/5, FEELS 0/5, PLAYS 0/5. No quality/production pass or score claimed.
