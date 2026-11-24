'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const scene=fs.readFileSync(path.join(root,'public/ai-maze-escape/scene.js'),'utf8');
const camera=()=>import(pathToFileURL(path.join(root,'public/ai-maze-escape/guardian-duel-camera.mjs')).href);
const hero={x:-2.4,z:-2.4},thornback={x:0,z:0};
const offset=()=>({x:5,y:31,z:21});
const alignment=o=>(o.x*hero.x+o.z*hero.z)/
  (Math.hypot(o.x,o.z)*Math.hypot(hero.x,hero.z));
test('Pass538 authentic 390 counter draws the two physical actors into one more frontal performance after contact',async()=>{
  const {setPublicEarnedGuardianWideContactReveal:reveal}=await camera();
  const o=offset(),before=alignment(o),radius=Math.hypot(o.x,o.z);
  assert.equal(reveal(o,390/844,hero,thornback,.80,true,false),true);
  assert.ok(alignment(o)>before+.80,
    'actor-pair camera must materially improve real wide-portrait facial geometry');
  assert.ok(Math.abs(Math.hypot(o.x,o.z)-radius)<1e-10,
    'never zoom, approach or change actual actor size');
  assert.equal(o.y,31,'keep existing above-deck clearance, not camera cropping');
  const same=offset();
  reveal(same,390/844,hero,thornback,.80,true,false);
  assert.deepEqual(same,o,'no randomness, hidden AI or new scene');
});
test('Pass538 retained impact is continuous and original 320/landscape/desktop/reduced/privacy behavior unchanged',async()=>{
  const {setPublicEarnedGuardianWideContactReveal:reveal}=await camera();
  for(const [aspect,phase,earned,reduced,h,g] of [
    [390/844,0,true,false,hero,thornback],
    [390/844,.24,true,false,hero,thornback],
    [390/844,1,true,false,hero,thornback],
    [390/844,.6,false,false,hero,thornback],
    [390/844,.6,true,true,hero,thornback],
    [320/740,.6,true,false,hero,thornback],
    [844/390,.6,true,false,hero,thornback],
    [1280/900,.6,true,false,hero,thornback],
    [NaN,.6,true,false,hero,thornback],
    [390/844,NaN,true,false,hero,thornback],
    [390/844,.6,true,false,{x:NaN,z:-1},thornback],
    [390/844,.6,true,false,{x:.1,z:0},thornback]
  ]){
    const o=offset();
    assert.equal(reveal(o,aspect,h,g,phase,earned,reduced),false);
    assert.deepEqual(o,offset(),'no unauthorized scene change');
  }
  let prev=0;
  for(let i=24;i<=88;i++){
    const o=offset(),phase=i/100;
    reveal(o,390/844,hero,thornback,phase,true,false);
    const angle=Math.atan2(o.z,o.x);
    const base=Math.atan2(21,5);
    const diff=Math.atan2(Math.sin(angle-base),Math.cos(angle-base));
    assert.ok(diff>=prev-1e-10 && diff<=1.55000001,
      'portrait reframe must begin smoothly and never jump or exceed its bounded orbit');
    prev=diff;
  }
});
test('Pass538 source remains same-run/public-actor gated and retains all strict physical/full-frame checks',()=>{
  assert.match(scene,/const earnedDuelContinuity = cameraMode==='follow' && !result/);
  assert.match(scene,/lastWitnessedGuardianStageRunToken===s\.runToken/);
  assert.match(scene,/earnedRecoilCameraOffset\.lerp\(cameraOffset,1-earnedShotAct\);[\s\S]{0,800}setPublicEarnedGuardianWideContactReveal\(/);
  assert.match(scene,/publicGuardianEarnedRecoilSafeContactHalfHeight\(/);
  assert.match(scene,/publicGuardianEarnedRecoilFinalPairShift\(/);
  assert.match(scene,/publicGuardianEarnedRecoilPairStageLift\(/);
  assert.match(scene,/if\(earnedDuelContinuity && earnedCounterModel\?\.parent\)/);
  assert.doesNotMatch(scene,/privateMaze[\s\S]{0,100}setPublicEarnedGuardianWideContactReveal\(/);
});

test('Pass539 protects the genuine 390px public ray from an unverified frontal orbit while retaining the strong strict browser gate',async()=>{
  const {setPublicEarnedGuardianWideContactReveal:reveal}=await camera();
  const o=offset(),before=alignment(o);
  const base=Math.atan2(o.z,o.x);
  assert.equal(reveal(o,390/844,hero,thornback,.80,true,false,Math.PI/30),true);
  const delta=Math.atan2(Math.sin(Math.atan2(o.z,o.x)-base),
    Math.cos(Math.atan2(o.z,o.x)-base));
  assert.ok(delta>0 && Math.abs(delta)<=Math.PI/30+1e-10,
    'never swing through foreground public masonry to force a speculative frontal shot');
  assert.ok(alignment(o)>before,'physical actor-pair alignment should not worsen');
  for(const invalid of [NaN,0,-.1,1.5500001,Infinity]){
    const candidate=offset();
    assert.equal(reveal(candidate,390/844,hero,thornback,.80,true,false,invalid),false);
    assert.deepEqual(candidate,offset());
  }
  assert.match(scene,/earnedCounterActor\?\.counterPhase,true,settings\.reducedMotion,\s*Math\.PI\/30\);/,
    'real scene must use source-safe constrained orbit, not test-only helper defaults');
  assert.match(fs.readFileSync(path.join(root,'tests/browser/maze-review.spec.cjs'),'utf8'),
    /expect\(anchor\.inconclusive,name\+' may not silently pass an ambiguous ray'\)\.toBe\(false\)/,
    'unchanged strict source-bound mesh-ray acceptance remains authoritative');
});
