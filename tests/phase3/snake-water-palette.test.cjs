'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

test('original flowing water bakes the same palette once instead of mixing every fragment', async () => {
  const THREE = await import('three');
  const { createWorld } = await import('../../public/snake-stream/world.mjs');
  const world = createWorld(THREE, { width: 28, height: 16 });
  try {
    const water = world.group.getObjectByName('Flowing water');
    assert.ok(water?.isMesh, 'the full original water surface remains rendered');
    const shader = water.material.fragmentShader;
    assert.equal((shader.match(/texture2D\s*\(/g) || []).length, 1, 'single filtered water lookup remains');
    assert.match(shader, /gl_FragColor\s*=\s*texture2D\s*\(\s*waterField\s*,\s*waterUv\s*\)/,
      'GPU shader samples the precomposed RGB color without rebuilding the palette');
    assert.doesNotMatch(shader, /\bmix\s*\(/, 'per-fragment palette blending must be baked at world creation');
    assert.match(water.material.vertexShader, /smoothstep\(fogNear,fogFar,-mvPosition\.z\)/,
      'distance fog still uses the original near/far distances');
    assert.match(shader, /\(fogColor-gl_FragColor\.rgb\)\*waterFogFactor/,
      'per-fragment color remains blended with original fog color');
    const texture = water.material.uniforms.waterField.value;
    assert.equal(texture.image.width, 256);
    assert.equal(texture.image.height, 256);
    assert.equal(texture.wrapS, THREE.RepeatWrapping);
    assert.equal(texture.wrapT, THREE.RepeatWrapping);
    assert.equal(texture.minFilter, THREE.LinearMipmapLinearFilter);
    const source = texture.image.data;
    const distinct = [new Set(), new Set(), new Set()];
    // Previous RGB processing: depth = .2 + broadByte / 255 * .6;
    // result = mix((.035,.24,.27),(.09,.37,.36),depth)
    //          + (.035,.065,.045) * foamByte / 255.
    // The G/B relationship below is true for both affine terms. Allow only
    // a pair of 8-bit rounding errors; this also detects a wrong color space.
    for (let i = 0; i < source.length; i += 4) {
      const [r, g, b, a] = [source[i], source[i + 1], source[i + 2], source[i + 3]];
      assert.equal(a, 255, 'the opaque water must remain opaque');
      assert.ok(r >= 11 && r <= 30, 'palette stays in the original red intensity range');
      assert.ok(g >= 67 && g <= 105, 'palette stays in the original green intensity range');
      assert.ok(b >= 72 && b <= 100, 'blue is precomposed into the texture, not zero');
      assert.ok(Math.abs(b - (0.27 * 255 + (g - 0.24 * 255) * 9 / 13)) < 2,
        'RGB encodes the original linear broad/foam color transfer');
      if (i % 64 === 0) for (let channel = 0; channel < 3; channel++) distinct[channel].add(source[i + channel]);
    }
    for (const colors of distinct) assert.ok(colors.size >= 7, 'water retains layered organic color variation');
    const before = world.stats();
    const empty = { obstacles: [], portals: [], hazards: [], food: null };
    world.update(empty, { time: 2.5, reducedMotion: false });
    assert.equal(water.material.uniforms.time.value, 2.5, 'flow still animates from presentation time');
    world.update(empty, { time: 9, reducedMotion: true });
    assert.equal(water.material.uniforms.time.value, 0, 'reduced-motion freezes flow');
    const after = world.stats();
    for (const key of ['geometries', 'materials', 'textures', 'staticMeshes', 'drawObjects']) {
      assert.equal(after[key], before[key], 'resource budget ' + key + ' is unchanged');
    }
  } finally {
    world.dispose();
    assert.equal(world.group.children.length, 0);
  }
});
