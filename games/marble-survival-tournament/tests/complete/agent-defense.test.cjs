'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const runtimePath = path.resolve(__dirname, '../../../../dist/games/marble-survival-tournament/src/index.js');
const { MarbleRuntime, chooseMarbleAction } = require(runtimePath);

function defenseScenario(seed, archetype) {
  const runtime = MarbleRuntime.create({ roundIntroTicks: 0 }, seed);
  const state = runtime.state;
  const defender = state.marbles.find((candidate) => candidate.archetype === archetype);
  assert.ok(defender, `missing ${archetype}`);
  const attacker = state.marbles.find((candidate) => candidate.id !== defender.id);
  assert.ok(attacker);

  const laneA = Math.round(state.arena.width * .34);
  const laneB = Math.round(state.arena.width * .66);
  const defenderLane = laneA;
  const attackLane = laneB;
  state.arena = {
    ...state.arena,
    obstacles: [],
    hazards: [],
    windZones: [],
    sweepers: [],
    safeLanes: defender.id % 2 === 0 ? [defenderLane, attackLane] : [attackLane, defenderLane],
  };
  state.activeIds = [defender.id, attacker.id];
  state.qualifiedIds = [];
  state.eliminatedIds = state.marbles
    .filter((candidate) => !state.activeIds.includes(candidate.id))
    .map((candidate) => candidate.id);

  for (const marble of state.marbles) {
    const active = state.activeIds.includes(marble.id);
    marble.status = active ? 'active' : 'eliminated';
    marble.roundStatus = active ? 'racing' : 'out';
  }

  defender.position = { x: defenderLane, y: 8_000 };
  defender.velocity = { x: 0, y: -60 };
  defender.progressPermille = 520;
  defender.lastProgressTick = state.tick;

  attacker.position = { x: attackLane, y: 8_850 };
  attacker.velocity = { x: 0, y: -170 };
  attacker.progressPermille = 470;
  attacker.lastProgressTick = state.tick;

  return { state, defender, attacker, defenderLane, attackLane };
}

test('agent: bruiser protects a clear lane from a faster closing racer behind', () => {
  const { state, defender, defenderLane, attackLane } = defenseScenario('marble-defense-bruiser', 'bruiser');
  const first = chooseMarbleAction(state, defender.id);
  const second = chooseMarbleAction(state, defender.id);

  assert.deepEqual(first, second);
  assert.equal(first.intent, 'defending-lane');
  assert.equal(Math.sign(first.steerX), Math.sign(attackLane - defenderLane));
  assert.ok(Math.abs(first.steerX) > 0 && Math.abs(first.steerX) <= 1_000);
  assert.ok(first.boostPermille <= 1_000);
});

test('agent: navigator does not adopt bruiser-style blocking under the same rear pressure', () => {
  const { state, defender } = defenseScenario('marble-defense-navigator', 'navigator');
  const action = chooseMarbleAction(state, defender.id);

  assert.notEqual(action.intent, 'defending-lane');
});

test('agent: bruiser will not defend into a geometrically threatened lane', () => {
  const { state, defender, attackLane } = defenseScenario('marble-defense-blocked', 'bruiser');
  state.arena = {
    ...state.arena,
    obstacles: [{
      id: 'defense-blocker',
      kind: 'block',
      x: attackLane - 600,
      y: 6_900,
      width: 1_200,
      height: 650,
    }],
  };

  const action = chooseMarbleAction(state, defender.id);
  assert.notEqual(action.intent, 'defending-lane');
});
