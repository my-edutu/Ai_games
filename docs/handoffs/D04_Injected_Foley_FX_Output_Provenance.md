# D04 — Injected foley FX-output provenance and fail-closed recovery

**Status:** focused source correction; genuine Dungeon audiovisual acceptance **UNVERIFIED**.

- Repository: `my-edutu/Ai_games`
- Isolated branch: `feat/dungeon-d04-combat-feedback-realism-20261108`
- Previous branch head: `ac0828ac52d4ed53f6adbb92b5d5511677d623bd`
- Frozen BEFORE: `281735d0910c6b2443648af976003d50412ee324`, unchanged.
- Default legacy spectator and the opt-in `?feedback=d04` route are unchanged.

## Dominant defect and observable consequence

The previous output-rebinding change correctly handled the **owned** original WebAudio engine and rejected a new AudioContext for externally injected foley. It did not reject **the same AudioContext with a different FX output node** for an injected audio adapter, which has no output-rebinding contract. A pending sword whoosh could therefore be acknowledged and emitted by an external adapter still connected to an obsolete FX bus. The controller would falsely report successful frame-gated audio even if the recorded/current combat bus received nothing.

This is a conditional integration defect, **not** proof that the existing shipped/preview spectator exhibits audible desynchronization. The prior defect was reproduced in a detached runtime with production controller source and mock audio/visual adapters: after staging one observed swing, changing the external adapter's FX output returned `true`, left one cue awaiting presentation, and kept opt-in active. Authentic PCM/browser evidence is missing.

## Changes

- The **first same-context injected attach** records the external FX output's reference identity as an observation, not a claim that D04 owns, connects or verifies those nodes.
- Reattaching the identical context/output is idempotent.
- A changed AudioContext **or changed observed FX bus** now fails closed: revoke the audio epoch and presentation queue, clear opt-in, disable the unknown adapter's active output, and reject subsequent gestures until the caller restores the observed configuration.
- `injectedOutputMismatch` diagnostics identify this separate failure from `injectedContextMismatch`. Both are required to be false before enabling the injected adapter again.
- Returning to the known context and bus permits an explicit fresh gesture and new sound only; a previous cue is not replayed.
- The user's saved mute preference is not misrepresented by an involuntary output change.

This adds no rewire API or assumption about an unknown external audio adapter. A dedicated adapter-provided capability and a genuine output probe would be needed to support live injected-bus replacement rather than requiring restoration.

## Test-first evidence

1. Added `tests/foundation/dungeon-d04-injected-fx-output-ownership.test.cjs` first (3 Node contracts: changed bus rejects and drains, identical bus preserves consent, explicit null output is a changed route).
2. **Observed red before source fix**, detached V8 production-controller evaluation: changing FX output returned `true`; one queued sound remained; `audioOptedIn` was still true; no output-mismatch diagnostic existed.
3. Implemented the fail-closed external-output ownership guard only in `public/ai-dungeon/physical-combat-feedback.js`.
4. **Observed green after source fix**, **14/14 explicit assertions** in a detached V8 evaluation of the fetched production controller with minimal mock planner/visual/audio dependencies. This verifies branches, queue and opt-in policy, *not* actual Node test-runner execution, real WebAudio output, PCM or frame display.
5. GitHub compare against previous head: two commits ahead, none behind, exactly the two D04 files above; no commit statuses were returned.

Native validation remains **NOT RUN** because the approved coding tunnel reported `Tunnel-client has not been seen for 300 seconds` and the separate container has no GitHub DNS. Run in the approved isolated worktree:

```sh
node --test tests/foundation/dungeon-d04-injected-fx-output-ownership.test.cjs tests/foundation/dungeon-d04-audio-output-rebinding.test.cjs tests/foundation/dungeon-d04-audio-context-state-lifecycle.test.cjs
npm run build
npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs
```

## Specification and engineering review

**Specification:** the new refusal does not claim a hit, attacker, HP change, cast, warning or successful sound delivery. It is conservative: some capable injected adapters might successfully switch outputs but still be rejected until an explicit rebind API exists.

**Quality:** output equality checks are O(1); the code adds two booleans and one remembered output reference, without listeners, allocated voices, timers, visual pools, geometry or gameplay mutation. Existing source budgets remain seven visual pools/102 reserved instances/seven effect draw calls, eight voices, one original 13,440-sample mono noise buffer, 32 pending, 32 awaiting presentation and 64 receipts. These budgets were **not** freshly profiled in a real browser. Mute/scene cleanup and legacy route remain unchanged.

No edits to main, PR #49, `games/ai-dungeon/src`, rigs, camera, lighting or other branches. Revert this focused increment only if an explicit injected-adapter output ownership contract is later provided and tested. Independent final integration review remains required.

## Still blocked from acceptance

The frozen BEFORE tree has no D04 physical-feedback controller or tracked Dungeon GLB/WebM/WAV recordings, and the current tree likewise lacks genuine tracked Dungeon audiovisual captures. The required same-seed three-viewpoint 1440x900/390x844 recordings, real sword miss/contact, HP-confirmed impact, block, dodge, projectile, spell, Warden warning/release/recovery/earned counter, original PCM-to-frame alignment, mute/context/device transitions and 20-minute soak are **UNVERIFIED**.

**Next dominant physicality weakness:** a retained sword ribbon follows an authenticated wrist, not a measured animated blade tip or collision witness. Address that only after obtaining actual weapon geometry and genuine in-game capture; do not claim full combat realism or Diablo-IV parity.
