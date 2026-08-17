# AI Civilization / Tiny Kingdom — Approved Design

**Date:** 2026-08-17  
**Game:** 5 — AI Civilization / Tiny Kingdom  
**Branch:** `feat/game-05-ai-civilization`  
**Approval:** Approved under the standing instruction to select the strongest professional approach and continue without preference questions.  
**Target:** A complete R4 software candidate after six reviewed phases. R5 remains blocked until exact-candidate external production evidence, independent review, real-duration soak, witnessed drills, and guarded canary satisfy the catalogue standard.

## 1. Design Decision

Implement a deterministic cohort-based kingdom simulation on a compact tile world. The autonomous protagonist is a ruling dynasty supported by named councillors. The simulation models population cohorts, buildings, resources, policy, crises, rival realms, diplomacy, conflict, succession, eras, records, audience influence, presentation, durability, and unattended operation.

### Alternatives considered

1. **Selected: cohort simulation with named key characters.** Population is represented in bounded cohorts while rulers, councillors, heirs, envoys, and rival leaders are individual characters. This preserves emotional attachment and strategic depth without unbounded agent cost.
2. **Rejected: every citizen as an autonomous agent.** It offers richer microscopic stories but creates excessive state growth, scheduling cost, noisy presentation, difficult replay diagnosis, and poor mobile-scale comprehension.
3. **Rejected: card-only kingdom decisions.** It is easy to implement and balance but lacks a continuously watchable world, spatial progress, and autonomous spectacle.

## 2. Viewer Promise

Viewers watch a tiny dynasty attempt to grow a fragile settlement into a legendary kingdom while seasons, scarcity, rival rulers, crises, war, diplomacy, and succession threaten everything it has built. They return because every seed produces a different land, cast, strategic arc, crisis pattern, dynasty history, and record chase.

**Adversarial premise:** Nature, resource limits, political trade-offs, rival kingdoms, internal instability, and time oppose the dynasty. The audience may influence bounded civic choices and complications, but cannot purchase or force victory, defeat, succession, war outcomes, records, or prizes.

### Ten-second comprehension

A representative stream frame must immediately answer:

1. The kingdom is autonomously building and governing a visible world.
2. The current goal is the next civilization tier and ultimately a Legendary Kingdom.
3. The primary progress measure is **Renown toward the next Tier**.
4. The immediate danger is shown as one plain-language crisis or pressure.
5. Population, stability, food runway, current ruler, and record comparison explain strategy.
6. The next eligible audience decision is visible only when relevant.

## 3. Creative Pillars

### 3.1 A world that visibly remembers

- **Promise:** Every choice changes the settlement silhouette, land use, relationships, dynasty chronicle, and strategic position.
- **Rule expression:** Buildings occupy tiles; policies create lasting modifiers; diplomacy changes borders and trade; succession preserves a bounded chronicle.
- **Audiovisual expression:** Construction grows in clear stages, roads connect districts, banners change by dynasty, and landmark silhouettes identify eras.
- **AI expression:** The ruler explains a current public goal, pressure, and chosen decree using validated templates.
- **Proof scene:** A hamlet becomes a fortified river town after surviving famine and building granaries.
- **Anti-pattern:** Progress exists only as counters while the map remains static.

### 3.2 Fragile prosperity

- **Promise:** Growth creates both capability and new obligations.
- **Rule expression:** Population consumes food and housing; buildings require upkeep; expansion raises exposure; armies protect but drain labour and gold.
- **Audiovisual expression:** Calm prosperity has warm motion and layered ambience; shortage progressively strips activity and adds readable warning cues.
- **AI expression:** Utility scoring weighs runway, stability, defence, opportunity, and long-term renown rather than always selecting maximum growth.
- **Proof scene:** The kingdom delays a monument to fund winter stores and avoid a visible food collapse.
- **Anti-pattern:** Exponential growth has no costs, caps, or reversals.

### 3.3 Character-led history

- **Promise:** Viewers care about the ruler, heir, councillors, and rivals without losing strategic clarity.
- **Rule expression:** Bounded traits influence policy utilities, diplomacy, crisis response, and succession legitimacy.
- **Audiovisual expression:** Distinct silhouette, emblem, expression state, role icon, age, trait chips, relationship, and public intent appear on concise portrait cards.
- **AI expression:** Character traits bias legal decisions but cannot override hard survival, fairness, or integrity constraints.
- **Proof scene:** A cautious heir succeeds a bold founder and visibly shifts the kingdom from conquest to diplomacy.
- **Anti-pattern:** Characters are decorative names with no causal effect or an unbounded biography feed.

