# PR68 P0 — source-matched 3D seam and complete catalogue runner veto (13 November 2026)

**Active stage:** P0 EVIDENCE + GAME-LOOP TRUTH — **OPEN**. **Leading transformation verdict: NOT EVALUATED.** Frozen baseline is exactly `1731b380851162741761c5569e2bc152a0869ca9`, unchanged. PR68 remains draft on PR58.

## Original real-game inspection

Inspected immutable candidate `c6c75092efb9e6a8cf8d0b01896b72823233a191` from [nine-job gameplay evidence #43351994917](https://github.com/my-edutu/Ai_games/actions/runs/43351994917) (eight actual baseline/candidate movie capture jobs succeeded; the ninth *pair-source-events* gate failed). Downloaded [original candidate danger artifact 14004487385](https://github.com/my-edutu/Ai_games/actions/runs/43351994917/artifacts/14004487385), extracted **unaltered** desktop 960×600 and portrait 390×844 WebMs and independently sampled consecutive native frames at 0.4s intervals from 22.0–30.8s. These are actual source films, not staged renders or generated frames. Desktop original duration is 72.20s.

**Most important footage defect:** both viewports **still switch the bronze original Floor8 roof/environment to a purple Floor9 stage between ~24.4–25.2s** with no demonstrably continuous full-body passage through the same real opened door. Strict native crossing approval remains **0/2**. The climber does proceed visibly on Floor9, but the floor change reads as a scene replacement, not a physical transition. Do not award LOOKS/FEELS/PLAYS.

**More precise source/Three discrepancy:** original source HP0 guardian earned the Floor8→9 crossing at tick451. In desktop captured sidecar `motion.json`, first sampled Floor9 tick465 reports retained real original GPU cap and arch `guardianGateRetained=true`, `originalBronzeDeckOpacity=0.94`, and actual roof support; by tick485 the retained arch/cap has been removed, while the passage diagnostics still report `stage=handoff`. Portrait first sampled Floor9 tick460 reports passage `stage=handoff` but **no** `observedOriginalGpuGatewayRetention`; at tick485 both remain handoff without the old cap. Thus a scene/camera/source retirement and composition mismatch persists **even where desktop GPU retention briefly works**. A success-valued source crossing and 3D diagnostic by themselves cannot certify video.

## Verifiable quality runner blocker and implementation

[Exact-head quality run 43353852391](https://github.com/my-edutu/Ai_games/actions/runs/43353852391) at `49e398f9938c8d80704021236455a5e4c2a0bcbe` was externally shut down after test **#616** in the formerly combined catalogue runner; logs show a runner shutdown signal rather than a reported assertion failure. The preceding attempt to run six phases sequentially in one job did not resolve worker termination. This is neither green CI nor source-game failure.

[Implementation `d846ba7f800864e6e3c42e857c02093c0478b6dd`](https://github.com/my-edutu/Ai_games/commit/d846ba7f800864e6e3c42e857c02093c0478b6dd) separates **every existing file** covered by `npm test` into nine bounded disjoint catalogue jobs: all files in foundation/phase2/phase4/phase5/phase6, and four exhaustive modulo-index partitions of phase3's sorted files. Each job installs exact-head dependencies, runs the real TypeScript build and actual Node tests under a bounded process. Any empty partition, missing phase, failing test, timeout or terminated job fails the workflow. The existing original guardian source-replay, authority and desktop/phone browser checks are retained separately in `integrity-not-quality`. **No games, tests, acceptance rules or passing criteria were weakened.**

New [quality workflow #43356084652](https://github.com/my-edutu/Ai_games/actions/runs/43356084652) was **queued** immediately after this workflow change. It is NOT counted green, and no new gameplay film was requested for an unchanged production runtime. The capture remains pinned to the real earlier `c6c750...` source.

## Acceptance debt and next highest-impact action

1. Inspect the new CI job outcomes and fix specific genuine failures or external runner resource constraints; do **not** accept partial tests.
2. Resume production-game P0 on real source P0 geometry/camera, not further arbitrary time-based old-gateway patches: ensure **the same original bronze cap and its real separate open arch** survive in both desktop and portrait first filmed Floor9 frames, remain in camera with the player, and retire through a visually coherent physical distance/occlusion transition; correct first-frame GPU/foreground/horizon composition. Keep authoritative fixed-step and source truth unchanged.
3. Repeat exact-SHA nine-job matched normal-speed 60+s baseline/candidate campaign; pair native media clock, browser/render and source events, verify full floor-nine onward and result/restart, and resolve baseline outcome-native clock veto. Gate remains **NOT EVALUATED** until 2/2 crossing and complete source-native film acceptance.
4. Independent randomized original-film critics: **LOOKS 0/5, FEELS 0/5, PLAYS 0/5**. Actual supported-device p50/p95/p99 and memory: **NOT EVALUATED**. CI is only a veto, never a transformation score.

**Safety:** Same PR68 draft branch, frozen baseline SHA unchanged; no PR58 edit, no other game edits, no merge, deployment, force-push, or draft promotion.
