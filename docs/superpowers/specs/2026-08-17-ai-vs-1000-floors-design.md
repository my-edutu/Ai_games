# AI vs 1,000 Floors — Design Specification

**Date:** 2026-08-17  
**Status:** Approved for implementation  
**Target:** Six software phases culminating in an evidence-gated R4 production candidate; R5 remains blocked until real provider, soak, canary, deployment and independent-review evidence exists.

## 1. Decision and Product Promise

AI vs 1,000 Floors is a deterministic autonomous tactical roguelite built for long-running livestream entertainment.

> Viewers watch Astra, a self-directed signal knight, decode and conquer a living 1,000-floor tower while enemies, traps, scarce upgrades and bounded audience interference reshape every ascent; they return to discover how high each seed's strategy survives and whether the tower's final Architect can be defeated.

The adversarial premise is simple: the tower observes Astra's progress and introduces increasingly complex, but rule-bound and replayable, tactical pressure. The tower may never secretly force a death or rescue.

## 2. Alternatives Considered

### A. Continuous vertical platformer

A real-time platformer could be visually kinetic, but it overlaps Game 3 — Infinite Tower Climb, requires more expensive continuous physics validation, creates host-dependent replay risk, and makes 1,000 distinct floors harder to read during a livestream.

### B. Tactical micro-floor roguelite — selected

Each floor is a compact deterministic tactical chamber with a start, exit, objective, hazards, enemies and reward opportunities. This approach gives the game a distinct identity, supports exact replay, keeps the floor number permanently legible, and scales to 1,000 floors through validated procedural grammar rather than one thousand handcrafted maps.

### C. Elevator auto-battler

An elevator arena with repeated combat waves is cheaper to build, but its floor identity, navigation decisions, exploration tension and dramatic-pattern diversity are too shallow for the product promise.

## 3. Catalogue Differentiation

| Dimension | Infinite Tower Climb | AI vs 1,000 Floors |
|---|---|---|
| Spatial metaphor | continuous vertical traversal | discrete tactical chambers |
| Primary skill | movement and platform survival | planning, resource use and combat routing |
| Progress | height | completed floor number |
| Camera rhythm | continuous follow | room framing, tactical focus and floor transitions |
| Run cadence | endless ascent loops | finite 1,000-floor campaign with checkpoints and sectors |
| Viewer role | movement/environment modifiers | bounded route, resource and challenge choices |
| Dominant emotion | vertigo and momentum | curiosity, strategic pressure and earned survival |
| Primary record | height/time | highest floor, clear time, integrity score and resource efficiency |

## 4. Creative Direction

### 4.1 Protagonist

Astra is a compact, instantly readable silhouette: a dark armored figure containing a bright geometric AI core. The core changes shape to communicate intent without relying on color alone:

- diamond: navigation;
- shield: survival/recovery;
- spear: combat;
- split chevron: evaluating routes;
- broken ring: deterministic fallback.

Astra is not a silent cursor. The presentation exposes bounded public intent fields: goal, next action, confidence band, observed danger and plan-change reason. It never exposes hidden chain-of-thought.

### 4.2 Tower identity

The tower is a machine-organism made from brutal architectural forms, luminous circuit seams and sector-specific materials. It has ten sectors of one hundred floors:

1. Intake Vaults — navigation and basic combat;
2. Ember Foundry — heat lanes and timed machinery;
3. Verdant Archive — growth, concealment and regeneration threats;
4. Prism Court — beams, mirrors and line-of-sight puzzles;
5. Null Catacombs — information loss and suppression fields;
6. Storm Engine — moving hazards and charge management;
7. Iron Menagerie — coordinated enemy archetypes;
8. Memory Labyrinth — route uncertainty and deceptive topology;
9. Crown Warworks — combined elite encounters;
10. Architect's Spine — mastery checks and final synthesis.

Each sector has a distinct silhouette, material language, ambience, enemy family and tactical question. Sector changes alter decisions, not merely palette.

