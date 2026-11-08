'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const source=path.join(root,'public/ai-dungeon/full-body-animation-controller.js');
const load=()=>import('data:text/javascript;base64,'+
 Buffer.from(fs.readFileSync(source,'utf8')).toString('base64'));
const hero=(action='idle',actionTick=12,hp=30)=>({id:'hero-1',kind:'vanguard',action,actionTick,hp,maxHp:30});
const frame=(unit,rest={})=>({unit,actionAge:.15,frameDelta:.016,...rest});

test('only witnessed visual displacement animates imported-leg travel',async()=>{
 const {advanceFullBodyController:step}=await load();
 const idle=step(null,frame(hero('move'),{grounded:{moving:false,clipAction:'idle'}}));
 assert.equal(idle.mode,'idle');assert.equal(idle.clipAction,'idle');
 const move=step(idle,frame(hero('move'),{grounded:{moving:true,clipAction:'move'}}));
 assert.equal(move.mode,'move');assert.equal(move.owner.locomotion,true);
 assert.equal(move.owner.duel,false);assert.equal(move.phase,'stride');
 assert.equal(step(move,frame(hero('move'),{grounded:{moving:false,clipAction:'idle'}})).mode,'idle');
 assert.equal(step(move,frame(hero('move'),{grounded:{moving:true,clipAction:'move'},reducedMotion:true})).mode,'idle');
});
test('real one-shot attack is coherent from anticipation through recovery',async()=>{
 const {advanceFullBodyController:step}=await load();
 let value=step(null,frame(hero('attack',19),{actionAge:.08}));
 assert.equal(value.mode,'attack');assert.equal(value.phase,'anticipation');
 assert.equal(value.owner.duel,true);assert.equal(value.clipAction,'attack');
 const contact=step(value,frame(hero('attack',19),{actionAge:.215}));
 assert.equal(contact.phase,'contact');assert.equal(contact.changed,false);
 assert.equal(contact.restarted,false);assert.equal(contact.interrupted,false);
 value=step(contact,frame(hero('attack',19),{actionAge:.45}));
 assert.equal(value.phase,'recovery');
 const finish=step(value,frame(hero('attack',19),{actionAge:.7}));
 assert.equal(finish.phase,'settled');
 assert.equal(finish.owner.duel,true,'same authority tick does not manufacture a second hit');
});
test('repeated legal strike restarts once at a new authoritative actionTick',async()=>{
 const {advanceFullBodyController:step}=await load();
 const first=step(null,frame(hero('attack',20)));
 const repeated=step(first,frame(hero('attack',20),{actionAge:.20}));
 assert.equal(repeated.changed,false);
 const next=step(repeated,frame(hero('attack',21),{actionAge:0}));
 assert.equal(next.restarted,true);assert.equal(next.interrupted,true);
 assert.equal(next.changed,true);
 assert.equal(step(next,frame(hero('attack',21),{actionAge:.02})).restarted,false);
});
test('true positive HP loss interrupts a sword pose, then hands control back',async()=>{
 const {advanceFullBodyController:step}=await load();
 const attack=step(null,frame(hero('attack',22)));
 const beat={id:'hero-1',kind:'vanguard',damage:5,maxHp:30,age:.12,fatal:false};
 const hurt=step(attack,frame(hero('attack',22,25),{damageBeat:beat}));
 assert.equal(hurt.mode,'hurt');assert.equal(hurt.clipAction,'hurt');
 assert.equal(hurt.owner.injury,true);assert.equal(hurt.owner.duel,false);
 assert.equal(hurt.interrupted,true);
 const still=step(hurt,frame(hero('attack',22,25),{damageBeat:{...beat,age:.20}}));
 assert.equal(still.changed,false);
 const recovered=step(still,frame(hero('attack',22,25),{damageBeat:{...beat,age:.58}}));
 assert.equal(recovered.mode,'attack');assert.equal(recovered.owner.duel,true);
 assert.equal(recovered.interrupted,true);
});
test('no counterfeit damage, evade or defeat from invalid beats',async()=>{
 const {advanceFullBodyController:step}=await load();
 for(const damageBeat of [null,{id:'hero-1',kind:'vanguard',damage:0,maxHp:30,age:.1},
  {id:'hero-1',kind:'vanguard',damage:3,maxHp:30,age:-.2},
  {id:'hero-1',kind:'vanguard',damage:3,maxHp:30,age:.6},
  {id:'hero-1',kind:'vanguard',damage:3,maxHp:30,age:NaN},
  {id:'unrelated',kind:'vanguard',damage:3,maxHp:30,age:.2}]){
  const f=step(null,frame(hero('attack'),{damageBeat}));
  assert.equal(f.mode,'attack');assert.equal(f.owner.injury,false);
 }
 const noEvade=step(null,frame(hero('idle'),{evasionBeat:{id:'hero-1',kind:'vanguard',tick:22,dx:1,dz:0,age:Infinity}}));
 assert.equal(noEvade.mode,'idle');
 assert.equal(step(null,frame(hero('hurt'))).mode,'idle', 'a stale hurt label alone is not damage');
 assert.equal(step(null,frame(hero('idle'),{evasionBeat:{id:'hero-1',kind:'vanguard',tick:22,dx:0,dz:0,age:.08}})).mode,'idle', 'only a real one-cell escape can interrupt');
 assert.equal(step(null,frame(hero('idle'),{evasionBeat:{id:'other',kind:'vanguard',tick:22,dx:1,dz:0,age:.08}})).mode,'idle', 'other actors cannot own this pose');
 const alive=step(null,frame(hero('idle',12,1)));assert.equal(alive.mode,'idle');
});
test('verified evasion temporarily owns the body instead of layering over a cast',async()=>{
 const {advanceFullBodyController:step}=await load();
 const cast=step(null,frame(hero('cast',17)));
 const evade=step(cast,frame(hero('cast',17),{evasionBeat:{id:'hero-1',kind:'vanguard',tick:17,dx:1,dz:0,age:.08}}));
 assert.equal(evade.mode,'evade');assert.equal(evade.clipAction,'idle');
 assert.equal(evade.owner.evasion,true);assert.equal(evade.owner.cast,false);
 assert.equal(evade.owner.duel,false);assert.equal(evade.interrupted,true);
 const recovered=step(evade,frame(hero('cast',17),{evasionBeat:{id:'hero-1',kind:'vanguard',tick:17,dx:1,dz:0,age:.61}}));
 assert.equal(recovered.mode,'cast');assert.equal(recovered.clipAction,'cast');
});
test('defeat is absorbing at HP zero and does not advance gait, strikes or injury',async()=>{
 const {advanceFullBodyController:step}=await load();
 const fallen=step(null,frame(hero('attack',17,0),{
  grounded:{moving:true,clipAction:'move'},
  damageBeat:{id:'hero-1',kind:'vanguard',damage:40,maxHp:30,age:.2,fatal:true},
  evasionBeat:{id:'hero-1',kind:'vanguard',tick:17,dx:1,dz:0,age:.08}
 }));
 assert.equal(fallen.mode,'defeat');assert.equal(fallen.clipAction,'idle');
 assert.equal(fallen.owner.defeat,true);assert.equal(fallen.owner.duel,false);
 assert.equal(fallen.owner.warning,false);assert.equal(fallen.phase,'down');
});
test('constrained foot support respects actual movement, planted side and bounds',async()=>{
 const {planConstrainedFootSupport:pose}=await load();
 const still=pose(Math.PI/2,1);
 for(const bad of [
  pose(Math.PI/2,1,{moving:false}),
  pose(Math.PI/2,1,{moving:true,teleport:true}),
  pose(Math.PI/2,1,{moving:true,reducedMotion:true}),
  pose(NaN,1,{moving:true}),
  pose(Math.PI/2,Infinity,{moving:true})
 ])assert.deepEqual(bad,still);
 const stance=pose(Math.PI/2,1,{moving:true});
 assert.equal(stance.left.foot,0);
 assert.ok(stance.right.foot<-.05);
 for(const t of [0,.5,1,2,Math.PI,4,5.5,9.1])
  for(const w of [0,.1,.8,1,2,NaN]){
   const p=pose(t,w,{moving:true});
   for(const side of ['left','right'])for(const x of Object.values(p[side]))
    assert.ok(Number.isFinite(x)&&Math.abs(x)<=.063);
  }
});
test('native skinned stride synchronizes to actual alternating footfall stamps and releases stance smoothly',async()=>{
 const pathToRig=path.join(root,'public/ai-dungeon/rig-attachment-plan.js');
 const {advanceRigGait,alignRigFootfallPhase,planRigLegGesture,planRigFullBodyStride}=
  await import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(pathToRig,'utf8')).toString('base64'));
 const tau=2*Math.PI;
 const prior=advanceRigGait(0,0,.13,false,.016);
 assert.ok(prior.weight>.50&&prior.phase>0,'legal source displacement starts a real stride');
 const actual=alignRigFootfallPhase(prior.phase,.25,true);
 assert.ok(Math.abs(actual-tau*.25)<1e-9,'both original source ankles must use the stamped foot cycle');
 const changedParity=alignRigFootfallPhase(prior.phase,.75,true);
 assert.ok(Math.abs(changedParity-actual-Math.PI)<1e-9,'every second stamped step swaps the planted foot');
 assert.equal(alignRigFootfallPhase(actual,.75,false),actual,'idle is not a counterfeit footstep');
 assert.equal(alignRigFootfallPhase(actual,.75,true,true),0,'teleport resets');
 assert.equal(alignRigFootfallPhase(actual,Infinity,true),actual,'malformed foot signal is ignored');
 assert.equal(alignRigFootfallPhase(actual,-.10,true),actual);
 assert.equal(alignRigFootfallPhase(actual,1.5,true),actual);
 const slow=advanceRigGait(actual,1,0,false,.016);
 const faster=advanceRigGait(actual,1,0,false,.032);
 assert.ok(slow.weight>0&&slow.weight<1,'standing down fades the last physically planted step');
 assert.ok(faster.weight<slow.weight,'longer rendered frames should consume more of the same physical time');
 assert.equal(slow.phase,actual,'fading pose cannot create travel');
 assert.ok(planRigLegGesture(slow.phase,slow.weight).left.upper!==0);
 assert.ok(Math.abs(planRigFullBodyStride('vanguard',slow.phase,slow.weight).hips.yaw)>0);
 let settled=slow;
 for(let i=0;i<24;i++)settled=advanceRigGait(settled.phase,settled.weight,0,false,.016);
 assert.equal(settled.weight,0,'the idle pose reaches exact rest, not endless skating');
 assert.deepEqual(advanceRigGait(slow.phase,slow.weight,0,true,.016),{phase:0,weight:0});
 assert.deepEqual(advanceRigGait(slow.phase,slow.weight,Infinity,false,.016),{phase:0,weight:0});
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(model,/stageRigGroundedStride\(actor,reducedMotion,dt\)/);
 assert.match(model,/alignRigFootfallPhase\(gait\.phase,actor\.groundedPerformance\?\.footPhase,walking/);
 assert.match(model,/fullBodyFootfallPhaseErrorRad:/);
 assert.match(model,/fullBodySettlingActors:/);
});

