'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

// A fog-saturated lake pixel is exactly the scene's opaque fog colour.
// Skipping its texture lookup must not change any partially fogged pixel.
test('fully fogged water uses an opaque early exit, preserving live near water', async () => {
  const THREE = await import('three');
  const { createWorld } = await import('../../public/snake-stream/world.mjs');
  const world = createWorld(THREE, { width: 28, height: 16 });
  try {
    const water = world.group.getObjectByName('Flowing water');
    assert.ok(water?.isMesh, 'the full 3D lake must remain');
    const shader = water.material.fragmentShader;
    const early = shader.indexOf('if(waterFogFactor>=1.0)');
    const texel = shader.indexOf('texture2D(waterField,waterUv)');
    assert.ok(early > 0 && texel > early, 'far fog must return before the expensive filtered water lookup');
    assert.match(shader.slice(early, texel), /gl_FragColor=vec4\(fogColor,1\.0\);\s*return;/);
    assert.match(shader.slice(texel), /gl_FragColor\.rgb\+=\(fogColor-gl_FragColor\.rgb\)\*waterFogFactor/);
    assert.match(water.material.vertexShader, /waterUv=position\.xy\*\.018/);
    assert.match(water.material.vertexShader, /time\*\.0014,time\*\.00065/);
    assert.equal(water.material.transparent, false, 'saturated fragments are opaque like the source lake');
    assert.equal(water.material.depthWrite, true, 'do not drop lake occlusion/depth');
    assert.equal(water.material.uniforms.waterField.value.image.data.length, 256 * 256 * 4);
    assert.equal(water.geometry.index.count, 4232 * 3, 'do not undo the preceding adaptive-fog geometry saving');
  } finally { world.dispose(); }
});

test('far-fog bypass has exact colour parity for all opaque water fields', () => {
  const fog=[0.49,0.68,0.66], rgbSets=[[0,0,0],[0.12,0.65,0.4],[1,1,1],[0.6,0.15,0.8]];
  function previousWater(rgb,factor){return rgb.map((c,i)=>c+(fog[i]-c)*factor);}
  function bypass(rgb,factor){return factor>=1?fog:previousWater(rgb,factor);}
  for(const rgb of rgbSets)for(const factor of [0,0.01,0.5,0.99,1]){
    assert.deepEqual(bypass(rgb,factor),previousWater(rgb,factor));
  }
});
