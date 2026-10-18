# Turnve BuildSite Ultra-Real Skill Mentor Design

## Goal
Transform Turnve BuildSite into a mobile-first, browser-rendered 3D construction training environment with higher visual realism and a reusable cinematic Skill Mentor mode where approaching workers can launch interactive, voiced, step-by-step job lessons.

## Product principles
- The target is a live WebGL/Three.js scene, never a static mockup or prerendered video.
- Mobile-first: every new control must work with one thumb, 44px+ targets, no hover-only dependency, and responsive quality tiers.
- The concrete-pour simulation remains authoritative and deterministic; skill-learning state is separate and cannot inflate the readiness score.
- Skill lessons are learn-by-doing: each lesson includes demonstration/briefing, learner actions, feedback, completion evidence, and a skill score.
- Existing procedural geometry remains as a no-network fallback; realism must not depend on remote runtime assets.

## Environment realism architecture
Create a dedicated `three/realism` layer containing procedural PBR-style materials and site dressing. Use repeated CanvasTextures/noise maps for concrete, wet concrete, soil, timber, steel and rust. Add wetness response, puddles, tire tracks, dust/grime decals, safety markings, scaffolding, pallets, pipes, wheelbarrows, generator, hoses, timber offcuts, formwork stacks, rebar bundles and work lights.

Lighting uses physically correct renderer settings where supported, ACES tone mapping, soft shadow maps, hemisphere/ambient fill, sun-directional light, atmospheric fog and contact-depth helpers. Quality tiers (`mobile`, `balanced`, `high`) control shadow size, decorative prop counts and rain particle density while preserving lesson mechanics.

## Skill Mentor architecture
Add `skillMentor/` as an isolated subsystem.

### Skill definition
Each skill defines:
- `id`, `title`, `trade`, `mentor`, `mentorRole`
- mentor and workstation world positions
- `intro`, `objective`, `safetyNote`
- ordered steps with `instruction`, `actionType`, `feedback`, `scoreWeight`
- optional required world interaction target

### Runtime state
Keep mentor state in Zustand presentation state:
- nearby mentor
- active skill
- lesson phase (`idle | focus | intro | practice | complete`)
- current step
- per-step completion
- lesson score/evidence
- cinematic camera focus target

### Proximity and launch
`PlayerController` calculates nearest mentor independently of stakeholder proximity. When within range, a compact `SkillMentorPrompt` appears. Tapping `Learn this job` pauses free movement and begins the cinematic focus transition.

### Cinematic focus
A `SkillFocusRig` inside the R3F Canvas snapshots the learner camera transform, eases camera position/FOV toward a two-shot/workstation framing, and restores the saved transform on exit. The lesson UI is rendered as a mobile bottom panel while the 3D world remains visible behind it.

### Voice
Use the existing browser speech adapter. Mentor intro and step guidance are spoken with the learner's name when audio is enabled. Construction ambience ducks during speech and returns afterward.

## Initial skill library
1. **Masonry / Block Laying — Emeka Nwosu, Masonry Mentor**
   - identify block/mortar/tools
   - prepare a level bed
   - pick/carry block
   - place block
   - align/level
   - finish joint

2. **Welding — Tunde Balogun, Welding Mentor**
   - PPE and bay safety
   - inspect equipment
   - secure coupon
   - controlled travel pass
   - inspect bead
   - retry/complete from feedback

3. **Formwork — Daniel Mensah, Foreman**
   - identify panel/supports
   - inspect line/level
   - check bracing
   - identify weak support
   - choose correction
   - verify before pour

4. **Rebar & Quality — Grace Adebayo, Consultant**
   - read latest detail
   - inspect spacing
   - inspect cover
   - detect mismatch
   - record discrepancy
   - request quality inspection

## UI/UX
- New mentor prompt is small and non-blocking.
- Active lesson becomes a focused bottom sheet on mobile and a right-side training panel on desktop.
- Step list shows one active action at a time, not the full lesson wall.
- `Exit lesson` always restores the original site camera and controls.
- Skill completion appears in a separate `Skills learned` area on the final report.

## Testing
- Unit tests for mentor proximity, lesson reducer, weighted scoring and skill definitions.
- Browser tests for mobile mentor prompt, cinematic lesson launch/exit, step completion, voice greeting, and final skill evidence.
- Existing BuildSite tests must remain green.

## Performance / release constraints
- No external runtime asset host required.
- Relative Vite asset paths remain enabled for the public static branch.
- Three.js bundle warning may remain, but new work must not substantially increase JS bundle size through heavyweight dependencies.
- Visual detail scales down on coarse-pointer/mobile devices.
