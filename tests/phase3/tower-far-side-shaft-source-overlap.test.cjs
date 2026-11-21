'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const proof=import('../../public/infinite-tower-climb/visuals/far-side-shaft-transition.mjs');
function realRoute(){
  const cap={id:'f8:cap',x:200000,y:6000,width:140000,height:500};
  const thresholdX=cap.x+Math.floor(cap.width*.76);
  const source={runToken:'far-side-guardian-earned',lifecycle:'running',
    floor:9,theme:'void',tick:500,
    player:{x:thresholdX+122000,y:10000,halfWidth:2000,
      halfHeight:3500,health:5,grounded:true,
      groundedPlatformId:'f9:ground',state:'standing',vy:0},
    platforms:[{id:'f9:ground',x:300000,y:6000,width:180000,height:500}],
    lastGuardianCrossing:{runToken:'far-side-guardian-earned',
      fromFloor:8,toFloor:9,sourceTick:475,cap,
      exitX:thresholdX,crossingX:thresholdX+5000,
      guardian:{kind:'guardian',active:false,health:0}}
  };
  const held={runToken:source.runToken,floor:9,guardianGateRetained:true,
    verifiedObservedFloorAdvance:true,oldCapId:cap.id,
    oldCapX:cap.x,oldCapWidth:cap.width,oldRoofY:6500,
    thresholdX,crossingTick:475,sourceTick:475,
    submittedFrames:3,visibleSeconds:.18,
    originalGatewayOpacity:.92,opticalExitSubmitted:false};
  const job={runToken:source.runToken,floor:9,
    proof:'recorded-source-gateway',sourceTick:480,
    state:'awaiting-structural-release',structureDeferred:true,
    submittedFrames:3,structureBuiltAtSubmitted:1,
    structuralVisibleReturns:0,structuralFade:0};
  return {source,held,job};
}

test('authentic physically supported far-side route retains the original GPU room until incoming 3D shaft returns',async()=>{
  const {observedEarnedFarSideShaftOverlap:overlap}=await proof;
  const a=realRoute(),before=JSON.stringify(a);
  const witness=overlap(a.source,a.held,a.job);
  assert.equal(witness?.sourceBound,true);
  assert.equal(witness?.wholeBodyFarSide,true);
  assert.equal(witness?.incomingReturnedFrames,0);
  assert.equal(overlap(a.source,a.held,null)?.sourceBound,true,
    'the first F9 cold world may not yet have built the real shaft');
  assert.equal(JSON.stringify(a),before,'no simulated source or GPU history can be mutated');
});

test('far-side lease cannot be manufactured from a floor label, false contact, wrong guardian, stale owner or runaway source age',async()=>{
  const {observedEarnedFarSideShaftOverlap:overlap}=await proof;
  const a=realRoute(),v=(source=a.source,held=a.held,job=a.job)=>overlap(source,held,job);
  assert.equal(v({...a.source,runToken:'other'}),null);
  assert.equal(v({...a.source,floor:10}),null);
  assert.equal(v({...a.source,lifecycle:'outcome'}),null);
  assert.equal(v({...a.source,player:{...a.source.player,health:0}}),null);
  assert.equal(v({...a.source,player:{...a.source.player,groundedPlatformId:'invented'}}),null);
  assert.equal(v({...a.source,player:{...a.source.player,y:16000}}),null);
  assert.equal(v({...a.source,player:{...a.source.player,x:a.held.thresholdX+60000}}),null);
  assert.equal(v({...a.source,tick:626}),null,'150-tick cap is strict');
  assert.equal(v({...a.source,lastGuardianCrossing:{
    ...a.source.lastGuardianCrossing,guardian:{kind:'guardian',active:true,health:2}}}),null);
  assert.equal(v(a.source,{...a.held,verifiedObservedFloorAdvance:false}),null);
  assert.equal(v(a.source,{...a.held,oldCapWidth:135000}),null);
  assert.equal(v(a.source,{...a.held,submittedFrames:30}),null);
  assert.equal(v(a.source,{...a.held,visibleSeconds:2.9}),null);
  assert.equal(v(a.source,a.held,{...a.job,runToken:'wrong'}),null);
  assert.equal(v(a.source,a.held,{...a.job,proof:'adjacent-browser-guardian'}),null);
});

