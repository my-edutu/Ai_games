# D04 — Missing-measured-blade swing audio proof

**Branch:** `feat/dungeon-d04-combat-feedback-realism-20261108`  
**Inspected parent:** `a237ab5d86a97b0f9fbc01f6beeebccebfed0ea3`  
**Frozen BEFORE anchor:** `281735d0910c6b2443648af976003d50412ee324`  
**Status:** source-level correction, authentic Dungeon audiovisual acceptance **UNVERIFIED**.

## Dominant defect and correction

In the opt-in submitted-frame D04 director, a real adjacent-tick `swing` could be
accepted while its actual skinned hand was missing, stale or had an unsupported
GLB mount. `createPhysicalFeedbackVisuals().emit()` then refused the physical
trail, but the controller queued the whoosh anyway. At the next valid render
acknowledgment, `classifySubmittedCombatAudio` classified `visualAccepted:false`
as `deliver` because that is correctly allowed for neutral anonymous event
sounds and victim-only HP impact. The consequence was a synthetic audible blade
passage without any measured moving blade.

The pure frame gate now takes `requiresMeasuredBlade`. The **submitted-frame,
non-reduced-motion, actual sword attempt only** passes that flag from the D04
controller. When the required trail could not be admitted, the receipt records
`missing-measured-blade` and **does not call WebAudio**. A live but hidden ribbon
still waits for actual drawable wrist motion; a genuinely drawable ribbon may
play once after an acknowledged WebGL submission. The existing 400ms deadline
and scene/epoch consent rules still apply. No damage, source actor, contact or
target is inferred from an attempt.

**Accessibility and other genuine sounds are preserved:** reduced-motion mode
intentionally suppresses sword trails, so the attempted-swing sound remains
available after an opt-in and frame receipt. Anonymous block audio, real
victim-only injury, blocked projectiles, missing-art events and neutral acoustic
fallbacks are not required to show a sword; they retain their previous rules.

## Test-first evidence

- Reviewed `AGENTS.md`, D04 acceptance gates, the frozen BEFORE commit metadata,
  live planner/controller/visuals/audio/frame gate and game-audio, game-feel-vfx,
  simulation-QA and performance skills. The BEFORE commit predates D04's
  `physical-feedback-plan.js` and does not contain that path.
- Reproduced the defect using a **detached copy of the exact original pure
  frame-gate module** under local Node v22: 1/5 assertions failed as expected,
  with an absent sword returning `deliver` instead of
  `missing-measured-blade`.
- Applied the pure-gate change in that detached copy: **5/5 passed**. This is
  an isolated module check, **not** the installed repository, integration tests,
  actual WebGL submission, audible output or a native Dungeon browser run.
- Authored six native `node:test` regression contracts against the real D04
  frame gate and controller. Their execution remains **UNVERIFIED** until the
  project worktree/coding tunnel is available.

## Verification and restrictions

Run in a checked-out worktree:

```sh
node --test tests/foundation/dungeon-d04-unmeasured-swing-audio-truth.test.cjs \
 tests/foundation/dungeon-d04-visual-audio-submission.test.cjs \
 tests/foundation/dungeon-d04-first-drawable-sword-foley.test.cjs \
 tests/foundation/dungeon-physical-feedback-d04.test.cjs
npm run build
npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs
```

The coding tunnel returned `Tunnel-client has not been seen for 300 seconds`.
No genuine WebGL/Three.js movement, WebAudio PCM capture, actual GLB inspection,
three matched viewpoints, 1440×900/390×844 capture, full Warden
warning/release/recovery/counter/defeat/restart, or 20-minute soak was obtained.
No sound samples, success scores or Diablo-IV parity are invented.

**Review scope:** D04 frame gate, controller call site, focused tests and this
handoff. Main, PR #49, authoritative `games/ai-dungeon/src`, rigs, camera,
lighting and other branches remain untouched. Seven retained VFX pools/102
reserved instances, at most seven additional draw calls, eight original foley
voices, one bounded local generated noise buffer, 32 pending/32 awaiting/64
receipts, WebAudio gesture opt-in, persisted mute, reduced flash, dedupe and
reset/disposal retain their established behavior. D04 remains available only
through `?feedback=d04`; the legacy spectator stays default.

**Specification review:** no unobserved physical blade claimed; genuine sound-only
events and accessibility stay intact. **Engineering review:** a missing rig
can make the preview quieter rather than invent blade motion; browser footage
must determine whether that trade-off is acceptable. **Rollback:** revert this
isolated D04 commit. **Next dominant weakness:** no verified blade-tip GLB
trajectory or measured original PCM/frame alignment across genuine viewpoints.
