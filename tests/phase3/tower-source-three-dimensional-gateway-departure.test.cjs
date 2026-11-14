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
    submittedFrames:1,visibleSeconds:.06};
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
  held.submittedFrames=4;held.visibleSeconds=.62;
  assert.ok(samplePresence(source,held)?.opacity>0 && samplePresence(source,held)?.opacity<1);
  held.submittedFrames=8;held.visibleSeconds=1.15;
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
    [source,{...held,submittedFrames:11}],
    [source,{...held,visibleSeconds:1.7}]
  ])assert.equal(samplePresence(s,h),null);
});
test('actual old gateway/clad cap use one source-controlled, bounded original-material transition',()=>{
  const world=fs.readFileSync(require.resolve('../../public/infinite-tower-climb/visuals/world.mjs'),'utf8');
  assert.match(world,/observedSourceGatewayDeparturePresence\(snapshot,held\)/);
  assert.match(world,/originalGatewayMaterialStages/);
  assert.match(world,/material\.opacity=baseOpacity\*originalGatePresence/);
  assert.doesNotMatch(world,/snapshot\.player\.(?:x|y)\s*=/);
});
