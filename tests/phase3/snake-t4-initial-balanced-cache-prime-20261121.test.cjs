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
  cssWidth:1878,cssHeight:1038,renderScale:0.75,submittedAtWorldBuild:0,...overrides
});
test('RED: full immutable HDR/depth world cache can prime at source-original first BALANCED desktop frame, with no initial raster or quality reduction',async()=>{
  const {shouldPrimeColdFullSceneCache}=await rendererExports();
  assert.equal(shouldPrimeColdFullSceneCache(pristine()),true,'real original strict test begins at balanced 0.75, not low 0.4');
  assert.equal(shouldPrimeColdFullSceneCache(pristine({quality:'low',renderScale:0.4})),true);
  for(const unsafe of [
    {cssWidth:390,cssHeight:844,renderScale:0.75},
    {cssWidth:1280,cssHeight:720},
    {quality:'low',renderScale:0.75},
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
