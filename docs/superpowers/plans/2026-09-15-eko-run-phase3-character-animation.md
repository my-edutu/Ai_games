# Eko Run Phase 3 — Character, Outfits and Animation Implementation Plan

## Goal

Create Tayo's presentation-domain character system with four respectful Nigerian/Lagos-inspired outfit families and deterministic animation-state selection, while proving that costume, pose, animation sampling and reduced-motion presentation cannot alter authoritative collision or checksums.

## Approved design constraints

- Authoritative gameplay remains owned by the fixed-step TypeScript simulation.
- Character art, outfit geometry, cloth/decorative extents and animation phase are presentation-only.
- All four outfits use the same canonical `tayo-standard` collision profile and zero mechanical modifiers.
- Animation state is derived from immutable render snapshots/events and authoritative ticks; `Date.now`, frame delta and ambient randomness are forbidden.
- The semantic silhouette must keep head, hands, hips/body direction and both feet readable in critical traversal states.
- Cultural identity is communicated through silhouette, garment construction, pattern vocabulary and palette roles—not stereotypes, behavioural modifiers or caricature.
- Reduced-motion changes presentation amplitude/cycling only; it cannot erase critical state distinctions.
- Phase 3 does not claim final Three.js meshes, final cloth simulation, camera, Lagos world, traffic, audio or hazard fairness.

## 22-skill review map

| Specialist | Phase 3 load-bearing question |
|---|---|
| game-creative-direction | Does Tayo have a coherent original Lagos/Nigerian visual identity rather than themed decoration? |
| gameplay-progression | Do poses preserve readable progress/action states without inventing progression mechanics? |
| difficulty-failure-balancing | Can animation ever hide, delay or misrepresent failure/recovery timing? |
| procedural-generation | Are future cosmetic variants isolated from authoritative/random route streams? |
| game-economy-rewards | Are outfits cosmetic-only with no hidden power or entitlement advantage? |
| platformer-experience-review | Are silhouette, takeoff, apex, landing, slide, hit/recovery and failure readable at gameplay speed? |
| game-architecture | Is presentation unable to mutate authority, state or provider data? |
| autonomous-agent-design | Will the same public pose semantics remain valid for future AI-controlled Tayo? |
| deterministic-simulation | Is animation phase tied to tick/snapshot and render-schedule independent? |
| game-physics | Do all outfits preserve the exact authoritative body/collision contract? |
| game-audio | Are semantic animation states suitable for later cross-modal cue mapping without audio-only meaning? |
| game-feel-vfx | Do anticipation/action/impact/recovery priorities stay clear and bounded? |
| livestream-hud | Does Tayo remain readable at mobile/broadcast scale without HUD dependence? |
| viewer-retention | Do poses make near-miss/failure/recovery understandable without fake drama? |
| audience-interaction | Can future cosmetic selection remain outside authoritative outcome control? |
| crowd-moderation | Does the design avoid arbitrary public text/naming surfaces? |
| security-privacy | Are public presentation models free of private/provider/internal data? |
| long-running-reliability | Are animation outputs stateless/bounded and reconstructible after renderer restart? |
| performance-optimization | Are pose/model outputs small, bounded and allocation-conscious enough for future rendering? |
| game-analytics-experimentation | Are pose IDs/state transitions stable semantic labels rather than high-cardinality telemetry? |
| simulation-qa | Are outfit parity, state precedence, render cadence and regressions falsifiable? |
| production-readiness-review | Are claims limited to Phase 3 presentation contracts, not production readiness? |

## TDD sequence

### Task 1 — Character/outfit contract RED

Create `tests/phase3/eko-run-character-presentation.test.cjs` before implementation. Require:

- exactly four stable outfit IDs;
- unique cultural/style notes and palettes;
- `collisionProfile: tayo-standard` for every outfit;
- no mechanical modifiers;
- required landmark visibility for critical body parts;
- bounded decorative silhouette envelope.

Expected first result: module missing / Phase 3 workflow red.

### Task 2 — Animation semantics

Implement presentation-only character types and resolver under `games/eko-street-run/src/presentation/character/`.

Required states: idle, acceleration, run, brake, takeoff, ascent, apex, descent, landing, slide, vault, hit, recovery, failure, celebration. Reserve anticipation and near-miss definitions for later authoritative/public triggers rather than fabricating hidden state.

Precedence: terminal lifecycle > vault/stumble/slide/landing > jump event/air vertical state > grounded locomotion.

### Task 3 — Deterministic pose model / preview

Implement a bounded declarative pose model and deterministic SVG renderer. It must:

- use tick-derived phase;
- preserve critical landmarks;
- provide outfit-specific garment/pattern layers without changing gameplay body truth;
- escape/avoid arbitrary text;
- provide reduced-motion variants;
- be reconstructible from render snapshot + outfit selection only.

### Task 4 — Authority isolation regressions

Prove:

- selecting/rendering every outfit leaves authoritative state/checksum unchanged;
- same authoritative tick resolves the same semantic animation/pose under 30/60/120 presentation sampling;
- unknown outfit IDs fail closed to the declared safe default or typed error;
- returned presentation structures are deeply frozen or otherwise mutation-isolated;
- no `Date.now`, `new Date`, `Math.random`, timers, provider imports or authority writes exist in Phase 3 presentation modules.

### Task 5 — Review pass 1: silhouette and precedence

Adversarial targets:

- terminal state overridden by stale movement state;
- landing pose skipped because velocity is already grounded;
- slide/vault garment layers obscure feet/body direction;
- outfit decorative bounds exceed broadcast-safe silhouette.

Write tests first, observe RED for any discovered defect, fix only real findings.

### Task 6 — Review pass 2: parity and accessibility

Adversarial targets:

- reduced-motion collapses rise/fall/slide/vault distinctions;
- outfit variant changes landmark visibility or pose bounds;
- culturally styled metadata implies behavioural/mechanical traits;
- high-contrast/monochrome semantic roles depend on hue alone.

### Task 7 — Review pass 3: cadence/recovery/reconstruction

Adversarial targets:

- render sampling causes animation phase drift;
- renderer restart cannot reconstruct current frame from snapshot;
- rapid state transitions produce invalid phase/NaN/out-of-range values;
- stale/unknown recent events override current terminal truth.

### Task 8 — Evidence and closure

- Dedicated Phase 3 workflow: Phase 3 tests + Phase 2 + Phase 1 regressions.
- Full catalogue CI on exact runtime candidate.
- Record experience review using the full rubric with non-implemented categories scored/deferred honestly.
- Record three specialist review passes and all RED→GREEN evidence.
- Update `PHASE-03-CHARACTER-ANIMATION.md`, requirement traceability and `evidence/eko-run/phase3/PHASE-03-RESULTS.md`.
- Re-run dedicated and full catalogue CI on the docs-only closure SHA before branching Phase 4.
