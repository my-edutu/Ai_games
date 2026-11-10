# D04 — Undrawn Body-Local Foley Requires a Living Pose

**Status:** independently reviewable source-level fix; genuine Dungeon WebGL/WebAudio playback and full preview acceptance **NOT VERIFIED**. Not production-ready. Legacy spectator remains the default; D04 is opt-in only with `?feedback=d04`.

- Owner: D04 effects and original audio only.
- Previous branch head: `2ede6ac239dbf23a746ac95135bf5de20f969af2`; pinned BEFORE reference: `281735d0910c6b2443648af976003d50412ee324`.
- Scope: `public/ai-dungeon/physical-feedback-visuals.js`, `public/ai-dungeon/physical-combat-feedback.js`, two D04-scoped regression tests, and this handoff.
- Never touched main, Draft PR #49, `games/ai-dungeon/src`, rigs, animations, camera, global lighting, or other branches.

## Dominant source-confirmed defect

The existing controller already blocks undrawn ranger/spell launch sounds without a current firing/casting source, and expires retained body-local rings after a Warden, guard or utility performer changes pose or disappears. However, **undrawn** Warden release, recovery, guard and utility sounds were still accepted as generic sound-only receipts. A former Warden or unloaded actor could therefore remain audible despite its physical signal failing visual admission.

This mismatch was reproduced against fetched **production planner/controller/frame-gate source** with an adapted V8 harness before the code change: forced visual rejection and a negative live-body witness still yielded delivered sounds for Warden release + recovery, guard and utility. The result is **source-confirmed**, not footage-confirmed. Real HP loss remained independently audible, correctly without an inferred attacker.

## Implemented change

1. The retained renderer exposes `hasAuthenticatedBodyPose(cue)` for only four truthful, body-bound cue kinds: `warden-release`, `opening`, `guard`, `cast-utility`. It requires the exact existing planner proof and reuses the existing `anchor(cue,'signal')` path, including observed actor identity, cell/root, actual action tick, live model, authored skinned Warden bone and recovery/ward validity where applicable. It does not create any meshes, audio or synthetic weapon contact.
2. Under `requirePresentedFrame=true`, the controller now refuses the **undrawn** body-local sound if that read-only witness is missing or negative. The receipt is `unverified-body-pose` and the already-bounded `staleAudioDropped` telemetry increments. Genuine performed gestures remain sound-capable when a present, verified source loses its optional visual ring to a full pool or renderer clearance.
3. Drawn cue audio still uses the existing live/drawable visual and real frame-receipt checks; confirmed victim HP-loss and anonymous semantic event audio remain independent. There is no change to authoritative targeting, action timing, attacker attribution, explicit user gesture, mute persistence or reduced-intensity behavior.

Only the gated experimental preview has the new condition. The default legacy path, and intentionally non-gated injected integrations, retain their prior semantics.

## Test-first proof and proportional checks

- **RED, pre-fix:** 4 source-backed scenarios with an undrawn body cue and negative source witness still produced `delivered` sound: Warden release/recovery, guard, utility. This was an adapted JS/V8 execution of production modules, not Node or browser playback.
- **GREEN, post-fix:** 16/16 adapted production planner/controller/frame-gate scenarios passed: missing/true/missing-adapter/drawn witness for Warden, guard, utility and independent HP damage.
- **Renderer probe:** 12/12 adapted fetched-renderer checks with simulated Three.js actors passed: live performers; stale guard/cast, unloaded Warden, resealed/expired recovery, wrong proof/kind. A witness-only probe allocated **zero active effects**, with seven existing pools and **102 reserved instances**. These actor/rig stubs cannot validate authentic GLB anatomy.
- Both changed production files and both affected test files parsed successfully as JavaScript in a detached V8 syntax check.
- New native regression file: `tests/foundation/dungeon-d04-undrawn-body-foley.test.cjs` (six named tests). Existing `tests/foundation/dungeon-physical-feedback-realism-d04.test.cjs` gains a direct-renderer witness contract.
- The coding tunnel returned `Tunnel-client has not been seen for 300 seconds`. A separate container could not resolve `github.com`. Consequently **npm ci/build, native Node test execution, Playwright, genuine browser audiovisual capture, CI and 20-minute soak were not performed**.
- An earlier broad Warden-warning adapted check at **13/17** remains unresolved; no passing claim is made for that suite.
- No new draw calls, retained GPU pools, effect instances, audio voices, noise buffers, textures, timers, listeners, sounds, unlicensed assets or capture claims were introduced. These are source-level change-budget observations, **not** a measured runtime/GPU pass.

## Independent reproduction and acceptance still required

From the isolated branch with the genuine licensed/mounted Dungeon GLBs:

```sh
npm ci
npm run build
node --test tests/foundation/dungeon-d04-undrawn-body-foley.test.cjs tests/foundation/dungeon-d04-unverified-release-audio.test.cjs tests/foundation/dungeon-physical-feedback-realism-d04.test.cjs tests/foundation/dungeon-physical-feedback-d04.test.cjs tests/foundation/dungeon-physical-feedback-preview-integration.test.cjs
npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs
npm run dungeon:stream
```

Capture same authoritative seed/run/floor/tick/checksum against frozen BEFORE and opt-in D04 from three genuine camera viewpoints, at 1440×900 and 390×844: missed swing and confirmed HP impact, block, guarded action without a body, dodge, ranger/cultist release, interrupt, Warden warning/release/recovery/earned counter, defeat/restart. Record actual canvas + original opted-in sound bus (WebM + PCM/WAV), compare audible sample onset with actual render submissions, validate source-hand/blade-tip position rather than a wrist proxy, and run mute/reload, WebGL loss, reduced motion/flash, frame stalls and 20-minute cleanup/voice/instance soak. **None are accepted as passed here.**

## Review and rollback

- **Specification:** the public observed action does not establish an arbitrary late source; undrawn body-local sounds now require a present body. Neutral HP-loss feedback remains independent and attacker-free. No new gameplay outcome or guessed collision.
- **Engineering:** one bounded source-pose query runs only on undrawn Warden/guard/utility action admission; no additional per-frame work. Missing visual adapters fail closed only for those optional body-local sounds. Existing visual-admitted sounds retain current receipt gates.
- **Remaining risk:** conservative fail-closed behavior can remove legitimate foley if the skinned actor is unloaded or its pose has changed before admission. A real A/V review must decide whether event-neutral audio is preferable in those cases, without fabricating ownership.
- **Rollback:** revert this D04-only increment from the isolated branch; do not merge or alter default spectator.
- **Next dominant weakness:** real animation-calibrated blade-tip and Warden strike-contact timing, beyond existing wrist/spine approximations. Authentic GLB moving playback and synchronized PCM are required before claiming physical realism.

**Final gate: IN PROGRESS, NOT TRANSFORMED.**
