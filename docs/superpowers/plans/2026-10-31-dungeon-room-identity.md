# Game 9 Room Identity — Implementation Plan

**Goal:** Break dungeon visual repetition with biome-specific wall-hugging 3D architecture while preserving the autonomous game's invariants.
**Spec:** `docs/superpowers/specs/2026-10-31-dungeon-room-identity-design.md`
**Stack:** Three.js browser modules, Node 22 test runner, Playwright Chromium screenshot evidence.

- [ ] Add failing deterministic placement tests for valid wall anchors, spawn/exit exclusion, max count, minimum separation and empty maps (`tests/foundation/dungeon-setpieces.test.cjs`).
- [ ] Implement an isolated pure placement algorithm (`public/ai-dungeon/setpiece-plan.js`), with stable hash and no authoritative RNG dependencies.
- [ ] Add 3D sculpture and relief assembly, four distinct thematic profiles, budgeted geometry/material lifecycle (`public/ai-dungeon/dungeon-setpieces.js`).
- [ ] Replace identical monuments with the new dressing in `biome-atmosphere.js`; reduce harsh glow, retain scene diagnostics and floor cleanup.
- [ ] Expose modules securely via stream HTTP server, test that browser renders authored scenes and heroes remain visible (`scripts/serve-dungeon-stream.cjs`, `tests/browser/dungeon-setpieces.spec.cjs`, `tests/browser/dungeon.playwright.config.cjs`).
- [ ] Run focused test RED→GREEN, full software suite, real browser captures and critical visual self-review; document evidence honestly, refresh Gauntlet history and commit to existing PR #49 branch.

**Review focus:** Empty/no-wall maps; map edge placement and grid/world conversion; props obstructing real heroes; hot floor transition leaks; mobile renderer budget; stale UI alerts; original model texture integrity.
