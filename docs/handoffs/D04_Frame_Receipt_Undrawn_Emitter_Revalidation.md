# D04 — Undrawn emitter revalidation at actual frame receipt

Status: **SOURCE-LEVEL INCREMENT VERIFIED IN ADAPTED V8; GENUINE DUNGEON A/V UNVERIFIED; NOT READY TO INTEGRATE**

Branch: `feat/dungeon-d04-combat-feedback-realism-20261108`

Started from actual head `4350bc8e1cfd8f7f618ac54c029f9d8b848f27ea` (not the initial `d74ab68`); frozen BEFORE comparison remains `281735d0910c6b2443648af976003d50412ee324`. Follow `AGENTS.md` and `docs/handoffs/D04_Real_3D_Preview_Acceptance.md`.

## Dominant source-confirmed defect

Previously the D04 controller checked an undrawn arrow/spell emitter or body-local Warden/utility pose **only when staging its sound**. If renderer admission failed but the source was authentic at staging, the controller queued sound. Between that stage and a genuine WebGL frame receipt, the actor, action or imported bone could disappear or change. The old receipt path checked scene/time/retained-visual liveness but did **not** recheck an undrawn emitter. Thus it could play a release or Warden body sound after the source had been revoked. This is a source-backed failure scenario, **not** an observed real-game clip.

## Test-first change and implementation

- `tests/foundation/dungeon-d04-frame-receipt-emitter-revalidation.test.cjs`: seven contracts for changing an undrawn ranger origin, spell origin, Warden release/recovery, guarded gesture, legitimately persistent emitters, and independent HP-loss audio. Executed the actual pre-fix controller and planner in an **adapted V8 test harness**: 1 passed / 6 failed, with ghost audio reproduced. Not a native Node test.
- `public/ai-dungeon/physical-combat-feedback.js`: before calling WebAudio at a valid submitted-frame receipt, recheck `hasAuthenticatedReleasePose` or `hasAuthenticatedBodyPose` for undrawn source-local cues. Fail closed with `revoked-release-pose` / `revoked-body-pose` receipts; preserve original staleness, scene, priority, voice and frame-ID gates. Retained/drawn cues still use existing liveness/drawability contracts. Real HP-loss audio is not tied to an inferred perpetrator.
- `tests/foundation/dungeon-d04-undrawn-body-foley.test.cjs`: expect two source queries on valid undrawn Warden body sounds (admission **and** frame receipt).
- `tests/foundation/dungeon-d04-optin-epoch-audio.test.cjs`: repair a pre-existing consent fixture that lacked the positive drawability witness required by the established measured-blade gate. It failed even at the pre-change branch head in the same adapted test harness. This fixture now models a drawable retained slot, **not** a real sword movement.

## Executed checks / evidence classes

- **RED**: 1/7 new tests passed against pre-fix fetched controller source; six failed as designed, including ghost Warden and projectile sounds.
- **GREEN**: 49/49 adapted source-backed callbacks passed across nine selected test files: new receipt tests (7), undrawn body (6), unverified release (5), numeric/string receipt replay (5), consent/epoch (4), delayed audio deadline (4), Warden release/recovery sequencing (5), frame stall/drop (4), and visual/audio submission gate (9).
- JS source was compiled inside a V8 isolate after import/export transformation; real planner, controller and frame-gate bodies were used with **injected** visuals, audio, storage and evasion adapter. This is **not** `node --test`, browser WebGL, real WebAudio, or user-level recording.
- The pre-existing opt-in fixture failure was independently reproduced at branch head `4350bc8` before its test fix; no claim about the remaining full native suite.

## Budgets and ownership

No additional visual pool, GPU instance, draw call, audio voice, AudioBuffer, external sound sample, authoritative rule, rig attachment, camera behavior, light or runtime entry route. Read-only pose revalidation adds at most one existing renderer witness query for each undrawn source-local cue reaching a valid frame receipt. The bounded 32 awaiting-frame slots, 64 receipts, seven pools / 102 reserved instances, eight-voice cap, gesture-only opt-in, persisted mute, reduced-motion/flash and reset/disposal paths are unchanged. Actual CPU and GPU costs remain **unmeasured**.

The normal `/dungeon` spectator remains the default. D04 remains explicitly opt-in via `?feedback=d04`; no changes were made to authoritative `games/ai-dungeon/src`, main, PR #49, character rigs, camera, lighting or other session branches.

## Missing genuine acceptance evidence

The coding tunnel returned `Tunnel-client has not been seen for 300 seconds`. The separate container could not resolve `github.com`. The inspected `public/ai-dungeon/models` tree contains only `.gitignore`; the `games/ai-dungeon/assets` tree contains a manifest and provenance document, not mounted GLBs. No authentic clips or captured PCM/WAV were available in the inspected evidence location.

Therefore **NOT VERIFIED**: same-seed and checksum matched BEFORE/AFTER movement/combat, three camera directions, 1440×900 and 390×844, true missed swing/confirmed hit/block/dodge/projectile/spell, full Warden warning–release–recovery–earned counter, audio opt-in/mute/reload in an actual browser, 20-minute soak, stream encoding, original sample onset, p95/p99 GPU draw timing, audio peak/voice telemetry. A standalone generated WAV or simulated rig does not close these gates.

## Next dominant realism weakness

The source-observed melee trail still reads an animated **wrist proxy**, not a verified sword-tip or blade-contact trajectory; Warden sound onset likewise lacks frame-aligned GLB+PCM proof. Acquire actual model assets and running Dungeon capture, then build original-geometry weapon-tip measurements against motion and audible samples. Do **not** claim physical contact or parity from the current pose witnesses.
