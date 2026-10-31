# Marble Survival — current Gauntlet status

## October 31, 2026: loops 55–58 and reintegration

Game 7 continues on `agent/marble-gauntlet-2026-10-08`, draft [PR #45](https://github.com/my-edutu/Ai_games/pull/45), now targeting current `main`.

**NOT visually accepted; NOT production ready.** Commercial reference parity is not established. The full running game is still below the requested art and performance bar.

### Actual implementation

- **55 / frame-locked identities (`911b69e3`):** removed the 200ms expiry that switched competitor tags to a different camera and independently polled positions. Keep tags attached to the actual completed WebGL frame; reuse unchanged drawings and clear invalid projections/context-loss state. Eight executable regressions went RED to GREEN.
- **56 / hidden-renderer work (`08f0c12f`):** do not repaint the entire Canvas2D fallback behind WebGL or in background tabs. Preserve fallback recovery after context loss. Four executable regressions went RED to GREEN.
- **57 / whole-frame projection (`cc5df7fc`):** corrected the oversized fullscreen triangle from `vUV=p*0.5` to `vUV=p`. Previously postprocessing stretched only the lower-left quarter across the screen. Five mathematical checks went RED to GREEN; native WebGL pixels and an old-shader negative control confirm the correction. Real desktop/mobile captures now show the full arena and frame-aligned identities.
- **58 / Low compositor (`ae2eaeb0`):** removed live backdrop blurs and the full-arena blend layer only on Low. Actual local Chromium CSS assertions went RED to GREEN; Balanced/High/Ultra retain their normal optics. This is a compositor configuration check, not proof of GPU frame-time acceptance.

### Reintegration and exact evidence

[PR #60](https://github.com/my-edutu/Ai_games/pull/60) records the main-to-feature merge `d6d057bd`, with parents `911b69e3` and `d1678cd4`. All unrelated current-main files are preserved, including Eko Phase 6, dependencies and types. Only the Marble subtree, its workflows/tests/scripts/plans, and an additive TypeScript include differ from main. No force-push or change to main was made. PR #45 remains draft.

[CI run 41161679813](https://github.com/my-edutu/Ai_games/actions/runs/41161679813), code `cc5df7fc`, verifies:

| Check | Result |
| --- | --- |
| TypeScript compilation | PASS |
| Marble foundation regressions | 152 / 152 PASS |
| Authoritative server self-test | PASS |
| Whole-catalogue Node regressions | 655 / 655 PASS |
| Native GLSL fullscreen pixels | PASS, all five pixel samples exact; old-shader control reproduces cropping |
| Real desktop and mobile screenshots | Captured and visually inspected by the author |
| Software WebGL frame-time target | FAIL: Low p50 200.1ms, p95 266.6ms; unchanged requirement p95 <140ms |
| Independent commercial-reference A/B | Not performed; no win claimed |

The software sample contains 90 animation-frame deltas at a 1920×1080 viewport, 907×416 Low drawing buffer, on Chromium SwiftShader. The earlier baseline run 41158917089 measured p95 400ms. Different CI runs are not a controlled device benchmark; do not attribute the entire difference to one patch or claim hardware FPS from software results.

The follow-up [run 41162317097](https://github.com/my-edutu/Ai_games/actions/runs/41162317097) for `ae2eaeb0` again passes the build, Marble regressions, authority self-test and whole-catalogue regression job. The native compositor regression confirms all six Low blur surfaces are disabled while all higher tiers retain them. The native fullscreen-pixel check also passes. Updated Low software p50 is **166.7ms**, p95 **216.7ms**: still **FAIL**, not accepted. Different CI runners/runs are not a controlled A/B performance experiment.

A local headless reproducibility check completed **25 tournaments twice** with seed `marble-reintegration-20261031`: 25 champions, zero quarantines and identical final checksum `da6f57ed` on both runs. This does not replace long-session production testing. Evidence records and downloadable captures are in the workflow artifacts, not generated illustrations.

### Review and open work

Final review for this session is **author self-review**: no independent subagent or ultracode runtime was available. Reviewed frame/matrix identity, context-loss fallback, shader UV mathematics, quality-selector CSS cascade, preserved authoritative physics and main-tree integration. The local source matched the exact CI source archive for `cc5df7fc` (PR merge candidate `2c37936c`).

Next critic must inspect actual output and address: software-renderer frame time; mobile camera coverage and overlay footprint; richer lighting/materials/course composition; all-stage and champion footage; independently blinded comparisons with official Marble It Up! Ultra / Marbles on Stream captures. Do not turn a same-image A/B tool smoke test into art acceptance.

A non-functional renderer comment typo (`consumeded`) is deferred. No gameplay randomness, seed, collision, tournament outcome or deterministic version was changed by this session's rendering patches.

### Run and inspect

```sh
npm ci
npm run build
node --test tests/foundation/marble-*.test.cjs
node games/marble-survival/scripts/serve-complete-runtime.cjs --self-test
node games/marble-survival/scripts/serve-complete-runtime.cjs
```

Actual game: `http://localhost:4317/`; live progress / manual A/B lab: `http://localhost:4317/gauntlet.html`.

Native browser checks: `npx playwright test --config games/marble-survival/playwright.config.cjs`. The isolated config avoids running four unrelated live game servers during Marble timing checks; the acceptance threshold is unchanged. Catalogue regressions run independently with `npm test`.

### Historical records

Earlier loops 1–54 are preserved verbatim in [GAUNTLET-HISTORY.md](GAUNTLET-HISTORY.md) and [the archived progress JSON](public/complete-runtime/gauntlet-history-2026-10-09.json). Their old pending/status statements are historical, not the current result. The live page reads the current `gauntlet-progress.json` and links to this history and real CI captures.
