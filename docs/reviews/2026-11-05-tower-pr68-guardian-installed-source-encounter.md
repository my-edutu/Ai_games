# Infinite Tower Climb — guardian cap crusher stays physically installed through the whole encounter

**Date:** 2026-11-05  
**Initiative:** the SAME draft PR #68 transformation, not a passed Gauntlet round  
**Frozen reference:** `1731b380851162741761c5569e2bc152a0869ca9` (unchanged)  
**Playable code:** `e4e1889184ace3ad9bcaafb0d90c70ddec3afa88`, corrected continuity `f05bd2c6601a45d7ab2e205b4a1a76f4883e40e0`  
**Source-contract tests:** `a2ae6612f9e60a88738a7786253479a77778c70f`, continuity `dc85a7c3e001aef37d91ddba755c76414435ddfb`  

## Read real game before editing

The existing source-authentic cap crusher in `games/infinite-tower-climb/src/generation/chunks.ts` is a real, opt-in 20 Hz collider on the guardian's fighting deck, backed by the deterministic AI escape action. The previous source-pinned browser run [41928548717](https://github.com/my-edutu/Ai_games/actions/runs/41928548717) recorded no nearby guardian/shutter co-occurrence because the older crusher occupied an unused lower platform. The next actual-source run [41932038446](https://github.com/my-edutu/Ai_games/actions/runs/41932038446) has begun producing browser gameplay artifacts for the repositioned cap hazard but was still incomplete at inspection. These clips **precede the changes in this review**.

The new guardian-cap collider still had a systemic spatial-story flaw: its visual machinery existed only during the last twelve fixed simulation ticks, collision, and brief mechanically witnessed release. An autonomous climber could approach a seemingly empty part of the cap and then see a dangerous mechanical apparatus materialize there. A sustained boss + physical hazard needs a readable *installed landmark* before it becomes a short-cycle threat. Adding an unrelated HUD countdown would add clutter and would not solve the spatial mismatch.

## Connected playable intervention

`public/infinite-tower-climb/visuals/hazard-pressure.mjs` now presents one physical source-bound machine across **installed-open → source-counted 12-tick warning → closed real collision → observed six-tick unloading → installed-open**. At rest, existing steel jaws lean apart with a lower profile and neutral alloy color. The same sixteen original instanced mesh parts reconfigure for the existing charge, impact and release. Active danger still outranks lower-priority material on the low-quality tier. The rest state does not fire sound or emit a speculative warning.

The installed mechanism is admitted only for an actual `f<floor>:guardian-shutter` crusher that belongs to the same current `f<floor>:cap` physical platform; the real guardian must appear in the source snapshot. The structure survives a source-observed guardian defeat *until the real floor changes*, so a winning HP-gate transition does not spontaneously remove the collider's world art. Other traps and historic/disabled-mode chunks remain unchanged. A stale feed, missing source, new run, terminal snapshot or graphics reset clears the stage immediately.

This is **not** a new safe platform, collision surface, new camera, new light, AI intervention, injury animation, scripted encounter, outcome, or source prediction. The simulation, seed streams, fixed-step authority, replay action contract, audio eligibility, movement and collision rules were not edited. The existing scene already uses this effect and rebuilds it on graphics context restore. Its visibility in the game is not a standalone model mockup.

## Proportional engineering checks

Added `tests/phase3/tower-guardian-installed-shutter.test.cjs` to inspect the actual Three.js instanced-world mechanism with real-shaped source snapshots: source validity and immutability, distinct open/charging/closed poses, same pose at source activation, source-proven unloading and resting again, living-to-defeated guardian continuity, unrelated traps, stale/result, next run, low quality and reduced-motion. It is engineering evidence only, **not** a reviewer opinion.

Expected incremental rendering budget: no additional mesh, shader, material, light, draw pass, collider or permanent timer; at most **one existing instance draw of 16 pieces** while the current cap shutter is within the source-near visual stage. Cost now persists over the idle phase rather than only the countdown. Actual supported-device p50/p95/p99 frame times, memory, thermal behavior and accessibility comprehension are **NOT MEASURED**; this tradeoff must remain vetoable.

