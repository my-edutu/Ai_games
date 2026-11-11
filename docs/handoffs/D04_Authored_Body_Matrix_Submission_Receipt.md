# D04 — Authored-Body Transform Receipt for Measured Sword Audio

Status: **source-level increment committed; genuine Dungeon A/V acceptance UNVERIFIED**  
Owner: Session 4 — physical feedback and original sound  
Isolated branch: `feat/dungeon-d04-combat-feedback-realism-20261108`  
Inspected starting HEAD: `d695b282b8ccdbd30a14c863dd799898927c22d2`  
Pinned BEFORE: `281735d0910c6b2443648af976003d50412ee324`  
Acceptance: `docs/handoffs/D04_Real_3D_Preview_Acceptance.md`

## Dominant source-level defect

The prior D04 sword hand receipt compared the live skinned wrist's world position, root position, yaw and (where available) wrist quaternion. It did not check the **authored asset-root transform** whose matrix posed the retained ribbon.

Three.js stores `matrixWorld.elements` in a mutable array. D04 kept that reference for its same-pass stroke computation, but a parent actor/model could rescale, pitch, roll, shear or shift a pivot **after the last VFX advance and before WebGL submission**, while this single sampled wrist's world position and orientation remained unchanged. An obsolete drawn sword could therefore still authorize its original whoosh at the later frame acknowledgment. This is an observable-in-principle renderer race discovered by source inspection, **not** proof that an authentic GLB clip exhibited it.

Test-first detached V8 red reproduction on the pre-fix production `isCurrentMeasuredHandReceipt` returned `true` for a 1.65× asset basis change, a 0.45 off-axis basis change and a malformed body witness. Those receipts should all be revoked. The red run was not native `node --test`.

## Changes

- `tests/foundation/dungeon-d04-body-matrix-submission-receipt.test.cjs`: six new `node:test` contracts. Cases cover scale, roll/shear, parent-pivot translation, admissible jitter, invalid/missing/replaced witness, negative integration with the real retained VFX/controller modules and a positive true-swing submitted-frame regression.
- `public/ai-dungeon/physical-feedback-visuals.js`: when the genuine existing authored `assetRoot.worldToLocal` is available, reject nonfinite or nonaffine model matrices. Copy 12 scalar coefficients (9 linear + 3 translation) into the existing transient wrist sample at the VFX update boundary. Keep the existing matrix pointer for immediate stroke planning, without allocating a Matrix4, adding a new object pool or modifying the character's source rig.
- `public/ai-dungeon/measured-weapon-trail.js`: the receipt now checks that the asset-root identity matches, local wrist measurements remain finite, and captured affine coefficients agree with a newly sampled live body at submission. Maximum per-component linear drift: **0.015**; translation drift: **0.06 m**. These are conservative, provisional source constants, **not GLB-calibrated realism thresholds**. Missing or malformed authored witnesses fail closed. Older adapters lacking the authored `worldToLocal` interface keep the previous wrist-position/rotation contract.

No HP, actor, targeting, Warden combat, camera, character rig, global lighting, authority, game rules or gameplay version was changed. A sword still proves only an observed *attempt*, not damage.

## Verification actually run

- **Red (before implementation):** production pure-function body-rescale/shear/malformed cases incorrectly returned `true` under detached V8 evaluation.
- **Green pure source:** stable basis, 1.65× rescale, .45 off-axis change, .16 m pivot shift, .002 basis jitter, malformed coefficients, replaced body and older no-body adapter all yielded expected answers in detached V8.
- **Green source-backed integration:** fetched and dynamically parsed **10 actual D04 production modules** including the planner, retained visuals, frame gate and controller. With simulated Three.js and audio adapters, an actual planned attack and two frame advances produced a measured body-local wrist passage. On frame receipt, stable geometry delivered one authentic-attempt whoosh, large scale drift and pivot drift delivered **zero** with `revoked-drawn-swing-pose`, and small basis jitter delivered one. Every scenario retained 7 draw-call pools and 102 reserved instances.
- **Boundary probes:** 100 deterministic simulated basis-drift cases passed the new cutoff rule.
- **New regression tests authored:** six `node:test` contracts, but the native Node test runner **was not executed**.

These source-backed detached-V8 checks use **simulated graphics/audio**, not genuine Dungeon browser gameplay, captured PCM or browser timing. No recorded voice count, decibels, WebGL GPU profiling or cross-device visual quality is established by them.

### Native commands still required

```sh
npm ci
npm run build
node --test tests/foundation/dungeon-d04-body-matrix-submission-receipt.test.cjs
node --test tests/foundation/dungeon-d04-wrist-rotation-receipt.test.cjs tests/foundation/dungeon-d04-wrist-parent-motion-rejection.test.cjs tests/foundation/dungeon-d04-wrist-parent-motion-integration.test.cjs
npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs
```

The shared coding tunnel returned `Tunnel-client has not been seen for 300 seconds`, local GitHub DNS resolution failed, and `public/ai-dungeon/models` contains only `.gitignore` in the inspected tracked tree. No accessible genuine GLB-backed gameplay clips were available.

## Acceptance gates still OPEN

- Three matched camera positions for identical real run/floor/tick/checksum, desktop 1440×900 and mobile 390×844;
- Warden warning, release, recovery, earned counter, defeat and restart;
- missed sword attempt without injury, guard/block, one-cell dodge, spell cast, projectile release, real HP-confirmed contact and ambiguous injury without invented attacker;
- original consented WebAudio output with actual captured PCM/WAV aligned to submitted video frames, not just procedural audition;
- consent/mute/reload, reduced-motion/reduced-flash, WebGL loss/recovery, browser suspend/resume and 20-minute effect density/cleanup;
- real budget telemetry for ≤104 reserved instances, ≤7 new VFX draw calls, ≤8 foley voices, ≤19,200 generated mono noise samples and bounded queues.

## Specification and engineering review

**Specification pass:** preserves HP-truth, no-invented-attacker semantics, event ordering, frame receipt and legacy default. D04 remains explicitly opt-in via `?feedback=d04`; no claim of Diablo-IV parity or final D10 integration.

**Engineering pass:** no new mesh, material, audio sample, listener, queue, interval or persistent scene resource. Added 12 scalar fields to existing ephemeral authored-wrist points, a constant-size name list and receipt comparisons for a sound candidate. No authority/replay change. Conservative drift rejection may silence a valid swing after legitimate rapid model transformation; this is preferable to fabricating a frame-synchronized sound but must be tuned from **real** animation recordings before acceptance. Numeric rigs without authored parent API are unchanged. The active frame's matrix pointer still remains mutable for same-pass trail calculation; a renderer race that changes the matrix **during** the same synchronous advance is not addressed by this submission guard.

**Rollback:** revert the D04-only production commit and focused tests on this branch; default spectator remains untouched.

## Next dominant weakness

The ribbon still follows a *body-local animated wrist proxy*, not an authenticated GLB blade tip. The next evidence-led task is to recover the real weapon mesh/attachment and the actual animated clip, measure the true tip trajectory without guessing geometry, and compare moving camera footage and synchronous original PCM against pinned BEFORE. Continue physical realism only within the D04 VFX/sound ownership boundary; D10 must independently review any final integration.
