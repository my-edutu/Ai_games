# D04 — Keep Warden release/recovery body signals attached to an observed body

**Status:** production-source correction on opt-in D04; real Dungeon WebGL/WebAudio acceptance remains **UNVERIFIED**.

- Repository: `my-edutu/Ai_games`
- Exclusive branch: `feat/dungeon-d04-combat-feedback-realism-20261108`
- Starting verified head: `a9e78cceb15d8f73f08c32a95d53d6cf1d26fb61`
- Frozen BEFORE comparison: `281735d0910c6b2443648af976003d50412ee324` (not changed)
- Default spectator remains untouched; only `/dungeon?feedback=d04` uses this VFX.

## Source-confirmed dominant defect

The Warden release and opening rings were properly anchored to a visible same-tick cast **only when emitted**. Their retained signal slots then stored the first world-space origin and used it unchanged for up to 380ms. During the life of that effect, an existing animated Warden could visibly translate, hide, change its public action/cast tick, or leave the authoritative cell. The ring continued at the old position. The submitted-frame audio check could still see a live, drawable instance even though that instance no longer belonged to the real body.

This is a 3D *presentation continuity* issue, not evidence that a strike caused HP loss. A real Warden pose, weapon-tip contact, and sound onset remain unverified without the actual models and running game.

## Test-first correction

1. Added `tests/foundation/dungeon-d04-warden-body-signal-continuity.test.cjs` before production edits. Executed its four committed callbacks against the actual preceding visuals source in an adapted V8 test harness: **3 failed for the expected missing behavior, 1 passed** (authoritative danger-cell preservation).
2. Updated **only** `public/ai-dungeon/physical-feedback-visuals.js`. Each already retained `signal` slot for `warden-release` or `opening` now re-reads the same observed actor through the existing read-only `anchor()` on every visual advance. If actor ID, public cell, visibility, cast action, cast tick, or body position is stale, the slot is immediately retired before the next submission; it cannot later resurrect merely because a model reloads. Otherwise its existing instance matrix follows the live actor.
3. Added bounded counter `retiredUnanchoredBodySignals` to existing visual stats; no new queue, geometry, material or emitter. **Real warning cells are deliberately exempt** and keep their authority-grounded floor placement.
4. Added a fifth regression contract exercising the actual D04 controller/frame gate: a previously accepted Warden ring that disappears before the frame acknowledgment must not claim a synchronized release/recovery sound. Source-backed loss of the Warden **before visual admission** retains the existing sound-only authoritative fallback (older contract).

### Executed checks

- New committed tests against the changed production visuals, planner, frame gate, and controller: **5/5 passed** in an **adapted V8 execution**, with mocked THREE geometry and audio buses.
- Four older committed `dungeon-d04-warden-body-pose-anchoring.test.cjs` regression callbacks against the changed production visuals, actual warning marker selector, and real warning lifecycle functions: **4/4 passed** in adapted V8. Total separately executed source-level callbacks: **9/9**, not a native Node test runner result.
- No fake authoritative ticks, target IDs, HP drops, collision claims, synthetic attacker labels or alternate gameplay rules were used.

Expected native checks once the repository worktree and assets can be mounted:

```sh
npm ci
node --test tests/foundation/dungeon-d04-warden-body-signal-continuity.test.cjs tests/foundation/dungeon-d04-warden-body-pose-anchoring.test.cjs tests/foundation/dungeon-d04-signal-stage-physical-anchoring.test.cjs tests/foundation/dungeon-d04-warden-release-recovery-submission-order.test.cjs
npm run build
npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs
```

## Boundaries, risk, acceptance

This change is limited to one D04 visual renderer, its focused tests, and this handoff. It does **not** change `games/ai-dungeon/src/**`, character assets or rigs, camera, environment/global lighting, underlying authority, or non-D04 spectator behavior. Existing 7 retained GPU pools / 102 reserved instances / <=7 candidate draw calls, 8 authored voices / <=19,200 mono samples, capped receipts and queues, explicit WebAudio gesture opt-in, persistent mute, reduced-motion and reduced-flash modes, and scene reset semantics remain structurally unchanged. Warden body sampling can occur up to 8 times per active signal pool per frame; its actual CPU impact is **not profiled**.

Specification review: do not show a body-local ring without a currently observed matching Warden cast; do not retire floor danger when the character art disappears. Quality review: follow actual movement but retire an orphan immediately; never infer blade-tip position, contact or successful damage. Rolling back the implementation and test commits restores prior D04 experimental behavior; no main/PR #49 integration is requested.

**UNVERIFIED:** Direct GitHub clone failed host DNS resolution; no local Dungeon GLBs or actual WebM/WAV clips are tracked at the inspected branch tree. Native Node/build/Playwright, Three.js presentation, original sound capture, 3 identical-seed viewpoints, 1440x900 desktop and 390x844 mobile, the complete Warden warning/release/recovery/counter, sword miss and true HP impact, block, evade, projectile, spell, simultaneous threats, reduced settings, renderer recovery, PCM-to-frame onset, and 20-minute soak have not been witnessed. Do not use source-level checks to claim Diablo-IV parity, 3D transformation or production readiness.

**Next dominant weakness:** Real Warden release audio and actor glyph still agree on an authority cast tick, not the animated weapon's actual strike pose. A genuine three-angle GLB-backed playback must measure that mismatch before changing release offsets or claiming impact realism. Blade-tip geometry remains unverified; the current melee ribbon still represents skinned wrist displacement only.
