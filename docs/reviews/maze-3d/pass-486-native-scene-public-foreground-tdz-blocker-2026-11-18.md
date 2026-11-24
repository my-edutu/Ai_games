# Pass486 — fix real terrain initialization blocker before native WebGL (2026-11-18 UTC)

## Original source-bound failure (before change)

Exact Pass485 branch HEAD `8ee9b8d9bb1f01d292616bcb35fa27e0090d8ba1` at [native WebGL run 44361630814](https://github.com/my-edutu/Ai_games/actions/runs/44361630814) **FAILED** on the first build/test step, before native screenshot capture. [Repository CI 44361630684](https://github.com/my-edutu/Ai_games/actions/runs/44361630684) also failed. Original native source logs give `ReferenceError: Cannot access 'witnessedForeground' before initialization` in `rebuildTerrain`, `world.js:1450`, repeated across **51 of 235** focused installed-Three tests. This is a genuine production scene initialization fault: `treasureGalleryCourse` referenced the physical `witnessedForeground` variable declared below it. It cannot be dismissed as a SwiftShader timing artifact, and there are **no Pass485 native gameplay PNGs to critique**.

## Single independently judgeable correction

Within real production `rebuildTerrain`, declare the already-existing current-public-guardian-foreground boolean **before** its use in treasure gallery course eligibility. Keep its exact predicate, original pure visible-public-state source and the gallery's existing strict priority tests untouched. No false corridor, undiscovered route, AI knowledge, guardian physical resize, pressure, wall/collision alteration, resource allocation or acceptance threshold. This unblocks real construction of the original physical two-cell key gallery and the existing installed Three scene tests; it is not a new Nintendo-style artistic improvement by itself.

## Objective gate / remaining failure modes

- Verify this fix at the **new exact commit SHA** with unchanged installed Three, six-reset geometry **<100**, full **8/8 native WebGL checks**, and 320×740, 390×844, 844×390, 1280×900 original full-resolution PNG files + UTC and matching SHA-256. Pass484 images cannot substitute.
- Inspect an actually rendered key-gallery before/after collected state, physically complete Pip/Thornback and pressure/door transitions; never manufacture a continuous sequence by concatenating unrelated runs. Independent critic must judge actual original output against official Captain Toad, with Luigi's Mansion 3 and ASTRO BOT supporting. No critic approval or win claimed here.
- PR #53 remains OPEN DRAFT; no merge/deploy/force push. Independent builder/critic/Ultracode tool availability unverified. The scene remains too crowded and the full chapter is unfinished, so Nintendo bar UNMET.
