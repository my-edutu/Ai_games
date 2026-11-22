'use strict';
// The existing true Floor8 HP-zero gateway and walkable Floor9 roof must
// share a progressively visible ORIGINAL successor shaft. Never promote a
// browser poll, source tick, fake render, or one-frame violet hard cut.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const imported=import('../../public/infinite-tower-climb/visuals/original-room-returned-exit.mjs');
const cap={id:'f8:cap',kind:'oneway',x:115200,y:3212000,width:249600,height:12000};
const sill=cap.x+Math.floor(cap.width*.76),roofY=cap.y+cap.height;
function realReturnedShaft(){
  const runToken='real-same-episode-original-crusher-guardian';
  const source={runToken,lifecycle:'running',floor:9,theme:'void',tick:473,
    player:{health:5,grounded:true,state:'standing',vy:0,
      groundedPlatformId:'f9:ground',x:sill+29000,y:roofY+14000,
      halfWidth:9000,halfHeight:14000},
    platforms:[{id:'f9:ground',kind:'solid',x:0,y:cap.y,width:480000,height:cap.height}],
    lastGuardianCrossing:{runToken,sourceTick:451,fromFloor:8,toFloor:9,
      cap,exitX:sill,crossingX:sill+13000,crossingY:roofY+14000,
      halfWidth:9000,halfHeight:14000,
      guardian:{kind:'guardian',floor:8,active:false,health:0}}};
  const held={runToken,floor:9,guardianGateRetained:true,
    verifiedObservedFloorAdvance:true,oldCapId:'f8:cap',
    oldCapX:cap.x,oldCapWidth:cap.width,oldRoofY:roofY,
    thresholdX:sill,sourceTick:454,crossingTick:451,
    firstWorldRenderTick:460,submittedFrames:12,visibleSeconds:.75,
    originalGatewayOpacity:.87,opticalExitSubmitted:false};
  const job={runToken,floor:9,sourceTick:460,
    proof:'recorded-source-gateway',structureDeferred:true,
    state:'awaiting-structural-submission',submittedFrames:12,
    structureBuiltAtSubmitted:2,structuralVisibleReturns:0,
    structuralVisibleSeconds:0,structuralFade:.23,structuralRoot:{isGroup:true}};
  return {source,held,job};
}
test('source-supported true successor shaft ramps gradually with six nonzero returned WebGL frames and 520ms',async()=>{
  const {observedSupportedReturnedShaftDepth:depth}=await imported;
  const {source,held,job}=realReturnedShaft(),frozen=JSON.stringify([source,held,job]);
  const first=depth(source,held,job),three=depth(source,held,{
    ...job,structuralVisibleReturns:3,structuralVisibleSeconds:.26});
  const six=depth(source,held,{
    ...job,structuralVisibleReturns:6,structuralVisibleSeconds:.52});
  assert.equal(first?.alpha,.22,'one source-valid cold shaft starts as a thin depth aperture');
  assert.ok(three?.alpha>.22 && three?.alpha<.4,
    'already-returned original 3D shaft must not be stalled at its first alpha');
  assert.equal(six?.alpha,.4,
    'six real visible submissions spanning 520ms permit a safe 40% successor load path');
  assert.equal(depth(source,held,{
    ...job,structuralVisibleReturns:6,structuralVisibleSeconds:.1})?.alpha,
    +(.22+.18*(.1/.52)).toFixed(4),
    'many quick returns cannot fabricate 520ms of visible scene time');
  assert.equal(depth(source,held,{
    ...job,structuralVisibleReturns:3,structuralVisibleSeconds:.65})?.alpha,.31,
    'long display without enough successful returns cannot skip the frame budget');
  assert.equal(JSON.stringify([source,held,job]),frozen,
    'render policy cannot mutate authoritative snapshot or material owner');
});
test('wrong guardian/run, ungrounded unsupported body and invented return clocks never earn shaft depth',async()=>{
  const {observedSupportedReturnedShaftDepth:depth}=await imported;
  const {source,held,job}=realReturnedShaft();
  const mature={...job,structuralVisibleReturns:6,structuralVisibleSeconds:.52};
  const reject=[
    [{...source,runToken:'different-run'},held,mature],
    [{...source,lastGuardianCrossing:{...source.lastGuardianCrossing,
      guardian:{kind:'guardian',floor:8,active:true,health:1}}},held,mature],
    [{...source,player:{...source.player,grounded:false,
      groundedPlatformId:null,state:'standing'}},held,mature],
    [{...source,player:{...source.player,groundedPlatformId:'f9:imagined'}},held,mature],
    [{...source,platforms:[{...source.platforms[0],y:cap.y-3000}]},held,mature],
    [source,{...held,submittedFrames:0},mature],
    [source,held,{...mature,submittedFrames:2}],
    [source,held,{...mature,structuralVisibleSeconds:0}],
    [source,held,{...mature,structuralVisibleSeconds:NaN}],
    [source,held,{...mature,structuralVisibleReturns:31}],
    [source,held,{...mature,structuralRoot:{isGroup:false}}],
    [source,held,{...mature,state:'unrelated-build'}],
    [source,held,{...mature,runToken:'foreign'}],
  ];
  for(const [s,h,j] of reject)
    assert.equal(depth(s,h,j),null,
      'a false event/support/return or cross-run source cannot authorize new shaft');
});
