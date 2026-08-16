'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const {
  AudienceAdapterError,
  sanitizeDisplayName,
  tokenizeViewer,
} = require('../../dist/packages/audience-gateway/src/index.js');
const {
  verifyTwitchWebhook,
  normalizeTwitchEvent,
} = require('../../dist/packages/audience-gateway/src/providers/twitch.js');
const {
  normalizeYouTubeMessage,
} = require('../../dist/packages/audience-gateway/src/providers/youtube.js');

const fixtureRoot = path.resolve(__dirname, '../../fixtures/providers');
const NOW = Date.parse('2026-08-16T12:08:00Z');
const TWITCH_SECRET = 'twitch-fixture-secret-at-least-ten';
const EXPECTED_AUDIENCE_KEYS = [
  'channelRef',
  'displayName',
  'entitlementBand',
  'entitlementWeight',
  'fixedToken',
  'idempotencyKey',
  'kind',
  'occurredAtMs',
  'provider',
  'providerEventId',
  'rawDigest',
  'receivedAtMs',
  'reversalOf',
  'schemaVersion',
  'viewerRef',
];
const SENSITIVE_PROVIDER_KEYS = new Set([
  'amountMicros',
  'amountDisplayString',
  'currency',
  'bits',
  'tier',
  'cumulative_total',
  'giftMembershipsCount',
  'giftValueMicros',
  'authorChannelId',
  'channelId',
  'user_id',
  'chatter_user_id',
  'rawBody',
  'accessToken',
  'refreshToken',
  'email',
]);

function fixture(provider, name) {
  return JSON.parse(fs.readFileSync(path.join(fixtureRoot, provider, name), 'utf8'));
}

function adapterContext(overrides = {}) {
  return {
    channelRef: 'channel-reference',
    receivedAtMs: NOW,
    identitySecret: 'identity-secret-used-only-in-tests-32',
    fixedTokens: { A: 'A', B: 'B', C: 'C' },
    maxEventAgeMs: 10 * 60 * 1000,
    authenticatedClient: true,
    authorizationMode: 'oauth-user',
    ...overrides,
  };
}

function twitchHeaders(rawBody, overrides = {}) {
  const messageId = overrides.messageId || 'twitch-message-1';
  const messageTimestamp = overrides.messageTimestamp || '2026-08-16T12:07:00Z';
  const digest = crypto
    .createHmac('sha256', TWITCH_SECRET)
    .update(messageId + messageTimestamp + rawBody)
    .digest('hex');
  return {
    messageId,
    messageTimestamp,
    messageSignature: `sha256=${digest}`,
    messageType: 'notification',
    ...overrides,
  };
}

function collectKeys(value, keys = new Set()) {
  if (!value || typeof value !== 'object') return keys;
  for (const [key, child] of Object.entries(value)) {
    keys.add(key);
    collectKeys(child, keys);
  }
  return keys;
}

function assertPrivacy(input, highEntropyForbiddenValues) {
  assert.deepEqual(Object.keys(input).sort(), EXPECTED_AUDIENCE_KEYS);
  const keys = collectKeys(input);
  for (const key of SENSITIVE_PROVIDER_KEYS) assert.equal(keys.has(key), false, `leaked provider key ${key}`);

  const serialized = JSON.stringify(input);
  for (const value of highEntropyForbiddenValues) {
    assert.equal(serialized.includes(String(value)), false, `leaked provider value ${value}`);
  }
  assert.match(input.viewerRef || 'anonymous', /^(aud_[0-9a-f]{24}|anonymous)$/);
  assert.match(input.rawDigest, /^[0-9a-f]{64}$/);
  assert.match(input.idempotencyKey, /^aud_[0-9a-f]{32}$/);
  assert.equal(input.entitlementWeight >= 1 && input.entitlementWeight <= 3, true);
}

test('Twitch webhook verification accepts the official HMAC message construction', () => {
  const rawBody = JSON.stringify(fixture('twitch', 'chat-message.json'));
  const headers = twitchHeaders(rawBody);
  assert.doesNotThrow(() => verifyTwitchWebhook(rawBody, headers, TWITCH_SECRET, NOW));
});

test('Twitch verification rejects forged, expired, future and malformed envelopes with typed codes', () => {
  const rawBody = JSON.stringify(fixture('twitch', 'chat-message.json'));
  const valid = twitchHeaders(rawBody);

  assert.throws(
    () => verifyTwitchWebhook(rawBody, { ...valid, messageSignature: `sha256=${'0'.repeat(64)}` }, TWITCH_SECRET, NOW),
    error => error instanceof AudienceAdapterError && error.code === 'INVALID_SIGNATURE',
  );
  assert.throws(
    () => verifyTwitchWebhook(rawBody, twitchHeaders(rawBody, { messageTimestamp: '2026-08-16T11:57:00Z' }), TWITCH_SECRET, NOW),
    error => error instanceof AudienceAdapterError && error.code === 'EXPIRED_EVENT',
  );
  assert.throws(
    () => verifyTwitchWebhook(rawBody, twitchHeaders(rawBody, { messageTimestamp: '2026-08-16T12:10:30Z' }), TWITCH_SECRET, NOW),
    error => error instanceof AudienceAdapterError && error.code === 'FUTURE_EVENT',
  );
  assert.throws(
    () => verifyTwitchWebhook(rawBody, { ...valid, messageSignature: 'sha256=xyz' }, TWITCH_SECRET, NOW),
    error => error instanceof AudienceAdapterError && error.code === 'MALFORMED_SIGNATURE',
  );
  assert.throws(
    () => verifyTwitchWebhook(rawBody, valid, '', NOW),
    error => error instanceof AudienceAdapterError && error.code === 'INVALID_SECRET',
  );
});

