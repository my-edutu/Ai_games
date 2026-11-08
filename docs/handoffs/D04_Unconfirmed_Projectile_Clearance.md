# D04 — unconfirmed projectile clearance and physical release

**Status:** committed source-level D04-only correction; actual moving-game playback **UNVERIFIED**.

**Frozen BEFORE:** `281735d0910c6b2443648af976003d50412ee324`. **Examined parent:** `6e474b6cc437c5b6975953b14646dbdfd1b0b422`. This is NOT an assertion of achieved 3D realism.

## Dominant source-observed defect

The original D04 opt-in arrows and spells used `t*t*(3-2*t)` to ease a visual projectile all the way to a resolved `targetId`'s body-height world cell. Resolved aim proves **intent/line of fire**, not HP loss, obstruction-free arrival or collision. The slowed, guided approach and center-body termination could therefore appear to imply a hit when gameplay recorded a miss or block. No tracked GLB assets or authentic audiovisual clips were available to inspect; this finding is code-based, not a blind visual critique.

## Narrow solution

- New pure `unconfirmed-projectile-flight.js` draws a read-only linear flight to a point **0.58m short** of the target center in the horizontal plane. This leaves margin for the 0.43m-long instanced arrow model. Near-overlapping hand/target endpoints below 1.0m fail closed instead of penetrating a silhouette.
- The existing launch/spell visual pool checks the flight before allocation, then uses the same deterministic pose for every frame; distance-dependent bounded lifetime makes a short arrow traverse more quickly, ending in an air fade, not a fake collision spark.
- Verified **actual HP loss** still alone authorizes damage chips and impact foley in the existing planner. True arrow collision effects are not added or inferred; a miss may emit a release sound but never hit feedback.
- No authority state, character rigs, camera, global lighting, soundstage, audio source, replay RNG, WebAudio opt-in, mute, reduced settings, bounded queues or total 7 visual pools / 102 reserved instances change. Existing frame acknowledgement and scene-reset hooks remain in effect. The default /dungeon is unchanged; use `?feedback=d04` for preview.

## Verification and pending acceptance

Four pure Node 22 behavioral contracts were observed failing against the old center-arrival implementation, then **4/4 passed locally** after implementing the bounded flight helper. A fifth source-integration assertion is committed for the full repository runner, **not claimed to have run** while the shared coding/browser tunnel is disconnected. No npm build, browser canvas, real opt-in PCM track, mobile render, CI or 20-minute soak was available. One unchanged original WebAudio audition from an earlier session does not verify live synchronization here.

Run on isolated branch:
```sh
node --test tests/foundation/dungeon-unconfirmed-projectile-flight-d04.test.cjs tests/foundation/dungeon-physical-feedback-realism-d04.test.cjs tests/foundation/dungeon-physical-feedback-preview-integration.test.cjs
npm run build
npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs
```

Then gather original matched BEFORE/AFTER WebM and PCM for 3 viewpoints, desktop 1440x900 / mobile 390x844, Warden warning/release/recovery/counter and misses, block/dodge/projectiles/spells/true injury; read frame receipts and retained resource telemetry. Reject if arrows still enter the body without observed contact, if projectile releases look sluggish or if reduced-motion cues become unreadable.

**Risk / next dominant weakness:** this deliberately non-contact ballistic envelope is a conservative visual approximation, not a validated world-geometry collision or calibrated flight speed. The exact moving hand-to-weapon-tip path and genuine real-scene arrow passage remain unverified until the optional models and browser renderer are available.

**Rollback:** revert the new D04 commit only; keep all authoritative/other-session work untouched.
