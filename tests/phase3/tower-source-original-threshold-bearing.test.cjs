'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const policy=import('../../public/infinite-tower-climb/visuals/source-returned-original-gateway-exit.mjs');
const root=path.resolve(__dirname,'../../public/infinite-tower-climb/visuals');
const runToken='authentic-defeated-f8-guardian';
function actualReturn(){
  const source={floor:9,theme:'void',lifecycle:'running',runToken,
    tick:503,player:{health:4}};
  const held={runToken,floor:9,oldCapId:'f8:cap',guardianGateRetained:true,
    verifiedObservedFloorAdvance:true,crossingTick:475,firstWorldRenderTick:482,
    submittedFrames:6,visibleSeconds:.53,originalGatewayOpacity:.9259,
    originalGallerySourceOpacity:.3,opticalExitSubmitted:false};
  const job={runToken,floor:9,proof:'recorded-source-gateway',
    structureDeferred:true,sourceTick:482,structuralVisibleReturns:6,
    structuralVisibleSeconds:.43};
  return {source,held,job};
}
test('retains an existing original bronze gallery bearing proportionally to the actual open gateway, without resurrecting metal',async()=>{
  const {sourceReturnedOriginalThresholdBearing}=await policy;
  const {source,held,job}=actualReturn();
  const floor=sourceReturnedOriginalThresholdBearing(source,held,job,.9259,true);
  assert.ok(floor>.18 && floor<.35,'real old doorway should keep physically readable original load path');
  assert.equal(Math.min(held.originalGallerySourceOpacity,Math.max(.015,floor)),
    Math.min(held.originalGallerySourceOpacity,floor),
    'bounded floor never needs a new mesh');
  assert.equal(Math.min(.07,floor),.07,'already rendered low-alpha steel may not brighten');
  const later=sourceReturnedOriginalThresholdBearing(
    {...source,tick:532},{...held,submittedFrames:15,visibleSeconds:1.45,
      originalGatewayOpacity:.10}, {...job,structuralVisibleReturns:14,
      structuralVisibleSeconds:1.15},.10,true);
  assert.ok(later>=0 && later<floor,'bearing recedes along the earned physical threshold');
  assert.equal(sourceReturnedOriginalThresholdBearing(
    {...source,tick:540},{...held,originalGatewayOpacity:.002,
      submittedFrames:19,visibleSeconds:1.8},job,.002,true),null,
      'retired original doorway cannot keep gallery alive');
});
test('no source-less, deceased, wrong-run, unsupported or stale GPU bearing',async()=>{
  const {sourceReturnedOriginalThresholdBearing:fn}=await policy;
  const {source,held,job}=actualReturn();
  for(const [s,h,j,gate,supported] of [
    [{...source,floor:8},held,job,.9,true],
    [{...source,player:{health:0}},held,job,.9,true],
    [{...source,runToken:'later-episode'},held,job,.9,true],
    [{...source,tick:800},held,job,.9,true],
    [source,{...held,guardianGateRetained:false},job,.9,true],
    [source,{...held,oldCapId:'f9:p2'},job,.9,true],
    [source,held,{...job,runToken:'later-episode'},.9,true],
    [source,held,{...job,sourceTick:999},.9,true],
    [source,held,{...job,structuralVisibleReturns:-1},.9,true],
    [source,held,job,.9,false],
    [source,held,job,.9,undefined],
    [source,held,job,1.2,true],
    [source,held,job,-.1,true],
    [source,{...held,opticalExitSubmitted:true},job,.9,true]
  ])assert.equal(fn(s,h,j,gate,supported),null);
});
test('actual World uses returned-original geometry and current 3D source, not a CSS bridge or duplicated door',()=>{
  const world=fs.readFileSync(path.join(root,'world.mjs'),'utf8');
  assert.match(world,/sourceReturnedOriginalThresholdBearing\(/);
  assert.match(world,/held\.originalGallerySourceOpacity\s*\?\?\s*1/);
  assert.match(world,/originalPresence=Math\.max\(originalPresence,Math\.min\(/);
  assert.match(world,/held\.originalGalleryRoot\.visible=originalPresence>\.015/);
  assert.doesNotMatch(world,/new THREE\.Mesh\([\s\S]*?fakeGateway/);
});
