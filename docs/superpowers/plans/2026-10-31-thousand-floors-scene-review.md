# THOUSAND district presentation and actual-game review

> Execute inline with TDD and a separate self-review because the connected worker service is offline. The user's approved Gauntlet brief and request to keep improving remain the spec; do not ask again or lower the bar.

**Goal:** Replace the uniform brick-island look with distinct district materials, stronger architectural silhouettes and atmospheric lighting, then inspect actual WebGL captures with the iteration-5 HUD.
**Architecture:** Presentation-only modules consume the immutable district and snapshot. Keep campaign/save authority, hazard geometry and conservative camera fit intact. Keep all decorations outside playable pads. The standalone capture runner uses actual review replay and playback controls, never fabricated state.
**Stack:** Existing Three.js 0.186.0, vanilla HTML/CSS, TypeScript core, Node tests and Playwright 1.55.0. No new dependencies.
**Spec:** `docs/superpowers/specs/2026-10-30-thousand-floors-gauntlet.md`.

## Tasks
- [x] Baseline actual-game review: add scoped CI/capture automation with read-only token, source SHA, error capture, desktop/portrait and districts 1/2/5/10. Obtain screenshots through workflow artifacts. Local browser cannot create WebGL; do not mislabel UI fixtures.
- [x] Material/light direction: write failing pure tests for ten deterministic, immutable district styles, district-specific architectural materials and generated relief maps; implement in materials.js and consume in scene.js. Test safe fallback and texture disposal.
- [x] Landmark silhouettes: write geometry tests for authored district landmarks, invariant layouts, bounded primitives/materials, low-tier removal and off-route containment; implement bounded presentation-only skyline module, compose through scene.js and the server allowlist. Inspect actual renders.
- [x] Run builds, affected tests, complete catalogue suite, actual-game browser suite and evidence capture. Record errors precisely; do not infer production readiness, hardware FPS, or independent-critic approval.
- [x] Publish cohesive changes to PR #55, keep draft, update progress/evidence and retain actual screenshots in the conversation and reproducible CI artifact.

## Review focus
1. Foreground geometry never covers or expands collidable landing surfaces.
2. New colors are district-specific without recoloring safe/danger semantics.
3. Resource cleanup releases all newly generated maps across rebuilds.
4. Low quality retains hazards, protagonist and goal; optional scenery is bounded.
5. Display layer does not modify seed, save format, gameplay or clocks.

## Rulings
- Use GitHub Actions as the real-game verification environment; it can install the pinned dependencies and run WebGL. Local execution can still test geometry, camera projection and simulation. No security policies are disabled.
- Reuse the actual branch's models and camera. This increment targets materials/lighting/staging, not a new character rig or different gameplay. Cost: character expression remains unfinished and tall decorative roofs are sometimes cropped.
- A self-review is not a fresh independent critic; overall benchmark stays not passed.

## Evidence ledger
- Baseline actual game run 41163343348 passed on source 25148f4f2f7cac8169144b6612f27be5205c18d3. Captures replay real floors 006, 102, 403 and 902; portrait uses the same floor-006 state.
- New six art tests failed before implementation, then passed; the seventh samples real campaign camera rays against every new district landmark.
- `npm run test:floors`: 32/32 passed. `npm test`: 535/535 passed in the isolated local checkout. `npm run floors:build`: passed.
- Product source bfa34ec1fb93d478d5ddb87c051ef8d8f602bd5d passed Game 4 run 41164336812: both builds, 32 focused checks, six real-game Chromium checks and five actual high-quality still captures. No capture page/HTTP errors.
- Visual self-review inspected the four districts and portrait. Further square-platform/terrain/character work, independent comparison, hardware FPS and long soak remain open. See `docs/gauntlet/thousand-floors/ITERATION-6.md`.
