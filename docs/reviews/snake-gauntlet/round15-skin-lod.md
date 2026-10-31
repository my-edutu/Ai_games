# Round 15 — distance-aware serpent skin shading

Base exact branch `982f925645c530219e6341c09ba9f096dc5d5d3b`; serpent source blob `2563746b1c63e3a7c07cc0a351142915cf74ad34`.

## Highest-impact unmet slice

The fixed official Snake Pass reference still wins on expressive material detail and consistent animation; the unchanged full-HD desktop gate requires >=17 **actual render submissions** in its sample. [Prior exact-head run 41170386701](https://github.com/my-edutu/Ai_games/actions/runs/41170386701) passed 15/16, but submitted only **10 draws in 1006.4ms**, despite ~60.61 RAF callbacks/s. A separate diagnostic in that job, at fixed DPR 0.4 on a minimal page, measured ~31.17 submitted FPS full render versus ~38.15 omitting serpent/contacts; these are not representative comparative production results, but identify substantial dynamic character cost.

## Production candidate

Two pigmented meshes — continuous body and sculpted skull — switch to precreated single-map Lambert shaders at the existing low-detail camera distance. Their **exact original authored color textures** stay in use. Returning to the close character view restores the original full PBR bump and roughness maps, unchanged. Mesh coordinates, expression, portal separation, world camera, snapshots, AI, score, cue/caption channels, reduced motion, fallback, shader cache and bounded GPU queue are untouched. The two alternative materials allocate only on creation, not per frame.

The new `tests/phase3/snake-skin-lod.test.cjs` exercises 120 overview/detail transitions, original pigment identity, high-resolution relief restoration, portal discontinuity indexing, empty state and unchanged resource budgets.

## Review limitations and follow-up

Self-review only: the diffuse overview may lose some highlight definition, although this is subpixel at broadcast camera scale. The existing exact-head browser test automatically captures real overview, character, portrait and motion images; **new candidate capture and CI results are pending as of this commit**. No throughput win, original-Snake-Pass parity or independent critic is claimed. The specialist workspace tunnel is offline, so no independent verdict was fabricated. Performance and whole-game quality gates stay OPEN. Revert these two alternate material constructors and the detail switch to roll back. Never merge/deploy; keep PR draft.
