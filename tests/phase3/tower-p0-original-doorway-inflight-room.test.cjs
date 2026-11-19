'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const sourceModule=import('../../public/infinite-tower-climb/visuals/source-physical-arrival-palette.mjs');
const sourceWorld=()=>fs.readFileSync(path.resolve(__dirname,
  '../../public/infinite-tower-climb/visuals/world.mjs'),'utf8');

// Regression from genuine source-pinned candidate portrait danger film
// run 44422482280, e4f4d808, tick 521: the actual skinned hero was mid-flight
// to the already-authored f9:p2 while the old F8 gate disappeared between
// adjacent returned Three frames. Exact source coordinates; not painted proof.
function actualMidStep(){
  const cap={id:'f8:cap',x:115200,y:3212000,width:249600,height:12000};
  const thresholdX=cap.x+Math.floor(cap.width*.76);
  const runToken='original-candidate-danger-tick521';
  const source={
    runToken, floor:9,theme:'void',lifecycle:'running',tick:521,
    player:{x:346796,y:3319000,halfWidth:9000,halfHeight:14000,
      health:4,grounded:false,groundedPlatformId:null,state:'airborne',vy:-12000},
    platforms:[
      {id:'f9:ground',x:0,y:3212000,width:480000,height:12000},
      {id:'f9:p2',x:320000,y:3330000,width:40000,height:20000}
    ],
    lastGuardianCrossing:{runToken,fromFloor:8,toFloor:9,sourceTick:475,
      cap,exitX:thresholdX,crossingX:321096,
      halfWidth:9000,halfHeight:14000,
      guardian:{kind:'guardian',active:false,health:0}}
  };
  const held={runToken,floor:9,oldCapId:'f8:cap',oldCapX:cap.x,
    oldCapWidth:cap.width,oldRoofY:3224000,thresholdX,
    sourceTick:475,crossingTick:475,guardianGateRetained:true,
    verifiedObservedFloorAdvance:true,submittedFrames:7,visibleSeconds:.32,
    originalGatewayOpacity:.8,opticalExitSubmitted:false,
    firstWorldRenderTick:476,observedCrossingX:321096,
    observedCrossingY:3238000,observedHalfWidth:9000,observedHalfHeight:14000};
  return {source,held};
}
test('real tick-521 airborne approach is a legitimate same-run SOURCE window for existing original doorway, not a fabricated landing',async()=>{
  const {observedSourceAirborneSuccessorApproach:approach,
    observedSourceOriginalVisibilityWindow:window,
    observedSourcePhysicalArrivalPalette:palette}=await sourceModule;
  const {source,held}=actualMidStep();
  const before=JSON.stringify({source,held});
  assert.equal(approach(source,held,held.oldRoofY),true);
  assert.equal(window(source,held)?.maxTicks,110);
  assert.equal(window(source,held)?.realAirborneApproach,true);
  assert.equal(palette(source,held)?.sourceBound,true);
  assert.equal(JSON.stringify({source,held}),before);
  const invalid=[
    s=>{s.platforms.pop();},
    s=>{s.platforms[1].x=500000;},
    s=>{s.platforms[1].id='f8:historic';},
    s=>{s.lastGuardianCrossing.guardian.active=true;},
    s=>{s.lastGuardianCrossing.guardian.health=5;},
    s=>{s.runToken='foreign-episode';},
    s=>{s.floor=10;},
    s=>{s.player.health=0;},
    s=>{s.player.grounded=true;s.player.state='standing';},
    s=>{s.player.x=80000;},
    s=>{s.tick=590;},
  ];
  for(const change of invalid){
    const bad=structuredClone(source);change(bad);
    assert.equal(approach(bad,held,held.oldRoofY),false,
      'unsupported, fake or expired F9 step-flight must not retain old GPU world');
  }
});
test('actual retained 3D architecture owner consumes the SAME authenticated raised-flight window as camera/roof materials',()=>{
  const world=sourceWorld();
  assert.match(world,/observedSourceAirborneSuccessorApproach\(snapshot,held,held\.oldRoofY\)/);
  assert.match(world,/authenticRaisedFlight.*\|\|/, 
    'one true airborne successor approach must be admitted alongside existing grounded roof');
  assert.match(world,/observedSourceOriginalVisibilityWindow\(snapshot,held\)/);
  assert.match(world,/sourceVisibilityWindow\?\.maxTicks\?\?70/);
  assert.match(world,/held\.sourceAlignedPassage=.*authenticRaisedFlight/s);
  assert.match(world,/held\.opticalExitSubmitted===true/);
  assert.match(world,/snapshot\.runToken !== held\.runToken/);
  assert.match(world,/retireEarnedCap\(\)/);
});
