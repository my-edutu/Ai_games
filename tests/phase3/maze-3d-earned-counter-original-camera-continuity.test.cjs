'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const load=()=>import(pathToFileURL(path.join(root,'public/ai-maze-escape/guardian-duel-camera.mjs')).href);
const scene=fs.readFileSync(path.join(root,'public/ai-maze-escape/scene.js'),'utf8');

test('an actual same-run counter holds the already photographed two-body contact then earns a real retreat',async()=>{
  const {publicEarnedGuardianCounterCameraAct:act}=await load();
  assert.equal(act(0,true,false),0);
  assert.equal(act(.2,true,false),0,'do not cut away during the first witness');
  assert.equal(act(.27,true,false),0);
  const mid=act(.56,true,false);
  assert.ok(mid>.4 && mid<.6,'retreat must visibly progress during the real two-second beat');
  assert.equal(act(.85,true,false),1);
  assert.equal(act(.99,true,false),1);
  for(let i=0;i<100;i++){
    const a=act(i/100,true,false),b=act((i+1)/100,true,false);
    assert.ok(a>=0 && a<=1 && b>=a-1e-12,'one smooth monotone act without a camera jump');
  }
});

test('stale, unseen, reduced-motion and expired counters never hold a wrong camera',async()=>{
  const {publicEarnedGuardianCounterCameraAct:act}=await load();
  for(const phase of [undefined,NaN,Infinity,-Infinity,-1,1,2])
    assert.equal(act(phase,true,false),1);
  for(const phase of [0,.2,.5,.8])
    assert.equal(act(phase,false,false),1);
  for(const phase of [0,.2,.5,.8])
    assert.equal(act(phase,true,true),1);
});

test('the true previous rendered Follow camera, target and lens are the impact origin',()=>{
  assert.match(scene,/publicEarnedGuardianCounterCameraPriority\(/);
  assert.match(scene,/lastWitnessedGuardianStageRunToken===s\.runToken/);
  assert.match(scene,/const earnedShotAct=publicEarnedGuardianCounterCameraAct\(/);
  assert.match(scene,/if \(earnedDuelContinuity && earnedShotAct < 1\) \{\s*desiredTarget\.lerp\(cameraTarget,1-earnedShotAct\);\s*targetHeight=halfHeight\+\(targetHeight-halfHeight\)\*earnedShotAct;/);
  assert.match(scene,/earnedRecoilCameraOffset\.lerp\(cameraOffset,1-earnedShotAct\)/);
  assert.doesNotMatch(scene,/earnedRecoilCameraOffset\.lerp\(portraitCameraOffset,1-earnedShotAct\)/);
  assert.match(scene,/publicGuardianEarnedRecoilFinalPairShift\(/,'strict final whole-mesh fit remains');
});
