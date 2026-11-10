# D04 — Frame-authenticated wrist velocity shapes original sword air foley

**Branch:** `feat/dungeon-d04-combat-feedback-realism-20261108`  
**Inspected head:** `7eedc878b4f773bff6dae8f459c207f997c00731`  
**Frozen BEFORE:** `281735d0910c6b2443648af976003d50412ee324`  
**Acceptance:** **IN PROGRESS / genuine Dungeon synchronized A/V UNVERIFIED**

## Source-level defect / hypothesis

The original procedural sword whoosh had the same envelope for a slow and a fast
**genuinely observed** hand passage. Measured 1m/s and 8m/s wrist movement both
produced the same captured mock gain-ramp peak, `0.0561744`, using the
fetched existing production synth. Thus the current source was incapable of
reflecting real physical swing effort, even where the D04 visual renderer had
already measured actual right-wrist travel. This is a **source-proven sonic
uniformity**, not a verified audible perceptual defect in genuine Dungeon
footage. The real skinned GLB sword TIP is still not measured.

This increment is conservative: the production retained trail slot records
`measuredPath.length / actualFrameSeconds` only on a fresh valid, root-motion-
compensated, same-joint physical sample. At real WebGL frame acknowledgment,
D04 rechecks the performer, wrist identity and live pose. Only a genuinely
drawable, authenticated normal-motion **swing attempt** can forward that
read-only measured wrist speed to the original noise synthesizer.

For a verified attempted swing with a finite positive measurement, the new
air-foley gain factor is bounded to `0.84..1.00` of the existing envelope.
Faster measured hand passage approaches the existing volume, while slower
passage becomes marginally quieter. This adds **no** gain above the original,
no extra oscillators, buffer, sample, particle or pool. Invalid, absent, stale,
reduced-motion and non-swing measurements use the original recipe unchanged.

A sword attempt **does not** authenticate HP damage, a blade tip, attacker-
victim causality or weapon contact. Actual HP-confirmed injury sounds remain
separately authorized, without invented attackers.

## Test-first and adapted evidence

1. Inspected `AGENTS.md`, D04 acceptance, frozen BEFORE tree/app, current
   `measured-weapon-trail.js`, original foley, controller, physical visuals,
   planner, scene wiring, existing wrist/audio tests, plus game-audio,
   game-feel-vfx, performance-optimization and simulation-QA skills.
2. Committed six Node test contracts (four controller/audio, two real retained-
   visual-stage scenarios) **before** production source changes.
3. **Red reproduction:** Detached V8 evaluation of the fetched production
   controller did NOT pass the physical measurement to audio; the fetched
   production synth generated identical mock envelope ramp peaks
   `0.0561744` for 1m/s and 8m/s inputs.
4. **Green adapted production-source checks:** The same controller now
   forwards `4.5`m/s on a verified drawn swing, and no fabricated speed for
   reduced motion, NaN or negative input. The original synth returns mock
   peaks of `0.0473130862` (1m/s), `0.0498448901` (3m/s) and
   `0.0561744` (8m/s); the unmeasured and Infinity cases retain
   `0.0561744`.
5. A detached production-visuals test with a mock Three.js stage and
   genuine `planMeasuredHandTrail` logic returned `7.5`m/s after actual
   simulated joint travel, `null` before the second sample, `null` after
   unsampled drift and rig replacement, and a new valid sample only after
   another coherent frame. This is **NOT** a real animated GLB trial.
6. The changed JavaScript production files and new test file parsed in V8.
   GitHub compare against the inspected head confirmed five forward commits,
   zero behind and exactly four D04-scoped files, before this documentation
   commit. GitHub reported no CI statuses or PR-triggered workflow runs.

**Native Node `node:test`, full build and Playwright remain NOT RUN.**
Separate container `git ls-remote` failed GitHub DNS resolution, and the
approved coding tunnel is unavailable in this run. The inspected frozen
and current tracked trees contain no Dungeon `.glb`, `.webm` or `.wav`
assets suitable for authentic playback. Simulated ramps do not establish
loudness, perceived quality, rendered frame/PCM synchronization, or correct
speaker/stream output.

## Review commands for the approved D04 worktree

```sh
node --test tests/foundation/dungeon-d04-measured-wrist-whoosh-dynamics.test.cjs \
  tests/foundation/dungeon-d04-swing-rig-receipt-continuity.test.cjs \
  tests/foundation/dungeon-d04-simultaneous-verified-swing-foley.test.cjs \
  tests/foundation/dungeon-d04-simultaneous-verified-impact-foley.test.cjs \
  tests/foundation/dungeon-d04-visual-audio-submission.test.cjs
npm run build
npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs
```

For acceptance, inspect the SAME genuine seed/run/floor/tick/checksum,
three viewpoints at 1440×900 and 390×844, with actual output-bus PCM:
slow/fast **missed** sword passages and real HP-confirmed contact; Warden
warning/release/recovery/earned counter, block, dodge, arrow, cast,
ambiguous damage and full restart. Confirm early vs late whoosh alignment
with submitted motion, reduced-motion/flash and mute/gesture consistency,
pool/voice peaks, 20-minute soak and blind before/after evaluation.
Do not assign any visual/perceptual quality score before these captures.

## Specification review

- Changed ONLY `public/ai-dungeon/physical-feedback-visuals.js`,
  `physical-combat-feedback.js`, `original-combat-foley.js`,
  `tests/foundation/dungeon-d04-measured-wrist-whoosh-dynamics.test.cjs`
  and this D04 handoff. No edits to `games/ai-dungeon/src`, rigs, camera,
  global lighting, main, PR #49 or other branches.
- Default /dungeon remains legacy; `?feedback=d04` stays opt-in.
- Read-only posed wrist and authority attempt remain separate from HP
  damage, ranged/projectile contact, block owner and Warden events.
- A fresh user gesture, manual mute, sound-bus/AudioContext safety,
  frame receipt, existing deduplication and finite cue scheduling remain.

## Quality and rollback review

- O(8) retained trail lookup on an admitted sound receipt, O(1) speed
  arithmetic and a single transient sound-cue object for a measured drawn
  swing. No additional VFX geometry or audio buffer. Existing seven
  pools/102 reserved instances/seven draw calls, eight voices, one
  13,440-sample original noise texture and 32/32/64 queues/receipts remain
  unchanged in source, **not freshly measured on real GPU/audio hardware**.
- The attenuation is an *untested perceptual hypothesis*: it may sound too
  quiet on mobile or offer too little contrast. Real clips, waveform
  true-peak and the final integration reviewer can reject or retune it.
- Roll back this isolated D04 increment if authentic capture demonstrates
  poorer combat readability, stale velocity after frame receipt or
  unreasonably soft missed-swing feedback. Do not activate as default.

**Next dominant realism weakness:** the asset-bound proxy remains a measured
GLB wrist rather than the actual animated sword-tip path; real GLB assets,
three-angle moving-playback evidence and frame-aligned PCM are required for
any blade-contact realism claim.
