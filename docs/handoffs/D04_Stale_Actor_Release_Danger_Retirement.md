# D04 — Retire spent Warden danger even when the release actor pose is stale

**Status: source-level fix only; real-game audiovisual acceptance UNVERIFIED.**
Branch: `feat/dungeon-d04-combat-feedback-realism-20261108`. Frozen BEFORE: `281735d0910c6b2443648af976003d50412ee324`.

## Defect and causality

With a genuinely observed public `warden-release`, the prior renderer called `anchor()` before clearing the spent warning. If a still-loaded Warden actor was outside the public cell, anchoring correctly failed, but the obsolete floor danger markers were never retired. A subsequent delayed warning could even redraw those spent cells. This is a source-reproduced logic defect, not a claim that real WebGL recordings exhibited it.

## Correction

A strictly authenticated release (proper kind, `authority-action` proof, explicit verification, valid tick, scene/actor identifiers and public cell) now retires only its eligible warning rings and updates the bounded release watermark before attempting the actor glyph. A stale-body glyph remains suppressed. Older releases cannot erase future warning windows; wrong actors/scenes, malformed and forged evidence do nothing. All logic stays in the opt-in D04 visual adapter, with no extra geometry, GPU pools, draw calls, buffers, audio, authority, rig, camera or lighting edits.

## Evidence and checks

Detached V8 execution of the actual previous production modules reproduced two failures: spent danger remained after an unanchorable release, and a delayed old tell reappeared. The corrected source passed six grouped source-execution checks: retirement, stale suppression, future-warning safety, malformed-proof safety, malformed-anchor safety, and 102-instance budget. Five additional `node:test` regression functions were authored at `tests/foundation/dungeon-d04-stale-warden-release-retirement.test.cjs`. The native Node test command has NOT been executed, because the coding tunnel was unavailable; the independent container cannot resolve GitHub.

```sh
node --test tests/foundation/dungeon-d04-stale-warden-release-retirement.test.cjs \
 tests/foundation/dungeon-d04-warden-warning-cells.test.cjs \
 tests/foundation/dungeon-d04-warden-warning-watermark.test.cjs \
 tests/foundation/dungeon-d04-warden-warning-order.test.cjs
npm run build
npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs
```

Real GLB inspection, native integration/CI, browser WebGL/WebAudio, original PCM capture and full Warden warning/release/recovery/counter/restart remain unverified. Authentic matching-seed three-viewpoint desktop 1440×900 and mobile 390×844 recordings must also cover misses, guarded damage, evasion, arrows, spells, genuine HP injury, reduced settings, audio consent/mute, render stalls and 20-minute cleanup.

## Review and rollback

Specification review: no fictitious HP contact, source attacker, damage, danger cells or authority writes; release validation is stricter and warning history remains bounded at eight owners. Quality review: clearing spent danger is warranted even when body art is impossible, but release admission is still delayed by the planned 230ms; its appearance and sample clock require genuine moving-game evaluation. Roll back this D04-only commit if such footage contradicts the semantic retirement. Legacy spectator remains default; the branch is not merged.

**Next weakness:** delayed Warden release admission and wrist-only sword proxy remain to be verified against genuine GLBs and three-camera audiovisual evidence. No Diablo-IV parity or production readiness is claimed.
