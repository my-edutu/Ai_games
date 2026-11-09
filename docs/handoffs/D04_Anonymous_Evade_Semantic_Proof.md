# D04 — Anonymous evade events must not invent a hero dodge

**Branch:** `feat/dungeon-d04-combat-feedback-realism-20261108`  
**Inspected parent:** `a6c4bf9887077c859688a94c016ff58c067c8f59`  
**Pinned comparison BEFORE:** `281735d0910c6b2443648af976003d50412ee324`  
**Acceptance:** **IN PROGRESS — genuine Dungeon WebGL/WebAudio evidence UNVERIFIED**

## Dominant causal defect

A public `evade` event contains no actor or attacker ID. Dungeon authority also
uses this kind when attacks miss *empty stone*. The previous D04 planner
assigned that anonymous event to the sole party hero who happened to move one
cell on the same tick, even if the event described an unrelated empty-stone
miss. That yielded invented dodge dust and a footstep sound, despite correct
adjacent snapshots and no confirmed dodge.

## Implemented change

The D04-only `physical-feedback-plan.js` now reuses the already-existing
read-only `planAuthorityEvasions(previous,next)` presentation witness from
`evasion-performance-plan.js`. A body-anchored dodge is admitted only when
the frozen animation witness identifies exactly one escape through the
contemporaneous **semantic escape event**, a legal one-cell movement,
valid map, living hero, exploring phase and matching run/floor. That text
confirms only the *type of escape*, **never an attacker**, impact or victim.

Unmatched or ambiguous public `evade` events now produce **no** D04 dodge
sound/dust, rather than binding them to the nearest/coincidental mover.
Confirmed escape beats still retain their one grounded dust effect and
single original opt-in `evade` foley cue. No new authority or scene rules.
The borrowed witness is a pure presentation function already used by the
spectator's genuine evasion animation; D04 does not modify it.

## Red / green evidence

- Inspected `AGENTS.md`, D04 acceptance, current D04 planner/controller,
  retained visuals, original foley, the existing evasion performance witness,
  actor integration and specialist audio, VFX, QA and performance skills.
- Before implementation, a detached execution of the **fetched original**
  planner emitted an `evade` cue for a sole hero moving one cell while an
  anonymous event stated `Cultist blast missed empty stone`. This is the
  focused **failing behavior**.
- Added `tests/foundation/dungeon-d04-semantic-evade-evidence.test.cjs`
  first (commit `ba2c936`); implemented the D04 planner fix (commit
  `9e1e07e`).
- All **7/7 actual committed test functions** passed using the fetched
  production modules in an adapted in-memory V8 source runner. Nine further
  detached scenarios passed, including unrelated empty-stone miss, legal
  shadow-hex / Revenant / Warden escapes, two same-kind movers, invalid map,
  invalid phase, skipped tick and duplicate event.
- **NOT VERIFIED:** native Node runner, `npm run build`, CI, genuine
  Three.js gameplay, WebAudio PCM, browser recording or device benchmarks.
  The shared coding tunnel reported disconnected and container DNS could
  not resolve GitHub. An adapted V8 harness is not a substitute for the
  native suite or production browser.

## Acceptance work still open

```sh
node --test tests/foundation/dungeon-d04-semantic-evade-evidence.test.cjs \
  tests/foundation/dungeon-physical-feedback-d04.test.cjs \
  tests/foundation/dungeon-physical-feedback-preview-integration.test.cjs
npm run build
npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs
```

Record matched authentic seed/run/floor/tick/checksum clips from three
viewpoints, 1440x900 desktop and 390x844 mobile. Include the authentic
miss, valid dodge, block, projectile, spell, HP-confirmed impact, Warden
warning/release/recovery/earned counter, mute/reload, reduced-motion/flash,
background/recovery and 20-minute density/cleanup. Verify original PCM and
frame submission on a shared clock, not isolated generated-noise waveforms.
No such real-game media was captured in this session.

**Budgets:** no new renderer pool/instance, audio node/voice, effect queue,
timer or authority mutation. Existing seven retained VFX pools (102 slots),
eight foley voices, 32 pending/32 awaiting/64 receipt limits remain unchanged
in D04 source. No genuine GPU or audio resource measurement this session.

**Rollout/rollback:** legacy spectator stays the default. Experiment requires
`?feedback=d04`; no main or PR #49 merge. Revert only the two D04
implementation/testing commits if a genuine semantic escape becomes missing
on actual authority traces.

**Spec review:** no anonymous miss can certify a dodger or attacker; only
genuine public semantics and the frozen animator's witness can authorize
an evasive footstep. **Quality review:** deliberate suppression when map,
event meaning or identity evidence is missing may reduce effects rather than
risk fictional action. Native replay and A/V evidence are required before
considering integration.

**Next dominant limitation:** the sword trail remains a wrist-motion proxy
without verified blade-tip GLB geometry or synchronized moving-game evidence.
