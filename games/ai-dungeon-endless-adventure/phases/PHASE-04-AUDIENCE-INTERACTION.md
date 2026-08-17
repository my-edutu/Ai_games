# Phase 4 — Audience Interaction and Chat vs AI

## Exit gate

Audience input is provider-neutral, sanitized before game ownership, idempotent, bounded, audited and optional. Paid and free interactions share the same legality and moderation boundary; no interaction can guarantee victory, death, a record or terminal outcome.

## Implemented interaction catalogue

- Shield: +3 temporary shield, hard-capped by Astra's normal shield ceiling.
- Theme: presentation theme only; reversible by an authorized operator.
- Reveal: time-bounded reveal of already-known mapped cells, never hidden enemy truth.
- Route choice: applies only on the next floor and has three mechanically distinct disclosed outcomes: Warded adds four bounded shield, Riches raises the next chest from 7 to 12 gold, Trial adds one separately identified Bone Warden challenger.
- Elite/challenge: bounded difficulty pressure; never lethal by construction and never bypasses population/resource ceilings.
- Relic vote: fixed authored options, one ballot per opaque actor token, paid/member weight capped at 3, deterministic tie-break, zero-ballot fallback to Astra's autonomous choice.

## Review corrections

The audience review rejected an earlier route implementation because route choice existed in UI state without a dependable next-floor gameplay consequence. Route effects are now installed by the authoritative floor-start transition itself. The same review requires processed-ID retention beyond the visible ledger, operator-only reversal, no reversal of non-reversible combat effects, bounded queues, emergency disable and public identity minimization.

## Readiness

R4 interaction software gate requires the focused Phase 4 suite, full catalogue regression, replay equality and browser disclosure checks to pass with zero open P0/P1 findings. Production provider evidence remains a Phase 6/R5 requirement.
