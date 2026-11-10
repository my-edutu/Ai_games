# Infinite Tower Climb P0 — source-authenticated drawn guardian camera convergence

**10 November 2026**. Scope: Draft PR #68 **only** (`feat/tower-transformation-gauntlet-20261101`). Frozen baseline **`1731b380851162741761c5569e2bc152a0869ca9`** unchanged. **Leading verdict: NOT EVALUATED.**

## Recovered original-game proof and actual observed problem

[Ten-job immutable original-source capture 42903135945](https://github.com/my-edutu/Ai_games/actions/runs/42903135945) finished **10/10 SUCCESS** at actual candidate **`8e54c4edf26de3bf0578a4b5348d006ce844552f`**, with baseline at `1731b380851162741761c5569e2bc152a0869ca9` (two original source-host binaries). All **16** source-pinned original 60+ second WebMs exist for ascent, genuine floor-seven moving platform, floor-eight guardian danger, and outcome, each desktop **960×600** and portrait **390×844**. [Event pair evidence 13805106852](https://github.com/my-edutu/Ai_games/actions/runs/42903135945/artifacts/13805106852) reports **8/8** native-timebase-calibrated scenario pairs and zero provenance/source-story defects. Its fullMotionPaired verdict explicitly remains **false**; calibration does not prove that each meaningful event is visually understandable.

I inspected actual unmodified [candidate native portrait danger recording](https://github.com/my-edutu/Ai_games/actions/runs/42903135945/artifacts/13804421444), including source-matched frame samples around 18–23s. The living floor-eight boss and hero alternate between small/split figures, heavy foreground machinery around 19–20s, and a climber near the left crop around 20s. The [same-run frozen original danger recording](https://github.com/my-edutu/Ai_games/actions/runs/42903135945/artifacts/13805280146) is available for real blind A/B, not yet reviewed by independent critics. The bronze wheel/rail does not have conclusively assigned raster pixel provenance, so don't claim a specific authored mesh is proven guilty.

The existing camera first plans the guardian's whole-body shot from **authoritative fixed-step boss coordinates**, but later collision/screen guards read **its actually rendered interpolated 3D model**. Earlier source observations saw substantial NDC disagreement during a real fight. The shot planner and guard can therefore disagree about *where the same actual guardian is*, creating a fragmented cinematic objective at exactly the highest-stakes moment. This is a concrete structural camera-presentation defect **in addition to** physical foreground occlusion; the code change cannot by itself certify that the whole scene looks better.

## Implemented meaningful camera integration

[Commit `59f243dc9621ce506ad5836c7252ca9c348f4055`](https://github.com/my-edutu/Ai_games/commit/59f243dc9621ce506ad5836c7252ca9c348f4055):

- Adds a pure **source-authenticated drawn-guardian witness**. It can use ONLY the original drawn rig position from the current/preceding 20Hz source tick, matching guardian ID, exact run token and floor, with live positive HP and running player; stale, future, dead, defeated and restarted observations are rejected.
- Connects that witness to the actual `composeFollowView` full-body guardian planning, while its preexisting **source eligibility, current guardian HP, attack/telegraph state, locked cap, selected airborne touchdown, tower-core sightline tests and exterior shot scoring** still determine when any boss shot is allowed.
- Reuses the retained Three.js vector and persistent witness record, with **no new meshes, materials, WebGL submissions, model poses, script clocks, authority mutation, random numbers or gameplay actions**. The existing guardian, crusher, source-driven gate, genuinely walkable floor-nine threshold and source restart remain unchanged.
- Adds read-only diagnostics `guardianPlannerAnchor` for genuine source-vs-rendered field studies and focused source-visible regressions (same-run observation, previous tick, wrong boss, future/stale, defeat and restart).

**Important**: This is a real playable camera-production behavior change, not a claim that the visible guardian obstruction is fixed. The original quality workflow [42905177383](https://github.com/my-edutu/Ai_games/actions/runs/42905177383) now **SUCCESS** at preceding camera-fixture SHA `ba8006c8`—technical guardrail only. New implementation quality [42917672196](https://github.com/my-edutu/Ai_games/actions/runs/42917672196) is **IN PROGRESS** at review writing. No exact-`59f243dc` native visual match or independent acceptance has been completed yet.

## Required immediate verification

The capture request is updated on this branch so the next original **10-job** workflow captures candidate at immutable request-commit `github.sha`, **never the branch alias**; comparison baseline remains exactly `1731b380851162741761c5569e2bc152a0869ca9`. Inspect **full motion** on both screens, hero + guardian in the 13–26s genuine fight, source-to-drawn NDC, motion continuity and physical obstructing geometry. Do not accept screenshots alone. Event-match source guardian/crusher HP to real hit/counteraction, grounded unlocked threshold and floor-nine, followed by real outcome/restart. Fix the largest persistent scene defect instead of another test-only patch if the camera still loses subjects.

**Reviews**: LOOKS **0/5**, FEELS **0/5**, PLAYS **0/5**—no reviewers invented. **Physical-device** p50/p95/p99 and memory: **NOT EVALUATED**. Core safety/accessible controls/replay final acceptance: **OPEN**. No merge, deploy, PR draft conversion, frozen-baseline move, PR58 rewrite or new branch.
