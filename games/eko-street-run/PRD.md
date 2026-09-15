# Eko Run Product Requirements Document

**Game:** Eko Run (`eko-street-run`)  
**Purpose:** Define product requirements, constraints, success metrics, risks, and evidence for Eko Run v1.  
**Status:** `approved` for Phase 0–1 execution  
**Owning scope:** Catalogue product contract  
**Authoritative related documents:** `GAME_DESIGN.md`, `TECHNICAL_ARCHITECTURE.md`, `TESTING_STRATEGY.md`, `AUDIO_VISUAL.md`, `docs/EKO_EXPERIENCE_STANDARD.md`.  
**Last material review:** 2026-09-15  
**Version:** `PRD-1.0`

## 1. Executive Summary

Eko Run is a new original browser-based 2.5D/3D precision platformer for the Ai_games catalogue. It combines deterministic platforming craft with a Lagos-inspired world, expressive Nigerian outfit silhouettes, readable street/traffic hazards, district progression, autonomous AI play, and later bounded livestream viewer influence. Human and autonomous modes share one authoritative ruleset.

## 2. Problem and Opportunity

Many themed platformers achieve visual novelty without excellent movement, while many autonomous livestream games achieve continuity without a strong sense of place. Eko Run must do both: remain satisfying when every Lagos texture is stripped away and remain unmistakably Eko Run when its title is hidden.

The catalogue opportunity is a highly legible action game that works for direct play, short clips, long autonomous streams, and culturally specific art direction without depending on licensed franchise assets.

## 3. Target Stakeholders

- **Players:** browser users on keyboard, gamepad, and supported touch devices.
- **Viewers:** livestream viewers who need immediate comprehension without prior context.
- **Operators:** people running unattended or scheduled AI Street Run channels.
- **Maintainers:** engineers/artists who need deterministic reproduction and evidence.
- **Platform stakeholders:** providers whose inputs may later be normalized behind the audience gateway.

## 4. Viewer Promise and Stream Premise

**Viewer promise:** Viewers watch Tayo attempt to maintain momentum through increasingly demanding Lagos-inspired routes while traffic, terrain, weather, crowds and route pressure escalate, and they return because each run produces new readable combinations, recoveries and record attempts.

**Adversarial premise:** The city route is alive with movement and pressure, but every ordinary hazard must provide a skilled, visible response opportunity.

## 5. Product Principles

1. **Movement before scenery.** Control quality outranks cinematic presentation.
2. **Lagos through behaviour, not decoration.** Spatial situations, transport motion, commerce, weather, architecture, sound and clothing build identity.
3. **Fair chaos.** Busy scenes may look energetic but gameplay-critical hazards remain cued and avoidable.
4. **One truth.** Human, AI, headless and streamed modes execute one authoritative rules implementation.
5. **Original IP.** Study platformer craft; never copy franchise assets, characters, levels, music or branding.
6. **Evidence before status.** A phase passes only with the required runtime/static evidence.

## 6. Non-Goals for v1

- Open-world driving or a literal Lagos map.
- Photorealistic simulation of specific real people.
- Combat focused on harming pedestrians or protected groups.
- Free-form user-generated chat commands controlling authority.
- Remote language-model inference in the real-time authoritative loop.
- Pay-to-win, pay-to-kill, guaranteed records, cash prizes, or gambling mechanics.
- Copying Mario/Nintendo or any other franchise character, layout, audio or art.

## 7. Core Loops

### Moment loop

Read route → choose movement action → execute → receive immediate physical/semantic feedback → preserve or lose momentum → read next decision.

### Tactical loop

Approach a hazard cluster or route choice → evaluate safer/faster path → commit → recover/collect optional reward → reach checkpoint.

### Run loop

Traverse district segments → pass checkpoints → handle escalating combinations → complete district/run or fail causally → compare record → restart/advance.

### Session/stream loop

Multiple runs produce records, route variation, outfit/theme changes, AI strategy differences, viewer decision windows and district cycles.

## 8. Functional Requirements

