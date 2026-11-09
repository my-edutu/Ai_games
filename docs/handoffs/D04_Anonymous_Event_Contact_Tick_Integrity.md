# D04 — Anonymous combat-event tick integrity

**Status: isolated source-level candidate; authentic A/V and native repository tests unverified.**

- Branch: `feat/dungeon-d04-combat-feedback-realism-20261108`
- Parent inspected: `1f4bf19627a657269f965f70865b3a618c8f18c0`
- Frozen BEFORE reference: `281735d0910c6b2443648af976003d50412ee324`
- Ownership: only D04 presentation cue planning, focused contracts, this handoff; no authoritative gameplay, rigs, camera, lighting or D10 changes.

## Dominant defect

A public `block`, `evade` or `counter` event supplies a tick but no contact owner. The D04 planner previously combined such an event from **one of several skipped ticks** with the next available observed HP delta or final actor displacement, claiming a precisely positioned shield block, footstep or earned Warden counter. An HP decrease somewhere between tick 10 and tick 13 does not establish its relation to a block event on tick 11; likewise a later Warden injury cannot be proved to originate from a stale counter event. The combination was visually misleading even though each input fact was individually real.

## Correction

Only *consecutive snapshots* with `previous.tick+1===next.tick===event.tick` can corroborate these anonymous event-to-body contact anchors. A missed-poll public `block` remains a real neutral block sound, but no guessed shield position. A missed-poll `evade` remains a real neutral dodge sound, but no false final-position dust. A multi-tick `counter` cannot be declared earned from an aggregate Warden HP drop; it is suppressed until correctly adjacent evidence exists. Separately observed victim HP-loss cues remain valid, with no attacker invented. True adjacent-tick cases retain the prior behavior.

The strict gate deliberately trades some physical effects for stronger causality when frame delivery skips ticks; presentation never rewrites the simulation. All scans remain bounded to the original 96-unit observation set. No new effects, GPU resources, textures, WebAudio assets, voices, timers or frame gates are introduced; D04 remains `?feedback=d04` only. Gesture opt-in, persisted mute, reduced motion/flash, effect deduplication and scene cleanup remain unchanged.

## Evidence and tests

A detached V8 evaluation of the **unmodified committed planner** reproduced four failures: skipped-tick block, skipped-tick evade, skipped-tick Warden counter, and a two-tick observation with the block event on the latest tick. The same evaluation against the patched pure planner passed all seven checks, including adjacent-tick preserved block, dodge and Warden counter. This is a source-level policy test, **not** native Node suite, real Three.js gameplay or audible PCM evidence.

Focused native contract authored: `tests/foundation/dungeon-d04-anonymous-event-time-alignment.test.cjs`.

Native verification required once a coding tunnel works:

```sh
node --test tests/foundation/dungeon-d04-anonymous-event-time-alignment.test.cjs tests/foundation/dungeon-d04-block-multi-threat-attribution.test.cjs tests/foundation/dungeon-physical-feedback-d04.test.cjs
npm run build
npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs
```

Still outstanding: same-seed frozen BEFORE/AFTER original WebGL and opt-in WebAudio captures in three camera directions, desktop 1440×900 and mobile 390×844; genuine missed swing, guarded contact, dodge, arrow, spell, HP injury, interrupt, full Warden warning/release/recovery/counter/defeat/restart, sample/frame sync, and 20-minute resource soak. No GLB clips or browser A/V trial were available through this GitHub-only execution. A passing detached cue policy does not establish Diablo-IV visual parity or integrated readiness.

## Two-pass review and rollback

Specification: sound-only unknown body contacts and victim-only HP damage maintain the authoritative truth boundary. Quality: conservative suppression under dropped polls can reduce apparent hit richness; prefer that to falsifying precise contact. Confirm with real capture. Rollback: revert this one cohesive D04 commit if authentic time-aligned gameplay contradicts the policy. No default route promotion; D10 retains final acceptance ownership.
