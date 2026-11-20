# Infinite Tower Climb — P0: original Clockwork room must survive **material-batch selection**

**Stage:** P0 OPEN. **Leading verdict:** NOT EVALUATED. **Source-production SHA:** `25f0c2d1402a3f462de92e7196d2abf8cf4b85f3`. **Frozen baseline:** `1731b380851162741761c5569e2bc152a0869ca9`. PR [#68](https://github.com/my-edutu/Ai_games/pull/68) remains draft on `feat/tower-transformation-gauntlet-20261101`, based on untouched PR #58.

## Inspected source and real evidence

Read active AGENTS.md, Tower GAUNTLET.md, approved 1 Nov transformation design, current source, source-native evidence record, historical quality reports and the existing 9-job original capture. The [prior original films](https://github.com/my-edutu/Ai_games/actions/runs/44812794319) were 72.12s desktop and 71.88s portrait. All eight original baseline/candidate scenes and the authentic ledge check recorded, but strict source-to-native danger acceptance **failed in both viewports (0/2)**. The original bronze machine room is abruptly replaced by a giant violet Floor 9 annulus around 26s; the HP-open old gateway, full moving hero, and real walkable destination are not continuously shown together. This run uses the prior recorded evidence and logs; it has **not** inspected fresh native pixels from the new source SHA.

**Source-level systemic defect:** Previous gallery extraction explicitly reserved genuine left/right *triangles*, but only **after** `batches.slice(0,maxBatches)` selected up to eight nearest original materials. The left or right original Clockwork machine-room source may be in an excluded material batch. Reserving faces inside those already selected batches cannot recover missing physical room flanks. This makes later camera/opacity adjustments unable to restore the historic walls even when the source's real meshes exist.

## Coherent implemented change

1. [Regression test commit](https://github.com/my-edutu/Ai_games/commit/6a721c54f7c3a38b5c3d66bf0e048fc1549b43a1) creates twelve separate genuine source-material test meshes: ten near the cap and two flanking the actual opening. It requires both original flank geometries plus the central threshold under the same bounded draw and triangle caps, and proves source transforms are unchanged. Test execution/red failure **not yet observed**: Actions runners queued.
2. [Production change](https://github.com/my-edutu/Ai_games/commit/45f3c3e1581032c3c530b7c5d8073c61c5642194) retains the nearest original material first, then specifically includes *actual* left/right, deep and overhead source-material batches if they are absent, before filling residual slots by closest authentic geometry. Only originally present material batches and source triangles may be selected. Maximum eight production material batches and 3,600 old-floor source triangles remain unchanged. No fake gate, extra support, actor, collider, physics or simulation event is introduced.
3. [Visibility diagnostics](https://github.com/my-edutu/Ai_games/commit/25f0c2d1402a3f462de92e7196d2abf8cf4b85f3) report real material-batch availability, selected material batches and historical original left/right extracted face counts in preparation, retained GPU ownership and World diagnostics, so the next native capture can distinguish **absent original steel** from **steel selected but rendered offscreen or retired**.

## Exact-source validation gates

[Quality workflow](https://github.com/my-edutu/Ai_games/actions/runs/44821046856) and [9-job real gameplay campaign](https://github.com/my-edutu/Ai_games/actions/runs/44821047280) were triggered against immutable production SHA `25f0c2d1402a3f462de92e7196d2abf8cf4b85f3` and had not completed at recording. No improved native film, clean test pass or performance saving is claimed. The preceding [quality workflow](https://github.com/my-edutu/Ai_games/actions/runs/44813752175) failed its final unrelated Phase6 Maze readiness test by timeout; no unrelated source was changed and full CI stays a veto.

**Independent blind critics:** LOOKS 0/5, FEELS 0/5, PLAYS 0/5. **Supported actual-device frame p50/p95/p99 and memory:** NOT EVALUATED. Native 60+s baseline/candidate paired source events, both screen sizes, continuous original-room 3D passage, outcome/restart, safety and device evidence remain required.

**Next highest-impact action:** Inspect new whole-motion 960×600 and 390×844 source-pinned clips and source-native event pairings; compare the reported *available vs retained* original left/right source material batches. If actual selected flanks still vanish at Floor9, correct scene ownership, GPU return and staged incoming shaft **together**, not another isolated camera/tint heuristic. Remain P0 OPEN.

No merge, deployment, force-push, frozen-baseline change, PR58 edit, unrelated-game edit or draft-status change.
