# D04 — Reset only occupied GPU instances; preserve true combat cleanup

**Date:** 2026-11-12. **State:** IN PROGRESS / real combat A/V NOT ACCEPTED.
**Isolated branch:** `feat/dungeon-d04-combat-feedback-realism-20261108`.
**Frozen BEFORE:** `281735d0910c6b2443648af976003d50412ee324`.
**Acceptance:** `docs/handoffs/D04_Real_3D_Preview_Acceptance.md`.
**Rollout:** old `/dungeon` spectator stays default; D04 remains `?feedback=d04`. No merge to main or PR #49.

## Genuine observed blocker, and why this is only a local increment

The completed pre-change real Chrome trial [43286384940](https://github.com/my-edutu/Ai_games/actions/runs/43286384940) passed five real browser cases but failed the strict genuine-HP-loss test with `AUTHENTIC_DAMAGE_NOT_VISUALLY_ADMITTED`. The same run captured continuous real-authority WebGL stalls **even with no recorder and with legacy rendering**, so neither D04's GPU buffers nor a MediaRecorder is proven to cause the dominant delay. Previously preserved real Dungeon WebMs encode eight desktop VP8 frames (max gap 5.707s) and nine 390px mobile frames (max gap 4.658s). These are older unaligned A/V recordings, not proof of sword contact, audible impact or a submitted-frame synchronization pass.

On code inspection, one narrower D04-owned wasted update was provable: `reset()` rewrote **all 102** retained instance matrices and marked all seven buffers dirty, including every pool with **zero live slots**. This can happen on explicit restart/floor teardown, and repeated cleanup did the same work after the first clear. Since every new instance starts hidden and ordinary slot retirement hides its own matrix, empty slots cannot require another hide write.

## Contract and production change

- Test-first [86f2660](https://github.com/my-edutu/Ai_games/commit/86f2660129d16ce335d2aef393dfeb7390f29f85) adds a real production-module adapter contract to `tests/foundation/dungeon-d04-held-warning-gpu-update.test.cjs`: empty reset writes **zero** instance matrices; a single admitted authoritative Warden warning resets **one occupied** signal instance and dirties only that pool; another empty reset writes **zero** and preserves all pool visibility/cleanup/instance caps. The full CI contract run [43297366351](https://github.com/my-edutu/Ai_games/actions/runs/43297366351) observed the expected regression failure (`223 passed / 1 failed`) specifically at the new empty-reset invariant.
- Implementation [2de8020](https://github.com/my-edutu/Ai_games/commit/2de8020c43cf2a79d60e3502b172e511863ac7ef) changes **only** `public/ai-dungeon/physical-feedback-visuals.js` `reset()`: for each pool, clear the matrix and slot only when occupied; mark the pool instance matrix dirty if any occupied slot was retired; always hide its mesh and clear active counts and warning chronology. `dispose()` still calls `reset()` before freeing each geometry/material and removing its mesh from the scene. No new meshes, buffers, per-frame timers, audio nodes or particles.
- Corrected [CI 43297533222](https://github.com/my-edutu/Ai_games/actions/runs/43297533222) contracts and production build: **224/224 native tests passed**, build succeeded. At writing, the separate *genuine Chrome* job is running, so no new real-media proof or strict acceptance pass is claimed.

The test adapter observes exact JS `setMatrixAt` calls and `instanceMatrix.needsUpdate`; it does **not** observe WebGL buffer transfer bytes, GPU duration, video frames or PCM starts. The expected reduction when resetting an empty D04 scene is **102 unnecessary matrix writes avoided and seven unnecessary dirty flags avoided**, not an independently measured real-world frame-time saving.

## Specification and engineering review

**Specification:** Only the D04 public feedback visual module and D04-owned regression are changed. No authority, world/camera/lighting/rig/HUD/master soundstage changes. The reset keeps all slots empty, all meshes hidden and `active=0`, while clearing the warning provenance map. Every *live* effect is explicitly erased, so an impact or warning cannot reappear after restart. Legacy rendering and opt-in routing are not modified. Impact effects remain HP-loss-only; no inferred attacker; no swing-as-hit or inferred projectile contact.

**Quality:** The existing bounded seven pools and 102 reserved instances remain constant; this reduces proportional matrix writes from an unconditional 102 per reset to **the count of occupied slots** (0–102). It does not add an unbounded cache or assume a GPU readback. Audio consent/mute, WebAudio interruption and original 400ms sound staleness barrier are unchanged; reduced-motion/flash, frame-receipt gating and deduplication remain unchanged. The visual `advance()` telemetry still excludes reset writes and must not be interpreted as a full GPU cost profiler.

**Rollback:** On this isolated branch only, revert production commit `2de8020` and its focused test `86f2660` if an independent reviewer finds an occupied-slot cleanup regression. Do not rebase, force push, merge main or touch PR #49.

## Next dominant weakness and incomplete acceptance

The multi-second genuine WebGL submission delay remains the dominant observable blocker for timely real HP-loss response, and was also seen without D04 rendering. The next D04-owned action should correlate any remaining D04 dirty-pool work and exact submitted-frame receipts with continuous real gameplay in controlled warm/cold runs, but may **not** alter shared renderer, camera, character rigs, authoritative game logic or the 400ms deadline to manufacture a pass.

Outstanding: real before/after matched three viewpoints, 1440×900 plus 390×844 moving clips, Warden warning/release/recovery/earned counter, miss/block/dodge/projectile/spell/verified impact sequences, decoded original Opus/PCM onset matched to actual WebGL submissions, opt-in and reduced-mode browser playback, WebGL recovery and 20-minute active-effect cleanup soak. **Do not claim production, complete physicality or Diablo-IV parity.**
