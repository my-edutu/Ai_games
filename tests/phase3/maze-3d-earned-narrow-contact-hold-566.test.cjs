'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const scene=fs.readFileSync(path.join(root,'public/ai-maze-escape/scene.js'),'utf8');
const file=pathToFileURL(path.join(root,'public/ai-maze-escape/guardian-duel-camera.mjs')).href;

test('320 portrait holds the REAL previous physical contact shot through earliest earned counter then eases to actual recoil',async()=>{
  const {publicEarnedGuardianCounterCameraAct:base,publicEarnedGuardianNarrowContactContinuity:stage}=await import(file);
  const aspect=320/740;
  const contact=phase=>stage(base(phase,true,false,aspect),phase,true,false,aspect);
  assert.equal(contact(0),0);
  assert.equal(contact(.25),0);
  assert.ok(contact(.35)<.13 && contact(.35)>0,'keep genuine first-impact two-character shot, not immediate distant retreat');
  assert.ok(contact(.52)>.48 && contact(.52)<.52,'make a smooth mid-counter handoff');
  assert.equal(contact(.78),1);
  assert.equal(contact(.90),1);
  for(let i=0;i<99;i++){
    const before=contact(i/100),after=contact((i+1)/100);
    assert.ok(before>=0 && before<=1 && after>=before-1e-12 && after<=1,
      'same published two-second counter has an unbroken continuous camera');
  }
  assert.ok(base(.35,true,false,aspect)>contact(.35),
    'this candidate must genuinely alter the authenticated 320px framing, not a decorative no-op');
});

test('390, landscape, desktop, stale/hidden counter and reduced motion keep already native-tested lens',async()=>{
  const {publicEarnedGuardianCounterCameraAct:base,publicEarnedGuardianNarrowContactContinuity:stage}=await import(file);
  for(const aspect of [390/844,844/390,1280/900,NaN,Infinity,.30]){
    for(const phase of [0,.14,.35,.52,.88]){
      const previous=base(phase,true,false,aspect);
      assert.equal(stage(previous,phase,true,false,aspect),previous);
    }
  }
  for(const aspect of [320/740,.4]){
    for(const phase of [0,.15,.35,.52,.80]){
      const previous=base(phase,true,false,aspect);
      assert.equal(stage(previous,phase,false,false,aspect),previous);
      assert.equal(stage(previous,phase,true,true,aspect),previous);
    }
    for(const badPhase of [NaN,Infinity,-Infinity,-1,1,2]){
      assert.equal(stage(.5,badPhase,true,false,aspect),.5,'no unclocked/post-expiration staging');
    }
  }
});

test('production stage is coupled to witnessed Follow guardian and preserves stricter physical safety',()=>{
  assert.match(scene,/const earnedDuelContinuity = cameraMode==='follow'/);
  assert.match(scene,/publicEarnedGuardianCounterCameraPriority\(/);
  assert.match(scene,/const stagedShotAct=publicEarnedGuardianNarrowContactContinuity\(/);
  assert.match(scene,/desiredTarget\.lerp\(cameraTarget,1-stagedShotAct\)/);
  assert.match(scene,/earnedRecoilCameraOffset\.lerp\(cameraOffset,1-stagedShotAct\)/);
  assert.match(scene,/publicGuardianEarnedRecoilSafeContactHalfHeight\(/);
  assert.match(scene,/publicGuardianEarnedRecoilFinalPairShift\(/);
  assert.match(scene,/publicGuardianEarnedRecoilPairStageLift\(/);
});
