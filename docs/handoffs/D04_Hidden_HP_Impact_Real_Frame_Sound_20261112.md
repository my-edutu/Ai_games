# D04 — HP-confirmed impact foley through hidden retained injury (12 November 2026)

**Status: isolated D04 candidate, NOT transformed or production-ready.** Branch `feat/dungeon-d04-combat-feedback-realism-20261108`; reviewed from `0168af5c0283f13f1966d5938edb55586277ac49`. Comparison BEFORE stays `281735d0910c6b2443648af976003d50412ee324`. No main, Draft PR #49, `games/ai-dungeon/src`, rig, camera or lighting changes.

## Observable defect selected

The real Chrome capture previously showed 4 controller-level D04 original-audio admissions on actual HP loss and guard; timing to decoded PCM is still **UNVERIFIED**. Source review exposed a separate deterministic audio starvation path: `classifySubmittedCombatAudio` returned `await-drawable-visual` for **every** admitted VFX whose retained slot was alive but not drawable. This applied to an independently confirmed HP-loss injury when its small shard was hidden/occluded. The controller could suppress a truthful impact even when a timely genuine WebGL frame, sound opt-in and actual consecutive HP loss had all occurred.

This is a contract-observed defect, **not** a claim that the archived clips specifically reproduced an occluded-shard case. The archived gameplay remains genuine but sparse and unaligned; no fabricated PCM/onset or score is claimed.

## Small, scoped repair

- `public/ai-dungeon/physical-feedback-frame-gate.js`: add `allowVerifiedSoundOnlyImpact` (default false), bypassing **only the drawable-visual wait**. Scene, actual frame interval, 400ms deadline, accepted/alive retained visual and measured sword requirements remain in force.
- `public/ai-dungeon/physical-combat-feedback.js`: set this permission **only** for a staged, visually accepted `damage` or `damage-fatal` cue with `verified===true` and planner proof `observed-hp-drop`. This proof is minted from actual adjacent before/after HP and stable victim identity, **not** from swing/projectile proximity or event prose. A hidden guard, Warden strike, arrow, spell and sword ribbon must still prove their own visual/action gates.
- No new GPU objects, visual pools, WebAudio source nodes, noise buffers, timers, loops, voices, listeners or authoritative state writes. No change to WebAudio explicit gesture, mute persistence, reduced-motion/flash, dedupe/receipt count, cleanup, frame ID/replay suppression, or legacy spectator. D04 still requires `?feedback=d04`.
- The original hit shard is not retroactively declared rendered. The current health-state update is the visual consequence of HP loss; audio authorization is independent of the shard's orientation/occlusion. A faded or retired shard (`visualAlive=false`) still fails.

## Test-first and proportionate verification

New `tests/foundation/dungeon-d04-hp-hidden-visual-sound-only.test.cjs` runs in the D04-only workflow. Six native scenarios cover true adjacent HP loss with an alive-but-hidden shard and one actual frame, duplicated frame receipt, hidden guard, no HP delta, 440ms stale render, expired shard and explicit mute.

- Red: [run 43118034496](https://github.com/my-edutu/Ai_games/actions/runs/43118034496), 134/135 native assertions passed, **one expected failure** at the hidden HP case (`expected: 1, actual: 0`). Real-preview correctly skipped on failing contracts.
- Green candidate: [run 43118216710](https://github.com/my-edutu/Ai_games/actions/runs/43118216710), **135/135 native tests passed, production build passed, SHA-verified assets passed and genuine Chrome/Three.js smoke passed (one Playwright test)**. Its recorder reported `RECEIPT_READBACK_VIDEO_AND_EARLIER_AUDIO_RECORDED_UNALIGNED`, with `sameWindowMovingAV:false`, `synchronized:false`; ffprobe/ffmpeg were unavailable on that runner and decoded video motion remained `UNAVAILABLE`. This is NOT accepted audiovisual timing evidence.
- Test and implementation were committed separately for review; CI remains scoped to the isolated branch.

## Authentic evidence and limitations

Inspected actual previous Chrome screenshots and the archived `d04-cue-frame-timeline-20261111.zip`: genuine 688×397 VP8/Opus combined container and 5.5s PCM are present, but submission receipts do not establish decoded impact-sample onset. Four original-audio controller admissions were recorded in the earlier timeline; **this increment has no new sample-aligned physical contact proof**. A browser smoke test cannot substitute for the required matched three-viewpoint 1440×900 and 390×844 moving comparisons, full Warden warning/release/recovery/counter, genuine miss/block/dodge/arrow/spell/impact set, or 20-minute resource soak.

## Quality and specification review

The widened audio path is intentionally limited to independently witnessed, adjacent HP loss, and still demands a timely, non-replayed real WebGL submission. It cannot invent an attacker, target, sword hit, Warden exposure or projectile collision. The original 7 visual pools / 104 instances / 7 draws, 8-voice budget, 19,200-sample original mono buffer and 32/32/64 pending/awaiting/receipt bounds are not modified.

**Next dominant weakness:** actual frame-to-PCM alignment of original D04 foley remains unverified; render stalls and missing physically measured GLB blade-tip passage remain stronger perceptual limitations than this narrow hidden-shard correction. Prioritize fresh authentic multi-view capture and sample onset calibration, not extending the 400ms deadline.

**Rollback:** revert D04 controller frame-gate opt-in and this contract if authentic browser clips show a misleading detached injury sound. Preserve the default legacy spectator and never merge without the final integration review.
