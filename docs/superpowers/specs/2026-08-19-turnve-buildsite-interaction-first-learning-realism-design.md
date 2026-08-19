# Turnve BuildSite — Interaction-First Learning & Realism Rebuild

Date: 2026-08-19
Branch: `feat/turnve-buildsite`
PR: #22
Status: Design approved in chat; written spec pending user review

## 1. Purpose

Rebuild Turnve BuildSite so the learner experiences construction work primarily through the live 3D web scene, not through large instructional overlays. The redesign must also raise the fidelity of prominent site objects so the environment no longer reads as a collection of simplified primitives.

The target remains a browser-rendered Three.js / React Three Fiber simulation that works on desktop and mobile browsers.

## 2. Product principles

1. **The scene is the classroom.** Core learning actions happen on 3D objects and work surfaces.
2. **Instructions stay secondary.** UI should guide the learner without covering the work area.
3. **One visible action at a time.** Each lesson step exposes one clear action, target and feedback loop.
4. **Show, then do.** Mentor voice, camera framing and world highlighting establish context; the learner performs the task directly.
5. **Prominent objects must look structurally believable.** Hero objects cannot be represented by a box/cylinder shorthand.
6. **Web performance remains a hard constraint.** Fidelity scales by importance and device quality tier.
7. **Skill learning remains separate from project-management readiness scoring.**

## 3. Current problems being corrected

### 3.1 Lesson UI behaves like a textbook overlay

The current `SkillLessonPanel` is visually dominant and contains headings, paragraphs, safety notes, controls and feedback at the same time. It competes with the 3D scene and can obscure the exact work target.

### 3.2 Learning actions are too abstract

Several lesson steps are currently completed by pressing a button, selecting a textual option or moving a generic range slider. The learner can finish a lesson without manipulating the actual construction object that represents the job.

### 3.3 Hero objects are under-modeled

The concrete mixer truck, wheelbarrow, work equipment and some construction props are recognizable but not structurally complete enough to support the visual standard expected for Turnve.

## 4. Chosen approach

Use an **interaction-first rebuild** with two coordinated layers:

- **World interaction layer:** tools, materials, gauges, workpieces, drag/rotate/place interactions and visible state changes inside R3F.
- **Compact coach layer:** a small mentor instruction strip that never becomes the primary content surface.

The existing large lesson panel will no longer dominate the lesson. A compact lesson controller will retain accessibility, progress, exit, optional explanation and fallback controls where a 3D gesture is unsuitable.

## 5. Learning interaction model

### 5.1 Lesson entry

Flow:

`approach mentor → personalized mentor prompt → choose Talk or Learn → cinematic focus → mentor voice → work target highlights → compact instruction appears → learner performs action in-world`

The learner remains in the same WebGL scene throughout the lesson.

### 5.2 Compact mentor coach

Desktop:
- narrow bottom-right or lower-right rail
- maximum width approximately 360 px
- never covers the active workpiece

Mobile:
- compact lower safe-area strip
- single-line or two-line instruction
- one optional expansion control
- controls remain thumb-reachable

Default content:
- mentor first name
- step `n / total`
- one imperative instruction
- minimal success/error feedback

Optional controls:
- **Why?** expands a short explanation
- **Repeat** replays voice instruction
- **Exit** leaves the lesson

The detailed objective, safety note and lesson description are available before the first action or behind `Why?`; they are not persistently shown during practice.

### 5.3 World target language

Every step must resolve to a visible 3D target with one of these interaction types:

- `tap`
- `pick-up`
- `drag`
- `place`
- `rotate`
- `trace`
- `measure`
- `mark`
- `attach`
- `inspect`

Text-only completion buttons are not acceptable for core practical steps when a meaningful 3D action can represent the work.

## 6. Masonry lesson redesign

Mentor: Emeka Nwosu

Sequence:

1. **Identify tools and materials**
   - tap block, mortar tray, trowel, spirit level and line
   - each object receives a short outline/highlight when selected

2. **Prepare mortar bed**
   - pick up trowel
   - drag trowel across mortar tray to load mortar
   - drag along target bed to spread material
   - visible mortar mesh grows along the path
   - score coverage, continuity and approximate thickness

3. **Place block**
   - pick up block
   - move it to the highlighted placement zone
   - release to place
   - reject clearly invalid placement outside tolerance

4. **Align and level**
   - rotate/slide block within small correction limits
   - place spirit level on block
   - bubble/level indicator reflects current offset
   - score plumb/alignment tolerance

5. **Finish joint**
   - drag trowel/jointer across exposed mortar
   - excess mortar reduces visibly
   - completed joint changes to clean finish material

