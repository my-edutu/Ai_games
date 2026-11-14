# Round 16 — original eroded cliff geology

**Goal:** replace background's repetitive green cylinder-like rock silhouette with physically layered stone and visible eroded overhangs, while retaining readable deterministic Snake gameplay and no added steady-frame draw calls.

**Visual reference:** official Snake Pass scenes. Benchmark comparison is pending; this is not a claim of visual parity.

**Implementation:** a single 15-ring, 28-side shared `buildHeadlandGeometry` with recessed and protruding stone shelves, angular fracture relief, and smooth seam normals, using the existing `distantRock` textured material and static merge path. No extra materials or textures and no changes to any playable position.

**Test evidence:** new test went RED on absent geometry export; after implementation it passed. Existing horizon tests retain all four camera sectors and byte-identical playable court vertex hashes at three board dimensions. 39 focused Snake tests passed locally. The next isolated browser runner must produce real overview/character/portrait captures and unchanged 17-actual-render desktop gate results.

**Review verdict:** MODEL PASS; VISUAL COMPARISON PENDING; WHOLE GAUNTLET LOSE/OPEN. Independent critics unavailable through shared worker tunnel; do not fabricate their verdict. Stop-ship/rollback: if real images look worse, or frame pacing/resource gates regress, revert this headland primitive before continuing.


## Revision 2: actual browser critic response

[Exact head `bb6cc7a` focused run 41172211493](https://github.com/my-edutu/Ai_games/actions/runs/41172211493) completed **15 passed, 1 failed**. The unchanged desktop pacing acceptance still failed at **16 actual draw submissions /1003.5ms** (minimum 17), even though animation callbacks averaged ~60.79/s. The frame-buffer size was 1058×483, with an active static cache. This is not a passing FPS result and differs in sampling conditions from prior runs.

The actual [Round 16 first-candidate character and overview captures](https://github.com/my-edutu/Ai_games/actions/runs/41172211493/artifacts/13031403527) showed a prominent failure: rock overhangs read like regularly stacked horizontal discs, not weathered geology. Source-level geometry closure alone did not prove visual quality. **Self-review verdict: LOSE**; no independent critic is claimed.

A new regression asserts nonhorizontal stratification and bounds adjacent radii to avoid disc-like shelves. It failed on the published first-candidate geometry, then passed on a revised 15-level profile with tempered radial steps and gentle angle-dependent vertical bending. Existing seam normals, 13 static batches, no new textures, all scene bounds and exact playable-court hashes remain. The isolated `node --test tests/phase3/snake-*.test.cjs` passed **39 tests, 0 failures** on revision 2. Updated screenshots and performance are pending exact-head CI. This is a continuous user-authorized Gauntlet loop, not a claim of benchmark victory.
