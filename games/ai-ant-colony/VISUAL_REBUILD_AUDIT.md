# AI Ant Colony / Ecosystem — Visual Rebuild Audit

**Audit date:** 2026-09-15  
**Branch:** `agent/ant-colony-2-5d-rebuild`  
**Scope:** `games/ai-ant-colony/**`, `public/ai-ant-colony/**`, and Ant Colony-specific stream/test surfaces only.

## Executive finding

The game already has a strong deterministic simulation, immutable public render snapshot, presentation controller, bounded audience influence, persistence/recovery, semantic audio/camera derivation, and long-run/release infrastructure. The principal gap is presentation: the public view is still a dashboard-framed 2D canvas cross-section rather than a living 2.5D ant civilization.

The rebuild must preserve authority and replace only the downstream presentation experience.

## Evidence reviewed

- `games/ai-ant-colony/src/state/types.ts`
- `games/ai-ant-colony/src/generation/world.ts`
- `games/ai-ant-colony/src/presentation/snapshot.ts`
- `games/ai-ant-colony/src/presentation/camera.ts`
- `games/ai-ant-colony/src/presentation/audio.ts`
- `games/ai-ant-colony/src/presentation/controller.ts`
- `scripts/serve-ant-colony-stream.cjs`
- `public/ai-ant-colony/index.html`
- `public/ai-ant-colony/app.js`
- `public/ai-ant-colony/styles.css`
- `public/ai-ant-colony/ux-v2.css`
- Ant Colony foundation/Phase 2–6 tests and the full catalogue CI workflow.

A baseline browser capture is intentionally delegated to the repository's existing Playwright CI on this docs-only commit so the screenshot is generated from the untouched renderer rather than fabricated.

## Classification

| System | Status | Evidence / gap |
|---|---|---|
| Authoritative fixed-step colony simulation | PASS | Existing runtime/rules/state architecture is deterministic and separately tested. |
| Ant autonomous policy / strategy | PASS | Roles, tasks, intent/confidence and strategy are authoritative state. |
| Seeded world generation | PASS | Surface, soil, tunnels/chambers, food, rock, water and initial colony are generated from named seeded RNG. |
| Queen simulation | PASS | Queen health, egg count, damage and terminal survival state are authoritative. |
| Brood lifecycle | PASS | Egg/larva/pupa state exists authoritatively. |
| Food / water economy | PASS | Stores and world food are authoritative; ants expose carried food. |
| Tunnels / excavation rules | PASS | Dig tasks and authoritative tile mutations already exist. |
| Pheromone fields | PASS | Home, food, alarm and excavation fields are authoritative arrays. |
| Predators / threat | PASS | Beetle/spider entities, health, intent, threat and encounters exist. |
| Seasons / weather rules | PASS | Spring/summer/autumn/winter and clear/rain/heat/drought are authoritative. |
| Audience influence boundaries | PASS | Bounded influence state and public safety copy exist; outcomes are not viewer-guaranteed. |
| Persistence / recovery / quarantine | PASS | Existing snapshot, presentation controller and operations/release paths protect truthful recovery. |
| Public render snapshot | PASS | Deep-frozen, sanitized projection; presentation cannot mutate authority. |
| Camera semantics | PARTIAL | Semantic focus/zoom/impulse exists, but the browser camera is limited to whole-canvas transforms and does not behave like a documentary director. |
| Audio semantics | PARTIAL | Bounded semantic cues exist; final environmental soundscape and music-state layering are not present. |
| Surface biome | PARTIAL | Food, rain and predators are visible, but vegetation, debris, roots, microfauna, occlusion and atmospheric depth are minimal. |
| Soil cross-section | PARTIAL | Gradient soil + tile grid exists, but strata, roots, moisture, stones, chamber walls and depth composition are not convincing. |
| Ant visual representation | PARTIAL | Ants have three body lobes and simple legs, but remain tiny colored role markers without convincing locomotion, antennae, mandibles, LOD or behavioral animation. |
| Role readability | PARTIAL | Role color is the primary distinction; natural silhouette/behavior cues are weak. |
| Queen in-world presentation | PARTIAL | Queen is a glowing ellipse cluster at nest center; no attendants, egg-laying choreography or danger response staging. |
| Brood in-world presentation | PARTIAL | Brood is visualized as generic ovals near the queen; life stages and nurse behavior are not visibly distinct. |
| Excavation presentation | PLACEHOLDER | Authoritative tunnel cells appear, but active digging, soil transport, wall deformation, dust and progress interpolation are missing. |
| Chamber identity | PARTIAL | Chamber tiles exist but queen/nursery/storage/waste/defense identities are not visually legible. |
| Foraging presentation | PARTIAL | Carried food is visible, but food sources, recruitment routes, cooperative traffic and delivery choreography are weak. |
| Pheromone visualization | PARTIAL | Fields are drawn directly as glowing dots; no contextual/focus/debug modes or route-establishment storytelling. |
| Combat | PARTIAL | Threat/predator state is visualized, but biological bite/grapple/surround/retreat presentation is weak. |
| Weather presentation | PARTIAL | Rain lines and sky tint exist; puddles, wet soil, vegetation response, heat/drought presentation and lighting response are limited. |
| Day/night | MISSING | Day number exists but no time-of-day presentation contract or lighting cycle. |
| Seasonal presentation | PLACEHOLDER | Season label exists; biome/lighting/vegetation changes are not materially expressed. |
| Cinematic event director | PARTIAL | Semantic camera/audio derivation exists, but no bounded shot queue, dwell/cooldown logic or event-priority director in the browser. |
| Large-population visual scalability | PARTIAL | Current renderer is bounded but has no explicit near/mid/far LOD or density aggregation strategy. |
| Environmental VFX | PARTIAL | A bounded pulse effect system exists; organic dirt/dust/rain/collapse/food/brood/chamber-completion VFX are incomplete. |
| HUD | BROKEN for rebuild target | Two persistent sidebars make the experience dashboard-heavy and violate the 90% world / 10% UI target. |
| Clean feed / OBS | PASS foundation | Clean-feed and responsive support already exist and must be preserved. |
| Browser visual evidence | PASS foundation | Existing Playwright CI captures Ant Colony Phase 3 screenshots; rebuild will expand this to scenario-specific evidence. |
| Long-session visual stability | PARTIAL | Runtime reliability is strong; renderer-specific leak/LOD/particle/camera monotony evidence is insufficient. |

## Preserve — do not rewrite

1. Authoritative simulation and state ownership.
2. Named seeded randomness and replay behavior.
3. Audience influence eligibility/safety boundaries.
4. Persistence, quarantine and recovery behavior.
5. Existing result/intermission lifecycle.
6. Presentation controller stale/divergent-snapshot rejection.
7. Privacy-safe immutable public snapshot contract.
8. Existing Phase 1–6 tests unless a deliberate compatible presentation contract extension requires updates.

## Rebuild target

The stream should read as a nature-documentary-style 2.5D slice of earth: surface biome → layered soil → active tunnel network → specialized chambers → deep darkness. Ant behavior is the protagonist. HUD becomes a compact broadcast overlay, not the dominant layout.

## Stop-ship conditions

- Any presentation code mutates authoritative state.
- Eko Street Run or Infinite Tower files change.
- Viewer input can guarantee survival/death/victory/extinction.
- The HUD is necessary to understand the primary action.
- Ants still read primarily as colored dots at representative 1080p framing.
- Excavation only appears as instantaneous completed cells.
- Day/night/season/weather remain labels without corresponding world presentation.
- Browser evidence is missing or fabricated.
- Full existing Ant Colony tests regress.
