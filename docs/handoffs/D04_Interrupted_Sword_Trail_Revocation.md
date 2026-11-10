# D04 — Revoking interrupted measured sword trails

**Status:** isolated source-level implementation; authentic 3D/WebAudio acceptance **UNVERIFIED**.

**Branch:** `feat/dungeon-d04-combat-feedback-realism-20261108`. **Inspected parent:** `c7cb5096ba9b9748a1f33391e54ca523572be16a`. **Frozen BEFORE:** `281735d0910c6b2443648af976003d50412ee324`. This BEFORE predates the D04 visual module; its commit was inspected and the D04 module was absent, rather than being reconstructed as a fabricated baseline. **Acceptance specification:** `docs/handoffs/D04_Real_3D_Preview_Acceptance.md`.

## First actionable source-level realism defect

An already-drawn sword trail was hidden when its actor stopped attacking, but its retained slot survived for the remainder of the original 350 ms life. If a stale same-identity attack/tick appeared again within that window, subsequent wrist samples could make the historical ribbon visible again. The old cue could then qualify an unearned late whoosh at frame submission. This is **not** a verified finding from a real WebGL or recorded Dungeon clip.

A detached V8 reproduction executing the fetched pre-fix production visual body demonstrated:

- Initial matching animated attack: drawable trail, as expected.
- Actor observed alive with replacement `guard` action, later action tick: trail hidden but still live, one GPU slot held.
- Stale original attack/tick resumed before expiry: the same old trail became drawable again.
- A genuinely dead actor already retired correctly; this was not the missing case.

## Change and test-first contract

- `tests/foundation/dungeon-d04-interrupted-attacker-melee-trail.test.cjs` was committed **before** production changes. Four native `node:test` contracts cover interrupted guard, new attack tick, transient missing rig, and the controller's actual submitted-frame receipt path.
- `public/ai-dungeon/physical-feedback-visuals.js` now retires a sword slot after **affirmative identity-matched, visible, living actor evidence** that its public action or action tick no longer matches the cue. Matrix is hidden, pool slot becomes null, active count decreases, and `retiredInterruptedTrails` is exposed in renderer diagnostics.
- A missing/unmounted wrist, hidden root, absent actor or unknown HP cannot certify interruption. Such a trail remains hidden without false retirement and may resume only when its *same* legitimate pose returns.
- Actual HP death continues through the independent preexisting `retiredDeadTrails` path. Neither an interrupted swing nor a moving wrist asserts damage, contact, target or attacker.
- Existing `hasLiveCue` and `hasDrawableCue` return false for revoked cue IDs, so the unchanged original frame receipt gate produces `expired-visual` rather than releasing an obsolete swing sound.

## Verification actually completed

The fetched **pre-fix** renderer, run as a detached V8 function with simulated Three.js matrices and authored wrist bone, yielded an alive-but-hidden guard trail and a later drawable stale resurrection. The same four representative adapted production-source probes **after** the fix yielded:

| Scenario | Before | After |
|---|---|---|
| Living actor switches to guard | Hidden but slot live; stale resurrection | Slot retired; no resurrection |
| Living actor starts newer attack tick | Old slot remains live | Old slot retired |
| Only rig temporarily missing | Hidden, slot retained | Hidden, slot retained (correct) |
| HP reaches zero | Dead slot retired | Dead slot retired (preserved) |

These were **adapted production-source V8 probes**, **not** native repository tests, real GLB animation, Chrome/WebGL draw submission, or actual PCM sound measurement. The four committed native tests and full integration suite have **not been executed in this disconnected environment**. No CI green status is claimed.

The shared coding tunnel returned `Tunnel-client has not been seen for 300 seconds`. A separate container has Node installed but cannot resolve GitHub; the full checkout/model assets were unavailable. The inspected current GitHub tree contained **no tracked Dungeon GLB, WAV, WebM or MP4 clips**. Therefore no honest three-viewpoint comparison or real audio-to-frame alignment result can be recorded.

## Boundaries, budgets, operation and review

Production change is solely D04's isolated visual renderer; tests and this handoff remain D04-scoped. Main, Draft PR #49, authoritative `games/ai-dungeon/src`, rigs, camera, global lighting, other sessions' branches, and the normal spectator remain untouched. D04 remains explicitly opt-in with `?feedback=d04` and is **not** cleared to become default.

No new meshes, shader programs, geometry, GPU pools, draw calls, voices, samples, emitters, gameplay randomness, authority writes, timers or listeners. Existing seven pools and 102 reserved instances remain; interruption returns an existing slot earlier. Opt-in/mute persistence, reduced-motion/flash treatment, warning provenance, dedupe and receipt histories are unchanged. The change neither requires nor supplies an unlicensed audio asset.

**Specification review:** affirmative public action replacement invalidates the old sword trail without treating absent art as an authoritative interrupt. **Quality review:** the earlier hidden-slot/grace approach was vulnerable to stale resurrection; early retirement improves causal integrity and capacity under interrupt storms, but perceptual sound alignment is not proven.

**When the real coding/browser environment becomes available**, execute:

```sh
npm ci
node --test tests/foundation/dungeon-d04-interrupted-attacker-melee-trail.test.cjs tests/foundation/dungeon-d04-dead-attacker-melee-trail.test.cjs tests/foundation/dungeon-d04-strict-blade-submission.test.cjs
node --test tests/foundation/dungeon-physical-feedback-d04.test.cjs tests/foundation/dungeon-physical-feedback-realism-d04.test.cjs tests/foundation/dungeon-physical-feedback-preview-integration.test.cjs
npm run build
npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs
```

Then capture authentic same-seed/tick/checksum **BEFORE versus AFTER**, three camera positions at 1440x900 and 390x844, Warden warning/release/recovery/counter, misses/blocks/dodges, projectile/spell, real HP impact, opt-in/mute and frame/audio correlation; inspect a 20-minute density/reset soak. If assets/browser/audio playback are unavailable, keep those gates **UNVERIFIED**.

**Next dominant weakness:** wrist movement remains a hand proxy, not a sword-tip or genuine strike contact point; Warden release sound still needs real moving GLB/frame-aligned original PCM inspection. A separate open issue is the older broader Warden-warning adapted fixture failures (previously 13/17), which this focused change does not repair.
