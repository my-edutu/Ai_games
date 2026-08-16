# Command and Event Contracts

## Purpose

Define the versioned envelopes used by simulations, audience integrations, operators, persistence, replay, presentation, audio, analytics, and recovery. Commands request change; events record facts. External callbacks never mutate game state directly.

## Shared Identifiers

All identifiers are opaque strings with stable prefixes:

- `run_`: one autonomous run;
- `evt_`: persisted event;
- `cmd_`: command;
- `req_`: audience influence request;
- `usr_`: privacy-safe internal viewer identity;
- `ent_`: simulation entity;
- `snap_`: snapshot;
- `corr_`: cross-system correlation;
- `idem_`: idempotency key.

Display names are not identifiers. Provider user IDs remain encrypted or tokenized outside render and gameplay state.

## Command Envelope

```ts
interface CommandEnvelope<TPayload> {
  commandId: string;
  commandType: string;
  schemaVersion: number;
  runId: string;
  source: 'system' | 'agent' | 'audience' | 'operator' | 'recovery';
  sourceRef?: string;
  receivedAt: string;
  scheduledTick: number;
  idempotencyKey: string;
  correlationId: string;
  authorization: DecisionRecord;
  moderation?: DecisionRecord;
  payload: TPayload;
}
```

Commands are rejected when malformed, unauthorized, duplicated, stale, scheduled outside policy, illegal in the current lifecycle, or incompatible with the game/version. Rejection is atomic and produces a decision event.

## Gameplay Event Envelope

```ts
interface GameplayEvent<TPayload> {
  eventId: string;
  eventType: string;
  schemaVersion: number;
  gameId: string;
  gameVersion: string;
  runId: string;
  tick: number;
  sequence: number;
  correlationId: string;
  actorIds: readonly string[];
  payload: TPayload;
  authoritative: true;
}
```

The pair `(runId, sequence)` is unique and totally orders authoritative events. Timestamps may be added for operations but never determine replay order.

## Audience Input Envelope

Provider adapters normalize payloads to:

```ts
interface AudienceInput {
  provider: 'youtube' | 'twitch' | 'operator-test';
  providerEventId: string;
  providerOccurredAt: string;
  receivedAt: string;
  channelRef: string;
  viewerRef: string;
  displayName?: SanitizedDisplayName;
  inputType: 'chat' | 'vote' | 'reaction' | 'gift' | 'membership' | 'redemption';
  entitlement?: EntitlementEvidence;
  text?: string;
  amountBand?: string;
  currencyRegion?: string;
  rawPayloadDigest: string;
  schemaVersion: number;
}
```

Raw payloads are retained only according to security, dispute, and privacy policy. Game modules never receive raw provider payloads, exact payment data, email addresses, or provider credentials.

## Influence Request

After authentication, normalization, moderation, entitlement, regional policy, rate-limit, and idempotency checks:

```ts
interface InfluenceRequest {
  requestId: string;
  gameId: string;
  runId: string;
  viewerRef: string;
  displayName?: SanitizedDisplayName;
  effectId: string;
  sourceClass: 'free' | 'paid-eligible' | 'operator' | 'scheduled';
  requestedAtTick: number;
  entitlementBand?: string;
  parameters: Readonly<Record<string, JsonValue>>;
  idempotencyKey: string;
  correlationId: string;
}
```

The game returns one of `eligible`, `ineligible`, `defer`, or `presentation-only`. The Event Director then applies cooldown, conflict, pacing, effect-budget, and queue policy.

## Influence Decision Event

Every request produces an auditable decision:

```ts
interface InfluenceDecision {
  requestId: string;
  status: 'accepted' | 'queued' | 'rejected' | 'expired' | 'cancelled' | 'reversed';
  reasonCode: string;
  scheduledTick?: number;
  effectId: string;
  disclosedEffectKey: string;
  acknowledgementKey: string;
  policyVersion: string;
}
```

Reason codes are stable and privacy-safe. Reversal creates a new event; historical events are not deleted.

## Presentation Event

Presentation events are non-authoritative and may be regenerated from authoritative events:

```ts
interface PresentationEvent<TPayload> {
  type: string;
  runId: string;
  sourceTick: number;
  priority: 'critical' | 'high' | 'normal' | 'ambient';
  dedupeKey?: string;
  expiresAfterMs?: number;
  accessibility: {
    captionKey?: string;
    reducedMotionVariant?: string;
    reducedFlashVariant?: string;
  };
  payload: TPayload;
}
```

They may trigger HUD cards, camera changes, VFX, replays, captions, and audio cues but cannot create score, collisions, damage, rewards, deaths, or records.

## Semantic Audio Event

```ts
interface AudioCue {
  cueId: string;
  category: 'ui' | 'movement' | 'impact' | 'danger' | 'success' | 'failure' | 'audience' | 'ambience';
  intensity: number;
  sourceEntityId?: string;
  spatial?: { x: number; y: number };
  priority: number;
  cooldownGroup?: string;
  captionKey?: string;
}
```

Audio rendering applies voice limits, ducking, loudness, deduplication, and accessibility policy. Missing assets emit telemetry and fall back safely.

## Operational Event

Operational events use structured fields:

- environment and deployment;
- game, version, run, seed hash, process, and channel;
- severity and stable code;
- correlation and causation IDs;
- privacy classification;
- retryability and operator action;
- bounded diagnostic context.

Secrets, raw tokens, complete chat payloads, exact payment details, and unbounded state dumps are prohibited.

## Schema Evolution

- Every envelope includes a positive integer schema version.
- Additive optional fields may remain within a version only when old readers ignore them safely.
- Renamed, removed, retyped, or semantics-changing fields require a new version.
- Readers support an explicit version range and reject unsupported versions.
- Migrations are pure, fixture-tested, and preserve idempotency and ordering.
- Persisted authoritative events are never rewritten in place.

## Ordering and Idempotency

- Provider order is not trusted.
- Gateway deduplicates by provider event ID and adapter identity.
- Authoritative command order is `(scheduledTick, commandPriority, commandId)` using stable comparison.
- Event order is `(runId, sequence)`.
- Retried persistence uses event ID and sequence uniqueness.
- A duplicate command returns the original decision rather than applying twice.

## Security and Moderation

- Verify webhook signatures and authenticated sockets before normalization.
- Escape, filter, length-limit, and script-normalize display text.
- Separate moderation outcome from entitlement outcome.
- Apply per-viewer, per-effect, per-run, channel, and global limits.
- Record policy version and reason code for every denial.
- Do not expose internal viewer IDs or moderation evidence on stream.

## Contract Acceptance

The contracts are implementation-ready when contract tests prove:

- identical valid commands produce one effect despite retries;
- invalid or stale commands cannot partially mutate state;
- replay order is independent of wall-clock arrival order;
- paid and free events pass through the same game eligibility and safety layer;
- provider-specific fields do not leak into game modules;
- presentation/audio events cannot enter authoritative reducers;
- every accepted, rejected, expired, and reversed influence remains auditable;
- supported migrations preserve ordering, decisions, and replay checksums.
