'use strict';
// P0 real candidate film ccea29bd, normal-speed desktop/portrait:
// floor-nine source tick 512/522 is the legitimate airborne step between
// f9:gateway-step and the actual f9:p2 deck. Retained original gate ownership
// disappears at precisely this point, before exact raised support at tick535.
// An airborne body near a REAL successor deck is not a fake landing.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const sourceModule=import('../../public/infinite-tower-climb/visuals/source-physical-arrival-palette.mjs');

function earnedAirborne(){
  const runToken='real-f8-guardian-to-f9-approach';
  const cap={id:'f8:cap',x:115200,y:3212000,width:249600,height:12000};
  const thresholdX=cap.x+Math.floor(cap.width*.76);
  return {
    source:{runToken,floor:9,theme:'void',lifecycle:'running',tick:522,
      player:{x:335496,y:3385400,halfWidth:9000,halfHeight:14000,
        grounded:false,groundedPlatformId:null,state:'airborne',vy:-4600,health:4},
      platforms:[
        {id:'f9:ground',x:105000,y:3212000,width:270000,height:12000},
        {id:'f9:p2',x:320000,y:3330000,width:40000,height:20000}],
      lastGuardianCrossing:null},
    held:{runToken,floor:9,guardianGateRetained:true,
      verifiedObservedFloorAdvance:true,oldCapId:'f8:cap',
      oldCapX:cap.x,oldCapWidth:cap.width,
      oldRoofY:3224000,thresholdX,
      crossingTick:475,sourceTick:483,firstWorldRenderTick:483,
      observedCrossingX:321096,observedCrossingY:3238000,
      observedHalfWidth:9000,observedHalfHeight:14000,
      submittedFrames:1,visibleSeconds:.08,originalGatewayOpacity:1,
      opticalExitSubmitted:false},
    cap
  };
}
test('actual tick522 airborne approach to existing raised F9 deck retains the source-certified original world and camera window',async()=>{
  const {observedSourceAirborneSuccessorApproach:approach,
    observedSourcePhysicalArrivalPalette:palette,
    observedSourceGatewayDeparturePresence:gate,
    observedSourceOriginalVisibilityWindow:window}=await sourceModule;
  assert.equal(typeof approach,'function');
  const {source,held}=earnedAirborne();
  const before=JSON.stringify({source,held});
  assert.equal(approach(source,held,held.oldRoofY),true);
  assert.equal(palette(source,held)?.sourceBound,true,
    'do not destroy the prior physical gateway during real F9 airborne approach');
  assert.equal(gate(source,held)?.sourceBound,true,
    'old gate, deck, gallery and palette must share the real flight bridge');
  assert.equal(window(source,held)?.sourceBound,true,
    'camera must recognize the same honest 3D passage');
  assert.equal(JSON.stringify({source,held}),before,
    'render evidence must never mutate source, fabricate landings or create a floor');
});
test('the flight bridge cannot counterfeit old guardian victory, platform contact, current run or safety ceiling',async()=>{
  const {observedSourceAirborneSuccessorApproach:approach,
    observedSourcePhysicalArrivalPalette:palette}=await sourceModule;
  const mutations=[
    [s=>s.platforms.pop(),()=>{}],
    [s=>s.platforms[1].y=4100000,()=>{}],
    [s=>s.player.x=600000,()=>{}],
    [s=>s.player.grounded=true,()=>{}],
    [s=>s.player.state='standing',()=>{}],
    [s=>s.player.groundedPlatformId='f9:p2',()=>{}],
    [s=>s.player.vy=NaN,()=>{}],
    [s=>s.player.y=4000000,()=>{}],
    [s=>s.tick=590,()=>{}],
    [s=>s.runToken='unearned-run',()=>{}],
    [s=>s.player.health=0,()=>{}],
    [()=>{},h=>h.verifiedObservedFloorAdvance=false],
    [()=>{},h=>h.oldCapWidth=1],
    [()=>{},h=>h.crossingTick=700],
    [s=>s.lastGuardianCrossing={runToken:s.runToken,fromFloor:8,toFloor:9,
      guardian:{kind:'guardian',active:true,health:1}},()=>{}],
  ];
  for(const [mutateSource,mutateHeld] of mutations){
    const {source,held}=earnedAirborne();mutateSource(source);mutateHeld(held);
    assert.equal(approach(source,held,held.oldRoofY),false,
      'only the same-run earned airborne near-deck corridor qualifies');
    assert.equal(palette(source,held),null,
      'invalid evidence must not color the real world');
  }
});
