# Infinite Tower PR68 P0 — source-owned threshold through missing browser observations

**Stage:** P0 EVIDENCE + GAME-LOOP TRUTH OPEN. **Leading assessor:** NOT EVALUATED.
**Frozen baseline (unchanged):** `1731b380851162741761c5569e2bc152a0869ca9`.
**Review scope:** only Infinite Tower Climb. PR68 remains open and draft on PR58; no merge, deploy, force-push or other game edits.

## Actual immutable-source 1x observations before implementation

The [previous 9-job gameplay campaign](https://github.com/my-edutu/Ai_games/actions/runs/43212531463) recorded genuine candidate 960×600 and 390×844 guardian films at source SHA `06cc9ae1d71a02774de350c8a6f692c1c66ae626`, together with eight native-webm artifacts. The source pairing workflow failed its strict acceptance: the frozen-baseline moving-floor7 desktop capture started after the requested launch-floor boundary, and its native clock/report integrity failed. The candidate's real full guardian-to-Floor9 scene still visibly **cuts from bronze Floor8 to violet Floor9**, failing to show a continuous, grounded whole-body doorway crossing. No favorable experience verdict is claimed.

The candidate's first accepted Floor9 browser packet was about tick452 after old-floor observation around tick435; the original authoritative source contains the exact earned transition at tick451. An 8–12-tick renderer-only witness cannot preserve a physically real crossing when one browser stall skips ~17 source ticks. The browser should not invent missing game frames or assume a portal if the fixed-step rules did not actually record it.

Measured source tick451 to native Floor9 scene phase: **2.424 seconds desktop, 2.289 seconds portrait** (source/native phase diagnostics, **not** GPU-present timing, p50/p95/p99 or actual-device FPS). Latest old-source [quality run](https://github.com/my-edutu/Ai_games/actions/runs/43212531462) failed 1/1432 tests because a negative test regex treated `next.floor === 9` as an assignment; this obsolete test was corrected without changing the no-mutation requirement.

## Substantive source-authentic implementation

- **Authoritative rule:** At a genuine opt-in HP-zero Floor8 guardian victory, ordinary physics crosses the whole-body cap exit and confirms contact with Floor9 ground. Record the old cap, defeated guardian, true prior X/Y/HP, actual crossing X/Y, floor/run/tick and body geometry as the *single source-earned crossing witness* on the new game state. No rules for movement, guardian, crusher, invulnerability, or floor advancement change.
- **Immutable public snapshot:** Publish the source-owned witness only for matching opt-in Floor9 gameplay during the next 12 real source ticks; frozen/default snapshots remain unchanged. Store it under `lastGuardianCrossing`, not a client-generated guess or visual clock.
- **Three.js gateway reconstruction:** If WebGL/browser skipped the actual old→new snapshot, validate the original source witness, real guardian defeat and anchored cap, matching run/clock, body-support geometry, legal per-tick movement and forward Floor9 position. Recover only the recorded old endpoint and feed the **existing** `observedGroundedGuardianHandoff` and `passage.begin`/runway system. The render cannot move the actor, create a boss death, create an extra platform collider or rewind time.
- **Actual regression:** New test-first `tests/phase3/tower-source-recorded-gateway-handoff.test.cjs` fails at pre-implementation source, and negative cases reject wrong run/floor/clock, unsupported height/ground, living guardian and impossible displacement. Correct a separate old negative-pattern assertion to distinguish `===` from source assignment.

The first test-only commit [b2e912dd](https://github.com/my-edutu/Ai_games/commit/b2e912dd3fdd81210d143ed3d59881763666b536) was verified RED by [run 43219700182](https://github.com/my-edutu/Ai_games/actions/runs/43219700182), including the missing `observedRecordedGuardianHandoff` export. Production code commits: [24f9a633](https://github.com/my-edutu/Ai_games/commit/24f9a63376fc4ce99742a4eb3f110dd93b879c3c) in fixed-step rules, [03fc1bc0](https://github.com/my-edutu/Ai_games/commit/03fc1bc0d095a0b4a69f1bbae6749cace4e08523) in snapshots, [d9668fef](https://github.com/my-edutu/Ai_games/commit/d9668fef93eda6747eb7c1aef1d3a8562ba9c0e6) in source-validating 3D passage and [6652c9cf](https://github.com/my-edutu/Ai_games/commit/6652c9cfd94a4cfa8893be3b611282381154fd6a) in actual scene integration. Test repair [b860f76f](https://github.com/my-edutu/Ai_games/commit/b860f76fc932bf1773061172c279a860c9f784ec).

## Safety, limitations and next actions

Current implementation has not yet been accepted by a complete *new* 60+s 1x native film. Exact-head CI remains a veto and must be inspected. The previous genuine baseline moving-film startup-clock defect remains open. Strict source/browser/Three/native event matching must pass **2/2 original guardian viewports**, plus all eight baseline/candidate original films (ascent, moving, danger, outcome/restart), matching immutable SHAs and conditions. Real floor-nine body-through-door spatial continuity may still be visually inadequate despite carrying the real arch. In that case, reopen world/camera geometry within P0 rather than graduating on green tests.

Independent randomized fresh-context critics **LOOKS 0/5, FEELS 0/5, PLAYS 0/5**; supported actual hardware frame-times p50/p95/p99 and memory **NOT EVALUATED**. No fabricated metrics, critics or acceptance. Preserve the frozen baseline SHA, PR58 edits, and draft PR68.

**Next highest-impact action:** inspect new real 960×600 and 390×844 1x full-motion capture and exact source-event/scene-phase sidecars; verify the observed Floor8/9 crossing now draws a real opened doorway; fix any remaining visible spatial cut/latency and baseline-moving launch-clock failure. Remain P0.
