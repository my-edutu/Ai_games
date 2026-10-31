# Round 18 — fruit-aware character sightline (candidate, 2026-10-31)

**Source base:** `056eee0f4a659d3fdcedfe4780b753dcaf62363a` (PR 52, draft). **Quality bar:** official Snake Pass gameplay and character imagery; ASTRO BOT is the secondary craft reference. This is an original camera correction, not commercial visual parity.

## Evidence and defect

Round 17's actual live character image can show the large 3D fruit directly in front of the serpent's face. This hides the protagonist despite the fruit remaining a legitimate high-priority gameplay goal. The [latest base focused browser run](https://github.com/my-edutu/Ai_games/actions/runs/41173330039) passed 15/16 browser checks but failed the unchanged ≥17 actual submission gate: 9 submitted renders / 1002 ms, not 60 animation callbacks. General run [41173329970](https://github.com/my-edutu/Ai_games/actions/runs/41173329970) built and passed Node/host/authority/operations checks but failed browser verification. No FPS claim can be inferred from this round.

## Small vertical change

For the **detail camera only**, inspect the food's immutable public cell against the interpolated head and current viewing direction. When a nearby foreground food silhouette would cover the face, choose one of four bounded ±30°/±45° camera azimuths using a deterministic angular silhouette-clearance calculation, retaining the same target, camera distance, food mesh, geometry, light, score and AI. Retain baseline framing if the food is already clear, distant or behind. The existing time-based offset smoothing also applies to the revised pose, while reduced-motion remains instantaneous. Overview/follow view is unchanged; the goal's 3D object and the safety map remain present.

**Regressions:** focused Node test examines all four headings at desktop and portrait aspects, projected head/food separation, fixed head target/distance, rear-fruit no-op and unchanged overview/follow. Browser test uses the real WebGL renderer and an explicitly *synthetic presentation stress fixture*: the original public replay frame is copied and only food is placed one cell directly in front of the head; its screenshot `character-fruit-sightline-stress.png` is not represented as an authoritative gameplay capture. Actual CI results, source hashes and image inspection are **pending**.

**Self-review:** this improves one practical view-composition failure without fixing the amphibian facial look, pale stone, opaque water, occasional dynamic occlusions outside the fruit case or missing 17-draw desktop pacing. No fresh independent visual critic is available because the worker tunnel is offline. Whole-game verdict remains **LOSE/OPEN**. No new assets, web dependencies, draws or persistent rendering allocations. Rollback: revert camera selector + passed food point; do not weaken any gate. Remain draft, unmerged and undeployed.
