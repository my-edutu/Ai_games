'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const original=import('../../public/infinite-tower-climb/visuals/far-side-shaft-transition.mjs');
const arrival=import('../../public/infinite-tower-climb/visuals/crossfloor-arrival.mjs');
const palette=import('../../public/infinite-tower-climb/visuals/source-physical-arrival-palette.mjs');
function actualSill(){
  const cap={id:'f8:cap',x:115200,y:3212000,width:249600,height:12000};
  const exitX=cap.x+Math.floor(cap.width*.76);
  const source={runToken:'real-floor-9-source',lifecycle:'running',
    floor:9,theme:'void',tick:490,
    player:{x:exitX+25000,y:3238000,halfWidth:9000,
      halfHeight:14000,health:4,grounded:true,
      groundedPlatformId:'f9:ground',state:'standing',vy:0},
    platforms:[{id:'f9:ground',x:290000,y:3212000,width:115000,height:12000}],
    lastGuardianCrossing:{runToken:'real-floor-9-source',sourceTick:475,
      fromFloor:8,toFloor:9,cap,exitX,crossingX:exitX+16200,
      halfWidth:9000,halfHeight:14000,
      guardian:{kind:'guardian',active:false,health:0}}};
  const held={runToken:source.runToken,floor:9,guardianGateRetained:true,
    verifiedObservedFloorAdvance:true,oldCapId:cap.id,
    oldCapX:cap.x,oldCapWidth:cap.width,oldRoofY:3224000,
    thresholdX:exitX,crossingTick:475,
    firstWorldRenderTick:475,sourceTick:475,
    submittedFrames:2,visibleSeconds:.18,
    originalGatewayOpacity:.96,opticalExitSubmitted:false,
    originalDeckSurface:{opacity:1},
    originalGalleryMaterials:[{opacity:.94}]};
  const job={state:'awaiting-structural-release',proof:'recorded-source-gateway',
    structureDeferred:true,runToken:source.runToken,floor:9,
    sourceTick:475,submittedFrames:3,structureBuiltAtSubmitted:1};
  return {source,held,job};
}
test('same original grounded roof and HP-zero gateway expose real successor depth before raised landing',async()=>{
  const {observedEarnedSillDepthExposure:observe}=await original;
  const {observedPrebuiltVoidShaftRelease:release}=await arrival;
  const {sourceOwnedOriginalArchitectureCoverage:coverage}=await palette;
  const a=actualSill(),immutable=JSON.stringify(a);
  const witness=observe(a.source,a.held,a.job);
  assert.equal(witness?.sourceBound,true);
  assert.equal(witness?.originalRoofContact,true);
  assert.equal(witness?.maxDepthReveal,.28);
  assert.equal(release(a.source,null,a.held,a.job,
    {sourceBound:true,sourceTick:490,opacity:.96}),true,
    'already-built F9 depth should appear while the REAL old gate stays solid');
  assert.ok(coverage(a.source,a.held)<=.72+1e-8,
    'existing next-floor shaft must have >0 depth opacity before raised jump');
  assert.equal(a.held.originalGatewayOpacity,.96,
    'scenic shaft cannot erase the physical original guardian gate');
  assert.equal(JSON.stringify(a),immutable,'no gameplay, mesh or source histories mutated');
});
test('real low airborne departure shares the same threshold before 7m climb',async()=>{
  const {observedEarnedSillDepthExposure:observe}=await original;
  const a=actualSill();a.source.tick=495;
  a.source.player.y=a.held.oldRoofY+55000+a.source.player.halfHeight;
  a.source.player.grounded=false;a.source.player.groundedPlatformId=null;
  a.source.player.state='airborne';a.source.player.vy=1000;
  assert.equal(observe(a.source,a.held,a.job)?.originalLowFlight,true);
  a.source.player.y=a.held.oldRoofY+81000+a.source.player.halfHeight;
  assert.equal(observe(a.source,a.held,a.job),null,
    'the near-sill scene must not be extended into the raised-floor world');
});
test('no old/new 3D overlap on fabricated win, stale run, missing F9 support or unreturned shaft',async()=>{
  const {observedEarnedSillDepthExposure:observe}=await original;
  const {observedPrebuiltVoidShaftRelease:release}=await arrival;
  const a=actualSill();
  for(const altered of [
    {...a.source,runToken:'wrong'},
    {...a.source,floor:10},
    {...a.source,tick:560},
    {...a.source,player:{...a.source.player,health:0}},
    {...a.source,player:{...a.source.player,groundedPlatformId:'f9:p3'}},
    {...a.source,player:{...a.source.player,x:a.held.thresholdX}},
    {...a.source,lastGuardianCrossing:{...a.source.lastGuardianCrossing,
      guardian:{kind:'guardian',active:true,health:1}}}
  ]) assert.equal(observe(altered,a.held,a.job),null);
  assert.equal(observe(a.source,{...a.held,submittedFrames:0},a.job),null);
  assert.equal(observe(a.source,{...a.held,originalGatewayOpacity:.3},a.job),null);
  assert.equal(observe(a.source,a.held,{...a.job,submittedFrames:1}),null);
  assert.equal(observe(a.source,a.held,{...a.job,structureDeferred:false}),null);
  assert.equal(release(a.source,null,a.held,{...a.job,
    submittedFrames:1},null),false);
});
