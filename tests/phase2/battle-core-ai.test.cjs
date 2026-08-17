'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { NamedRng } = require('../../dist/packages/seeded-rng/src/index.js');
const {
  BattleRoyaleRuntime,
  WEAPON_SPECS,
  assertBattleInvariants,
  battleChecksum,
  chooseBattleDecision,
  createBattleConfig,
  createInitialBattleState,
  isInsideZone,
  resolveCombatBatch,
  resolveMovementBatch,
  runBattleCampaign,
  stepBattleState,
} = require('../../dist/games/ai-battle-royale/src/index.js');

function shortConfig(overrides = {}) {
  return createBattleConfig({
    combatantCount: 12,
    maxTicks: 420,
    zoneFirstShrinkTick: 45,
    zoneShrinkInterval: 35,
    zoneShrinkAmount: 2,
    zoneDamage: 10,
    supplyDropEvery: 55,
    noProgressTicks: 80,
    voteWindowEvery: 120,
    voteWindowTicks: 24,
    ...overrides,
  });
}

function keepOnly(state, ids) {
  for (const agent of state.combatants) {
    if (!ids.includes(agent.id)) {
      agent.alive = false;
      agent.health = 0;
      agent.shield = 0;
      agent.intent = 'eliminated';
      agent.deathTick = state.tick;
    }
  }
}

test('weapon catalogue and bounded AI decisions always produce legal actions', () => {
  assert.equal(WEAPON_SPECS.marksman.range, 9);
  const config = shortConfig();
  const state = createInitialBattleState(config, 'decision-seed', 'decision-run');
  const rng = NamedRng.restore(state.rng);
  const blocked = new Set(state.arena.obstacles);
  for (const agent of state.combatants) {
    const decision = chooseBattleDecision(state, agent, rng);
    assert.equal(decision.action.actorId, agent.id);
    assert.ok(decision.expansions <= config.maxPathExpansions);
    if (decision.action.kind === 'move') {
      assert.equal(blocked.has(decision.action.targetCell), false);
      const delta = Math.abs(decision.action.targetCell - agent.cell);
      assert.ok(delta === 1 || delta === config.width);
    }
    if (decision.action.kind === 'attack') {
      const target = state.combatants.find((candidate) => candidate.id === decision.action.targetId);
      assert.ok(target && target.alive && target.id !== agent.id);
    }
  }
});

test('combat resolves valid attacks simultaneously so mutual elimination is possible', () => {
  const config = shortConfig({ combatantCount: 4 });
  const state = createInitialBattleState(config, 'combat-seed-1', 'combat-run');
  keepOnly(state, ['agent-01', 'agent-02']);
  const first = state.combatants[0];
  const second = state.combatants[1];
  state.arena.obstacles = state.arena.obstacles.filter((cell) => cell !== 100 && cell !== 101);
  first.cell = 100;
  second.cell = 101;
  first.health = 20;
  second.health = 20;
  first.shield = 0;
  second.shield = 0;
  first.weapon = 'scattergun';
  second.weapon = 'scattergun';
  first.ammo = 5;
  second.ammo = 5;
  resolveCombatBatch(state, [
    { kind: 'attack', actorId: first.id, targetId: second.id, reason: 'test duel' },
    { kind: 'attack', actorId: second.id, targetId: first.id, reason: 'test duel' },
  ], NamedRng.fromSeed('combat-seed-1'));
  assert.equal(first.alive, false);
  assert.equal(second.alive, false);
  assert.equal(first.ammo, 4);
  assert.equal(second.ammo, 4);
  assert.equal(state.events.filter((event) => event.type === 'elimination').length, 2);
});

test('simultaneous focus fire credits the highest declared damage rather than stable ID order', () => {
  const config = shortConfig({ combatantCount: 4 });
  const state = createInitialBattleState(config, 'focus-0', 'focus-run');
  keepOnly(state, ['agent-01', 'agent-02', 'agent-03']);
  state.arena.obstacles = state.arena.obstacles.filter((cell) => ![100, 101, 102].includes(cell));
  const [first, second, target] = state.combatants;
  first.cell = 100;
  second.cell = 102;
  target.cell = 101;
  first.weapon = 'sidearm';
  second.weapon = 'marksman';
  first.ammo = 3;
  second.ammo = 3;
  target.health = 30;
  target.shield = 0;
  resolveCombatBatch(state, [
    { kind: 'attack', actorId: first.id, targetId: target.id, reason: 'focus' },
    { kind: 'attack', actorId: second.id, targetId: target.id, reason: 'focus' },
  ], NamedRng.fromSeed('focus-0'));
  assert.equal(target.alive, false);
  assert.equal(target.eliminatedBy, second.id);
  assert.equal(second.eliminations, 1);
  assert.equal(first.eliminations, 0);
});

