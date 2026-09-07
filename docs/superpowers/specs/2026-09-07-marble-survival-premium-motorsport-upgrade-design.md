# Marble Survival Tournament — Premium Motorsport Upgrade Design

**Status:** Approved design for implementation planning  
**Date:** 2026-09-07  
**Game:** Game 7 — Marble Survival Tournament  
**Repository:** `my-edutu/Ai_games`  
**Upgrade branch:** `feat/game7-premium-motorsport-upgrade`  
**Baseline branch:** `feat/game-7-marble-survival`  
**Baseline commit:** `561ed0e633558ea99a0cd9a8c7b0261803ab88fe`  
**Existing PR:** #20 — open, unmerged  
**Design class:** authority-first surgical upgrade; no repository-wide rebuild

## 1. Decision Summary

Upgrade the existing Marble Survival Tournament into a physically believable, premium miniature motorsport spectator game while preserving tournament truth and low-end operation.

The implementation will:

1. make `MarbleRuntime` the only authoritative live tournament runtime used by the browser/OBS surface;
2. remove the parallel synthetic broadcast campaign loop;
3. fix winner-critical finish, elimination, moving-obstacle, recovery, and replay defects using a versioned deterministic physics/rules upgrade;
4. preserve the five-round 32 → 16 → 8 → 4 → 2 → 1 tournament;
5. retain active autonomous marble agents but improve only their legal observation/decision model, never their physical privileges;
6. replace the neon-dashboard visual language with **Precision Miniature Motorsport** using the existing Canvas renderer first;
7. make cameras, HUD, audio, VFX, replay, and quality presets consumers of sanitized snapshots and semantic events only;
8. preserve bounded viewer influence but integrate gameplay-changing effects through authority rather than a disconnected presentation queue;
9. protect 60 Hz authoritative simulation across all visual quality tiers;
10. treat R5 production readiness as external evidence, not a source-code label.

This design deliberately rejects a broad rebase of the old Game 7 branch and rejects an immediate Three.js/WebGL rewrite. Current `main` standards are applied selectively through contracts and tests rather than by blindly merging 128 unrelated commits into the Game 7 candidate.

## 2. Current-State Diagnosis

### 2.1 Sound foundations to preserve

The baseline already contains:

- fixed-point integer physics;
- a seeded `MarbleRuntime`;
- deterministic roster and arena generation;
- active marble policies with bounded actions;
- a five-round elimination structure;
- snapshot/checksum primitives;
- deterministic tests for wall, obstacle, bumper, pair collision, runtime replay, restore, and quarantine;
- responsive browser assets and clean-feed concepts;
- documented R4/R5 evidence separation.

These systems are retained unless a confirmed defect requires a scoped change.

### 2.2 P1 architecture defects

The current browser/OBS server does not advance `MarbleRuntime`. It runs a separate precomputed campaign and presentation clock, including synthetic near-miss events and hard-coded round timing. This violates the approved ownership rule that `MarbleRuntime` is the sole authority.

The upgrade must therefore unify the broadcast path with the TypeScript authority before visual polish is treated as complete.

### 2.3 P1 tournament correctness defects

The baseline requires explicit fixes for:

- same-tick finish ordering currently inheriting iteration/ID order;
- all-remaining-marble elimination not resolving immediately and safely;
- simultaneous elimination cohorts near a qualification boundary;
- a final producing no legitimate survivor/champion;
- shield recovery using a presentation-like positional displacement rather than a causal physical recovery policy;
- replay/presentation behavior that can be detached from live authority.

### 2.4 P1/P2 physical truth defects

The baseline models moving sweepers as translating axis-aligned rectangles but the public renderer depicts a rotating arm. The solver also does not use moving-obstacle velocity as part of contact response.

Visible geometry, moving transforms, collision geometry, and semantic contact data must agree.

### 2.5 P2 presentation defects

The existing presentation is a dark neon grid with glowing spheres, simple rectangles, permanent dashboard panels, raw technical fields such as tick/camera/feed/checksum, and a large audience-vote surface. It does not yet communicate a constructed miniature sporting installation.

## 3. Viewer Promise

> Viewers follow distinctive autonomous marbles through a beautifully engineered miniature tournament, understand the current danger and qualification pressure immediately, and trust that every elimination and victory came from the same visible physical competition they watched.

