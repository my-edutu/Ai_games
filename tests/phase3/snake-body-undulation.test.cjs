'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

// The body is a closed tube. Measure each ring's actual central position by
// averaging its unique circumferential vertices, not the repeated UV seam.
function centres(body, radial, ringCount) {
  const array = body.geometry.attributes.position.array;
  const ring = radial + 1;
  const count = ringCount;
  const samples = [];
  for (let i = 0; i < count; i++) {
    let x = 0, y = 0, z = 0;
    for (let j = 0; j < radial; j++) {
      const offset = (i * ring + j) * 3;
      x += array[offset]; y += array[offset + 1]; z += array[offset + 2];
    }
    samples.push({ x: x / radial, y: y / radial, z: z / radial });
  }
  return samples;
}

test('the living snake has a bounded travelling lateral wave, with grounded endpoints and reduced-motion safety', async () => {
  const THREE = await import('three');
  const { createSerpent } = await import('../../public/snake-stream/serpent.mjs');
  const serpent = createSerpent(THREE);
  const path = Object.freeze(Array.from({ length: 10 }, (_, z) => Object.freeze({ x: 0, z })));
  const frozen = JSON.stringify(path);
  const body = serpent.group.getObjectByName('Continuous sculpted serpent body');
  const baseline = serpent.stats();
  try {
    function sample(time, reducedMotion = false) {
      serpent.update([path], { detail: 'low', time, reducedMotion, delta: 1 / 60, direction: { x: 0, z: -1 } });
      // Use the initialized ring count; never inspect unused buffer capacity.
      return centres(body, 8, serpent.stats().bodyRings);
    }
    const poseA = sample(0.1), poseB = sample(1.15);
    assert.equal(poseA.length, poseB.length);
    const middle = poseA.map((point, index) => [point, poseB[index]]).filter(([a]) => a.z > 2.0 && a.z < 6.5);
    assert.ok(middle.length > 6, 'test must inspect the middle of a real 3D body');
    const movement = Math.max(...middle.map(([a,b]) => Math.abs(a.x - b.x)));
    assert.ok(movement > 0.026, `muscle wave must travel along the living body (observed ${movement})`);
    for (const frame of [poseA, poseB]) {
      assert.ok(Math.abs(frame[0].x) < 0.012, 'head end must stay seated within the skull');
      assert.ok(Math.abs(frame.at(-1).x) < 0.012, 'tapered tail must stay on its authoritative endpoint');
      assert.ok(frame.every(p => Number.isFinite(p.x) && Math.abs(p.x) <= 0.083), 'visual weave cannot depart from the authoritative grid corridor');
    }
    const stillA = sample(0.1, true), stillB = sample(1.15, true);
    for (let i = 0; i < stillA.length; i++) assert.ok(Math.abs(stillA[i].x - stillB[i].x) < 1e-6,
      'reduced-motion setting must freeze purely cosmetic lateral movement');
    assert.equal(JSON.stringify(path), frozen, 'rendering cannot mutate the public simulation path');
    const after = serpent.stats();
    for (const key of ['geometries','materials','textures','bufferBytes']) assert.equal(after[key], baseline[key], key + ' resource budget');
    assert.equal(after.truncated, false);
  } finally { serpent.dispose(); }
});
