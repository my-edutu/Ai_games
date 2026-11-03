# Infinite Tower Climb — actual airborne guardian duel across camera and skinned explorer

**2026-11-03 | DRAFT PR #68 | SAME WHOLE-GAME TRANSFORMATION | Quality: NOT EVALUATED**

## Largest connected experience gap

The frozen game baseline is `1731b380851162741761c5569e2bc152a0869ca9`. Before this change, the live camera's guardian staging explicitly excluded **all** airborne players, even when the already-shipped real guardian-shot stage witnessed an authentic, present-tick, facing-correct projectile warning within the player's vertical hit band. During actual high-stakes traversal this can prioritize a distant route while hiding the dangerous opponent. Separately the original skinned climber looked toward the next platform midpoint even when an active close guardian was charging. A visible warning stripe alone cannot make an action legible if the 3D camera and hero fail to acknowledge its source.

Prior native 960×600 desktop and 390×844 portrait danger footage, e.g. [source-pinned recording 41561512578](https://github.com/my-edutu/Ai_games/actions/runs/41561512578), already showed inconsistent guardian/cap visibility in sparse observations, but those samples are **not** a matched source-event quality comparison. Do not infer that this implementation fixes full-motion perception without viewing its new-source clips.

## Cohesive playable implementation

On implementation source [`1c147b4d40fbc35c662b8fa806c39c3254b189a8`](https://github.com/my-edutu/Ai_games/commit/1c147b4d40fbc35c662b8fa806c39c3254b189a8):

- The **existing** exterior shot lane first verifies a live, source-facing guardian, true telegraph/remaining ticks, living player and genuine horizontal projectile height band. Only its source-matching ID can promote an otherwise airborne guardian into the outside-core, two-character camera director. Unthreatened airborne jumps still frame their landing. The camera retains prior no-core-crossing, heroic silhouette and stable guardian lens rules, including portrait actor recovery.
- During real nearby guardian charge, active combat or a legitimate combat-evasion mode, the climber's existing original skinned eyes and helmet track **that actual opponent**, not an old platform aim point. The world-space route is not changed by this purely presentational gaze.
- The same true charge countdown and guardian side produce a bounded physical **defensive counterbalance** on the original articulated body, head, arms and knees; no extra character, UI warning panel, renderer pass or arbitrary timer. Combat, dashes, injuries, gripping, terminal states and stale/restart override the cue. Reduced-motion keeps a quiet static brace.
- No AI source action, physics authority, future enemy trajectory, collision envelope, attack damage, seeded stream, replay version, result or restart was changed. Guardian charge audio, HP-operated cap machinery, route markers and the authentic end-of-run scene remain linked in the original transformation.

### Engineering safety repair is not a Gauntlet win

Prior exact-head [workflow 41567579811](https://github.com/my-edutu/Ai_games/actions/runs/41567579811) **FAILED** four of 794 tests: three CPU Three.js/VM fixtures omitted the new real guardian-shot-stage constructor, and the passage lifecycle assertion still enumerated the old GPU owners. The same commit updates three harness imports and the exact graphics-recovery owner contract, plus source-integration assertions tying the airborne enemy ID, source-driven skinned gaze, reduced-motion cue and restart cleanup. These tests are safety guards only. **Exact new-source CI is still pending inspection; no claimed passing test counts.**

### Source-pinned evidence available — not proof of improved experience

The prior candidate [capture workflow 41567419110](https://github.com/my-edutu/Ai_games/actions/runs/41567419110) completed **nine of nine** recorded jobs at gameplay SHA `46e787fe364905352bebfb15dee1103689e8818c`, recording baseline and candidate ascent, high-stakes guardian danger, moving platforms, outcome/restart, and authentic ledge with 960×600 desktop and 390×844 portrait views. Frozen baseline SHA remains `1731b380851162741761c5569e2bc152a0869ca9`. These full-motion artifact ZIPs are engineering evidence; they precede the new `1c147b4d40fbc35c662b8fa806c39c3254b189a8` change, and cannot certify its camera/animation. Same seed, normal speed and dimensions are insufficient to prove source-aligned events.

New-source 60-second+ matched baseline/candidate ascent, danger and complete authentic ending/restart remain **NOT EVALUATED**. No independent fresh-context randomized critic had access to watch the new full-motion clips, so independent votes remain LOOKS 0/5, FEELS 0/5, PLAYS 0/5. The separate worker/browser workspace connection reported `NOT_FOUND: Tunnel-client has not been seen for 300 seconds`. No actual supported-device frame-time p50/p95/p99, memory, full deterministic replay or screen-reader/mobile accessibility acceptance was measured.

## Independent criticism and next action

**P1 experience risk (unverified):** The shot warning lasts only eight source ticks. In a narrow portrait action scene, the exterior camera may still be late, or moving toward the guardian may conceal a safe landing. A source-based camera target does not prove pixel-raster occlusion. Compare real **state-matched** camera/guardian/shot/deck visibility at attack windup, actual fired projectile, collision and recoveries; reject any climb that trades safe route visibility for a fleeting spectacle. Also inspect the complete outcome/restart sequence in continuous real gameplay.

A fresh independent five-reviewer blind randomized comparison across **all three complete scenarios**, plus hardware frame-time and accessibility/replay guardrails, is required for a quality verdict. Until then `transformation.json` must stay **NOT EVALUATED**, and PR #68 remains draft, open, unmerged and undeployed. Keep this same initiative active; do not rename a small patch as a successful Gauntlet round.
