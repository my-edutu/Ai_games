# Shared Event Director

## Mission

Select and schedule eligible game events that preserve pacing, novelty, audience consequence, fairness, accessibility, and deterministic replay. The director is a bounded policy over authored possibilities; it is not a hidden outcome script.

## Inputs

- game/version/run/tick and lifecycle;
- normalized game signals: progress, danger, tension, novelty, visual density, meaningful-event age, run age, stuck/recovery risk, estimated remaining band;
- current and recent effect cooldowns/conflicts/caps;
- accepted audience influence requests;
- scheduled platform/content events;
- named `event-director` random stream;
- game-specific event catalogue and eligibility predicates;
- quality/degradation and interaction availability state.

The director cannot inspect future random results, secret provider/payment data, raw chat, or presentation-only state.

## Event Definition

Each event declares:

- stable ID/version and source classes;
- authoritative, vote/choice, cosmetic, informational, or presentation-only class;
- game-state eligibility and prohibited states;
- disclosed effect bounds and parameter schema;
- progress, danger, novelty, visual, audio, and compute budgets;
- cooldown, conflict group, per-run/per-window cap, queue and expiry;
- minimum/maximum run age and milestone relationship;
- weight function using allowed signals;
- audience acknowledgement and reversal behaviour;
- accessibility/quality variants;
- command and semantic-event representation;
- tests, telemetry, and stop-ship conditions.

## Selection Cycle

1. collect candidates permitted by lifecycle, game state, policy, provider/moderation state, caps, cooldowns, conflicts, and quality tier;
2. include accepted audience requests only as their declared eligible event or choice;
3. remove candidates that would hide a critical scene, exceed risk/compute/sensory budgets, repeat too recently, or contradict a pending decisive event;
4. score remaining candidates from versioned transparent features;
5. apply hysteresis and minimum quiet periods;
6. select using stable deterministic ranking and the named random stream only where intentional variation remains;
7. schedule a versioned authoritative command or presentation event at a safe tick/window;
8. persist decision, candidates summary, reason codes, weights, cooldown state, and correlation IDs;
9. expose accepted/queued/applied/expired/rejected status;
10. update pacing history after consequence becomes visible.

No candidate is selected merely because revenue or watch time dipped in the last sample.

## Pacing Model

The model creates contrast across:

- quiet observation;
- anticipation;
- tactical pressure;
- meaningful choice;
- crisis/spectacle;
- resolution;
- recovery/reflection;
- milestone/record;
- intermission/next-run preview.

It tracks meaningful events rather than particles or UI updates. Each game defines target interval distributions by progression band. The director can choose future pressure or opportunity; it cannot rewrite an already resolved outcome.

## Audience Requests

Audience requests enter after gateway validation and game eligibility. The director may:

- schedule immediately at the next declared safe tick;
- queue until an eligible window;
- aggregate into a vote/collective threshold;
- choose a game-declared lower-impact fallback with explicit acknowledgement;
- reject/expire when caps, conflicts, safety, integrity, or time prevent application.

It may not upgrade effects based on exact payment amount, bypass cooldown/moderation, or promise terminal results.

## Anti-Repetition

History records recent event IDs, categories, dramatic role, content features, target entities/regions, audiovisual signature, and consequence. Penalties reduce repeated statistical texture. Hard cooldowns protect rare spectacle.

Anti-repetition never makes an otherwise illegal event legal. When the catalogue is exhausted, quiet progress is preferred over forced duplication or invalid spectacle.

## Anti-Manipulation Rules

The director cannot:

- change collision/damage/resource results after resolution;
- secretly reroll loot, generation, AI decisions, or audience tally;
- create invulnerability/death outside an authored disclosed effect;
- select a winner or guarantee a record;
- falsify progress, records, odds, votes, or viewer contributions;
- trigger paid events without verified entitlement and audit;
- use private/sensitive viewer attributes for targeting;
- ignore accessibility, visual density, audio voice, CPU, or queue budgets.

## Degradation

- audience unavailable: scheduled/autonomous events continue; audience candidates disabled;
- persistence/audit unavailable: defer/reject authoritative paid-eligible effects requiring durability;
- quality pressure: remove costly cosmetic variants and lower-priority events;
- moderation unavailable: fixed non-text choices may continue if policy permits; public text disabled;
- director failure: game continues with game-default deterministic pacing schedule or no optional event;
- replay: decisions are read from recorded commands, not recomputed from live metrics.

## Telemetry

Record candidate count, exclusion reason, selected event, source, signal bands, cooldown/conflict/cap state, scheduled/application delay, consequence visibility, expiry/reversal, meaningful-event interval, repetition score, budget use, audience participation, and error/fallback. Avoid unbounded labels or raw viewer data.

## Testing

- identical state/history/request/seed produces identical decision;
- no candidates results in safe no-op;
- cooldown/conflict/cap/expiry/reversal;
- terminal and decisive-scene suppression;
- quiet-period/hysteresis and anti-flap;
- repetition/diversity campaigns;
- audience bursts and conflicting requests;
- no-audience/moderation/persistence/provider outage;
- visual/audio/compute budget exclusion;
- forbidden hidden manipulation assertions;
- replay reads recorded command and matches checksums;
- balance/retention experiments include fairness and integrity guardrails.

## Acceptance

The director is ready when it creates multiple dramatic patterns and healthy meaningful-event intervals across seeded campaigns while every selected event is eligible, bounded, recorded, replayable, visible in consequence, accessible, performance-safe, and incapable of forcing a hidden winner or loss.