A new viewer must identify within ten seconds:

- which round is active;
- how many marbles remain and how many qualify;
- at least one identifiable marble worth following;
- the immediate obstacle or danger;
- the qualification cutoff or finish objective;
- whether an audience effect is currently active or upcoming.

## 4. Creative Direction — Precision Miniature Motorsport

### 4.1 Core impression

The arena should look like a premium physical tabletop competition installation rather than a sci-fi dashboard.

Primary visual references are expressed as design rules rather than external asset dependencies:

- warm ivory / light mineral track surfaces;
- charcoal structural bases and supports;
- restrained brushed-metal mechanisms;
- amber/red functional danger markings;
- dark rubber, ceramic, enamel, glass-like, or metallic marble finishes;
- clear joints, rails, seams, thickness, supports, pivots, and contact shadows;
- quiet background and generous negative visual space around the actual competition.

### 4.2 Forbidden visual shortcuts

Do not use:

- neon grid as the primary world identity;
- permanent glow on every marble;
- oversized background typography;
- decorative machinery unrelated to gameplay;
- floating track slabs with no apparent support where visible support is expected;
- visual sweepers/gates whose transform differs from authority;
- speed trails that obscure trajectory;
- particles as the main definition of polish;
- expensive post-processing as a prerequisite for readability.

### 4.3 Material language

Marble presentation supports a bounded authored material set:

- polished ceramic;
- enamel;
- opaque glass-like;
- satin metal;
- polished metal for selected identities.

Material is presentation-only. It never changes mass, acceleration, friction, restitution, radius, shield eligibility, steering budget, AI information, or tournament probability.

### 4.4 Competitor identity

Every marble remains identifiable by at least four independent signals:

- number;
- primary/secondary colour combination;
- pattern or stripe/swirl geometry;
- emblem or silhouette mark.

Rotation must preserve recognisability. The identity system cannot depend on colour alone.

## 5. Architecture

### 5.1 Authoritative ownership

`MarbleRuntime` remains the sole owner of live gameplay state.

No HTTP handler, renderer, animation frame, audio callback, vote UI, camera controller, replay player, analytics process, or operator surface may directly mutate marble position, velocity, status, qualification, elimination, round state, records, or winner.

### 5.2 Runtime data flow

```text
validated operator/audience requests
              |
              v
        command scheduler
              |
              v
       MarbleRuntime 60 Hz
              |
     +--------+---------+
     |                  |
semantic events    immutable render snapshot
     |                  |
     +---------+--------+
               v
      presentation/broadcast host
        |      |      |      |
      HUD    camera   audio   VFX
               |
               v
        optional replay buffer
```

### 5.3 Live host

The live browser/OBS host may use wall-clock time only to determine **how many fixed logical ticks are due**. Each authority step always advances exactly one fixed simulation tick.

Policy:

- target authority: 60 Hz;
- render target: independent 30/60 FPS depending on visual preset;
- maximum authority catch-up per host cycle: bounded and configurable;
- if scheduler debt exceeds the bound, presentation may skip/interpolate frames and health becomes degraded;
- authority delta is never enlarged;
- no synthetic gameplay event is injected because wall-clock time elapsed;
- pause/resume/restart are explicit authenticated commands;
- a hidden/slow browser tab must not silently become the simulation clock for the authoritative server process.

### 5.4 Proposed module boundaries

The implementation may introduce or strengthen the following focused units:

- `src/runtime/run.ts` — authoritative lifecycle and system order;
- `src/rules/tournament.ts` — qualification, elimination, tie, result, round advancement;
- `src/physics/solver.ts` — fixed-step movement and collision;
- `src/physics/moving-collider.ts` — deterministic moving-collider transforms and velocities if separation improves clarity;
- `src/ai/policy.ts` — bounded observation/action policy if extracted from runtime;
- `src/influence/catalogue.ts` — fixed authored effect contracts;
- `src/influence/scheduler.ts` — validated, idempotent, tick-scheduled effects;
- `src/presentation/snapshot.ts` — allowlisted public render snapshot;
- `src/presentation/camera.ts` — presentation-only event-driven camera directives;
- `src/presentation/replay.ts` — bounded render-snapshot playback buffer;
- `src/presentation/feedback.ts` — semantic event severity/cue derivation;
- `scripts/serve-complete-runtime.cjs` — host compiled authority and static browser surface only;
- `public/complete-runtime/*` — renderer/HUD/audio controls, no game rules.

