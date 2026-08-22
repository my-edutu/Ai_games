# Turnve BuildSite Interaction-First Learning & Realism Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild BuildSite so practical skills are learned by manipulating real 3D work objects inside the web scene, while compact mentor guidance stays secondary and prominent construction equipment reaches a believable hero-object fidelity standard.

**Architecture:** Add a pure interaction-scoring layer beneath the existing Skill Mentor reducer, then attach reusable R3F interaction components to each training bay. Replace the dominant lesson panel with a compact `SkillCoach`, keep validated evidence in the existing mentor state, and split hero equipment into focused R3F components so close-range objects are inspectable without inflating mobile rendering cost.

**Tech Stack:** TypeScript, React, Zustand, Three.js, React Three Fiber, Drei, Vitest, Playwright, Vite.

**Spec:** `docs/superpowers/specs/2026-08-19-turnve-buildsite-interaction-first-learning-realism-design.md`

## Global Constraints

- The target remains a browser-rendered Three.js / React Three Fiber simulation that works on desktop and mobile browsers.
- The scene is the classroom: core practical steps must manipulate 3D objects where a meaningful world action exists.
- Active lesson UI must cover less than roughly 25% of desktop scene width and must not cover the mobile work target.
- Skill-learning evidence and scores remain separate from the concrete-pour project-management readiness score.
- Preserve `mobile | balanced | high` render tiers.
- No unconditional post-processing dependency in this phase.
- Large hero assets remain local/lazy; no runtime public-model CDN dependency.
- Gesture fallbacks remain keyboard/screen-reader accessible but are not the default visual experience.
- Full-WebGL browser coverage is required for masonry, welding, formwork and rebar-quality interaction flows.
- Hero-object smoke coverage is required for concrete truck, wheelbarrow and crane component structure.

---

## File Structure

### Interaction domain
- Create `games/turnve-buildsite/src/skillMentor/interactions/types.ts` — interaction contracts and sample types.
- Create `games/turnve-buildsite/src/skillMentor/interactions/engine.ts` — pure scoring/validation.
- Create `games/turnve-buildsite/src/skillMentor/interactions/targets.ts` — step → target/interaction mapping.
- Create `games/turnve-buildsite/src/skillMentor/interactions/engine.test.ts` — TDD contract.
- Modify `games/turnve-buildsite/src/skillMentor/types.ts` — add validated interaction metadata to evidence without breaking existing reducer actions.
- Modify `games/turnve-buildsite/src/skillMentor/engine.ts` — accept pre-scored interaction evidence while preserving ordered-step validation.

### Reusable R3F training interactions
- Create `games/turnve-buildsite/src/three/training/InteractiveTool.tsx`.
- Create `games/turnve-buildsite/src/three/training/PlacementTarget.tsx`.
- Create `games/turnve-buildsite/src/three/training/TraceSurface.tsx`.
- Create `games/turnve-buildsite/src/three/training/MeasureTool.tsx`.
- Create `games/turnve-buildsite/src/three/training/WorldHighlight.tsx`.
- Create `games/turnve-buildsite/src/three/training/TrainingInteractionLayer.tsx` — chooses the active step interaction.

### Lesson UX
- Create `games/turnve-buildsite/src/ui/SkillCoach.tsx`.
- Modify `games/turnve-buildsite/src/App.tsx` — render compact coach instead of full `SkillLessonPanel` during active practice.
- Modify `games/turnve-buildsite/src/ui/SkillLessonPanel.tsx` — reduce to focus/complete/accessible fallback responsibilities.
- Modify `games/turnve-buildsite/src/skill-mentor.css` — compact coach and safe-area layout.
- Modify `games/turnve-buildsite/src/audio/voice.ts` / `VoiceGuide.tsx` only where repeat/current-step behavior requires it.