### 3.4 Causal collapse and credible recovery

- **Promise:** Setbacks and defeats are understandable stories, not random punishment or technical failure.
- **Rule expression:** Every crisis has declared causes, eligibility, severity, response options, and event history. Recovery costs resources or strategic opportunity.
- **Audiovisual expression:** Threats use staged anticipation, affected-tile emphasis, causal copy, restrained crisis music, and an explicit resolution beat.
- **AI expression:** The policy exposes why it changed plan and whether fallback or emergency priorities are active.
- **Proof scene:** A drought reduces harvest, the ruler rations food, unrest rises, trade relief arrives, and the kingdom recovers with lasting debt.
- **Anti-pattern:** A hidden director rescues or kills the kingdom to control engagement.

### 3.5 Renewable eras, not an endless spreadsheet

- **Promise:** Long worlds deliver regular closure through seasons, years, tiers, reigns, wars, great works, and dynasty results.
- **Rule expression:** Nested milestones create chapters; terminal resolution and automatic restart prevent inaccessible forever-worlds.
- **Audiovisual expression:** Each tier changes architecture, palette accents, music instrumentation, camera framing, and record treatment.
- **AI expression:** Strategy changes as the civilization unlocks choices and faces new pressure axes.
- **Proof scene:** A reign ends, the chronicle summarizes its legacy, an heir takes the crown, and the next era begins without stopping the stream.
- **Anti-pattern:** The only progression is ever-larger numbers and an ever-growing history list.

## 4. Progression and Outcomes

### Primary progress

`Renown` fills a visible tier track:

1. Camp
2. Hamlet
3. Village
4. Town
5. City
6. Kingdom
7. Legendary Kingdom

Renown comes from sustainable population milestones, completed districts, diplomacy, crisis mastery, discoveries, defensive victories, reign achievements, and Great Works. It cannot be created by presentation or provider callbacks.

### Secondary strategic signals

- population;
- stability;
- food runway in days;
- treasury;
- knowledge;
- defence;
- diplomatic standing;
- current season/year/reign.

Only the primary tier/renown element dominates the persistent HUD.

### Nested loops

- **Moment:** one logical day resolves production, consumption, needs, AI decree, movement-free tile work, pressure, and semantic feedback.
- **Tactical:** the ruler completes a construction, policy, diplomatic mission, crisis response, or seasonal preparation.
- **Run:** the dynasty attempts to reach Legendary Kingdom and complete one Great Work before collapse or the configured maximum era.
- **Stream:** consecutive dynasties chase records for highest tier, renown, population, years survived, crises mastered, alliances, and Great Work speed.
- **Community:** bounded seasonal themes and aggregate records add variety without permanent power.

### Terminal results

- `legendary-victory`: Legendary Kingdom plus completed Great Work and minimum stability.
- `population-collapse`: no viable population remains.
- `state-collapse`: stability remains at zero for the declared terminal window.
- `capital-fallen`: a rule-based rival conflict resolves against an undefended capital.
- `era-timeout`: configured era cap reached; scored resolution, not a technical error.
- `integrity-quarantine`: invalid state, checksum divergence, or incompatible recovery; explicitly excluded from game-loss statistics.
- `operator-abort`: explicit authenticated operational action; excluded from normal outcomes.

Every result shows the decisive cause, timeline highlights, ruler legacy, records, audience contribution summary, next seed/theme preview, and bounded automatic restart.

## 5. Authoritative Simulation

### Logical time

- One fixed authoritative tick equals one game day.
- Thirty days form a season; 120 days form a year.
- No wall-clock, render frame delta, `Math.random`, current time, or provider callback mutates authority.
- Presentation may interpolate or drop frames without changing state.

### System order per tick

1. lifecycle and authenticated operator commands;
2. due, validated, durable audience effects;
3. season/year boundary and scheduled world events;
4. observations and bounded kingdom/rival policy decisions;
5. construction and district work;
6. production, trade, upkeep, consumption, storage, and decay;
7. population health, housing, morale, births, deaths, and migration cohorts;
8. diplomacy and conflict resolution;
9. crises, hazards, and recovery;
10. ruler ageing, succession, progression, terminal evaluation;
11. semantic events, invariant probes, render snapshot, and checksum.

