'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const scene=fs.readFileSync(path.join(root,'public/ai-maze-escape/scene.js'),'utf8');
const camera=()=>import(pathToFileURL(path.join(root,'public/ai-maze-escape/guardian-duel-camera.mjs')).href);

test('Pass558 existing witnessed public lantern counter earns one bounded physical stage illumination, not an unauthenticated flash',async()=>{
 const {publicEarnedGuardianCounterLighting:light}=await camera();
 assert.equal(light(0,true),1,'actual first contact lights the two physical bodies');
 assert.equal(light(.30,true),1,'witnessed brace does not flicker during the same counter');
 assert.equal(light(.65,true),1);
 assert.ok(light(.8,true)<1 && light(.8,true)>.35,'the original retreat fades, not a sudden lamp cut');
 assert.ok(light(.95,true)<.10 && light(.95,true)>0);
 assert.ok(light(.99,true)<light(.95,true));
 assert.equal(light(.5,true),light(.5,true),'same public clock, deterministic presentation');
 for(const phase of [undefined,null,NaN,Infinity,-Infinity,-.1,1,1.1,'0.1'])
   assert.equal(light(phase,true),0,'bad/expired/guessed event can never light an unseen encounter');
 for(const phase of [0,.2,.8])
   assert.equal(light(phase,false),0,'a spent or not yet witnessed threat is NOT a victory');
 assert.equal(light(0,true,true),0,'reduced motion restores static neutral light');
});

test('Pass558 live WebGL consumes only current visible same-run guardian; all physical lights are pooled and reset on absence',()=>{
 assert.match(scene,/const counterStageLight = new THREE\.PointLight\('#fff0cd', 0, 7\.5, 2\)/);
 assert.match(scene,/counterStageLight\.castShadow = false/);
 assert.equal((scene.match(/new THREE\.PointLight\('#fff0cd'/g)||[]).length,1,
   'stage fill is created ONCE, not per animation frame');
 assert.match(scene,/publicEarnedGuardianCounterLighting\(\s*earnedCounterActor\?\.counterPhase,[\s\S]*?!result && s\.lifecycle==='running'[\s\S]*?earnedGuardianFrame && !!verifiedGuardianModel\?\.parent[\s\S]*?lastWitnessedGuardianStageRunToken===s\.runToken[\s\S]*?s\.visibleCells\?\.includes\(earnedCounterActor\?\.cell\)/,
   'lighting requires an actually visible, authenticated same-run guardian counter');
 for(const assertion of [
  /sky\.intensity=1\.42-\.20\*earnedLight/,
  /sun\.intensity=2\.90-\.45\*earnedLight/,
  /rim\.intensity=1\.04\+\.24\*earnedLight/,
  /lanternLight\.intensity=2\.1\+1\.15\*earnedLight/,
  /lanternLight\.distance=4\+2\.5\*earnedLight/,
  /counterStageLight\.intensity=3\.75\*earnedLight/,
  /\(pose\.x\+earnedCounterActor\.x\)\*\.5/,
  /\(pose\.z\+earnedCounterActor\.z\)\*\.5/
 ])assert.match(scene,assertion);
 assert.ok(scene.indexOf('counterStageLight.intensity=3.75*earnedLight')
  <scene.indexOf('renderer.render(scene, camera); frames++;'),
  'world-space light response must be applied before the live WebGL frame');
 assert.doesNotMatch(scene,/privateMaze.*counterStageLight|secretRoute.*counterStageLight/);
});
