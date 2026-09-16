# Infinite Tower Climb — Visual Rebuild Audit

Date: 2026-09-15
Branch: `agent/infinite-tower-2-5d-rebuild`

## Baseline truth

The authoritative game was materially stronger than its public presentation. The simulation already contained deterministic chunk generation, seeded themes, moving platforms, hazards, enemies, guardians, projectiles, pickups, AI intent, health, stamina, shields, builds, restart/recovery, persistence and presentation snapshots. The public browser view reduced those systems to a flat grid with rectangles/circles and a dashboard-heavy shell.

The rebuild therefore preserves authority and replaces/extends the experience layer. No code under `games/eko-street-run/**` is part of this work.

## Subsystem classification before rebuild

| Subsystem | Baseline | Evidence / finding |
| --- | --- | --- |
| Runtime / lifecycle | PASS | Autonomous runtime, terminal/intermission and restart behavior already exist. |
| Seeded floor generation | PASS | Deterministic chunk generator with platform/hazard layouts. |
| Autonomous AI | PASS | Observation/policy/stuck recovery are game-owned and preserved. |
| Physics / collision | PASS | Fixed-step movement, jump/dash/fall and platform collision already authoritative. |
| Combat / guardians | PASS | Sentinels, shooters, guardians, telegraphs and projectiles already authoritative. |
| Progression / builds | PASS | Upgrade offers/build tags and score progression already exist. |
| Persistence / replay | PASS | Snapshot/replay infrastructure already exists. |
| Public render snapshot | PASS | Immutable privacy-safe presentation snapshot separates authority from rendering. |
| Camera | PARTIAL | Smooth vertical follow and danger impulse existed; horizontal/hazard/guardian framing was limited. |
| Climber presentation | PLACEHOLDER | Single glowing rounded rectangle. |
| Enemy presentation | PLACEHOLDER | Colored rectangles; guardian was only a larger color-coded block. |
| Platforms / architecture | PLACEHOLDER | Flat filled rectangles with no architectural depth. |
| Hazards | PLACEHOLDER | Flat filled rectangles with no hazard-specific silhouette. |
| Environmental depth | MISSING | No parallax, foreground occlusion, structural scale or atmospheric perspective. |
| Character animation | MISSING | No articulated body or movement-correlated pose. |
| VFX | PARTIAL | Danger vignette only; no bounded world-space effects. |
| Audio | PARTIAL | Semantic audio/caption director existed, browser had no game-audio synthesis/playback. |
| HUD | PARTIAL | Functional, but occupied a permanent large side dashboard. |
| Browser evidence | PASS/PARTIAL | Playwright captured desktop/mobile/clean-feed but did not prove diverse gameplay moments. |
| Long-session performance | PARTIAL | Entity caps/replay caps existed; public effects required explicit budgets. |

## Rebuild decisions

1. Preserve the deterministic authoritative simulation.
2. Keep presentation snapshot read-only and privacy-safe.
3. Use the existing Canvas2D browser architecture for this increment rather than add a new WebGL dependency that would increase bundle/runtime risk without asset infrastructure to justify it.
4. Create 2.5D through layered perspective, extrusion, scale, occlusion, parallax, lighting cues and articulated silhouettes.
5. Make gameplay full-viewport and HUD overlay-only.
6. Bound presentation particles at 96 and keep effects presentation-only.
7. Extend the camera director to frame velocity, hazards and guardians.
8. Expose AI route choice through a subtle world-space route cue and character/camera behavior rather than relying only on text.

## Known evidence limitation

This chat runtime cannot clone GitHub or host the browser locally because outbound GitHub DNS/network access from the container is unavailable. The repository's GitHub Actions pipeline is therefore the executable verification source for build/tests/browser screenshots. Production readiness must remain incomplete until those remote checks and captures are inspected.