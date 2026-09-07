'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

function game7() {
  return require('../../../../dist/games/marble-survival/src/index.js');
}

function isolatedPhysicsState(seed = 'physics-v2') {
  const { MarbleRuntime } = game7();
  const runtime = MarbleRuntime.create({
    rosterSize: 2,
    roundQuotas: [1, 1, 1, 1, 1],
    roundIntroTicks: 0,
    roundTimeoutTicks: 10000,
  }, seed);
  const state = runtime.state;
  state.arena.obstacles = [];
  state.arena.bumpers = [];
  state.arena.hazards = [];
  state.arena.windZones = [];
  state.arena.sweepers = [];
  state.activeIds = [0];
  state.marbles[0].status = 'active';
  state.marbles[0].roundStatus = 'racing';
  state.marbles[1].status = 'eliminated';
  state.marbles[1].roundStatus = 'out';
  return state;
}

test('public sweeper transform is the exact authoritative moving-collider transform', () => {
  const { MarbleRuntime, createMarblePublicSnapshot, sweeperTransform } = game7();
  assert.equal(typeof sweeperTransform, 'function');
  const runtime = MarbleRuntime.create({ rosterSize: 2, roundQuotas: [1, 1, 1, 1, 1], roundIntroTicks: 0 }, 'sweeper-contract');
  const sweeper = { id: 'contract-sweeper', kind: 'sweeper', baseX: 6000, baseY: 7000, width: 1000, height: 400, axis: 'x', amplitude: 1000, periodTicks: 40, phaseTicks: 0, restitutionPermille: 900 };
  runtime.state.arena.sweepers = [sweeper];
  runtime.state.tick = 7;
  const authoritative = sweeperTransform(sweeper, runtime.state.tick);
  const published = createMarblePublicSnapshot(runtime.state).arena.sweepers[0];
  assert.deepEqual(published, authoritative);
});

test('a translating sweeper transfers bounded momentum through relative velocity', () => {
  const { stepMarblePhysics } = game7();
  const state = isolatedPhysicsState('moving-sweeper-impulse');
  state.tick = 0;
  state.arena.sweepers = [{ id: 'moving-right', kind: 'sweeper', baseX: 6000, baseY: 7000, width: 1000, height: 400, axis: 'x', amplitude: 1000, periodTicks: 40, phaseTicks: 0, restitutionPermille: 900 }];
  const marble = state.marbles[0];
  marble.position = { x: 6100, y: 7200 };
  marble.velocity = { x: 0, y: 0 };
  const output = stepMarblePhysics(state, [{ marbleId: 0, steerX: 0, steerY: 0, boostPermille: 1000, intent: 'holding-line', confidence: 'medium' }]);
  assert.ok(output.contacts.some((contact) => contact.kind === 'sweeper'));
  assert.ok(output.state.marbles[0].velocity.x > 0, 'right-moving sweeper must transfer rightward momentum');
  assert.ok(Math.abs(output.state.marbles[0].velocity.x) <= output.state.config.maxSpeed);
});

test('shield recovery returns to the previous safe position instead of teleporting through the course', () => {
  const { MarbleRuntime, applyTournamentRules } = game7();
  const runtime = MarbleRuntime.create({
    rosterSize: 4,
    roundQuotas: [3, 2, 2, 2, 1],
    roundIntroTicks: 0,
    roundTimeoutTicks: 10000,
  }, 'shield-recovery-v2');
  const state = runtime.state;
  state.activeIds = [0, 1, 2, 3];
  state.marbles.forEach((marble, index) => {
    marble.status = 'active';
    marble.roundStatus = 'racing';
    marble.position = { x: index === 0 ? 2000 : 10000 + index * 500, y: index === 0 ? 5200 : 10000 };
  });
  const target = state.marbles[0];
  target.shieldCharges = 1;
  target.velocity = { x: 0, y: -120 };
  const previous = { x: 2000, y: 5700 };
  state.arena.hazards = [{ id: 'recovery-pit', kind: 'pit', x: 0, y: 5000, width: 4000, height: 500 }];
  const output = applyTournamentRules(state, [], new Map([[0, previous]]));
  const recovered = output.state.marbles[0];
  assert.equal(recovered.shieldCharges, 0);
  assert.equal(recovered.recoveryCount, 1);
  assert.deepEqual(recovered.position, previous);
  assert.ok(recovered.velocity.y >= 0, 'recovery impulse must point away from the finish-side hazard entry');
  assert.equal(output.events.filter((event) => event.type === 'shield-recovery' && event.data?.marbleId === 0).length, 1);
  assert.equal(recovered.status, 'active');
});
