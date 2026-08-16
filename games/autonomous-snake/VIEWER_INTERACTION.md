# Autonomous Snake — Viewer Interaction

**Status:** Approved design  
**Mode principle:** Viewers influence the environment and strategic pressure; the autonomous snake remains responsible for survival.

## Viewer Roles

- **Supporter:** chooses bounded opportunities such as special food or a short defensive tool.
- **Challenger:** chooses validated hazards, obstacles, fog, or speed pressure.
- **Strategist:** votes between routes/modifier packages and next-run challenge profiles.
- **Patron:** receives safe cosmetic acknowledgement or capped voting privileges according to platform policy.
- **Spectator:** watches with no interaction; the complete game remains entertaining.

## Interaction Rhythm

A normal run uses contextual windows rather than constant polling:

1. announce an upcoming choice after ordinary progress;
2. display two to four pre-authored eligible options;
3. accept normalized fixed votes for an authoritative window;
4. tally deterministically with documented identity/weight/tie rules;
5. telegraph the winning effect;
6. schedule it at a validated safe tick or next-run boundary;
7. show the snake adapting and highlight the consequence;
8. enforce cooldown and quiet/progress time.

The Event Director suppresses a window during terminal resolution, critical hazard readability, recovery, excessive effect density, provider/audit uncertainty, or when no fair effect exists.

## Launch Effect Catalogue

### `bonus-food`

Spawns one reachable special food at a validated candidate cell. Parameters cap growth/reward, expiry, spawn distance, and concurrent special food. It cannot spawn inside the body, obstacle, lethal hazard, or unreachable partition.

### `safe-hint`

Temporarily increases the AI’s allowed safe-route analysis or reveals a validated route-quality cue. It improves information/compute within a cap; it does not choose or guarantee the move.

### `shield-token`

Provides one bounded protection against an explicitly eligible hazard family for a declared duration/use count. Standard record modes declare whether shield use affects record category. It cannot erase an already resolved collision.

### `speed-shift`

Applies a bounded speed-up or slow-down at a safe movement boundary for a fixed duration. The HUD displays the modifier and expiry. It cannot shrink decision time below tested budgets.

### `fog-field`

Reduces selected public/AI information only according to mode policy, with accessible HUD alternatives and fixed duration. It cannot conceal critical danger unfairly or affect observers differently without disclosure.

### `obstacle-choice`

Selects one of precomputed obstacle patterns/cells that pass placement validation: no current overlap, no immediate unavoidable collision, sufficient escape region, no invalid food isolation, and within density/cooldown caps.

### `portal-pulse`

Activates a validated portal pair for a fixed window. The AI observes active portal rules normally. Portal emergence is telegraphed and cannot transform the snake into an invalid state.

### `food-choice`

Viewers choose between two or more visible food trade-offs—safer/less reward versus riskier/more reward—whose candidates are already valid.

### `theme-vote`

Changes cosmetic snake, board, HUD accent, ambience, or music theme at a safe scene transition. Cosmetic randomness is non-authoritative.

### `next-challenge`

Selects the next eligible board profile or modifier package. The current run is unaffected, making this a reliable fallback when authoritative effects are unavailable.

## Chat vs AI

The shared mode presents complication rounds such as:

- add obstacle pattern / activate portal / add timed hazard;
- increase speed / add fog / shorten special-food expiry;
- block preferred route A / create risky shortcut B / spawn choice food C;
- save pressure for a stronger future round / spend pressure now.

The mode uses a bounded pressure budget based on occupancy, recent effects, AI recovery state, and board features. It cannot stack effects beyond validated caps, force an immediate terminal collision, or change a completed outcome.

## Gift and Membership Mapping

Provider support events may grant:

- capped voting weight within channel policy;
- nomination of one eligible option/category;
- cosmetic acknowledgement or theme token;
- one eligible effect request subject to all validation/cooldowns/caps;
- next-run challenge token.

Exact payment amount never maps directly to unbounded growth, damage, obstacle count, speed, or survival. Support buys the disclosed eligible opportunity, not a guaranteed application or result. Unavailable/expired/reversed events follow provider and channel policy with a durable audit trail.

## Validation Pipeline

All events pass:

1. provider authentication and replay protection;
2. normalized schema and payload limits;
3. privacy-safe identity and entitlement;
4. region/platform policy;
5. moderation and sanctions;
6. per-viewer/effect/run/channel/global rate limits;
7. idempotency lookup;
8. Snake game-state eligibility;
9. Event Director cooldown/conflict/pressure/sensory/compute budget;
10. durable schedule/decision and acknowledgement.

No provider callback enters the Snake reducer directly.

## Vote Rules

- fixed option IDs only;
- authoritative window ID/start/end;
- one eligible base vote per identity unless capped entitlement weighting applies;
- deterministic duplicate handling;
- tie uses configured priority or `audience-tiebreaks` named stream;
- late/retried/reconnected events follow original window rules;
- result command schedules at a safe tick;
- tally and application are replayable;
- bot/brigade policy may quarantine the window but cannot secretly select another option.

## Public Acknowledgement

States: received, validating, accepted, queued, applied, rejected, expired, cancelled, reversed. The stream normally shows only accepted/queued/applied plus concise aggregate voting status. Display names are sanitized, bounded, optional, and lower priority than gameplay danger/result.

Copy never says “you saved/killed the snake” unless the authoritative causal chain supports a bounded factual statement; prefer “Your vote activated Fog” or “Chat opened the portal.”

## Failure and Degradation

- provider down: AI continues; interaction timer becomes reconnect status;
- moderation down: disable public text/name acknowledgements; fixed choices continue only if policy permits;
- entitlement/audit uncertain: reject/defer paid-eligible authoritative effects;
- burst/queue full: aggregate votes, reject/expire lower-priority requests, never block tick;
- no eligible effect: present next-run/theme choice or extend cooldown;
- run resolves before queued effect: expire or carry only if the definition explicitly permits next-run application;
- reversal: append reversal event and follow effect-specific policy; never delete history or roll back completed gameplay invisibly.

## Metrics and Tests

Measure request/decision/application status, duplicate application, vote participation, weighting distribution, application latency, consequence visibility, effect frequency/stacking, AI recovery, progress/outcomes, provider/moderation/audit health, reversals, abuse, fairness complaints, and mobile HUD comprehension.

Tests cover every effect’s validation, impossible placements, immediate-death prevention, cooldown/conflict/cap/expiry, deterministic vote/tie/replay, duplicate/reconnect/reversal, provider outages, maximum bursts, text sanitation, performance, accessibility, and no-audience full runs.

## Launch Gate

Interaction launches only when duplicate application is zero in recovery/load tests, every authoritative effect remains eligible and replayable, no effect can guarantee a terminal outcome, provider/moderation/audit outages degrade safely, consequences are visibly presented, the AI remains viable under maximum allowed pressure, and no-interaction runs meet the core entertainment target.
