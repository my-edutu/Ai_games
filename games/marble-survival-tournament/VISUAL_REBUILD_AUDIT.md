# Visual Rebuild Audit

Date: 2026-09-15
Branch: `agent/marble-survival-physics-rebuild`
Target: `games/marble-survival-tournament`

## Baseline recovered

The prior Marble implementation was recovered from `feat/game-7-premium-marble-2026` and copied into the new target directory without depending on that branch at runtime. The recovered authority already contained seeded arena generation, a deterministic fixed-point collision solver, marble-to-marble contacts, bumpers, sweepers, wind zones, hazards, elimination/qualification rules, five tournament stages, sanitized presentation snapshots, and bounded camera directives.

The recovered public gameplay view was a Canvas 2D renderer with a large broadcast dashboard. It did not satisfy the requested 2.5D/3D spectacle bar.

## Current classification

| System | Status | Evidence |
| --- | --- | --- |
| Seeded tournament authority | PASS | Existing deterministic runtime preserved under `src/`. |
| Spawn/arena validation | PASS | `validateMarbleArena` retained; deterministic fallback arena retained. |
| Marble collision physics | PASS | Existing fixed-point solver retained and tested. |
| 3D spatial presentation | PASS (code) / NOT_PROVEN (browser) | `arena3d.js` uses Three.js `WebGLRenderer`; browser capture still required. |
| Rolling marble orientation | PASS (code) | Rotation is derived from spatial displacement and marble radius. |
| Shadows/contact cues | PASS (code) | Directional shadow map, cast/receive shadows, raised track contact geometry. |
| Moving machinery | PASS | Authoritative sweepers map into moving 3D machinery. |
| Bumpers / pits / blocks | PASS | Authority geometry receives dedicated 3D forms. |
| Multiple visual arena themes | PASS (code) | Neon Circuit, Industrial Factory, Ice Lab, Sky Temple, Volcanic Forge. |
| Cinematic camera | PASS (code) | Overview, cut-line, danger, finish, victory presentation modes. |
| Collision/elimination VFX | PASS (code) | Semantic events drive bounded pooled effects. |
| Compact HUD / clean feed | PASS (code) | Gameplay-first overlay plus `?clean=1` clean feed. |
| Accessibility | PARTIAL | Reduced-motion and color-independent geometric patterns implemented; independent accessibility review not run. |
| Surface-specific authoritative material physics | PARTIAL | Collision/restition/friction exist; named per-surface zones are not yet authoritative. |
| Full 3D gravity/rigid-body authority | NOT IMPLEMENTED | Authority remains deterministic 2D fixed-point physics by design; 3D elevation is presentation depth. |
| Spatial/environment audio | PARTIAL | Existing semantic WebAudio cues preserved; full spatial surface audio pass remains incomplete. |
| Replay presentation | MISSING | Authority state is replayable, but event replay shots are not implemented. |
| Browser screenshots/video | NOT_PROVEN | Must be captured from a successfully launched candidate; concept art is not accepted. |
| Long-session/endurance | NOT_PROVEN | Requires runtime evidence. |

## Isolation evidence

Repository comparison against `main` shows no changes under Eko Street Run, Infinite Tower Climb, AI Ant Colony, AI Maze Escape, or other active game directories. Repo-level changes are limited to TypeScript inclusion, the pinned Three.js dependency, and Marble scripts.

## Baseline screenshot

NOT_PROVEN in this connector session. The prior source implementation is code-proven Canvas 2D, but no fabricated screenshot is recorded.

## Acceptance stance

This audit deliberately separates code evidence from runtime/browser evidence. Any item requiring a live browser, screenshot, video, FPS measurement, endurance, or independent review remains incomplete until such evidence exists.
