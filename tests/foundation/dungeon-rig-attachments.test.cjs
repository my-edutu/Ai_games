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
test('animated hand binding selects only the intended whole hand, never fingers or opposite side',async()=>{
 const {selectHandBone}=await load();
 const bones=[
  {name:'mixamorig:LeftHand',isBone:true},
  {name:'mixamorig:RightHandThumb1',isBone:true},
  {name:'RightHandIndex2',isBone:true},
  {name:'RightForeArm',isBone:true},
  {name:'mixamorig:RightHand',isBone:true},
  {name:'R_Wrist',isBone:true}
 ];
 assert.equal(selectHandBone(bones,'right'),bones[4]);
 assert.equal(selectHandBone(bones,'left'),bones[0]);
 assert.equal(selectHandBone([{name:'Hand.R',isBone:true}],'right')?.name,'Hand.R');
 assert.equal(selectHandBone([{name:'Bip001 R Hand',isBone:true}],'right')?.name,'Bip001 R Hand');
 assert.equal(selectHandBone([{name:'hand_r',isBone:true}],'right')?.name,'hand_r');
 assert.equal(selectHandBone([{name:'RightHandThumb1',isBone:true}],'right'),null);
 assert.equal(selectHandBone([{name:'RightHand',isBone:false}],'right'),null);
 assert.equal(selectHandBone([{name:'LeftHand',isBone:true}],'right'),null);
 assert.equal(selectHandBone([],'right'),null);
});
test('class grips are immutable and only finite, bounded hand offsets may align',async()=>{
 const {rigGripAnchor,boundedGripOffset}=await load();
 assert.deepEqual(rigGripAnchor('ranger'),{x:.43,y:1.18,z:.37});
 assert.deepEqual(rigGripAnchor('mystic'),{x:.53,y:1.12,z:.39});
 assert.ok(Object.isFrozen(rigGripAnchor('ranger')));
 assert.equal(rigGripAnchor('warden'),null);
 assert.equal(rigGripAnchor(undefined),null);
 assert.equal(boundedGripOffset(.3,.4,0),.5);
 assert.equal(boundedGripOffset(.72,0,0),.72);
 assert.equal(boundedGripOffset(1.054,0,0),1.054);
 assert.equal(boundedGripOffset(1.14,0,0),1.14);
 for(const invalid of [[1.15,0,0],[Infinity,0,0],[NaN,0,0],[0,0,NaN]])
  assert.equal(boundedGripOffset(...invalid),null);
 assert.equal(boundedGripOffset(.2,0,0,0),null);
 assert.equal(boundedGripOffset(.2,0,0,10),null);
 assert.equal(boundedGripOffset(0,0,0),0);
});
test('only original ranger and mystic prop sets are permitted to follow the real hand skeleton',async()=>{
 const {rigWeaponParts}=await load();
 assert.deepEqual(rigWeaponParts('ranger'),['flexed-back-bow','taut-bowstring']);
 assert.deepEqual(rigWeaponParts('mystic'),['staff-shaft','staff-crescent','staff-heart']);
 for(const other of ['vanguard','revenant','cultist','warden','',null,undefined])
  assert.deepEqual(rigWeaponParts(other),[]);
 for(const kind of ['ranger','mystic'])assert.ok(Object.isFrozen(rigWeaponParts(kind)));
 const src=fs.readFileSync(planPath,'utf8');
 assert.doesNotMatch(src,/Math\.random|Date\.|performance\.|fetch\(|DungeonRuntime|requestAnimationFrame/);
});
test('actual 3D renderer binds owned mesh props to a cloned animated bone and reports it without touching authority',()=>{
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 const server=fs.readFileSync(path.join(root,'scripts/serve-dungeon-stream.cjs'),'utf8');
 assert.ok(model.includes("from '/dungeon/rig-attachment-plan.js'"));
 assert.match(model,/function bindRigWeaponAccessories\(actor/);
 assert.match(model,/handBone\.attach\(mesh\)/);
 assert.match(model,/rigBoundAccessoryActors:/);
 assert.match(model,/handBone\.attach\(mount\)/);
 assert.match(model,/mount\.position\.set\(0,0,0\)/);
 assert.match(model,/rigGripAlignedActors:/);
 assert.match(model,/rigGripMaxShiftMeters:/);
 assert.match(model,/rigBoundAccessoryParts:/);
 assert.match(model,/actor\.rigBoundAccessoryParts=0/);
 assert.ok(server.includes("['/dungeon/rig-attachment-plan.js','rig-attachment-plan.js']"));
});
test('bone-bound real WebGL audit is discoverable by the dedicated browser suite',()=>{
 const config=fs.readFileSync(path.join(root,'tests/browser/dungeon.playwright.config.cjs'),'utf8');
 assert.ok(config.includes("'dungeon-rig-attachments.spec.cjs'"));
});

test('real rig upper-arm selection never mistakes hand, twist, shoulder or forearm joints',async()=>{
 const {selectUpperArmBone}=await load();
 const bones=[
  {name:'mixamorig:LeftArm',isBone:true},
  {name:'mixamorig:RightHand',isBone:true},
  {name:'mixamorig:RightForeArm',isBone:true},
  {name:'mixamorig:RightArm',isBone:true},
  {name:'RightArmTwist',isBone:true},
  {name:'RightShoulder',isBone:true}
 ];
 assert.equal(selectUpperArmBone(bones,'right'),bones[3]);
 assert.equal(selectUpperArmBone(bones,'left'),bones[0]);
 assert.equal(selectUpperArmBone([{name:'Bip001 R UpperArm',isBone:true}],'right')?.name,'Bip001 R UpperArm');
 assert.equal(selectUpperArmBone([{name:'UpperArm.R',isBone:true}],'right')?.name,'UpperArm.R');
 assert.equal(selectUpperArmBone([{name:'RightForeArm',isBone:true}],'right'),null);
 assert.equal(selectUpperArmBone([{name:'RightArm',isBone:false}],'right'),null);
 assert.equal(selectUpperArmBone([{name:'LeftArm',isBone:true}],'right'),null);
});

test('original action-directed shoulder arcs anticipate, strike and recover without drift or unsafe displacement',async()=>{
 const {planRigArmGesture}=await load();
 const windup=planRigArmGesture('vanguard','attack',.11);
 const contact=planRigArmGesture('vanguard','attack',.25);
 const recovery=planRigArmGesture('vanguard','attack',.61);
 assert.ok(windup.right.pitch>.16,'visible right-hand anticipation');
 assert.ok(contact.right.pitch<-.13,'the right arm drives through attack contact');
 assert.deepEqual(recovery,planRigArmGesture('vanguard','idle',0));
 const ranger=planRigArmGesture('ranger','attack',.11);
 assert.ok(ranger.right.pitch<-.11,'bow draw uses a differentiated shoulder silhouette');
 const spell=planRigArmGesture('mystic','cast',.27);
 assert.ok(spell.left.pitch<-.15&&spell.right.pitch<-.18,'spell raises both arms');
 for(const kind of ['vanguard','ranger','mystic','revenant','cultist','warden'])
  for(const action of ['idle','move','attack','cast','hurt','guard'])
   for(const t of [0,.04,.11,.18,.25,.42,.58,.8,5,Infinity,NaN,-2]){
    const pose=planRigArmGesture(kind,action,t);
    for(const side of ['left','right']){
     assert.ok(Number.isFinite(pose[side].pitch)&&Number.isFinite(pose[side].roll));
     assert.ok(Math.abs(pose[side].pitch)<=.43&&Math.abs(pose[side].roll)<=.19);
    }
    assert.deepEqual(planRigArmGesture(kind,action,t,true),planRigArmGesture(kind,'idle',0));
   }
});

test('real cloned GLB skeleton receives reversible gesture overlays after animation mixer updates',()=>{
 const src=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(src,/selectUpperArmBone/);
 assert.match(src,/planRigArmGesture/);
 assert.match(src,/actor\.rigUpperArms/);
 assert.match(src,/actor\.mixer\.update[\s\S]*?planRigArmGesture/);
 assert.match(src,/rigGesturePeakRad:/);
 assert.match(src,/rigGestureBones:/);
});
