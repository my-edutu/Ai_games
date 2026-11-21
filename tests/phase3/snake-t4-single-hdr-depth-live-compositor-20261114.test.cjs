'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.resolve(__dirname, '../../public/snake-stream/renderer.mjs'), 'utf8');
const presentation = source.slice(source.indexOf('function renderPresentation()'), source.indexOf('const observer = new ResizeObserver'));

test('full original static HDR/depth is baked ONCE then composed with the genuine live Three.js world, never a separate RGBA8 display bake', () => {
  assert.match(presentation, /renderer\.setRenderTarget\(staticTarget\);[\s\S]*?renderer\.render\(scene, camera\)/);
  assert.match(presentation, /camera\.layers\.set\(DYNAMIC_LAYER\);[\s\S]*?renderer\.render\(scene, camera\)/);
  assert.doesNotMatch(source, /\bdisplayTarget\b|\bcacheBakeMaterial\b|\bcacheScene\b|\bcacheCamera\b|\bcacheQuad\b/);
  assert.match(source, /staticTarget\?\.dispose\(\)/);
  assert.match(source, /cacheMaterial\.dispose\(\)/);
});

test('single-pass static composite retains actual depth, original ACES/SRGB/fog and unchanged full scene, with no extra texture or game shortcut', () => {
  const material = source.slice(source.indexOf('const cacheMaterial = new THREE.ShaderMaterial('),source.indexOf('const liveCacheQuad ='));
  for(const required of [
    '#include <tonemapping_pars_fragment>',
    'gl_FragDepth = depth;',
    'texture2D(cachedDepth, cacheUv).r',
    'if (depth >= 1.0) discard;',
    'gl_FragColor = texture2D(cachedColor, cacheUv);',
    'ACESFilmicToneMapping(gl_FragColor.rgb)',
    'toneMappingExposure: { value: renderer.toneMappingExposure }',
    'sRGBTransferOETF(gl_FragColor)',
    'smoothstep(fogRange.x, fogRange.y, viewDepth)',
    'mix(gl_FragColor.rgb, fogColor, fogFactor)',
    'depthTest: true, depthWrite: true',
    'depthFunc: THREE.AlwaysDepth',
  ]) assert.ok(material.includes(required), `Expected complete original static HDR/depth/lighting color stage: ${required}`);
  assert.match(source, /liveCacheQuad\.layers\.set\(DYNAMIC_LAYER\)/);
  assert.match(source, /renderer\.shadowMap\.needsUpdate/);
  assert.match(source, /cacheBuilds\+\+/);
  assert.match(source, /frameGate\.submitted\(\)/);
});
