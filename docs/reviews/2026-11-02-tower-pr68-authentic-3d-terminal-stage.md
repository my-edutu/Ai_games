# Infinite Tower Climb — source-authentic 3D expedition ending and restart stage

**2026-11-02 · [draft PR #68](https://github.com/my-edutu/Ai_games/pull/68) · SAME TRANSFORMATION OPEN · GAUNTLET QUALITY NOT EVALUATED**

## Actual source and evidence inspected

Reviewed the latest PR #68 head before editing (previous head `cd795ce11ad7ed4bdffd0250437ced284a0c5e3a`), active parent [PR #58](https://github.com/my-edutu/Ai_games/pull/58), `AGENTS.md`, approved [transformation design](../superpowers/specs/2026-11-01-infinite-tower-transformation-gauntlet-design.md), `games/infinite-tower-climb/GAUNTLET.md`, frozen `public/infinite-tower-climb/gauntlet/transformation.json`, full actual `visuals/scene.mjs`, `characters.mjs`, `finale.mjs`, guardian passage and world, snapshot and runtime, host and current full-motion recorder. Reviewed pre-existing camera, pose, finale, encounter and visual capture tests.

The latest previously completed [native desktop and portrait real-game capture](https://github.com/my-edutu/Ai_games/actions/runs/41384300565) is **not the new source**: it filmed candidate `759511220fd8ead37538aea3cf766ee3ee86d720` and frozen baseline `1731b380851162741761c5569e2bc152a0869ca9`; six of seven scoped jobs succeeded, while frozen outcome failed **both** native viewports. Prior exact-source [technical run](https://github.com/my-edutu/Ai_games/actions/runs/41384300584) was **CANCELLED**. Neither is a current quality or technical acceptance.

## Largest connected playable-experience deficit

Prior implementation strongly emphasizes ascent and guardian combat, but the end of an expedition is not yet an equally physical, comprehensible conclusion. The frozen baseline result is real but lasts one 20Hz source tick (~50ms), often invisibly between software-rendered/video frames. The candidate stream has an AUTHENTIC source-controlled hold and intermission, but before this change its original falling crown, ring and stone pieces did not distinguish a still-living timeout from physical death, did not show the run's actual cleared floors in the world, and inherited follow framing from an obsolete route target. This round improves one **complete 3D end-of-run beat** of the same ascent→guardian→outcome→restart transformation, not one isolated animation milestone.

## Actual gameplay changes committed on PR #68

- `visuals/characters.mjs`: the *existing fully skinned* explorer now reads real `snapshot.result.kind` only during real result/intermission. A game terminal with a living climber gradually transfers weight into a surveyor's kneel with lowered gaze; a technical/operator stop instead retains a calm upright halt. Health-depleted characters retain the existing actual death pose. Fresh running snapshots immediately remove terminal posture, and reduced-motion mode holds the final stable physical pose. The character root and simulation/colliders never move.
- `visuals/finale.mjs`: the real spatial terminal sculpture gains **eight source-earned architectural floor rungs** from `snapshot.progress.floorsCleared`, batched in one instanced mesh reusing existing geometry. Earned ones have a significantly taller profile; unearned positions stay visually dormant. Two original material tones are secondary to the physical height difference. A bounded two-tier layout rotates with the actor's true tower azimuth and sits exterior to opaque masonry, not across the collision-aligned tower core. The source updates the eight transforms only when the actual milestone count changes, clears on restart, and never invents extra floors.
- `visuals/scene.mjs`: a source-gated end-stage director selects a **tower-exterior perspective** of the authentic climber and milestone group for desktop and narrow portrait. It replaces the obsolete route composition only during an actual result/intermission, follows at bounded speed without teleporting or altering authority, and repurposes the existing non-shadowing rim, key and ambient for a subdued ending. Genuine technical/operator reasons tint the existing light differently. No new shadow maps, light sources, overlays, clocks, reward state or victory animation.
- `tests/browser/tower-live-motion.spec.cjs`: the unchanged normal-speed live-host capture path now records source result, cleared floors, physical finale diagnostics and final camera diagnostics beside existing source ticks and real WebM, so full-motion observation can challenge rather than assume the ending is visible.
- Tests in `tower-finale-source.test.cjs` and `tower-encounter-composition.test.cjs` now exercise real source-rung count, earned/dormant geometry, restart isolation, skinned climber nonlethal/technical/reset pose and portrait+desktop exterior camera projections.

Engineering commit references:
[terminal sculpture](https://github.com/my-edutu/Ai_games/commit/6bd7dd035b974ca6eb1c7023aba3e4151ad0b532),
[skinned result pose](https://github.com/my-edutu/Ai_games/commit/0765b967ea22062b7efd4f70d3fab69132557318),
[camera and light](https://github.com/my-edutu/Ai_games/commit/9eaaad9a48d56929e5d7afa5c9734622efbca3fd),
[core-safe exterior rung positioning](https://github.com/my-edutu/Ai_games/commit/1e77b82bcc8596086e5cba67db35d26becfadb61),
[terminal camera size correction](https://github.com/my-edutu/Ai_games/commit/fe42557211e306029c3e9f6461395fa2449cfc0f).
Most recent implemented scene source SHA **`fe42557211e306029c3e9f6461395fa2449cfc0f`** (document/metadata commits may advance the branch head without changing that rendered source).

The terminal camera keeps a minimum wide-enough shot even if a viewer had zoomed into a ledge immediately before authentic result/intermission; zooming out remains available. Tests include the previous manual zoom lower bound and current capture logs its actual smoothed camera.

## Separate source/specification assessment

The extra floor rungs are terminal **presentation**, not a floor award or alternate progression authority. They depend solely on immutable public `progress.floorsCleared`, are capped at eight instances and reset with the source lifecycle. The terminal posture is gated by actual `result.kind`, the current run and current lifecycle. Real physical death remains death. The camera uses the actual actor and original cylindrical geometry; the screenshot/camera diagnostics are observations, not synthetic rules. No authority, AI, seeded RNG, combat, collision, replay, external influence, paid-influence, privacy or snapshot structure was mutated. No extra on-screen text was added. Rendering is optional and reclaimable using the existing resource ownership; device memory and frame times have NOT been measured.

## Independent quality and technical blockers

**Gauntlet overall: NOT EVALUATED.** Test additions are committed, JavaScript source parsing was checked, but **complete test suite and exact-head CI were not executed or verified in this execution** because the development workspace tunnel was disconnected (`NOT_FOUND: Tunnel-client has not been seen for 300 seconds`). Native desktop/phone real-gameplay recording of source `fe425572` has NOT been inspected; neither were any eligible baseline/candidate 60-second matched pairs graded. Five genuine blind randomized reviewers per LOOKS, FEELS and PLAYS were unavailable, leaving each at **0/5 verified candidate votes**. Supported-device p50/p95/p99, memory, replay and accessibility remain unverified. The frozen baseline **must not** be modified, artificially held or described as showing a visible result phase while its 50ms result is missing.

Remaining critical experience questions: Do viewers actually see the source-authentic kneel, physical run-progress rungs and exit to the next genuine run rather than a clipped, occluded or too-wide portrait tableau? Does its slow exterior camera preserve the actor, guardian aftermath and real result, then return smoothly to normal ascent? Does the full-motion source-vs-baseline A/B win each pillar for independent viewers, without undue camera motion or original audio/guardian/route regressions? Video and device results, not code or this self-review, determine that verdict.

## Continuing execution contract

Keep the frozen baseline `1731b380851162741761c5569e2bc152a0869ca9`; do not rebase away or modify concurrent PR #58 commits. Leave **PR #68 draft, unmerged, undeployed**, with no force-push or schedule change. Preserve the current unfinished transformation until complete honest full-motion, independent and hardware evidence exists. The on-screen /tower/gauntlet verdict remains **NOT EVALUATED**.
