'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {readFileSync}=require('node:fs');
const root=path.resolve(__dirname,'../..');
const load=()=>import(pathToFileURL(path.join(root,'public/ai-maze-escape/guardian-duel-camera.mjs')).href);
const source=readFileSync(path.join(root,'public/ai-maze-escape/scene.js'),'utf8');
const initial=()=>({x:15,y:31,z:18});
const direction={x:-2.4,z:-2.4};
const guardian={x:0,z:0};
const alignment=(camera)=>{
  const dot=camera.x*direction.x+camera.z*direction.z;
  return dot/(Math.hypot(camera.x,camera.z)*Math.hypot(direction.x,direction.z));
};
test('Pass534 actual 390-class earned counter turns the real stage onto Thornback face, not the sideways dorsal shell',async()=>{
  const {setPublicEarnedGuardianFrontQuarterOffset:stage}=await load();
  const front=initial(),narrow=initial(),startLength=Math.hypot(front.x,front.z);
  assert.equal(stage(front,390/844,direction,guardian,true,false),true);
  assert.equal(stage(narrow,320/740,direction,guardian,true,false),true);
  assert.ok(alignment(front)>.80,'390-class counter must show a materially frontal view from public actor positions');
  assert.ok(alignment(front)>alignment(narrow)+.45,'390-class camera should compress projected separation compared with proven narrow shot');
  assert.ok(Math.abs(Math.hypot(front.x,front.z)-startLength)<1e-10,'cannot move camera nearer or crop real meshes');
  assert.equal(front.y,31,'keep validated above-deck camera height');
  const repeat=initial();stage(repeat,390/844,direction,guardian,true,false);
  assert.deepEqual(front,repeat,'deterministic view of same real actors');
});
test('Pass534 unchanged 320px scene and protected unearned/reduced/other-camera views',async()=>{
  const {setPublicEarnedGuardianFrontQuarterOffset:stage}=await load();
  const narrow=initial();stage(narrow,320/740,direction,guardian,true,false);
  assert.ok(Math.abs(alignment(narrow)-.33335845997320646)<1e-10,
    'do not modify independently verified native 320x740 framing');
  for(const [aspect,earned,reduced] of [[390/844,false,false],[390/844,true,true],
    [320/740,false,false],[844/390,true,false],[1280/900,true,false]]){
    const offset=initial();
    assert.equal(stage(offset,aspect,direction,guardian,earned,reduced),false);
    assert.deepEqual(offset,initial(),'no unearned/hidden/reduced/desktop effect');
  }
  const invalid=initial();
  assert.equal(stage(invalid,390/844,{x:NaN,z:0},guardian,true,false),false);
  assert.deepEqual(invalid,initial());
});
test('Pass534 real public follow stage retains full connected-body safety and privacy',()=>{
  assert.match(source,/const earnedDuelContinuity = cameraMode==='follow' && !result/);
  assert.match(source,/lastWitnessedGuardianStageRunToken===s\.runToken/);
  assert.match(source,/setPublicEarnedGuardianFrontQuarterOffset\(/);
  assert.match(source,/publicGuardianEarnedRecoilSafeContactHalfHeight\(/);
  assert.match(source,/publicGuardianEarnedRecoilFinalPairShift\(/);
  assert.match(source,/publicGuardianEarnedRecoilPairStageLift\(/);
  assert.doesNotMatch(source,/privateMaze.*setPublicEarnedGuardianFrontQuarterOffset/);
});
