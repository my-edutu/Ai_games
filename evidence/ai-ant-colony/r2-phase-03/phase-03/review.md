# AI Ant Colony Phase 3 Evidence Review

## Scope

This evidence covers the immutable presentation boundary, public privacy, responsive HUD, Canvas stream renderer, semantic camera/audio/VFX, accessibility variants, stream host, recovery and browser-source verification.

## Red-green evidence

The Phase 3 test suite was written before the presentation modules existed and failed with seven missing public APIs. The implementation then closed those contracts for sanitized snapshots, layouts, camera, audio, output health and controller recovery. Two additional regressions were added after self-test review exposed same-tick intermission divergence and public seed-derived run identity.

## Commands and results

```text
npm run build
PASS

node --test tests/foundation/ant-colony-*.test.cjs tests/phase2/ant-colony-*.test.cjs tests/phase3/ant-colony-presentation.test.cjs
PASS — 23 tests, 0 failures

node scripts/serve-ant-colony-stream.cjs --self-test
PASS — authority stable, 500 accepted snapshots, private snapshot, bounded renderer, automatic restart

Playwright + system Chromium
PASS — desktop, phone landscape, clean feed and operator-visibility probes; zero console/page errors
```

## Browser evidence

- Desktop: 1920 x 1080 viewport, 1190 x 999 canvas, zero overflow.
- Phone landscape: 640 x 360 viewport, 480 x 312 canvas, zero overflow.
- Clean feed: 1280 x 720 canvas, HUD hidden, operator controls hidden.
- Operator mode: controls visible only with `?controls=1`.
- Public snapshot: no seed, internal run ID, raw influence state, idempotency keys, cooldown map, scheduled tick or private movement history.
- Frame cadence: 59.50 average FPS; 16.7 ms p95 gap; 33.4 ms maximum gap.
- Desktop screenshot SHA-256: `e2f2d73d95737562e5ca68792b5dfa3845b9a6d33a0175fe773df8f3df678d37`.
- Phone screenshot SHA-256: `e9444c7048c50e4f63294af5461481ade7dfe540bf99ef69a32a6ff67047c91f`.
- Clean-feed screenshot SHA-256: `d0ccda7262ede183c3db50304edc7a34b394e2f44b47ce17eac57f01a20552a6`.

GitHub Actions generates and retains exact-head Chromium screenshots independently; local screenshots are reference evidence only.

## Findings and dispositions

- **Important — presentation revision collision:** fixed with lifecycle-progress revisions.
- **Important — public run identity leaked the seed:** fixed with opaque run token.
- **Important — audience UI overstated readiness:** fixed by keeping interaction disabled until Phase 4.
- **Minor — semantic camera could expose edges:** fixed with clamped transformed bounds.

No P0/P1 software findings remain within Phase 3 scope.
