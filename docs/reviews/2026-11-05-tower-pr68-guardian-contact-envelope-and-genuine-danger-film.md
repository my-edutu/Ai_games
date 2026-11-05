# Infinite Tower Climb — guardian survival, real video and source-contact envelope

**2026-11-05 | Draft PR #68 | Transformation remains OPEN — NOT EVALUATED**

## Source baseline and observed problem

The frozen original baseline remains `1731b380851162741761c5569e2bc152a0869ca9`, unchanged. The most recent completed genuine gameplay recording [41939822623](https://github.com/my-edutu/Ai_games/actions/runs/41939822623) records candidate `57d5b5470f99cd364f0bf482531850da8039bf13`, desktop 960×600 and portrait 390×844 at normal speed, low quality, sound off, matched capture seed `tower-transformation-capture-v1`. All nine source-pinned jobs succeeded, but capture success is not a quality vote.

Builder inspected the original native **candidate danger** WebM and source traces in that run, including desktop (~114s) and portrait (~106s) motion and sampled full-resolution gameplay frames. In the first 2,200 recorded source ticks per viewport, the guardian's lowest observed health is **4/8** and the source reports **zero defeated guardians**. Both layouts show repeated health-depleted results and restarts on floor 8 rather than the earned upper-gate progression. This is a genuine playability failure, not primarily a camera/CSS problem. The `crossfire-source-witness.json` records **0** source-matched near-body guardian–shutter intervals on either layout, so the physical two-beat crossfire is still *not* authentic A/B evidence.

The preceding technical run [41940093589](https://github.com/my-edutu/Ai_games/actions/runs/41940093589) failed 1/982 tests. Its integration expectation that a pilot 50,000 units away from shutter **must** evade was not a collision criterion. Source-level safety and source–render event matching must remain separate.

## Connected playable transformation under development

This run continues **the same guardian-cap survival vertical slice**, rather than calling a single fix a success:

- A source-authored test first demands the live autonomous player make physical separation from the approaching guardian while a real melee cooldown is running, at an observed 42k-unit separation; when the cooldown ends, the player must still spend a legitimate hit rather than retreat indefinitely. Guarded deck-edge and unflagged legacy behavior are explicit controls ([test source commit 870c7d4](https://github.com/my-edutu/Ai_games/commit/870c7d4c0c2fca130f71b07190acef5afb1ba811)).
- Guardian patrol uses a single exported **existing** 1,800-unit/tick constant shared with the tactical controller; enemy physics and attack timing remain unchanged ([source 815aec7](https://github.com/my-edutu/Ai_games/commit/815aec760d7dab808e2bb4cf9db3446550feec15)).
- Only opt-in `guardianArenaHazards` combat now begins guarded pre-contact spacing within the **remaining source-observed cooldown × current guardian patrol rate**, capped inside actual melee reach. It refuses active-shutter collisions and falls from the current supporting deck, and strikes normally once ready. No enemy-location oracle, forced result, damage forgiveness, extra health, new physics, private RNG, HUD clutter or historical replay rewrite ([playable source 12bed17](https://github.com/my-edutu/Ai_games/commit/12bed170f40d1313eaca5240ae1821b99e07e8c8)).
- The earlier 50k proximity assertion now distinguishes source-observed **projected body exposure** from being merely near a visible timed trap. Actual threatening approaches must elicit a physical hazard response; genuine safe warning windows are not required to emit fake evasions ([test d489f6f](https://github.com/my-edutu/Ai_games/commit/d489f6f3a6a81f3047b058ada1a6d3ed6d8f0f07)). The separately positioned live-source test still requires an actual reaction.

## Engineering and adversarial review

The branch is based on draft PR #58; no PR58 mutation, merge, force-push or deployment. The implementation consumes current immutable source observations and emits ordinary action controls; the authority retains fixed 20Hz stepping, seeded replay and collision checks. Source patrol speed remains 1800 ticks, so historical physics is unchanged. The safety check prevents stepping into currently active hazards and reuses the already-tested grounded edge veto. No shaders, geometry, lights, new HUD, sound resources or frame passes introduced by the combat decision.

Important residual risks: the constant-velocity contact envelope is **not a forecast or guarantee** of future guardian motion; corridor changes could cause oscillating physical retreats, edge-bracing, missed strikes or no survival improvement. One exact-source local pre-commit failing test is not yet independently witnessed; complete repository CI and replay must run on the committed SHA. The new behavior may still fail to beat the boss. The original real footage is **pre-change** and cannot establish a quality win.

## Required subsequent acceptance

Review the same three genuine baseline and new-source normal-speed clips at desktop and phone, each >=60s: everyday ascent, full authentic guardian/shutter encounter including hit/guard/counter/recovery, outcome and true restart. For PLAYS, collect **actual guardian damage/death counts, defeats, progression to floor 9, hazard-contact distribution and successful restart** over declared multi-seed episodes, then event-match and inspect footage. Do not replace video with simulation traces. Obtain at least five fresh blind independent critics each for LOOKS, FEELS and PLAYS (4/5 candidate preferences in each); no unresolved P0/P1, real target-device p50/p95/p99 frame times and memory, replay, accessibility, robustness, and full CI safety pass. The separate independent/browser worker and supported-device measurements were not available in this execution. This is **NOT EVALUATED**, never AAA, production-ready or a transformation PASS.

Rollback: revert the opt-in AI behavior commit and the supporting speed constant if runtime replays, survival or tests regress; the original authoritative combat geometry and frozen baseline remain intact.