Earlier technical safety CI for `9b291d35`: [passed](https://github.com/my-edutu/Ai_games/actions/runs/41932698867), before these edits. Exact-new-source technical CI [41935858049](https://github.com/my-edutu/Ai_games/actions/runs/41935858049) was pending at inspection, and real 3D source capture [41935836265](https://github.com/my-edutu/Ai_games/actions/runs/41935836265) pending. An earlier intermediate capture was cancelled by subsequent pushes. Do **not** treat a queued workflow or a green contract check as a transformation PASS.

## Direct inspection of preceding genuine full-motion capture artifacts

I downloaded the *actual candidate danger recording* ZIP from [source-pinned action 41932038446](https://github.com/my-edutu/Ai_games/actions/runs/41932038446/artifacts/13374345699). The action completed **9/9** jobs with actual baseline and candidate browser WebMs. The candidate portrait video is approximately **129 seconds** of recorded image, includes the real skinned climber, guardian, platforms and transitions; first ~2 seconds are startup/blank, around 4 seconds the WebGL scene appears with a loading hint. I sampled actual portrait video frames across 0, 1, 2, 4, 12, 30, 60, 90 and 120 seconds; **frame samples are not a full-motion independent critique**. The 960x600 desktop candidate and frozen-baseline videos were archived too but have not been independently judged.

More importantly, I read the source's 50ms `crossfire-source-witness.json` from *inside the captured ZIP*, not guessed from test count:

| Scope | Genuine near guardian + shutter source witnesses | Source prelude / imminent / active | Render-matched source phase ticks |
| --- | ---: | --- | ---: |
| Desktop | 7 | 1 / 5 / 1 | **0** |
| Portrait 390×844 | 6 | 4 / 0 / 2 | **0** |

The source-authored cap crusher **now participates in the real fight**, unlike the older 5c242d run where there were zero contact source witnesses. However, none of these thirteen source-danger observations had a same-phase 3D render witness. In concrete samples source was at tick 314 while render diagnostics still reported stage tick 307, or source recorded charge but the rendered pressure stage reported `instances: 0`. The CI/browser WebGL renderer and source snapshots can be temporally out of phase under load; the sampling observer is read-only and missed snapshots are possible. This is **not proof** that the physical scene is invisible in every video frame, nor that the new stable installed rest pose has solved it. It **is proof that the prior run cannot be passed as a demonstrated readable three-body crossfire**. This strengthens the need for exact-source normal-speed video inspection, event alignment, and real supported-device frame-time tails.

The *new* installed-stage source capture [41935836265](https://github.com/my-edutu/Ai_games/actions/runs/41935836265) targets exact playable SHA `f05bd2c6` (with the frozen `1731b380` original host). Its images and source witness should reveal whether physical cap machinery stays legible even when the source/render tick phases diverge. No blind score is awarded to the new implementation.

**Technical safety update:** [41936060056](https://github.com/my-edutu/Ai_games/actions/runs/41936060056) succeeded for documentary head `fee86fc5`. Its log includes the three new genuine Three.js source-stage tests as passing, and the full 976-test repository suite passed. This is a **safety veto cleared**, not a Gauntlet experience win.

## Experience review and unanswered questions

The visual hypothesis is that an opt-in physical crusher should feel like a coherent part of a dangerous climb *before* it strikes. Its matte installed state should support navigation and its angular pose should distinguish danger even without color. This is **unverified** against normal-speed whole game video. Need watch genuine desktop 960×600 and portrait 390×844 captures for the actual guardian-cap simultaneous encounter, all ascent and movement, and honest outcome/restart at normal speed, paired to the same seed/quality frozen-source footage by actual encounter state, not matching elapsed seconds.

The likely remaining issues are whether the machine actually sits in the camera's visible band with the climber and guardian, whether its open idle silhouette overwhelms other details on a small screen, whether the source guardian-shutter approaches create unfair hits or frustrating repetition, and whether the physical mechanism survives kill/restart and reduced-motion accessibly. Also independently inspect replay, hardware frame tails and memory. Independent fresh-context browser/critic environment returned `NOT_FOUND: Tunnel-client has not been seen for 300 seconds`; therefore no independent full-motion votes are available. **LOOKS 0/5, FEELS 0/5, PLAYS 0/5, meaning missing votes. Quality remains NOT EVALUATED.**

**Rollback:** revert only the playable stage and its source safety tests on PR68 if footage, accessibility, or supported-device performance shows a regression; do not move the baseline or alter the active PR58. PR68 stays open and draft, with no merge or deployment.
