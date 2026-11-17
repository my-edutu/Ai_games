'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const helper=import(pathToFileURL(path.join(root,'public/ai-maze-escape/public-lantern-encounter.mjs')).href);
const scene=fs.readFileSync(path.join(root,'public/ai-maze-escape/scene.js'),'utf8');

test('public guardian stage light stays neutral without a real sightline or earned counter',async()=>{
  const {publicGuardianStageLightLevels:lights}=await helper;
  const baseline=lights();
  assert.deepEqual(baseline,{stage:0,ambient:1.42,sun:2.90,rim:1.04,lantern:2.10});
  for(const phase of [null,undefined,NaN,-1,1,2,Infinity,'0']){
    assert.deepEqual(lights(NaN,phase),baseline,'no false counter theatrical lighting');
  }
  assert.deepEqual(lights(-Infinity,null),baseline);
  assert.deepEqual(lights(Infinity,null),baseline);
});
test('witnessed open guardian and genuine tracked recoil create a readable, bounded light stage',async()=>{
  const {publicGuardianStageLightLevels:lights}=await helper;
  const seen=lights(1,null);
  assert.ok(seen.stage>0 && seen.stage<.8);
  assert.ok(seen.sun<2.90 && seen.rim>1.04 && seen.lantern>2.10);
  const recoiling=lights(0,.2);
  assert.ok(recoiling.stage>seen.stage,'actual earned guardian release must dominate ambient alert');
  assert.ok(recoiling.rim>seen.rim && recoiling.lantern>seen.lantern);
  assert.ok(recoiling.ambient>.80 && recoiling.sun>1.8,'never black out the physical puzzle');
  assert.deepEqual(lights(0,1),lights(0,null),'no ghost win after real counter completion');
  const still=lights(0,.2,true);
  const later=lights(0,.8,true);
  assert.deepEqual(still,later,'reduced motion is steady and never pulses');
  assert.ok(lights(200,0).stage<=1 && lights(-2,null).stage===0);
});
test('production scene drives pooled native Three light direction from ONLY public encounter evidence',()=>{
  assert.match(scene,/publicGuardianStageLightLevels\(/);
  assert.match(scene,/!result \? \(closestThreat\?\.strength\?\?0\) : 0/);
  assert.match(scene,/witnessedCounter \? earnedCounterActor\?\.counterPhase : null/);
  for(const light of ['sky','sun','rim','lanternLight'])
    assert.match(scene,new RegExp(light+'\\.intensity\\+='),'physical light should change in production');
  assert.match(scene,/publicGuardianLightStage:stageLights\.stage/);
  assert.match(scene,/settings\.reducedMotion \? 1\s*:1-Math\.exp\(-delta\*6\)/,
    'reduced motion must not flicker');
  assert.doesNotMatch(scene,/privateThreatCell|hiddenRoute|privateMap/);
});
