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
 assert.equal(finish.mode,'idle','expired .62s source one-shot releases the pose');
 assert.equal(finish.phase,'idle');assert.equal(finish.owner.duel,false);
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
 assert.equal(recovered.mode,'idle','old sword cannot replay after a real injury');
 assert.equal(recovered.owner.duel,false);assert.equal(recovered.interruptionSuppressedTick,22);
 assert.equal(recovered.interrupted,true);
});
test('one witnessed HP loss owns one source Hit_A across subsequent authority ticks',async()=>{
 const {advanceFullBodyController:step}=await load();
 const beat={id:'hero-1',kind:'vanguard',damage:5,maxHp:30,
  fatal:false,eventTick:210,age:.08};
 const first=step(null,frame(hero('idle',210,25),{damageBeat:beat}));
 assert.equal(first.mode,'hurt');assert.equal(first.actionTick,210);
 const continuing=step(first,frame(hero('idle',211,25),{
  damageBeat:{...beat,age:.23}
 }));
 assert.equal(continuing.mode,'hurt','the same positive-HP-loss beat remains visible');
 assert.equal(continuing.actionTick,210,'source clip retains original HP-loss tick');
 assert.equal(continuing.changed,false,'authority heartbeat is not a second impact');
 assert.equal(continuing.restarted,false,'Hit_A must not restart at the next server tick');
 assert.equal(continuing.interrupted,false);
 assert.equal(continuing.age,.23,'flinch continues toward its original recovery');
 const newBeat=step(continuing,frame(hero('idle',212,20),{
  damageBeat:{...beat,eventTick:212,age:.025}
 }));
 assert.equal(newBeat.mode,'hurt');
 assert.equal(newBeat.actionTick,212);
 assert.equal(newBeat.restarted,true,'a separate real HP drop may start a fresh Hit_A');
 assert.equal(newBeat.interrupted,true);
 const after=step(newBeat,frame(hero('idle',213,20),{
  damageBeat:{...beat,eventTick:212,age:.18}
 }));
 assert.equal(after.restarted,false,'newer beat does not replay every heartbeat');
 assert.equal(after.actionTick,212);
 const released=step(after,frame(hero('idle',213,20),{
  damageBeat:{...beat,eventTick:212,age:.57}
 }));
 assert.equal(released.mode,'idle','expired injury must release physical pose');
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 assert.match(app,/if\(damage\)a\.damageBeat=\{\.\.\.damage,eventTick:s\.tick,age:/,
  'the production viewer stamps ONLY planAuthorityDamageBeats witnesses');
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
 assert.equal(recovered.mode,'idle','old cast cannot replay after a legal dodge');
 assert.equal(recovered.clipAction,'idle');assert.equal(recovered.interruptionSuppressedTick,17);
});

test('verified injury or evasion cancels stale imported attack/cast without blocking a NEW legal tick',async()=>{
 const {advanceFullBodyController:step}=await load();
 const damage={id:'hero-1',kind:'vanguard',damage:5,maxHp:30,
  age:.12,eventTick:22,fatal:false};
 const first=step(null,frame(hero('attack',22)));
 const injured=step(first,frame(hero('attack',22,25),{damageBeat:damage}));
 assert.equal(injured.mode,'hurt','real HP loss owns Hit_A');
 const cleared=step(injured,frame(hero('attack',22,25),{
  damageBeat:{...damage,age:.58}}));
 assert.equal(cleared.mode,'idle','no second sword windup after witnessed hurt');
 assert.equal(cleared.interruptionSuppressedTick,22);
 assert.equal(step(cleared,frame(hero('attack',22,25))).clipAction,'idle');
 const nextAttack=step(cleared,frame(hero('attack',23,25),{actionAge:0}));
 assert.equal(nextAttack.mode,'attack','only a new legal source tick starts a sword');
 assert.equal(nextAttack.interruptionSuppressedTick,null);
 const continuingHurt=step(injured,frame(hero('attack',23,25),{
  damageBeat:{...damage,age:.3}}));
 assert.equal(continuingHurt.mode,'hurt','active real injury interrupts even newer action labels');
 assert.equal(step(continuingHurt,frame(hero('attack',23,25),{
  damageBeat:{...damage,age:.58}})).mode,'idle');
 assert.equal(step(continuingHurt,frame(hero('attack',24,25),{
  damageBeat:{...damage,age:.58}})).mode,'attack');
 const verified={id:'hero-1',kind:'vanguard',tick:17,dx:1,dz:0,age:.08};
 const cast=step(null,frame(hero('cast',17)));
 const evade=step(cast,frame(hero('cast',17),{evasionBeat:verified}));
 assert.equal(evade.mode,'evade','only legal one-cell escape interrupts casting');
 const landed=step(evade,frame(hero('cast',17),{
  evasionBeat:{...verified,age:.61}}));
 assert.equal(landed.mode,'idle','do not conjure a second spell on landing');
 assert.equal(step(landed,frame(hero('cast',17))).mode,'idle');
 assert.equal(step(landed,frame(hero('cast',18),{actionAge:0})).mode,'cast');
 const invalid=step(null,frame(hero('attack',22),{
  damageBeat:{...damage,id:'someone-else'},evasionBeat:{...verified,dx:0,dz:0}}));
 assert.equal(invalid.mode,'attack','ambiguous injury or evasion cannot cancel lawful combat');
 const terminal=step(injured,frame(hero('attack',22,0),{damageBeat:damage}));
 assert.equal(terminal.mode,'defeat','real HP zero remains absorbing');
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(model,/advanceFullBodyController\(actor\.fullBody,/);
 assert.match(model,/changeAction\(actor,actor\.fullBody\.clipAction,actor\.fullBody\.restarted,\s*dt,sourceFrameInterval,sourceFrameVisible\)/);
});

test('defeat is absorbing at HP zero and does not advance gait, strikes or injury',async()=>{
 const {advanceFullBodyController:step}=await load();
 const fallen=step(null,frame(hero('attack',17,0),{
  grounded:{moving:true,clipAction:'move'},
  damageBeat:{id:'hero-1',kind:'vanguard',damage:40,maxHp:30,age:.2,fatal:true},
  evasionBeat:{id:'hero-1',kind:'vanguard',tick:17,dx:1,dz:0,age:.08}
 }));
 assert.equal(fallen.mode,'defeat');assert.equal(fallen.clipAction,'defeat');
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
 assert.equal(Object.is(stance.left.foot,-0),false,'unloaded genuine foot stays canonical zero');
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
 assert.match(model,/const clothAge=actor\.fullBody\?\.holding\|\|actor\.fullBody\?\.owner\.injury\|\|actor\.fullBody\?\.owner\.evasion/);
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


test('Death_A is not re-triggered by every fixed-step actionTick while HP stays zero',async()=>{
 const {shouldRestartImportedOneShot:restart,advanceFullBodyController:step}=await load();
 // Real DungeonRuntime.step sets actionTick=state.tick for EVERY unit each 350 ms,
 // including already fallen actors. The source death clip is 0.792 s long.
 assert.equal(restart('defeat','attack',17,18),true,'first lawful HP-zero selects death');
 for(let tick=19;tick<=32;tick++)
  assert.equal(restart('defeat','defeat',18,tick),false,
   'source Death_A must continue across authoritative tick '+tick);
 assert.equal(restart('defeat','defeat',18,35,true),false,
  'an unrelated forceRestart cannot relaunch an already defeated source clip');
 const down=step(null,frame(hero('hurt',18,0)));
 const later=step(down,frame(hero('idle',19,0),{actionAge:.35}));
 assert.equal(later.mode,'defeat');
 assert.equal(later.owner.defeat,true);
 assert.equal(restart('idle','defeat',18,20),false,'revival selects living idle');
 assert.equal(restart('defeat','idle',20,21),true,'a NEW genuine death after revival can play');
 for(const mode of ['attack','cast','hurt']){
  assert.equal(restart(mode,mode,21,22),true,mode+' remains tick-driven');
  assert.equal(restart(mode,mode,22,22),false,mode+' must not replay each render frame');
  assert.equal(restart(mode,mode,22,22,true),true,'real interruption retains its restart');
 }
 assert.equal(restart('move','move',21,22),false);
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 const authority=fs.readFileSync(path.join(root,'games/ai-dungeon/src/index.ts'),'utf8');
 assert.match(authority,/unit\.action='idle';unit\.actionTick=s\.tick/);
 assert.ok(model.includes('const newEvent=shouldRestartImportedOneShot(action,actor.currentAction,actor.currentActionTick,tick,forceRestart);'));
});

test('licensed native death plays once after real HP zero and releases on revival',async()=>{
 const {chooseImportedSourceClip:choose,advanceFullBodyController:step}=await load();
 const originals=['Idle','Death_A','Walking_A'].map(name=>({name,duration:.792}));
 for(const kind of ['vanguard','revenant','warden','ranger','mystic','cultist'])
  assert.equal(choose(originals,'defeat',kind).name,'Death_A');
 assert.equal(choose(originals.filter(c=>c.name!=='Death_A'),'defeat','vanguard'),null);
 const down=step(null,frame(hero('hurt',18,0)));
 assert.equal(down.mode,'defeat');assert.equal(down.clipAction,'defeat');
 const back=step(down,frame(hero('idle',19,30)));
 assert.equal(back.mode,'idle');assert.equal(back.clipAction,'idle');
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(model,/actor\.nativeDeathSourceActive=Boolean\(genuineDeath/);
 assert.match(model,/if\(actor\.nativeDeathSourceActive&&!reducedMotion\)/);
 assert.match(model,/nativeDeathSourceActors:/);
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
 assert.match(model,/const freezeSource=actor\.fullBody\.owner\.defeat&&\(!genuineDeath\|\|deathFinished\)/);
 assert.match(model,/if\(!freezeSource\)changeAction\(actor,actor\.fullBody\.clipAction,actor\.fullBody\.restarted,\s*dt,sourceFrameInterval,sourceFrameVisible\)/);
 assert.match(model,/const sourceStep=freezeSource\?0:actor\.fullBody\.mode==='defeat'\?/);
 assert.match(model,/planImportedDeathSourceStep\(originalStep\):planImportedLivingSourceStep\(originalStep\)/);
 assert.match(model,/actor\.mixer\.update\(sourceStep\)/);
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
 assert.ok(model.includes('const sourceEntry=planImportedOneShotEntry({'),
  'a new legal action must match the original source pose age');
 assert.ok(model.includes('if(sourceEntry!==null)next.time=sourceEntry;'),
  'only source action transitions can align the first imported pose');
 assert.match(model,/actor\.fullBody\?\.owner\.warning/,'Warden warnings must release joint ownership on damage and evasion');
 assert.ok(server.includes("['/dungeon/full-body-animation-controller.js','full-body-animation-controller.js']"));
 // Comment names do not imply imported simulation authority dependencies.
 const executable=code.replace(/\/\*[\s\S]*?\*\//g,'');
 assert.doesNotMatch(executable,/Math\.random|Date\.now|DungeonRuntime|fetch\(|performance\.now/);
});

test('authentic Death_A completes across three bounded native frames under true render stalls',async()=>{
 const {planImportedDeathSourceStep:advance}=await load();
 const duration=.792;
 assert.equal(Math.ceil(duration/.05),16,'former source mixer stretches death to 16 rendered frames');
 let sourceTime=0,frames=0;const observed=[0];
 while(sourceTime<duration-1e-9&&frames<20){
  const dt=advance({mode:'defeat',sourceTime,sourceDuration:duration,
   effectiveSpeed:1,frameDelta:.05,frameInterval:2,visible:true});
  assert.ok(dt>=0&&dt<=.28);
  sourceTime=Math.min(duration,sourceTime+dt);observed.push(sourceTime);frames++;
 }
 assert.equal(frames,3);assert.ok(Math.abs(sourceTime-duration)<1e-9);
 assert.ok(observed[1]>0&&observed[1]<observed[2]&&observed[2]<duration);
 assert.equal(advance({mode:'defeat',sourceTime:.45,sourceDuration:duration,
  frameDelta:.016,frameInterval:.016}),.016);
 assert.equal(advance({mode:'defeat',sourceTime:duration,sourceDuration:duration,
  frameDelta:.05,frameInterval:2}),0);
 for(const mode of ['idle','move','guard','attack','cast','hurt','evade'])
  assert.equal(advance({mode,sourceTime:0,sourceDuration:duration,
   frameDelta:.05,frameInterval:2}),.05);
 for(const invalid of [{visible:false},{reducedMotion:true},{sourceTime:-1},
  {frameInterval:-1},{sourceDuration:NaN},{effectiveSpeed:0}])
  assert.equal(advance({mode:'defeat',sourceTime:0,sourceDuration:duration,
   frameDelta:.05,frameInterval:2,...invalid}),.05);
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.ok(app.includes('updateActor(a,dt,since,reduced,frameInterval,!document.hidden)'));
 assert.ok(model.includes('planImportedDeathSourceStep(originalStep)'),
  'terminal source uses the same bounded original-frame descriptor');
 assert.ok(model.includes('frameDelta:dt,frameInterval:sourceFrameInterval'));
});

test('licensed GLB clip recovers source time lost to slow frames, with bounded hand/sole correction',async()=>{
 const {planImportedOneShotPhase:plan}=await load();
 const lag=plan({mode:'attack',actionTick:40,age:.35,sourceTime:.03,
  sourceDuration:.9,effectiveSpeed:1.45,frameDelta:.05});
 assert.equal(lag.valid,true);assert.equal(lag.align,true);
 assert.ok(lag.startTime>.03&&lag.startTime-.03<=.125*1.45+1e-9);
 assert.ok(Math.abs(lag.remainingSeconds)<Math.abs(lag.driftSeconds));
 const inPhase=plan({mode:'attack',actionTick:40,age:.26,sourceTime:.245,
  sourceDuration:.95,effectiveSpeed:1,frameDelta:.016});
 assert.equal(inPhase.align,false);
 const ahead=plan({mode:'cast',actionTick:41,age:.14,sourceTime:.37,
  sourceDuration:1,effectiveSpeed:1,frameDelta:.016});
 assert.equal(ahead.align,false,'unbroken original clip cannot be scrubbed backwards');
 assert.equal(ahead.startTime,.37);
 assert.ok(ahead.remainingSeconds<0,'ahead phase remains measurable in pure diagnostics');
 const recovery=plan({mode:'attack',actionTick:70,age:.5,sourceTime:.21,
  sourceDuration:.9,effectiveSpeed:1.4,frameDelta:.05});
 assert.ok(recovery.align&&recovery.startTime>.21);
});
test('genuine imported one-shot mixer clock stays monotonic when source is ahead of its visual owner',async()=>{
 const {planImportedOneShotPhase:plan}=await load();
 let checked=0;
 for(const mode of ['attack','cast','hurt'])for(const speed of [1,1.35,1.68])
  for(const ahead of [.03,.09,.18,.30]){
   const age=.12,sourceTime=age*speed+ahead,step=.016;
   const result=plan({mode,actionTick:9,age,sourceTime,
    sourceDuration:1.042,effectiveSpeed:speed,frameDelta:step});
   assert.equal(result.valid,true);
   assert.equal(result.align,false,'only forward source corrections may seek');
   assert.ok(result.startTime>=sourceTime-1e-9,
    mode+' source-time rewind at speed '+speed+' ahead '+ahead);
   assert.ok(Math.min(1.042,result.startTime+step*speed)>=sourceTime-1e-9);
   checked++;
  }
 assert.equal(checked,36);
 let sourceTime=.37,age=.14;
 for(let frameIndex=0;frameIndex<7;frameIndex++){
  const planned=plan({mode:'cast',actionTick:41,age,sourceTime,
   sourceDuration:1,effectiveSpeed:1,frameDelta:.016});
  const next=Math.min(1,planned.startTime+.016);
  assert.ok(next>=sourceTime-1e-9,'cast source clip must not reverse at frame '+frameIndex);
  sourceTime=next;age+=.016;
 }
});

test('clock correction cannot alter dead/idle/evasion/unknown or reduced-motion import clips',async()=>{
 const {planImportedOneShotPhase:plan}=await load();
 const base={mode:'attack',actionTick:55,age:.2,sourceTime:.02,
  sourceDuration:.8,effectiveSpeed:1.4,frameDelta:.05};
 for(const item of [{mode:'idle'},{mode:'move'},{mode:'evade'},{mode:'defeat'},
  {actionTick:null},{age:NaN},{sourceDuration:0},
  {sourceTime:Infinity},{reducedMotion:true}]){
  assert.equal(plan({...base,...item}).align,false,JSON.stringify(item));
 }
 for(let age=0;age<.65;age+=.05){
  const result=plan({...base,mode:'cast',age,sourceTime:Math.min(age*.6,.8)});
  assert.ok(result.valid&&result.startTime>=0&&result.startTime<.8);
  assert.ok(Number.isFinite(result.remainingSeconds));
 }
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.ok(model.includes('planImportedOneShotPhase({'));
 assert.ok(model.includes('actor.activeClip.time=sourceSync.startTime'));
 assert.ok(model.includes('actor.mixer.update(sourceStep)'));
 assert.ok(model.includes('fullBodySourceClockCorrectedFrames:'));
 assert.match(model,/next\.crossFadeFrom\(previous,[^\n]+,false\)/);
});


test('actual licensed Ranger chooses original native ranged release, not horizontal sword swing',async()=>{
 const {chooseImportedSourceClip:pick}=await load();
 // All six pinned CC0 source GLBs contain these original names (41 joints, 123 tracks per clip).
 const clips=['1H_Melee_Attack_Slice_Horizontal','2H_Ranged_Shoot','Death_A',
  'Hit_A','Idle','Spellcast_Shoot','Walking_A'].map(name=>({name,duration:1.042}));
 assert.equal(pick(clips,'attack','ranger')?.name,'2H_Ranged_Shoot');
 for(const kind of ['vanguard','revenant','warden'])
  assert.equal(pick(clips,'attack',kind)?.name,'1H_Melee_Attack_Slice_Horizontal');
 for(const kind of ['mystic','cultist'])
  assert.equal(pick(clips,'cast',kind)?.name,'Spellcast_Shoot');
 assert.equal(pick(clips,'move','ranger')?.name,'Walking_A');
 assert.equal(pick(clips,'hurt','ranger')?.name,'Hit_A');
 assert.equal(pick(clips,'idle','ranger')?.name,'Idle');
 assert.equal(pick(clips.filter(c=>c.name!=='2H_Ranged_Shoot'),'attack','ranger')?.name,
  '1H_Melee_Attack_Slice_Horizontal','missing optional clip preserves explicit old fallback');
 assert.equal(pick(null,'attack','ranger'),null);
 assert.equal(pick([],'attack','ranger'),null);
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(model,/chooseImportedSourceClip\(actor\.availableClips,action,actor\.u\.kind\)/);
 assert.match(model,/sourceClipBindings:/);
});

test('late-witnessed licensed one-shots begin at the genuine full-body age',async()=>{
 const {planImportedOneShotEntry:enter}=await load();
 const samples=[['vanguard-contact','attack',.215,1.042,1.6806],
  ['ranger-bow-release','attack',.31,1.042,1.6806],
  ['mystic-cast-recovery','cast',.40,.917,1.4328],
  ['actual-HP-loss-hurt','hurt',.15,.667,1.7553]];
 for(const [name,mode,age,sourceDuration,effectiveSpeed] of samples){
  const start=enter({mode,age,sourceDuration,effectiveSpeed,legalTransition:true});
  assert.ok(Math.abs(start-age*effectiveSpeed)<1e-7,name+' must not fake a new windup');
 }
 assert.equal(enter({mode:'attack',age:0,sourceDuration:1.042,effectiveSpeed:1.6806,
  legalTransition:true}),0,'a fresh legal tick begins with native anticipation');
 assert.equal(enter({mode:'cast',age:.63,sourceDuration:.21,effectiveSpeed:1.45,
  legalTransition:true}),.208,'never seek beyond the original clip keyframes');
});
test('ongoing clips, stale events, defeat and reduced motion cannot phase-seek on entry',async()=>{
 const {planImportedOneShotEntry:enter}=await load();
 const base={mode:'attack',age:.215,sourceDuration:1.042,
  effectiveSpeed:1.6806,legalTransition:true};
 for(const changes of [{legalTransition:false},{reducedMotion:true},{mode:'defeat'},
  {mode:'move'},{mode:'evade'},{mode:'idle'},{age:-1},{age:NaN},
  {age:.70},{sourceDuration:0},{sourceDuration:NaN},
  {effectiveSpeed:0},{effectiveSpeed:Infinity}]){
  assert.equal(enter({...base,...changes}),null,JSON.stringify(changes));
 }
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.ok(model.includes('legalTransition:Boolean(newEvent||actor.currentAction!==action)'));
 assert.ok(model.includes('age:actor.fullBody?.mode===action?actor.fullBody.age:NaN'));
 assert.ok(model.includes('reducedMotion:Boolean(actor.fullBody?.reducedMotion)'));
});

test('genuine slow visible frames advance the SAME authentic attack/cast event clock without false strikes',async()=>{
 const {planFullBodyVisibleFrameStep:visibleStep,
  planImportedLivingSourceStep:sourceStep,advanceFullBodyController:step}=await load();
 assert.equal(Math.ceil(.62/.05),13,'reproduce the previous thirteen-frame sword');
 assert.equal(visibleStep({mode:'attack',frameDelta:.05,frameInterval:1}),.28);
 assert.equal(visibleStep({mode:'cast',frameDelta:.05,frameInterval:1}),.28);
 assert.equal(visibleStep({mode:'attack',frameDelta:.016,frameInterval:.016}),.016);
 for(const mode of ['idle','move','guard','hurt','evade','defeat'])
  assert.equal(visibleStep({mode,frameDelta:.05,frameInterval:1}),.05,
   'no unrelated source motion may accelerate');
 for(const flags of [{visible:false},{reducedMotion:true},{frameInterval:-1},
  {frameInterval:NaN}])
  assert.equal(visibleStep({mode:'attack',frameDelta:.05,frameInterval:1,...flags}),.05);
 const started=step(null,frame(hero('attack',98),{actionAge:.16}));
 const held=step(started,frame(hero('idle',99),{
  frameDelta:.05,frameInterval:1,visible:true,actionAge:0}));
 assert.equal(held.mode,'attack');assert.equal(held.actionTick,98);
 assert.ok(Math.abs(held.age-.44)<1e-9,
  'native hips/shoulders and imported source must share the original recovered age');
 assert.ok(Math.abs(step(started,frame(hero('idle',99),{
  frameDelta:.05,frameInterval:1,visible:false})).age-.21)<1e-9);
 const sample={mode:'attack',age:0,sourceTime:0,sourceDuration:1.042,
  effectiveSpeed:1.68,frameDelta:.05,frameInterval:1};
 assert.equal(sourceStep(sample),.05,'first legal imported pose retains anticipation');
 const next=sourceStep({...sample,age:.28,sourceTime:.084});
 assert.ok(Math.abs(next-.23)<1e-9,
  'subsequent samples must reach the owning body phase without 50ms extra lead');
 for(const params of [{mode:'idle',age:.45},{mode:'hurt',age:.45},
  {visible:false,age:.45},{reducedMotion:true,age:.45},{sourceDuration:0,age:.45},
  {sourceTime:NaN,age:.45},{age:-1},{frameInterval:-1}])
  assert.equal(sourceStep({...sample,...params}),.05);
 // The imported source is ALREADY ~198ms ahead of the lawful body's
 // witnessed age. A new 50ms mixer step would make the visible weapon and
 // wrist drift even further ahead of their event owner. Freeze until the
 // original event catches up; never rewind the source or invent a new hit.
 assert.equal(sourceStep({...sample,age:.1,sourceTime:.5}),0,
  'ahead-of-owner source must hold rather than advance or reverse');
 assert.equal(sourceStep({...sample,age:.1,sourceTime:.5,
  frameDelta:.016,frameInterval:.016}),0,
  'the same source-age clamp applies at ordinary desktop/mobile frame rates');
 const witnessCatchesUp=sourceStep({...sample,age:.4,sourceTime:.5});
 assert.ok(Math.abs(witnessCatchesUp-(.4-.5/1.68))<1e-9,
  'after the lawful event catches up, advance only as far as its observed age');
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 assert.match(model,/planImportedLivingSourceStep\(originalStep\)/);
 assert.match(model,/frameInterval:sourceFrameInterval,visible:sourceFrameVisible/);
 assert.match(app,/advanceFullBodyVisibleActionAge\(since,\{[\s\S]*?mode:a\.u\.action/);
 assert.match(model,/actor\.mixer\.update\(sourceStep\)/);
});

test('actor action age must not double-clamp its witnessed 280ms native-rig step',async()=>{
 const {advanceFullBodyVisibleActionAge:advanceAge,
  planFullBodyVisibleFrameStep:visibleStep}=await load();
 const close=(got,want,message)=>assert.ok(Number.isFinite(got)&&
  Math.abs(got-want)<1e-9,message||('expected '+want+', got '+got));
 const slow={mode:'attack',frameDelta:.05,frameInterval:1,visible:true};
 close(visibleStep(slow),.28);
 close(advanceAge(0,slow),.28,'licensed attack must progress past 50ms');
 close(advanceAge(.28,slow),.56);
 close(advanceAge(.56,slow),.84,'620ms recovery must complete in four rendered samples');
 close(advanceAge(.3,{...slow,mode:'cast'}),.58);
 close(advanceAge(.4,{...slow,mode:'hurt'}),.45,'real HP-loss hurt clock unchanged');
 close(advanceAge(.1,{...slow,mode:'guard'}),.15);
 close(advanceAge(.1,{...slow,visible:false}),.15);
 close(advanceAge(.1,{...slow,reducedMotion:true}),.15);
 close(advanceAge(.1,{...slow,frameInterval:-1}),.15);
 close(advanceAge(.1,{...slow,frameInterval:NaN}),.15);
 close(advanceAge(.1,{...slow,frameDelta:.016,frameInterval:.016}),.116);
 close(advanceAge(4.9,slow),5);
 close(advanceAge(NaN,slow),.28);
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 assert.match(app,/a\.visualActionAge=advanceFullBodyVisibleActionAge\(since,\{/);
 assert.doesNotMatch(app,/advancePresentationActionAge\(since,\s*planFullBodyVisibleFrameStep/);
});

test('native Hit_A only samples actually witnessed positive-HP-loss age',async()=>{
 const {advanceFullBodyController:owner,planImportedLivingSourceStep:sourceStep}=await load();
 const wounded=owner(null,frame(hero('idle',345,24),{actionAge:0,frameDelta:.05,
  damageBeat:{id:'hero-1',kind:'vanguard',damage:6,maxHp:30,age:0,eventTick:345,fatal:false}}));
 assert.equal(wounded.mode,'hurt','the source action requires a true HP-loss beat');
 assert.equal(wounded.actionTick,345,'injury belongs to its witnessed event tick');
 const speed=1.2127;
 const sample={mode:wounded.mode,age:wounded.age,sourceTime:0,sourceDuration:.667,
  effectiveSpeed:speed,frameDelta:.05,frameInterval:1,visible:true};
 const close=(actual,expected,message)=>assert.ok(Number.isFinite(actual)&&
  Math.abs(actual-expected)<1e-9,message+' (expected '+expected+', got '+actual+')');
 // RED on the previous controller: the imported Hit_A advanced 50ms on the
 // initial zero-age impact and then kept outrunning the owned torso/weapon.
 close(sourceStep(sample),0,'no future source pose at witnessed impact age zero');
 close(sourceStep({...sample,age:.04}),.04,'source may advance to a later witnessed age');
 close(sourceStep({...sample,age:.04,sourceTime:.04*speed}),0,
  'an already-aligned source clip must not skip one extra injury frame');
 close(sourceStep({...sample,age:.04,sourceTime:.12*speed}),0,
  'an ahead source clip must never be rewound or advanced again');
 close(sourceStep({...sample,age:.28,sourceTime:.05*speed}),.05,
  'late injury catch-up remains within the original 50ms visual frame budget');
 close(sourceStep({...sample,reducedMotion:true}),.05,
  'reduced-motion playback retains its existing conservative source policy');
 close(sourceStep({...sample,visible:false}),.05,
  'hidden-scene mixer timing retains its established policy');
 close(sourceStep({...sample,mode:'idle'}),.05,'unrelated idle behavior is unchanged');
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(model,/planImportedLivingSourceStep\(originalStep\)/,
  'actual imported Three.js mixer consumes this hurt source-time planner');
});

test('the authentic GLB hand/sole clock cannot outrun its owned full-body stroke on sparse frames',async()=>{
 const {planImportedLivingSourceStep:step,planImportedOneShotPhase:phase}=await load();
 const speed=1.68,duration=1.042;
 const slow={mode:'attack',sourceDuration:duration,effectiveSpeed:speed,
  frameDelta:.05,frameInterval:1,visible:true};
 const close=(actual,expected,why)=>assert.ok(Math.abs(actual-expected)<1e-9,
  why+': expected '+expected+', got '+actual);
 // RED on previous implementation: second frame was .28s, placing the
 // licensed source blade 50ms ahead of native hips/shoulders.
 let played=0;
 const first=step({...slow,age:0,sourceTime:0});
 close(first,.05,'fresh legal event preserves the original anticipatory frame');
 played+=first;
 const second=step({...slow,age:.28,sourceTime:played*speed});
 close(second,.23,'one observed 1s stall cannot add a spare 50ms source lead');
 played+=second;
 close(played,.28,'original source and overlay now own the same action age');
 const third=step({...slow,age:.56,sourceTime:played*speed});
 close(third,.28,'third genuine visible frame advances within source budget');
 played+=third;
 close(played,.56,'original attack stays in phase with owned recovery');
 close(step({...slow,age:.12,sourceTime:.33*speed}),0,
  'an already-ahead licensed clip must not drift farther forward or rewind');
 close(step({...slow,mode:'hurt',age:.28,sourceTime:.05*speed}),.05,
  'true positive-HP-loss hurt timing retains its existing presentation contract');
 close(step({...slow,reducedMotion:true,age:.28,sourceTime:.05*speed}),.05,
  'reduced motion remains on its existing ordinary clock');
 // RED on previous implementation: a 280ms mixer update plus a 125ms
 // forward phase seek skipped 405ms of authentic source keyframes.
 const overdue=phase({mode:'attack',actionTick:17,age:.58,sourceTime:.03,
  sourceDuration:duration,effectiveSpeed:speed,frameDelta:.28});
 assert.equal(overdue.valid,true);
 assert.equal(overdue.align,false,'no budget remains for a second forward seek');
 close(overdue.startTime,.03,'full mixer step must not acquire another source jump');
 const modest=phase({mode:'attack',actionTick:17,age:.58,sourceTime:.03,
  sourceDuration:duration,effectiveSpeed:speed,frameDelta:.05});
 assert.equal(modest.align,true,'smaller mixer steps may correct genuine source lag');
 assert.ok((modest.startTime-.03)/speed+.05<=.28+1e-9,
  'source seek plus mixer update never exceed 280ms of original playback');
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(model,/planImportedLivingSourceStep\(originalStep\)/);
 assert.match(model,/actor\.activeClip\.time=sourceSync\.startTime/);
 assert.match(model,/actor\.mixer\.update\(sourceStep\)/);
 assert.match(app,/updateActor\(a,dt,since,reduced,frameInterval,!document\.hidden\)/);
});

test('actual visual teleport releases old sword recovery and imported contact pose ownership',async()=>{
 const {advanceFullBodyController:step}=await load();
 const witnessed=step(null,frame({...hero('attack',71),targetId:'revenant-2'},{
  actionAge:.215,combatFacing:{targetId:'revenant-2',distance:1,yaw:0}
 }));
 assert.equal(witnessed.mode,'attack');
 assert.equal(witnessed.confirmedContact?.targetId,'revenant-2');
 const nextIdle=hero('idle',72);
 const normal=step(witnessed,frame(nextIdle,{actionAge:0,frameDelta:.05,
  grounded:{moving:false,clipAction:'idle'},teleport:false}));
 assert.equal(normal.mode,'attack','an ordinary idle tick still permits recovery');
 const movedToFloor=step(witnessed,frame(nextIdle,{actionAge:0,frameDelta:.05,
  grounded:{moving:false,clipAction:'idle'},teleport:true}));
 assert.equal(movedToFloor.mode,'idle','a genuine source-root teleport ends old one-shot ownership');
 assert.equal(movedToFloor.holding,false);
 assert.equal(movedToFloor.confirmedContact,null,'previous floor target may not remain visually attached');
 assert.equal(movedToFloor.actionTick,72,'source action tick must belong to the new floor');
 assert.equal(movedToFloor.owner.duel,false);
 const noFakeStride=step(null,frame(hero('move',73),{
  grounded:{moving:true,clipAction:'move'},teleport:true}));
 assert.equal(noFakeStride.mode,'idle','teleport is not travelled locomotion');
 const later=step(movedToFloor,frame(nextIdle,{actionAge:0,teleport:false}));
 assert.equal(later.mode,'idle','an interrupted source attack cannot reappear after arrival');
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(model,/teleport:Boolean\(actor\.locomotionTeleport\)/,
  'controller consumes actual planExpeditionStep visual teleport, never synthetic grid movement');
});

test('teleported source rig cannot resurrect an old attack/cast on the next landed render frame',async()=>{
 const {advanceFullBodyController:step}=await load();
 for(const action of ['attack','cast']){
  const original=hero(action,71),began=step(null,frame(original,{actionAge:.215}));
  assert.equal(began.mode,action);
  const snapped=step(began,frame(original,{
   actionAge:.31,teleport:true,grounded:{moving:false,clipAction:'idle'}
  }));
  assert.equal(snapped.mode,'idle','relocation cannot carry same-tick source one-shot');
  assert.equal(snapped.owner.duel,false);assert.equal(snapped.owner.cast,false);
  assert.equal(snapped.confirmedContact,null);
  assert.equal(snapped.teleportSuppressedTick,71);
  const landed=step(snapped,frame(original,{actionAge:.38,teleport:false}));
  assert.equal(landed.mode,'idle','landing must not resurrect the old action');
  const newAction=step(landed,frame(hero(action,72),{actionAge:.03}));
  assert.equal(newAction.mode,action,'new lawful source tick starts normally');
  assert.equal(newAction.teleportSuppressedTick,null);
  assert.equal(newAction.actionTick,72);
 }
});
test('teleport tick quarantine retains genuine injury and death and leaves ordinary strikes unchanged',async()=>{
 const {advanceFullBodyController:step}=await load();
 const original=hero('attack',81),began=step(null,frame(original,{actionAge:.21}));
 assert.equal(step(began,frame(original,{actionAge:.25})).mode,'attack');
 const damage={id:'hero-1',kind:'vanguard',damage:5,maxHp:30,age:.12,fatal:false};
 const injured=step(began,frame(hero('attack',81,25),{teleport:true,damageBeat:damage}));
 assert.equal(injured.mode,'hurt','witnessed HP loss retains priority');
 const dead=step(began,frame(hero('attack',81,0),{teleport:true}));
 assert.equal(dead.mode,'defeat','source death retains priority');
 const fresh=step(null,frame(hero('attack',82),{actionAge:.03}));
 assert.equal(fresh.mode,'attack','fresh characters are not quarantined');
});


test('original Walking_A source cadence follows actual 60Hz and sparse-frame displacement',async()=>{
 const {planImportedLivingSourceStep:sourceStep}=await load();
 const sample={mode:'move',age:0,sourceTime:0,sourceDuration:1.0416666666666667,
  effectiveSpeed:.8,frameDelta:.05,frameInterval:1,visible:true,
  groundedTravel:.53,groundedMoving:true,walkingClip:true,teleport:false};
 assert.equal(sourceStep(sample),.28,
  'real 0.53m displacement must advance licensed walking beyond a 50ms freeze');
 const gentle=sourceStep({...sample,groundedTravel:.08,effectiveSpeed:1});
 assert.ok(Math.abs(gentle-(.08/1.06)*sample.sourceDuration)<1e-9,
  'source gait time must correspond to witnessed root travel');
 // The old source used only 16ms at normal refresh even when the same
 // authoritative rendered root travelled 0.05m in the frame (requiring
 // about 39.3ms of licensed Walking_A time at source speed 1.25).
 const normal={...sample,sourceTime:.25,frameDelta:.016,
  frameInterval:.016,effectiveSpeed:1.25};
 for(const meters of [.004,.016,.05,.12]){
  const actual=sourceStep({...normal,groundedTravel:meters});
  const wanted=Math.min(.28,meters/1.06*normal.sourceDuration/normal.effectiveSpeed);
  assert.ok(Math.abs(actual-wanted)<1e-9,
   'real 60Hz root travel '+meters+'m must determine imported gait phase');
  assert.ok(actual>=0&&actual<=.28,'native mixer time remains bounded');
 }
 // This was RED on the exact predecessor: with a real move owner but 0m
 // measured travel, the native source feet advanced by 16ms/50ms while
 // the ground stamp and supported hips remained planted. Tiny movement also
 // fell through to an unrelated wall-clock stride, breaking cadence.
 for(const meters of [0,.0005,.002,.003]){
  const actual=sourceStep({...normal,groundedTravel:meters});
  const expected=meters/1.06*normal.sourceDuration/normal.effectiveSpeed;
  assert.ok(Math.abs(actual-expected)<1e-9,
   'original feet may move only as far as the real root moved: '+meters+'m');
 }
 // Several parked WebGL frames must not wind the source clip in place.
 let parkedSourceTime=.2;
 for(let frame=0;frame<9;frame++){
  const step=sourceStep({...normal,sourceTime:parkedSourceTime,
   groundedTravel:0});
  assert.equal(step,0,'genuine held root cannot produce treadmill Walking_A');
  parkedSourceTime+=step*normal.effectiveSpeed;
 }
 assert.equal(parkedSourceTime,.2);
 const resumed=sourceStep({...normal,sourceTime:parkedSourceTime,
  groundedTravel:.042});
 assert.ok(Math.abs(resumed-(.042/1.06)*normal.sourceDuration/normal.effectiveSpeed)<1e-9,
  'first genuine displacement resumes the native source without a restart');
 assert.equal(sourceStep({...sample,groundedTravel:0}),0,
  'same physically planted source clock holds through sparse frame delivery');
 for(const [label,changed] of [
  ['impossible jump',{groundedTravel:.8}],['teleport',{teleport:true}],
  ['not imported walking',{walkingClip:false}],['not real travel',{groundedMoving:false}],
  ['hidden',{visible:false}],['reduced motion',{reducedMotion:true}],
  ['invalid source clock',{sourceTime:NaN}],['invalid GLB duration',{sourceDuration:0}],
  ['not locomotion',{mode:'idle'}]
 ])assert.equal(sourceStep({...sample,...changed}),.05,label);
 assert.ok(Math.abs(sourceStep({...sample,mode:'attack',age:.28,sourceTime:.084,
  effectiveSpeed:1.68})-.23)<1e-9,'original attack/recovery timing unchanged');
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(model,/groundedTravel:actor\.root&&actor\.rigGaitPosition/);
 assert.match(model,/groundedMoving:Boolean\(actor\.fullBody\?\.owner\.locomotion/);
 assert.match(model,/walkingClip:\/\(\?:walk\|run\|move\)\/i\.test/);
 assert.match(model,/actor\.mixer\.update\(sourceStep\)/);
});


test('licensed Walking_A crossfades run on visible seconds while native feet follow real metres',async()=>{
 const {planImportedLivingSourceStep,planImportedWalkingBlendRate}=await load();
 const base={mode:'move',age:0,sourceTime:.18,sourceDuration:1.0416666666666667,
  effectiveSpeed:.91,frameDelta:.016,frameInterval:.016,visible:true,
  groundedTravel:.05,groundedMoving:true,walkingClip:true,teleport:false};
 for(const [dt,travel] of [[.016,.004],[.016,.05],[.05,.53]]){
  const frame={...base,frameDelta:dt,frameInterval:dt,groundedTravel:travel};
  const distanceStep=planImportedLivingSourceStep(frame);
  const rate=planImportedWalkingBlendRate({...frame,sourceStep:distanceStep});
  assert.ok(Number.isFinite(rate)&&rate>=0,'licensed walking has a safe temporary scale');
  assert.ok(Math.abs(dt*rate-distanceStep)<1e-9,
   'native source feet advance by the prior exact distance-calibrated clock');
  assert.ok(Math.abs(dt*base.effectiveSpeed*rate-
   distanceStep*base.effectiveSpeed)<1e-9,
   'the original GLB timeScale and sole cadence remain equivalent');
 }
 const creeping={...base,groundedTravel:.004};
 const slowStep=planImportedLivingSourceStep(creeping);
 assert.ok(slowStep<creeping.frameDelta/3,'old source-distance mixer retards crossfades');
 let elapsed=0,oldBlendElapsed=0,newSourceElapsed=0;
 for(let i=0;i<15;i++){
  const rate=planImportedWalkingBlendRate({...creeping,sourceStep:slowStep});
  elapsed+=creeping.frameDelta;
  oldBlendElapsed+=slowStep;
  newSourceElapsed+=creeping.frameDelta*rate;
 }
 assert.ok(elapsed>=.23&&oldBlendElapsed<.07,
  'a 230ms idle-to-walk blend finishes on screen rather than after metres');
 assert.ok(Math.abs(newSourceElapsed-oldBlendElapsed)<1e-9,
  'the corrected blend NEVER invents additional source foot-cycle motion');
 const catchup={...base,frameDelta:.05,frameInterval:.5,groundedTravel:.53};
 const catchupSource=planImportedLivingSourceStep(catchup);
 assert.equal(catchupSource,.28,'large legitimate source travel remains capped');
 assert.ok(planImportedWalkingBlendRate({...catchup,sourceStep:catchupSource})>5,
  'source feet may catch up without instantly consuming a 230ms fade');
 for(const [label,patch] of [
  ['idle',{mode:'idle'}],['attack',{mode:'attack'}],['death',{mode:'defeat'}],
  ['missing licensed walk',{walkingClip:false}],
  ['no witnessed travel',{groundedMoving:false}],
  ['teleport',{teleport:true}],['reduced motion',{reducedMotion:true}],
  ['invisible',{visible:false}],['zero visible frame',{frameDelta:0}],
  ['unbounded jump',{groundedTravel:.8}],['bad clip',{sourceDuration:0}],
  ['invalid clock',{sourceTime:NaN}],['bad scale',{effectiveSpeed:0}]
 ]){
  const changed={...base,...patch};
  assert.equal(planImportedWalkingBlendRate({...changed,
   sourceStep:planImportedLivingSourceStep(changed)}),null,label);
 }
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(model,/planImportedWalkingBlendRate\(\{\.\.\.originalStep,sourceStep\}\)/);
 assert.match(model,/actor\.activeClip\.setEffectiveTimeScale\(normalScale\*walkingBlendRate\)/);
 assert.match(model,/actor\.mixer\.update\(Math\.min\(\.05,dt\)\)/);
 assert.match(model,/finally\{actor\.activeClip\.setEffectiveTimeScale\(normalScale\);\}/);
});

test('actual browser witness contract rejects a real HP-loss-overlapped attack tick',()=>{
 const {isUninterruptedMeleeWitness,isUninjuredIdleRecovery}=require('../browser/dungeon-animation-witness.cjs');
 // Exact-head Playwright trace run 42604195673: revenant enemy-1-2 lost
 // 12 HP on tick 24 while public action said attack. Hit_A owns that beat.
 const prior={id:'enemy-1-2',kind:'revenant',hp:21,action:'hurt',actionTick:23};
 const striking={...prior,hp:9,action:'attack',actionTick:24,targetId:'mystic'};
 const face={targetId:'mystic',distance:1,yaw:1.1};
 assert.equal(isUninterruptedMeleeWitness({units:[prior]},{units:[striking]},striking,face),false);
 const cleanPrior={...prior,action:'idle'},cleanAttack={...striking,hp:21};
 const attackState={run:1,floor:1,tick:24,units:[cleanAttack]};
 const idleState={run:1,floor:1,tick:25,units:[{...cleanAttack,action:'idle',actionTick:25}]};
 assert.equal(isUninterruptedMeleeWitness({units:[cleanPrior]},attackState,cleanAttack,face),true);
 assert.equal(isUninterruptedMeleeWitness({units:[cleanPrior]},attackState,cleanAttack,
  {...face,targetId:'warden-1'}),false,'must be SAME actual adjacent target');
 assert.equal(isUninjuredIdleRecovery(attackState,idleState,cleanAttack.id),true);
 assert.equal(isUninjuredIdleRecovery(attackState,{...idleState,floor:2},cleanAttack.id),false);
 assert.equal(isUninjuredIdleRecovery(attackState,{...idleState,units:[{...cleanAttack,
  action:'hurt',hp:9,actionTick:25}]},cleanAttack.id),false);
});


test('exact native Ranger frame witness cannot turn a later idle or another actor into release proof',()=>{
 const {isExactNativeClipWitness,isUninterruptedRangedWitness}=require('../browser/dungeon-animation-witness.cjs');
 const expected={id:'ranger',kind:'ranger',action:'attack',sourceTick:41,clipName:'2H_Ranged_Shoot'};
 const actor={id:'ranger',kind:'ranger',sourceMeshCount:8,sourceHandName:'handr'};
 const rig={actors:[actor],summary:{invalidMatrixCount:0,invalidQuaternionCount:0,
  disconnectedSegments:0,bindReferenceComplete:true}};
 const frame={binding:{...expected},actor,rig};
 assert.equal(isExactNativeClipWitness(frame,expected),true);
 for(const [name,patch] of [
  ['idle', {binding:{...expected,action:'idle',clipName:'Idle'}}],
  ['stale tick',{binding:{...expected,sourceTick:40}}],
  ['wrong actor',{binding:{...expected,id:'other'}}],
  ['missing original grip',{actor:{...actor,sourceHandName:null}}],
  ['broken skin',{rig:{...rig,summary:{...rig.summary,invalidMatrixCount:1}}}],
  ['unbound skin',{rig:{...rig,summary:{...rig.summary,bindReferenceComplete:false}}}]
 ])assert.equal(isExactNativeClipWitness({...frame,...patch},expected),false,name);
 const previous={id:'ranger',kind:'ranger',action:'idle',hp:32,actionTick:40};
 const released={...previous,action:'attack',actionTick:41};
 const before={units:[previous]},after={units:[released]};
 assert.equal(isUninterruptedRangedWitness(before,after,released),true);
 assert.equal(isUninterruptedRangedWitness(before,{units:[{...released,hp:20}]},
  {...released,hp:20}),false,'HP-loss reaction owns source, not arrow release');
 assert.equal(isUninterruptedRangedWitness({units:[{...previous,action:'hurt'}]},
  after,released),false,'carry-over injury cannot be counted as clean release');
});

test('licensed Walking_A re-entry preserves actual alternating foot parity without double-advancing the displayed step',async()=>{
 const {planImportedWalkingEntryPhase:plan}=await load();
 const duration=1.0416666666666667;
 const close=(got,want,why)=>assert.ok(Number.isFinite(got)&&Math.abs(got-want)<1e-8,
  why+': '+got+' expected '+want);
 const base={mode:'move',previousMode:'attack',sourceDuration:duration,
  effectiveSpeed:1.25,frameDelta:.016,frameInterval:.016,visible:true,
   groundedMoving:true,walkingClip:true,teleport:false,reducedMotion:false};
 const odd={...base,footPhase:.5+.05/1.06,groundedTravel:.05};
 const entry=plan(odd);
 close(entry,duration*.5,'odd planted left/right foot persists after a real strike');
 close((entry+.05/1.06*duration)/duration,odd.footPhase,
  'original source ankle phase matches planted native foot after one mixer update');
 close(plan({...base,previousMode:'idle',footPhase:.1,groundedTravel:.106}),0,
  'first source step begins at native source cycle start');
 close(plan({...base,previousMode:'guard',footPhase:0,groundedTravel:.53}),
   duration-.28*base.effectiveSpeed,'true capped half-step wraps the native source phase');
 close(plan({...base,previousMode:'cast',footPhase:.25+.004/1.06,groundedTravel:.004}),
  duration*.25,'a valid tiny movement resumes without fresh clip reset');
 for(const [label,patch] of Object.entries({
  activeWalk:{previousMode:'move'},idle:{mode:'idle'},missingClip:{walkingClip:false},
  stationary:{groundedTravel:0},notMoving:{groundedMoving:false},
  teleport:{teleport:true},reduced:{reducedMotion:true},
   hidden:{visible:false},zeroFrame:{frameInterval:0},badSpeed:{effectiveSpeed:0},
   invalidPhase:{footPhase:NaN},negativePhase:{footPhase:-.1},
  invalidDistance:{groundedTravel:.55},badDuration:{sourceDuration:0}
 })){
  assert.equal(plan({...odd,...patch}),null,label);
 }
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(model,/planImportedWalkingEntryPhase\(\{/);
 assert.match(model,/if\(walkingEntry!==null\)next\.time=walkingEntry/);
 assert.match(model,/groundedMoving:Boolean\(actor\.fullBody\?\.owner\.locomotion&&actor\.groundedPerformance\?\.moving\)/);
});

test('capped native Walking_A re-entry aligns stamped footfall after single mixer step',async()=>{
 const {planImportedLivingSourceStep:step,planImportedWalkingEntryPhase:entry}=await load();
 const duration=1.0416666666666667,speed=1.25,travel=.53,phase=.74;
 const options={mode:'move',previousMode:'guard',sourceDuration:duration,
  effectiveSpeed:speed,frameDelta:.05,frameInterval:.5,visible:true,
  footPhase:phase,groundedTravel:travel,groundedMoving:true,
  walkingClip:true,teleport:false,reducedMotion:false};
 const applied=step({...options,sourceTime:0});
 assert.equal(applied,.28,'original source step is bounded on sparse rendered frames');
 const initial=entry(options);
 assert.ok(Number.isFinite(initial),'legal native source re-entry must be finite');
 assert.ok(Math.abs(((initial+applied*speed)/duration)%1-phase)<1e-8,
  'native source ankles must meet genuine stamped footfall phase after capped mixer update');
 for(const patch of [{visible:false},{frameInterval:0},{frameDelta:0},
  {effectiveSpeed:0},{effectiveSpeed:NaN}]){
  assert.equal(entry({...options,...patch}),null,'untrusted source clock cannot seek');
 }
});

test('real large walking steps cannot leave original source ankles permanently behind witnessed footfall parity',async()=>{
 const {planImportedLivingSourceStep:step,planImportedWalkingContinuity:align}=await load();
 const duration=1.0416666666666667,speed=1.25;
 const base={mode:'move',continuous:true,sourceTime:duration*.24,sourceDuration:duration,
  effectiveSpeed:speed,frameDelta:.05,frameInterval:.5,visible:true,
  groundedTravel:.53,footPhase:.74,groundedMoving:true,walkingClip:true,
  teleport:false,reducedMotion:false};
 const consumed=step(base);
 assert.equal(consumed,.28,'a genuine sparse-frame .53m move retains its 280ms source playback cap');
 const uncaught=((base.sourceTime+consumed*speed)/duration)%1;
 assert.ok(Math.abs(uncaught-.576)<1e-8,
  'RED predecessor: ongoing Walking_A lags grounded ankle phase by .164 cycle');
 const entry=align({...base,sourceStep:consumed});
 assert.ok(Number.isFinite(entry)&&entry>=0&&entry<duration,
  'licensed source keyframe alignment must be finite and in the real clip');
 const final=((entry+consumed*speed)/duration)%1;
 assert.ok(Math.abs(final-base.footPhase)<1e-8,
  'the single same-frame mixer step lands on witnessed left/right foot parity');
 assert.ok(Math.abs(((entry-base.sourceTime)/duration+1)%1-.164)<1e-8,
  'only the 16.4%-cycle capped shortfall is repaired, not a counterfeit footstep');
 // If real root displacement has stopped, no source seek may move planted feet.
 for(const [reason,patch] of Object.entries({
  stopped:{groundedTravel:0},tiny:{groundedTravel:.002},
  idle:{mode:'idle'},newWalk:{continuous:false},
  invalidClip:{walkingClip:false},noAuthorityMove:{groundedMoving:false},
  teleport:{teleport:true},reduced:{reducedMotion:true},hidden:{visible:false},
  badClock:{sourceTime:NaN},badFoot:{footPhase:NaN},outOfRange:{footPhase:1.1},
  unrelatedPhase:{footPhase:.44},badDisplacement:{groundedTravel:.7},
  slowSourceOvershoot:{effectiveSpeed:.8,sourceStep:.28},
  noFrame:{frameInterval:0}
 })){
  assert.equal(align({...base,sourceStep:consumed,...patch}),null,reason+' must not retime any original joint');
 }
 const gentle={...base,sourceTime:duration*.24,groundedTravel:.05,
  footPhase:.24+.05/1.06,frameDelta:.016,frameInterval:.016};
 assert.equal(align({...gentle,sourceStep:step(gentle)}),null,
  'ordinary fully-consumed source motion never scrubs a licensed clip');
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(model,/planImportedWalkingContinuity\(\{\.\.\.originalStep,sourceStep/);
 assert.match(model,/actor\.activeClip\.time=continuousWalk/);
 assert.match(model,/actor\.mixer\.update\(Math\.min\(\.05,dt\)\)/,
  'the original Three.js mixer must still evaluate exactly once per visible frame');
});

test('native sword pelvis-to-wrist overlays track actual original-clip crossfade weight, never snap ahead of the licensed skeleton',async()=>{
 const nativeFile=path.join(root,'public/ai-dungeon/native-duel-performance.js');
 const {planNativeDuelPose:plan}=await import('data:text/javascript;base64,'+
  Buffer.from(fs.readFileSync(nativeFile,'utf8')).toString('base64'));
 const scalars=pose=>[pose.strength,pose.contactWeight,
  ...['head','hips','spine','wrist'].flatMap(k=>['pitch','yaw','roll'].map(a=>pose[k][a])),
  ...['left','right'].flatMap(side=>[pose.arms[side].pitch,pose.arms[side].roll,
   pose.forearms[side],pose.legs[side].upper,pose.legs[side].lower,pose.legs[side].foot]),
  pose.root.x,pose.root.y,pose.root.z];
 for(const kind of ['vanguard','revenant','warden']){
  const args={targetId:'real-adjacent-enemy',distance:1,alive:true,reducedMotion:false};
  const zero=plan(kind,'attack',.2,{...args,sourceBlend:0});
  const half=plan(kind,'attack',.2,{...args,sourceBlend:.5});
  const full=plan(kind,'attack',.2,{...args,sourceBlend:1});
  assert.notEqual(zero.mode,'rest','real attack must keep exclusive pose ownership during fade-in');
  const z=scalars(zero),h=scalars(half),f=scalars(full);
  assert.ok(f.some(n=>Math.abs(n)>.04),'source duel needs a visible connected original performance');
  assert.ok(z.every(n=>n===0),'no pelvis/weapon/sole additive jump before source clip fades in: '+kind);
  for(let i=0;i<h.length;i++)assert.ok(Math.abs(h[i]-f[i]*.5)<.00013,
   kind+' synchronized partial source fade component '+i);
  const invalid=plan(kind,'attack',.2,{...args,sourceBlend:NaN});
  assert.equal(invalid.mode,'rest','invalid source weight must not distort original joints');
  assert.equal(plan(kind,'attack',.2,{...args,sourceBlend:2}).mode,'rest',
   'out-of-range mixer weight must fail closed');
  assert.equal(plan(kind,'attack',.2,{...args,sourceBlend:.5,distance:2}).mode,'rest',
   'the fade cannot invent an adjacent contact');
 }
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(model,/sourceBlend:\s*actor\.activeClip\?\.getEffectiveWeight\?\.\(\)/,
  'actual post-mixer Three.js source action weight must own ALL additive duel joints and root');
});
test('licensed Ranger and caster one-shots have exclusive source-faded full-body shoulder, elbow and spine ownership',async()=>{
 const filename=path.join(root,'public/ai-dungeon/ranged-encounter-plan.js');
 const ranged=await import('data:text/javascript;base64,'+
  Buffer.from(fs.readFileSync(filename,'utf8')).toString('base64'));
 const own=ranged.ownsImportedRangedUpperBody;
 assert.equal(typeof own,'function','a real source-rig release must have explicit upper-body pose ownership');
 const vectors=p=>[p.weight,p.spine.pitch,p.spine.yaw,p.spine.roll,
  ...['left','right'].flatMap(side=>[
   p.shoulders[side].pitch,p.shoulders[side].roll,p.elbows[side]])];
 for(const [kind,action,clipName] of [
  ['ranger','attack','2H_Ranged_Shoot'],
  ['mystic','cast','Spellcast_Shoot'],
  ['cultist','cast','Spellcast_Shoot']
 ]){
  assert.equal(own(kind,action,clipName,0,false),true,
   kind+' must own the additive arm chain from the FIRST zero-weight source fade frame');
  assert.equal(own(kind,action,clipName,.5,false),true);
  assert.equal(own(kind,action,clipName,1,false),true);
  const args=[kind,action,.24,2,'genuine-witnessed-target',false];
  const start=vectors(ranged.planRangedBodyPose(...args,0));
  const mid=vectors(ranged.planRangedBodyPose(...args,.5));
  const full=vectors(ranged.planRangedBodyPose(...args,1));
  assert.ok(full.some(n=>Math.abs(n)>.04),'real original upper-body release should remain visibly articulated');
  assert.ok(start.every(n=>n===0),kind+' must not jump ahead of imported source crossfade');
  for(let i=0;i<full.length;i++)assert.ok(Math.abs(mid[i]-full[i]*.5)<1e-9,
   kind+' unified original source upper-body fade component '+i);
  assert.equal(own(kind,action,'Idle',.5,false),false,'no fake source ownership on fallback Idle');
  assert.equal(own(kind,action,'1H_Melee_Attack_Slice_Horizontal',.5,false),false,
   'a melee clip cannot own the Ranger/caster release');
  assert.equal(own(kind,action,clipName,NaN,false),false,'invalid mixer weight must fail closed');
  assert.equal(own(kind,action,clipName,.5,true),false,'reduced motion must not force native release');
 }
 assert.equal(own('vanguard','attack','2H_Ranged_Shoot',.5,false),false,
  'do not steal Vanguard genuine melee action ownership');
 assert.equal(own('ranger','idle','2H_Ranged_Shoot',.5,false),false,
  'old source clip cannot animate a fresh idle action');
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(model,/ownsImportedRangedUpperBody\(/,
  'native source release must be explicitly recognized in the running renderer');
 assert.match(model,/nativeReleaseOwnsUpperBody\s*\?\s*'idle'/,
  'generic shoulder and elbow gesture channels must relinquish the original release');
 assert.match(model,/planRangedBodyPose\([\s\S]{0,360}getEffectiveWeight\?\.\(\)/,
  'the specialized source release must inherit the live AnimationAction weight');
});

