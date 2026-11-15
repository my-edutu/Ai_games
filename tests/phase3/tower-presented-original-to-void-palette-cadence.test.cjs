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
  // The source-authentic old/new handoff must be legible on actual GPU
  // returns 2 and 3. Holding the palette beyond return 4 made the old
  // world vanish abruptly when the 70-tick source witness expired in 1x
  // software-WebGL footage, so the former 5/12-return slow-fade assertion
  // was a regression to the observed hard-cut failure, not a quality gate.
  held.submittedFrames=2;held.visibleSeconds=.22;
  const bridge=sample(source,held);
  assert.ok(bridge.oldWeight<first.oldWeight && bridge.oldWeight>purelyPhysical.oldWeight,
    'real second return must visibly advance but not skip the old/new palette');
  held.submittedFrames=3;held.visibleSeconds=.32;
  const late=sample(source,held);
  // By the third *successful* return the lens can have caught up to the
  // ACTUAL 45m source stride. Requiring more bronze than physical authority
  // allows forces a visible final-frame snap when the 70-tick witness ends.
  assert.ok(late.oldWeight<bridge.oldWeight && late.oldWeight>=purelyPhysical.oldWeight,
    'third real return advances without overshooting the actual source-owned palette');
  held.submittedFrames=4;held.visibleSeconds=.42;
  assert.equal(sample(source,held).oldWeight,purelyPhysical.oldWeight,
    'completed source-authentic optical handoff must not freeze beyond four returns');
  held.submittedFrames=12;held.visibleSeconds=.9;
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
