# PR68 P0 — living guardian must physically lock the real cap doorway

**Date:** 2026-11-06. **Stage:** P0 EVIDENCE + GAME-LOOP TRUTH — OPEN. **Leading transformation verdict:** NOT EVALUATED.

**Baseline (immutable):** `1731b380851162741761c5569e2bc152a0869ca9`. **Target:** PR68 draft branch only, based on PR58; PR58 untouched.

## Largest source-inferred experiential break addressed

The existing cap has a mechanically animated bronze guardian seal and source-gated progression, but physics previously treated the bronze doorway as **decoration** while its living guardian was active. At cap level, an autonomous climber could move through the rendered locked gate, potentially spend the fight on its far side, then claim floor nine after the final blow without the earned post-defeat cap crossing being visibly distinct. The previously implemented floor-transition check prevents most premature *floor changes*; it does not itself make the living door physically impassable. This is a **code-derived traversal contradiction**, not a defect seen in fresh current-head video.

## This run's cohesive source + 3D changes

- [Red regression contract `5410f471`](https://github.com/my-edutu/Ai_games/commit/5410f4714644d8c196ca54bc7e872ef0db8d2540): test real guardian cap lock contact, physical release and post-defeat walking; an airborne near-cap block and untouched historical behavior.
- [Authoritative physics `3f3bfb9a`](https://github.com/my-edutu/Ai_games/commit/3f3bfb9a1c07e41eb62fb3b5de5bccb4b4cb1024): in opted-in active guardian encounters only, sweep the player's front edge against the **same** `guardianArenaExitX(cap)` plane while airborne or grounded within the source-anchored 140,000-unit-high lock lattice. Cancel forward velocity and emit `contact-wall` with `f8:guardian-seal`. The player must still defeat the real guardian, then use original movement and grounded trailing-edge clearance. The normal combat, hazard pressure, AI, floor-nine continuation and historical/unflagged fixed-step policy remain in control.
- [Original 3D seal `67d53573`](https://github.com/my-edutu/Ai_games/commit/67d53573b55f94275f5d3ff498ac752d899bfed4): before the actual guardian dies, reuse the physical cap arch and bronze leaves at the fixed authoritative plane, with a five-instance translucent vertical lock lattice showing why jumps and dashes cannot bypass it. After source-defeat, release the same doorway via its existing sequence; no invented boss death, hidden win, new collision from the renderer, frame-clock gameplay or copied assets.
- [Actual scene wiring `2bb21226`](https://github.com/my-edutu/Ai_games/commit/2bb21226ea222de02a2248b1c146f9fd75b8cd7e): living guardian snapshots show the closed architecture, source-dead snapshots open that same architecture, and true old-floor-to-new-floor handoff stays intact.
- [Additional adversarial fixtures `1c540144`](https://github.com/my-edutu/Ai_games/commit/1c54014451b912f5874f3c32ff2b2342d0bf19de): dash tunneling and positive/negative public-source lock correspondence.

**Scope:** `games/infinite-tower-climb/src/physics/step.ts`, `public/infinite-tower-climb/visuals/guardian-passage.mjs`, `public/infinite-tower-climb/visuals/scene.mjs`, `tests/phase2/tower-guardian-earned-exit.test.cjs`, this dated review, and existing transformation evidence only. No other game or PR58 files.

## Verification — do not mislabel authored work as observed quality

- **Source read:** PR68 head, AGENTS.md, approved design, GAUNTLET, physics/rules/cap/presentation and current tests inspected. Same guardianExitX and clearance calculation was verified by direct source inspection.
- **Runtime red / green:** **NOT EXECUTED.** Node 22 original checkout unavailable because the remote development tunnel reports `NOT_FOUND: Tunnel-client has not been seen for 300 seconds`. Test source was committed but not run on the authentic game.
- **Build / exact-head CI:** **NOT EVALUATED.** The old [nine-job source-pinned run](https://github.com/my-edutu/Ai_games/actions/runs/42281114266) was still 9/9 **queued with zero artifacts** when inspected. This run predates these commits. A separate [older quality run](https://github.com/my-edutu/Ai_games/actions/runs/42281114269) was pending earlier; do not assume either validates this new head.
- **Campaign:** **NOT EVALUATED** — no two actual 3,200-tick 20 Hz authoritative campaigns proved real guardian/crusher victory, locked-to-open threshold crossing, floor-nine landed traversal, authentic game result/intermission and restart in the same episode.
- **Footage:** **NOT EVALUATED** — no new 60+ second continuous source-matched 960×600 and 390×844 baseline/candidate WebMs inspected. Historical `8fd9018f` portrait film only shows undersized hero/guardian and unclear doorway payoff, not this new head's quality.
- **Independent blind LOOKS, FEELS, PLAYS:** **0/5 for each**. **Supported-device p50/p95/p99 and memory:** NOT EVALUATED.

## Re-review / implementation risks

The lock blocks the leading edge for approach from the near side; an actor already beyond the plane at load time is not repositioned by this incremental source change. The visible energy lattice must be visually checked for brightness/occlusion, and actual AI behavior must be tested for stalls or combat-route trapping. This barrier is opt-in; unchanged legacy simulation must be checked for byte-for-byte deterministic replay. Do not mark this successful because a fixture says a wall exists.

**Next highest-impact action:** Restore an exact-SHA Node22/Chromium runner, run `npm run build && node --test tests/phase2/tower-guardian-earned-exit.test.cjs`, run the unchanged 3,200-tick dual campaigns, and inspect original paired 60+s native desktop/portrait footage. Verify source guardian + real crusher counterplay, player blocked before defeat, visible door release, ordinary grounded whole-body crossing, floor-nine onward, actual outcome/restart, then address the largest observed playable or composition defect. Device profiles and independent randomized blind reviewers are still mandatory before P6.

**Safety:** Baseline is frozen; no merge, deploy, force-push, PR58 rewrite, or draft conversion.
