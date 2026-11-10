# D04 — Delayed arrow and spell source-pose integrity

Status: **SOURCE-LEVEL CORRECTION / BROWSER EVIDENCE UNVERIFIED / NOT ACCEPTED**.

Branch: `feat/dungeon-d04-combat-feedback-realism-20261108`, independent of main and Draft PR #49. Frozen BEFORE `281735d0910c6b2443648af976003d50412ee324` contains no D04 preview modules; compare against this frozen baseline only with actual matched captures, not inferred quality scores.

## Dominant source-confirmed defect

A genuine ranger or caster action may be queued for 210ms or 290ms before visual admission. Previously, `physical-feedback-visuals.js` authenticated the *source cell* and optional character root, but did **not** require the observed actor to retain the same firing/casting action and `actionTick` at admission. An idle or differently acting body could then appear to emit a fresh arrow or spell. Worse, if `actorById` returned no actor, the stage could use a remembered cell-height world point and create a missile from empty space. The target remained only an aim, but the launch itself was not physically witnessed.

This is a **static source diagnosis**, not a claim that an authentic recording showed the ghost. The isolated coding tunnel returned `Tunnel-client has not been seen for 300 seconds`, and the separate container could not resolve github.com.

## Test-first contract (authored, not executed)

`tests/foundation/dungeon-physical-feedback-realism-d04.test.cjs` now tests a valid ranger attack and valid mystic cast; rejects an idle ranger, changed action tick, wrong actor class, idle/changed-tick/dead caster and missing firing actor; confirms an already-fired arrow keeps flying when its caster subsequently goes idle; checks pool cleanup. The existing mixed-art fixture was brought into agreement with real `kind`/`action` values. Tests were committed **before** the source correction, but neither a native red phase nor a native green phase could be executed while the tunnel was offline.

## Production correction

`public/ai-dungeon/physical-feedback-visuals.js` now requires a currently resolved, identity-matched actor with the same `actionTick`: only a `ranger` in `attack` may visually launch an arrow; only a `mystic` or `cultist` in `cast` may visually release a spell. A known dead source fails closed. `sampleActor` still verifies root visibility and near-cell positioning, and any accepted projectile remains independent during flight. A missing source body no longer falls back to an invented cell-level projectile emitter. No change to authoritative damage, target selection or simulation time.

**Intentional scope limit:** Non-authored actors can still use the existing root-height approximation instead of an authenticated bowstring or palm attachment. This step verifies a current action/body, not an exact muzzle or GLB weapon socket. Neutral event sound may still be delivered after a genuine submitted-frame receipt if physical art is unavailable; this sound does not signify target contact. Warden warning/release/recovery/counter logic and HP-based impact causality are untouched.

## Resource and operational impact

No additional mesh, geometry, material, pool, draw call, audio voice, noise buffer, per-frame raycast, or action mutation. The existing 7 retained pools and 102 reserved instances, at most 7 new draw calls, max 8 voices, queues and receipt caps are unchanged. Disallowed visual admissions reduce the number of drawable instances rather than grow budget. WebAudio fresh-gesture opt-in, mute, reduced flash/motion, event dedupe, frame-acknowledged sound and cleanup paths are untouched. Legacy `/dungeon` stays default; opt in via `?feedback=d04` only.

## Reproduction and evidence still required

```sh
npm ci
npm run build
node --test tests/foundation/dungeon-physical-feedback-realism-d04.test.cjs tests/foundation/dungeon-physical-feedback-d04.test.cjs tests/foundation/dungeon-d04-delayed-action-audio-deadline.test.cjs tests/foundation/dungeon-physical-feedback-preview-integration.test.cjs
npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs
```

Run the actual Dungeon with GLBs and opt-in audio at 1440x900 and 390x844. Capture three matched camera viewpoints at the same authority seed/run/floor/tick/checksum, including a fresh arrow, spell, miss, block, dodge, real HP loss and the full Warden warning/release/recovery/counter sequence. Record canvas + original WebAudio bus to WebM, extract PCM where supported, and check first actual rendered projectile position and sound onset. Include deliberately delayed 250–350ms render submissions and missing/stale firing actor. Complete the 20-minute pool/voice/mute/restart/WebGL-recovery soak.

**None of those genuine audiovisual, native build, test-run or browser outcomes were verified in this session.** The current tracked tree contains no `.glb`, `.webm`, `.mp4`, or `.wav` files. Do not label this as 3D realism parity or production readiness.

## Review notes

Specification review: visual launch eligibility is tied to currently observed actor pose, never inferred impact. Quality review: suppression is deliberately conservative; if the game's view actor overwrites `actionTick` earlier than queued release (210/290ms), legitimate projectiles may disappear. Verify authentic action duration and release PCM before loosening the gate. Rollback is confined to this D04 visual check and its focused tests, with no need to touch main or the authoritative simulation.

**Next dominant weakness:** physical weapon/audio synchronization remains measured at action/wrist proxy rather than authenticated weapon-tip or projectile muzzle contact in genuine GLB-backed playback.
