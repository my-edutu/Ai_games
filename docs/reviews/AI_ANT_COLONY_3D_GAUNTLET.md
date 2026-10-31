# Game 12 — 3D Gauntlet candidate

This is an implemented first 3D presentation increment, not completion of the approved commercial-quality goal.

## Start

On `feat/ant-colony-gauntlet-3d`, with Node >=22:

```sh
npm ci
npm run ant:stream
```

The existing command builds the TypeScript simulation and starts port 4175. Open `/ant/3d` for the new view, `/ant/gauntlet` for the separate evidence page, or `/ant` for the preserved classic view. These are local routes, not a public deployment.

## What changed

The new renderer consumes `/ant/state` without writing commands or changing simulation rules. It includes five caste proportions, an enlarged queen, beetle and spider rigs, animated ant limbs, food carrying, bounded brood-stage representation, surface vegetation, a cutaway nest, seasonal colors, weather, shadow mapping and four interactive cameras. A compact responsive HUD reports verified population, queen health, food, brood, threat and lifecycle status. The old page and operator authorization remain unchanged.

Snapshot interpolation is bounded to adjacent observed movement, does not extrapolate, rejects stale runs/revisions and snaps discontinuities. Reduced motion and page visibility suspend cosmetic work appropriately. Graphics context interruption exposes the preserved view and can recover. Polling is single-flight with aborts and bounded retry cadence.

## Actual local verification

- `node --test tests/phase3/ant-colony-3d*.test.cjs`: 17/17 passed. Four routing tests execute the actual host routing code with a synthetic authority boundary; they are not the actual TypeScript simulation.
- `xvfb-run -a python tests/browser/check-ant-3d-local.py`: 23 checks passed, including real software WebGL2 rendering, cameras, stale/paused states, context loss/restoration, page lifecycle, mobile sizing/reduced motion and the evidence page.
- Chromium localhost navigation was denied by managed policy. The policy was not changed: product JS/CSS were injected unchanged into isolated documents and the fetch boundary was explicitly replaced by the synthetic public-schema fixture.
- Xvfb supplied the display required for software graphics initialization. These are not physical GPU, mobile-device or long-run performance measurements.
- Captured 40-ant fixture: 14 draw calls, no dropped instances. CPU submission samples are not FPS or GPU timings.
- Source syntax checks passed. Full repository build, existing game tests, real-host browser/CSP suite and deployment were NOT run locally.

## Reproduce the remaining integration gate

```sh
npm test
npm run ant:stream:self-test
npm run test:browser -- tests/browser/ant-colony-3d.spec.cjs
```

The added live-host browser spec uses the repository's existing multi-server Playwright configuration. A WebGL2-capable Chromium is required. Unsupported graphics is separately tested; lack of WebGL must not be silently converted into a successful visual test.

## Review findings and next work

Author-only review caught reversed sphere/leaf/cap winding through an actual capture. A new regression first failed (12/13), then passed (13/13) after correction. Rounded tunnel boundary forms replace the initial square wall blocks. Matched before/after thumbnails use the same fixture and camera; they are NOT an independent or blind comparison.

The Empire of the Ants / Empires of the Undergrowth quality bar remains NOT PASSED. Fixed reference media download and equivalent-view independent A/B evaluation remain outstanding. Anatomy is still procedural, materials/environment repetitive, locomotion lacks authored contact animation, predators are not fully animated, and the new 3D view has no soundscape yet. Brood locations are illustrative arrangements of authoritative stage counts, not individual simulated brood coordinates. Review population caps, physical mobile rendering, resource lifetimes and sustained operation before promotion.

The connected coding workspace returned `tunnel_client_not_seen`, so no independent subagents or ultracode ran. No external production readiness/R5 gate was advanced. This branch is based on the saved 2.5D rebuild, which has diverged from main; review and reconciliation are required before merging. No production deployment occurred.

## Continue the Gauntlet

Use the approved goal and commercial references; choose the next smallest independently judgeable gap. Give each important piece a builder and a fresh critic when workers are available. Critics inspect actual running output, compare equivalent reference views with randomized blind A/B when feasible, and return the biggest evidenced gap. Keep dated evidence in the separate progress page and iterate until the output wins or the user stops. No fixed rounds; do not lower the bar or turn missing evidence into a pass.
