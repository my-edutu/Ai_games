import type {
  AdapterContext,
  AudienceInput,
  AudienceInputKind,
  EntitlementBand,
} from '../../../audience-contracts/src/index';
import { AudienceAdapterError } from '../errors';
import {
  makeIdempotencyKey,
  normalizeFixedToken,
  sanitizeDisplayName,
  sha256Hex,
  tokenizeViewer,
} from '../identity';

const MAX_SERIALIZED_MESSAGE_BYTES = 250 * 1024;

function assertContext(context: AdapterContext): void {
  if (!context?.authenticatedClient) {
    throw new AudienceAdapterError('UNAUTHENTICATED_CLIENT', 'YouTube messages require an authenticated API client boundary');
  }
  if (context.authorizationMode === 'service-account') {
    throw new AudienceAdapterError('UNSUPPORTED_AUTH', 'YouTube Live does not support service-account authorization');
  }
  if (context.authorizationMode !== 'oauth-user' && context.authorizationMode !== 'fixture') {
    throw new AudienceAdapterError('UNSUPPORTED_AUTH', 'YouTube authorization mode is unsupported');
  }
  if (!context.channelRef || !context.identitySecret || !Number.isFinite(context.receivedAtMs)) {
    throw new AudienceAdapterError('INVALID_CONTEXT', 'YouTube adapter context is incomplete');
  }
}

interface YouTubeMapping {
  kind: AudienceInputKind;
  text: string | null;
  band: EntitlementBand;
  weight: 1 | 2 | 3;
}

function superPolicy(tier: number): { band: EntitlementBand; weight: 1 | 2 | 3 } {
  if (tier >= 3) return { band: 'premium', weight: 3 };
  if (tier === 2) return { band: 'supporter', weight: 2 };
  return { band: 'supporter', weight: 1 };
}

function mapMessage(type: string, snippet: any): YouTubeMapping {
  switch (type) {
    case 'textMessageEvent':
      return {
        kind: 'vote',
        text: typeof snippet.textMessageDetails?.messageText === 'string'
          ? snippet.textMessageDetails.messageText
          : typeof snippet.displayMessage === 'string'
            ? snippet.displayMessage
            : null,
        band: 'none',
        weight: 1,
      };
    case 'superChatEvent': {
      const policy = superPolicy(Math.max(1, Number(snippet.superChatDetails?.tier || 1)));
      return {
        kind: 'support',
        text: typeof snippet.superChatDetails?.userComment === 'string'
          ? snippet.superChatDetails.userComment
          : typeof snippet.displayMessage === 'string'
            ? snippet.displayMessage
            : null,
        band: policy.band,
        weight: policy.weight,
      };
    }
    case 'superStickerEvent': {
      const policy = superPolicy(Math.max(1, Number(snippet.superStickerDetails?.tier || 1)));
      return { kind: 'support', text: null, band: policy.band, weight: policy.weight };
    }
    case 'newSponsorEvent':
    case 'memberMilestoneChatEvent':
      return {
        kind: 'membership',
        text: type === 'memberMilestoneChatEvent' && typeof snippet.memberMilestoneChatDetails?.userComment === 'string'
          ? snippet.memberMilestoneChatDetails.userComment
          : null,
        band: 'premium',
        weight: 2,
      };
    case 'membershipGiftingEvent':
      return { kind: 'gift', text: null, band: 'gift', weight: 3 };
    case 'giftMembershipReceivedEvent':
      return { kind: 'membership', text: null, band: 'gift', weight: 2 };
    case 'giftEvent':
      return { kind: 'gift', text: null, band: 'gift', weight: 3 };
    default:
      throw new AudienceAdapterError('UNSUPPORTED_EVENT', `unsupported YouTube live chat event: ${type}`);
  }
}

export function normalizeYouTubeMessage(message: unknown, context: AdapterContext): AudienceInput[] {
  assertContext(context);
  if (!message || typeof message !== 'object' || Array.isArray(message)) {
    throw new AudienceAdapterError('MALFORMED_BODY', 'YouTube live chat message must be an object');
  }
  const raw = JSON.stringify(message);
  if (raw.length > MAX_SERIALIZED_MESSAGE_BYTES) {
    throw new AudienceAdapterError('BODY_TOO_LARGE', 'YouTube live chat message exceeds limit');
  }
  const object = message as any;
  const providerEventId = typeof object.id === 'string' ? object.id : '';
  const snippet = object.snippet;
  if (!providerEventId || !snippet || typeof snippet !== 'object') {
    throw new AudienceAdapterError('MALFORMED_BODY', 'YouTube live chat message is missing id or snippet');
  }
  const type = String(snippet.type || '');
  const mapping = mapMessage(type, snippet);
  const occurredAtMs = Date.parse(String(snippet.publishedAt || ''));
  if (!Number.isFinite(occurredAtMs)) {
    throw new AudienceAdapterError('MALFORMED_TIMESTAMP', 'YouTube live chat message has invalid publishedAt');
  }
  const maxAgeMs = Math.max(1, context.maxEventAgeMs || 10 * 60 * 1000);
  if (context.receivedAtMs - occurredAtMs > maxAgeMs) {
    throw new AudienceAdapterError('EXPIRED_EVENT', 'YouTube live chat message exceeded configured age');
  }
  if (occurredAtMs - context.receivedAtMs > 2 * 60 * 1000) {
    throw new AudienceAdapterError('FUTURE_EVENT', 'YouTube live chat message is too far in the future');
  }

  const providerViewerId = String(snippet.authorChannelId || object.authorDetails?.channelId || '');
  const viewerRef = providerViewerId
    ? tokenizeViewer('youtube', context.channelRef, providerViewerId, context.identitySecret)
    : null;
  const displayName = sanitizeDisplayName(object.authorDetails?.displayName);
  const fixedToken = normalizeFixedToken(mapping.text, context.fixedTokens);
  const idempotencyKey = makeIdempotencyKey('youtube', context.channelRef, providerEventId, mapping.kind);

  return [{
    schemaVersion: 1,
    provider: 'youtube',
    providerEventId,
    occurredAtMs,
    receivedAtMs: context.receivedAtMs,
    channelRef: context.channelRef,
    viewerRef,
    displayName,
    kind: mapping.kind,
    fixedToken,
    entitlementBand: mapping.band,
    entitlementWeight: mapping.weight,
    rawDigest: sha256Hex(raw),
    reversalOf: null,
    idempotencyKey,
  }];
}
