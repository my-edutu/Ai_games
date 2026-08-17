# Marble Survival Tournament — Design Specification

**Status:** Approved for continuous implementation under the catalogue platform specification  
**Game:** Game 7 — Marble Survival Tournament  
**Repository:** `my-edutu/Ai_games`  
**Branch:** `feat/game-7-marble-survival`

## 1. Viewer Promise

> Viewers choose favourites among a field of autonomous personality-driven marbles and watch them survive a sequence of increasingly dangerous deterministic obstacle arenas until one champion remains.

A viewer entering mid-stream must identify within ten seconds:

- the current tournament round and number of survivors;
- the leading, favourite, and endangered marbles;
- the immediate arena hazard or finish condition;
- the bracket path and current championship record;
- the next bounded audience decision window.

The primary emotion is simple favourite participation: attachment forms around numbered, named, visually distinct marbles whose movement style and public intent remain consistent enough to recognise but imperfect enough to create suspense.

## 2. Product Identity and Creative Pillars

### 2.1 Readable mass survival

- **Rule expression:** 32 marbles become 16, 8, 4, then 1 through clearly announced rounds.
- **Audiovisual expression:** survivor count, bracket rail, elimination shock-ring, and champion spotlight.
- **Proof scene:** a wide camera shows the remaining field entering a closing gate while the survivor counter drops.
- **Anti-pattern:** a cluttered screen where viewers cannot tell which marbles are alive or why one was eliminated.

### 2.2 Personality without scripting

- **Rule expression:** each marble receives a bounded archetype, trait values, lane preference, risk tolerance, and deterministic policy.
- **Audiovisual expression:** number, icon pattern, trail shape, short public intent, and characteristic movement response.
- **Proof scene:** a cautious Navigator avoids a sweeper while a Sprinter takes a faster exposed lane.
- **Anti-pattern:** hidden winner weighting, invulnerability, or outcome-specific behaviour.

### 2.3 Physical causality

- **Rule expression:** fixed-step custom physics, stable collision ordering, swept obstacle checks, explicit elimination zones, and replayable forces.
- **Audiovisual expression:** impact strength controls bounded bounce cues, camera impulses, particles, and sound.
- **Proof scene:** a collision visibly redirects one marble into a hazard and the replay reproduces the same result.
- **Anti-pattern:** marbles teleport, tunnel, overlap indefinitely, or change winners across hosts.

### 2.4 Tournament momentum

- **Rule expression:** short rounds, escalating arena grammar, result beats, bracket advancement, and automatic restart.
- **Audiovisual expression:** round intro, danger escalation, final-four presentation, champion ceremony, and next-seed preview.
- **Proof scene:** a semifinal result immediately updates the bracket and previews the finale arena.
- **Anti-pattern:** long empty intermissions or a round that stalls without a resolution policy.

### 2.5 Fair audience pressure

- **Rule expression:** fixed choices alter future eligible forces, gates, shields, themes, or next arena profiles within disclosed caps.
- **Audiovisual expression:** authoritative vote window, applied-effect card, assisted-record badge, and visible consequence.
- **Proof scene:** viewers select a temporary crosswind direction, all eligible marbles receive the same declared field, and the replay records it.
- **Anti-pattern:** a purchase selects the champion, guarantees survival, or applies twice after reconnect.

## 3. Tournament Structure

The launch tournament begins with 32 marbles and runs five rounds:

1. **Seeding Sprint — 32 to 16:** broad lanes, bumpers, conveyors, and a finish quota.
2. **Gate Gauntlet — 16 to 8:** timed gates, moving sweepers, and alternate routes.
3. **Hazard Circuit — 8 to 4:** wind zones, pits, narrowing corridors, and survival timeout.
4. **Final Four — 4 to 2:** compact high-contact arena with one recovery opportunity.
5. **Championship — 2 to 1:** duel course with mirrored geometry and no audience power effect after the decisive boundary.

A round resolves when its survivor quota reaches the finish, all remaining non-qualifiers are eliminated, or the declared timeout policy ranks active marbles by progress, survival health, then stable marble ID. Technical or integrity failure never counts as a game loss.

## 4. Nested Loops

- **Moment:** observe local hazards and rivals → choose bounded steering → integrate → collide/avoid → receive impact and intent feedback.
- **Tactical:** reach the next checkpoint or survive the active hazard cycle while preserving momentum and lane options.
- **Round:** qualify within the survivor quota; resolve eliminations and advance the bracket.
- **Tournament:** progress from 32 entrants to one champion, recording lead changes, close calls, eliminations, and records.
- **Stream:** ceremony → concise recap → next roster/arena preview → automatic countdown → new deterministic tournament.
- **Audience:** preview fixed choices → validate/tally → schedule at a safe boundary → apply once → show consequence → cooldown.