### Named random streams

- `world-topology-v1`
- `world-resources-v1`
- `kingdom-cast-v1`
- `rival-cast-v1`
- `season-weather-v1`
- `crisis-selection-v1`
- `diplomacy-v1`
- `conflict-v1`
- `succession-v1`
- `reward-v1`
- `audience-tie-v1`

Cosmetic animation and audio variation use presentation-only randomness and cannot perturb these streams.

### Bounds

- World: 12×8 default; 16×10 hard maximum.
- Live tiles: fixed by configuration.
- Population: integer cohort total capped by housing and a hard safety maximum.
- Named characters: ruler, heir, up to four councillors, and up to three rival leaders; retired characters compact into aggregate chronicle records.
- Rival kingdoms: three maximum.
- Buildings: at most one primary building and one improvement per tile.
- Live semantic events: bounded queue with priority-aware eviction outside durable storage.
- Chronicle: last 24 highlights plus aggregate reign records in live state.
- Audience queue: fixed cap, expiry, conflict groups, and idempotency registry rollover.

## 6. World and Economy

### World generation

Construct a connected landmass with guaranteed capital site, food source, wood source, stone source, water access, expansion route, and rival separation. Generation uses bounded passes, deterministic repair, and a versioned known-good fallback without changing the declared seed.

Tile biomes: plains, forest, hills, river, lake, marsh, coast. Rule-relevant overlays identify fertility, timber, stone, trade, defence, and hazard exposure.

### Resources

- food;
- wood;
- stone;
- gold;
- knowledge;
- influence.

Every resource has an integer unit, authoritative owner, source, sink, cap, event trail, snapshot behavior, and overflow policy. Common sources always have recurring sinks. Negative balances and integer overflow are invalid.

### Buildings

Initial catalogue: camp, farm, lumberyard, quarry, house, granary, market, workshop, library, clinic, barracks, watchtower, embassy, temple/civic hall, wall, road, harbour where eligible, and three deterministic Great Works. Building availability is tier-gated and biome-constrained.

### Anti-runaway and anti-spiral

- storage caps and spoilage prevent infinite hoarding;
- upkeep and labour opportunity cost constrain expansion;
- diminishing renown returns prevent repetitive building spam;
- stability and health effects use bounded accumulation;
- crisis cooldowns and recovery windows prevent unavoidable chains;
- migration and trade can support recovery but never guarantee it;
- no-progress and runaway monitors trigger rule-visible corrective choices or scored era resolution, never hidden outcome forcing.

## 7. Autonomous Intelligence

### Kingdom policy stack

1. validate observation and invariants;
2. generate only legal actions;
3. emergency reflex for starvation, epidemic, siege, zero housing, or invalid plan;
4. tactical utility scoring for build, policy, trade, diplomacy, defence, research, recovery, or reserve;
5. strategic goal selection for survival, prosperity, knowledge, diplomacy, defence, expansion, or Great Work;
6. deterministic stable tie-break;
7. safe `reserve-and-repair` fallback.

Decision budgets cap candidates, scoring operations, replans, memory, and per-tick work. A remote model is not required. Any future model may only propose asynchronous cold-path flavour or strategic hypotheses; proposals must be schema-valid, current, recorded, legal, bounded, and replaceable by deterministic fallback.

### Rival policy

Rivals use the same legality and resource truth with a smaller bounded action catalogue. They do not receive hidden knowledge unavailable to their declared observation model. Conflict resolution is deterministic from recorded actions, state, and named stream.

### Public intent

Expose only validated fields:

- strategic goal;
- current decree;
- pressure;
- confidence band;
- plan-change reason;
- fallback status.

No hidden chain-of-thought, raw prompts, private viewer data, or debug dumps appear publicly.

## 8. Characters and Succession

### Character model

Each live key character has a stable ID, role, first name from an approved content pack, age, health band, legitimacy where applicable, three bounded traits, one aspiration, relationship bands, current public stance, and portrait recipe. Traits modify declared utility weights within caps.

### Visual constitution

- Strong role silhouette and emblem before facial detail.
- Portraits are generated from deterministic geometric layers and approved palettes; no external or unlicensed character assets are required.
- Ruler, heir, councillor, and rival cards use distinct frames and role icons.
- Expression state is limited to calm, focused, concerned, triumphant, and defeated, driven by semantic state.
- Names never come from audience free text.
- Character cards show no more than two trait chips and one current intent in the normal scene; detail expands contextually.

