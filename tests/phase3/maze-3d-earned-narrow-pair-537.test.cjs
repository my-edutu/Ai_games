'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const load=()=>import(pathToFileURL(path.join(root,'public/ai-maze-escape/guardian-duel-camera.mjs')).href);
const scene=readFileSync(path.join(root,'public/ai-maze-escape/scene.js'),'utf8');
const base=()=>({x:15,y:31,z:18});
const hero={x:-2.4,z:-2.4}, guardian={x:0,z:0};
const alignment=(c)=>(c.x*hero.x+c.z*hero.z)/
  (Math.hypot(c.x,c.z)*Math.hypot(hero.x,hero.z));

test('320px witnessed counter turns the physical pair into a close three-quarter stage',async()=>{
  const {setPublicEarnedGuardianFrontQuarterOffset:baseStage,
    setPublicEarnedGuardianNarrowPairStage:stage}=await load();
  const offset=base(),initialRadius=Math.hypot(offset.x,offset.z);
  assert.equal(baseStage(offset,320/740,hero,guardian,true,false),true);
  const before=alignment(offset);
  assert.ok(before>.32&&before<.35,'fixed previous source-born 320 stage remains reproducible');
  assert.equal(stage(offset,320/740,hero,guardian,true,false),true);
  assert.ok(alignment(offset)>.94 && alignment(offset)>before+.59,
    'the final real 320 stage must turn materially toward the two witnessed actors');
  assert.ok(Math.abs(Math.hypot(offset.x,offset.z)-initialRadius)<1e-10,
    'no actor scaling, artificial camera approach or model crop');
  assert.equal(offset.y,31,'the source-authentic above-court floor clearance is unchanged');
  const repeat=base();baseStage(repeat,320/740,hero,guardian,true,false);
  stage(repeat,320/740,hero,guardian,true,false);
  assert.deepEqual(repeat,offset,'current public positions deterministically set the shot');
});

test('all unearned, stale, reduced, 390-class, landscape and desktop views preserve their original camera',async()=>{
  const {setPublicEarnedGuardianNarrowPairStage:stage}=await load();
  for(const [aspect,earned,reduced,subject] of [
    [320/740,false,false,hero],[320/740,true,true,hero],
    [390/844,true,false,hero],[844/390,true,false,hero],
    [1280/900,true,false,hero],[NaN,true,false,hero],
    [.3,true,false,hero],[320/740,true,false,{x:NaN,z:0}],
    [320/740,true,false,{x:.1,z:0}]]) {
    const offset=base();
    assert.equal(stage(offset,aspect,subject,guardian,earned,reduced),false);
    assert.deepEqual(offset,base(),'no unauthorized scene camera action');
  }
});

test('source integration admits only the public same-run counter and retains strict final whole-mesh fitting',()=>{
  assert.match(scene,/const earnedDuelContinuity = cameraMode==='follow' && !result/);
  assert.match(scene,/lastWitnessedGuardianStageRunToken===s\.runToken/);
  assert.match(scene,/if\(earnedDuelContinuity && earnedCounterModel\?\.parent\)\s+setPublicEarnedGuardianNarrowPairStage\(/);
  assert.match(scene,/publicGuardianEarnedRecoilSafeContactHalfHeight\(/);
  assert.match(scene,/publicGuardianEarnedRecoilFinalPairShift\(/);
  assert.match(scene,/publicGuardianEarnedRecoilPairStageLift\(/);
  assert.doesNotMatch(scene,/privateMaze[\s\S]{0,100}setPublicEarnedGuardianNarrowPairStage\(/);
});
