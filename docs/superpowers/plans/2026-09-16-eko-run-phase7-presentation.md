# Eko Run Phase 7 Presentation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a deterministic, immutable, broadcast-ready Eko Run presentation layer that turns Phase 1–6 public gameplay truth into readable HUD, semantic audio/VFX feedback and accessible mobile/desktop overlay output without acquiring gameplay authority.

**Architecture:** Preserve the fixed-60-Hz simulation as the sole authority. Phase 7 adds a pure `presentation/broadcast` package that consumes `EkoRunRenderSnapshot` and presentation options, composes bounded HUD/audio/VFX contracts, and renders deterministic HTML for capture verification. Existing Phase 3/4 character/world presentation remains intact and is reused rather than replaced.

**Tech Stack:** TypeScript 5.8.3, Node.js 22.16.0, Three.js 0.186.0 presentation-only, Node test runner, Playwright 1.55.0, GitHub Actions.

**Spec:** `games/eko-street-run/phases/PHASE-07-PRESENTATION-HUD-AUDIO-GAME-FEEL.md`

## Global Constraints

- Authority remains fixed at 60 Hz and presentation may not mutate `EkoRunState`.
- Three.js, HUD, audio and VFX consume immutable public snapshots/events only.
- Render/presentation sampling at 30/60/120 Hz cannot alter gameplay outcomes.
- Critical hierarchy remains: player → safe route → immediate danger → reward/progress → world detail → ambience.
- Critical cues must survive muted audio, reduced motion, reduced flash, low quality and event storms.
- Root seed, random streams, raw provider/viewer/payment data, debug internals and hidden AI reasoning never enter public presentation.
- Phase 7 does not implement Phase 8 AI or Phase 9 viewer influence; future slots must state unavailable/not-enabled.
- All collections and cue sets are bounded.
- TDD is mandatory for behavior changes: tests-only RED commit before production implementation.
- Three adversarial review passes are required before closure.
- Full catalogue CI, dedicated evidence/capture workflow, SHA-locked merge and post-merge verification are required before completion.

---

### Task 1: RED Contract for Public HUD and Safe Snapshot Data

**Files:**
- Modify: `games/eko-street-run/src/state/types.ts`
- Modify: `games/eko-street-run/src/presentation/snapshot.ts`
- Create: `tests/phase7/eko-run-hud.test.cjs`
- Create: `tests/phase7/eko-run-accessibility.test.cjs`
- Modify: `package.json`
- Create: `.github/workflows/eko-run-phase7.yml`

**Interfaces:**
- Consumes: `EkoRunRenderSnapshot`, `createRenderSnapshot`, Phase 6 progression/resources/hazards.
- Produces later: sanitized public record facts needed by the HUD; failing expectations for `createBroadcastPresentation` and Phase 7 broadcast types.

- [ ] **Step 1: Add tests-only expectations for the broadcast API**

The RED tests must import from the compiled Eko index and assert that these APIs exist only after implementation:

```js
assert.equal(typeof eko.createBroadcastPresentation, 'function');
assert.equal(typeof eko.renderBroadcastOverlayHtml, 'function');
assert.deepEqual(eko.PHASE7_AUDIO_BUSES, [
  'master', 'music', 'ambience', 'movement-foley', 'danger-vehicle',
  'gameplay-impacts', 'ui', 'audience-acknowledgement', 'system-emergency'
]);
```

Create a representative Phase 6 state, produce a public render snapshot, and require the eventual HUD to expose:

```js
assert.equal(model.hud.primary.districtId, snapshot.progression.districtId);
assert.equal(model.hud.primary.cycle, snapshot.progression.cycle);
assert.equal(model.hud.primary.progress, snapshot.progress);
assert.equal(model.hud.resources.ekoTokens, snapshot.resources.ekoTokens);
assert.equal(model.hud.future.aiIntent.status, 'not-enabled');
assert.equal(model.hud.future.viewerWindow.status, 'not-enabled');
```

