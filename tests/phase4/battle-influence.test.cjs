'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  BattleRoyaleRuntime,
  createBattleConfig,
  createBattleInfluenceGateway,
  processBattleInfluenceTick,
  disableBattleInfluence,
  setBattleInfluenceProviderStatus,
  BATTLE_INFLUENCE_EFFECTS,
} = require('../../dist/games/ai-battle-royale/src/index.js');

function createRuntime(seed = 'phase4-seed', overrides = {}) {
  return new BattleRoyaleRuntime(createBattleConfig({
    combatantCount: 8,
    maxTicks: 260,
    zoneFirstShrinkTick: 80,
    zoneShrinkInterval: 40,
    noProgressTicks: 65,
    voteWindowEvery: 40,
    voteWindowTicks: 10,
    maxProcessedInfluence: 24,
    maxAuditEntries: 24,
    maxScheduledEffects: 6,
    ...overrides,
  }), seed, `run-${seed}`);
}

function openWindow(state) {
  state.tick = state.config.voteWindowEvery;
  processBattleInfluenceTick(state);
  assert.equal(state.influence.currentWindow?.status, 'open');
  return state.influence.currentWindow;
}

function raw(window, overrides = {}) {
  return {
    provider: 'mock',
    providerEventId: 'event-001',
    actorId: 'viewer-alpha@example.invalid',
    receivedTick: window.startTick,
    windowId: window.id,
    effectId: 'medic-mist',
    weight: 1,
    signatureValid: true,
    moderation: 'approved',
    ...overrides,
  };
}

test('vote cadence opens the five disclosed global effects without target fields', () => {
  const game = createRuntime();
  const window = openWindow(game.state);
  assert.deepEqual(window.options, BATTLE_INFLUENCE_EFFECTS);
  assert.equal(window.endTick, window.startTick + game.state.config.voteWindowTicks);
  const serialized = JSON.stringify(window);
  assert.equal(serialized.includes('targetId'), false);
  assert.equal(serialized.includes('combatantId'), false);
});

test('gateway accepts only verified, moderated, exact-window ballots and stores no raw identity', () => {
  const game = createRuntime('acceptance');
  const window = openWindow(game.state);
  const gateway = createBattleInfluenceGateway({ provider: 'mock', pepper: 'phase4-test-pepper' });
  const accepted = gateway.ingest(game.state, raw(window));
  assert.equal(accepted.accepted, true);
  assert.match(accepted.inputId, /^[0-9a-f]{8}$/);
  assert.match(accepted.actorHash, /^[0-9a-f]{8}$/);
  assert.equal(Object.keys(window.ballots).length, 1);
  const serialized = JSON.stringify(game.state.influence);
  assert.equal(serialized.includes('viewer-alpha@example.invalid'), false);
  assert.equal(serialized.includes('event-001'), false);
  assert.equal(serialized.includes('phase4-test-pepper'), false);
});

test('duplicate, actor replay, bad signature, moderation, stale window and provider outage fail closed', () => {
  const game = createRuntime('rejections');
  const window = openWindow(game.state);
  const gateway = createBattleInfluenceGateway({ provider: 'mock', pepper: 'phase4-test-pepper' });
  assert.equal(gateway.ingest(game.state, raw(window)).accepted, true);
  assert.equal(gateway.ingest(game.state, raw(window)).reason, 'duplicate-input');
  assert.equal(gateway.ingest(game.state, raw(window, { providerEventId: 'event-002', effectId: 'radar-pulse' })).reason, 'actor-rate-limit');
  assert.equal(gateway.ingest(game.state, raw(window, { providerEventId: 'event-003', actorId: 'viewer-b', signatureValid: false })).reason, 'invalid-signature');
  assert.equal(gateway.ingest(game.state, raw(window, { providerEventId: 'event-004', actorId: 'viewer-c', moderation: 'rejected' })).reason, 'moderation-rejected');
  assert.equal(gateway.ingest(game.state, raw(window, { providerEventId: 'event-005', actorId: 'viewer-d', windowId: 'stale-window' })).reason, 'stale-window');
  setBattleInfluenceProviderStatus(game.state, 'degraded');
  assert.equal(gateway.ingest(game.state, raw(window, { providerEventId: 'event-006', actorId: 'viewer-e' })).reason, 'provider-unavailable');
  assert.ok(game.state.influence.audit.length <= game.state.config.maxAuditEntries);
  assert.ok(game.state.influence.processedInputIds.length <= game.state.config.maxProcessedInfluence);
});