test('old bronze retirement needs displayed OLD and NEW structural returns, not simply a source tick or an old-room frame budget',async()=>{
  const {observedReturnedFarSideFade:fade}=await proof;
  const {held,job}=realRoute();
  held.farSideFadeStartSubmitted=3;
  held.farSideFadeStartSeconds=.18;
  job.structuralVisibleSeconds=0;
  assert.equal(fade(held,job),0,'CPU-built or never-returned shaft cannot spend the old gate');
  job.structuralVisibleReturns=1;
  job.structuralVisibleSeconds=.08;
  assert.equal(fade(held,job),0,'first real incoming frame opens depth but does not replace the doorway');
  held.submittedFrames=6; held.visibleSeconds=.48;
  job.structuralVisibleReturns=2; job.structuralVisibleSeconds=.17;
  const middle=fade(held,job);
  assert.ok(middle>0 && middle<.2,'joint returned scene begins a restrained departure');
  held.submittedFrames=10; held.visibleSeconds=1.18;
  job.structuralVisibleReturns=3; job.structuralVisibleSeconds=.36;
  assert.ok(fade(held,job)>middle && fade(held,job)<.55,
    'old rendered time alone cannot delete the gateway while only three incoming frames exist');
  held.submittedFrames=18; held.visibleSeconds=1.83;
  assert.ok(fade(held,job)<.55,
    'even fifteen old-room returns cannot manufacture a fully painted next room');
  job.structuralVisibleReturns=8; job.structuralVisibleSeconds=.78;
  assert.equal(fade(held,job),1,
    'source-owned exit can finish when both returned rooms and genuine seconds are sufficient');
  assert.ok(fade({...held,visibleSeconds:.25},job)<.25);
  assert.ok(fade({...held,visibleSeconds:1.28,submittedFrames:4},job)<.25);
  assert.equal(fade({...held,visibleSeconds:1.28,submittedFrames:5},
    {...job,structuralVisibleReturns:0}),0);
  assert.equal(fade({...held,visibleSeconds:1.28,submittedFrames:5,
    farSideFadeStartSeconds:1.29},job),null);
  assert.equal(fade(held,{...job,structuralVisibleSeconds:undefined}),null,
    'missing structural return duration cannot be inferred from successful old-room draws');
});

test('production GPU owners share source-backed clearance, a real new-shaft return, and scene horizon',()=>{
  const root=path.resolve(__dirname,'../..');
  const world=fs.readFileSync(path.join(root,'public/infinite-tower-climb/visuals/world.mjs'),'utf8');
  const cross=fs.readFileSync(path.join(root,'public/infinite-tower-climb/visuals/crossfloor-arrival.mjs'),'utf8');
  assert.equal(/observedEarnedFarSideShaftOverlap\(snapshot,held,deferredDistantArrival\)/.test(world),true);
  assert.equal(/observedReturnedFarSideFade\(held,deferredDistantArrival\)/.test(world),true);
  assert.equal(/structuralVisibleReturns/.test(world),true);
  assert.match(world,/const oldRoomWitness=farSideHorizon \|\| returnedBronzePaletteLock/,
    'far-side source proof AND genuine returned near-sill gateway proof jointly own world climate');
  assert.match(world,/sourceCertifiedHorizon=oldRoomWitness \?/,
    'sky and material channels may use only genuine old-world crossing witnesses');
  assert.equal(/observedEarnedFarSideShaftOverlap\(source,held,job\)/.test(cross),true);
});


test('actual near-threshold Floor9 vertical climb retains old GPU room during airborne approach and raised f9:p2 landing',async()=>{
  const {observedEarnedFarSideShaftOverlap:overlap}=await proof;
  const {source,held,job}=realRoute();
  // Recorded route rises 12.6m onto f9:p2 while remaining only 0.25m
  // beyond the exit in X. The previous artificial +100000 horizontal
  // clearance made this already-authenticated path fail the new-world
  // overlap, retiring the bronze room in one abrupt source-poll cut.
  source.player.x=held.thresholdX+2500;
  source.tick=535;
  const raisedSole=held.oldRoofY+126000;
  source.platforms.push({id:'f9:p2',x:held.thresholdX-10000,
    y:raisedSole-500,width:50000,height:500});
  source.player.y=raisedSole+source.player.halfHeight;
  source.player.groundedPlatformId='f9:p2';
  assert.equal(overlap(source,held,job)?.sourceBound,true,
    'a genuine supported successor deck must not need a 10m horizontal runway');
  source.tick=522;
  source.player.y=held.oldRoofY+80000+source.player.halfHeight;
  source.player.grounded=false;
  source.player.groundedPlatformId=null;
  source.player.state='airborne';
  source.player.vy=120;
  assert.equal(overlap(source,held,job)?.sourceBound,true,
    'genuine flight toward the raised platform retains the physically owned old room');
  source.player.y=held.oldRoofY+source.player.halfHeight;
  assert.equal(overlap(source,held,job),null,
    'near the sill before authentic vertical clearance cannot fade the original door');
});