### 4.3 Enemy character grammar

Enemy silhouettes remain legible at phone size:

- **Sentinel:** wide shield silhouette; blocks routes and protects allies;
- **Striker:** narrow forward silhouette; pursues and attacks;
- **Leech:** ring silhouette; drains energy and retreats;
- **Warden:** sector boss with a unique rule-changing telegraph;
- **Architect:** final boss composed from prior sector motifs.

Enemy behavior is deterministic, budgeted and observable through telegraphs. No enemy reads hidden AI plans.

### 4.4 Visual constitution

The style is **signalpunk ascension**:

- strong architectural negative space;
- crisp character outlines and limited tactical silhouettes;
- neutral world values, one progress accent, one danger accent and one audience accent per scene;
- route traces and threat previews use shape plus line pattern, never color alone;
- floor transitions are fast architectural wipes, not generic fades;
- common actions use restrained feedback; milestone, boss, record and terminal moments receive full multi-channel treatment;
- reduced-motion removes camera impulses and uses opacity/shape transitions;
- reduced-flash replaces full-screen pulses with border, icon and caption treatments.

### 4.5 Audio constitution

Audio uses synthesized and provenance-safe semantic cues so the software candidate contains no unlicensed placeholder assets. The adaptive score has bounded states:

- intermission;
- exploration;
- anticipation;
- danger;
- Warden/boss;
- recovery;
- floor clear;
- sector clear;
- failure;
- safe maintenance.

SFX material language combines short digital transients with metallic resonance. Voice count, cooldowns, deduplication, ducking and true-peak protection are explicit. Every critical cue has a visual/caption alternative, and audio failure never stops authority.

## 5. Viewer Comprehension Hierarchy

A representative frame must answer these questions within ten seconds:

1. What is happening? Astra is autonomously climbing a hostile tower.
2. What is the goal? Reach Floor 1,000.
3. How far has this run progressed? `FLOOR n / 1000` is the strongest persistent element.
4. What is the immediate danger? Threat tier, health state, telegraphs and room hazards.
5. What record matters? Highest floor and current pace versus record.
6. What is Astra trying to do? One bounded intent line and confidence band.
7. What can viewers influence next? A contextual, time-bounded choice card.

Persistent HUD:

- floor and sector;
- health, energy and shield state;
- current objective;
- highest-floor record comparison;
- concise AI goal/intent;
- current threat tier.

Contextual HUD:

- loadout choice;
- checkpoint or boss card;
- vote/effect window;
- milestone or record;
- recovery/provider state.

Operator diagnostics never appear in the public feed.

## 6. Core Loops and Progression

### 6.1 Moment loop

Observe room → choose a legal tactical action → move, attack, guard or interact → resolve enemies and hazards in stable order → receive semantic feedback → update plan.

### 6.2 Tactical floor loop

Enter chamber → identify exit/objective/threats → choose route and resource risk → defeat or bypass required threats → collect optional reward → reach exit → evaluate floor result.

### 6.3 Run loop

Start at Floor 1 → cross ten themed sectors → earn bounded upgrades and resources → survive checkpoints and Wardens → defeat the Architect on Floor 1,000 or end with a causal failure → show replay/result → automatically begin a new deterministic seed.

### 6.4 Stream loop

Runs contribute to records, streaks, sector mastery, strategy history and rotating rule-safe themes. Persistent progression adds identity and variety, never permanent power that guarantees future outcomes.

### 6.5 Milestone grammar

- every floor: completion progress and resource state;
- every 5 floors: tactical cadence marker and optional reward opportunity;
- every 10 floors: tower modifier preview;
- Floors 25, 50 and 75 of each sector: checkpoint/miniboss gate;
- every 100th floor: Warden boss and sector transition;
- Floor 1,000: Architect finale;
- record floor: distinct record treatment;
- terminal loss: causal decisive-moment replay and next-seed preview.

Checkpoint recovery preserves earned history and offers a bounded continuation state only where the run has earned it. It never silently erases a death.

