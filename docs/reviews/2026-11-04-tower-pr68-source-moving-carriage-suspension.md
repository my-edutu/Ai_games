# Tower PR68 — source-driven moving carriage / mechanical scale (2026-11-04)

## Scope and exact source
- **PR**: [draft #68](https://github.com/my-edutu/Ai_games/pull/68), `feat/tower-transformation-gauntlet-20261101`, over active 3D Tower draft PR #58. No changes to PR #58, main, deployment, or frozen baseline.
- Inspected pre-edit PR68 head `f989080bff15410aa8745f1aa46aeb79b7fdee52`, binding AGENTS/spec/GAUNTLET and the independent transformation evidence.
- **Frozen baseline**: `1731b380851162741761c5569e2bc152a0869ca9`, unchanged.
- New playable scene: module `moving-deck-suspension.mjs` at `91d034262da1dc1dc7a6af62b8846803e7d3594e`, real renderer integration `fec33943c9824a8b5561883a69eba7f476191981`, regression contracts `06c80c2c038eb2698867150af2311f073110a2bc`.

## Why this part of the SAME transformation
Visual inspection of the *actual native portrait and desktop captures* for source `ee35c7c3efa63486981cfc991310aa42d6ee32d0` found an expressive climber and increasingly coherent biomes, but moving decks can still read as thin isolated slabs, particularly against large tower facades in a portrait. The tower/ledge/motion fantasy needs mechanical support as well as route markup. This is a builder observation, not an independent randomized quality verdict.

The current continuing vertical slice now links the source-observed moving platform, already-existing real-deck gear and compression piston, rider counterbalance, actual source-selected landing architecture and a mechanically legible under-deck suspension. It does not create a simulated bridge or claimed safe landing.

## Playable implementation
- Create a **twelve-member, paired three-dimensional under-deck carriage**: cross-braced internal suspension, side rails and load struts behind the actual traversable lane.
- Anchor its eight 3D points to the **current authoritative source platform position**, effective deck top, floor base, and cylindrical world width. The source platform genuinely moves; the same world-space suspension follows it.
- Select only a real moving platform under the standing climber's feet, or a moving platform explicitly selected by the current AI route intent. Only real foot overlap can energize the loaded stance. A guardian telegraph, stale source, non-running lifecycle, death or irrelevant route clears it.
- Use **one depth-tested instanced draw with twelve bounded members**, no new dynamic light, cast shadow, per-frame geometry creation, time-driven platform movement, collision, camera authority, AI or HUD.
- Reset across restart and graphics restoration. Expose source tick, platform ID, foot-load status, draw count and geometric provenance to renderer diagnostics.
- Tests cover authoritative selection, no phantom route, duplicate-tick stability, genuine source motion, finite 3D instancing, lifecycle cleanup and context restoration.

## Source-authentic video examination (earlier implementation only)
[Unmodified source-host capture run 41769420556](https://github.com/my-edutu/Ai_games/actions/runs/41769420556) now completed **9/9 jobs**, including baseline and candidate ascent, moving-deck, danger and outcome recordings, and the ledge job. Each role retains its original host source rather than overwriting frozen baseline code.
- Original ascending portrait video metadata: baseline source `1731b380`, **106.696 s**, low tier 390×844, sampled offscreen **0**, unsafe **0**; earlier candidate source `ee35c7c3`, **109.873 s**, same tier/viewport, sampled offscreen **0**, unsafe **0**.
- Earlier candidate moving portrait: **98.467 s**, source moving-deck state in **19** sampled frames, **18** distinct source positions, **15** scene-driven samples; sampled unsafe actor **0**. These are programmatic trace observations, not quality scoring or supported-phone performance.
- Four sampled native frames per ascent/portrait and four native moving/portrait frames were visually inspected. They show real changing floor, world, AI pose and hazard state, but still reveal heavy foreground structure and inconsistent event alignment. The checked images and the movement trace are not a substitute for independently viewing all full-motion clips.
- The earlier candidate ascent trace shows actual result and intermission source snapshots and **one** token transition, while the baseline trace sampled no result phase despite three token transitions. The pair is **not event-matched** for a full-play critic. Thus these files cannot certify a preference or a complete rendered outcome/restart.
- The software-GL capture's recorded render submission intervals are **not GPU-presented FPS**, especially not supported physical phone p50/p95/p99. No device-performance win is claimed.

## Safety and unresolved gates
- Latest new-source [Tower Transformation quality workflow](https://github.com/my-edutu/Ai_games/actions/runs/41774673596) was **QUEUED** at review preparation. No final-source technical PASS asserted.
- Deterministic authority and replay are unchanged: the added stage reads public immutable snapshots and does not mutate them, AI commands, enemy HP, movement, collisions, result/restart, seeded RNG or audience events.
- Motion-free and low-tier views preserve the same structural silhouette. No flashing cue, extra text or forced audio; stage yields to active enemy warnings. Real mobile color/contrast and partial occlusion still require normal-speed visual inspection.
- Resource budget from code: 1 fixed cylinder geometry, 1 standard material, 1 instanced mesh, 12 matrices, 8 reused vectors, 0 extra shadow passes. Actual device frame-time tail, GPU and memory budgets remain **NOT MEASURED**.
- Full-screen capture and independent worker/browser critic are not accessible from this source-editing connection; no five fresh randomized blind verdicts available. Independent LOOKS **0/5**, FEELS **0/5**, PLAYS **0/5**.
- **Biggest open experience gap**: confirm that moving-deck mechanical scale improves actual moving-platform understanding without masking the hero and hazards in real portrait and desktop motion, then establish event-matched same-seed baseline/candidate ascent, high-stakes and complete outcome/restart footage with genuine independent critics.

## Decision
**Whole-game transformation: NOT EVALUATED.** Keep this single initiative open. A source commit, tests, screenshots, 9/9 captured jobs or clean CI are never a Gauntlet victory. The next run should inspect authentic new-source video and resolve any geometry/occlusion failure before independent critique.

## Rollout/rollback
Draft PR only; no merge/deployment. Revert the stage import/update/construction and its standalone module if real footage shows a worse mobile silhouette or unacceptable supported-device frame-time/memory tails. Maintain untouched baseline and PR58 for comparison.
