# AI Escape Room — 22-Skill Adversarial Review & Improvement Plan

Candidate branch: `agent/escape-room-2-5d-rebuild`

Review basis: current source, successful CI run 1609, runtime diagnostics, and the 15-image `ai-escape-room-phase3-capture` evidence bundle.

## Executive verdict

The rebuild has a strong deterministic simulation boundary and a genuine physical WebGL room, but it is not yet visually or experientially at the target quality bar. The evidence still reads as an engineering prototype: almost every object is built from the same cube primitive, the room is too dark, materials are flat, props float in a generic grid rather than belonging to believable surfaces, hazards are mostly a red-light state, the AI lacks a memorable embodied presence, inspection cameras feel like debug close-ups, audio is a set of oscillator beeps, and measured evidence reports about 38 FPS despite only 49 draw calls.

The next pass therefore prioritizes *readability, authored physicality, distinct puzzle silhouettes, AI presence, pacing, semantic feedback, and rendering efficiency* while preserving authoritative game truth.

## Skill-by-skill findings

| # | Skill | Verdict | Critique | Improvement in this pass |
|---|---|---|---|---|
| 1 | game-creative-direction | FAIL | The core fantasy is legible, but the room does not yet look premium or distinctive enough. The HUD and labels carry more identity than the physical space. | Introduce a four-theme physical style constitution, stronger silhouette/material language, embodied AI, authored lighting, and room-first composition. |
| 2 | gameplay-progression | PARTIAL | Multi-room restart and theme rotation exist, but within a room progress is a linear chain and milestones are mostly a percentage. | Add branching-and-merge puzzle dependency grammar, meaningful stage/milestone copy, stronger result/next-room framing. |
| 3 | difficulty-failure-balancing | PARTIAL | Timer and hazards exist, but autonomous play is nearly perfect; active hazards mostly cause the planner to wait. | Make hazard phases visually legible and increase strategic choice through concurrent eligible puzzle branches; retain rule-based causal failure. |
| 4 | procedural-generation | PARTIAL | Solvability and bounded fallback are good, but content variety is mostly shuffled puzzle types/colors. Physical placement is a generic grid. | Add deterministic presentation anchors/surfaces/variants and branching puzzle topology while preserving solver validation. |
| 5 | game-economy-rewards | N/A BY DESIGN | No economy is needed for the core Escape Room. Adding one would dilute the fantasy. | Keep the core economy-free. Reserve future audience effects for bounded optional choices only. |
| 6 | platformer-experience-review | N/A TO CORE | This is not a platformer, so platformer movement/physics rules must not be forced onto it. Camera/readability principles remain useful. | Apply camera-causality, silhouette, readability, and pacing checks only; do not add platformer mechanics. |
| 7 | game-architecture | PASS | Authoritative rules, presentation snapshot, host, and browser layers are cleanly separated. | Preserve this boundary; renderer v2 consumes safe snapshots only and cannot mutate simulation. |
| 8 | autonomous-agent-design | PARTIAL | Planner is bounded and privacy-safe, but its intelligence is visually abstract and its action selection is predictable. | Give the AI a visible probe/avatar, spatial intent, focus movement, clearer plan-change cues, and preserve stuck/fallback handling. |
| 9 | deterministic-simulation | PASS | Fixed logical progression, seeded generation, replay, and snapshot separation are strong. | Keep all new placement/layout randomness deterministic or presentation-only and isolated from authority. |
| 10 | game-physics | PASS / LIMITED APPLICABILITY | The game does not need authoritative rigid-body simulation. Current presentation geometry has no meaningful physical weight. | Use simple presentation-only spatial motion, contact shadows, grounded props, and camera-safe placement without adding an unnecessary authoritative solver. |
| 11 | game-audio | FAIL | Current audio is mostly single oscillator tones with no bus hierarchy, ambience state, or fatigue control. | Add semantic SFX hierarchy, master/ambience/SFX/danger buses, procedural ambience/noise, adaptive danger state, dedupe and mute-safe captions. |
| 12 | game-feel-vfx | FAIL | Current polish is mainly color/emissive changes and a few dust cubes. Hazards/solves lack authored anticipation-impact-recovery. | Add hazard geometry, solve pulses, practical lights, restrained particles, stronger result transition, reduced-motion support and bounded effect budgets. |
| 13 | livestream-hud | PARTIAL | HUD is clean but still resembles a dashboard and competes with the room. Hardcoded `ROOM 08` is incorrect. | Make room index/theme dynamic, reduce persistent cards, emphasize goal/progress/AI intent, move secondary mechanism detail out of the main visual hierarchy. |
| 14 | viewer-retention | PARTIAL | Runs resolve quickly but the dramatic grammar is narrow and visually repetitive. | Use theme rotation, branching puzzle order, stronger hazard telegraph, milestone beats, result closure and next-room anticipation. |
| 15 | audience-interaction | N/A CURRENTLY | No viewer influence is implemented, which is acceptable; core gameplay is autonomous. | Preserve a provider-neutral future seam; do not bolt chat/gifts onto this pass. |
| 16 | crowd-moderation | N/A CURRENTLY | No raw audience text reaches the game or overlay. | Preserve fixed/sanitized presentation surfaces; no new user-text channel. |
| 17 | security-privacy | PASS | Render snapshots omit seeds/solutions/hidden facts and CSP is restrictive. | Keep local self-hosted Three.js dependency, no CDN, no new private fields, no raw debug data in public UI. |
| 18 | long-running-reliability | PARTIAL | Host self-test, restart and recovery scene are good, but R5 soak evidence is absent. | Keep recovery path; add renderer quality degradation/health diagnostics. Do not claim R5 until soak/canary evidence exists. |
| 19 | performance-optimization | FAIL TARGET | Evidence reports ~38 FPS with only 49 draw calls; current renderer can render at up to 2× device pixel ratio with low visual return. | Move to Three.js renderer v2, cap/adapt pixel ratio, reuse geometries/materials, bound shadows/particles, expose quality-tier/FPS/draw/triangle diagnostics. |
| 20 | game-analytics-experimentation | PARTIAL | Basic diagnostics exist but visual quality and pacing decisions are not expressed as stable metrics. | Add renderer diagnostics for mesh families, hazard visuals, themed dressing, adaptive quality and render cost; retain privacy-safe bounded data. |
| 21 | simulation-qa | PASS / EXPAND | Unit, browser, privacy and replay evidence are strong. | Add renderer-v2, dynamic room title, presentation-anchor, theme, hazard, adaptive-quality and room-first regression assertions; keep evidence screenshots. |
| 22 | production-readiness-review | CANDIDATE ONLY | CI passing is not R5. Visual quality and performance need another evidence pass; 72-hour soak/seven-day canary/independent review are not present. | Keep PR draft until fresh browser capture is reviewed. Record any remaining P2s explicitly; never call this production-ready solely from CI. |

