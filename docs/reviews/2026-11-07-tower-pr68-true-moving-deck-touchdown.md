# Infinite Tower PR68 — time-matched moving-deck touchdown, P0 OPEN

**2026-11-07 · verdict NOT EVALUATED.** Frozen playable baseline: `1731b380851162741761c5569e2bc152a0869ca9` (unchanged). Source starting HEAD: `fbc02150e6c9709224886f663657197f1f85b644`. Source commits: [6fdaefde](https://github.com/my-edutu/Ai_games/commit/6fdaefde025cdc79cf02d4506fb1c6a67b982bb1) and [6febe635](https://github.com/my-edutu/Ai_games/commit/6febe63532c7c7f58bc16d42468b1aa795dcf09f).

## Primary source-model defect

The recent swept *side* solver fixed diagonal penetration through **solid** faces, but most normal ascent decks are `oneway` and have **no side faces**. The previous vertical solver checked horizontal overlap only at the **end of the 50-ms step**. A 17,000-unit diagonal dash can enter a one-way deck lane *after its feet already passed the roof*, yet get teleported upward to the deck top, awarded `groundedPlatformId`, and treated as a successful landing. Conversely a deck that moves away before vertical contact could be considered the landing platform from a later end-point overlap. High-speed roof contacts can also be awarded after dashing entirely off the far side before tick end. These are concrete source/geometry failure modes, **not observed current-source video defects**.

## Cohesive playable fix

- New `src/physics/swept-vertical-contact.ts` compares the player's authoritative tick-to-tick motion and the actual **tick and tick+1 platform poses**, without inspecting future paths. It checks the exact time of top-plane or underside crossing, and only accepts a top landing when the hero overlaps the moving deck both **at touchdown** and **at the end of that simulation step**.
- In `src/physics/step.ts`, the already opted-in coherent guardian game chooses the earliest real vertical-plane collision rather than an alphabetical platform or an end-X-only crossing. The climber retains physical falling until legitimately supported. The pre-wall movement start is captured once, before wall/world-boundary clipping, for truthful simultaneous X/Y evaluation. No new meshes, teleports, stamina boosts, fake victories or extra simulation ticks.
- A new seven-case original-runtime Node suite `tests/phase2/tower-live-swept-vertical.test.cjs` covers late/early one-way arrival, dashing off a tiny deck, late/early solid-ceiling entry, moving source pose, and the **unflagged historical solver**.
- Frozen historic/unflagged physics retains the existing vertical branch; PR58 remains untouched.

## Validation actually achieved

- 10/10 static integration/wiring conditions verified against **GitHub-fetched exact source** at `6febe635`. These are file/source assertions, **not TS compilation**.
- 9/9 independent mathematical scenario probes of the equivalent fixed-step crossing arithmetic passed (including moving X/Y decks and one-way ceilings). They are **isolated probes, not the imported repository module or an actual running level**.
- Seven original-runtime test cases **authored but NOT EXECUTED**. `npm run build`, `npm run test:tower:phase2`, the original two 3,200-tick campaigns, and normal-speed desktop/portrait source capture: **NOT EVALUATED**. The live development connector is disconnected (`Tunnel-client has not been seen for 300 seconds`) and container GitHub DNS resolution fails.
- At inspection the older [nine-job capture](https://github.com/my-edutu/Ai_games/actions/runs/42360524651) still had **9 queued, 0 artifacts**. Exact new source `6febe635` returned **no PR workflow runs** at inspection. No current-source WebM has been reviewed.
- Historical, pre-change 390×844 candidate footage's strongest known defect remains the tiny climber/unstable apparent character scale and no readable continuous living guardian + crusher → defeated guardian → physical walk-through → floor nine → outcome/restart. It is NOT a comparison against this change.
- Independent blind randomized critics: LOOKS 0/5, FEELS 0/5, PLAYS 0/5. Real supported-device frame p50/p95/p99 and memory: **NOT EVALUATED**.

## Two-pass spec and engineering review

**Spec:** P0 still open; the implementation fixes a real integrity hole in landing/step truth and makes one-way/moving-platform descent more credible without adding simulated input or a scripted result. Source geometry only; original seed/replay history remains guarded by explicit opt-in.

**Quality and unresolved risks:** A successful vertical collision rounds position to the exact *end-of-tick platform plane* and retains integer coordinates. For simultaneous corner/wall collisions, our new X interpolation is a linear approximation to motion that may stop early at a wall; original full-simulation replay and moving-deck camera footage must validate it. Existing stacked ledges, moving-face pushes, cap gateway and restart must be regression-tested. No performance conclusion from O(n) per-deck contact scanning. No new network, private data, audio, HUD or accessibility controls; those quality pillars are still unproven.

**Safety/rollback:** Only existing **draft PR68** changed. Do not merge, deploy, force-push, retarget PR, alter PR58 or move frozen baseline. If the original runtime exposes regressions, revert only the source/helper/test additions on PR68 with a normal forward commit after inspecting the latest branch tip.

## Next P0 move

Get an executable Node22+Chromium checkout or functioning GitHub Actions runner; first run `npm run test:tower:phase2` including new seven-contact cases plus the earlier 11 swept-wall cases. Run BOTH unchanged original 3,200-tick campaigns. Then record baseline and this **exact** source in normal-speed continuous >=60s 960×600 desktop and 390×844 portrait at matched seed/tier with aligned native guardian, crusher, cap-walk, gateway, floor-nine, terminal and restart events. Inspect actual moving-deck foot contact and portrait composition before proceeding to P1. No genuine independent assessor may vote from unit tests.
