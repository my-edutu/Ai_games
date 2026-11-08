# AI Dungeon — Session 8: unified camera / foreground visibility handoff

**Review status:** CANDIDATE IMPLEMENTED; **MOTION ACCEPTANCE NOT ACHIEVED**.  
**Isolated draft:** [PR #69](https://github.com/my-edutu/Ai_games/pull/69), `feat/dungeon-unified-adventure-camera-20261108`.  
**Development source:** `f6bbfb3eb5f7b18a5b0e5d786d354724896883cb`; pinned G088 baseline `281735d0910c6b2443648af976003d50412ee324`.  
**No main changes, merge, deployment, authoritative simulation edit or HUD/character/architecture replacement.**

## 1. Exact changes

1. New pure module `adventure-camera-director.js`: single, bounded, read-only state machine for manual (0) → journey (10) → portal (35) → approach (45) → combat (60) → recovery (72) → earned counter (80) → defeat (90) → real cast release (95) → imminent Warden warning (100). The ordering denotes priorities, **not** synthetic gameplay modes or forced events.
2. Existing shot continuity and real-body/scene physical-occlusion planners now run beneath this coordinator. Only *automatic cinematic* framing can use an alternative physical orbit. Tactical, chase, manual-follow and reduced-motion modes cannot be stolen by the cinematographer.
3. Warning entry opens FOV immediately and accelerates physical pan / aim within a bounded step; release receives restrained urgency, recovery narrows gradually; authority-backed warning cells remain in the existing final critical-subject fit gate.
4. Floor/run and manual handover clear stale continuity and orbit caches. The state machine retains constant-size mode/counter state and never writes `DungeonRuntime`, damage, units, pathfinding or save formats.
5. Foreground recession has been **redesigned conditionally** from genuine parent motion evidence. With real render-frame separation over 250 ms, the existing living-body cutaway resolves in one frame instead of slowly dropping / raising original stone over multiple seconds. At normal frame delivery its original eased behavior remains; reduced motion is immediate. Exact measured selection is exposed as `foregroundRecessionPolicy`. The source geometry and physical scene remain intact.

## 2. Real earlier motion reviewed — not candidate-after proof

Inspected the **2026-11-08 00:03 UTC parent-source** real `DungeonRuntime.step()` → Chromium WebGL browser capture artifacts from [workflow 42427983542](https://github.com/my-edutu/Ai_games/actions/runs/42427983542), source `c51342c0253435325d6a46e4d9f02b337a2ad138`, at desktop and mobile viewports.

- [Desktop source footage artifact](https://github.com/my-edutu/Ai_games/actions/runs/42427983542/artifacts/13596960613): 378 decoded image frames, video timestamps 2.608–570.711 seconds, median video-frame separation 1.681 seconds, 95th percentile 4.005 seconds.
- [Mobile source footage artifact](https://github.com/my-edutu/Ai_games/actions/runs/42427983542/artifacts/13596249181): 253 decoded frames, timestamps 0.057–511.327 seconds, median separation 1.644 seconds, 95th percentile 5.784 seconds.
- Both video files **end prematurely** in the decoder and originate from an unsuccessful full-journey workflow. They document **sparse recorded frame delivery, not measured GPU or renderer FPS**, and are **not** sufficient to certify a smooth camera or a recession transition.
- Genuine sequence review shows busy Warden court columns and a very wide ↔ close shot rhythm. A single foreground visibility-ray score fails to explain the real player experience; a 0.25-second stone return rendered across multiple multi-second frames is unacceptable. This evidence motivates the conditional instant-cutaway policy but **does not prove the new policy's visual quality**.

## 3. Real simulated sequence (not a rendered film)

The test `dungeon-adventure-camera-sequence.test.cjs` uses **unmodified production DungeonRuntime.step** (no staged teleport, healing, damage, warnings or scripted death), real `planEncounterFrame`, real `planCinematicShot` and the new coordinator.

Four declared seeds: `gauntlet-corpus-v1-0`, `camera-warden-1`, `camera-warden-2`, `camera-warden-3`. **5,600 genuine authority ticks** total, covering journey, combat, approach, warning, real cast release, recovered exposure, earned counter, floor progress, and natural defeat in two seeds. The snapshots remain unchanged; explicit checks reject fake or stale warning/release/counter and accidental camera control in manual and tactical modes.

Local **exact-source reconstruction**: prior GitHub Actions review-workspace archive plus the parent source's one-commit renderer-preflight delta and this isolated branch's camera/test changes. Local file hashes were checked against GitHub for all edited camera/environment/source files.

- `npm run build` — **PASS**
- `npm run dungeon:test` — **341 / 341 PASS**
- `node --test tests/foundation/dungeon-*.test.cjs` — **551 / 551 PASS**
- Original two legacy *source-pattern* assertions after the director refactor were adapted within app integration and no foundational test was deleted or weakened.

These are **local Node results**, not GitHub CI approval. No new child-branch GitHub Actions run was available at time of handoff.

## 4. Remaining mandatory acceptance

**NOT APPROVED:** after-change full-game Chromium/WebGL motion capture could not be executed in the container: even a local development server was rejected by Chromium with `net::ERR_BLOCKED_BY_ADMINISTRATOR`; the interactive coding tunnel was unavailable. Prior screenshots/video are **source-only**. Do not claim a new moving WebGL, foreground recession comparison, manual camera UI or mobile 390px capture is verified.

Run a matched *authentic* before/after recorded replay from the same seed and tick stream on the **final rebased PR #69 code**, desktop 1440×832 and mobile 390×844, including (a) entry/traversal, (b) normal contact, (c) complete Warden warning cells, (d) true strike, (e) genuine recovery/counter, (f) all-party defeat, (g) natural restart and (h) manual follow/tactical/chase view. Observe actual canvas frames, not overlaid HUD/ray test. Reject visible stone popping, giant stone rising, cropped warning cells, long dead-air camera pans, sword/body crops, collision-through-walls, subject-hunting/whip-pans and any stolen manual view. Report frame/capture cadence separately.

**Parallel integration:** PR #49 continued changing while the Session 8 branch was developed; PR #69 currently reports non-mergeable. Reconcile only its camera integration against the latest parent **after** other ownership sessions stabilize. Never force push, merge, modify main or overwrite their work.

**Decision:** keep the fast normal-frame recession **only as an experimental fallback**, reject slow multi-second visual sinking/rising for sparse frame delivery, and withhold production acceptance until matching moving WebGL evidence verifies both cases.
