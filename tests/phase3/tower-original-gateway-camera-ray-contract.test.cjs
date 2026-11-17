'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const modulePath='../../public/infinite-tower-climb/visuals/original-gateway-camera-ray-contract.mjs';
const loaded=import(modulePath);
const observed=(overrides={})=>({
  active:true,rays:9,bodyBlockedRays:2,gatewayBlockedRays:1,score:5,
  originalGateBlockedRays:1,originalCapBlockedBodyRays:1,
  originalCapBlockedGatewayRays:0,architectureBlockedRays:0,
  ...overrides
});
test('a projected hero/opened gate does not excuse a new genuine old-cap or Void bearing obstruction',async()=>{
  const {assessOriginalGatewayPhysicalCameraBridge:compare}=await loaded;
  const before=observed();
  assert.deepEqual(compare(before,observed({
    bodyBlockedRays:1,gatewayBlockedRays:1,score:3,
    originalCapBlockedBodyRays:0})),{
    allowed:true,reason:'actual-geometry-improved',gain:2
  });
  assert.equal(compare(observed({bodyBlockedRays:0,gatewayBlockedRays:0,score:0,
    originalGateBlockedRays:0,originalCapBlockedBodyRays:0}),
    observed({bodyBlockedRays:1,gatewayBlockedRays:0,score:2,
      originalGateBlockedRays:0})).allowed,false);
  assert.equal(compare(before,observed({
    bodyBlockedRays:1,gatewayBlockedRays:1,score:3,
    architectureBlockedRays:1,originalCapBlockedBodyRays:0})).allowed,false,
    'a new physical Void support obstruction cannot buy a prettier old gate shot');
  assert.equal(compare(before,observed()).reason,
    'no-physical-sightline-improvement');
  const clear=observed({bodyBlockedRays:0,gatewayBlockedRays:0,score:0,
    originalGateBlockedRays:0,originalCapBlockedBodyRays:0});
  assert.equal(compare(clear,clear).allowed,true);
  assert.equal(compare(null,clear).allowed,false);
  assert.equal(compare(clear,{...clear,rays:3}).allowed,false);
  assert.equal(compare(clear,{...clear,score:-1}).allowed,false);
  assert.equal(compare(clear,{...clear,originalCapBlockedBodyRays:1}).allowed,false);
  assert.equal(compare(clear,{...clear,score:2}).allowed,false);
});
test('original real F8 lens is checked against the same CURRENT source-owned F9 triangles before accepting the camera',()=>{
  const text=fs.readFileSync(path.resolve(__dirname,
    '../../public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
  assert.match(text,/assessOriginalGatewayPhysicalCameraBridge\(\s*bridgePhysicalBefore,bridgePhysicalAfter\)/);
  assert.match(text,/world\.measureSuccessorDeckVisibility\(\s*snapshot,camera\.position,thresholdHero,p\.halfHeight\/SCALE,\s*thresholdGate/);
  assert.match(text,/bridgeProjectionAndCoreSafe && bridgePhysical\.allowed/);
  assert.match(text,/originalGatewayCameraPhysicalVetoed/);
});
