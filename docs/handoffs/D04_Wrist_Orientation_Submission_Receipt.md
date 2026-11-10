# D04 — Revoke stale sword sound when the skinned wrist turns before frame submission

**Branch:** `feat/dungeon-d04-combat-feedback-realism-20261108` only.  
**Starting head:** `feb7dbc661af04093af78c79d4cf1e72d980be63`.  
**Frozen BEFORE:** `281735d0910c6b2443648af976003d50412ee324`.  
**Acceptance:** IN PROGRESS — genuine Dungeon WebGL/WebAudio evidence UNVERIFIED.

## Observed source failure, not a claimed real-world recording

The previous receipt compares the same skinned bone, wrist/world position,
actor root position and root yaw. A wrist can rotate in place by 0.48 rad
between the last ribbon matrix update and the renderer-submission
acknowledgment while all those measurements remain unchanged. The visual
ribbon still represents the old arm pose; the controller previously accepted
its audio receipt. Detached V8 executing the **fetched production source**
reproduced `isCurrentMeasuredHandReceipt(...)=true` for such a rotation
before the fix. This is not a blade-tip or contact measurement.

## Test-first changes

1. Commit `438635c38eddf98f94e48189222d79c3663d3c7d`: add
   `tests/foundation/dungeon-d04-wrist-rotation-receipt.test.cjs` with
   orientation-drift rejection, small jitter, equivalent quaternion signs,
   invalid/absent quaternion behavior and one production visual/controller
   frame-receipt case.
2. Commit `25bfbe2cdf941beff1e94c63cbe8efb54727a892`:
   `measured-weapon-trail.js` compares the ACTUAL skinned-world quaternion
   when present, allowing up to 0.16 rad drift and normalizing valid
   quaternions before taking the sign-invariant shortest angle. A missing or
   invalid current quaternion cannot approve a previously measured pose.
3. Commit `2d8c84f3af3556359f839f441992e73f5ba745a4`:
   `physical-feedback-visuals.js` uses one retained Three.js Quaternion
   scratch to sample live bone world orientation without changing the rig.
4. Follow-up performance commits `164b9d6e924ea9d9f2f4db02732e1e2f1842ccaa`
   and `bc56d6e5b4dc3fd20949529dfed8e18277011728` retain four
   orientation scalars in the already allocated wrist sample instead of
   allocating another object per frame. The receipt accepts these flat
   samples and test-only nested objects. Final source-backed 9/9 and full
   adapted controller re-check passed after these edits.

## Evidence and limitations

- Detached V8 RED: actual before-fix measured-trail module returned **true**
  for a 0.48-rad same-bone pivot with unchanged world wrist/root positions.
- Detached V8 GREEN: **9/9** final production-module assertion cases
  passed: large rotation denied, small jitter allowed, q/-q parity,
  missing/invalid quaternion denied, flat and nested orientation witnesses, older mock-rig compatibility and
  replaced bone denied.
- Detached V8 with the corrected fetched **production visuals module**,
  mocked Three.js rig and actual measured-trail module: genuine two-sample
  movement remained visible and receipt-authorized; a 0.48-rad post-update
  wrist pivot retained the old drawable ribbon but denied authorization;
  0.018-rad jitter remained accepted. Retained mock stats: 102 reserved
  instances, 7 new effect draw calls. These are **source-adapted mocks, not
  GPU capture results**.
- Final detached V8 with fetched production planner, original-foley exports,
  retained visuals, frame gate and controller (mock renderer, mock audio):
  changed wrist pivot produced **0 delivered sounds** with receipt
  `revoked-drawn-swing-pose`, no adapter failure. It is not genuine WebAudio.
- Native `node --test`, build, Playwright, actual three-camera video,
  original PCM, A/V sync, real GLB animation and 20-minute soak:
  **NOT RUN / UNVERIFIED**. Coding tunnel was unavailable and local GitHub
  DNS failed. Tracked `public/ai-dungeon/models` has only `.gitignore`.

## Safety, resource and rollback audit

Only D04 `public/ai-dungeon` visual/measurement code, task-specific tests,
and this document changed. No `games/ai-dungeon/src`, rigs, camera,
global lighting, main, PR #49 or other branch modifications. No altered
authority, collision, target inference, HP evidence, Warden rules, autoplay,
mute, consent, audio graph or legacy spectator behavior. D04 remains
`?feedback=d04` opt-in. The check rejects **stale air passage sound**, never
asserts a hit, attacker, blade-tip trajectory or contact. No extra meshes,
draw calls, per-frame quaternion allocations, audio voices, buffers or
listeners; one retained scratch quaternion and four scalar values in an
already bounded trail slot. Reduced-motion sound-only action witness is
unchanged.

The 0.16-rad threshold is a **source-level conservative provisional policy**
until matched real animation and frame-submitted PCM permit calibration.
An actual fast rotation can lose a cue at this gate rather than cause
a misleading delayed whoosh. Revert the two D04 source commits on this
isolated branch to roll back; leave the default spectator unchanged.

## Unmet acceptance: next strongest defect

Wrist rotation continuity still does **not** measure original sword-tip motion.
Obtain authentic animated GLB and original clips; measure blade attachment
and tip travel against frame receipt, then collect matched three-viewpoint
1440×900 / 390×844 WebM + captured bus PCM for missed sword, block, dodge,
HP-confirmed injury, arrow, spell and Warden warning/release/recovery/counter.
Run mute/reduced-motion/reduced-flash/restart/recovery and 20-minute bounded
resource soak. No Diablo-IV or finished-Gauntlet claim.
