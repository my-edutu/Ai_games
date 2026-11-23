'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

const straight = Object.freeze([
  { x: 0, z: 0 }, { x: -1, z: 0 }, { x: -2, z: 0 }, { x: -3, z: 0 },
].map(p => Object.freeze(p)));
const bendNorth = Object.freeze([
  { x: 0, z: 0 }, { x: -1, z: 0 }, { x: -1, z: 1 }, { x: -1, z: 2 },
].map(p => Object.freeze(p)));
const bendSouth = Object.freeze([
  { x: 0, z: 0 }, { x: -1, z: 0 }, { x: -1, z: -1 }, { x: -1, z: -2 },
].map(p => Object.freeze(p)));

test('the living skull leans with public neck curvature rather than only transient yaw error', async () => {
  const THREE = await import('three');
  const { createSerpent } = await import('../../public/snake-stream/serpent.mjs');
  const samples = [];
  for (const path of [straight, bendNorth, bendSouth]) {
    const model = createSerpent(THREE);
    const skull = model.group.getObjectByName('Expressive head');
    const headPose = skull?.children[0];
    assert.ok(headPose?.isGroup, 'existing continuous skull pose remains available');
    const budget = model.stats();
    const immutable = JSON.stringify(path);
    try {
      // Let a heading settle, then inspect the held turn on a frozen public path.
      // Nothing in the authoritative snapshot has advanced between updates.
      for (let frame = 0; frame < 48; frame++) model.update([path], {
        detail: 'low', time: frame / 60, delta: 1 / 60, reducedMotion: false,
        direction: { x: 1, z: 0 }, runToken: 'same-run', food: null,
      });
      samples.push(headPose.rotation.z);
      assert.equal(JSON.stringify(path), immutable, 'the presenter may not mutate cells');
      assert.ok(Math.abs(headPose.rotation.z) <= 0.105 + 1e-7, 'roll stays inside the grounded cap');
      assert.ok(Number.isFinite(headPose.rotation.z));
      for (const key of ['geometries', 'materials', 'textures', 'bufferBytes']) {
        assert.equal(model.stats()[key], budget[key], 'no extra GPU resource: ' + key);
      }
    } finally { model.dispose(); }
  }
  assert.ok(Math.abs(samples[0]) < .012, 'straight snakes should remain level after yaw settles');
  assert.ok(samples[1] > .06, 'one 90-degree bend leans into its direction: ' + samples[1]);
  assert.ok(samples[2] < -.06, 'mirrored 90-degree bend reverses the lean: ' + samples[2]);
});

test('portal breaks, reduced-motion and restart never invent cross-board skull banking', async () => {
  const THREE = await import('three');
  const { createSerpent } = await import('../../public/snake-stream/serpent.mjs');
  const model = createSerpent(THREE);
  const skullPose = model.group.getObjectByName('Expressive head').children[0];
  const portalPaths = Object.freeze([
    Object.freeze([{ x: 0, z: 0 }, { x: -1, z: 0 }].map(p => Object.freeze(p))),
    Object.freeze([{ x: 10, z: 7 }, { x: 10, z: 8 }, { x: 11, z: 8 }].map(p => Object.freeze(p))),
  ]);
  const before = JSON.stringify(portalPaths);
  const options = { detail: 'low', direction: { x: 1, z: 0 }, delta: 1 / 60, runToken: 'first' };
  try {
    for (let frame = 0; frame < 48; frame++) model.update(portalPaths, { ...options, time: frame / 60 });
    assert.ok(Math.abs(skullPose.rotation.z) < .012,
      'a turn on the far side of a portal must not tilt the leading skull');
    model.update([bendNorth], { ...options, time: 2, reducedMotion: true });
    assert.equal(skullPose.rotation.z, 0, 'reduced motion freezes all cosmetic turn banking');
    model.update([bendSouth], { ...options, time: 3, runToken: 'restarted' });
    assert.ok(skullPose.rotation.z < -.05, 'restart uses its current public path, not stale previous lean');
    assert.equal(JSON.stringify(portalPaths), before, 'portal bodies remain immutable');
    assert.equal(model.stats().paths, 1);
  } finally { model.dispose(); }
});
