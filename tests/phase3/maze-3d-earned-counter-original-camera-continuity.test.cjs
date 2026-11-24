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
  assert.equal(act(.08,true,false),0,'genuine first impact retains the previously rendered camera');
  assert.ok(act(.2,true,false)>.08 && act(.2,true,false)<.20,
    'the original 390px hidden face requires movement while the real hit is still witnessed');
  assert.ok(act(.30,true,false)>.30 && act(.30,true,false)<.45,
    'the existing high-angle body reveal progresses before the real parry expires');
  const mid=act(.35,true,false);
  assert.ok(mid>.49 && mid<.51,'the original physical camera transition remains continuous');
  assert.equal(act(.62,true,false),1);
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
