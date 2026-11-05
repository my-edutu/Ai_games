# Infinite Tower PR68 — source-visible in-flight bolt vs closing shutter

**Date:** 2026-11-05  
**PR:** [draft #68](https://github.com/my-edutu/Ai_games/pull/68), branch `feat/tower-transformation-gauntlet-20261101`  
**Frozen comparison baseline:** `1731b380851162741761c5569e2bc152a0869ca9` — **unchanged**  
**Playable source changes:** `44d5ec47`, `5f68fc25`, `450e90c8`; deterministic regression test `c9d9abbd`  
**Experience verdict:** **NOT EVALUATED**, not a Gauntlet round or AAA claim.

## Actual systemic problem

The genuine guardian-cap fight already has an announced 12-tick physical crusher and an earnable combat counter. An earlier change resolved last-beat *guardian telegraph* vs crusher arbitration. But the **already-fired, live incoming projectile** branch returned *before* either the active trap or publicly charging crusher was considered. In a combined encounter the autonomous climber could therefore jump from a shutter-safe ground route into the closing jaws solely because it saw an incoming bolt, even if the published source countdown expired earlier. This was a source/presentation contradiction too: a `evading-projectile` intent denied the existing real 3D hazard/pose/audio reaction its appropriate priority.

This is a **code-identified hazard**, not an independently filmed before/after regression demonstration. No invented outcome or footage is claimed.

## Connected playable change

1. The **fully opted-in** guardian's actual cap checks the public incoming-projectile lane and the already-published crusher countdown together. It compares current projectile horizontal speed/position/body width with the physical shutter's 1–4 tick countdown. This is a bounded present-state deadline calculation, not a simulation of hidden future events.
2. When the real crusher closes first or simultaneously, the controller selects its existing body-safe supported-deck exit; if already trapped inside its collider and no route is possible, it may commit to an **ordinary** source-legal jump. A doomed late lateral route is vetoed; the impending projectile keeps priority when the bolt arrives sooner or a genuinely clear shutter escape does not exist.
3. The already-existing `evading-hazard` intent remains the single source for authentic jaw urgency, stage/camera response, defensive climber movement/poses and optional audible warning. No new HUD, free attack, immunity, collision, camera cut, geometry, light, or hidden information.
4. Frozen historical policy and unflagged arenas do not receive the new arbitration; live source state remains immutable and choices deterministic.

Files: `games/infinite-tower-climb/src/ai/policy.ts` and `tests/phase2/tower-guardian-last-beat-crossfire.test.cjs`.

## Engineering verification and remaining risk

The new tests use the repository's **actual streamed floor-eight guardian and crusher** and attach a source-compatible enemy projectile observation. They assert: earlier shutter selects physically real evasion, faster bolt retains projectile priority, zero attacks/abilities are granted, repeated decisions are identical, authoritative state remains unchanged, and historical/unflagged paths keep old behavior. These tests are synthetic state situations, **not gameplay video or quality opinions**.

- Previous independent-head safety workflow [42039500584](https://github.com/my-edutu/Ai_games/actions/runs/42039500584) succeeded at older playable head `5735c28d`. This does **not** validate the above newly committed source.
- No live Node build, browser replay, hardware frame-time trace, independent critic or current-source capture has been obtained **in this execution** because the local worker/browser tunnel is disconnected (`NOT_FOUND: Tunnel-client has not been seen for 300 seconds`). Exact-source safety verification is therefore pending; no green-test or sustained-FPS claim.
- Earlier [42029455454](https://github.com/my-edutu/Ai_games/actions/runs/42029455454) native 960×600/390×844 source-pinned actual desktop/portrait recordings are **from the older `8564a07d` candidate** and cannot demonstrate this new path. Source-matched scenes still differ in encountered events.
- The new arbitration does **not** guarantee that both attacks are always survivable. Physical movement, collision damage, stun, remaining health and ordinary replay authority continue to decide genuine encounters.

## Two independent review passes

**Spec/compliance pass:** bounded public countdown + observed live projectile; no private RNG or predicted contact; historical/replay policy unchanged; source-derived `evading-hazard` intent integrates the existing presentation contract. **Unresolved:** compile, replay and actual decision sequence against current-source real gameplay capture.

**Experience/quality pass:** prioritizes a meaningful combined-contact survival problem over cosmetic green-CI iteration and avoids misleading on-screen reaction. **Unresolved:** whether the game is *actually* easier to read and plays better, especially with full-body climber, guardian and jaws simultaneously visible in narrow portrait.

## Next decisive step

Produce exact-source pinned normal-speed **>=60s** original-game footage of everyday ascent, guardian/shutter crossfire and actual outcome/restart for BOTH desktop and portrait, compare to unchanged baseline with matching seed/tier/viewport and **event-matched** source ticks. Verify a real guardian defeat, physical doorway crossing, continued ascent, accessibility, replay and supported-device p50/p95/p99+memory. Then obtain **five genuinely independent fresh-context blind randomized whole-motion critics**, requiring **>=4/5 candidate preferences separately for LOOKS, FEELS and PLAYS**. Until then, `/tower/gauntlet` stays **NOT EVALUATED** and this is one still-open transformation.

No PR58 edits, merge, deploy, or force-push. Rollback is by an ordinary reviewed revert of the explicitly listed source commits if real capture reveals a regression.