| ID | Requirement | Priority | Primary phase |
|---|---|---|---|
| FR-GAME-001 | The game MUST expose a single authoritative command interface usable by human and autonomous controllers. | MUST | 1 |
| FR-GAME-002 | The game MUST make distance/checkpoint progress the primary persistent run measure. | MUST | 1/6 |
| FR-GAME-003 | The player controller MUST support run, jump, variable jump release, coyote time, input buffer, air control, slide/dodge, selected vaults, landing and recovery under fixed-step authority. | MUST | 2 |
| FR-GAME-004 | Ordinary hazards MUST expose a warning cue, decision point and legal avoidance/recovery response before punishment. | MUST | 4/5 |
| FR-GAME-005 | Tayo MUST ship with Yoruba-inspired, Igbo-inspired, Hausa-inspired and contemporary Lagos outfit families using equal authoritative collision truth. | MUST | 3 |
| FR-GAME-006 | The game MUST provide checkpoint, terminal result, record, intermission and restart states that do not require an operator. | MUST | 2/6 |
| FR-GAME-007 | AI Street Run MUST play the same rules, route definitions, collision truth, checkpoints and records as Player Mode. | MUST | 8 |
| FR-GAME-008 | Generated route variation MUST preserve a guaranteed traversable backbone and validate hazards/clearances before play. | MUST | 6 |
| FR-GAME-009 | Eko Tokens and persistent rewards MUST be cosmetic/identity-focused or otherwise bounded so future outcomes are not predetermined. | MUST | 6 |
| FR-GAME-010 | Viewer influence MUST enter through normalized, moderated, rate-limited, idempotent, replayable requests and MUST NOT guarantee terminal outcomes. | MUST | 9 |
| FR-GAME-011 | The v1 district set MUST include Mainland Morning, Market Rush, Danfo Junction, Rainy Lagos, Island Night and Bridge Run as mechanically differentiated districts. | MUST | 4/10 |
| FR-GAME-012 | Technical failure MUST produce a recovery/quarantine/system state rather than a gameplay loss. | MUST | 12 |

## 9. Non-Functional Requirements

| ID | Requirement | Priority | Primary phase |
|---|---|---|---|
| NFR-DET-001 | Authoritative state MUST advance at a fixed 60 Hz logical tick and MUST NOT use render delta as gameplay time. | MUST | 1 |
| NFR-DET-002 | All authoritative randomness MUST use versioned named streams derived from the run seed; `Math.random` and wall-clock seeding are forbidden in authority. | MUST | 1 |
| NFR-DET-003 | Identical versions, config, content, seed and normalized commands MUST produce identical checkpoint/final checksums. | MUST | 1 |
| NFR-ARCH-001 | Presentation, audio, analytics, providers and future model services MUST NOT mutate authoritative state directly. | MUST | 1 |
| NFR-ARCH-002 | Authoritative state, commands, events, snapshots and configuration MUST be serializable and versioned. | MUST | 1 |
| NFR-PERF-001 | Phase 1 headless simulation MUST keep p99 tick time below 4 ms and worst observed tick below the 16.67 ms real-time budget in the declared CI workload; later 3D phases define renderer budgets separately. | MUST | 1 |
| NFR-PERF-002 | Quality degradation MUST remove ambient/cosmetic detail before hazard, route, control, camera or accessibility information. | MUST | 4/11 |
| NFR-UX-001 | Five uninstructed reviewers SHOULD identify protagonist, direction/progress and immediate danger within five seconds of representative footage by the vertical-slice gate. | SHOULD | 4 |
| NFR-UX-002 | A high experience score MUST NOT override an Eko stop-ship finding. | MUST | all |
| NFR-ACC-001 | Critical gameplay information MUST have non-audio and non-color-only representation; reduced-motion/flash variants MUST preserve meaning. | MUST | 4/7/11 |
| NFR-SEC-001 | Secrets, raw payment/provider payloads, private IDs, moderation evidence and raw user text MUST NOT enter authoritative state, render snapshots, replays or public diagnostics. | MUST | 1/9 |
| NFR-ASSET-001 | Every external visual/audio asset considered for release MUST have recorded provenance, licence, third-party-rights review and approved-use status. | MUST | 0/all |
| NFR-REL-001 | Snapshots used for recovery MUST validate version, checksum, invariants and event continuity before resume. | MUST | 1/12 |
| NFR-REL-002 | Optional provider/model/telemetry failure MUST preserve autonomous gameplay whenever authoritative truth remains valid. | MUST | 8/9/12 |

