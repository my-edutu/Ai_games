# D04 — Warden release-before-recovery staging and anonymous-owner safety

**Status:** source-level improvement on isolated branch only. Genuine Dungeon WebGL/WebAudio evidence, native Node suite, build, CI, original PCM synchronization, full browser capture, and soak are **UNVERIFIED**. This is not realism acceptance.

- Branch: `feat/dungeon-d04-combat-feedback-realism-20261108`
- Starting verified branch head: `3c6f04cd28d265570a936dd945e1f3704e9fc8bf`
- Frozen BEFORE comparison: `281735d0910c6b2443648af976003d50412ee324` (unchanged).
- Test-first Warden ordering: `bc14d8aded3e1eea4bd3e5e93df53de47f5ddfb4`
- Submitted-frame scheduling fix: `8c4e9558ff9e3a68d3f21d8f10ba92b69f018f75`
- Test-first ambiguous ownership: `ea2ea15ec5ae3ffc06cbeb07eb03ce3fb7d42d26`
- Planner ownership fix: `150d0da4dfb56e6fa1999dae1fb0189086577cb8`

## Why this correction

The actual authority's Warden `opening` occurs **on the same cast tick** as its attack release. The opt-in D04 presenter previously staged recovery immediately but waited a fixed 230ms before creating release VFX/foley; its viewer-facing sensory order could therefore be *recovery → attack*, contradicting the authority's phase. This was **source-confirmed**, not filmed in the running game.

The second defect was exposed by executing an existing committed regression test: anonymous `opening` could pick a living Warden even with a second living Warden present. Anonymous `counter` similarly selected `previous.units.find(kind==='warden')`. These are defensive ambiguous-public-snapshot cases; do not claim actual gameplay spawned two Wardens.

## Minimal implementation

1. Only when `requirePresentedFrame===true`, stage `warden-release` at the same first genuine render opportunity as a witnessed `opening`; stable priority ordering places the release first. **Neither** sound is emitted before the renderer's actual submitted-frame acknowledgment. The telemetry keeps the 230ms *original intended* delay separate from the 0ms *scheduled D04* delay. Non-submission timing, ranged/spell delays and the legacy spectator remain unchanged.
2. Require exactly one *living enemy Warden* in the current public snapshot before associating an anonymous opening with a unique same-tick, adjacent, observed cast and active recovery window. Dead extra bodies do not cancel a genuinely unique owner.
3. Require exactly one prior living Warden and exactly one current Warden with the same ID before associating an anonymous counter event with a verified, adjacent, recovery-window HP loss. Preserve independently verified victim HP-damage feedback when counter identity is ambiguous.

No authoritative rules, actor rigs, camera, global lighting, model art, sound synthesis recipe, shader pools, actor-motion system or any other session's branch were modified. No fake damage, source/attacker identity or physical hit was added. D04 remains `?feedback=d04` opt-in, with the legacy `/dungeon` path default.

## Test-first evidence (not native CI)

- Written and committed **5** Warden release/recovery contracts before the staging fix. A detached execution of the **fetched prior production controller** reproduced a red causal-order defect: first frame yielded only `opening`, and its acknowledgment delivered `recovery` without `warden-release`.
- Written and committed **4** anonymous Warden-owner contracts before modifying the planner. Detached execution of the **fetched prior production planner** yielded **2 expected red failures**, for opening ownership and counter ownership.
- After both fixes, **19/19** actual committed test callbacks passed in a V8 execution shim using the fetched production planner, controller and submitted-frame gate. Files: `dungeon-d04-warden-release-recovery-submission-order` (5), `dungeon-d04-ambiguous-warden-owner` (4), `dungeon-d04-warden-opening-authority-witness` (5), `dungeon-d04-first-drawable-sword-foley` (5).
- This shim adapted Node `require` / dynamic import / `node:test` and substituted simulated VFX/foley adapters. It does **not** execute the native Node repository test runner, real Three.js/GLB renderer, browser microphone/sound bus, or any PCM capture. Green tests only certify source-level behavior and contracts.

Re-run on a checkout with models and a working browser:

```sh
npm ci
node --test tests/foundation/dungeon-d04-warden-release-recovery-submission-order.test.cjs tests/foundation/dungeon-d04-ambiguous-warden-owner.test.cjs tests/foundation/dungeon-d04-warden-opening-authority-witness.test.cjs tests/foundation/dungeon-d04-first-drawable-sword-foley.test.cjs tests/foundation/dungeon-physical-feedback-d04.test.cjs tests/foundation/dungeon-physical-feedback-preview-integration.test.cjs
npm run build
npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs
```

Then compare BEFORE and opt-in D04 for identical run/floor/tick/checksum, 3 actual camera viewpoints, 1440×900 and 390×844, recorded canvas+original opt-in sound bus with extracted PCM and frame submission trace. Capture Warden warning/release/recovery/counter, missed swing, block, true dodge, projectile, spell, genuine HP loss, multiple concurrent threats; inspect mute/reload, reduced-motion/flash, scene restart, lost WebGL, low-end stalls, and 20-minute retained effect/audio resource soak.

## Limits and further risk

The game repository's inspected tree contains no mounted Dungeon GLB, WebM, WAV or PCM evidence assets. The independent coding container could not resolve `github.com`; no native tests or browser playback were performed. The first-frame scheduling correction removes a proven **ordering inversion**; it does **not** prove the audible strike is phase-aligned to the Warden's actual animated contact, nor does an acknowledged WebGL submission prove encoded pixels or audio samples were delivered. The retained pools, instances, draw-call and eight-voice caps were not altered; actual GPU and audio resource counts remain unmeasured.

**Next dominant weakness:** compare original Warden release waveform onset to the real attack pose and recovery glyph in matching moving-game captures, then align sound to verified rendered animation evidence. Sword feedback still follows a measured wrist proxy instead of an authenticated blade tip. Neither can be accepted until actual GLB inspection and browser audiovisual trials.

**Rollback:** revert only D04 branch commits above if real-game evidence contradicts the source contracts. Never merge to main or Draft PR #49 without dedicated final integration review.
