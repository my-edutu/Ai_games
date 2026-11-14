const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const fs=require('node:fs');
const load=()=>import(pathToFileURL(path.resolve('public/infinite-tower-climb/visuals/source-earned-bearing-run.mjs')).href);
const ground={id:'f9:ground',x:0,y:3212000,width:480000,height:12000};
const step={id:'f9:gateway-step',x:263596,y:3290000,width:115000,height:10000};
const held={runToken:'verified',floor:9,oldCapId:'f8:cap',
  guardianGateRetained:true,verifiedObservedFloorAdvance:true,
  thresholdX:304896,oldRoofY:3224000,oldCapX:115200,oldCapWidth:249600};
const source={runToken:'verified',floor:9,theme:'void',lifecycle:'running',
  tick:475,worldWidth:480000,chunkBaseY:3240000,player:{health:4},
  platforms:[ground,step],lastGuardianCrossing:null};
test('real old threshold and real F9 grounded step produce bounded coherent 3D bearing locations',async()=>{
  const {plannedEarnedClockworkVoidBearings:f}=await load();
  const p=f(source,held);
  assert.equal(p.roofId,'f9:ground');
  assert.equal(p.stepId,'f9:gateway-step');
  assert.equal(p.nodes.length,3);
  assert.deepEqual(p.nodes.map(x=>x.materialPhase),['bronze','transition','void']);
  assert.ok(p.nodes.every(x=>Number.isFinite(x.angle)&&x.height>=5&&x.height<=7));
  assert.ok(p.nodes.every(x=>x.x>=0&&x.x<=480000));
  assert.equal(p.nodes[0].x,296896);
});
test('cold GPU first F9 receipt retains TRUE grounded roof after delayed last-guardian record',async()=>{
  const {plannedEarnedClockworkVoidBearings:f}=await load();
  const first={...held,verifiedObservedFloorAdvance:false,sourceTick:475,firstObservedTick:475};
  const groundBody={...source,player:{health:4,grounded:true,groundedPlatformId:'f9:ground',y:3238000,halfHeight:14000}};
  assert.ok(f(groundBody,first));
  assert.equal(f({...groundBody,player:{...groundBody.player,groundedPlatformId:'f8:cap'}},first),null);
  assert.equal(f({...groundBody,player:{...groundBody.player,y:3239000}},first),null);
  assert.equal(f({...groundBody,tick:490},first),null);
});
test('missing real support, wrong run, defeated source or claimed physics veto presentation gallery',async()=>{
  const {plannedEarnedClockworkVoidBearings:f}=await load();
  assert.equal(f(source,{...held,verifiedObservedFloorAdvance:false}),null);
  assert.equal(f({...source,platforms:[ground]},held),null);
  assert.equal(f({...source,platforms:[{...ground,y:3211000},step]},held),null);
  assert.equal(f({...source,runToken:'different'},held),null);
  assert.equal(f({...source,floor:8},held),null);
  const invalid={...source,lastGuardianCrossing:{runToken:'different',sourceTick:475,
    fromFloor:8,toFloor:9,guardian:{kind:'guardian',active:false,health:0},
    cap:{id:'f8:cap'}}};
  assert.equal(f(invalid,held),null);
});
test('the authentic gallery is integrated only in Tower world rebuild, not in simulation or HUD',()=>{
  const world=fs.readFileSync('public/infinite-tower-climb/visuals/world.mjs','utf8');
  assert.match(world,/import \{ plannedEarnedClockworkVoidBearings \} from '.\/source-earned-bearing-run\.mjs'/);
  assert.match(world,/function buildEarnedClockworkVoidBearingRoute\(snapshot\)/);
  assert.match(world,/buildEarnedClockworkVoidBearingRoute\(snapshot\);/);
  assert.match(world,/SourceEarnedClockworkVoidBearingGallery/);
  assert.match(world,/instanced\(supportRoot,rounded\(\),material,items\)/);
});
