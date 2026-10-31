# Marble Survival — current Gauntlet status

## October 31, 2026: loops 59–60 — racer studio and spectator hierarchy

**Still NOT visually accepted and NOT production ready.** These changes add character inspection and a clearer race view, not a claim that the whole game meets the commercial benchmark.

- `cdc332fc` adds an original, lazy WebGL2 racer studio driven only by `window.marbleRenderFrame.snapshot`: all 32 public competitors are selectable, with permanent number/colour/pattern identities and four role silhouettes (navigator, sprinter, bruiser, survivor). The studio has rotation controls, native modal focus/Escape and reduced-motion support. It does not issue operator/audience requests or write authoritative state.
- The spectator HUD now uses a compact mobile standings strip, expandable full rankings, smaller headers and a single event ticker rather than large persistent dashboard panels. The race renderer, physics, RNG and tournament outcomes are unchanged.
- `6a753bd1` fixes a reproduced selection mismatch on reopening from a dossier, and fixes inherited typography that made mobile essentials too tall. Offline Chromium DOM checks measure 62.06px status essentials, 47px standings and 705.94px arena height at 390×844. These are layout-only measurements, not locally rendered WebGL evidence.

### Verified current-pass evidence

[Run 41166953232](https://github.com/my-edutu/Ai_games/actions/runs/41166953232), runtime `cdc332fc`:

| Check | Actual result |
| --- | --- |
| TypeScript build / authoritative server self-test | PASS |
| Marble foundation regressions | 159 / 159 PASS |
| Entire catalogue Node regressions | 662 / 662 PASS |
| Native desktop racer studio | PASS: four role representatives rendered, full 32-entry roster, last racer selection, GL error=0, Escape/focus return, closed animation stopped, no authority mutation |
| Native mobile studio / race layout | PASS: real 390×844 captures, reduced-motion angle remains static, modal fits, standings expand |
| Existing fullscreen pixel / compositor checks | PASS |
| Integrated race performance | FAIL: SwiftShader Low p50 183.3ms, p95 250ms; unchanged requirement p95 <140ms |

Actual screenshots in `marble-gauntlet-browser-evidence/artifacts/marble-racer-studio/` cover navigator, sprinter, bruiser, survivor, desktop gameplay, mobile gameplay and mobile studio. All four role captures and the mobile views were inspected by the author. The full roster has 32 entries; this is not a claim that 32 individual native GPU portraits were separately reviewed.

The follow-up runtime `6a753bd1` passes the local build, 159 foundation cases, server self-test and targeted DOM checks. Its expanded native tests add motion recording, angle-change verification, dossier reopen/keyboard focus, a <=64px mobile status strip, native context loss/restoration and an unavailable-portrait fallback. [Run 41167731966](https://github.com/my-edutu/Ai_games/actions/runs/41167731966) is queued at this checkpoint: those expanded native checks are **not yet reported as passing**.

### Critic outcome and limits

Author self-review, not an independent subagent/ultracode verdict. The new portraits have readable role differences and materials; the mobile strip leaves more of the actual course exposed. The main arena still needs better camera coverage, dimensional lighting, course composition and software-renderer performance. Separate CI measurements (216.7ms previously, 250ms here) are not a controlled hardware A/B; no speedup is claimed. No independent comparison with official commercial captures, all-stage acceptance, production soak or device-GPU approval was completed.

No new dependencies, external assets, privileges, deployment or changes to other games were introduced. PR #45 remains draft. Open the running game and choose **Racers**, or select a standings entry and choose **Explore in 3D**. The existing `/gauntlet.html` page polls this iteration log. Rollback is a revert of the studio/layout commits on this feature branch, not a production operation.

## Earlier verified work and running the game

[Loops 55–58 and main reintegration](GAUNTLET-RENDER-2026-10-31.md) preserve the complete previous report. [Loops 1–54](GAUNTLET-HISTORY.md) and the archived progress JSON are unchanged. Current main remains integrated; no force-push or production merge was made.

```sh
npm ci
npm run build
node --test tests/foundation/marble-*.test.cjs
node games/marble-survival/scripts/serve-complete-runtime.cjs --self-test
node games/marble-survival/scripts/serve-complete-runtime.cjs
```

Game: `http://localhost:4317/`; current progress: `http://localhost:4317/gauntlet.html`. Choose **Racers** for the 3D studio. Native tests: `npx playwright test --config games/marble-survival/playwright.config.cjs`. Catalogue regressions: `npm test`.
