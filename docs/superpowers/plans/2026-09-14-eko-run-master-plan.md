# Eko Run Master Game Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement each approved phase plan task-by-task. This master plan decomposes the project into independently testable phases; do not implement directly from the master plan without the phase-specific implementation plan and its acceptance criteria.

**Goal:** Build Eko Run as a new original 2.5D/3D Lagos-inspired precision platformer for the `Ai_games` catalogue, supporting human play and autonomous livestream play, with premium Nigerian visual identity, deterministic gameplay, fair readable hazards, replay, mobile/browser support, and production evidence.

**Architecture:** Gameplay truth lives in a fixed-step TypeScript simulation independent of rendering. Three.js consumes immutable render snapshots and semantic events to present a rich Lagos world; player, AI, traffic, hazards, checkpoints, procedural route variation, records, and viewer influence enter authority through explicit validated commands. Every phase is gated by the Eko Run mandatory skill set and `platformer-experience-review`.

**Tech Stack:** Existing Node.js >=22 and TypeScript 5.8.3 catalogue toolchain; Three.js for WebGL presentation; Web Audio API for runtime audio; browser input for keyboard/gamepad/touch; Node test runner for deterministic/unit/integration coverage; Playwright for browser/mobile/layout capture; existing catalogue simulation, evidence, CI, and release conventions.

**Spec:** `games/eko-street-run/docs/EKO_EXPERIENCE_STANDARD.md` and `games/eko-street-run/AGENTS.md`.

## Global Constraints

- Eko Run is an original game; do not use Nintendo/Mario names, artwork, characters, level layouts, music, sound effects, or copied assets.
- The target fantasy is Mario-quality platformer craft expressed through an original Lagos identity, not a Mario reskin.
- The initial playable form is 2.5D: fully 3D scenes and objects with a constrained platforming route, plus authored depth/lane transitions where they improve play.
- Authoritative simulation uses a fixed 60 Hz step. Rendering may run at a different rate and interpolates snapshots without mutating game state.
- Player collision truth is independent of costume geometry, cloth animation, camera, frame rate, and visual quality tier.
- All authoritative randomness uses named seeded streams; identical version/config/seed/input streams must reproduce the same authoritative run.
- Human mode and AI/autoplay mode use the same rules, collisions, route definitions, hazards, records, and progression.
- Presentation degradation removes ambient detail before any goal, hazard, landing, camera, accessibility, collision, or control information.
- Free stock photography is reference/background material only unless its licence and third-party rights are documented for direct runtime use.
- Maintain an asset provenance ledger for every external visual/audio source.
- SVG is the editable master format for 2D character sheets, costume sheets, icons, signage, decals, and UI art. JPG contact sheets/previews are generated from SVG as requested; alpha-critical runtime textures use SVG/PNG/WebP rather than lossy JPG where transparency/readability requires it.
- Crowd/fight incidents are non-graphic environmental disturbances, not ethnic caricatures, protected-group targeting, or identifiable real-person depictions.
- No phase passes on screenshots alone. Representative gameplay capture, deterministic evidence, tests, and the Eko experience gate are mandatory.
- TDD applies to behaviour changes: focused failing test, observed expected failure, minimal implementation, focused pass, affected-suite pass, then refactor.
- A high experience score cannot override a stop-ship defect.

---

## 1. Product Definition

### Launch fantasy

Eko Run follows **Tayo**, an original Lagos runner, across increasingly demanding city routes. The player reads traffic, potholes, drains, market movement, roadworks, rain, crowds and large set-piece events, then uses precise movement to maintain momentum and reach the next checkpoint. The game should be understandable within five seconds of footage: Tayo is moving forward through Lagos, danger is visible ahead, the next safe route is legible, and the run record is at stake.

### Core actions

- run with acceleration/deceleration and readable momentum;
- jump with input buffering, coyote time, controllable ascent/descent and consistent landing;
- slide/dodge under or through authored obstacle windows;
- vault selected low obstacles without turning the game into automatic parkour;
- use authored lane/depth shifts only at marked route situations;
- recover from minor mistakes through rule-based stumble/recovery states;
- reach checkpoints and district transitions;
- collect optional Eko Tokens and route bonuses without competing with the primary progress goal.

