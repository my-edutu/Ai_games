'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const policy=import('../../public/infinite-tower-climb/visuals/far-side-shaft-transition.mjs');

// P0 real-world sightline: a player may already be far beyond the gateway
// before a slow WebGL renderer returns its next original F9 shaft frame.
// No authored extra platform, camera cut, or fabricated source tick is allowed.
function authenticRaisedDeparture(){
  const runToken='original-guardian-crossing';
  const cap={id:'f8:cap',x:200000,y:6000,width:140000,height:500};
  const exitX=cap.x+Math.floor(cap.width*.76);
  const source={runToken,lifecycle:'running',floor:9,theme:'void',tick:480,
    player:{x:440000,y:10000,halfWidth:2000,halfHeight:3500,
      health:90,grounded:true,groundedPlatformId:'f9:ground',
      state:'standing',vy:0},
    platforms:[{id:'f9:ground',x:300000,y:6000,width:200000,height:500}],
    lastGuardianCrossing:{runToken,fromFloor:8,toFloor:9,sourceTick:475,
      exitX,cap,guardian:{kind:'guardian',active:false,health:0}}};
  const held={runToken,floor:9,guardianGateRetained:true,
    verifiedObservedFloorAdvance:true,oldCapId:'f8:cap',
    oldCapX:cap.x,oldCapWidth:cap.width,oldRoofY:6500,
    thresholdX:exitX,crossingTick:475,firstWorldRenderTick:476,
    submittedFrames:2,visibleSeconds:.20,originalGatewayOpacity:.85,
    opticalExitSubmitted:false};
  const job={runToken,floor:9,proof:'recorded-source-gateway',
    sourceTick:476,structureDeferred:true,
    state:'awaiting-void-biome-build',structureBuiltAtSubmitted:1,
    submittedFrames:2,structuralVisibleReturns:0};
  return {source,held,job};
}

test('real far-side supported F9 body can reveal previously built original Void load path beside still-visible HP-open bronze gateway',async()=>{
  const {observedSourceEarnedEarlyVoidShaftAperture,
    observedSourceSupportedVoidFirstPaint}=await policy;
  const v=authenticRaisedDeparture(),before=JSON.stringify(v);
  assert.equal(observedSourceEarnedEarlyVoidShaftAperture(
    v.source,v.held,v.job),null,
    'the old near-sill interval already expired for genuine farther F9 contact');
  const revealed=observedSourceSupportedVoidFirstPaint(
    v.source,v.held,v.job);
  assert.equal(revealed?.sourceBound,true);
  assert.equal(revealed?.sourceTick,v.source.tick);
  assert.equal(revealed?.basis,'genuine-far-side-supported-route');
  assert.ok(revealed.alpha>=.20 && revealed.alpha<=.28);
  assert.equal(JSON.stringify(v),before,'presentation proof never alters player or source');
});

test('far-side first paint rejects unsupported, forged, wrong-run, unreturned or already-visible worlds',async()=>{
  const {observedSourceSupportedVoidFirstPaint:paint}=await policy;
  const {source:s,held:h,job:j}=authenticRaisedDeparture();
  assert.equal(paint({...s,runToken:'other'},h,j),null);
  assert.equal(paint({...s,floor:10},h,j),null);
  assert.equal(paint({...s,lifecycle:'result'},h,j),null);
  assert.equal(paint({...s,player:{...s.player,health:0}},h,j),null);
  assert.equal(paint({...s,player:{...s.player,groundedPlatformId:'fake'}},h,j),null);
  assert.equal(paint({...s,lastGuardianCrossing:{
    ...s.lastGuardianCrossing,guardian:{kind:'guardian',active:true,health:20}}},h,j),null);
  assert.equal(paint(s,{...h,guardianGateRetained:false},j),null);
  assert.equal(paint(s,{...h,originalGatewayOpacity:0},j),null);
  assert.equal(paint(s,{...h,submittedFrames:0},j),null);
  assert.equal(paint(s,h,{...j,proof:'adjacent-browser-guardian'}),null);
  assert.equal(paint(s,h,{...j,sourceTick:474},),null);
  assert.equal(paint(s,h,{...j,structureBuiltAtSubmitted:0}),null);
  assert.equal(paint(s,h,{...j,submittedFrames:0}),null);
  assert.equal(paint(s,h,{...j,structuralVisibleReturns:1}),null,
    'once a real incoming structure has returned, ordinary frame-owned fade takes over');
});

test('real near-sill grounded doorway retains its existing narrow source-certified aperture',async()=>{
  const {observedSourceEarnedEarlyVoidShaftAperture,
    observedSourceSupportedVoidFirstPaint}=await policy;
  const v=authenticRaisedDeparture();
  v.source.player.x=v.held.thresholdX+15000;
  assert.equal(v.source.player.x-v.source.player.halfWidth>=v.held.thresholdX+6000,true);
  const original=observedSourceEarnedEarlyVoidShaftAperture(v.source,v.held,v.job);
  assert.equal(original?.sourceBound,true);
  assert.equal(observedSourceSupportedVoidFirstPaint(v.source,v.held,v.job)?.alpha,original.alpha);
});

test('actual World first-return and submitted-frame owners consume one source-validated first-paint envelope',()=>{
  const fs=require('node:fs');
  const world=fs.readFileSync(require.resolve(
    '../../public/infinite-tower-climb/visuals/world.mjs'),'utf8');
  assert.match(world,/observedSourceSupportedVoidFirstPaint\(\s*snapshot,retainedEarnedCap,arrival\)/);
  assert.match(world,/observedSourceSupportedVoidFirstPaint\(\s*snapshot,held,job\)/);
  assert.match(world,/structuralRoot\.visible=arrival\.structuralFade>\.015/);
  assert.match(world,/job\.structuralRoot\.visible=job\.structuralFade>\.015/);
  assert.match(world,/arrival\.submittedFrames>=1 && !options\.stale/);
  assert.match(world,/arrival\.structureBuiltAtSubmitted=arrival\.submittedFrames/);
});