### Lesson work bays
- Modify `games/turnve-buildsite/src/three/WorksiteTasks.tsx` — connect visual state to sampled interactions; split if size becomes unmanageable.
- Create `games/turnve-buildsite/src/three/training/MasonryInteraction.tsx`.
- Create `games/turnve-buildsite/src/three/training/WeldingInteraction.tsx`.
- Create `games/turnve-buildsite/src/three/training/FormworkInteraction.tsx`.
- Create `games/turnve-buildsite/src/three/training/RebarInteraction.tsx`.

### Hero objects
- Create `games/turnve-buildsite/src/three/equipment/ConcreteMixerTruck.tsx`.
- Create `games/turnve-buildsite/src/three/equipment/Wheelbarrow.tsx`.
- Create `games/turnve-buildsite/src/three/equipment/TowerCrane.tsx`.
- Create `games/turnve-buildsite/src/three/equipment/HeroEquipment.test.ts` for pure component manifests if used.
- Modify `games/turnve-buildsite/src/three/ConstructionScene.tsx` — replace inline truck/crane and mount hero equipment.
- Modify `games/turnve-buildsite/src/three/realism/SiteDressing.tsx` — replace primitive wheelbarrow with hero component and keep secondary props tiered.

### Browser verification
- Replace/extend `games/turnve-buildsite/e2e/skill-mentor.spec.ts` with masonry in-world interaction coverage.
- Create `games/turnve-buildsite/e2e/welding-mentor.spec.ts`.
- Create `games/turnve-buildsite/e2e/formwork-mentor.spec.ts`.
- Create `games/turnve-buildsite/e2e/rebar-mentor.spec.ts`.
- Create `games/turnve-buildsite/e2e/hero-equipment.spec.ts`.
- Preserve existing mobile, practical, pitch/report and voice stories.

---

### Task 1: Pure Interaction Engine

**Files:**
- Create: `games/turnve-buildsite/src/skillMentor/interactions/types.ts`
- Create: `games/turnve-buildsite/src/skillMentor/interactions/engine.ts`
- Create: `games/turnve-buildsite/src/skillMentor/interactions/targets.ts`
- Test: `games/turnve-buildsite/src/skillMentor/interactions/engine.test.ts`
- Modify: `games/turnve-buildsite/src/skillMentor/types.ts`
- Modify: `games/turnve-buildsite/src/skillMentor/engine.ts`

**Interfaces:**
- Produces:
  - `type InteractionKind = 'tap' | 'pick-up' | 'drag' | 'place' | 'rotate' | 'trace' | 'measure' | 'mark' | 'attach' | 'inspect'`
  - `type Vec2Sample = { x: number; y: number; t: number }`
  - `type PlacementSample = { position: Vec3; target: Vec3; tolerance: number }`
  - `scorePlacement(sample: PlacementSample): InteractionScore`
  - `scoreTrace(samples: Vec2Sample[], options: TraceOptions): InteractionScore`
  - `scoreMeasurement(actual: number, expected: number, tolerance: number): InteractionScore`
  - `scoreAlignment(offsetMm: number, toleranceMm: number): InteractionScore`
  - `interactionTargets: Record<string, InteractionTargetDefinition>`
- `InteractionScore = { quality: number; valid: boolean; feedback: string; metrics: Record<string, number> }`.

- [ ] **Step 1: Write the failing scoring tests**

