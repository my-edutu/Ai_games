# Chat vs AI — Shared Competitive Audience Mode

## Premise

The autonomous AI pursues the base game’s normal objective while the collective audience periodically chooses bounded complications, environmental changes, trade-offs, or counters. The audience becomes an opponent without receiving unrestricted control or a guaranteed kill.

## Compatibility

A game enables Chat vs AI only when its effect catalogue declares:

- at least three strategically distinct audience choices;
- disclosed outcome bounds;
- safe application windows;
- cooldowns, conflicts, caps, expiry, and reversal;
- no guaranteed terminal result;
- deterministic command representation;
- AI observation/replanning implications;
- audiovisual and HUD treatment;
- moderation/provider-degradation behaviour;
- balance and production evidence.

The mode never adds powers forbidden by the base game.

## Match Structure

A match uses recurring rounds:

1. **Observe:** audience sees AI intent, progress, danger, and upcoming choice category.
2. **Nominate:** the mode selects an eligible choice set from the game catalogue.
3. **Vote:** a bounded authoritative window accepts fixed options.
4. **Resolve:** tally uses documented identity/weight/tie rules.
5. **Telegraph:** winning complication is announced before application when gameplay permits.
6. **Apply:** one scheduled command enters the simulation at a safe tick.
7. **Adapt:** AI receives normal game observation and replans within its budgets.
8. **Consequence:** stream highlights the visible result before another major vote.
9. **Cooldown:** quiet/progress period prevents continuous disruption.

A match may use team score such as `Chat Pressure`, successful disruptions, AI recoveries, rounds survived, or objective delay. This score is descriptive and cannot substitute for the base game’s authoritative result.

## Choice Design

Strong choice sets contain trade-offs rather than one obvious strongest effect. Categories include:

- route/environment: close one path, open a risky shortcut, change terrain;
- timing: accelerate hazard cycle, shorten calm period, bring next wave earlier;
- resource: remove a bounded resource, convert resource type, offer cursed reward;
- information: add fog, reveal a future hazard to both sides, hide a noncritical HUD aid;
- opponent: spawn an eligible enemy/hazard package within budget;
- rules: temporary declared modifier with cap and expiry;
- AI counterplay: choose the kind of challenge, not the exact terminal outcome;
- cosmetic/theme: safe low-impact round when authoritative effects are unavailable.

Prohibited choices include instant death, guaranteed winner selection, permanent input lock, hidden odds change, unsafe flash/audio spam, policy bypass, or impossible generated content.

## Voting

- options are pre-authored and localized;
- window uses authoritative start/end context;
- one-person/entitlement weighting is declared by channel policy;
- paid weighting remains capped and cannot guarantee result alone where policy requires;
- ties use a fixed rule or named random stream;
- late/retried events follow idempotent window rules;
- vote status is public without exposing private identities;
- bot/brigade and provider-outage policies are explicit;
- tally and chosen command remain replayable.

## Difficulty and Fairness

The mode owns a `pressure budget` based on run progression, recent complications, AI recovery state, content difficulty, and game-specific caps. It uses hysteresis and cooldowns. Multiple audience effects cannot stack beyond authored limits.

The AI receives no secret protection. Comeback or recovery mechanics are base-game rules visible to the mode policy. Records identify whether Chat vs AI was active and its configuration, preventing misleading comparison with standard mode.

## Gifts and Memberships

Eligible entitlements may provide bounded vote weight, nomination tokens, cosmetic acknowledgement, or access to a declared choice class. They do not directly fire arbitrary commands or guarantee the selected option/outcome. Every event follows authentication, moderation, idempotency, eligibility, cap, expiry, reversal, audit, and acknowledgement policy.

## HUD and Broadcast

Persistent elements:

- `HUMANS vs AI` identity;
- base game progress/record;
- current pressure/cooldown;
- AI intent and adaptation state;
- next vote timer.

Vote card shows option icons, plain effect bounds, countdown, tally presentation appropriate to policy, result, scheduled/applying/applied state, and consequence highlight. Critical base-game danger/result remains higher priority than audience acknowledgement.

## AI Behaviour

The base agent receives the changed world through normal observation. The mode cannot inject hidden instructions or model prompts. Public summaries may show “Chat closed the safe route—replanning” from validated events. Fallback remains capable when remote models are unavailable.

## Degradation

- audience provider unavailable: mode enters `AI SURVIVAL — CHAT RECONNECTING`, no new authoritative votes, base game continues;
- one provider unavailable in multi-provider channel: policy determines whether remaining provider continues or window pauses/expires;
- moderation unavailable: fixed options may continue if policy allows; public names/text disabled;
- audit/entitlement unavailable: paid-eligible events reject/defer; free fixed votes may continue if safe;
- no eligible authoritative choices: offer cosmetic/theme/information round or extend cooldown;
- overload: aggregate fixed votes, shed reactions, preserve bounded queues and authoritative tick.

## Metrics

- vote participation and eligible identity counts;
- choice distribution and dominance;
- accepted/late/duplicate/rejected events;
- vote-to-application and consequence-visibility latency;
- pressure budget and effect stacking;
- AI replanning/fallback/recovery;
- progress, run duration, terminal reason, and records versus standard mode;
- dramatic patterns and repeated choice sets;
- provider/moderation/entitlement degradation;
- fairness complaints, reversals, accessibility and performance guardrails.

## Tests

- every game effect’s eligibility/cap/conflict/expiry;
- deterministic tally/tie/application/replay;
- no option can force prohibited terminal outcomes;
- burst/duplicate/reconnect/late vote handling;
- paid weighting cap and reversal;
- AI adaptation and full-run fallback without models;
- no-audience/provider/moderation/audit outage;
- HUD mobile comprehension and consequence visibility;
- sensory/CPU/queue budgets during peak rounds;
- balance campaigns across zero, typical, and maximum allowed pressure;
- records/mode configuration remain distinct.

## Acceptance

Chat vs AI is enabled for a game only after seeded campaigns show varied, visible, recoverable complications within target distributions; interactions remain deterministic and auditable; the AI can continue without providers/models; the HUD explains choices and consequences; paid participation cannot guarantee outcomes; and provider failure returns cleanly to autonomous play.
