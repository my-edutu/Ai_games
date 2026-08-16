'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { AudienceGateway } = require('../../dist/packages/audience-gateway/src/gateway.js');

const NOW = Date.parse('2026-08-16T13:00:00Z');

function input(overrides = {}) {
  const serial = overrides.serial || '1';
  return {
    schemaVersion: 1,
    provider: 'fixture',
    providerEventId: `provider-event-${serial}`,
    occurredAtMs: NOW - 100,
    receivedAtMs: NOW,
    channelRef: 'channel-reference',
    viewerRef: 'aud_aaaaaaaaaaaaaaaaaaaaaaaa',
    displayName: '  Alice\u0000 <b>Hero</b>  ',
    kind: 'vote',
    fixedToken: 'A',
    entitlementBand: 'none',
    entitlementWeight: 1,
    rawDigest: 'b'.repeat(64),
    reversalOf: null,
    idempotencyKey: `aud_${String(serial).padStart(32, '0')}`,
    ...overrides,
  };
}

function context(overrides = {}) {
  return {
    nowMs: NOW,
    moderationAvailable: true,
    auditAvailable: true,
    entitlementVerified: true,
    publicNamesEnabled: true,
    sanctionedViewerRefs: new Set(),
    ...overrides,
  };
}

function gateway(overrides = {}) {
  return new AudienceGateway({
    allowedTokens: ['A', 'B', 'C'],
    queueCapacity: 4,
    decisionCapacity: 12,
    retentionMs: 60_000,
    inputMaxAgeMs: 10_000,
    futureSkewMs: 2_000,
    rateWindowMs: 1_000,
    viewerLimit: 2,
    channelLimit: 4,
    globalLimit: 5,
    ...overrides,
  });
}

test('accepted input is queued once and duplicate retry returns the original decision', () => {
  const service = gateway();
  const audienceInput = input();
  const first = service.process(audienceInput, context());
  const duplicate = service.process(audienceInput, context({ nowMs: NOW + 500 }));

  assert.equal(first.status, 'accepted');
  assert.equal(first.reason, 'accepted');
  assert.equal(first.publicDisplayName, 'Alice Hero');
  assert.deepEqual(duplicate, first);
  assert.equal(service.snapshot().queueLength, 1);
  assert.deepEqual(service.drainAccepted(10).map(item => item.idempotencyKey), [audienceInput.idempotencyKey]);
  assert.equal(service.snapshot().queueLength, 0);
});

test('provider event replay with a different derived key still returns the original decision', () => {
  const service = gateway();
  const firstInput = input({ serial: 'provider-replay' });
  const first = service.process(firstInput, context());
  const forgedRetry = { ...firstInput, idempotencyKey: `aud_${'f'.repeat(32)}` };
  const duplicate = service.process(forgedRetry, context());

  assert.deepEqual(duplicate, first);
  assert.equal(service.snapshot().queueLength, 1);
});

test('vote tokens are fixed and arbitrary or missing commands are rejected', () => {
  const service = gateway();
  for (const [serial, token] of [['bad-1', null], ['bad-2', 'DROP TABLE'], ['bad-3', 'D']]) {
    const decision = service.process(input({ serial, fixedToken: token }), context());
    assert.equal(decision.status, 'rejected');
    assert.equal(decision.reason, 'invalid-token');
  }
  assert.equal(service.snapshot().queueLength, 0);
});

test('late and implausibly future inputs are rejected before rate or queue state changes', () => {
  const service = gateway();
  const late = service.process(input({ serial: 'late', receivedAtMs: NOW - 20_000 }), context());
  const future = service.process(input({ serial: 'future', receivedAtMs: NOW + 5_000 }), context());
  assert.equal(late.reason, 'late');
  assert.equal(future.reason, 'late');
  assert.equal(service.snapshot().queueLength, 0);
  assert.equal(service.snapshot().rateEntries, 0);
});

test('sanctions reject every entitlement band and do not expose a public name', () => {
  const service = gateway();
  const viewerRef = 'aud_bbbbbbbbbbbbbbbbbbbbbbbb';
  const decision = service.process(
    input({ serial: 'sanction', viewerRef, kind: 'support', entitlementBand: 'premium', entitlementWeight: 3 }),
    context({ sanctionedViewerRefs: new Set([viewerRef]) }),
  );
  assert.equal(decision.status, 'rejected');
  assert.equal(decision.reason, 'sanctioned');
  assert.equal(decision.publicDisplayName, null);
});

