# D04 — Preserve event-to-submission audio deadline across staged ranged and spell cues

**Status:** targeted source-level correction on opt-in D04; genuine Dungeon playback and physical realism acceptance **UNVERIFIED**.

- Repository: `my-edutu/Ai_games`
- Exclusive branch: `feat/dungeon-d04-combat-feedback-realism-20261108`
- Parent observed before this work: `e7f6bb2d8b90a47ef9f1d597866eebd17bd58df2`
- Test-first commit: `36a55444d5e71e2940ce5377e6498d55aca476f6`
- Production correction: `59bb8218daed63f0e4ba581b1620f13b94bcde44`
- Frozen comparison milestone BEFORE: `281735d0910c6b2443648af976003d50412ee324`, unchanged.
- Legacy `/dungeon` remains default; `/dungeon?feedback=d04` stays the opt-in experiment.

## Defect and selection

The submission-gated controller scheduled a real aimed ranger release at 210ms and a real aimed mystic spell release at 290ms after the public action transition. However, when those delayed cues entered the frame-awaiting queue, the controller stored `at: observedSeconds`, resetting the 400ms sound-freshness deadline to the *time of visual admission* rather than the time of the observed authority action. That meant a spell staged at ~300ms could still earn sound after another 120ms of delayed GPU submission: ~420ms after the witnessed action, yet incorrectly classified as timely. A ranger staged at ~250ms with another 180ms of submission time likewise sounded at ~430ms.

This is a **source-executed timing defect**, not a measured audible mismatch in the actual GLB-backed game. The existing frame receipt did not make the hidden extra latency immediately apparent.

## Test-first contract and change

1. Committed four deterministic Node test callbacks **before the source correction** in `tests/foundation/dungeon-d04-delayed-action-audio-deadline.test.cjs`. They exercise public adjacent-tick snapshots, an explicit *aim-only* target resolver, consent, bounded visual admission, and the simulated submitted-frame duration. No hit or attacker is inferred from a projectile/spell release.
2. Executed the unchanged production planner, controller, and pure frame gate in an adapted V8 harness against the old head. Both required stale cases failed their intended deadline contract: a 300ms staged spell plus 120ms submission and a 250ms staged ranger release plus 180ms submission each **incorrectly played**. A timely 300ms+60ms spell was the positive control.
3. Updated `public/ai-dungeon/physical-combat-feedback.js`: the queued action-observation timestamp now passes from `pending[].queuedAt` through `emit()` into `awaitingPresentation[].at`. The 400ms window therefore spans **staging + frame delivery**, not frame delivery alone. The queue never gets a fresh timing allowance when an already old cue becomes visible.
4. Re-executed the **four committed test callbacks** against the changed production planner, controller and gate in a detached V8 harness: **4/4 passed**. The two former late cues now receive `stale-frame` receipts and no audio; the timely spell and ranger release still receive one `delivered` receipt. Source test syntax parsed. The bounded adapter harness is not native Node, Playwright, or true audio playback.

Representative deterministic contract timings:

| Public cue | Staged after observation | Submission duration | Total known time | D04 result |
| --- | ---: | ---: | ---: | --- |
| Mystic aimed spell | 300ms | 120ms | 420ms | `stale-frame`, silent |
| Ranger aimed release | 250ms | 180ms | 430ms | `stale-frame`, silent |
| Mystic aimed spell | 300ms | 60ms | 360ms | One delivered sound |
| Ranger aimed release | 250ms | 20ms | 270ms | One delivered sound |

**Clock definition:** elapsed time starts when D04 receives the adjacent public action snapshot, not at a verified mesh contact point or an output PCM sample. The render-submission acknowledgment also does not certify actual frame display or audible onset. Neither metric is presented as an A/V latency score.

## Review and resource boundaries

- **Specification review:** staging must not reset source-event freshness; no sound prior to consent or a submitted frame; timeouts suppress late release audio without inventing any impact or target. The test targets establish aim, *not* projectile collision or HP loss.
- **Engineering review:** change only to the existing receipt clock field; same bounded waiting queue, deadlines, priority eviction and one-way scene/mute/dispose cleanup. No new setTimeout, node, material, sound buffer, pool, frame listener, rendering pass, or authoritative write.
- Existing limits remain structurally unchanged: seven retained VFX pools, 102 instances, at most seven effect draw calls, eight procedural voices, one 13,440-sample mono noise buffer, 32 pending effects, 32 frame-awaiting sound cues, 64 receipts. **Actual WebGL/GPU/audio costs not measured this run.**
- Mute persistence, fresh user gesture opt-in, reduced-motion/flash, deduplication, non-gated legacy path, Warden warning/release/recovery precedence, and current scene-reset behavior were not altered.
- Rollback is the single production-code commit `59bb8218` (with tests/docs reviewed separately); there was no merge, deployment, or default-spectator switch.

## Native and genuine-visual evidence still outstanding

The coding tunnel reports `Tunnel-client has not been seen for 300 seconds`; the separate container has Node v22 installed but cannot resolve `raw.githubusercontent.com`. Only the GitHub connector could inspect/write the isolated branch. Actual Dungeon model files are absent from the committed `public/ai-dungeon/models/` directory (only `.gitignore`); no tracked gameplay WebM/PCM clip was available in the inspected repository tree.

Not performed/verified: `npm ci`, native `node --test`, `npm run build`, Playwright, rendered WebGL frame telemetry, WebAudio onset/PCM capture, three matched-seed camera directions, 1440x900 and 390x844, warning/release/recovery/counter cycle, sword miss/HP-confirmed contact, block/dodge/projectile/spell moving-game review, 20-minute soak or independent blind artistic assessment.

When a writable worktree and GLBs are available, run:

```sh
node --test tests/foundation/dungeon-d04-delayed-action-audio-deadline.test.cjs tests/foundation/dungeon-d04-audio-frame-deadline.test.cjs tests/foundation/dungeon-d04-visual-audio-submission.test.cjs tests/foundation/dungeon-d04-first-drawable-sword-foley.test.cjs
npm run build
npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs
```

Capture synchronized scene submissions and original sound-bus PCM against the same authoritative seed/tick/checksum, testing at least two different GPU-stall durations for spell and ranger release. Check whether observed 400ms admission is artistically plausible; do not extend deadlines without real evidence.

**Next dominant weakness:** even timely Warden release audio remains keyed to a public cast transition and displayed body ring, **not verified animated weapon contact**. The melee streak is still a skinned-wrist proxy, not authenticated blade-tip travel. These remain blocking physical-realism goals requiring the mounted GLBs and genuine three-angle moving-game capture.
