'use strict';
const { restorePreR45 } = require('../helpers/snake-r45-archive.cjs');
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const sourcePath = path.resolve(__dirname, '../../public/snake-stream/serpent.mjs');
const round39 = /^[ \t]*\/\/ BEGIN R39 [^\n]*\n[\s\S]*?^[ \t]*\/\/ END R39 [^\n]*\n/gm;
const blob = source => crypto.createHash('sha1').update('blob ' + Buffer.byteLength(source) + '\0').update(source).digest('hex');
const pathNorth = Object.freeze(Array.from({ length: 6 }, (_, i) => Object.freeze({ x: 0, z: -i })));
const jawOf = serpent => {
  const jaw = serpent.group.getObjectByName('Attached lower jaw pivot');
  assert.ok(jaw?.isGroup, 'use the original joint, not a floating decorative mouth');
  return jaw;
};
const cheeksOf = serpent => {
  const mesh = serpent.group.getObjectByName('Attached mouth corners');
  assert.ok(mesh?.isMesh, 'keep both original articulated cheek corners');
  return mesh.geometry.getAttribute('position').array;
};

test('Round39 source-verified RED control: forward public fruit opens the existing attached jaw and cheeks without resource growth', async () => {
  const source = fs.readFileSync(sourcePath, 'utf8');
  assert.equal((source.match(round39) || []).length, 3, 'three bounded new presentation sections');
  const predecessor = restorePreR45(source.replace(round39, ''));
  assert.equal(blob(predecessor), '8e96f08c3fca80484d69c9476a6d9993cfc4af63', 'exact prior Git serpent blob');
  const THREE = await import('three');
  const { createSerpent: priorFactory } = await import('data:text/javascript;base64,' + Buffer.from(predecessor).toString('base64'));
  const { createSerpent } = await import('../../public/snake-stream/serpent.mjs');
  const previous = priorFactory(THREE), current = createSerpent(THREE);
  const options = { time: 1.25, delta: 1 / 60, detail: 'high', direction: { x: 0, z: 1 },
    runToken: 'food-near', food: Object.freeze({ x: 0.25, z: 1.6 }), danger: 0 };
  const unchanged = JSON.stringify(pathNorth);
  const budget = current.stats();
  try {
    previous.update([pathNorth], options);
    current.update([pathNorth], options);
    assert.equal(jawOf(previous).rotation.x, 0, 'exact predecessor lacks anticipation');
    assert.ok(jawOf(current).rotation.x > 0.08 && jawOf(current).rotation.x <= 0.1051, 'real near-fruit jaw opening');
    assert.notEqual(Buffer.compare(Buffer.from(cheeksOf(previous).buffer), Buffer.from(cheeksOf(current).buffer)), 0,
      'the existing mouth corners follow the opened jaw');
    assert.equal(JSON.stringify(pathNorth), unchanged, 'public authoritative path unchanged');
    const before = previous.stats(), after = current.stats();
    for (const key of ['geometries', 'materials', 'textures', 'bodyRings', 'bodyVertices',
      'bodyTriangles', 'bufferBytes', 'paths', 'maxBodyRings']) {
      assert.equal(after[key], before[key], 'exact parent resource/body parity for ' + key);
    }
    for (const key of ['geometries', 'materials', 'textures', 'bufferBytes'])
      assert.equal(after[key], budget[key], 'no allocation growth: ' + key);
    assert.equal(after.paths, 1);
    assert.equal(after.truncated, false);
  } finally { previous.dispose(); current.dispose(); }
});