```ts
import { describe, expect, it } from 'vitest';
import { scoreAlignment, scoreMeasurement, scorePlacement, scoreTrace } from './engine';

describe('skill interaction scoring', () => {
  it('scores placement by 3D distance and rejects outside tolerance', () => {
    expect(scorePlacement({ position: [1.03, 0, 1.01], target: [1, 0, 1], tolerance: .08 }).valid).toBe(true);
    expect(scorePlacement({ position: [1.4, 0, 1], target: [1, 0, 1], tolerance: .08 }).valid).toBe(false);
  });

  it('rewards continuous forward trace and penalizes backtracking', () => {
    const clean = scoreTrace([
      { x: 0, y: 0, t: 0 }, { x: .3, y: .02, t: 100 }, { x: .65, y: .01, t: 200 }, { x: 1, y: 0, t: 300 },
    ], { start: [0, 0], end: [1, 0], corridor: .12, targetDurationMs: 300 });
    const backtrack = scoreTrace([
      { x: 0, y: 0, t: 0 }, { x: .6, y: 0, t: 100 }, { x: .35, y: 0, t: 180 }, { x: 1, y: 0, t: 400 },
    ], { start: [0, 0], end: [1, 0], corridor: .12, targetDurationMs: 300 });
    expect(clean.quality).toBeGreaterThan(backtrack.quality);
    expect(clean.valid).toBe(true);
  });

  it('scores measurement and alignment around explicit tolerances', () => {
    expect(scoreMeasurement(201, 200, 5).quality).toBeGreaterThanOrEqual(90);
    expect(scoreMeasurement(235, 200, 5).valid).toBe(false);
    expect(scoreAlignment(1, 3).quality).toBeGreaterThanOrEqual(90);
    expect(scoreAlignment(9, 3).valid).toBe(false);
  });
});
```

- [ ] **Step 2: Run the new test and verify RED**

Run from `games/turnve-buildsite`:

```bash
npm test -- src/skillMentor/interactions/engine.test.ts
```

Expected: FAIL because `./engine` does not exist.

- [ ] **Step 3: Implement interaction types and scoring**

```ts
export type InteractionScore = {
  quality: number;
  valid: boolean;
  feedback: string;
  metrics: Record<string, number>;
};

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

export function scoreMeasurement(actual: number, expected: number, tolerance: number): InteractionScore {
  const error = Math.abs(actual - expected);
  const quality = clamp(100 - (error / Math.max(tolerance, 1)) * 12);
  return { quality, valid: error <= tolerance * 2, feedback: error <= tolerance ? 'Measurement is within target tolerance.' : 'Reposition the gauge and measure the marked span again.', metrics: { error } };
}
```

Implement placement using Euclidean distance; alignment using absolute offset; trace using completion, corridor deviation, backtracking count and duration variance. Keep arrays bounded to at most 96 samples.

- [ ] **Step 4: Add explicit step → world-interaction mappings**

`targets.ts` must include all core practical steps, e.g.:

```ts
export const interactionTargets = {
  'masonry-bed': { kind: 'trace', targetId: 'masonry-bed', instruction: 'Spread one even mortar bed.' },
  'masonry-place': { kind: 'place', targetId: 'masonry-placement', instruction: 'Place the block inside the guide.' },
  'welding-pass': { kind: 'trace', targetId: 'welding-seam', instruction: 'Trace the seam steadily from start to finish.' },
  'formwork-fault': { kind: 'inspect', targetId: 'formwork-weak-support', instruction: 'Inspect the props and select the weak support.' },
  'formwork-correct': { kind: 'attach', targetId: 'formwork-correction', instruction: 'Reseat the prop and connect the brace.' },
  'rebar-spacing': { kind: 'measure', targetId: 'rebar-spacing', instruction: 'Measure the highlighted bar spacing.' },
  'rebar-cover': { kind: 'measure', targetId: 'rebar-cover', instruction: 'Measure concrete cover to the form face.' },
  'rebar-mismatch': { kind: 'mark', targetId: 'rebar-mismatch', instruction: 'Mark the reinforcement mismatch.' },
} satisfies Record<string, InteractionTargetDefinition>;
```

- [ ] **Step 5: Extend evidence without breaking existing actions**

Add optional metadata to `SkillEvidence`:

```ts
interaction?: {
  kind: InteractionKind;
  metrics: Record<string, number>;
};
```

Extend `COMPLETE_STEP` to accept optional `interaction` and copy it into evidence while preserving existing `quality` behavior.

