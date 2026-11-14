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
