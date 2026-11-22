'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const policies=import('../../public/infinite-tower-climb/visuals/far-side-shaft-transition.mjs');

function nativeGeometry(){
  const cap={id:'f8:cap',x:115200,y:3212000,width:249600,height:12000};
  const sill=cap.x+Math.floor(cap.width*.76);
  const roof={id:'f9:ground',x:240000,y:3212000,width:180000,height:12000};
  const source={floor:9,theme:'void',lifecycle:'running',runToken:'real-door-episode',
    tick:502,player:{x:333296,y:3238000,halfWidth:9000,halfHeight:14000,
      health:4,grounded:true,groundedPlatformId:'f9:ground',
      state:'standing',vy:0},platforms:[roof],
    lastGuardianCrossing:{runToken:'real-door-episode',fromFloor:8,toFloor:9,
      sourceTick:475,exitX:sill,cap,
      guardian:{kind:'guardian',active:false,health:0}}};
  const held={runToken:source.runToken,floor:9,oldCapId:'f8:cap',
    guardianGateRetained:true,verifiedObservedFloorAdvance:true,
    oldCapX:cap.x,oldCapWidth:cap.width,oldRoofY:3224000,
    thresholdX:sill,crossingTick:475,firstWorldRenderTick:476,
    originalGatewayOpacity:.9845,opticalExitSubmitted:false,
    submittedFrames:8,visibleSeconds:.48};
  const job={runToken:source.runToken,floor:9,proof:'recorded-source-gateway',
    structureDeferred:true,sourceTick:476,
    state:'awaiting-structural-submission',
    submittedFrames:8,structureBuiltAtSubmitted:2,
    structuralVisibleReturns:3,structuralFade:.22,
    structuralRoot:{isGroup:true,visible:true}};
  return {source,held,job};
}

test('real HP-zero guardian, cleared feet on walkable F9 roof and returned incoming shaft begin the original gate fade before the p2 jump',async()=>{
  const {observedReturnedGroundedGatewayFadeStart:start}=await policies;
  const fixture=nativeGeometry(),before=JSON.stringify(fixture);
  const receipt=start(fixture.source,fixture.held,fixture.job);
  assert.equal(receipt?.sourceBound,true);
  assert.equal(receipt?.groundedRealReceivingRoof,true);
  assert.equal(receipt?.incomingReturnedFrames,3);
  assert.equal(JSON.stringify(fixture),before,'never mutate source or renderer evidence');
});

test('no invented departure from an unopened gate, stale episode, fake landing, insufficient GPU returns or mere foot-to-sill contact',async()=>{
  const {observedReturnedGroundedGatewayFadeStart:start}=await policies;
  const a=nativeGeometry(),q=(source=a.source,held=a.held,job=a.job)=>
    start(source,held,job);
  assert.equal(q({...a.source,runToken:'foreign'}),null);
  assert.equal(q({...a.source,floor:8}),null);
  assert.equal(q({...a.source,lifecycle:'outcome'}),null);
  assert.equal(q({...a.source,player:{...a.source.player,health:0}}),null);
  assert.equal(q({...a.source,player:{...a.source.player,
    x:a.held.thresholdX+19000}}),null,
    'whole width must be farther than 12m past real gate');
  assert.equal(q({...a.source,player:{...a.source.player,grounded:false,
    state:'airborne'}}),null);
  assert.equal(q({...a.source,player:{...a.source.player,
    groundedPlatformId:'f9:ghost'}}),null);
  assert.equal(q({...a.source,player:{...a.source.player,y:3237000}}),null);
  assert.equal(q({...a.source,lastGuardianCrossing:{...a.source.lastGuardianCrossing,
    guardian:{kind:'guardian',active:true,health:2}}}),null);
  assert.equal(q(a.source,{...a.held,oldRoofY:3225000}),null);
  assert.equal(q(a.source,{...a.held,submittedFrames:30}),null);
  assert.equal(q(a.source,a.held,{...a.job,structuralVisibleReturns:0}),null);
  assert.equal(q(a.source,a.held,{...a.job,structuralRoot:{isGroup:true,
    visible:false}}),null);
  assert.equal(q(a.source,a.held,{...a.job,runToken:'wrong'}),null);
});

test('source-earned roof exit respects real successor structural frames and actual display time before the thirty-return safety ceiling',async()=>{
  const {observedReturnedFarSideFade:fade}=await policies;
  const {held,job}=nativeGeometry();
  held.farSideFadeStartSubmitted=8;
  held.farSideFadeStartSeconds=.48;
  job.structuralVisibleSeconds=0;
  assert.equal(fade(held,{...job,structuralVisibleReturns:0}),0,
    'a deferred shader is not a returned next room');
  const intermediate=fade({...held,submittedFrames:18,visibleSeconds:.88},{
    ...job,structuralVisibleReturns:4,structuralVisibleSeconds:.32});
  assert.ok(intermediate>0&&intermediate<.6,
    'old and new geometry can coexist without erasing the doorway early');
  assert.ok(fade({...held,submittedFrames:29,visibleSeconds:1.32},{
    ...job,structuralVisibleReturns:4,structuralVisibleSeconds:.32})<.6,
    'twenty-one old returns cannot substitute for missing incoming scene submissions');
  assert.equal(fade({...held,submittedFrames:29,visibleSeconds:1.32},{
    ...job,structuralVisibleReturns:8,structuralVisibleSeconds:.72}),1,
    'real returned successor scene can complete the source-earned overlap before bounded retirement');
  assert.ok(fade({...held,submittedFrames:29,visibleSeconds:.53},{
    ...job,structuralVisibleReturns:8,structuralVisibleSeconds:.72})<.02,
    'old-room return elapsed time still vetoes a premature replacement');
  assert.equal(fade({...held,submittedFrames:29,visibleSeconds:.47},{
    ...job,structuralVisibleReturns:8,structuralVisibleSeconds:.72}),null);
});

test('source-tested grounded gateway handoff drives SAME real World original gate/gallery, not a second fake room',()=>{
  const world=fs.readFileSync(path.resolve(__dirname,
    '../../public/infinite-tower-climb/visuals/world.mjs'),'utf8');
  assert.match(world,/observedReturnedGroundedGatewayFadeStart\(\s*snapshot,held,deferredDistantArrival\)/);
  assert.match(world,/const earnedRoomDeparture=farSide \|\| returnedGroundedSill/);
  assert.match(world,/const originalGatePresence=sourceReturnedOriginalGatewayOpacity\(/);
  assert.match(world,/snapshot,held,deferredDistantArrival,sourceGateProposal,\s*sourceLegitimateOnwardSupport\)/);
  assert.doesNotMatch(world,/const originalGatePresence=earnedRoomDeparture && Number.isFinite\(farSideFade\)/,
    'a fresh source proposal must pass the original two-sided returned-frame authority');
  assert.match(world,/departing\?\.sourceBound===true \|\| opticalLease \|\| earnedRoomDeparture/);
});
