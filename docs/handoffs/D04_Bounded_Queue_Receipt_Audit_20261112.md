# D04 — Bounded combat feedback queue receipt audit

**Date:** 2026-11-12  
**Scope:** Session 4 only, isolated branch `feat/dungeon-d04-combat-feedback-realism-20261108`  
**Frozen BEFORE:** `281735d0910c6b2443648af976003d50412ee324`  
**Previous D04 head:** `4c46fd11ea6ce48f7f35e6f3d45632de944af46a`  
**Implementation commit:** `025890e96205b5e2778b17b00a4450c2700183d6`  
**Acceptance:** **IN PROGRESS / NOT TRANSFORMED / NOT A/V VERIFIED**

## Observed defect and decision

Continuous authentic Chrome combat still has seconds-long software-WebGL calls and fails strict same-HP-loss delivery acceptance, even with no MediaRecorder running. The latest completed pre-increment real-browser run [43219160754](https://github.com/my-edutu/Ai_games/actions/runs/43219160754) passed 5/6 real Chrome trials but correctly rejected the actual HP-loss acceptance as `AUTHENTIC_DAMAGE_NOT_VISUALLY_ADMITTED`. The current D04 implementation uses one 400ms deadline and refuses stale impacts; it must NOT be relaxed.

Inspection of the read-only feedback controller found a further, directly observable integrity gap under this pressure: when its 32-entry pending cue queue or 32-entry audio-awaiting-WebGL queue filled, lower-priority attempts were rejected/preempted without a corresponding **per-cue receipt**. The aggregate counters rose, but investigation could not distinguish an unsubmitted original HP loss from an intentionally dropped sound or a later unrelated effect. This increment closes that bounded evidence gap. It does not fix the underlying renderer stall.

## Test-first record

Three focused saturation contracts were committed ahead of production edits. The first actual GitHub Actions contract run [43224864283](https://github.com/my-edutu/Ai_games/actions/runs/43224864283) reported precisely the three intended missing-receipt assertions as failures, plus an unrelated pre-existing older evasion test failure (`Cannot read properties of undefined (reading 'actorId')`). To avoid silently rewriting unrelated evasion rules or mixing that failure into D04 queue acceptance, the focused tests were moved intact into `tests/foundation/dungeon-d04-queue-pressure-audit.test.cjs`; the original older test file was restored unchanged. The single isolated workflow includes the new fixture by exact path. The second test-only run [43225109298](https://github.com/my-edutu/Ai_games/actions/runs/43225109298) was cancelled by the branch's explicit newer-commit concurrency policy, not counted as a completed red/green pass.

**Corrected native verification:** the production implementation's GitHub Actions run [43225322445](https://github.com/my-edutu/Ai_games/actions/runs/43225322445) ran **209/209 native contracts green**, including all three new contracts, and the TypeScript production build passed. Real Chrome audiovisual acceptance remains a separate gate; these tests prove queue behavior, NOT actual pixels, audible synchronization, a physical contact point or render throughput.

## Actual changes

- `public/ai-dungeon/physical-combat-feedback.js`: each new real public cue now retains its *original single-snapshot observation clock* before bounded pending admission. A rejected 32-entry pending cue receives `pending-cap-rejected` with `visual=false, audio=false, frameId=null`; a weaker queued cue displaced by priority receives `pending-cap-preempted` with the same no-submission semantics. Counts and hard caps remain unchanged.
- On the WebGL-awaiting-foley queue, `awaiting-frame-cap-rejected` and `awaiting-frame-cap-preempted` receipts now retain both the cue identity and the truth of its already-*staged* visual admission while **never certifying** a genuine submitted frame, original sound, HP impact synchronization or actual contact.
- `tests/foundation/dungeon-d04-queue-pressure-audit.test.cjs`: synthetic D04 capacity stress based on public snapshot states covers 54 independent verified HP losses across three snapshots (32 pending, 22 rejected), lower-priority guarded gestures displaced by actual HP-loss priority, and 36 staged but unsubmitted damage sounds (32 retained in queue, 4 rejected).
- `.github/workflows/dungeon-d04-foley-identity.yml`: executes the isolated contracts on this branch alone. No gameplay authority, camera, rig, lighting, main or PR #49 modification.

## Specification and quality review

All effects remain sourced from `planPhysicalFeedback` public state semantics; damage receipts never invent an attacker or infer a hit from a swing. A rejected cue has no WebGL frame ID, and a staged visual is explicitly not proof of pixel delivery. Receipt history remains bounded to 64; queued cues remain bounded to 32; audio awaiting real submission remains bounded to 32; no extra meshes, pool instances, draw calls, WebAudio voices, media encoders, external assets, timers or persistent state were added. The new receipts are read-only diagnostics and cannot authorize additional audio. The opt-in soundstage still requires a real gesture; mute, reduced motion/flash, deduplication, restart cleanup and the 400ms stale-frame gate are unchanged. Event ordering within a single snapshot is stable and immutable authority is not mutated. Rollback is a revert of the isolated production, test and workflow commits.

## Genuine moving-evidence and next gate

Earlier authentic desktop/mobile original WebMs from run `43198249099` are NOT current-candidate A/V passes. Independent FFprobe inspection found 8 encoded desktop VP8 frames (encoded 587×339) with a 5.707s timestamp gap, and 9 mobile frames (encoded 386×517) with a 4.658s gap. CSS viewports were 1440×900 and 390×844; encoded pixel dimensions therefore do not prove pixel-perfect capture. Audio Opus presence does not establish impact/sample timing.

**Next dominant weakness:** actual live HP-loss drawing is still delayed by multi-second software-WebGL calls and correctly rejected after 400ms. Correlate actual submitted-frame times and all effect-density observations with the same authoritative injury receipt, then optimize D04's own work only if a causal cost is demonstrated. Still required: three moving viewpoints, authentic missed swings, blocks, dodges, arrows, casts, a complete Warden warning/release/recovery/counter/restart, decoded sample-aligned original foley, desktop/390px review and 20-minute resource cleanup. Preserve legacy default; D04 remains solely `?feedback=d04` pending dedicated integration review. Never claim Diablo-IV parity or completed transformation.
