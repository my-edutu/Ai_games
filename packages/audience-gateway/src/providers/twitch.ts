import type {
  AdapterContext,
  AudienceInput,
  AudienceInputKind,
  EntitlementBand,
  TwitchWebhookHeaders,
} from '../../../audience-contracts/src/index';
import { AudienceAdapterError } from '../errors';
import {
  hmacSha256Hex,
  makeIdempotencyKey,
  normalizeFixedToken,
  sanitizeDisplayName,
  sha256Hex,
  tokenizeViewer,
} from '../identity';

const MAX_BODY_BYTES = 250 * 1024;
const MAX_EVENT_AGE_MS = 10 * 60 * 1000;
const MAX_FUTURE_SKEW_MS = 2 * 60 * 1000;

function constantTimeEqual(left: string, right: string): boolean {
  const length = Math.max(left.length, right.length);
  let mismatch = left.length ^ right.length;
  for (let index = 0; index < length; index++) {
    mismatch |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }
  return mismatch === 0;
}

function parseBody(rawBody: string): any {
  if (typeof rawBody !== 'string') throw new AudienceAdapterError('MALFORMED_BODY', 'raw body must be a string');
  if (rawBody.length > MAX_BODY_BYTES) throw new AudienceAdapterError('BODY_TOO_LARGE', 'EventSub body exceeds limit');
  try {
    const parsed = JSON.parse(rawBody);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('object required');
    return parsed;
  } catch {
    throw new AudienceAdapterError('MALFORMED_BODY', 'EventSub body is not valid JSON');
  }
}

function assertContext(context: AdapterContext): void {
  if (
    !context ||
    !context.channelRef ||
    !Number.isFinite(context.receivedAtMs) ||
    !context.identitySecret ||
    !context.fixedTokens
  ) {
    throw new AudienceAdapterError('INVALID_CONTEXT', 'adapter context is incomplete');
  }
}

export function verifyTwitchWebhook(
  rawBody: string,
  headers: TwitchWebhookHeaders,
  secret: string,
  nowMs: number,
): void {
  if (!secret || secret.length < 10) throw new AudienceAdapterError('INVALID_SECRET', 'Twitch secret is invalid');
  if (!headers?.messageId || !headers.messageTimestamp || !headers.messageSignature) {
    throw new AudienceAdapterError('MALFORMED_SIGNATURE', 'required EventSub headers are missing');
  }
  if (!/^sha256=[0-9a-f]{64}$/i.test(headers.messageSignature)) {
    throw new AudienceAdapterError('MALFORMED_SIGNATURE', 'Twitch signature must be sha256 hex');
  }
  const occurredAtMs = Date.parse(headers.messageTimestamp);
  if (!Number.isFinite(occurredAtMs)) throw new AudienceAdapterError('MALFORMED_TIMESTAMP', 'invalid EventSub timestamp');
  const ageMs = nowMs - occurredAtMs;
  if (ageMs > MAX_EVENT_AGE_MS) throw new AudienceAdapterError('EXPIRED_EVENT', 'EventSub message exceeded replay window');
  if (ageMs < -MAX_FUTURE_SKEW_MS) throw new AudienceAdapterError('FUTURE_EVENT', 'EventSub timestamp is too far in the future');
  if (rawBody.length > MAX_BODY_BYTES) throw new AudienceAdapterError('BODY_TOO_LARGE', 'EventSub body exceeds limit');

  const expected = `sha256=${hmacSha256Hex(secret, headers.messageId + headers.messageTimestamp + rawBody)}`;
  if (!constantTimeEqual(expected.toLowerCase(), headers.messageSignature.toLowerCase())) {
    throw new AudienceAdapterError('INVALID_SIGNATURE', 'Twitch EventSub signature did not match');
  }
}

interface TwitchMapping {
  kind: AudienceInputKind;
  viewerId: string | null;
  displayName: string | null;
  text: string | null;
  band: EntitlementBand;
  weight: 1 | 2 | 3;
}

function cheerPolicy(bits: number): { band: EntitlementBand; weight: 1 | 2 | 3 } {
  if (bits >= 1000) return { band: 'premium', weight: 3 };
  if (bits >= 100) return { band: 'supporter', weight: 2 };
  return { band: 'supporter', weight: 1 };
}

