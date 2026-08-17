'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { InMemoryDurableStore } = require('../../dist/packages/durable-store/src/index.js');
const { RunLeaseStore } = require('../../dist/packages/operations-core/src/lease.js');
const { checksum } = require('../../dist/packages/replay/src/index.js');
const { AntColonyChannelService } = require('../../dist/services/ant-colony-channel/src/index.js');
const { createAntInfluenceCommand } = require('../../dist/games/ai-ant-colony/src/influence/apply.js');

function options(store, leases, workerId = 'worker-a', extra = {}) {
  return {
    channelId: 'ant-colony-channel',
    workerId,
    seed: 'ant-colony-channel-seed',
    config: {
      width: 32,
      height: 24,
      targetPopulation: 72,
      initialWorkers: 18,
      maxAnts: 144,
      profile: 'forest',
      predatorSpawnInterval: 1000,
      noProgressTicks: 20000,
    },
    store,
    leases,
    leaseTtlMs: 1000,
    snapshotEveryCommands: 5,
    compatibility: {
      gameVersion: 'ant-0.5.0',
      deterministicVersion: 'ant-colony-v1',
      configHash: 'ant-config-001',
      contentHash: 'ant-content-001',
    },
    ...extra,
  };
}

test('ant channel persists commands, snapshots and reconstructs exact authority', () => {
  const store = new InMemoryDurableStore({ snapshotCapacity: 4 });
  const leases = new RunLeaseStore();
  const service = new AntColonyChannelService(options(store, leases));
  service.start(0);
  for (let i = 1; i <= 15; i++) service.tick(`tick-${i}`, i * 10);
  const expected = service.status();
  assert.ok(store.events('ant-colony-channel').some(event => event.type === 'runtime-command'));
  assert.ok(store.snapshots('ant-colony-channel').length >= 3);

  leases.fence('ant-colony-channel', 'replacement');
  const replacement = new AntColonyChannelService(options(store, leases, 'worker-b'));
  const status = replacement.start(5000);
  assert.equal(status.commandSeq, 15);
  assert.equal(status.lastChecksum, expected.lastChecksum);
  assert.equal(status.tick, expected.tick);

  const before = checksum(replacement.runtime.state);
  const duplicate = replacement.tick('tick-15', 5010);
  assert.equal(duplicate.status, 'duplicate');
  assert.equal(checksum(replacement.runtime.state), before);
});

test('post-snapshot commands replay exactly and corrupt newest snapshot falls back', () => {
  const store = new InMemoryDurableStore({ snapshotCapacity: 5 });
  const leases = new RunLeaseStore();
  const service = new AntColonyChannelService(options(store, leases, 'worker-a', { snapshotEveryCommands: 100 }));
  service.start(0);
  for (let i = 1; i <= 4; i++) service.tick(`pre-${i}`, i * 10);
  const older = service.captureSnapshot(100);
  for (let i = 5; i <= 10; i++) service.tick(`post-${i}`, i * 10 + 100);
  const expected = service.status().lastChecksum;
  const newer = service.captureSnapshot(400);
  const corrupt = structuredClone(newer);
  corrupt.envelope.payload.tick += 1;
  store.putSnapshot(corrupt);
  assert.notEqual(older.id, newer.id);

  leases.fence('ant-colony-channel', 'replacement');
  const replacement = new AntColonyChannelService(options(store, leases, 'worker-b', { snapshotEveryCommands: 100 }));
  const status = replacement.start(5000);
  assert.equal(status.lastChecksum, expected);
  assert.equal(status.commandSeq, 10);
  assert.ok(store.audits().some(entry => entry.action === 'startup-recovery'));
});

test('lease conflicts, stale writers and replay divergence fail closed', () => {
  const store = new InMemoryDurableStore();
  const leases = new RunLeaseStore();
  const first = new AntColonyChannelService(options(store, leases, 'worker-a'));
  first.start(0);
  first.tick('one', 10);
  first.captureSnapshot(20);

  const conflict = new AntColonyChannelService(options(store, leases, 'worker-b'));
  assert.throws(() => conflict.start(30), error => error.code === 'LEASE_CONFLICT');

  leases.fence('ant-colony-channel', 'manual');
  const replacement = new AntColonyChannelService(options(store, leases, 'worker-b'));
  replacement.start(2000);
  assert.throws(() => first.tick('old-writer', 2010), error => error.code === 'LEASE_FENCED');

  const result = replacement.recover({ nowMs: 3000, newOwnerId: 'worker-c', expectedChecksum: 'ffffffff' });
  assert.equal(result.status, 'quarantined');
  assert.equal(result.reason, 'replay-divergence');
  assert.ok(store.audits().some(entry => entry.action === 'quarantine'));
});

