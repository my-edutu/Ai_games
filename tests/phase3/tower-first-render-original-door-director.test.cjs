'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const arrival=import('../../public/infinite-tower-climb/visuals/crossfloor-arrival.mjs');
const camera=import('../../public/infinite-tower-climb/visuals/cold-doorway-camera.mjs');
const colors=import('../../public/infinite-tower-climb/visuals/biome-threshold.mjs');
const coords=import('../../public/infinite-tower-climb/visuals/coordinates.mjs');

async function authenticReceipt() {
  const cap={id:'f8:cap',x:250000,y:80000,width:160000,height:2000};
  const thresholdX=cap.x+Math.floor(cap.width*.76);
  const observedCrossingX=thresholdX+20000;
  const source={runToken:'genuine-grounded-transfer',lifecycle:'running',
    floor:9,theme:'void',tick:460,chunkBaseY:80000,worldWidth:480000,
    lastGuardianCrossing:null,
    player:{x:observedCrossingX+3500,y:100000,halfWidth:9000,
      halfHeight:18000,health:5,grounded:true,
      groundedPlatformId:'f9:ground',state:'standing',vy:0},
    platforms:[{id:'f9:ground',x:240000,y:80000,width:175000,height:2000}]};
  const held={guardianGateRetained:true,verifiedObservedFloorAdvance:true,
    runToken:source.runToken,floor:9,oldCapId:cap.id,oldCapX:cap.x,
    oldCapWidth:cap.width,oldRoofY:82000,thresholdX,
    sourceTick:451,tick:451,firstWorldRenderTick:460,
    crossingTick:null,nextBaseY:source.chunkBaseY,worldWidth:source.worldWidth,
    observedCrossingX,observedCrossingY:100000,observedHalfWidth:9000,
    observedHalfHeight:18000,submittedFrames:1,visibleSeconds:.12};
  const hero=await coords.then(c=>c.pointFor(source.player.x,
    source.player.y,source.chunkBaseY,source.worldWidth,25));
  const job={state:'awaiting-actual-first-render',
    structureDeferred:true,proof:'recorded-source-gateway',
    runToken:source.runToken,floor:9,sourceTick:460,submittedFrames:1};
  return {source,held,hero,job};
}

test('actual pre-publication grounded receipt shares one ORIGINAL retained door across camera, sky and opaque-world hold',async()=>{
  const a=await arrival,c=await camera,b=await colors;
  const s=await authenticReceipt();
  const before=JSON.stringify(s);
  assert.equal(a.observedStagedOriginalCapBeforeRecordedCrossing(s.source,s.held),true);
  assert.equal(a.holdIncomingStructuralShell(s.source,null,s.held,s.job),true,
    'do not upload an opaque violet shaft on the first returned source-receipt GPU frame');
  for(const aspect of [960/600,390/844]){
    const shot=c.observedSourceBoundColdDoorwayLens(s.source,s.held,s.hero,aspect);
    assert.equal(shot?.coldOriginalArch,true);
    assert.equal(shot?.witnessKind,'previous-defeated-guardian-and-observed-grounded-receipt');
    assert.equal(shot?.sourceTick,460);
    assert.ok(shot.span>0&&shot.span<26);
    assert.ok(shot.focus.every(Number.isFinite));
  }
  const light=b.observedGroundedBiomeThreshold(s.source,null,{},s.held);
  assert.ok(light?.oldWeight>.95&&light?.sourceBound,
    'the real original clockwork world cannot have an instant violet horizon while its doorway survives');
  assert.equal(JSON.stringify(s),before,'pure presentation helpers must never alter source or GPU witness');
});

test('late recorded, forged, dead, distant or mismatched receipt cannot drive a false camera or world hold',async()=>{
  const a=await arrival,c=await camera,b=await colors;
  const s=await authenticReceipt();
  const bad=[
    {source:{...s.source,runToken:'other'}},
    {source:{...s.source,floor:10}},
    {source:{...s.source,tick:464}},
    {source:{...s.source,chunkBaseY:90000}},
    {source:{...s.source,lastGuardianCrossing:{sourceTick:451}}},
    {source:{...s.source,player:{...s.source.player,health:0}}},
    {source:{...s.source,player:{...s.source.player,x:470000}}},
    {source:{...s.source,player:{...s.source.player,y:130000}}},
    {source:{...s.source,player:{...s.source.player,groundedPlatformId:'f9:fake'}}},
    {held:{...s.held,guardianGateRetained:false}},
    {held:{...s.held,verifiedObservedFloorAdvance:false}},
    {held:{...s.held,observedCrossingX:1}},
    {held:{...s.held,oldCapWidth:1}},
    {held:{...s.held,submittedFrames:9}},
    {held:{...s.held,visibleSeconds:1.25}}
  ];
  for(const patch of bad){
    const source=patch.source||s.source,held=patch.held||s.held;
    assert.equal(a.observedStagedOriginalCapBeforeRecordedCrossing(source,held),false);
    assert.equal(c.observedSourceBoundColdDoorwayLens(source,held,s.hero,390/844),null);
    assert.equal(b.observedGroundedBiomeThreshold(source,null,{},held),null);
    assert.equal(a.holdIncomingStructuralShell(source,null,held,s.job),false);
  }
  assert.equal(c.observedSourceBoundColdDoorwayLens(s.source,s.held,
    {...s.hero,x:s.hero.x+10},390/844),null);
});

test('new no-record receipt does not weaken strict immutable crossing mismatch or ordinary F9 visibility',async()=>{
  const c=await camera,a=await arrival,b=await colors;
  const s=await authenticReceipt();
  const contradicted={...s.source,lastGuardianCrossing:{
    runToken:s.source.runToken,sourceTick:451,fromFloor:8,toFloor:9,
    guardian:{kind:'guardian',active:true,health:3},cap:{id:'f8:cap'}}};
  assert.equal(a.observedStagedOriginalCapBeforeRecordedCrossing(contradicted,s.held),false);
  assert.equal(c.observedSourceBoundColdDoorwayLens(contradicted,s.held,s.hero,390/844),null);
  assert.equal(a.holdIncomingStructuralShell(contradicted,null,s.held,s.job),false);
  assert.equal(b.observedGroundedBiomeThreshold(contradicted,null,{},s.held),null);
  assert.equal(b.observedGroundedBiomeThreshold(s.source,null,{reducedMotion:true},s.held),null);
  const world=fs.readFileSync(require.resolve('../../public/infinite-tower-climb/visuals/world.mjs'),'utf8');
  assert.match(world,/observedStagedOriginalCapBeforeRecordedCrossing\(snapshot,held\)/);
  assert.match(world,/verifiedObservedFloorAdvance:requested\.verifiedObservedFloorAdvance/);
  assert.match(world,/observedCrossingX:held\.observedCrossingX/);
  assert.doesNotMatch(world,/snapshot\.lastGuardianCrossing\s*=/);
});
