# Tower PR68 — P0 real grounded Floor8→9 continuous-camera passage

**2026-11-12 · Stage P0 OPEN · Assessor NOT EVALUATED.** PR #68 draft; frozen source baseline `1731b380851162741761c5569e2bc152a0869ca9` is unchanged. Scope: only original Infinite Tower Climb presentation, tests and transformation evidence.

## Inspected authentic source and video evidence

- [Exact source eight-film recording](https://github.com/my-edutu/Ai_games/actions/runs/43125505703), source `eedf6c323d3539071efbf11e0477ec56ffd0324c`: all eight 60+ second original baseline/candidate desktop and portrait WebM jobs passed, authentic source-led guardian/crusher/restart job passed, but strict pair-source-events job failed (**0/2 event-to-native guardian pairs**). No missing or doctored videos. Do not call this a transformation pass.
- [Exact-source technical safety workflow](https://github.com/my-edutu/Ai_games/actions/runs/43125505597) **passed**. This is a veto, not a positive experience score.
- Real danger footage's event timeline shows source tick 451 on Floor 9 at **23.226 s desktop** and **23.667 s portrait**. Its native video drawn Floor9 starts about **24.75 s desktop** (+1.524 s) and **25.0 s portrait** (+1.333 s). Actual sampled native frames show an abrupt architectural change instead of a clearly followable body walking through the open same-lane cap arch.

## Causal code finding and integrated correction

The previous floor-continuity fix kept the real open bronze arch on the deck across source 8→9. However, the *live* camera lost its unlocked `liveExit` immediately when the source advanced to Floor 9; neither its real-cap dolly nor its safe gateway screen correction could continue even as the drawn arch persisted. Thus the view abandoned the physical passage exactly when the post-handoff walk should be legible.

This change adds a **bounded source-backed next-floor grounded camera handoff**, not a decorative victory effect. A single follow camera can continue to hold the actual open arch and the new-floor grounded climber only with exactly matched run token, floor, tick, retained authored 3D arch, active handoff, supported next-floor `f9:ground`, healthy player and a physically nearby source sole. The effect fades with the existing real passage memory and proximity, and respects current camera solid-core/actor/gateway vetoes, manual orbit, reduced-motion and overview conventions. No authoritative state, collision, timing, teleportation, additional render pass, PR58 work or graphics resource was changed.

## Evidence obligations and separate quality review

A new focused deterministic Node contract checks genuine next-floor grounded continuity and rejects stale, fabricated, late, unsupported, distant, wrong-run/floor and nonvisible door cases. Repository CI must be verified at the final immutable SHA; a plausible contract is **not** a successful original video. After-capture must show a visibly continuous guardian defeat→arch crossing→Floor 9 onward on both 960×600 and 390×844 original normal-speed videos, with source-event/actual-native alignment fixed rather than retimed or excused.

**Independent randomized LOOKS 0/5, FEELS 0/5, PLAYS 0/5.** Supported-device frame-time p50/p95/p99 and memory **NOT EVALUATED**. The original source/raster gap and portrait bronze-structure obstruction remain P0. Keep stage OPEN until both exact-source full-motion and independent experience criteria truly pass; otherwise reopen whichever underlying visual/gameplay failure dominates. Never merge, deploy, force-push or alter PR draft status.