function subscriptionPolicy(tier: unknown): { band: EntitlementBand; weight: 1 | 2 | 3 } {
  if (tier === '3000') return { band: 'premium', weight: 3 };
  if (tier === '2000') return { band: 'premium', weight: 2 };
  return { band: 'supporter', weight: 1 };
}

function mapEvent(type: string, event: any): TwitchMapping {
  switch (type) {
    case 'channel.chat.message':
      return {
        kind: 'vote',
        viewerId: String(event.chatter_user_id || '') || null,
        displayName: sanitizeDisplayName(event.chatter_user_name),
        text: typeof event.message?.text === 'string' ? event.message.text : null,
        band: 'none',
        weight: 1,
      };
    case 'channel.cheer':
    case 'channel.bits.use': {
      const policy = cheerPolicy(Math.max(0, Number(event.bits || 0)));
      return {
        kind: 'support',
        viewerId: event.is_anonymous ? null : String(event.user_id || '') || null,
        displayName: event.is_anonymous ? null : sanitizeDisplayName(event.user_name),
        text: typeof event.message === 'string' ? event.message : null,
        band: policy.band,
        weight: policy.weight,
      };
    }
    case 'channel.subscribe':
    case 'channel.subscription.message': {
      const policy = subscriptionPolicy(event.tier);
      return {
        kind: 'membership',
        viewerId: String(event.user_id || '') || null,
        displayName: sanitizeDisplayName(event.user_name),
        text: typeof event.message?.text === 'string' ? event.message.text : null,
        band: policy.band,
        weight: policy.weight,
      };
    }
    case 'channel.subscription.gift':
      return {
        kind: 'gift',
        viewerId: event.is_anonymous ? null : String(event.user_id || '') || null,
        displayName: event.is_anonymous ? null : sanitizeDisplayName(event.user_name),
        text: null,
        band: 'gift',
        weight: 3,
      };
    default:
      throw new AudienceAdapterError('UNSUPPORTED_EVENT', `unsupported Twitch event type: ${type}`);
  }
}

export function normalizeTwitchEvent(
  rawBody: string,
  headers: TwitchWebhookHeaders,
  secret: string,
  context: AdapterContext,
): AudienceInput[] {
  assertContext(context);
  verifyTwitchWebhook(rawBody, headers, secret, context.receivedAtMs);
  if (headers.messageType !== 'notification') {
    throw new AudienceAdapterError('UNSUPPORTED_MESSAGE_TYPE', `unsupported EventSub message type: ${headers.messageType}`);
  }
  const body = parseBody(rawBody);
  const type = String(body.subscription?.type || '');
  const mapping = mapEvent(type, body.event || {});
  const occurredAtMs = Date.parse(headers.messageTimestamp);
  const maxAgeMs = Math.max(1, Math.min(MAX_EVENT_AGE_MS, context.maxEventAgeMs || MAX_EVENT_AGE_MS));
  if (context.receivedAtMs - occurredAtMs > maxAgeMs) {
    throw new AudienceAdapterError('EXPIRED_EVENT', 'normalized Twitch event exceeded configured age');
  }
  const viewerRef = mapping.viewerId
    ? tokenizeViewer('twitch', context.channelRef, mapping.viewerId, context.identitySecret)
    : null;
  const fixedToken = normalizeFixedToken(mapping.text, context.fixedTokens);
  const providerEventId = headers.messageId;
  const idempotencyKey = makeIdempotencyKey('twitch', context.channelRef, providerEventId, mapping.kind);

  return [{
    schemaVersion: 1,
    provider: 'twitch',
    providerEventId,
    occurredAtMs,
    receivedAtMs: context.receivedAtMs,
    channelRef: context.channelRef,
    viewerRef,
    displayName: mapping.displayName,
    kind: mapping.kind,
    fixedToken,
    entitlementBand: mapping.band,
    entitlementWeight: mapping.weight,
    rawDigest: sha256Hex(rawBody),
    reversalOf: null,
    idempotencyKey,
  }];
}