## 7. Resources, Upgrades and Failure

Primary progress is floor number. Secondary tactical resources are limited to:

- health;
- energy;
- shield charge;
- signal credits used at declared upgrade opportunities;
- three active module slots.

Modules create choices rather than pure stat inflation: route scanning, guard conversion, chain strike, hazard insulation, energy siphon, emergency blink and similar bounded abilities. Stacking order, caps, incompatibilities and reset behavior are versioned.

Legitimate failures include:

- informed risk accepted;
- tactical positioning error;
- poor resource allocation;
- planner misjudgment within declared information;
- enemy/hazard pressure;
- bounded audience complication.

Technical crash, invalid generated content, replay divergence, provider failure and corrupted persistence never count as gameplay losses.

## 8. Procedural Floor System

Each floor is generated from a constructive, deterministic pipeline:

1. choose sector and floor archetype;
2. construct a guaranteed start-to-exit route on an integer grid;
3. add branches and optional reward rooms;
4. place objective and required interactions;
5. place enemies and hazards subject to safe-entry and reachability constraints;
6. place resources and audience anchors;
7. extract difficulty and visual-density features;
8. validate hard constraints;
9. apply bounded deterministic repair;
10. use a versioned known-good fallback if repair fails.

Named random streams isolate topology, enemies, hazards, rewards, audience ties and cosmetics. Visual dressing can never perturb authoritative content draws.

Hard constraints include:

- exit and mandatory objective reachable;
- no unavoidable damage on spawn;
- no occupied or mutually exclusive cell;
- every required key precedes its lock;
- enemy and hazard counts within budget;
- checkpoint cannot trap the run;
- generated floor terminates validation within bounded attempts;
- extracted feature values within sector difficulty contract.

Bad seeds are retained as regression fixtures rather than silently replaced.

## 9. Autonomous Agent

The policy stack is intentionally layered:

1. legality and hard-safety filter;
2. immediate hazard and combat reflexes;
3. bounded tactical search over movement, attack, guard, interact and ability actions;
4. strategic utility planner for exit, resources, optional rewards and module use;
5. deterministic fallback using legal-action scoring and stable tie-breaks;
6. stuck/oscillation/no-progress detector with local recovery before run-level action.

Observations contain only visible and legitimately discovered information. Decisions have hard expansion, memory and cadence budgets. Optional future model assistance may propose high-level hypotheses asynchronously, but it cannot block the tick and is not part of the initial production candidate.

Public explanation fields are templated and validated:

- goal;
- intent;
- obstacle;
- confidence band;
- fallback status;
- plan-change reason.

## 10. Authoritative Architecture

The simulation worker is the only gameplay authority. Presentation, audio, providers, analytics and operator tools consume explicit contracts and cannot mutate state directly.

Authoritative system order per logical tick:

1. lifecycle and operator commands;
2. eligible scheduled audience influence;
3. agent observation and bounded decision;
4. player action validation;
5. movement and interaction;
6. player combat;
7. enemies in stable entity order;
8. hazards and status effects;
9. pickups, objectives and exit resolution;
10. progression, result and checkpoint rules;
11. semantic events, invariant checks and checksum.

All outcome-relevant values use integer or fixed-point representation. Authoritative state excludes wall-clock time, rendering handles, audio objects, provider payloads, callbacks and secrets.

Core game-owned boundaries:

- `config/`: validated versions and bounds;
- `state/`: serializable authoritative types;
- `generation/`: floor construction, validation, repair and features;
- `ai/`: observations, policies, pathfinding, intent and fallback;
- `rules/`: single authoritative step and terminal precedence;
- `runtime/`: lifecycle, headless loop and automatic restart;
- `persistence/`: snapshots, checksums and verified restore;
- `presentation/`: immutable render snapshots, scenes, camera, VFX and audio cues;
- `influence/`: bounded effect catalogue and scheduling;
- `operations/`: leases, durability, health, supervisor and readiness;
- `testing/`: campaigns, invariants and evidence utilities.

