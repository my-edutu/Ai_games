'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const replacement=import('../../public/infinite-tower-climb/visuals/original-room-returned-exit.mjs');
const palette=import('../../public/infinite-tower-climb/visuals/original-clockwork-architecture-palette.mjs');

function originalFirstEpisode() {
  const runToken='original-guardian-hp-zero-475';
  const source={runToken,lifecycle:'running',floor:9,theme:'void',
    tick:516,player:{health:4}};
  const held={runToken,floor:9,oldCapId:'f8:cap',
    verifiedObservedFloorAdvance:true,guardianGateRetained:true,
    crossingTick:475,firstWorldRenderTick:475,
    submittedFrames:9,visibleSeconds:1.1,
    originalGatewayOpacity:.985,originalGallerySourceOpacity:.94,
    originalDeckSurface:{opacity:.94},opticalExitSubmitted:false};
  const job={runToken,floor:9,proof:'recorded-source-gateway',
    structureDeferred:true,sourceTick:475,submittedFrames:9,
    structureBuiltAtSubmitted:5,structuralVisibleReturns:0,
    structuralFade:0,structuralRoot:{visible:false},
    state:'awaiting-structural-submission'};
  return {source,held,job};
}

test('real source-cleared hero alone cannot tear down old gallery before original successor shaft visibly returns',async()=>{
  const {observedReturnedSuccessorRoomReady:ready}=await replacement;
  const {source,held,job}=originalFirstEpisode();
  assert.equal(ready(source,held,job),false);
  assert.equal(ready(source,held,{...job,structuralVisibleReturns:2,
    structuralRoot:{visible:true},structuralFade:.45}),false,
    'nontransparent previous doorway and roof must not be cut even after returned shaft');
  const cleared={...held,originalGatewayOpacity:0,
    originalGallerySourceOpacity:0,originalDeckSurface:{opacity:0},
    opticalExitSubmitted:true};
  assert.equal(ready(source,cleared,job),false,
    'zero old opacity cannot imply a painted successor');
  assert.equal(ready(source,cleared,{...job,structuralVisibleReturns:2,
    structuralFade:.4,structuralRoot:{visible:true}}),true);
});

test('wrong run, unrecorded Floor9, dead hero, unreturned world and unsubmitted old frame cannot authorize removal',async()=>{
  const {observedReturnedSuccessorRoomReady:ready}=await replacement;
  const {source,held,job}=originalFirstEpisode();
  const old={...held,originalGatewayOpacity:0,originalGallerySourceOpacity:0,
    originalDeckSurface:{opacity:0},opticalExitSubmitted:true};
  const returned={...job,structuralVisibleReturns:2,
    structuralFade:.4,structuralRoot:{visible:true}};
  const reject=[
    [{...source,runToken:'other'},old,returned],
    [{...source,player:{health:0}},old,returned],
    [{...source,floor:8},old,returned],
    [{...source,tick:700},old,returned],
    [source,{...old,verifiedObservedFloorAdvance:false},returned],
    [source,{...old,guardianGateRetained:false},returned],
    [source,{...old,submittedFrames:0},returned],
    [source,{...old,visibleSeconds:0},returned],
    [source,{...old,oldCapId:'f9:ground'},returned],
    [source,old,{...returned,runToken:'other'}],
    [source,old,{...returned,structuralVisibleReturns:1}],
    [source,old,{...returned,structuralRoot:{visible:false}}],
    [source,old,{...returned,sourceTick:476}],
    [source,old,{...returned,proof:'floor-number-only'}]
  ];
  for(const [s,h,j] of reject)
    assert.equal(ready(s,h,j),false,'invalid source or GPU return cannot authorize exit');
});

test('already returned original gate and bronze bearing use one source-matched palette, not independent violet switch',async()=>{
  const {coherentOriginalBearingDeparture:cohere}=await palette;
  const {source}=originalFirstEpisode();
  const proof={sourceBound:true,sharedOriginalGpuRoom:true,
    runToken:source.runToken,sourceTick:source.tick,
    crossingTick:475,kind:'recorded-source-zero-hp',oldWeight:.94};
  assert.ok(Math.abs(cohere(source,proof,.92)-.06)<1e-9);
  assert.equal(cohere(source,null,.92),.92);
  assert.equal(cohere(source,{...proof,runToken:'another'},.92),.92);
  assert.equal(cohere(source,{...proof,sourceTick:515},.92),.92);
  assert.equal(cohere({...source,player:{health:0}},proof,.92),.92);
  assert.equal(cohere(source,{...proof,kind:'floor-number-only'},.92),.92);
  assert.equal(cohere(source,{...proof,oldWeight:0},.92),.92);
});

test('real World binds both outgoing geometry retention and original bearings to source plus returned-shaft evidence',()=>{
  const w=fs.readFileSync(path.resolve(__dirname,
    '../../public/infinite-tower-climb/visuals/world.mjs'),'utf8');
  assert.match(w,/const returnedReplacement=physicallyBeyondOriginalDoor\s*&&\s*observedReturnedSuccessorRoomReady/);
  assert.doesNotMatch(w,/if \(\(physicallyBeyondOriginalDoor && !farSide\) \|\| options.stale/);
  assert.match(w,/awaitingSourceReturnedReplacement[\s\S]*?snapshot.tick-held.sourceTick>/);
  assert.match(w,/departure=coherentOriginalBearingDeparture\(\s*snapshot,sharedDoorwayMaterialProof,departure\)/);
  assert.match(w,/held\.opticalExitSubmitted=held\.originalGatewayOpacity<=\.01/);
});