### Primary progress

The primary viewer-facing progress measure is **distance/checkpoint progress through the current district**. Secondary information may include Eko Tokens, run record, near-miss streak and current outfit, but none may compete visually with route progress and immediate danger.

### Modes

**Player Mode:** keyboard, gamepad and touch controls.

**AI Street Run:** autonomous Tayo plays the exact same game using a bounded policy stack. This mode is designed for unattended streams and record attempts.

**Stream/Viewer Mode:** AI Street Run plus moderated, disclosed, bounded viewer influence such as choosing one of pre-authored route modifiers, weather themes, cosmetic celebration effects or eligible upcoming challenge classes. Influence never guarantees survival, failure or a record.

### Initial districts

1. **Mainland Morning** — onboarding, residential/commercial streets, moderate danfo traffic and clear platforming grammar.
2. **Market Rush** — denser pedestrians, stalls, handcarts, signage, awnings and alternate risk/reward routes.
3. **Danfo Junction** — transport-hub pressure, vehicle timing, bus pull-outs, lane decisions and moving cover.
4. **Rainy Lagos** — puddles, drainage, reduced visibility, splashes, wet-surface presentation and route-reading pressure without hidden hazards.
5. **Island Night** — wider roads, modern architecture, nightlife lighting, construction zones and faster visual cadence.
6. **Bridge Run** — long sight lines, crosswinds/presentation motion, traffic waves and a major end-of-run set piece.

These are Lagos-inspired authored game districts, not literal GIS replicas.

---

## 2. Skill Operating System

Every task begins by loading the Eko Run core skills required by `games/eko-street-run/AGENTS.md`: `game-creative-direction`, `game-architecture`, `game-physics`, `game-feel-vfx`, `performance-optimization`, and `platformer-experience-review`. Domain skills below are added whenever their area is touched.

