'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

test('serpent eyes follow only public food, easing safely across turns, portals, and restarts', async () => {
  const THREE = await import('three');
  const { createSerpent } = await import('../../public/snake-stream/serpent.mjs');
  const serpent = createSerpent(THREE);
  const pupils = [];
  serpent.group.traverse(object => { if (object.name === 'Deep pupil') pupils.push(object.parent); });
  assert.equal(pupils.length, 2, 'both original eye clusters must be retained');
  const paths = Object.freeze([
    Object.freeze([{ x: 0, z: 0 }, { x: 0, z: -1 }, { x: 0, z: -2 }].map(Object.freeze)),
    Object.freeze([{ x: 8, z: 7 }].map(Object.freeze)),
  ]);
  const untouched = JSON.stringify(paths);
  const before = serpent.stats();
  const pose = { direction: { x: 0, z: 1 }, detail: 'high', delta: 1 / 60, runToken: 'first-run' };
  try {
    serpent.update(paths, { ...pose, food: { x: 6, z: 2 }, reducedMotion: true });
    const right = serpent.stats().gaze;
    assert.ok(right.horizontal > 0.018 && right.horizontal <= 0.027, 'public fruit to the right must lead the gaze');
    assert.ok(right.vertical < -0.003 && right.vertical > -0.015, 'fruit gaze stays inside the socket');
    assert.ok(Math.abs(pupils[0].position.x - (0.012 + right.horizontal)) < 1e-6);
    assert.ok(Math.abs(pupils[1].position.x - (-0.012 + right.horizontal)) < 1e-6);
    assert.ok(pupils.every(pupil => pupil.position.y >= -0.021 && pupil.position.y <= -0.005));

    serpent.update(paths, { ...pose, food: { x: -6, z: 2 }, reducedMotion: true });
    const left = serpent.stats().gaze;
    assert.ok(left.horizontal < -0.018 && left.horizontal >= -0.027, 'opposite fruit should draw both pupils left');
    serpent.update(paths, { ...pose, food: { x: 6, z: 2 }, time: 0.2, reducedMotion: false });
    const eased = serpent.stats().gaze.horizontal;
    assert.ok(eased > left.horizontal && eased < right.horizontal, 'normal movement eases instead of eye-snapping');
    for (let i = 0; i < 120; i++) {
      serpent.update(paths, { ...pose, time: i / 60, food: { x: 6, z: 2 } });
      const stats = serpent.stats();
      for (const key of ['geometries', 'materials', 'textures', 'bufferBytes']) {
        assert.equal(stats[key], before[key], 'no allocation during eye tracking: ' + key);
      }
      assert.equal(stats.paths, 2, 'portal fragments remain disjoint');
      assert.equal(stats.truncated, false);
      assert.ok(Math.abs(stats.gaze.horizontal) <= 0.02700001);
      assert.ok(Number.isFinite(stats.gaze.vertical));
      for (const pupil of pupils) {
        assert.ok(pupil.position.x >= -0.041 && pupil.position.x <= 0.041, 'eye must never exit its original socket');
      }
    }
    assert.ok(serpent.stats().gaze.horizontal > 0.018, 'gaze settles on visible fruit');
    serpent.update(paths, { ...pose, runToken: 'restarted', food: { x: -6, z: 2 }, reducedMotion: false });
    assert.ok(serpent.stats().gaze.horizontal < -0.018, 'new run immediately resets gaze, even at the same head cell');
    serpent.update([[{x: 14, z: 0},{x: 14, z: -1}]], { ...pose, runToken: 'restarted', food: { x: 10, z: 1 } });
    assert.ok(serpent.stats().gaze.horizontal < -0.018, 'teleport does not sweep gaze across the garden');
    serpent.update(paths, { ...pose, food: {x: Infinity,z: NaN}, reducedMotion: true });
    assert.equal(serpent.stats().gaze.horizontal, 0, 'invalid target is safely neutral');
    serpent.update(paths, { ...pose, food: null, reducedMotion: true });
    assert.equal(serpent.stats().gaze.horizontal, 0, 'empty food never creates a fictional target');
    assert.equal(serpent.stats().gaze.vertical, 0);
    assert.equal(JSON.stringify(paths), untouched, 'authoritative path input must remain untouched');
    serpent.update([], { ...pose, food: null });
    assert.equal(serpent.stats().bodyTriangles, 0, 'empty geometry path stays empty');
  } finally {
    serpent.dispose();
    serpent.dispose();
  }
  assert.equal(serpent.stats().disposed, true);
});
