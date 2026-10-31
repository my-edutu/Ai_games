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