The record-comparison test must require a sanitized public record field rather than reading `EkoRunState` directly.

- [ ] **Step 2: Add danger/accessibility RED assertions**

Construct a public snapshot containing a warned/active hazard and require:

```js
assert.equal(model.hud.danger.visible, true);
assert.ok(model.hud.danger.legalResponses.length >= 1);
assert.equal(model.accessibility.muted, true);
assert.ok(model.captions.some(c => c.priority === 'critical' || c.priority === 'important'));
assert.equal(model.audio.voices.length, 0);
```

Add reduced-motion/reduced-flash assertions that semantic cue IDs remain but motion/flash bounds are lower.

- [ ] **Step 3: Add Phase 7 package/workflow hooks without implementation**

Update `package.json` so the standard test command includes `tests/phase7/*.test.cjs` and add `test:phase7`. Add `.github/workflows/eko-run-phase7.yml` that builds, runs Phase 7 tests, then Phase 6→1 regressions and the authority nondeterminism scan. Do not add production code yet.

- [ ] **Step 4: Commit and observe RED in GitHub Actions**

Expected Phase 7 failures include missing `createBroadcastPresentation`, `renderBroadcastOverlayHtml` and `PHASE7_AUDIO_BUSES`. Build may pass; focused Phase 7 behavior must fail for missing implementation, not fixture/setup errors.

Commit message:

```text
test(eko-run): add phase 7 presentation red corpus
```

---

### Task 2: Implement Sanitized Public Record and Broadcast Contract Types

**Files:**
- Modify: `games/eko-street-run/src/state/types.ts`
- Modify: `games/eko-street-run/src/presentation/snapshot.ts`
- Create: `games/eko-street-run/src/presentation/broadcast/types.ts`
- Create: `games/eko-street-run/src/presentation/broadcast/index.ts`
- Modify: `games/eko-street-run/src/index.ts`

**Interfaces:**
- Consumes: Phase 6 public progression/resources and `RunRecordState.maxProgress`.
- Produces: `BroadcastPresentationOptions`, `BroadcastPresentation`, HUD/audio/VFX types, `PHASE7_AUDIO_BUSES`.

- [ ] **Step 1: Extend only the public render snapshot with safe record data**

Add:

```ts
export interface PublicRecordSnapshot {
  maxProgress: number;
}
```

and `record: PublicRecordSnapshot` to `EkoRunRenderSnapshot`. In `createRenderSnapshot`, project only:

```ts
record: { maxProgress: state.record.maxProgress }
```

Do not expose `rootSeed`, command watermarks, random streams or generated private seed material.

- [ ] **Step 2: Define exact Phase 7 contracts**

`types.ts` must define at minimum:

```ts
export type AudioBus =
  | 'master' | 'music' | 'ambience' | 'movement-foley'
  | 'danger-vehicle' | 'gameplay-impacts' | 'ui'
  | 'audience-acknowledgement' | 'system-emergency';

export interface BroadcastAccessibilityOptions {
  readonly muted: boolean;
  readonly reducedMotion: boolean;
  readonly reducedFlash: boolean;
}

export interface BroadcastPresentationOptions {
  readonly viewport: PresentationViewport;
  readonly quality: PresentationQuality;
  readonly accessibility: BroadcastAccessibilityOptions;
  readonly presentationHz?: 30 | 60 | 120;
}
```

Define immutable HUD cards, caption cues, audio voices, VFX cues, layout/safe-frame metadata and a root `BroadcastPresentation` with version `1`, bounded arrays and a comprehension summary.

- [ ] **Step 3: Export broadcast package from the game index**

`presentation/broadcast/index.ts` exports the types/constants/functions, and top-level `src/index.ts` exports `./presentation/broadcast`.

- [ ] **Step 4: Build and run focused tests**

At this point type/export tests may pass while composition tests remain RED. Keep the RED behavioral assertions until Task 3.

