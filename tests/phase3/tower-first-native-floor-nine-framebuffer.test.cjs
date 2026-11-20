'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const modulePromise=import(pathToFileURL(path.join(root,
  'public/infinite-tower-climb/visuals/cold-floor-resolution.mjs')).href);
const view={stale:false,quality:'low',camera:'follow',reducedMotion:false};
function receipt(){
  const runToken='authentic-8-to-9',tick=475;
  const oldCapX=250000,oldCapWidth=160000;
  const thresholdX=oldCapX+Math.floor(oldCapWidth*.76);
  const snapshot={runToken,floor:9,theme:'void',tick,
    lifecycle:'running',chunkBaseY:82000,worldWidth:480000,
    player:{health:4,state:'standing',grounded:true,
      groundedPlatformId:'f9:ground',vy:0,x:thresholdX+19000,
      y:100000,halfWidth:9000,halfHeight:18000},
    platforms:[{id:'f9:ground',x:240000,y:80000,
      width:185000,height:2000}],lastGuardianCrossing:null};
  const held={runToken,floor:9,sourceTick:tick,tick,
    nextBaseY:snapshot.chunkBaseY,worldWidth:snapshot.worldWidth,
    guardianGateRetained:true,verifiedObservedFloorAdvance:true,
    oldCapId:'f8:cap',oldCapX,oldCapWidth,oldRoofY:82000,
    thresholdX,crossingTick:null,
    observedCrossingX:snapshot.player.x,
    observedCrossingY:snapshot.player.y,
    observedHalfWidth:snapshot.player.halfWidth,
    observedHalfHeight:snapshot.player.halfHeight,
    submittedFrames:0,visibleSeconds:0,originalGatewayOpacity:1,
    originalArchitectureWorldCertified:true,
    originalArchitectureCoverageSourceTick:tick};
  return {snapshot,held};
}
test('first REAL HP-open original gate + grounded Floor9 receipt starts bounded low-tier buffer before delayed immutable event',async()=>{
  const {createTowerColdFloorResolution}=await modulePromise;
  const {snapshot,held}=receipt(),p=createTowerColdFloorResolution();
  const before=JSON.stringify([snapshot,held]);
  assert.equal(p.observe(snapshot,{stage:'none'},view,held),.72);
  assert.equal(p.diagnostics().sourceTick,475);
  assert.equal(p.submitted(snapshot,730),true);
  assert.equal(p.observe(snapshot,null,view,held),.72);
  for(let i=1;i<8;i++)assert.equal(p.submitted(snapshot,679),true);
  assert.equal(p.observe(snapshot,null,view,held),1);
  assert.equal(p.diagnostics().finishedSourceTick,475);
  const published={...snapshot,tick:490,lastGuardianCrossing:{
    runToken:snapshot.runToken,sourceTick:451,fromFloor:8,toFloor:9,
    cap:{id:'f8:cap'},guardian:{kind:'guardian',active:false,health:0}}};
  const cue={stage:'handoff',continuousGroundedHandoff:true,
    runToken:snapshot.runToken,floor:9,sourceTick:451};
  assert.equal(p.observe(published,cue,view),1,
    'late old victory event must not create second GPU realloc');
  assert.equal(p.diagnostics().active,false);
  assert.equal(createTowerColdFloorResolution().observe(published,cue,view),.72,
    'existing immutable-first source path still works in a fresh episode');
  assert.equal(JSON.stringify([snapshot,held]),before);
});
test('wrong guardian, source, support, run or old GPU owner cannot claim an early buffer',async()=>{
  const {createTowerColdFloorResolution}=await modulePromise;
  const {snapshot:s,held:h}=receipt();
  const cases=[
    [s,{...h,originalArchitectureWorldCertified:false}],
    [s,{...h,originalArchitectureCoverageSourceTick:s.tick-1}],
    [s,{...h,guardianGateRetained:false}],
    [s,{...h,verifiedObservedFloorAdvance:false}],
    [s,{...h,originalGatewayOpacity:0}],
    [s,{...h,runToken:'wrong'}],
    [s,{...h,crossingTick:451}],
    [s,{...h,oldRoofY:82001}],
    [s,{...h,submittedFrames:9}],
    [{...s,theme:'clockwork'},h],
    [{...s,floor:10},h],
    [{...s,lastGuardianCrossing:{guardian:{kind:'guardian',
      active:true,health:1}}},h],
    [{...s,tick:s.tick+13},h],
    [{...s,player:{...s.player,health:0}},h],
    [{...s,player:{...s.player,grounded:false,state:'airborne',
      groundedPlatformId:null,vy:1000}},h],
    [{...s,player:{...s.player,groundedPlatformId:'f8:cap'}},h],
    [{...s,player:{...s.player,y:s.player.y+900}},h],
    [{...s,player:{...s.player,x:450000}},h],
    [{...s,platforms:[]},h]
  ];
  for(const [ss,hh] of cases)
    assert.equal(createTowerColdFloorResolution().observe(ss,null,view,hh),1);
  for(const v of [{...view,quality:'high'},{...view,stale:true},
      {...view,camera:'overview'},{...view,reducedMotion:true}])
    assert.equal(createTowerColdFloorResolution().observe(s,null,v,h),1);
});
test('real Three scene consults retained owner and chooses GPU scale BEFORE actual render',()=>{
  const scene=fs.readFileSync(path.join(root,
    'public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
  const source=scene.indexOf('update(motionDt);');
  const held=scene.indexOf('const retainedColdArrival = world.retainedFilmHandoff',source);
  const policy=scene.indexOf('coldFloorPolicy.observe(snapshot,passage.diagnostics()',source);
  const draw=scene.indexOf('renderer.render(scene, camera);',source);
  assert.ok(source>=0 && held>source && policy>held && draw>policy);
  assert.match(scene,/coldFloorPolicy\.submitted\(snapshot, rendererReturnedAt - sceneReadyAt\)/);
});
