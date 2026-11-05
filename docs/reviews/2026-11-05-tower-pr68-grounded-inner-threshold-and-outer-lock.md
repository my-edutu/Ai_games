# Infinite Tower Climb PR68 — grounded inner passage and outer lock
Date: 2026-11-05 | SAME transformation open | **Experience status: NOT EVALUATED**

## Finding (source inspection, not video review)
The real grounded skinned climber runs at radius 25 in `scene.mjs`; the authentic cap's supported visible annulus is 22.4–27.18. The HP-linked bronze lock/passage is anchored by `scene.mjs` at radius 27.78, **outside the walking surface**, and at cap top +2 world units. The prior 12 inlays were corrected to 26.35 but they still led to an exterior gateway the climber could not physically walk through in the 3D projection. This is a whole-sequence spatial-coherence failure, not another decorative CSS issue.

## Playable transformation (implementation `8fd9018fbe53196c34f41f3e9260b2d6fa1b459e`)
- Keep the original outside bronze lock and guardian power connection where the viewer can read them; never alter source lock authority.
- Share the EXISTING group and its genuinely earned opening with an inset **second physical 3D doorway** on the cap top and at radius 25, matching the real skinned grounded climber.
- Two instance draws: six structural stone pieces (inner piers, lintel, low sill and two angled mechanical braces connecting the raised outer lock), plus two bronze leaves that retract with precisely the same source-earned opening as the original outer leaves. Reuse existing box/materials; no new GPU geometry, extra dynamic light, textures or shadow pass.
- Move the same continuous passage camera focus toward the actually walkable interior aperture (angle/x remain source locked), with guardian-defeat focus protection retained. The spotlight/exterior victory is still visible, but the hero's path is no longer directed at an outside-air doorway.
- Invalid/nonfinite/non-exterior source anchors do not place a second doorway. Old inlays still retire at real floor advance; all stage resources dispose/rebuild with the existing scene, and reduced-motion shows both leaves fully open.

## Specialist assessment — two separate passes
**Specification:** Source-only presentation: no collisions, speed/AI action, future knowledge, fabricated hero or auto-win, direct screen overlay, new network access, new randomness, replay state, or changed frozen baseline. Camera retains existing safety rescue; original physical cap unchanged.

**Experience critique (NOT a blind quality vote):** Corrected spatial relationship is a prerequisite to meaningful doorway crossing, but no source-exact full-motion candidate video or supported physical device test is yet available. Additional architectural elements could clutter portrait action or expose transparency sorting: inspect real event-matched footage before deciding that LOOKS, FEELS or PLAYS improved.

## Verification and evidence
- Frozen baseline: `1731b380851162741761c5569e2bc152a0869ca9` (unchanged).
- Earlier exact-head safety: [42098245713](https://github.com/my-edutu/Ai_games/actions/runs/42098245713) **SUCCESS** for prior source `15b510cb`; irrelevant to new gateway.
- Source tests: `tests/phase5/tower-guardian-walkable-threshold.test.cjs`, commit `8eb0e87`. Contracts test radial projection, ground-height focus, source bearing, invalid evidence and instanced opening; they have **not executed locally** because the connected worker is offline.
- New exact-head safety: [42104896843](https://github.com/my-edutu/Ai_games/actions/runs/42104896843) **PENDING** at inspection.
- New real-game source-pinned desktop + portrait capture: [42104896643](https://github.com/my-edutu/Ai_games/actions/runs/42104896643) **PENDING**. Neither captures nor frame-by-frame video analyzed yet.
- Syntax of updated module parsed in isolated JS environment; no claim about WebGL presentation, full suite or device behavior.
- Worker/browser attempt: disconnected tunnel `NOT_FOUND` (>300s unseen). Independent blind critics: LOOKS 0/5, FEELS 0/5, PLAYS 0/5; device p50/p95/p99 frame-time and memory absent. Quality **NOT EVALUATED**.

## Remaining milestone, rollback and boundaries
Review all three continuous >=60s real-simulation A/B scenarios on desktop and portrait, especially 8→9 guardian defeat→walkable inner doorway→real ascent→complete outcome/restart. Five fresh blind randomized judges must prefer candidate >=4/5 **in each pillar**. Hardware budget, replay and accessibility remain required; CI only vetoes. Rollback is the two gateway commits on PR68 without moving baseline. Preserve PR58 changes, keep PR68 draft; no force-push/merge/deploy.