Exact file extraction is allowed only where it reduces mixed responsibility. Unrelated refactoring is out of scope.

## 6. Determinism and Versioning

### 6.1 Determinism envelope

The following must reproduce from game version, deterministic version, config, tournament seed, and normalized tick-indexed inputs:

- arena geometry and moving-obstacle transforms;
- marble actions;
- positions and velocities;
- physics contacts relevant to gameplay;
- checkpoint crossings;
- finish crossings and finish order;
- eliminations;
- shield/recovery effects;
- qualification cohorts;
- round progression;
- audience gameplay effects;
- champion;
- records;
- snapshots/checksums.

Permitted presentation nondeterminism includes purely cosmetic particles, non-authoritative audio variation, easing interpolation, and optional camera micro-motion.

### 6.2 Physics/rules version boundary

Winner-critical physics changes require a new deterministic version, provisionally:

`marble-physics-v2`

The exact final version string is chosen during implementation but must differ from the current v1 when finish adjudication or collision behavior changes.

Existing v1 snapshots/replays are not silently loaded into v2 authority. Supported policy:

- old fixtures remain readable for regression comparison where practical;
- active v1 snapshot restore into v2 fails with a typed incompatible-version result unless an explicit migration is proven;
- deployment crossing the v1 → v2 boundary begins a fresh tournament after current-run completion or an intentional operator boundary;
- rollback compatibility is documented before promotion.

## 7. Authoritative System Order

Per fixed tick:

1. lifecycle commands and validated operator commands;
2. due validated viewer influence commands;
3. derive moving-collider transforms and velocities for this tick/substep;
4. build legal observations;
5. compute bounded marble actions in stable ID order;
6. accumulate forces;
7. integrate motion using bounded substeps;
8. resolve world/static/moving/marble contacts in stable order;
9. detect checkpoint, finish, hazard, recovery, and elimination crossings/events;
10. adjudicate simultaneous cohorts;
11. resolve quota/last-standing/timeout/final outcome;
12. advance lifecycle state if required;
13. validate invariants;
14. emit ordered semantic events;
15. compute checksum material/render snapshot source.

Presentation consumes the completed tick only.

## 8. Physics V2 Design

### 8.1 Units and scale

Preserve the current integer fixed-point convention unless tests prove an incompatibility:

- 1 metre = 1,000 world units;
- integer positions and velocities;
- fixed logical tick;
- explicit speed, acceleration, friction, restitution, contact, substep, and iteration bounds.

### 8.2 Rolling presentation versus authority

The authoritative model does not need full rigid-body angular dynamics to remain credible.

Presentation derives a bounded orientation state from authoritative displacement/contact state:

- on grounded free movement, rotate proportionally to path distance;
- on sliding/impact, allow visual slip rather than forcing no-slip rotation;
- on recovery/airborne-like transitions, preserve momentum-consistent orientation changes;
- orientation cannot feed back into collision or AI.

### 8.3 Moving obstacles

For every moving obstacle, authority exposes:

- previous transform;
- current transform;
- substep transform or deterministic interpolation rule;
- translational velocity and, if a future obstacle genuinely rotates, angular state;
- visible geometry contract.

The renderer must consume the same public transform representation. A translating collider is rendered as translating; a rotating collider is implemented in authority before it is rendered as rotating.

Moving-obstacle contact uses relative velocity so an approaching sweeper can transfer momentum physically instead of acting like a static wall that teleported into place.

### 8.4 High-speed and dense contacts

Use the simplest sufficient method:

- bounded substeps based on displacement/radius;
- deterministic swept checks for thin outcome-critical geometry when substeps alone are insufficient;
- stable entity/contact ordering;
- bounded collision iterations;
- penetration tolerance and safe correction;
- no unbounded catch-up/substep loop.

### 8.5 Energy and stability guardrails

Tests and runtime invariants protect against:

- NaN/non-finite state;
- unbounded velocity;
- persistent penetration beyond tolerance;
- repeated contact resolution creating runaway energy;
- trapped marble inside a moving collider;
- pair piles exploding numerically;
- invalid restore/spawn overlap.

## 9. Finish and Elimination Adjudication

### 9.1 Finish crossings

