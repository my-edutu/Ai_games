# Game 7 hardening continuation

**Parent:** `2026-09-07-marble-survival-premium-motorsport-upgrade.md`, task 7.
**Baseline:** `552a3d5ad1e3ded74b5c9f2fbcb3599504e7c097` (source-only CI addition to `270265ce`).
**Scope:** Finish the existing upgrade, not a new game or renderer. Keep the v2 physics kernel; version the tightened input policy separately. No production deployment or merge.

## 1. Input and persistence boundaries
- [x] Add and observe failing tests in `tests/upgrade/game7-hardening.test.cjs`: forged client time, default operator credential, conflicting fields, championship inputs, exact wind expiry, saved/restored object aliasing, inconsistent snapshot config/ID sets, public diagnostic exposure.
- [x] Host cooldowns use an injectable monotonic clock, never `input.at`. Public HTTP requests require a server-issued signed session and same-origin JSON; session identity comes from the cookie rather than the body. Run and round fields bind requests to the visible competition. No-token operator commands fail closed.
- [x] One wind field can occupy the pending/active slot, with 900 logical ticks between acceptances and 32 maximum per tournament. No championship influence. Countdown requests apply at the first racing tick. Add `wind-policy-v2` to snapshots; incompatible snapshots require a fresh run.
- [x] Snapshot capture and restore clone all mutable state; validate duplicate/disjoint state sets, config agreement, wind bounds, and event sequence limits.
- [x] Run `npm run marble:upgrade:test && npm run marble:stream:self-test` and store results. Local result: 62/62 tests and server self-test pass.

## 2. Broadcast viewport and browser evidence
- [x] Reproduce desktop/clean-feed vertical overflow in Chromium before altering CSS. CI run 34462292226 fails at 1143px document height in a 1080px viewport. Browser inspection now tests actual element bounds and console/page errors.
- [x] Constrain desktop/landscape to viewport; absolutely size the Canvas within the stage to remove intrinsic aspect-ratio feedback. Retain portrait scrolling with reachable controls. Keep reduced-motion and clean-feed semantics. Local offline Chromium layout probes pass for desktop/landscape and clean feed.
- [ ] Capture 1920×1080, 1366×768, 844×390, portrait, clean feed, and assisted wind, and inspect screenshots. Reject a clipped footer or arena in desktop/landscape. Exact-head CI browser verification pending this commit.

## 3. Validation and handoff
- [ ] Run the complete existing Node suite, upgraded tests, server self-test, a bounded production-rules seed campaign, and authority profiles. Full repository test attempt exceeded the local execution limit; no whole-repository pass claimed.
- [ ] Review specification compliance and code quality separately; document unresolved gameplay/production evidence instead of claiming R5.
- [ ] Push cohesive code/tests/docs to the existing upgrade branch, retain exact-head CI artifacts, and leave a draft PR without merging unrelated main changes.
