# Infinite Tower Climb — source-bound exterior stage and native capture recovery

**2026-11-02 · [PR #68](https://github.com/my-edutu/Ai_games/pull/68) · SAME transformation remains OPEN · quality: NOT EVALUATED.**
The frozen baseline remains `1731b380851162741761c5569e2bc152a0869ca9`. Candidate has **not** been promoted. This document is a technical and source-evidence record, **not an independent blind video quality review**.

## First unmet whole-experience requirement: fair, actual normal-speed A/B

Inspecting the failed [source-pinned capture workflow 41373794124](https://github.com/my-edutu/Ai_games/actions/runs/41373794124) exposed a concrete blocker. All **six** baseline/candidate ascent, danger and outcome jobs failed before browser gameplay with: `Cannot use({ video }) in a describe group, because it forces a new worker.` Earlier documentation called the 88b6fa6 native-portrait method implemented, but there was **no valid post-change native video**. Treat this as an evidence pipeline failure, not as a gameplay improvement, and do not infer the new camera is better from missing clips.

In [`c75ee5c`](https://github.com/my-edutu/Ai_games/commit/c75ee5c537239fd039d7833e6fda6eb979208bfe), the actual Playwright test now creates a dedicated **960×600 or 390×844 browser context with `recordVideo` before first page creation**. This avoids forbidden describe-scoped `test.use({video})` while preserving true unmodified 20 Hz seeded host play and identical capture harness for the frozen baseline and candidate. Each context closes before WebM export. No simulation, game content or baseline SHA is changed by recorder repair. Confirm with exact-source WebM, `ffprobe` native dimensions, >=60s continuity and game state timing; until then this remains unverified.

## Actual 3D presentation: protect the whole ascent, not only the boss

Previous source-pinned normal-speed captures [41367442477](https://github.com/my-edutu/Ai_games/actions/runs/41367442477) measured **mobile climber NDC x=2.01, 1.68, 1.25**, meaning the viewer lost the protagonist while navigating real floors. The previous actor-edge rate correction is still unassessed. The follow view also combined distant **actual landing targets and threats in Cartesian world X/Z**, even when source positions lay across the cylindrical tower. That can pull the intended focus **through opaque tower stone**, hiding route context despite a safe camera orbit.

[`e85bad7`](https://github.com/my-edutu/Ai_games/commit/e85bad74205a2683cb3a5256c0a9f24aacc877da) changes the **real renderer's route/threat composition** to interpolate direction on the shortest angular route around the tower and interpolate actual radial/height coordinates. The nearby HP-driven guardian and staged gate remain governed by their observed encounter framing; the player physics, autonomous intent, seed, combat, enemy health, result lifecycle and replay authority are unchanged. This is a cohesive continuation of the ascent→guardian→clearance experience, not a test-count milestone.

The live renderer diagnostics now expose `actorCamera.ndc`, `inPicture`, `inSafeFrame`, `cameraAzimuth`, and `focusRadius` in **all running scenes**, not only while a guardian is visible. The unmodified normal-speed capture stores per-sample `observedActor` and offscreen/unsafe counts, allowing source-pinned detection of dropped hero moments. The projection is geometric evidence only: it cannot certify that pixels are unoccluded, that movement is comfortable, or that video is attractive. A camera-source regression test checks exterior focus, short angular seam and immutable destination.

## Risk, required real-play review and verification

The [new exact-head capture](https://github.com/my-edutu/Ai_games/actions/runs/41379083377) was **pending** and [new safety CI](https://github.com/my-edutu/Ai_games/actions/runs/41379083370) **in progress** at final inspection. Prior technical CI [41374114366](https://github.com/my-edutu/Ai_games/actions/runs/41374114366) succeeded on an older head only; it does not validate these changes or experience.

**Primary unsolved question:** Does the full 60+s mobile/desktop camera keep both real climber and next usable deck on screen through launch, airborne direction change, guardian approach, enemy damage, physical gate release and genuine result/restart, without violent spins or motion sickness? Use aligned **real source tick / floor / enemy HP / intent**, not merely similar wall-time seconds, when comparing matched seed and native-frame A/B. Reject and revise this focus change if complete action or camera comfort worsens. The frozen baseline's one-tick result frequently escapes software-GL capture; no baseline edit or fabricated terminal is authorized.

The independent worker/browser workspace connector returned **NOT_FOUND (tunnel client disconnected over 300 seconds)**, preventing local full-motion review and separate fresh-context critics this execution. No ultracode access was established. Hence **LOOKS 0/5, FEELS 0/5, PLAYS 0/5** genuinely independent blind randomized judgments, no accepted matched full-cycle video and no supported-device p50/p95/p99 frame-time/memory numbers. CI is a safety veto, not a quality score. **NOT EVALUATED**.

**Rollback and safety:** Revert e85bad7 route focus if full-motion camera causality, readability or accessibility regresses. Revert c75ee5c video harness if actual recordings are malformed, while preserving source-pinned failed-job logs. No force push, PR58 edit, merge, deployment or schedule alteration.