Primary progress is **marbles remaining / tournament round**. Secondary strategy signals are checkpoint progress, risk band, and current intent. No other counter competes with the survivor count as the main goal.

## 5. Dramatic Patterns

At least these rule-driven patterns must occur across validated seed campaigns:

1. **Front-runner reversal:** early leader collides or chooses a risky lane; a trailing survivor qualifies.
2. **Crowd compression:** dense contact at a gate produces multiple near-eliminations followed by a clean escape.
3. **Underdog recovery:** a low-ranked marble uses an authored recovery zone or shield opportunity, then qualifies without hidden immunity.
4. **Clean mastery:** one marble consistently executes safer lines and wins by accumulated decisions.
5. **Last-second qualification:** final qualifying slot is decided near the timeout or finish boundary.

The event director may choose only future eligible arena beats; it cannot alter already-resolved contacts or select a winner.

## 6. Authoritative Architecture

### 6.1 Ownership

`MarbleRuntime` is the only owner of authoritative state. It advances one fixed tick at a time and calls systems in a stable order:

1. lifecycle and operator commands;
2. due validated audience influence;
3. deterministic arena motion;
4. marble observations and policy decisions;
5. force accumulation and fixed-point integration;
6. world, obstacle, and marble collision resolution in stable ID order;
7. triggers, checkpoints, finishes, eliminations, and quotas;
8. round/tournament progression;
9. invariant checks, semantic events, and checksum material.

Presentation, audio, HTTP, analytics, and provider code consume sanitized snapshots and semantic events only.

### 6.2 Physical representation

A custom deterministic solver is selected over Rapier or another general rigid-body engine because winner-critical collisions require stable ordering and host-independent replay.

- world positions and velocities use integer fixed-point units;
- one metre equals 1,000 position units;
- velocity is units per authoritative tick;
- fixed tick rate defaults to 60 Hz;
- marbles are equal-radius circles with bounded mass classes;
- static geometry uses axis-aligned rectangles and circle bumpers;
- moving sweepers/gates use deterministic triangular-wave transforms;
- collision normals and impulses use integer arithmetic with declared quantization;
- outcome-critical motion uses swept segment checks and bounded substeps when displacement exceeds a radius fraction;
- position, velocity, contact count, and solver iteration limits are explicit;
- invalid numeric/range state triggers integrity quarantine.

Stable ordering is by obstacle ID, then ordered marble pair `(minId, maxId)`. One semantic contact produces one gameplay consequence.

### 6.3 Named random streams

- `roster`: names, palettes, patterns, and archetypes;
- `arena-topology`: lane and checkpoint grammar;
- `arena-hazards`: hazard selection and placement;
- `ai-variation`: bounded personality tie-breaks;
- `round-seeding`: bracket and lane assignment;
- `audience-ties`: vote tie resolution;
- `director`: eligible future event selection;
- `presentation`: optional cosmetic-only variation, excluded from authority.

All authoritative stream snapshots are persisted. Cosmetic draws cannot perturb gameplay streams.

## 7. Marble Character System

Each marble owns only serializable authoritative attributes:

- stable ID and tournament seed rank;
- approved display name from an authored catalogue;
- number, palette role, pattern, and icon key;
- archetype: `navigator`, `sprinter`, `bruiser`, or `survivor`;
- fixed-point acceleration, top-speed, traction, resilience, risk, and awareness traits within validated ranges;
- active status, checkpoint progress, finish rank, impact history summary, and public intent key.

Policies receive a bounded local observation: target checkpoint, nearby hazards, nearby marbles, velocity, lane clearance, active global field, and round state. They choose a steering vector and optional bounded boost. Hard legality and speed constraints override personality. Decision cadence is staggered by marble ID to cap peak work.

Public intents are allowlisted: `holding-line`, `seeking-gap`, `avoiding-sweeper`, `recovering-momentum`, `taking-risk-route`, `defending-lane`, and `final-sprint`. Raw internal scores are never displayed.

## 8. Arena Generation

Generation is constructive and layered:

1. choose a versioned round archetype and world dimensions;
2. construct at least two clear spawn-to-finish lanes;
3. place checkpoints and finish/qualification zones;
4. add obstacles while preserving declared radius clearance;
5. add hazards outside spawn safety and mandatory recovery envelopes;
6. add audience anchors and theme dressing using separate streams;
7. validate bounds, overlap, lane reachability, collider/contact budgets, and mirrored fairness where required;
8. run at most two deterministic repairs; otherwise use a known-good fallback for the same seed and record the fallback.

The validator returns typed issues and extracted features: openness, bottlenecks, sweeper count, wind intensity, hazard density, route asymmetry, expected contact load, and difficulty score.

## 9. Progression, Balance, and Records

Target launch distributions for the standard 32-marble tournament:

- full tournament duration: 6–14 minutes p10–p90 at 1× presentation speed;
- ordinary round duration: 35–110 seconds p10–p90;
- timeout resolution: below 8% of rounds;
- integrity quarantine: zero in release corpus;
- same archetype championship share: each archetype 15–35% across stratified seeds;
- first seed championship share: below 12%;
- audience-assisted tournaments: separate record category;
- three or more dramatic patterns: each appears in at least 8% of validated tournaments, with no single pattern above 65%;
- no-progress recovery succeeds or resolves causally within 600 ticks;
- duplicate influence application: zero.

Records are rebuilt from authoritative events: fastest tournament, closest finish, most overtakes, longest survival, most impact recoveries, and champion streak by configuration category. Records never derive from presentation timing.

## 10. Audience Influence

Launch effects use fixed authored choices and never accept arbitrary public text:

- `wind-vote`: select left, calm, or right bounded global wind for a future safe window;
- `gate-tempo`: select one of three validated future gate rhythms;
- `shield-orb`: spawn one neutral collectable recovery shield at a validated anchor;
- `cheer-pulse`: bounded temporary traction boost for a selected favourite pool; moves tournament to assisted record category;
- `theme-vote`: presentation-only palette/audio theme;
- `next-arena`: choose among validated next-round arena profiles.

Every request includes stable ID, logical received tick, normalized source class, effect ID, choice, entitlement band, and privacy-safe actor token. The game never stores raw provider payloads, payment data, messages, or display names.

Eligibility stages: schema → moderation-safe fixed choice → rate/cap → idempotency → game-state eligibility → cooldown/conflict → schedule. Public acknowledgements use generic copy keys and expose `received`, `queued`, `applied`, `rejected`, `expired`, or `reversed` without sensitive evidence.

## 11. Broadcast Experience

### 11.1 Composition

- 16:9 primary canvas with a central arena taking at least 70% of safe area;
- top rail: round, survivors, qualification quota, tournament time, and record comparison;
- left contextual card: leader, favourite, and current intent;
- right compact bracket and next interaction timer;
- bottom event rail reserved above caption-safe zone;
- contextual danger card replaces secondary cards instead of stacking;
- clean-feed mode removes HUD but retains outcome-critical in-arena labels.

Marbles remain identifiable by number, shape/pattern icon, outline, trail style, and label—not colour alone. Text has strict length and card-count limits.

### 11.2 Camera

Camera modes are `overview`, `pack`, `leader`, `danger`, `finish`, `replay`, and `ceremony`. Authority never sees camera state. Target switching uses hysteresis and cooldowns. Reduced-motion mode disables rapid zoom and camera impulses.

### 11.3 VFX

Priority order: integrity/result → lethal danger/qualification → milestone/comeback → audience acknowledgement → contact → ambience. Hard caps: 96 active particles, 32 trails, 6 floating callouts, 2 camera impulses, and one full-scene transition. Lower-priority effects merge or drop first.

### 11.4 Audio

Semantic cues map to a capped six-voice Web Audio mixer. Music states are `countdown`, `race`, `pressure`, `finale`, `victory`, `elimination`, `intermission`, and `safe-maintenance`, with hysteresis and minimum dwell. Critical cues have captions and in-arena visual alternatives. Missing or suspended audio never stops simulation.

## 12. Persistence and Recovery

Snapshots contain schema/determinism/config/content versions, run ID, tournament seed, authoritative state, named RNG snapshot, next event sequence, and checksum. Restore validates versions, checksum, entity uniqueness, range bounds, round consistency, event continuity, and active/qualified counts before resuming.

A divergence or corrupt snapshot enters `quarantined` lifecycle and exposes a truthful recovery scene. The operator may restore a prior verified snapshot or start fresh through an authenticated, token-protected command; the public output never shows stack traces, seeds, config, provider IDs, or private audit data.

All histories are bounded: semantic event buffer 2,048, contact summaries 16 per marble, replay frames 600, idempotency records 4,096 with lifecycle expiry, and acknowledgement cards 8.

