'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const helperPath=path.resolve(__dirname,'../../public/infinite-tower-climb/visuals/source-returned-room-timeline.mjs');
const worldPath=path.resolve(__dirname,'../../public/infinite-tower-climb/visuals/world.mjs');
const scenePath=path.resolve(__dirname,'../../public/infinite-tower-climb/visuals/scene.mjs');
function evidence() {
  const runToken='true-guardian-gateway';
  const source={runToken,tick:515,floor:9,theme:'void',lifecycle:'running',
    player:{health:5},lastGuardianCrossing:{runToken,fromFloor:8,toFloor:9,
      sourceTick:475,cap:{id:'f8:cap'},guardian:{kind:'guardian',active:false,health:0}}};
  const old={runToken,floor:9,firstWorldRenderTick:476,
    guardianGateRetained:true,verifiedObservedFloorAdvance:true,
    submittedFrames:8,visibleSeconds:.7,originalGatewayOpacity:.65,
    originalDeckSurface:{opacity:.6},originalGallerySourceOpacity:.50,
    originalCoreOpacity:.56};
  const next={runToken,floor:9,proof:'recorded-source-gateway',
    sourceTick:476,submittedFrames:8,state:'awaiting-structural-submission',
    structuralRoot:{visible:true},structuralFade:.35,
    structuralVisibleReturns:4,structuralVisibleSeconds:.32,
    detailFade:.1,biomeFade:0,vistaFade:0};
  return {source,old,next};
}
test('real source authenticates the two independently returned world owners and their different visibility clocks',async()=>{
  const {observedSourceReturnedRoomState:observe}=await import(helperPath);
  const {source,old,next}=evidence();
  const result=observe(source,old,next,'8e8269',{sourceBound:true,sourceTick:515,oldWeight:.55});
  assert.equal(result.sourceBound,true);
  assert.equal(result.originalGatewayOpacity,.65);
  assert.equal(result.successorStructuralOpacity,.35);
  assert.equal(result.successorStructuralVisibleReturns,4);
  assert.equal(result.sourceCertifiedOldSky,.55);
  assert.equal(result.actualReceivingRoofColor,'8e8269');
  assert.match(result.limitation,/NOT composited native WebM pixels/);
  // The old GPU owner may have legitimately retired. The real successor is
  // still observed; never mislabel that event as old steel being drawn.
  const retired=observe(source,null,next,'756c80',null);
  assert.equal(retired.originalOwnerPresent,false);
  assert.equal(retired.originalGatewayOpacity,null);
  assert.equal(retired.successorStructuralOpacity,.35);
});
test('wrong run, dead player, unearned floor, forged guardian or speculative return never gets a true receipt',async()=>{
  const {observedSourceReturnedRoomState:observe}=await import(helperPath);
  const {source,old,next}=evidence();
  assert.equal(observe({...source,runToken:'wrong'},old,next),null);
  assert.equal(observe({...source,floor:8},old,next),null);
  assert.equal(observe({...source,player:{health:0}},old,next),null);
  assert.equal(observe({...source,lastGuardianCrossing:{...source.lastGuardianCrossing,
    guardian:{kind:'guardian',active:true,health:1}}},old,next),null);
  assert.equal(observe(source,{...old,submittedFrames:0},{...next,submittedFrames:0}),null);
  assert.equal(observe(source,{...old,runToken:'another'},{...next,runToken:'another'}),null);
  assert.equal(observe(source,null,{...next,proof:'adjacent-browser-guardian'}),null);
});
test('integration captures immutable room/camera witnesses only after the actual renderer has returned',()=>{
  const world=fs.readFileSync(worldPath,'utf8');
  const scene=fs.readFileSync(scenePath,'utf8');
  assert.match(world,/sourceHandoffReturnWitness\(source\)/);
  assert.match(world,/observedSourceReturnedRoomState\(source,retainedEarnedCap/);
  const returned=scene.indexOf('world.noteFrameSubmitted?.(snapshot,options,dt);');
  const capture=scene.indexOf('const roomReturn=world.sourceHandoffReturnWitness?.(snapshot);');
  const render=scene.indexOf('renderer.render(');
  assert.ok(render>=0&&returned>render&&capture>returned);
  assert.match(scene,/originalToVoidReturnedTimeline\.length<ORIGINAL_TO_VOID_RETURN_LIMIT/);
  assert.match(scene,/submittedFogColor:scene\.fog\?\.color/);
});

// This is an evidence-unblocker test, never an extra gameplay score.
test('the unchanged normal-speed film harness preserves first-return World/camera owners in their own source-pinned sidecar',()=>{
  const capture=fs.readFileSync(path.resolve(__dirname,'../browser/tower-live-motion.spec.cjs'),'utf8');
  const call=capture.indexOf('const originalToVoidReturnTimeline = await page.evaluate(');
  const saved=capture.indexOf("'original-to-void-returned-room-timeline.json'");
  assert.ok(call>0 && saved>call,'must retain original candidate World owner records');
  assert.match(capture,/SOURCE_RENDER_RETURNS_ONLY/);
  assert.match(capture,/nativeVideoMatched:false/);
  assert.match(capture,/verdict:'NOT EVALUATED'/);
});
