'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const planPath=path.join(root,'public/ai-dungeon/rig-attachment-plan.js');
async function load(){
 const source=fs.readFileSync(planPath,'utf8');
 return import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
}
test('real melee winds the torso and weapon hand before contact, then restores them',async()=>{
 const {planRigMeleeFollowThrough}=await load();
 const windup=planRigMeleeFollowThrough('vanguard','attack',.11,1,'enemy');
 const impact=planRigMeleeFollowThrough('vanguard','attack',.25,1,'enemy');
 const recovery=planRigMeleeFollowThrough('vanguard','attack',.60,1,'enemy');
 assert.ok(windup.spine.yaw<-.15 && windup.wrist.pitch<-.17);
 assert.ok(impact.spine.yaw>.16 && impact.wrist.pitch>.17);
 assert.ok(impact.spine.pitch<-.06);
 assert.deepEqual(recovery,planRigMeleeFollowThrough('vanguard','idle',0,1,'enemy'));
});
test('melee cosmetics require a valid adjacent public contact and remain finite and reversible',async()=>{
 const {planRigMeleeFollowThrough}=await load();
 const neutral=planRigMeleeFollowThrough('vanguard','idle',0,1,'enemy');
 for(const kind of ['vanguard','revenant','warden','ranger','mystic','cultist'])
  for(const action of ['idle','attack','cast','hurt'])
   for(const age of [-1,NaN,0,.11,.25,.58,1,Infinity])
    for(const distance of [0,1,2,NaN]){
     const pose=planRigMeleeFollowThrough(kind,action,age,distance,'enemy');
     for(const part of [pose.spine,pose.wrist])for(const axis of ['pitch','yaw','roll']){
      assert.ok(Number.isFinite(part[axis])&&Math.abs(part[axis])<=.36);
     }
     assert.deepEqual(planRigMeleeFollowThrough(kind,action,age,distance,'enemy',true),neutral);
     if(action!=='attack'||distance!==1||!['vanguard','revenant','warden'].includes(kind)||age<0||age>=.58||!Number.isFinite(age))
      assert.deepEqual(pose,neutral);
    }
 assert.deepEqual(planRigMeleeFollowThrough('vanguard','attack',.25,1,''),neutral);
});
test('only genuine central chest joints bind to the animated presentation',async()=>{
 const {selectCombatTorsoBone}=await load();
 const bones=[{name:'mixamorig:Spine',isBone:true},{name:'mixamorig:Spine2',isBone:true},{name:'Neck',isBone:true}];
 assert.equal(selectCombatTorsoBone(bones),bones[1]);
 assert.equal(selectCombatTorsoBone([{name:'UpperChest',isBone:true}])?.name,'UpperChest');
 assert.equal(selectCombatTorsoBone([{name:'ChestTwist',isBone:true}]),null);
 assert.equal(selectCombatTorsoBone([{name:'Spine',isBone:false}]),null);
});
test('the live cloned GLB renderer binds/restores actual torso and wrist around its mixer',()=>{
 const code=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(code,/restoreRigMeleeBeforeMixer/);
 assert.match(code,/stageRigMeleeAfterMixer/);
 assert.match(code,/planRigMeleeFollowThrough/);
 assert.match(code,/rigMeleeCurrentPeakRad:/);
 assert.match(code,/rigMeleeActiveActors:/);
 assert.match(code,/actor\.combatFacing\?\.targetId/);
});
