'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs');
async function plan(){
 const js=fs.readFileSync('public/ai-dungeon/cinematic-chapter-plan.js','utf8');
 return import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
}
const threat=(shape,turns,axis='EAST_WEST')=>({
 warning:true,shape,axis,attackTick:20,cells:[{x:9,z:9},{x:10,z:9}],turnsUntilImpact:turns
});
test('genuine Warden NOVA, RIFT CROSS and ECLIPSE telegraphs have distinct whole-body vocabulary',async()=>{
 const {planWardenThreatPerformance:p}=await plan();
 const nova=p(threat('NOVA',3),17),rift=p(threat('RIFT_CROSS',2),18),eclipse=p(threat('ECLIPSE_SWEEP',3),17);
 for(const v of [nova,rift,eclipse]){
  assert.ok(v&&Object.isFrozen(v)&&v.weight>0&&v.weight<=.93);
  for(const side of ['left','right']){
   assert.ok(Math.abs(v.shoulders[side].pitch)<=.6);
   assert.ok(Math.abs(v.shoulders[side].roll)<=.4);
   assert.ok(Math.abs(v.forearms[side])<=.3);
  }
  assert.ok(Math.abs(v.torsoYaw)<=.2&&Math.abs(v.torsoRoll)<=.2);
 }
 assert.equal(nova.shoulders.left.pitch,nova.shoulders.right.pitch,'nova hoists both arms');
 assert.ok(rift.shoulders.right.pitch<rift.shoulders.left.pitch-.1,'rift crosses one stronger weapon shoulder');
 assert.ok(eclipse.shoulders.left.roll<0&&eclipse.shoulders.right.roll>0,'eclipse expands to lateral sweep');
 assert.notDeepEqual(nova.shoulders,rift.shoulders);
 assert.notDeepEqual(rift.shoulders,eclipse.shoulders);
});
test('every actual countdown escalates without changing game truth or inventing expired, false and reduced-motion threats',async()=>{
 const {planWardenThreatPerformance:p,planWardenCharge}=await plan();
 for(const shape of ['NOVA','RIFT_CROSS','ECLIPSE_SWEEP']){
  const max=shape==='RIFT_CROSS'?2:3,w=threat(shape,max),before=JSON.stringify(w);
  assert.ok(p(w,19).weight>p(w,20-max).weight);
  assert.deepEqual(planWardenCharge(w,19).threatPerformance,p(w,19));
  assert.equal(JSON.stringify(w),before);
  assert.equal(p(w,20),null);
  assert.equal(p(w,19,true),null);
  assert.equal(planWardenCharge(w,19,true).threatPerformance,undefined);
 }
 for(const bad of [null,{},threat('FAKE',3),{...threat('NOVA',3),warning:false},
  {...threat('NOVA',3),cells:[]},{...threat('NOVA',3),cells:[{x:NaN,z:9}]},
  {...threat('NOVA',3),attackTick:18}])assert.equal(p(bad,18),null);
 const f=p(threat('ECLIPSE_SWEEP',2,'NORTH_SOUTH'),18);
 const e=p(threat('ECLIPSE_SWEEP',2,'EAST_WEST'),18);
 assert.equal(f.torsoYaw,-e.torsoYaw,'authority strike axis determines sword coil');
});
test('original native animation mixer, authoritative warning and carved court are truly connected',()=>{
 const model=fs.readFileSync('public/ai-dungeon/model-assets.js','utf8');
 const app=fs.readFileSync('public/ai-dungeon/app.js','utf8');
 const ritual=fs.readFileSync('public/ai-dungeon/warden-ritual.js','utf8');
 assert.ok(model.includes('const physicalTell=threat?.shoulders?.[mount.side]'));
 assert.ok(model.includes('actor.wardenCharge?.threatPerformance?.forearms?.[mount.side]'));
 assert.ok(model.includes('threat?.torsoYaw')&&model.includes('threat?.torsoRoll'));
 assert.ok(model.includes('restoreRigForearmsBeforeMixer(actor)'));
 assert.ok(model.includes('restoreRigMeleeBeforeMixer(actor)'));
 assert.ok(app.includes('planWardenCharge(state?.bossWarning,state?.tick,reduced)'));
 assert.ok(ritual.includes('warning.cells.slice(0,warningCount)'));
 assert.ok(ritual.includes('warningOffsets[i]={x:ox,z:oz}'));
});