test('source clips are auditable by native track without altering original GLBs',async()=>{
 const {auditImportedAnimationClips:audit}=await load();
 const clip={name:'Run',duration:1.2,tracks:[
  {name:'Spine.quaternion'},{name:'LeftFoot.quaternion'},
  {name:'Armature.position'},{name:'Neck.scale'}
 ]};
 const r=audit([clip]);
 assert.equal(r.clips[0].rotation,2);assert.equal(r.clips[0].translation,1);
 assert.equal(r.clips[0].scale,1);assert.equal(r.rootMotionTracks.length,1);
 assert.equal(r.invalidClips,0);
 assert.equal(audit([clip,clip]).invalidClips,1);
 assert.deepEqual(audit([]).clips,[]);
 assert.deepEqual(clip.tracks[0],{name:'Spine.quaternion'});
});
test('one verified evade owns a finite cloth lag and injury/defeat cannot keep an attack hem swinging',async()=>{
 const pathToDrape=path.join(root,'public/ai-dungeon/fabric-drape-plan.js');
 const drape=await import('data:text/javascript;base64,'+
  Buffer.from(fs.readFileSync(pathToDrape,'utf8')).toString('base64'));
 const early=drape.planDrapeSwing('evade',.20);
 assert.ok(early.pitch>.08&&early.roll>.04);
 assert.deepEqual(drape.planDrapeSwing('evade',.58),{pitch:0,roll:0});
 assert.deepEqual(drape.planDrapeSwing('evade',.20,true),{pitch:0,roll:0});
 assert.equal(drape.drapePoseKey('defeat',.20),'rest');
 assert.equal(drape.drapePoseKey('evade',.8),'rest');
 assert.ok(drape.planDrapeVertexBend(1,.5,'evade',.25).z>.01);
 for(const action of ['evade','hurt','defeat']){
  for(const t of [0,.08,.20,.45,.58,1,NaN,Infinity]){
   const p=drape.planDrapeVertexBend(1,.5,action,t);
   assert.ok(Object.values(p).every(v=>Number.isFinite(v)&&Math.abs(v)<.15));
  }
 }
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(model,/const clothAction=actor\.fullBody\?\.mode/);
 assert.match(model,/const clothAge=actor\.fullBody\?\.owner\.injury\|\|actor\.fullBody\?\.owner\.evasion/);
 assert.match(model,/planDrapeSwing\(clothAction,clothAge,reducedMotion\)/);
});

