# Autonomous Snake — Product Requirements Document

**Status:** Approved  
**Product level:** Catalogue reference game  
**Primary platforms:** YouTube and Twitch livestreams through browser/OBS-compatible output  
**Authoritative sources:** Catalogue architecture, documentation standard, production-readiness standard, and specialist skills

## 1. Executive Summary

Autonomous Snake is a premium, self-playing survival and board-conquest game built for uninterrupted livestream entertainment. An AI-controlled snake consumes food, grows, manages shrinking navigable space, adapts to increasingly complex boards, and automatically begins a new run after victory or failure. Viewers understand progress through length, board occupancy, milestones, danger, and records. Chat, gifts, memberships, and operator events may influence bounded choices and environmental modifiers without guaranteeing outcomes.

Snake is the first end-to-end reference implementation for the shared platform. It must prove deterministic simulation, replay, autonomous AI, procedural content, stream HUD, audio/VFX, normalized audience interactions, records, recovery, observability, operator controls, soak testing, and unattended operation before later games reuse the platform.

## 2. Problem and Opportunity

Most self-playing game streams fail because the AI behaves randomly, progress is unclear, outcomes feel scripted, repetition becomes obvious, or a crash/provider outage ends the broadcast. Snake provides a universally understood rule set and a visually satisfying progression curve: every food item increases both achievement and risk. A high-quality autonomous version can create a continuous “will it survive?” loop while minimizing the implementation ambiguity of more complex games.

## 3. Viewer Promise

> Watch an autonomous intelligence grow from a tiny snake into a board-filling system while every decision reduces its future escape space.

Within ten seconds, a new viewer must identify:

- the snake and its movement direction;
- the next food/objective;
- current length and board occupancy;
- immediate danger or trapped-space risk;
- current milestone and record;
- the next audience decision window.

## 4. Target Stakeholders

### Viewers

- casual viewers who understand Snake immediately;
- viewers who enjoy AI, pathfinding, optimization, near-misses, and records;
- chat participants who want collective influence;
- supporters who want visible but fair acknowledged effects.

### Operators

Need reliable scheduling, configuration, moderation, event controls, health, recovery, safe scenes, records, and rollout/rollback without direct game-memory editing.

### Product and Content Team

Need measurable retention/comprehension, reusable event/theme packs, safe monetization hooks, experiment controls, and a reference platform for the rest of the catalogue.

## 5. Product Principles

1. **Legible intelligence:** movement should appear planned and state-derived.
2. **Earned suspense:** danger follows space, speed, hazards, and choices—not hidden forced failure.
3. **Visible conquest:** length and occupancy remain permanent primary progress.
4. **Renewable runs:** seeds, layouts, objectives, themes, event patterns, and AI strategies vary.
5. **Bounded audience agency:** viewers create complications/opportunities but cannot purchase terminal outcomes.
6. **Truthful continuity:** crashes and integrity failures are distinguished from game losses.
7. **Premium restraint:** feedback hierarchy beats sensory overload.
8. **Unattended operation:** common failures recover automatically through verified state.

## 6. Non-Goals

- direct manual player control in the production stream mode;
- competitive cash prizes, wagering, or purchase-linked guaranteed outcomes;
- raw model chain-of-thought display;
- remote-model dependency for movement;
- arbitrary chat commands or unmoderated entity naming;
- photorealistic 3D presentation in the reference release;
- multiplayer snakes in the initial production release;
- hidden operator controls that choose a winner or fake records.

## 7. Core Loops

### Moment Loop

Observe local grid and plan → choose legal direction/route → move → collect/avoid → receive concise feedback → update safe-space and future-route model.

### Tactical Loop

Reach food or a short objective while preserving tail access, escape routes, and sufficient future free space.

### Run Loop

Grow through milestones, environmental phases, speed bands, obstacles, special food, and audience events until collision/trap/starvation, a conquest objective, or an endless-cycle boundary.

### Stream Loop

Result → decisive replay → records and run summary → next seed/challenge preview → automatic countdown → new run.

### Audience Loop

Preview bounded choice → vote/support → validate and schedule → telegraph → apply → show AI adaptation and consequence → cooldown.

## 8. Functional Requirements

### Simulation and Rules

- `FR-SNK-001`: The game MUST use fixed-step authoritative grid simulation.
- `FR-SNK-002`: The snake MUST move one cardinal direction per movement step and MUST NOT reverse directly into its neck.
- `FR-SNK-003`: Body occupancy, food, hazards, obstacles, portals, and effects MUST have deterministic collision/precedence rules.
- `FR-SNK-004`: Food spawn MUST be reachable under the configured spawn policy or generation MUST repair/fallback safely.
- `FR-SNK-005`: Eating MUST update length, score, occupancy, progression, and semantic events atomically.
- `FR-SNK-006`: Terminal reasons MUST distinguish wall, self, hazard, no-valid-route/trap policy, starvation/time limit, conquest victory, operator abort, and integrity quarantine.
- `FR-SNK-007`: The game MUST automatically resolve, intermit, and restart with a new run ID and seed.
- `FR-SNK-008`: Standard and Chat vs AI modes MUST have separate record eligibility.