| Skill | Exact Eko Run responsibility | Required output/evidence |
|---|---|---|
| `game-creative-direction` | Protect the one-line fantasy, Lagos identity, emotional waveform, visual constitution, cultural tone and catalogue differentiation. | Creative pillars, style constitution, representative scenes, non-goals, identity review. |
| `gameplay-progression` | Define moment/tactical/run/session loops, checkpoints, district ladder, records, escalation, restart cadence and endless renewal. | Loop map, milestone ladder, record definitions, setback/recovery taxonomy, progression distributions. |
| `difficulty-failure-balancing` | Tune hazard combinations, reaction windows, run duration, failure mix, recoveries and AI difficulty without hidden outcome forcing. | Difficulty-axis model, target distributions, failure taxonomy, seeded comparison evidence. |
| `procedural-generation` | Create deterministic variation inside authored Lagos route grammars without producing impossible or unfair layouts. | Route grammar, named stream map, validators, repair/fallback policy, seed/diversity corpus. |
| `game-economy-rewards` | Govern Eko Tokens, cosmetic unlocks, outfit unlock conditions, route bonuses and bounded viewer rewards without pay-to-win. | Source/sink table, unlock rules, caps, anti-exploit and persistence rules. |
| `platformer-experience-review` | Review movement feel, animation, camera, silhouette, obstacle fairness, rhythm, visual hierarchy, mobile play and spectator comprehension. | 100-point review, stop-ship verdict, hazard fairness table, camera-causality log, exact regressions. |
| `game-architecture` | Define simulation/presentation ownership, commands/events, snapshots, persistence, module boundaries and failure isolation. | Context map, ownership table, schemas, system order, failure flow and versioning rules. |
| `deterministic-simulation` | Own fixed-step tick, deterministic ordering, random streams, replay/checksums and snapshot/restore invariants. | Tick spec, stream registry, replay fixtures, checksum and restore evidence. |
| `game-physics` | Build the kinematic platformer controller, collision representation, moving-platform/vehicle contacts, slopes, steps and tunnelling prevention. | Movement constants contract, collision invariants, contact tests, frame-rate independence evidence. |
| `autonomous-agent-design` | Build Tayo autoplay, traffic agents and selected crowd/NPC behaviours with bounded decisions and deterministic fallback. | Observation/action contracts, policy stack, stuck detection, benchmark corpus, fallback metrics. |
| `game-feel-vfx` | Turn semantic events into anticipation/impact/recovery feedback without hiding gameplay. | VFX hierarchy, density budgets, reduced-motion variants, capture review. |
| `game-audio` | Build Lagos ambience, movement/foley, vehicle cues, danger cues, adaptive music, mix hierarchy and caption alternatives. | Semantic cue map, bus architecture, loudness/capture evidence, licence manifest. |
| `livestream-hud` | Present distance, checkpoint, record, intent, viewer window and run state clearly at mobile/stream sizes. | Information hierarchy, safe-area layouts, accessibility/mobile capture. |
| `viewer-retention` | Shape renewable curiosity through milestones, route choices, near-misses, contrast and records without fake outcomes. | Dramatic pattern map, pacing bands, repetition guardrails. |
| `audience-interaction` | Normalize, validate, rate-limit, schedule and audit viewer choices before they can influence gameplay. | Influence schemas, eligibility/cooldown rules, idempotency and replay evidence. |
| `crowd-moderation` | Prevent abusive/unsafe public text, names or audience content from appearing in-game or audio. | Moderation policy, sanitized acknowledgement rules, adversarial fixtures. |
| `security-privacy` | Protect secrets, provider events, logs, client bundles, telemetry and any viewer identifiers. | Threat model, data minimization, secret/log checks, security tests. |
| `long-running-reliability` | Make AI Stream mode survive crashes, renderer/audio/provider failure, snapshots and long unattended operation. | Recovery state machine, health probes, bounded queues/resources, chaos/soak evidence. |
| `performance-optimization` | Hold simulation, frame, memory, draw-call, entity and audio budgets across quality tiers and long runs. | p50/p95/p99/worst profiles, resource slopes, quality-tier table, regression thresholds. |
| `game-analytics-experimentation` | Define trustworthy gameplay/comprehension metrics, experiments and guardrails without contaminating authoritative state. | Event schema, metric definitions, experiment plan, data-quality checks. |
| `simulation-qa` | Make every phase claim falsifiable through unit, contract, replay, property, seed campaign, browser, accessibility, chaos and rollback tests. | Requirement-to-test matrix, fixtures, regression seeds, evidence manifest. |
| `production-readiness-review` | Independently determine the highest truthful release readiness level. | Gate-by-gate verdict, traceability, stop-ship findings, soak/canary/rollback evidence. |

---

## 3. Phase Plan

## Phase 0 — Project Constitution and Research Pack

**Purpose:** turn the idea into an implementable original game with asset/legal/cultural boundaries before code.

**Skills:** `game-creative-direction`, `platformer-experience-review`, `game-architecture`, `security-privacy`, `simulation-qa`.

**Deliverables:**

- `games/eko-street-run/README.md` — project entry, run modes, status and commands;
- `PRD.md` — audience, jobs-to-be-done, modes, success metrics and non-goals;
- `GAME_DESIGN.md` — controls, hazards, districts, route language, fail/recovery model and set pieces;
- `AUDIO_VISUAL.md` — Lagos style constitution, character silhouette, lighting, camera, VFX and sound language;
- `TECHNICAL_ARCHITECTURE.md` — authority boundary, module ownership and dependency rules;
- `TESTING_STRATEGY.md` — phase evidence and seed/replay strategy;
- `ASSET_LEDGER.md` — stock references, creator/source, licence, downloaded date, permitted use and derivative path;
- visual reference boards for streets, danfo/Molue forms, road surfaces, markets, drainage, architecture, rain, clothing and signage;
- explicit IP rule: inspiration from precision platformer craft, no Nintendo assets or copied level/character design.

**Gate:** reviewers can explain the goal, protagonist, primary progress, immediate danger, Lagos identity and original differentiation without mentioning Mario. Asset provenance rules are enforceable and the experience standard has no contradiction with the game design.

---

## Phase 1 — Architecture and Deterministic Simulation Foundation

**Purpose:** create the authoritative skeleton before rendering polish.

**Skills:** `game-architecture`, `deterministic-simulation`, `simulation-qa`, `performance-optimization`, `platformer-experience-review`.