### Succession

Rulers age on year boundaries. Succession can occur through age/health resolution, crisis, abdication eligibility, or terminal reign event. The heir is selected by deterministic legitimacy and succession rules. A reign summary is compacted into aggregate history, preserving records without retaining unbounded biographies.

## 9. Crisis, Diplomacy, and Conflict

Crisis families include drought, flood, blight, fire, epidemic, harsh winter, market shock, unrest, corruption, raid, border dispute, refugee arrival, discovery, and succession dispute. Each has authored eligibility, warning, severity bounds, response choices, duration, cooldown, conflict group, accessibility treatment, and causal event trail.

Diplomacy supports neutral, wary, friendly, allied, hostile, and war states; trade offers; aid; treaties; border tension; and bounded reputation. War uses strategic strength, supply, terrain, morale, policy, and recorded uncertainty. It does not simulate graphic individual violence and cannot be purchased to force a result.

## 10. Audience Agency

Viewer role: civic council and fate chorus, not omnipotent controller.

Initial fixed-choice catalogue:

- choose the next civic focus among currently safe eligible priorities;
- sponsor a festival, relief shipment, research grant, or fortification fund within caps;
- select one of two declared future weather or challenge opportunities;
- vote on an eligible diplomatic posture;
- select banner, season theme, monument dedication category, or camera focus;
- Chat-vs-AI challenge window that adds bounded pressure without guaranteeing collapse.

All inputs pass authentication where applicable, normalization, schema limits, identity/entitlement, moderation, rate limits, idempotency, state eligibility, director budgets, scheduling, durable acknowledgement, expiry, and reversal handling. Raw chat, donation text, exact payment amounts, provider IDs, or unapproved names never reach game state or public output. Full provider outage leaves a complete autonomous game.

## 11. Broadcast Experience

### Layout

- **Top ribbon:** civilization tier, renown track, season/year/reign, record delta.
- **World stage:** approximately 70% of 16:9 frame, with clear land, districts, work, threats, borders, and selected-character focus.
- **Right story rail:** ruler card, current goal/decree, immediate pressure, concise resource runway, next milestone.
- **Bottom event ribbon:** one high-priority contextual card, captions, and audience window when eligible.
- **Operator diagnostics:** separate and absent from public output.

### Visual language

- Geometric illustrated map with readable isometric-like depth while authority remains a discrete grid.
- Neutral earth materials; progress uses luminous civic gold; danger uses shape, icon, pattern, and contrast rather than red alone; audience agency uses a distinct blue-violet accent.
- Buildings have tiered silhouettes; critical resources and hazards remain readable after compression and at phone size.
- Ambient activity is bounded and cosmetic. Major milestones reserve full-scene treatment.

### Camera and VFX

Camera modes: overview, construction focus, crisis focus, diplomacy, succession, Great Work, result, replay, recovery slate. Zoom/cuts have minimum dwell and impulse caps. Reduced-motion and reduced-flash variants preserve all meaning. Cosmetic effects degrade before goal, danger, character, captions, or result truth.

### Audio

Semantic Web Audio and/or licensed asset adapters use buses for music, ambience, impacts, UI, audience, and system. Music states: intermission, calm, growth, anticipation, crisis, recovery, triumph, defeat, and safe maintenance. Voice counts, cooldowns, ducking, repetition, loudness, true peak, and failure behavior are bounded. Critical states also have visual/caption alternatives. Missing audio never stops authority.

## 12. Persistence, Recovery, and Operations

- One fenced writer lease per run.
- Append-only authoritative events and periodic/milestone snapshots.
- Snapshot metadata includes game, schema, deterministic, configuration, content, seed/RNG, tick, next sequence, state checksum, and payload.
- Restore validates compatibility, checksum, invariants, event continuity, replay checkpoints, and lease ownership.
- Divergence or corruption quarantines the run, preserves evidence, attempts an older verified snapshot, or starts a truthful fresh run.
- Independent probes cover tick progress, meaningful progress/valid idle, render freshness, intended audio state, durability lag, audience gateway, and output health.
- Queues, histories, retries, handles, listeners, assets, effects, logs, snapshots, and caches have caps and lifecycle policies.
- Operator controls include interaction disable, safe intermission, snapshot, restore, fresh run, quality tier, audio reset, renderer reset, rollback, and emergency halt, all role-controlled and audited by the platform boundary.

