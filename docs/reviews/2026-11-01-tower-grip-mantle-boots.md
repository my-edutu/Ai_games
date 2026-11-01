# Infinite Tower Climb — Gauntlet 42: protect suspended boots under authentic ledge contact

**Source:** draft [PR #58](https://github.com/my-edutu/Ai_games/pull/58), previous head `d159e1a1e11986bdcbe1369b23d95fa3c21320d2`, test-only RED `67b9f9daf9cee37841448ecbe7931f100666ce8b`, GREEN source `e1fe41d1d3db92f2ecd2ff1bfeb61985024f12a5`. SELF-REVIEW ONLY; independent coding/critic worker unavailable (tool returned `NOT_FOUND: Tunnel-client has not been seen for 300 seconds`).

## First, observed GPU evidence rather than a guessed result

Verified the previously pending **Gauntlet 15** [Tower Landing run 41168718432](https://github.com/my-edutu/Ai_games/actions/runs/41168718432) finished **SUCCESS** and artifact `13029769123` contains real same-state before/after desktop + portrait screenshots and source-sha marker `687b662367855b5aa928a10d65117e7ed25183f8`. Downloaded and opened the images directly. The double-chevron communicates the destination better than the gold pickup; it is NOT proof of a full commercial comparison or real-time FPS.

Downloaded exact-source [Tower Ledge GPU artifact 13070421903](https://github.com/my-edutu/Ai_games/actions/runs/41274338278/artifacts/13070421903) from successful run `41274338278`, with source marker `d159e1a1e11986bdcbe1369b23d95fa3c21320d2`. Inspected all 16 actual desktop and 16 portrait authority-tick PNGs (including authentic contact tick 298, checksum `13941b9e`), not just a renderer log. At contact the finger aligns to the real upper deck while both feet dangle. The full climb and independent Jusant/ASTRO BOT comparisons still fail the acceptance gate.

## ONE independently judgeable failure

The newly staged mantle cue remains non-null while the real 2-link IK finger is gripping. In the actual shipped `createClimber`, the early `ledgeLegBlend` bends both suspended legs, then the subsequent `ledgeMantle` loop unconditionally overwrites the boot/knee rotations. Thus an unrelated *cosmetic* vault hint can unbend a truly suspended boot while the hand is still anchored. No collision/AI decision or authoritative landing is fabricated or changed.

**Test first:** appended a real Three.js skinned-rig comparison to `tests/phase3/tower-ledge-geometry-contact.test.cjs`: identical real contact, camera azimuth and 16 pose steps, with/without an overlapping mantle cue; knee angles must stay identical while fingertip still meets the real deck. Exact test-only [RED run 41275108197](https://github.com/my-edutu/Ai_games/actions/runs/41275108197) ran build and 17 dedicated tests; **16 passed, 1 failed**, exactly `a cosmetic mantle hint must not uncurl a boot while the hand is truly gripping: -1-knee`. This was a real assertion failure, not a CI setup error.

**Implementation:** shield the mantle leg override behind `!genuineLedgeGrip`, using the same contact truth already guarding the arms. Keep the cosmetic mantle over the remaining airborne arc when there is no real grip. No new geometry, material, light, draw call, public snapshot, authoritative movement, seeded randomness, replay key, or camera policy. [GREEN run 41275186638](https://github.com/my-edutu/Ai_games/actions/runs/41275186638) has build and dedicated logical tests **SUCCESS**; browser original-source GPU capture is in progress at this entry, **not yet passed**. No fabricated screenshots, device FPS, independent review or motion judgments.

## Two-pass SELF-REVIEW and open gates

**Specification:** Only truly valid reach IK defers cosmetic boot positioning. Ordinary mantle, fall, run, attack, no-target, and post-contact visual pose paths remain assigned as before. No physics or stream authority modified.

**Quality:** The test isolates regression with actual skinned knee joints, and the conditional decreases competing animation writes. Still need to inspect exact after-source pixel output at the genuine frame, specifically both dangling boots, toe/deck clearance and the tick 298→299 release; the more comprehensive climb does **not** match Jusant hand-over-hand weight or ASTRO BOT action finish on observed evidence. Fixed-step logic/green build does not prove normal-speed animation, intended-device sustained FPS, accessible play or long-run stability.

**Next automatic priority:** download green GPU artifact and verify the physical before/after at exact source and ticks; if any penetration or new jerk appears, return this single scoped issue to the builder. Afterwards seek independent fresh-context blind Jusant/ASTRO BOT comparison and device performance/soak tests. This PR stays draft, unmerged, undeployed.
