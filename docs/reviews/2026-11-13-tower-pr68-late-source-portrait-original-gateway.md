# P0 — Original bronze guardian doorway survives delayed portrait WebGL after real grounded crossing

**13 November 2026 · PR #68 draft · P0 OPEN · transformation NOT EVALUATED.**
Frozen baseline: `1731b380851162741761c5569e2bc152a0869ca9`; do not move it or modify PR #58.

## Authentic before-change evidence inspected

[Exact immutable-source nine-job campaign 43489266207](https://github.com/my-edutu/Ai_games/actions/runs/43489266207), baseline unchanged and candidate `07aa3bda79299d8e9b471ba1b4673d6d9ab8982a`: eight original source-pinned >=60s 1× gameplay jobs succeeded, but pair-source-events failed **0/2 strict native guardian-crossing viewports**. The unedited desktop and 390×844 portrait danger WebMs still abruptly replace bronze Floor8 with violet Floor9 at ~25–25.5s; the real actor advances, but does not visibly pass through the same original door in continuous body+arch composition. No visual PASS.

Read original source/native frame sidecars for **same real Floor8→9 guardian victory at tick451**:
- Desktop: first returned Floor9 WebGL tick454; old original bronze gateway retained, but native pixels still hard-cut. Actor/gateway camera projections both in view; retention is necessary, not sufficient.
- **Portrait: first returned Floor9 WebGL tick460, nine authoritative ticks after actual crossing tick451.** The first real new-floor camera proof reports `retainedOriginalGpu:false` although both the living body and original gateway are physically projectable. Original source observation at tick451 had a defeated guardian, old grounded cap and real grounded successor, yet `lastGuardianCrossing` publication had not reached that first browser receipt (`gatewaySourceAudit.selectedSource=old-browser-guardian-only`; `veto=missing-source-witness`). Source sidecar later confirms the HP-zero crossing; no invented source tick or victory was required.
- The renderer's queued-cap admission required an ALREADY published `lastGuardianCrossing` and non-null `queued.crossingTick`; thus on the portrait first returned frame it silently discarded the previously-rendered original bronze gateway even though `stageGroundedCapContinuation` had seen the real old/new physical handoff.

The high-impact failure is source/publication-clock vs first GPU submission; further cosmetic doorway fades cannot repair deleted original geometry.

## Systemic repair implemented

The following changes are bounded to Tower presentation, tests and evidence. They do not change gameplay authority, physics/collision, player positions, guardian combat, source snapshots, route progression, replay, or restart:

1. `public/infinite-tower-climb/visuals/crossfloor-arrival.mjs` now has `observedQueuedOriginalCapFromGroundedReceipt`, admitting an **already source-staged existing old cap/door mesh** across <=12 observed ticks only when the independently proved same-run Floor8→9 grounded route, aligned old/new roof, non-dead body, exact dimensions and physically bounded forward movement match. Missing later crossing record is never forged; if the record IS present but conflicts, the weak receipt cannot override it. A subsequently observed matching immutable crossing also authenticates the previous null-tick source staging.
2. `public/infinite-tower-climb/visuals/world.mjs` stamps that prior physically validated grounded old/new receipt onto the pending existing GPU gateway with the actual observed endpoint and silhouette size. It guards old cap/guardian HP0, source tick interval, real old support and whole-body clearance, same roof, run, live new f9 ground and plausible horizontal motion; it never creates a new actor, portal or gameplay platform. Deferred new Floor9 shell still follows its existing source-bounded renderer-submission clock.
3. Test-first `tests/phase3/tower-crossfloor-arrival.test.cjs` proves accepted original old door in missing/delayed immutable source, rejects forged runs, floor/roof/support/position/crossing, and preserves input snapshots. First exact-head CI after TEST ONLY [43493539499](https://github.com/my-edutu/Ai_games/actions/runs/43493539499) recorded the expected red failure (portrait first GPU test false). New `tests/phase3/tower-retained-source-cap-world.test.cjs` exercises **actual Three.js original bronze group identity**, 9-tick delayed renderer rebuild with no published crossing, and wrong-run cleanup.

Commits: test-first `6b168c9e4797e4361dbb18370e7a29259313de3f`; source receipt `57952d1d98850360c948e307f08cba4416e46f33`; physically authenticated world staging `abb89fb86a792a3f0ec142d2dc7d12b2e4dae2bb`; real Three regression `700b7292df9c873dc65052a3d39974219829b5d1`.

## Verification and exit

The previous pre-repair quality workflow [43489266695](https://github.com/my-edutu/Ai_games/actions/runs/43489266695) passed, but **did not execute this repair**. Post-repair quality at [43494255841](https://github.com/my-edutu/Ai_games/actions/runs/43494255841) was queued at review-writing time; passing source-unit tests does not certify native pixels. Request an exact immutable new eight-video baseline/candidate campaign at current code SHA and inspect real normal-speed 22–31s desk + portrait source/frame/native PTS. Demand: original full-body and original bronze doorway visibly together, physically walkable exit, old-world architecture and new-world depth sharing a stable shot, source tick451→Floor9 onward and authentic outcome/restart. If missing, P0 stays OPEN and the next priority is **unified physical world/camera depth and opaque shaft occlusion**, not more timer patches.

**Independent blinded reviewers:** LOOKS 0/5, FEELS 0/5, PLAYS 0/5. **Actual-device p50/p95/p99 and memory:** NOT EVALUATED. **Leading assessor verdict:** NOT EVALUATED. No merge, deploy, force-push, baseline movement, PR58 rewrite or other-game edit.
