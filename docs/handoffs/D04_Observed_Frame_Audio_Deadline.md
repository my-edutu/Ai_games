# D04 — observed-frame combat audio deadline

Status: **isolated opt-in source correction; real Dungeon A/V playback UNVERIFIED**.
Branch: `feat/dungeon-d04-combat-feedback-realism-20261108`. Frozen BEFORE: `281735d0910c6b2443648af976003d50412ee324`. Parent: `b543c6e7ad24ef024937c6e676431f292770357a`.

## Inspected source defect
The D04 audio barrier used only the 50ms-capped animation `renderedSeconds`. A real 720ms browser stall could leave an impact apparently 50ms old, then emit the original sound late following a delayed successful WebGL submit. Queued whooshes could also play after the arm swing. The renderer did not report time blocked in `composer.render` or `renderer.render` before giving the cue a frame receipt. Source and tests establish the risk, not genuine captured gameplay.

## Implemented
- Preserve the <=50ms cosmetic animation step, but accumulate raw observed browser frame intervals to age audio receipts and queued cues.
- Pass actual WebGL submission duration (including fallback) to D04 acknowledgement, dropping sound if age plus blocked render exceeds 400ms.
- Drop old queued presentation attempts before VFX or sound; never reinterpret a miss as damage or invent an attacker.
- Record `expiredQueuedCues`, `invalidFrameIntervals`, and `observedFrameMs` alongside existing sound receipt telemetry.
- Unchanged: seven instanced pools/102 instances, <=7 VFX draws, <=8 foley voices, original generated mono noise, opt-in/mute, dedupe, run reset, reduced motion/flash, and legacy `/dungeon` default.
- D04-only code changed in the spectator; no edits to gameplay authority, rigs, camera, global lights, main or Draft PR #49.

## Test-first and evidence
Node 22 detached fixture: four contracts written before correction; 3/4 red (real 720ms stall, blocked 620ms renderer, stale queued swing), then 4/4 green. Two detached existing D04 foundation suites plus the four new tests: **29/29 green**. Current branch build and Playwright were NOT run: coding/browser tunnel disconnected. These results do not prove sample-level A/V synchronization or 3D realism. No actual matched clips exist here.

Run on a real branch worktree:
```sh
npm ci
npm run build
node --test tests/foundation/dungeon-d04-audio-frame-deadline.test.cjs tests/foundation/dungeon-root-motion-frame-d04.test.cjs tests/foundation/dungeon-measured-hand-trail-d04.test.cjs tests/foundation/dungeon-physical-feedback-d04.test.cjs tests/foundation/dungeon-physical-feedback-realism-d04.test.cjs tests/foundation/dungeon-physical-feedback-preview-integration.test.cjs
npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs
```

Real acceptance must capture `/dungeon` and `/dungeon?feedback=d04` at identical seed/run/floor/tick/checksum, 3 viewpoints, 1440x900 and 390x844, real miss/hit/block/dodge/projectile/spell/Warden sequences, opted-in audio PCM and 20-minute soak. Browser submitted-frame receipts and detached WAV auditions are not playback proof.

Rollback: revert only this D04 commit. Next dominant physical weakness remains the unverified true sword-tip path; present ribbon measures the real right-hand bone, not confirmed blade geometry.