---

### Task 3: Implement Pure HUD, Semantic Feedback and HTML Overlay Composition

**Files:**
- Create: `games/eko-street-run/src/presentation/broadcast/hud.ts`
- Create: `games/eko-street-run/src/presentation/broadcast/feedback.ts`
- Create: `games/eko-street-run/src/presentation/broadcast/presentation.ts`
- Create: `games/eko-street-run/src/presentation/broadcast/html.ts`
- Modify: `games/eko-street-run/src/presentation/broadcast/index.ts`
- Test: `tests/phase7/eko-run-hud.test.cjs`
- Test: `tests/phase7/eko-run-accessibility.test.cjs`

**Interfaces:**
- Consumes: immutable `EkoRunRenderSnapshot` + `BroadcastPresentationOptions`.
- Produces: `createBroadcastPresentation(snapshot, options)` and `renderBroadcastOverlayHtml(model)`.

- [ ] **Step 1: Implement fail-closed option validation and layout mode**

Reject non-finite/non-positive viewport dimensions/DPR, negative safe-area values, safe areas that consume the viewport, unknown quality, and unsupported presentation Hz. Use explicit portrait/landscape layout derived only from viewport dimensions.

- [ ] **Step 2: Implement HUD hierarchy from public facts**

Build primary progress/district/cycle/checkpoint data. Select immediate danger deterministically from warned/active public hazards using stable ordering by threat relevance then hazard ID. Include authoritative `legalResponses`; never invent one.

Record comparison is derived from `snapshot.record.maxProgress` versus `snapshot.progress`. Resources use only public token fields. Future AI/viewer slots are constant bounded objects with `status: 'not-enabled'`.

- [ ] **Step 3: Implement semantic feedback priority/budgeting**

Map recent events and immediate hazard state to normalized cue candidates. Use stable semantic priority:

```text
integrity/system > terminal result > immediate danger > milestone/reward > movement > ambience
```

Filter future/stale events, sort deterministically, dedupe by sequence/type, preserve critical cues, then cap to 12 feedback cues and 8 audio voices. Audio voices reference one of the nine exact buses. Event storms drop/merge low priority first.

- [ ] **Step 4: Implement accessibility transforms**

Muted mode returns zero audio voices while captions/visual cues remain. Reduced-motion lowers particle/motion/camera values but keeps semantic cue identity. Reduced-flash caps flash intensity while preserving visual token/caption. Low quality removes ambience/noncritical density first.

- [ ] **Step 5: Deep-freeze the composed model**

Use a local pure `deepFreeze` utility or a shared presentation-safe helper. The same snapshot/options must produce structurally equal output. No retained mutable singleton/cache is allowed.

- [ ] **Step 6: Implement deterministic HTML overlay**

Produce self-contained markup from controlled presentation fields. Use CSS safe-area offsets, a large primary progress cluster, contextual danger/result card, resource/record secondary cluster and caption region. Escape all text even though current data is controlled. The HTML must not include raw serialized snapshots.

- [ ] **Step 7: Run Phase 7 + Phase 1–6 regressions**

Expected: base Phase 7 tests GREEN and all earlier Eko tests unchanged.

Commit message:

```text
feat(eko-run): implement phase 7 broadcast presentation core
```

---

### Task 4: Adversarial Review Pass 1 — HUD Hierarchy, Mobile Safe Areas and Event Storms

**Files:**
- Create: `tests/phase7/eko-run-review-pass1.test.cjs`
- Modify focused broadcast files only after RED is observed.
- Create at closure: `evidence/eko-run/phase7/PHASE-07-REVIEW-1.md`

**Interfaces:**
- Attacks: layout bounds, primary/danger/card coexistence, low-tier priority, event-storm caps.

- [ ] **Step 1: Commit tests-only RED attacks**

Tests must cover 390×844 and 1366×768 safe areas; simultaneous danger + checkpoint/reward/caption; >100 synthetic recent events; low-quality degradation; and ensure primary progress/danger never disappears.

