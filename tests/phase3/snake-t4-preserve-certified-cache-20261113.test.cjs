'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(process.env.RENDERER_SOURCE || path.resolve(__dirname, '../../public/snake-stream/renderer.mjs'), 'utf8');
const moduleSource = source.replace(/^import\s+.*?;\s*$/gm, '');
async function exported() {return import('data:text/javascript;base64,' + Buffer.from(moduleSource).toString('base64'))}

test('a real certified settled view survives transient pressure-direct camera misses, with zero new cache resources', async () => {
  const { selectStaticWorldCachePath } = await exported();
  assert.equal(selectStaticWorldCachePath({cacheHit:false, pressureDirect:true}), 'direct-preserve');
  assert.equal(selectStaticWorldCachePath({cacheHit:true, pressureDirect:false}), 'compose');
  assert.equal(selectStaticWorldCachePath({cacheHit:false, pressureDirect:false}), 'rebuild');
});

test('pressure-direct render is the actual full 3D scene and cannot erase the certified cache key', () => {
  const start = source.indexOf('  function renderPresentation() {');
  const end = source.indexOf('  const observer = new ResizeObserver', start);
  assert.ok(start > 0 && end > start);
  const render = source.slice(start, end);
  assert.match(render, /selectStaticWorldCachePath\(\{\s*cacheHit,\s*pressureDirect:/);
  const pressure = render.split("if (cachePath === 'direct-preserve') {")[1]?.split('return;')[0];
  assert.ok(pressure, 'the real pressure branch must exist');
  assert.match(pressure, /pressureDirectFrames\+\+;\s*renderer\.render\(scene, camera\);/);
  assert.doesNotMatch(pressure, /invalidateStaticCache\(/);
  assert.match(render, /const key = \[dimensions, world\.propRevision/);
  assert.match(render, /sameCssLayout: cachedCssLayout === lastCssLayout/);
});

test('reset of world, CSS camera, renderer failure still invalidates old cache, while true strict renderer submissions are unchanged', () => {
  assert.match(source, /function invalidateStaticCache\(\{ preserveView = false \} = \{\}\)/);
  assert.match(source, /if \(!preserveView\) staticKey = ''/);
  assert.match(source, /if \(!sameCssLayout\) invalidateStaticCache\(\)/);
  assert.match(source, /invalidateStaticCache\(\);\s*scene\.add\(world\.group\)/);
  assert.match(source, /if \(!frameGate\.canDraw\(\)\) return false/);
  assert.match(source, /renderer\.info\.reset\(\);\s*renderPresentation\(\);\s*frameCount\+\+;/);
  assert.match(source, /frameGate\.submitted\(\)/);
  assert.match(source, /const frameGate = createGpuFrameGate\(gl\)/);
  assert.match(source, /world\.update\(snapshot,/);
  assert.match(source, /serpent\.update\(motion\.paths,/);
});
