# Infinite Tower Climb PR68 — moving-deck launch continuity (P0 OPEN)

**2026-11-07 · NOT EVALUATED.** This is a playable physics increment toward P0 moving-platform truth, **not** phase acceptance or evidence of a better commercial game. The frozen baseline remains `1731b380851162741761c5569e2bc152a0869ca9`; PR58 remains untouched; PR68 is still draft.

## Starting evidence and primary source defect

Inspected PR68 HEAD `5f5a2eb5b64e94b2f09a35652249a17b87a8f2f7`, AGENTS.md, [Gauntlet design](../superpowers/specs/2026-11-01-infinite-tower-transformation-gauntlet-design.md), GAUNTLET.md, prior physics regressions, generation and exact 20Hz source. Actual generated moving deck on floor 7 is **horizontal**, at 2,500 source units per tick. The existing physics carries a grounded climber by the observed platform displacement at the beginning of a simulation step. If it jumps that tick, its resulting airborne velocity **does not inherit** the moving support's velocity: a character traverses at +2,500 for takeoff but can immediately lose the entire +2,500 on the next tick. This causes a non-physical speed discontinuity on a real gameplay traversal path. The defect is verified by source inspection, **not** current-source footage.

## Original gameplay change

- `games/infinite-tower-climb/src/physics/step.ts` transfers the deck's **observed tick-to-tick horizontal displacement** to an actual grounded jump's X velocity. That displacement is **substituted** for the same-tick standing carry, not added on top, so a stationary hero on a +2,500/tick deck moves +2,500 on takeoff, not +5,000. The inherited velocity persists into the next airborne step under ordinary acceleration and braking. The real jump, vertical physics, stamina, hazards, wall/landing solver and source event contract remain authoritative.
- The path requires **both** `guardianArenaHazards` and `guardianSecondWind`, plus an actual grounded jump on a source-observed horizontal moving platform. Idle riding, static platforms, historical/unflagged replay and PR58 are unchanged. Dash remains limited to the existing source speed rather than compounding a free impulse.
- `tests/phase2/tower-live-moving-launch-inertia.test.cjs` includes real source-integration fixtures for rightward and leftward moving jumps, sustained ordinary ride, frozen historical behaviour and no fictional momentum on a static deck. It was committed **before** implementation to document the desired red case.

**Code commits:** [3318688d](https://github.com/my-edutu/Ai_games/commit/3318688d3fd4e0ec4b505ff16a6414a3c03f4ae5) (source-runtime regressions), [3177a74f](https://github.com/my-edutu/Ai_games/commit/3177a74f813f6549f528ccead60a5b975adac0c7) (implementation).

## Evidence; do not mistake arithmetic for gameplay

- A local Node 22 isolated equivalent of the takeoff arithmetic passed **13 invariant assertions**, including right/left/still platforms, ordinary ride, historical behaviour, controlled input and dash. The standalone CJS script passed `node --check`. **It is not the imported repository runtime.**
- The five committed *original-runtime* fixtures, `npm run build`, `npm run test:tower:phase2`, both unchanged 3,200-tick guardian campaigns and live browser/headless source game **were not executed**. The live coding tunnel returns `Tunnel-client has not been seen for 300 seconds`. The local container cannot resolve `github.com`, and contains no complete original checkout or Chromium game capture.
- [Current-source capture](https://github.com/my-edutu/Ai_games/actions/runs/42368724802) and [quality checks](https://github.com/my-edutu/Ai_games/actions/runs/42368724834) are **queued**, with no footage, original runtime output or quality verdict. Earlier [nine-job source capture](https://github.com/my-edutu/Ai_games/actions/runs/42364513452) contains nine queued jobs; each has no assigned runner, and no artifact was available at inspection. GitHub REST does not establish why runners have not been assigned.
- The most important **previously observed** film defect remains a tiny/inconsistently scaled climber and no legible, continuous guardian defeat → crusher survival → physically opened cap passage → grounded crossing → floor-nine continuation → real outcome/restart. No new normal-speed film was available to verify or refute it.
- Blind independent reviewers: **LOOKS 0/5, FEELS 0/5, PLAYS 0/5**. Actual supported-device frame-time p50/p95/p99, memory and accessibility: **NOT EVALUATED**.

## Spec and engineering review

**Spec pass (source intent only):** This restores a coherent, source-owned moving-deck launch trajectory instead of inventing a teleport, secret AI boost or renderer-only tween. It is an opt-in physical change on the game's actual moving platform path; it does not complete P0 or transform the game on its own.

**Quality concerns:** The added velocity can move a jump farther on successive ticks and change autonomous landing decisions; verify that the AI brakes safely before narrow, hazardous and guardian ledges and that swept wall/top contacts are still correct. Check both deck directions and moving-platform camera motion at normal speed. The change preserves safe-integer velocities and caps inherited launch speed at the existing `dashSpeed`, but has **no source runtime or device performance proof**. It adds no external data, privacy scope, HUD noise or unsupported visual claims.

**Safety/rollback:** No merge/deploy/force-push, no baseline movement, no PR draft-state change, no PR58 changes. If the original runtime finds regression, revert the opt-in launch substitution with an ordinary forward commit on PR68 only after inspecting latest HEAD.

## Required next P0 decision

Reconnect an executable Node22+Chromium checkout or GitHub Actions hosted runner. Run `npm run test:tower:phase2` **first**, including the new five original-runtime moving-launch cases and earlier landing/wall tests. Run two unchanged 3,200-tick guardian/crusher-through-outcome/restart campaigns. Capture >=60s real normal-speed matched baseline/candidate desktop 960×600 and portrait 390×844 from exact source SHAs and align original gameplay events; inspect whether deck launch continuity, actor scale and cap crossing are actually visible and safe. Reopen P0 gameplay/visual subarea on any regression; only advance once P0's source and film truth gates pass. Never grant a quality score from this report.
