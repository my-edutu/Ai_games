'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const scene=fs.readFileSync(path.join(root,'public/ai-maze-escape/scene.js'),'utf8');
const file=pathToFileURL(path.join(root,'public/ai-maze-escape/guardian-duel-camera.mjs')).href;

test('320 portrait maps the genuine same-run counter into a contact-held then physically fitted recoil camera',async()=>{
  const {publicEarnedGuardianCounterCameraAct:act,publicEarnedGuardianNarrowContactClock:clock}=await import(file);
  const aspect=320/740;
  const contact=phase=>act(clock(phase,true,false,aspect),true,false,aspect);
  assert.equal(contact(0),0);
  assert.equal(contact(.25),0);
  assert.ok(contact(.35)<.13 && contact(.35)>0,
    'retain real two-actor initial contact instead of immediate distant retreat');
  assert.ok(contact(.52)>.48 && contact(.52)<.52,'smooth mid-counter handoff');
  assert.equal(contact(.78),1);
  assert.equal(contact(.90),1);
  for(let i=0;i<99;i++){
    const a=contact(i/100),b=contact((i+1)/100);
    assert.ok(a>=0&&a<=1&&b>=a-1e-12&&b<=1,
      'same real counter has monotone continuous camera director');
  }
  assert.ok(act(.35,true,false,aspect)>contact(.35),
    'the candidate substantially changes the real 320px contact composition');
});

test('390/landscape/desktop, missing/expired, unearned and reduced-motion phases remain untouched',async()=>{
  const {publicEarnedGuardianNarrowContactClock:clock,publicEarnedGuardianCounterCameraAct:act}=await import(file);
  for(const aspect of [390/844,844/390,1280/900,NaN,Infinity,.30]){
    for(const phase of [0,.14,.35,.52,.88])
      assert.equal(clock(phase,true,false,aspect),phase);
  }
  for(const aspect of [320/740,.4]){
    for(const phase of [0,.15,.35,.52,.80]){
      assert.equal(clock(phase,false,false,aspect),phase);
      assert.equal(clock(phase,true,true,aspect),phase);
    }
    for(const bad of [NaN,Infinity,-Infinity,-1,1,2]){
      assert.ok(Object.is(clock(bad,true,false,aspect),bad),'no stale event stage');
      assert.equal(act(clock(bad,true,false,aspect),true,false,aspect),1);
    }
  }
});

test('original source-level strict director invariants stay intact while only actual input phase is remapped',()=>{
  assert.match(scene,/const earnedDuelContinuity = cameraMode==='follow'/);
  assert.match(scene,/publicEarnedGuardianCounterCameraPriority\(/);
  assert.match(scene,/const earnedShotAct=publicEarnedGuardianCounterCameraAct\(\s*publicEarnedGuardianNarrowContactClock\(/);
  assert.match(scene,/desiredTarget\.lerp\(cameraTarget,1-earnedShotAct\)/);
  assert.match(scene,/earnedRecoilCameraOffset\.lerp\(cameraOffset,1-earnedShotAct\)/);
  assert.match(scene,/publicGuardianEarnedRecoilSafeContactHalfHeight\(/);
  assert.match(scene,/publicGuardianEarnedRecoilFinalPairShift\(/);
  assert.match(scene,/publicGuardianEarnedRecoilPairStageLift\(/);
});
