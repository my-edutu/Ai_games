# D04 — Ambiguous block-contact attribution gate

**Status: source-level correction for review; native tests and authentic A/V unverified.**

Branch: `feat/dungeon-d04-combat-feedback-realism-20261108`. Previous verified head: `1ea928274ddde73b54ffcb3f0f250d020e522838`.
Frozen BEFORE: `281735d0910c6b2443648af976003d50412ee324`.

## Source-identified defect

A public `block` event contains no attacker/defender IDs. D04 formerly placed a shield-contact ring on a single guarding party actor who lost HP at that event tick. That did not account for two different hostile `attack/cast` attempts on the same tick or another simultaneous HP-loss victim. In those cases, a unique guarded victim is **not** unique contact evidence; a shield ring could visually assign an unrelated hit to the wrong body.

## Correction

D04 retains the earlier anchored block only for the already corroborated unique guard/HP-drop scenario **when no concurrent ambiguity is visible**. It now withholds the *body anchor* if more than one live/recently living non-party actor has a same-tick attack/cast action, or another unit also loses HP between the same snapshots. A witnessed block event still produces the same neutral `block` audio cue with `proof:'authority-event'`; genuine HP drops still produce independently authorized victim-only injuries. No attacker is invented, no extra collision is inferred, and no authoritative rules are touched.

The scan is bounded to the existing 96-unit public snapshot sample, only evaluated for a possible anchored block; no GPU, WebAudio, draw-call, voice, retained-pool or timer changes. The alternative is deliberately conservative: some true blocks become sound-only until the public event contract contains explicit contact IDs. It cannot prove that a remaining unique observed guard was the actual blocker.

## Contract and evidence

New Node tests cover a single unambiguous guard, two same-tick hostile attempts against one wounded guard, and independent simultaneous HP loss to a second victim. Contracts are authored from source inspection and should fail on the preceding planner in the two ambiguous cases. **No native red/green execution, full build, Playwright, CI, real Dungeon GLB/Three.js playback or actual PCM capture was available in this GitHub-only session.**

When the coding/browser tunnel and assets are available:

```sh
node --test tests/foundation/dungeon-d04-block-multi-threat-attribution.test.cjs tests/foundation/dungeon-physical-feedback-d04.test.cjs tests/foundation/dungeon-physical-feedback-realism-d04.test.cjs
npm run build
npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs
```

Then inspect three camera angles, both 1440×900 and 390×844, missed sword, HP-proven hit, block/dodge, projectile/spell, Warden warning/release/recovery/counter, simultaneous threats, original opt-in sound bus and 20-minute cleanup soak; compare identical genuine seeds/ticks with the frozen BEFORE capture. The current tracked tree has **no Dungeon GLB/WebM/WAV captures**. Do not mistake this source-level correction for visual realism acceptance.

## Reviews

Spec: the block sound remains a truthful public event; speculative body coordinates are suppressed; HP injury still requires real HP decrease. Quality: conservative suppression is preferable to a misleading contact mark, but the no-ID public event remains insufficient to prove true physical source/contact. Rollback: revert this isolated change if native fixtures or authentic clips contradict the new ambiguity policy. No default spectator change; preview remains `?feedback=d04`.
