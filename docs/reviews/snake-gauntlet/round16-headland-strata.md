# Round 16 — original eroded cliff geology

**Goal:** replace background's repetitive green cylinder-like rock silhouette with physically layered stone and visible eroded overhangs, while retaining readable deterministic Snake gameplay and no added steady-frame draw calls.

**Visual reference:** official Snake Pass scenes. Benchmark comparison is pending; this is not a claim of visual parity.

**Implementation:** a single 15-ring, 28-side shared `buildHeadlandGeometry` with recessed and protruding stone shelves, angular fracture relief, and smooth seam normals, using the existing `distantRock` textured material and static merge path. No extra materials or textures and no changes to any playable position.

**Test evidence:** new test went RED on absent geometry export; after implementation it passed. Existing horizon tests retain all four camera sectors and byte-identical playable court vertex hashes at three board dimensions. 39 focused Snake tests passed locally. The next isolated browser runner must produce real overview/character/portrait captures and unchanged 17-actual-render desktop gate results.

**Review verdict:** MODEL PASS; VISUAL COMPARISON PENDING; WHOLE GAUNTLET LOSE/OPEN. Independent critics unavailable through shared worker tunnel; do not fabricate their verdict. Stop-ship/rollback: if real images look worse, or frame pacing/resource gates regress, revert this headland primitive before continuing.
