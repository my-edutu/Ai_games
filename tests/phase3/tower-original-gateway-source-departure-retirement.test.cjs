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

test('genuine Floor 9 route reversal retains SAME GPU bronze gateway until a real elevated departure, never invents crossing',async()=>{
  const {observedSourcePhysicalArrivalPalette:palette,
    observedSourceGatewayDeparturePresence:presence,
    SOURCE_GATEWAY_RETURN_TOLERANCE:tolerance}=await physical;
  const {source,held}=originalCrossing();
  // Actual source-pinned 20Hz guardian film: the first Floor 9 AI route
  // doubles back roughly 6,300 units after source tick 475, then climbs.
  source.tick=490;
  source.player.x=source.lastGuardianCrossing.crossingX-6300;
  held.firstWorldRenderTick=476;
  held.submittedFrames=1;
  const before=JSON.stringify({source,held});
  const aligned=palette(source,held),door=presence(source,held);
  assert.equal(aligned?.sourceBound,true);
  assert.equal(aligned.travel,-6300);
  assert.equal(aligned.horizontalProgress,0);
  assert.equal(door?.sourceBound,true);
  assert.equal(door.wholeBodyCleared,false);
  assert.equal(door.opacity,1);
  assert.equal(JSON.stringify({source,held}),before,'presentation cannot change fixed-step source');
  // Actual ascent can complete the original-deck departure while moving
  // slightly backward horizontally; no fabricated forward progress.
  source.tick=505;
  source.player={...source.player,y:180000,grounded:false,
    groundedPlatformId:null,state:'airborne',vy:500};
  held.submittedFrames=4;held.visibleSeconds=.7;
  const climbed=palette(source,held);
  assert.equal(climbed?.sourceBound,true);
  assert.equal(climbed.horizontalProgress,0);
  assert.equal(climbed.verticalProgress,1);
  assert.ok(presence(source,held)?.opacity>.5,
    'four returns must not hard replace old and new architectures');
  held.submittedFrames=8;held.visibleSeconds=1.22;
  assert.equal(presence(source,held)?.opacity,0);
  // A huge rewind, a forged guardian or a wrong run cannot resurrect the gate.
  source.player.x=source.lastGuardianCrossing.crossingX-tolerance-1;
  assert.equal(palette(source,held),null);
  assert.equal(presence(source,held),null);
  source.player.x=source.lastGuardianCrossing.crossingX-6300;
  source.lastGuardianCrossing.guardian.active=true;
  assert.equal(palette(source,held),null);
});


test('genuine painted bronze gateway persists for bounded original-camera returns after fixed-step source outruns the renderer',async()=>{
  const {observedCertifiedOriginalGatewayOpticalLease:lease}=await physical;
  const {source,held}=originalCrossing();
  const cap=source.lastGuardianCrossing.cap;
  held.oldCapId='f8:cap';held.oldCapX=cap.x;held.oldCapWidth=cap.width;
  held.verifiedObservedFloorAdvance=true;held.firstWorldRenderTick=470;
  held.submittedFrames=2;held.visibleSeconds=.16;
  held.lastSourceOldGateOpacity=.82;
  source.tick=578; // 127 fixed ticks after true HP-zero crossing
  source.lastGuardianCrossing=null; // short-lived source receipt expired
  source.player={...source.player,y:220000,grounded:false,
    groundedPlatformId:null,state:'airborne',vy:300};
  const handoff={runToken:source.runToken,retiring:true,
    retirementFrames:2,retirementSeconds:.16,retirementStartProgress:.2,
    lastVerifiedProof:{runToken:source.runToken,sourceTick:535,
      crossingTick:451,kind:'recorded-source-zero-hp'}};
  const firstUnsupportedSource=lease(source,held,{
    ...handoff,retiring:false,retirementFrames:0,retirementSeconds:0});
  assert.equal(firstUnsupportedSource?.opacity,held.lastSourceOldGateOpacity,
    'same authenticated GPU owner cannot be deleted before palette retirement is marked');
  const before=JSON.stringify([source,held,handoff]);
  const intact=lease(source,held,handoff);
  assert.equal(intact?.historicalOpticalTail,true);
  assert.ok(intact.opacity>0 && intact.opacity<held.lastSourceOldGateOpacity);
  assert.equal(intact.sourceBound,undefined,'optical history cannot create a new guardian victory');
  assert.equal(JSON.stringify([source,held,handoff]),before);
  assert.equal(lease({...source,runToken:'another'},held,handoff),null);
  assert.equal(lease({...source,floor:10},held,handoff),null);
  assert.equal(lease({...source,player:{...source.player,health:0}},held,handoff),null);
  assert.equal(lease({...source,tick:610},held,handoff),null,
    'a source tick above the original 150-tick lease must not retain former-floor geometry');
  assert.equal(lease({...source,lastGuardianCrossing:{...originalCrossing().source.lastGuardianCrossing,
    guardian:{kind:'guardian',active:true,health:1}}},held,handoff),null);
  assert.equal(lease(source,{...held,oldCapWidth:0},handoff),null);
  assert.equal(lease(source,held,{...handoff,lastVerifiedProof:{...handoff.lastVerifiedProof,runToken:'wrong'}},),null);
  assert.equal(lease(source,held,{...handoff,retirementSeconds:.25}),null,
    'two GPU returns cannot represent 250ms of successful displayed frames');
  assert.equal(lease(source,held,{...handoff,retirementFrames:10,retirementSeconds:1}),null,
    'historical geometry must fully retire after authentic 0.95s and five GPU returns');
});
test('real original retained world shares physically witnessed lease and cannot delete already-submitted gateway prematurely',()=>{
  const world=fs.readFileSync(require.resolve('../../public/infinite-tower-climb/visuals/world.mjs'),'utf8');
  assert.match(world,/observedCertifiedOriginalGatewayOpticalLease\(snapshot,held,sourceEarnedBearingHandoff\)/);
  assert.match(world,/!onNewRoof && !opticalLease/);
  assert.match(world,/sourceDeparture\?\.opacity\?\?opticalLease\?\.opacity\?\?1/);
  assert.match(world,/sourceOwnedOriginalArchitectureCoverage/);
});
