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
 assert.match(model,/if\(!freezeSource\)changeAction\(actor,actor\.fullBody\.clipAction,actor\.fullBody\.restarted\)/);
 assert.match(model,/const sourceStep=freezeSource\?0:planImportedDeathSourceStep\(/);
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
 assert.doesNotMatch(code,/Math\.random|Date\.now|DungeonRuntime|fetch\(|performance\.now/);
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
 assert.ok(model.includes('planImportedDeathSourceStep({'));
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
 assert.equal(step(started,frame(hero('idle',99),{
  frameDelta:.05,frameInterval:1,visible:false})).age,.21);
 const sample={mode:'attack',age:0,sourceTime:0,sourceDuration:1.042,
  effectiveSpeed:1.68,frameDelta:.05,frameInterval:1};
 assert.equal(sourceStep(sample),.05,'first legal imported pose retains anticipation');
 const next=sourceStep({...sample,age:.28,sourceTime:.084});
 assert.ok(next>.25&&next<=.28,'subsequent actual samples catch up without source snapback');
 for(const params of [{mode:'idle',age:.45},{mode:'hurt',age:.45},
  {visible:false,age:.45},{reducedMotion:true,age:.45},{sourceDuration:0,age:.45},
  {sourceTime:NaN,age:.45},{age:-1},{frameInterval:-1}])
  assert.equal(sourceStep({...sample,...params}),.05);
 assert.equal(sourceStep({...sample,age:.1,sourceTime:.5}),.05,
  'ahead-of-owner source must not scrub backward or leap ahead');
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
 const slow={mode:'attack',frameDelta:.05,frameInterval:1,visible:true};
 assert.equal(visibleStep(slow),.28);
 assert.equal(advanceAge(0,slow),.28,'licensed attack must progress past 50ms per sparse frame');
 assert.equal(advanceAge(.28,slow),.56);
 assert.equal(advanceAge(.56,slow),.84,'620ms attack completes across four samples');
 assert.equal(advanceAge(.3,{...slow,mode:'cast'}),.58);
 assert.equal(advanceAge(.4,{...slow,mode:'hurt'}),.45,'real HP-loss hurt clock unchanged');
 assert.equal(advanceAge(.1,{...slow,mode:'guard'}),.15);
 assert.equal(advanceAge(.1,{...slow,visible:false}),.15);
 assert.equal(advanceAge(.1,{...slow,reducedMotion:true}),.15);
 assert.equal(advanceAge(.1,{...slow,frameInterval:-1}),.15);
 assert.equal(advanceAge(.1,{...slow,frameInterval:NaN}),.15);
 assert.equal(advanceAge(.1,{...slow,frameDelta:.016,frameInterval:.016}),.116);
 assert.equal(advanceAge(4.9,slow),5);
 assert.equal(advanceAge(NaN,slow),.28);
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 assert.match(app,/a\.visualActionAge=advanceFullBodyVisibleActionAge\(since,\{/);
 assert.doesNotMatch(app,/advancePresentationActionAge\(since,\s*planFullBodyVisibleFrameStep/);
});
