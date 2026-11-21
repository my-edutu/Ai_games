'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(root, 'public/snake-stream/renderer.mjs'), 'utf8');
let exportsPromise;
function rendererExports(){ return exportsPromise ||= import('data:text/javascript;base64,'+Buffer.from(source.replace(/^import\s+.*?;\s*$/gm,'')).toString('base64')); }
const pristine = (overrides={})=>({
  queue:{supported:true,failed:false,submitted:0,completed:0,pending:0,skipped:0},
  quality:'balanced',cameraMode:'overview',frameCount:0,staticMeshes:13,cacheSupported:true,cacheHit:false,
  cssWidth:1878,cssHeight:1038,devicePixelRatio:1,renderScale:Math.sqrt(768000/(1878*1038)),submittedAtWorldBuild:0,...overrides
});
test('measured startup 1/17 regression rejects speculative balanced cold prime; exact low-mode original raster remains eligible',async()=>{
  const {shouldPrimeColdFullSceneCache}=await rendererExports();
  assert.equal(shouldPrimeColdFullSceneCache(pristine()),false,'eb4 genuine full-quality prime regressed the original strict 1-second gate to 1/17; do not bake HDR before a completed fence');
  assert.equal(shouldPrimeColdFullSceneCache(pristine({quality:'low',renderScale:0.4})),true);
  assert.equal(shouldPrimeColdFullSceneCache(pristine({devicePixelRatio:1.5,renderScale:Math.sqrt(768000/(1878*1038))})),false, 'R53 still clamps expensive balanced desktop to the same raster: no unproved cold prime');
  for(const unsafe of [
    {cssWidth:390,cssHeight:844,renderScale:1},
    {cssWidth:1280,cssHeight:720},
    {quality:'low',renderScale:0.75},
    {quality:'balanced',renderScale:0.75},
    {quality:'balanced',renderScale:0.4},
    {cameraMode:'follow'}, {cameraMode:'detail'}, {frameCount:1},{staticMeshes:0},{cacheSupported:false},
    {cacheHit:true},{submittedAtWorldBuild:1},
    {queue:{supported:true,failed:false,submitted:0,completed:0,pending:1,skipped:0}},
    {queue:{supported:true,failed:false,submitted:1,completed:1,pending:0,skipped:0}},
    {queue:{supported:true,failed:true,submitted:0,completed:0,pending:0,skipped:0}},
    {queue:{supported:false,failed:false,submitted:0,completed:0,pending:0,skipped:0}},
  ]) assert.equal(shouldPrimeColdFullSceneCache(pristine(unsafe)),false,JSON.stringify(unsafe));
});
test('RED: actual pristine complete-scene admission draws original native static HDR+depth plus ALL live entity passes and a real GPU-gated complete submission',()=>{
  assert.match(source,/const coldWorldPrime = shouldPrimeColdFullSceneCache\(/);
  assert.match(source,/if \(!cacheAdmissionReady && !shouldAdmitFullSceneCache\(/);
  assert.match(source,/if \(!coldWorldPrime\) \{[\s\S]*?renderer\.render\(scene, camera\);[\s\S]*?return;/);
  assert.match(source,/camera\.layers\.set\(STATIC_LAYER\);[\s\S]*?renderer\.setRenderTarget\(staticTarget\);[\s\S]*?renderer\.render\(scene, camera\)/);
  assert.match(source,/camera\.layers\.set\(DYNAMIC_LAYER\);[\s\S]*?liveCacheQuad\.visible = true;[\s\S]*?renderer\.render\(scene, camera\)/);
  assert.match(source,/if \(!frameGate\.canDraw\(\)\) return false;/);
  assert.match(source,/frameGate\.submitted\(\)/);
  assert.match(source,/coldWorldPrimes/,'source-exact evidence counter, NOT fake draw/present');
  assert.doesNotMatch(source,/partialSceneFastPath|pretendPresent|fakeFrameCount/);
  assert.match(fs.readFileSync(path.join(root,'tests/browser/snake-stream.spec.cjs'),'utf8'),/expect\(animation\.actualDraws\)\.toBeGreaterThanOrEqual\(17\)/);
});
