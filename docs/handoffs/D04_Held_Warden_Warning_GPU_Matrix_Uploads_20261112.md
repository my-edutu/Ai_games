# D04 — Held Warden warning: avoid reuploading an unchanged GPU matrix

**Date:** 2026-11-12. **Status:** incremental D04-only optimization; combat realism **NOT ACCEPTED**.  
**Review branch:** `feat/dungeon-d04-combat-feedback-realism-20261108`.  
**Frozen BEFORE:** `281735d0910c6b2443648af976003d50412ee324` (does not have the D04 visual-pool implementation).

## Evidence-driven defect and scope

The latest completed genuine continuous Dungeon/Three.js run [43256252018](https://github.com/my-edutu/Ai_games/actions/runs/43256252018) still failed exact HP-loss visual admission, while matched live authority samples reproduced multi-second WebGL calls even without a MediaRecorder. This does **not** prove the D04 pools caused the stalls. Its recordings were too sparse to establish real impact-to-sound alignment.

A narrower, directly inspectable D04 GPU inefficiency was found in `public/ai-dungeon/physical-feedback-visuals.js`: a Warden warning cell retained while its *actual current public warning footprint* remains valid freezes at `slot.life * .35`. The old `advance()` still transformed and rewrote every static warning slot in every subsequent frame and marked `instanceMatrix.needsUpdate` even when its origin, scale, rotation and age were unchanged. This was avoidable work on the D04-owned retained instanced visual pool. The retained warning itself must remain visible and promptly disappear on genuine cancellation or changed authority.

## Implementation

- New focused contract `tests/foundation/dungeon-d04-held-warning-gpu-update.test.cjs` exercises the **production** physical visual stage with an instrumented minimal Three.js adapter and a valid unique Warden's three-turn public warning. It asserts that repeated validated frozen frames do not rewrite GPU instances, that the danger marker stays visible and live, and that cancellation still clears the matrix and hides the pool.
- Register this contract in the **isolated D04** CI workflow's native suite.
- In the real visual stage, revalidate the complete live Warden warning against the current authoritative snapshot **on every frame**, then skip only a held warning's unchanged matrix upload after its mid-beat age freezes. The ordinary animated Warden onset, its lifecycle/cancellation, other signal beats and every other visual pool keep the old update path.
- No change to authoritative gameplay, the encounter clock, cue planner, soundstage, WebAudio consent/mute, output epochs, the 400ms sound deadline, reduced-motion/flash parameters, replay semantics, rigs, global rendering, camera, lights, or normal spectator route.
- Existing seven draw-call pool budget, 102 reserved instances, 32 pending cues, 32 awaiting-frame sounds and 64 bounded receipts remain unchanged. No new audio node, texture, geometry or shader.

## Verification record

1. Test-only commit: [3d78dd9](https://github.com/my-edutu/Ai_games/commit/3d78dd9b1bbc3b48582e35f039416685585f9e9c).
2. D04 CI registration: [b65eb1c](https://github.com/my-edutu/Ai_games/commit/b65eb1ca30db25f63e1241b0ec402f19eff3e708).
3. Source correction: [0e42cda](https://github.com/my-edutu/Ai_games/commit/0e42cdaa0e173d1e923752b1c52d0a65349e4f42).
4. The [test-before-implementation run 43266504165](https://github.com/my-edutu/Ai_games/actions/runs/43266504165) was **cancelled while queued** when the same-branch CI concurrency policy superseded it. A red test execution was therefore **not observed**, despite the test being authored before the fix. Do not claim a completed red-green cycle.
5. [Post-change CI run 43266894918](https://github.com/my-edutu/Ai_games/actions/runs/43266894918) was **queued at initial inspection**. Its eventual native, build and real Chrome results require independent verification. No fresh on-device graphics improvement or synchronized sound outcome is claimed here.

For prior genuine media only: archived desktop original WebM decoded eight frames with one 5.707s interval; archived 390px mobile original WebM decoded nine frames with one 4.658s interval. These are real *pre-change* canvas recordings, **not** this patch's tested playback or evidence of reliable A/V alignment. An original waveform or encoded Opus packet alone does not prove blade-to-impact sync.

## Specification review

A Warden ring remains grounded only in the original uniquely owned warning and its exact currently live authority footprint. This change **cannot** infer a hit, attacker, warning, target, earned counterattack or damage from visual proximity. It retains the current safety behavior: cancelled warning slots retire; silence is mandatory without fresh sound opt-in and a timely real submitted frame.

## Engineering quality review

This removes at most one redundant matrix write per static warning instance, and an update-flag flip per held signal pool per frame. Up to eight signal instances may be retained; effects and memory remain bounded. It is a *local avoidance of unnecessary uploads*, **not** proof of faster p95/p99 real-combat WebGL rendering or a resolution of the existing multi-second stalls. The diagnostic contract is a Three.js adapter-level write/visibility assertion; it is **not** a real GPU benchmark or actual moving A/V preview.

**Rollback:** revert the source commit `0e42cda`, CI registration `b65eb1c`, and test commit `3d78dd9` on the isolated D04 branch only. Do not merge or modify main or Draft PR #49.

## Remaining first failing acceptance

Genuine live HP-loss visual delivery within the original 400ms window remains the dominant real-game blocker. Profile the D04 pools' real `bufferSubData`/render-submission costs against matched, continuous combat while retaining every outlier, then pursue only demonstrably D04-owned costs. Three matched viewpoints on desktop and 390px mobile, full Warden warning/release/recovery/earned counter and restart, authentic missed swing/block/dodge/projectile/spell, decoded contact/audio onset and 20-minute resource soak still require original evidence.
