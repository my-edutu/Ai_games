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
 assert.match(src,/actor\.mixer\.update[\s\S]*?stageRigArmsAfterMixer/);
 assert.match(src,/rigGesturePeakRad:/);
 assert.match(src,/rigGestureBones:/);
});

test('real rig lower-limb selection chooses original thigh, calf and ankle without hands, twist or other side',async()=>{
 const {selectLegBone}=await load();
 const bones=[
  {name:'mixamorig:LeftUpLeg',isBone:true},
  {name:'mixamorig:RightUpLeg',isBone:true},
  {name:'mixamorig:LeftLeg',isBone:true},
  {name:'mixamorig:RightLeg',isBone:true},
  {name:'mixamorig:LeftFoot',isBone:true},
  {name:'mixamorig:RightFoot',isBone:true},
  {name:'RightLegTwist',isBone:true},
  {name:'RightToeBase',isBone:true},
  {name:'RightArm',isBone:true}
 ];
 assert.equal(selectLegBone(bones,'left','upper'),bones[0]);
 assert.equal(selectLegBone(bones,'right','upper'),bones[1]);
 assert.equal(selectLegBone(bones,'left','lower'),bones[2]);
 assert.equal(selectLegBone(bones,'right','lower'),bones[3]);
 assert.equal(selectLegBone(bones,'left','foot'),bones[4]);
 assert.equal(selectLegBone(bones,'right','foot'),bones[5]);
 assert.equal(selectLegBone([{name:'Bip001 R Thigh',isBone:true}],'right','upper')?.name,'Bip001 R Thigh');
 assert.equal(selectLegBone([{name:'Bip001 L Calf',isBone:true}],'left','lower')?.name,'Bip001 L Calf');
 assert.equal(selectLegBone([{name:'Foot.L',isBone:true}],'left','foot')?.name,'Foot.L');
 for(const name of ['RightHand','RightArm','RightToe','RightLegTwist','LeftUpLeg'])
  assert.equal(selectLegBone([{name,isBone:true}],'right','lower'),null);
 assert.equal(selectLegBone([{name:'RightLeg',isBone:false}],'right','lower'),null);
 assert.equal(selectLegBone(bones,'unknown','lower'),null);
});

test('presentation gait advances by actual travelled distance, settles when standing, rejects teleports and reduced motion',async()=>{
 const {advanceRigGait}=await load();
 const first=advanceRigGait(0,0,.17);
 assert.ok(first.phase>.7&&first.phase<1.3,'one visible real-world step advances the stride phase');
 assert.ok(first.weight>0&&first.weight<=1);
 const second=advanceRigGait(first.phase,first.weight,.12);
 assert.ok(second.phase>first.phase&&second.weight>first.weight);
 let stopped=second;
 for(let i=0;i<20;i++)stopped=advanceRigGait(stopped.phase,stopped.weight,0);
 assert.equal(stopped.weight,0,'stopped actors cannot continue marching on the spot');
 for(const bad of [NaN,Infinity,-.2,.40])assert.deepEqual(advanceRigGait(second.phase,1,bad),{phase:0,weight:0});
 assert.deepEqual(advanceRigGait(second.phase,1,.12,true),{phase:0,weight:0});
 assert.deepEqual(advanceRigGait(NaN,NaN,0),{phase:0,weight:0});
});