**Planned module map:**

- `src/config/` — versioned game/movement/content config;
- `src/state/` — authoritative state and IDs;
- `src/runtime/` — fixed-step run supervisor and system order;
- `src/rules/` — legal actions, consequences, checkpoints, terminal states;
- `src/physics/` — kinematic controller/collision primitives;
- `src/generation/` — route segment schemas and later seeded composition;
- `src/ai/` — autoplay/traffic policies;
- `src/presentation/` — render snapshot, semantic event adapters, camera state;
- `src/persistence/` — replay, snapshots, records;
- `src/influence/` — normalized audience requests, disabled by default until Phase 9;
- `src/operations/` — health/readiness metadata.

**Authoritative system order:** normalize commands → resolve player/AI intent → movement integration → collision/contact resolution → hazard/vehicle consequences → collectible/checkpoint/progression → terminal/record derivation → semantic events → snapshot/checksum.

**Evidence:** identical seed/input replay, render-rate independence test, snapshot/restore equivalence, no presentation import inside authority, named random stream registry, baseline tick budget.

**Gate:** a headless character can traverse a tiny deterministic test route, replay matches checksums, and rendering can be completely absent without changing outcomes.

---

## Phase 2 — Precision Movement Graybox

**Purpose:** make the game excellent before Lagos art arrives.

**Skills:** `game-physics`, `platformer-experience-review`, `game-feel-vfx`, `difficulty-failure-balancing`, `simulation-qa`, `performance-optimization`.

**Movement slice:** acceleration/deceleration, jump, coyote time, input buffer, variable jump release, air control, slide/dodge, low-obstacle vault, edge behaviour, slopes/steps, landing compression state, stumble/recovery and death/restart.

Use simple boxes/capsules and flat grey platforms. Do not compensate for weak control feel with camera shake, animation or particles.

**Test corpus:** early/late jump input, edge jump, ceiling contact, fast horizontal collision, moving obstacle contact, chained jump, large fall, slide timing, conflicting inputs, 30/60/120 render schedules over a fixed 60 Hz simulation.

**Experience gate:** mechanics-only test must pass. A skilled reviewer should call the movement precise and predictable with all theme removed. No camera-caused or frame-rate-caused failure is allowed.

---

## Phase 3 — Character, Outfits and Animation System

**Purpose:** make Tayo an original memorable protagonist whose clothing strengthens identity without damaging play.

**Skills:** `game-creative-direction`, `platformer-experience-review`, `game-feel-vfx`, `game-physics`, `performance-optimization`, `simulation-qa`.

**Initial outfit set:**

- Yoruba-inspired agbada + fila;
- Igbo-inspired isi agu styling + red cap;
- Hausa-inspired baban-riga/kaftan styling + embroidered cap;
- contemporary Lagos streetwear.

**Art pipeline:** SVG concept/sprite masters → JPG contact-sheet previews → runtime vector/transparent texture derivatives where required → Three.js procedural/rigged 3D character presentation. Costumes share authoritative collision geometry.

**Animation states:** idle, anticipation, acceleration, run, brake, takeoff, ascent, apex, descent, landing, slide, vault, near-miss reaction, hit/stumble, recovery, failure and celebration.

**Gate:** every costume passes silhouette tests against bright/dark/rainy/crowded backgrounds, feet/body direction remain readable, cloth does not hide contact information, and animation timing does not delay player intent.

---

## Phase 4 — Lagos Vertical Slice: Mainland Morning

**Purpose:** prove that world identity and precision platforming strengthen each other.

**Skills:** `game-creative-direction`, `platformer-experience-review`, `procedural-generation`, `game-feel-vfx`, `game-audio`, `performance-optimization`, `simulation-qa`.

**Scene content:** street corridor, sidewalks, drainage, buildings, utility detail, shops/stalls, signage, road markings, danfo traffic, one large-bus event, potholes, roadworks, pedestrian ambience, bus-stop checkpoint and Lagos skyline/parallax depth.

**Camera:** platforming look-ahead, landing-surface protection, bounded shake, speed-aware framing and authored transitions. Cinematic framing may occur only after unresolved player decisions are complete.

