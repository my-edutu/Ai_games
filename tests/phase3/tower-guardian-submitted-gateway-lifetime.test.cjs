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

test('cold-floor lifetime requires real source-grounded victory, not a legacy win or stale render receipt', async()=>{
  const [THREE,{createTowerGuardianPassage,observedGroundedGuardianHandoff}]=await loaded;
  const {previous,next}=actualGroundedCrossing();
  const effect=createTowerGuardianPassage(THREE);
  try{
    assert.equal(observedGroundedGuardianHandoff(previous,next),true);
    assert.equal(effect.begin(previous,next,anchor),true);
    assert.equal(effect.diagnostics().continuousGroundedHandoff,true,
      'an authoritative defeated-guardian grounded crossing must survive no prior rendered arch');
    effect.update(.02);
    assert.equal(effect.diagnostics().innerDoorAssemblyVisible,true);
    assert.equal(effect.noteFrameSubmitted({...next,runToken:'other-run'}),false,
      'another run cannot claim a returned WebGL frame');
    assert.equal(effect.noteFrameSubmitted(next,{stale:true}),false,
      'stale presentation cannot spend the grounded gateway window');
    assert.equal(effect.diagnostics().handoffSubmittedFrames,0);
    assert.equal(effect.noteFrameSubmitted(next),true,
      'only real source-bound successful renderer return starts the visible budget');
    effect.clear();
    assert.equal(effect.noteFrameSubmitted(next),false,
      'cleared or restarted graphics cannot reuse a previous source receipt');
    const legacy={...previous,enemies:[{
      ...previous.enemies[0],active:true,health:1,
    }]};
    assert.equal(observedGroundedGuardianHandoff(legacy,next),false,
      'a guardian still alive is not proof of an earned physical threshold');
    assert.equal(effect.begin(legacy,next,anchor),true,
      'historic non-grounded-cap visual transition may keep its exterior memory');
    assert.equal(effect.diagnostics().continuousGroundedHandoff,false);
    assert.equal(effect.noteFrameSubmitted(next),false,
      'historic visual victory cannot claim grounded carry-forward or new-floor render credits');
    for(let i=0;i<7;i++)effect.update(.5);
    assert.equal(effect.diagnostics().stage,'none',
      'historic exterior memory must still retire on its bounded clock');
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
