# Infinite Tower Climb — Gauntlet 22: authentic normal-speed motion evidence

Source implementation: [fb80283](https://github.com/my-edutu/Ai_games/commit/fb80283b0f0ae7912954921eace69e16a3fa19e7); [draft PR #58](https://github.com/my-edutu/Ai_games/pull/58).

## Actual observed failure

Directly inspected the authentic Gauntlet 21 960×600 desktop GPU screenshot downloaded from [Guardian Evidence 41193582658](https://github.com/my-edutu/Ai_games/actions/runs/41193582658), artifact 13039053724, tick258 checksum 87440ff6. The translucent deck still crosses the guardian crown and hammer. A pinned held state, even with eight renderer submissions, cannot prove smooth normal-speed action, recovery, continuous climbing or intended-device FPS.

Previously completed Autonomous Games CI 41193585607 at source 07c8f517 was FAILURE. Newer [CI 41194106951](https://github.com/my-edutu/Ai_games/actions/runs/41194106951) at source 19a2f152 was SUCCESS. These different sources are not conflated.

## Implemented this iteration

- scripts/tower-motion-evidence.cjs: a bounded evidence assessor that rejects frozen authoritative ticks/checksums, frozen WebGL pixels, missing renderer interval measurements, short capture, errors and context loss. It explicitly cannot award GPU FPS.
- tests/phase3/tower-motion-evidence.test.cjs: five behavioral cases. A wrong baseline implementation failed 5/5; the implemented assessor passed 5/5 in local Node.
- tests/browser/tower-live-motion.spec.cjs: real live host without snapshot interception, pose rewriting, virtual time or fast-forward; normal-time browser WebM recording, WebGL canvas-only PNG pixel hashes, full composition PNGs, and sampled tick/checksum/player/renderer diagnostic traces. Desktop 960×600 and portrait 390×844.
- .github/workflows/tower-motion-evidence.yml: separate source-bound floor-0 climbing and floor-8 guardian runs, retaining raw video/PNG/JSON and failed test artifacts.

No production authority, replay, collision, character, world or gameplay renderer files changed. This iteration constructs the independent capture evidence, not proof of animation quality.

## Verification and remaining gates

Local focused red 0/5 against a deliberately incorrect stub, green 5/5 after implementation. Node syntax PASS; YAML structural parse PASS. The local repo cannot be cloned from this container because github.com DNS is unavailable, and independent critic/subagent workspace returned disconnected-tunnel. This is explicitly SELF-REVIEW.

[Tower Continuous Motion Evidence 41197562691](https://github.com/my-edutu/Ai_games/actions/runs/41197562691), [Tower Realism 41197562624](https://github.com/my-edutu/Ai_games/actions/runs/41197562624) and [Autonomous Games CI 41197565717](https://github.com/my-edutu/Ai_games/actions/runs/41197565717) are separately tracked and cannot be awarded a PASS while pending. Even successful software-renderer clips need direct visual inspection; renderer submission intervals are not presented GPU frames or actual device FPS.

**Scoped status: local capture contracts PASS; real browser motion evidence PENDING. Overall Gauntlet NOT ACHIEVED.** No merge, deployment or force push.

Next: download genuine WebM/PNG/JSON for all climb and guardian views, check actual combat windup/contact/recovery and jump/landing continuity, then independently compare full-speed video to official Jusant climbing/environment and ASTRO BOT Rising Heat action readability. Record first concrete failure and fix it. Intended-device frame time and long soak remain open.

## Post-workflow evidence and real failure (same Gauntlet 22)

The first workflow [41197562691](https://github.com/my-edutu/Ai_games/actions/runs/41197562691) **FAILED**; this is a real finding, not an equivalent green run. Both matrix jobs uploaded actual unmodified videos, canvas/full WebGL PNGs and JSON at artifacts [13040439057](https://github.com/my-edutu/Ai_games/actions/runs/41197562691/artifacts/13040439057) for floor 0 and [13041338972](https://github.com/my-edutu/Ai_games/actions/runs/41197562691/artifacts/13041338972) for floor 8. Downloaded both ZIP archives and inspected all four original timestamped browser captures and actual video strip frames.

Source-bound findings: floor-0 portrait captured 67.3 seconds, advancing ticks and changed WebGL pixels, scoped PASS; guardian desktop captured 90.6 seconds, likewise scoped PASS. Floor-0 desktop captured 124.5 seconds and floor-8 portrait 59.6 seconds; both **FAIL** in first attempt because the assessor incorrectly required monotonically increasing ticks across an authentic run-token change/death-and-restart. Floor-0 desktop captured a real death/intermission near tick 1444 and then restarted at tick 14. Floor-8 portrait likewise shows real intermission near tick 3291 and new run near tick 204; final tick 506 is less than the initial tick 2654, an expected across-run reset. Neither failure was hidden or misclassified as the game stopping.

The original video frames include changing floor-0 traversal and a floor-8 scene where the guardian and climber remain in similar positions for a prolonged interval. It is **not proven** whether a combat deadlock occurs without complete state/action review. Browser recordings were in CI software GL: measured renderer submission intervals reached p95 of ~6.94 seconds on the floor-0 desktop sample. This is an environment-specific smoothness concern, **not** intended-device presented-frame FPS, and no hardware FPS gate is awarded.

### Correction and red/green

[Source fix 798433bd](https://github.com/my-edutu/Ai_games/commit/798433bd6bfe3fbde42648db23a37fa609feea8b) teaches the assessor to distinguish a legitimate public `runToken` change from an invalid tick reversal *within* a run. It accumulates only within-run forward tick changes, records the number of run transitions, requires each observation to carry the public run token, and explicitly states that skipped transition frames are not visual proof of a rendered death/intermission/restart. Two new targeted regressions FAILED on the original assessor; the fixed 8-case logical suite PASSED all 8. Node syntax checks passed. No gameplay rules/renderer physics/AI changed.

Fresh-source [Tower Continuous Motion Evidence 41198219528](https://github.com/my-edutu/Ai_games/actions/runs/41198219528), [Tower Realism 41198219667](https://github.com/my-edutu/Ai_games/actions/runs/41198219667) and [Autonomous Games CI 41198223073](https://github.com/my-edutu/Ai_games/actions/runs/41198223073) must be independently verified before a pass. Prior fb80283 Tower Realism 41197562624 passed **592/592**, host `ok:true`. Independent critic tools were disconnected, so this is explicitly SELF-REVIEW.

**Overall gate: OPEN / NOT ACHIEVED.** Next: verify fresh source runs, inspect actual replay video for guardian attacks, movement transitions and full recovery, then acquire intended-device p50/p95/p99 frame times and compare against official Jusant and ASTRO BOT footage.
