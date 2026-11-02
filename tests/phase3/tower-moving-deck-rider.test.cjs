'use strict';
// Engineering regression for the shipped *presentation* bridge from an
// occupied source moving deck to the actual skinned climber's counterbalance.
// A green test does not establish better-looking or better-playing footage.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const modulePromise = import(pathToFileURL(path.resolve(__dirname,
  '../../public/infinite-tower-climb/visuals/moving-deck-ride.mjs')).href);

function snapshot(tick, x, overrides = {}) {
  return {
    runToken: 'recorded-climb', lifecycle: 'running', floor: 7, tick,
    player: { state: 'standing', health: 5 },
    platforms: [{ id: 'f7:p3', kind: 'moving', x, y: 210000,
      width: 115000, height: 10000 }],
    ...overrides,
  };
}
const contact = Object.freeze({ platformId: 'f7:p3', grounded: true });

test('a first observed moving platform does not invent inertial lean; only a new source displacement drives it', async () => {
  const { createObservedMovingDeckRide } = await modulePromise;
  const ride = createObservedMovingDeckRide();
  const first = snapshot(20, 80000);
  const before = JSON.stringify(first);
  assert.equal(ride.sample(first, contact).lean, 0);
  assert.equal(ride.sample(first, contact).lean, 0);
  assert.equal(JSON.stringify(first), before, 'render may not mutate public source');
  const next = ride.sample(snapshot(21, 87000), contact);
  assert.equal(next.platformId, 'f7:p3');
  assert.equal(next.actualDisplacement, 7000);
  assert.equal(next.lastDrivenTick, 21);
  assert.equal(next.lean, 1);
  assert.equal(ride.sample(snapshot(21, 87000), contact).lean, 1,
    'polling the same fixed-step packet cannot add a second displacement');
  const calm = ride.sample(snapshot(22, 87000), contact);
  assert.equal(calm.actualDisplacement, 0);
  assert.ok(calm.lean > 0 && calm.lean < 1);
  assert.equal(ride.sample(snapshot(29, 87000), contact).lean, 0,
    'old carriage motion cannot remain as a ghost posture');
});

test('changing run, floor, deck, actor contact or stream freshness clears the source-only pose', async () => {
  const { createObservedMovingDeckRide } = await modulePromise;
  for (const invalid of [
    [snapshot(22, 93000, { runToken: 'a-different-run' }), contact, {}],
    [snapshot(22, 93000, { floor: 8 }), contact, {}],
    [snapshot(22, 93000, { player: { state: 'airborne', health: 5 } }), contact, {}],
    [snapshot(22, 93000, { player: { state: 'standing', health: 0 } }), contact, {}],
    [snapshot(22, 93000, { lifecycle: 'intermission' }), contact, {}],
    [snapshot(22, 93000), { platformId: 'f7:p3', grounded: false }, {}],
    [snapshot(22, 93000), { platformId: 'f7:missing', grounded: true }, {}],
    [snapshot(22, 93000), contact, { stale: true }],
    [snapshot(19, 93000), contact, {}],
  ]) {
    const ride = createObservedMovingDeckRide();
    ride.sample(snapshot(20, 80000), contact);
    ride.sample(snapshot(21, 87000), contact);
    const result = ride.sample(...invalid);
    assert.ok(result === null || result.lean === 0,
      'invalid/restarted state must not preserve obsolete source lean');
    assert.equal(ride.sample(snapshot(23, 98000), contact).lean, 0,
      'new live contact starts from rest');
  }
});

test('reduced motion, unobserved leaps and implausible source displacements never exaggerate balancing', async () => {
  const { createObservedMovingDeckRide } = await modulePromise;
  const ride = createObservedMovingDeckRide();
  ride.sample(snapshot(4, 100000), contact);
  const reduced = ride.sample(snapshot(5, 107000), contact, { reducedMotion: true });
  assert.equal(reduced.actualDisplacement, 7000);
  assert.equal(reduced.lean, 0);
  const normal = ride.sample(snapshot(5, 107000), contact);
  assert.equal(normal.lean, 1, 'the truthful source displacement is retained');
  const jump = ride.sample(snapshot(15, 220000), contact);
  assert.equal(jump.lean, 0, 'large missed source interval cannot create a phantom balance pose');
  ride.reset();
  ride.sample(snapshot(30, 100000), contact);
  assert.equal(ride.sample(snapshot(31, 160000), contact).lean, 0,
    'an implausible one-tick deck jump cannot fake inertia');
});