## 13. Performance Budgets

Reference CI runtime: Node.js 22.16.0. Default world and maximum documented population must meet:

- authoritative tick p99 below 8 ms in headless campaign on CI-class hardware;
- policy decision p99 below 3 ms;
- world generation p99 below 35 ms;
- snapshot serialization p99 below 20 ms and payload below 256 KiB;
- headless throughput above 2,000 game-days/second for default configuration;
- public browser source target 60 fps with a 30 fps safe tier;
- bounded event queue at 512 live events and bounded presentation cue queue at 96;
- no positive unbounded heap, handle, listener, timer, audio voice, effect, or queue slope in software soak evidence.

These are software targets; R5 requires exact-candidate measurement on declared production hardware and capture chain.

## 14. Six-Phase Delivery

1. **Deterministic headless foundation (R1):** configuration, state, world generation, economy, legal action rules, fallback kingdom AI, lifecycle, events, invariants, snapshots, replay, headless runner, and tests.
2. **Autonomous civilization depth (R2):** full policy, buildings, characters, succession, rivals, diplomacy, crises, conflict, tier progression, procedural diversity, campaigns, balance, and character quality review.
3. **Premium broadcast experience (R2 broadcast):** immutable render snapshots, world renderer, responsive HUD, character portrait system, camera/VFX, semantic audio, accessibility, browser source, capture tests, and explicit UI/character/sound critique and improvement.
4. **Audience interaction (R3):** provider-neutral fixed choices, votes, bounded effects, Chat-vs-AI pressure, idempotency, moderation, disclosure, consequence presentation, reversals, outage fallback, and abuse tests.
5. **Reliability and operations (R4 infrastructure):** leases, durable events/snapshots, verified restore, quarantine, supervisor, probes, bounded resources, operator controls, telemetry, runbook, chaos, and engineering soak harness.
6. **Production validation and launch governance (R4 candidate):** traceability, full regression, browser/output checks, campaigns, performance, chaos, release assessor, evidence manifests, security/accessibility/audio review, rollout, rollback, handoff, and honest external R5 block.

Each phase follows test-first implementation, separate specification and quality reviews, load-bearing remediation, reproducible evidence, cohesive commit, and automatic progression only after its software gate is clean.

## 15. Test and Evidence Strategy

Tests include configuration/schema, pure rules, invariants, property sequences, named-stream isolation, replay, snapshot restore/corruption, generator validity/diversity, AI legality/budget/stuck recovery, economy conservation/caps, succession/diplomacy/crisis/conflict, statistical campaigns, render snapshot privacy/immutability, responsive HUD/accessibility, semantic audio priority, audience idempotency/reorder/reversal/abuse/outage, recovery/quarantine, queue bounds, performance, memory slope, chaos, browser capture, and release-gate logic.

Every phase stores a machine-readable manifest containing candidate commit, versions, commands, environment, test counts, campaign seeds, thresholds, results, known risks, and review verdict. CI evidence is not substituted for required real-duration production evidence.

## 16. Explicit Non-Goals and Forbidden Shortcuts

- no individual simulation of every citizen;
- no generative model required for gameplay continuity;
- no raw chain-of-thought or arbitrary audience text;
- no hidden rescue, kill, outcome script, or engagement-based probability rewrite;
- no exact payment-to-power mapping or guaranteed paid outcome;
- no unbounded history, character list, world expansion, queue, retry, or event stream in live memory;
- no technical failure counted as a legitimate game loss;
- no renderer, audio engine, provider callback, database response, or wall clock mutating authority;
- no unlicensed placeholder assets in a release candidate;
- no R5 or “production ready” claim based only on merged code, CI, synthetic campaigns, or implementer self-review.

## 17. Design Review Decision

The selected design passes the pre-implementation architecture and creative review because it creates a distinct catalogue fantasy, one legible progress hierarchy, bounded deterministic authority, meaningful named characters, renewable chapter closure, safe audience agency, provider-independent continuity, explicit failure handling, and phase-by-phase executable evidence. The highest allowed end-of-session claim is an **R4 evidence-gated software candidate** unless genuine external R5 evidence is independently supplied and verified.