test('tally and winner are deterministic under reordered delivery', () => {
  const first = createRuntime('reordered');
  const second = createRuntime('reordered');
  const firstWindow = openWindow(first.state);
  const secondWindow = openWindow(second.state);
  const gateway = createBattleInfluenceGateway({ provider: 'mock', pepper: 'stable-pepper' });
  const ballots = [
    raw(firstWindow, { providerEventId: 'a', actorId: 'actor-a', effectId: 'supply-rain' }),
    raw(firstWindow, { providerEventId: 'b', actorId: 'actor-b', effectId: 'medic-mist' }),
    raw(firstWindow, { providerEventId: 'c', actorId: 'actor-c', effectId: 'supply-rain' }),
    raw(firstWindow, { providerEventId: 'd', actorId: 'actor-d', effectId: 'medic-mist' }),
  ];
  for (const ballot of ballots) gateway.ingest(first.state, ballot);
  for (const ballot of [...ballots].reverse()) gateway.ingest(second.state, { ...ballot, windowId: secondWindow.id });
  first.state.tick = firstWindow.endTick;
  second.state.tick = secondWindow.endTick;
  processBattleInfluenceTick(first.state);
  processBattleInfluenceTick(second.state);
  assert.equal(first.state.influence.currentWindow.winner, second.state.influence.currentWindow.winner);
  assert.deepEqual(first.state.influence.scheduled, second.state.influence.scheduled);
  assert.deepEqual(first.state.influence.processedInputIds, second.state.influence.processedInputIds);
  assert.deepEqual(first.state.influence.audit, second.state.influence.audit);
});

test('all five effects are bounded, global and non-targetable', () => {
  for (const effectId of BATTLE_INFLUENCE_EFFECTS) {
    const game = createRuntime(`effect-${effectId}`);
    const state = game.state;
    for (const combatant of state.combatants) {
      if (combatant.alive) combatant.health = Math.max(1, combatant.maxHealth - 20);
    }
    const before = {
      health: state.combatants.map((combatant) => combatant.health),
      loot: state.arena.loot.length,
      nextShrinkTick: state.zone.nextShrinkTick,
      radarUntilTick: state.influence.radarUntilTick,
      theme: state.influence.theme,
    };
    state.influence.scheduled.push({
      id: `scheduled-${effectId}`,
      effectId,
      applyTick: state.tick,
      sourceWindowId: 'test-window',
      status: 'scheduled',
    });
    processBattleInfluenceTick(state);
    const applied = state.influence.scheduled.find((effect) => effect.id === `scheduled-${effectId}`);
    assert.equal(applied.status, 'applied');
    assert.equal(JSON.stringify(applied).includes('target'), false);
    if (effectId === 'supply-rain') assert.ok(state.arena.loot.length > before.loot && state.arena.loot.length <= before.loot + 3);
    if (effectId === 'zone-hold') assert.ok(state.zone.nextShrinkTick > before.nextShrinkTick);
    if (effectId === 'medic-mist') {
      const living = state.combatants.filter((combatant) => combatant.alive);
      assert.ok(living.every((combatant) => combatant.health > before.health[combatant.index] && combatant.health <= combatant.maxHealth));
    }
    if (effectId === 'radar-pulse') assert.ok(state.influence.radarUntilTick > before.radarUntilTick);
    if (effectId === 'theme-shift') assert.notEqual(state.influence.theme, before.theme);
  }
});

test('zone-hold is applied before the zone schedule on the same authoritative tick', () => {
  const game = createRuntime('ordering');
  const state = game.state;
  state.tick = state.zone.nextShrinkTick - 1;
  const phaseBefore = state.zone.phase;
  state.influence.scheduled.push({ id: 'same-tick-hold', effectId: 'zone-hold', applyTick: state.zone.nextShrinkTick, sourceWindowId: 'window', status: 'scheduled' });
  game.step();
  assert.equal(state.zone.phase, phaseBefore);
  assert.ok(state.zone.nextShrinkTick > state.tick);
});

test('operator disable and terminal lifecycle prevent pending or new audience mutation', () => {
  const game = createRuntime('disable');
  const window = openWindow(game.state);
  const gateway = createBattleInfluenceGateway({ provider: 'mock', pepper: 'pepper' });
  game.state.influence.scheduled.push({ id: 'pending', effectId: 'medic-mist', applyTick: game.state.tick + 1, sourceWindowId: window.id, status: 'scheduled' });
  disableBattleInfluence(game.state, 'operator-disable');
  assert.equal(game.state.influence.enabled, false);
  assert.equal(game.state.influence.providerStatus, 'disabled');
  assert.equal(game.state.influence.scheduled.some((effect) => effect.status === 'scheduled'), false);
  assert.equal(gateway.ingest(game.state, raw(window, { providerEventId: 'after-disable' })).reason, 'influence-disabled');

  const terminal = createRuntime('terminal');
  terminal.state.lifecycle = 'result';
  terminal.state.result = { kind: 'game', reason: 'draw', tick: terminal.state.tick, winnerId: null, survivorIds: [] };
  const healthBefore = terminal.state.combatants.map((combatant) => combatant.health);
  terminal.state.influence.scheduled.push({ id: 'terminal-mist', effectId: 'medic-mist', applyTick: terminal.state.tick, sourceWindowId: 'terminal', status: 'scheduled' });
  processBattleInfluenceTick(terminal.state);
  assert.deepEqual(terminal.state.combatants.map((combatant) => combatant.health), healthBefore);
  assert.equal(terminal.state.influence.scheduled.at(-1).status, 'expired');
});
