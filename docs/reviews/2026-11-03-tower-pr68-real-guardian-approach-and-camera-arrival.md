# Infinite Tower Climb — visible guardian approach and source-cropped camera recovery
2026-11-03 · Draft PR #68 · Same continuing transformation. **QUALITY: NOT EVALUATED.**

## Authentic gameplay observation, not a verdict
I inspected actual prior-source GitHub WebM artifacts from [capture 41557558393](https://github.com/my-edutu/Ai_games/actions/runs/41557558393): desktop and portrait candidate danger video and both frozen-baseline danger videos, including sampled original native frames at 5–125 seconds, alongside `motion.json` and the fixed-step trace. Candidate was source-pinned `da89fa4`, baseline is still **`1731b380851162741761c5569e2bc152a0869ca9`**. The videos are normal-speed and longer than 60 seconds. These frames are sampled, not a full-motion blinded randomized judgment. Same elapsed seconds routinely show different in-game events and MUST NOT be treated as matched gameplay.

In the candidate's sparse source-projection observations while an active guardian exists anywhere on the floor, desktop camera framed that guardian in **11/35** samples and the exterior cap lock in **5/35**; portrait camera framed the guardian in **2/10** and cap lock in **0/10**. Several samples are clearly ordinary vertical ascent from beneath the encounter, when focusing the climber rather than a distant guardian is correct. These statistics are diagnostic, not independently validated sustained visibility or a performance result. The reviewed samples also show a distinct real skinned climber, platform depth and environmental variation, but do not establish a LOOKS/FEELS/PLAYS preference.

## Cohesive source implementation
[Gameplay commit a2bd637](https://github.com/my-edutu/Ai_games/commit/a2bd637e67e59a20f245af8954064ce7b4d1438f) changes the real Three.js camera rather than a screenshot, splash page or progress display.

* **Before the first injury:** stage a genuine *alive and unwounded* guardian when a grounded climber has actually selected its floor cap as the immediate route, and is physically within the existing 90k-horizontal/60k-vertical encounter envelope. The old camera only protected a wounded/telegraphing/attacked guardian; early full-health contact could become visible too late.
* **During camera catch-up:** if that genuine staged guardian's present body projects toward/outside the previous submitted picture, increase the *existing* bounded exterior-orbit follow rate. It never teleports or changes the source game camera mode. Preserve the hero's stronger emergency rescue, prevent slowdown of that rescue, and leave the framing of airborne landings untouched. Invalid guardian projections, stale data, reduced-motion frames and non-combat stages cannot assert a fake action.

No game authority, RNG, route, damage, HP, stream transport, new GPU pass, light or HUD object was added. The primary actor and combat silhouettes remain hard constraints; the physical gate is still an **optional** composition preference, not a guarantee that every phone shot includes it. Source-first tests cover authentic close-range full-health cap approaches, mobile and desktop composition, airborne non-interference, a missing projected guardian, and bounded rate response. A logic test cannot replace real video.

## Evidence, safety and next round
* [Exact game-source safety workflow 41561512676](https://github.com/my-edutu/Ai_games/actions/runs/41561512676): **success** for build, logic, authority, browser progress checks; veto only, not a quality result.
* [New-source real gameplay capture 41561512578](https://github.com/my-edutu/Ai_games/actions/runs/41561512578): **in progress** at inspection; no real after-video assessment on a2bd637 yet.
* Critic workspace: `NOT_FOUND: Tunnel-client has not been seen for 300 seconds`. No independently randomized full-motion critic votes; **LOOKS 0/5, FEELS 0/5, PLAYS 0/5**.
* No supported-device p50/p95/p99 or resident memory, final replay and accessibility proof. No AAA or sustained-FPS claim.

The systemic work remains one continuous real ascent → guardian encounter → authentic ending/restart. The next meaningful judgment is full-source-event aligned desktop+portrait game footage at the same combat and outcome situations, then independent review. PR #58 is untouched; PR #68 remains draft, without merge, deployment or force push.
