'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const load=()=>import(pathToFileURL(path.join(root,'public/ai-maze-escape/guardian-duel-camera.mjs')).href);
const hero={x:-2.4,z:-2.4},guardian={x:0,z:0};
const base=()=>({x:-12,y:31,z:-23});
const alignment=(c)=>(c.x*(hero.x-guardian.x)+c.z*(hero.z-guardian.z))/
  (Math.hypot(c.x,c.z)*Math.hypot(hero.x-guardian.x,hero.z-guardian.z));

test('the current 320px real counter stages both actual actors after impact without moving either mesh',async()=>{
  const {setPublicEarnedGuardianNarrowWithdrawalTwoShot:shot}=await load();
  const offset=base(),radius=Math.hypot(offset.x,offset.z);
  const before=alignment(offset);
  assert.equal(shot(offset,320/740,hero,guardian,.54,true,false),true);
  assert.ok(alignment(offset)>before+.005 && alignment(offset)>.99999);
  assert.ok(Math.abs(Math.hypot(offset.x,offset.z)-radius)<1e-10);
  assert.equal(offset.y,31,'physical camera floor clearance unchanged');
  const repeat=base();shot(repeat,320/740,hero,guardian,.54,true,false);
  assert.deepEqual(repeat,offset);
});

test('witnessed action opens and withdraws smoothly without a cut at counter expiry',async()=>{
  const {setPublicEarnedGuardianNarrowWithdrawalTwoShot:shot}=await load();
  const angles=[];
  for(let i=0;i<=100;i++){
    const v=base();shot(v,320/740,hero,guardian,i/100,true,false);
    angles.push(Math.atan2(v.z,v.x));
  }
  assert.equal(angles[0],angles[14]);
  assert.ok(angles[35]<angles[20] && angles[54]<angles[35]);
  assert.ok(Math.abs(angles[90]-angles[0])<Math.abs(angles[75]-angles[0]));
  assert.equal(angles[100],angles[0]);
  for(let i=1;i<angles.length;i++)
    assert.ok(Math.abs(angles[i]-angles[i-1])<.025,'no discontinuous camera rotation');
});

test('invalid, stale, hidden, other viewport, reduced motion and no earned hit leave camera untouched',async()=>{
  const {setPublicEarnedGuardianNarrowWithdrawalTwoShot:shot}=await load();
  for(const [aspect,phase,earned,reduced,subject] of [
    [320/740,.5,false,false,hero],[320/740,.5,true,true,hero],
    [390/844,.5,true,false,hero],[844/390,.5,true,false,hero],
    [1280/900,.5,true,false,hero],[320/740,NaN,true,false,hero],
    [320/740,1,true,false,hero],[320/740,-1,true,false,hero],
    [320/740,.1,true,false,hero],[320/740,.5,true,false,{x:NaN,z:0}],
    [320/740,.5,true,false,{x:.01,z:0}]]){
    const v=base();assert.equal(shot(v,aspect,subject,guardian,phase,earned,reduced),false);
    assert.deepEqual(v,base());
  }
});

test('only authenticated public-pair Follow owns the action, strict complete-actor fitter is preserved',()=>{
  const source=readFileSync(path.join(root,'public/ai-maze-escape/scene.js'),'utf8');
  const old=source.indexOf('setPublicEarnedGuardianNarrowPairStage(');
  const stage=source.indexOf('setPublicEarnedGuardianNarrowWithdrawalTwoShot(');
  const fit=source.indexOf('publicGuardianEarnedRecoilSafeContactHalfHeight(');
  assert.ok(old>=0 && stage>old && fit>stage);
  assert.match(source,/lastWitnessedGuardianStageRunToken===s\.runToken/);
  assert.match(source,/earnedCounterActor\?\.counterPhase/);
  assert.match(source,/publicGuardianEarnedRecoilFinalPairShift\(/);
  assert.match(source,/publicGuardianEarnedRecoilPairStageLift\(/);
  assert.doesNotMatch(source,/privateMaze[\s\S]{0,140}setPublicEarnedGuardianNarrowWithdrawalTwoShot\(/);
});
