# Infinite Tower Climb — real short-body cap route and recovered original gameplay (PR68)

**2026-11-07 · Stage P0 EVIDENCE + GAME-LOOP TRUTH · verdict NOT EVALUATED**

## Largest verified source route defect

The shipped 20 Hz authority already permits a legal short climber (5,000 half-height) to win the opt-in guardian floor by **actual grounded whole-body movement past the source cap threshold**, even if its center is below the old vertical `exitY`. Ordinary unflagged climbers can also reach a vertical finish by leaping from the cap. However, `analyzeTowerReachability` judged a route valid **only** when the center at rest on a platform cleared `exitY`. As a consequence a real physical route was wrongly rejected as `invalid initial chunk: exit-unreachable` before any gameplay, as independently evidenced by original tests 236/237 at [exact-head quality run 42383456147](https://github.com/my-edutu/Ai_games/actions/runs/42383456147). This is not a cosmetic issue or a fabricated success.

The solver now accepts the real final cap as a goal **only** when the supported body's center plus the actual fixed-step movement envelope can legally jump above exitY, or when the opted-in guardian cap admits a whole-body clearance inside its actual platform width. Earlier p5/p6 are not falsely declared a guardian victory. This does not auto-defeat a boss, bypass a seal, grant floor nine, or mutate authoritative game physics, seed or the frozen baseline.

- Source implementation: [f5e11c8](https://github.com/my-edutu/Ai_games/commit/f5e11c8cb55d7a35e23143e6a5c768e016cce09f) in `games/infinite-tower-climb/src/generation/solver.ts`.
- Existing arena regression was corrected to position its test player at **real full-body clearance**, not the earlier unlock-only plane: [44c0b5b](https://github.com/my-edutu/Ai_games/commit/44c0b5bf3ecf58833a08110948387affe4d28ae5).
- A contradictory under-cap test was corrected to actually perform the claimed **non-rising** movement (rather than requesting a jump), and a new regression requires the short legal player's route to terminate at the genuine cap in both opt-in and ordinary geometry: [2f4dd70](https://github.com/my-edutu/Ai_games/commit/2f4dd704d275acec6a61fe05f1c9b8df984bf879).

## First recovered real film / limitations

The previously reported queued [nine-job run 42382932723](https://github.com/my-edutu/Ai_games/actions/runs/42382932723) actually **completed successfully** at candidate source **7a97b054f12a8548a1c1fb01cdaf538aea65d534**, with all nine jobs and a tenth event-pair job successful. Artifacts include 8 paired original-browser capture ZIPs with 16 desktop/portrait `live.webm` files (960×600 and 390×844) plus a source-event-pair manifest. The baseline remained **1731b380851162741761c5569e2bc152a0869ca9**. This is real recovered evidence, **not exact-current-head evidence**.

I retrieved the baseline/candidate danger ZIPs and the event-pair ZIP. Native WebMs decode, with durations **baseline desktop 70.72 s / portrait 70.96 s** and **candidate desktop 71.72 s / portrait 73.40 s**. Extracted 5-second frame contact sheets show the actual original 3D characters, platforms, combat enemies, camera and outcome cards — not merely a render fixture. The candidate event index also reports in one original-source floor-eight episode at ticks **441 guardian zero-HP / 443 supported approach / 451 earned 8→9 handoff**, with source-recorded physical threshold at 451, followed by a floor-ten result and run-token restart. The portrait has its own genuine guardian and onward sequence. Baseline cannot be assumed to have the same earned sequence: paired index records no baseline guardian defeat in its sampled comparison. These events are source truth only, **not evidence that the full causal chain appeared legibly in every film frame**.

**Most consequential visible footage weakness in 5-second frame sampling:** the candidate portrait changes from a mechanically dense, distant 8th-floor exterior to a close purple 9th-floor view between sampled ~25s and ~30s without a clearly visible continuous walking-through-the-open-door beat. Actor scale also varies sharply between exterior and interior scenes. This is a frame-sampled diagnosis, NOT a certified normal-speed full-motion visual review or a measured camera regression. No assertion of parity or improvement over ASTRO BOT, Jusant or Returnal is justified.

The [source event-pair manifest from run 42382932723](https://github.com/my-edutu/Ai_games/actions/runs/42382932723) verifies 16 recording references and 8 source-story comparisons but explicitly marks **`videoTimecodesCalibrated=false`, `fullMotionPaired=false`, `independentlyReviewed=false`**, all with verdict NOT EVALUATED. Some baseline observer ticks are missing and event timestamps are not certified WebM timecodes. No matched blind A/B film has been accepted.

## Test and safety review

Latest fully observed parent [quality run 42383456147](https://github.com/my-edutu/Ai_games/actions/runs/42383456147) built successfully but reported **1174/1190 tests passing, 16 failures**. Some failures correspond to the route and stale gateway/under-cap regressions addressed here; others remain in renderer imports, scene fixtures, source-gateway string assertions and geometry/camera. The new source and test commits are not a verified green original-runtime outcome merely because GitHub accepted the file writes. Local development workspace returned `Tunnel-client has not been seen for 300 seconds`; no local authoritative Node/Chromium campaign could run. At publication, new exact-head workflow results remain to be checked, and any remaining failures are vetoes.

**Design/replay:** Only Tower solver and Tower original-runtime test files changed; no source RNG consumption, geometry generation, physics tick, boss state, fallback credit, render snapshot or event contract was altered. The compiler and unchanged 3,200-tick campaigns must still be run at the exact SHA before claiming compatibility. Existing baseline remains frozen. No PR58 files were changed.

## Precise next high-impact action

1. Read exact-current SHA CI failure logs, fix remaining real P0 source defects without weakening genuine geometry/event requirements, and rerun the unchanged two source-witness 3,200-tick campaigns.
2. Independently watch each **native normal-speed** original WebM at desktop and portrait, locate actual guardian death, crusher tell, physical gate opening, grounded doorway crossing, floor-nine climb, result and restart, and calibrate shared video-timecode/event pairs (the raw source-index timestamps are not already video timestamps).
3. Fix the largest reproduced full-motion traversal/shot defect before P1. Capture **current implementation SHA** and frozen baseline at identical seed/tier/viewport; native-device p50/p95/p99/memory and 5 genuine fresh blind critics per LOOKS, FEELS, PLAYS remain pending.

**Acceptance:** P0 OPEN; LOOKS 0/5, FEELS 0/5, PLAYS 0/5; native-device performance NOT EVALUATED; leading transformation verdict **NOT EVALUATED**. Draft PR68 retained; no merge, deployment, force-push, PR58 rewrite or baseline SHA move.