Finish order is determined from authoritative crossing events, not loop iteration.

For each marble crossing the finish boundary during a tick:

1. retain previous and current authoritative positions;
2. calculate a deterministic crossing fraction within the tick using fixed/integer arithmetic;
3. sort crossing cohort by crossing fraction;
4. if fractions are exactly equal under the declared quantization, apply the documented stable tie policy;
5. assign finish rank once;
6. emit one qualification semantic event.

The stable-ID rule is an explicit final tie policy, never an accidental side effect of iteration.

### 9.2 Simultaneous eliminations

Eliminations discovered in the same authoritative tick are collected before bracket resolution.

If the cohort would reduce the remaining field below what is needed to fill the quota, adjudicate using the declared pre-elimination progress state and deterministic tie policy rather than silently awarding survival by array order.

### 9.3 All-fall behavior

A round may not remain indefinitely active with zero active/qualified competitors.

The rules must define one of these causal outcomes depending on the exact state:

- enough already-qualified marbles exist: resolve the round from confirmed qualifiers;
- a boundary cohort requires deterministic qualification adjudication: apply the documented cohort policy;
- no valid competitor can produce a champion: enter an explicit integrity/round-resolution state and restart safely rather than fabricate a winner.

A championship can never award `undefined`, an eliminated marble, or a presentation-selected marble as champion.

### 9.4 Shield/recovery

A shield prevents one otherwise valid hazard elimination only when the effect is legitimately present.

Recovery must be physically and competitively explicit:

- consume the charge exactly once;
- emit the recovery event exactly once;
- apply a bounded declared recovery impulse/state that does not teleport through geometry or advance progress unfairly;
- ensure recovery cannot cross the finish boundary or skip a checkpoint merely from correction;
- mark assisted record state when required by audience-effect rules.

## 10. Autonomous Marble Policy

The marbles remain active autonomous agents.

### 10.1 Observation contract

A marble may observe only bounded legal data such as:

- its current/previous transform and velocity;
- next checkpoint/finish direction;
- lane clearance within a bounded neighborhood;
- nearby marble positions/velocities;
- nearby hazards;
- moving-obstacle current phase/direction when visually/publicly knowable;
- current declared global influence field;
- its own progress and recovery state.

No future random draws, hidden opponent plans, unpublished hazard future state, or winner information is exposed.

### 10.2 Action contract

Preserve bounded steering and boost. Actions remain schema-validated and enter authority through the runtime.

Personality may influence utility weighting for:

- lane conservatism;
- gap seeking;
- sweeper timing;
- contact tolerance;
- momentum preservation;
- recovery route preference.

Personality may not modify physics material parameters or bypass collision/hazard rules.

### 10.3 Decision budgets

- decision cadence remains bounded and staggered;
- stable ID ordering resolves simultaneous decision scheduling;
- no remote model is required or permitted on the hot path;
- deterministic fallback is always available;
- stuck/oscillation/no-progress state is visible through bounded public intent keys only.

## 11. Arena Design Upgrade

### 11.1 Improve existing five arenas first

The five round archetypes remain:

1. Seeding Sprint;
2. Gate Gauntlet;
3. Hazard Circuit;
4. Final Four;
5. Championship.

Do not add a large new arena catalogue before these five are visually and physically credible.

### 11.2 Physical construction grammar

Every visible course should communicate:

- track/floor thickness;
- edge/rail purpose;
- supports where the geometry appears elevated;
- joints/pivots for moving mechanisms;
- distinct safe/qualification/hazard surfaces;
- sufficient marble clearance;
- visual contact agreement with colliders.

### 11.3 Functional palette

Suggested semantic roles:

- neutral track: warm ivory/mineral;
- structure: charcoal/dark graphite;
- machinery: brushed steel/gunmetal;
- qualification/progress: restrained green or teal accent;
- caution: amber;
- elimination/hazard: red/coral;
- system/recovery: cool blue;
- competitor identity: varied authored palettes.

Exact accessible contrast values are validated in browser captures rather than assumed from this prose.

## 12. Presentation Snapshot Contract

The public snapshot is an allowlist, not a serialized authority object.

It may contain only fields required for rendering and spectator understanding, for example:

