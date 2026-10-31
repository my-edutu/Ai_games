# Living district continuation — 31 October 2026

## Scope
Continue the user's Pioneers of Pagonia Gauntlet on draft PR59, preserving the exact recovered HD base 6a1ed848. No main merge, no production declaration, no commercial reference victory.

Input HTML SHA256: b729a47541cf68509420bb685a9bdff4045f5a4461767d80f42b90a2d194d4e5.
Candidate HTML SHA256: 42e1dc44ab68c1fafefc31365aca0d1c563b5a4bde52a4df75595063978324d9.

## Implemented
- Original 512x256 alpha-tested leaf atlas, world-fixed broadleaf/needle clusters, matching shadow cutouts and deterministic wind. Branches, roots and clustered fern understory replace stacked solid crown shapes. No commercial assets copied or external asset request.
- Roof dormers, flower petals and fixed-plaza/planting geometry cached with the static scene.
- Shared sphere topology and bounded 32-entry rigid citizen identity mesh cache. Moving limbs, work poses and attached equipment still animate. Reset/restore invalidates stale cached identities.
- Continuous facial normals, refined nose/jaw, rounded grounded boots, palms and thumbs.
- Actual selected-citizen close-up with a building/tree obstruction search, next/return controls and a compact mobile identity strip. It does not move authoritative citizens. Reset/restore leaves portrait mode safely.
- Separate journal `/tiny/living` with pinned before/after, six profession close-ups, phone/night captures, live sequence and honest measurement fields.

## Local evidence and TDD
35/35 focused tests passed using real ANGLE/SwiftShader after fixing the local virtual-display setup. The initial 19/22 baseline result was a host WebGL problem, not a suppressed product test. Red-to-green findings included missing mesh cache/camera APIs, over-budget solid foliage, 341 facial normal seams, reset retaining a portrait camera, an obstructing mobile inspector, missing dormers and a missing HTTP journal route. The implementation was changed rather than increasing the existing static geometry budget.

The source-only assembly was applied onto pinned baseline files and re-run idempotently; all four output hashes matched. The stage validates every input/output before writing any file and refuses source drift.

The exact 90-day simulation result remains 27 citizens,24 buildings,food394.5907866665433,wood21.200000000000657,gold555.1999999999963,24 citizens with recorded friendships, all positions walkable. Rendering/camera tests preserve snapshots and the seeded random stream. This is accelerated simulation, not a real-time soak.

The local complete catalogue attempt finished with 380 passes and33 failures with missing `three` dependency traces. It is not a clean suite pass. Dependencies cannot be installed in the local network environment. The CI workflow installs locked dependencies, runs existing browser tests and the complete catalogue, fails closed, then records the actual final counts in `living-verification.json`. Read that record rather than treating a staged build as verified CI.

## Measurements and visual review
Actual 1920x1080 village/forest frames, all six professions,390x844 mobile,night and live-browser video were inspected locally. The live farmer sequence uses normal deterministic pre-roll to just before arrival, then the existing4x speed. It records actual Harvesting grain and travel transitions and resources; no citizen teleport or fabricated delivery inventory.

A quiet local preliminary comparison reduced median12-citizen mesh generation from18.6ms to8.6ms; full software-WebGL frame rate did NOT improve in that sample (about1.87 vs1.75fps). A later capture ran under test contention and is not a fair speed comparison. The CI capture runs baseline and candidate sequentially after tests, and its manifest is the final measurement source. Mesh generation excludes GPU rendering; never turn its improvement into a claimed FPS gain.

At the inspected noon village:107577 static and28798 dynamic ordinary triangles, plus7680 separate leaf triangles. The old geometry audit does not include the new leaf stream, so the journal reports it separately. All inspected ordinary normals/components/colors and leaf components were valid; no page errors. Leaf buffer uploads remain cached when paused.

Self-review, not an independent critic: foliage silhouettes and character visibility improve, but the commercial reference still has much richer composition, asset detail, clothing, animation and vegetation. Current faces are plainly stylized; roads and riverbanks remain regular and terrain remains basic. The camera uses conservative obstacle bounds, not full mesh raycasting, so later crowded districts need more coverage. No blind A/B result is claimed.

## Rulings and remaining gates
Ruling: retain the existing engine and simulation; cost is continued procedural-art and allocation limitations. Ruling: bounded original leaf artwork instead of importing unverified licensed assets; cost is stylized foliage and alpha-overdraw that must be measured. Ruling: self-review while the actual worker-status call returns disconnected; independent review remains mandatory before any Gauntlet-win claim.

Deferred: authored high-fidelity characters and motion, organic paths/riverbanks, fuller district variation, full economy/cargo task chains, independent reference critics, real hardware frame times and long-run memory/operation tests, and the previously reported dependency vulnerability assessment. No audio/provider/payment/moderation behavior changed. Keep draft and unmerged.

Rollback by leaving isolated or reverting the cohesive living implementation. Save format remains seeded-work-v2. The readable source delta files are delivery provenance only: the committed playable HTML remains standalone.
