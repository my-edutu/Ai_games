# Infinite Tower Climb PR68 — bounded source-render recovery (2026-11-09)

**Stage:** P0 OPEN · **leading transformation verdict:** NOT EVALUATED
**Implementation SHA:** [3936f68c2c6b7136431be559e8950c63d8b0e4c6](https://github.com/my-edutu/Ai_games/commit/3936f68c2c6b7136431be559e8950c63d8b0e4c6)
**Frozen baseline:** `1731b380851162741761c5569e2bc152a0869ca9` (unchanged)
**Draft PR:** https://github.com/my-edutu/Ai_games/pull/68

## Source defect and user-visible consequence

The original `scene.mjs` caught rendering exceptions but, after three errors, set `contextLost=true`. The animation loop returns whenever `contextLost` is true. That value was cleared only by a real `webglcontextrestored` event; ordinary JS exceptions do **not** generate that event. Even a transient renderer fault therefore made the visible 3D expedition appear permanently disconnected while the authoritative game continued. The viewer HUD mislabeled this as WebGL context recovery. This finding is derived from the actual exact-parent source; no live crash reproduction is claimed.

## Connected correction

- `visuals/render-recovery.mjs` defines bounded deterministic recovery decisions: after two consecutive submission failures, reset existing Three.js state after 250ms, 750ms, and 1800ms, with at most three state resets. One genuinely completed rendered frame clears the fault streak; a new public snapshot alone does not.
- `visuals/scene.mjs` separately handles renderer faults and genuine browser WebGL loss, retaining source snapshots and preexisting 3D actors. It does not fabricate missing simulation ticks, rebuild resource owners because of an ordinary exception, create an artificial victory, or restart the expedition. Persistent exceptions stop retries, not the authoritative game. A quality-tier switch or real WebGL restore resets only the presentation fault state.
- `app.js` correctly exposes recovering/failed graphics status and a quality-tier/reload recovery path to the existing accessible HUD rather than claiming a nonexistent context-restore event.

## Verification (guardrails, NOT transformation score)

- **PASS, isolated:** Node 22 ran three focused pure policy tests covering isolated failure, finite 250/750/1800ms retries, terminal failure and malformed input. Copied helper bytes matched the authored commit.
- **PASS, exact blob syntax only:** V8 parsed committed `scene.mjs`, `app.js`, new helper and test after stripping module declarations for parser-only checking. No original module execution or 3D initialization.
- **NOT EVALUATED:** full original Node/Three/browser tests, real thrown-renderer-error and true-context-loss recovery, real smartphone tests, performance p50/p95/p99, memory, 3200-tick current-source campaign, native 60+s full-motion desktop and portrait captures. GitHub quality run https://github.com/my-edutu/Ai_games/actions/runs/42575202281 is pending; legacy nine-job capture https://github.com/my-edutu/Ai_games/actions/runs/42490211469 has nine queued jobs assigned to no runners and an outdated candidate SHA.
- **NOT EVALUATED:** LOOKS 0/5, FEELS 0/5, PLAYS 0/5 independently randomized authentic critics.

## Separate experience-quality review

The most important *observed* footage defect remains the giant foreground clockwork assembly concealing the airborne climber and guardian around 16.5–18s in the [historical genuine 390x844 candidate film](https://github.com/my-edutu/Ai_games/actions/runs/42426089449/artifacts/13594459833), renderer `e0fe7729`. The new recovery safety work does not fix or validate that visual defect. Recent source geometry, camera and sightline changes must be filmed together.

**Risk:** `renderer.resetState()` repairs some transient Three/WebGL state faults but cannot cure a permanent deterministic JS exception or a real GPU loss. Bounded suspension and the explicit failure state prevent endless attempts; browser injection and real WebGL-loss testing remain veto gates.

**Next source-evidence action:** restore an executable runner; run the original fault/recovery/browser suite and full source-tick sequence; capture matched baseline and current SHA desktop/portrait continuous gameplay through grounded gateway crossing, floor nine, outcome and restart. If the wheel still dominates the shot, reopen scene composition. Never advance beyond P0 based on test counts or this safety correction alone.

**Safety:** no modifications to baseline, main, PR58, gameplay authority, deploy/merge state or PR draft status. Roll back only the implementation SHA if an observed renderer regression warrants it.
