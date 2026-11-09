# Infinite Tower Climb PR68 — independent earned doorway and real airborne landing (2026-11-09)

**Stage:** P0 EVIDENCE + GAME-LOOP TRUTH — OPEN  
**Verdict:** NOT EVALUATED  
**Implementation:** [50cf618ea1176b9369a91c099974516327c18ca2](https://github.com/my-edutu/Ai_games/commit/50cf618ea1176b9369a91c099974516327c18ca2)  
**Parent inspected:** 1ee435c8a46a2ec3e98be4e37da189e6e6368668  
**Frozen baseline:** 1731b380851162741761c5569e2bc152a0869ca9 — unchanged  
**Draft PR:** https://github.com/my-edutu/Ai_games/pull/68

## Specification/experience defect

Source inspection found the airborne gateway renderer handed an object `sourceAirborneWalk` to `sourceCriticalSightlinePriorities`, whose contract requires the literal boolean `airborneGateway === true`. The source-earned airborne gateway branch therefore did not activate alongside a selected real airborne landing. Moreover the scene reused one `actorOrbitTarget` 3D coordinate for different action destinations, so prioritizing a gate camera could erase the landing's distinct clearance. This is source-code evidence, not a reproduced current WebM defect.

## Cohesive rendering correction

- Bind `airborneGateway` to the actual authoritative-shot-derived `realAirborneCap === true`. No victory event is invented; missing/falsy source still cannot open the gate.
- Retain `observedLandingSightline` from `observedSourceLandingX` and the actual snapshot platform, even when the genuine gate takes camera emphasis.
- Send both world coordinates to the same `world.protectRouteSightlines` call: real actor, living guardian, selected landing, imminent hazard and earned gateway. Extend from three to four preallocated corridor endpoints; at most nine target ray samples per decorative assembly. Real collidable decks, crusher cells, game authority, guardian HP and progression are untouched.
- Preserve terminal/restart presentation and reduced-motion/stale behavior. Source-lens focus remains a bounded presentation choice; no extra render pass, scene clone, fake silhouette or speculative AI destination.

## Evidence and risk

**CONFIRMED:** Commit uploaded and read back from GitHub, exactly two shipped Tower render sources plus one test changed. Focused test was authored asserting boolean shot handoff and independent geometry corridors.

**NOT EXECUTED:** Original Node/Three.js tests, deterministic source campaign, Chromium playback, new 60+ second native WebM, 960x600 and 390x844 event pair, actual-device p50/p95/p99/memory, and real visual comparison. Exact-source GitHub runners remained unavailable; prior quality run [42575202281](https://github.com/my-edutu/Ai_games/actions/runs/42575202281) was pending. Do not call isolated source assertions gameplay acceptance.

**Independent blind reviewers:** LOOKS 0/5, FEELS 0/5, PLAYS 0/5. Final P6 threshold not met.

**Largest observed historical footage defect:** A giant near-side wheel obstructed the airborne hero and guardian near 16.5–18s in the [OLD original portrait film](https://github.com/my-edutu/Ai_games/actions/runs/42426089449/artifacts/13594459833). The current correction and other recent visibility fixes have not been viewed in a matching current capture.

## Next highest-impact action

Acquire source-pinned executable runner; run current Node/Three tests and two complete original 3200-tick guardian/crusher → true grounded gateway → floor nine → result/intermission/restart campaigns. Record matched real 960x600 and 390x844 60+ second ascent, moving danger and outcome footage, pair native PTS with actual source events, review the continuous motion. Address the largest *visible* regression before advancing beyond P0. No baseline move, merge, draft conversion, deployment, force push or PR58 change.
