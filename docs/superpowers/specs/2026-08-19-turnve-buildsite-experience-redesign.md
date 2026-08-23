# Turnve BuildSite — Experience Redesign

## Goal
Turn the current functional vertical slice into a convincing work-simulation experience that feels mobile, alive, understandable, and presentation-ready without adding backend or asset-network dependencies.

## Problems found
1. **Mobile navigation is absent.** The current first-person controller only reads WASD/arrow keyboard input and relies on pointer lock for looking. On touch devices there is no movement path.
2. **The site sounds silent.** A construction environment without machinery, reversing beeps, impact sounds, weather and site ambience feels static even when geometry animates.
3. **The interface exposes too much at once.** The Site Tablet has nine top-level tabs and the HUD continuously exposes five competency metrics. This makes the experience read like an admin dashboard rather than an internship.
4. **Characters read as placeholders.** Workers are box-based figures without facial features or identity. Stakeholders are mostly names in text lists instead of people the learner recognizes.
5. **Visual language is too blue and dashboard-like.** The palette does not strongly evoke construction, concrete, steel, safety equipment and site signage.

## Design decisions

### 1. Cross-platform first-person navigation
Keep desktop WASD + mouse pointer-lock. Add a touch input layer for phones/tablets:
- left thumb virtual joystick for movement
- right-side drag surface for camera look
- large contextual Inspect button for hazard interaction
- touch input feeds the same PlayerController movement and collision path as keyboard input
- no separate mobile simulation logic

### 2. Construction soundscape
Use Web Audio so the pitch does not depend on external audio URLs.
- base machinery/engine hum
- intermittent hammer/metal impact cues
- truck reversing/waiting beeps
- rain noise when weather changes
- sound starts only after a user gesture to respect browser autoplay restrictions
- one visible Sound control; no complex mixer in the learner UI

### 3. Simpler learner interface
Replace nine tablet tabs with four work-oriented sections:
- **Brief** — assignment, progress, blockers, authority boundary
- **Site** — map, hazards/evidence, readiness checklist
- **People** — stakeholders and concise communication actions
- **Work** — drawing revision control and required artifacts

Performance/competency scores move out of the live tablet and remain in the final readiness report.

Replace the large HUD metric panel and coach panel with one compact mission bar:
- current objective
- simulated time
- weather / approval / truck status
- Tablet, TARI and Sound actions

### 4. Human characters
Upgrade local procedural characters rather than loading fragile remote models:
- human proportions instead of block figures
- distinct skin tones and PPE
- visible eyes, nose, mouth, ears and helmet detail
- reflective vest bands and workwear
- named stakeholder characters with role labels
- more varied animation: walking, looking, gesturing and site supervision

Also add recognizable stakeholder portrait illustrations to briefing and communication views so the learner connects 3D people to workplace roles.

### 5. Construction palette
Use a grounded site palette:
- graphite / steel for navigation and structure
- concrete/off-white for document surfaces
- safety amber as primary action color
- signal orange/red only for hazards and pressure
- green only for verified/closed states
- restrained sky blue for environmental information, not primary UI chrome

## Success criteria
- Learner can navigate on a touch viewport without a keyboard.
- Desktop navigation remains functional.
- Sound can be enabled with one action and changes with truck/weather state.
- Site Tablet has no more than four top-level sections.
- Live HUD does not show competency scores.
- Named stakeholders are visually recognizable in briefing/people views and represented in 3D.
- Full guided pitch flow still reaches an evidence-backed readiness report.
- Production build, unit tests, Chromium desktop pitch flow and a mobile-control browser check pass.

## Scope boundary
This pass does not add backend multiplayer, speech recognition, photogrammetry, streamed 3D assets, live LLM calls, or full NPC dialogue trees. The priority is a reliable, alive and understandable internship vertical slice.
