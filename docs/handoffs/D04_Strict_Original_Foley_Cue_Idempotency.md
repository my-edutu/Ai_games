# D04 — Original foley cue idempotency: acceptance handoff

Status: **source-level correction committed; authentic gameplay A/V NOT VERIFIED**.

## Scope and defect

Isolated branch: `feat/dungeon-d04-combat-feedback-realism-20261108`. This increment changes ONLY D04 original foley, its foundation regression test, and this handoff. The legacy spectator default, `?feedback=d04` opt-in, authority `games/ai-dungeon/src`, main, Draft PR #49, rigs, camera, scene lighting and gameplay rules remain unchanged.

A strict, already HP-confirmed damage cue or genuine observed sword attempt could enter `createOriginalCombatFoley.emit()` again after its **75ms swing / 85ms injury cooldown** and create a second noise onset for the *same* authority event. A second genuine attack or a second HP-loss tick is valid; an audio retry of the identical cue is not. Even with controller-level `seen` and presented-frame receipts, the sound engine must reject a repeated immutable event ID so that routing/retry anomalies cannot manufacture repeated audio.

Before production change, source-backed detached V8 reproduction recorded **swing replay accepted=true and impact replay accepted=true**, despite passing identical production-shaped cue IDs after the cooldown. That was an audio-admission defect, not observed in a captured game recording.

## Implementation

- Retains up to `MAX_ORIGINAL_CONFIRMED_CUE_IDS=128` accepted verified authority cue IDs in insertion order (bounded Set). The guard is active only in `requireVerifiedContact:true` production mode; standalone procedural sound auditions remain permissive.
- Rejected repeated cue IDs do not create WebAudio nodes, spend onset budgets, evict voices or change authoritative state. An ID is recorded only **after successful audio source scheduling**; failed/suppressed cues retain their ordinary admission behavior.
- Strict sword/impact/fatal-impact cues require a bounded nonempty string ID. The independent actor/HP proof checks remain in force; no invented attacker is admitted.
- The event-ID memory clears with `flush`, `reset`, `disable`/manual mute, `dispose`, run/floor scene reset and new output engine creation. Explicit gesture opt-in remains necessary.
- No new synthesis resources, buffers, oscillators, GPU resources, draw calls, camera/rig modifications or external/licensed samples. Existing eight-voice and 13,440-sample original texture limits remain unchanged.
- The bounded 128-ID cache is a defense-in-depth admission guard, NOT infinite replay history. The controller additionally owns its independent scene-scoped cue dedupe and frame-submission receipts. Very old evicted IDs cannot be proved absent by this cache alone.

## Test-first and checks

1. The new contract file was created on the D04 branch **before** editing production.
2. Production-source V8 red reproduction at `t=.14` (identical swing) and `t=.48` (identical injury): both duplicate onsets returned true.
3. Updated fetched production `original-combat-foley.js` was executed with simulated WebAudio against the authored five regression test bodies: **5/5 green**. An additional missing-ID contract is included in the renamed final test.
4. Five existing foundation foley suites and the five initial new test bodies completed **28/28 green** in source-backed, detached JavaScript with simulated nodes, after correcting a missing exported constant in the *test adapter* (not product code).
5. **Native Node tests, npm build, Playwright, genuine WebGL/Three.js Dungeon browser, real PCM/WAV/WebM and GitHub CI have NOT been verified.** The coding tunnel reported `Tunnel-client has not been seen for 300 seconds`; a separate container could not resolve github.com.
6. The tracked repository tree at frozen BEFORE `281735d0910c6b2443648af976003d50412ee324` and at inspected D04 source head contains **no tracked GLB, audio, video or image assets**, so no authentic matched media could be collected in this session.

## Replay and operational impact

No gameplay random, version, snapshot, checksum, combat resolution or authoritative replay changes. Repeated delivered audio for one legitimate event is suppressed independently of actor-local time cooldown; two distinct actors or ticks remain polyphonic within the original two-onset/75ms and two-injury/85ms density windows. `stats().confirmedCueIds` and `maxConfirmedCueIds` expose bounded memory. Normal mute and source/device replacement retire all voices and cue history. No new listener or sample.

## Acceptance still open

Real 1440x900 desktop and 390x844 mobile matched three-camera A/V recordings; full Warden warning/release/recovery/counter; miss, block, dodge, arrow, spell, observed HP-confirmed hit; source-aligned recorded PCM, actual WebGL draw submissions, frame/voice telemetry, browser opt-in/mute/reload and 20-minute soak are UNVERIFIED. No Diablo-IV parity or completed realism transformation is claimed.

**Next dominant visual weakness:** wrist/body-local proxy remains insufficient to prove authentic GLB blade-tip trajectory. A real mounted animated weapon measurement and synchronized moving-gameplay recordings are needed before replacing the legacy default.

## Reproduction with coding tunnel and assets

```sh
npm ci
node --test tests/foundation/dungeon-d04-foley-cue-idempotency.test.cjs \
 tests/foundation/dungeon-d04-strict-original-foley-provenance.test.cjs \
 tests/foundation/dungeon-d04-simultaneous-verified-swing-foley.test.cjs \
 tests/foundation/dungeon-d04-simultaneous-verified-impact-foley.test.cjs \
 tests/foundation/dungeon-d04-noise-loop-continuity.test.cjs \
 tests/foundation/dungeon-d04-mute-preference-volatile-fallback.test.cjs
npm run build
npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs
```

Rollout: remain strictly `?feedback=d04` only. Rollback: revert this isolated branch commit (no main/PR #49 change).
