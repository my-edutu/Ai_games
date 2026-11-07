# Round 017 — actual capture review and follow-up

## Verified 96c44f2 results
- Dedicated exact-head workflow 41165715310: 9/9 real WebGL interface tests passed; artifact 13029252721 contains actual desktop, mobile (map explicitly open) and raw-world captures. These were inspected, not substituted with component mockups.
- Full PR-merge workflow 41165715428: 38/39 browser tests passed. All nine new interface tests passed again. Authority checks and the 24-seed × 900-tick campaign passed, with zero determinism failures and highest floor nine (artifact 13028332672).
- The single failure was a 60-second timeout in `actual class footprints, spells and character-close camera are inspectable`. Inspecting trace artifact 13029595050 confirmed all camera/footprint assertions passed, the first world screenshot consumed about 18.5 seconds, and the second full-frame screenshot exhausted the total budget. No page error was recorded. This is not evidence of a dead-hero click failure.

## Follow-up changes and tests
- Remove only that redundant world screenshot; retain the full-frame close-camera capture, all assertions and the separate raw-world audit. Do not raise timeout or mark the test skipped.
- Run all 40 browser tests in three isolated CI machines with one browser worker per machine. Test collection proves disjoint sets of 14, 13 and 13 tests. This is CI parallelism, not independent agent review.
- Correct an existing progress-page defect: inline CSS was forbidden by the actual `style-src 'self'` policy. Serve external `/dungeon/gauntlet.css`, remove inline styling, preserve the strict policy and all telemetry bindings, and restore the approved Diablo IV benchmark wording.
- Progress regressions observed failing before the fix, then passing: 2/2. Current focused production-module total: 16/16. Full local `npm test`: 530/530, zero failures, exit 0. Real local HTTP checks verify HTML/CSS status 200 and unchanged CSP.
- Add actual screenshot capture of clean view, journal and mobile default before opening its map, plus a real-browser progress stylesheet gate.
- Follow-up integrated browser results must be read from its exact commit's CI; they are pending when this document is committed.

## Visual verdict and risks
Author review: much more of the real world is visible, party status is clearer, and ordinary alerts no longer dominate the scene. Remaining major gaps are repeating corridors, oversized emissive fixtures, simple character models and limited animation/material detail. The Diablo IV bar is NOT MET; no blinded independent preference test or ultracode run occurred because the worker tunnel is offline.

CI `npm ci` also reports two existing high-severity dependency audit findings; dependency versions were not changed in this UI increment. These remain a production-readiness issue, not a claim of a secure release. No merge or deployment; keep PR #49 draft.
