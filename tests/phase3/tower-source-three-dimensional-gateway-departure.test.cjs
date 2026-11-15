'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const sample=import('../../public/infinite-tower-climb/visuals/source-physical-arrival-palette.mjs');
function fixture() {
  const cap={id:'f8:cap',x:250000,y:80000,width:160000,height:2000};
  const exitX=cap.x+Math.floor(cap.width*.76),crossingX=exitX+19000;
  const source={runToken:'source-earned-roof',lifecycle:'running',floor:9,
    theme:'void',tick:460,worldWidth:480000,chunkBaseY:80000,
    player:{x:crossingX+5000,y:100000,halfWidth:9000,halfHeight:18000,
      health:5,grounded:true,groundedPlatformId:'f9:ground',
      state:'standing',vy:0},
    platforms:[{id:'f9:ground',x:240000,y:80000,width:175000,height:2000}],
    lastGuardianCrossing:{runToken:'source-earned-roof',fromFloor:8,toFloor:9,
      sourceTick:451,cap,exitX,crossingX,halfWidth:9000,halfHeight:18000,
      guardian:{kind:'guardian',active:false,health:0}}};
  const held={guardianGateRetained:true,runToken:source.runToken,floor:9,
    oldRoofY:82000,thresholdX:exitX,sourceTick:460,crossingTick:451,
    // The real cold-F9 camera must have an actual first returned world tick.
    // Without it the live source refuses an unverified optical clock; the
    // previous fixture was asserting a fade from a nonexistent GPU owner.
    firstWorldRenderTick:460,originalGatewayOpacity:1,
    opticalExitSubmitted:false,submittedFrames:1,visibleSeconds:.06};
  return {source,held};
}
function rise(source,metres) {
  source.tick+=5;
  source.player={...source.player,y:source.player.y+metres*10000,
    grounded:false,groundedPlatformId:null,state:'airborne',vy:120};
}
test('authentic Floor9 vertical climbing, not impossible horizontal-only 9m runway, drives one 3D entrance palette',async()=>{
  const {observedSourcePhysicalArrivalPalette:palette}=await sample;
  const {source}=fixture();
  assert.equal(palette(source).oldWeight,1);
  assert.equal(palette(source).rise,0);
  rise(source,5);
  const mid=palette(source);
  assert.equal(mid.travel,5000);
  assert.ok(mid.oldWeight>0 && mid.oldWeight<1);
  rise(source,5);
  const next=palette(source);
  assert.equal(next.oldWeight,0);
  assert.equal(next.rise,100000);
  assert.ok(next.pathDisplacement>=100000);
});
test('the physical original gateway needs full-body source clearance AND returned renderer frames to retire',async()=>{
  const {observedSourceGatewayDeparturePresence:samplePresence}=await sample;
  const {source,held}=fixture();
  assert.equal(samplePresence(source,held)?.opacity,1);
  rise(source,10);
  assert.equal(samplePresence(source,held)?.opacity,1,'stalled original GPU cannot age a gate');
  // Two and three actual returned frames must genuinely show an old/new
  // shared doorway rather than expecting the old door to survive after the
  // fourth fully source-cleared return (the native hard-cut regression).
  held.submittedFrames=2;held.visibleSeconds=.22;
  const second=samplePresence(source,held);
  assert.ok(second?.opacity>.5 && second.opacity<.86);
  held.submittedFrames=3;held.visibleSeconds=.32;
  const third=samplePresence(source,held);
  assert.ok(third?.opacity>0 && third.opacity<second.opacity);
  held.submittedFrames=4;held.visibleSeconds=.42;
  assert.equal(samplePresence(source,held)?.opacity,0);
});
test('wrong run, undefeated guardian, false ground or old GPU never authorize original-gate fading',async()=>{
  const {observedSourceGatewayDeparturePresence:samplePresence}=await sample;
  const {source,held}=fixture();
  for(const [s,h] of [
    [{...source,runToken:'wrong'},held],
    [{...source,floor:10},held],
    [{...source,lastGuardianCrossing:{...source.lastGuardianCrossing,guardian:{kind:'guardian',active:true,health:8}}},held],
    [{...source,platforms:[{...source.platforms[0],y:90000}]},held],
    [{...source,player:{...source.player,groundedPlatformId:'fake'}},held],
    [{...source,player:{...source.player,health:0}},held],
    [source,{...held,guardianGateRetained:false}],
    [source,{...held,oldRoofY:9999}],
    [source,{...held,submittedFrames:61}],
    [source,{...held,visibleSeconds:3}]
  ])assert.equal(samplePresence(s,h),null);
  assert.equal(samplePresence(source,{...held,submittedFrames:11,visibleSeconds:1.7})?.sourceBound,true,
    'late valid source epoch can still own its original materials until the real departure');
});
test('actual old gateway/clad cap use one source-controlled, bounded original-material transition',()=>{
  const world=fs.readFileSync(require.resolve('../../public/infinite-tower-climb/visuals/world.mjs'),'utf8');
  assert.match(world,/observedSourceGatewayDeparturePresence\(snapshot,held\)/);
  assert.match(world,/originalGatewayMaterialStages/);
  assert.match(world,/material\.opacity=baseOpacity\*originalGatePresence/);
  assert.doesNotMatch(world,/snapshot\.player\.(?:x|y)\s*=/);
});
