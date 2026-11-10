# D04 — Authored-Body Local Wrist Travel, Not Whole-Figure Motion

Status: **source-level increment complete; genuine Dungeon audiovisual acceptance UNVERIFIED**  
Owner: Session 4 — physical feedback / original sound  
Branch: `feat/dungeon-d04-combat-feedback-realism-20261108`  
Inspected branch before this increment: `6cbb078304407276c0b3b11d4ee83fc2cf90fa60`  
Pinned comparison BEFORE: `281735d0910c6b2443648af976003d50412ee324`  
Acceptance contract: `docs/handoffs/D04_Real_3D_Preview_Acceptance.md`

## Dominant defect and causal reproduction

The pre-change `planMeasuredHandTrail` subtracted only an actor root's translation
and yaw. But real imported Dungeon skinned actors also move through
`impactPivot`, `visualPivot`, asset-root scaling, and animated presentation
transforms. Those transforms can carry an otherwise stationary wrist through
world space. As long as the public actor remained in its real `attack` action,
D04 could render a wrist-proxy streak and subsequently grant an unearned air
whoosh for **whole-body lean/recoil** instead of a moved weapon hand.

This was **source-inferred**, not an observed defect in a genuine WebGL clip.
A fetched-production pure-function red reproduction confirmed:

- Before fix: world wrist moved **0.16 m**, authored local wrist delta **0 m**;
  `planMeasuredHandTrail` incorrectly returned a 0.16 m passage.
- Before fix: world wrist moved **0.26 m**, authored local wrist delta **0.10 m**;
  the planner incorrectly reported **0.26 m** rather than **0.10 m**.
- A separate quality review found a nonfinite homogeneous matrix coefficient
  could wrongly be accepted as affine; a regression was added before fixing it.

A moving wrist still does **not** prove the physical blade tip travelled, hit
anything or caused HP loss. No attacker was inferred from damage.

## Implementation

1. `public/ai-dungeon/physical-feedback-visuals.js`: the **already-existing**
   authored bone sample now also reads its wrist in the genuine GLB
   `assetRoot` local coordinate frame using a single retained Vector3
   scratch. It records the actual asset-root identity and a reference to its
   existing world matrix elements. Missing/malformed matrix data fail closed
   where the asset-root API exists. No rig/model is modified.
2. `public/ai-dungeon/measured-weapon-trail.js`: for a genuine body-local
   witness, compare the two measured local wrist positions and project the
   **difference**, via the current authored world matrix, into world-space
   metres. This removes whole-figure translation, pitch, roll, yaw, lean,
   recoil and asset-root scale from the measured limb gesture. Do not
   manufacture a tip, alternative pose, rotation-only trail or target.
   Retain root-translation/yaw compensation only for older numeric/mock
   adapters lacking an authored-body API.
3. `physical-feedback-visuals.js` exposes
   `bodyLocalTrailFrames` and `yawFallbackTrailFrames` counters to tell
   future **real-browser** reviewers whether the authored-space path was
   actually exercised. Counters are not scene-quality or playback metrics.
4. `tests/foundation/dungeon-d04-wrist-parent-motion-rejection.test.cjs`:
   seven contracts for parent-only lean, simultaneous limb/body movement,
   nonuniform asset scaling, asset replacement, missing transforms,
   invalid affine coefficients, and backward adapter behavior.
5. `tests/foundation/dungeon-d04-wrist-parent-motion-integration.test.cjs`:
   uses the actual retained VFX/controller source path under simulated
   Three.js and audio adapters; one real authority-planned swing cannot
   become an audible whoosh from body lean, then can sound from a later
   freshly moved wrist after an accepted frame receipt. It also checks
   counters and retained budgets.

## Actual verification performed

- **Before implementation**: fetched-production detached-V8 red reproduction
  observed the 0.16 m false streak and 0.26 m inflated segment.
- **After implementation**: **15/15 adapted source-backed assertions passed**
  in detached JavaScript, including the two new test files, existing
  measured-trail regression tests and previous skinned wrist-rotation/
  frame-receipt integration tests.
- Production `measured-weapon-trail.js`, `physical-feedback-visuals.js`,
  `physical-feedback-plan.js`, `physical-feedback-frame-gate.js`, and
  `physical-combat-feedback.js` were dynamically parsed/evaluated for
  these adapted checks. Non-participating environment interfaces were
  simulated, **not** tested in Chromium.
- **NOT EXECUTED:** native `node --test`, `npm ci`, production build,
  Playwright, actual Dungeon Three.js / GLB playback, original PCM capture,
  three camera angles, 1440×900 and 390×844 comparison videos, full
  warning/release/recovery/counter sequence, block/dodge/miss/spell/arrow/hit
  sequences and 20-minute performance/cleanup soak.
- Coding tunnel reported `Tunnel-client has not been seen for 300 seconds`.
  A local container cannot resolve `github.com`; repository
  `public/ai-dungeon/models` contains only `.gitignore`. No genuine asset
  frames/clips were accessible for a visual or synchronized audio judgment.

## Budget, safety and integration

- No new visual pool, mesh, material, draw call, instantiated GPU geometry,
  audio node, sound sample, oscillator, listener, or voice.
- One additional retained `THREE.Vector3` scratch in the D04 visual adapter;
  only scalar local joint coordinates and pointers are attached to an existing
  transient pose record. The matrix is read by reference **in the same
  animation/advance pass**; no copied per-frame Matrix4.
- Previous hard caps remain seven pools / 102 reserved instances / seven new
  draw calls, eight foley voices, the 13,440-sample original noise texture and
  the existing bounded cue and receipt queues. The **real GPU/PCM budgets
  remain unmeasured** pending browser playback.
- The public authority, HP-based damage gate, no-invented-attacker semantics,
  audio gesture opt-in, persistent mute, reduced motion/flash, stale frame
  checks, effect deduplication and cleanup paths were not changed.
- Legacy spectator `/dungeon` remains the default. D04 stays behind
  `?feedback=d04`. No change to main, Draft PR #49, authoritative
  `games/ai-dungeon/src`, rigs, camera or lighting.

## Independent review / residual risk

**Specification:** removes a previously reproducible *false wrist passage*
while maintaining a source-backed action and drawable-frame authorization.
The change concerns limb movement only; it cannot validate blade contact.

**Engineering:** source matrix coefficients and shape are validated, stable
asset-root identity is required, incompatible adapters have their existing
behavior, and resource limits are unchanged. But a simulated body translation
is not the same as playing the licensed GLB skeleton under every pivot.

**Highest-priority next work:** on an available real browser/build, inspect
the actual sword mesh and animation clip, recover the **true animated blade
tip** (without guessing geometry), compare its trajectory to D04's local-wrist
proxy in three real camera viewpoints, synchronize actual WebAudio PCM to
submitted frames, and collect matched desktop/mobile and Warden captures.
Reject false geometric claims until this evidence exists. A dedicated final
D10 integration review must precede any default switch or merge.

**Rollback:** revert these D04-only commits on the isolated branch;
legacy/default spectator is unaffected.
