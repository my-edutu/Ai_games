# Infinite Tower Climb PR #68 — source-real hostile flight within the same 3D guardian/crusher transformation

**Date:** 2026-11-05  
**Playability source:** [`80222229f234a265dc417ec68515a9df295504e5`](https://github.com/my-edutu/Ai_games/commit/80222229f234a265dc417ec68515a9df295504e5)  
**Frozen comparison:** `1731b380851162741761c5569e2bc152a0869ca9`, unchanged.  
**Quality:** **NOT EVALUATED**; this is NOT a Gauntlet victory.

## Whole-experience problem being addressed

Genuine source footage had shown the guardian duel and urgent upper-cap crusher often hard to follow on a narrow phone view. Prior work established physical guardian counters, a source-authentic crusher vs already-fired bolt priority policy, visible jaws, portrait camera safety and an earned physical bronze exit. The remaining initiative is ONE continuous legible guardian fight -> real gateway -> floor nine -> outcome/restart; do not split this into success badges for patches.

The 3D exterior guardian shot stage previously depicted a telegraphed attack and a *player* shot, but the warning vanished when an **already-fired enemy bolt** was the real immediate threat. The picture could therefore lose continuity exactly as the autonomous climber made the new real-bolt versus crusher safety decision.

## Implementation — same running game, no new spectator UI

- `guardian-shot-stage.mjs`: `observedNearbyGuardianCrossfire` checks actual enemy-owned projectile coordinates/direction, body height, living nearby guardian, current tick/run/floor, and rejects passed/departing/distant/dead/stale sources. **The public projectile has no owner-enemy ID:** the visual co-location is explicitly NOT proof that this guardian fired the shot.
- The existing single instanced forged metal warning stage reuses unused slots (maximum four additional low-tier instances) to show a physically positioned wake **behind the current bolt**, from no more than an already-travelled single source tick. No drawn future collision or predicted impact, extra draw/geometry, new flashing HUD or new audio.
- `scene.mjs`: the same source-observed 3D camera can now stage a real living guardian and real already-fired hostile projectile, including a genuine aerial exchange while protecting the committed physical landing. No cuts, authority manipulation, safe-route promise or solver rewrite.
- `tests/phase3/tower-guardian-live-crossfire-stage.test.cjs`: three source/scene contracts for observable flight, 3D slot reuse, deterministic repeat, stale cleanup, rejection of false sources and aerial camera/landing safety. Added but **not locally executed** because the independent worker tunnel is unavailable.

## Safety / resources / rollback

Simulation tick, seeded RNG, hitboxes, damage, source snapshot checksum and historical replay were not changed by this view/presentation patch. Camera proposal remains bounded and core-clear; source stages reset on stale/restart and are disposed with existing scene. No new network, PII, input control, provider or secrets. Reduced-motion and muted modes retain their existing contracts. Three.js metal instancing reuses the existing draw and materials; no measured target-hardware frame time or memory yet. To roll back the source/3D continuation without altering PR #58, revert `80222229f234a265dc417ec68515a9df295504e5` on PR #68, retest and preserve the frozen baseline.

## Verification and remaining vetoes

Earlier source-pinned real-video [nine-job capture](https://github.com/my-edutu/Ai_games/actions/runs/42042347997) completed for **older** source `450e90c8`; it cannot show this newly submitted feature. This head's [normal-speed source-pinned desktop/portrait capture](https://github.com/my-edutu/Ai_games/actions/runs/42047022845) and [quality-contract check](https://github.com/my-edutu/Ai_games/actions/runs/42047023014) were **in progress** at review. Neither independently reviewed this source or verified the newly added Node test. A green integrity check must never be counted as a gameplay-quality win.

Required: compare at least 60s normal-speed matched baseline/candidate ascent, danger, outcome/restart in both layouts, same frozen baseline, seed and tier, source-proven authentic physical guardian victory and gateway crossing, run full engineering/replay/accessibility/safety checks, measure supported-device frame-time p50/p95/p99 and memory, have **five independent fresh-context blind whole-film reviews per LOOKS, FEELS and PLAYS**, at least 4/5 candidate preferences **in each**. No evaluations are yet collected (0/5 each). The separate browser/worker tunnel returns `NOT_FOUND: Tunnel-client has not been seen for 300 seconds`. Thus verdict is **NOT EVALUATED**. Leave PR #68 open/draft, PR #58 untouched; no merge, deployment or force-push.

## In-flight crossfire capture extension — same open vertical slice

**New complete live-source SHA:** [`f13b29f8c5af88b639f4a472d0f9124cce3df73e`](https://github.com/my-edutu/Ai_games/commit/f13b29f8c5af88b639f4a472d0f9124cce3df73e); 3D gameplay scene SHA [`80222229f234a265dc417ec68515a9df295504e5`](https://github.com/my-edutu/Ai_games/commit/80222229f234a265dc417ec68515a9df295504e5).

The 50ms read-only danger witness in `tests/browser/tower-live-motion.spec.cjs` formerly required `guardian.telegraph === true`. That excluded the crucial **post-telegraph enemy bolt already in flight** during crusher activation. It now also witnesses a real enemy projectile approaching the live climber in the living guardian's physical corridor, even when the guardian is no longer charging. It can retain observations with a live bolt and no presently charging shutter; this prevents false claims that every bolt overlaps a crusher. Genuine simultaneous active/charging shutter samples are recorded separately. The original source host keeps running at normal speed in the native browser WebM.

`scripts/tower-crossfire-evidence.cjs` computes unique per-source-tick live bolt counts and genuine bolt+shutter overlaps. It only counts a **source-matched 3D rendering witness** if the currently observed renderer diagnostics report the *identical source tick*, projectile ID and a nonzero existing 3D marker instance count. A renderer from a stale tick is explicitly rejected. This cannot show whether pixels are truly readable in a WebM, cannot attribute a shooter, does not imply safe or successful combat and never contributes to LOOKS/FEELS/PLAYS voting. Added deterministic source-witness tests cover duplicates, stale/wrong matching IDs and absent physical instances; live Node execution remains blocked by the worker tunnel.

The new [exact-source normal-speed film](https://github.com/my-edutu/Ai_games/actions/runs/42048061695) and [quality integrity workflow](https://github.com/my-edutu/Ai_games/actions/runs/42048061762) are pending at last inspection. No new real-motion inspection, outcome validation, 5-critic judgments, supported-device tail performance or promotion has happened. The correct headline remains **NOT EVALUATED**. PR #68 stays open/draft, PR #58 and the original hourly schedule untouched.
