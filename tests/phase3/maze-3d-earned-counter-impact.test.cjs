'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const scene=fs.readFileSync(path.join(__dirname,'../../public/ai-maze-escape/scene.js'),'utf8');
const helper=()=>import('../../public/ai-maze-escape/public-counter-impact.mjs');
const current=()=>({
  lifecycle:'running',result:null,runToken:'real-live-counter',
  currentCell:6,visibleCells:[6,7,8],
  threats:[{id:'thornback',cell:8,lanternParried:true}]
});
const guardian=()=>({cell:8,x:4.8,z:0,counterPhase:.42});
test('a genuine currently visible earned counter gives one bounded, fading physical pulse',async()=>{
 const {publicEarnedCounterImpactStage:stage}=await helper();
 const s=current(),a=guardian(),before=JSON.stringify(s);
 const hit=stage(s,a);
 assert.ok(hit&&hit.scale>1&&hit.scale<1.56);
 assert.ok(hit.opacity>.4&&hit.opacity<.76);
 assert.equal(hit.beamActive,false,'after the strike, real character recoil—not a persistent laser—owns the stage');
 assert.equal(hit.coreOpacity,0,'earned after-contact beam physically fades out');
 const contact=stage(s,{...a,counterPhase:.02});
 const passing=stage(s,{...a,counterPhase:.16});
 const recover=stage(s,{...a,counterPhase:.80});
 assert.equal(stage(s,{...a,counterPhase:0}).scale,.94);
 assert.ok(contact.beamActive&&contact.coreOpacity>.6,
   'a genuine witnessed impact must retain its original visible light link');
 assert.ok(passing.beamActive&&passing.coreOpacity>0
   &&passing.coreOpacity<contact.coreOpacity,
   'real contact light must fade continuously as physical response starts');
 assert.equal(recover.beamActive,false);
 assert.equal(recover.coreOpacity,0);
 assert.ok(recover.opacity>0&&recover.scale>hit.scale,
   'the same rooted physical impact ring continues through recoil and release');
 assert.equal(stage(s,{...a,counterPhase:1}),null);
 assert.equal(stage(s,a,true),null,'reduced-motion never flashes a moving shell ring');
 assert.equal(JSON.stringify(s),before,'stage must never alter the authoritative snapshot');
});
test('stale, unseen, first-seen, terminal or unrelated parry never earns a hit effect',async()=>{
 const {publicEarnedCounterImpactStage:stage}=await helper(),s=current(),a=guardian();
 for(const invalid of [
  [{...s,visibleCells:[6,7]},a],
  [{...s,threats:[{id:'thornback',cell:8,lanternParried:false}]},a],
  [{...s,threats:[]},a],
  [{...s,lifecycle:'intermission'},a],
  [{...s,result:{reason:'escape'}},a],
  [s,{...a,counterPhase:undefined}],
  [s,{...a,counterPhase:NaN}],
  [s,{...a,counterPhase:-.1}],
  [s,{...a,x:NaN}],
  [s,{...a,cell:5}]
 ])assert.equal(stage(...invalid),null);
});
test('the actual native WebGL director connects the pulse to an earned, public, open corridor',()=>{
 assert.match(scene,/const counterImpact=publicEarnedCounterImpactStage\(\s*s,earnedCounterActor,settings\.reducedMotion\)/);
 assert.match(scene,/if\(counterImpact && explorerLantern && earnedCounterModel\?\.parent/);
 assert.match(scene,/publicLanternEncounter\(s,earnedCounterActor\.cell\)/);
 assert.match(scene,/earnedTwoLinkPath/);
 assert.match(scene,/placePublicSurveyCone\(\s*counterCoreStraight,/);
 assert.match(scene,/placePublicSurveyCone\(\s*counterCoreTurn,/);
 assert.match(scene,/counterImpactRing\.position\.copy\(earnedCounterModel\.position\)/);
 assert.match(scene,/counterImpactRing\.visible=false/);
 assert.match(scene,/counterCoreStraight\.visible=connected && counterImpact\.beamActive/);
 assert.match(scene,/counterCoreTurn\.visible=connected && !!earnedTwoLinkPath && counterImpact\.beamActive/);
 assert.match(scene,/counterImpactRing\.visible=connected/);
 assert.doesNotMatch(scene,/counterCoreStraight\.visible=true;\s*counterImpactRing\.visible=true/);
 assert.match(scene,/counterCoreGeometry\.dispose\(\)/);
 assert.match(scene,/counterImpactGeometry\.dispose\(\)/);
 assert.doesNotMatch(scene,/new THREE\.(Mesh|CylinderGeometry|TorusGeometry)[^\n]*counterImpact &&/);
});
