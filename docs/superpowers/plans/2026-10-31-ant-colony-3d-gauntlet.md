# Ant Colony 3D Gauntlet Implementation Plan

Goal: apply the approved Game 12 Gauntlet to the existing autonomous Ant Colony without replacing its deterministic authority.

Base: agent/ant-colony-2-5d-rebuild at 84c065b3fb8b59f1686e025f34276221bae4b3b4. Main has diverged; reconciliation is a separate gate. Work branch: feat/ant-colony-gauntlet-3d.

## Design and execution rulings

- Preserve the working 2.5D page as a fallback, and add a read-only 3D view at /ant/3d.
- Use dependency-free, self-hosted WebGL2 modules under the existing CSP; do not add CDN code or change simulation rules.
- Keep the Gauntlet evidence page separate at /ant/gauntlet. Page refresh is not an agent scheduler.
- The connected coding workspace returned tunnel_client_not_seen. Independent workers and ultracode are unavailable in this run. Perform explicitly labelled author review; do not invent independent verdicts.
- Local verification uses a partial checkout and a clearly labelled synthetic public snapshot. The real TypeScript authority, full suite and live-host CSP checks remain gates.

## Independently testable increments

1. Read-only snapshot validation, revision/run handling, bounded interpolation, 3D geometry and instancing. Write and observe failing tests, implement, rerun.
2. Real WebGL2 creature/world renderer: caste rigs, queen, brood representation, predators, terrain, plants, shadows, four camera views. Capture actual rendered output, critique, revise.
3. Responsive public HUD, reduced motion, graphics-loss recovery, stale/paused/fault truth, bounded polling and safe page lifecycle. Preserve existing routes and operator authentication.
4. Separate dated evidence page with before/after captures, exact limitations, open gates and current build link. Publish a draft branch, not a production claim.

## Evidence ledger

- Core RED: 0/12 tests passed before the implementation existed.
- Core GREEN: 12/12 passed after implementation.
- Visual review exposed reversed face winding. New regression test failed (12/13), then passed after correction (13/13).
- Initial Chromium navigation was blocked by managed policy. Policies were not changed. Isolated documents load the unchanged product scripts with an explicit synthetic fetch boundary.
- Software WebGL initially lacked an X display. Running Chromium with Xvfb resolved graphics initialization. This is not physical GPU or mobile performance evidence.
- Rounded tunnel boundaries replaced square edge blocks after capture review. Material, anatomy and animation fidelity remain below the commercial targets.

## Review and stop conditions

Use Empire of the Ants for creature/environment fidelity and Empires of the Undergrowth for nest/colony readability. Freeze equivalent reference captures, judge the real output with fresh critics and blind A/B when feasible, return the biggest evidenced gap, and continue until the output wins or the user stops. Ties, missing evidence and broken gameplay do not pass. No fixed round limit or forced architecture for subsequent work.

Next reviewers must check authoritative integration, real-host CSP, peak populations, mobile hardware, long-run resource stability, soundscape, authored assets and blind reference comparison. Current verdict: NOT PASSED.