Completion evidence records action quality from the actual interaction samples.

## 7. Welding lesson redesign

Mentor: Tunde Balogun

Sequence:

1. tap required PPE and confirm controlled hot-work zone
2. inspect torch/holder, leads, return connection and work surface by tapping actual components
3. drag clamp onto coupon and secure it
4. pick up torch
5. trace the visible weld seam from start to finish
6. render bead behind the torch during the pass
7. evaluate travel speed variance, backtracking, pauses and completion
8. inspect the finished bead visually and select the observed quality issue if present

The current generic travel slider becomes a fallback accessibility control only, not the default learning action.

## 8. Formwork lesson redesign

Mentor: Daniel Mensah

Sequence:

1. identify panel, waler, prop and brace directly in the scene
2. inspect line/level using a visible level/reference line
3. identify the weak under-seated prop by examining candidates
4. grab/reseat the weak prop into its correct bearing position
5. attach or reposition the brace to the approved anchor target
6. perform a final verification pass

The learner must manipulate the modeled support condition rather than select the answer from a text list.

## 9. Rebar & quality lesson redesign

Mentor: Grace Adebayo

Sequence:

1. open/confirm the latest detail in a small drawing reference overlay
2. pick up virtual tape / spacing gauge
3. measure modeled bar spacing in-world
4. use cover gauge between bar and form face
5. inspect the service-opening reinforcement zone
6. mark the incorrect area directly in the scene
7. capture the discrepancy record
8. request authorized inspection

Measurements use target snapping and readable numeric feedback but retain the physical measuring action.

## 10. Interaction architecture

Create a reusable interaction layer instead of writing bespoke pointer logic into each lesson component.

### 10.1 Core modules

`src/skillMentor/interactions/types.ts`
- world interaction contracts
- pointer/touch gesture result types
- tolerances and scoring samples

`src/skillMentor/interactions/engine.ts`
- pure validation/scoring for placement, trace, measurement and alignment
- no Three.js dependency

`src/skillMentor/interactions/targets.ts`
- maps lesson step IDs to world target IDs and interaction types

`src/three/training/InteractiveTool.tsx`
- reusable pick-up/drag tool behavior

`src/three/training/PlacementTarget.tsx`
- visible target + snapping/tolerance feedback

`src/three/training/TraceSurface.tsx`
- pointer/touch path sampling for mortar spreading, welding and joint finishing

`src/three/training/MeasureTool.tsx`
- two-point measurement interaction

`src/three/training/WorldHighlight.tsx`
- focus/outline/beacon treatment

`src/ui/SkillCoach.tsx`
- compact lesson coach replacing the dominant lesson panel during active practice

### 10.2 State ownership

- authoritative step ordering/result evidence stays in `skillMentor` state
- transient pointer/drag state stays local to 3D interaction components
- only validated action samples are dispatched to the skill reducer
- the original simulation reducer remains independent

## 11. Camera behavior

The existing cinematic `SkillFocusRig` remains, but lesson framing becomes target-aware.

Each step provides:
- mentor/workstation framing pose
- active target position
- preferred camera offset
- mobile-safe offset

The camera may ease to a closer work angle between steps but must never block direct manipulation. The learner can still make small look adjustments during practice where the interaction requires it.

## 12. Hero-object fidelity standard

### 12.1 Fidelity tiers

**Tier 1 — Hero objects**
- concrete mixer truck
- wheelbarrow
- tower crane
- welding workstation/equipment
- masonry station/tool set
- mentor workstations

Requirements:
- recognizable real-world silhouette
- major functional components present
- believable thickness and proportions
- separate materials for glass/rubber/paint/steel/timber where applicable
- no single primitive standing in for a complex object
- inspectable from close learner distance

**Tier 2 — Secondary props**
- generator
- scaffold sets
- pallets
- pipe racks
- rebar bundles
- barriers
- toolboxes

Requirements:
- optimized multi-part geometry
- enough detail to survive mid-range viewing

**Tier 3 — Background dressing**
- distant clutter
- debris
- offcuts
- far-site silhouettes

Requirements:
- low polygon count / instances
- visual density over inspectable detail

## 13. Concrete mixer truck rebuild

Required visible components:
- shaped cab body rather than rectangular box
- front bumper
- grille
- headlights / indicators
- windshield and side windows
- doors
- mirrors
- chassis frame
- fuel/utility tanks where visible
- front wheel pair
- rear axle / dual wheels
- wheel hubs and mudguards
- drum support frame
- mixer drum with tapered profile
- drum fins/rings that visually communicate rotation
- rear hopper
- discharge chute
- chute supports
- access ladder
- rear lights

