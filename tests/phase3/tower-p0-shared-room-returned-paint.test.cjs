'use strict';
// One authentic F8 HP-zero threshold must own the already-returned F9 room
// materials until actual successor GPU submissions, not advance by HUD,
// source poll, or unreturned cold WebGL rebuild.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const modulePromise=import('../../public/infinite-tower-climb/visuals/source-physical-arrival-palette.mjs');
const cap={id:'f8:cap',kind:'oneway',x:115200,y:3212000,width:249600,height:12000};
const threshold=cap.x+Math.floor(cap.width*.76);
const token='same-guardian-crusher-win';
function scene(){
  const body={health:5,grounded:true,state:'standing',vy:0,
    groundedPlatformId:'f9:ground',x:threshold+15000,y:3238000,
    halfWidth:9000,halfHeight:14000};
  const source={runToken:token,lifecycle:'running',floor:9,theme:'void',
    tick:483,player:body,
    platforms:[{id:'f9:ground',x:0,y:cap.y,width:480000,height:cap.height}],
    lastGuardianCrossing:{runToken:token,sourceTick:475,fromFloor:8,toFloor:9,
      cap,exitX:threshold,crossingX:threshold+13000,
      halfWidth:9000,halfHeight:14000,
      guardian:{kind:'guardian',active:false,health:0}}};
  const held={runToken:token,floor:9,oldCapId:'f8:cap',
    guardianGateRetained:true,verifiedObservedFloorAdvance:true,
    oldCapX:cap.x,oldCapWidth:cap.width,oldRoofY:cap.y+cap.height,
    thresholdX:threshold,sourceTick:476,crossingTick:475,
    firstWorldRenderTick:476,submittedFrames:2,visibleSeconds:.16,
    originalGatewayOpacity:1,originalDeckSurface:{opacity:1},
    originalArchitectureCoverage:1,originalGalleryMaterials:[],
    opticalExitSubmitted:false};
  const job={runToken:token,floor:9,proof:'recorded-source-gateway',
    structureDeferred:true,sourceTick:476,structuralVisibleReturns:0};
  return {source,held,job};
}
test('original guardian roof and returned WebGL shared room use one monotone painted palette, not floor-HUD jump',async()=>{
  const {observedReturnedSharedRoomPalette:proof}=await modulePromise;
  const {source,held,job}=scene();
  const weights=[0,1,2,3,4,5,6].map(n=>
    proof(source,held,{...job,structuralVisibleReturns:n})?.oldWeight??0);
  assert.equal(weights[0],1,'before new shaft returns the genuine bronze room remains');
  assert.equal(weights[1],1,'first returned new-room frame cannot erase entire gateway');
  assert.ok(weights[2]<weights[1] && weights[2]>.5);
  assert.ok(weights[3]<weights[2] && weights[3]>.1);
  assert.ok(weights[4]<weights[3] && weights[4]>0);
  assert.ok(weights[5]<weights[4]);
  assert.equal(weights[6],0,'eventual returned new-room completion is not indefinitely pinned');
  assert.ok(weights.every((v,i)=>i===0||v<=weights[i-1]),
    'successful native GPU submissions, not source motion alone, earn the architectural palette exit');
});
test('no authentic crossing, wrong run, missing original paint, stalled GPU or unsupported body cannot certify shared room',async()=>{
  const {observedReturnedSharedRoomPalette:proof}=await modulePromise;
  const {source,held,job}=scene();
  const reject=[
    [{...source,floor:8},held,job],
    [{...source,runToken:'foreign'},held,job],
    [{...source,lastGuardianCrossing:null},held,job],
    [{...source,lastGuardianCrossing:{...source.lastGuardianCrossing,
      guardian:{kind:'guardian',active:true,health:1}}},held,job],
    [{...source,lastGuardianCrossing:{...source.lastGuardianCrossing,
      cap:{...cap,x:cap.x+10}}},held,job],
    [{...source,platforms:[{...source.platforms[0],y:3200000}]},held,job],
    [{...source,player:{...source.player,grounded:false}},held,job],
    [{...source,player:{...source.player,groundedPlatformId:'f9:imaginary'}},held,job],
    [source,{...held,submittedFrames:0},job],
    [source,{...held,firstWorldRenderTick:999},job],
    [source,{...held,originalGatewayOpacity:0},job],
    [source,{...held,originalDeckSurface:{opacity:0}},job],
    [source,{...held,guardianGateRetained:false},job],
    [source,held,{...job,runToken:'foreign'}],
    [source,held,{...job,proof:'floor-number-only'}],
    [source,held,{...job,structureDeferred:false}],
    [source,held,{...job,sourceTick:480}],
    [source,held,{...job,structuralVisibleReturns:-1}]
  ];
  for(const [s,h,j] of reject)
    assert.equal(proof(s,h,j),null,'unearned image/route may not hold previous biome');
});
test('original far roof architectural coverage fades by actually submitted frames instead of instantaneous full-screen wipe',async()=>{
  const {sourceOwnedOriginalArchitectureCoverage:coverage}=await modulePromise;
  const {source,held}=scene();
  const far={...source,tick:490,player:{...source.player,
      x:threshold+160000},
    lastGuardianCrossing:{...source.lastGuardianCrossing}};
  const first={...held,sourceTick:481,firstWorldRenderTick:481,
    crossingTick:null,submittedFrames:2,visibleSeconds:.1};
  const early=coverage(far,first);
  const next=coverage(far,{...first,submittedFrames:5,visibleSeconds:.55});
  const late=coverage(far,{...first,submittedFrames:9,visibleSeconds:1.25});
  assert.ok(early>.8 && early<=1,'one cold GPU return cannot reveal a complete unrelated violet world');
  assert.ok(next>0 && next<early,'the actual old room begins to clear only as successful renders accrue');
  assert.ok(late>=0 && late<next,'a returned coherent room can ultimately leave the authentic next floor');
  assert.equal(coverage({...far,lastGuardianCrossing:null},first),1,
    'without recorded HP-zero the old opaque architecture is not waived');
});
