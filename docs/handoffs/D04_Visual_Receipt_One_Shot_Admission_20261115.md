# D04 — One-shot visual combat-receipt admission (15 November 2026)

Status: **native contract verified; authentic audiovisual acceptance NOT achieved**.

## Scope and head

Work exclusively on `feat/dungeon-d04-combat-feedback-realism-20261108`, from `911780965ca24ec33098e50c8a51a4668b10f8b1`. Frozen comparison milestone BEFORE: `281735d0910c6b2443648af976003d50412ee324`. Never edit or merge main or PR #49. Legacy spectator stays default; this experiment remains `?feedback=d04`.

## Defect and correction

The retained D04 visual stage previously allowed `emit()` to allocate 4–6 more injury fragments if an already accepted authoritative HP-loss cue was delivered again, including after its original VFX slot expired. The strict original foley already deduplicated the audio onset, so a repeat visual injury could appear without a corresponding legitimate new wound or sound. This is a **source-confirmed duplicate-admission defect**, not a contact double-play independently proven in the real gameplay footage.

The visual stage now retains at most 128 identities, keyed by cue ID plus semantic kind/actor/victim. A matching duplicate is rejected before GPU allocation, including after its old instance expires. The ID is admitted only after at least one actual effect slot was created, preserving legitimate retry when an initially unanchored source becomes physically drawable. `reset()` clears the bounded history. The key includes event semantics because the long-standing standalone visual foundation audition reuses an intentionally generic placeholder ID across distinct kinds; production planner IDs already encode these fields. `stats()` exposes the current remembered count and suppressed duplicate count. No authoritative HP, target, rig, camera, lighting or global renderer files were changed.

## Test-first progression

1. `da0fcdb4c806a63133532d70909619b19f2782b5`: new contract for first admitted wound, duplicate same-frame rejection, expiry-safe rejection, bounded history and reset recovery.
2. [RED job](https://github.com/my-edutu/Ai_games/actions/runs/43734029950): **374 passed, 1 expected regression failure** (`true !== false`, repeat allocated again).
3. `e876348ec72a2e6ab1a0fc6ce81a06b6cbbc347c`: first bounded implementation. [Intermediate job](https://github.com/my-edutu/Ai_games/actions/runs/43734102832) passed the new regression but exposed two old standalone cross-kind placeholder-ID assumptions. These were a real compatibility regression, not a green build.
4. `5b0ae3deb7fdffbe8ee7a3e8bb10da9097c98287`: narrowed identity to event semantics while maintaining same-event one-shot behavior.
5. [Corrected native workflow](https://github.com/my-edutu/Ai_games/actions/runs/43734203734): **375 passed / 0 failed; TypeScript production build passed**. The real-preview browser job was queued at inspection and must not be marked as passed without new verdict.

The coding tunnel was unavailable; commits, RED inspection and CI review used the connected GitHub app. No local browser on the new head was run.

## Genuine Chrome evidence, separate from code contracts

Previous-head [real Chrome workflow](https://github.com/my-edutu/Ai_games/actions/runs/43728516983) had six original recorded viewpoints, 12 matched frame-acknowledged authority states per view and five matched HP-loss ticks, but **zero** HP-loss ticks confirmed drawable across all six. Strict acceptance remained `AUTHENTIC_DAMAGE_NOT_VISUALLY_ADMITTED`. Chrome phase receipts showed renderer calls as long as approximately **2,236ms desktop** and **2,529ms mobile**, whereas D04 visual advance/emission counters were about 0–1ms in the slowest reported frames. The recordings contain actual Dungeon WebGL video and original audio streams but cannot establish sample-accurate contact/PCM synchronization; decoder and submission limitations remain. These measurements are on the prior branch code, and do not prove D04 caused renderer stalls. Sampled screenshots of the previous six-viewpoint WebMs show different game camera framing, not acceptance of current sound/contact choreography.

## Budgets, rollout and next criterion

This change adds one finite JS Set (128 entries) and scalar counters; no change to seven retained pools, 102 GPU instances, seven-draw ceiling, eight voices, generated foley buffer, user gesture/consent, mute persistence, reduced motion/flash, 32/32/64 queue budgets, 400ms receipt deadline or scene lifecycle. Deterministic replay and immutable authority remain unaffected. The code is gated to D04; rollback is by reverting its isolated commits.

**Next dominant blocker:** actual 390px and desktop WebGL renderer stalls causing verified damage to miss the 400ms submission gate, plus absent independently decoded PCM alignment. Revisit browser verdict on corrected head; then investigate root causes without changing renderer/global lighting/camera/rig ownership. Full Warden warning/release/recovery/counter, miss, block, dodge, projectile, spell, three-view matched clips and 20-minute soak remain unaccepted. No Diablo IV parity or launch readiness claim.
