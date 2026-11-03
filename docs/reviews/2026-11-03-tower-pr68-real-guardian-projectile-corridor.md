# Infinite Tower Climb — real guardian windup → projectile exterior action lane

**2026-11-03 · Draft PR #68 · SAME open transformation · Gauntlet quality: NOT EVALUATED.**

## Experience problem, observed source and boundary

Source-pinned baseline/candidate *actual* recordings already exist for all eight mandatory desktop and native phone ascent/danger/outcome/moving combinations in [workflow 41561512578](https://github.com/my-edutu/Ai_games/actions/runs/41561512578), with baseline SHA `1731b380851162741761c5569e2bc152a0869ca9` and prior candidate `a2bd637e67e59a20f245af8954064ce7b4d1438f`. Existing builder inspections show that sparse camera projections often fail to include the cap lock during phone combat, while many observations are *distant ascent*, not face-to-face contact. These are genuine but unaligned source recordings, **not an independent quality comparison or measured phone performance**.

The next physical action-causality gap is the guardian's short eight-fixed-tick charge. The old tapered threat strip sits on the inner 26.15-unit cylindrical surface, behind much of the walkable 3D annulus (outer ~27.18); a player-facing projectile's near-field aim therefore need not be visible along the actual external character silhouettes. A restrained, source-pinned exterior charge direction is a connected part of the existing guardian → attack → HP-operated gate → outcome/restart slice, **not a new isolated milestone**.

## Gameplay implementation, not a claim of visual success

- `public/infinite-tower-climb/visuals/guardian-shot-stage.mjs` reads the actual **living guardian's active telegraph**, direction, source world position and remaining fixed-step ticks. It draws only when a genuine live player is **in the horizontal path and projectile-height hitband**; a neutral guardian, firing away, dead player, result, stream stall, other floor or restart cannot create false danger.
- Its original world-depth 3D cones share **one instanced GPU draw**, eight on low, twelve on other tiers. They align with the guardian's genuine horizontal shot and remain at exterior tower radius 27.75 instead of burying inside the wall. They intensify across the true eight authoritative windup ticks, not a fictitious clock, random outcome, full-screen flash or narration. The corridor stops short of the observed climber and does not predict a hit.
- The real `scene.mjs` integrates the effect with existing skinned guardian action, attack ribbon, world lighting, camera and HP-operated gate. It creates and disposes the stage with the exact graphics-context rebuild lifecycle; clears on new runs, stale packets, death, terminal and teardown. Reduced-motion remains a stable source-related silhouette.
- The old interior 26.15-radius strip is now suppressed **only** for guardians, avoiding two contradictory, overlaid attack lanes. All non-guardian authentic telegraphs keep their existing warning strip. Actual guardian warning ring/charge arc remain available when the shot corridor is outside the genuine projectile-height band. [Integrated scene source 46e787f](https://github.com/my-edutu/Ai_games/commit/46e787fe364905352bebfb15dee1103689e8818c).
- No authoritative physics, projectile collision, AI decisions, seed, RNG draw, replay hash, score, audience interaction, renderer loop, HUD element or copied commercial asset changed. This **adds up to one bounded draw during genuine guardian telegraphs**, not a free performance claim.
- Tests `tests/phase3/tower-guardian-shot-stage.test.cjs` assert real shot-height and direction truth, source tick timing, at most one draw, exterior placement, event privacy, reduced motion, stale/restart/terminal cleanup, and disposal. Passing tests alone will not establish LOOKS/FEELS/PLAYS.

Implementation source commit: [0853314](https://github.com/my-edutu/Ai_games/commit/0853314fc75db9388d857c992ec18c6f17ff352e). Scene integration: [925cb95](https://github.com/my-edutu/Ai_games/commit/925cb95d0a0f2eaa0ed79103e8287c8288084927). Dedicated source-stage tests: [b74095f](https://github.com/my-edutu/Ai_games/commit/b74095fdd4d290b3ebf9ae570d8ac3b37b6d4d05).

## Specification vs experience criticism

**Spec review (source):** It is an original, conditional, bounded *presentation* warning that uses immutable authoritative public snapshots and keeps existing real collision. Contact cannot be presumed from sightline alone. Character and route information should remain primary. Historical replay remains untouched.

**Independent viewer/critic review: NOT AVAILABLE.** The source must be matched against a real candidate `0853314` 60s+ desktop/portrait normal-speed high-stakes source film. Fresh-context independent blind randomized critics must inspect continuous actual gameplay, not this description or fixture. No five-vote panel exists; LOOKS 0/5, FEELS 0/5, PLAYS 0/5. Recent critic workspace returned tunnel-client offline. Supported-device p50/p95/p99 and memory, complete replay/accessibility, P0/P1 review remain unverified.

**Top systemic remaining gap:** With real mobile gameplay, is the guardian, its projectile direction and the actual HP cap mechanism readable together at the **same source-aligned contact stage** without shrinking the skinned climber or obstructing the safe route? State-event pair the full baseline/candidate movies (not equal wall seconds), then independently assess the whole climb, combat, complete ending and restart. Do not shift the frozen baseline or award a transformation quality pass.

**Safety and isolation:** PR #58 untouched. PR #68 stays draft, open, unmerged, undeployed; existing hourly continuation unchanged. CI is a safety veto only. Any new source or capture failure is an explicit blocker, not a suppressed result.