## 11. Audience Interaction

Viewer agency is framed as **supporters, challengers and strategists**, never owners of the result.

Initial fixed-choice catalogue:

- `route-scan`: reveal one bounded route feature;
- `supply-cache`: schedule an eligible modest resource cache;
- `hazard-pulse`: schedule one additional telegraphed non-terminal hazard pattern;
- `elite-contract`: upgrade a future eligible encounter and its reward;
- `sector-theme`: presentation-only vote;
- `module-choice`: vote among game-generated legal module options.

Every request is authenticated where applicable, normalized, schema-validated, moderated, rate-limited, idempotent, checked for game eligibility, scheduled under cooldown/conflict/intensity caps, durably acknowledged and replay-represented. Provider payloads and exact payment data never enter game state. Paid status can grant disclosed bounded eligibility or voting weight; it cannot buy a winner, death, record or guaranteed survival.

The game remains complete and entertaining with interaction disabled or every provider unavailable.

## 12. Dramatic Patterns and Retention

Required rule-driven patterns include:

1. mastery → ambush or topology complication → replanning → clean recovery;
2. resource drought → optional high-risk cache route → costly success or causal loss;
3. audience complication → near-collapse → earned recovery or visible consequence;
4. early module synergy → overconfidence pressure → Warden counter → adaptation;
5. poor sector opening → conservative checkpoint play → comeback → record chase.

Meaningful-event cadence targets are defined across 5–15 seconds, 30–120 seconds, 3–15 minutes, run and multi-run horizons. The event director may choose only eligible authored events with caps, cooldowns, hysteresis and quiet periods. It cannot manipulate already-resolved outcomes.

## 13. Reliability, Security and Operations

The runtime must support:

- append-only commands/events and versioned snapshots;
- one fenced lease holder per run;
- compatible checksum/invariant/event-continuity validation before restore;
- replay comparison after restore;
- quarantine on integrity uncertainty;
- fresh-run fallback rather than fabricated continuity;
- bounded queues, histories, caches, effects, audio voices, timers and presentation resources;
- independent probes for tick progress, meaningful progress/valid idle, render freshness, audio intent, persistence acknowledgement and stream output;
- finite retry/backoff/breaker behavior;
- truthful public recovery scenes and detailed operator status;
- emergency audience disable, safe intermission, fresh run, rollback and halt controls.

Secrets, raw viewer text, internal IDs, provider payloads, payment data, model prompts, stack traces and private diagnostics are excluded from public snapshots, replay and telemetry.

## 14. Performance Budgets

Software reference targets on documented CI hardware:

- authoritative tick p99 below 8 ms at maximum Phase 2 entity budget;
- bounded tactical decision p99 below 5 ms and below declared expansion cap;
- floor generation p99 below 20 ms in headless tests;
- snapshot creation p99 below 25 ms and payload below 512 KiB;
- 1080p stream frame p99 below 16.7 ms at the normal quality tier;
- public render snapshot below 64 KiB;
- no monotonic unbounded memory, listener, timer, queue, texture or audio-buffer growth;
- accelerated headless campaign throughput sufficient for at least 10,000 tactical ticks per second on reference CI after Phase 2 optimization.

Targets may be tightened from measured baselines, but never silently relaxed after a regression.

## 15. Six-Phase Delivery

### Phase 1 — Deterministic headless foundation

Deliver the complete smallest run: configuration, seeded streams, floor generation, state, legal actions, basic combat/hazards, deterministic fallback agent, floor completion, causal terminal result, automatic restart, events, snapshots, checksums, replay, headless runner, invariant/property tests and baseline evidence.

### Phase 2 — Production AI, 1,000-floor progression and content

Deliver layered tactical planning, stuck recovery, ten sectors, enemy families, hazards, resources, modules, checkpoints, Wardens, Architect, balance configuration, stratified seed campaigns, progression distributions and performance optimization.