- [ ] **Step 6: Run all unit tests**

```bash
npm test
```

Expected: existing suite + new interaction suite all PASS.

- [ ] **Step 7: Commit**

```bash
git add src/skillMentor/interactions src/skillMentor/types.ts src/skillMentor/engine.ts
git commit -m "feat(turnve): add skill interaction scoring engine"
```

---

### Task 2: Compact Skill Coach + Training Interaction Layer

**Files:**
- Create: `src/ui/SkillCoach.tsx`
- Create: `src/three/training/TrainingInteractionLayer.tsx`
- Create: `src/three/training/WorldHighlight.tsx`
- Modify: `src/App.tsx`
- Modify: `src/ui/SkillLessonPanel.tsx`
- Modify: `src/skill-mentor.css`
- Modify: `src/three/ConstructionScene.tsx`
- Test: extend `e2e/skill-mentor.spec.ts`

**Interfaces:**
- Consumes `interactionTargets`, `skillMentor.activeSkillId`, `skillMentor.stepIndex`.
- Produces `SkillCoach` with `Why?`, `Repeat`, `Exit`, step progress, imperative instruction.
- Produces `TrainingInteractionLayer` that mounts the correct lesson-specific interaction component.

- [ ] **Step 1: Write browser assertions for compact coach**

Add assertions after starting masonry:

```ts
const coach = page.locator('.skill-coach');
await expect(coach).toBeVisible();
await expect(coach).toContainText(/Step 1 \/ 5/);
await expect(coach.locator('p')).toHaveCount(1);
const coachBox = await coach.boundingBox();
const sceneBox = await page.getByLabel('3D construction site').boundingBox();
expect(coachBox!.width / sceneBox!.width).toBeLessThan(.36);
await expect(page.locator('.skill-lesson-panel')).toHaveCount(0);
```

- [ ] **Step 2: Verify RED**

```bash
npx playwright test e2e/skill-mentor.spec.ts
```

Expected: FAIL because `.skill-coach` does not exist and old lesson panel is present.

- [ ] **Step 3: Build `SkillCoach`**

During `practice`, render only:

```tsx
<aside className="skill-coach" aria-live="polite">
  <div className="skill-coach-meta"><b>{mentorFirstName}</b><span>Step {stepIndex + 1} / {steps.length}</span></div>
  <p>{currentTarget.instruction}</p>
  <div className="skill-coach-actions">
    <button onClick={() => setExpanded(v => !v)}>Why?</button>
    <button onClick={repeatVoice}>Repeat</button>
    <button onClick={exit}>Exit</button>
  </div>
  {expanded && <small>{step.instruction}</small>}
</aside>
```

Keep the existing lesson panel only for `focus`, `complete`, and accessible fallback controls.

- [ ] **Step 4: Mount `TrainingInteractionLayer` inside the Canvas**

`ConstructionScene` must mount the layer beside `WorksiteTasks`, and `App` must render `SkillCoach` only during `practice`.

- [ ] **Step 5: Add layout constraints**

Desktop `.skill-coach`: `max-width:360px`, bottom/right placement, pointer events enabled only on controls. Mobile: width `calc(100% - 24px)`, compact bottom safe-area, max-height avoiding center-screen work target; expanded `Why?` content capped to short copy.

- [ ] **Step 6: Run unit + mentor browser test**

```bash
npm test
npx playwright test e2e/skill-mentor.spec.ts
```

- [ ] **Step 7: Commit**

```bash
git add src/ui/SkillCoach.tsx src/three/training src/App.tsx src/ui/SkillLessonPanel.tsx src/skill-mentor.css src/three/ConstructionScene.tsx e2e/skill-mentor.spec.ts
git commit -m "feat(turnve): move mentor guidance to compact in-scene coach"
```

---

### Task 3: Masonry Direct Manipulation

