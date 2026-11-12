# D04 — Silent sword admission: no false GPU upload for an unmeasured hand

**Date:** 2026-11-12. **Status:** IN PROGRESS; original live combat A/V NOT ACCEPTED.
**Branch:** \`feat/dungeon-d04-combat-feedback-realism-20261108\`.
**Frozen BEFORE:** \`281735d0910c6b2443648af976003d50412ee324\`.
**Acceptance:** \`docs/handoffs/D04_Real_3D_Preview_Acceptance.md\`.
**Rollout:** Legacy /dungeon remains default. Only \`?feedback=d04\` opts in. No main or Draft PR #49 merge.

## Defect and bounded intervention

Authentic Chrome trial [43297533222](https://github.com/my-edutu/Ai_games/actions/runs/43297533222) still failed the strict real-HP-loss admission condition: real authority tick 3→4 contained actual victim HP loss but its D04 injury receipt was \`expired-pending-before-frame\`. No WebGL-submitted injury frame or synchronized impact audio was proven. Unrecorded legacy and D04 render calls also stalled; it would be unjustified to assign that dominant performance problem to D04 without evidence.

A separate, unambiguous D04-owned waste remained: \`physical-feedback-visuals.js\` created each new sword-trail slot with an already-hidden instance matrix at pool construction, then \`emit()\` wrote an identical hidden matrix and dirtied the entire instanced trail buffer before any actual wrist motion. A stationary, unmeasured attack therefore asked Three.js to upload invisible data. Earlier D04 work had already removed redundant *per-frame* hide writes; this change closes the *first emission* path.

The production correction skips the hide matrix write **only when a trail enters a genuinely vacant slot**. An occupied/preempted slot is still explicitly overwritten with a hidden matrix because an older measured ribbon might remain visible in its GPU instance. First genuine skinned-wrist passage still writes the visible matrix in \`advance()\` exactly as before. No invented sword arc, hit, attacker, renderer acknowledgement or late sound is introduced.

## Test-first and verification

- [Regression test commit 64d9b69](https://github.com/my-edutu/Ai_games/commit/64d9b69159367aa1121695d85a3574fec1c66d04): existing production-module/Three.js-adapter suite now asserts zero additional matrix writes and no new dirty instance buffer on a vacant, still-hand swing; eight vacant trails remain hidden and bounded; a ninth higher-priority cue must hide its displaced occupied slot with exactly one write. No GPU upload is claimed to have been physically measured by this mock.
- [Red CI 43307958872](https://github.com/my-edutu/Ai_games/actions/runs/43307958872): **224 passed / 1 failed** at the new contract: the prior implementation performed 9 trail matrix writes instead of 8 after the first new silent attempt.
- [Production commit 72af9d5](https://github.com/my-edutu/Ai_games/commit/72af9d5159fc23c6c9f45269f246f7f1a74934bb): confined to \`public/ai-dungeon/physical-feedback-visuals.js\`, with one vacancy check and one conditional matrix update.
- [Corrected CI 43308148738](https://github.com/my-edutu/Ai_games/actions/runs/43308148738): native contracts **225/225 passed** and production build passed. Real Chrome playback was queued at the time of this handoff and is **NOT yet an accepted real-game result**.

**Scope / independent quality review:** The visual pool identity remains seven draw calls and 102 reserved instances. No new geometry, canvas, renderer state, material, sound node, timer or authority mutation. The preemption branch still clears potentially visible old sword art. Every authenticated injury remains dependent on consecutive real HP loss, never inferred from a swing, and unspecified damage sources remain anonymous. WebAudio requires explicit gesture, honors mute/context lifecycle and 400ms frame-submission staleness; reduced motion/flash, deduplication and scene disposal remain intact. A DOM-free matrix-write contract does not measure bufferSubData or hardware frame-time impact. A reported reduction in JS write intent is not a demonstrated reduction in real WebGL stalls.

## Genuine media and rejection evidence

Existing authentic pre-change combined WebMs from the prior completed CI are **not matched three-viewpoint acceptance clips**. Independent FFprobe inspection of the provided copies found original Opus 48kHz stereo audio and VP8 video, with only **13 desktop decoded frames / largest PTS gap 3.015s** and **11 mobile 390px frames / largest gap 1.512s**. Audio-track presence is **not** sample-accurate impact evidence. No new post-change decoded original WebM comparison, real blade-tip contact, sample-aligned impact-onset proof or 20-minute active effects soak is asserted here.

## Remaining blocker, next session and rollback

Dominant observable blocker remains **authentic HP-loss cues expiring while pending before their first eligible WebGL frame**, and independent multi-second software WebGL stalls. Do **not** inflate the fixed 400ms sound limit or replay old injuries after a later frame. Next D04 work: correlated per-cue observation, pending delay, visual advance, retained dirty-pool work and true post-WebGL receipt under the same continuously advancing authority, across warmed/cold desktop and 390px mobile; then an evidence-led, D04-only cost intervention. Separate full Warden warning/release/recovery/earned counter, miss/block/dodge/projectile/spell cases and three moving viewpoints remain unverified.

Rollback: revert **only** \`72af9d5\` if an occupied-slot visual regression is reproduced; retire matching test \`64d9b69\` only with explicit reason. No force push, rebasing, merge, main edit or PR #49 change.
