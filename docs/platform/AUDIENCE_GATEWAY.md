# Shared Audience Gateway

## Mission

Convert untrusted YouTube, Twitch, and future-provider callbacks into provider-neutral, privacy-safe, idempotent audience inputs and influence requests. The gateway authenticates and normalizes; it does not decide game outcomes or mutate authoritative state.

## Responsibilities

- provider connection and webhook lifecycle;
- signature/token/channel verification and replay protection;
- provider event deduplication;
- schema, size, encoding, timestamp, and type validation;
- identity tokenization and safe display-name preparation;
- entitlement evidence normalization without exposing raw payment details;
- regional/platform policy routing;
- moderation and rate-limit orchestration;
- conversion to versioned `AudienceInput` and `InfluenceRequest`;
- durable decision/audit correlation;
- acknowledgement delivery state;
- reconnect, backoff, circuit breaker, health, and provider degradation.

## Non-Responsibilities

- game-state eligibility;
- effect power, win/loss, or balance decisions;
- vote result application;
- gameplay scheduling;
- raw chat rendering;
- payment settlement or refunds;
- authoritative event persistence.

Those responsibilities belong to the game, Event Director, moderation/payment systems, presentation, and persistence contracts.

## Adapter Contract

Each adapter declares provider, API/version, connection mode, supported input types, verification method, provider event ID, ordering guarantees, retry semantics, timestamp precision, identity/entitlement fields, rate limits, reconnect behaviour, and test fixtures.

Adapters emit the same normalized envelope and never leak provider SDK types across the gateway boundary.

## Processing Pipeline

1. receive payload over verified endpoint/socket;
2. enforce endpoint and global size/rate limits;
3. verify signature/token/channel and timestamp/replay window;
4. deduplicate provider event ID plus adapter identity;
5. parse against the exact provider schema/version;
6. normalize event type, logical occurrence, channel, privacy-safe viewer reference, display metadata, entitlement evidence, and raw payload digest;
7. apply region/platform/content policy;
8. normalize/sanitize text and invoke moderation where needed;
9. evaluate viewer/effect/channel/global rate and sanction state;
10. persist or reserve idempotency/audit state according to event class;
11. emit normalized input or influence request;
12. track accepted/queued/applied/rejected/expired/reversed acknowledgement lifecycle.

Every rejection has a stable internal reason and safe public/provider response where supported.

## Identity and Privacy

Provider user IDs are transformed into scoped internal references. Cross-provider linking is prohibited unless a documented user feature and lawful basis require it. The game receives no email, billing identifier, raw token, exact payment information, or unnecessary profile data.

Display names are optional, normalized, length-limited, escaped, and separately moderated. Unsafe names may be replaced by generic acknowledgement without discarding an otherwise valid non-text entitlement, according to policy.

## Entitlement Evidence

The gateway produces minimal evidence such as provider, provider event/reference, entitlement type/band, verified state, occurrence time, reversal state, region/policy version, and idempotency key. It does not map exact money to unbounded game power.

Pending/unverified events do not become authoritative influence. Reversal/chargeback/correction creates a new normalized event and audit record; history is not deleted.

## Votes and Chat Commands

The gateway parses only game-declared fixed tokens/options and validated parameters. Arbitrary text cannot become an executable command. It records eligible identity and window context; the vote service/game policy determines counting, tie-break, and scheduled consequence.

Late or reconnected events are processed according to authoritative window rules, not provider display order.

## Idempotency and Ordering

- first dedupe: provider event identity;
- second dedupe: normalized idempotency key;
- authoritative application dedupe: command idempotency key;
- acknowledgement references the original decision on retries;
- provider arrival order is recorded but does not determine authoritative order;
- uncertain duplicate state fails safe for authoritative paid-eligible effects.

## Rate Limits and Overflow

Apply token buckets/windows by endpoint, provider, channel, viewer, event type, effect, and global system. Preserve emergency/operator traffic and critical reversals above low-priority chat.

Overflow policy may reject, sample presentation-only reactions, aggregate votes, or defer eligible effects within expiry. Queues are bounded; overload cannot block simulation.

## Degradation

- provider disconnected: mark unavailable, reconnect with jittered backoff, preserve dedupe state, game continues;
- moderation unavailable: disable arbitrary public text; fixed pre-authored choices continue only if policy allows;
- entitlement unavailable/uncertain: reject/defer paid-eligible authoritative effects;
- audit/persistence unavailable: reject/defer effects requiring durable acknowledgement;
- gateway overload: apply limits and shed low-priority inputs;
- game/director unavailable: queue only within declared bound/expiry, otherwise reject clearly;
- complete outage: stream shows restrained status and autonomous game continues.

## Observability

Measure connection state, verification failures, input delay, payload/schema errors, dedupe, moderation, sanctions, limits, normalized counts, decision status, queue/expiry, reversals, provider API errors, reconnects, acknowledgement latency, and bounded audit lag. Labels use enums, not viewer IDs/text.

## Required Tests

- official/faithful fixtures for each provider event/version;
- forged/expired/replayed signature/token;
- duplicate, reordered, delayed, retried, and reconnect delivery;
- schema/size/encoding/malicious text;
- identity tokenization and output redaction;
- entitlement pending/accepted/rejected/reversed;
- fixed vote tokens and arbitrary-command rejection;
- moderation, sanction, region, and rate limits;
- queue cap/expiry/overflow;
- game/director/audit/moderation/provider outages;
- burst/load and memory/connection soak;
- one authoritative application across the complete retry/recovery path.

## Acceptance

A provider is production-capable when authenticated production-equivalent events normalize correctly, duplicates/reconnects/reversals cannot duplicate gameplay, sensitive fields stay outside game/public state, all queues are bounded, outages degrade safely, and every authoritative influence remains traceable from provider evidence to scheduled command and result.
