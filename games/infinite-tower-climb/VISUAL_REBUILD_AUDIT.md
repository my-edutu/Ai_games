# Infinite Tower Climb — Visual Rebuild Audit

Baseline: `main@e4a5f67d5ba8eb3bc38f9643ed4e23a77278eaf6` (2026-09-15). Scope is strictly `games/infinite-tower-climb/**`, `public/infinite-tower-climb/**`, Tower-owned tests/scripts/docs. `games/eko-street-run/**` is read-only.

## Verified baseline

| Subsystem | Status | Evidence / decision |
| --- | --- | --- |
| deterministic runtime/restart | PASS | `TowerRuntime` uses seeded `NamedRng`, explicit lifecycle, intermission and restart. Preserve. |
| autonomous AI | PASS | policy/observation loop drives authoritative actions and publishes intent. Preserve. |
| floor generation | PARTIAL | deterministic platforms, hazards, moving platforms and five themes exist; spatial composition is mechanically useful but visually generic. |
| physics/collision | PASS | acceleration, friction, gravity, jump, dash, one-way/solid collision and moving-platform inheritance exist. Preserve authority; improve presentation weight. |
| guardians/enemies | PARTIAL | authoritative sentinel/shooter/guardian combat exists; presentation is rectangles. |
| progression/upgrades | PASS | floor progression, checkpoints, upgrade offers/build tags and guardian cadence exist. |
| persistence/replay safety | PASS | bounded immutable public snapshots and replay window exist; presentation cannot mutate authority. |
| camera | PARTIAL | vertical smoothing, speed zoom and danger impulse exist; no broadcast modes, guardian reveal, fall/recovery framing or horizontal focus. |
| audio direction | PARTIAL | cue/caption/music-state metadata exists; browser produces no audible game sound. |
| HUD | PLACEHOLDER | large top/side/footer dashboard consumes gameplay space. |
| renderer | PLACEHOLDER | Canvas 2D grid, filled rectangles/circles and a rounded rectangle player. |
| climber presentation | PLACEHOLDER | no humanoid silhouette or animation state machine. |
| environment art/depth | MISSING | no background/midground/foreground separation, perspective, fog, occlusion, lighting or shadow system. |
| VFX | MISSING | `MAX_PARTICLES` constant exists but there is no particle/VFX implementation. |
| visual milestones | MISSING | no cinematic floor milestone presentation. |
| browser visual evidence | PARTIAL | Playwright captures desktop/phone/clean-feed but does not exercise the required seven gameplay situations. |
| performance evidence | PARTIAL | entity/replay caps exist; no renderer frame-time/object-pool report. |
| build/test automation | PASS | CI runs build, all tests, Tower self-test, deterministic scan, validation and Playwright on `agent/**`. |

## Baseline visual finding

The current world fails the acceptance gate: with the HUD hidden it reads as a debug visualization because gameplay entities are geometric primitives on a flat grid. This rebuild will retain the authoritative simulation and replace the experience layer.