### Autonomous AI

- `FR-SNK-AI-001`: The AI MUST evaluate legal moves and preserve future survivability under bounded decision budgets.
- `FR-SNK-AI-002`: The initial strategy MUST combine shortest-safe-path evaluation, reachable-space/flood-fill analysis, tail-access preservation, and deterministic fallback.
- `FR-SNK-AI-003`: Higher occupancy MUST enable long-horizon cycle/space-filling strategies where valid rather than greedily targeting food.
- `FR-SNK-AI-004`: Stuck/oscillation/no-progress states MUST be detected and handled without arbitrary teleport.
- `FR-SNK-AI-005`: Remote models MUST NOT be required for movement; any later model use is limited to high-level commentary or strategy proposal with fallback.
- `FR-SNK-AI-006`: The HUD MUST show a bounded validated intent such as “Seeking food,” “Preserving tail route,” “Avoiding trap,” or “Fallback survival.”

### Progression and Content

- `FR-SNK-PROG-001`: Length and occupancy MUST remain persistent primary progress.
- `FR-SNK-PROG-002`: Runs MUST include configurable small, medium, and major milestones.
- `FR-SNK-PROG-003`: Challenge MUST vary across board topology, speed, obstacle density, food rules, hazards, portals, visibility, special objectives, and event eligibility.
- `FR-SNK-PROG-004`: Procedural boards/content MUST be seeded, validated, bounded, and replayable.
- `FR-SNK-PROG-005`: At least three dramatic run patterns MUST occur at healthy rates across validated campaigns.
- `FR-SNK-PROG-006`: Endless mode MUST use cycle/phase renewal and a declared maximum resource/state policy.

### Presentation and Audio

- `FR-SNK-UX-001`: The stream MUST permanently show run status, length, occupancy, milestone, and record.
- `FR-SNK-UX-002`: The board, snake head/body, food, hazards, safe/unsafe cues, and decisive events MUST remain readable at representative mobile size.
- `FR-SNK-UX-003`: Presentation MUST support countdown, normal, danger, milestone, vote, result, replay, intermission, provider-degraded, recovery, maintenance, and clean-feed scenes.
- `FR-SNK-UX-004`: Semantic events MUST drive bounded animation, VFX, camera, music, SFX, and captions/visual alternatives.
- `FR-SNK-UX-005`: Reduced-motion, reduced-flash, color-safe, captions, and quality tiers MUST preserve critical meaning.
- `FR-SNK-UX-006`: A renderer or audio failure MUST NOT alter authoritative results or stop the simulation when recovery can preserve output truth.

### Audience Interaction

- `FR-SNK-INT-001`: Inputs MUST enter through the shared normalized audience gateway.
- `FR-SNK-INT-002`: Every effect MUST declare eligibility, bounds, cooldown, conflicts, caps, expiry, reversal, replay, and acknowledgement.
- `FR-SNK-INT-003`: Initial effects MUST include at least one opportunity, complication, strategic choice, and cosmetic/theme event.
- `FR-SNK-INT-004`: No effect MAY place an unavoidable immediate death, guarantee survival, select a winner, or alter records secretly.
- `FR-SNK-INT-005`: Votes MUST use fixed options, authoritative windows, deterministic ties, moderation, idempotency, and visible consequence.
- `FR-SNK-INT-006`: The game MUST continue autonomously with all providers/interactions disabled.

### Persistence, Records, and Operations

- `FR-SNK-OPS-001`: Runs MUST record versions, configuration/content hashes, seed streams, authoritative events, checksums, snapshots, results, and records.
- `FR-SNK-OPS-002`: Snapshot restore plus replay MUST match uninterrupted checksums.
- `FR-SNK-OPS-003`: The supervisor MUST detect tick stalls, AI budget failure, render/audio/output failure, persistence lag, provider outage, resource growth, crash loops, and divergence.
- `FR-SNK-OPS-004`: Operators MUST be able to disable interactions, switch safe scenes, restart components, restore verified state, start fresh, and rollback through typed audited commands.
- `FR-SNK-OPS-005`: Technical failure MUST be classified separately from game loss.

## 9. Non-Functional Requirements

