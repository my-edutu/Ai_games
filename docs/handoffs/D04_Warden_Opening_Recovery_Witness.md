# D04 — Warden opening must be witnessed in the active recovery window

**Status:** isolated source correction, native Node suite/build/CI and actual Dungeon WebGL/WebAudio playback **UNVERIFIED**. This document is not a realism acceptance certificate.

- Branch: `feat/dungeon-d04-combat-feedback-realism-20261108`
- Frozen BEFORE comparison: `281735d0910c6b2443648af976003d50412ee324`
- Latest verified parent at session start: `48f66d5e77faffee16f4e416b8bda7a438290dc8`
- New test-first commit: `f48df4ee43955704037e84ab2ec2d075f6418df5`
- Production change: `dcfcb3ab5218b4ef7e1214728cbce569bdd40014`
- Fixture adjustments: `00b61a2c792fa8a45e2fb2b94c62631d3ebc424e`, `b8af8e8d629e013387866b61dd427d22329f78a5`

## Defect (identified by source inspection, not measured in real game)

The public `opening` event is anonymous. Earlier D04 selected any living Warden in the *next* snapshot and emitted a recovery glyph and sound without a current recovery clock. An old event retained across skipped snapshots could therefore attach a false opening to a later boss location or play after exposure ended. A synthetic `opening` string with no Warden could also receive a sound-only recovery cue. We inspected `games/ai-dungeon/src/index.ts` **read-only**: real authority emits this event on the Warden's actual cast tick, only after granting `recoveryUntilTick` in the unsealed state. The public snapshot exposes `bossRecovery` when that window remains active.

## Correction

Only stage D04 `opening` when the event tick is exactly the current adjacent observed tick; there is exactly one living matching Warden with a fresh `cast` action on that tick; the boss has a bounded still-active `recoveryUntilTick`; the prior same-ID Warden is observed; the Warden is not sealed; and an available public `bossRecovery` field agrees with that clock. The cue is actor-local, tagged `authority-opening-recovery-window`, and **never attributes a counterattacking hero**. Unproven cases are suppressed rather than redrawn late.

The previous Warden fixture incorrectly placed an `opening` event on the *next* tick after an uncorroborated cast. It now models the same authoritative tick for the cast, release and active opening, then a later earned counterattack with real Warden HP loss.

This changes no authority, AI, damage roll, authoritative tick, rig, camera, global light, shader pool, audio recipe, physical effects resource cap, consent/mute state, renderer clock, or spectator default. D04 remains opt-in `?feedback=d04`. A release sound and recovery cue are still distinct events; their **relative audiovisual onset** is not yet verified and may require separate correction.

## Test-first contracts and evidence truth

Added `tests/foundation/dungeon-d04-warden-opening-authority-witness.test.cjs` **before** the production edit. It covers valid same-tick cast/recovery, absent boss, skipped ticks, expired/contradictory/sealed windows, wrong action, unknown prior owner, dead boss and ambiguous dual Warden candidates. Updated existing contract fixtures for source fidelity.

**Execution status:** GitHub connector operations confirmed the file writes and commit IDs. The coding tunnel was unreachable (reported client disconnected for over 300 seconds); the separate working container could not resolve github.com and has no checked-out repository or Dungeon model assets. Therefore red/green native Node execution, build, CI, true canvas/audio playback and any timing measurement are **not claimed**. Test-first here describes commit ordering and test design, not a measured failing run. No new real-game WebM, WAV or PCM evidence was collected.

## Reproduction / acceptance still required

```sh
node --test tests/foundation/dungeon-d04-warden-opening-authority-witness.test.cjs tests/foundation/dungeon-physical-feedback-d04.test.cjs tests/foundation/dungeon-d04-anonymous-event-time-alignment.test.cjs
npm run build
npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs
```

Then compare same run/floor/tick/checksum with frozen BEFORE and D04 from three moving viewpoints at 1440×900 and 390×844. Capture actual canvas + original opt-in sound bus, independent PCM timing, Warden warning/release/recovery/earned counter, a miss, block, dodge, ranged and spell releases, HP-confirmed hit and ambiguous simultaneous threats; test mute/reload, reduced motion/flash, GPU stalls/context loss, scene resets and 20-minute retained resource soak. No fabricated Diablo-IV parity.

## Review and next weakness

Specification pass: only witnessed authority, no actor guessing, bounded candidate scan, no cross-scene timeline, unchanged consent and draw/voice budgets. Quality risk: strict same-tick recovery witness may suppress a valid audiovisual opening when spectator polling skips a tick; this is intentionally conservative, and the actual hit/miss ratio is unmeasured. **Next dominant problem:** Warden release presently carries a 230ms staging delay, while the same-tick recovery opening is immediate. Genuine recorded release → recovery → counter order and original sound onset must be evaluated before adjusting this timing or accepting the preview. Separate GLB blade-tip geometry remains missing; the measured wrist is only a proxy.

**Rollback:** revert only D04 branch commits above after source/visual review; never merge or change main or Draft PR #49.
