# D04 — Stale WebGL submission ghost-feedback retirement

Date: 11 November 2026. Status: **isolated corrective candidate; no new real-browser acceptance yet**.

Only branch `feat/dungeon-d04-combat-feedback-realism-20261108`; no main, Draft PR #49, game authority (`games/ai-dungeon/src`), rig, camera, lighting, or other session branch edits. Frozen BEFORE remains `281735d0910c6b2443648af976003d50412ee324`; branch acceptance is `docs/handoffs/D04_Real_3D_Preview_Acceptance.md`.

## Dominant observed defect

The most recent prior authentic Chrome/Three.js test on [run 43085923288](https://github.com/my-edutu/Ai_games/actions/runs/43085923288) succeeded as a **browser smoke**, but its collected `dungeon-d04-real-cue-frame-foley-timeline.json` records **35** renderer acknowledgments, **36** queued cues, **29** cues expired before admission, **four** retained visual admissions and **zero** audio admissions or original source-start audit entries. Two inspected stale visual receipts exceeded the 400ms sound deadline (approximately **917ms** and **3303ms** observation-to-submission, with correspondingly large actual WebGL submission intervals). This is not evidence of audible original impact sound. The combined WebM has VP8+Opus tracks, but source coexistence and ambient PCM do not establish D04 onset, sampled physical contact or a usable three-viewpoint moving comparison.

The safety gate correctly refused late audio. However, the retained visual slots could survive a late submitted frame and reappear as a ghost transient in the next frame, because its sound-rejection decision did not explicitly retire its GPU instances. A sound deadline must never be stretched to make a stale hit seem synchronized.

## Isolated implementation

- `tests/foundation/dungeon-d04-stale-submission-visual-retirement.test.cjs`: test-first contracts for bounded per-ID hit-fragment retirement, preserving a different wound; preserving live Warden warning cells; and actual consecutive HP loss followed by a >400ms WebGL submission without delayed sound or next-frame ghost art.
- `public/ai-dungeon/physical-feedback-visuals.js`: `retireStaleCue(id, reason)` retires only the cue's existing retained instances, writes hidden GPU matrices, updates instance dirty flags and mesh visibility, and accounts for retired slots. Does not allocate any geometry or nodes. Warning floor markers are explicitly exempt: audio expiration does **not** revoke actual danger authority. Unknown IDs and unrelated or successful reasons are no-ops.
- `public/ai-dungeon/physical-combat-feedback.js`: on `stale-frame`, `expired-visual` or `unverified-frame`, request the optional visual-stage retirement only **after** the actual WebGL acknowledgment rejects audio. Injection adapters without this method retain their legacy contract.
- `.github/workflows/dungeon-d04-foley-identity.yml`: includes the new contract and triggers for D04 visual-stage changes. Other games and workflows are not modified.

This is a **next-frame cleanup**: no JavaScript can retract the pixels already submitted to WebGL during a blocking render. The new code protects subsequent frames; it does not claim the current slow frame was shown on-time, nor that a sword tip or original foley was physically synchronized.

## Verification and resource safety

The test file was committed before implementation, but early CI runs were cancelled by existing branch concurrency; do not claim a witnessed red test. A fresh contract/build/real-browser run was requested automatically by the last D04 code commit at [run 43094321217](https://github.com/my-edutu/Ai_games/actions/runs/43094321217). At creation of this handoff it had not completed. **Do not claim these changes passed unit, build, Chrome, mobile or audiovisual validation until that run's jobs and actual artifacts are inspected.**

Seven GPU pools and <=104 retained instance capacity remain unchanged, with no added draw calls, synthesized sound, altered sample buffer, deadline, authority, attacker attribution, or network I/O. Real HP loss still identifies only its victim, never an invented perpetrator. The 400ms sound freshness cap, audio click opt-in, mute/reload, scene cleanup, reduced-motion/flash and event deduplication stay unchanged. The live Warden danger-cell warning exclusion prevents an audio deadline from silently cancelling an active telegraph. Legacy spectator stays the default; D04 remains opt-in `?feedback=d04`.

## Specification and quality review

Specification: branch and authority boundaries held; fail-closed sound timing preserved; existing pools reused; live warning semantics retained. Engineering risk: retirement is triggered only after renderer acknowledgment and cannot repair the already-rendered frame. A second risk is a pool's mesh visibility recalc under mixed hidden/measured trail slots; the new tests cover targeted clearing but genuine GPU validation remains mandatory.

Rollback: revert the two scoped D04 production-module commits and the isolated regression/workflow changes; do not merge into main. No data migration or gameplay replay version change is involved.

## Next evidence gates

1. Verify code-candidate CI and examine newly generated genuine-browser trace for retired-slot counts, sound admissions, new WebGL submissions and potential stale-frame residuals. If test fails, correct it on this same branch.
2. Reduce authentic browser render delay at its measured cause **in the appropriate owner session**, or compare Chrome headed/GPU vs software WebGL without granting phantom sound. Keep original D04 deadlines.
3. Capture matched moving 3-direction desktop/390px clips, real miss/HP contact/block/dodge/projectile/spell, Warden warning/release/recovery/counter/defeat/restart, decoded original cue-specific PCM aligned to submitted frames, accessibility/mute/recovery and 20-minute pool soak.
4. Improve authored GLB blade-tip witness instead of using the existing wrist-travel proxy; do not label that proxy physical sword contact.

**Acceptance: IN PROGRESS / NOT TRANSFORMED / NOT SAMPLE-SYNCHRONIZED.**