test('audience influence is durably reserved and applies exactly once', () => {
  const store = new InMemoryDurableStore();
  const leases = new RunLeaseStore();
  const service = new AntColonyChannelService(options(store, leases));
  service.start(0);
  for (let i = 1; i <= 6; i++) service.tick(`warm-${i}`, i * 10);

  const command = createAntInfluenceCommand({
    id: 'effect-1',
    effectId: 'gentle-rain',
    scheduledTick: service.runtime.state.tick + 1,
    expiresTick: service.runtime.state.tick + 20,
    magnitude: 1,
    source: 'vote',
  });
  assert.equal(service.enqueueInfluence('reserve-effect', command, 100).status, 'applied');
  assert.equal(service.enqueueInfluence('reserve-effect', command, 101).status, 'duplicate');
  service.tick('advance-effect', 110);
  service.tick('apply-effect', 120);

  assert.equal(service.runtime.state.influence.appliedIds.filter(id => id === 'effect-1').length, 1);
  assert.equal(
    service.runtime.state.influence.records.filter(record => record.id === 'effect-1' && record.status === 'applied').length,
    1,
  );
});

test('durable command history preserves idempotency after the memory dedupe window evicts an entry', () => {
  const store = new InMemoryDurableStore();
  const leases = new RunLeaseStore();
  const service = new AntColonyChannelService(options(store, leases, 'worker-a', {
    commandDedupeCapacity: 2,
    snapshotEveryCommands: 100,
  }));
  service.start(0);
  service.tick('old-command', 10);
  service.tick('new-command-1', 20);
  service.tick('new-command-2', 30);
  assert.equal(service.status().commandDedupeEntries, 2);

  const before = checksum(service.runtime.state);
  const duplicate = service.tick('old-command', 40);
  assert.equal(duplicate.status, 'duplicate');
  assert.equal(checksum(service.runtime.state), before);
  assert.equal(service.status().commandSeq, 3);
});

test('optional outages preserve autonomous play while persistence fails closed and protects output', () => {
  const store = new InMemoryDurableStore();
  const leases = new RunLeaseStore();
  const service = new AntColonyChannelService(options(store, leases));
  service.start(0);
  service.setDependencyHealth({ gateway: false, moderation: false });
  assert.equal(service.status().interactionsEnabled, false);
  assert.equal(service.status().simulationEnabled, true);

  const beforeTick = service.runtime.state.tick;
  service.tick('autonomous-continuity', 10);
  assert.ok(service.runtime.state.tick > beforeTick);

  service.setDependencyHealth({ persistence: false });
  assert.equal(service.status().simulationEnabled, false);
  assert.equal(service.status().publicOutputProtected, true);
  const before = checksum(service.runtime.state);
  assert.throws(() => service.tick('blocked', 20), error => error.code === 'PERSISTENCE_UNAVAILABLE');
  assert.throws(() => service.captureSnapshot(21), error => error.code === 'PERSISTENCE_UNAVAILABLE');
  assert.equal(checksum(service.runtime.state), before);
});

test('dedupe, snapshots and operator audit remain bounded and role gated', () => {
  const store = new InMemoryDurableStore({ snapshotCapacity: 2, auditCapacity: 4 });
  const leases = new RunLeaseStore();
  const service = new AntColonyChannelService(options(store, leases, 'worker-a', {
    commandDedupeCapacity: 3,
    snapshotEveryCommands: 1,
  }));
  service.start(0);
  for (let i = 1; i <= 10; i++) service.tick(`bounded-${i}`, i * 10);
  assert.ok(service.status().commandDedupeEntries <= 3);
  assert.ok(store.snapshots('ant-colony-channel').length <= 2);

  const denied = service.executeControl({
    id: 'control-1', actor: 'viewer', role: 'viewer', environment: 'production',
    action: 'emergency-halt', reason: 'test',
  }, 200);
  assert.equal(denied.status, 'denied');

  const accepted = service.executeControl({
    id: 'control-2', actor: 'admin', role: 'admin', environment: 'production',
    action: 'emergency-halt', reason: 'test',
  }, 210);
  assert.equal(accepted.status, 'accepted');
  assert.equal(service.status().simulationEnabled, false);
  assert.equal(service.status().publicOutputProtected, true);
  assert.ok(store.audits().length <= 4);
  assert.equal(service.executeControl({
    id: 'control-2', actor: 'admin', role: 'admin', environment: 'production',
    action: 'emergency-halt', reason: 'retry',
  }, 220).status, 'duplicate');
});
