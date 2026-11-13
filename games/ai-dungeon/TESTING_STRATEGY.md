# Testing Strategy and Gauntlet Gates

## Commands
- `npm run dungeon:test`: TypeScript build and focused Node tests.
- `npm run dungeon:gauntlet`: seeded headless campaign. Report saved to `evidence/dungeon/gauntlet-latest.json` and served by the progress page.
- `npm run dungeon:visual`: Playwright Chromium checks for true 3D rendering, advancing snapshots, mobile overflow, public-data privacy and screenshot captures.

## Independent review
Build and critic contexts must remain separate. Compare *real output* of equivalent scene types against official Path of Exile 2 captures with hidden labels where permissible. Rate silhouette/readability, modelling, animation, environments, lighting, combat effects and boss staging. A critic returns only the largest material gap, screenshot references and a reproducible scenario for the next builder pass. Human raters verify whether the candidate wins; never fabricate or self-award a pass.

## Invariants
Seed corpus must prove a connected exit, valid unit bounds, reproducible ticks, corruption rejection and replay-stable restore. Browser must show a functional WebGL context and nonzero simulation tick. Functional passing is not AAA parity. Seed tests are not soak tests.

## Evidence policy
Only record test commands that were actually executed. Screenshot artifacts require visual inspection by a separate reviewer; automated existence checks are insufficient. Retain failed seeds and review findings, not just success screenshots. Record direct critique with date/build ref and progress state.
