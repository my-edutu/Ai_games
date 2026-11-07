'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

test('water moves fog smoothing off the full-screen fragment while retaining the full scene', async () => {
  const THREE = await import('three');
  const { createWorld } = await import('../../public/snake-stream/world.mjs');
  for (const [width, height] of [[8, 8], [28, 16], [40, 24]]) {
    const world = createWorld(THREE, { width, height });
    try {
      const water = world.group.getObjectByName('Flowing water');
      assert.ok(water?.isMesh, 'the live opaque water remains');
      const geometry = water.geometry, size = Math.max(512, width * 3, height * 3);
      const segments = Math.sqrt(geometry.attributes.position.count) - 1;
      assert.ok(Number.isInteger(segments), 'adaptive water grid remains a regular indexed mesh');
      assert.ok(segments < Math.max(64, Math.ceil(size / 8)),
        'far-fogged regions must not waste uniform near-field vertices');
      assert.equal(geometry.index.count, segments * segments * 6);
      // Three computes a procedural plane's bounds on demand during rendering;
      // explicitly request the same lazy calculation in a headless Node test.
      geometry.computeBoundingSphere();
      assert.ok(geometry.boundingSphere.radius > 180, 'far horizon stays covered');
      assert.equal(water.material.fog, true);
      for (const name of ['fogColor', 'fogNear', 'fogFar', 'time', 'waterField'])
        assert.ok(water.material.uniforms[name], 'retain original fog and animation uniform: ' + name);
      assert.match(water.material.vertexShader, /waterFogFactor\s*=\s*smoothstep\(fogNear,fogFar,-mvPosition\.z\)/);
      assert.doesNotMatch(water.material.fragmentShader, /smoothstep\s*\(/,
        'the full-screen water fragment cannot evaluate the fog curve');
      assert.match(water.material.fragmentShader, /gl_FragColor\.rgb\s*\+=\s*\(fogColor-gl_FragColor\.rgb\)\*waterFogFactor/);
      assert.equal((water.material.fragmentShader.match(/texture2D\s*\(/g) || []).length, 1);
      const before = world.stats();
      const frame = Object.freeze({ obstacles: Object.freeze([]), portals: Object.freeze([]),
        hazards: Object.freeze([]), food: null });
      world.update(frame, { time: 3, reducedMotion: false });
      assert.equal(water.material.uniforms.time.value, 3);
      world.update(frame, { time: 9, reducedMotion: true });
      assert.equal(water.material.uniforms.time.value, 0);
      for (const key of ['drawObjects', 'geometries', 'materials', 'textures', 'staticMeshes'])
        assert.equal(world.stats()[key], before[key], 'stable live geometry/resource budget: ' + key);
    } finally { world.dispose(); }
    assert.equal(world.group.children.length, 0);
  }
});

test('piecewise linear fog interpolation stays inside a bounded color error envelope', () => {
  // Source's 8-unit water tiles have the smallest near/far transition errors
  // in the authored 48..110 scene fog. The CPU model is only a mathematical
  // envelope; actual WebGL screenshots and cadence are separate release gates.
  const fog = d => { const t = Math.max(0, Math.min(1, (d - 48) / 62)); return t * t * (3 - 2 * t); };
  let max = 0;
  for (let lo = 8; lo < 180; lo += 8) {
    const hi = lo + 8;
    for (let n = 1; n < 16; n++) {
      const f = n / 16, distance = lo + (hi - lo) * f;
      const linear = fog(lo) * (1 - f) + fog(hi) * f;
      max = Math.max(max, Math.abs(fog(distance) - linear));
    }
  }
  assert.ok(max < 0.013, '8-unit tessellation must not visibly flatten the water fog gradient: ' + max);
});