test('witnessed strike survives one empty authority tick to complete its physical recovery',async()=>{
 const {advanceFullBodyController:step}=await load();
 const started=step(null,frame(hero('attack',31),{actionAge:.21}));
 assert.equal(started.mode,'attack');assert.equal(started.age,.21);
 let pose=step(started,frame(hero('idle',32),{actionAge:0,frameDelta:.05}));
 assert.equal(pose.mode,'attack','source contact must not vanish at next fixed simulation tick');
 assert.equal(pose.actionTick,31,'visual action source tick must remain the REAL witnessed attack tick');
 assert.equal(pose.authorityAction,'idle','authority remains idle while presentation completes prior action');
 assert.ok(pose.age>.21&&pose.age<.28,'rendered recovery advances a bounded visual age');
 assert.equal(pose.restarted,false,'holding the same visual one-shot never restarts it');
 let previous=pose;
 for(let i=0;i<10;i++){pose=step(pose,frame(hero('idle',32),{actionAge:0,frameDelta:.05}));
  assert.ok(pose.age>=previous.age||pose.mode==='idle');
  previous=pose;
 }
 assert.equal(pose.mode,'idle','source one-shot cannot hold a stale strike forever');
 assert.equal(pose.owner.duel,false);
});

test('a real casting animation recovers between authority ticks without inventing another spell',async()=>{
 const {advanceFullBodyController:step}=await load();
 const caster={...hero('cast',44),kind:'mystic'};
 const initial=step(null,frame(caster,{actionAge:.30}));
 const held=step(initial,frame({...caster,action:'idle',actionTick:45},{actionAge:.02,frameDelta:.04}));
 assert.equal(held.mode,'cast');
 assert.equal(held.actionTick,44);assert.equal(held.owner.cast,true);
 assert.equal(held.restarted,false);
 assert.equal(held.owner.duel,false);
 let current=held;
 for(let i=0;i<12;i++)current=step(current,frame({...caster,action:'idle',actionTick:45},{actionAge:0,frameDelta:.05}));
 assert.equal(current.mode,'idle','source cast settles instead of hanging in final keyframe');
});