test('Twitch chat, cheer, subscription and gift fixtures normalize to provider-neutral bounded inputs', () => {
  const cases = [
    ['chat-message.json', 'vote', 'A', 'none', 1, ['viewer-123', 'chat-provider-message-1']],
    ['cheer.json', 'support', 'B', 'supporter', 2, ['viewer-456']],
    ['subscription.json', 'membership', null, 'premium', 2, ['viewer-789']],
    ['subscription-gift.json', 'gift', null, 'gift', 3, ['viewer-gifter']],
  ];

  for (const [name, kind, token, band, weight, forbidden] of cases) {
    const rawBody = JSON.stringify(fixture('twitch', name));
    const headers = twitchHeaders(rawBody, { messageId: `envelope-${name}` });
    const inputs = normalizeTwitchEvent(rawBody, headers, TWITCH_SECRET, adapterContext());
    assert.equal(inputs.length, 1);
    const input = inputs[0];
    assert.equal(input.provider, 'twitch');
    assert.equal(input.providerEventId, `envelope-${name}`);
    assert.equal(input.kind, kind);
    assert.equal(input.fixedToken, token);
    assert.equal(input.entitlementBand, band);
    assert.equal(input.entitlementWeight, weight);
    assertPrivacy(input, forbidden);
  }
});

test('Twitch normalization sanitizes display names and derives stable scoped viewer references', () => {
  const rawBody = JSON.stringify(fixture('twitch', 'chat-message.json'));
  const first = normalizeTwitchEvent(rawBody, twitchHeaders(rawBody), TWITCH_SECRET, adapterContext())[0];
  const second = normalizeTwitchEvent(rawBody, twitchHeaders(rawBody), TWITCH_SECRET, adapterContext())[0];
  const otherChannel = normalizeTwitchEvent(
    rawBody,
    twitchHeaders(rawBody),
    TWITCH_SECRET,
    adapterContext({ channelRef: 'other-channel' }),
  )[0];

  assert.equal(first.displayName, 'Alice The Great');
  assert.equal(first.viewerRef, second.viewerRef);
  assert.notEqual(first.viewerRef, otherChannel.viewerRef);
  assert.equal(first.viewerRef, tokenizeViewer('twitch', 'channel-reference', 'viewer-123', adapterContext().identitySecret));
});

test('YouTube official live chat message families normalize without payment or channel identity leakage', () => {
  const cases = [
    ['text-message.json', 'vote', 'A', 'none', 1, ['UCviewer-text-1', '<script>']],
    ['super-chat.json', 'support', 'C', 'premium', 3, ['UCviewer-support-1', '$5.00']],
    ['new-sponsor.json', 'membership', null, 'premium', 2, ['UCviewer-member-1', 'Impact Member']],
    ['membership-gifting.json', 'gift', null, 'gift', 3, ['UCviewer-gifter-1']],
    ['gift-membership-received.json', 'membership', null, 'gift', 2, ['UCviewer-recipient-1', 'UCviewer-gifter-1']],
    ['gift-event.json', 'gift', null, 'gift', 3, ['UCviewer-jewel-gift-1', 'gift-rose']],
  ];

  for (const [name, kind, token, band, weight, forbidden] of cases) {
    const input = normalizeYouTubeMessage(fixture('youtube', name), adapterContext())[0];
    assert.equal(input.provider, 'youtube');
    assert.equal(input.kind, kind);
    assert.equal(input.fixedToken, token);
    assert.equal(input.entitlementBand, band);
    assert.equal(input.entitlementWeight, weight);
    assertPrivacy(input, forbidden);
  }
});

test('YouTube adapter requires an authenticated user OAuth boundary and rejects unsupported message types', () => {
  const message = fixture('youtube', 'text-message.json');
  assert.throws(
    () => normalizeYouTubeMessage(message, adapterContext({ authenticatedClient: false })),
    error => error instanceof AudienceAdapterError && error.code === 'UNAUTHENTICATED_CLIENT',
  );
  assert.throws(
    () => normalizeYouTubeMessage(message, adapterContext({ authorizationMode: 'service-account' })),
    error => error instanceof AudienceAdapterError && error.code === 'UNSUPPORTED_AUTH',
  );
  assert.throws(
    () => normalizeYouTubeMessage({ ...message, snippet: { ...message.snippet, type: 'unknownFutureEvent' } }, adapterContext()),
    error => error instanceof AudienceAdapterError && error.code === 'UNSUPPORTED_EVENT',
  );
});

test('fixed tokens are exact, bounded and arbitrary commands never normalize as executable input', () => {
  const message = fixture('youtube', 'text-message.json');
  const safe = normalizeYouTubeMessage(message, adapterContext())[0];
  assert.equal(safe.fixedToken, 'A');

  const arbitrary = {
    ...message,
    id: 'yt-arbitrary-1',
    snippet: {
      ...message.snippet,
      displayMessage: '!spawn-obstacle 4,9; DROP TABLE',
      textMessageDetails: { messageText: '!spawn-obstacle 4,9; DROP TABLE' },
    },
  };
  const normalized = normalizeYouTubeMessage(arbitrary, adapterContext())[0];
  assert.equal(normalized.fixedToken, null);
  assert.equal(normalized.kind, 'vote');
});

test('display-name sanitizer removes tags, controls and unbounded whitespace', () => {
  assert.equal(sanitizeDisplayName('  Alice\u0000  The\n Great  '), 'Alice The Great');
  assert.equal(sanitizeDisplayName('Eve<script>alert(1)</script>'), 'Evealert(1)');
  assert.equal(sanitizeDisplayName('x'.repeat(200)).length, 40);
});