test('moderation outage permits anonymous-display free fixed votes but paid-eligible input fails closed', () => {
  const service = gateway();
  const free = service.process(input({ serial: 'mod-free' }), context({ moderationAvailable: false }));
  const paid = service.process(
    input({
      serial: 'mod-paid',
      kind: 'support',
      entitlementBand: 'premium',
      entitlementWeight: 3,
      fixedToken: 'B',
    }),
    context({ moderationAvailable: false }),
  );

  assert.equal(free.status, 'accepted');
  assert.equal(free.publicDisplayName, null);
  assert.equal(paid.status, 'rejected');
  assert.equal(paid.reason, 'moderation-unavailable');
});

test('audit and entitlement uncertainty fail closed for paid-eligible input but not free votes', () => {
  const auditGateway = gateway();
  const auditFree = auditGateway.process(input({ serial: 'audit-free' }), context({ auditAvailable: false }));
  const auditPaid = auditGateway.process(
    input({ serial: 'audit-paid', kind: 'gift', entitlementBand: 'gift', entitlementWeight: 3, fixedToken: null }),
    context({ auditAvailable: false }),
  );
  assert.equal(auditFree.status, 'accepted');
  assert.equal(auditPaid.reason, 'audit-unavailable');

  const entitlementGateway = gateway();
  const unverified = entitlementGateway.process(
    input({ serial: 'entitlement', kind: 'membership', entitlementBand: 'premium', entitlementWeight: 2, fixedToken: null }),
    context({ entitlementVerified: false }),
  );
  assert.equal(unverified.status, 'rejected');
  assert.equal(unverified.reason, 'entitlement-unverified');
});

test('viewer, channel and global fixed-window rate limits are deterministic and reset by window', () => {
  const viewerService = gateway({ viewerLimit: 2, channelLimit: 10, globalLimit: 10, queueCapacity: 10 });
  assert.equal(viewerService.process(input({ serial: 'v1' }), context()).status, 'accepted');
  assert.equal(viewerService.process(input({ serial: 'v2' }), context({ nowMs: NOW + 1 })).status, 'accepted');
  assert.equal(viewerService.process(input({ serial: 'v3' }), context({ nowMs: NOW + 2 })).reason, 'rate-limited');
  assert.equal(viewerService.process(input({ serial: 'v4', receivedAtMs: NOW + 1001 }), context({ nowMs: NOW + 1001 })).status, 'accepted');

  const channelService = gateway({ viewerLimit: 10, channelLimit: 2, globalLimit: 10, queueCapacity: 10 });
  assert.equal(channelService.process(input({ serial: 'c1', viewerRef: 'aud_111111111111111111111111' }), context()).status, 'accepted');
  assert.equal(channelService.process(input({ serial: 'c2', viewerRef: 'aud_222222222222222222222222' }), context()).status, 'accepted');
  assert.equal(channelService.process(input({ serial: 'c3', viewerRef: 'aud_333333333333333333333333' }), context()).reason, 'rate-limited');

  const globalService = gateway({ viewerLimit: 10, channelLimit: 10, globalLimit: 2, queueCapacity: 10 });
  assert.equal(globalService.process(input({ serial: 'g1', channelRef: 'channel-1' }), context()).status, 'accepted');
  assert.equal(globalService.process(input({ serial: 'g2', channelRef: 'channel-2' }), context()).status, 'accepted');
  assert.equal(globalService.process(input({ serial: 'g3', channelRef: 'channel-3' }), context()).reason, 'rate-limited');
});

test('queue capacity rejects new work, while duplicates still return the original decision', () => {
  const service = gateway({ queueCapacity: 2, viewerLimit: 10, channelLimit: 10, globalLimit: 10 });
  const firstInput = input({ serial: 'q1' });
  const first = service.process(firstInput, context());
  assert.equal(service.process(input({ serial: 'q2' }), context()).status, 'accepted');
  assert.equal(service.process(input({ serial: 'q3' }), context()).reason, 'queue-full');
  assert.deepEqual(service.process(firstInput, context()), first);
  assert.equal(service.drainAccepted(1).length, 1);
  assert.equal(service.process(input({ serial: 'q4' }), context()).status, 'accepted');
});