**Files:**
- Create: `src/three/training/InteractiveTool.tsx`
- Create: `src/three/training/PlacementTarget.tsx`
- Create: `src/three/training/TraceSurface.tsx`
- Create: `src/three/training/MasonryInteraction.tsx`
- Modify: `src/three/WorksiteTasks.tsx`
- Test: `e2e/skill-mentor.spec.ts`

**Interfaces:**
- `InteractiveTool` reports pick/move/release in local workstation coordinates.
- `TraceSurface` reports `Vec2Sample[]` on pointer/touch end.
- `PlacementTarget` reports snapped/unsnapped placement position.
- `MasonryInteraction` calls `dispatchSkillMentor({ type:'COMPLETE_STEP', actionType, quality, interaction })` only after valid action samples.

- [ ] **Step 1: Rewrite masonry E2E acceptance to require world actions**

The test must not click textual completion buttons for the five core steps. Require data markers such as:

```ts
await page.getByTestId('masonry-tool-trowel').click();
await page.getByTestId('masonry-mortar-trace').dispatchEvent('pointerdown', { clientX: 40, clientY: 20 });
// pointer path...
await expect(page.getByTestId('masonry-bed-coverage')).toHaveAttribute('data-complete', 'true');
```

Use stable R3F/Drei HTML hit targets only where raw canvas coordinate interaction is impractical for deterministic browser testing; production learner interaction still occurs on world objects.

- [ ] **Step 2: Verify RED**

- [ ] **Step 3: Implement trowel + mortar trace**

Store only local transient path state. On release, call `scoreTrace` and grow/spread a mortar strip mesh along accepted path progress.

- [ ] **Step 4: Implement block pick/place**

Use a camera-relative carried-block position, placement target snap radius, and `scorePlacement`.

- [ ] **Step 5: Implement alignment + spirit level**

Allow bounded x/rotation correction; compute offset in mm-equivalent lesson units and feed `scoreAlignment`. Bubble indicator moves opposite offset.

- [ ] **Step 6: Implement joint finish trace**

Trace across joint; progressively hide excess mortar and expose clean joint mesh.

- [ ] **Step 7: Run masonry WebGL test + unit suite**

- [ ] **Step 8: Commit**

```bash
git commit -m "feat(turnve): make masonry lesson direct-manipulation training"
```

---

### Task 4: Welding Direct Manipulation

**Files:**
- Create: `src/three/training/WeldingInteraction.tsx`
- Modify: `src/three/WorksiteTasks.tsx`
- Modify: `src/ui/SkillLessonPanel.tsx` only for fallback slider placement
- Test: create `e2e/welding-mentor.spec.ts`

**Interfaces:**
- `WeldingInteraction` exposes inspectable component IDs, draggable clamp, torch trace and bead visual.
- Uses `scoreTrace` with seam corridor and duration target.

- [ ] **Step 1: Write failing WebGL flow**

Require actual component inspection markers, clamp-secured state, torch trace, bead generation and final evidence score. Assert the generic slider is not the default visible control.

- [ ] **Step 2: Verify RED**

- [ ] **Step 3: Make actual bay components interactive**

Tap/check torch or holder, lead, return connection and table/work surface. Maintain a `Set` of inspected component IDs and complete step only when all required IDs are present.

- [ ] **Step 4: Add draggable clamp**

Clamp snaps to coupon anchor; invalid release returns to rest pose with corrective feedback.

- [ ] **Step 5: Add torch trace and bead**

Sample seam-local pointer movement; append visual bead segments behind progress. Score corridor deviation, speed variance, pauses/backtracking and finish completion.

- [ ] **Step 6: Add visual bead inspection**

Show one or more visible defect cues based on score bands; learner taps the observed condition before completing inspection.

- [ ] **Step 7: Run tests and commit**

```bash
git commit -m "feat(turnve): turn welding mentor into in-world torch practice"
```

---

### Task 5: Formwork Direct Manipulation

