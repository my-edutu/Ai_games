'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

test('original gold saddles taper towards the flanks instead of becoming solid rings', async () => {
  const THREE = await import('three');
  const { createSerpent } = await import('../../public/snake-stream/serpent.mjs');
  const serpent = createSerpent(THREE);
  try {
    const body = serpent.group.getObjectByName('Continuous sculpted serpent body');
    const map = body?.material?.map;
    assert.ok(map?.image?.data, 'actual body mesh must carry the procedural pigment atlas');
    assert.equal(map.image.width, 1024);
    assert.equal(map.image.height, 512);
    assert.equal(map.wrapS, THREE.RepeatWrapping);
    assert.equal(map.wrapT, THREE.RepeatWrapping);
    const { width, height, data } = map.image;
    const at = (u, v) => {
      const x = Math.floor(u * width) % width;
      const y = Math.floor(v * height) % height;
      return [...data.slice((y * width + x) * 4, (y * width + x) * 4 + 4)];
    };
    for (const center of [0.25, 0.75]) {
      const spine = at(center, 0.25);
      const shoulder = at(center, 0);
      const belly = at(center, 0.75);
      const gap = at(center + 0.20, 0.25);
      assert.ok(spine[0] - shoulder[0] > 65,
        'saddle should have a bright central back and green tapered shoulder: ' + JSON.stringify({ center, spine, shoulder }));
      assert.ok(spine[0] > 175 && spine[1] > 145, 'dorsal gold must remain recognizable');
      assert.ok(shoulder[1] > shoulder[0], 'green shoulders should be continuous with the body');
      assert.ok(gap[1] > gap[0], 'unmarked dorsal skin must still read as jade green');
      assert.ok(belly[0] > 215 && belly[1] > 190, 'the original cream belly must stay visible');
    }
    const before = serpent.stats();
    assert.equal(before.textures, 4, 'reuse original body/head pigment and relief maps');
    assert.equal(body.material.map, map);
    assert.equal(body.material.bumpMap, body.material.roughnessMap, 'retain existing skin relief/roughness');
    const atlasBefore = Buffer.from(map.image.data);
    serpent.update([[{ x: 0, z: 0 }, { x: 0, z: 1 }, { x: 0, z: 2 }]], {
      time: 2, delta: 1 / 60, reducedMotion: true, direction: { x: 0, z: 1 },
      danger: 0, eating: 0, runToken: 'atlas-audit', detail: 'low',
    });
    assert.deepEqual(Buffer.from(map.image.data), atlasBefore,
      'motion/reduced-motion presentation must not rebuild or mutate static pigment');
    assert.equal(serpent.stats().textures, before.textures);
    assert.equal(serpent.stats().materials, before.materials);
    assert.equal(serpent.stats().geometries, before.geometries);
  } finally { serpent.dispose(); }
});
