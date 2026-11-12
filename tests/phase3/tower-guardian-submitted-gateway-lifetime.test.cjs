'use strict';
// Test-first P0 contract for the original Floor 8 -> 9 cold-render stall.
// These assertions check a bounded truthful presentation lifetime, NOT pixels,
// reviewer preference, GPU-present, frame-rate or gameplay success.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '../..');
const loaded = Promise.all([
  import(pathToFileURL(path.join(root, 'node_modules/three/build/three.module.js')).href),
  import(pathToFileURL(path.join(root, 'public/infinite-tower-climb/visuals/guardian-passage.mjs')).href),
]);
const angle = Math.atan2(1, 4), radius = 27.78;
const anchor = Object.freeze({
  x: Math.sin(angle) * radius, y: 17.5,
  z: Math.cos(angle) * radius, angle,
});
function actualGroundedCrossing() {
  const cap = { id:'f8:cap', x:250000, y:100000, width:80000, height:12000 };
  const ground = { id:'f9:ground', x:250000, y:100000, width:80000, height:12000 };
  const player = { x:325000, y:122000, halfWidth:4000, halfHeight:10000,
    health:4, grounded:true, groundedPlatformId:'f8:cap', state:'standing' };
  const previous = { runToken:'verified-episode', floor:8, tick:450,
    lifecycle:'running', chunkBaseY:0, worldWidth:400000,
    guardianExitX:310800, platforms:[cap],
    enemies:[{id:'f8:guardian', kind:'guardian', floor:8,
      active:false, health:0, x:300000, y:122000, halfHeight:12000}],
    player };
  const next = { ...previous, floor:9, tick:451, platforms:[ground],
    guardianExitX:undefined, enemies:[],
    player:{...player, groundedPlatformId:'f9:ground'} };
  return {previous,next};
}

test('real grounded continuation survives slow unpublished WebGL frames and appears in the camera before first submission', async()=>{
  const [THREE,{createTowerGuardianPassage,observedGroundedGuardianHandoff}]=await loaded;
  const {previous,next}=actualGroundedCrossing();
  assert.equal(observedGroundedGuardianHandoff(previous,next),true,
    'test exercises authentic whole-body source gateway, not a synthetic floor cut');
  const effect=createTowerGuardianPassage(THREE);
  try{
    assert.equal(effect.unlock(previous,anchor),true);
    effect.update(.6);
    assert.equal(effect.begin(previous,next,anchor),true);
    assert.equal(effect.diagnostics().continuousGroundedHandoff,true);
    for(let i=0;i<5;i++)effect.update(.5);
    assert.equal(effect.diagnostics().stage,'handoff',
      'a 2.5s cold renderer must not extinguish the real already-open passage before a submitted frame');
    assert.ok(effect.cameraWeight()>.2,
      'first successful post-floor rendering must have a usable source-bound doorway shot');
    assert.equal(effect.diagnostics().handoffSubmittedFrames,0);
    assert.equal(effect.noteFrameSubmitted({...next,tick:450}),false,
      'stale earlier tick cannot claim the new-floor GPU render');
    assert.equal(effect.noteFrameSubmitted({...next,runToken:'different-run'}),false);
    assert.equal(effect.noteFrameSubmitted(next,{stale:true}),false);
    assert.equal(effect.noteFrameSubmitted(next),true,
      'only actual returned Three.js render of matching run/floor/tick opens the visible-time budget');
    effect.update(.5);
    assert.equal(effect.diagnostics().handoffSubmittedFrames,1);
    assert.equal(effect.diagnostics().active,true);
    assert.ok(effect.cameraWeight()>0);
    for(let i=0;i<6;i++)effect.update(.5);
    assert.equal(effect.diagnostics().stage,'none',
      'post-submission grace must expire deterministically and release source-owned scene');
    assert.equal(effect.diagnostics().active,false);
    assert.equal(previous.player.x,next.player.x,
      'presentation cannot mutate authoritative landing');
  } finally {effect.dispose();}
});

test('the cold-floor presentation budget is not a substitute for a legacy win, context recovery or browser receipt', async()=>{
  const [THREE,{createTowerGuardianPassage}]=await loaded;
  const {previous,next}=actualGroundedCrossing();
  const effect=createTowerGuardianPassage(THREE);
  try{
    assert.equal(effect.begin(previous,next,anchor),true);
    assert.equal(effect.diagnostics().continuousGroundedHandoff,false,
      'without a prior genuinely visible earned arch, no carry-forward privilege');
    assert.equal(effect.noteFrameSubmitted(next),false,
      'legacy instant-victory visual cannot claim the grounded carried-door budget');
    for(let i=0;i<7;i++)effect.update(.5);
    assert.equal(effect.diagnostics().stage,'none',
      'legacy non-carried visual still retires on its old bounded clock');
    effect.clear();
    assert.equal(effect.noteFrameSubmitted(next),false,
      'cleared/restarted graphics cannot reuse the old source receipt');
  }finally{effect.dispose();}
});

test('original scene observes passage GPU return only AFTER actual renderer.render success',()=>{
  const scene=fs.readFileSync(path.join(root,'public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
  const rendererCall=scene.indexOf('renderer.render(scene, camera);');
  const passageAck=scene.indexOf('passage.noteFrameSubmitted?.(snapshot,options);');
  assert.ok(rendererCall>=0 && passageAck>rendererCall,
    'HTTP acceptance and a failed WebGL call may not unlock the visible passage clock');
  assert.ok(passageAck < scene.indexOf('renderProgress.submitted(snapshot, rendererReturnedAt'),
    'one exact authoritative snapshot underlies the same successful scene submission');
});