**Files:**
- Create: `src/three/training/FormworkInteraction.tsx`
- Modify: `src/three/WorksiteTasks.tsx`
- Test: create `e2e/formwork-mentor.spec.ts`

**Interfaces:**
- Candidate props/braces expose stable world IDs.
- Weak prop is a real movable model element.
- Brace exposes draggable/attach behavior to approved anchor.

- [ ] **Step 1: Write failing formwork WebGL story**

Require learner to inspect panel/waler/prop/brace, identify weak prop, physically reseat it, attach brace and verify ready state.

- [ ] **Step 2: Verify RED**

- [ ] **Step 3: Add component-inspection sequence**

- [ ] **Step 4: Add prop reseat placement scoring**

Use `scorePlacement` against bearing position; invalid placement visibly remains red/unstable.

- [ ] **Step 5: Add brace attach target**

Use `InteractionKind='attach'` and only dispatch completion after brace endpoint snaps to approved anchor.

- [ ] **Step 6: Add final level/reference verification**

- [ ] **Step 7: Run tests and commit**

```bash
git commit -m "feat(turnve): make formwork lesson physical inspection practice"
```

---

### Task 6: Rebar Measurement + Marking

**Files:**
- Create: `src/three/training/MeasureTool.tsx`
- Create: `src/three/training/RebarInteraction.tsx`
- Modify: `src/three/WorksiteTasks.tsx`
- Test: create `e2e/rebar-mentor.spec.ts`

**Interfaces:**
- `MeasureTool` selects two world endpoints and reports lesson-unit distance.
- Rebar interaction defines expected spacing `200 mm` and cover `40 mm` matching existing lesson definitions.

- [ ] **Step 1: Write failing WebGL flow**

Require latest-detail confirmation, in-world spacing measurement, cover measurement, mismatch marking and inspection request.

- [ ] **Step 2: Verify RED**

- [ ] **Step 3: Implement two-point measuring tape/gauge**

Render line/tape between endpoints and a compact numeric label close to the workpiece.

- [ ] **Step 4: Implement spacing/cover scoring**

Use `scoreMeasurement(actual, expected, tolerance)`; tolerate small pointer/snapping variation.

- [ ] **Step 5: Implement mismatch marking**

Learner taps/marks the service-opening reinforcement zone; place a small world marker/decal at selected position and validate against target radius.

- [ ] **Step 6: Preserve authority handoff**

Final step still dispatches the existing quality-inspection request concept; learning evidence stays separate from readiness state.

- [ ] **Step 7: Run tests and commit**

```bash
git commit -m "feat(turnve): add physical rebar measurement and marking lesson"
```

---

### Task 7: Hero Equipment Fidelity Rebuild

**Files:**
- Create: `src/three/equipment/ConcreteMixerTruck.tsx`
- Create: `src/three/equipment/Wheelbarrow.tsx`
- Create: `src/three/equipment/TowerCrane.tsx`
- Modify: `src/three/ConstructionScene.tsx`
- Modify: `src/three/realism/SiteDressing.tsx`
- Test: create `e2e/hero-equipment.spec.ts`

**Interfaces:**
- Each hero component sets `name`/`data-component`-equivalent stable scene markers through hidden Drei HTML diagnostics only in `?demo=true` or automation, not visible to normal users.
- `ConcreteMixerTruck` accepts `status` and `onSelect` and owns drum/wheel animation.
- `TowerCrane` owns jib/trolley animation and `onSelect`.
- `Wheelbarrow` accepts position/rotation and future `onSelect` hooks.

- [ ] **Step 1: Write failing component-level browser smoke**

Require truck markers:
`cab`, `grille`, `windshield`, `mirror-left`, `mirror-right`, `front-wheel-left`, `rear-dual-left`, `drum`, `hopper`, `chute`, `ladder`.

Require wheelbarrow markers:
`tray`, `frame`, `wheel`, `axle`, `leg-left`, `leg-right`, `handle-left`, `handle-right`.

