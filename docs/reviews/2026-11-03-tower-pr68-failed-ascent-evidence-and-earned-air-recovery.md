# Tower PR #68 — actual ascent failure, physical recovery and source-bound in-world feedback

Date: 2026-11-03. One unchanged whole-game transformation initiative on draft [PR #68](https://github.com/my-edutu/Ai_games/pull/68), branch `feat/tower-transformation-gauntlet-20261101`. This is a developer evidence review, **not** an independent blind gameplay vote.

## Red full-run evidence which changed the priority

The real gameplay safety run [41548143305](https://github.com/my-edutu/Ai_games/actions/runs/41548143305), exact prior source `7372ed99dffb6264d98a2bdefc87f5270eda4071`, completed **FAILURE**, despite 786/789 logic tests passing:

* Oracle fixed seed `route-proof` stalled at floor 0, target `f0:p3`, at tick 1976. It performed 53 jumps and 22 stuck recoveries but **zero dashes**, then terminated as stagnation. Camera/material cosmetic success cannot override this actual-play failure.
* Autonomous fixed seed `autonomous-floor` died by health depletion at tick 296, with four hazard strikes and no floor completion.
* The no-audience source-autonomous run did not clear floor 0. The game must be meaningful with zero spectators.

In the older [source-pinned normal-speed recording run 41547983114](https://github.com/my-edutu/Ai_games/actions/runs/41547983114), all eight real ascent, danger, moving and outcome capture jobs for frozen baseline plus **older candidate `133ce1a8...`** succeeded (each includes desktop and portrait capture). The ninth authentic ledge job FAILED all four browser subcases: no authentic ledge contact in 2500 seeded ticks. Captures do **not** establish latest source quality, and job success is not a blind visual verdict.

## One coherent correction to the actual climb

Gameplay changes are committed to the real 3D Tower transformation branch, **not** Tiny Kingdom, Maze or AI vs 1000 Floors.

1. The LIVE tactical planner now receives the **earned current jump charge** in its present, immutable observation. It cannot fabricate extra jumps; the existing fixed-step physics consumes the charge.
2. The long-gap air boost replaces an unsafe fixed distance-to-nearest-edge cutoff with a bounded optimistic flight-reach check. It reads only current velocity, gravity, current target height and permitted lateral acceleration. No future moving-platform position, hidden hazard phase, offscreen enemy or mutated authority is consulted; boost still requires real stamina, ready cooldown and source-aligned direction. A 40-step local arithmetic bound creates no GPU work.
3. When falling short of a real supported landing, the climber can execute its **existing earned midair jump once**, only while descending, outside the safe interval, within physically recoverable rise and absent adequate ordinary lateral travel. A comfortable landing does not consume the charge. A failed flight remains possible and authentic.
4. Approaching active spikes no longer triggers a broad panic reversal that preempts the **same currently observed collision-clear landing lane**, except when the real body actually overlaps danger. Grounded hazard evasion and historical-v1 decision behavior remain unchanged.
5. The original instanced world-space route stones now show that same hazard-clear landing destination during real earned air recovery. Original skinned movement and camera respond to the resulting actual physics; no additional HUD, shader, geometry batch, predicted trajectory, invented combat outcome or renderer draw was added.

The source-based tests exercise actual consumption via `stepTowerPhysics`, immutable policy behavior, forbidden invented charges, no boost against opposing velocity, early hazardous-deck steering, real body-overlap reflex, legacy-v1 preservation and source-bound 3D world route coherence. They are engineering vetoes, **never experience votes**.

The intermediate [CI run 41554483694](https://github.com/my-edutu/Ai_games/actions/runs/41554483694), gameplay source `ad5373a9`, reported successful Build, transformation verdict, full repository logic and Tower authority steps before cancellation during Chromium installation by a newer source push. Full final exact-source CI/browser and real recordings are not verified yet.

## Frozen comparison and missing acceptance

Frozen before-source stays `1731b380851162741761c5569e2bc152a0869ca9`. Current implementation source pinned for review is `4398a157a31d8d317def4cc5135d905e9d2621de`; a documentation-only commit does not turn it into an experience judgment. Original playable 3D encounter/guardian and source-authentic outcome/restart must still be evaluated in the **same** transformation.

Source-pinned NORMAL-speed 60-second-or-longer baseline and latest-candidate desktop + portrait footage for ascent, high-stakes guardian and full outcome/restart is **NOT YET VERIFIED**. Source-event alignment and matching seed, viewport, quality and recording conditions must be checked. Five separate real, fresh-context, randomized, blind full-motion LOOKS judges, five FEELS judges and five PLAYS judges remain **0/5 each**: no votes collected. The independent workspace/browser worker has been inaccessible; no independent reviewers should be invented. Supported-device p50/p95/p99 frame-time tails, sustained actual hardware memory, accessibility and robustness require measurements.

**Evidence-based /tower/gauntlet status: NOT EVALUATED.** Red source finding is addressed in source code but not independently verified as an experiential win. Biggest remaining gap: continuous credible platform ascent with no recurrent missed landings or spike deaths, then readable mobile guardian and a strong complete ending. Do not merge, deploy, force-push, unfreeze the baseline or close the current Gauntlet.