**Audio:** traffic ambience, horns with density caps, footsteps/cloth, jump/landing, vehicle approach cues, checkpoint cue and calm/pressure music states.

**Gate:** five-second footage communicates player, route, danger and progress; Lagos is recognizable without flags/title text; gameplay remains readable when visual density peaks; low-tier mode removes decoration before information.

---

## Phase 5 — Hazard, Traffic and Street Incident Systems

**Purpose:** turn Lagos motion into fair gameplay systems rather than decorative chaos.

**Skills:** `game-physics`, `difficulty-failure-balancing`, `autonomous-agent-design`, `platformer-experience-review`, `game-audio`, `game-feel-vfx`, `simulation-qa`.

**Hazard families:** danfo pull-out/crossing, Molue-style large vehicle, pothole, open drain, construction barrier/trench, puddle/flood zone, handcart/hawker-cart movement, rolling loose object, crowd compression, non-graphic argument/fight disturbance, temporary blocked route.

Every hazard receives a **fairness contract**: cue, decision point, speed range, minimum response window, legal responses, collision volume, consequence, recovery, forbidden combinations and low-tier/mobile equivalence.

Traffic agents use bounded deterministic schedules/policies; they do not suddenly teleport, accelerate from hidden state or consume remote AI.

**Gate:** no ordinary unavoidable hits in the representative corpus; every legitimate failure can be explained from replay; crowd/fight scenes remain readable, non-graphic and culturally neutral rather than caricatured.

---

## Phase 6 — Progression, District Ladder and Deterministic Route Grammar

**Purpose:** turn one slice into a renewable game.

**Skills:** `gameplay-progression`, `procedural-generation`, `difficulty-failure-balancing`, `game-economy-rewards`, `viewer-retention`, `simulation-qa`.

**Progression structure:** moment actions feed checkpoint objectives; checkpoints feed district completion; districts feed a run record; AI Stream mode chains districts into an endless cycle with deterministic theme/content renewal.

**Route grammar:** guaranteed traversable backbone first, then hazards, optional risk/reward branches, collectibles/checkpoints, alternate route decisions, presentation dressing and validation. Each layer uses a separate named random stream.

**Difficulty axes:** speed/time pressure, route width, vertical precision, vehicle timing, hazard concurrency, information pressure/weather, recovery cost and optional route risk. Do not scale only raw speed.

**Rewards:** Eko Tokens and achievements unlock cosmetics/themes/celebrations; persistent rewards do not change collision truth or guarantee future success.

**Gate:** generated routes always validate; fallback/repair is observable and bounded; seed campaign demonstrates route diversity rather than random clutter; milestone cadence creates calm, anticipation, crisis and recovery contrast.

---

## Phase 7 — Full Presentation, HUD, Audio and Game Feel

**Purpose:** produce premium broadcast-ready feedback while protecting clarity.

**Skills:** `game-feel-vfx`, `game-audio`, `livestream-hud`, `viewer-retention`, `platformer-experience-review`, `performance-optimization`.

**HUD hierarchy:** current distance/checkpoint → immediate state/danger → record comparison → Eko Tokens/streak → viewer window/AI intent → secondary ambience.

**VFX:** anticipation, landing dust/splash, cloth motion, tire spray, debris, near-miss accent, checkpoint celebration, failure/restart. Density and shake budgets are explicit; reduced-motion and reduced-flash variants are first-class.

**Audio buses:** master, music, ambience, movement/foley, danger/vehicle, gameplay impacts, UI, audience acknowledgement, system/emergency. Critical cues have visual/caption alternatives.

**Gate:** stream/mobile captures remain readable, event storms stay inside audio/VFX budgets, muted-audio play remains fully understandable, and the actual encoded capture retains important cues.

---

## Phase 8 — AI Street Run and NPC Intelligence

**Purpose:** make Eko Run an autonomous catalogue title without creating a separate easier game.

**Skills:** `autonomous-agent-design`, `deterministic-simulation`, `game-physics`, `procedural-generation`, `difficulty-failure-balancing`, `simulation-qa`, `performance-optimization`.

**Tayo AI policy stack:** legality/safety filter → immediate hazard reflex → tactical route scoring → short-horizon jump/slide/lane planner → strategic checkpoint/risk preference → deterministic fallback.

