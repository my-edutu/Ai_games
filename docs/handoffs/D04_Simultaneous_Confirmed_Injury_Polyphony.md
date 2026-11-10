# D04 — Bounded simultaneous HP-confirmed injury foley

**Status:** implementation committed; 12 detached source-backed simulated WebAudio checks passed; real Dungeon browser audiovisual acceptance **UNVERIFIED**.

- Isolated branch: `feat/dungeon-d04-combat-feedback-realism-20261108`
- Starting current head: `6008f9382c559c9a5c6b004be4cb459106c5ebe0`
- Frozen BEFORE: `281735d0910c6b2443648af976003d50412ee324` (the procedural D04 foley module did not yet exist at this revision)
- Preview only: `/dungeon?feedback=d04`; legacy `/dungeon` is still default

## First material audio weakness supported by inspected source

The existing `createOriginalCombatFoley.emit` maintained one last-played timestamp **per audio recipe**. Two independent, authority-confirmed HP losses on different victims in the same submitted frame both request `impact`; the first played and the second was silently rejected by the generic 85ms cooldown. The same issue affected independent fatal losses (`damage-fatal` / `fatal-impact`). The interface should convey multiple genuine events without inventing contact, naming an unknown attacker or producing an overwhelming sound storm.

The first fetched-production-source V8 reproduction before the fix gave: victim A = audible; victim B = **dropped**. An additional test-first reproduction found that a second real fatal victim was dropped as well. This was not an authentic browser recording.

## Implementation

- `public/ai-dungeon/original-combat-foley.js`: Only `proof:'observed-hp-drop'` with the authoritative `damage` / `impact` or `damage-fatal` / `fatal-impact` pairing, a **null** attacker and a nonempty, bounded target ID qualifies for a *victim-local* cooldown. The target identifies only the injured entity; no inferred perpetrator or hit trajectory.
- Two **distinct verified victims** may each produce one onset within an 85ms mix window. A third onset in that window is deliberately rejected; the same victim cannot multiply impact audio by changing fatal/nonfatal recipe.
- The successful-source memory has a strict **16-victim cap**, plus **two onset timestamps**; success updates memory only after a voice actually starts. Mute, reset, disposal and consent revocation reuse `flush` and clear this bookkeeping.
- All other action/anonymous/cosmetic cues retain the original audio-type cooldown. The existing **eight-voice cap**, priority eviction, shared one original 13,440-sample mono noise texture, material recipes, opt-in requirement and output bus remain unchanged. No borrowed sample, additional audio node per voice, additional listener, GPU pool, VFX draw call or authority change.

Tradeoff: A legitimate third simultaneous wound intentionally remains silent if two onsets are already present in the density window; the corresponding HP visualization stays authoritative and available. This is a mix-budget policy, not event denial. Confirm perceptual merit in a real encoded stream before integration.

## Test-first and verification evidence, November 10, 2026

1. `3acc7f2`: wrote the distinct-victim, repeat, onset-budget, ordinary-cue, mute/reset and long-session cap contracts **before** the production change.
2. Detached execution of original fetched production module: second independent victim was rejected (RED; old audio-type cooldown).
3. `fd45ebe`: implemented victim-local bounded two-onset policy.
4. `d1b7602`: corrected tests to use the real public fatal kind `damage-fatal`; new second-fatal test failed against the first implementation (RED).
5. `2e1fa56`: admitted verified fatal cue pairing into the same budget (GREEN in detached V8).
6. The existing `dungeon-d04-foley-noise-tail.test.cjs` asserted two *zero* loop seam endpoints, contradicting the existing seeded-noise source, which keeps the endpoints **equal but nonzero** to avoid periodic silence. Reproduced this mismatch at the **prior 6008f93** baseline: first = last = `0.3079814612865448`. `fb9db11` corrected the test to assert exact continuity instead of forcing silence. Production waveform generation was not changed.

**Verification:** Retrieved the **exact committed production module and three test files** through GitHub; evaluated the exact bodies in a detached V8 JavaScript environment with a simulated AudioContext. **12/12 adapted checks passed:** six new injury-polyphony contracts, three existing polyphonic phase/budget contracts and three existing long-tail/noise seam contracts. This is source-backed execution, **NOT native Node `node:test`**, WebAudio device playback, exported PCM or actual WebGL submission.

**Not executed / blocked:** The approved coding tunnel returned `Tunnel-client has not been seen for 300 seconds`; the separate container could not DNS-resolve `raw.githubusercontent.com`. Therefore native Node/build/Playwright, browser sound bus/codec, running Dungeon with GLBs, full Warden sequence, three real viewpoints at 1440×900 and 390×844, missed sword, block, dodge, arrows, spells, real HP impacts and 20-minute soak remain unverified. The current branch `public/ai-dungeon/models` contains only a `.gitignore`; no tracked GLB or authentic A/V clips were inspected. Any standalone V8 synthetic voices must **not** be represented as game footage.

## Acceptance and next physical weakness

When the approved worktree is available, run:

```sh
node --test tests/foundation/dungeon-d04-simultaneous-verified-impact-foley.test.cjs tests/foundation/dungeon-d04-polyphonic-noise-phase.test.cjs tests/foundation/dungeon-d04-foley-noise-tail.test.cjs
node --test tests/foundation/dungeon-physical-feedback-d04.test.cjs tests/foundation/dungeon-physical-feedback-realism-d04.test.cjs tests/foundation/dungeon-physical-feedback-preview-integration.test.cjs
npm run build
npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs
```

Match actual seed/run/floor/tick/checksum against frozen BEFORE in three directions on both screens. In the real Dungeon, record two genuinely distinct same-frame victim HP losses and a third-event saturation case; verify submitted-frame sounds and mix intelligibility against PCM, opt-in/mute, reduced settings and restart. Record Warden warning/release/recovery/earned counter plus real sword misses and hits, block, dodge, projectile and spell; perform the 20-minute voice/effect cleanup soak.

**Spec review:** HP proof and victim identity come from public authoritative differences; this foley correction cannot infer a striker, change HP or claim collision. **Quality review:** the voice and bookkeeping bounds protect livestream clarity; only real moving audio/video can judge whether the two-onset policy improves intelligibility.

**Still the dominant physical realism limitation:** the measured streak follows an actual animated wrist, not a verified sword tip; genuine GLB geometry inspection and timed WebGL + WebAudio capture remain necessary. Do not claim genre parity, integrated transformation or production readiness. Do not modify or merge main / PR #49 / other branches. Rollback is a revert of these D04-only commits after evidence-based review.
