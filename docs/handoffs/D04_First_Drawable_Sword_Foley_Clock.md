# D04 — First drawable sword passage owns the original whoosh clock

**Scope:** opt-in D04 only, branch `feat/dungeon-d04-combat-feedback-realism-20261108`. Last known prior head `cf7efeee7622213bc8b98197756f93d08a83cb1c`. Frozen BEFORE milestone `281735d0910c6b2443648af976003d50412ee324`. **Real-game audiovisual acceptance: UNVERIFIED.**

## Dominant source-observable defect

D04's planner correctly separated an observed sword attempt from actual HP loss. However, the director also imposed a fixed **120ms queue delay** before it *created* the physical swing's retained trail. The trail itself refuses to draw until it samples genuine animated wrist displacement across two fresh frames. A sword whose hand already moved in the first 120ms could therefore be missed; a later, unrelated wrist motion might become the visible passage and its opt-in whoosh. This timing mismatch can be established from the planner delay, controller queue, measured-trail two-sample contract, and frame-gated audio logic. **The actual incidence and perceptual improvement in Dungeon WebGL footage remain unknown.**

## Narrow production correction

- In the submitted-frame **D04 preview only**, a genuine adjacent-tick `swing` is staged with **zero synthetic pre-delay**, so the retained trail can begin measuring the real skinned hand at the earliest available actual animation frame.
- The initial trail is still **hidden**: its first sample is not a manufactured sword arc. The original procedural `whoosh` is held until a later, genuinely drawable observed wrist motion has been submitted and acknowledged. If movement never occurs or the visual expires, the gate may drop the sound rather than fake a synchronized passage.
- The source planner retains its `.12` planned delay (inspectable as `intendedDelayMs:120`). The new `scheduledDelayMs:0` receipt explicitly records the D04 first-draw override. Other cue delays and the **non-gated legacy/director** timing retain their previous behavior. No physical hit is inferred from a swing.
- This does **not** verify a GLB sword tip: the current measurement is still a wrist proxy. No rig, asset, actor animation, camera, lighting, gameplay authority, or default spectator change was made.

## Test-first evidence and verification levels

1. Read `AGENTS.md`, the D04 acceptance gates, the fixed BEFORE commit, active controller, planner, measured trail, original foley, actual stream integration, and audio/VFX/simulation QA/performance skills. Direct git access in the standalone coding container failed DNS resolution for GitHub. The connected GitHub service remained writable.
2. Against the untouched source compiled in an isolated V8 adapter, a first-frame 16ms sword attempted to emit **no** visible cue: it remained in the 120ms pending queue (**expected RED**).
3. Added the five focused Node regression contracts at `tests/foundation/dungeon-d04-first-drawable-sword-foley.test.cjs`. A second, targeted RED confirmed that the first correction reported no effective scheduled delay in its receipt even though it now staged at 0ms. Fixed the receipt contract.
4. Re-ran the **five exact committed test functions** with their `node:test` and import boundaries adapted to an isolated V8 runner, executing the fetched current controller, planner and frame-gate source. Result: **5/5 passed**. An additional source-execution matrix checked immediate staging, hidden-hand silence, later observed movement, non-gated swing delay, ranger delay, mute: **8/8 passed**.
5. This is **detached source-level test evidence**, not a native Node test invocation, npm build, installed Three.js/GLB WebGL playback, original WebAudio audition, or synchronized A/V recording. No CI status or pull-request-triggered run was reported for the last inspected commit.

### Native verification command when the full worktree and assets are available

```sh
node --test tests/foundation/dungeon-d04-first-drawable-sword-foley.test.cjs \
 tests/foundation/dungeon-physical-feedback-d04.test.cjs \
 tests/foundation/dungeon-physical-feedback-realism-d04.test.cjs \
 tests/foundation/dungeon-physical-feedback-preview-integration.test.cjs
npm run build
npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs
```

## Required genuine rejection/acceptance footage

On matching run/seed/floor/tick/checksum, compare the frozen BEFORE, normal legacy `/dungeon`, and new `/dungeon?feedback=d04` under three camera directions, 1440×900 desktop and 390×844 mobile. Capture the genuine missed sword attempt and HP-confirmed damage separately, block, one-cell dodge, ranger arrow, cultist/mystic spells and a full Warden warning → release → recovery → earned counter → defeat/restart. Record canvas + opt-in sound-bus WebM and PCM/WAV, inspect sample onset against actual frame submission, stress reduced-motion/flash, mute/reload, background stalls, recovery, and 20-minute saturation. **None of these real-game clips were obtained in this coding environment; no audiovisual parity, sync score, or production pass is claimed.**

## Resource, scope and review

- Visual pools remain **7**, retained VFX capacity **102**, at most **7** additional VFX draw calls; original foley remains **8 voices** and a single `<=19,200`-sample mono buffer. Existing 32 pending, 32 awaiting-frame, 64 receipt caps are unchanged. No sampled third-party or unlicensed audio.
- Render submission acknowledgment, deduplication, WebAudio gesture consent, persistent mute, reduced settings, scene reset/disposal and legacy spectator default remain intact. The added receipt property is bounded inside the existing 64-object history.
- **Specification review:** local timing change preserves authoritative action-versus-HP truth, all ownership exclusions, and D04 isolation. **Quality review:** moving the start earlier is structurally preferable to missing early wrist displacement, but could suppress sound on animations with no timely moving wrist; actual A/V trials must decide whether to keep or revert.
- **Rollback:** revert the D04-only staging/receipt changes and focused tests on this branch. Never merge into main or PR #49 without the dedicated final integration review.
- **Next dominant weakness:** the source still uses a skinned wrist proxy, not an authenticated blade tip; genuine GLB and moving three-viewpoint validation are the critical next steps.