### Phase 3 — Premium broadcast experience

Deliver immutable privacy-safe render snapshots, responsive Canvas stream source, character and enemy presentation, room framing, camera, VFX, adaptive semantic audio, captions, accessible variants, result/replay/intermission scenes, output health and browser/capture tests.

### Phase 4 — Audience interaction and Chat vs AI

Deliver provider-neutral influence envelopes, fixed-choice effects, votes, idempotency, moderation-safe acknowledgements, caps/cooldowns/conflicts, replay-safe scheduling, Chat vs AI pressure and provider-degraded autonomous operation.

### Phase 5 — Reliability and operations

Deliver durable authority, leases, append-only storage adapters, verified restore, quarantine, supervisor, progress/render/audio/output probes, bounded-resource controls, observability, operator actions, chaos campaigns, runbooks and rollback evidence.

### Phase 6 — Production validation and launch governance

Deliver a frozen release manifest, requirement traceability, security/privacy/accessibility review, performance and balance campaigns, readiness assessor, deployment/canary machinery, operations handoff and an honest R4/R5 decision. Synthetic evidence cannot promote the game to R5.

After every phase, perform two distinct reviews:

1. exact specification and acceptance-criterion compliance;
2. engineering, game quality, UI, character, audio, accessibility, performance, safety and viewer-experience critique.

Every P0/P1 finding is fixed before the next phase. Bounded P2 findings require owner, mitigation, evidence and target phase.

## 16. Test and Evidence Strategy

Behavior changes use red-green-refactor. Evidence includes:

- unit and contract tests;
- invariants and property corpora;
- deterministic replay and random-stream isolation;
- snapshot corruption, compatibility and restore;
- generator validity, feature diversity and bounded fallback;
- AI legality, budget, stuck and adversarial benchmarks;
- progression and balance campaigns with percentiles and failure categories;
- public render snapshot, mobile-legibility, reduced-motion and browser-source tests;
- semantic audio density, cooldown and failure tests;
- influence duplicate/reorder/expiry/reversal/provider-outage tests;
- performance, load, memory, soak and chaos tests;
- security, privacy, moderation, audit and rollback review;
- exact candidate manifest and truthful readiness assessment.

Each evidence bundle records commands, versions, seed/event corpus, reference environment, result, primary artifacts and reviewer conclusion.

## 17. Production Readiness Language

The implementation may be described as a **software-complete R4 production candidate** only after all six phase software gates and reviews pass. It may not be called production-ready/R5 until the exact frozen deployed candidate completes current credentialed provider verification, production-reference capacity and audiovisual validation, independent security/safety review, witnessed drills, a real 72-hour endurance run, a real seven-day guarded canary and an independent exact-candidate review.

## 18. Explicit Non-Goals and Forbidden Shortcuts

- no one thousand handcrafted maps;
- no continuous rigid-body solver where deterministic grid/kinematic rules suffice;
- no remote model required for continuity;
- no hidden fail-per-hour script;
- no secret rescue, kill or record manipulation;
- no raw chat or payment data in authority or overlays;
- no provider SDK inside the game module;
- no result decided by rendering or audio callbacks;
- no unbounded retries, queues, histories, particles, voices or planner search;
- no R5 claim based only on code merge, CI, synthetic soak or fixture providers;
- no placeholder or unlicensed release assets.

## 19. Self-Review

- **Placeholder scan:** no `TBD`, `TODO` or deferred production requirement remains.
- **Internal consistency:** discrete tactical floors, one authoritative simulation, six phases and R-level language agree across product, architecture and testing sections.
- **Scope:** the game is decomposed by phase and bounded subsystem; real external launch evidence remains explicitly outside software completion.
- **Ambiguity:** floor progression, sector cadence, viewer effects, failure classification, authority boundaries and readiness wording are exact.
- **Approval:** the user instructed the agent to select the best professional approach, avoid unnecessary preference questions and execute all phases. This specification selects and approves the tactical micro-floor approach for planning and implementation.
