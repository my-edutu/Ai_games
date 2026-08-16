# Autonomous Snake Phase 4 — R3 Interaction Review

## Scope reviewed
Provider normalization and authentication boundaries, privacy-safe identity, gateway dedupe/moderation/rate/queue/reversal, deterministic votes, Chat vs AI pressure, ten-effect catalogue, effect candidates, influence reducer, event director and deterministic pressure campaigns.

## Invariants
- Provider SDK/raw event shapes do not enter Snake authority.
- A viewer may vote once per authoritative window; retries are idempotent.
- Vote weighting is capped to 1–3 and ties use the named `audience-tiebreaks` RNG stream.
- All placement choices are prevalidated deterministic candidates.
- Influence commands are bounded, cooldown-limited, expiring, checksummed state.
- Duplicate command application is zero by idempotency key.
- Existing terminal results cannot be rewritten by audience effects.
- Paid-eligible input fails closed when moderation, audit or entitlement certainty is absent.
- Autonomous play remains complete when providers/interactions are absent.

## Review findings fixed
1. Rate-limit pruning created a zero-count global bucket for rejected late inputs; fixed so rejected inputs do not mutate rate state.
2. Vote and Chat-vs-AI logic was introduced behind a pure deterministic reducer with immutable closed windows.
3. Influence authority was added only at the scheduled pre-AI boundary, not in provider callbacks.
4. Effect candidates avoid current snake, objective, obstacle and hazard cells and bound obstacle placement away from the head.

## Remaining boundary
This is an R3 interaction candidate. Real credentialed provider verification, durable production audit/persistence, long-duration operational soak and live canary remain Phase 5/6 evidence, not Phase 4 claims.
