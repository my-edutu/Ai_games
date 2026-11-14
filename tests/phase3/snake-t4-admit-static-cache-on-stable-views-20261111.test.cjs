'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
// Production file by default; the explicit override is for immutable parent RED verification.
const file = process.env.SNAKE_RENDERER_SOURCE || path.join(__dirname, '../../public/snake-stream/renderer.mjs');
const source = fs.readFileSync(file, 'utf8');
const start = source.indexOf('  function renderPresentation() {');
const end = source.indexOf('  const observer = new ResizeObserver', start);
const render = source.slice(start, end);
test('a settled complete garden scene enters cache composition on its first eligible render, without transient full-scene probation', () => {
  assert.ok(start >= 0 && end > start, 'inspect actual production renderPresentation');
  assert.match(render, /cameraTarget\.distanceToSquared\(desiredTarget\)\s*>\s*0/);
  assert.match(render, /cameraOffset\.distanceToSquared\(desiredPosition\)\s*>\s*0/);
  assert.doesNotMatch(render, /staticCacheAdmission\.allow\(key\)/, 'measured c14 three-submission probation caused GPU queue regression to 1/17');
  assert.match(render, /if \(key !== staticKey \|\| renderer\.shadowMap\.needsUpdate\)/);
});
test('cache rebuild captures original full static environment, then composes original live serpent, water, contacts and cues', () => {
  assert.match(render, /camera\.layers\.set\(STATIC_LAYER\);[\s\S]*?renderer\.setRenderTarget\(staticTarget\);[\s\S]*?renderer\.render\(scene, camera\)/);
  assert.match(render, /renderer\.render\(cacheScene, cacheCamera\)/);
  assert.match(render, /camera\.layers\.set\(DYNAMIC_LAYER\);[\s\S]*?liveCacheQuad\.visible = true;[\s\S]*?renderer\.render\(scene, camera\)/);
  assert.match(render, /liveCacheQuad\.visible = false/);
});
test('resize/restart still invalidates the full cache and no extra temporary full-scene admission holds stale resources', () => {
  assert.match(source, /function invalidateStaticCache\(\)\s*\{\s*staticKey = '';/);
  assert.match(source, /function invalidateStaticCache\(\)[\s\S]*?cacheActive = false;/);
  assert.doesNotMatch(source, /createStaticCacheAdmission/);
});