test('entitlement weight is capped at three in the accepted immutable input', () => {
  const service = gateway();
  const malicious = input({
    serial: 'weight',
    kind: 'support',
    entitlementBand: 'premium',
    entitlementWeight: 99,
    fixedToken: 'C',
  });
  const decision = service.process(malicious, context());
  assert.equal(decision.status, 'accepted');
  assert.equal(decision.audienceInput.entitlementWeight, 3);
  assert.notEqual(decision.audienceInput, malicious);
  assert.equal(Object.isFrozen(decision.audienceInput), true);
});

test('reversal appends one idempotent reversal decision without erasing the original', () => {
  const service = gateway({ queueCapacity: 6 });
  const originalInput = input({
    serial: 'paid-original',
    kind: 'support',
    entitlementBand: 'premium',
    entitlementWeight: 3,
    fixedToken: 'B',
  });
  const original = service.process(originalInput, context());
  const reversalInput = input({
    serial: 'reversal',
    kind: 'reversal',
    fixedToken: null,
    entitlementBand: 'none',
    entitlementWeight: 1,
    reversalOf: originalInput.idempotencyKey,
  });
  const reversal = service.reverse(reversalInput, context());
  const retry = service.reverse(reversalInput, context({ nowMs: NOW + 10 }));

  assert.equal(original.status, 'accepted');
  assert.equal(reversal.status, 'reversed');
  assert.equal(reversal.reason, 'reversal-recorded');
  assert.deepEqual(retry, reversal);
  assert.deepEqual(service.decisionFor(originalInput.idempotencyKey), original);
  assert.equal(service.snapshot().queueLength, 2);
  assert.equal(service.snapshot().reversalCount, 1);

  const unknown = service.reverse(
    input({ serial: 'reversal-unknown', kind: 'reversal', fixedToken: null, reversalOf: `aud_${'9'.repeat(32)}` }),
    context(),
  );
  assert.equal(unknown.status, 'rejected');
  assert.equal(unknown.reason, 'unknown-reversal');
});

test('gateway snapshot is bounded, privacy-safe and deterministic across equivalent services', () => {
  const options = { decisionCapacity: 3, queueCapacity: 3, viewerLimit: 10, channelLimit: 10, globalLimit: 10 };
  const left = gateway(options);
  const right = gateway(options);
  const source = input({
    serial: 'privacy-source',
    providerEventId: 'extremely-secret-provider-event-47',
    viewerRef: 'aud_c4d3b2a19087654321fedcba',
    displayName: 'Private Alice',
  });
  assert.deepEqual(left.process(source, context()), right.process(source, context()));
  for (let index = 0; index < 6; index++) {
    const next = input({ serial: `bound-${index}`, viewerRef: `aud_${String(index).repeat(24)}` });
    left.process(next, context({ nowMs: NOW + index }));
    right.process(next, context({ nowMs: NOW + index }));
    left.drainAccepted(1);
    right.drainAccepted(1);
  }

  const leftSnapshot = left.snapshot();
  const rightSnapshot = right.snapshot();
  assert.deepEqual(leftSnapshot, rightSnapshot);
  assert.equal(leftSnapshot.recentDecisions.length <= 3, true);
  assert.equal(leftSnapshot.dedupeEntries <= 3, true);
  assert.equal(leftSnapshot.queueLength <= 3, true);
  const serialized = JSON.stringify(leftSnapshot);
  for (const forbidden of ['extremely-secret-provider-event-47', 'Private Alice', 'aud_c4d3b2a19087654321fedcba', 'b'.repeat(64)]) {
    assert.equal(serialized.includes(forbidden), false, `snapshot leaked ${forbidden}`);
  }
});

test('expired decisions and rate buckets are pruned without growing state forever', () => {
  const service = gateway({ retentionMs: 500, rateWindowMs: 200, queueCapacity: 10, viewerLimit: 10, channelLimit: 10, globalLimit: 10 });
  service.process(input({ serial: 'expire-1' }), context());
  service.drainAccepted(10);
  service.process(
    input({ serial: 'expire-2', receivedAtMs: NOW + 1000 }),
    context({ nowMs: NOW + 1000 }),
  );
  const snapshot = service.snapshot();
  assert.equal(snapshot.dedupeEntries, 1);
  assert.equal(snapshot.recentDecisions.length, 1);
  assert.equal(snapshot.rateEntries <= 3, true);
});