test('legitimate interruptions and skipped authority ticks override recovered one-shot',async()=>{
 const {advanceFullBodyController:step}=await load();
 const attack=step(null,frame(hero('attack',60),{actionAge:.23}));
 const idle={...hero('idle',61)};
 const baseline=step(attack,frame(idle,{actionAge:0,frameDelta:.05}));
 assert.equal(baseline.mode,'attack');
 const guard=step(attack,frame(hero('guard',61)));
 assert.equal(guard.mode,'guard');assert.equal(guard.interrupted,true);
 const move=step(attack,frame(hero('move',61),{grounded:{moving:true,clipAction:'move'}}));
 assert.equal(move.mode,'move');
 const injury=step(attack,frame(hero('idle',61,25),{damageBeat:{
  id:'hero-1',kind:'vanguard',damage:5,maxHp:30,age:.14,fatal:false}}));
 assert.equal(injury.mode,'hurt');assert.equal(injury.owner.duel,false);
 const evade=step(attack,frame(hero('idle',61),{evasionBeat:{
  id:'hero-1',kind:'vanguard',tick:61,dx:1,dz:0,age:.14}}));
 assert.equal(evade.mode,'evade');
 assert.equal(step(attack,frame(hero('idle',61,0))).mode,'defeat');
 assert.equal(step(attack,frame(hero('idle',61),{reducedMotion:true})).mode,'idle');
 assert.equal(step(attack,frame(hero('idle',66))).mode,'idle',
  'more than one skipped authority tick cannot replay a long stale strike');
 const second=step(attack,frame(hero('attack',61),{actionAge:0}));
 assert.equal(second.mode,'attack');assert.equal(second.restarted,true);
 assert.equal(second.age,0,'new legitimate action begins on its own confirmed tick');
});