- `NFR-SNK-DET-001`: Identical version/config/content/seed/event log MUST produce matching authoritative checksums.
- `NFR-SNK-PERF-001`: Authoritative tick p99 MUST remain below 50% of the configured tick interval on reference hardware under normal maximum board configuration.
- `NFR-SNK-PERF-002`: Stream presentation MUST sustain its target frame rate with critical HUD/VFX enabled.
- `NFR-SNK-REL-001`: Memory, handles, timers, listeners, textures, audio resources, histories, and queues MUST stabilize during required soak.
- `NFR-SNK-REL-002`: Common process/provider failures MUST recover or degrade within catalogue targets.
- `NFR-SNK-ACC-001`: Goal, progress, danger, and result MUST remain understandable with audio muted and without reliance on color alone.
- `NFR-SNK-SEC-001`: Secrets, raw provider payloads, private viewer IDs, payment details, unmoderated text, prompts, and stack traces MUST NOT enter public/game state.
- `NFR-SNK-TEST-001`: Accelerated campaigns MUST cover at least 100,000 lightweight runs or a statistically justified larger-equivalent tick workload before R4.
- `NFR-SNK-OPS-001`: A 72-hour candidate soak and seven-day canary MUST pass before R5.

## 10. Initial Game Modes

### Classic Conquest

Open or lightly structured board; survive and maximize length/occupancy.

### Milestone Run

Reach escalating occupancy targets with milestone modifiers and checkpoints that do not remove terminal stakes.

### Gauntlet

Authored/procedural obstacle and hazard phases with stronger tactical variation.

### Chat vs AI

Audience chooses bounded complications/opportunities through shared mode rules.

Modes share rules and AI components but keep mode/config-specific records.

## 11. Effect Catalogue — Launch Minimum

- `bonus-food`: validated reachable special food; capped reward.
- `safe-hint`: temporarily reveals or boosts a safe-route heuristic; no guaranteed success.
- `shield-token`: absorbs one eligible hazard class for a short declared window; cannot negate self/wall rules unless explicitly configured and record mode distinguishes it.
- `speed-shift`: bounded temporary speed increase/decrease at safe boundary.
- `fog`: presentation/information restriction within accessibility limits.
- `obstacle-choice`: audience selects one of prevalidated placements/patterns; no immediate unavoidable collision.
- `portal-pulse`: activates a prevalidated portal pair for a bounded window.
- `theme-vote`: cosmetic board/snake/audio theme.
- `challenge-next-run`: selects the next eligible challenge profile.

Exact parameters are configuration and undergo balance/interaction review.

## 12. Success Metrics

### Product Quality

- ten-second comprehension pass rate;
- meaningful-event interval distribution;
- run-duration/progress/win/loss/terminal-reason distributions;
- dramatic-pattern and board/strategy diversity;
- record and milestone cadence;
- result-to-next-run interval.

### AI Quality

- legal action rate;
- decision p99 and budget violations;
- fallback/stuck/oscillation rate and recovery;
- occupancy and survival distributions by board feature band;
- strategy diversity and tail-route preservation failures.

### Interaction Quality

- request/accept/apply/reject/expire/reverse rates;
- duplicate application rate: zero;
- vote participation and consequence-visibility latency;
- provider-outage autonomous continuity;
- fairness/moderation/accessibility guardrails.

### Operational Quality

- tick/render/audio/output availability;
- restore checksum success;
- crash-loop/quarantine rate;
- memory/resource slopes;
- snapshot age/recovery time;
- 72-hour soak and seven-day canary status.

Viewer watch/return/support metrics may guide experiments but cannot override integrity, fairness, accessibility, moderation, security, or reliability gates.

## 13. Risks and Mitigations

- **Greedy AI traps itself:** layered safe-space/tail-access/cycle strategies and benchmark corpus.
- **Near-perfect AI becomes endless/boring:** progression, challenge topology, bounded modifiers, milestone objectives, and target run distributions—never forced death.
- **Boards become repetitive:** feature-stratified generator, theme/event grammar, diversity metrics, regression seed bank.
- **Audience creates unfair death:** prevalidated placements, safe windows, effect budgets, explicit prohibited terminal effects.
- **High occupancy causes CPU spikes:** incremental occupancy structures, bounded path search, cycle strategy, profile tails.
- **Visual clutter hides path:** strict hierarchy, density budgets, mobile captures, quality tiers.
- **Restart/provider failure duplicates effects:** gateway/simulation idempotency and replay tests.
- **Long run leaks resources:** bounded histories and 72-hour soak with resource-slope alerts.

## 14. Launch Acceptance

Autonomous Snake reaches R5 only when all six phase gates pass, complete documentation matches implementation, deterministic replay and restore are proven, target distributions are statistically supported, audience effects are safe and auditable, broadcast/audio/accessibility evidence passes, common failure recovery and operator runbooks are rehearsed, resource use remains bounded, the 72-hour candidate soak succeeds, and a seven-day canary completes without load-bearing findings.
