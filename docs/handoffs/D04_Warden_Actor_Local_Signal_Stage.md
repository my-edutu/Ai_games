# D04 — Warden release / recovery / counter signal height integrity

**Scope:** isolated branch `feat/dungeon-d04-combat-feedback-realism-20261108`, parent `8d68c7e03eca009648148cb7f70a71696cd301f9`; frozen BEFORE `281735d0910c6b2443648af976003d50412ee324`. **Status: source-level correction only; genuine Dungeon audiovisual realism UNVERIFIED.**

## Dominant source-level defect

The existing retained `signal` pool used the same horizontal floor-ring pose for **every** cue. In `physical-feedback-visuals.js`, the `transform()` signal branch unconditionally overwrote sampled actor height with `y=.075` and rotated all rings flat. Consequently, a verified Warden cast release, recovery opening, or earned HP-confirmed counter looked like another hazard tile beneath the boss rather than a body-associated moment. The warning floor cells were valid; the non-warning signal transforms were wrong. This is independently reproducible from the committed transform code; prevalence and perceptual severity in actual WebGL footage remain unverified.

## Test-first implementation

- The unchanged **seven** instanced pools and existing `RingGeometry` now have two spatial treatments: confirmed Warden warning markers remain **horizontal, at y=.075 on only authoritative warning cells**; other signal beats use the already sampled actor-space `origin.y` and `origin.yaw`, with a restrained upright pulse.
- Release, opening and earned counter have distinct bounded pulse envelopes in the **same** retained signal pool. No new mesh, texture, audio voice, material, timer, emitter or renderer draw call.
- The old no-actor neutral cell fallback stays at its established low anchor rather than pretending an authentic rig exists. No attacker, blade contact, HP change, new hazard cell or tactical result is inferred.
- The retained budget remains **102 reserved VFX instances**, max **7** effect draw calls, eight generated foley voices and one original noise buffer. Audio gesture opt-in, persisted mute, reduced settings, deduplication, frame receipt, reset/disposal and legacy spectator routing were not edited.

**Detached source-compiled V8 test-first reproduction:** five core conditions failed before the patch (actor-height release, upright plane, facing, body-height recovery, body-height counter), while the authoritative floor-cell warning and retained budget already passed. The exact patched visual source passed all seven checks in the same mocked matrix fixture. This is **not a native Node test, browser rendering, moving footage or sample-synced sound capture**.

New focused native tests: `tests/foundation/dungeon-d04-signal-stage-physical-anchoring.test.cjs`. They inspect matrix-level geometry with a fake Three.js; they are authored, **not executed in the unavailable repository checkout**. No actual Dungeon GLBs or authentic WebM/WAV clips were accessible to inspect; the local git tunnel could not resolve GitHub. The frozen BEFORE commit was retained only as the comparison anchor, not modified.

## Reproduction / verification pending

```sh
node --test tests/foundation/dungeon-d04-signal-stage-physical-anchoring.test.cjs tests/foundation/dungeon-physical-feedback-realism-d04.test.cjs tests/foundation/dungeon-physical-feedback-d04.test.cjs
npm run build
npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs
```

On an actual checkout with authentic actors and captures, compare the same seed/run/floor/tick/checksum under `/dungeon` and `/dungeon?feedback=d04` at 1440×900, 390×844 and three viewpoints. Capture actual missed swing, true HP-confirmed hit, anonymous block, real dodge, aimed projectile, spell, and Warden warning → cast release → recovery → earned counter → defeat/restart with original capture-bus PCM. Verify actor-local release doesn't intersect armor or disappear edge-on; ensure warning remains flat at real danger cells, cue audio follows real frame submission, and 20-minute pool/voice/scene recovery remains bounded. Reject and revert if body rings distract or misrepresent attack geometry. No Diablo-IV parity or production-readiness claim.

**Separate reviews:** Specification: branch-only D04 render transform, warning cells authoritative, no combat logic or source attribution. Quality: fixes the concrete height/plane discard without extra GPU resources; real visual angle, scale, sound alignment and performance still require genuine browser playback. **Next dominant limitation:** wrist-derived sword streak lacks verified blade-tip geometry/GLBs; authentic moving audiovisual comparison remains the acceptance blocker. Rollback is a single revert of this change on the isolated branch; no default rollout before D10 acceptance.