- [ ] **Step 2: Observe RED and classify root causes**

Do not weaken assertions to fit current behavior. Distinguish invalid fixture from product defect.

- [ ] **Step 3: Implement minimum hierarchy/budget fixes**

Typical valid fixes may include deterministic card suppression, stronger critical retention, safe-area clamping and mobile secondary-card reduction. Never suppress the safe route/danger/progress to preserve decoration.

- [ ] **Step 4: Run focused and regression suites to GREEN**

Commit RED and fix separately so the review history is auditable.

---

### Task 5: Adversarial Review Pass 2 — Multimodal Correctness and Failure Semantics

**Files:**
- Create: `tests/phase7/eko-run-review-pass2.test.cjs`
- Modify: `presentation/broadcast/feedback.ts` and related focused files only after RED.
- Create at closure: `evidence/eko-run/phase7/PHASE-07-REVIEW-2.md`

**Interfaces:**
- Attacks: duplicate/stale/future cues, voice priority, muted/reduced variants, gameplay failure vs integrity failure.

- [ ] **Step 1: Add tests-only RED attacks**

Require duplicates to emit once, stale/future events to emit zero cues, system/integrity feedback to outrank gameplay rewards, gameplay failure copy to differ from quarantine/integrity state, and every critical normal-mode cue to retain caption/visual meaning under mute/reduced variants.

- [ ] **Step 2: Observe RED before fixes**

Use exact failing assertions to diagnose priority/dedupe/accessibility behavior.

- [ ] **Step 3: Fix semantic mapping and budgets**

Preserve deterministic ordering. Do not add wall clock or external state. Keep audio bus/voice caps explicit.

- [ ] **Step 4: Re-run Phase 7 + Phase 1–6 regressions**

No unresolved stop-ship/P1/P2 Review Pass 2 finding before moving on.

---

### Task 6: Adversarial Review Pass 3 — Reconstruction, Leakage, Performance and Browser Capture

**Files:**
- Create: `tests/phase7/eko-run-review-pass3.test.cjs`
- Create: `tests/browser/eko-run-phase7.spec.cjs` or repository-equivalent Playwright test path.
- Create: `scripts/run-eko-run-phase7-evidence.cjs`
- Modify: `.github/workflows/eko-run-phase7.yml`
- Create at closure: `evidence/eko-run/phase7/PHASE-07-REVIEW-3.md`

**Interfaces:**
- Attacks: malformed options, snapshot privacy, reconstruction equality, repeated composition bounds, sampling rate, browser safe zones and timing tails.

- [ ] **Step 1: Add RED reconstruction/privacy attacks**

Assert malformed viewport/safe-area/hz options fail typed/closed; repeated same-input composition is deep-equal; source snapshot remains unchanged; HTML does not contain root seed/random stream/provider/debug fields; 30/60/120 sampling preserves semantic cue hierarchy.

- [ ] **Step 2: Add deterministic performance evidence runner**

Build representative snapshots for running, danger, intermission, failure, integrity and storm states. Measure `createBroadcastPresentation` p50/p95/p99/worst over a fixed workload and fail when p99 ≥1.0 ms or worst ≥4.0 ms. Verify arrays never exceed 12 feedback cues / 8 audio voices.

- [ ] **Step 3: Add Playwright layout/capture verification**

For 390×844 and 1366×768, render HTML, assert primary progress and immediate danger bounding boxes remain inside viewport/safe frame and do not overlap the reserved caption region. Capture representative PNG evidence for normal, muted/reduced and low-tier storm/intermission states.

- [ ] **Step 4: Observe RED, fix root causes, rerun**

Keep browser/capture claims exact: this proves browser raster layout/legibility, not a full production video encoder chain.

- [ ] **Step 5: Run dedicated Phase 7 workflow and full catalogue CI on exact runtime/evidence candidate**