## 13. Operations and SLOs

- authoritative tick p99 below 8 ms on reference Node 22 hardware for 32 marbles and maximum launch arena load;
- stream snapshot generation p99 below 4 ms;
- browser source target 60 fps, with 30 fps quality fallback;
- event queue, particles, audio voices, replay frames, and idempotency maps remain within declared caps;
- identical seed/config/event log produces identical checkpoints and result;
- verified snapshot restore matches uninterrupted execution;
- provider, audio, presentation, and telemetry outage do not stop authority;
- process crash recovery target below 30 seconds when a valid snapshot exists;
- 72-hour candidate soak and seven-day canary are mandatory elapsed-time gates before unattended production promotion.

The implementation may become release-candidate complete in this build, but elapsed soak/canary status must never be fabricated.

## 14. Phase Gates

### Phase 1 — Deterministic Foundation

Config, state, roster, arena generation, fixed-point physics, runtime lifecycle, snapshot/checksum, headless runner, twin replay tests, corruption tests, and a runnable qualification round.

### Phase 2 — Tournament Intelligence and Progression

Personality policies, five-round bracket, checkpoints/qualifiers, anti-stall resolution, records, seeded campaigns, balance metrics, and at least three observed dramatic-pattern classifiers.

### Phase 3 — Broadcast Experience

Sanitized render snapshots, layout/camera/audio cue derivation, presentation controller, premium browser source, HUD, accessibility modes, stream self-test, and Playwright capture contract.

### Phase 4 — Audience Interaction

Fixed effect catalogue, vote windows, idempotent scheduling, cooldown/conflict/cap/reversal handling, assisted-record separation, acknowledgements, moderation-safe fixed choices, and provider-outage continuity tests.

### Phase 5 — Reliability and Operations

Verified restore, bounded resource probes, health and authenticated operator endpoints, chaos scenarios, crash/provider/presentation/audio degradation, runbook, rollback matrix, and recovery evidence generator.

### Phase 6 — Production Launch Candidate

Full release validator, CI integration, security/privacy and supply-chain checks, final specification and quality reviews, production-readiness assessment, evidence manifests, rollout/canary/rollback documentation, and no critical or important findings. Elapsed 72-hour soak and seven-day canary remain promotion prerequisites.

## 15. Testing Strategy

Use red-green-refactor for behaviour. Required evidence includes:

- unit tests for config, fixed-point math, physics contacts, triggers, policies, and effect eligibility;
- property/invariant tests for bounds, unique IDs, no persistent penetration, and stable ordering;
- twin runtime and snapshot-boundary replay tests;
- adversarial geometry: corners, thin gates, moving sweepers, contact storms, high velocity, spawn overlap, restore, and maximum population;
- campaign tests across ordinary/extreme seeds with archetype fairness and duration distributions;
- public snapshot privacy and browser-source self-tests;
- audience duplicate/reorder/stale/reversal/burst/outage tests;
- chaos tests for corrupted snapshots, stalled presentation, audio failure, provider outage, and command abuse;
- browser captures at 1920×1080 and representative phone viewport, reduced-motion, colour-safe, muted-audio, dense-event, result, intermission, and degraded scenes;
- release validation that reports exact evidence and marks elapsed soak/canary as pending until genuinely completed.

## 16. Explicit Non-Goals and Forbidden Shortcuts

- no manual player steering in production stream mode;
- no remote model dependency;
- no opaque third-party physics solver for authoritative outcomes;
- no gambling, wagering, cash-equivalent prizes, or paid guaranteed outcomes;
- no free-text marble naming or raw audience messages;
- no hidden rubber-banding, forced champion, secret collision change, or fabricated record;
- no gameplay mutation from renderer, audio, HTTP, analytics, or provider callbacks;
- no unbounded retries, queues, histories, effects, or solver iterations;
- no claim that temporal soak/canary passed without elapsed evidence.

## 17. Self-Review

- **Placeholder scan:** no unresolved placeholders or deferred behaviour.
- **Internal consistency:** deterministic custom physics, tournament rules, audience effects, records, and presentation categories use the same authority boundaries.
- **Scope:** the game is one independently deployable module with six vertical increments; shared provider adapters remain outside the game.
- **Ambiguity:** round ranking, audience record eligibility, technical failure classification, and production promotion gates are explicit.
- **Approval basis:** the platform design and the user’s current directive authorize automatic selection of the best implementation approach and uninterrupted phase execution.
