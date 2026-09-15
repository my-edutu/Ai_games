# Eko Run Viewer Interaction

**Game:** Eko Run (`eko-street-run`)  
**Purpose:** Define the future provider-neutral, moderated and replay-safe viewer interaction boundary.  
**Status:** `approved design`; viewer interaction is disabled through Phase 8.  
**Owning phase:** Phase 9  
**Related:** `PRD.md`, `GAME_DESIGN.md`, `AI_SYSTEM.md`, `TECHNICAL_ARCHITECTURE.md`.  
**Last material review:** 2026-09-15  
**Version:** `VIEWER-1.0`

## Interaction Goal

Viewers may influence understandable future choices without controlling resolved outcomes. The game must remain complete and entertaining with every audience service disabled.

## Viewer Roles

- **Spectator-voter:** chooses among pre-authored upcoming options.
- **Strategist:** influences route/theme/challenge preference within eligible bounds.
- **Cosmetic supporter:** triggers approved non-authoritative acknowledgement/celebration where policy permits.
- **Historian:** participates in record/theme polls without affecting the active result.

## Eligible v1 Interaction Classes

- vote between two or three upcoming authored route modifiers;
- choose weather/aesthetic treatment when the choice does not hide critical cues;
- choose an eligible upcoming challenge class with disclosed bounds;
- choose next-run outfit/theme;
- trigger approved cosmetic celebration that cannot cover danger/result information;
- bounded voting weight associated with an entitlement only where platform policy permits.

## Powers Viewers Never Receive

- direct position/velocity/collision mutation;
- force death or invulnerability;
- guarantee survival, win, record or prize;
- arbitrary executable chat commands;
- secret probability changes;
- cooldown/moderation bypass for higher payment;
- raw control of a named real person or protected-group target.

## Provider-Neutral Input Boundary

Provider adapters are external to the game module. They authenticate where applicable, deduplicate provider IDs, minimize/tokenize identity, sanitize metadata and emit a shared normalized envelope. Raw payment details, emails, access tokens and provider SDK objects never enter `games/eko-street-run` authoritative state.

## Eligibility Pipeline

1. provider authentication/replay protection;
2. payload/schema/size validation;
3. privacy-safe identity/entitlement mapping;
4. regional/platform policy;
5. moderation;
6. per-user/effect/channel/global rate limits;
7. idempotency check;
8. game-state eligibility;
9. director cooldown/conflict/pacing eligibility;
10. authoritative scheduling and durable acknowledgement.

Every rejection uses a stable reason code and safe copy key.

## Vote Contract

Votes use an authoritative logical window represented by scheduled start/end ticks. The contract defines eligible options, weight policy, one-vote/dedupe rules, tie-break, late/reconnect handling, result event and application tick. Tie-breaks use a documented fixed rule or the versioned `audience` random stream.

## Paid-Eligible Influence

Payment or membership can only establish entitlement to a bounded eligible effect, vote weight, queue position or cosmetic acknowledgement. It never becomes an authoritative command by itself. Reversal/refund/chargeback policy preserves audit history and cannot silently rewrite past authoritative events.

## Moderation and Public Text

Pre-authored options are the default. Raw chat/donation text does not enter authority or overlays. If a later feature displays a sanitized name, its independent moderation/public-display eligibility is separate from effect entitlement; unsafe text can be omitted while an otherwise valid effect follows policy.

## Acknowledgement States

`received → validating → accepted → queued → applied` or a terminal `rejected | expired | cancelled | reversed` state. Public acknowledgement is lower priority than danger/result truth and never reveals internal identifiers/payment details.

## Degradation

Provider, entitlement or moderation service outage disables affected interactions or restricts the surface to safe fixed choices according to policy. AI Street Run continues. No provider outage invalidates an otherwise truthful game run.

## Required Tests in Phase 9

Duplicate delivery, reorder, reconnect, stale event, burst traffic, many simultaneous entitlements, conflicting effects, queue overflow, moderation outage, entitlement outage, persistence lag, reversal, malicious text and full provider outage. Identical normalized events must apply authoritative effects at most once.
