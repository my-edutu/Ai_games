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
