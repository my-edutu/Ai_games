# Infinite Tower PR68 — P0: source-owned cold-arch two-subject camera (13 November 2026)

**Stage: P0 OPEN. Leading assessor verdict: NOT EVALUATED.** PR68 is draft and is based on open PR58. Frozen baseline `1731b380851162741761c5569e2bc152a0869ca9` is invariant.

## Original normal-speed source and visible defect

The most recent inspected fully original matched high-stakes film was [workflow 43367166927](https://github.com/my-edutu/Ai_games/actions/runs/43367166927) at exact candidate source `1f83ad38cd61324abda63ad26d30b890aca5fa13`; eight complete 60s+ baseline/candidate scenario films were recorded in both 960×600 desktop and 390×844 portrait, low tier, matched seed. Both show a hard scene replacement from bronze Floor 8 to violet Floor 9 at approximately 24–26 seconds instead of a continuous full-body walking-through-the-same-open-door shot. The genuine 20Hz authority earns guardian defeat/clearance at source tick 451, but the FIRST actually submitted Floor9 GPU world/camera frame is delayed. Old cap and original guardian doorway can already be retained in source diagnostics without both appearing together in the filmed view. Strict native source-to-image acceptance remains 0/2 **on previously reviewed footage**. Previous rendered-submission counts do not prove actual transport pixels.

This is a physical composition and display-continuity defect, not license to fabricate a source crossing or to claim the game has passed P0.

## This execution's cohesive implementation

- Production [commit 1b51b7e3143c13dac14ab3a525ba9fc69c220799](https://github.com/my-edutu/Ai_games/commit/1b51b7e3143c13dac14ab3a525ba9fc69c220799) adds `visuals/cold-doorway-camera.mjs`, a pure, bounded two-subject lens derived from the immutable recorded HP-zero Floor8→9 crossing and the **same original GPU-retained bronze cap/arch** used by `world.retainedFilmHandoff(snapshot)`. Checks include run identity, exact cap/roof/ground alignment, living authoritative body position and support, genuine retained submission window, late source tick, drawn body coordinate coherence, range from original bronze threshold and missing/corrupt source rejection. Only one existing exterior follow camera is used.
- `visuals/scene.mjs` consumes that read-only world witness **after** standard grounded/airborne/guardian source camera priorities. With a valid late first real Floor9 frame it keeps the real climber and old opened gateway in a shared gaze and allows at most a bounded 12%-per-frame camera radius expansion, **only** if actor/core and gateway/core rays remain clear. The existing actor/guardian protections, manual overview, reduced motion and result handling keep priority. It does not affect player positions, health, collisions, seeded simulation, stairs, checkpoint, frame clocks or floor advance. No copied assets.
- `tests/phase3/tower-cold-floor-doorway-lens.test.cjs` verifies both aspect ratios, source mutation invariance, real geometry and rejected false crossing/body. The first exact-source CI exposed a static assertion typo in that new test, and a legacy Tower phase4 VM source-expression fixture without the new late-GPU lens fallback variable. Tower-scoped [test repairs 77c39d78](https://github.com/my-edutu/Ai_games/commit/77c39d78e8f5ef035d129439e758968be9cd468b) and [7fb26680](https://github.com/my-edutu/Ai_games/commit/7fb2668062ed3c72505387cf57e70491f9e95c65) preserve safety/priority checks rather than weakening the real renderer. No other games altered.

## Quality and specification criticism

**Specification pass:** Source-earned roof/gate, genuine player, one exterior camera, bounded GPU witness, integrity vetoes and baseline preserved. The camera's safe expansion remains conditional, not a guarantee that both subjects are actually on the final captured film. A retained GPU mesh can still be depth-occluded or out of shot. That must be diagnosed with native video rather than asserted from a test or camera request.

**Quality pass:** Higher impact than changing yet another isolated timing constant because the unexpired original world now drives the camera as well as the material/lighting and shell-defer system. However no accepted new film exists at report time. Actual full-body crossing, desktop/portrait visual transition, Floor9 onward, and terminal/restart remain **NOT EVALUATED on the new production SHA**.

**Technical checks:** First exact-source [quality 43376270285](https://github.com/my-edutu/Ai_games/actions/runs/43376270285) exposed the two Tower test fixture failures described above and was not green. Corrected exact-head [quality 43376757350](https://github.com/my-edutu/Ai_games/actions/runs/43376757350) was pending at initial inspection; do not infer a pass. Unrelated Maze runner timeouts, if present, remain vetoes and are not modified in this PR.

## P0 gate and next action

Trigger new immutable candidate-on-evidence-commit nine-job baseline/candidate native campaign: ascent, moving, danger/guardian with source-earned grounded crossing and Floor9 onward, and outcome/restart; 60s+ at 1×, low/seed matched, 960×600 and 390×844. Inspect unmodified 22–31s playback, source/Three/GPU/native PTS alignment, physical doorway and actual body visibility and matched baseline outcome timing. If hard cut persists, inspect the camera/retained arch occluder and rebuild the common physical scene depth rather than adding more timers. No stage transition without 2/2 actual film gate and true complete-loop acceptance. The new code may improve the shot but this has **NOT BEEN EVALUATED** on its captured pixels.

Independent randomized blind fresh-context reviewers: **LOOKS 0/5, FEELS 0/5, PLAYS 0/5**. Supported physical device p50/p95/p99 and memory: **NOT EVALUATED**.

Safety: no baseline move; PR68 stays open draft on PR58; no merge, deployment, force-push, other-game change or fabricated footage/critics/metrics.
