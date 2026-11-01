# Round 50 — inner flagstone mineral patina (original procedural art)

Date: November 1, 2026. Fixed visual standard: official *Snake Pass* character/gameplay/world imagery with *ASTRO BOT* as secondary animation and environmental craft. Neither reference asset is copied. Baseline original world Git blob: `0be8970978500ff369bfd0c132ff42aec4bf913b` at exact R49 source `35e30ad4ed606c35bf2080456a161f627fe45373`.

## Independent smallest unmet visual slice

The real prior [R49 Chromium/WebGL artifacts](https://github.com/my-edutu/Ai_games/actions/runs/41277311607/artifacts/13070934850) and earlier R48 detailed capture show a broad uniform yellow/cream central tiled courtyard, far below official *Snake Pass* in believable weathering and surface variation. This slice makes *the already-existing stone atlas* convey older irregular aggregate staining and fine mineral seams without moving or hiding any grid element. It is not a rewrite of earlier R31 stone tone, R32 corner sculpt, R35 perimeter lichen, R41 root channels or Raking-light highlights.

### Implementation and exact prior

One marked R50 section in `public/snake-stream/world.mjs` operates on each texel of the existing **1024×512 RGBA stone texture**, generated at world construction. Deterministic per-slab existing seeds, field mineral and broad cloud fields form irregular softened deposits with occasional short veins. A hard zero weight over the **outermost 2.85 gameplay cells** prevents new pigment from camouflaging edge hazards, fruit indicators, portals or boundary contrast. The playable grid geometry and height remain identical. Existing material and texture IDs, static merging into 13 original batches, light/shadow geometry, dynamic trap/portal/fruit meshes, adaptive scale and WebGL rendering paths are unchanged. New encoded color strictly darkens toward restrained olive/gray stone and never uses danger orange or reward gold.

Removing the single marked section must yield exact pre-R50 Git blob `0be8970978500ff369bfd0c132ff42aec4bf913b` — verified original content address — while reapplying it restores byte-for-byte current. Older historical source-control tests strip only this later R50 section for their Git SHA comparisons; their runtime WebGL old/current arms both reapply it, so old quarry, lichen, channel and water tests cannot spuriously pass/fail from a newer pigment.

## Test and actual capture requirements

- New `tests/phase3/snake-quarry-mineral-wash.test.cjs`: exact original blob, reversible source, before/after Three.js atlas per-pixel inspection (28×16 and 8×8), immutable alpha, edge band exactly byte-identical, original mesh vertex arrays, public trap/portal/fruit updates, reduced-motion and resource budgets.
- New `tests/browser/snake-quarry-mineral-wash.spec.cjs`: genuine Chromium/SwiftShader with the same immutable frozen **public** frame, old-source routed before/current source after in 960×640 overview, 960×640 detail, and 390×844 portrait; actual PNG files in GitHub Actions, no GL/page errors, identical draw/triangle/texture/material/mesh budgets, caption and overflow check. Synthetic motion-reduced stills **never** prove autonomous live FPS, true device presents or physical GPU performance.
- Proportional full source CI, exact artifact IDs/hashes, and actual before/after visual critique should be appended only after the jobs finish and are inspected.

## Two-pass self-critique, no fabricated independent critic

**Specification check:** Only original rendered texture data changes, produced deterministically once when the visual world is constructed. No game authority or public snapshot changes, no enemy rules/portals, no camera, HUD/caption, accessible controls, fallback or recovery change; the published ≥17 actual-submit desktop threshold remains **unmodified**.

**Visual/product quality:** This is one stone treatment, not an AAA-grade full environment or finished commercial-quality character. Large playing-field repetition, geometric props, limited close-acting scale, relatively sparse foliage and water compared with official *Snake Pass*, plus *ASTRO BOT* animation polish, remain conspicuous. Pigment may risk looking like arbitrary stains and must be rejected or revised if actual runtime captures obscure the serpent, reward or danger. An independent separate reviewer is not available; this document is self-review, NOT a masked or third-party victory.

**Critical performance baseline:** [R49 focused Actions 41277311607](https://github.com/my-edutu/Ai_games/actions/runs/41277311607) **37/38 browser passed**, solely strict desktop **10 actual submitted WebGL frames/1012.4ms <17**, 61 RAF callbacks (not rendered or presented). R49 repeat-contact upload savings are genuine requested-byte savings, not causal FPS gain. R50 adds one-time atlas CPU arithmetic without increasing per-frame GPU passes; startup and throughput regression are unproven until exact-head CI. Hardware display-present FPS, long soak, production R5 signoff, full responsive/device review and independent whole-game critic remain **OPEN**.

Roll back by removing the single R50 block, its archive helper and focused tests, and reverting test-only archive isolation (no game-rule/data migration). Draft PR #52 remains unmerged and undeployed.
