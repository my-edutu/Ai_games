# Infinite Tower Climb — source-bound guardian relay and contact camera

**2026-11-03 · Draft PR #68 · SAME whole-game transformation · Quality: NOT EVALUATED**

## Actual source and gap

The baseline stays pinned at `1731b380851162741761c5569e2bc152a0869ca9`. Existing desktop/portrait normal-speed videos contain real climbing, guardian danger and outcomes, but portrait samples frequently omit the actual exterior lock while the guardian remains active. The **latest previous-source** [real video workflow 41573058223](https://github.com/my-edutu/Ai_games/actions/runs/41573058223) completed all nine jobs at candidate `1c147b4` (actual desktop and portrait WebM with source state); [quality contract workflow 41573334029](https://github.com/my-edutu/Ai_games/actions/runs/41573334029) passed at `6d65563`. Neither is a video or quality verification of this relay change.

## Integrated real-game continuation

The current guardian already mechanically drives an exterior cap seal, with real source HP, advancing fixed ticks, the same cap's anchor and optional audio. Its actual gate is often beyond the phone crop. The added original bronze **eight-tooth clutch sits on that same gantry beside the enemy** and retracts tooth by tooth when the guardian's actual HP falls. Remaining engaged teeth use amber bronze; released teeth expose a contrasting pale alloy **and physically shorten/retract**, so the release is understandable without color or textual overlays. The existing camera can favor a view including this nearby live mechanism **only after it meets the existing hard conditions: full guardian, legible hero and clear exterior core rays**. The same pure source point positions the render effect and camera. Renderer diagnostics expose actual projected NDC and sightline but make no claims of raster visibility.

Implementation preserves fixed-step simulation, immutable snapshots, seeded replay, true damage/death and restart, projectile physics and collision, a clean HUD, audio opt-in and normal reduced-motion behavior. One bounded instanced mesh (8 teeth; one extra draw), no new full-screen work, shadows, textures, new API, or storage. Stale, result, restart and GPU disposal clear the mechanic. Focused Three.js source geometry, damage, restart and cleanup tests accompany the change. These are **engineering safety checks only**, not an acceptance vote.

## Acceptance still open

The candidate is not source-pinned in normal-speed WebM yet. Observe actual 60+s matched seed, viewport, graphic tier and 3 scenarios baseline/candidate on desktop/phone, align by authoritative encounter state, and inspect face, telegraph, clutch/gate and real outcome together. Five genuinely independent fresh-context blinded full-motion critics must separately prefer the candidate >=4/5 on LOOKS, FEELS and PLAYS; 0/5 exist so far. A detached workspace tunnel prevents critic workers/browser capture here. Supported-device p50/p95/p99 frame-time and memory, accessibility, deterministic replay and recovery need verification. No AAA, FPS, PASS, deployment or merge claim.