Observations expose only legitimate visible/derived game information. Actions enter the same command interface as human inputs. Stuck, oscillation and repeated-failure patterns are detected and recovered through legal actions, not hidden teleport/rescue.

Traffic/crowd AI uses simpler bounded policies appropriate to each role.

**Gate:** AI survives provider/model absence for entire runs because no model is required; action legality remains 100%; benchmark seed distributions show progress, mistakes, recovery and route diversity; human and AI mode replay the same rules.

---

## Phase 9 — Viewer Interaction, Economy, Moderation and Security

**Purpose:** add fair stream participation without compromising the game.

**Skills:** `audience-interaction`, `game-economy-rewards`, `crowd-moderation`, `security-privacy`, `livestream-hud`, `deterministic-simulation`, `simulation-qa`.

**Eligible viewer interactions:** vote among upcoming authored route modifiers, choose weather/aesthetic theme, select one of bounded challenge classes, trigger approved cosmetic celebration, vote on next outfit/theme after a run, and contribute disclosed bounded voting weight where platform policy permits.

No viewer interaction may directly set collision results, force death, grant invulnerability, guarantee records or bypass cooldowns because money was spent.

Normalize provider events outside game code; authenticate where applicable; schema-validate, moderate, rate-limit, deduplicate/idempotently apply, schedule as replayable commands and expose sanitized acknowledgements.

**Gate:** duplicate/reorder/reconnect/reversal fixtures apply at most once; abusive text never reaches HUD/audio; provider outage degrades to normal autonomous play; security review finds no secrets or unnecessary viewer identifiers in client/replay/log output.

---

## Phase 10 — District Expansion and Major Set Pieces

**Purpose:** complete the content promise without duplicating the same obstacle course six times.

**Skills:** `game-creative-direction`, `gameplay-progression`, `procedural-generation`, `difficulty-failure-balancing`, `platformer-experience-review`, `game-audio`, `game-feel-vfx`.

Build and differentiate Market Rush, Danfo Junction, Rainy Lagos, Island Night and Bridge Run. Each district gets a distinct spatial grammar, dominant emotion, hazard combinations, soundscape, palette/material treatment, route choice pattern and milestone set.

Major set pieces are environmental rather than person-boss fights: transport surge, market compression, rain/flood escalation, construction diversion, bridge traffic wave and similar authored crises. Set pieces still obey fairness contracts and deterministic replay.

**Gate:** silhouette-only or five-second captures can distinguish districts; no district is merely a reskin; each adds at least one new decision type before increasing raw speed/density; long-run repetition metrics stay within declared thresholds.

---

## Phase 11 — Analytics, Accessibility, Mobile and Performance Hardening

**Purpose:** prove the game works for actual devices and actual audiences, not only developer hardware.

**Skills:** `game-analytics-experimentation`, `performance-optimization`, `platformer-experience-review`, `livestream-hud`, `game-audio`, `simulation-qa`, `security-privacy`.

**Metrics:** run duration, distance/checkpoint, failure cause, hazard reaction/avoidance, camera-caused failure reports, stuck recovery, route diversity, AI fallback, frame-time percentiles, memory/resource slope, quality-tier transitions, audience interaction eligibility/use, comprehension/UX experiments and accessibility settings.

**Performance evidence:** p50/p95/p99/worst simulation and render times, draw calls, GPU timing where available, allocation/GC, memory slope, texture/audio resource lifecycle, AI/pathfinding budgets and headless throughput across representative devices/configurations.

**Accessibility:** touch target sizing, remappable controls where supported, reduced motion/flash, captions/visual danger alternatives, colour-safe hierarchy, no audio-only hazard, scalable HUD, mobile safe areas.

**Gate:** critical gameplay remains readable on lowest supported tier; low-tier degradation never removes hazard/route/accessibility information; long-run resources are bounded; analytics are minimized and do not change authority.

---

## Phase 12 — Long-Running Reliability and Operations

**Purpose:** make AI Stream mode survive unattended operation.

**Skills:** `long-running-reliability`, `performance-optimization`, `simulation-qa`, `security-privacy`, `game-audio`, `livestream-hud`.

