'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const load=()=>import(pathToFileURL(path.join(root,'public/ai-maze-escape/guardian-duel-camera.mjs')).href);
const scene=fs.readFileSync(path.join(root,'public/ai-maze-escape/scene.js'),'utf8');
const base=()=>({x:15,y:31,z:18});
const dot=(v,d)=> (v.x*d.x+v.z*d.z)/(Math.hypot(v.x,v.z)*Math.hypot(d.x,d.z));

test('Pass514 a REAL observed counter stages the connected guardian face, not a tiny back-facing shell',async()=>{
  const {setPublicEarnedGuardianFrontQuarterOffset:stage}=await load();
  const offset=base(),hero={x:-2.4,z:-2.4},guardian={x:0,z:0};
  const direction={x:hero.x-guardian.x,z:hero.z-guardian.z};
  const before=dot(offset,direction),oldRadius=Math.hypot(offset.x,offset.z);
  assert.equal(stage(offset,390/844,hero,guardian,true,false),true);
  assert.ok(dot(offset,direction)>before+.55,
    'must materially replace the old rear-dorsal view with a front-quarter view');
  assert.ok(Math.abs(Math.hypot(offset.x,offset.z)-oldRadius)<1e-10,
    'retain the original world-scale 3D camera distance rather than crop/zoom');
  assert.equal(offset.y,31,'preserve the native physically cleared above-deck height');
  const again=base();stage(again,390/844,hero,guardian,true,false);
  assert.deepEqual(offset,again,'real observed pair dictates deterministic cinematic framing');
  assert.deepEqual({hero,guardian},{hero:{x:-2.4,z:-2.4},guardian:{x:0,z:0}},
    'no authoritative actor is moved');
});

test('Pass514 no invented face reveal for stale, hidden, terminal, reduced or non-portrait scenes',async()=>{
  const {setPublicEarnedGuardianFrontQuarterOffset:stage}=await load();
  const guardian={x:0,z:0},hero={x:-2.4,z:-2.4};
  for(const [aspect,h,g,earned,reduced] of [
    [390/844,hero,guardian,false,false],
    [390/844,hero,guardian,true,true],
    [320/740,hero,{x:0,z:0},false,false],
    [844/390,hero,guardian,true,false],
    [1280/900,hero,guardian,true,false],
    [.3,hero,guardian,true,false],
    [NaN,hero,guardian,true,false],
    [390/844,{x:0.2,z:0},guardian,true,false],
    [390/844,{x:NaN,z:0},guardian,true,false],
    [390/844,hero,null,true,false],
  ]){
    const offset=base();
    assert.equal(stage(offset,aspect,h,g,earned,reduced),false);
    assert.deepEqual(offset,base());
  }
  const bad={x:15,y:Infinity,z:18};
  assert.equal(stage(bad,390/844,hero,guardian,true,false),false);
  assert.equal(bad.x,15);assert.equal(bad.z,18);
});

test('Pass514 real earned counter camera is explicitly subordinate to public Follow continuity',()=>{
  assert.match(scene,/if\(earnedDuelContinuity && earnedCounterModel\?\.parent\)\s+setPublicEarnedGuardianFrontQuarterOffset\(/);
  assert.match(scene,/const earnedDuelContinuity = cameraMode==='follow' && !result/);
  assert.match(scene,/lastWitnessedGuardianStageRunToken===s\.runToken/);
  assert.match(scene,/earnedRecoilCameraOffset\.y = publicGuardianEarnedRecoilRevealElevation/);
  assert.match(scene,/publicGuardianEarnedRecoilFinalPairShift\(/,
    'existing FULL connected actor final silhouette correction must be preserved');
  assert.doesNotMatch(scene,/privateMaze.*setPublicEarnedGuardianFrontQuarterOffset/);
});
