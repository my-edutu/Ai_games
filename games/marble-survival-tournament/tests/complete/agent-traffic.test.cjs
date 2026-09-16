'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const runtimePath = path.resolve(__dirname, '../../../../dist/games/marble-survival-tournament/src/index.js');
const { MarbleRuntime, chooseMarbleAction } = require(runtimePath);

function emptyArenaTrafficState(seed, archetype) {
  const runtime = MarbleRuntime.create({ roundIntroTicks: 0 }, seed);
  const state = runtime.state;
  const marble = state.marbles.find((candidate) => candidate.archetype === archetype);
  assert.ok(marble, `missing ${archetype}`);
  const preferredIndex = marble.id % state.arena.safeLanes.length;
  const preferredLane = state.arena.safeLanes[preferredIndex];
  const alternateLane = state.arena.safeLanes[(preferredIndex + 1) % state.arena.safeLanes.length];
  marble.position = { x: preferredLane, y: 9_000 };
  marble.velocity = { x: 0, y: -80 };
  marble.progressPermille = 500;
  marble.lastProgressTick = state.tick;
  state.arena = {
    ...state.arena,
    obstacles: [],
    hazards: [],
    windZones: [],
    sweepers: [],
    safeLanes: [preferredLane, alternateLane],
  };
  return { state, marble, preferredLane, alternateLane };
}

test('agent: aware racer seeks a clear lane when a slower marble blocks the route ahead', () => {
  const { state, marble, preferredLane, alternateLane } = emptyArenaTrafficState('marble-agent-traffic-aware', 'navigator');
  const blocker = state.marbles.find((candidate) => candidate.id !== marble.id && state.activeIds.includes(candidate.id));
  assert.ok(blocker);
  blocker.position = { x: preferredLane, y: 8_250 };
  blocker.velocity = { x: 0, y: -20 };
  blocker.progressPermille = 550;

  const first = chooseMarbleAction(state, marble.id);
  const second = chooseMarbleAction(state, marble.id);
  assert.deepEqual(first, second);
  assert.equal(first.intent, 'seeking-gap');
  const direction = Math.sign(alternateLane - preferredLane);
  assert.equal(Math.sign(first.steerX), direction);
  assert.ok(Math.abs(first.steerX) > 0);
});

test('agent: traffic behind does not cause unnecessary lane changes', () => {
  const { state, marble, preferredLane } = emptyArenaTrafficState('marble-agent-traffic-behind', 'navigator');
  const follower = state.marbles.find((candidate) => candidate.id !== marble.id && state.activeIds.includes(candidate.id));
  assert.ok(follower);
  follower.position = { x: preferredLane, y: 9_900 };
  follower.velocity = { x: 0, y: -120 };
  follower.progressPermille = 440;

  const action = chooseMarbleAction(state, marble.id);
  assert.equal(action.intent, 'holding-line');
  assert.equal(action.steerX, 0);
});
