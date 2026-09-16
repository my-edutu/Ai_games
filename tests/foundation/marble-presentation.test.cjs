'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  MarbleRuntime,
  createMarblePresentationSnapshot,
  isFreshMarblePresentationSnapshot,
} = require('../../dist/games/marble-survival/src/index.js');

function presentationState() {
  const runtime = MarbleRuntime.create({
    rosterSize: 4,
    roundQuotas: [2, 1, 1, 1, 1],
    roundIntroTicks: 0,
  }, 'presentation-private-seed');
  const state = runtime.state;
  state.tick = 500;
  state.lifecycle = 'active';
  state.roundIntroRemaining = 0;
  state.arena.hazards = [{ id: 'camera-pit', kind: 'pit', x: 8_000, y: 6_000, width: 2_000, height: 2_000 }];

  const [nearFinish, threatened, qualified, eliminated] = state.marbles;
  nearFinish.progressPermille = 920;
  nearFinish.position = { x: 4_000, y: 2_000 };
  threatened.progressPermille = 650;
  threatened.position = { x: 8_500, y: 6_500 };
  qualified.status = 'qualified';
  qualified.roundStatus = 'finished';
  qualified.progressPermille = 1_000;
  qualified.finishRank = 1;
  eliminated.status = 'eliminated';
  eliminated.roundStatus = 'out';

  state.activeIds = [nearFinish.id, threatened.id];
  state.qualifiedIds = [qualified.id];
  state.eliminatedIds = [eliminated.id];
  return state;
}

test('presentation snapshot is immutable, sanitized, and distinguishes spectator-critical statuses', () => {
  const state = presentationState();
  const snapshot = createMarblePresentationSnapshot(state, [
    {
      seq: 10,
      tick: state.tick,
      type: 'shield-recovery',
      data: { marbleId: state.marbles[1].id, hazardId: 'camera-pit', recoveryUntilTick: 512, rootSeed: 'must-not-leak' },
    },
    {
      seq: 11,
      tick: state.tick,
      type: 'operator-token',
      data: { token: 'must-not-leak' },
    },
  ]);

  assert.equal(Object.isFrozen(snapshot), true);
  assert.equal(Object.isFrozen(snapshot.marbles), true);
  assert.equal(Object.isFrozen(snapshot.marbles[0]), true);
  assert.equal(snapshot.version, 1);
  assert.equal(snapshot.tick, state.tick);
  assert.equal(snapshot.round.number, 1);
  assert.equal(snapshot.round.quota, 2);
  assert.equal(snapshot.round.remaining, 2);

  const byId = new Map(snapshot.marbles.map((marble) => [marble.id, marble]));
  assert.equal(byId.get(state.marbles[0].id).status, 'near-finish');
  assert.equal(byId.get(state.marbles[1].id).status, 'threatened');
  assert.equal(byId.get(state.marbles[2].id).status, 'qualified');
  assert.equal(byId.get(state.marbles[3].id).status, 'eliminated');
  assert.equal(typeof byId.get(state.marbles[0].id).number, 'number');
  assert.equal(typeof byId.get(state.marbles[0].id).pattern, 'string');

  assert.deepEqual(snapshot.events.map((event) => event.type), ['shield-recovery']);
  assert.equal('rootSeed' in snapshot.events[0].data, false);
  assert.equal('token' in snapshot.events[0].data, false);

  const serialized = JSON.stringify(snapshot);
  assert.equal(serialized.includes('presentation-private-seed'), false);
  assert.equal(serialized.includes('must-not-leak'), false);
  assert.equal(serialized.includes('rootSeed'), false);
  assert.equal(serialized.includes('tournamentSeed'), false);
  assert.equal(serialized.includes('operator'), false);
  assert.equal(serialized.includes('rng'), false);
});

test('presentation exports authoritative ramp geometry and vertical marble state', () => {
  const runtime = MarbleRuntime.create({
    rosterSize: 4,
    roundQuotas: [2, 1, 1, 1, 1],
    roundIntroTicks: 0,
  }, 'vertical-presentation');
  const state = runtime.state;
  state.arena.ramps = [{
    id: 'presentation-ramp',
    kind: 'ramp',
    x: 7_000,
    y: 8_000,
    width: 8_000,
    height: 3_000,
    axis: 'y',
    startElevation: 1_200,
    endElevation: 0,
  }];
  state.marbles[0].elevation = 720;
  state.marbles[0].verticalVelocity = 96;
  state.marbles[0].grounded = true;

  const snapshot = createMarblePresentationSnapshot(state, []);
  assert.equal(snapshot.arena.ramps.length, 1);
  assert.deepEqual(snapshot.arena.ramps[0], state.arena.ramps[0]);
  assert.equal(snapshot.marbles[0].elevation, 720);
  assert.equal(snapshot.marbles[0].verticalVelocity, 96);
  assert.equal(snapshot.marbles[0].grounded, true);
});

test('presentation snapshots expose camera interest without creating new authority', () => {
  const state = presentationState();
  const snapshot = createMarblePresentationSnapshot(state, []);

  assert.equal(snapshot.camera.leaderId, state.marbles[0].id);
  assert.ok(snapshot.camera.dangerIds.includes(state.marbles[1].id));
  assert.equal(snapshot.camera.championId, null);
  assert.ok(snapshot.camera.contestedQualificationIds.length <= 3);
  assert.equal(isFreshMarblePresentationSnapshot(snapshot, state.tick + 10, 15), true);
  assert.equal(isFreshMarblePresentationSnapshot(snapshot, state.tick + 16, 15), false);
  assert.equal(isFreshMarblePresentationSnapshot(null, state.tick, 15), false);
});

test('live leaderboard cannot be displaced by eliminated marbles from earlier rounds', () => {
  const state = presentationState();
  const [leader, second, qualified, eliminated] = state.marbles;
  leader.progressPermille = 760;
  second.progressPermille = 720;
  qualified.finishRank = 1;
  eliminated.finishRank = 1;
  eliminated.progressPermille = 1_000;

  const snapshot = createMarblePresentationSnapshot(state, []);
  assert.equal(snapshot.leaderboard[0].id, qualified.id, 'current-round qualifier should lead live standings');
  assert.equal(snapshot.leaderboard[1].id, leader.id, 'active leader should follow current-round qualifiers');
  assert.equal(snapshot.leaderboard[2].id, second.id, 'second active racer should remain visible before eliminated history');
  assert.equal(snapshot.leaderboard.at(-1).id, eliminated.id, 'eliminated history must stay behind the live field');
});

test('presentation event history starts after the latest tournament restart boundary', () => {
  const state = presentationState();
  state.tick = 42;
  state.runIndex = 1;
  const snapshot = createMarblePresentationSnapshot(state, [
    { seq: 70, tick: 670, type: 'marble-qualified', data: { marbleId: 26, finishRank: 1 } },
    { seq: 71, tick: 678, type: 'tournament-champion', data: { championId: 26 } },
    { seq: 72, tick: 0, type: 'tournament-restarted', data: { runIndex: 1 } },
    { seq: 73, tick: 0, type: 'round-started', data: { roundIndex: 0, quota: 2, arena: state.arena.archetype } },
    { seq: 74, tick: 20, type: 'round-live', data: { roundIndex: 0 } },
  ]);

  assert.deepEqual(snapshot.events.map((event) => event.type), ['round-started', 'round-live']);
  assert.equal(snapshot.events.some((event) => event.type === 'tournament-champion'), false);
  assert.equal(snapshot.events.some((event) => event.tick > state.tick), false);
});