- presentation schema/version;
- public tournament/round identity;
- lifecycle scene;
- survivor and quota counts;
- public arena dimensions and static geometry;
- moving-obstacle public transforms;
- marble public IDs, names, patterns, material keys, status, transform, velocity-derived presentation fields, progress, intent, qualification state;
- confirmed qualification cutoff/leaderboard data;
- current bounded influence presentation;
- public record comparison;
- camera directive;
- public health/degraded state when needed.

It must exclude:

- root/tournament seeds;
- RNG state;
- raw configuration where not needed publicly;
- operator token/audit internals;
- provider identities/payloads;
- payment evidence;
- private moderation data;
- raw exceptions/stacks;
- internal queue keys;
- hidden AI scores/plans.

## 13. Broadcast Camera

### 13.1 Camera modes

Use a restrained state machine:

- `overview` — establish field, obstacles, finish/qualification area;
- `pack` — follow a meaningful cluster while keeping route context;
- `danger` — show an imminent contested hazard;
- `finish` — protect decisive crossing visibility;
- `replay` — presentation-only playback after result confirmation;
- `victory` — confirmed champion ceremony.

### 13.2 Selection rules

- camera targets come from semantic events and render state;
- minimum dwell time prevents rapid switching;
- switching hysteresis prevents oscillation between similar targets;
- finish/qualification conflicts outrank decorative contacts;
- the final qualifying slot remains visible during decisive action;
- a close-up yields to overview when multiple simultaneous decisive events require context;
- reduced-motion mode uses stable framing and minimal zoom/cuts.

Camera state is never authoritative.

## 14. Replay

Replay uses a bounded presentation buffer of render snapshots and semantic events.

Rules:

- live authority continues independently;
- replay never writes into authority;
- replay begins only after the authoritative result/qualification is known unless explicitly showing a non-decisive retrospective moment;
- public UI labels replay state clearly;
- replay buffer size and duration are capped by quality preset/resource budget;
- replay loss/corruption degrades by skipping replay, never by replaying authority or modifying result.

## 15. Spectator HUD

### 15.1 Persistent public hierarchy

**Top rail**

- tournament identity;
- round name/number;
- `N remain → Q qualify`;
- concise record/round context only when relevant.

**Compact side rail**

- leading contenders;
- qualification cutoff;
- favourite/danger state;
- no more rows than remain readable at phone-viewed stream size.

**Bottom semantic rail**

- one or a few high-priority event messages;
- caption-safe placement;
- bounded text and dwell.

### 15.2 Remove from normal public HUD

Move these to operator/debug-only surfaces unless a specific public need is demonstrated:

- raw tick number;
- checksum;
- camera mode name;
- feed implementation mode;
- queue depth;
- detailed performance telemetry;
- internal health diagnostics.

### 15.3 Status semantics

Use icon/shape/text plus color for:

- active;
- at risk;
- qualifying cutoff;
- qualified;
- eliminated;
- champion;
- assisted tournament;
- replay;
- provider degraded;
- technical recovery/quarantine.

A proximity-based ranking must never be labelled as confirmed finish order.

### 15.4 Audience UI priority

Audience interaction is contextual rather than permanently dominant.

When no valid decision window is open, the vote surface collapses to a small next-opportunity/status element. During decisive race action, gameplay information outranks acknowledgements.

## 16. Canvas Rendering Strategy

### 16.1 Keep Canvas 2D for this upgrade

Use the current renderer effectively before considering WebGL/Three.js.

Canvas can deliver the required look through:

- cached arena background/structure layers;
- 2.5D shading and drop/contact shadows;
- beveled edges and surface seams;
- authored material gradients;
- marble radial lighting and specular highlights;
- visible hardware pivots/supports;
- restrained parallax/scale cues;
- pooled transient particles;
- DPR-aware quality tiers.

### 16.2 Future renderer replacement boundary

A future WebGL renderer is eligible only if profiling and design evidence show Canvas cannot meet the desired presentation at supported hardware targets.

A renderer replacement must consume the same public snapshot/event contracts and must not require tournament-rule changes.

## 17. Marble Presentation and Rotation

Each marble rendering pipeline includes:

1. contact shadow;
2. base material body;
3. identity pattern/emblem;
4. orientation transform from displacement-derived presentation state;
5. curvature highlight/specular cue;
6. state outline/icon only when needed;
7. optional low-density effect for qualification/elimination/impact.

