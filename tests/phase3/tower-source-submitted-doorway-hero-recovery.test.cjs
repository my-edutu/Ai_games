'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const policy=import('../../public/infinite-tower-climb/visuals/source-submitted-doorway-cadence.mjs');
const lens={sourceBound:true,coldOriginalArch:true,sourceTick:521};
const source={tick:521,floor:9,lifecycle:'running',player:{health:65}};
const view={camera:'follow',stale:false,reducedMotion:false};
const frame={sourceTick:521,aspect:390/844,maxAbsX:.65,maxAbsY:.75,depthValid:true};

test('cold gateway keeps 25fps camera smoothing when original full skinned actor is safely framed',async()=>{
  const {sourceSubmittedDoorwayCameraDt:cap,sourceCroppedHeroRecoveryDt:recover}=await policy;
  const cold=cap(.5,lens,source,view);
  assert.equal(cold,1/25);
  assert.equal(recover(.5,cold,frame,lens,source,view),cold);
  assert.equal(recover(.02,cap(.02,lens,source,view),frame,lens,source,view),.02);
});
test('authentically clipped portrait hero can recover more camera travel during a 0.8s first F9 render stall',async()=>{
  const {sourceCroppedHeroRecoveryDt:recover}=await policy;
  const cold=1/25;
  for(const visibleFailure of [
    {maxAbsX:.86},
    {maxAbsY:.93},
    {depthValid:false},
  ]){
    const changed=recover(.5,cold,{...frame,...visibleFailure},lens,source,view);
    assert.equal(changed,.14,'bounded emergency camera budget, never 0.5s teleport');
    assert.ok(changed>cold);
  }
  assert.equal(recover(.5,cold,{...frame,aspect:960/600,maxAbsX:.86},lens,source,
    view),cold,'landscape has a separately generous horizontal safety zone');
  assert.equal(recover(.5,cold,{...frame,aspect:960/600,maxAbsX:.92},lens,source,view),.14);
});
test('no fabricated camera urgency from unrelated source, malformed projection or accessibility mode',async()=>{
  const {sourceCroppedHeroRecoveryDt:recover}=await policy;
  const clip={...frame,maxAbsY:1.2};
  for(const args of [
    [clip,{...lens,sourceTick:520},source,view],
    [clip,lens,{...source,runToken:'other',floor:8},view],
    [clip,lens,{...source,lifecycle:'result'},view],
    [clip,lens,source,{...view,stale:true}],
    [clip,lens,source,{...view,camera:'overview'}],
    [clip,lens,source,{...view,reducedMotion:true}],
    [{...clip,sourceTick:520},lens,source,view],
    [{...clip,maxAbsY:NaN},lens,source,view],
    [{...clip,aspect:0},lens,source,view]
  ])assert.equal(recover(.5,.04,...args),.04);
  assert.equal(recover(.5,.04,{...clip,maxAbsY:1.1},lens,source,view),.14);
});
test('actual three scene measures original source body in current physical camera before overriding cold cadence',()=>{
  const scene=fs.readFileSync('public/infinite-tower-climb/visuals/scene.mjs','utf8');
  assert.match(scene,/sourceSubmittedDoorwayCameraDt\(dt,coldArchLens,snapshot,options\)/);
  assert.match(scene,/sourceCroppedHeroRecoveryDt\(dt,cameraDt,/);
  assert.match(scene,/camera\.updateMatrixWorld\(true\)/);
  assert.match(scene,/actorSafeProjection\.copy\(climber\.group\.position\)\.project\(camera\)/);
  assert.match(scene,/p\.halfHeight\s*\/\s*SCALE/);
  assert.match(scene,/sourceTick:\s*snapshot\.tick/);
  assert.match(scene,/sourceDoorwayFrameSteps\(cameraDt,camera\.aspect\)/);
  assert.doesNotMatch(scene,/snapshot\.player\.(?:x|y|vx|vy|floor)\s*=/);
});
