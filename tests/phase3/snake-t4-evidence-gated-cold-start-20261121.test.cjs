'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const renderer = fs.readFileSync(path.join(root, 'public/snake-stream/renderer.mjs'), 'utf8');
const modules = import('data:text/javascript;base64,' + Buffer.from(renderer.replace(/^import\s+.*?;\s*$/gm, '')).toString('base64'));
const first = (overrides={}) => ({
  queue: { supported:true, failed:false, submitted:0, completed:0, pending:0, skipped:0 },
  quality:'balanced', cameraMode:'overview', frameCount:0, staticMeshes:13,
  cacheSupported:true, cacheHit:false, cssWidth:1878, cssHeight:1038,
  devicePixelRatio:1, renderScale:Math.sqrt(768000/(1878*1038)),
  submittedAtWorldBuild:0, ...overrides,
});
test('RED / exact-head eb4: full-quality balanced pristine startup must not bake a 1178x651 HDR/depth cache without completed GPU evidence',async()=>{
  const { shouldPrimeColdFullSceneCache } = await modules;
  assert.equal(shouldPrimeColdFullSceneCache(first()), false,
    'authentic eb4 #44908083846 1/17 complete draws and 308 queue skips proves the original balanced speculative prime unsafe');
  assert.equal(shouldPrimeColdFullSceneCache(first({devicePixelRatio:1.5})), false,
    'higher DPR still shares the expensive capped balanced startup target');
  assert.equal(shouldPrimeColdFullSceneCache(first({quality:'balanced', renderScale:0.4})), false,
    'adaptive rescue is not permission to prime a new first scene without an original low-quality request');
});
test('existing explicitly low quality retains complete native 3D cache option without changing rendering budget or original test',async()=>{
  const { shouldPrimeColdFullSceneCache } = await modules;
  assert.equal(shouldPrimeColdFullSceneCache(first({quality:'low',renderScale:0.4})), true,
    'existing true low-mode 751x415 retains one complete HDR/depth/live cache attempt');
  assert.equal(shouldPrimeColdFullSceneCache(first({quality:'low',renderScale:0.4,queue:{supported:true,failed:false,submitted:1,completed:1,pending:0,skipped:0}})), false,
    'no cold bake after prior GPU draw');
  assert.match(renderer, /if \(!coldWorldPrime\) \{[\s\S]*?renderer\.render\(scene, camera\);[\s\S]*?return;/,
    'balanced first frame must remain complete original scene, not partial diagnostic scene');
  assert.match(renderer, /camera\.layers\.set\(STATIC_LAYER\);[\s\S]*?renderer\.render\(scene, camera\)/,
    'low prime must still render original complete static geometry');
  assert.match(renderer, /camera\.layers\.set\(DYNAMIC_LAYER\);[\s\S]*?renderer\.render\(scene, camera\)/,
    'low prime must still render original dynamic serpent/water/cues');
  assert.match(fs.readFileSync(path.join(root,'tests/browser/snake-stream.spec.cjs'),'utf8'),
    /expect\(animation\.actualDraws\)\.toBeGreaterThanOrEqual\(17\)/,
    'the unaltered strict >=17 genuine submissions test remains mandatory');
});
