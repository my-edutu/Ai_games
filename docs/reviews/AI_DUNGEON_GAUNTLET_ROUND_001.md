# Gauntlet Round 001 — Foundation Implementation

**Candidate:** feat/ai-dungeon-3d-gauntlet-foundation

## Separate implementation and critic passes

**Builder deliverables:** deterministic 3D dungeon engine, server, procedural hero/enemy rigs, HUD, live Gauntlet page, core tests, browser tests and seed campaign.

**Critic pass (source inspection only):** the code has been independently cross-checked against the repository game contract and design skills, but no separate worker has inspected actual output or performed a blind A/B comparison yet. The score and visual verdict therefore remain **NOT ASSESSED**, not PASS.

**Biggest visual gap:** procedural low-poly rigs, repetitive maze masonry and basic attack motion do not approach Path of Exile 2's authored characters, scenes, animation or impact effects. The next builder iteration should select one combat encounter and improve it to an observable quality bar using genuine footage and a fresh critic.

**Unverified quality gates at submission:** TypeScript compile, Node tests, Playwright browser captures, headless report, long-run stability, mobile capture and runtime availability. GitHub CI must supply actual evidence. No claims of production readiness.

## Tests and review record
- Unit/replay/invariants: configured in `tests/foundation/dungeon-core.test.cjs`.
- Browser: configured in `tests/browser/dungeon-stream.spec.cjs`.
- Headless: configured in `scripts/run-dungeon-gauntlet.cjs`.
- External A/B judge: not run; no reference captures are committed.
- Risk: state persistence is not durable on server restart; browser polling is a local reference host; no external provider gateway.

## Candidate acceptance rule
Do not close the round until build and headless evidence are green and independent visual critics have inspected desktop/mobile screenshots and representative combat clips. A prototype milestone is not an AAA victory.