The physical radius shown on screen remains consistent with authoritative scale. No close-up may visually enlarge a marble relative to rails/obstacles in a way that misrepresents collision bounds.

## 18. Audio

### 18.1 Phase-one audio implementation

Prefer procedural/original Web Audio cues before introducing external asset dependencies.

Semantic cue groups:

- countdown/start;
- rolling/movement texture;
- light/medium/heavy physical impact;
- gate/sweeper machinery;
- warning/danger;
- qualification;
- elimination;
- audience effect acknowledgement;
- replay indicator;
- champion/victory;
- intermission/recovery.

### 18.2 Impact mapping

Impact sound intensity derives from semantic contact impulse bands. A minor brush cannot produce a crash-level sound.

### 18.3 Voice and fatigue limits

- explicit global voice cap;
- per-cue cooldown/deduplication;
- lower-priority contacts merge/drop during storms;
- music/ambience never remains at maximum intensity continuously;
- sound starts only after browser user gesture where required;
- muted operation preserves all critical meaning visually;
- audio failure does not affect authority.

## 19. VFX and Feedback

Priority:

1. integrity/result;
2. immediate elimination/qualification danger;
3. major tournament milestone;
4. audience influence acknowledgement;
5. significant impact;
6. ambient decoration.

Allowed restrained effects include:

- contact dust/puff;
- surface impulse ring for major collisions;
- subtle qualification highlight;
- limited hazard response;
- bounded champion confetti/ceremony.

Do not use sparks for every collision, constant glow, permanent trails, or repeated camera shake.

## 20. Viewer Influence

### 20.1 Preserve existing product intent

Do not add new paid mechanics, providers, or backend dependencies as part of this visual/physics upgrade.

Gameplay-changing influence must pass through authority as a tick-scheduled, validated, idempotent command.

Presentation-only choices may remain outside authority only if they provably cannot alter gameplay state or AI observation.

### 20.2 Fairness

No audience effect may:

- select a winner;
- guarantee qualification/elimination;
- change a single marble's hidden physics privilege based on popularity;
- apply twice after reconnect/restore;
- bypass cooldown/eligibility because it is paid;
- remain invisible when it changes gameplay.

## 21. Quality Presets

All presets run the same authoritative simulation and tournament rules.

| Preset | Render target | DPR | Shadows/materials | Particles/replay | Authority |
|---|---|---:|---|---|---|
| Low | stable 30 FPS target | 1.0 | cached/simple | minimal/short | identical 60 Hz |
| Balanced | 60 FPS target where supported | capped moderate | richer contact shading | restrained | identical 60 Hz |
| High | 60 FPS target | higher capped | richer reflections/shadows | richer but bounded | identical 60 Hz |
| Ultra | high-resolution/4K-capable where measured | hardware-capped | most detailed supported | richest bounded | identical 60 Hz |

Quality adaptation uses hysteresis and manual override.

Degradation order:

1. ambient particles;
2. secondary shadows/reflections;
3. decorative animation frequency;
4. replay visual richness/duration;
5. noncritical audio voices;
6. DPR/output resolution only after decorative reductions.

Never degrade:

- physics timestep/substeps required for correctness;
- AI legality/fairness;
- competitor count;
- authoritative event processing;
- finish/elimination adjudication;
- critical danger/qualification HUD;
- accessibility equivalents;
- audit/recovery integrity.

## 22. Performance Budgets

Current documented budgets remain provisional until measured on the upgraded branch.

Target evidence should record:

- reference CPU/GPU/device or emulation profile;
- resolution and quality preset;
- 32-marble busiest round and contact-storm seed;
- authority tick p50/p95/p99/worst;
- presentation frame p50/p95/p99/worst;
- canvas draw calls/major operations where measurable;
- allocation/GC behavior;
- replay/effect buffer sizes;
- memory slope over repeated tournaments;
- stalls during arena transition/first material use;
- quality-tier transition behavior.

A stated 30/60 FPS target is not a pass until measured.

## 23. Reliability and Recovery

### 23.1 Resource bounds

Bound and lifecycle-manage:

- semantic event history;
- contact summaries;
- render/replay snapshots;
- VFX objects;
- audio voices/nodes;
- timers/listeners;
- audience dedupe/queue state;
- operator audit;
- cached canvas layers;
- browser UI nodes/cards.

