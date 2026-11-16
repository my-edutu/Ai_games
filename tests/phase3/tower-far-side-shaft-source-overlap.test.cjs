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

test('old bronze fades only after a genuine new-shaft WebGL return, by bounded elapsed returned frames AND time',async()=>{
  const {observedReturnedFarSideFade:fade}=await proof;
  const {held,job}=realRoute();
  held.farSideFadeStartSubmitted=3;
  held.farSideFadeStartSeconds=.18;
  assert.equal(fade(held,job),0,'prebuilt but invisible shaft cannot spend fade');
  job.structuralVisibleReturns=1;
  assert.equal(fade(held,job),0,'no frame counted twice');
  held.submittedFrames=6;held.visibleSeconds=.48;
  const middle=fade(held,job);
  assert.ok(middle>0 && middle<1);
  held.submittedFrames=10;held.visibleSeconds=1.18;
  assert.equal(fade(held,job),1,'earned returned duration and frames finish retirement');
  assert.equal(fade({...held,visibleSeconds:.25},job)<.25,true);
  assert.equal(fade({...held,visibleSeconds:1.28,submittedFrames:4},job)<.25,true);
  assert.equal(fade({...held,visibleSeconds:1.28,submittedFrames:5}, {...job,structuralVisibleReturns:0}),0);
  assert.equal(fade({...held,visibleSeconds:1.28,submittedFrames:5,
    farSideFadeStartSeconds:1.29},job),null);
});

test('production GPU owners share source-backed clearance, a real new-shaft return, and scene horizon',()=>{
  const root=path.resolve(__dirname,'../..');
  const world=fs.readFileSync(path.join(root,'public/infinite-tower-climb/visuals/world.mjs'),'utf8');
  const cross=fs.readFileSync(path.join(root,'public/infinite-tower-climb/visuals/crossfloor-arrival.mjs'),'utf8');
  assert.match(world,/observedEarnedFarSideShaftOverlap\(snapshot,held,deferredDistantArrival\)/);
  assert.match(world,/observedReturnedFarSideFade\(held,deferredDistantArrival\)/);
  assert.match(world,/structuralVisibleReturns/);
  assert.match(world,/sourceCertifiedHorizon=.*farSide/);
  assert.match(cross,/observedEarnedFarSideShaftOverlap\(source,held,job\)/);
});
