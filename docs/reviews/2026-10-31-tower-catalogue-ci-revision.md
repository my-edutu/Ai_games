# Infinite Tower Climb Gauntlet 17 — catalogue frontend revision contract

## Evidence inspected before editing

At PR #58 head `0cb5b498bfbd5fded033f9d089c9da09e30c5c46`, `AGENTS.md`, `games/infinite-tower-climb/GAUNTLET.md`, the live progress ledger, review threads (none), and both completed CI job logs were examined. [Tower Realism Evidence run 41172970019](https://github.com/my-edutu/Ai_games/actions/runs/41172970019) and [Autonomous Games CI run 41173326408](https://github.com/my-edutu/Ai_games/actions/runs/41173326408) **each failed with 580/581 tests passing**. The only failing test was `Infinite Tower Climb exposes the catalogue frontend quality contract`, asserting `data-ux-revision="2"` against the shipped Tower shell's `data-ux-revision="3"`. This was an incorrect test expectation, **not proof that the Tower HTML should be downgraded**.

The actual downloadable [Tower Landing Evidence run 41172970087](https://github.com/my-edutu/Ai_games/actions/runs/41172970087) artifact **13031761634**, source `d9ab9161c0f1d1d80b620c07c0c0acf342340d67`, was downloaded, unzipped, and inspected before editing. Six original GPU PNGs at 390×844 portrait and 960×600 desktop confirm the glyph is centered over the destination in both portrait cases while the left-desktop view suffers some foreground upright obstruction. Their diagnostics report held source-pinned snapshots, not normal-speed animation, FPS or device load. Source read/review here does not create new rendering evidence.

## Single selected failure and fix

`tests/phase3/catalogue-frontend-quality.test.cjs` historically hardcoded UX marker 2 for all four games. Set **explicit per-game expected revisions** (Snake 2, Maze 2, Tower 3, Ant Colony 2) and retain the rest of the semantic tokens, focus-visible, reduced-motion, responsiveness, and linked `ux-v2.css` assertions. No production HTML/CSS/JavaScript, renderer, physics, replay, authority, shared catalogue behavior or release process was changed. `ux-v2.css` is still the linked styling layer despite Tower's DOM UX revision 3; changing the asset path would be a different, unsupported change.

## Proportional red/green validation

Reproduced the failure locally using the exact downloadable `tower-review-inputs-d9ab916...` archive (artifact **13031926865**), with `node --test tests/phase3/catalogue-frontend-quality.test.cjs`: **3 PASS, 1 FAIL**, Tower revision assertion. Updated test: **4 PASS, 0 FAIL**. Explicit negative canary: temporarily changed only the local fixture copy's Tower HTML marker from 3 to 2; the new test failed as intended (**3 PASS, 1 FAIL**). Restored original HTML, reran: **4 PASS, 0 FAIL**. `npm run build` passed and `node scripts/serve-tower-stream.cjs --self-test` reported `ok:true`, stable authority, asset privacy, recovery and restart.

A full local `npm test` was attempted but **timed out after 300 seconds**; its captured log last reached case 489 with no completed summary. It is **not** counted green. New remote full-suite CI must be observed on the resulting commit before a broad CI PASS may be recorded. This fix addresses a CI expectation, not a commercial visual gate.

## Review, risk and next highest gap

**Self-review only**: the separate fresh-context builder/critic workspace was disconnected; there was no independent review and no Ultracode execution. The assertion is now intentionally version-specific while retaining checks for all other catalogue games. The risk is future legitimate shell revisions requiring an explicitly reviewed expectation update, not a silently widened acceptance regex. No rollout, deployment, main merge, or force push. Reverting the test restores the reproduced false-negative failure; the runtime remains unchanged.

**Scoped local validation PASS; full remote CI PENDING; overall Gauntlet FAIL/open.** The next source-bound gate is recovery of both complete CI workflows. Next independent visual failure after that is desktop destination-beacon occlusion and guardian crown clearance. The user-approved official [Jusant](https://dont-nod.com/en/games/jusant/) environment/climbing bar and [ASTRO BOT Rising Heat](https://gmedia.playstation.com/is/content/SIEPDC/global_pdc/en/games/pdps/a/as/astro-bot/dlc/video/astro-bot-dlc-05-rising-heat-en-29oct24.mp4) action/clarity bar remain unwon; complete normal-speed motion, accessible UI on intended devices, sustained real FPS and stability evidence remain open.
