# Dungeon immersive interface implementation plan

> Execute inline with test-first behavior changes and a separate final review pass. Continue the approved user goal; do not pause for another design preference round.

**Goal:** Make Game 9's real 3D world primary and its spectator controls dependable.
**Architecture:** Preserve the renderer and snapshot authority. A small presentation controller owns optional HUD/map/journal state; camera targeting is a pure, testable projection.
**Tech Stack:** Existing Three.js, JavaScript/CSS/HTML, Node tests and Playwright.
**Spec:** docs/superpowers/specs/2026-10-31-dungeon-immersive-ui-design.md

## Global constraints
No new external runtime dependencies; no authority/save change; keep PR draft; no fabricated independent verdict; controls remain keyboard and touch accessible.

## Review focus
- Dead hero selection and scene transition must not silently claim a live focus.
- Boss position is grid-space while camera is world-space.
- Optional interfaces must not hide network failure or change simulation.
- Portrait/landscape/short-height viewports and 200% zoom must remain usable.
- Duplicated historical combat events must not obscure the first scene.

## Tasks
- [x] Add browser layout/control gates and observe the pure camera/alert regressions fail before implementation. Integrated WebGL gates require CI.
- [x] Replace dashboard CSS and restructure HUD, preserve required snapshot bindings.
- [x] Implement reversible clean view, map and journal controls, keyboard behavior and terminal state.
- [x] Fix camera coordinate mismatch and transition reset; reduce noncritical alerts.
- [ ] Run focused tests, full software suite, live/browser checks; inspect real desktop/mobile captures.
- [ ] Record round evidence, self-review findings and remaining gaps; push to existing PR without merge.