test('elapsed one-shots settle into idle and cannot restart from a stale authority label',async()=>{
 const {advanceFullBodyController:step}=await load();
 const finished=step(null,frame(hero('attack',73),{actionAge:1.4}));
 assert.equal(finished.mode,'idle');
 assert.equal(finished.owner.duel,false);
 const second=step(finished,frame(hero('attack',73),{actionAge:1.6}));
 assert.equal(second.mode,'idle');
 assert.equal(second.owner.duel,false);
});

test('a witnessed adjacent melee target remains a *visual* recovery anchor, never a new hit',async()=>{
 const {advanceFullBodyController:step}=await load();
 const attacking={...hero('attack',80),targetId:'real-revenant'};
 const shown=step(null,frame(attacking,{actionAge:.215,combatFacing:{
  targetId:'real-revenant',distance:1,yaw:.35}}));
 assert.deepEqual(shown.confirmedContact,{targetId:'real-revenant',distance:1,actionTick:80});
 const held=step(shown,frame(hero('idle',81),{frameDelta:.04,actionAge:0,combatFacing:null}));
 assert.equal(held.holding,true);assert.equal(held.mode,'attack');
 assert.deepEqual(held.confirmedContact,shown.confirmedContact,
  'a valid completed strike retains its source pose, not its damage authority');
 assert.equal(held.actionTick,80);
 const neutral=step(held,frame(hero('idle',81),{frameDelta:.05,actionAge:0}));
 assert.deepEqual(neutral.confirmedContact,shown.confirmedContact);
 const newFight=step(held,frame({...hero('attack',81),targetId:'other-foe'},{
  actionAge:0,combatFacing:{targetId:'other-foe',distance:1,yaw:-.3}}));
 assert.deepEqual(newFight.confirmedContact,{targetId:'other-foe',distance:1,actionTick:81});
 const guard=step(shown,frame(hero('guard',81)));
 assert.equal(guard.confirmedContact,null);
 const wounded=step(shown,frame(hero('idle',81,24),{damageBeat:{
  id:'hero-1',kind:'vanguard',damage:6,maxHp:30,age:.1,fatal:false}}));
 assert.equal(wounded.confirmedContact,null);
});

test('an ambiguous or out-of-range target never authorizes planted contact during recovery',async()=>{
 const {advanceFullBodyController:step}=await load();
 const unit={...hero('attack',90),targetId:'foe'};
 for(const details of [null,{targetId:'foe',distance:2},{targetId:'different',distance:1},
  {targetId:'foe',distance:1,yaw:NaN},{targetId:'foe',distance:1,yaw:Infinity}]){
  const attack=step(null,frame(unit,{combatFacing:details}));
  assert.equal(attack.confirmedContact,null);
  const idle=step(attack,frame(hero('idle',91),{frameDelta:.04}));
  assert.equal(idle.confirmedContact,null);
 }
 const good=step(null,frame(unit,{combatFacing:{targetId:'foe',distance:1,yaw:1}}));
 assert.ok(good.confirmedContact);
 assert.equal(step(good,frame(hero('idle',93))).confirmedContact,null,
  'a skipped authority tick releases the old contact');
 assert.equal(step(good,frame(hero('idle',91),{reducedMotion:true})).confirmedContact,null);
});