test('movement conflict resolution is deterministic, rotating and overlap-free', () => {
  const config = shortConfig({ combatantCount: 4 });
  const state = createInitialBattleState(config, 'movement-seed', 'movement-run');
  const [first, second, third, fourth] = state.combatants;
  state.arena.obstacles = state.arena.obstacles.filter((cell) => ![100, 101, 102, 200, 201, 202].includes(cell));
  first.cell = 100;
  second.cell = 102;
  third.cell = 200;
  fourth.cell = 202;
  state.tick = 0;
  const appliedAtZero = resolveMovementBatch(state, [
    { kind: 'move', actorId: first.id, targetCell: 101, reason: 'contest' },
    { kind: 'move', actorId: second.id, targetCell: 101, reason: 'contest' },
  ]);
  assert.equal(appliedAtZero.length, 1);
  assert.equal(new Set(state.combatants.filter((agent) => agent.alive).map((agent) => agent.cell)).size, 4);
  first.cell = 100;
  second.cell = 102;
  state.tick = 1;
  const appliedAtOne = resolveMovementBatch(state, [
    { kind: 'move', actorId: first.id, targetCell: 101, reason: 'contest' },
    { kind: 'move', actorId: second.id, targetCell: 101, reason: 'contest' },
  ]);
  assert.equal(appliedAtOne.length, 1);
  assert.notEqual(appliedAtZero[0], appliedAtOne[0]);
  assert.equal(new Set(state.combatants.filter((agent) => agent.alive).map((agent) => agent.cell)).size, 4);
});

test('zone shrink and damage are declared, symmetric and capable of ending a match', () => {
  const config = shortConfig({ combatantCount: 4, zoneFirstShrinkTick: 10, zoneShrinkInterval: 10, noProgressTicks: 40 });
  const state = createInitialBattleState(config, 'zone-seed', 'zone-run');
  const rng = NamedRng.restore(state.rng);
  const initialRadius = state.zone.radius;
  for (const agent of state.combatants) {
    agent.cell = state.arena.spawnCells[agent.index];
    agent.shield = 0;
    agent.health = 12;
  }
  while (state.tick < 12 && state.lifecycle === 'running') stepBattleState(state, rng);
  assert.ok(state.zone.radius < initialRadius);
  assert.ok(state.events.some((event) => event.type === 'zone-shrink'));
  const outside = state.combatants.filter((agent) => !isInsideZone(agent.cell, state.zone, config.width));
  assert.ok(outside.length > 0);
  assert.ok(state.events.some((event) => event.type === 'zone-damage'));
  assert.equal(assertBattleInvariants(state).length, 0);
});

test('autonomous runtime produces deterministic causal terminal matches', () => {
  const config = shortConfig();
  const first = new BattleRoyaleRuntime(config, 'full-match-seed', 'full-match-run');
  const repeat = new BattleRoyaleRuntime(config, 'full-match-seed', 'full-match-run');
  first.runToResult(config.maxTicks + 5);
  repeat.runToResult(config.maxTicks + 5);
  assert.ok(first.state.result);
  assert.equal(first.state.result.kind, 'game');
  assert.ok(['last-standing', 'time-limit', 'draw'].includes(first.state.result.reason));
  assert.equal(first.state.result.reason, repeat.state.result.reason);
  assert.equal(first.state.result.winnerId, repeat.state.result.winnerId);
  assert.equal(first.checksum(), repeat.checksum());
  assert.equal(assertBattleInvariants(first.state).length, 0);
});

test('result truth is immutable while lifecycle advances to intermission', () => {
  const config = shortConfig({ combatantCount: 4 });
  const runtime = new BattleRoyaleRuntime(config, 'result-seed', 'result-run');
  keepOnly(runtime.state, ['agent-01']);
  runtime.step();
  const result = JSON.stringify(runtime.state.result);
  const checksum = battleChecksum(runtime.state);
  runtime.step();
  assert.equal(runtime.state.lifecycle, 'intermission');
  assert.equal(JSON.stringify(runtime.state.result), result);
  assert.notEqual(battleChecksum(runtime.state), checksum);
});

test('seed campaign has bounded tails, terminal results and zero integrity failures', () => {
  const config = shortConfig({ combatantCount: 8, maxTicks: 300, zoneFirstShrinkTick: 35, zoneShrinkInterval: 28, noProgressTicks: 55, voteWindowEvery: 100 });
  const report = runBattleCampaign(config, Array.from({ length: 20 }, (_, index) => `campaign-${index}`));
  assert.equal(report.runs, 20);
  assert.equal(report.integrityFailures, 0);
  assert.equal(report.technicalResults, 0);
  assert.equal(report.terminalRuns, 20);
  assert.ok(report.maxTicks <= config.maxTicks);
  assert.ok(Object.values(report.archetypeWins).reduce((sum, value) => sum + value, 0) <= 20);
});

test('default archetype outcomes stay inside declared 40-seed balance guardrails', () => {
  const report = runBattleCampaign(createBattleConfig(), Array.from({ length: 40 }, (_, index) => `default-${index}`));
  assert.equal(report.integrityFailures, 0);
  assert.equal(report.terminalRuns, 40);
  for (const [archetype, wins] of Object.entries(report.archetypeWins)) {
    assert.ok(wins >= 3, `${archetype} must win at least 3/40 matches; received ${wins}`);
    assert.ok(wins <= 17, `${archetype} must win at most 17/40 matches; received ${wins}`);
  }
});