test('bounded leg gait is mirrored, deterministic, frame independent and rests completely for accessibility',async()=>{
 const {planRigLegGesture}=await load();
 const neutral=planRigLegGesture(0,0);
 const stride=planRigLegGesture(Math.PI/2,1);
 assert.equal(stride.left.upper,-stride.right.upper);
 assert.ok(Math.abs(stride.left.upper)>.16);
 assert.ok(stride.right.lower>.05,'the recovery knee bends on the contralateral leg');
 for(const phase of [-Infinity,NaN,-5,0,.25,1,Math.PI,5,1e8,Infinity])
  for(const weight of [-1,NaN,0,.1,.7,1,4,Infinity]){
   const pose=planRigLegGesture(phase,weight);
   for(const side of ['left','right']){
    for(const part of ['upper','lower','foot']){
     assert.ok(Number.isFinite(pose[side][part]),side+':'+part);
     assert.ok(Math.abs(pose[side][part])<=.30);
    }
   }
   assert.deepEqual(planRigLegGesture(phase,weight,true),neutral);
   assert.deepEqual(planRigLegGesture(phase,weight),pose);
  }
 const src=fs.readFileSync(planPath,'utf8');
 assert.doesNotMatch(src,/Math\.random|performance\.now|Date\.|DungeonRuntime|fetch\(/);
});

test('actual cloned GLB renderer keeps lower limb overlays reversible and reports real joint counts',()=>{
 const src=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(src,/selectLegBone/);
 assert.match(src,/advanceRigGait/);
 assert.match(src,/planRigLegGesture/);
 assert.match(src,/restoreRigLegsBeforeMixer/);
 assert.match(src,/stageRigLegsAfterMixer/);
 assert.match(src,/rigGaitBones:/);
 assert.match(src,/rigGaitPeakRad:/);
 assert.match(src,/actor\.mixer\.update[\s\S]*?stageRigLegsAfterMixer/);
});


test('only true cloned forearm joints are eligible for original elbow posing',async()=>{
 const {selectForearmBone}=await load();
 const bones=[
  {name:'mixamorig:LeftForeArm',isBone:true},
  {name:'mixamorig:RightForeArm',isBone:true},
  {name:'mixamorig:RightForeArmTwist',isBone:true},
  {name:'mixamorig:RightArm',isBone:true},
  {name:'mixamorig:RightHand',isBone:true},
  {name:'LeftLowerArm',isBone:true}
 ];
 assert.equal(selectForearmBone(bones,'right'),bones[1]);
 assert.equal(selectForearmBone(bones,'left'),bones[0]);
 assert.equal(selectForearmBone([{name:'ForeArm.R',isBone:true}],'right')?.name,'ForeArm.R');
 assert.equal(selectForearmBone([{name:'Bip001 R ForeArm',isBone:true}],'right')?.name,'Bip001 R ForeArm');
 assert.equal(selectForearmBone([{name:'LeftLowerArm',isBone:true}],'left')?.name,'LeftLowerArm');
 for(const name of ['RightHand','RightArm','RightForeArmTwist','LeftForeArm','RightFinger','RightElbowEnd'])
  assert.equal(selectForearmBone([{name,isBone:true}],'right'),null,name);
 assert.equal(selectForearmBone([{name:'RightForeArm',isBone:false}],'right'),null);
 assert.equal(selectForearmBone(bones,'unknown'),null);
});

test('spectator elbow flex stages real attack/cast/guard and fully recovers with safe finite bounds',async()=>{
 const {planRigForearmGesture}=await load();
 const windup=planRigForearmGesture('vanguard','attack',.11);
 const strike=planRigForearmGesture('vanguard','attack',.25);
 assert.ok(windup.right>.20,'strong readable elbow windup');
 assert.ok(strike.right<-.10,'elbow opens through contact rather than staying rigid');
 assert.ok(planRigForearmGesture('ranger','attack',.11).left>.22,'archer supports a different two-arm draw silhouette');
 const cast=planRigForearmGesture('mystic','cast',.29);
 assert.ok(cast.left>.19&&cast.right>.19,'two elbows take part in the spell gesture');
 const guard=planRigForearmGesture('vanguard','guard',.35);
 assert.ok(guard.left>.20&&guard.right>.20,'guard flexes both elbow joints');
 const rest=planRigForearmGesture('vanguard','idle',0);
 assert.deepEqual(rest,{left:0,right:0});
 assert.deepEqual(planRigForearmGesture('vanguard','attack',.60),rest);
 for(const kind of ['vanguard','ranger','mystic','revenant','cultist','warden'])
  for(const action of ['idle','move','attack','cast','hurt','guard'])
   for(const t of [-Infinity,NaN,-3,0,.05,.11,.18,.25,.39,.58,1,5,Infinity]){
    const pose=planRigForearmGesture(kind,action,t);
    for(const side of ['left','right'])assert.ok(Number.isFinite(pose[side])&&Math.abs(pose[side])<=.46);
    assert.deepEqual(planRigForearmGesture(kind,action,t,true),rest);
    assert.deepEqual(planRigForearmGesture(kind,action,t),pose);
   }
 const source=fs.readFileSync(planPath,'utf8');
 assert.doesNotMatch(source,/Math\.random|performance\.now|Date\.|DungeonRuntime|fetch\(/);
});

test('actual cloned GLB rig stages and restores forearm bone rotation around the imported mixer',()=>{
 const source=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(source,/selectForearmBone/);
 assert.match(source,/planRigForearmGesture/);
 assert.match(source,/restoreRigForearmsBeforeMixer/);
 assert.match(source,/stageRigForearmsAfterMixer/);
 assert.match(source,/actor\.mixer\.update[\s\S]*?stageRigForearmsAfterMixer/);
 assert.match(source,/rigForearmBones:/);
 assert.match(source,/rigForearmPeakRad:/);
 assert.match(source,/actor\.rigForearms=\[\]/);
});

test('contact-aware lower-body bracing stages only real adjacent melee strikes and settles cleanly',async()=>{
 const {planRigContactBrace}=await load();
 const neutral=planRigContactBrace('vanguard','idle',0,1);
 assert.deepEqual(neutral,{
  left:{upper:0,lower:0,foot:0},
  right:{upper:0,lower:0,foot:0}
 });
 const windup=planRigContactBrace('vanguard','attack',.11,1);
 const contact=planRigContactBrace('vanguard','attack',.25,1);
 assert.ok(windup.left.upper<-.06&&windup.right.upper>.045,'wind-up staggers the real legs instead of marching in place');
 assert.ok(contact.left.upper>.09&&contact.right.upper<-.075,'contact reverses the stance to commit weight forward');
 assert.ok(contact.left.lower>.035&&contact.right.foot>.05,'contact includes knees and counter-rotating ankle');
 assert.deepEqual(planRigContactBrace('vanguard','attack',.60,1),neutral,'recovery leaves no accumulated gesture');
 for(const kind of ['vanguard','ranger','mystic','revenant','cultist','warden'])
  for(const action of ['idle','move','attack','cast','hurt','guard'])
   for(const age of [-1,NaN,Infinity,0,.05,.11,.18,.25,.35,.57,.6,5])
    for(const distance of [undefined,0,1,2,NaN,Infinity]){
     const pose=planRigContactBrace(kind,action,age,distance);
     for(const side of ['left','right'])for(const part of ['upper','lower','foot']){
      assert.ok(Number.isFinite(pose[side][part]));
      assert.ok(Math.abs(pose[side][part])<=.19,'bounded original GLB leg rotation');
     }
     assert.deepEqual(pose,planRigContactBrace(kind,action,age,distance),'frame independent');
     assert.deepEqual(planRigContactBrace(kind,action,age,distance,true),neutral);
     if(action!=='attack'||!['vanguard','revenant','warden'].includes(kind)||distance!==1||
       !Number.isFinite(age)||age<0||age>=.58)assert.deepEqual(pose,neutral);
    }
 const source=fs.readFileSync(planPath,'utf8');
 assert.doesNotMatch(source,/Math\.random|performance\.now|Date\.|DungeonRuntime|fetch\(/);
});

test('real GLB shins receive contact braces only from validated public grid facing, not display guesses',()=>{
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 assert.match(model,/planRigContactBrace/);
 assert.match(model,/actor\.combatFacing\?\.distance/);
 assert.match(model,/stageRigLegsAfterMixer\(actor,since,reducedMotion\)/);
 assert.match(model,/actor\.mixer\.update[\s\S]*?stageRigLegsAfterMixer/);
 assert.match(model,/rigContactBracePeakRad:/);
 assert.match(app,/a\.combatFacing=planCombatFacing\(u,s\.units,s\.map\)/);
});
