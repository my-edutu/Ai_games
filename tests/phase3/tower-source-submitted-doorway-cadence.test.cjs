'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const helper = import('../../public/infinite-tower-climb/visuals/source-submitted-doorway-cadence.mjs');
const lens={sourceBound:true,coldOriginalArch:true,sourceTick:460};
const source={tick:460,floor:9,lifecycle:'running',player:{health:40}};
const view={camera:'follow',stale:false,reducedMotion:false};
test('authenticated physical gateway limits unseen camera travel after cold WebGL stall',async()=>{
  const {sourceSubmittedDoorwayCameraDt:choose,MAX_SOURCE_DOOR_CAMERA_STEP_SECONDS:cap}=await helper;
  assert.equal(choose(.5,lens,source,view),cap);
  assert.equal(choose(.02,lens,source,view),.02);
  for (const rate of [3.5,8,16]) {
    const abrupt=1-Math.exp(-.5*rate);
    const smooth=1-Math.exp(-choose(.5,lens,source,view)*rate);
    assert.ok(smooth<abrupt/1.5);
  }
});
test('camera cadence cannot affect non-gateway episodes, spectator, reduced-motion or failed source proof',async()=>{
  const {sourceSubmittedDoorwayCameraDt:choose}=await helper;
  for(const args of [
    [{...lens,coldOriginalArch:false},source,view],
    [{...lens,sourceBound:false},source,view],
    [{...lens,sourceTick:459},source,view],
    [lens,{...source,floor:8},view],
    [lens,{...source,player:{health:0}},view],
    [lens,{...source,lifecycle:'result'},view],
    [lens,source,{...view,camera:'overview'}],
    [lens,source,{...view,stale:true}],
    [lens,source,{...view,reducedMotion:true}],
    [null,source,view]
  ]) assert.equal(choose(.5,...args),.5);
});
test('actual 3D camera uses same source-bounded cadence across camera, gaze, rescue and optical stages',()=>{
  const scene=fs.readFileSync(require.resolve('../../public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
  assert.match(scene,/sourceSubmittedDoorwayCameraDt\(dt,coldArchLens,snapshot,options\)/);
  assert.match(scene,/Math\.exp\(-cameraDt \* cameraRate\)/);
  assert.match(scene,/camera\.aspect, cameraDt, actorOrbitTarget\)/);
  assert.match(scene,/guardianPortraitOpticalTarget,cameraDt\)/);
  assert.match(scene,/sourceDoorwayFrameSteps\(cameraDt,camera\.aspect\)/);
  assert.match(scene,/sourceSubmittedDoorwayCadence: \{/);
});
