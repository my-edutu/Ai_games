'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const sourcePath = path.join(__dirname, '../../public/infinite-tower-climb/visuals/cold-floor-resolution.mjs');
const load = async () => (await import(pathToFileURL(sourcePath).href)).createTowerColdFloorResolution;
const scene = () => ({
  lifecycle: 'running', runToken: 'exp-real', floor: 9, tick: 452,
  player: { health: 90, grounded: true, groundedPlatformId: 'f9:ground', state: 'standing' },
});
const passage = () => ({ stage: 'handoff', continuousGroundedHandoff: true,
  runToken: 'exp-real', floor: 9, sourceTick: 451 });
const view = () => ({ stale: false, quality: 'low', camera: 'follow', reducedMotion: false });

test('one authenticated cold Floor 9 episode allocates ONE reduced framebuffer before one full-res return', async () => {
  const policy = (await load())();
  const s = scene(), p = passage(), v = view();
  assert.equal(policy.observe(s,p,v), .72);
  for (let i=0;i<7;i++) {
    assert.equal(policy.submitted(s, 610), true, 'only genuinely returned WebGL frames advance the epoch');
    assert.equal(policy.observe(s,p,v), .72,
      'a new scale at each GPU return creates an avoidable allocation during the crossing');
  }
  assert.equal(policy.submitted(s, 610), true);
  assert.equal(policy.observe(s,p,v), 1, 'a bounded cold epoch must restore original resolution');
  assert.equal(policy.diagnostics().finishedSourceTick,451);
  assert.equal(policy.submitted(s, 610), false);
  assert.equal(policy.observe(s,p,v), 1, 'the same earned doorway may not start a second cold epoch');
});

test('a pair of cheap observed WebGL returns allows an earlier clean full-resolution restoration', async () => {
  const policy=(await load())();const s=scene(),p=passage(),v=view();
  assert.equal(policy.observe(s,p,v),.72);
  for(const ms of [740,390,110]){
    assert.equal(policy.submitted(s,ms),true);
    assert.equal(policy.observe(s,p,v),.72);
  }
  assert.equal(policy.submitted(s,120),true);
  assert.equal(policy.observe(s,p,v),1);
  assert.equal(policy.diagnostics().finishedSourceTick,451);
});

test('one cheap frame cannot restore, and unknown return costs never imply a fast GPU', async () => {
  const policy=(await load())();const s=scene(),p=passage(),v=view();
  assert.equal(policy.observe(s,p,v),.72);
  for(const ms of [80,600,undefined,110,NaN]){
    assert.equal(policy.submitted(s,ms),true);
    assert.equal(policy.observe(s,p,v),.72);
  }
  assert.equal(policy.diagnostics().fastReturnStreak,0);
});

test('stale, different runs, non-follow or non-low mode cannot borrow a cold epoch', async () => {
  const create=await load(),s=scene(),p=passage(),v=view();
  for(const invalidView of [{...v,stale:true},{...v,quality:'high'},{...v,camera:'orbit'},{...v,reducedMotion:true}])
    assert.equal(create().observe(s,p,invalidView),1);
  const policy=create();
  assert.equal(policy.observe(s,p,v),.72);
  const other={...s,runToken:'exp-other',tick:1};
  assert.equal(policy.submitted(other,45),false);
  assert.equal(policy.observe(other,p,v),1);
  assert.equal(policy.diagnostics().active,false);
});

test('camera, player and authority are not edited; the real renderer reports WebGL return duration', async () => {
  const create=await load(),s=scene(),p=passage(),v=view();
  const frozen=JSON.stringify([s,p,v]);
  const policy=create();policy.observe(s,p,v);policy.submitted(s,315);
  assert.equal(JSON.stringify([s,p,v]),frozen);
  const realScene=fs.readFileSync(path.join(__dirname,'../../public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
  assert.match(realScene,/coldFloorPolicy\.submitted\(snapshot,\s*rendererReturnedAt\s*-\s*sceneReadyAt\)/);
  assert.match(realScene,/renderer\.render\(scene, camera\)/);
});

test('authentic raised p2 sole at first source-earned Floor 9 paint keeps one cold framebuffer epoch', async () => {
  const create=await load(),v=view();
  const s={...scene(),tick:518,player:{
    health:4,grounded:true,groundedPlatformId:'f9:p2',state:'running',vy:0,
    x:336796,y:3364000,halfWidth:9000,halfHeight:14000
  },platforms:[
    {id:'f9:ground',x:105000,y:3212000,width:270000,height:12000},
    {id:'f9:p2',x:320000,y:3330000,width:40000,height:20000}
  ],lastGuardianCrossing:{
    sourceTick:475,runToken:'exp-real',fromFloor:8,toFloor:9,
    cap:{id:'f8:cap'},guardian:{kind:'guardian',active:false,health:0}
  }};
  const held={runToken:'exp-real',floor:9,oldCapId:'f8:cap',
    crossingTick:475,sourceTick:483,submittedFrames:0,visibleSeconds:0};
  const original=JSON.stringify([s,held]);
  const policy=create();
  assert.equal(policy.observe(s,null,v,held),.72,
    'true p2 sole and independently defeated same-run source must admit cold WebGL policy');
  assert.equal(policy.submitted(s,610),true);
  assert.equal(policy.observe({...s,tick:519,player:{
    ...s.player,grounded:false,groundedPlatformId:null,state:'airborne',vy:2000
  }},null,v,held),.72,'actual next airborne source cannot reallocate mid-doorway');
  for(let i=0;i<7;i++)assert.equal(policy.submitted({...s,tick:519},610),true);
  assert.equal(policy.observe({...s,tick:519},null,v,held),1,
    'restore only once after returned frames even on raised-deck first paint');
  assert.equal(JSON.stringify([s,held]),original,'budget must not change source or retained gateway');
});

test('raised step cannot borrow the cold first-F9 buffer policy without real floor support AND guardian victory',async()=>{
  const create=await load(),v=view();
  const s={...scene(),tick:518,player:{
    health:4,grounded:true,groundedPlatformId:'f9:p2',state:'running',vy:0,
    x:336796,y:3364000,halfWidth:9000,halfHeight:14000
  },platforms:[{id:'f9:p2',x:320000,y:3330000,width:40000,height:20000}],
    lastGuardianCrossing:{
      sourceTick:475,runToken:'exp-real',fromFloor:8,toFloor:9,
      cap:{id:'f8:cap'},guardian:{kind:'guardian',active:false,health:0}
    }};
  const held={runToken:'exp-real',floor:9,oldCapId:'f8:cap',
    crossingTick:475,sourceTick:483,submittedFrames:0,visibleSeconds:0};
  const mutants=[
    {...s,player:{...s.player,y:s.player.y+1000}},
    {...s,player:{...s.player,x:362000}},
    {...s,platforms:[{...s.platforms[0],id:'f9:fake'}]},
    {...s,player:{...s.player,groundedPlatformId:'f9:fake'}},
    {...s,lastGuardianCrossing:{...s.lastGuardianCrossing,
      guardian:{kind:'guardian',active:true,health:1}}},
    {...s,lastGuardianCrossing:null},
    {...s,runToken:'other-run'},
    {...s,tick:601}
  ];
  for(const bad of mutants)
    assert.equal(create().observe(bad,null,v,held),1,
      'invalid grounded contact, absent old victory, stale event or other run must refuse allocation');
});