### 23.2 Recovery truth

After interruption:

- restore validates schema, deterministic version, checksum, round invariants, active/qualified sets, event continuity, and RNG state where applicable;
- duplicate qualification/champion/influence application is prohibited;
- renderer/audio restart reconstructs from the latest public snapshot without modifying authority;
- unrecoverable integrity uncertainty enters quarantine/fresh-run flow rather than fabricating continuity.

### 23.3 Hidden-tab behavior

Do not add browser auto-pause that stops an unattended stream. Authority is hosted independently of render animation cadence.

## 24. Error Handling

Typed failures should distinguish:

- invalid command/input;
- incompatible deterministic/snapshot version;
- numeric/physics integrity failure;
- impossible tournament invariant;
- renderer presentation failure;
- audio suspension/failure;
- audience/provider degradation;
- persistence/recovery failure;
- resource pressure.

Public output uses restrained safe states such as:

- `Reconnecting — tournament continues`;
- `Replay unavailable`;
- `Audience voting temporarily unavailable`;
- `Restoring verified tournament state`;
- `Tournament integrity check — starting a fresh verified run`.

Operator diagnostics may include detailed reason codes and evidence references. Public output never exposes stack traces, seeds, provider IDs, tokens, or raw payloads.

## 25. Testing Strategy

Behavior changes use red-green-refactor.

### 25.1 Required defect-first tests

Before corresponding implementation changes, add focused failing tests for:

1. live broadcast host must advance `MarbleRuntime`, not a parallel campaign;
2. render schedule at 30 versus 60 FPS cannot change authoritative checksum/champion;
3. same-tick finish order uses crossing fraction rather than iteration/ID order;
4. exact crossing ties follow the declared stable tie policy;
5. simultaneous multi-elimination cannot corrupt quota/bracket state;
6. all-remaining-marble elimination resolves safely without indefinite active state;
7. championship cannot emit an invalid/undefined/eliminated champion;
8. shield recovery applies once and cannot teleport across finish/checkpoint geometry;
9. moving sweeper transform is identical between authority snapshot and renderer contract;
10. moving sweeper relative velocity transfers bounded momentum;
11. high-speed contact with thin outcome-critical geometry cannot tunnel;
12. dense 32-marble pile-up remains bounded and finite;
13. replay never mutates authority;
14. restore does not duplicate qualification, champion, or influence events;
15. visual quality preset changes cannot alter authority checksums.

### 25.2 Existing regression suites to retain

Keep or strengthen coverage for:

- config bounds;
- deterministic roster;
- arena validity;
- world/obstacle/bumper/marble contacts;
- pair-order stability;
- twin runtime replay;
- snapshot corruption rejection;
- automatic restart;
- integrity quarantine.

### 25.3 Campaign/property tests

Add seeded campaigns for:

- maximum 32-marble field;
- pile-ups/contact storms;
- fast sweepers/gates;
- simultaneous finishes;
- multiple same-tick eliminations;
- stalled rounds;
- all-fall edge cases;
- championship ties;
- audience-effect/no-audience comparison;
- restore during active round/result/intermission;
- identical tick-indexed inputs across render schedules;
- quality preset equivalence.

### 25.4 Presentation/browser evidence

Capture representative scenes at:

- 1920×1080;
- 1366×768;
- narrow landscape;
- representative phone viewport viewing the landscape broadcast;
- Low and Balanced quality;
- reduced motion;
- clean feed;
- qualification pressure;
- dense contact;
- replay;
- champion ceremony;
- provider degraded/recovery state.

Visual review must inspect screenshots/video; passing DOM checks alone are insufficient.

## 26. Implementation Passes

### Pass 1 — Truth Baseline

- freeze baseline commit and upgrade branch;
- repair missing/broken verification paths;
- establish runnable TypeScript authority in the broadcast host;
- remove synthetic gameplay events/round clock from live presentation;
- add regression tests for runtime ownership and render-schedule independence.

### Pass 2 — Tournament and Physics Correctness

- crossing-time finish adjudication;
- simultaneous elimination/all-fall/final edge cases;
- moving-obstacle transform/velocity contacts;
- bounded physical recovery;
- deterministic version transition;
- replay/snapshot compatibility rules.

### Pass 3 — Visual Foundation

