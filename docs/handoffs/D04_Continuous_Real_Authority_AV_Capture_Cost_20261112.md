# D04 — Uninterrupted Real Authority vs One Original A/V Recorder

**Status:** EXPERIMENTAL / NOT ACCEPTED / NO PRODUCTION PRESENTATION CHANGE  
**Branch:** `feat/dungeon-d04-combat-feedback-realism-20261108`  
**Date:** 12 November 2026  
**Frozen BEFORE:** `281735d0910c6b2443648af976003d50412ee324`  
**Prior accepted diagnostic:** `0c82d661eca2130b4c6bd9d6608dc97d56f1ae14`

## Why this investigation is necessary

The prior `43198249099` Chrome run exercised real sequential `DungeonRuntime.step()` snapshots with capture on/off and showed direct WebGL worst calls of 28.6ms desktop and 23.5ms mobile in the captured arms. But a separate continuous original injury at tick 4 still arrived **1,994ms** after observation, including **1,680ms** in the renderer, and was correctly suppressed by the unchanged **400ms** sound deadline. Those workloads are not interchangeable. In particular, stage-by-stage polling waits for the renderer, potentially removing real-time pressure.

The new test specifically lets real public authoritative snapshots advance on **one independent Node monotonic schedule**, whether or not the browser, encoder or WebGL is able to submit frames. A delayed browser GET receives the latest real state. It may skip intermediate real ticks; a missed HP event is *not* fabricated or backfilled. The same immutable `visual-room-art-18` corpus and 250ms authority cadence are used in both serial arms.

## Files and ownership

- `tests/foundation/dungeon-d04-live-authority-pair.test.cjs` — seven test-first classifier contracts.
- `tests/browser/dungeon-d04-live-authority-pair.cjs` — strict bounded forensic comparator.
- `tests/browser/dungeon-d04-real-live-authority-capture-pair.spec.cjs` — real opted-in D04/Three.js continuous test at 1440×900 and 390×844.
- `tests/browser/dungeon-d04.playwright.config.cjs` — only the isolated D04 browser suite opts into the new test.
- `.github/workflows/dungeon-d04-foley-identity.yml` — only the D04-owned CI workflow runs it.

No authority module, app/renderer/camera, animation rig, lighting, legacy spectator, audio implementation, budget, mute policy or deadline was modified. Default spectator remains the default. D04 is only `?feedback=d04`.

## Actual observation contract

The browser must perform a real `#audio-toggle` opt-in click in **both** arms and select the same tactical view. One arm is capture-off. The other starts **at most one** MediaRecorder combining the actual `#world` WebGL canvas stream and existing opted-in original soundstage track, with an 8MiB clip limit. Every newly observed real frame contributes a bounded diagnostic sample with rendered scene checksum, tick, focused actor, camera pose, actual direct-render duration, retained VFX resources and recent cue/frame receipts. Capture frames are requested only after observed real submission receipt changes; no synthetic 2D canvas, fake damage, audio file or attacker is introduced.

The pure classifier rejects invalid or repeated authority stage/checksum, incorrect source, non-monotonic renderer frame, missing consent, missing video/audio track, multiple encoders, bad camera/viewport and stale or fabricated injury receipts. It retains the **worst render call** when two valid frame receipts show the same authoritative tick; it does not choose the favorable one. Exact HP-loss cue IDs must be anonymous attacker `scene:tick:kind:-:victimId` and timely to count as a receipt. A later unrelated visual or WebAudio source start never certifies the original injury.

The evidence always reports `causedByRecorder:null`, `sampleSynchronized:false`, `impactAVAccepted:false`. Missing matching damage scenes yield `INSUFFICIENT_MATCHED_LIVE_DAMAGE`, not a success claim. A missing original WebM yields `CAPTURE_PROVENANCE_UNVERIFIED`. Effect caps remain 7 VFX draw calls / 104 reserved instances.

## Test-first evidence and reproduction

The new native test was committed first at `916348da776945c2e9c35b7513cb8dac53c818a6`. The focused test failed locally because its comparator was not yet present. After implementing the module, the seven native checks passed under Node 22 locally. Browser results remain separately governed by the *actual completed* D04 GitHub Actions run; a queued workflow is not a real-game acceptance pass.

```sh
node --test tests/foundation/dungeon-d04-live-authority-pair.test.cjs
node --check tests/browser/dungeon-d04-live-authority-pair.cjs
node --check tests/browser/dungeon-d04-real-live-authority-capture-pair.spec.cjs
npm ci
npm run build
npm run dungeon:assets:strict
D04_BROWSER_CHANNEL=chrome DUNGEON_REQUIRE_MODELS=1 npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs dungeon-d04-real-live-authority-capture-pair.spec.cjs
```

Expected diagnostics: `artifacts/dungeon-d04-live-authority-capture-pair-evidence.json`, real desktop/mobile screenshots, and optional genuine combined WebMs ending `-unaligned.webm`. CI artifacts must preserve unavailable/insufficient outcomes. Frames in WebM and Opus packets alone do *not* establish decoded sample-level impact synchronization.

## Independent reviews

**Specification:** authority remains read-only and real; true HP loss only; no invented attacker, synthetic injury or sound; opt-in and mute ownership unchanged; no new output runs in legacy. A missed tick is not reinterpreted as a block or hit.

**Quality:** a serial browser experiment cannot causally attribute performance regression to the recorder. Per-tick matching is intentionally strict and can result in insufficient overlap. Actual software WebGL may starve a polling sampler. Observed renderer durations are CPU-side call times, not GPU fence timing. Separate Chrome capture, raw encoded PTS inspection and more moving angles remain necessary.

**Rollback:** revert the new comparator/test, isolated config/workflow registrations and this handoff only. No gameplay migration required.

## Still not accepted

Timely original damage receipt under genuine live workload; sample-aligned original sound; fully moving decoded three-viewpoint footage at desktop and 390px; Warden warning/release/recovery/counter; miss/block/dodge/projectile/spell contact truth; blade-tip geometry and 20-minute pooled-effect soak. The next dominant weakness is whichever mechanism the continuous capture-on/off trial actually exposes, not an assumed encoder or D04 fault. Never weaken the 400ms gate to make stale sound appear successful.
