'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');

const palette=import(pathToFileURL(path.resolve(
  'public/infinite-tower-climb/visuals/source-physical-arrival-palette.mjs')).href);

function earnedFrame(){
  const cap={id:'f8:cap',x:200000,y:6000,width:140000,height:500};
  const exitX=cap.x+Math.floor(cap.width*.76);
  const source={floor:9,theme:'void',runToken:'same-physical-expedition',tick:480,
    lifecycle:'running',player:{x:369296,y:10000,halfWidth:2000,
      halfHeight:3500,health:90,grounded:false,groundedPlatformId:null,
      state:'airborne',vy:500},
    platforms:[{id:'f9:ground',x:300000,y:6000,width:140000,height:500}],
    lastGuardianCrossing:{runToken:'same-physical-expedition',
      sourceTick:451,fromFloor:8,toFloor:9,cap,exitX,crossingX:324296,
      halfWidth:2000,halfHeight:3500,
      guardian:{kind:'guardian',active:false,health:0}}};
  const held={runToken:source.runToken,floor:9,
    guardianGateRetained:true,oldRoofY:6500,thresholdX:exitX,
    firstWorldRenderTick:476,submittedFrames:1,
    visibleSeconds:.07,originalGatewayOpacity:1,opticalExitSubmitted:false};
  return {source,held};
}

test('first F9 GPU-return frames keep the exact old arch, real successor decks and environmental material family coherent despite source ticks advancing',async()=>{
  const {observedSourcePhysicalArrivalPalette:sample}=await palette;
  const {source,held}=earnedFrame();
  const purelyPhysical=sample(source);
  assert.ok(purelyPhysical.oldWeight>0 && purelyPhysical.oldWeight<1);
  const first=sample(source,held);
  assert.equal(first.sourceBound,true);
  assert.ok(first.oldWeight>.9 && first.oldWeight<1,
    'after the first submitted old/new shot, real stepped travel must not freeze the actual landing color');
  assert.ok(first.oldWeight>purelyPhysical.oldWeight);
  // The NEW original 25fps 04aaad27 film directly contradicts the earlier
  // four-return aesthetic assumption: it shows the real bronze arch then
  // hard violet replacement, not multiple consecutive grounded source
  // crossing frames. Preserve material motion on each real GPU return,
  // without prematurely treating four submissions as visual acceptance.
  held.submittedFrames=2;held.visibleSeconds=.22;
  const bridge=sample(source,held);
  assert.ok(bridge.oldWeight<first.oldWeight && bridge.oldWeight>purelyPhysical.oldWeight,
    'real second return must visibly advance but not skip the old/new palette');
  held.submittedFrames=3;held.visibleSeconds=.32;
  const late=sample(source,held);
  // Third true WebGL return still has genuinely shared old/new materials;
  // source motion, not a separate scene clock, remains the upper bound.
  assert.ok(late.oldWeight<bridge.oldWeight && late.oldWeight>=purelyPhysical.oldWeight,
    'third real return advances without overshooting the actual source-owned palette');
  held.submittedFrames=4;held.visibleSeconds=.42;
  const fourth=sample(source,held);
  assert.ok(fourth.oldWeight<late.oldWeight &&
    fourth.oldWeight>purelyPhysical.oldWeight,
    'four returned frames must not erase the original gateway before a native visual bridge');
  held.submittedFrames=8;held.visibleSeconds=1.22;
  assert.equal(sample(source,held).oldWeight,purelyPhysical.oldWeight);
  held.submittedFrames=12;held.visibleSeconds=1.5;
  assert.equal(sample(source,held).oldWeight,purelyPhysical.oldWeight);
});

test('no original retained GPU owner, expired handoff or wrong run cannot create an artificial old-world palette',async()=>{
  const {observedSourcePhysicalArrivalPalette:sample}=await palette;
  const {source,held}=earnedFrame();
  const pure=sample(source);
  assert.equal(sample(source,null).oldWeight,pure.oldWeight);
  assert.equal(sample(source,{...held,firstWorldRenderTick:undefined}).oldWeight,pure.oldWeight);
  assert.equal(sample(source,{...held,opticalExitSubmitted:true}).oldWeight,pure.oldWeight);
  assert.equal(sample(source,{...held,originalGatewayOpacity:0}).oldWeight,pure.oldWeight);
  assert.equal(sample(source,{...held,submittedFrames:30}).oldWeight,pure.oldWeight);
  assert.equal(sample({...source,runToken:'other-episode'},held),null);
  assert.equal(sample({...source,lastGuardianCrossing:{...source.lastGuardianCrossing,
    guardian:{kind:'guardian',active:true,health:1}}},held),null);
});

// Native 1x capture showed the original high-alpha gateway surviving while
// authentic F9 source motion had already carried the body well past its sill.
// A far-away old bronze owner must not freeze the new structural scene,
// but neither a fake position nor an unverified passage may clear its mask.
test('a source-authenticated body that has physically left the old sill reveals the incoming shaft without trusting a timer',async()=>{
  const {sourceOwnedOriginalArchitectureCoverage:coverage,
    sourceAlignedIncomingShaftOpacity:incoming}=await palette;
  const {source,held}=earnedFrame();
  held.verifiedObservedFloorAdvance=true;
  held.crossingTick=451;
  held.sourceTick=460;
  held.oldCapId='f8:cap';held.oldCapX=200000;held.oldCapWidth=140000;
  held.oldRoofY=6500;
  held.originalGatewayOpacity=1;
  held.originalArchitectureCoverage=1;
  const near={...source,player:{...source.player,x:held.thresholdX+24000,
    y:10000,grounded:true,vy:0,state:'standing',groundedPlatformId:'f9:ground'}};
  // Real grounded sill plus a returned old-gate shot earns <=28% authentic
  // next-floor structural depth, NOT an opaque cold-world replacement.
  assert.equal(coverage(near,held),.72,
    'source-bound first-sill depth still leaves 72% original bronze coverage');
  const far={...near,player:{...near.player,x:held.thresholdX+165000},
    platforms:[{...source.platforms[0],width:300000}]};
  assert.ok(coverage(far,held)<.05,
    'authoritative grounded motion beyond the entire historical corridor must unblock the real successor world');
  assert.ok(incoming(far,held,.6)>.45,
    'new structural material is no longer indefinitely hidden by a gate behind the climber');
  assert.equal(coverage({...far,player:{...far.player,groundedPlatformId:'f9:fake'}},held),1,
    'a fictitious grounded contact cannot release bronze coverage');
  assert.equal(coverage(far,{...held,verifiedObservedFloorAdvance:false}),1,
    'an unverified previous cap cannot grant the optical departure');
  assert.equal(coverage({...far,lastGuardianCrossing:{...source.lastGuardianCrossing,
    guardian:{kind:'guardian',active:true,health:1}}},held),1,
    'a conflicting living guardian vetoes staged original passage clearance');
});
