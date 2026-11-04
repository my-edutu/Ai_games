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

## Experience review and unanswered questions

The visual hypothesis is that an opt-in physical crusher should feel like a coherent part of a dangerous climb *before* it strikes. Its matte installed state should support navigation and its angular pose should distinguish danger even without color. This is **unverified** against normal-speed whole game video. Need watch genuine desktop 960×600 and portrait 390×844 captures for the actual guardian-cap simultaneous encounter, all ascent and movement, and honest outcome/restart at normal speed, paired to the same seed/quality frozen-source footage by actual encounter state, not matching elapsed seconds.

The likely remaining issues are whether the machine actually sits in the camera's visible band with the climber and guardian, whether its open idle silhouette overwhelms other details on a small screen, whether the source guardian-shutter approaches create unfair hits or frustrating repetition, and whether the physical mechanism survives kill/restart and reduced-motion accessibly. Also independently inspect replay, hardware frame tails and memory. Independent fresh-context browser/critic environment returned `NOT_FOUND: Tunnel-client has not been seen for 300 seconds`; therefore no independent full-motion votes are available. **LOOKS 0/5, FEELS 0/5, PLAYS 0/5, meaning missing votes. Quality remains NOT EVALUATED.**

**Rollback:** revert only the playable stage and its source safety tests on PR68 if footage, accessibility, or supported-device performance shows a regression; do not move the baseline or alter the active PR58. PR68 stays open and draft, with no merge or deployment.