Animation:
- drum rotation
- vehicle translation already driven by scenario state
- wheels rotate while moving where practical

## 14. Wheelbarrow rebuild

Required visible components:
- proper tapered tray/basin profile
- reinforced tray rim
- support frame under basin
- single axle
- pneumatic tire and hub
- two legs
- two full handles
- grip sections
- believable tilt/stance

The wheelbarrow may later become interactive, so geometry must support a pick/handle target and tray target.

## 15. Other prominent object upgrades

### Crane
- lattice mast and jib language
- counter-jib/counterweight
- operator cab
- trolley
- hoist cable/hook assembly

### Welding bay
- actual table surface/frame
- power source body with controls/vents
- leads/cables
- clamp
- torch/holder
- coupon
- helmet/PPE nearby

### Masonry bay
- mortar tray
- trowel with handle/blade
- spirit level
- line/string reference
- blocks with slight edge/material variation

### Scaffolding
- uprights
- ledgers/transoms
- braces
- platforms
- base plates
- guard rails on hero/mid-distance sets

## 16. Asset strategy

Use a hybrid strategy:

1. high-quality local GLB assets where licensing and web weight are acceptable
2. custom optimized procedural/multi-part geometry for objects that need lesson-specific interactivity
3. generated local assets must be bundled with Vite; no runtime dependency on public model CDNs

Imported GLBs must be inspected for:
- license
- triangle count
- texture resolution
- draw calls/material count
- transform cleanliness
- suitability for mobile fallback

Hero assets should lazy-load on balanced/high tiers where possible. Mobile receives either optimized LOD or procedural fallback without losing lesson functionality.

## 17. UI rules

- active lesson UI must cover less than roughly 25% of desktop scene width
- mobile coach must not cover the active target
- one primary action concept per step
- no permanent multi-paragraph instructional blocks during practice
- instructional text target: one sentence, generally under 120 characters
- success feedback auto-dismisses after a short interval
- error feedback explains the physical correction, not merely `wrong answer`
- `Why?` is optional disclosure
- voice repeats the current instruction on request

## 18. Accessibility and alternate input

Every gesture-based action must have an accessible fallback without making the fallback the default visual experience.

Examples:
- welding trace: keyboard/range fallback
- alignment: arrow-step correction fallback
- drag placement: selectable target + confirm fallback
- measurement: choose endpoints through focus controls

All core lesson states remain keyboard-reachable and screen-reader labeled.

## 19. Performance constraints

- preserve `mobile | balanced | high` render tiers
- no unconditional post-processing package added for this phase
- keep large hero assets lazy and local
- prefer instancing for repeated background props
- avoid per-frame allocations in pointer/gesture handlers
- path traces should use bounded sample arrays
- mobile should retain lesson mechanics even when shadows/secondary dressing are reduced

## 20. Verification plan

### Unit tests

Add pure tests for:
- placement tolerance/scoring
- trace quality scoring
- measurement tolerance
- alignment scoring
- invalid/out-of-order interaction rejection
- evidence generation

### Browser tests

Full-WebGL stories must prove:

1. **Masonry interaction**
   - approach Emeka
   - begin lesson
   - interact with tools/workpiece
   - place/align block
   - complete lesson with saved score

2. **Welding interaction**
   - inspect components
   - secure coupon
   - trace seam
   - receive bead/travel score

3. **Hero object smoke**
   - truck renders with expected component markers/scene objects
   - wheelbarrow renders as multi-part hero object

4. existing mobile movement/drag and report paths remain green

Long DOM-only flows may continue using the automation-only lightweight scene shell, but interaction-first lesson tests must run against real WebGL.

## 21. Release gate

The redesign is complete only when:

- interaction engine unit suite is green
- existing BuildSite tests remain green
- production Vite build succeeds
- new real-WebGL lesson flows pass
- mobile controls remain browser-verified
- preview smoke passes
- verified publisher advances `turnve-buildsite-live`
- live bundle is checked against the green candidate asset hashes

## 22. Non-goals for this phase

- photoreal scanned humans
- multiplayer
- native mobile application
- full construction machinery physics simulation
- structural engineering calculation engine
- changing the core concrete-pour readiness scoring model
- replacing every background prop with a high-poly asset

## 23. Expected user-visible result

The learner should feel that they are **doing the job inside the construction site**, with the mentor guiding the work from the edge of the experience. The visual hierarchy should be: `workpiece → action → mentor guidance`, not `lesson text → button → background scene`.

Prominent objects should withstand close inspection and read as intentional construction equipment rather than primitive stand-ins, while the experience remains responsive in a web browser.