**Failure drills:** process crash, renderer crash, audio failure/silence, corrupt snapshot, provider disconnect/reorder/duplicate, queue pressure, asset failure, browser context loss, restart, replay restore, configuration rollback and output freeze/black-screen detection.

Use safe intermission states instead of silently turning technical failures into game losses. Snapshots are integrity-checked before restore. Restart/backoff/quarantine policy is finite and observable.

**Gate:** chaos tests demonstrate bounded recovery, no duplicate influence, no crash storm, no monotonic memory growth and a usable public/stream scene during recoverable outages.

---

## Phase 13 — Production Readiness, Canary and Launch

**Purpose:** independently prove the release claim.

**Skills:** `production-readiness-review` plus every specialist whose evidence is being consumed.

Freeze candidate commit, config, content pack, deterministic version, provider configuration and reference build. Build a requirement-to-evidence matrix covering game quality, replay, restore, AI fallback, procedural validity, viewer influence, moderation, privacy/security, accessibility, audio, output health, performance, recovery and rollback.

Required R5 evidence includes the catalogue-required 72-hour soak, seven-day canary, production-configuration/provider verification, rollback rehearsal and independent/candidate review status as applicable.

**Gate:** no P0/P1 issue, no Eko stop-ship defect, no stale/missing evidence, no unlicensed release asset, rehearsed rollback, truthful readiness wording and explicit operations ownership.

---

## 4. Phase Execution Protocol

Every phase-specific implementation plan follows the same operating sequence:

1. read root `AGENTS.md`, Eko Run `AGENTS.md`, the active phase spec and `EKO_EXPERIENCE_STANDARD.md`;
2. load the six Eko Run core skills plus every domain skill named by the phase;
3. map phase requirements to tests/evidence before implementation;
4. write the first focused failing behaviour test and observe the expected failure;
5. implement the smallest end-to-end vertical increment;
6. run focused tests, affected integration/replay tests and proportional performance/browser checks;
7. capture representative gameplay at normal speed; use slow motion/frame stepping only for diagnosis;
8. run `platformer-experience-review` and record stop-ship verdict, findings, score and required regressions;
9. run separate specification compliance and engineering/viewer-experience quality reviews;
10. fix all load-bearing findings, add regression seeds/tests and record the evidence bundle;
11. commit a cohesive conventional commit with determinism, performance, UX, safety and rollback notes;
12. pass the phase gate before beginning the next phase.

---

## 5. Definition of a Successful Eko Run v1

Eko Run v1 is successful only when all of the following are true:

- a new viewer identifies the protagonist, direction, danger and progress within five seconds;
- the movement/controller is excellent when every Lagos texture and brand element is removed;
- the game still looks and feels unmistakably Eko Run when the title/logo is hidden;
- Yoruba-, Igbo-, Hausa- and contemporary-inspired outfits are distinct, respectful and equally playable;
- danfo/Molue-style traffic, potholes, drains, crowds, rain, roadworks and street incidents are readable systems rather than random punishment;
- human and AI modes share authoritative rules and deterministic replay;
- generated variation never creates impossible/unavoidable routes and broken seeds become regression fixtures;
- AI autoplay is purposeful, bounded and recoverable without remote inference;
- viewer influence is moderated, replayable, disclosed, idempotent and cannot buy/force terminal outcomes;
- critical information remains accessible with audio muted, reduced motion enabled and on mobile/low-tier presentation;
- performance tails and long-run resource slopes meet declared budgets;
- technical failures are distinguished from game losses and recover through tested operational states;
- the release has verified asset provenance, current safety/privacy evidence, soak/canary evidence and rehearsed rollback;
- the final `platformer-experience-review` has no stop-ship defects and production review reaches the highest truthful readiness level supported by evidence.

## 6. Immediate Next Planning Unit

The first executable implementation plan should be **Phase 0 + Phase 1 only**: project constitution/research pack and deterministic architecture foundation. It should create the complete document contract, module skeleton, authoritative state/tick contracts, replay/checksum test harness and the first headless deterministic route. No Three.js scene polish should begin before that slice passes its architecture/determinism gate.
