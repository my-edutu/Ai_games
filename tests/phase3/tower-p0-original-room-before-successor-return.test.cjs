'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const hold=import('../../public/infinite-tower-climb/visuals/far-side-shaft-transition.mjs');

function genuineNearRoof() {
  const cap={id:'f8:cap',x:115200,y:3212000,width:249600,height:12000};
  const thresholdX=cap.x+Math.floor(cap.width*.76), roofY=cap.y+cap.height;
  const runToken='source-pinned-gateway-episode';
  const source={runToken,lifecycle:'running',floor:9,theme:'void',tick:520,
    player:{health:5,x:thresholdX+85000+9000,y:roofY+14000,
      halfWidth:9000,halfHeight:14000,grounded:true,
      groundedPlatformId:'f9:ground',state:'standing',vy:0},
    platforms:[{id:'f9:ground',x:0,y:cap.y,width:480000,height:12000}],
    lastGuardianCrossing:{runToken,fromFloor:8,toFloor:9,
      sourceTick:475,exitX:thresholdX,cap,
      guardian:{kind:'guardian',active:false,health:0}}};
  const held={runToken,floor:9,guardianGateRetained:true,
    verifiedObservedFloorAdvance:true,oldCapId:'f8:cap',
    oldCapX:cap.x,oldCapWidth:cap.width,oldRoofY:roofY,thresholdX,
    crossingTick:475,firstWorldRenderTick:480,
    submittedFrames:3,visibleSeconds:.24,originalGatewayOpacity:.83,
    lastReturnedOldGatewayTick:509,lastReturnedOldGatewayOpacity:.87,
    lastReturnedOriginalGalleryOpacity:.36,opticalExitSubmitted:false};
  const job={runToken,floor:9,proof:'recorded-source-gateway',
    sourceTick:480,structureDeferred:true,state:'awaiting-structural-submission',
    submittedFrames:3,structuralVisibleReturns:0};
  return {source,held,job};
}

test('the authentic supported Floor9 receiving roof retains ACTUALLY returned original gate materials until real successor shaft return',async()=>{
  const {observedEarnedFarSideShaftOverlap:far,
    observedReturnedOriginalArchitectureHold:receipt}=await hold;
  const f=genuineNearRoof(),before=JSON.stringify(f);
  assert.equal(far(f.source,f.held,f.job),null,
    '85m true roof passage is NOT eligible for far-side-only hold');
  const r=receipt(f.source,f.held,f.job,null);
  assert.equal(r?.sourceBound,true);
  assert.equal(r?.sourceTick,520);
  assert.equal(r?.gateOpacity,.87);
  assert.equal(r?.galleryOpacity,.36);
  assert.equal(r?.incomingReturnedFrames,0);
  assert.equal(JSON.stringify(f),before,
    'a render-only optical lease cannot mutate authoritative source or renderer history');
});

test('an already-faded NONCOLLIDING old gallery does not veto still-returned authentic HP-zero gateway',async()=>{
  const {observedReturnedOriginalArchitectureHold:receipt}=await hold;
  const f=genuineNearRoof();
  f.held.lastReturnedOriginalGalleryOpacity=0;
  const r=receipt(f.source,f.held,f.job,null);
  assert.equal(r?.gateOpacity,.87,'original gate persists until actually returned successor');
  assert.equal(r?.galleryOpacity,0,'must not resurrect previously retired obstructing old steel');
});

test('no hold without original HP-zero gate, live supported roof and independently returned genuine old 3D world',async()=>{
  const {observedReturnedOriginalArchitectureHold:receipt}=await hold;
  for(const mutate of [
    f=>{f.source.runToken='different-run';},
    f=>{f.source.floor=8;},
    f=>{f.source.lifecycle='result';},
    f=>{f.source.player.health=0;},
    f=>{f.source.player.grounded=false;},
    f=>{f.source.player.groundedPlatformId='f9:p2';},
    f=>{f.source.player.y+=1000;},
    f=>{f.source.player.x=f.held.thresholdX-35000;},
    f=>{f.source.player.x=f.held.thresholdX+230000;},
    f=>{f.source.platforms[0].y-=1000;},
    f=>{f.source.lastGuardianCrossing=null;},
    f=>{f.source.lastGuardianCrossing.guardian.active=true;},
    f=>{f.source.lastGuardianCrossing.guardian.health=2;},
    f=>{f.source.lastGuardianCrossing.cap.width-=100;},
    f=>{f.held.guardianGateRetained=false;},
    f=>{f.held.opticalExitSubmitted=true;},
    f=>{f.held.submittedFrames=0;},
    f=>{f.held.lastReturnedOldGatewayTick=601;},
    f=>{f.held.lastReturnedOldGatewayOpacity=0;},
    f=>{f.held.lastReturnedOriginalGalleryOpacity=-.1;},
    f=>{f.job.proof='floor-label';},
    f=>{f.job.runToken='other';},
    f=>{f.job.structuralVisibleReturns=1;},
  ]) {
    const f=genuineNearRoof();mutate(f);
    assert.equal(receipt(f.source,f.held,f.job,null),null,
      'unsupported floor, false guardian victory or unreturned 3D source cannot create historic material');
  }
});

test('the actual old-world material owner consumes near-roof return evidence in the live scene; no gameplay mutation',()=>{
  const world=fs.readFileSync('public/infinite-tower-climb/visuals/world.mjs','utf8');
  assert.match(world,/observedReturnedOriginalArchitectureHold\(\s*snapshot,held,deferredDistantArrival,farSide\)/);
  assert.match(world,/returnedBronzeHold\?\.gateOpacity/);
  assert.match(world,/returnedBronzeHold\.galleryOpacity/);
  const helper=fs.readFileSync('public/infinite-tower-climb/visuals/far-side-shaft-transition.mjs','utf8');
  assert.match(helper,/job\.structuralVisibleReturns!==0/);
  assert.match(world,/const returnedReplacement=physicallyBeyondOriginalDoor &&\s*observedReturnedSuccessorRoomReady\(/,
    'retirement requires a returned real successor instead of just source departure');
  assert.match(world,/const awaitingSourceReturnedReplacement=physicallyBeyondOriginalDoor &&\s*!returnedReplacement/,
    'a living old gateway remains during genuine cold-shaft GPU loading');
  assert.doesNotMatch(world,/snapshot\.player\.(?:x|y|grounded|health)\s*=/);
});
