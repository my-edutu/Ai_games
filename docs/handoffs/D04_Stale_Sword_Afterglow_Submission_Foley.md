# D04 — Submitted sword afterglow is not a new audible sword passage

**Scope:** exclusively `feat/dungeon-d04-combat-feedback-realism-20261108` (no merge).  
**Starting head:** `2f563e133c15bbc222c989267cc491236d3dcf4a`.  
**Frozen BEFORE:** `281735d0910c6b2443648af976003d50412ee324`.  
**Acceptance:** IN PROGRESS; genuine Dungeon browser WebGL + WebAudio capture **UNVERIFIED**.

## Highest-confidence observable source defect

The retained trail permits a subtle <=55ms cosmetic fade after the most recent
physically measured wrist segment. That fade was erroneously sufficient to
authorize an original whoosh on a later frame: `hasDrawableCue` stayed true,
`hasAuthenticatedSwingPose` returned true for an unchanged skinned wrist, but
`measuredSwingSpeed` already returned null because **no fresh arm movement**
occurred on that frame. This can put air sound behind an already stationary
blade, exactly the failure prohibited by D04 acceptance. This is a verified
source/adapter defect, **not an observed genuine-GLB soundtrack defect**.

A newly submitted audible sword passage now requires BOTH the same skinned
bone/pose receipt witness AND `lastMeasuredAge === slot.age`, the existing
frame-local physical measurement marker. The independent visible fade is
unchanged, so visuals may decay for readability; they do not become evidence
for a new whoosh. No fake hit, blade-tip measurement, attacker, victim, impact,
or authority mutation is introduced. The controller already denies silent
stale receipts and applies its own scene/elapsed-frame/gesture/epoch gates.

## Test-first implementation and evidence

1. Inspected `AGENTS.md`, this branch's
   `docs/handoffs/D04_Real_3D_Preview_Acceptance.md`, the pinned frozen
   BEFORE commit, current planner, retained effects, wrist measurement,
   original WebAudio synth, frame gate, model-asset/rig interfaces, and
   game-audio/game-feel-vfx/simulation-qa/performance-optimization skills.
2. Committed `tests/foundation/dungeon-d04-stale-sword-afterglow-foley.test.cjs`
   **first**. It covers fresh moving wrist acceptance, visible-but-stationary
   afterglow rejection, and a real production-controller submission receipt.
3. Detached V8 **RED**, from fetched before-fix production modules and a
   mocked Three.js stage: fresh measured passage
   `[drawable=true, authenticated=true, speed=7.5m/s]`; stationary next frame
   `[drawable=true, authenticated=true, speed=null]`. This violated the new
   contract. No native test execution was implied.
4. Minimal production fix in
   `public/ai-dungeon/physical-feedback-visuals.js`: require the *current*
   retained segment's measurement age when authorizing sword foley.
5. Detached V8 **GREEN**, using fetched corrected production measured
   path, retained visual stage, public cue planner, frame gate and controller
   with mocked Three.js, audio and warning/projectile adapters:
   - Fresh: `[true,true,7.5m/s]`
   - Stationary afterglow: `[true,false,null]`
   - Actual controller's submitted-frame acknowledgment on stationary
     afterglow: `0` delivered sound, `0` adapter emissions,
     `1` stale-audio rejection, `1` acknowledged frame
   - Retained stats in adapted stage: `102` reserved instances and `7`
     draw calls, **not genuine GPU measurements**.
6. Native Node's `node --test`, npm build, browser Playwright, actual
   skinned GLB playback, original PCM, hardware telemetry, and GitHub CI:
   **NOT RUN / UNVERIFIED**. Local network git failed DNS. The separate
   approved coding tunnel returned `Tunnel-client has not been seen for
   300 seconds`. The model directory contains only `.gitignore` as a
   tracked asset and cannot substitute for authentic moving animation.

## Review / safety boundaries

- Specification: only a presentation-only physical receipt witness changed;
  `games/ai-dungeon/src`, camera, character rigs, global lighting, main and
  PR #49 were not edited. Default spectator still uses legacy behavior;
  the preview remains `?feedback=d04`.
- Causality: an attempted swing only proves attempted air passage, never HP
  loss. Damage remains tied to adjacent verified HP deltas; no text-parsed
  actor, inferred projectile impact, target or Warden collision is introduced.
- Accessibility: reduced-motion sound-only actions retain their independently
  authenticated action-path behavior, with no imaginary skinned blade
  requirement; reduced-flash unchanged. Audio consent, manual mute,
  suspension/output rebinding, source dedupe, floor/reset cleanup unchanged.
- Budget: zero new visual instances, geometries, draw calls, WebAudio voices,
  noise buffers, timers or subscriptions. One scalar comparison on an
  already-bounded eight-slot trail search. Existing 7 pools / 102 instances /
  8 voices / 13,440 noise samples / 32-32-64 queue caps preserved **in source**.
- Quality limitation: one real wrist movement may be visually fading but
  inaudible when submission occurs after the last fresh sample. This is the
  deliberate conservative failure mode, preferable to a ghost whoosh, but
  MUST be judged in genuine frame+PCM playback.
- Rollback: revert the small `physical-feedback-visuals.js` change on this
  isolated branch, leaving default spectator unchanged.

## Genuine acceptance still owed

Collect matched authoritative seed/run/floor/tick/checksum, **three viewpoints**
and both 1440x900 desktop and 390x844 mobile for a missed attempted sword,
HP-confirmed contact, block, dodge, ranger arrow, cultist spell, ambiguous
injury, Warden warning/release/recovery/earned counter/defeat/restart.
Record actual canvas WebM and original opt-in FX-bus PCM with submission-time
evidence and real viewer/stream sound. Evaluate reduced-motion and reduced-flash,
gesture/mute/reload, WebGL recovery and a 20-minute resource soak. Compare
against the pinned frozen BEFORE in blind moving-sequence review.

**Next dominant weakness:** the present source still measures a genuine
animated WRIST, not authenticated original GLB blade-tip displacement. The
actual skinned source meshes and motion clips must become available before
selecting a real tip and claiming physically attached blade passage.
