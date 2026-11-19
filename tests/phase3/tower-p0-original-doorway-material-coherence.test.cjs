'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const palette=import('../../public/infinite-tower-climb/visuals/original-clockwork-architecture-palette.mjs');

// Exact source-verified Floor8->9 post-crusher evidence from unedited 1x
// danger WebM campaign 44460970003, candidate e32fd811: t518 old real gate
// remained .9845 opaque with .94 bronze roof but the FIRST genuine F9
// receiving roof had already drifted to near-violet #786e7e. That creates
// two incompatible architectural material owners in one actual doorway.
// Test source/GPU material truth; DOES NOT assert native film acceptance.
function recordedRoom(){
  const runToken='recorded-t518-guardian-crusher';
  const source={runToken,lifecycle:'running',floor:9,theme:'void',tick:518,
    player:{health:4,grounded:false,state:'airborne',vy:-12000,
      x:344096,y:3324400,halfWidth:9000,halfHeight:14000},
    platforms:[{id:'f9:ground',x:0,y:3212000,width:480000,height:12000},
      {id:'f9:p2',x:320000,y:3330000,width:40000,height:20000}]};
  const held={runToken,floor:9,oldCapId:'f8:cap',guardianGateRetained:true,
    verifiedObservedFloorAdvance:true,sourceTick:476,crossingTick:475,
    firstWorldRenderTick:476,submittedFrames:10,visibleSeconds:1,
    opticalExitSubmitted:false,originalGatewayOpacity:.9845,
    originalDeckSurface:{opacity:.94}};
  const physical={sourceBound:true,sourceTick:518,crossingTick:475,
    kind:'recorded-source-zero-hp',oldWeight:.08,progress:.92};
  return {source,held,physical};
}

test('source-owned returned original HP-open gate and its real receiving roof share an optical palette, not a violet jump',async()=>{
  const {observedRenderedOriginalDoorwayRoom:room}=await palette;
  const {source,held,physical}=recordedRoom();
  const before=JSON.stringify({source,held,physical});
  const proof=room(source,held,physical);
  assert.equal(proof?.sourceBound,true);
  assert.equal(proof?.sharedOriginalGpuRoom,true);
  assert.equal(proof?.oldWeight,.94,
    'same painted original bronze cap and gate bound the actual f9:ground roof tint');
  assert.equal(proof?.sourceTick,518);
  assert.equal(proof?.kind,'recorded-source-zero-hp');
  assert.equal(JSON.stringify({source,held,physical}),before,
    'presentation must never mutate the authoritative source or original 3D owners');
  // A genuine optically returned gateway retirement must continuously take
  // the connected receiving roof with it, not latch a permanent bronze F9.
  held.originalGatewayOpacity=.43;
  held.originalDeckSurface.opacity=.40;
  assert.equal(room(source,held,{...physical,oldWeight:.25})?.oldWeight,.40);
  held.originalGatewayOpacity=.01;
  held.originalDeckSurface.opacity=0;
  assert.equal(room(source,held,{...physical,oldWeight:0})?.oldWeight,0);
});

test('no historical gate, fake source, old run, unsupported floor, dead hero, stale tick or unsubmitted GPU can tint the Void',async()=>{
  const {observedRenderedOriginalDoorwayRoom:room}=await palette;
  const {source,held,physical}=recordedRoom();
  const variants=[
    [{...source,runToken:'other-run'},held,physical],
    [{...source,floor:8},held,physical],
    [{...source,lifecycle:'result'},held,physical],
    [{...source,player:{...source.player,health:0}},held,physical],
    [{...source,tick:600},held,physical],
    [source,{...held,guardianGateRetained:false},physical],
    [source,{...held,verifiedObservedFloorAdvance:false},physical],
    [source,{...held,oldCapId:'f9:ground'},physical],
    [source,{...held,firstWorldRenderTick:520},physical],
    [source,{...held,submittedFrames:0},physical],
    [source,{...held,submittedFrames:30},physical],
    [source,{...held,visibleSeconds:2.8},physical],
    [source,{...held,opticalExitSubmitted:true},physical],
    [source,{...held,originalGatewayOpacity:NaN},physical],
    [source,{...held,originalDeckSurface:null},physical],
    [source,held,{...physical,sourceBound:false}],
    [source,held,{...physical,sourceTick:516}],
    [source,held,{...physical,kind:'floor-number-only'}],
  ];
  for(const [s,h,p] of variants)
    assert.equal(room(s,h,p),null,'invalid source or GPU owner must not recolor the live successor scene');
});

test('World applies one returned original room certificate to near roof, shaft architecture and sky without changing gameplay',()=>{
  const world=fs.readFileSync(path.resolve(__dirname,
    '../../public/infinite-tower-climb/visuals/world.mjs'),'utf8');
  assert.match(world,/observedRenderedOriginalDoorwayRoom\(\s*snapshot,retainedEarnedCap,materialProof\)/);
  assert.match(world,/observedCertifiedClockworkHorizon\(\s*snapshot,sharedDoorwayMaterialProof,opticalTail\)/);
  assert.match(world,/sourceAlignedMaterialProof=returnedBronzePaletteLock\?/);
  assert.match(world,/updateOriginalClockworkSuccessorRoute\(arrivalRoutePalette,\s*sourceAlignedMaterialProof,opticalTail\)/);
  assert.doesNotMatch(world,/snapshot\.player\.x\s*=/);
});
