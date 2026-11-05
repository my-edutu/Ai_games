# Infinite Tower Climb PR68 — source-earned guardian defeat → readable physical ascent

**Date:** 2026-11-05  
**PR:** [#68](https://github.com/my-edutu/Ai_games/pull/68), draft on `feat/tower-transformation-gauntlet-20261101`.  
**Frozen baseline:** `1731b380851162741761c5569e2bc152a0869ca9` — not moved.  
**Transformation verdict:** **NOT EVALUATED**. This is connected playable-source work, not an independently verified Gauntlet round.

## Systemic experience gap

The original real guardian encounter had source-earned damage, a physically traversable bronze exit and floor-nine continuation. However, at the decisive blow, the old-floor view displayed the suddenly inactive enemy and open door while the **physical defeated-armor response was delayed until the next floor**. The cinematic hierarchy and clockwork foreground also reverted to normal ascent when the guardian stopped being active, making the victory-to-exit movement visually inconsistent on a narrow portrait screen. A viewer could miss the physical consequence of a genuine victory.

This continuation makes **one source-earned visual sentence** across the old guardian, broken armor, opened gate and real continued ascent. It does **not** change fight probabilities, enemy health, authority, route decisions, floor advance or result.

## Actual 3D implementation

1. [Source-earned collapse](https://github.com/my-edutu/Ai_games/commit/21e86e6c64de5a6bd3b9e54f2c12abaa18115d31): the existing 12-piece, single-draw, no-shadow guardian armor now falls at the actual inactive zero-health guardian position **before** physical gate crossing, only when the authoritative cap and dead body are present. On floor advance it retains its elapsed motion, rather than replaying the defeat. A duplicate/stale source packet does not grant another death.
2. [Earned clearance hierarchy](https://github.com/my-edutu/Ai_games/commit/a84a7554e67531e93074c9c2583a69aadb46f1b2): present, nearby inactive zero-health guardian **and** same-floor cap preserve atmospheric/clockwork action readability through the exit; live source-active shutters still take priority. Unrelated dead foes, missing caps, restart, stale transport and new floors cannot fake the cue.
3. [Continuous physical camera acknowledgment](https://github.com/my-edutu/Ai_games/commit/087ef572904467362db715fbb103c03619d5fab3): the already-owned exterior gate camera briefly shares its focus with the true old-floor fallen body and then, based on actual elapsed fall and physical proximity, returns to the source-observed open door. The existing guarded actor-framing and portrait recovery remain the final acceptance veto, and reduced motion uses still presentation.
4. Safety contracts: [guardian passage](https://github.com/my-edutu/Ai_games/commit/27149218e078490724fd4d3fe7fdfdf82a0c3bd4), [scene hierarchy](https://github.com/my-edutu/Ai_games/commit/419e0701972609ace23aac18f6e1646654090b47) and [source-transition regression](https://github.com/my-edutu/Ai_games/commit/702ad8410c44728ba6638edf52adb10c273ebfe0). These are engineering vetoes, not user-quality evidence.

## Source and replay boundaries

Only the existing published frozen `runToken`, `floor`, `tick`, `platforms`, `enemies`, `player` and original `pointFor()` geometry are consumed. Neither a fake guardian victory nor a predicted traversal is permitted. Instanced meshes and existing camera resource are reused; `defeatFocus` is a reusable vector. The 20Hz authoritative simulation, hit detection, seeded streams, input, privacy, audio opt-in and HUD remain untouched. `clear()` and graphics disposal still own the pieces and their transforms. A physical falling-armor cue has no collision box and no shadow light.

The new direct Node safety tests are committed but were **not executed in the disconnected local workspace**. The current exact-head GitHub Actions [quality-contract workflow](https://github.com/my-edutu/Ai_games/actions/runs/42070590850) was in progress at inspection; its final result must be confirmed rather than assumed. Previous [quality run for older source](https://github.com/my-edutu/Ai_games/actions/runs/42066993932) passed but cannot validate this change.

## Authentic motion evidence, not a claim of improvement

- Frozen before source: `1731b380851162741761c5569e2bc152a0869ca9`.
- Earlier candidate `76f611470f56668a016898234429dfeca715a938`: [source-pinned full-motion capture](https://github.com/my-edutu/Ai_games/actions/runs/42066993923), real 960×600 and 390×844 baseline/candidate scenarios with source traces. The run was still in progress at inspection; it **precedes these changes**.
- Latest 3D implementation source `087ef572904467362db715fbb103c03619d5fab3`: [new original-host capture](https://github.com/my-edutu/Ai_games/actions/runs/42070503927) queued/pending at inspection. Successful video encoding or individual Actions jobs cannot establish matched combat events, readable full-motion victory, no serious regressions, or better feel.
- Settings retained: `tower-transformation-capture-v1`, low quality, full-motion normal-speed 20Hz simulation with WebM, 960×600 desktop and 390×844 portrait, sound disabled and no reduced motion. The sound-off film cannot demonstrate optional audio experience.
- The prior [`3133f919` capture](https://github.com/my-edutu/Ai_games/actions/runs/42055939880) ended **failure** because the separate authentic-ledge geometry fixture could not resolve its local scene-hierarchy import; the newer branch already repairs those fixture dependencies. Eight individual playback capture jobs succeeded on the older source, not the latest source.

## Missing independent acceptance

**LOOKS: 0/5 genuine blind judgments collected; FEELS: 0/5; PLAYS: 0/5.** The required fresh-context independent video critics and local browser currently cannot run: the app's worker/browser tunnel reports disconnected. No direct supported-device frame-time p50/p95/p99, GPU timing or memory was measured. Existing CI browser software WebGL render intervals are not real-device frame times. The original before/after episodes are not yet verified as event-matched 60-second pairs of everyday ascent, guardian/crusher stakes and a complete authentic result/restart.

**Biggest open gap:** A **source-pinned, normal-speed continuous** desktop *and* portrait viewer-visible defeat → opened gateway → actual foot traversal → floor-nine ascent → complete result/restart, in fair event-matched baseline/candidate videos, examined blind by at least five genuinely independent critics on each of LOOKS/FEELS/PLAYS. Require ≥4/5 candidate preference in every pillar, no major regressions, source replay and accessibility, device performance budgets. Do not declare PASS before that.

**Spec-compliance review:** The source/death/cap/replay gating and no-authority changes follow the [approved transformation design](../superpowers/specs/2026-11-01-infinite-tower-transformation-gauntlet-design.md). **Quality review:** This code is promising but is NOT proof that the resulting game looks, feels or plays better; new complete footage and independent judgment remain blockers.

**Rollback:** Revert the isolated guardian-passage, scene-hierarchy and test commits if footage exposes camera crop, double geometry or missing presentation after restart. Do not reset the frozen `1731b380` comparison. **Integration:** PR68 remains draft, PR58 unmodified; no merge, force push or deployment. Preserve the ongoing transformation between hourly runs.
