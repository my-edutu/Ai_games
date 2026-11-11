# Tower PR68 P0 — measured false-co-planar guardian lock correction

**Date:** 2026-11-11. **Stage:** P0 OPEN. **Assessor:** NOT EVALUATED.

## Original exact-source evidence and the primary system-level defect

Latest [10-job source-pinned capture](https://github.com/my-edutu/Ai_games/actions/runs/42998763864) at candidate `a8dbe8aeed26659840a6a0b20a092a605a7e2a85` and frozen baseline `1731b380851162741761c5569e2bc152a0869ca9`: 8/8 recording jobs and 8/8 authentic source-event story pairs succeeded, exact-head [quality](https://github.com/my-edutu/Ai_games/actions/runs/42998763709) passed, but the final strict event-to-rendered-scene guardian pairing was **0/2 viewports**, so the workflow verdict is failure. The original 390×844 candidate WebM was inspected at native speed and sampled at 12–34s. Around **14–24s**, cyan bars and bronze lock structures occupy the foreground in both portrait and desktop, competing with the climber and living guardian; Floor 9 was visibly present later but does NOT prove an earned visible doorway crossing. The original portrait source floor-9 search index was at ~23.633s whereas native drawn Floor 9 appeared around 25s (+1.367s), so no event-synchronized acceptance was claimed. The video itself was not changed.

Post-batch original scene ray-owner observations near the live duel include 16 hits attributed to `SourceLockedGuardianVerticalEnergyLattice`, 8 to `GuardianSealBronzeLatticeLeft`, and additional real pylon / cap-lattice encounters; source rays are geometric hints, **not pixel-specific occlusion proof**.

Inspection of the actual authored Three.js transforms identified a concrete geometry contradiction that prior reviews incorrectly called co-planar. `world.mjs` anchors the real bronze `GuardianGateInset` at `GUARDIAN_CAP_CORRIDOR.visibleSealRadius = 24.25`, behind the skinned radius-25 climber. However, `guardian-passage.mjs` nested the 14m cyan source lattice inside a threshold already offset `25-27.78=-2.78`, then translated it **back by +2.78**, yielding world radius **27.78**, a full **3.53m foreground separation** from the real bronze gate. Both live structures consequently occupied opposing sides of the fighters.

## Source-preserving physical 3D correction in this change

Reconstructed the **same authored physical source seal** at the real bronze HP lock's radial plane **24.25** instead of an invented foreground **27.78**. The source-evident grounded inner threshold retains its actual radius **25** and remains invisible until a genuine source zero-HP guardian. The 17 bounded low/high voltage structures, three bright plus two recessed pedestrian rungs, full source-dependent 14m–20m vertical coverage, HP warning light, existing draw submission, guardian/door source collider, boss rules, deterministic seeds and fixed-step ticks are unchanged. Added **world-transformed Three.js** regression for actual cyan/bronze co-planarity, core clearance, source-height continuity, and true HP0 unlock, plus explicit geometry-only radius diagnostics. This is an actual first-person/portrait depth staging correction, not a retimed film, new overlay or fixture-only change.

This claim is **source geometry only**. We have NOT observed corrected original full-motion film or proved visual improvement, source/raster causality, guardian-and-crusher victory, grounded body crossing, floor-nine onward, result/restart, device memory/frametime, or independent comparisons.

## Vetoes and required next action

Run exact-head original Node22/Three and 10-job immutable baseline/candidate real WebM capture. In normal-speed 960×600 and 390×844 films, independently inspect full body and guardian visibility through 14–26s, actual original floor 8->9 HUD and event phase, earned HP0 gate opens, climber feet cross source-pinned deck, floor-nine continuation, outcome/restart. If the backend/browser frame offset still differs by >1s, keep event pairing **NOT EVALUATED** and diagnose clocks without fabricating matches. Reopen geometry/camera if foreground cyan/brass still hides combat. Independently randomized LOOKS 0/5, FEELS 0/5, PLAYS 0/5; supported-device p50/p95/p99 and memory NOT MEASURED.

Frozen baseline unchanged, PR68 draft, PR58 untouched; no merge, deployment, force-push or other games.
