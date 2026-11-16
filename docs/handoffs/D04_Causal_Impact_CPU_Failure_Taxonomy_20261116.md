# D04 — Genuine HP-impact CPU evidence versus drawable-frame admission (2026-11-16)

**Status: TESTED CPU DIAGNOSTIC; GAMEPLAY AUDIOVISUAL REALISM NOT ACCEPTED.**
Ownership: evidence-only D04 browser audit and its native regression on the isolated `feat/dungeon-d04-combat-feedback-realism-20261108` branch. No gameplay, renderer policy, character, camera, light, main, PR #49 or other session branch edits.

## Real observation and primary defect

Read the previous genuine Chrome playback at [run 43773487853](https://github.com/my-edutu/Ai_games/actions/runs/43773487853), including [captured original Dungeon artifacts](https://github.com/my-edutu/Ai_games/actions/runs/43773487853/artifacts/14186031181). Actual HP receipt `1:1:4:damage:-:enemy-1-0` took **1,754ms** to submit, including **1,351ms** in the measured renderer-call interval: audio properly rejected the stale frame under the unchanged 400ms budget.

Other genuine HP receipts demonstrate an important distinction:
- Tick 7 was a 109ms timely accepted frame receipt, but decoded contact/PCM is unverified.
- Tick 6 had a **308ms measured CPU timeline but no confirmed drawable shard**. The old audit discarded otherwise valid CPU phases as `UNVERIFIED`, hiding useful performance attribution simply because no visible impact qualified.
- Tick 10 had incomplete/contradictory timing evidence, and tick 24 had no submitted frame receipt. Neither can be promoted to successful impact evidence.
- Six actual original-sound Dungeon viewpoint captures across desktop and 390px mobile still have **zero universally confirmed drawable HP ticks** out of five shared damage ticks. Decoded frames and original PCM sample-onset synchronization remain unverified.

## Isolated improvement

The `auditD04ImpactFramePhases` read-only analyser now independently evaluates legitimate CPU-phase clocks and the stricter audiovisual admission condition. It preserves measured CPU timing even when a body-local visual is occluded or unverified, while still refusing to call the damage visible or its sound synchronized.

Each bounded actual HP receipt now reports a conservative `failureReason`: `NO_SUBMITTED_FRAME_RECEIPT`, `UNTRUSTED_RECEIPT_CLOCKS`, `UNRECONCILED_CPU_PHASES`, `STALE_RENDER_DEADLINE`, `LATE_OR_CONTRADICTED_SUBMISSION`, `NO_DRAWABLE_HP_EFFECT`, `FRAME_RECEIPT_ONLY` or `NO_VALID_VISUAL_AUDIO_ADMISSION`. Valid CPU partitions also expose `d04VisualCpuMs`, `nonRendererCpuMs` and `otherCpuMs`, with `renderSubmissionMs` and `rendererSharePct` retained.

These are CPU wall-clock partitions, **not GPU completion, decoded video PTS, real contact, proof of D04 causal performance cost, or original PCM alignment**. Full visual admission and independent real-media checks remain separate mandatory gates. Receipt count stays limited to 64, and no attacker identity is inferred.

## Verification

- Native regression was committed before the implementation; an independent failing-red CI outcome was not observed.
- Corrected head `c667edf2150360d531f5cf4fb890c445b40c3916`: [isolated GitHub Actions run 43778353650](https://github.com/my-edutu/Ai_games/actions/runs/43778353650), **391/391 native contracts passed** and TypeScript production build passed.
- Genuine Chrome stage of this same head was still running at the time of this note. Its final result, new matched recordings, decoded video and PCM onset remain unverified.
- Compare only two D04-owned files against `9c0be6d4c6a2deba0bda5bae7a980ed3a990992f`, prior to this documentation-only commit.

## Next owned work and independent blockers

Inspect the corrected real-browser receipt artifact. If late submissions remain concentrated in `renderer.render` with small D04 CPU-phase cost, report to the renderer/performance integration owner without modifying that owner's source. For D04, seek a real, stable first authoritative HP loss with an admitted drawable body and independent decoded moving pixels plus original PCM onset. Continue three physical viewpoints at 1440×900 and 390×844, and specifically verify missed swings, guarded contact, dodges, actual ranged/spell releases, Warden warning/release/recovery/earned counter and scene cleanup after twenty minutes.

Do **not** relax the 400ms deadline, fake contact, fabricate attribution, or treat sound generation or a WebM track as synchronized acceptance. Existing seven GPU pools, <=104 instances, <=7 VFX calls, eight-voice cap, opt-in/mute, reduced motion/flash, deduplication and cleanup must remain intact. Legacy spectator remains default; D04 stays opt-in with `?feedback=d04` until final independent review.
