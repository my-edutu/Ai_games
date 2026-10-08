'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  MarbleRuntime,
  stepMarblePhysics,
  marbleStateChecksum,
} = require('../../dist/games/marble-survival/src/index.js');

function isolatedState(seed) {
  const runtime = MarbleRuntime.create({
    rosterSize: 2,
    roundQuotas: [1, 1, 1, 1, 1],
    roundIntroTicks: 0,
    frictionPermille: 1000,
  }, seed);
  const state = structuredClone(runtime.state);
  state.arena.obstacles = [];
  state.arena.bumpers = [];
  state.arena.hazards = [];
  state.arena.windZones = [];
  state.arena.sweepers = [];
  state.arena.ramps = [];
  for (const marble of state.marbles) {
    marble.velocity = { x: 0, y: 0 };
    marble.verticalVelocity = 0;
    marble.elevation = 0;
    marble.grounded = true;
    marble.roundStatus = 'racing';
    marble.status = 'active';
  }
  state.marbles[0].position = { x: 11_000, y: 8_000 };
  state.marbles[1].position = { x: 13_000, y: 8_000 };
  return state;
}

function idle(state) {
  return state.activeIds.map(marbleId => ({
    marbleId, steerX: 0, steerY: 0, boostPermille: 1000,
    intent: 'holding-line', confidence: 'high',
  }));
}

test('3D balls do not collide when only their floor projections overlap', () => {
  const state = isolatedState('gauntlet-overpass');
  const airborne = state.marbles[1];
  airborne.position = { x: 11_260, y: 8_000 };
  airborne.elevation = 530;
  airborne.grounded = false;
  const result = stepMarblePhysics(state, idle(state));
  assert.equal(result.integrityIssue, undefined);
  assert.equal(result.contacts.some(contact => contact.kind === 'marble'), false);
  assert.equal(result.state.marbles[0].position.x, 11_000);
  assert.equal(result.state.marbles[1].position.x, 11_260);
  assert.ok(result.state.marbles[1].elevation > 0);
});

test('angled 3D impacts transfer vertical impulse without negative support height', () => {
  const state = isolatedState('gauntlet-angled-impact');
  const airborne = state.marbles[1];
  airborne.position = { x: 11_200, y: 8_000 };
  airborne.elevation = 250;
  airborne.verticalVelocity = -200;
  airborne.grounded = false;

  const result = stepMarblePhysics(state, idle(state));
  assert.equal(result.integrityIssue, undefined);
  const pair = result.contacts.find(contact => contact.kind === 'marble');
  assert.ok(pair, 'actual volumetric overlap must cause a marble contact');
  assert.ok(pair.impulse > 0, 'incoming vertical speed must transfer collision impulse');
  assert.ok(result.state.marbles[1].verticalVelocity > -218,
    'airborne marble should lose some downward speed in an angled contact');
  for (const marble of result.state.marbles) {
    assert.ok(marble.elevation >= 0);
    assert.ok(Math.abs(marble.verticalVelocity) <= state.config.maxVerticalSpeed);
  }
});

test('elevated marble clears low bumpers, moving sweepers, and arena blocks', () => {
  const airborne = isolatedState('gauntlet-obstacle-altitude');
  airborne.marbles[0].position = { x: 12_000, y: 8_000 };
  airborne.marbles[0].elevation = 2_000;
  airborne.marbles[0].grounded = false;
  airborne.marbles[1].position = { x: 6_000, y: 13_000 };
  airborne.arena.obstacles = [{ id: 'underpass-block', kind: 'block', x: 11_900, y: 7_900, width: 300, height: 300 }];
  airborne.arena.bumpers = [{ id: 'underpass-bumper', kind: 'bumper', x: 12_000, y: 8_000, radius: 450, restitutionPermille: 900 }];
  airborne.arena.sweepers = [{
    id: 'underpass-sweeper', kind: 'sweeper',
    baseX: 11_900, baseY: 7_900, width: 300, height: 300,
    axis: 'x', amplitude: 0, periodTicks: 16, phaseTicks: 0, restitutionPermille: 860,
  }];
  const above = stepMarblePhysics(airborne, idle(airborne));
  assert.equal(above.integrityIssue, undefined);
  assert.equal(above.contacts.some(contact =>
    contact.marbleId === 0 && ['obstacle', 'sweeper', 'bumper'].includes(contact.kind)), false,
    'low obstacles should not cause invisible mid-air side collisions');

  const grounded = structuredClone(airborne);
  grounded.marbles[0].elevation = 0;
  grounded.marbles[0].grounded = true;
  const below = stepMarblePhysics(grounded, idle(grounded));
  assert.equal(below.integrityIssue, undefined);
  assert.ok(below.contacts.some(contact =>
    contact.marbleId === 0 && ['obstacle', 'sweeper', 'bumper'].includes(contact.kind)),
    'the same colliders must still work for grounded marbles');
});

test('new 3D contact paths preserve independent replay checksums', () => {
  let a = isolatedState('gauntlet-3d-replay');
  a.marbles[1].position = { x: 11_200, y: 8_000 };
  a.marbles[1].elevation = 310;
  a.marbles[1].verticalVelocity = -80;
  a.marbles[1].grounded = false;
  let b = structuredClone(a);
  for (let tick = 0; tick < 40; tick += 1) {
    const x = stepMarblePhysics(a, idle(a));
    const y = stepMarblePhysics(b, idle(b));
    assert.equal(x.integrityIssue, undefined);
    assert.equal(y.integrityIssue, undefined);
    assert.equal(marbleStateChecksum(x.state), marbleStateChecksum(y.state), `3D replay tick ${tick}`);
    assert.deepEqual(x.contacts, y.contacts);
    a = x.state;
    b = y.state;
  }
});
