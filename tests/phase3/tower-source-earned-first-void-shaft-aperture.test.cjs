'use strict';
const {test}=require('node:test'), assert=require('node:assert/strict'),fs=require('node:fs');
const loader=import('../../public/infinite-tower-climb/visuals/far-side-shaft-transition.mjs');
function realFirstReturn() {
  const oldRoofY=3224000,cap={id:'f8:cap',x:115200,y:3212000,width:249600,height:12000};
  const thresholdX=cap.x+Math.floor(cap.width*.76);
  const source={floor:9,theme:'void',lifecycle:'running',runToken:'real-episode',
    tick:475,player:{x:321096,y:3238000,halfWidth:9000,halfHeight:14000,
      health:4,grounded:true,groundedPlatformId:'f8:cap',
      state:'standing',vy:0},
    platforms:[{id:'f9:ground',x:300000,y:3212000,width:100000,height:12000}],
    lastGuardianCrossing:null};
  const held={runToken:source.runToken,floor:9,oldCapId:'f8:cap',
    guardianGateRetained:true,verifiedObservedFloorAdvance:true,
    firstWorldRenderTick:475,oldCapX:cap.x,oldCapWidth:cap.width,
    oldRoofY,thresholdX,visibleSeconds:.08,submittedFrames:1,
    originalGatewayOpacity:1,opticalExitSubmitted:false};
  const job={runToken:source.runToken,floor:9,proof:'recorded-source-gateway',
    structureDeferred:true,sourceTick:475,submittedFrames:1,
    structureBuiltAtSubmitted:1,structuralVisibleReturns:0,
    state:'awaiting-structural-release'};
  return {source,held,job,cap};
}
test('real F8 cap contact across source-earned F9 sill opens bounded Void depth on first original WebGL return',async()=>{
  const {observedSourceEarnedEarlyVoidShaftAperture:observe}=await loader;
  const {source,held,job}=realFirstReturn();
  const result=observe(source,held,job);
  assert.equal(result?.sourceBound,true);
  assert.equal(result?.roofContact,true);
  assert.equal(result?.alpha,.24);
  assert.equal(result?.originalGatewayRetained,true);
  assert.equal(job.submittedFrames,job.structureBuiltAtSubmitted,
    'do not force another costly renderer return merely to stage existing architecture');
});
test('an unearned, unsubmitted, stale, counterfeit or obstructed route cannot show early Void world',async()=>{
  const {observedSourceEarnedEarlyVoidShaftAperture:observe}=await loader;
  const attempts=[
    ([s,h,j])=>{j.submittedFrames=0;},
    ([s,h,j])=>{h.submittedFrames=0;},
    ([s,h,j])=>{s.runToken='other';},
    ([s,h,j])=>{s.floor=8;},
    ([s,h,j])=>{s.lifecycle='completed';},
    ([s,h,j])=>{s.player.health=0;},
    ([s,h,j])=>{s.player.x=h.thresholdX+6000;},
    ([s,h,j])=>{s.player.x=h.thresholdX+13000;},
    ([s,h,j])=>{s.player.groundedPlatformId='f9:invented';},
    ([s,h,j])=>{s.platforms[0].y-=10000;},
    ([s,h,j])=>{h.originalGatewayOpacity=.6;},
    ([s,h,j])=>{h.verifiedObservedFloorAdvance=false;},
    ([s,h,j])=>{j.structureDeferred=false;},
    ([s,h,j])=>{j.state='complete';},
    ([s,h,j])=>{j.sourceTick=474;},
    ([s,h,j])=>{j.structureBuiltAtSubmitted=2;},
    ([s,h,j])=>{s.tick=524;},
    ([s,h,j])=>{s.lastGuardianCrossing={runToken:s.runToken,fromFloor:8,
      toFloor:9,cap:{id:'f8:cap',x:h.oldCapX,width:h.oldCapWidth,
        y:h.oldRoofY-12000,height:12000},exitX:h.thresholdX,
      guardian:{kind:'guardian',active:true,health:1},sourceTick:475};},
  ];
  for(const mutate of attempts){
    const {source,held,job}=realFirstReturn();
    mutate([source,held,job]);
    assert.equal(observe(source,held,job),null,mutate.toString());
  }
});
test('authentic immutable HP-zero crossing and brief low flight remain an original-room overlap, never a new floor or fake gameplay',async()=>{
  const {observedSourceEarnedEarlyVoidShaftAperture:observe}=await loader;
  const {source,held,job,cap}=realFirstReturn();
  source.lastGuardianCrossing={runToken:source.runToken,fromFloor:8,toFloor:9,
    cap,exitX:held.thresholdX,guardian:{kind:'guardian',active:false,health:0},
    sourceTick:475};
  source.player.grounded=false;source.player.groundedPlatformId=null;
  source.player.state='airborne';source.player.vy=1300;source.player.y+=9000;
  assert.equal(observe(source,held,job)?.alpha,.18);
  assert.equal(source.floor,9);
});
test('source-gated first post-gate stage is wired to the real shaft and returned-frame alpha, not UI or synthetic passes',()=>{
  const world=fs.readFileSync('public/infinite-tower-climb/visuals/world.mjs','utf8');
  const cross=fs.readFileSync('public/infinite-tower-climb/visuals/crossfloor-arrival.mjs','utf8');
  assert.match(world,/const earlyShaft=observedSourceEarnedEarlyVoidShaftAperture\(/);
  assert.match(world,/Math\.max\(\s*job\.structuralFade,\s*sourceAlignedIncomingShaftOpacity/);
  assert.match(cross,/if\(farSide \|\| realSillDepth \|\| earlyAperture\) return true/);
  assert.match(world,/renderer/); // no claim of renderer completion from an input poll
  assert.doesNotMatch(world,/snapshot\.floor\s*=\s*9|snapshot\.player\.x\s*=/);
});
