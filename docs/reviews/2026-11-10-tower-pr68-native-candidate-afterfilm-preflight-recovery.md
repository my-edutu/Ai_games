# PR68 P0 — Original after-film inspection and capture preflight recovery (2026-11-10)

## Source of truth and stage
- **P0 EVIDENCE + GAME-LOOP TRUTH remains OPEN; transformation verdict NOT EVALUATED.**
- Original game candidate: `2a6a64200af37514d5d9ece7cff8646f519f3c96` from [workflow 42771687053](https://github.com/my-edutu/Ai_games/actions/runs/42771687053), eight immutable baseline/candidate scenario captures.
- Frozen original baseline: `1731b380851162741761c5569e2bc152a0869ca9`, unchanged. Existing open draft PR68, no merge/deploy.
- Original [candidate danger artifact 13742547841](https://github.com/my-edutu/Ai_games/actions/runs/42771687053/artifacts/13742547841), [candidate outcome artifact 13741568546](https://github.com/my-edutu/Ai_games/actions/runs/42771687053/artifacts/13741568546), [original paired source events 13742159135](https://github.com/my-edutu/Ai_games/actions/runs/42771687053/artifacts/13742159135).
- Directly extracted native-video frames at 8,10,12,14,15,16,17,18,20,22,24,26,30 seconds for both desktop 960×600 and portrait 390×844 from the UNALTERED candidate WebMs. Visual comparisons here are scene inspection, NOT blinded acceptance or proof of every event.

## Important authentic visual defect
The new open-air guardian high-X remains visually intrusive **despite removal of the earlier full-height horizontal prison grid**. At 14–24 native seconds, tall cyan conductors, crossed diagonal wires and a dense lower turquoise doorway, together with bronze clockwork and arch framing, intersect or compete with the real airborne climber and guardian in portrait. The desktop scene contains the same overlapping source-locked energy/door layer; the hero can be visible, but action silhouettes are not yet consistently uncluttered. The issue is a **whole-encounter physical composition problem**, not a missing CSS, test count or simple material-color change. The candidate's native 26-second frames do show purple floor-nine onward, but the near-instant authoritative defeat → grounded clearance → floor change has NOT been independently proved screen-visible as an uninterrupted causal chain. Full-motion subjective preference has NOT been evaluated.

## Genuine CI blocker identified, not a failed capture
[Recording workflow 42771687053](https://github.com/my-edutu/Ai_games/actions/runs/42771687053) was overall FAILED because ALL eight recording matrix jobs encountered an identical **unrelated preflight test error**, not because desktop or portrait WebM capture failed:
`tests/phase3/tower-event-frame-probes.test.cjs` called `assert.match(actual, 'original-WebM-sha256')` with a string rather than a `RegExp` (Node: “The regexp argument must be an instance of RegExp”). This occurred before actual playback, setting `PREFLIGHT_OUTCOME=failure`. The original desktop and portrait Playwright capture, native transport checks and original event-neighbor frame probes passed within those jobs; the final job veto correctly rejected the invalid preflight. Artifacts were retained. The separate source-event-pairing job passed: **8/8 source/native clocks calibrated, zero provenance or source-story defects, 16 original unedited WebMs**; these are evidence transport facts, not game-quality passes.

The invalid test assertion was **already corrected in branch HEAD** `b7cfe0751e05b60d9744907b0c9ea11114f9dbf6` before this work. [Exact-HEAD integrity workflow 42771889397](https://github.com/my-edutu/Ai_games/actions/runs/42771889397) returned success, but it is only a safety gate and does not retroactively turn the older failed capture jobs green. A new real exact-source recording request must be made at the corrected commit and examined without weakening the preflight veto.

## Specification review
- Correct source SHA and baseline freeze maintained.
- Real continuous original video transport, clocks and event-pairing preserved; no spoofed screenshots or invented in-game awards.
- P0 has not passed. P1–P6 should not be promoted by builds alone; 0/5 independent critics for LOOKS, FEELS, PLAYS and physical-device p50/p95/p99/memory all remain NOT EVALUATED.
- Safety and deterministic source authority are unchanged by this evidence-only run.

## Quality/experience review and next largest playable slice
The strongest systemic remaining gap is **readable guardian/crusher/floor-nine causality on both cameras**. Inspect the fresh corrected-source full-motion 60+s native guardian and outcome recordings, including frame sidecars and source timebase around 12–27 seconds. Identify the exact live occluding geometry/camera relationship, then stage a **coherent real 3D solution for the living guardian and earned gateway** while preserving the actual source-locked crossing and no aerial bypass, rather than repeating isolated translucency, material opacity, HUD or single-rung edits. Then validate deterministic replay, supported devices and five genuinely independent randomized full-motion critics for each pillar. If unavailable, leave NOT EVALUATED.

**This entry is original-film diagnosis plus evidence capture unblocker, not an experience-change commit or independent acceptance.**
