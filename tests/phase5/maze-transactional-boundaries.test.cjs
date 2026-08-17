'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { InMemoryDurableStore } = require('../../dist/packages/durable-store/src/index.js');
const { RunLeaseStore } = require('../../dist/packages/operations-core/src/lease.js');
const { checksum } = require('../../dist/packages/replay/src/index.js');
const { MazeChannelService } = require('../../dist/services/maze-channel/src/index.js');
const { buildMazeInfluenceCandidates } = require('../../dist/games/ai-maze-escape/src/influence/candidates.js');
const { createMazeInfluenceCommand } = require('../../dist/games/ai-maze-escape/src/influence/apply.js');

function options(store, leases) {
  return {
    channelId: 'maze-review-channel',
    workerId: 'review-worker',
    seed: 'maze-review-seed',
    config: { width: 13, height: 11, profile: 'loops', visibilityRadius: 2, keyCount: 1, trapCount: 2, maxTicks: 20000, noProgressTicks: 5000 },
    store,
    leases,
    leaseTtlMs: 1000,
    snapshotEveryCommands: 10,
    compatibility: { gameVersion: 'maze-0.6.0', deterministicVersion: 'maze-rules-1', configHash: 'review-config', contentHash: 'review-content' },
  };
}

function commandFor(service, id = 'review-effect') {
  const candidate = buildMazeInfluenceCandidates(service.runtime.state)[0];
  assert.ok(candidate);
  return createMazeInfluenceCommand(service.runtime.state, {
    id,
    candidate,
    scheduledTick: service.runtime.state.tick + 1,
    expiresAtTick: service.runtime.state.tick + 20,
    source: 'support',
  });
}

test('interaction dependency outage rejects before durable reservation or state mutation', () => {
  const store = new InMemoryDurableStore();
  const leases = new RunLeaseStore();
  const service = new MazeChannelService(options(store, leases));
  service.start(0);
  const command = commandFor(service, 'dependency-effect');
  service.setDependencyHealth({ gateway: false, moderation: false });
  const beforeState = checksum(service.runtime.state);
  const beforeStatus = service.status();
  const beforeEvents = store.events('maze-review-channel').length;

  assert.throws(
    () => service.enqueueInfluence('dependency-command', command, 10),
    error => error.code === 'INTERACTIONS_UNAVAILABLE',
  );

  assert.equal(checksum(service.runtime.state), beforeState);
  assert.equal(service.status().commandSeq, beforeStatus.commandSeq);
  assert.equal(store.events('maze-review-channel').length, beforeEvents);
});

test('a rejected influence command never enters durable replay evidence', () => {
  const store = new InMemoryDurableStore();
  const leases = new RunLeaseStore();
  const service = new MazeChannelService(options(store, leases));
  service.start(0);
  const command = commandFor(service, 'terminal-effect');
  service.runtime.state.lifecycle = 'result';
  const beforeSeq = service.status().commandSeq;
  const beforeEvents = store.events('maze-review-channel').length;

  assert.throws(
    () => service.enqueueInfluence('terminal-command', command, 10),
    error => error.code === 'COMMAND_REJECTED',
  );

  assert.equal(service.status().commandSeq, beforeSeq);
  assert.equal(store.events('maze-review-channel').length, beforeEvents);
  assert.equal(store.events('maze-review-channel').some(event => event.payload.commandId === 'terminal-command'), false);
});

test('operator control fails closed before mutation when durable audit is unavailable', () => {
  const store = new InMemoryDurableStore();
  const leases = new RunLeaseStore();
  const service = new MazeChannelService(options(store, leases));
  service.start(0);
  service.setDependencyHealth({ audit: false });
  const before = service.status();
  const beforeAudits = store.audits().length;

  assert.throws(
    () => service.executeControl({
      id: 'audit-blocked-control',
      actor: 'admin',
      role: 'admin',
      environment: 'production',
      action: 'emergency-halt',
      reason: 'review regression',
    }, 20),
    error => error.code === 'AUDIT_UNAVAILABLE',
  );

  const after = service.status();
  assert.equal(after.simulationEnabled, before.simulationEnabled);
  assert.equal(after.publicOutputProtected, before.publicOutputProtected);
  assert.equal(store.audits().length, beforeAudits);
});