## Highest-severity findings

### P1 — Visual identity and physical believability
The current scene is technically 3D but visually reads as a low-fidelity blockout. Repeated box silhouettes, nearly flat materials, floating/grid placement, and insufficient light/value separation make clues and mechanisms hard to parse.

### P1 — Performance/value mismatch
The runtime evidence reports approximately 38 FPS while producing a visually simple scene. The existing renderer can use a 2× backing resolution and issues many individual JS draw calls without delivering proportional image quality.

### P1 — Puzzle staging does not feel spatial
Public objects receive generic grid coordinates. A clue, wall lock, floor prop, scale and vault can therefore occupy implausible physical relationships. A physical escape room needs deterministic *surface-aware* presentation anchors.

### P2 — AI is not a visible protagonist
The autonomous policy is the product hook, but the AI is mostly represented by a text card and a simple marker. Viewers should be able to follow what the AI is inspecting without reading the rail.

### P2 — Hazards are mechanically present but visually under-expressed
Laser, steam and power-surge hazards need distinct anticipation/active/recovery visuals. A red room tint is not sufficient gameplay communication.

### P2 — Audio lacks semantic hierarchy
The current oscillator cues prove the event path but do not create a long-session soundscape. Danger, discovery, solve, failure and escape need different envelopes and priorities.

## Implementation sequence

1. Add failing browser/presentation tests for renderer-v2 diagnostics, dynamic room title, safe physical placement metadata and room-first evidence.
2. Upgrade render snapshot to `escape-render-v2` with safe deterministic physical placement metadata.
3. Replace the cube-only renderer with a Three.js PBR renderer using reusable geometries/materials, authored theme palettes, adaptive pixel ratio and bounded shadows.
4. Rebuild every current puzzle primitive as a distinct physical mechanism; add physical clue/tool/decoy props and an embodied AI probe.
5. Add distinct laser/steam/power hazard presentation and solve/escape feedback.
6. Simplify HUD hierarchy and fix dynamic room/theme/milestone presentation.
7. Replace basic beeps with a bounded procedural WebAudio mix architecture.
8. Add branching-and-merge puzzle dependency grammar without weakening solver/validator guarantees.
9. Run full CI/browser evidence, inspect screenshots, then execute another adversarial review before changing draft/readiness status.

## Non-goals

- no Eko Street Run changes;
- no dependency on unfinished Eko systems;
- no hidden solution/seed leakage;
- no remote model requirement;
- no arbitrary chat/user text;
- no economy merely for feature count;
- no authoritative rigid-body engine where puzzle rules do not need one;
- no R5 or production-ready claim without independent soak/canary evidence.
