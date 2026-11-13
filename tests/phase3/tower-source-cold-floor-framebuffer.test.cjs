'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const policyPromise=import(pathToFileURL(path.join(root,
  'public/infinite-tower-climb/visuals/cold-floor-resolution.mjs')).href);
const source={runToken:'true-tower-run',floor:9,tick:452,lifecycle:'running',
  player:{health:4,grounded:true,groundedPlatformId:'f9:ground'}};
const earned={stage:'handoff',continuousGroundedHandoff:true,
  runToken:source.runToken,floor:9,sourceTick:451};
const follow={stale:false,camera:'follow',quality:'low',reducedMotion:false};
const nextTick=(n,other={})=>({...source,tick:n,...other});

test('real Floor9 first-frame pixel rescue ages on returned WebGL frames, not source/RAF ticks',async()=>{
  const {createTowerColdFloorResolution}=await policyPromise;
  const policy=createTowerColdFloorResolution();
  assert.equal(policy.observe(source,earned,follow),.72);
  for(let tick=453;tick<=459;tick++)
    assert.equal(policy.observe(nextTick(tick),earned,follow),.72);
  // A stale out-of-order WebGL return cannot age the current living camera.
  assert.equal(policy.submitted(source),false);
  const frame=nextTick(459);
  for(const nextScale of [.82,.90,.96,1]){
    assert.equal(policy.submitted(frame),true);
    assert.equal(policy.observe(frame,earned,follow),nextScale);
  }
  assert.equal(policy.submitted(frame),false);
  assert.equal(policy.observe(frame,earned,follow),1,
    'the same source-earned episode cannot repeatedly downscale');
  assert.equal(policy.diagnostics().finishedSourceTick,451);
});

test('source-earned gateway recovery stays bounded through REAL Floor9 airborne movement and expired visual cue',async()=>{
  const {createTowerColdFloorResolution}=await policyPromise;
  const policy=createTowerColdFloorResolution();
  assert.equal(policy.observe(source,earned,follow),.72);
  policy.submitted(source);
  const air=nextTick(456,{player:{health:4,state:'airborne',
    grounded:false,groundedPlatformId:null,vy:14000}});
  assert.equal(policy.observe(air,{stage:'none'},follow),.82,
    'a real roof dismount cannot suddenly allocate a full-size target during cold GPU handoff');
  assert.equal(policy.submitted(air),true);
  assert.equal(policy.observe(nextTick(458,{player:air.player}),null,follow),.90);
  policy.submitted(nextTick(458,{player:air.player}));
  assert.equal(policy.observe(nextTick(461,{player:air.player}),null,follow),.96);
  policy.submitted(nextTick(461,{player:air.player}));
  assert.equal(policy.observe(nextTick(461,{player:air.player}),earned,follow),1);
  const diag=policy.diagnostics();
  assert.equal(diag.active,false);
  assert.equal(diag.finishedSourceTick,451);
});

test('an actual recorded HP-zero retained GPU doorway may start the same recovery after the short passage cue expired',async()=>{
  const {createTowerColdFloorResolution}=await policyPromise;
  const policy=createTowerColdFloorResolution();
  const w={runToken:source.runToken,sourceTick:451,fromFloor:8,toFloor:9,
    guardian:{kind:'guardian',active:false,health:0},
    cap:{id:'f8:cap'}};
  const airborne=nextTick(453,{
    player:{health:4,state:'airborne',grounded:false,groundedPlatformId:null,vy:14000},
    lastGuardianCrossing:w,
  });
  const held={floor:9,runToken:source.runToken,oldCapId:'f8:cap',
    sourceTick:451,crossingTick:451,submittedFrames:0,visibleSeconds:0};
  assert.equal(policy.observe(airborne,{stage:'none'},follow,held),.72);
  const noOwner=createTowerColdFloorResolution();
  assert.equal(noOwner.observe(airborne,{stage:'none'},follow),1);
  for(const invalid of [
    {...held,runToken:'different'},
    {...held,crossingTick:450},
    {...held,oldCapId:'f7:cap'},
    {...held,visibleSeconds:1.26},
    {...held,submittedFrames:9},
  ]) {
    const fresh=createTowerColdFloorResolution();
    assert.equal(fresh.observe(airborne,{stage:'none'},follow,invalid),1,
      'a false original gateway cannot obtain the first-frame pixel rescue');
  }
  const wrong={...airborne,lastGuardianCrossing:{...w,guardian:{...w.guardian,health:1}}};
  assert.equal(createTowerColdFloorResolution().observe(wrong,{stage:'none'},
    follow,held),1,'a living guardian cannot grant a gateway');
});

test('wrong run, result, stale, manual camera, graphics tier, invalid support or tick rollback immediately restore full pixels',async()=>{
  const {createTowerColdFloorResolution}=await policyPromise;
  for(const [s,p,o] of [
    [source,{...earned,continuousGroundedHandoff:false},follow],
    [{...source,floor:10},earned,follow],
    [{...source,runToken:'other'},earned,follow],
    [{...source,lifecycle:'result'},earned,follow],
    [{...source,player:{...source.player,health:0}},earned,follow],
    [{...source,tick:450},earned,follow],
    [source,{...earned,runToken:'other'},follow],
    [source,earned,{...follow,stale:true}],
    [source,earned,{...follow,camera:'overview'}],
    [source,earned,{...follow,reducedMotion:true}],
    [source,earned,{...follow,quality:'high'}],
    [{...source,player:{health:4,grounded:false,state:'standing',vy:1200}},earned,follow],
  ]) {
    const policy=createTowerColdFloorResolution();
    assert.equal(policy.observe(s,p,o),1);
    assert.equal(policy.submitted(s),false);
  }
  for(const bad of [
    {...source,runToken:'other'},
    {...source,lifecycle:'result'},
    {...source,player:{...source.player,health:0}},
    {...source,tick:451},
  ]) {
    const policy=createTowerColdFloorResolution();
    assert.equal(policy.observe(source,earned,follow),.72);
    assert.equal(policy.observe(bad,earned,follow),1);
    assert.equal(policy.submitted(bad),false);
  }
  const policy=createTowerColdFloorResolution();
  assert.equal(policy.observe(source,earned,follow),.72);
  assert.equal(policy.observe(nextTick(550),earned,follow),1,
    '96 real source ticks is a hard bound even without an actual GPU return');
  assert.equal(policy.observe(nextTick(550),earned,follow),1);
});

test('real shipped Three scene starts the bounded framebuffer BEFORE render and advances only AFTER returned WebGL',()=>{
  const scene=fs.readFileSync(path.join(root,
    'public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
  assert.match(scene,/createTowerColdFloorResolution/);
  assert.match(scene,/basePixelRatio \* Math\.min\(resolutionPolicy\.scale, coldFloorScale\)/);
  const update=scene.indexOf('update(motionDt);');
  const policy=scene.indexOf('coldFloorPolicy.observe(snapshot,passage.diagnostics()');
  const render=scene.indexOf('renderer.render(scene, camera);');
  const submitted=scene.indexOf('coldFloorPolicy.submitted(snapshot);');
  const retained=scene.indexOf('world.retainedFilmHandoff?.(snapshot)',update);
  assert.ok(update>=0 && retained>update && policy>retained &&
    policy<render && submitted>render);
  assert.match(scene,/retainedColdArrival\);/);
  assert.match(scene,/coldFloorPolicy\.reset\(\)/);
});
