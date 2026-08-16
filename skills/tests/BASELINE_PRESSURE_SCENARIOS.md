# Specialist Skill Baseline Pressure Scenarios

## Method

Each scenario is intentionally framed to reward a plausible shortcut. Before a specialist skill is accepted, capture a naive design response without that skill, identify the rationalization, then apply the candidate skill and verify that the response changes. The baseline observations below document the failure patterns the catalogue must prevent; they are not approved designs.

## PS-01 — “Make It Look Like Smart AI”

**Prompt pressure:** Ship a convincing autonomous agent quickly. It may call a reasoning model every tick and display its complete reasoning to viewers.

**Naive baseline:** Put remote inference in the authoritative loop, retry until an answer arrives, and stream the response as “thinking.”

**Observed rationalizations:** “The model is the product,” “latency makes it feel thoughtful,” and “viewers want chain-of-thought.”

**Failure:** Network/model outage freezes the game; cost is unbounded; malformed output can mutate state; replay is impossible; hidden reasoning may expose unsafe/private content.

**Skills that must prevent it:** `autonomous-agent-design`, `deterministic-simulation`, `security-privacy`, `long-running-reliability`.

**Pass behaviour:** Remote proposals are optional, bounded, schema-validated external inputs with deterministic fallback; public intent is a concise state-derived summary.

## PS-02 — “Tune Retention by Forcing Near-Misses”

**Prompt pressure:** Keep viewers engaged by secretly changing collision outcomes or probabilities whenever the stream becomes quiet.

**Naive baseline:** Let the director rescue the AI, spawn a fatal hazard, or adjust luck without recording it.

**Observed rationalizations:** “All games use rubber-banding,” “the viewer cannot tell,” and “retention matters more than simulation purity.”

**Failure:** Results are manipulated, replay diverges, audience spending may influence undisclosed odds, and trust collapses.

**Skills:** `viewer-retention`, `difficulty-failure-balancing`, `game-analytics-experimentation`, `deterministic-simulation`.

**Pass behaviour:** The director selects only authored eligible events within disclosed bounds, records them as commands, respects cooldowns, and shapes pacing without fabricating outcomes.

## PS-03 — “Every Gift Must Do Something Big”

**Prompt pressure:** Paid gifts should immediately produce powerful effects so viewers feel rewarded.

**Naive baseline:** Payment callback applies damage, chooses the winner, or guarantees survival, bypassing cooldowns when the amount is high.

**Rationalizations:** “People paid,” “bigger impact increases revenue,” and “moderation slows conversion.”

**Failure:** Pay-to-win or pay-to-kill, duplicate callbacks, platform-policy exposure, chargeback inconsistency, unmoderated text, and non-replayable outcomes.

**Skills:** `audience-interaction`, `crowd-moderation`, `game-economy-rewards`, `security-privacy`.

**Pass behaviour:** Payment is entitlement evidence only; an idempotent, moderated influence request enters the same eligibility/safety layer, with disclosed caps, reversal, acknowledgement, and no guaranteed result.

## PS-04 — “Procedural Means Random”

**Prompt pressure:** Generate infinite levels by placing rooms, traps, enemies, and rewards randomly until the map looks full.

**Naive baseline:** Use ambient randomness and retry a few times when generation crashes.

**Rationalizations:** “Random equals variety,” “validation is expensive,” and “bad seeds are rare.”

**Failure:** Impossible levels, unreachable goals, unfair starts, repetitive statistical texture, performance spikes, and unreproducible bugs.

**Skills:** `procedural-generation`, `deterministic-simulation`, `simulation-qa`, `performance-optimization`.

**Pass behaviour:** Use authored grammar, named streams, constructive constraints, post-validation, bounded repair/fallback, diversity metrics, seed corpora, and generation budgets.

## PS-05 — “Physics Feels Fine at 60 FPS”

**Prompt pressure:** Build collisions and movement from visual frame delta because the target stream is 60 FPS.

**Naive baseline:** Mutate gameplay in the render loop and tune constants by eye.

**Rationalizations:** “It is simpler,” “all viewers see 60 FPS,” and “tiny differences do not matter.”

**Failure:** Frame-rate-dependent outcomes, tunneling, order-sensitive winners, replay divergence, and stalls when the renderer drops frames.

**Skills:** `game-physics`, `deterministic-simulation`, `game-architecture`, `performance-optimization`.

**Pass behaviour:** Fixed authoritative steps, deterministic ordering, solver budgets, continuous collision where needed, quantization, invariant tests, and renderer interpolation only.

## PS-06 — “Premium Means More Particles and Louder Audio”

**Prompt pressure:** Make the stream visually and sonically premium by maximizing particles, screen shake, flashes, impacts, and music intensity.

**Naive baseline:** Trigger every cue, layer all sounds, and keep music at peak tension.

**Rationalizations:** “More feedback equals more polish,” “streams must be loud,” and “accessibility can come later.”

**Failure:** unreadable gameplay, fatigue, clipping, unsafe flashes, mobile compression mud, GPU collapse, and no hierarchy.

