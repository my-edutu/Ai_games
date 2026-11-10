# D04 — Original WebAudio output rebinding and volatile mute truth

**Status:** source-level defect corrected and adapted contract execution complete; genuine Dungeon browser audiovisual acceptance **UNVERIFIED**. This is an incremental fix, not complete physical combat realism.

- Repo: `my-edutu/Ai_games`
- Branch: `feat/dungeon-d04-combat-feedback-realism-20261108` only.
- Source head before this increment: `7ba46c763edb4cc89c1b25441ebe24414dbec67d`
- Frozen BEFORE comparison: `281735d0910c6b2443648af976003d50412ee324` (never modified).
- Legacy spectator stays the default. Only `?feedback=d04` uses this experiment.
- No edits to `games/ai-dungeon/src`, Draft PR #49, main, rigs, camera, global lighting or other sessions' branches.

## Why this defect was selected

The preceding context-state fixes rejected sounds staged while the browser suspended or interrupted its existing AudioContext. However, `attachAudioContext(replacement)` previously **observed the new AudioContext while retaining a synthesized sound engine already bound to the old AudioContext and old FX bus**. The engine could therefore be 'enabled' against an unrelated still-running context and send stale combat sound to an abandoned output. Rebinding the same context to a replaced FX bus was also ignored. Merely monitoring a new `state` is not proof that WebAudio nodes feed that device.

The source-backed before-fix reproduction confirmed a queued presentation receipt remained after the output swap and that an old sound source remained attached. Those are simulated-device results from actual fetched production code, **not** physical browser PCM.

A second related bug surfaced during regression review: without writable localStorage, `createCombatMutePreference(null).write(false)` returned false (unmuted) but `read()` still returned true (muted). This falsely characterized the spectator's explicit opt-in after an unavailable storage device.

## Implemented correction

1. The D04 controller tracks the context and output bus that **its own** original sound engine actually uses. Identical attachment is idempotent.
2. A different context or FX bus **revokes old staged sound** (`audioEpoch` and awaiting-frame queue), disposes the former original engine and voices, and instantiates a new engine on the requested device/bus. The change never silently turns on the new engine: a **fresh user gesture** is required. This also prevents pending sound authorized on a former output from playing after recovery.
3. An externally injected audio adapter has no implicit rebinding interface. A changed AudioContext is **rejected fail-closed**, pending audio is revoked and further enabling fails until the original known context is restored. This avoids claiming support for an unknown adapter's outputs.
4. The existing statechange listener remains one-per-current-context, detached on replacement/dispose.
5. Mute preference uses a page-local, initially-muted fallback when storage is unavailable/throws. Successful storage reads take precedence, and automatic output recovery is never saved as a manual mute. This does **not** auto-enable sound across reloads or after device replacement.

These are presentation-only operations. They do not certify blade-tip travel or damage, invent an attacker, change the authoritative simulation or add visual effects or voice pools.

## Test-first evidence and execution scope

New test contracts:

- `tests/foundation/dungeon-d04-audio-output-rebinding.test.cjs`: 6 scenarios — replaced device stops old voices and invalidates old receipts, fresh gesture required, idempotent identical attachment, changing only FX output bus, repeated listener cleanup, fail-closed injected adapter changes, and preserved manual mute.
- `tests/foundation/dungeon-d04-mute-preference-volatile-fallback.test.cjs`: 3 scenarios — no-storage opt-in/mute, throwing storage, externally persisted preference overrides.

**Observed red before production fixes:** stale output device/receipt behavior in detached production-source execution; `read()` reverted to muted after an unpersistable `write(false)`. Both red reproductions used fetched source and injected browser primitives.

**Observed green after production fixes:** **44/44 adapted production-source test bodies**, composed of 18 output/mute/context/suspension cases and 26 adjacent existing injury polyphony, independent swings, noise phase, noise seam, opt-in epoch and original foley-tail cases. Actual source modules were evaluated in a detached JavaScript V8 runner with simulated WebAudio and visual adapters. An initial auxiliary runner wrongly omitted exported constant values and appeared to fail four unrelated bounds checks; after injecting those source exports into the harness (no production changes), all 26 auxiliary cases passed. No 'rerun until green' on an unchanged native flaky test is claimed.

**NOT executed/NOT verified:** native `node --test`, `npm run build`, Playwright, running WebGL, actual browser AudioContext/PCM, sound output-device handoff in a real browser, original synchronized canvas+sound captures, three-viewpoint 1440x900 and 390x844 footage, Warden warning/release/recovery/earned counter, missed swing, block, dodge, projectile, spell, confirmed impact, dense overlapping threats and the 20-minute resource soak. Coding tunnel reported `Tunnel-client has not been seen for 300 seconds`. GitHub returned no commit statuses and no workflow runs for the source/test head. Repository tracked tree inspection found no Dungeon/D04 GLB, GLTF, WebM, MP4, WAV, OGG or MP3 files.

Focused native validation on an approved, functional D04 worktree:

```sh
node --test \
 tests/foundation/dungeon-d04-audio-output-rebinding.test.cjs \
 tests/foundation/dungeon-d04-mute-preference-volatile-fallback.test.cjs \
 tests/foundation/dungeon-d04-audio-context-state-lifecycle.test.cjs \
 tests/foundation/dungeon-d04-suspended-period-audio-proof.test.cjs \
 tests/foundation/dungeon-d04-optin-epoch-audio.test.cjs \
 tests/foundation/dungeon-d04-simultaneous-verified-impact-foley.test.cjs \
 tests/foundation/dungeon-d04-simultaneous-verified-swing-foley.test.cjs \
 tests/foundation/dungeon-d04-polyphonic-noise-phase.test.cjs \
 tests/foundation/dungeon-d04-noise-loop-continuity.test.cjs \
 tests/foundation/dungeon-d04-foley-noise-tail.test.cjs
npm run build
npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs
```

Then run the genuine `/dungeon` legacy versus `/dungeon?feedback=d04` capture through `npm run dungeon:stream` with authentic loaded rigs and explicit real audio gesture. Verify original sound bus PCM alongside submitted WebGL frames, the Warden sequence, desktop/mobile three-viewpoint comparisons and full cleanup under soak. A detached audition is **never** an audiovisual synchronization pass.

## Review and budgets

Specification review: users must explicitly authorize **each new audio engine** after device/output replacement; mute persistence is not falsely changed by auto recovery; old output cannot silently receive new D04 sounds; actual HP losses remain independent of swing sound.

Engineering review: output comparison is O(1), and listener, voice, queue and foley engine lifetimes are bounded. Existing limits remain **7 retained visual pools / 102 reserved instances / up to 7 draw calls, 8 audio voices, 1 generated 13,440-sample mono noise buffer, 32 pending, 32 awaiting-frame, 64 receipts**. Resource counts are **source-level**, not fresh browser GPU/audio telemetry. No new licensed/borrowed audio is added; original generated synthesis is preserved.

Rollback is isolated to the source and tests in this D04 branch. The previous behavior is recoverable by reverting only this increment; do not merge or switch the default until a separate final evidence-based integration review.

**Next dominant weakness:** the visible sword ribbon still tracks an authenticated skinned wrist rather than a measured GLB blade-tip path. Once moving original rig geometry and authentic browser recording are accessible, establish frame-aligned sword-tip movement and Warden release/impact acoustic onset. No Diablo-IV parity or production-readiness claim is warranted.
