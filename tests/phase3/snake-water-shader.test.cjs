'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

test('water retains animated layered texture with one fragment lookup and bounded resources', async () => {
  const THREE = await import('three');
  const { createWorld } = await import('../../public/snake-stream/world.mjs');
  const world = createWorld(THREE, { width: 28, height: 16 });
  try {
    const water = world.group.getObjectByName('Flowing water');
    assert.ok(water?.isMesh, 'original animated 3D water mesh must remain');
    const shader = water.material.fragmentShader;
    assert.equal((shader.match(/texture2D\s*\(/g) || []).length, 1, 'water must need one texture fetch per fragment');
    assert.match(water.material.vertexShader, /waterFogFactor\s*=\s*smoothstep\(fogNear,fogFar,-mvPosition\.z\)/,
      'original linear scene fog is evaluated in the tessellated vertex stage');
    assert.match(shader, /gl_FragColor\.rgb\s*\+=\s*\(fogColor-gl_FragColor\.rgb\)\*waterFogFactor/,
      'the original scene fog color is still composited into live water');
    const texture = water.material.uniforms.waterField.value;
    assert.equal(texture.image.width, 256);
    assert.equal(texture.image.height, 256);
    assert.equal(texture.wrapS, THREE.RepeatWrapping, 'water wraps horizontally');
    assert.equal(texture.wrapT, THREE.RepeatWrapping, 'water wraps vertically');
    assert.equal(texture.minFilter, THREE.LinearMipmapLinearFilter, 'distance sampling remains filtered');
    const distinct = new Set();
    const contour = new Set();
    for (let i = 0; i < texture.image.data.length; i += 16) {
      // The precomposed RGB palette intentionally compresses each individual
      // channel's range. Preserve the original >30 and >12 diversity thresholds
      // over the visible full-color palette and its green/blue contour pairs.
      const red = texture.image.data[i], green = texture.image.data[i + 1], blue = texture.image.data[i + 2];
      distinct.add(`${red}:${green}:${blue}`);
      contour.add(`${green}:${blue}`);
    }
    assert.ok(distinct.size > 30, 'broad organic water variation must not become flat');
    assert.ok(contour.size > 12, 'foam/ripple detail must remain present');
    // A single precomposited field must stay seamless at both texture edges.
    // Compare its wrap edges with interior neighbour differences, including
    // sparse bright crest texels which naturally have higher local gradients.
    const percentile = (values, fraction) => values.sort((a, b) => a - b)[Math.floor((values.length - 1) * fraction)];
    for (const channel of [0, 1]) {
      const edgeDifferences = [];
      const neighborDifferences = [];
      const { data } = texture.image;
      const size = texture.image.width;
      for (let y = 0; y < size; y++) {
        edgeDifferences.push(Math.abs(data[(y * size) * 4 + channel] - data[(y * size + size - 1) * 4 + channel]));
        for (let x = 0; x + 1 < size; x++) {
          neighborDifferences.push(Math.abs(data[(y * size + x) * 4 + channel] - data[(y * size + x + 1) * 4 + channel]));
        }
      }
      assert.ok(percentile(edgeDifferences, .98) <= percentile(neighborDifferences, .98) + 4,
        'water channel ' + channel + ' must not create a conspicuous horizontal repeat seam');
    }
    const expectedCounts = world.stats();
    const empty = { obstacles: [], portals: [], hazards: [], food: null };
    world.update(empty, { time: 2, reducedMotion: false });
    assert.equal(water.material.uniforms.time.value, 2, 'water remains animated');
    world.update(empty, { time: 6, reducedMotion: true });
    assert.equal(water.material.uniforms.time.value, 0, 'reduced motion freezes water movement');
    const after = world.stats();
    for (const key of ['geometries', 'materials', 'textures', 'staticMeshes', 'drawObjects']) {
      assert.equal(after[key], expectedCounts[key], key + ' budget changed');
    }
  } finally {
    world.dispose();
    assert.equal(world.group.children.length, 0);
  }
});
