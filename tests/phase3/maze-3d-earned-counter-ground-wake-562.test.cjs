'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const current=()=>import('../../public/ai-maze-escape/public-counter-impact.mjs');
const source=()=>fs.readFileSync(path.join(__dirname,'../../public/ai-maze-escape/scene.js'),'utf8');
const a={x:0,z:0},mid={x:2,z:0},to={x:2,z:2};
test('earned aftershock visibly crosses the authentic open corner rather than cutting a diagonal',async()=>{
 const {publicEarnedCounterGroundWake:pose}=await current();
 const early=pose(.20,0,a,mid,to),around=pose(.40,0,a,mid,to);
 assert.ok(early.x>0&&early.x<2);
 assert.equal(early.z,0,'before the bend the wake stays on the first disclosed corridor');
 assert.equal(around.x,2,'after the bend it remains on the second corridor');
 assert.ok(around.z>0&&around.z<2);
 assert.ok(around.opacity>.60&&around.scale>.85);
 const direct=pose(.4,0,a,null,to);
 assert.ok(Math.abs(direct.x-direct.z)<1e-10);
 assert.equal(pose(.20,2,a,mid,to),null,'trailing beats are not fabricated early');
 assert.equal(pose(.88,0,a,mid,to),null,'the observed counter ends rather than lingering');
});
test('null on reduced motion, stale clocks, invalid bodies and impossible jump',async()=>{
 const {publicEarnedCounterGroundWake:pose}=await current();
 for(const p of [
  [-.1,0,a,mid,to],[1,0,a,mid,to],[NaN,0,a,mid,to],
  [.4,-1,a,mid,to],[.4,3,a,mid,to],[.4,.5,a,mid,to],
  [.4,0,{x:NaN,z:0},mid,to],[.4,0,a,{x:NaN,z:0},to],
  [.4,0,a,mid,{x:50,z:0}],[.4,0,a,{x:0,z:0},to]
 ])assert.equal(pose(...p),null);
 assert.equal(pose(.4,0,a,mid,to,true),null);
 const before=JSON.stringify([a,mid,to]);
 pose(.4,1,a,mid,to);
 assert.equal(JSON.stringify([a,mid,to]),before,'never writes gameplay state');
});
test('installed native Three source pools physical scene meshes and requires the genuine earned corridor',()=>{
 const src=source();
 assert.match(src,/const counterImpact=publicEarnedCounterImpactStage/);
 assert.match(src,/earnedTwoLinkPath \|\| publicLanternEncounter/);
 assert.match(src,/counterImpactRing\.visible=connected/);
 assert.match(src,/if\(connected\)\{\s*const wakeCorner=earnedTwoLinkPath/);
 assert.match(src,/publicEarnedCounterGroundWake\(/);
 assert.match(src,/sampleGroundHeight\(wake\.x,wake\.z,s\)/);
 assert.match(src,/for\(const ring of counterWakeRings\)ring\.visible=false/);
 assert.match(src,/counterWakeGeometry\.dispose\(\)/);
 assert.match(src,/ring\.material\.dispose\(\)/);
 assert.doesNotMatch(src,/new THREE\.TorusGeometry\([^\n]*counterImpact\.phase/);
});