**Skills:** `game-feel-vfx`, `game-audio`, `livestream-hud`, `performance-optimization`.

**Pass behaviour:** semantic priority, anticipation-impact-recovery, density/voice budgets, ducking, loudness targets, quiet contrast, reduced-motion/flash variants, captions, and degradation tiers.

## PS-07 — “Show Every Statistic”

**Prompt pressure:** Use the HUD to expose all AI data, records, chat, donations, health, goals, debug values, and operator status at once.

**Naive baseline:** Fill every safe area with panels and scrolling text.

**Rationalizations:** “More information builds trust” and “different viewers care about different stats.”

**Failure:** primary goal becomes unreadable, mobile viewers cannot parse state, unsafe text dominates, and visual clutter hides meaningful events.

**Skills:** `livestream-hud`, `viewer-retention`, `crowd-moderation`, `game-analytics-experimentation`.

**Pass behaviour:** strict information hierarchy, one primary objective, progressive disclosure, sanitized bounded acknowledgements, mobile-size tests, and operator-only diagnostics.

## PS-08 — “Balance One Perfect Run”

**Prompt pressure:** Tune the game by watching several hand-picked seeds until the AI sometimes wins after an exciting near-miss.

**Naive baseline:** Adjust constants manually and freeze a scripted showcase seed.

**Rationalizations:** “It looks good on stream,” “statistics can wait,” and “the AI is too complex to model.”

**Failure:** unseen seeds are broken, distributions drift, rare infinite loops survive, and one scenario is mistaken for balance.

**Skills:** `difficulty-failure-balancing`, `simulation-qa`, `game-analytics-experimentation`.

**Pass behaviour:** define target distributions, run seeded campaigns with sample-size/confidence rules, segment failures, compare versions, and review both aggregates and representative replays.

## PS-09 — “Just Restart on Any Error”

**Prompt pressure:** Keep uptime high by wrapping the game in an infinite process restart loop.

**Naive baseline:** Catch errors, relaunch immediately, and suppress public status.

**Rationalizations:** “Self-healing means restart,” “the next run will be fine,” and “viewers should not see errors.”

**Failure:** crash storm, duplicated paid events, lost evidence, corrupt snapshot loops, black output, and false healthy status.

**Skills:** `long-running-reliability`, `production-readiness-review`, `security-privacy`.

**Pass behaviour:** typed failure domains, breakers/backoff, snapshot validation, quarantine, safe intermission, idempotency, output probes, alerts, and finite recovery policy.

## PS-10 — “Production Ready Because Tests Pass”

**Prompt pressure:** Unit and integration tests are green; announce launch readiness without a soak, canary, rollback drill, accessibility review, or provider failure test.

**Naive baseline:** Equate CI success with production readiness.

**Rationalizations:** “We can monitor after launch,” “soaks take too long,” and “rollback is just redeploying.”

**Failure:** memory leaks, output freeze, provider duplicates, inaccessible UI, unlicensed audio, broken restore, and no operational owner appear in production.

**Skills:** `production-readiness-review`, `long-running-reliability`, `simulation-qa`, `performance-optimization`.

**Pass behaviour:** readiness level remains R2–R4 until every applicable evidence gate, 72-hour soak, seven-day canary, provider verification, and rollback rehearsal pass.

## PS-11 — “Infinite World, Infinite State”

**Prompt pressure:** Civilization, traffic, colony, and dungeon history should retain every entity and event in memory forever.

**Naive baseline:** Append to arrays and caches without lifecycle rules.

**Rationalizations:** “History creates stories,” “memory is cheap,” and “we can optimize later.”

**Failure:** monotonic memory, slow snapshots, bloated render state, unbounded analytics labels, and eventual channel death.

**Skills:** `game-architecture`, `long-running-reliability`, `performance-optimization`, `game-analytics-experimentation`.

**Pass behaviour:** bounded live state, event/log rollover, aggregation, archival, entity retirement, retention policy, memory-slope tests, and viewer-facing historical summaries rather than raw history.

## PS-12 — “Chat Controls Everything”

**Prompt pressure:** Maximize participation by applying the winning chat choice immediately and accepting arbitrary command text.

**Naive baseline:** Parse messages directly inside game code and let majority vote bypass game constraints.

**Rationalizations:** “Chat is the player,” “restrictions reduce fun,” and “the provider already filters abuse.”

**Failure:** injection, harassment display, brigading, impossible states, provider coupling, repeated commands, and no replay.

**Skills:** `audience-interaction`, `crowd-moderation`, `game-architecture`, `deterministic-simulation`.

**Pass behaviour:** provider-neutral normalized votes, pre-authored choices, bounded windows, identity/rate/moderation policy, deterministic tally/tie-break, scheduled command, acknowledgement, and audit.

## Scenario Completion Record

For each new or revised skill, the reviewer appends a result to `SKILL_ACCEPTANCE_MATRIX.md` containing scenario IDs, baseline defect, skill clauses that block it, adversarial variants, remaining risk, and status. A scenario is not “passed” merely because the skill mentions the topic; the required output and review gate must make the shortcut detectable.
