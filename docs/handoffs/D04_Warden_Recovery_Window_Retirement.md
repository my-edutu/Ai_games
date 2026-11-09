# D04 — Retire expired Warden recovery and defeated-body signals

**Status:** focused source-level correction on the isolated opt-in D04 branch. **Genuine 3D browser audiovisual acceptance remains UNVERIFIED.**

- Repo: `my-edutu/Ai_games`
- Branch: `feat/dungeon-d04-combat-feedback-realism-20261108`
- Parent verified at start: `560ec60c757b226955efe655421586163b44d356`
- Frozen BEFORE comparison: `281735d0910c6b2443648af976003d50412ee324` (legacy `combat-director.js` inspected, not edited)
- Test-first commit: `1d380cb061f467ad0328c4a454391132df34e2bd`
- Renderer fix: `1b5b9eb87976fe6aa4b35511d47d1a4919982d0c`
- Snapshot integration: `69d0173a5ac909e4f8f1c8dc9f3e0f7df659aaaa`
- First-frame contract: `9f10316b8f9bc713d73beb6c203a402dba960fde`

## Dominant source-confirmed defect

D04 previously retired Warden release/recovery rings when the rig became invisible, moved out of its real public cell, or no longer matched the cast tick. But a Warden could **remain in the same animated cast pose** after the authoritative recovery window ended or the boss ward was sealed again. The 340ms retained *opening* glyph then continued to advertise vulnerability at a time when no opening was valid. An actor-local release/recovery ring could also survive an observed Warden death if the actor retained a previous `cast` pose.

This defect was confirmed through the actual retained-renderer module and deterministic fake matrices. It was **not** diagnosed from a recorded GLB-backed frame.

## Test-first contracts and implementation

1. Before the renderer edit, added four Node test contracts in `tests/foundation/dungeon-d04-warden-recovery-live-window.test.cjs`. In an adapted V8 harness loading the unchanged production visuals module, **three tests failed for the expected defect and one valid ongoing-recovery control passed**.
2. Updated `public/ai-dungeon/physical-feedback-visuals.js`. An opening ring is now checked, both at emission and on every existing retained-effect advance, against a read-only current public snapshot. It retires if the authority tick has passed `recoveryUntilTick`, `guardianWard` has sealed the boss, the public recovery-remaining indicator is no longer positive, or the current scene is inconsistent. Explicit `hp <= 0` retires either Warden body signal. The original body location, cast tick and visibility checks remain.
3. Updated only the D04 controller's `createPhysicalFeedbackVisuals` options to supply `getCurrentSnapshot:()=>previous`. No new polling, timer, authoritative data or private API was introduced. External/test visual adapters remain supported.
4. Added an actual controller/planner/renderer/frame-gate integration contract: when both authentic cast-release and recovery effects were admitted but the public recovery expires **before the first acknowledged WebGL frame**, the retained recovery glyph disappears and cannot earn delayed `recovery` audio. The still-witnessed release cue can earn its existing one-time sound. This tests presentation receipts, not audible PCM.

### Executed source-level checks

- Test-first (old production visuals): **3 expected failures, 1 control pass** in adapted V8.
- Changed production visuals against all five new authored callbacks: **5/5 passed** in adapted V8 (the controller test exercised the changed real planner, renderer, frame gate, and controller, with mock Three geometry and sound adapters).
- Eight existing renderer callbacks from `dungeon-d04-warden-body-pose-anchoring.test.cjs` and `dungeon-d04-warden-body-signal-continuity.test.cjs`: **8/8 passed** in adapted V8.
- Combined explicitly exercised, non-native source-backed callbacks after the fix: **13/13**. The fourth/fifth Node tests of the legacy files were not included in the eight-callback compatibility run; native execution remains required.

The green results are neither genuine WebGL submission nor real WebAudio playback. The reduced external dependencies in the adapted harness did not model the skinned GLBs, camera or device audio. Do not cite these as parity, A/V sync scores or production readiness.

## Scope, invariants, and budgets

- Updated only the isolated D04 controller, D04 visual adapter and D04-specific tests/docs. No changes to `main`, Draft PR #49, `games/ai-dungeon/src/**`, rigs, camera, lighting, gameplay or any other branch. Default `/dungeon` stays legacy; `/dungeon?feedback=d04` stays opt-in.
- The seven retained GPU pools (102 reserved slots, at most seven candidate draw calls), 32 pending cue/32 awaiting sound/64 delivery-receipt limits, eight authored voices and single 13,440-sample mono generated texture are unchanged.
- Extra cost is only a constant-time snapshot guard on the at-most-eight signal slots per visual advance; no allocations, new WebAudio nodes, draw passes or effects. CPU/GPU timings not measured.
- Floor danger markers are exempt; a genuine warning does not vanish solely because body art disappears. HP-confirmed injury still needs actual HP loss; no actor identity is inferred from anonymous events or narrative text.
- WebAudio fresh-click consent, persistent mute, reduced-motion/flash, deduplication, scene/reset cleanup and frame acknowledgment remain unchanged.
- **Spec review:** retained opening signal cannot outlive currently observed public recovery. **Quality review:** guard is fail-closed when a production snapshot getter is present and invalid; integration keeps previously injected test adapters supported. Rollback: revert the two production commits only after reviewing their test contracts.

## Required next authentic acceptance

The shared coding tunnel returned `Tunnel-client has not been seen for 300 seconds`. The GitHub tree contained only `public/ai-dungeon/models/.gitignore`, not mounted combat GLBs; no authentic Dungeon WebM + original bus PCM was accessible. Native `npm ci`, Node tests, build, Playwright and 20-minute soak could not be run. GitHub reported no PR-associated workflow runs or combined status checks at this head.

When the real worktree, asset license manifest and devices are available, run:

```sh
node --test tests/foundation/dungeon-d04-warden-recovery-live-window.test.cjs tests/foundation/dungeon-d04-warden-body-pose-anchoring.test.cjs tests/foundation/dungeon-d04-warden-body-signal-continuity.test.cjs tests/foundation/dungeon-d04-warden-release-recovery-submission-order.test.cjs
npm run build
npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs
```

Collect matched-authority-seed/tick/checksum three-angle clips at 1440x900 and 390x844. Inspect Warden warning/release/recovery/earned counter, death/restart, simultaneous hazards, miss vs real HP contact, block, dodge, ranged and spells, fresh audio consent/mute-reload, reduced effects, frame stalls and WebGL recovery. Preserve original WebM and decoded PCM with source-time-to-submitted-frame-to-audible-sample measurements, plus a 20-minute bounded effect/voice soak. Static test telemetry and standalone procedural WAV auditions cannot close this gate.

**Next dominant physical-realism blocker:** Warden cast-synchronized release sound still does not prove a measured weapon contact pose, and sword ribbons still follow an animated wrist proxy rather than authenticated GLB blade-tip geometry. Resolve with actual GLB inspection, real synchronized footage and independent multi-view critique before changing strike timing or claiming transformation.