Require crane markers:
`mast`, `jib`, `counter-jib`, `counterweight`, `cab`, `trolley`, `hook`.

- [ ] **Step 2: Verify RED**

- [ ] **Step 3: Build shaped concrete mixer truck**

Use a multi-part cab/chassis, separate glass/rubber/paint/steel materials, dual rear wheels, tapered mixer drum profile, rear hopper/chute/ladder, lights/mirrors and rotating wheels/drum. Avoid one primitive for any complex subsystem.

- [ ] **Step 4: Build proper wheelbarrow**

Use custom tray profile (extruded/buffer geometry or assembled tapered basin), rim, under-frame, axle, tire/hub, two legs and long handles/grips.

- [ ] **Step 5: Upgrade tower crane**

Use repeated lattice segments, counter-jib, counterweight blocks and operator cab while preserving trolley/hook motion.

- [ ] **Step 6: Integrate quality tiers**

Hero structure must remain on mobile, but background/detail segments can reduce. Do not remove functional components required for close learning areas.

- [ ] **Step 7: Run hero smoke + production build**

```bash
npx playwright test e2e/hero-equipment.spec.ts
npm run build
```

- [ ] **Step 8: Commit**

```bash
git commit -m "feat(turnve): rebuild hero construction equipment fidelity"
```

---

### Task 8: Full Regression, UX Critique and Verified Publish

**Files:**
- Modify tests/CSS/components only when evidence identifies an issue.
- Update PR #22 body after exact-candidate verification.

**Interfaces:**
- Final exact candidate must satisfy all spec release gates.

- [ ] **Step 1: Run complete unit suite**

```bash
npm test
```

- [ ] **Step 2: Run production build**

```bash
npm run build
```

- [ ] **Step 3: Run all BuildSite browser stories**

```bash
npm run test:e2e
```

Required green stories include all four in-world lessons, mobile movement, practical/report regression and hero equipment smoke.

- [ ] **Step 4: Critique UX against spec**

Check:
- coach does not obscure active target on 390×844 mobile viewport;
- desktop coach width stays below the target proportion;
- no core practical step is completed solely by a generic text button when a world action exists;
- fallback controls are reachable but visually secondary;
- success/error feedback is brief and physical-action oriented.

- [ ] **Step 5: Critique hero models**

Inspect close-range component structure in the browser scene and verify truck/wheelbarrow/crane are not primitive shorthand. Check proportions, material separation, silhouette and animation.

- [ ] **Step 6: Fix any P0/P1 findings and rerun exact failing gates**

Do not claim completion from partial evidence.

- [ ] **Step 7: Run/observe dedicated GitHub `Turnve BuildSite CI` on exact head SHA**

Require:
- unit/integration success;
- production build success;
- all Playwright stories success;
- preview smoke success.

- [ ] **Step 8: Verify `turnve-buildsite-live` publication**

Compare live `index.html` asset hashes with the green candidate build output. Only then report the live URL as current.

- [ ] **Step 9: Update PR #22 verification record, keep PR draft**

Document exact candidate SHA, test counts, browser-story counts, asset hashes, and remaining external validation (representative physical devices / construction SME / final voice assets).

---

## Plan Self-Review

- **Spec coverage:** all four lessons, compact UI, reusable interaction layer, hero object tiers, truck/wheelbarrow/crane, accessibility, performance tiers, tests and live publication are mapped to explicit tasks.
- **Placeholder scan:** no TBD/TODO/“similar to” implementation placeholders remain.
- **Type consistency:** interaction score/evidence types are introduced in Task 1 and consumed by Tasks 3–6; hero component interfaces are isolated to Task 7; `SkillCoach` consumes the existing mentor state and Task 1 target map.
- **Scope:** the work is large but tightly coupled around one product outcome—interaction-first web learning + close-range environment fidelity—so one ordered implementation plan is appropriate.