test('feeding anticipation follows only forward public food, releases smoothly, respects danger, eating and reduced-motion', async () => {
  const THREE = await import('three');
  const { createSerpent } = await import('../../public/snake-stream/serpent.mjs');
  const serpent = createSerpent(THREE);
  const fixed = JSON.stringify(pathNorth);
  const options = { time: 1, delta: 1 / 60, runToken: 'first', direction: { x: 0, z: 1 }, detail: 'low' };
  const update = values => { serpent.update([pathNorth], { ...options, ...values }); return jawOf(serpent).rotation.x; };
  const budget = serpent.stats();
  try {
    const near = update({ food: { x: 0.25, z: 1.6 } });
    assert.ok(near > 0.08 && near < 0.106);
    const released = update({ time: 1.02, food: null });
    assert.ok(released > 0 && released < near, 'drop food means easing, no abrupt pop');
    for (let i = 0; i < 90; i++) update({ time: 1.03 + i / 60, food: null });
    assert.ok(jawOf(serpent).rotation.x < 0.001, 'returns to neutral pose');
    assert.equal(update({ time: 3, runToken: 'rear', food: { x: 0, z: -2 } }), 0, 'behind head');
    assert.equal(update({ time: 3, runToken: 'far', food: { x: 0, z: 5 } }), 0, 'beyond anticipation range');
    assert.equal(update({ time: 3, runToken: 'invalid', food: { x: NaN, z: 1 } }), 0, 'invalid food');
    assert.equal(update({ time: 3, runToken: 'danger', danger: 1, food: { x: 0, z: 1.6 } }), 0, 'danger cue takes priority');
    assert.equal(update({ time: 3, runToken: 'still', reducedMotion: true, food: { x: 0, z: 1.6 } }), 0,
      'reduced-motion keeps original immobile jaw despite near food');
    assert.equal(update({ time: 77, runToken: 'still', reducedMotion: true, food: { x: 0, z: 1.6 } }), 0,
      'reduced-motion remains time invariant');
    const eating = update({ time: 3, runToken: 'eating', eating: 1, food: { x: 0, z: 1.6 } });
    assert.ok(Math.abs(eating - 0.07) < 1e-10, 'food anticipation never overrides original chewing pose');
    assert.equal(JSON.stringify(pathNorth), fixed);
    for (const key of ['geometries', 'materials', 'textures', 'bufferBytes'])
      assert.equal(serpent.stats()[key], budget[key], 'resource bound: ' + key);
  } finally { serpent.dispose(); }
});

test('all headings and portal/restart snapshots retain attached jaw, disconnected body and instantaneous public reset', async () => {
  const THREE = await import('three');
  const { createSerpent } = await import('../../public/snake-stream/serpent.mjs');
  for (const direction of [{ x: 0, z: 1 }, { x: 1, z: 0 }, { x: 0, z: -1 }, { x: -1, z: 0 }]) {
    const serpent = createSerpent(THREE);
    const path = Object.freeze(Array.from({ length: 5 }, (_, i) => Object.freeze({ x: -i * direction.x, z: -i * direction.z })));
    const gap = Object.freeze([{ x: 12, z: 11 }, { x: 12, z: 10 }].map(Object.freeze));
    const original = JSON.stringify([path, gap]);
    const food = { x: direction.x * 1.6 + direction.z * 0.25, z: direction.z * 1.6 - direction.x * 0.25 };
    const base = { detail: 'low', direction, runToken: 'before', time: 0, food };
    try {
      serpent.update([path, gap], base);
      assert.ok(jawOf(serpent).rotation.x > 0.08, 'forward food must work for heading ' + JSON.stringify(direction));
      assert.equal(serpent.stats().paths, 2, 'portal pieces are visually disconnected');
      serpent.update([path, gap], { ...base, runToken: 'restart', food: { x: -food.x, z: -food.z } });
      assert.equal(jawOf(serpent).rotation.x, 0, 'restart must discard old anticipation');
      serpent.update([path, gap], { ...base, runToken: 'restart', food });
      assert.ok(jawOf(serpent).rotation.x > 0, 'new target eases without teleporting');
      const displaced = Object.freeze([{ x: 20, z: 18 }, { x: 20, z: 17 }, { x: 20, z: 16 }].map(Object.freeze));
      serpent.update([displaced], { ...base, direction: { x: 0, z: 1 }, food: { x: 20, z: 19.6 } });
      assert.ok(jawOf(serpent).rotation.x > 0.08, 'long discontinuity immediately adopts current public food');
      assert.equal(serpent.stats().paths, 1);
      serpent.update([], base);
      assert.equal(serpent.group.visible, false, 'empty recovery path stays hidden');
      assert.equal(JSON.stringify([path, gap]), original, 'public portal points are immutable');
      assert.equal(serpent.stats().truncated, false);
    } finally { serpent.dispose(); }
  }
});
