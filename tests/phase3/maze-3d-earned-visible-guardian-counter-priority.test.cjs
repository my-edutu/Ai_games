'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const moduleUrl=pathToFileURL(path.join(root,'public/ai-maze-escape/guardian-duel-camera.mjs')).href;
const scene=fs.readFileSync(path.join(root,'public/ai-maze-escape/scene.js'),'utf8');

test('Pass515 currently seen same physically parried Thornback keeps the earned counter CAMERA priority',async()=>{
  const {publicEarnedGuardianCounterCameraPriority:priority}=await import(moduleUrl);
  const earned={id:'currently-public-thornback'};
  assert.equal(priority(earned,earned,.95,true),true,
    'the genuine close parried guardian must not suppress the earned face-reveal scene');
  assert.equal(priority(earned,earned,.35,true),true);
  assert.equal(priority(earned,null,undefined,undefined),true,
    'a genuine recently parried guardian may finish its legal retreat when no current danger competes');
  assert.equal(priority(null,earned,.95,true),false,'never stage an absent/hidden/unearned counter');
  assert.equal(priority(earned,earned,.95,false),false,
    'still-threatening un-parried guardian takes the ordinary defensive camera');
  assert.equal(priority(earned,{id:'other-current-guardian'},.95,true),false,
    'a different visible guardian takes priority instead of the old parried actor');
  assert.equal(priority(earned,earned,NaN,true),false,'invalid warning data must fail closed');
  assert.equal(priority(earned,earned,Infinity,true),false,'unbounded warning data must fail closed');
  assert.equal(priority(earned,earned,-.2,true),false,'invalid negative warning must fail closed');
});
test('Pass515 integrates the same-model priority BEFORE earned camera selection, with no double aiming',()=>{
  assert.match(scene,/publicEarnedGuardianCounterCameraPriority\(\s*earnedCounterModel,closestThreatModel,closestThreat\?\.strength,\s*closestThreat\?\.lanternParried\)/);
  assert.match(scene,/if\s*\(earnedDuelContinuity\s*&&\s*!closestThreat\?\.strength\)/,
    'publicly focused near parried guardian should not receive duplicate pair aim');
  assert.match(scene,/earnedDuelContinuity\s*\?\s*earnedRecoilCameraOffset/,
    'a current close earned counter must actually route to original front-quarter optical stage');
  assert.match(scene,/lastWitnessedGuardianStageRunToken===s\.runToken/,
    'never stage a guardian from an earlier replay');
});
