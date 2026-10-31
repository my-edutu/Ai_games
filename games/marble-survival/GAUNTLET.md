# Marble Survival — current Gauntlet status

## October 31, 2026: loops 59–61

**NOT visually accepted. NOT production ready.** Current runtime: `9f35ae0a`; draft PR #45. No production merge or deployment.

### Implemented
- **59 / `cdc332fc`:** original lazy WebGL2 racer studio with all 32 public roster entries, four role silhouettes, identity patterns, numbered materials and rotation controls. It reads only the completed frame public snapshot and never changes race authority. Compact desktop/mobile headers, expandable standings and one-line event ticker leave more of the course visible.
- **60 / `6a753bd1`:** fix dossier selection reconciliation and mobile typography. Add native graphics-loss/restoration, fallback, keyboard, motion and viewport checks.
- **61 / `9f35ae0a`:** fix native-browser Escape focus regression. The modal event bubbled to the existing document listener, closing the underlying dossier too. Stop modal keyboard bubbling without preventing native Escape/cancel. Actual offline Chromium reproduced the failure, then passed with the fix; 159 local foundation cases remain green. The existing native regression is unchanged and must re-run.

### Real evidence

[Initial run 41166953232](https://github.com/my-edutu/Ai_games/actions/runs/41166953232), `cdc332fc`: build, authority self-test, **159/159 Marble** and **662/662 catalogue** tests pass. Both initial desktop/mobile studio checks pass. Four actual role screenshots were inspected. Existing integrated race performance fails at software p95 250ms.

[Expanded run 41167731966](https://github.com/my-edutu/Ai_games/actions/runs/41167731966), `6a753bd1`: build, 159 Marble tests, self-test and catalogue job pass. Of six native browser tests, four pass: compositor, fullscreen UV, mobile/reduced-motion and **native studio context loss/restoration plus unavailable-portrait fallback**. Two fail: desktop focus return after dossier reopening, and the unchanged frame-time gate (**p95 250.1ms vs <140ms**). The focus defect is addressed by loop 61; the performance defect remains open.

Native desktop/studio screenshots, mobile screenshots, videos and traces are retained in artifact `13029693472`, directory `artifacts/marble-racer-studio/` and `test-results/`. A recorded 15-second turntable excerpt was inspected. The full roster contains 32 entries, but only four representative roles and the last roster entry were individually exercised in the native visual test.

[Loop 61 verification run 41168955206](https://github.com/my-edutu/Ai_games/actions/runs/41168955206) is queued at this checkpoint, not passed. The latest local build, 159 regressions and authority self-test pass; targeted modal DOM regression is RED → GREEN. Layout-only Chromium checks fit the arena and dialog at 320×568, 360×640, 390×844, 768×1024, 844×390, 1280×720 and 1920×1080, without horizontal overflow. At 390×844 the status strip is 62.06px, standings 47px and arena 705.94px. These are layout checks, not local GPU evidence.

### Critic outcome and boundaries
Author self-review, not an independent subagent/ultracode verdict. Original role shapes and inspectable character materials are improved; the actual race still needs richer lighting, course composition, better mobile camera coverage and lower frame time. Separate CI measurements are not a controlled performance A/B. No commercial-reference win, all-stage acceptance, production endurance or device-GPU approval is claimed.

Ruling: use an additive read-only character studio rather than replace the authoritative renderer; cost: portrait polish does not establish in-race art parity. Physics, RNG, race renderer, tournament outcomes, dependencies and other games are unchanged. Deferred: main renderer/camera work and the existing non-functional renderer comment typo. Rollback is a normal revert of this feature's studio/layout commits.

### Run and history
```sh
npm ci
npm run build
node games/marble-survival/scripts/serve-complete-runtime.cjs
```
Game: `http://localhost:4317/`; choose **Racers** or a dossier's **Explore in 3D**. Live progress: `/gauntlet.html`. Native checks: `npx playwright test --config games/marble-survival/playwright.config.cjs`.

[Loops 55–58 and reintegration](GAUNTLET-RENDER-2026-10-31.md), [loops 1–54](GAUNTLET-HISTORY.md) and [the preceding studio checkpoint](public/complete-runtime/gauntlet-history-2026-10-31-studio.json) preserve historical evidence. Earlier pending results are superseded by the candidate-specific results above. Main remains unchanged.
