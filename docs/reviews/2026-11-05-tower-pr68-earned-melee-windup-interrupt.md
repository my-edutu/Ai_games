# Infinite Tower Climb — earned melee windup interrupt across AI, simulation and 3D response

**2026-11-05 · Draft PR #68 · Same guardian-cap transformation · NOT EVALUATED**

## Why this continuation is needed

The frozen playable baseline remains `1731b380851162741761c5569e2bc152a0869ca9`. The previous verified authentic browser danger footage [41939822623](https://github.com/my-edutu/Ai_games/actions/runs/41939822623), source `57d5b547`, recorded repeated health-depleted outcomes and no defeated guardian. Its first 2,200 source ticks in desktop and portrait reached only guardian 4/8 HP; this is **not** proof of every build or future outcome.

After the prior close-contact spacing controller, an additional systemic flaw remains in the live cap duel: a correctly timed, genuinely successful melee hit during the guardian's announced winding charge costs the guardian health but does not stop that very attack. Existing earned *projectile* counters do interrupt, while a player who has not obtained Pulse Shot has no equivalent melee counter. This reduces readable active counterplay, especially after the second-wind shield and repeated contact pressure.

## Connected source/gameplay implementation

- The opt-in `guardianSecondWind && guardianArenaHazards` **real cap** enables a new *earned* counter: while the guardian is actually telegraphing, the grounded, correctly facing autonomous climber may commit an ordinary range-checked melee strike, even before its shield has risen. Existing non-arena guarded-core rules stay unchanged.
- An **actual successful, nonlethal** melee hit inside the source windup now cancels the not-yet-fired projectile and triggers the already established 10-tick guardian stagger and minimum 18-tick recovery. No free health, hit, weapon, invulnerability, contact protection, predicted target position or telegraph is granted.
- This unifies the guardian's *existing* animated stagger exposure and optional, gesture-gated failed-windup acoustic witness with authentic melee damage. A miss, blocked swing, killed guardian, already-fired charge, no cooldown, distant foe or opt-out cannot trigger the new counter. Projectile emergency evasion and actual active hazard/shutter always win before offense.
- The opt-in and current-source-only decision preserve seeded deterministic fixed-step authority, historical replay checksums, immutable snapshots, source-owned HP, original assets, physics, recovery and minimal HUD. No new shaders, geometry, meshes, draw calls, network requests or persistent client state.

Tests include AI → source combat → render snapshot contract, legal cooldown/facing/range constraints, negative source cases and historical opt-outs. **Successful tests, commits and source metadata are not a Gauntlet quality score.**

## Critical evidence still missing

The newest [12bed170 source recording](https://github.com/my-edutu/Ai_games/actions/runs/41943534848) has completed its capture jobs, but has NOT been reviewed as a normal-speed source-matched guardian victory, and it predates this code. Capture the new commit and compare true desktop (960×600) and portrait (390×844) WebM for >=60s each of everyday ascent, guardian+crusher and complete outcome/restart, with a matched baseline event/seed/quality configuration. Source-driven crossfire + guardian defeat/floor-9 progression and truthful recovery need direct verification, including multi-seed survival rates, not self-certifying from deterministic tests.

Independent five fresh-context blinded full-motion critics have not graded LOOKS, FEELS or PLAYS; device frame-time p50/p95/p99 and memory remain unmeasured. No verified 4/5 preference, actual hardware PASS, commercial parity or transformation PASS. Keep `transformation.json` at **NOT EVALUATED**. CI is a safety veto only. Rollback by reverting this strictly opt-in counter behavior and retaining prior guardian-cap work if source evidence reveals new oscillation, animation unreadability or unfair encounters.
