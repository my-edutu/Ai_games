# D04 — Actual HP-impact WebGL submission-phase audit (2026-11-16)

**Status: DIAGNOSTIC IMPLEMENTED; REALISM UNACCEPTED.**

Ownership: D04's evidence-only browser/foundation code on `feat/dungeon-d04-combat-feedback-realism-20261108`. Nothing in authoritative `games/ai-dungeon/src`, main, Draft PR #49, character rigs, camera or lighting is changed.

## Dominant measured failure

The genuine Chrome job for commit `914d4fd57cde47c4219fed27959c46b6783357d8` ran on 2026-11-15, producing actual Dungeon WebGL/Opus recordings and original audio PCM. The strict review failed `AUTHENTIC_DAMAGE_NOT_VISUALLY_ADMITTED`. For the consecutive public HP loss at tick 4, seed `visual-room-art-18`, the event `1:1:4:damage:-:enemy-1-0` had a true visual pool admission but was rightly rejected as `stale-frame` before foley. Its original CPU receipt measured **1,469ms** from observation to submission, including **1,281ms** inside the measured renderer call, versus a fixed **400ms** D04 audio deadline. These are wall-clock CPU intervals, NOT decoded video PTS or audio sample onsets; they do not prove the renderer's underlying cause. See [real Chrome run 43767672432](https://github.com/my-edutu/Ai_games/actions/runs/43767672432) and [artifact 14183705472](https://github.com/my-edutu/Ai_games/actions/runs/43767672432/artifacts/14183705472).

Six authentic unaligned clips cover three existing camera viewpoints each at 1440x900 and 390x844. They collectively include five shared authoritative HP-loss ticks, but **zero universally confirmed drawable injuries**. The original recorded PCM is not independently contact-synchronized. Complete Warden choreography, misses, blocks, dodges, projectile/spell physical timing, and the 20-minute soak remain unaccepted.

## This increment

- Added test-first, fixed-corpus receipt regression to `tests/foundation/dungeon-d04-source-start-correlation.test.cjs`; authentic delayed and timely cases plus malformed/duplicate/budget guards.
- Implemented `auditD04ImpactFramePhases` in the existing evidence-only `tests/browser/dungeon-d04-source-start-correlation.cjs`, with a maximum 64-item input, per-HP CPU-phase evidence, no attacker inference, and no PCM or GPU-completion claims.
- Extended the genuine Chrome test `tests/browser/dungeon-physical-feedback-preview.spec.cjs` to save `artifacts/dungeon-d04-authentic-impact-frame-phase-audit.json` and attach the exact read-only audit even when strict audiovisual acceptance fails. The existing failure expectation remains unchanged.

No live feedback, VFX draw calls, GPU instances, audio nodes, consent/mute, accessibility fallback, dedupe, cleanup, or scene clocks were changed by this increment.

## Verification and remaining review

The previous genuine browser suite **failed** strict audiovisual acceptance while its native contracts and build **passed**. The new commit's native + Chrome CI workflow is an independent gate; its final outcome must be inspected, not assumed. A diagnostic receipt class such as `TIMELY_FRAME_RECEIPT_ONLY` cannot satisfy actual contact-frame and decoded PCM acceptance.

Next D04 task: review the new CI artifact and isolate any D04 CPU emission cost measured on the exact genuine HP tick. When large time is concentrated in `renderer.render` rather than D04, refer the renderer/performance bottleneck to its owning integration session instead of silently altering camera, lighting or authoritative gameplay. Capture shared-clock matched BEFORE/AFTER moving sequences and test cleanup after twenty minutes before proposing default promotion. Keep `?feedback=d04` opt-in with legacy spectator unchanged.
