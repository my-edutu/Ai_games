'use strict';
// Real captured original guardian at source 9095a5b0, 390x844, ~20s:
// a large foreground boss/weapon hides the source climber even though
// both character centres lie within the phone screen. This is a scene
// safety regression only, not pixel-matched gameplay acceptance.
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {pathToFileURL} = require('node:url');
const ROOT = path.resolve(__dirname, '../..');
const loaded = (async () => {
  const THREE = await import(pathToFileURL(path.join(ROOT,
    'node_modules/three/build/three.module.js')).href);
  const coordinates = await import(pathToFileURL(path.join(ROOT,
    'public/infinite-tower-climb/visuals/coordinates.mjs')).href);
  const circuit = await import(pathToFileURL(path.join(ROOT,
    'public/infinite-tower-climb/visuals/guardian-circuit.mjs')).href);
  const intrusion = await import(pathToFileURL(path.join(ROOT,
    'public/infinite-tower-climb/visuals/guardian-gate-intrusion.mjs')).href);
  const scene = fs.readFileSync(path.join(ROOT,
    'public/infinite-tower-climb/visuals/scene.mjs'), 'utf8')
    .replace(/^import .*;\n/gm, '')
    .replace('export function createTowerScene', 'function createTowerScene');
  const ctx={THREE,...coordinates,...circuit,...intrusion};
  vm.runInNewContext(scene,ctx,{filename:'tower-scene-composition.js'});
  return ctx;
})();
const bounds=(left,right,bottom,top,depth)=>({left,right,bottom,top,depth});
const corners=(left,right,bottom,top,depth)=>[
  [left,bottom,depth],[left,top,depth],[right,bottom,depth],[right,top,depth],
];

test('near huge guardian hiding a genuine hero is not an acceptable safe-centered portrait shot',async()=>{
  const ctx=await loaded;
  const hero=bounds(-.19,.06,-.17,.23,31);
  const boss=bounds(-.65,.50,-.55,.62,19);
  const a=ctx.observedGuardianForegroundPressure(hero,boss);
  assert.ok(a.occlusion>.95,'a nearer opponent can cover the complete skinned player');
  assert.ok(a.dominance>.25,'large foreground body dominates the same actual combat frame');
  const clear=ctx.observedGuardianForegroundPressure(hero,bounds(.25,.76,-.4,.4,19));
  assert.equal(clear.occlusion,0,'two separated bodies can share the scene');
  const behind=ctx.observedGuardianForegroundPressure(hero,bounds(-.65,.5,-.55,.62,40));
  assert.equal(behind.occlusion,0,'a monumental guardian in the background does not hide the hero');
  assert.equal(behind.dominance,0);
  assert.equal(ctx.observedGuardianForegroundPressure(hero,bounds(NaN,.5,0,1,12)).occlusion,0);
});

test('planner uses full source-projected hitbox corners and remains depth-aware',async()=>{
  const ctx=await loaded;
  const hero=ctx.observedDuelBounds(corners(-.2,.1,-.18,.24,25));
  const nearer=ctx.observedDuelBounds(corners(-.3,.35,-.24,.45,17));
  const deeper=ctx.observedDuelBounds(corners(-.3,.35,-.24,.45,32));
  assert.ok(ctx.observedGuardianForegroundPressure(hero,nearer).occlusion>.5);
  assert.equal(ctx.observedGuardianForegroundPressure(hero,deeper).occlusion,0);
  assert.equal(ctx.observedDuelBounds([[0,0,2]]),null);
  assert.equal(ctx.observedDuelBounds(corners(0,.3,0,.3,Infinity)),null);
});

test('bad foreground boss cover cannot be retained for camera continuity',async()=>{
  const ctx=await loaded;
  const prior={clear:true,guardianFramed:true,heroFraction:.18,
    guardianForegroundOcclusion:.86,score:102};
  const repaired={clear:true,guardianFramed:true,heroFraction:.19,
    guardianForegroundOcclusion:.04,score:103};
  const quality=view=>view.score;
  assert.equal(ctx.retainGuardianCameraShot(repaired,prior,quality),repaired,
    'physical actor visibility outranks source-shot hysteresis');
  const harmless={...prior,guardianForegroundOcclusion:0};
  assert.equal(ctx.retainGuardianCameraShot(repaired,harmless,quality),harmless,
    'stable previously clear shot remains comfortable');
});

test('submitted real-body obstruction releases comfort orbit without losing safety gates',async()=>{
  const ctx=await loaded;
  const hero={x:.03,y:.06,z:.55},boss={x:-.12,y:.08,z:.52};
  const frame=1/60,aspect=390/844;
  assert.ok(ctx.towerDuelOrbitBudget(frame,aspect,hero,boss,true,true)<.05);
  assert.equal(ctx.towerDuelOrbitBudget(frame,aspect,hero,boss,true,true,.90),Infinity,
    'both centers fitting is NOT enough when the boss physically hides the climber');
  assert.equal(ctx.towerDuelOrbitBudget(frame,aspect,hero,boss,false,true,0),Infinity);
  assert.equal(ctx.towerDuelOrbitBudget(frame,aspect,hero,boss,true,true,.05)>0,true,
    'a minor body edge overlap cannot provoke a camera whip');
});

test('the original camera director uses body-overlap pressure in planning AND submitted-frame safety',()=>{
  const s=fs.readFileSync(path.join(ROOT,
    'public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
  assert.match(s,/observedDuelBounds\(heroNdcCorners\)/);
  assert.match(s,/observedDuelBounds\(guardianNdcCorners\)/);
  assert.match(s,/view\.guardianForegroundOcclusion \* 125/);
  assert.match(s,/observedGuardianForegroundPressure\(\s*submittedHeroBounds,submittedGuardianBounds\)/);
  assert.match(s,/foreground\.occlusion\+foreground\.dominance\*\.3/);
  assert.doesNotMatch(s,/window\.setTimeout\(/);
});
