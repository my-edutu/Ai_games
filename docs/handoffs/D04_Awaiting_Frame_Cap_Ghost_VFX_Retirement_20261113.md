# D04 — Reject unreceipted visual fragments at frame-queue saturation (2026-11-13)

**State:** isolated source fix and native verification completed; real moving Dungeon audiovisual acceptance **NOT ACHIEVED**.

## Exact scope and immutable comparison

- Repository: `my-edutu/Ai_games`.
- Only branch: `feat/dungeon-d04-combat-feedback-realism-20261108`.
- Starting verified branch head: `e50b0ad74edc533b4a7f9cbbf5e30140e1500f44`.
- Frozen BEFORE remains `281735d0910c6b2443648af976003d50412ee324`.
- Changed owned paths: `public/ai-dungeon/physical-combat-feedback.js`, `public/ai-dungeon/physical-feedback-visuals.js`, and their two D04 foundation test files. No authoritative `games/ai-dungeon/src`, main, PR #49, camera, rigs, global lighting or other branches changed.
- Legacy `/dungeon` is the default. Only `?feedback=d04` uses the experimental controller.

## Dominant D04-owned source defect

The previous controller staged and emitted a retained HP-impact visual **before** checking the shared 32-item awaiting-WebGL-frame budget. On saturation, a lower/equal priority new cue could be rejected, or an older cue evicted by a higher-priority real fatal injury. Both queue outcomes preserved an appropriate terminal **audio** receipt, but neither retired the corresponding retained VFX instances. This could allow rejected or displaced hit fragments to draw on a later unrelated frame, without any remaining cue-specific frame witness. This is **a source-level safety defect**, not an assertion that the available sparse real gameplay video captured its occurrence.

## Red-green work and traceability

1. [Initial red test `2298b98`](https://github.com/my-edutu/Ai_games/commit/2298b98d091ab66996f4077a887dedac615495c1) exposed queue pressure but originally assumed 24 HP injuries per tick. [CI `43489865191`](https://github.com/my-edutu/Ai_games/actions/runs/43489865191) failed at fixture count 18 versus 24. This was a **test setup error**, not proof of the defect.
2. [Fixture correction `02051b7`](https://github.com/my-edutu/Ai_games/commit/02051b79d745ebbd67c9ca248da2a648dd284f39) respects the existing 18-injury selection cap. [Red CI `43490053720`](https://github.com/my-edutu/Ai_games/actions/runs/43490053720) then reproduced the intended defect: expected **four** retired overflow VFX, observed **zero**.
3. [Atomic source fix `0a72aa6`](https://github.com/my-edutu/Ai_games/commit/0a72aa67f4049177d4b33d3abc816551153ccecb) retires only the respective cue's retained VFX for `awaiting-frame-cap-rejected` or `awaiting-frame-cap-preempted`. The existing `retireStaleCue` matrix-hide path is reused; no new pools, geometry, sound buffers or voices.
4. [Real retained-pool test `f3e21a6`](https://github.com/my-edutu/Ai_games/commit/f3e21a62bdd083c10edbbdaebdadf0c67b5d92ef) independently verifies both retirement reasons, idempotence, bounded instances, and that a still-authoritative Warden warning is **not** removed by frame-queue pressure.
5. [Green CI `43490529464`](https://github.com/my-edutu/Ai_games/actions/runs/43490529464): **305 / 305 native contracts pass** and `npm run build` completes successfully. The associated genuine Chrome job was queued after native verification. Its browser verdict is **not** inferred from this green job.

The controller pressure test uses 36 independently identifiable public actors and two adjacent HP transitions, without guessing attack authors. The latest lower-priority wounds exercise four new-cue rejections; fatal injuries exercise four older-cue preemptions. In both cases the same 32 pending frame-receipt budget remains, with zero emitted audio before a genuine frame submission. The real instanced visual-pool contract separately checks that only a surviving danger marker remains drawable.

## Old genuine Dungeon footage inspected, NOT proof of the new fix

The supplied prior desktop WebM contains **11 decoded** VP8 frames at 587×339, with the largest PTS gap **3.063 seconds**. The prior 390px mobile capture contains **10 decoded** frames at 386×517, maximum gap **3.375 seconds**; both contain original Opus audio. These are pre-change and unaligned, not matching three-viewpoint continuous combat clips or verified sound-to-image contact. Static decoded frames are not a substitute for moving playback.

[Previous genuine Chrome run 43478828999](https://github.com/my-edutu/Ai_games/actions/runs/43478828999) passed five independent diagnostic browser scenarios but failed the strict `AUTHENTIC_DAMAGE_NOT_VISUALLY_ADMITTED` gate. It identified incomplete WebGL-frame/canvas encoding evidence. Earlier work also measured multi-second renderer calls in both D04 and legacy: those CPU-side measurements cannot establish D04 as the cause or certify GPU presentation.

## Compliance review, risk and next priority

- **Specification:** only D04 presentation cleanup changed. Swings remain attempts, not hit evidence; HP decreases remain the only injury authorization. Unknown attacker stays unknown. Warden danger survives even when its optional queue receipt is displaced.
- **Engineering:** the already-retained 7 pools / ≤104 reserved instances / ≤7 VFX draws, ≤8 sound voices, 32 awaiting-frame slots, 64 receipts, 400ms post-submission deadline, audio click opt-in, persisted mute and reduced-motion/flash guards are unchanged. New reason handling adds no timeout, timer, visual pool or queue.
- **Rollback:** revert `0a72aa6` and its associated D04 tests on this isolated branch only, never main or another session's work.
- **Unverified acceptance:** true moving desktop + 390×844 three-viewpoint clips under matched seed/tick/checksum; real miss/block/dodge/arrow/spell/HP impact and Warden warning/release/recovery/counter; independently decoded contact-to-original PCM alignment; WebGL loss, restart and 20-minute resource soak.
- **Next dominant obstacle:** multi-second real renderer submission stalls and consequent sparse encoded moving-game frames. Obtain subsystem attribution and a successful authentic HP visual receipt without crossing D04 ownership boundaries. Do not weaken the 400ms audio deadline or claim parity with commercial reference games.