test('source AnimationMixer uses captured visual tick and single controller pose clock',()=>{
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(model,/const tick=actor\.fullBody\?\.actionTick\?\?actor\.u\.actionTick/,
  'an idle authority tick cannot restart a visually finishing legal source clip');
 assert.match(model,/const poseAge=actor\.fullBody\.age/);
 assert.match(model,/planNativeDuelPose\(actor\.u\.kind,actor\.fullBody\.owner\.duel\?'attack':'idle',poseAge/);
 assert.match(model,/stageRigMeleeAfterMixer\(actor,poseAge,reducedMotion\)/);
 assert.match(model,/stageRigArmsAfterMixer\(actor,poseAge,reducedMotion\)/);
});


test('genuine HP-zero source skeleton freezes its living mixer while preserving the existing collapse layer',async()=>{
 const {advanceFullBodyController:step}=await load();
 const standing=step(null,frame(hero('idle',56,30)));
 const fallen=step(standing,frame(hero('hurt',57,0),{damageBeat:{
  id:'hero-1',kind:'vanguard',damage:30,maxHp:30,age:.06,fatal:true}}));
 assert.equal(fallen.mode,'defeat');
 assert.equal(fallen.owner.defeat,true);
 assert.equal(fallen.owner.locomotion,false);
 assert.equal(fallen.owner.duel,false);
 const after=step(fallen,frame(hero('idle',58,0),{actionAge:2}));
 assert.equal(after.mode,'defeat');
 assert.equal(after.owner.defeat,true);
 const recovered=step(after,frame(hero('idle',59,30),{actionAge:0}));
 assert.equal(recovered.mode,'idle','legal revival releases the terminal source-pose hold');
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(model,/const freezeSource=actor\.fullBody\.owner\.defeat/);
 assert.match(model,/if\(!freezeSource\)changeAction\(actor,actor\.fullBody\.clipAction,actor\.fullBody\.restarted\)/);
 assert.match(model,/actor\.mixer\.update\(freezeSource\?0:Math\.min\(/);
 assert.match(model,/stageSkinnedDefeatAfterMixer\(actor,reducedMotion\)/);
 assert.match(model,/fullBodyFrozenSourceActors:/);
 assert.match(model,/fullBodyFrozenSourceFrames:/);
 const browser=fs.readFileSync(path.join(root,'tests/browser/dungeon-endgame-epilogue.spec.cjs'),'utf8');
 assert.match(browser,/fullBodyFrozenSourceActors/);
 assert.match(browser,/fullBodyFrozenSourceFrames/);
});

test('real renderer consumes exactly one arbiter before imported mixer and preserves reversible bones',()=>{
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 const server=fs.readFileSync(path.join(root,'scripts/serve-dungeon-stream.cjs'),'utf8');
 const code=fs.readFileSync(source,'utf8');
 assert.ok(model.includes('actor.fullBody=advanceFullBodyController('));
 assert.match(model,/actor\.fullBody=advanceFullBodyController[\s\S]*?changeAction\(actor,actor\.fullBody\.clipAction[\s\S]*?restoreRigArmsBeforeMixer[\s\S]*?actor\.mixer\.update[\s\S]*?stageRigLegsAfterMixer/);
 assert.match(model,/planConstrainedFootSupport\(actor\.rigGaitPhase,actor\.rigGaitWeight/);
 assert.match(model,/actor\.fullBody\.owner\.duel\?'attack':'idle'/);
 assert.match(model,/fullBodyInterruptions:/);
 assert.match(model,/sourceClipAudits:/);
 assert.match(model,/next\.time=Math\.min\(Math\.max\(0,actor\.fullBody\.age\*clipSpeed\)/,
  'legal interrupted one-shots must resume at their current imported-clip age');
 assert.match(model,/actor\.fullBody\?\.owner\.warning/,'Warden warnings must release joint ownership on damage and evasion');
 assert.ok(server.includes("['/dungeon/full-body-animation-controller.js','full-body-animation-controller.js']"));
 assert.doesNotMatch(code,/Math\.random|Date\.now|DungeonRuntime|fetch\(|performance\.now/);
});