Record run IDs, artifact IDs/digests, test counts and measured timing before closure documentation.

---

### Task 7: Phase 7 Experience Review and Closure

**Files:**
- Create: `evidence/eko-run/phase7/PHASE-07-RESULTS.md`
- Create: `evidence/eko-run/phase7/PHASE-07-EXPERIENCE-REVIEW.md`
- Create: `evidence/eko-run/phase7/PHASE-07-REVIEW-1.md`
- Create: `evidence/eko-run/phase7/PHASE-07-REVIEW-2.md`
- Create: `evidence/eko-run/phase7/PHASE-07-REVIEW-3.md`
- Modify: `games/eko-street-run/phases/PHASE-07-PRESENTATION-HUD-AUDIO-GAME-FEEL.md`
- Modify: `games/eko-street-run/REQUIREMENT_TRACEABILITY.md`

**Interfaces:**
- Consumes: exact runtime/evidence candidate results.
- Produces: auditable Phase 7 closure and next-phase baseline.

- [ ] **Step 1: Conduct 22-domain review**

Apply all 22 Eko specialist lenses, with especially strict review from creative direction, architecture, physics, game-feel/VFX, performance, platformer experience, audio, livestream HUD, viewer retention and simulation QA.

- [ ] **Step 2: Record representative-moment experience review**

Use the finding format:

```text
Moment → Expected experience → Observed experience → Why → Severity → Exact improvement → Verification test
```

Include stop-ship verdict, 100-point diagnostic score, Lagos identity review, mobile/low-tier evidence and regression requirements. Score never overrides a stop-ship defect.

- [ ] **Step 3: Freeze exact evidence**

Results include exact SHA, focused/full CI IDs, artifact IDs/digests, browser capture manifest, test counts, authority-checksum-neutrality result, p50/p95/p99/worst presentation timing and accessibility/storm budget results.

- [ ] **Step 4: Commit closure docs atomically**

Update traceability only for evidence-backed Phase 7-owned presentation subsets. Do not mark AI/viewer/production scopes complete.

Commit message:

```text
docs(eko-run): close phase 7 broadcast presentation evidence
```

---

### Task 8: PR, Merge and Post-Merge Verification

**Files:** no new behavior files unless a check exposes a root-cause defect.

**Interfaces:**
- Consumes: verified Phase 7 closure head.
- Produces: Phase 7 integrated `main` baseline for Phase 8.

- [ ] **Step 1: Open Phase 7 PR as draft**

PR body records phase scope, three review passes, exact tests/evidence, determinism/replay impact, performance, stream UX/audio/accessibility, privacy, recovery, rollback and remaining risks.

- [ ] **Step 2: Require exact-head focused and full catalogue success**

If any check fails, diagnose/fix root cause and regenerate affected evidence. Do not rerun flaky checks until green and call them passing.

- [ ] **Step 3: Mark ready and merge with expected head SHA**

Use a merge commit so Phase history remains explicit.

- [ ] **Step 4: Verify exact merge SHA on `main`**

Poll all triggered push workflows and require success. Confirm main head equals the Phase 7 merge commit and inspect Phase 7 docs/evidence on main.

- [ ] **Step 5: Only then mark Phase 7 complete**

Phase 8 may branch only from this verified merge SHA.

## Plan self-review

- Spec coverage: HUD, danger, record/resources, honest future slots, exact audio buses, semantic VFX, event-storm bounds, accessibility, privacy, reconstruction, performance, browser capture, regressions, three review passes, evidence and merge protocol all have explicit tasks.
- Placeholder scan: no implementation placeholder/TODO language is used; future-phase features are explicitly non-goals rather than deferred pseudo-implementation.
- Type consistency: `EkoRunRenderSnapshot` → `BroadcastPresentationOptions` → `createBroadcastPresentation` → `BroadcastPresentation` → `renderBroadcastOverlayHtml` is the single presentation data path used by later tasks.
