# Infinite Tower Climb — 20 Hz dash impulse must hand back to authentic airborne traversal

**2026-11-07 · [DRAFT PR #68](https://github.com/my-edutu/Ai_games/pull/68) · P0 OPEN · leading transformation verdict NOT EVALUATED**

## Source and actual historical evidence inspected

- Inspected PR68 at `6ddf3c0a22c7fa9b97d8fb7fb3fe2b41137f6534`; read root AGENTS.md, approved transformation design, GAUNTLET.md, transformation.json, real 20 Hz physics, 3D skinned hero, immutable public snapshot, landing-camera director, aerial-kinetics stage, flight/guardian policies, and recent reviews. PR58 was independently at `5343c4912b847d21e1a9c4781591e2b877ae1bc7`; **do not modify it**.
- The historic candidate portrait danger video (source 8fd9018f; **not current PR68**) showed a small climber and visually fragmented floor-eight guardian / onward floor-nine action, with additional intervening floor and run changes. It cannot prove a complete matched real guardian → crusher → unlocked physical gate → floor nine → result/restart episode or the latest camera fix.
- [Older nine-job baseline/candidate workflow #42330014076](https://github.com/my-edutu/Ai_games/actions/runs/42330014076) remains **nine queued jobs and zero artifacts** at inspection and targets a prior candidate SHA 7f41fb84, not this implementation. No current-source footage, original dual 3,200-tick campaign or exact-head CI result was verified. Remote development workspace is unavailable: `Tunnel-client has not been seen for 300 seconds`.

## The major cross-system truth defect

In the **actual authoritative** `stepTowerPhysics()`, the dash button sets `player.state='dashing'` on a single tick and the airborne branch never changes it back until physical landing. The same player may ascend past the apex, drop toward a moving deck, and steer normally while the official public snapshot still says **dashing for the entire jump**. This feeds three genuine, interlocking experience regressions:

1. `visuals/characters.mjs` keeps the skinned astronaut in its forward dash silhouette rather than real airborne ascent/apex/pre-landing braces.
2. `visuals/traversal-kinetics.mjs` rejects any player with a state other than `airborne`, so the actual upward/downward velocity stops producing its source-observed wind, apex and landing-readiness cues.
3. `visuals/landing-shot-span.mjs` and the real 3D scene's airborne camera only frame a narrow, source-declared physical landing lane when the player is explicitly `airborne`. The unreleased dash can reinstate a huge full-cap panorama for the entire jump, directly undermining the preceding landing-composition fix and portrait character scale.

This is a code-proven state-contract defect, **not** evidence that the currently queued WebM contains it.

## Implemented in the original live game

- [Red-first regression fixture `ac5c3a35275b`](https://github.com/my-edutu/Ai_games/commit/ac5c3a35275bf0c236dd7bc16877e2d663426659) creates three original-runtime tests for: a single earned dash transitioning into airborne after three 20 Hz ticks; unaltered real positions/velocities/cooldowns compared to a frozen-unflagged run; public snapshot restoring actual aerial kinetics; and ordinary non-dash flight retaining its airborne state.
- [Authoritative fix `cf327403bb56`](https://github.com/my-edutu/Ai_games/commit/cf327403bb56cd4168195f6cd021599ed98e0d80) keeps the **three actual fixed-step dash ticks (150 ms)** then publishes `airborne` once the source-owned cooldown reaches its already-derived dash duration minus three ticks. The full physics path, jump charges, world collision, gravity, inputs, stamina, speed, RNG and fixed-step clock are untouched. Only runs explicitly opted into both `guardianArenaHazards` and `guardianSecondWind` receive this short state handoff. Unflagged source and PR58 gameplay retain their historical dash label and replay contract.
- No added rendering meshes, shadow passes, camera cut, cosmetic outcome or simulated victory. Existing scene/rig/music/landing camera consume the new authoritative airborne snapshot without a second presentation clock.

## Feasible checks and limitations

- Confirmed both files were persisted on GitHub at the new PR68 source commit. Parsed the checked-in CJS test with the JavaScript parser successfully and statically inspected the single source handoff, its opt-in guards and absence of a velocity mutation in the edited branch.
- **NOT EXECUTED**: the actual repository `node --test tests/phase2/tower-airborne-dash-handoff.test.cjs`, original TypeScript build, two 3,200-tick guardian/crusher campaigns, browser gameplay, matched 60+ second 960×600 / 390×844 baseline-and-candidate films, supported-device p50/p95/p99 and memory. The tunnel is offline; Github's queued older capture cannot be cited as this source's result. Parser/static checks are neither passing gameplay tests nor experience proof.
- **Potential regression to test**: transition boundary at the fourth 20 Hz tick could abruptly change the silhouette, and newly restored landing-camera ownership could expose camera swings or hide a real side hazard. Inspect the continuous current-source landing and danger film before considering P0 accepted.
- Genuine independent blind reviewers: **LOOKS 0/5, FEELS 0/5, PLAYS 0/5**. Hardware, safety and whole-game transformation **NOT EVALUATED**.

## Next highest-impact action

Restore a working immutable Node 22/Chromium checkout; run this authored regression plus existing physics/replay tests, actual dual same-seed 3,200-tick guardian/crusher-to-restart campaigns, and normal-speed full-motion baseline SHA `1731b380851162741761c5569e2bc152a0869ca9` against this new candidate exact SHA at desktop 960×600 and portrait 390×844. Inspect an uninterrupted descent into the moving deck and the source-earned guardian gate floor-nine crossing. Fix the largest recorded game-loop or camera/pose failure rather than moving to P1 by commit count. No merge, deploy, force-push, baseline move, PR58 rewrite or change of PR68 draft status.
