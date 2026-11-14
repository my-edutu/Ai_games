'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const physical=import('../../public/infinite-tower-climb/visuals/source-physical-arrival-palette.mjs');

function originalCrossing(){
  const cap={id:'f8:cap',x:250000,y:80000,width:160000,height:2000};
  const exitX=cap.x+Math.floor(cap.width*.76);
  const crossingX=exitX+19000;
  const source={runToken:'original-retirement-campaign',lifecycle:'running',
    floor:9,theme:'void',tick:470,worldWidth:480000,chunkBaseY:80000,
    player:{x:crossingX+5000,y:100000,halfWidth:9000,halfHeight:18000,
      health:5,grounded:true,groundedPlatformId:'f9:ground',state:'standing',vy:0},
    platforms:[{id:'f9:ground',x:240000,y:80000,width:175000,height:2000}],
    lastGuardianCrossing:{runToken:'original-retirement-campaign',
      fromFloor:8,toFloor:9,sourceTick:451,cap,exitX,crossingX,
      halfWidth:9000,halfHeight:18000,
      guardian:{kind:'guardian',active:false,health:0}}};
  const held={guardianGateRetained:true,runToken:source.runToken,floor:9,
    oldRoofY:82000,thresholdX:exitX,sourceTick:460,crossingTick:451,
    submittedFrames:1,visibleSeconds:.06};
  return {source,held};
}
test('real 10m ascent fades EXISTING original gateway completely before bounded GPU retirement, not at an arbitrary 1.65s hard cut',async()=>{
  const {observedSourceGatewayDeparturePresence:presence}=await physical;
  const {source,held}=originalCrossing();
  source.tick=486;
  source.player={...source.player,y:200000,grounded:false,
    groundedPlatformId:null,state:'airborne',vy:500};
  held.submittedFrames=16;held.visibleSeconds=2.0;
  const fade=presence(source,held);
  assert.equal(fade?.sourceBound,true);
  assert.equal(fade?.wholeBodyCleared,true);
  assert.equal(fade?.opacity,0);
  assert.ok(fade.sourceProgress>=1 && fade.submittedProgress>=1);
  // A real browser/source clock without an actual submitted frame MUST
  // not consume the already-authored bronze door, however far the hero climbs.
  held.submittedFrames=0;held.visibleSeconds=0;
  assert.equal(presence(source,held)?.opacity,1);
});
test('new source-owned expiry is bounded and rejects forged guardian or run',async()=>{
  const {observedSourceGatewayDeparturePresence:presence}=await physical;
  const {source,held}=originalCrossing();
  source.tick=486;source.player={...source.player,y:200000,
    grounded:false,groundedPlatformId:null,state:'airborne',vy:500};
  held.submittedFrames=61;held.visibleSeconds=2;
  assert.equal(presence(source,held),null);
  held.submittedFrames=16;held.visibleSeconds=3;
  assert.equal(presence(source,held),null);
  held.visibleSeconds=2;
  assert.equal(presence({...source,runToken:'unrelated'},held),null);
  assert.equal(presence({...source,lastGuardianCrossing:{
    ...source.lastGuardianCrossing,
    guardian:{kind:'guardian',active:true,health:9}}},held),null);
});
test('retained original 3D roof and arch share a source-verified optical retirement rather than timer-only hard deletion',()=>{
  const world=fs.readFileSync(require.resolve('../../public/infinite-tower-climb/visuals/world.mjs'),'utf8');
  assert.match(world,/const sourceDeparture=\!options\.stale\s*\?observedSourceGatewayDeparturePresence\(snapshot,held\):null/);
  assert.match(world,/sourceDeparture\?\.sourceBound/);
  assert.match(world,/originalGatePresence<=\.01/);
  // Authentic disappearing geometry needs a returned all-transparent GPU frame.
  assert.match(world,/held\.opticalExitSubmitted===true/);
  assert.match(world,/held\.opticalExitSubmitted=held\.originalGatewayOpacity<=\.01/);
  assert.doesNotMatch(world,/if\s*\(held\.submittedFrames\s*>=\s*5\s*&&\s*held\.visibleSeconds\s*>=\s*RETAINED_CAP_SECONDS\)/);
});
