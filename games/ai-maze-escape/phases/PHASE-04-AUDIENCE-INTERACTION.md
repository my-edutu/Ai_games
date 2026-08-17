# Phase 4 — Audience Influence and Chat vs AI

**Target:** R3 interaction candidate  
**Software status:** Complete

## Delivered

- provider-neutral YouTube/Twitch normalized input and authentication boundaries;
- privacy-safe viewer references, sanitization, moderation, sanctions, entitlement caps, rate limits, queue bounds and idempotency;
- deterministic vote windows and tie-breaking;
- ten bounded Maze influence classes: reveal, hint, door, fog, threat, obstacle/shortcut, resource/clue and next-profile choices;
- prevalidated candidate IDs and solution-preservation checks;
- exactly-once durable scheduling, deterministic expiry and append-only reversal;
- Chat vs AI pressure caps, cooldowns and visible acknowledgements;
- complete no-audience autonomous mode and provider-outage degradation.

## Acceptance evidence

- [x] Every effect preserves a valid solution and declared response opportunity.
- [x] No event relocates the hidden exit, guarantees escape/capture, or buys a record/result.
- [x] Duplicate authoritative application is zero across retry, reconnect, restore and reversal.
- [x] Votes are deterministic, capped, moderated, replayable and visible.
- [x] Provider/moderation/entitlement/audit outages fail closed for paid-eligible effects.
- [x] Rejected commands never enter durable replay evidence.
- [x] Maximum bounded pressure remains within AI, fairness, sensory and performance limits.
- [x] The game remains complete with interactions disabled.

R3 software interaction candidate is complete. Credentialed production-provider evidence remains an R5 external gate.
