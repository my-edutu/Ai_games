'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs');
async function load(){
 const src=fs.readFileSync('public/ai-dungeon/cinematic-chapter-plan.js','utf8');
 return import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'));
}
test('original Warden three-stage strikes flow from genuine warning into cast recoil and settle without invented attack',async()=>{
 const {planWardenTrueStrikeRelease:release}=await load();
 for(const shape of ['NOVA','RIFT_CROSS','ECLIPSE_SWEEP']){
  const warn={shape,axis:'NORTH_SOUTH',attackTick:18},unit={kind:'warden',hp:51,action:'cast',actionTick:18};
  const unchanged=JSON.stringify([warn,unit]),start=release(warn,unit,0),impact=release(warn,unit,.26),settle=release(warn,unit,.55);
  assert.ok(start&&impact&&settle);
  assert.equal(start.weight,0);assert.ok(impact.weight>.9&&settle.weight<impact.weight);
  assert.ok(Object.isFrozen(impact)&&Object.isFrozen(impact.shoulders));
  assert.ok(Math.abs(impact.spine.pitch)<=.25&&Math.abs(impact.brace)<=.12);
  assert.equal(JSON.stringify([warn,unit]),unchanged);
  assert.equal(release(warn,unit,.62),null);
  assert.equal(release(warn,unit,.26,true),null);
  assert.equal(release(warn,{...unit,action:'move'},.26),null);
  assert.equal(release(warn,{...unit,actionTick:19},.26),null);
  assert.equal(release(warn,{...unit,hp:0},.26),null);
 }
});
test('three genuine Warden strikes have distinct skinned weapon/body follow-through',async()=>{
 const {planWardenTrueStrikeRelease:p}=await load(),u={kind:'warden',hp:33,action:'cast',actionTick:30};
 const f=shape=>p({shape,axis:'EAST_WEST',attackTick:30},u,.26);
 const n=f('NOVA'),r=f('RIFT_CROSS'),e=f('ECLIPSE_SWEEP');
 assert.equal(n.shoulders.left.pitch,n.shoulders.right.pitch);
 assert.ok(r.shoulders.right.pitch>r.shoulders.left.pitch+.2);
 assert.ok(e.shoulders.left.roll>0&&e.shoulders.right.roll<0);
 assert.notDeepEqual(n.shoulders,r.shoulders);assert.notDeepEqual(e.shoulders,r.shoulders);
 const other=p({shape:'ECLIPSE_SWEEP',axis:'NORTH_SOUTH',attackTick:30},u,.26);
 assert.equal(other.spine.yaw,-e.spine.yaw);
 for(const bad of [null,{}, {shape:'INVENTED',attackTick:30}, {shape:'NOVA',attackTick:31}])
  assert.equal(p(bad,u,.26),null);
});
test('native rig, authoritative cast and world court share one real release without changing combat authority',()=>{
 const app=fs.readFileSync('public/ai-dungeon/app.js','utf8');
 const model=fs.readFileSync('public/ai-dungeon/model-assets.js','utf8');
 assert.ok(app.includes('planWardenTrueStrikeRelease(a.wardenPriorThreat,a.u,since,reduced)'));
 assert.ok(app.includes('genuineThreat.attackTick>state.tick'));
 assert.ok(model.includes('actor.wardenStrikePose?.spine'));
 assert.ok(model.includes('actor.wardenStrikePose?.shoulders?.[mount.side]'));
 assert.ok(model.includes('actor.wardenStrikePose?.forearms?.[mount.side]'));
 assert.ok(model.includes('restoreRigArmsBeforeMixer(actor)'));
 assert.ok(model.includes('restoreRigMeleeBeforeMixer(actor)'));
});
