import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createSerpent } from '../../public/snake-stream/serpent.mjs';

// This compares the actual connected 3D surfaces in world coordinates, not
// private AI state, symbolic head meshes, or a source-string geometry claim.
const RADIUS = .319;
const STRAIGHT = Object.freeze(Array.from({ length: 48 }, (_, i) => Object.freeze({ x: 0, z: -i })));
const WORLD_DEPTH = -.5 * 1.28; // existing physical back of the scaled skull

function bounds(points) {
  return {
    minX: Math.min(...points.map(p => p.x)), maxX: Math.max(...points.map(p => p.x)),
    minY: Math.min(...points.map(p => p.y)), maxY: Math.max(...points.map(p => p.y)),
  };
}
function cervicalSeam(hero) {
  const skull = hero.group.getObjectByName('Continuous tapered skull and neck');
  const body = hero.group.getObjectByName('Continuous sculpted serpent body');
  assert.ok(skull && body);
  hero.group.updateWorldMatrix(true, true);
  const v = skull.geometry.getAttribute('position');
  const rings = hero.stats().detail === 'low' ? 17 : 49;
  const skullBack = [];
  for (let j = 0; j < rings; j++) {
    skullBack.push(new THREE.Vector3().fromBufferAttribute(v, j).applyMatrix4(skull.matrixWorld));
  }
  const a = body.geometry.getAttribute('position');
  const radial = hero.stats().detail === 'low' ? 8 : 20;
  const ringWidth = radial + 1;
  const ringRows = [];
  for (let i = 0; i < hero.stats().bodyRings; i++) {
    const points = [];
    for (let j = 0; j <= radial; j++) {
      points.push(new THREE.Vector3().fromBufferAttribute(a, i * ringWidth + j));
    }
    const z = points.reduce((sum, point) => sum + point.z, 0) / points.length;
    if (z > -1.1 && z <= 0) ringRows.push({ z, points });
  }
  const preceding = [...ringRows].reverse().find(row => row.z >= WORLD_DEPTH);
  const following = ringRows.find(row => row.z <= WORLD_DEPTH);
  assert.ok(preceding && following && preceding !== following, 'body has contiguous rings either side of physical skull rear');
  const fraction = (WORLD_DEPTH - preceding.z) / (following.z - preceding.z);
  const joinedBody = preceding.points.map((point, index) => point.clone().lerp(following.points[index], fraction));
  const h = bounds(skullBack), b = bounds(joinedBody);
  return { head: h, body: b,
    maxEdgeMismatch: Math.max(...['minX','maxX','minY','maxY'].map(key => Math.abs(h[key] - b[key]))),
    outerHeadWidth: h.maxX - h.minX,
    outerBodyWidth: b.maxX - b.minX,
  };
}

for (const detail of ['high', 'low']) {
  test(`T2 actual ${detail} 3D rear skull meets the continuously grounded cervical body, not an oversized open collar`, () => {
    const hero = createSerpent(THREE);
    try {
      hero.update([STRAIGHT], { detail, runToken: 'public-1', direction: { x: 0, z: 1 },
        reducedMotion: true, eating: 0, danger: 0, time: 0 });
      const seam = cervicalSeam(hero);
      console.log(`T145 actual native ${detail} cervical seam: ${JSON.stringify(seam)}`);
      assert.ok(seam.maxEdgeMismatch < 0.028,
        `rear skull is anatomically welded to body at live seam, found ${JSON.stringify(seam)}`);
      assert.ok(Math.abs(seam.outerHeadWidth - RADIUS * 2) < 0.028,
        'rear cranium must match the live neck girth instead of retaining an enlarged open ring');
    } finally { hero.dispose(); }
  });
}

test('T2 public-fruit swallow travels down the body instead of bursting the rear skull seam; portal gaps and public truth remain intact', () => {
  const hero = createSerpent(THREE);
  const portal = Object.freeze([
    Object.freeze(STRAIGHT.slice(0, 46)),
    Object.freeze([{ x: 12, z: 5 }, { x: 12, z: 4 }, { x: 12, z: 3 }].map(Object.freeze)),
  ]);
  const snapshot = JSON.stringify(portal);
  try {
    hero.update([STRAIGHT], { detail: 'high', runToken: 'public-2', direction: { x: 0, z: 1 },
      eating: 1, time: .2, reducedMotion: false, delta: 1 / 60 });
    const swallow = cervicalSeam(hero);
    console.log(`T145 native active public-fruit cervical seam: ${JSON.stringify(swallow)}`);
    assert.ok(swallow.maxEdgeMismatch < 0.065,
      `swallow should not pull shoulders apart or swell out through the cranial seam: ${JSON.stringify(swallow)}`);
    const before = hero.stats();
    hero.update(portal, { detail: 'low', runToken: 'public-3', direction: { x: 0, z: 1 },
      fragmentDirections: [{ x: 0, z: 1 }, { x: 0, z: 1 }],
      reducedMotion: true, time: 0, eating: 0 });
    const after = hero.stats();
    assert.equal(after.paths, 2, 'no made-up portal connection');
    assert.equal(JSON.stringify(portal), snapshot, 'public seeded frame remains frozen');
    for (const key of ['geometries', 'materials', 'textures', 'bodyCapacityRings', 'bufferBytes'])
      assert.equal(after[key], before[key], `anatomy may not allocate additional live GPU assets: ${key}`);
  } finally { hero.dispose(); }
});