- Precision Miniature Motorsport palette/material system;
- arena structural depth, rails, seams, supports, contact shadows;
- physical marble material/identity/rotation presentation;
- public snapshot transform agreement;
- remove misleading rotating sweeper depiction unless authority rotates.

### Pass 4 — Spectator Experience

- event-driven camera director;
- compact HUD hierarchy;
- qualification cutoff and contender readability;
- bounded semantic audio/VFX;
- replay presentation;
- champion/result/intermission choreography.

### Pass 5 — Performance and Reliability

- quality tiers and hysteresis;
- static layer caching/pooling/bounds;
- crowded-scene profiles;
- repeated tournament resource tests;
- restore/restart/replay cleanup;
- responsive/accessibility captures;
- updated operational runbook/evidence manifest.

## 27. Acceptance Gates

### 27.1 Tournament truth

Pass only when:

- the live broadcast runs the same `MarbleRuntime` rules as headless execution;
- 32 → 16 → 8 → 4 → 2 → 1 remains exact for standard configuration;
- same-tick finishes/eliminations have explicit deterministic adjudication;
- no presentation path can select or alter winner;
- replay/restore/quality preset cannot alter authority;
- duplicate events/effects are prevented.

### 27.2 Physical credibility

Pass only when:

- visible moving geometry matches collision geometry;
- marbles do not visibly tunnel through rails/obstacles at validated speeds;
- moving obstacles transfer momentum credibly;
- dense contacts remain stable and bounded;
- contact feedback intensity matches semantic physical severity;
- marble rotation/sliding presentation does not claim physics that authority did not produce.

### 27.3 Spectator comprehension

Pass only when representative uninstructed review can identify within ten seconds:

- followed marble identity;
- current danger;
- survivor/quota state;
- qualification cutoff;
- why the confirmed winner won.

### 27.4 Performance

Pass only when measured evidence shows the selected quality presets meet declared frame/tick budgets on documented hardware/workloads without changing authority.

### 27.5 Production language

This upgrade may reach software-candidate status after fresh automated and manual evidence. It must not claim R5/unattended production readiness until genuine required elapsed soak, canary, security, accessibility, recovery, provider, and capacity evidence exists.

## 28. Rejected Approaches

### 28.1 Broad rebase before Game 7 repair

Rejected because the branch is deeply diverged and a broad rebase would introduce a large unrelated conflict surface before the Game 7 runtime split is corrected.

Selective adoption of current catalogue standards is safer.

### 28.2 Immediate Three.js/WebGL rewrite

Rejected for this upgrade because:

- authority/presentation truth is the first blocker, not polygon count;
- Canvas can deliver substantially better physical presentation with lower risk;
- a 3D rewrite would increase GPU cost, dependency scope, asset burden, and low-end uncertainty;
- the renderer can be replaced later behind the same public snapshot/event contracts if measured evidence justifies it.

### 28.3 Preserve synthetic campaign as a broadcast-only shortcut

Rejected. A stream-facing game cannot truthfully claim deterministic physical competition while the displayed broadcast advances a separate synthetic tournament state.

## 29. Non-Goals

This upgrade does not:

- merge PR #20 or `main` automatically;
- add new payment systems/providers;
- introduce remote language models for marble movement;
- create dozens of new arenas;
- guarantee 4K/60 FPS on unmeasured hardware;
- claim bit-identical cross-platform physics without evidence;
- certify R5 production readiness;
- replace valid existing deterministic systems solely for code-style preference;
- add hidden rubber-banding or outcome forcing.

## 30. Definition of Done for Implementation

The implementation is complete only when the branch contains functioning code and evidence demonstrating:

- one real authority path from `MarbleRuntime` to broadcast;
- fixed tournament edge cases with regression tests;
- physically consistent moving obstacles and recovery;
- upgraded miniature-motorsport visuals at normal camera distance;
- compact spectator-first HUD;
- event-driven camera/replay/audio/VFX;
- quality presets with invariant authority;
- responsive/reduced-motion/clean-feed behavior;
- fresh reproducible test results and visual captures;
- measured performance conditions and remaining limits;
- updated docs/runbook/readiness status that accurately distinguish completed, unverified, and external evidence.

The final viewer standard is:

> The marble feels physical, the arena feels intentionally constructed, the camera reveals the competition, the interface remains secondary, and the winner is visibly explainable from authoritative events.