## 10. Monetization and Platform-Policy Constraints

Eko Run v1 does not require monetization. If paid-eligible viewer interactions are later enabled, payment is entitlement evidence only. Paid/free inputs share the same safety, legality, moderation, cooldown and integrity path. No amount may directly set survival, failure, score, collision result, winner, record or cash-equivalent outcome.

## 11. Metrics and Success Contracts

| Metric | Definition | Decision |
|---|---|---|
| Five-second comprehension | Proportion of uninstructed reviewers correctly naming protagonist goal/progress and immediate danger from a representative clip. | Rework hierarchy/camera/level if below 80% in vertical-slice review. |
| Legitimate failure rate | Failures with a replay-visible rule cause divided by gameplay failures. | Any unavoidable/invalid-content failure is a defect, not accepted difficulty. |
| Camera-caused failure | Failure where required route/hazard/landing information was not reasonably visible before commitment. | Any ordinary reproducible instance blocks the experience gate. |
| Replay match rate | Identical fixture runs whose checkpoint/final checksums match. | Must equal 100% for supported Phase 1 fixtures. |
| AI illegal-action rate | Invalid autonomous actions divided by submitted actions after policy validation. | Must equal 0% at the authority boundary. |
| Procedural validity | Generated routes passing hard constraints without fallback. | Phase 6 sets target after corpus baseline; invalid routes never count as fair losses. |
| p99 tick/frame health | p99 authoritative tick and later render time under declared workload. | Blocks phase if declared budget is exceeded reproducibly. |
| Resource slope | Long-run heap/handles/textures/voices/queues trend after warm-up. | Monotonic unbounded growth blocks readiness. |

## 12. Accessibility, Safety, Privacy and Moderation

- Critical hazards cannot depend on stereo direction, color, or sound alone.
- Reduced-motion and reduced-flash modes must preserve gameplay meaning.
- Crowd/fight incidents remain non-graphic environmental disturbances and cannot depict targeted ethnic violence or identifiable stock-photo people.
- Raw audience text is excluded from authority and direct overlays; pre-authored choices are preferred.
- Viewer identity is collected only when a later interaction requirement demonstrates necessity.

## 13. Dependencies and Integration Boundaries

Phase 1 depends only on the repository TypeScript/Node foundation and public game-agnostic package contracts where necessary. Three.js, Web Audio, provider SDKs and persistence services are presentation/integration dependencies introduced behind explicit adapters in later phases.

## 14. Risks and Mitigations

| Risk | Mitigation | Stop-ship trigger |
|---|---|---|
| Beautiful environment hides weak platforming | Greybox movement gate before world polish; platformer-experience review. | Movement fails mechanics-only test. |
| Lagos represented as stereotype/poverty/chaos only | Reference constitution includes commerce, fashion, architecture, community, modernity, water/skyline and humour alongside pressure. | Identity relies mainly on generic disorder/flags. |
| Stock imagery creates endorsement/likeness risk | Reference-only default; original modeled/vector assets; asset ledger. | Unreviewed identifiable person/logo shipped. |
| Frame-rate changes outcomes | Fixed-step authority, replay fixtures across render schedules. | Checksum divergence. |
| Traffic feels unfair | Hazard fairness contracts, reaction-window tests, camera causality review. | Ordinary unavoidable hit. |
| AI needs cloud model to continue | Deterministic local policy/fallback required. | Remote inference required for progress. |
| Viewer feature corrupts game integrity | Provider-neutral normalized envelope; idempotency/moderation before eligibility. | Raw provider/payment callback mutates game. |

## 15. Launch Scope and Exclusions

Launch scope includes six differentiated districts, four outfit families, Player Mode, AI Street Run, deterministic route variation, records, accessibility settings, production stream presentation and only those viewer interactions that pass provider/policy evidence. Literal map navigation, real-person likeness gameplay and franchise crossover content are excluded.

## 16. Acceptance and Evidence

A requirement closes only with its owning phase's named runtime/static evidence. `REQUIREMENT_TRACEABILITY.md` is the status source. Phase 0 closes documentation/research requirements; Phase 1 closes only the deterministic foundation subset. No later gameplay requirement is marked complete from prose.
