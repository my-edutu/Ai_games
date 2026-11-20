'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const policy=import('../../public/infinite-tower-climb/visuals/far-side-shaft-transition.mjs');

function authenticFloorNine() {
  const cap={id:'f8:cap',x:115200,y:3212000,width:249600,height:12000};
  const exitX=cap.x+Math.floor(cap.width*.76);
  const runToken='actual-source-guardian-defeat-and-3d-receiving-roof';
  const source={
    runToken,lifecycle:'running',floor:9,theme:'void',tick:490,
    player:{health:5,grounded:true,state:'standing',vy:0,
      groundedPlatformId:'f9:ground',x:exitX+18000,y:3238000,
      halfWidth:9000,halfHeight:14000},
    platforms:[{id:'f9:ground',x:105000,y:3212000,width:270000,height:12000}],
    lastGuardianCrossing:{runToken,sourceTick:475,fromFloor:8,toFloor:9,
      cap,exitX,crossingX:exitX+13000,halfWidth:9000,halfHeight:14000,
      guardian:{kind:'guardian',active:false,health:0}}
  };
  const held={runToken,floor:9,oldCapId:'f8:cap',
    guardianGateRetained:true,verifiedObservedFloorAdvance:true,
    crossingTick:475,firstWorldRenderTick:480,
    originalGatewayOpacity:.91,submittedFrames:3,visibleSeconds:.2,
    opticalExitSubmitted:false};
  const job={runToken,floor:9,proof:'recorded-source-gateway',
    structureDeferred:true,state:'awaiting-void-biome-build',
    sourceTick:480,submittedFrames:3,structureBuiltAtSubmitted:2,
    structuralRoot:{isGroup:true,visible:true},structuralFade:.24,
    structuralVisibleReturns:1,structuralVisibleSeconds:.07};
  return {source,held,job};
}

test('source-earned F9 core and old gate get four meaningful returned draws before cold periphery',async()=>{
  const {observedSourceReturnedCoreBeforeScenicUpload:ready}=await policy;
  const a=authenticFloorNine(),before=JSON.stringify(a);
  assert.equal(ready(a.source,a.held,a.job,'periphery'),false,
    'one returned shaft draw must not be hidden by next expensive scene build');
  assert.equal(ready(a.source,a.held,{
    ...a.job,structuralVisibleReturns:2,structuralVisibleSeconds:.15},'periphery'),false,
    'the older two-return 0.12s policy permitted a native-film hard cut');
  const four={...a.job,submittedFrames:6,structuralVisibleReturns:4};
  assert.equal(ready(a.source,a.held,{
    ...four,structuralVisibleSeconds:.30},'periphery'),false,
    'four fast frames cannot spend the real painted-duration floor');
  assert.equal(ready(a.source,a.held,{
    ...four,structuralVisibleSeconds:.35},'periphery'),true);
  assert.equal(JSON.stringify(a),before,'pure presentation decision never edits source authority');
});

test('original animated Void detail waits for six real core returns, not a single short crossfade',async()=>{
  const {observedSourceReturnedCoreBeforeScenicUpload:ready}=await policy;
  const a=authenticFloorNine();
  const j={...a.job,submittedFrames:7,peripheryBuiltAtSubmitted:6,
    structuralVisibleReturns:5,structuralVisibleSeconds:.55};
  assert.equal(ready(a.source,a.held,j,'biome'),false,
    'the old three-frame biome upload cut off the real shared-room shot');
  assert.equal(ready(a.source,a.held,{
    ...j,structuralVisibleReturns:6,structuralVisibleSeconds:.48},'biome'),false,
    'six short returns still do not establish half a second of GPU-owned core');
  assert.equal(ready(a.source,a.held,{
    ...j,structuralVisibleReturns:6,structuralVisibleSeconds:.55},'biome'),true);
  assert.equal(ready(a.source,a.held,{
    ...j,structuralVisibleReturns:6,structuralVisibleSeconds:.55,
    submittedFrames:6},'biome'),false,
    'an unreturned outer build cannot authorize new biome compilation');
});

test('no phantom returned GPU frames, stale floor, foreign source, defeated hero or fake guardian authorizes scenic staging',async()=>{
  const {observedSourceReturnedCoreBeforeScenicUpload:ready}=await policy;
  const a=authenticFloorNine();
  const good={...a.job,structuralVisibleReturns:3,structuralVisibleSeconds:.23};
  const f=(s=a.source,h=a.held,j=good,stage='periphery')=>ready(s,h,j,stage);
  assert.equal(f({...a.source,floor:8}),false);
  assert.equal(f({...a.source,runToken:'other-run'}),false);
  assert.equal(f({...a.source,player:{...a.source.player,health:0}}),false);
  assert.equal(f({...a.source,tick:479}),false);
  assert.equal(f({...a.source,lastGuardianCrossing:{...a.source.lastGuardianCrossing,
    guardian:{kind:'guardian',active:true,health:5}}}),false);
  assert.equal(f(a.source,a.held,{...good,proof:'source-floor-label'}),false);
  assert.equal(f(a.source,a.held,{...good,runToken:'different'}),false);
  assert.equal(f(a.source,a.held,{...good,structuralRoot:null}),false);
  assert.equal(f(a.source,a.held,{...good,structureBuiltAtSubmitted:3}),false);
  assert.equal(f(a.source,a.held,{...good,structuralVisibleSeconds:NaN}),false);
  assert.equal(f(a.source,a.held,good,'invented-stage'),false);
});

test('once old optical owner truly retires, subsequent scenic stages cannot deadlock the real destination',async()=>{
  const {observedSourceReturnedCoreBeforeScenicUpload:ready}=await policy;
  const a=authenticFloorNine();
  assert.equal(ready(a.source,{...a.held,originalGatewayOpacity:0},a.job,'periphery'),true);
  assert.equal(ready(a.source,null,a.job,'periphery'),true,
    'already retired old group cannot block the actual new shaft');
  assert.equal(ready(a.source,{...a.held,opticalExitSubmitted:true},a.job,'periphery'),true);
});

test('actual World schedules BOTH original scenic uploads after successful same-run core WebGL returns, never deferring physics',()=>{
  const root=path.resolve(__dirname,'../..');
  const world=fs.readFileSync(path.join(root,'public/infinite-tower-climb/visuals/world.mjs'),'utf8');
  assert.match(world,/observedSourceReturnedCoreBeforeScenicUpload\(snapshot,\s*retainedEarnedCap,arrival,'periphery'\)/);
  assert.match(world,/observedSourceReturnedCoreBeforeScenicUpload\(snapshot,\s*retainedEarnedCap,arrival,'biome'\)/);
  assert.match(world,/if\(job\.structureDeferred && job\.structuralRoot\?\.visible===true &&[\s\S]*?job\.structuralVisibleSeconds=Math\.min\(3,/);
  assert.match(world,/job\.structuralVisibleSeconds\+shown/);
  assert.match(world,/for\(const p of snapshot\.platforms\|\|\[\]\)/);
  assert.match(world,/for\(const h of snapshot\.hazards\|\|\[\]\)buildHazard/);
  assert.doesNotMatch(world,/snapshot\.floor\s*=\s*9|snapshot\.player\.x\s*=/);
});
