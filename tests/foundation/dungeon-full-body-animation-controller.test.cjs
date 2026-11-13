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

test('real 390px original Walking_A calf: accept small but measurable heel-safe source lift with bounded slew',async()=>{
 const {selectOriginalSourceSwingCalfTrial:select,planOriginalSourceSwingCalfAssist:plan}=await load();
 // Actual same-skinned foot and ORIGINAL right lowerleg quaternion probes from
 // exact-head Actions #43106822043, source 390px WebGL, tick 6.
 const toe=-.12500275207315323,heel=.10890351476641291;
 const trials=[
  {signed:-.1,toe:-.12483914592400795,heel:.08837949795005154},
  {signed:.1,toe:-.12315237035111715,heel:.1291225510171269},
  {signed:-.2,toe:-.1226631866022427,heel:.06775556975973375},
  {signed:.2,toe:-.1193064891604116,heel:.14883458477550093}
 ];
 const chosen=select({afterAnkleToeY:toe,afterAnkleHeelY:heel,
  floorTopY:-.02,trials,previousAssistRad:0});
 assert.equal(chosen?.signed,.2,
  'do not throw away the only real 5.70mm safe original-calf toe lift');
 const owner={mode:'move',sourceClipName:'Walking_A',sourceAnatomyVerified:true,
  sourceLegChainVerified:true,sourceWeight:.6521738767623901,ownerLocomotion:true,
  alive:true,visible:true,teleport:false,reducedMotion:false,interrupted:false,
  rootTravel:.04,frameAge:.03,floorTopY:-.02,
  afterAnkleToeY:toe,afterAnkleHeelY:heel,
  ankleLiftMeters:.006226743873754131,
  trialCalfToeY:chosen.toe,trialCalfHeelY:chosen.heel,
  trialAngleRad:chosen.signed,previousAssistRad:0};
 const delta=plan(owner);
 assert.ok(delta>.01&&delta<=.0600001,
  'clip-weighted correction must ramp from real original knee, never snap to 0.2rad');
 assert.equal(plan({...owner,mode:'hurt'}),0);
 assert.equal(plan({...owner,reducedMotion:true}),0);
 assert.equal(plan({...owner,teleport:true}),0);
 assert.equal(plan({...owner,afterAnkleHeelY:-.018}),0);
 assert.equal(plan({...owner,trialCalfToeY:toe+.0035}),0,
  'sub-4mm source trial is too small to support an original knee correction');
 assert.equal(select({afterAnkleToeY:toe,afterAnkleHeelY:heel,floorTopY:-.02,
  trials:[{signed:.2,toe:toe+.0035,heel:.14}]}),null);
 assert.equal(select({afterAnkleToeY:toe,afterAnkleHeelY:heel,floorTopY:-.02,
  trials:[{signed:.2,toe:toe+.006,heel:.01}]}),null,
  'original heel-to-stone collapse still disqualifies any candidate');
});

test('live frame recomposition must retain measured source-shoe calibration, not erase it',async()=>{
 const {composeOriginalSourceGroundedPivotY:compose}=await load();
 assert.equal(typeof compose,'function','native attachment shoe anchor must survive each source animation frame');
 const anchored={accepted:true,offsetY:-.2303,worldOffsetY:-.2303,originalSourceClip:'Idle'};
 assert.ok(Math.abs(compose(0,anchored)+.2303)<1e-9);
 assert.ok(Math.abs(compose(.015,anchored)+.2153)<1e-9,
  'legal locomotion/attack body lift must be composed over original ground anchor');
 assert.ok(Math.abs(compose(0,anchored)+.2303)<1e-9,
  'successive frames cannot compound or forget the original skinned shoe anchor');
 for(const presentation of [-.035,0,.002,.12])
  assert.ok(Math.abs(compose(presentation,anchored)-(presentation-.2303))<1e-9);
 for(const invalid of [null,{}, {accepted:false,offsetY:-.23},
  {accepted:true,offsetY:NaN},{accepted:true,offsetY:Infinity},
  {accepted:true,offsetY:.2},{accepted:true,offsetY:-2}])
  assert.equal(compose(.019,invalid),.019,'untrusted cosmetic offset cannot alter a source rig');
 const renderer=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(renderer,/composeOriginalSourceGroundedPivotY\([\s\S]{0,190}actor\.sourceGroundAnchor\)/,
  'real frame-owned visualPivot.position.set must preserve one-time sole-to-floor offset');
});

test('licensed source soles align to the ACTUAL stone top without moving authoritative grid roots or weapon rigs',async()=>{
 const {planOriginalSourceSoleGrounding:plan}=await load();
 assert.equal(typeof plan,'function','a bounded original-skin grounding planner must exist');
 // Captured from exact original source GLB / true skinned Vanguard shoes, 1440px and 390px.
 // Floor cubes at y=-.10 with height .16, so stone upper face is y=-.02.
 const observed={mode:'idle',sourceClipName:'Idle',visible:true,reducedMotion:false,
  floorTopY:-.02,floorEvidence:'authored-cube-floor-top',
  leftSoleWorldY:.2103,rightSoleWorldY:.2103};
 const scale1=plan({...observed,parentWorldScaleY:1});
 const scaleEnemy=plan({...observed,parentWorldScaleY:1.04});
 const scaleWarden=plan({...observed,parentWorldScaleY:1.16});
 assert.ok(scale1&&scaleEnemy&&scaleWarden,
  'source skinned floor alignment works across original hero, Revenant, Warden scales');
 for(const [scale,receipt] of [[1,scale1],[1.04,scaleEnemy],[1.16,scaleWarden]]){
  assert.ok(Math.abs(receipt.offsetY*scale+.2303)<.002,
   'source visual LOCAL delta must cancel actual WORLD gap for scale '+scale);
  assert.ok(Math.abs(receipt.worldOffsetY+.2303)<.002);
 }
 assert.equal(plan({...observed,parentWorldScaleY:0}),null);
 assert.equal(plan({...observed,parentWorldScaleY:-1}),null);
 assert.equal(plan({...observed,parentWorldScaleY:Infinity}),null);
 const anchored=plan(observed);
 assert.ok(anchored&&anchored.accepted,'standing original skinned shoes are both above genuine floor');
 assert.ok(Math.abs(anchored.offsetY+.2303)<.002,
  'source weapon-tip world bounds must NOT be used to levitate the skinned soles');
 assert.ok(Math.abs(observed.leftSoleWorldY+anchored.offsetY-observed.floorTopY)<.003);
 assert.equal(anchored.measuredFrom,'original-skinned-sole-vertices');
 // The original pose is not an IK instruction. Unknown/uneven/airborne poses fail closed.
 for(const change of [
  {mode:'move'}, {sourceClipName:'Walking_A'}, {visible:false},
  {reducedMotion:true}, {floorEvidence:'estimated'}, {floorTopY:.08},
  {leftSoleWorldY:.21,rightSoleWorldY:.31},
  {leftSoleWorldY:-.035,rightSoleWorldY:-.035},
  {leftSoleWorldY:.65,rightSoleWorldY:.65},
  {leftSoleWorldY:NaN}, {rightSoleWorldY:Infinity}
 ])assert.equal(plan({...observed,...change}),null,
  'no blind lift, pose-guess or ambiguous-contact correction: '+JSON.stringify(change));
 const renderer=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(renderer,/planOriginalSourceSoleGrounding\(/);
 assert.match(renderer,/sourceSkinnedSoleWorld\(soleCandidates\.left\)/);
 assert.match(renderer,/sourceGroundAnchor/,'the real source anchor must be auditable without per-frame skin scans');
});

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
test('a witnessed original cast keeps exactly one final recovery pose across a sparse next idle tick',async()=>{
 const {advanceFullBodyController:step}=await load();
 // The public Dungeon authority ticks every 350ms, while a legitimate
 // source cast needs 640ms to finish its original spine/shoulder/hand release.
 // An actual slow WebGL frame can jump past that limit in one displayed frame.
 const cast=step(null,frame(hero('cast',70),{actionAge:.52}));
 const witnessed=step(cast,frame(hero('cast',70),{actionAge:.59}));
 assert.equal(witnessed.phase,'recovery');
 const final=step(witnessed,frame(hero('idle',71),{
  actionAge:0,frameDelta:.05,frameInterval:.28,visible:true
 }));
 assert.equal(final.mode,'cast','the last genuine source cast recovery frame must be displayed');
 assert.equal(final.phase,'recovery');
 assert.equal(final.holding,true);
 assert.equal(final.actionTick,70,'one source cast must never acquire a new idle tick');
 assert.ok(final.age>=.59&&final.age<.64);
 assert.equal(final.owner.cast,true);
 const released=step(final,frame(hero('idle',71),{frameDelta:.016,frameInterval:.016}));
 assert.equal(released.mode,'idle','the single extra pose must release on the following visible frame');
 assert.equal(released.owner.cast,false);
 assert.equal(released.holding,false);
 for(const change of [
  {unit:hero('guard',71)},
  {unit:hero('move',71),grounded:{moving:true,clipAction:'move'}},
  {unit:hero('idle',72)},
  {teleport:true},
  {reducedMotion:true},
  {damageBeat:{id:'hero-1',kind:'vanguard',damage:5,maxHp:30,age:.12,fatal:false}},
  {evasionBeat:{id:'hero-1',kind:'vanguard',tick:71,dx:1,dz:0,age:.08}}
 ]){
  const denied=step(witnessed,frame(hero('idle',71),{
   actionAge:0,frameDelta:.05,frameInterval:.28,...change
  }));
  assert.notEqual(denied.mode,'cast','interrupted or stale cast must not resurrect');
 }
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
 assert.match(model,/stageRigGroundedStride\(actor,reducedMotion,dt,sourceFrameInterval,sourceFrameVisible\)/,
  'actual visible frame interval must propagate to the licensed original-sole landing planner');
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

test('source melee release spends one visible recovery frame when a sparse WebGL idle handoff spans the contact window',async()=>{
 const {advanceFullBodyController:step}=await load();
 const attacker={...hero('attack',77),targetId:'ranger'};
 const source=step(null,frame(attacker,{actionAge:.47,frameDelta:.05,frameInterval:.05,
  combatFacing:{targetId:'ranger',distance:1,yaw:.3}}));
 assert.equal(source.phase,'recovery');
 assert.deepEqual(source.confirmedContact,{targetId:'ranger',distance:1,actionTick:77});
 const next={...attacker,action:'idle',targetId:null,actionTick:78};
 // Exact lawful consecutive snapshot, source contact already witnessed;
 // software WebGL displays only one 280ms frame before the idle heartbeat.
 const idleFrame=frame(next,{actionAge:0,frameDelta:.05,frameInterval:.28});
 const held=step(source,idleFrame);
 assert.equal(held.mode,'attack','the recorded source attack must have a real visible recovery handoff');
 assert.equal(held.holding,true);
 assert.equal(held.authorityAction,'idle','never rewrite the public idle tick');
 assert.equal(held.actionTick,77,'never invent a replacement attack or source tick');
 assert.ok(held.age>=source.age&&held.age<.62,'release the actual original pose at its recovery boundary');
 assert.deepEqual(held.confirmedContact,source.confirmedContact);
 const released=step(held,idleFrame);
 assert.equal(released.mode,'idle','one recovery presentation frame only');
 assert.equal(released.confirmedContact,null);
 const noContact=step(null,frame({...attacker,targetId:null},{actionAge:.47}));
 assert.equal(step(noContact,idleFrame).mode,'idle','unverified target never earns a late contact pose');
 for(const interruption of [
  {unit:{...next,actionTick:80}},
  {unit:{...next,action:'guard'}},
  {unit:{...next,hp:0}},
  {unit:{...next,action:'move'},grounded:{moving:true,clipAction:'move'}},
  {teleport:true}, {reducedMotion:true},
  {damageBeat:{id:'hero-1',kind:'vanguard',damage:5,maxHp:30,fatal:false,age:.08}}
 ]){
  const interrupted=step(source,{...idleFrame,...interruption});
  assert.notEqual(interrupted.mode,'attack','a real interrupt or missing adjacent tick must cancel the release');
  assert.equal(interrupted.confirmedContact,null);
 }
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


test('ranged release retains only witnessed source aim through lawful idle recovery',async()=>{
 const {advanceFullBodyController:step}=await load();
 const original={id:'ranger-1',kind:'ranger',hp:32,maxHp:32,
  action:'attack',actionTick:140,targetId:'warden-1'};
 const facing={targetId:'warden-1',distance:3,yaw:.28};
 const first=step(null,{unit:original,actionAge:.31,frameDelta:.016,combatFacing:facing});
 assert.equal(first.mode,'attack');
 assert.equal(first.confirmedContact,null,'ranged aim never masquerades as melee contact');
 assert.deepEqual(first.witnessedRangedAim,{
  actorId:'ranger-1',targetId:'warden-1',distance:3,actionTick:140
 },'only explicit same-actor source-target range may anchor the skinned Ranger shot');
 const nextIdle={...original,action:'idle',targetId:null,actionTick:141};
 const held=step(first,{unit:nextIdle,actionAge:0,frameDelta:.04,combatFacing:null});
 assert.equal(held.holding,true,'the original licensed shot is still recovering');
 assert.equal(held.mode,'attack');
 assert.deepEqual(held.witnessedRangedAim,first.witnessedRangedAim,
  'loss of public target on idle must not abruptly remove original pelvis/leg/weapon recovery');
 assert.equal(held.confirmedContact,null);
 const {planRangedBodyPose}=await import('data:text/javascript;base64,'+
  Buffer.from(fs.readFileSync(path.join(root,'public/ai-dungeon/ranged-encounter-plan.js'),'utf8')).toString('base64'));
 assert.ok(planRangedBodyPose('ranger',held.mode,held.age,
  held.witnessedRangedAim?.distance,held.witnessedRangedAim?.targetId,false,.8).weight>0,
  'the original full-body recovery channels retain a lawful range witness');
 for(const bad of [
  {targetId:'other',distance:3,yaw:.28},
  {targetId:'warden-1',distance:5,yaw:.28},
  {targetId:'warden-1',distance:0,yaw:.28},
  {targetId:'warden-1',distance:3,yaw:NaN},
  null
 ]){
  const invalid=step(null,{unit:original,actionAge:.31,frameDelta:.016,combatFacing:bad});
  assert.equal(invalid.witnessedRangedAim,null,'no ambiguous ranged target may be carried');
 }
 const skipped=step(first,{unit:{...nextIdle,actionTick:142},frameDelta:.04});
 assert.equal(skipped.witnessedRangedAim,null,'skipped authority heartbeat cannot retain stale aim');
 const interrupted=step(first,{unit:nextIdle,frameDelta:.04,damageBeat:{
  id:'ranger-1',kind:'ranger',damage:4,maxHp:32,age:.08,fatal:false
 }});
 assert.equal(interrupted.witnessedRangedAim,null,'real injury releases the old aim');
 for(const props of [{reducedMotion:true},{teleport:true}]){
  assert.equal(step(first,{unit:nextIdle,frameDelta:.04,...props}).witnessedRangedAim,null);
 }
 const unrelated=step(first,{unit:{...nextIdle,id:'different-ranger'},frameDelta:.04});
 assert.equal(unrelated.witnessedRangedAim,null,'other actors cannot inherit ranger aim');
 const renewed=step(first,{unit:{...original,actionTick:141,targetId:'other-foe'},
  actionAge:0,combatFacing:{targetId:'other-foe',distance:2,yaw:0}});
 assert.equal(renewed.witnessedRangedAim?.targetId,'other-foe','new source attack owns new aim');
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(model,/actor\.animationFacing=actor\.fullBody\.confirmedContact\?\?actor\.fullBody\.witnessedRangedAim\?\?actor\.combatFacing/);
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


test('sparse original WebGL walking handoff completes its mixer crossfade without speeding real source feet',async()=>{
 const {planImportedWalkingMixerFrameDelta:mixerDelta,
  planImportedLivingSourceStep:step,
  planImportedWalkingBlendRate:rate}=await load();
 assert.equal(typeof mixerDelta,'function','single native walk fade clock must be explicit');
 const source={mode:'move',sourceTime:.22,sourceDuration:1.0416666666666667,
  effectiveSpeed:.91,frameDelta:.05,frameInterval:.36,
  walkingClip:true,groundedMoving:true,groundedTravel:.004,
  reducedMotion:false,teleport:false,visible:true};
 const nativeStep=step(source);
 const visibleStep=mixerDelta({...source,sourceStep:nativeStep});
 assert.equal(visibleStep,.09,
  'real 360ms software-WebGL delivery may show only 90ms per lawful fade frame');
 const speed=rate({...source,sourceStep:nativeStep});
 assert.ok(Math.abs(speed*visibleStep-nativeStep)<1e-9,
  'the authentic 41-joint Walking_A keyframes must STILL follow only observed root metres');
 assert.ok(Math.abs(2*visibleStep-.18)<1e-9,
  'two genuinely presented slow frames may finish the 180ms native crossfade');
 assert.ok(2*nativeStep<.02,
  'the same slow travel must not manufacture a 180ms walking sole sweep');
 const stopped={...source,groundedTravel:0,groundedMoving:false};
 const still=step(stopped);
 assert.equal(still,0,'a stationary walking owner cannot treadmill');
 assert.equal(rate({...stopped,sourceStep:still}),0,
  'the zero-distance licensed shoes stay frozen while actual crossfade weight advances');
 assert.equal(mixerDelta({...stopped,sourceStep:still}),.09);
 assert.equal(mixerDelta({...source,frameDelta:.016,frameInterval:.016}),.016);
 for(const unsafe of [
  {...source,mode:'hurt'}, {...source,walkingClip:false},
  {...source,visible:false}, {...source,reducedMotion:true},
  {...source,teleport:true}, {...source,frameInterval:2.1},
  {...source,frameInterval:NaN}
 ])assert.equal(mixerDelta(unsafe),Math.min(.05,unsafe.frameDelta),
  'non-walk, hidden or invalid evidence cannot accelerate native mixer fades');
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(model,/const walkMixerDelta=planImportedWalkingMixerFrameDelta\(\{\.\.\.originalStep,sourceStep\}\)/);
 assert.match(model,/actor\.mixer\.update\(walkMixerDelta\)/,
  'the real imported mixer must actually consume the bounded fade clock');
});

test('licensed Walking_A crossfades run on visible seconds while native feet follow real metres',async()=>{
 const {planImportedLivingSourceStep,planImportedWalkingBlendRate,planImportedWalkingMixerFrameDelta}=await load();
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
 const catchupMixerDelta=planImportedWalkingMixerFrameDelta({...catchup,sourceStep:catchupSource});
 const catchupRate=planImportedWalkingBlendRate({...catchup,sourceStep:catchupSource});
 assert.ok(catchupRate>3&&catchupMixerDelta<=.09&&
  Math.abs(catchupRate*catchupMixerDelta-catchupSource)<1e-9,
  'source feet catch up exactly once while even a slow delivered frame consumes <=90ms mixer fade');
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
 assert.match(model,/actor\.mixer\.update\(walkMixerDelta\)/);
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
 assert.match(model,/actor\.mixer\.update\(walkMixerDelta\)/,
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



test('source-faded Ranger and priest releases support the original hips and BOTH planted leg chains without fabricated travel',async()=>{
 const ranged=await import('data:text/javascript;base64,'+
  Buffer.from(fs.readFileSync(path.join(root,'public/ai-dungeon/ranged-encounter-plan.js'),'utf8')).toString('base64'));
 const vector=p=>[
  p.hips.pitch,p.hips.yaw,p.hips.roll,
  ...['left','right'].flatMap(side=>[
   p.legs[side].upper,p.legs[side].lower,p.legs[side].foot
  ])
 ];
 for(const [kind,action,distance,target] of [
  ['ranger','attack',2,'genuine-adjacent-line-of-sight-target'],
  ['mystic','cast',null,null],
  ['cultist','cast',null,null]
 ]){
  const args=[kind,action,.25,distance,target,false];
  const atZero=vector(ranged.planRangedBodyPose(...args,0));
  const half=vector(ranged.planRangedBodyPose(...args,.5));
  const whole=vector(ranged.planRangedBodyPose(...args,1));
  assert.ok(atZero.every(x=>x===0),kind+' planted hips and original ankles must enter WITH the source fade');
  assert.ok(Math.abs(whole[0])>.008,kind+' original hips need a measurable load transfer');
  assert.ok(whole.slice(3,6).some(x=>Math.abs(x)>.016),kind+' genuine left thigh/knee/foot must support release');
  assert.ok(whole.slice(6,9).some(x=>Math.abs(x)>.016),kind+' genuine right thigh/knee/foot must support release');
  assert.ok(whole.every(x=>Number.isFinite(x)&&Math.abs(x)<.15),kind+' bounds protect source bind/deformation');
  for(let i=0;i<whole.length;i++)assert.ok(Math.abs(half[i]-whole[i]*.5)<1e-9,
   kind+' native hips and soles must fade together at component '+i);
  assert.ok(vector(ranged.planRangedBodyPose(kind,'idle',.25,distance,target,false,1)).every(x=>x===0),
   kind+' idle may not continue the release plant');
  assert.ok(vector(ranged.planRangedBodyPose(...args.slice(0,5),true,1)).every(x=>x===0),
   kind+' reduced motion has no forced planted release');
 }
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(model,/actor\.rigRangedPose\s*=\s*planRangedBodyPose\(/,
  'source release should compute one coherent post-mixer full-body pose');
 assert.match(model,/releaseSupport\?\.hips/,
  'the real original pelvis must consume that SAME sourced release');
 assert.match(model,/releaseSupport\?\.legs\?\.\[mount\.side\]/,
  'the genuine original thigh, calf and ankle mounts must consume that same release');
 assert.doesNotMatch(model,/if\(!actor\.rigRangedActive\)return;/,
  'diagnostic 0.1-weight threshold must not make source-faded joint overlays pop on');
});


test('native Ranger/caster release support recovers to neutral BEFORE its genuine owner expires, without a joint snap',async()=>{
 const filename=path.join(root,'public/ai-dungeon/ranged-encounter-plan.js');
 const ranged=await import('data:text/javascript;base64,'+
  Buffer.from(fs.readFileSync(filename,'utf8')).toString('base64'));
 const components=p=>[p.weight,p.hips.pitch,p.hips.yaw,p.hips.roll,
  p.spine.pitch,p.spine.yaw,p.spine.roll,
  ...['left','right'].flatMap(side=>[
   p.legs[side].upper,p.legs[side].lower,p.legs[side].foot,
   p.shoulders[side].pitch,p.shoulders[side].roll,p.elbows[side]
  ])];
 for(const [kind,action,end,distance,target] of [
  ['ranger','attack',.62,2,'true-range-target'],
  ['mystic','cast',.64,null,null],
  ['cultist','cast',.64,null,null]
 ]){
  const pose=(age,sourceBlend=1)=>ranged.planRangedBodyPose(
   kind,action,age,distance,target,false,sourceBlend);
  const peak=components(pose(.35));
  const settling=components(pose(end-.02));
  const terminal=components(pose(end));
  const next=components(pose(end+.015));
  assert.ok(peak.some(v=>Math.abs(v)>.08),kind+' needs a real integrated release');
  assert.ok(settling.every(Number.isFinite),kind+' recovery must be finite');
  assert.ok(settling.some(v=>Math.abs(v)>0),kind+' must ease rather than abruptly cut its supported pose');
  assert.ok(Math.max(...settling.map(Math.abs))<.021,
   kind+' near-owner expiry must settle hips, legs, spine, shoulders AND elbows');
  assert.ok(terminal.every(v=>v===0),
   kind+' original source owner expiration must not snap any supported joint');
  assert.deepEqual(next,terminal,kind+' post-owner idle must not retain a fake release');
  assert.ok(components(pose(.35,.5)).every((v,i)=>Math.abs(v-peak[i]*.5)<1e-9),
   kind+' early and recovery angles must remain tied to native mixer fade');
 }
});


test('licensed Walking_A freezes its outgoing source keyframe while a genuinely stopped actor crossfades to idle',async()=>{
 const {planImportedWalkArrivalFreeze:freeze}=await load();
 assert.equal(typeof freeze,'function','requires explicit original-source walking exit contract');
 const options={previousMode:'move',nextMode:'idle',previousClipName:'Walking_A',
  groundedMoving:false,groundedTravel:0,teleport:false,reducedMotion:false,
  visible:true};
 assert.equal(freeze(options),true,'source must stop stepping its ankles after genuine travel ends');
 assert.equal(freeze({...options,nextMode:'guard'}),true,
  'genuine stopped move-to-guard must hold its last source Walking_A foot while Idle fades into the original defensive pose');
 for(const [reason,patch] of Object.entries({
  stillWalking:{groundedMoving:true},rootStillTravelling:{groundedTravel:.015},
  microscopicInterp:{groundedTravel:.0016},otherOwner:{previousMode:'attack'},
  newAttack:{nextMode:'attack'},newCast:{nextMode:'cast'},
  noSource:{previousClipName:'Idle'},unknownSource:{previousClipName:'None'},
  teleported:{teleport:true},accessibility:{reducedMotion:true},
  hidden:{visible:false},invalidTravel:{groundedTravel:NaN}
 }))assert.equal(freeze({...options,...patch}),false,reason+' retains existing mixer behavior');
 // This exercises the REAL THREE.AnimationMixer fade clock rather than merely
 // comparing strings. A paused outgoing source action must keep its planted
 // bone keyframe while its weight fades on mixer time and Idle becomes active.
 const THREE=require('three');
 const bone=new THREE.Object3D();
 const walkClip=new THREE.AnimationClip('Walking_A',1,[
  new THREE.VectorKeyframeTrack('.position',[0,.5,1],[0,0,0,0,.25,0,0,0,0])
 ]);
 const idleClip=new THREE.AnimationClip('Idle',1,[
  new THREE.VectorKeyframeTrack('.position',[0,1],[0,0,0,0,0,0])
 ]);
 const mixer=new THREE.AnimationMixer(bone);
 const walking=mixer.clipAction(walkClip).play();
 mixer.update(.21);
 const plantedTime=walking.time,plantedWorldY=bone.position.y;
 const idle=mixer.clipAction(idleClip);
 idle.reset().play().crossFadeFrom(walking,.23,false);
 if(freeze(options))walking.paused=true;
 mixer.update(.07);
 assert.equal(walking.time,plantedTime,
  'outgoing skinned source feet cannot keep pedalling on stationary ground');
 assert.ok(walking.getEffectiveWeight()<1&&walking.getEffectiveWeight()>0,
  'the old original source pose must fade continuously, not pop off');
 assert.ok(idle.getEffectiveWeight()>0,
  'the genuine idle source must take over during the same elapsed-time fade');
 assert.ok(Number.isFinite(bone.position.y)&&Math.abs(bone.position.y-plantedWorldY)<.3,
  'no malformed original joint blending');
 walking.reset().play();
 assert.equal(walking.paused,false,'next lawful Walking_A entry must unpause the source');
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(model,/planImportedWalkArrivalFreeze\(\{/,
  'running Three.js source mixer must use the guarded stop-to-idle planner');
 assert.match(model,/previous\.paused=true/,
  'outgoing licensed source action must hold its true planted keyframe during fade');
});


test('original Idle GLB clock survives genuine idle/guard changes without resetting its chest/leg source pose',async()=>{
 const {shouldRetainImportedSharedIdleClock:keep}=await load();
 assert.equal(typeof keep,'function','explicit source AnimationAction identity must be protected');
 const opts={previousMode:'idle',nextMode:'guard',previousClipName:'Idle',
  nextClipName:'Idle',sameAction:true,sourceRunning:true,newEvent:false};
 assert.equal(keep(opts),true,'the same licensed Idle animation must retain its phase into guard');
 assert.equal(keep({...opts,previousMode:'guard',nextMode:'idle'}),true,
  'guard release must not restart the source skinned legs at frame zero');
 for(const [reason,patch] of Object.entries({
  walking:{previousMode:'move'},casting:{previousMode:'cast'},attack:{nextMode:'attack'},
  sameOwner:{nextMode:'idle'},differentClip:{nextClipName:'Walking_A'},
  missingClip:{previousClipName:null},differentAction:{sameAction:false},
  disabledAction:{sourceRunning:false},newLegalEvent:{newEvent:true}
 }))assert.equal(keep({...opts,...patch}),false,reason+' must not retain unrelated source actions');
 // Exercising the real THREE.AnimationMixer: resetting the same Idle action
 // while a guard starts jumps its original animated bone track back to t=0.
 const THREE=require('three'),bone=new THREE.Object3D();
 const clip=new THREE.AnimationClip('Idle',1.04166662693,[
  new THREE.VectorKeyframeTrack('.position',[0,.3,.7,1.04166662693],
   [0,0,0,0,.12,0,0,-.08,0,0,0,0])
 ]);
 const mixer=new THREE.AnimationMixer(bone),source=mixer.clipAction(clip).play();
 mixer.update(.31);
 const beforeTime=source.time,beforePose=bone.position.y;
 if(!keep(opts))source.reset().play();
 assert.equal(source.time,beforeTime,'idle -> guard must preserve the original GLB source time');
 mixer.update(.025);
 assert.ok(source.time>beforeTime,'the genuine source loop must continue advancing');
 assert.ok(Math.abs(bone.position.y-beforePose)<.05,'the chest/leg track cannot snap at guard entry');
 if(!keep({...opts,previousMode:'guard',nextMode:'idle'}))source.reset().play();
 assert.ok(source.time>.31,'guard -> idle must not restart the real source Idle action');
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(model,/if\(shouldRetainImportedSharedIdleClock\(\{/,
  'actual Three.js renderer must protect same-clip idle/guard ownership');
 assert.match(model,/actor\.currentActionTick=tick;[\s\S]{0,130}return;/,
  'source reuse must still update real presentation action ownership and tick');
});


test('lawful guard/idle source-rig transition blends hips, planted legs, shoulders and elbows without a sudden ownership snap',async()=>{
 const {advanceFullBodyController}=await load();
 const rigFile=path.join(root,'public/ai-dungeon/rig-attachment-plan.js');
 const rig=await import('data:text/javascript;base64,'+
  Buffer.from(fs.readFileSync(rigFile,'utf8')).toString('base64'));
 assert.equal(typeof rig.planNativeGuardPose,'function','one authentic original-rig chain needs a shared guard pose contract');
 const sample=(prior,action,dt=.05,opts={})=>advanceFullBodyController(prior,{
  unit:{id:'guard-vanguard',kind:'vanguard',hp:120,maxHp:120,action,actionTick:24},
  actionAge:.1,frameDelta:dt,frameInterval:dt,visible:true,...opts
 });
 const initial=sample(null,'idle');
 const first=sample(initial,'guard');
 assert.equal(first.mode,'guard');
 assert.ok(first.guardBlend>0&&first.guardBlend<.35,'first real frame must not snap to full pose');
 let entered=first;
 for(let i=0;i<5;i++)entered=sample(entered,'guard');
 assert.ok(entered.guardBlend>.99,'sustained lawful guard reaches a braced stance');
 const released=sample(entered,'idle');
 assert.equal(released.mode,'idle');
 assert.ok(released.guardBlend<entered.guardBlend&&released.guardBlend>.5,
  'guard exit must settle naturally while original Idle source clip remains continuous');
 let settled=released;for(let i=0;i<6;i++)settled=sample(settled,'idle');
 assert.equal(settled.guardBlend,0,'no persistent guard offset after real idle arrival');
 const interrupted=sample(entered,'attack');
 assert.equal(interrupted.guardBlend,0,'fresh attack must immediately own the source body');
 assert.equal(sample(entered,'idle',.05,{teleport:true}).guardBlend,0,'real teleport resets support');
 assert.equal(sample(entered,'idle',.05,{reducedMotion:true}).guardBlend,0,'accessibility immediately restores neutral');
 assert.equal(sample(entered,'idle',.05,{unit:{id:'guard-vanguard',kind:'vanguard',hp:0,maxHp:120,action:'idle',actionTick:24}}).guardBlend,0,'defeat cannot retain a living guard');
 const components=p=>[
  p.head.pitch,p.chest.pitch,p.hips.pitch,
  ...['left','right'].flatMap(side=>[
   p.shoulders[side].pitch,p.shoulders[side].roll,p.elbows[side],
   p.legs[side].upper,p.legs[side].lower,p.legs[side].foot
  ])
 ];
 const zero=components(rig.planNativeGuardPose(0));
 const half=components(rig.planNativeGuardPose(.5));
 const full=components(rig.planNativeGuardPose(1));
 assert.ok(zero.every(x=>x===0));
 assert.ok(full.some(x=>Math.abs(x)>.15),'source arms must visibly protect body');
 assert.ok(full.slice(0,3).some(x=>Math.abs(x)>.01),'original hips/chest/head must share the brace');
 assert.ok(full.slice(3).some(x=>Math.abs(x)>.025),'both authentic arms and soles support guard');
 assert.ok(full.every(x=>Number.isFinite(x)&&Math.abs(x)<.4),'native 41-joint angles remain bounded');
 assert.ok(half.every((x,i)=>Math.abs(x-full[i]*.5)<1e-10),
  'all source pelvis-to-elbow-and-foot channels share one guard blend');
 assert.ok(components(rig.planNativeGuardPose(1,true)).every(x=>x===0));
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(model,/actor\.rigGuardPose\s*=\s*planNativeGuardPose\(actor\.fullBody\?\.guardBlend/,
  'real Three.js mixer consumes the same source guardian envelope after action ownership');
 assert.match(model,/guardPose\?\.legs\?\.\[mount\.side\]/,
  'original imported thigh/calf/ankle chains must share the authored guard envelope');
 assert.match(model,/guardPose\?\.shoulders\?\.\[mount\.side\]/,
  'original shoulder chains must share the same envelope');
 assert.match(model,/actor\.rigGuardPose\?\.elbows\?\.\[mount\.side\]/,
  'original forearm chains must share the same envelope');
});


// Authored source GLB 'Walking_A' is paused on a genuine source move->guard
// crossfade. Its reversible original thigh/knee/ankle stride must settle with
// the incoming native guard support rather than disappearing on frame one.
// This is an animation-only source contract; NOT world-space sole locking.
test('authentic walking source planted move-to-guard hands stride support into native guard rather than snapping ankles',async()=>{
 const {planNativeWalkToGuardGait}=await load();
 assert.equal(typeof planNativeWalkToGuardGait,'function',
  'an isolated original-source move-to-guard plant contract must exist');
 const candidate={mode:'guard',sourceWalkFrozen:true,groundedMoving:false,
  groundedTravel:0,gaitWeight:.9,guardBlend:.15,alive:true,
  teleport:false,reducedMotion:false};
 assert.equal(planNativeWalkToGuardGait(candidate),true);
 for(const [reason,patch] of Object.entries({
  notGuard:{mode:'idle'},noOriginalWitness:{sourceWalkFrozen:false},
  moving:{groundedMoving:true},rootStillTravelling:{groundedTravel:.012},
  invalidTravel:{groundedTravel:NaN},invalidNegative:{groundedTravel:-.1},
  alreadyNeutral:{gaitWeight:0},badWeight:{gaitWeight:NaN},
  fullyGuarded:{guardBlend:1},badBlend:{guardBlend:NaN},
  defeated:{alive:false},teleport:{teleport:true},
  reducedMotion:{reducedMotion:true}
 }))assert.equal(planNativeWalkToGuardGait({...candidate,...patch}),false,reason);
 // Real existing deterministic original-GLB overlay planners: legal planting
 // must fade physically across source thigh and ankle, never vanish at t=0.
 const rig=await import('data:text/javascript;base64,'+
  Buffer.from(fs.readFileSync(path.join(root,'public/ai-dungeon/rig-attachment-plan.js'),'utf8')).toString('base64'));
 const phase=Math.PI/2,old=rig.planRigLegGesture(phase,.9);
 const first=rig.advanceRigGait(phase,.9,0,!planNativeWalkToGuardGait(candidate),.016);
 const firstPose=rig.planRigLegGesture(first.phase,first.weight);
 assert.ok(old.left.upper>.21&&old.left.foot<-.08);
 assert.ok(first.weight>0&&first.weight<.9,
  'first guard frame must reduce source-ankle support without deleting it');
 assert.ok(Math.abs(old.left.upper-firstPose.left.upper)<.055,
  'authentic source-thigh performance should not pop by ~.22 rad on guard entry');
 const terminal=rig.advanceRigGait(first.phase,first.weight,0,false,.16);
 assert.equal(terminal.weight,0,'the source gait must completely yield to guard');
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(model,/actor\.rigGuardPlantHandoff\s*=\s*action===['"]guard['"]/,
  'source Walking_A freeze must record only a genuine guard entry');
 assert.match(model,/planNativeWalkToGuardGait\(\{/,
  'the actual Three.js original source actor must apply the plant arbitration');
 assert.match(model,/sourceWalkFrozen:\s*Boolean\(actor\.rigGuardPlantHandoff\)/,
  'source guard handoff must not be fabricated from a generic guard label');
});


test('witnessed guarded stance releases through a genuine walking start without snapping the original pelvis-to-weapon support',async()=>{
 const {advanceFullBodyController:step}=await load();
 const rig=await import('data:text/javascript;base64,'+
  Buffer.from(fs.readFileSync(path.join(root,'public/ai-dungeon/rig-attachment-plan.js'),'utf8')).toString('base64'));
 const unit=(action,hp=120)=>({id:'defender-1',kind:'vanguard',action,actionTick:91,hp,maxHp:120});
 const next=(before,action,patch={})=>step(before,{
  unit:unit(action),grounded:{moving:action==='move',clipAction:action==='move'?'move':'idle'},
  actionAge:.12,frameDelta:.05,frameInterval:.05,visible:true,...patch
 });
 let guard=next(null,'guard');
 for(let i=0;i<4;i++)guard=next(guard,'guard');
 assert.ok(guard.guardBlend>.99,'original Idle source is wearing the fully supported pelvis/feet/arms guard');
 const walking=next(guard,'move');
 assert.equal(walking.mode,'move');assert.equal(walking.owner.locomotion,true);
 assert.equal(walking.owner.guard,false,'guard is only fading visual pose, never a walking gameplay action');
 assert.ok(walking.guardBlend>.4&&walking.guardBlend<1,
  'outgoing planted knee/hip/shoulder/elbow guard cannot disappear in the first lawful Walking_A frame');
 const component=p=>[p.hips.pitch,p.chest.pitch,p.head.pitch,
  ...['left','right'].flatMap(side=>[p.legs[side].upper,p.legs[side].lower,p.legs[side].foot,
   p.shoulders[side].pitch,p.shoulders[side].roll,p.elbows[side]])];
 const prior=component(rig.planNativeGuardPose(guard.guardBlend));
 const entered=component(rig.planNativeGuardPose(walking.guardBlend));
 assert.ok(entered.every((n,i)=>Number.isFinite(n)&&Math.abs(n-prior[i])<.11),
  'connected original source pelvis/ankles and weapon-supporting arms must not lose the guard pose in a single moving frame');
 let advancing=walking;
 for(let i=0;i<4;i++)advancing=next(advancing,'move');
 assert.equal(advancing.guardBlend,0,'the original walking source wins after a bounded defensive release');
 assert.equal(advancing.owner.guard,false);
 assert.equal(next(guard,'attack').guardBlend,0,'new attack interrupts the obsolete guard immediately');
 assert.equal(next(guard,'move',{teleport:true}).guardBlend,0);
 assert.equal(next(guard,'move',{reducedMotion:true}).guardBlend,0);
 assert.equal(next(guard,'move',{unit:unit('move',0)}).guardBlend,0);
 assert.equal(next(guard,'move',{damageBeat:{id:'defender-1',kind:'vanguard',damage:5,maxHp:120,age:.08,eventTick:91}}).guardBlend,0);
 assert.equal(next(guard,'move',{evasionBeat:{id:'defender-1',kind:'vanguard',tick:91,dx:1,dz:0,age:.1}}).guardBlend,0);
});


test('original Walking_A owns the primary thigh/calf/ankle swing without duplicated sinusoidal source-rig leg drive',async()=>{
 const controller=await load();
 const plan=controller.planNativeImportedLegOwnership;
 assert.equal(typeof plan,'function','source-rig walking ownership must have an explicit pure bounded contract');
 const source={mode:'move',sourceClipName:'Walking_A',sourceWeight:1,
  groundedMoving:true,settling:false,alive:true,frameDelta:.016};
 let scale=1;
 for(let frame=0;frame<18;frame++){
  const next=plan({...source,previous:scale});
  assert.ok(Number.isFinite(next)&&next>=0&&next<=1);
  assert.ok(next<=scale&&scale-next<=.10001,
   'the authentic original gait must take ownership gradually, never snap the imported skinned knees');
  scale=next;
 }
 assert.ok(scale<.005,'the fully weighted 41-joint Walking_A must own its thigh, calf, ankle, pelvis and shoulder swing without a residual procedural sine');
 assert.equal(plan({...source,previous:0}),0,
  'authentic walk with full original source weight cannot reintroduce secondary leg twitching');
 assert.ok(Math.abs(plan({...source,previous:1,sourceWeight:.9,frameDelta:.20})-.1)<1e-10,
  'sparse WebGL frames must follow the actually mixed source ownership, rather than taking ten visible frames');
 assert.ok(Math.abs(plan({...source,previous:1,sourceWeight:.9,frameDelta:.016})-(1-.016/.18))<1e-10,
  'normal 60Hz ownership changes are bounded by original walking clip crossfade time');
 const sourceLowerBodyExtra=.245*scale+.063*scale;
 assert.ok(sourceLowerBodyExtra<.063,
  'the old 0.245rad thigh plus 0.063rad ankle overlay must be reduced over a genuine native walk');
 const held=plan({previous:scale,mode:'guard',settling:true,groundedMoving:false,
  sourceClipName:'Idle',sourceWeight:1,alive:true,frameDelta:.016});
 assert.equal(held,scale,'native walking support remains suppressed while the planted source fade settles into guard');
 assert.equal(plan({...source,mode:'idle',groundedMoving:false,settling:true,previous:held}),held);
 assert.equal(plan({...source,mode:'idle',groundedMoving:false,settling:false,previous:held}),1);
 for(const interruptions of [
  {mode:'attack'},{mode:'hurt'},{mode:'cast'},{mode:'evade'},{mode:'defeat'},
  {teleport:true},{reducedMotion:true},{alive:false}
 ])assert.equal(plan({...source,previous:scale,...interruptions}),1,
  'genuine interrupts must release the previous decorative walk leg owner immediately');
 for(const unverified of [
  {sourceClipName:'Idle'},{sourceClipName:'2H_Ranged_Shoot'},
  {groundedMoving:false},{sourceWeight:NaN},{sourceWeight:-.1},
  {sourceWeight:1.1},{frameDelta:NaN}
 ])assert.equal(plan({...source,previous:scale,...unverified}),1,
  'without the actual valid original walking clip there is no source-owned-leg suppression');
 const rig=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(rig,/planNativeImportedLegOwnership\(\{/,
  'production Three.js imported source must use the same source-rig ownership plan');
 assert.match(rig,/rigNativeLegOverlayScale/,
  'production gait must apply the ownership result to original leg overlay strength');
});


test('original source Walking_A transfers connected hips, shoulders and ankles to ONE licensed mixer owner',async()=>{
 const rig=await import('data:text/javascript;base64,'+
  Buffer.from(fs.readFileSync(path.join(root,'public/ai-dungeon/rig-attachment-plan.js'),'utf8')).toString('base64'));
 assert.equal(typeof rig.planSourceOwnedFullBodyStride,'function',
  'the 41-joint source walk leg owner must also control hips/chest/opposing arms');
 const p=Math.PI/2,original=rig.planRigFullBodyStride('vanguard',p,1);
 assert.ok(Math.abs(original.hips.yaw)>.025&&Math.abs(original.arms.right.pitch)>.05);
 for(const share of [1,.7,.36,.16]){
  const pose=rig.planSourceOwnedFullBodyStride('vanguard',p,1,share,false);
  assert.ok(Math.abs(pose.weight-share)<1e-10);
  for(const [actual,baseline] of [
   [pose.hips.yaw,original.hips.yaw],[pose.hips.roll,original.hips.roll],
   [pose.chest.yaw,original.chest.yaw],[pose.arms.left.pitch,original.arms.left.pitch],
   [pose.arms.right.pitch,original.arms.right.pitch]
  ])assert.ok(Math.abs(actual-baseline*share)<1e-9,
   'do not stack full duplicate shoulder-to-pelvis gait atop original Walking_A');
  assert.ok(Math.abs(pose.arms.left.pitch+pose.arms.right.pitch)<1e-9);
 }
 for(const invalid of [NaN,-1,0,1.2,Infinity])
  assert.equal(rig.planSourceOwnedFullBodyStride('vanguard',p,1,invalid).weight,0);
 assert.equal(rig.planSourceOwnedFullBodyStride('vanguard',p,1,.16,true).weight,0);
 assert.equal(rig.planSourceOwnedFullBodyStride('vanguard',p,0,.16,false).weight,0);
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(model,/actor\.rigFullBodyStride\s*=\s*planSourceOwnedFullBodyStride\([\s\S]{0,175}actor\.rigNativeLegOverlayScale/,
  'live Three.js source actor must use the SAME original Walking_A mixer share for hips, shoulders and legs');
});


test('a late ORIGINAL Walking_A arrival freezes only after real remaining root travel stops during fade',async()=>{
 const {shouldFreezeDeferredImportedWalk:freeze}=await load();
 assert.equal(typeof freeze,'function','the authentic imported walk fade needs a delayed plant gate');
 const witnessed={
  targetMode:'idle',currentMode:'idle',clipName:'Walking_A',
  sourceWeight:.31,sourceRunning:true,sourcePaused:false,
  groundedMoving:false,groundedTravel:0,alive:true,visible:true,
  teleport:false,reducedMotion:false
 };
 assert.equal(freeze(witnessed),true,'stopped root must stop cycling its still-fading genuine Walking_A ankles');
 assert.equal(freeze({...witnessed,targetMode:'guard',currentMode:'guard'}),true,
  'defensive arrival has the same shoe-plant contract');
 assert.equal(freeze({...witnessed,groundedTravel:.009}),false,
  'a late arrival may still be visibly travelling: no premature planted pose');
 for(const illegal of [
  {sourceWeight:0},{sourceWeight:NaN},{sourceWeight:1.2},
  {sourceRunning:false},{sourcePaused:true},{clipName:'Idle'},
  {clipName:'2H_Ranged_Shoot'},{groundedMoving:true},
  {groundedTravel:-.002},{groundedTravel:NaN},
  {targetMode:'move'},{currentMode:'attack'},{targetMode:'guard'},
  {alive:false},{visible:false},{teleport:true},{reducedMotion:true}
 ])assert.equal(freeze({...witnessed,...illegal}),false,
  'invalid source, new combat, teleport, hidden motion or unproven root cannot inherit a frozen shoe');
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(model,/walkArrivalPendingAction/,
  'the actual renderer must retain the outgoing original Walking_A action until its fade finishes');
 assert.match(model,/shouldFreezeDeferredImportedWalk\(/,
  'the actual Three.js mixer must consult the deferred real-root stop gate');
});


test('the original fading Walking_A slows its skinned shoe cycle with REAL late-arrival travel, without delaying Idle fade',async()=>{
 const {planImportedWalkExitBrake:brake}=await load();
 assert.equal(typeof brake,'function','late arrival needs a bounded source-only moving-foot brake');
 const input={targetMode:'idle',currentMode:'idle',clipName:'Walking_A',
  sourceWeight:.35,sourceRunning:true,sourcePaused:false,
  groundedTravel:.0055,alive:true,visible:true,teleport:false,reducedMotion:false};
 const tiny=brake(input),normal=brake({...input,groundedTravel:.065});
 assert.ok(tiny>0&&tiny<.20,'5.5 mm root settling cannot advance a full-speed original ankle cycle');
 assert.equal(normal,1,'genuine large visual root travel must retain its original gait');
 assert.ok(brake({...input,groundedTravel:.026})>tiny);
 assert.equal(brake({...input,targetMode:'guard',currentMode:'guard'}),tiny,
  'legitimate defensive arrival also decelerates one outgoing licensed source clip');
 for(const invalid of [
  {targetMode:'move'},{currentMode:'attack'},{targetMode:'guard'},
  {sourceWeight:0},{sourceWeight:NaN},{sourceWeight:1.1},
  {sourceRunning:false},{sourcePaused:true},{clipName:'Idle'},
  {clipName:'2H_Ranged_Shoot'},{groundedTravel:-.001},
  {groundedTravel:NaN},{groundedTravel:Infinity},
  {alive:false},{visible:false},{teleport:true},{reducedMotion:true}
 ])assert.equal(brake({...input,...invalid}),null,
  'invalid original source, action, visibility or interruption must never inherit walking momentum');
 const THREE=require('three');
 function simulatedFade(rate){
  const foot=new THREE.Object3D();
  const walkClip=new THREE.AnimationClip('Walking_A',1,[
   new THREE.NumberKeyframeTrack('.rotation[x]',[0,.5,1],[0,.8,0])
  ]),idleClip=new THREE.AnimationClip('Idle',1,[
   new THREE.NumberKeyframeTrack('.rotation[x]',[0,.5,1],[0,0,0])
  ]);
  const mixer=new THREE.AnimationMixer(foot);
  const walk=mixer.clipAction(walkClip).play();
  mixer.update(.13);
  const idle=mixer.clipAction(idleClip).play();
  idle.crossFadeFrom(walk,.23,false);
  const previous=walk.time,originalSpeed=walk.getEffectiveTimeScale();
  walk.setEffectiveTimeScale(originalSpeed*rate);
  mixer.update(.05);
  walk.setEffectiveTimeScale(originalSpeed);
  return {sourceDelta:walk.time-previous,fadeWeight:walk.getEffectiveWeight()};
 }
 const fast=simulatedFade(1),braked=simulatedFade(tiny);
 assert.ok(braked.sourceDelta<fast.sourceDelta*.20,
  'the licensed skinned foot cycle must really slow through a Three.js fade');
 assert.ok(Math.abs(fast.fadeWeight-braked.fadeWeight)<.001,
  'Idle crossfade must continue normally despite original Walking_A speed reduction');
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
  assert.ok(model.includes('planImportedWalkExitBrake({'),
  'actual renderer must calculate brake from witnessed root delta');
 assert.match(model,/walkArrivalPendingAction\.sourceAction|arrival\.sourceAction/,
  'only the authenticated fading Walking_A may be retimed');
 assert.match(model,/setEffectiveTimeScale\(.*exitRate|setEffectiveTimeScale\(.*walkExitRate/,
  'original outgoing source action must receive the temporary braking rate');
});


test('original Walking_A exit braking follows physical root velocity across real desktop/mobile frame rates',async()=>{
  const {planImportedWalkExitBrake:brake}=await load();
  const original={targetMode:'idle',currentMode:'idle',clipName:'Walking_A',
   sourceWeight:.42,sourceRunning:true,sourcePaused:false,
   alive:true,visible:true,teleport:false,reducedMotion:false};
  const at60=brake({...original,groundedTravel:.008,frameInterval:.016});
  const at30=brake({...original,groundedTravel:.016,frameInterval:.032});
  const at20=brake({...original,groundedTravel:.024,frameInterval:.048});
  assert.ok(Number.isFinite(at60)&&at60>0&&at60<1);
  assert.ok(Math.abs(at60-at30)<1e-9&&Math.abs(at60-at20)<1e-9,
   'identical measured m/s may not brake original source feet differently at 60/30/20Hz');
  const slow60=brake({...original,groundedTravel:.0055,frameInterval:.016});
  const slow30=brake({...original,groundedTravel:.0055,frameInterval:.032});
  assert.ok(slow30<slow60/1.99,
   'the same distance over twice the real frame interval is half the physical velocity');
  assert.equal(brake({...original,groundedTravel:.04,frameInterval:.016}),1);
  assert.equal(brake({...original,groundedTravel:.08,frameInterval:.032}),1);
  assert.equal(brake({...original,targetMode:'guard',currentMode:'guard',
   groundedTravel:.008,frameInterval:.016}),at60);
  for(const invalid of [NaN,Infinity,0,-.01,.5])
   assert.equal(brake({...original,groundedTravel:.0055,frameInterval:invalid}),null,
    'no witnessed current frame duration means no retiming of a licensed source clip');
  const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
  assert.ok(model.slice(model.indexOf('const walkExitRate=outgoing?planImportedWalkExitBrake({'),model.indexOf('const walkExitRate=outgoing?planImportedWalkExitBrake({')+650).includes('frameInterval:sourceFrameInterval'),
   'production mixer must use the same witnessed frame interval as the original source step');
});


test('original skinned legs settle into Idle/Guard with bounded stationary source-pose ownership',async()=>{
 const {planSourceRigLandingRelease:release}=await load();
 assert.equal(typeof release,'function','source-rig landing release requires an explicit measured-stop contract');
 const base={mode:'idle',sourceClipName:'Idle',sourceWalkFrozen:true,rootTravel:0,
  visible:true,alive:true,moving:false,teleport:false,reducedMotion:false,
  interrupted:false};
 const at=(elapsed)=>release({...base,elapsed});
 assert.equal(at(0),0,'preserve witnessed original sole/hip pose on initial landed frame');
 assert.equal(at(.02),0,'avoid source knee/ankle jump while original walk first loses weight');
 assert.ok(at(.10)>.05&&at(.10)<.8,'release lower-body support smoothly, not as a new step');
 assert.equal(at(.25),1,'release back to entirely authentic Idle after bounded settling');
 assert.ok(at(.08)<at(.14),'original lower-body handoff must be monotonic');
 assert.equal(release({...base,mode:'guard',elapsed:.10}),at(.10),
  'lawful native guard shares only the same actual frozen-walk settling envelope');
 for(const invalid of [
  {mode:'move'},{mode:'attack'},{mode:'hurt'},{mode:'defeat'},
  {sourceClipName:'Walking_A'},{sourceWalkFrozen:false},
  {rootTravel:.008},{rootTravel:NaN},{rootTravel:-1},
  {moving:true},{visible:false},{alive:false},{teleport:true},
  {reducedMotion:true},{interrupted:true},{elapsed:-.1},{elapsed:Infinity}
 ])assert.equal(release({...base,elapsed:.08,...invalid}),null,
  'no unverified plant, running root, injured actor or interrupted source can inherit frozen support');
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(model,/planSourceRigLandingRelease\(/,
  'the genuine original-GLB mixer must use the bounded native landing planner');
 assert.match(model,/rigGaitBones/,
  'only original imported thigh, calf and ankle bones may receive temporary landing ownership');
});


test('source Walking_A landing preserves original pelvis-to-sole chain while Idle gains ownership',async()=>{
 const {planSourceRigLandingPelvisSupport:pelvisSupport}=await load();
 assert.equal(typeof pelvisSupport,'function',
  'stationary original-source landings must account for the skinned parent pelvis');
 const valid={release:.35,sourcePelvis:true,localTravelMeters:.025,angularTravelRadians:.12};
 assert.equal(pelvisSupport(valid),.35);
 assert.equal(pelvisSupport({...valid,release:0}),0);
 assert.equal(pelvisSupport({...valid,release:1}),1);
 for(const illegal of [
  {sourcePelvis:false},{localTravelMeters:.2},{angularTravelRadians:1.3},
  {localTravelMeters:NaN},{angularTravelRadians:Infinity},
  {release:-.01},{release:1.01}
 ])assert.equal(pelvisSupport({...valid,...illegal}),null,
  'unknown or extreme imported pelvis movement must fail closed');
 const THREE=require('three');
 const pelvis=new THREE.Bone();pelvis.name='hips';pelvis.position.set(0,.9,0);
 const foot=new THREE.Bone();foot.name='footl';foot.position.set(-.2,-.8,0);
 pelvis.add(foot);pelvis.updateWorldMatrix(true,true);
 const originalPosition=pelvis.position.clone(),originalQuaternion=pelvis.quaternion.clone();
 const originalSole=new THREE.Vector3();foot.getWorldPosition(originalSole);
 const idle=new THREE.AnimationClip('Idle',.5,[
  new THREE.VectorKeyframeTrack('.position',[0,.5],[0,.94,0,0,.94,0]),
  new THREE.QuaternionKeyframeTrack('.quaternion',[0,.5],
   [0,0,Math.sin(.13/2),Math.cos(.13/2),
    0,0,Math.sin(.13/2),Math.cos(.13/2)])
 ]);
 const mixer=new THREE.AnimationMixer(pelvis);mixer.clipAction(idle).play();
 mixer.update(.05);pelvis.updateWorldMatrix(true,true);
 const unsustainedSole=new THREE.Vector3();foot.getWorldPosition(unsustainedSole);
 const idlePosition=pelvis.position.clone(),idleQuaternion=pelvis.quaternion.clone();
 pelvis.position.copy(originalPosition).lerp(idlePosition,pelvisSupport(valid));
 pelvis.quaternion.copy(originalQuaternion).slerp(idleQuaternion,pelvisSupport(valid));
 pelvis.updateWorldMatrix(true,true);
 const supportedSole=new THREE.Vector3();foot.getWorldPosition(supportedSole);
 assert.ok(supportedSole.distanceTo(originalSole)<unsustainedSole.distanceTo(originalSole)*.5,
  'an original sole under the inherited pelvis should travel less during a witnessed stop');
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(model,/planSourceRigLandingPelvisSupport\(/,
  'the live Three.js presentation path must validate imported pelvis safety');
 assert.match(model,/landing\.pelvis/,
  'post-mixer landings must blend the original pelvis as well as six leg joints');
});


test('landing-to-walk reentry releases measured original source feet rather than snapping a living skinned leg',async()=>{
 const {planSourceRigWalkReentryRelease:release}=await load();
 assert.equal(typeof release,'function','old original-source landing must transfer into authentic Walking_A on a legal re-entry');
 const legal={mode:'move',previousMode:'idle',sourceClipName:'Walking_A',
  witnessedLanding:true,moving:true,alive:true,visible:true,teleport:false,
  reducedMotion:false,interrupted:false,sourceWeight:.22};
 const at=(elapsed,rootTravelMeters)=>release({...legal,elapsed,rootTravelMeters});
 assert.equal(at(0,0),0,'the previous rendered licensed hip-to-sole pose survives the first re-entry frame');
 assert.ok(at(0,.0046)<.03,'measured 4.6 mm mobile root step must not cause a ~50 mm shoe snap');
 assert.ok(at(.06,.035)>.1&&at(.06,.035)<.8,'valid travel must hand over to genuine licensed walking, not freeze an invented plant');
 assert.equal(at(.14,.01),1,'support expires even when root travel remains slow');
 assert.equal(at(.02,.12),1,'genuine distance immediately releases stance before legs can stretch');
 assert.ok(at(.04,.02)<at(.09,.06),'original source walking must take over monotonically');
 assert.equal(release({...legal,previousMode:'guard',elapsed:.03,rootTravelMeters:.012}),at(.03,.012),
  'legally owned defensive guard re-entry must share the identical source gait gate');
 for(const invalid of [
  {mode:'idle'},{mode:'attack'},{previousMode:'attack'},{sourceClipName:'Idle'},
  {witnessedLanding:false},{moving:false},{alive:false},{visible:false},
  {teleport:true},{reducedMotion:true},{interrupted:true},{sourceWeight:NaN},
  {sourceWeight:-.1},{sourceWeight:1.1},{elapsed:NaN},{elapsed:-.1},
  {rootTravelMeters:-1},{rootTravelMeters:Infinity}
 ])assert.equal(release({...legal,elapsed:.04,rootTravelMeters:.02,...invalid}),null,
  'never bridge after unseen, non-moving, corrupted or interrupted original joint events');
 const THREE=require('three');
 const hips=new THREE.Bone();hips.name='hips';hips.position.set(0,.9,0);
 const sole=new THREE.Bone();sole.name='footl';sole.position.set(-.2,-.85,0);
 hips.add(sole);hips.updateWorldMatrix(true,true);
 const previousHip=hips.position.clone(),previousRotation=hips.quaternion.clone();
 const previousFoot=sole.quaternion.clone();const priorSole=new THREE.Vector3();
 sole.getWorldPosition(priorSole);
 const walk=new THREE.AnimationClip('Walking_A',.25,[
  new THREE.VectorKeyframeTrack('.position',[0,.25],[0,.9,0,0,.96,0]),
  new THREE.QuaternionKeyframeTrack('.quaternion',[0,.25],
   [0,0,0,1,0,0,Math.sin(.2),Math.cos(.2)])
 ]);
 const mixer=new THREE.AnimationMixer(hips);mixer.clipAction(walk).play();
 mixer.update(.05);
 const fromMixerPos=hips.position.clone(),fromMixerRot=hips.quaternion.clone();
 const unbridged=new THREE.Vector3();hips.updateWorldMatrix(true,true);sole.getWorldPosition(unbridged);
 const blend=at(.025,.0046);
 hips.position.copy(previousHip).lerp(fromMixerPos,blend);
 hips.quaternion.copy(previousRotation).slerp(fromMixerRot,blend);
 sole.quaternion.copy(previousFoot).slerp(sole.quaternion,blend);
 hips.updateWorldMatrix(true,true);
 const bridged=new THREE.Vector3();sole.getWorldPosition(bridged);
 assert.ok(bridged.distanceTo(priorSole)<unbridged.distanceTo(priorSole)*.5,
  'actual skinned source-foot hierarchy must show less early transition displacement');
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(model,/planSourceRigWalkReentryRelease\(/,
  'render path must call the same tested source-only re-entry release');
 assert.match(model,/walkLandingReentry/,
  'pose handover must be maintained only on the actor clone through the original mixer');
 assert.match(model,/rigGaitBones/,
  'bridge must use genuine imported knees and ankles, not scene-level fake foot geometry');
});


test('real source-rig low-velocity arrival preserves original ankles while 7mm of residual root travel settles',async()=>{
 const {planSourceWalkMicroArrival:quiet,planImportedWalkArrivalFreeze:freeze,
  shouldFreezeDeferredImportedWalk:deferred,planSourceRigLandingRelease:landing,
  planNativeWalkToGuardGait:guard}=await load();
 assert.equal(typeof quiet,'function','original near-stop requires one physical-velocity witness shared by source planners');
 const mobile={groundedTravel:.007422825818981,frameInterval:.08,
  groundedMoving:false,visible:true,teleport:false,reducedMotion:false};
 const desktop={...mobile,groundedTravel:.003932682360656};
 assert.equal(quiet(mobile),true,'original mobile move-to-idle WebGL sample has ~7.4mm of final root travel');
 assert.equal(quiet(desktop),true,'original desktop move-to-idle WebGL sample has ~3.9mm of final root travel');
 for(const illegal of [
  {groundedTravel:.012},{groundedTravel:.00742,frameInterval:.016},
  {groundedTravel:.35},{groundedMoving:true},{visible:false},
  {teleport:true},{reducedMotion:true},{groundedTravel:NaN},
  {frameInterval:0},{frameInterval:NaN},{frameInterval:.5}
 ])assert.equal(quiet({...mobile,...illegal}),false,
  'rapid movement, unknown timing, concealed frames and teleports never claim a stationary foot');
 const initial={previousMode:'move',nextMode:'idle',previousClipName:'Walking_A',...mobile};
 assert.equal(freeze(initial),true,'original low-velocity outgoing Walking_A must stop cycling during Idle fade');
 assert.equal(freeze({...initial,nextMode:'guard'}),true);
 assert.equal(freeze({...initial,frameInterval:.016}),false,
  'faster equivalent travel remains moving and cannot freeze the shoe');
 const outgoing={targetMode:'idle',currentMode:'idle',clipName:'Walking_A',
  sourceWeight:.35,sourceRunning:true,sourcePaused:false,alive:true,...mobile};
 assert.equal(deferred(outgoing),true,'delayed original Walking_A fade shares the same real near-stop criterion');
 assert.equal(deferred({...outgoing,groundedMoving:true}),false);
 const sourceLanding={mode:'idle',sourceClipName:'Idle',sourceWalkFrozen:true,
  rootTravel:mobile.groundedTravel,frameInterval:mobile.frameInterval,
  elapsed:.085,moving:false,alive:true,visible:true,
  teleport:false,reducedMotion:false,interrupted:false};
 const release=landing(sourceLanding);
 assert.ok(release>0&&release<1,'source pelvis plus six lower-body joints must continue a bounded landing release');
 assert.equal(landing({...sourceLanding,frameInterval:.016}),null);
 assert.equal(guard({mode:'guard',sourceWalkFrozen:true,groundedTravel:mobile.groundedTravel,
  frameInterval:mobile.frameInterval,groundedMoving:false,gaitWeight:.75,
  guardBlend:.2,alive:true,teleport:false,reducedMotion:false}),true);
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(model,/frameInterval:sourceFrameInterval/,'original WebGL frame interval must reach the source motion planners');
});


test('licensed source landing and walking re-entry settle on measured visible-frame time instead of an unrelated 50ms clock',async()=>{
 const {planNativeLandingVisibleDelta:clock}=await load();
 assert.equal(typeof clock,'function','native source hip-to-sole transitions require a shared measured-frame clock');
 const legal={frameDelta:.05,frameInterval:.18,visible:true,reducedMotion:false,teleport:false};
 assert.ok(Math.abs(clock(legal)-.18)<1e-8,
  '180ms actually visible requires 180ms of source-pose release, not a 50ms pseudo-frame');
 assert.ok(Math.abs(clock({...legal,frameInterval:.016})-.016)<1e-8,
  '60Hz source landings preserve the original frame cadence');
 assert.equal(clock({...legal,frameInterval:.8}),.25,
  'slow real WebGL must complete a <=200ms support window without remaining frozen for seconds');
 for(const invalid of [
  {visible:false},{reducedMotion:true},{teleport:true},
  {frameInterval:NaN},{frameInterval:0},{frameInterval:-.02},{frameInterval:4},
  {frameDelta:NaN},{frameDelta:-.01},{frameDelta:.5}
 ])assert.equal(clock({...legal,...invalid}),0,
  'hidden, invalid, interrupted, or stale source samples never preserve unsupported leg/hip support');
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(model,/landing\.elapsed=Math\.min\(2,landing\.elapsed\+planNativeLandingVisibleDelta\(/,
  'real imported six-leg plus pelvis landing must consume the verified visible clock');
 assert.match(model,/reentry\.elapsed=Math\.min\(\.5,reentry\.elapsed\+planNativeLandingVisibleDelta\(/,
  'the next legally witnessed walking cycle must release frozen source hip-to-sole support on the same clock');
 assert.match(model,/frameInterval:sourceFrameInterval/,
  'animation transition timing cannot be inferred from the 50ms mixer step');
});


test('authentic native guard enters and exits on bounded witnessed slow WebGL frames instead of lagging four source frames',async()=>{
 const {advanceFullBodyController:step}=await load();
 const unit=action=>({id:'vanguard',kind:'vanguard',action,actionTick:91,hp:120,maxHp:120});
 const slow={frameDelta:.05,frameInterval:.36,visible:true,reducedMotion:false,teleport:false};
 const guard1=step(null,{...slow,unit:unit('guard')});
 assert.equal(guard1.mode,'guard');
 assert.ok(guard1.guardProgress>=.49&&guard1.guardProgress<=.51,
  'first actual 360ms rendered guard frame must advance a connected partial source-rig pose, not only 50ms');
 assert.ok(guard1.guardBlend>.45&&guard1.guardBlend<.55,
  'pelvis, ankles, chest and original weapon-supporting elbows share the intermediate guard pose');
 const guard2=step(guard1,{...slow,unit:unit('guard')});
 assert.equal(guard2.guardProgress,1,'second witnessed visible frame may finish defensive entry');
 const walking={...slow,unit:unit('move'),grounded:{moving:true,clipAction:'move'}};
 const released1=step(guard2,walking);
 assert.equal(released1.mode,'move');
 assert.equal(released1.owner.guard,false,'guard physical release cannot invent gameplay guard');
 assert.ok(released1.guardProgress>=.49&&released1.guardProgress<=.51,
  'licensed Walking_A reentry must not tear away knee, hip and weapon-arm guard support in one rendered frame');
 assert.equal(step(released1,walking).guardProgress,0,
  'source Walking_A owns the connected body after two witnessed release frames');
 const fast=step(null,{unit:unit('guard'),frameDelta:.016,frameInterval:.016,visible:true});
 assert.ok(Math.abs(fast.guardProgress-.016/.18)<1e-8,
  'normal 60Hz guard pose must preserve the original 180ms timing');
 for(const stopped of [
  {unit:unit('attack')},{unit:unit('move'),teleport:true},{unit:unit('guard'),reducedMotion:true},
  {unit:unit('guard'),visible:false},{unit:{...unit('guard'),hp:0}},
  {unit:unit('idle'),damageBeat:{id:'vanguard',kind:'vanguard',damage:3,maxHp:120,age:.08}},
  {unit:unit('idle'),evasionBeat:{id:'vanguard',kind:'vanguard',tick:91,dx:1,dz:0,age:.12}}
 ])assert.equal(step(guard2,{...slow,...stopped}).guardProgress,0,
  'true injury, evasion, attack, defeat, teleport and accessibility override old guard support immediately');
});


test('original source Walking_A defers a micro-root entry until witnessed travel warrants a leg swing',async()=>{
 const {planNativeWalkStartFromTravel:entry}=await load();
 assert.equal(typeof entry,'function','the original source-rig needs a bounded travel-based walking-entry gate');
 // Original exact-head same-tick desktop source capture saw ~5mm root
 // movement while an imported skinned foot point shifted ~163mm.
 // A foot kick based on a source crossfade is not itself real travel.
 const base={mode:'move',previousMode:'idle',sourceClipName:'Walking_A',
  groundedMoving:true,groundedTravel:.005,frameInterval:.08,
  pendingMeters:0,alive:true,visible:true,teleport:false,
  reducedMotion:false,interrupted:false};
 const a=entry(base);
 assert.deepEqual(a,{defer:true,pendingMeters:.005},
  'the first very-low-velocity original-GLB move frame keeps Idle');
 const b=entry({...base,groundedTravel:.007,pendingMeters:a.pendingMeters});
 assert.deepEqual(b,{defer:true,pendingMeters:.012},
  'several genuine millimetre movements accumulate without being discarded');
 assert.deepEqual(entry({...base,groundedTravel:.014,pendingMeters:b.pendingMeters}),
  {defer:false,pendingMeters:0},
  'after 26mm cumulative witnessed travel the authentic Walking_A must enter');
 assert.deepEqual(entry({...base,groundedTravel:.12}),
  {defer:false,pendingMeters:0},'real movement starts source walking immediately');
 assert.deepEqual(entry({...base,groundedTravel:.005,frameInterval:.016}),
  {defer:false,pendingMeters:0},'a genuine normal-frame step is never delayed');
 assert.deepEqual(entry({...base,previousMode:'guard'}),
  a,'lawfully released guard retains the same physical source-entry contract');
 for(const invalid of [
  {mode:'idle'},{mode:'attack'},{previousMode:'attack'},
  {sourceClipName:'Idle'},{sourceClipName:'NoClip'}, {groundedMoving:false},
  {alive:false},{visible:false},{teleport:true},{reducedMotion:true},
  {interrupted:true},{groundedTravel:NaN},{groundedTravel:-.01},
  {frameInterval:0},{frameInterval:NaN},{frameInterval:3},
  {pendingMeters:NaN},{pendingMeters:-1}
 ])assert.deepEqual(entry({...base,...invalid}),{defer:false,pendingMeters:0},
  'no stale source-walk suppression may survive unsupported input '+JSON.stringify(invalid));
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(model,/planNativeWalkStartFromTravel\(/,
  'the actual imported Three.js changeAction must use the real travel gate');
 assert.match(model,/if\(nativeWalkEntry\.defer\)return;/,
  'only the exact original source action is deferred, not authoritative movement');
});

test('original source Idle does not inherit an unearned parallel full-body stride during sub-24mm walk entry or slow-frame arrival',async()=>{
 const {planNativeSourceIdleGaitFrame:handoff,planNativeWalkStartFromTravel:entry}=await load();
 assert.equal(typeof handoff,'function',
  'the original 41-joint source Idle/Walking_A boundary needs one connected native gait clock');
 const sourceIdle={mode:'move',sourceAction:'idle',sourceClipName:'Idle',
  pendingMeters:.005,groundedMoving:true,alive:true,visible:true,
  teleport:false,reducedMotion:false,interrupted:false,
  frameDelta:.05,frameInterval:.36};
 const held=handoff(sourceIdle);
 assert.equal(held.suppress,true,
  'source Walking_A has not started: do not swing skinned thighs/soles or the pelvis twice on 5mm real travel');
 assert.equal(held.releaseDelta,.05,'entry hold may not manufacture extra elapsed source motion');
 const initial=entry({mode:'move',previousMode:'idle',sourceClipName:'Walking_A',
  groundedMoving:true,groundedTravel:0,frameInterval:.36,pendingMeters:0,
  alive:true,visible:true,teleport:false,reducedMotion:false,interrupted:false});
 assert.deepEqual(initial,{defer:true,pendingMeters:0},
  'the authentic source walking clip must wait while the legal move root is stationary');
 assert.equal(handoff({...sourceIdle,pendingMeters:initial.pendingMeters}).suppress,true,
  'zero actual root distance must not restart a synthetic pelvis/sole gait while original Idle owns the full body');

 assert.equal(handoff({...sourceIdle,sourceAction:'guard'}).suppress,true,
  'a real guard-to-walk micro-entry keeps the same witnessed original source foot');
 for(const overridden of [
  {mode:'idle'},{mode:'attack'},{sourceAction:'move'},
  {sourceClipName:'Walking_A'},{sourceClipName:'NoRig'},
  {pendingMeters:.024},{pendingMeters:NaN},
  {pendingMeters:-1},{groundedMoving:false},{alive:false},
  {visible:false},{teleport:true},{reducedMotion:true},{interrupted:true}
 ])assert.equal(handoff({...sourceIdle,...overridden}).suppress,false,
  'a stale or unsupported Idle source cannot conceal legitimate motion '+JSON.stringify(overridden));
 const release=handoff({...sourceIdle,mode:'idle',pendingMeters:0,
  groundedMoving:false,frameDelta:.05,frameInterval:.36});
 assert.equal(release.suppress,false);
 assert.equal(release.releaseDelta,.09,
  'a 360ms real GLB display should not drag a stopped imported Idle gait through seven 50ms pseudo-frames');
 assert.equal(handoff({...sourceIdle,mode:'guard',pendingMeters:0,
  groundedMoving:false}).releaseDelta,.09,
  'guard arrival uses the same source pelvis-to-sole visible-frame deceleration');
 assert.equal(handoff({...sourceIdle,mode:'idle',pendingMeters:0,
  groundedMoving:false,frameDelta:.016,frameInterval:.016}).releaseDelta,.016,
  'normal 60Hz release must keep original native 160ms gait cadence');
 for(const bad of [{frameInterval:NaN},{frameInterval:3},
  {frameInterval:0},{frameDelta:NaN},{frameDelta:.35},{visible:false},
  {teleport:true},{reducedMotion:true},{alive:false}])
  assert.equal(handoff({...sourceIdle,mode:'idle',pendingMeters:0,
   groundedMoving:false,...bad}).releaseDelta,0,
   'broken or unsupported original frame clocks may not advance an invented gait '+JSON.stringify(bad));
 const rig=await import('data:text/javascript;base64,'+
  Buffer.from(fs.readFileSync(path.join(root,'public/ai-dungeon/rig-attachment-plan.js'),'utf8')).toString('base64'));
 const leaked=rig.advanceRigGait(0,0,.005,false,.016);
 const protectedPose=rig.advanceRigGait(0,0,.005,held.suppress,held.releaseDelta);
 assert.ok(leaked.weight>.5,'the old unguarded 5mm independent stride visibly inherits at least half-weight');
 assert.deepEqual(protectedPose,{phase:0,weight:0},
  'authentic Idle keeps sole, pelvis and source weapon-supporting shoulders quiet during the deferred clip');
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(model,/planNativeSourceIdleGaitFrame\(/,
  'the original Three.js imported rig must run the gait owner on every real visual frame');
 assert.match(model,/const hardStop=[\s\S]{0,320}\|\|sourceIdleHandoff\.suppress/,
  'no old sine-driven full-body gait may bypass the original Walking_A micro-entry hold');
 assert.match(model,/advanceRigGait\(actor\.rigGaitPhase,actor\.rigGaitWeight,[\s\S]{0,140}sourceIdleHandoff\.releaseDelta\)/,
  'the actual imported pelvis and ankle deceleration must consume the real bounded frame clock');
 assert.match(model,/sourceIdleHandoffHeld:/,
  'on-demand original skinned-rig evidence must expose the source pose handoff without runtime skin scanning');
});

test('licensed full-body Walking_A gets sustained distance-truthful root travel instead of two sampled lunges',async()=>{
 // Real original-GLB rAF evidence from Actions #42926407221: of 42 actual
 // 1440px callbacks only two adjacent source-move pairs qualified. At 390px,
 // only two; the one-metre authority cell was visually traversed in too few
 // rendered poses to evaluate a planted heel/toe or authentic walk cadence.
 // The root goal remains solely the unmodified authoritative destination.
 const source=fs.readFileSync(path.join(root,
  'public/ai-dungeon/expedition-locomotion-plan.js'),'utf8');
 const {planExpeditionStep}=await import('data:text/javascript;base64,'+
  Buffer.from(source).toString('base64'));
 const dt=.08, ordinary=planExpeditionStep(0,0,1,0,dt);
 const sourceRig=planExpeditionStep(0,0,1,0,dt,{originalSourceRig:true});
 assert.ok(sourceRig.travel>=.15&&sourceRig.travel<=.22,
  'source-skinned root must take a shorter REAL interpolated step than the old 280mm sparse-frame lunge');
 assert.ok(sourceRig.travel<ordinary.travel-.04,
  'original Walking_A must receive more actual displayed travel samples than the procedural fallback');
 assert.equal(sourceRig.x,sourceRig.travel);
 assert.equal(sourceRig.z,0);
 let x=0,meaningful=0;
 for(let sample=0;sample<8;sample++){
  const beat=planExpeditionStep(x,0,1,0,dt,{originalSourceRig:true});
  assert.equal(beat.teleport,false);
  assert.ok(beat.x>=x&&beat.x<=1&&beat.travel>=0,
   'the source rig may neither invent a destination nor walk past the authoritative cell');
  if(beat.travel>.035)meaningful++;
  x=beat.x;
 }
 assert.ok(meaningful>=7,
  'at real 80ms WebGL refresh the licensed Walking_A should show at least seven substantial moving poses');
 assert.ok(x>.90&&x<1,'source animation must approach the real target without indefinite lag');
 const far=planExpeditionStep(0,0,9,0,dt,{originalSourceRig:true});
 assert.equal(far.teleport,true,'authoritative floor change remains immediate, never a walked staircase');
 assert.equal(far.travel,0);
 const accessible=planExpeditionStep(0,0,1,0,dt,{originalSourceRig:true,reducedMotion:true});
 assert.equal(accessible.travel,0,'accessibility movement is not replaced with invented skeletal traversal');
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 assert.match(app,/planExpeditionStep\(a\.root\.position\.x,a\.root\.position\.z,[\s\S]{0,120}originalSourceRig:Boolean\(a\.authored\)/,
  'native source-rig pacing must actually connect to the genuine visual root, not remain a dead helper');
});

test('licensed source-sole landmarks reject high boot uppers and ungrounded patch guesses',async()=>{
 const {selectOriginalOutsolePatchVertices:pick}=await load();
 assert.equal(typeof pick,'function','the real GLB patch selector must use a bounded low-bind outsole');
 const source=[
  {index:4,x:0,z:-.105,bindY:.001,weight:.91},
  {index:5,x:0,z:.104,bindY:.006,weight:.94},
  {index:6,x:0,z:-.18,bindY:.102,weight:.98},
  {index:7,x:0,z:.19,bindY:.119,weight:.99},
  {index:8,x:.029,z:0,bindY:.012,weight:.62},
  {index:9,x:-.028,z:0,bindY:.014,weight:.65}
 ];
 const selected=pick(source,0);
 assert.ok(selected,'two genuine widely separated low weighted outsole points exist');
 assert.deepEqual([selected.heel.index,selected.toe.index].sort((a,b)=>a-b),[4,5],
  'the source foot patch cannot use a 10-12cm higher instep/upper boot vertex');
 assert.ok(selected.spanMeters>.18&&selected.spanMeters<.25);
 assert.ok(selected.bindThicknessMeters<=.032);
 assert.equal(pick(source.map(v=>({...v,bindY:v.bindY+.20})),0),null,
  'no observed source sole: do not invent landmarks');
 assert.equal(pick([{index:1,x:0,z:0,bindY:0,weight:.99}],0),null);
 assert.equal(pick(source.map(v=>({...v,x:0,z:0})),0),null,
  'a source foot cluster without horizontal reach is not a heel/toe patch');
 assert.equal(pick(source.map(v=>({...v,weight:.1})),0),null,
  'unweighted props must never masquerade as original skinned shoes');
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(model,/selectOriginalOutsolePatchVertices\(candidates,anchor\.bindY\)/,
  'the runtime on-demand real GLB inspector must use the identical tested outsole contract');
});


test('original source foot-to-toes bind axis rejects false lateral shoe extrema before any IK',async()=>{
 const {planOriginalSourceToeBindAxis:axis,selectOriginalOutsolePatchVertices:pick}=await load();
 assert.equal(typeof axis,'function');
 const sourceAxis=axis({footBind:[0,.12,-.04],toesBind:[.03,.09,.14],
  originalFootChain:true,source:'original-skeleton-inverse-bind'});
 assert.ok(sourceAxis,'original foot and toes deform joints establish a real longitudinal reference');
 assert.ok(sourceAxis.forwardZ>.9&&sourceAxis.forwardX>0&&sourceAxis.forwardX<.25);
 const samples=[
  {index:1,x:-.02,z:-.15,bindY:.003,weight:.92},
  {index:2,x:.03,z:.16,bindY:.004,weight:.90},
  {index:3,x:-.20,z:0,bindY:.01,weight:.91},
  {index:4,x:.21,z:.01,bindY:.011,weight:.93}
 ];
 const untrusted=pick(samples,0);
 assert.equal(untrusted.anatomicalHeelToeVerified,false,
  'lateral extremes alone cannot certify actual source heel and toe');
 const anatomical=pick(samples,0,sourceAxis);
 assert.deepEqual([anatomical.heel.index,anatomical.toe.index],[1,2],
  'foot-to-toes inverse-bind axis must beat wider sideways costume geometry');
 assert.equal(anatomical.anatomicalHeelToeVerified,true);
 assert.equal(anatomical.source,'original-foot-to-toes-inverse-bind-axis');
 assert.ok(anatomical.spanMeters>.25&&anatomical.spanMeters<.4);
 for(const wrong of [
  {footBind:[0,0,0],toesBind:[0,0,0],originalFootChain:true,source:'original-skeleton-inverse-bind'},
  {footBind:[0,0,0],toesBind:[0,.3,0],originalFootChain:true,source:'original-skeleton-inverse-bind'},
  {footBind:[0,0,0],toesBind:[2,0,0],originalFootChain:true,source:'original-skeleton-inverse-bind'},
  {footBind:[0,0,0],toesBind:[0,0,.14],originalFootChain:false,source:'original-skeleton-inverse-bind'},
  {footBind:[0,0,0],toesBind:[0,0,.14],originalFootChain:true,source:'guessed'},
  {footBind:[NaN,0,0],toesBind:[0,0,.14],originalFootChain:true,source:'original-skeleton-inverse-bind'}
 ])assert.equal(axis(wrong),null,'never infer anatomical direction from invalid or disconnected rigs');
 assert.equal(pick(samples,0,{source:'guessed',forwardX:0,forwardZ:1}),null,
  'a fabricated axis must not certify contact');
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(model,/planOriginalSourceToeBindAxis\(/,
  'only the real SkeletonUtils-cloned source GLB should provide anatomical foot/toe bind evidence');
});



test('real original ankle trials prefer heel-safe deeper swing correction only with actual source shoe proof',async()=>{
 const {selectOriginalSourceSwingAnkleTrial:choose,planOriginalSourceSwingToeClearance:plan,
  confirmOriginalSourceSwingToeLift:confirm}=await load();
 assert.equal(typeof choose,'function');
 const observed={toeWorldY:-.1033,heelWorldY:.0861,floorTopY:-.02,
  trials:[{signed:-.1,toe:-.088,heel:.081},
   {signed:.1,toe:-.11,heel:.09},
   {signed:-.2,toe:-.063,heel:.071},
   {signed:.2,toe:-.049,heel:-.019}]};
 const selected=choose(observed);
 assert.equal(selected?.signed,-.2,'the apparently strongest toe trial has a dangerously sunken source heel');
 assert.equal(selected?.toe,-.063);
 assert.equal(choose({...observed,trials:[observed.trials[3]]}),null,
  'never accept a high toe that collapses its original skinned heel into stone');
 assert.equal(choose({...observed,trials:[{signed:-.3,toe:-.04,heel:.08}]}),null,
  'unsupported source knee/foot rotation is not a legal trial');
 const body={mode:'move',sourceClipName:'Walking_A',sourceAnatomyVerified:true,
  sourceWeight:1,alive:true,visible:true,groundedMoving:true,teleport:false,
  reducedMotion:false,interrupted:false,rootTravel:.0655,floorTopY:-.02,
  heelWorldY:.0861,toeWorldY:-.1033,previousCorrectionRad:-.14};
 const shallow=plan({...body,trialToeWorldY:-.088,trialAngleRad:-.1});
 const deep=plan({...body,trialToeWorldY:selected.toe,trialAngleRad:selected.signed});
 assert.ok(deep<-.15&&deep>shallow+.015&&Math.abs(deep)<=.22,
  'the deeper genuine toe trial achieves the source lift with less required ankle pitch, retaining a bounded 0.08rad/frame rate');
 const measured=confirm({beforeToeY:-.1033,afterToeY:-.059,beforeHeelY:.0861,
  afterHeelY:.071,floorTopY:-.02,appliedAngleRad:-.16});
 assert.ok(measured>.04&&measured<.05,'real applied original joint must raise actual skinned toe');
 assert.equal(confirm({beforeToeY:-.1033,afterToeY:-.059,beforeHeelY:.0861,
  afterHeelY:-.019,floorTopY:-.02,appliedAngleRad:-.16}),null,
  'original heel collision invalidates an apparent toe benefit');
 assert.equal(plan({...body,mode:'attack',trialToeWorldY:-.063,trialAngleRad:-.2}),0);
 assert.equal(plan({...body,reducedMotion:true,trialToeWorldY:-.063,trialAngleRad:-.2}),0);
 const renderer=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(renderer,/selectOriginalSourceSwingAnkleTrial\(/);
 assert.match(renderer,/signed of \[-\.1,\.1,-\.2,\.2\]/);
});

test('original Walking_A airborne toe drag uses bounded observed source-foot pitch, never invented stance IK',async()=>{
 const {planOriginalSourceSwingToeClearance:plan}=await load();
 assert.equal(typeof plan,'function','native source swing-foot clearance correction must be testable');
 // Exact original GLB mobile moving rAF: heel 177mm above stone, true toe
 // 63mm below stone, source inverse-bind foot->toes anatomy independently verified.
 const witness={mode:'move',sourceClipName:'Walking_A',sourceAnatomyVerified:true,
  sourceWeight:1,alive:true,visible:true,groundedMoving:true,teleport:false,
  reducedMotion:false,interrupted:false,rootTravel:.0655,
  floorTopY:-.02,heelWorldY:.157,toeWorldY:-.083,
  trialToeWorldY:-.064,trialAngleRad:-.10,previousCorrectionRad:0};
 const lift=plan(witness);
 assert.ok(lift<-.005&&lift>=-.08-1e-9,
  'real original-foot rotation must lift submerged toe smoothly, without a large joint snap');
 assert.ok(lift>=-.16,'finite bounded ankle correction, not a full arbitrary IK solution');
 assert.equal(plan({...witness,toeWorldY:.011}),0,'already clear original source toe is untouched');
 assert.equal(plan({...witness,heelWorldY:-.008}),0,
  'weight-bearing stance foot must not receive swing-foot toe clearance');
 for(const invalid of [
  {mode:'attack'},{sourceClipName:'Idle'},{sourceAnatomyVerified:false},
  {sourceWeight:.45},{rootTravel:0},{rootTravel:.6},{alive:false},
  {visible:false},{groundedMoving:false},{teleport:true},{reducedMotion:true},
  {interrupted:true},{floorTopY:.12},{toeWorldY:NaN},
  {trialToeWorldY:-.10},{trialAngleRad:.4},{previousCorrectionRad:NaN}
 ])assert.equal(plan({...witness,...invalid}),0,
  'unverified source pose may not rotate an imported ankle: '+JSON.stringify(invalid));
 const sourceModel=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(sourceModel,/planOriginalSourceSwingToeClearance\(/,
  'the actual live imported 41-joint original-rig animator must invoke the tested correction');
 assert.match(sourceModel,/sourceSolePatchVertexCandidates\(/,
  'only verified original inverse-bind and skinned shoe patches may drive the ankle');
});


test('native original swing toe may carry ONLY recently witnessed travel across honest same-tick source frames',async()=>{
 const {advanceOriginalSourceSwingTravelWitness:advance}=await load();
 assert.equal(typeof advance,'function','the real source gait needs bounded witness memory, not per-render fake movement');
 const actual={mode:'move',walkingClip:true,alive:true,visible:true,
  teleport:false,reducedMotion:false,interrupted:false};
 const first=advance({...actual,travel:.0655,frameInterval:.035});
 assert.ok(first.travel>.065&&first.travel<.066&&first.age===0,
  'only a real legal root displacement can initialize the source-foot witness');
 const hold=advance({...actual,travel:0,frameInterval:.07,
  previousTravel:first.travel,previousAge:first.age});
 assert.equal(hold.travel,first.travel,
  'same original walking owner and licensed clip retain last real step while source poses follow');
 assert.ok(hold.age>.069&&hold.age<.071);
 const within=advance({...actual,travel:0,frameInterval:.07,
  previousTravel:hold.travel,previousAge:hold.age});
 assert.equal(within.travel,first.travel,'second actual displayed frame still has the original root witness');
 const expired=advance({...actual,travel:0,frameInterval:.07,
  previousTravel:within.travel,previousAge:within.age});
 assert.equal(expired.travel,0,'no new authority step: expire after 180ms');
 for(const invalid of [
  {mode:'idle'},{walkingClip:false},{alive:false},{visible:false},
  {teleport:true},{reducedMotion:true},{interrupted:true},
  {travel:.6},{travel:NaN},{previousTravel:Infinity},
  {previousAge:NaN},{frameInterval:NaN},{frameInterval:.8}
 ])assert.equal(advance({...actual,travel:0,previousTravel:first.travel,
  previousAge:0,frameInterval:.06,...invalid}).travel,0,
  'never carry a fabricated/stale/out-of-owner step: '+JSON.stringify(invalid));
 const render=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(render,/advanceOriginalSourceSwingTravelWitness\(/);
 assert.match(render,/rigRecentGroundedTravel/,
  'bounded original-source witness must be forwarded to the actual skinned ankle probe');
});


test('original GLB ankle clearance must retain witnessed Walking_A travel through legitimate same-tick floor-motion lull',async()=>{
 const {hasOriginalSourceSwingTravelWitness:hasWitness}=await load();
 assert.equal(typeof hasWitness,'function',
  'source ankle clearance needs its own validated moving-rig witness rather than an empty same-tick ground stamp');
 const real={mode:'move',sourceClipName:'Walking_A',sourceWeight:1,
  ownerLocomotion:true,travel:.0655,age:.07,alive:true,visible:true,
  teleport:false,reducedMotion:false,interrupted:false};
 assert.equal(hasWitness({...real,sourceClipName:'Walking A'}),true,
  'licensed clip separators preserve the original source walking owner');
 assert.equal(hasWitness({...real,sourceClipName:'Walking-A'}),true);
 assert.equal(hasWitness(real),true,
  'a genuine recent root displacement remains lawful while the original source clip advances within one authority tick');
 for(const invalid of [
  {mode:'idle'},{sourceClipName:'Idle'},{sourceWeight:.45},
  {ownerLocomotion:false},{travel:0},{travel:.4},{age:.181},
  {age:NaN},{alive:false},{visible:false},{teleport:true},
  {reducedMotion:true},{interrupted:true}
 ])assert.equal(hasWitness({...real,...invalid}),false,
  'source probe must fail closed on invalid or expired motion: '+JSON.stringify(invalid));
 const renderer=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(renderer,/hasOriginalSourceSwingTravelWitness\(/,
  'the real licensed ankle stage must consume the validated bounded travel witness');
 assert.doesNotMatch(renderer,/!actor\.groundedPerformance\?\.moving\|\|\s*!\/\^walking/,
  'a same-tick ground-stamp lull is not a reason to reject existing lawful source Walking_A travel');
});


test('crossfading Walking_A may lift only observed airborne source toes while original mixer still owns the walk',async()=>{
 const {hasOriginalSourceSwingTravelWitness:has,planOriginalSourceSwingToeClearance:plan}=await load();
 // Original 11-Nov-2026 same-source WebGL actor at legal root travel:
 // desktop 0.579565, mobile 0.506957 effective Walking_A weight.
 // Previous >.90 gate discarded every lawful swing witness at these frames.
 const live={mode:'move',sourceClipName:'Walking_A',sourceWeight:.58,
  ownerLocomotion:true,travel:.0193,age:.05,alive:true,visible:true,
  teleport:false,reducedMotion:false,interrupted:false};
 assert.equal(has(live),true,'a witnessed original moving crossfade is still licensed locomotion');
 assert.equal(has({...live,sourceWeight:.45}),false,'Idle-dominated blend cannot claim an original walking toe');
 const measured={mode:'move',sourceClipName:'Walking_A',sourceAnatomyVerified:true,
  sourceWeight:.58,alive:true,visible:true,groundedMoving:true,
  teleport:false,reducedMotion:false,interrupted:false,rootTravel:.0193,
  floorTopY:-.02,heelWorldY:.157,toeWorldY:-.083,
  trialToeWorldY:-.064,trialAngleRad:-.1,previousCorrectionRad:0};
 const blended=plan(measured);
 const full=plan({...measured,sourceWeight:1});
 assert.ok(blended<-.001&&Math.abs(blended)<Math.abs(full),
  'source crossfade must allow a continuous, smaller genuine-toe correction');
 assert.equal(plan({...measured,sourceWeight:.45}),0);
 assert.equal(plan({...measured,mode:'hurt'}),0);
 assert.equal(plan({...measured,heelWorldY:-.013}),0,
  'a loaded/planted heel must never be pitched by swing-only correction');
 assert.equal(plan({...measured,reducedMotion:true}),0);
});


test('actual applied licensed swing ankle must prove upward weighted toe without losing airborne heel',async()=>{
 const {confirmOriginalSourceSwingToeLift:prove}=await load();
 assert.equal(typeof prove,'function');
 const original={beforeToeY:-.083,afterToeY:-.072,beforeHeelY:.157,
  afterHeelY:.149,floorTopY:-.02,appliedAngleRad:-.074};
 assert.ok(prove(original)>.01&&prove(original)<.012);
 for(const invalid of [
  {afterToeY:-.087},{afterToeY:-.0825},{afterToeY:.015},
  {beforeHeelY:-.015},{afterHeelY:-.001},
  {afterHeelY:NaN},{floorTopY:.2},{appliedAngleRad:.3},
  {appliedAngleRad:0},{beforeToeY:.02},{afterToeY:Infinity}
 ])assert.equal(prove({...original,...invalid}),null,
  'source-skinned actual foot cannot certify an ungrounded/unsafe lift: '+JSON.stringify(invalid));
 const renderer=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(renderer,/confirmOriginalSourceSwingToeLift\(/);
 assert.match(renderer,/sourceSwingToeLiftProof/);
});


test('original swing calf chain assists only anatomically verified airborne toe drag beyond proven ankle clearance',async()=>{
 const {planOriginalSourceSwingCalfAssist:plan}=await load();
 assert.equal(typeof plan,'function','source-legged knee bend must have a fail-closed real-sole contract');
 const measured={
  mode:'move',sourceClipName:'Walking_A',sourceAnatomyVerified:true,
  sourceLegChainVerified:true,sourceWeight:.75,ownerLocomotion:true,
  alive:true,visible:true,teleport:false,reducedMotion:false,interrupted:false,
  rootTravel:.046,frameAge:.055,floorTopY:-.02,
  afterAnkleToeY:-.1033,afterAnkleHeelY:.0861,ankleLiftMeters:.0099,
  trialCalfToeY:-.0813,trialCalfHeelY:.078,trialAngleRad:-.1,
  previousAssistRad:0
 };
 const candidate=plan(measured);
 assert.ok(candidate<-.006&&candidate>=-.061,
  'native calf helps truly airborne original foot without snapping more than .06rad');
 assert.equal(plan({...measured,sourceWeight:.5}),0,
  'barely entered source crossfade cannot drive a knee bend');
 assert.ok(Math.abs(plan({...measured,sourceWeight:1}))>=Math.abs(candidate),
  'the action owner must scale the skinned calf rather than stealing idle bones');
 for(const change of [
  {mode:'idle'},{sourceClipName:'Idle'},{sourceAnatomyVerified:false},
  {sourceLegChainVerified:false},{ownerLocomotion:false},{alive:false},
  {visible:false},{teleport:true},{reducedMotion:true},{interrupted:true},
  {rootTravel:0},{rootTravel:.3},{frameAge:.181},
  {afterAnkleToeY:-.035},{afterAnkleHeelY:-.019},
  {ankleLiftMeters:0},{trialCalfToeY:-.106},
  {trialCalfHeelY:-.02},{trialAngleRad:.4},
  {sourceWeight:.49},{sourceWeight:NaN},
  {previousAssistRad:.4},{trialCalfToeY:Infinity}
 ])assert.equal(plan({...measured,...change}),0,
  'original source calf cannot invent body support: '+JSON.stringify(change));
 const renderer=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(renderer,/planOriginalSourceSwingCalfAssist\(/,
  'renderer must consume the validated calf support plan on original source joints');
 assert.match(renderer,/sourceSwingCalfAssistProof/,
  'only genuine post-mixer foot movement can witness native calf assistance');
});


test('source calf trial selection must reject an unsafe high-toe pose in favour of a lower but anatomically supported lift',async()=>{
 const {selectOriginalSourceSwingCalfTrial:choose}=await load();
 assert.equal(typeof choose,'function');
 const measured={
  afterAnkleToeY:-.073346,afterAnkleHeelY:.124821,floorTopY:-.02,
  trials:[
   {signed:-.1,toe:-.052,heel:.014}, // strongest toe but unsafe collapsing heel
   {signed:.1,toe:-.063,heel:.118} // positive witnessed lift and retained heel clearance
  ]
 };
 const best=choose(measured);
 assert.equal(best?.signed,.1,
  'do not discard a safe original knee bend because the opposite trial has a larger toe lift but collapses the source heel');
 assert.ok(best.toe>measured.afterAnkleToeY+.008);
 assert.equal(choose({...measured,trials:[measured.trials[0]]}),null,
  'a physically unsafe original heel must never authorize calf flexion');
 for(const invalid of [
  {afterAnkleToeY:NaN},{afterAnkleHeelY:NaN},{floorTopY:.2},
  {trials:[{signed:.1,toe:-.065,heel:NaN}]},
  {trials:[{signed:.1,toe:-.065,heel:.0}]},
  {trials:[{signed:.25,toe:-.061,heel:.12}]},
  {trials:[{signed:.2,toe:-.061,heel:-.012}]},
  {trials:[{signed:.1,toe:-.072,heel:.12}]},
  {trials:[{signed:.1,toe:.03,heel:.12}]}
 ])assert.equal(choose({...measured,...invalid}),null,
  'reject missing/unsafe original-skin trial: '+JSON.stringify(invalid));
 const renderer=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(renderer,/selectOriginalSourceSwingCalfTrial\(/,
  'connected original calf stage must select the safest genuinely measured source-foot trial');
});


test('original skinned ankle/calf must never apply a stale correction opposite to the measured source toe-lift direction',async()=>{
 const {planOriginalSourceSwingToeClearance:ankle,
  planOriginalSourceSwingCalfAssist:calf}=await load();
 // Genuine CC0 1440px source swing at tick 6: toe -0.06817,
 // airborne heel +0.16178, original 0.1rad ankle trial raised the toe.
 const sourceAnkle={
  mode:'move',sourceClipName:'Walking_A',sourceAnatomyVerified:true,
  sourceWeight:.75,alive:true,visible:true,groundedMoving:true,
  teleport:false,reducedMotion:false,interrupted:false,rootTravel:.046,
  floorTopY:-.02,heelWorldY:.1617753,toeWorldY:-.06817486,
  trialToeWorldY:-.052,trialAngleRad:.1,previousCorrectionRad:-.14
 };
 assert.equal(ankle(sourceAnkle),0,
  'the old negative correction cannot lower a shoe when the latest signed original trial lifted it positively');
 assert.equal(ankle({...sourceAnkle,sourceWeight:.5}),0,
  'a zero-share Walking_A crossfade must not leak an old wrong-signed ankle bend');
 const negativeTrial={...sourceAnkle,trialAngleRad:-.1,previousCorrectionRad:.14};
 assert.equal(ankle(negativeTrial),0,
  'the inverse source-foot direction change must also drop stale opposite signed pitch');
 assert.ok(ankle({...sourceAnkle,previousCorrectionRad:0})>0,
  'genuine positive trial remains available on a clean original source pose');
 const sourceCalf={
  mode:'move',sourceClipName:'Walking_A',sourceAnatomyVerified:true,
  sourceLegChainVerified:true,sourceWeight:.75,ownerLocomotion:true,
  alive:true,visible:true,teleport:false,reducedMotion:false,interrupted:false,
  rootTravel:.046,frameAge:.05,floorTopY:-.02,afterAnkleToeY:-.1033,
  afterAnkleHeelY:.0861,ankleLiftMeters:.0099,
  trialCalfToeY:-.0813,trialCalfHeelY:.078,trialAngleRad:.1,
  previousAssistRad:-.12
 };
 assert.equal(calf(sourceCalf),0,
  'the next original knee trial cannot reuse the old physically opposing knee bend');
 assert.equal(calf({...sourceCalf,sourceWeight:.5}),0,
  'zero inherited clip share suppresses stale knee support as well');
 assert.equal(calf({...sourceCalf,trialAngleRad:-.1,previousAssistRad:.12}),0,
  'inverse knee trial must not apply an opposite remembered assist');
 assert.ok(calf({...sourceCalf,previousAssistRad:0})>0,
  'unchanged valid source-knee trial still returns a bounded helpful bend');
 const original=ankle({...sourceAnkle,previousCorrectionRad:0,trialAngleRad:-.1,
  trialToeWorldY:-.052});
 assert.ok(original<0,'unchanged legally measured native minus pitch is still available');
});


test('original source-skin swing witness is mixer-frame owned and bounded by real 0.22rad ankle envelope',async()=>{
 const {confirmOriginalSourceSwingToeLift:confirm}=await load();
 const witnessed={beforeToeY:-.1033,afterToeY:-.059,beforeHeelY:.0861,afterHeelY:.071,floorTopY:-.02,appliedAngleRad:-.16};
 assert.ok(confirm(witnessed)>.04);
 assert.equal(confirm({...witnessed,appliedAngleRad:-.231}),null);
 const renderer=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(renderer,/actor\.sourceSwingToeCorrectionsThisFrame=0;/);
 assert.match(renderer,/sourceSwingToeCurrentFrameProofs\.left=null;/);
 assert.match(renderer,/sourceSwingToeCurrentFrameProofs\.right=null;/);
 assert.match(renderer,/sourceSwingToeCurrentFrameProofs\[mount\.side\]=actor\.sourceSwingToeLiftProof;/);
 const browser=fs.readFileSync(path.join(root,'tests/browser/dungeon-full-body-animation.spec.cjs'),'utf8');
 assert.match(browser,/original-source-swing-frame-foot-witness/);
 assert.match(browser,/toBeLessThanOrEqual\(\.221\)/);
});


test('pinned original 41-joint right knee at 89 degrees must not be misclassified as a degenerate bend',async()=>{
 const {assessImportedSourceKneeGeometry:assess}=await load();
 // Real desktop 11-Nov-2026 original Walking_A right chain:
 // measured world bend sine 0.99950878465, exact same-skin asset-space
 // lengths .17067010418/.11231610542m and inverse-bind lengths matched.
 // A 90-degree leg bend has MAXIMAL plane normal; only a nearly straight
 // or collapsed leg has an ill-conditioned cross-product.
 const physical={
  upperLength:.1706701041811571,lowerLength:.11231610541851929,
  bendSine:.9995087846520136,hingeAlignment:.99968,
  sourceBindUpperLength:.17067002536856543,
  sourceBindLowerLength:.11231605296387505
 };
 assert.deepEqual(assess(physical),{
  accepted:true,reason:'verified-source-knee-plane-from-inverse-bind'
 },'real well-conditioned original heel-safe knee trial must reach the same-skinned-foot selector');
 for(const invalid of [
  {bendSine:.035},{bendSine:0},{bendSine:1.0001},
  {bendSine:NaN},{hingeAlignment:.69},
  {sourceBindUpperLength:.3},{sourceBindLowerLength:.21},
  {lowerLength:.02}
 ])assert.equal(assess({...physical,...invalid}).accepted,false,
  'never bypass invalid original knee-chain evidence: '+JSON.stringify(invalid));
 // The live adapter must calculate actual hinge alignment in this stable
 // perpendicular frame, not manufacture a zero simply because sine>.99.
 const adapter=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(adapter,/sourceKneeGeometry=sourceBind&&sourceLengths/);
 assert.doesNotMatch(adapter,/hingeAlignment=bendSine>\.085&&bendSine<\.99\?/,
  'current original bone bend plane must remain inspectable at a right angle');
});

/**
 * Observed 11 November original mobile source WebGL at tick 8:
 * right Walking_A heel +.2016m, after-ankle toe -.1047m, a real
 * 0.1rad right-knee trial raised the same skinned toe ~14mm and the
 * applied .12rad source knee lifted another 17.23mm with heel intact.
 * Toe still penetrated authored stone by 67.48mm. This regression
 * permits a stricter sampled .2rad original-joint candidate to build
 * up ONLY across successive true movement frames. It is not an IK pass.
 */
test('licensed connected knee may safely build residual swing-toe clearance across multiple REAL source frames',async()=>{
 const {selectOriginalSourceSwingCalfTrial:select,
  planOriginalSourceSwingCalfAssist:plan}=await load();
 const pose={afterAnkleToeY:-.10470731556596471,
  afterAnkleHeelY:.2016174752985826,floorTopY:-.02};
 const trials=[
  {signed:-.1,toe:-.11732151475172636,heel:.18601426226673032},
  {signed:.1,toe:-.09050147205991996,heel:.21576533979612117},
  {signed:-.2,toe:-.129,heel:.171},
  {signed:.2,toe:-.076,heel:.229}
 ];
 const chosen=select({...pose,trials});
 assert.equal(chosen?.signed,.2,'prefer measured deeper correction, not guessed hinge sign');
 const base={
  mode:'move',sourceClipName:'Walking_A',sourceAnatomyVerified:true,
  sourceLegChainVerified:true,sourceWeight:1,ownerLocomotion:true,
  alive:true,visible:true,teleport:false,reducedMotion:false,
  interrupted:false,rootTravel:.0872,frameAge:.07,
  floorTopY:-.02,afterAnkleToeY:pose.afterAnkleToeY,
  afterAnkleHeelY:pose.afterAnkleHeelY,ankleLiftMeters:.005738790347373901,
  trialCalfToeY:chosen.toe,trialCalfHeelY:chosen.heel,
  trialAngleRad:chosen.signed
 };
 const a=plan({...base,previousAssistRad:0});
 const b=plan({...base,previousAssistRad:a});
 const c=plan({...base,previousAssistRad:b});
 const close=(actual,want)=>assert.ok(Math.abs(actual-want)<1e-8,
  'expected '+want+'rad, got '+actual);
 close(a,.06);close(b,.12);close(c,.18);
 close(plan({...base,previousAssistRad:c}),.18);
 assert.equal(select({...pose,trials:[
  {...trials[3],heel:-.005},trials[1]]})?.signed,.1,
  'higher toe must not override safe same-source heel');
 for(const invalid of [
  {mode:'attack'},{alive:false},{visible:false},{teleport:true},
  {interrupted:true},{reducedMotion:true},{ownerLocomotion:false},
  {rootTravel:0},{sourceWeight:.49},{trialCalfHeelY:-.01},
  {trialCalfToeY:-.102},{trialAngleRad:.25},
  {previousAssistRad:-.06},{previousAssistRad:.25},
  {afterAnkleToeY:-.03},{frameAge:.3}
 ])assert.equal(plan({...base,previousAssistRad:0,...invalid}),0,
  'no new authority or unsafe source-knee actuation: '+JSON.stringify(invalid));
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(model,/for\s*\(const signed of \[-\.1,\.1,-\.2,\.2\]\)/,
  'original 41-joint live source must measure four genuine bent-knee probes');
 assert.match(model,/final-weighted-calflift-rejected/,
  'original skinned toe/heel must recertify every physically applied candidate');
});


test('observed original swinging toe drag starts source-backed ankle/calf assistance before severe floor penetration',async()=>{
 const {selectOriginalSourceSwingAnkleTrial:ankleTrial,
  planOriginalSourceSwingToeClearance:ankle,
  selectOriginalSourceSwingCalfTrial:calfTrial,
  planOriginalSourceSwingCalfAssist:calf}=await load();
 // Prospective adjacent frame of the real original Walking_A source, NOT
 // a filmed before/after claim: toe is 16mm under stone, heel is 140mm airborne.
 // Existing >25mm ankle and >35mm calf thresholds wait until penetration
 // worsens, leaving too few genuine frames for the 0.08/0.06rad slews.
 const floor=-.02,initialToe=-.036,initialHeel=.12;
 const footTrials=[
  {signed:-.1,toe:-.044,heel:.10},
  {signed:.1,toe:-.020,heel:.129},
  {signed:-.2,toe:-.052,heel:.085},
  {signed:.2,toe:-.008,heel:.143}
 ];
 const chosenFoot=ankleTrial({toeWorldY:initialToe,heelWorldY:initialHeel,
  floorTopY:floor,trials:footTrials});
 assert.equal(chosenFoot?.signed,.2,'only a real heel-safe, upward source-foot trial may pre-empt deeper drag');
 const shared={mode:'move',sourceClipName:'Walking_A',sourceAnatomyVerified:true,
  sourceWeight:1,alive:true,visible:true,groundedMoving:true,
  teleport:false,reducedMotion:false,interrupted:false,
  rootTravel:.0655,floorTopY:floor,heelWorldY:initialHeel,toeWorldY:initialToe,
  trialToeWorldY:chosenFoot?.toe,trialAngleRad:chosenFoot?.signed,
  previousCorrectionRad:0};
 const ankleDelta=ankle(shared);
 assert.ok(ankleDelta>0&&ankleDelta<=.08,
  'one early rendered source frame starts a small measured ankle lift rather than waiting for deep penetration');
 const afterAnkleToe=-.048,afterAnkleHeel=.135;
 // A separate genuine skinned-sole frame can retain 28mm of drag after its
 // ankle adjustment. An original source knee must also begin BEFORE 35mm
 // remaining drag, without bypassing same-heel, same-mesh or event ownership.
 const chosenCalf=calfTrial({afterAnkleToeY:afterAnkleToe,
  afterAnkleHeelY:afterAnkleHeel,floorTopY:floor,trials:[
   {signed:-.1,toe:-.055,heel:.122},
   {signed:.1,toe:-.029,heel:.145}
  ]});
 assert.equal(chosenCalf?.signed,.1);
 const calfDelta=calf({
  mode:'move',sourceClipName:'Walking_A',sourceAnatomyVerified:true,
  sourceLegChainVerified:true,sourceWeight:1,ownerLocomotion:true,
  alive:true,visible:true,teleport:false,reducedMotion:false,interrupted:false,
  rootTravel:.0655,frameAge:.05,floorTopY:floor,
  afterAnkleToeY:afterAnkleToe,afterAnkleHeelY:afterAnkleHeel,
  ankleLiftMeters:.01,trialCalfToeY:chosenCalf?.toe,
  trialCalfHeelY:chosenCalf?.heel,trialAngleRad:chosenCalf?.signed,
  previousAssistRad:0
 });
 assert.ok(calfDelta>0&&calfDelta<=.06,
  'one early calf frame may start only a 0.06rad measured source-knee lift');
 for(const forbidden of [
  {heelWorldY:-.005},{toeWorldY:-.026},{sourceClipName:'Idle'},
  {mode:'attack'},{reducedMotion:true},{teleport:true}
 ])assert.equal(ankle({...shared,...forbidden}),0,
  'no stance correction, unobserved clip, accessibility or cross-action pose');
 assert.equal(calf({mode:'idle'}),0);
 assert.equal(calfTrial({afterAnkleToeY:-.034,afterAnkleHeelY:.135,
  floorTopY:floor,trials:[{signed:.1,toe:-.02,heel:.14}]}),null,
  'near-stone toes must not be pushed by a knee merely because a trial raises them');
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(model,/toeY<-.02-\.01/,
  'runtime must actually give early measured original-foot trials an opportunity');
});


test('original airborne near-floor toe rescue passes both candidate AND final real-skinned-foot guards',async()=>{
 const {selectOriginalSourceSwingAnkleTrial:select,
  planOriginalSourceSwingToeClearance:plan,
  confirmOriginalSourceSwingToeLift:confirm}=await load();
 // Prospective source-like joint/skin sample; acceptance requires new real WebGL.
 const floor=-.02,beforeToe=-.036,beforeHeel=.12;
 const best=select({toeWorldY:beforeToe,heelWorldY:beforeHeel,floorTopY:floor,
  trials:[{signed:-.2,toe:-.052,heel:.085},
   {signed:.2,toe:-.008,heel:.143}]});
 assert.equal(best?.signed,.2);
 const args={mode:'move',sourceClipName:'Walking_A',sourceAnatomyVerified:true,
  sourceWeight:1,alive:true,visible:true,groundedMoving:true,
  rootTravel:.0655,floorTopY:floor,heelWorldY:beforeHeel,
  toeWorldY:beforeToe,trialToeWorldY:best.toe,
  trialAngleRad:best.signed,previousCorrectionRad:0};
 const delta=plan(args);
 assert.ok(delta>.06&&delta<=.08,'same licensed joint remains rate-limited');
 const final={beforeToeY:beforeToe,afterToeY:-.0248,
  beforeHeelY:beforeHeel,afterHeelY:.129,
  floorTopY:floor,appliedAngleRad:delta};
 assert.ok(confirm(final)>.01,
  '10-25mm genuine original-swing candidates cannot be discarded by the obsolete 25mm final gate');
 for(const bad of [
  {beforeToeY:-.029}, // 9mm toe intrusion
  {beforeHeelY:-.005}, // loaded source stance
  {afterHeelY:-.005}, // heel collision
  {afterToeY:-.0359}, // no measured clearance
  {afterToeY:.09}, // unreal source toe snap
  {appliedAngleRad:.3}, // over original ankle bound
  {floorTopY:.15}, // not the authored stone
  {afterToeY:NaN}
 ])assert.equal(confirm({...final,...bad}),null,
  'only a physically safe real original sole can certify relief: '+JSON.stringify(bad));
 for(const bad of [{mode:'attack'},{reducedMotion:true},{teleport:true},
  {heelWorldY:-.005},{sourceClipName:'Idle'}])
  assert.equal(plan({...args,...bad}),0);
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(model,/earlySourceToeRescue/,
  'the native skinned joint adapter must report exactly which accepted frames were early');
});


test('source foot and knee retain viable SAME-DIRECTION skinned swing probes across licensed consecutive frames',async()=>{
 const {selectOriginalSourceSwingAnkleTrial:ankle,
  selectOriginalSourceSwingCalfTrial:calf,
  planOriginalSourceSwingToeClearance:anklePlan,
  planOriginalSourceSwingCalfAssist:calfPlan}=await load();
 // Prospective original-GLB-shaped measurements: TWO genuine-safe trial
 // directions may lift the toe, but the larger opposite trial would cause
 // the existing slew limiter to discard the entire frame's correction.
 // Never claim this fixture is already witnessed in an organic WebM.
 const foot={toeWorldY:-.083,heelWorldY:.157,floorTopY:-.02,trials:[
  {signed:-.2,toe:-.043,heel:.128},
  {signed:.1,toe:-.066,heel:.160}
 ]};
 assert.equal(ankle(foot)?.signed,-.2,'without prior support the deeper licensed positive-lift trial remains preferred');
 assert.equal(ankle({...foot,previousCorrectionRad:.06})?.signed,.1,
  'a viable original-joint same-direction trial must not be dropped in favour of an opposing stronger pose');
 assert.equal(ankle({...foot,previousCorrectionRad:-.06})?.signed,-.2);
 assert.equal(ankle({...foot,previousCorrectionRad:.06,trials:[foot.trials[0]]}),null,
  'no source-foot reversal is invented when the only measured candidate fights current lawful joint slew');
 assert.equal(ankle({...foot,previousCorrectionRad:Infinity}),null);
 assert.equal(ankle({...foot,previousCorrectionRad:.3}),null);
 const sourceFoot={
  mode:'move',sourceClipName:'Walking_A',sourceAnatomyVerified:true,
  sourceWeight:1,alive:true,visible:true,groundedMoving:true,
  rootTravel:.0655,floorTopY:-.02,heelWorldY:foot.heelWorldY,
  toeWorldY:foot.toeWorldY,previousCorrectionRad:.06
 };
 const selectedAnkle=ankle({...foot,previousCorrectionRad:.06});
 assert.ok(anklePlan({...sourceFoot,trialToeWorldY:selectedAnkle.toe,
  trialAngleRad:selectedAnkle.signed})>.06,
  'selected direction passes original same-owner toe-support slew');
 assert.equal(anklePlan({...sourceFoot,trialToeWorldY:foot.trials[0].toe,
  trialAngleRad:foot.trials[0].signed}),0,
  'previous selection falsely caused this frame to lose all swing clearance');
 const leg={afterAnkleToeY:-.1047,afterAnkleHeelY:.2016,floorTopY:-.02,
  trials:[{signed:-.2,toe:-.078,heel:.191},
   {signed:.1,toe:-.09,heel:.215}]};
 assert.equal(calf(leg)?.signed,-.2);
 assert.equal(calf({...leg,previousAssistRad:.06})?.signed,.1);
 assert.equal(calf({...leg,previousAssistRad:-.06})?.signed,-.2);
 assert.equal(calf({...leg,previousAssistRad:.06,trials:[leg.trials[0]]}),null);
 assert.equal(calf({...leg,previousAssistRad:NaN}),null);
 assert.equal(calf({...leg,previousAssistRad:-.22}),null);
 const sourceCalf={mode:'move',sourceClipName:'Walking_A',
  sourceAnatomyVerified:true,sourceLegChainVerified:true,
  sourceWeight:1,ownerLocomotion:true,alive:true,visible:true,
  rootTravel:.0872,frameAge:.04,floorTopY:-.02,
  afterAnkleToeY:leg.afterAnkleToeY,afterAnkleHeelY:leg.afterAnkleHeelY,
  ankleLiftMeters:.009,previousAssistRad:.06};
 const selectedCalf=calf({...leg,previousAssistRad:.06});
 assert.ok(calfPlan({...sourceCalf,trialCalfToeY:selectedCalf.toe,
  trialCalfHeelY:selectedCalf.heel,trialAngleRad:selectedCalf.signed})>.05);
 assert.equal(calfPlan({...sourceCalf,trialCalfToeY:leg.trials[0].toe,
  trialCalfHeelY:leg.trials[0].heel,trialAngleRad:leg.trials[0].signed}),0);
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(model,/selectOriginalSourceSwingAnkleTrial\(\{[\s\S]{0,160}previousCorrectionRad:previous/);
 assert.match(model,/selectOriginalSourceSwingCalfTrial\(\{[\s\S]{0,180}previousAssistRad:prior/);
});

test('source-native stance-sole relief uses measured two-point original shoe, not a fake foot lock',async()=>{
 const {planOriginalSourceStanceAnkleRelief:plan}=await load();
 const source={mode:'move',sourceClipName:'Walking_A',
  sourceWeight:.88,ownerLocomotion:true,rootTravel:.107,frameAge:.03,
  alive:true,visible:true,teleport:false,reducedMotion:false,interrupted:false,
  floorTopY:-.02,heelY:-.022635230550926283,toeY:-.0415121281595155,
  // Actual desktop source-foot frame: stance heel 2.6mm and toe 21.5mm
  // inside floor. Trial endpoints below are prospective and must NOT
  // masquerade as the original rig's newly recorded performance.
  trials:[{signed:-.12,heel:-.018,toe:-.055},
   {signed:.12,heel:-.026,toe:-.026}],
  previousCorrectionRad:0};
 const selected=plan(source);
 assert.ok(selected&&selected.delta>0&&selected.delta<=.045,
  'select a limited original ankle plane correction that improves BOTH source sole contacts');
 assert.equal(selected.signed,.12);
 assert.equal(plan({...source,trials:[source.trials[0]]}),null,
  'do not raise the heel by digging the source toe deeper into stone');
 assert.equal(plan({...source,sourceClipName:'Idle'}),null);
 assert.equal(plan({...source,sourceWeight:.4}),null);
 assert.equal(plan({...source,mode:'attack'}),null);
 assert.equal(plan({...source,ownerLocomotion:false}),null);
 assert.equal(plan({...source,rootTravel:0}),null);
 assert.equal(plan({...source,reducedMotion:true}),null);
 assert.equal(plan({...source,teleport:true}),null);
 assert.equal(plan({...source,alive:false}),null);
 assert.equal(plan({...source,heelY:.11,toeY:-.11}),null,
  'this support is for a near-ground stance shoe, not an airborne swing');
 assert.equal(plan({...source,previousCorrectionRad:-.04}),null,
  'opposing current-frame original sole trial cannot snap the stance ankle');
 assert.equal(plan({...source,trials:[{signed:.12,heel:-.09,toe:-.01}]}),null,
  'a cosmetically higher toe does not justify pushing the real heel into stone');
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(model,/planOriginalSourceStanceAnkleRelief\(/,
  'real original Three.js skinned ankle must consume the grounded source-foot plan');
 assert.match(model,/sourceStanceSoleCurrentFrameProofs/,
  'recomputed physical heel-toe proof is required, not claimed virtual foot contact');
});


test('the actual imported-GLB foot-skin probe uses FINAL same-frame root translation and rotation',()=>{
 const renderer=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 const method=renderer.slice(renderer.indexOf('function updateActor('),
  renderer.indexOf('function updateActor(')+50000);
 const stride=method.indexOf('stageRigGroundedStride(actor,reducedMotion,dt,sourceFrameInterval,sourceFrameVisible);');
 const pivotY=method.indexOf('actor.visualPivot.position.set(');
 const pivotRotation=method.indexOf('actor.visualPivot.rotation.set(');
 const originalSkinnedFeet=method.indexOf('stageRigLegsAfterMixer(actor,poseAge,reducedMotion);');
 const rootWorld=method.indexOf('actor.visualPivot.updateWorldMatrix(true,false);');
 assert.ok(stride>=0&&pivotY>=0&&pivotRotation>=0&&originalSkinnedFeet>=0,
  'the real original source-mixer update must contain a grounded stride, root pose and imported-sole staging');
 assert.ok(stride<pivotY&&pivotY<pivotRotation&&pivotRotation<rootWorld&&rootWorld<originalSkinnedFeet,
  'same-frame original skinned heel/toe clearance cannot be measured before the final visual root pose');
 assert.equal(method.match(/actor\.visualPivot\.position\.set\(/g)?.length,1,
  'no later visual-root translation may invalidate original toe/heel world-space acceptance');
 assert.equal(method.match(/actor\.visualPivot\.rotation\.set\(/g)?.length,1,
  'do not rotate the true original skinned heel/toe away after physical measurement');
 const live=renderer.slice(renderer.indexOf('function planOriginalSourceStanceForMountedAnkle('),
  renderer.indexOf('function stageRigLegsAfterMixer('));
 assert.match(live,/readOriginalSwingSoleY\(patch\.toe\)/);
 assert.match(live,/chooseOriginalSourceStanceAppliedWitness\(/,
  'every final original shoe candidate must pass the two-point actual-skin witness');
 const source=fs.readFileSync(path.join(root,'public/ai-dungeon/full-body-animation-controller.js'),'utf8');
 const physical=source.slice(source.indexOf('export function chooseOriginalSourceStanceAppliedWitness('),
  source.indexOf('export function planOriginalSourceStanceAnkleRelief('));
 assert.match(physical,/beforeWorst-afterWorst<\.0015/,
  'the original applied heel and toe require at least 1.5mm measured improvement');
 assert.match(live,/mount\.bone\.quaternion\.copy\(original\)/,
  'both signed trial and final proof must restore the original source quaternion');
});

test('source-loaded pelvis bridge uses authentic two-point walking shoe contact, not a synthetic IK lock',async()=>{
 const {planOriginalSourceLoadedPelvisSupport:plan}=await load();
 assert.equal(typeof plan,'function','original imported Walking_A needs a source-skinned two-point load response');
 // Actual original desktop source GLB frame from Actions #43137309946:
 // right heel -34.031mm / toe -51.127mm, left foot high and swinging.
 // This is real captured geometry, not a hypothetical floor or foot lock.
 const desktop={mode:'move',sourceClipName:'Walking_A',sourceWeight:.76,
  ownerLocomotion:true,rootTravel:.0385,frameAge:.04,
  floorTopY:-.02,floorEvidence:'authored-cube-floor-top',alive:true,visible:true,teleport:false,
  reducedMotion:false,interrupted:false,previousLiftMeters:0,
  left:{heelY:.1449076,toeY:-.1177656},
  right:{heelY:-.0340313,toeY:-.0511265}};
 const a=plan(desktop);
 assert.equal(a?.side,'right','only genuinely near-loaded source shoe qualifies');
 assert.equal(a?.liftMeters,.008,'one visible frame cannot lift skinned pelvis by more than 8mm');
 assert.ok(a?.beforeWorstMeters>.03&&a?.afterWorstMeters<a?.beforeWorstMeters-.007,
  'measured planted-weight shoe must become closer to the real authored floor at BOTH endpoints');
 const b=plan({...desktop,previousLiftMeters:a.liftMeters});
 assert.equal(b?.liftMeters,.016,'supported rise finishes within the 16mm source body budget');
 assert.equal(plan({...desktop,previousLiftMeters:b.liftMeters})?.liftMeters,.016);
 // Independent real mobile source GLB frame: weighted left shoe enters stone.
 const mobile=plan({...desktop,left:{heelY:-.0362039,toeY:-.0401336},
  right:{heelY:.09969715,toeY:-.04080034},rootTravel:.2042,sourceWeight:.61});
 assert.equal(mobile?.side,'left');
 assert.equal(mobile?.liftMeters,.008);
 for(const bad of [{mode:'attack'},{mode:'guard'},{mode:'defeat'},
  {sourceClipName:'Idle'},{sourceClipName:'Run'},{sourceWeight:.4},
  {sourceWeight:NaN},{ownerLocomotion:false},{rootTravel:0},
  {rootTravel:.6},{frameAge:.25},{alive:false},{visible:false},
  {teleport:true},{reducedMotion:true},{interrupted:true},
  {floorTopY:-1},{floorTopY:NaN},{left:{heelY:NaN,toeY:-.03}},
  {left:{heelY:-.10,toeY:-.10},right:{heelY:.4,toeY:-.2}}
 ])assert.equal(plan({...desktop,...bad}),null,
  'never create support on unsupported or unverifiable source '+JSON.stringify(bad));
 // An opposite planted original shoe must not hover when this one is raised.
 assert.equal(plan({...desktop,left:{heelY:-.006,toeY:-.002},
  right:{heelY:-.0340313,toeY:-.0511265}}),null,
 'never cure one original sole by lifting a second already near-ground sole too far');
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(model,/planOriginalSourceLoadedPelvisSupport\(/,
  'actual Three.js must use the genuine original-skinned measurements');
 assert.match(model,/stageSourceLoadedPelvisBeforeLegs\(actor,reducedMotion\);[\s\S]{0,100}stageRigLegsAfterMixer\(/,
  'grounded support belongs after current-frame source pose and before original ankle/calf proof');
});


test('original Walking_A loaded pelvis final skinned foot must not exchange heel penetration for toe clearance',async()=>{
 const {verifyOriginalSourceLoadedPelvisFootWitness:verify}=await load();
 // SAME original source-shoe starting sample + confirmed final footprint from
 // genuine 1440px source GLB WebGL, Actions #43145381250, tick 6.
 const before={heelY:-.026071961125037277,toeY:-.046394043555076196};
 const witnessed={heelY:-.02059877498760407,toeY:-.04182943467495813};
 const otherBefore={heelY:.1449076,toeY:-.1177656};
 const otherAfter={heelY:.151,toeY:-.110};
 const real=verify({before,after:witnessed,otherBefore,otherAfter,floorTopY:-.02});
 assert.ok(real,'accept actual independently measured original source heel+toe improvement');
 assert.ok(real.improvementMeters>.0044&&real.improvementMeters<.0047);
 // Critical counterexample: the old worst-distance-only check accepted this
 // even though the heel was pushed 11mm further INTO stone.
 const unsafe={heelY:-.037,toeY:-.024};
 assert.equal(verify({before,after:unsafe,otherBefore,otherAfter,floorTopY:-.02}),null,
  'toe rescue must not sacrifice authentic loaded-heel collision');
 for(const invalid of [
  {after:{heelY:-.021,toeY:-.0461}},
  {after:{heelY:NaN,toeY:-.024}},
  {after:{heelY:.02,toeY:-.024}},
  {floorTopY:NaN},
  {otherBefore:{heelY:-.021,toeY:-.022},otherAfter:{heelY:.016,toeY:.018}}
 ])assert.equal(verify({before,after:witnessed,otherBefore,otherAfter,
  floorTopY:-.02,...invalid}),null,
  'reject invalid source-foot readback, insufficient improvement, hovering or another loaded shoe lift');
 const renderer=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(renderer,/function stageSourceLoadedPelvisBeforeLegs\(/);
 assert.match(renderer,/function auditSourceLoadedPelvisAfterLegs\(/);
 const early=renderer.slice(renderer.indexOf('function stageSourceLoadedPelvisBeforeLegs('),
  renderer.indexOf('function auditSourceLoadedPelvisAfterLegs('));
 const late=renderer.slice(renderer.indexOf('function auditSourceLoadedPelvisAfterLegs('),
  renderer.indexOf('/** Read the real SkeletonUtils-cloned source GLB rest segments'));
 assert.match(early,/verifyOriginalSourceLoadedPelvisFootWitness\(/,
  'initial actual skinned-foot check must require both endpoints improving');
 assert.match(late,/verifyOriginalSourceLoadedPelvisFootWitness\(/,
  'post-ankle/knee source-skinned readback must enforce same non-sinking physical contract');
});


test('rejected original loaded pelvis trial restores all six licensed source leg overlays atomically',async()=>{
 const fs=require('node:fs'),path=require('node:path');
 const rig=fs.readFileSync(path.join(root,'public/ai-dungeon/rig-attachment-plan.js'),'utf8');
 const {restoreOriginalSourceLegsAfterRejectedPelvis:rollback}=await import(
  'data:text/javascript;base64,'+Buffer.from(rig).toString('base64'));
 assert.equal(typeof rollback,'function',
  'the source rig adapter must undo any ankle/calf angles tested against a rejected elevated root');
 const THREE=require('three'),axis=new THREE.Vector3(0,1,0),pitch=new THREE.Vector3(1,0,0);
 const mounts=[],expected=new Map();
 for(const side of ['left','right'])for(const part of ['upper','lower','foot']){
  const bone=new THREE.Bone(),index=mounts.length,baseAngle=.022+index*.007;
  bone.name=part+'.'+(side==='left'?'l':'r');
  bone.quaternion.setFromAxisAngle(axis,.17+index*.024);
  const authored=bone.quaternion.clone(),base=new THREE.Quaternion().setFromAxisAngle(pitch,baseAngle);
  const trial=new THREE.Quaternion().setFromAxisAngle(
   part==='lower'?axis:pitch,part==='lower'?.058:part==='foot'?.042:0);
  const last=base.clone().multiply(trial);
  bone.quaternion.multiply(last);
  mounts.push({side,part,bone,sourceFrameBaseAngleRad:baseAngle,
   last,lastSourceRad:part==='lower'?.058:part==='foot'?.042:0,
   inverse:new THREE.Quaternion(),next:new THREE.Quaternion(),euler:new THREE.Euler(),
   soleClearanceRad:part==='foot'?.042:0,stanceReliefRad:0,
   swingCalfAssistRad:part==='lower'?.058:0});
  expected.set(bone,authored.multiply(base));
 }
 const before=mounts.map(m=>m.bone.quaternion.clone());
 assert.equal(rollback(mounts),true,'the complete source left/right bone contract is reversible');
 for(const [i,m] of mounts.entries()){
  assert.ok(1-Math.abs(m.bone.quaternion.dot(expected.get(m.bone)))<1e-12,
   'rollback restores original imported mixer pose plus LEGAL base action on '+m.bone.name);
  if(m.part!=='upper')assert.ok(1-Math.abs(m.bone.quaternion.dot(before[i]))>1e-7,
   'the speculative original ankle/knee overlay must no longer survive the rejected body-root trial');
  assert.equal(m.soleClearanceRad,0);
  assert.equal(m.stanceReliefRad,0);
  assert.equal(m.swingCalfAssistRad,0);
  // Next frame's restore-before-Mixer must not remove the imported source base.
  m.bone.quaternion.multiply(m.last.clone().invert());
  const authored=expected.get(m.bone).clone().multiply(
   new THREE.Quaternion().setFromAxisAngle(pitch,-m.sourceFrameBaseAngleRad));
  assert.ok(1-Math.abs(m.bone.quaternion.dot(authored))<1e-12);
 }
 // An incomplete/invalid Session 02 bone adapter must fail WITHOUT any partial mutation.
 const rejected=mounts.slice(0,5),prior=rejected.map(m=>m.bone.quaternion.clone());
 assert.equal(rollback(rejected),false);
 rejected.forEach((m,i)=>assert.ok(1-Math.abs(m.bone.quaternion.dot(prior[i]))<1e-12));
 const invalid=mounts.map(m=>({...m}));
 invalid[4].sourceFrameBaseAngleRad=NaN;
 assert.equal(rollback(invalid),false,'invalid source-angle evidence cannot half-restore the cast');
 const adapter=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(adapter,/sourceFrameBaseAngleRad=angle/,
  'each original joint must remember its source-owned base angle before testing sole rescue');
 assert.match(adapter,/restoreOriginalSourceLegsAfterRejectedPelvis\(actor\.rigGaitBones\)/,
  'final original-heel/toe rejection must actively remove unsupported source ankle and calf overlays');
 assert.match(adapter,/actor\.visualPivot\.position\.y=candidate\.baseY;[\s\S]{0,220}restoreOriginalSourceLegsAfterRejectedPelvis/,
  'the rejected body root must be restored BEFORE the exact imported leg-pose rollback');
});


test('actual source-weighted walking shoe needs finite near-range ankle trials rather than only unsafe 120mrad extremes',async()=>{
 const {planOriginalSourceStanceAnkleRelief:plan}=await load();
 // GENUINE original source GLB frame: Actions #43145381250, desktop
 // Walking_A right foot, skinned heel=-26.072mm, toe=-46.394mm, stone=-20mm.
 // Probe coordinates below are DELIBERATELY SYNTHETIC safety cases.
 // They must be replaced by real skinned reads before live acceptance.
 const real={mode:'move',sourceClipName:'Walking_A',
  sourceWeight:.9,ownerLocomotion:true,rootTravel:.042,frameAge:.04,
  alive:true,visible:true,teleport:false,reducedMotion:false,
  interrupted:false,floorTopY:-.02,
  heelY:-.026071961,toeY:-.046394044,previousCorrectionRad:0};
 const safeFine={signed:.045,heel:-.0271,toe:-.0409};
 const unsafeLarge={signed:.12,heel:-.037,toe:-.031};
 const unsafeOpposite={signed:-.045,heel:-.023,toe:-.054};
 const unsafeOther={signed:-.12,heel:-.013,toe:-.069};
 const result=plan({...real,trials:[
  unsafeOther,unsafeOpposite,safeFine,unsafeLarge
 ]});
 assert.ok(result&&result.signed===.045&&
  result.delta>0&&result.delta<=.045,
  'accept a physically safer finer original-ankle probe even if both coarse trials bury an endpoint');
 assert.equal(plan({...real,trials:[unsafeOther,unsafeLarge]}),null,
  'coarse probes alone cannot manufacture a heel-and-toe correction');
 assert.equal(plan({...real,previousCorrectionRad:-.02,trials:[safeFine]}),null,
  'an incompatible prior source-foot rotation cannot force a sudden direction reversal');
 assert.equal(plan({...real,trials:[...Array(5)].map((_,i)=>({
  signed:.045,heel:-.027,toe:-.040+i*.0001
 }))}),null,'unbounded skinned-vertex trial arrays fail closed');
 assert.equal(plan({...real,trials:[{signed:.025,heel:-.024,toe:-.039}]}),null,
  'a rotation not measured by the licensed source-rig trial envelope is forbidden');
 for(const invalid of [
  {sourceClipName:'Idle'},{mode:'hurt'},{alive:false},
  {reducedMotion:true},{teleport:true},{rootTravel:0},
  {ownerLocomotion:false}
 ])assert.equal(plan({...real,trials:[safeFine],...invalid}),null);
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(model,/for\(const signed of \[-\.12,-\.045,\.045,\.12\]\)/,
  'native browser must actually measure fine and coarse original ankle candidates, not fake the trials in pure tests');
});


test('same original-GLB near-ground stance prefers independently witnessed fine fallback when blended coarse pose is too weak',async()=>{
 const {planOriginalSourceStanceAnkleRelief:plan}=await load();
 // Real desktop Walking_A loaded-source heel/toe start from Actions
 // #43115696847. Synthetic joint outcomes below form a regression fixture,
 // NOT a claim that the actual GLB has passed a moving two-point plant.
 const baseline={mode:'move',sourceClipName:'Walking_A',
  sourceWeight:.68,ownerLocomotion:true,rootTravel:.042,frameAge:.04,
  alive:true,visible:true,teleport:false,reducedMotion:false,
  interrupted:false,floorTopY:-.02,heelY:-.022635,toeY:-.041512,
  previousCorrectionRad:0};
 const fine={signed:.045,heel:-.025,toe:-.034};
 const coarse={signed:.12,heel:-.026,toe:-.029};
 const v=plan({...baseline,trials:[fine,coarse]});
 assert.equal(v?.signed,.12,'the coarse source trial remains the best measured far probe');
 assert.ok(v.delta>0&&v.delta<.035,'source-weight ease makes the first fine-pose check smaller than the true original 45mrad trial');
 assert.equal(v.fineFallbackDelta,.045,
  'a SAFE same-direction original 45mrad skin probe should permit one separately verified applied pose');
 assert.equal(plan({...baseline,trials:[coarse]})?.fineFallbackDelta,null,
  'never invent a fine fallback when the actual fine source bone was not sampled');
 assert.equal(plan({...baseline,trials:[{...fine,heel:-.044},coarse]})?.fineFallbackDelta,null,
  'a trial that buries the source heel is forbidden even when the toe rises');
 assert.equal(plan({...baseline,sourceWeight:.59,trials:[fine,coarse]})?.fineFallbackDelta,null,
  'do not force full 45mrad corrections while the original clip is barely present');
 assert.equal(plan({...baseline,previousCorrectionRad:.11,trials:[fine,coarse]})?.fineFallbackDelta,null,
  'never bypass the previous original ankle 45mrad-per-frame rate limit');
 assert.equal(plan({...baseline,mode:'hurt',trials:[fine,coarse]}),null,
  'a verified injury must retain animation ownership');
});


test('genuine original mobile Walking_A ankle probes select the strongest independently safe applied sole, not the first merely positive angle',async()=>{
 const {chooseOriginalSourceStanceAppliedWitness:select}=await load();
 // From the REAL 390px same-original-skinned-shoe WebGL receipt in
 // Actions #43158026658, tick 8. The fine -45mrad entry is the REAL source
 // joint *trial*, not yet an accepted/filmed final application in this test.
 const beforeHeelY=-.024033586808142094;
 const beforeToeY=-.03673829035871511;
 const first={delta:-.025161558312328126,
  heelY:-.025472670656604378,toeY:-.031127201419131674};
 const fine={delta:-.045,
  heelY:-.026580466355912713,toeY:-.026673667033783863};
 const base={floorTopY:-.02,beforeHeelY,beforeToeY};
 const initial=select({...base,candidates:[first]});
 assert.ok(initial&&initial.candidateIndex===0);
 assert.ok(Math.abs(initial.afterWorst-.011127201419131674)<.00001);
 const best=select({...base,candidates:[first,fine]});
 assert.equal(best?.delta,-.045,
  'the actual source fine joint probe offers lower max heel/toe floor discrepancy by ~4.45mm');
 assert.equal(best?.candidateIndex,1);
 assert.ok(best.afterWorst<initial.afterWorst-.004);
 assert.equal(select({...base,candidates:[first,
  {...fine,heelY:-.033}]}).candidateIndex,0,
  'never improve a toe by sinking the original weighted heel more than the physical 4mm budget');
 assert.equal(select({...base,candidates:[first,
  {...fine,toeY:.03}]}).candidateIndex,0,
  'an airborne skinned toe cannot count as a nearer-ground loaded shoe');
 assert.equal(select({...base,candidates:[first,
  {...fine,heelY:-.026,toeY:-.0307}]}).candidateIndex,0,
  'do not replace a good original ankle with a <1mm physically negligible change');
 assert.equal(select({...base,candidates:[{...first,delta:.08}]}),null,
  'a fabricated over-rate joint cannot be certified, even with better vertices');
 assert.equal(select({...base,candidates:[first,fine,fine]}),null,
  'at most two reversible original source angles may be read this frame');
 assert.equal(select({...base,floorTopY:NaN,candidates:[first,fine]}),null);
});


test('source-stance applied witness honors cumulative original ankle and 45mrad incremental slew',async()=>{
 const {chooseOriginalSourceStanceAppliedWitness:select}=await load();
 const fixture={floorTopY:-.02,beforeHeelY:-.022635,beforeToeY:-.041512,
  candidates:[{delta:.105,heelY:-.025,toeY:-.033}]};
 const positive=select({...fixture,previousCorrectionRad:.08});
 assert.equal(positive?.delta,.105,
  'a legal accumulated 105mrad original ankle must not be mistaken for a 105mrad single-frame snap');
 assert.equal(select({...fixture,previousCorrectionRad:0}),null,
  'the same original ankle candidate is illegal from neutral in one frame');
 assert.equal(select({...fixture,previousCorrectionRad:.02}),null,
  '85mrad from the last accepted source ankle exceeds the 45mrad slew');
 assert.equal(select({...fixture,previousCorrectionRad:-.08}),null,
  'opposite signed old joint evidence may not authorize new-direction source ankle');
 assert.equal(select({...fixture,previousCorrectionRad:.17}),null,
  'historically invalid source joint state must fail closed');
 assert.equal(select({...fixture,candidates:[{...fixture.candidates[0],delta:.151}],
  previousCorrectionRad:.12}),null,
  'the native accumulated 140mrad source ankle limit is never waived');
});


test('a rejected elevated pelvis can safely re-stage authentic source legs at the RESTORED root exactly once',async()=>{
  const rig=fs.readFileSync(path.join(root,'public/ai-dungeon/rig-attachment-plan.js'),'utf8');
  const {restoreOriginalSourceLegsAfterRejectedPelvis:rollback,
    prepareOriginalSourceLegsForPelvisRetry:prepare}=await import(
    'data:text/javascript;base64,'+Buffer.from(rig).toString('base64'));
  assert.equal(typeof prepare,'function',
    'a failed elevated-root witness must not permanently discard an independently safe original ankle correction');
  const THREE=require('three'),pitch=new THREE.Vector3(1,0,0),yaw=new THREE.Vector3(0,1,0);
  const mounts=[],sourceByBone=new Map();
  for(const side of ['left','right'])for(const part of ['upper','lower','foot']){
    const i=mounts.length,bone=new THREE.Bone(),base=.015+i*.004;
    bone.name=part+'.'+side;
    const source=new THREE.Quaternion().setFromAxisAngle(yaw,.21+i*.016);
    const overlay=new THREE.Quaternion().setFromAxisAngle(pitch,base+(part==='foot'?.045:part==='lower'?.06:0));
    bone.quaternion.copy(source).multiply(overlay);
    sourceByBone.set(bone,source);
    mounts.push({side,part,bone,sourceFrameBaseAngleRad:base,
      last:overlay.clone(),next:new THREE.Quaternion(),inverse:new THREE.Quaternion(),
      euler:new THREE.Euler(),soleClearanceRad:part==='foot'?.045:0,
      stanceReliefRad:part==='foot'?.045:0,
      swingCalfAssistRad:part==='lower'?.06:0});
  }
  assert.equal(rollback(mounts),true);
  assert.equal(prepare(mounts),true,'only six complete original joint mounts may return to the Mixer for re-staging');
  for(const mount of mounts){
    assert.ok(1-Math.abs(mount.bone.quaternion.dot(sourceByBone.get(mount.bone)))<1e-12,
      'rejected pelvis retry must start from genuine imported mixer bone, never double the prior native base pose');
    assert.ok(1-Math.abs(mount.last.dot(new THREE.Quaternion()))<1e-12,
      'next source mixer update must not undo stale speculative leg poses');
    assert.equal(mount.soleClearanceRad,0);
    assert.equal(mount.stanceReliefRad,0);
    assert.equal(mount.swingCalfAssistRad,0);
  }
  const invalid=mounts.map((m,i)=>({...m,side:i===1?'right':m.side}));
  const before=mounts.map(m=>m.bone.quaternion.clone());
  assert.equal(prepare(invalid),false,'incomplete/duplicate bone contract must fail atomically');
  assert.ok(mounts.every((m,i)=>1-Math.abs(m.bone.quaternion.dot(before[i]))<1e-12));
  const renderer=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
  const section=renderer.slice(renderer.indexOf('function auditSourceLoadedPelvisAfterLegs('),
    renderer.indexOf('/** Read the real SkeletonUtils-cloned source GLB rest segments'));
  assert.match(section,/restoreOriginalSourceLegsAfterRejectedPelvis\(actor\.rigGaitBones\)/);
  assert.match(section,/prepareOriginalSourceLegsForPelvisRetry\(actor\.rigGaitBones\)/);
  assert.match(section,/stageRigLegsAfterMixer\(actor,[^\n]*reducedMotion\)/,
    'after restoring the root and Mixer base, retry original foot support exactly once');
  assert.match(section,/retryAttempted/,
    'the real browser must expose the late pelvis rejection and any safe restored-root retry separately');
});


test('restored-root ankle retry verifies BOTH source-skinned shoes, never a fabricated planted foot',async()=>{
 const {verifyRestoredRootOriginalSourceSoleSafety:verify}=await load();
 const right={heelY:-.026071961,toeY:-.046394044};
 // Right shoe baseline is taken from a real original-source WebGL desktop
 // Walking_A readback; proposed AFTER frames and other shoe are synthetic
 // safety counterexamples, NOT observed source animation or visual success.
 const before={right,left:{heelY:-.018,toeY:-.015}};
 const args={source:'same-original-GLB-restored-root',floorTopY:-.02,before};
 const safe=verify({...args,after:{
  right:{heelY:-.025,toeY:-.042},left:{heelY:-.018,toeY:-.015}
 }});
 assert.ok(safe,'both original skinned shoe endpoints must be finite and checked');
 assert.equal(safe.feetVerified,2);
 assert.equal(safe.contactLocked,false,'bounded skin readbacks do NOT certify planted world soles');
 // A valid right-foot correction must never mask a deeper *left* heel.
 assert.equal(verify({...args,after:{
  right:{heelY:-.025,toeY:-.042},left:{heelY:-.026,toeY:-.015}
 }}),null);
 // Nor may a better toe on the SAME original shoe conceal a buried heel.
 assert.equal(verify({...args,after:{
  right:{heelY:-.032,toeY:-.038},left:before.left
 }}),null);
 // An uncorrected source foot may not gain a new 4+ cm visible hover.
 assert.equal(verify({...args,after:{
  right:{heelY:-.025,toeY:-.042},left:{heelY:.020,toeY:.024}
 }}),null);
 const airborne={left:{heelY:.09,toeY:.07},right:before.right};
 assert.ok(verify({...args,before:airborne,after:{
  left:{heelY:.09,toeY:.07},right:{heelY:-.025,toeY:-.042}
 }}),'a legitimately airborne OTHER source shoe must not be treated as a false stance contact');
 for(const invalid of [
  {...args,after:{right:{heelY:-.025,toeY:-.042}}},
  {...args,after:{right:{heelY:NaN,toeY:-.042},left:before.left}},
  {...args,after:{right:before.right,left:before.left},floorTopY:0},
  {...args,after:{right:before.right,left:before.left},source:'untrusted'}
 ])assert.equal(verify(invalid),null);
 const renderer=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 const section=renderer.slice(renderer.indexOf('function auditSourceLoadedPelvisAfterLegs('),
  renderer.indexOf('/** Read the real SkeletonUtils-cloned source GLB rest segments'));
 assert.match(section,/verifyRestoredRootOriginalSourceSoleSafety\(/);
 assert.match(section,/retryWholeSoleSafety/);
 assert.match(section,/if\(!sourceSolesSafe\)[\s\S]*?restoreOriginalSourceLegsAfterRejectedPelvis/);
});


test('source GLB loaded-stance knee must improve BOTH weighted outsole edges without moving authority',async()=>{
 const {chooseOriginalSourceLoadedKneeWitness:select}=await load();
 assert.equal(typeof select,'function','must use a measured original lowerleg hinge, not a guessed joint or ankle-only pitch');
 // GENUINE mobile source Walking_A tick 6 from exact 2449dfb CI #43167649329.
 // Subsequent signed knee trials are SYNTHETIC prospective safety fixtures,
 // not yet measured source-rig outcomes or a planted-foot visual pass.
 const before={left:{heelY:-.040438,toeY:-.032446},
  right:{heelY:.146139,toeY:-.024520}};
 const base={mode:'move',sourceClipName:'Walking_A',sourceWeight:.82,
  ownerLocomotion:true,sourceHingeVerified:true,sourceInstanceSame:true,
  alive:true,visible:true,teleport:false,reducedMotion:false,
  interrupted:false,rootTravel:.042,frameAge:.04,
  floorTopY:-.02,side:'left',previousCorrectionRad:0,before};
 const physical={signed:-.045,after:{left:{heelY:-.034,toeY:-.028},
  right:{...before.right}}};
 const worse={signed:.045,after:{left:{heelY:-.045,toeY:-.024},
  right:{...before.right}}};
 const accepted=select({...base,trials:[worse,physical]});
 assert.equal(accepted?.delta,-.045,'choose only the safe true-source trial improving the worst weighted edge');
 assert.ok(accepted.improvementMeters>.006);
 assert.equal(accepted.contactLocked,false,'a single frame is never a world-space sole plant');
 assert.equal(accepted.feetVerified,2);
 assert.equal(select({...base,trials:[worse]}),null,'do not buy toe clearance with a buried heel');
 assert.equal(select({...base,previousCorrectionRad:.045,trials:[physical]}),null,
  'a 90mrad signed reversal across one frame is forbidden');
 assert.equal(select({...base,previousCorrectionRad:-.045,trials:[physical]})?.delta,-.045);
 const buriedOther={signed:-.045,after:{left:physical.after.left,
  right:{...before.right,toeY:-.033}}};
 assert.equal(select({...base,trials:[buriedOther]}),null,
  'an opposite original shoe cannot be sunk to rescue the loaded foot');
 const hoverOther={signed:-.045,after:{left:physical.after.left,
  right:{...before.right,heelY:.21}}};
 assert.equal(select({...base,trials:[hoverOther]}),null,
  'an airborne original shoe must not jump from an already measured pose');
 for(const invalid of [
  {sourceClipName:'Idle'},{mode:'hurt'},{sourceWeight:.40},
  {sourceHingeVerified:false},{sourceInstanceSame:false},
  {reducedMotion:true},{interrupted:true},{teleport:true},
  {rootTravel:0},{ownerLocomotion:false},{alive:false},
  {before:{left:{heelY:NaN,toeY:-.03},right:before.right}},
  {side:'right'},{floorTopY:0}
 ])assert.equal(select({...base,...invalid,trials:[physical]}),null);
 assert.equal(select({...base,trials:[physical,physical,physical]}),null,
  'per original stance knee at most two reversible source-skin trials');
 const renderer=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(renderer,/function stageOriginalSourceLoadedKneeForMountedFoot\(/,
  'the actual original Three.js rig must make source-knee trials, not paper poses');
 const begin=renderer.indexOf('function stageRigLegsAfterMixer(');
 const finish=renderer.indexOf('/**\n * Make the actual animated torso',begin);
 assert.ok(begin>=0&&finish>begin);
 const stage=renderer.slice(begin,finish);
 assert.match(stage,/stageOriginalSourceLoadedKneeForMountedFoot\(/,
  'loaded original lowerleg trials must be applied AFTER the connected six-joint base');
 assert.match(renderer,/sourceStanceKneeCurrentFrameProofs/,
  'the genuine browser should expose exact original-instance pre/post skinned heels and toes');
});

test('original GLB loaded ankle relief rejects an XY-only apparent plant that slides the weighted outsole in XZ',async()=>{
 const {chooseOriginalSourceStanceAppliedWitness:choose}=await load();
 // Heel/toe Y are sampled on original Walking_A skinned shoe; XZ trial
 // offsets deliberately represent unacceptable versus safe joint proposals.
 const before={floorTopY:-.02,beforeHeelY:-.024,beforeToeY:-.034,
  previousCorrectionRad:0,spatialWitnessRequired:true,
  beforeHeelXZ:[0,0],beforeToeXZ:[.24,0]};
 const trials=[
  {delta:-.045,heelY:-.023,toeY:-.029,
   heelXZ:[.021,0],toeXZ:[.261,0]}, // clearer toe, skating heel
  {delta:-.035,heelY:-.022,toeY:-.030,
   heelXZ:[.011,0],toeXZ:[.253,0]} // less Y gain, but legitimate pivot
 ];
 const r=choose({...before,candidates:trials});
 assert.ok(r,'a source-skinned two-point candidate must still be actionable');
 assert.equal(r.candidateIndex,1,'reject 21mm shoe skate even if Y improves');
 assert.equal(r.delta,-.035);
 assert.ok(r.heelShiftXZMeters<=.018&&r.toeShiftXZMeters<=.018);
 assert.equal(choose({...before,candidates:[trials[0]]}),null,
  'do not exchange stone penetration for >18mm apparent loaded-foot skating');
 assert.equal(choose({...before,candidates:[{...trials[1],toeXZ:[Infinity,0]}]}),null);
 assert.equal(choose({...before,beforeHeelXZ:null,candidates:[trials[1]]}),null,
  'missing real-original-space heel origin is not proof of a planted outsole');
 assert.equal(choose({...before,candidates:[{...trials[1],heelXZ:undefined}]}),null);
 assert.equal(choose({...before,candidates:[{...trials[1],heelXZ:[0,.019]}]}),null);
 assert.equal(choose({...before,candidates:[{...trials[1],heelXZ:[0,.018],toeXZ:[.24,.018]}]})?.delta,-.035,
  'boundary permits a valid small native-joint pivot');
 assert.equal(choose({...before,candidates:[trials[1]],previousCorrectionRad:.08}),null,
  'the original 45mrad-per-frame slew still applies');
 // A pure existing no-spatial caller is backward compatible, but the LIVE
 // original source-rig adapter must independently set spatialWitnessRequired.
 const legacy=choose({floorTopY:-.02,beforeHeelY:-.024,beforeToeY:-.034,
  candidates:[{delta:-.035,heelY:-.022,toeY:-.030}]});
 assert.ok(legacy&&legacy.candidateIndex===0);
 const actual=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(actual,/spatialWitnessRequired:true/);
 assert.match(actual,/sourceSkinnedSoleWorld\(patch\.heel\)/);
 assert.match(actual,/sourceSkinnedSoleWorld\(patch\.toe\)/);
 assert.match(actual,/heelShiftXZMeters:accepted\.heelShiftXZMeters/);
});


test('live original stance skinned-foot safety reads each weighted source vertex once per physical pose',async()=>{
 const renderer=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 const start=renderer.indexOf('function planOriginalSourceStanceForMountedAnkle(');
 const end=renderer.indexOf('/**\n * Native-source loaded-sole correction',start);
 assert.ok(start>=0&&end>start,'actual source-rig stance adapter exists');
 const stage=renderer.slice(start,end);
 // Original Y clearance and XZ skating must use the SAME licensed weighted
 // vertex readback. Extra world/skin passes starve software WebGL frames and
 // can produce divergent measurement contracts on the same original pose.
 assert.equal((stage.match(/sourceSkinnedSoleWorld\(patch\.(?:heel|toe)\)/g)||[]).length,4,
  'one xyz sample for heel and toe at baseline and each candidate');
 assert.equal((stage.match(/readOriginalSwingSoleY\(patch\.(?:heel|toe)\)/g)||[]).length,2,
  'only the coarse source-ankle direction trials need standalone Y samples; baseline/final use XYZ');
 assert.match(stage,/heelY=originalHeel\?\.\[1\]\?\?NaN/);
 assert.match(stage,/toeY=originalToe\?\.\[1\]\?\?NaN/);
 assert.match(stage,/afterHeel=witnessHeel\?\.\[1\]\?\?NaN/);
 assert.match(stage,/afterToe=witnessToe\?\.\[1\]\?\?NaN/);
 const sourceStart=renderer.indexOf('function sourceSkinnedSoleWorld(');
 const sourceEnd=renderer.indexOf('function sourceWeaponHandGrip(',sourceStart);
 assert.ok(sourceStart>=0&&sourceEnd>sourceStart);
 const sampler=renderer.slice(sourceStart,sourceEnd);
 assert.doesNotMatch(sampler,/new THREE\.Vector3\(\)/,
  'the bounded per-frame skinned witness should reuse a local module scratch vector');
 assert.match(sampler,/applyBoneTransform/);
 assert.match(sampler,/applyMatrix4/);
 // The prior dedicated Y reader rejected malformed indices. The consolidated
 // XYZ reader must not silently index vertex zero for undefined/stale rigs.
 assert.match(sampler,/Number\.isSafeInteger\(candidate\.index\)/);
 assert.match(sampler,/candidate\.index<0/);
 assert.match(sampler,/candidate\?\.mesh\?\.isSkinnedMesh/);
});


test('witnessed zero-travel native Walking_A holds feet without freezing the mixer crossfade',async()=>{
 const {planImportedLivingSourceStep:sourceStep,planImportedWalkingBlendRate:blend}=await load();
 // Modelled no-travel visible frame, anchored to the ACTUAL imported
 // Walking_A 1.0416666s source duration and source-GLB per-frame contract.
 // This is deliberately a synthetic negative edge, not invented gameplay
 // footage or a claim of a certified world-space planted foot.
 const frame={mode:'move',sourceTime:.367,sourceDuration:1.0416666269302368,
  effectiveSpeed:1.25,frameDelta:.016,frameInterval:.016,
  visible:true,groundedTravel:0,groundedMoving:false,
  walkingClip:true,teleport:false,reducedMotion:false};
 let sourceTime=frame.sourceTime,realBlendSeconds=0;
 for(let i=0;i<12;i++){
  const sample={...frame,sourceTime};
  const step=sourceStep(sample);
  const rate=blend({...sample,sourceStep:step});
  assert.equal(step,0,'a measured stationary visible root never winds imported Walking_A');
  assert.equal(rate,0,'one legal Three.js mixer update still advances other action fades');
  sourceTime+=step*frame.effectiveSpeed;
  realBlendSeconds+=frame.frameDelta;
 }
 assert.equal(sourceTime,frame.sourceTime,'the source walking sole remains stationary');
 assert.ok(realBlendSeconds>.18,'crossfade may settle on real rendered seconds without walking-in-place');
 const resumed={...frame,groundedMoving:true,groundedTravel:.042,sourceTime};
 const resumedStep=sourceStep(resumed),resumedRate=blend({...resumed,sourceStep:resumedStep});
 assert.ok(resumedStep>0&&resumedRate>0,'one real next root translation resumes original feet');
 assert.ok(Math.abs(resumedRate*resumed.frameDelta-resumedStep)<1e-9);
 for(const changed of [
  {mode:'idle'},{walkingClip:false},{teleport:true},{reducedMotion:true},
  {visible:false},{groundedTravel:.05},{groundedTravel:-.01},
  {sourceDuration:0},{sourceTime:NaN},{effectiveSpeed:0},
  {frameInterval:3}
 ]){
  const sample={...frame,...changed};
  assert.notEqual(sourceStep(sample),0,
   'invalid or different owner must not be granted stationary Walking_A freeze');
  assert.equal(blend({...sample,sourceStep:sourceStep(sample)}),null);
 }
 const code=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(code,/planImportedWalkingBlendRate\(\{\.\.\.originalStep,sourceStep\}\)/);
 assert.match(code,/actor\.activeClip\.setEffectiveTimeScale\(normalScale\*walkingBlendRate\)/);
 assert.match(code,/actor\.mixer\.update\(walkMixerDelta\)/);
});


test('verified original Hit_A blends on visible time without outrunning witnessed HP-loss age',async()=>{
 const {planImportedWitnessedHurtMixerFrame:plan,
  planImportedLivingSourceStep:sourceStep}=await load();
 assert.equal(typeof plan,'function','original imported HP-loss source needs an independent fade clock');
 // Genuine licensed Hit_A is used only after a matching positive HP loss.
 // 360ms is from current original mobile/desktop sparse-frame WebGL films;
 // these age and angle numbers are synthetic safety cases, not a claimed
 // visual HP-loss pass or invented damage/target.
 const sample={mode:'hurt',sourceClipName:'Hit_A',verifiedInjury:true,
  age:.28,sourceTime:.05*1.2127,sourceDuration:.667,
  effectiveSpeed:1.2127,frameDelta:.05,frameInterval:.36,
  visible:true,reducedMotion:false,teleport:false};
 const step=sourceStep(sample);
 assert.equal(step,.05,'existing HP evidence still gates source time to <=50ms');
 const planned=plan({...sample,sourceStep:step});
 assert.equal(planned?.mixerDelta,.09,'sparse original frames may consume 90ms of lawful fade');
 assert.ok(Math.abs(planned.actionScale*planned.mixerDelta-step)<1e-10,
  'the true source Hit_A can consume NO additional bone motion');
 assert.ok(planned.actionScale<1,'slow-frame fades must not accelerate injury keyframes');
 const fresh={...sample,age:0,sourceTime:0,sourceStep:0};
 const opening=plan(fresh);
 assert.equal(opening?.mixerDelta,.09,'source keyframe zero may fade into visibility');
 assert.equal(opening?.actionScale,0,'no fatal or unearned shoulder flinch before HP-loss age');
 assert.equal(plan({...sample,frameDelta:.016,frameInterval:.016,sourceStep:.016})?.mixerDelta,.016,
  'ordinary 60Hz playback is unchanged');
 for(const changes of [
  {mode:'attack'},{sourceClipName:'Walking_A'},{verifiedInjury:false},
  {visible:false},{reducedMotion:true},{teleport:true},
  {frameInterval:.8},{frameInterval:NaN},{frameInterval:-1},
  {frameDelta:0},{frameDelta:.08},{sourceDuration:0},
  {sourceStep:-.001},{sourceStep:.08},{effectiveSpeed:0},
  {sourceTime:NaN},{age:NaN},{age:.6},
  {sourceTime:.5,age:.1}
 ])assert.equal(plan({...sample,sourceStep:step,...changes}),null,
  'unwitnessed/noninjury/hidden/invalid clock cannot move the original fade independently');
 const renderer=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(renderer,/planImportedWitnessedHurtMixerFrame\(\{\s*\.\.\.originalStep,sourceStep/);
 assert.match(renderer,/actor\.activeClip\.setEffectiveTimeScale\(normalScale\*injuryFrame\.actionScale\)/);
 assert.match(renderer,/actor\.mixer\.update\(injuryFrame\.mixerDelta\)/);
 assert.match(renderer,/finally\{actor\.activeClip\.setEffectiveTimeScale\(normalScale\);\}/);
});


test('verified combat-start stops outgoing original Walking_A only after the actual root settles',async()=>{
 const {planImportedCombatWalkStop:stop,
  shouldFreezeDeferredImportedCombatWalk:deferred}=await load();
 assert.equal(typeof stop,'function','a licensed moving source foot must not treadmill underneath incoming sword/cast clips');
 assert.equal(typeof deferred,'function','genuine root travel may finish after the source one-shot has started');
 // Current desktop source nine-tick record: tick 7 still blended an incoming
 // 1H_Melee_Attack_Slice_Horizontal (weight ~.417) with outgoing Walking_A.
 // Numbers below are deliberately synthetic contract edge cases, NOT a
 // claim of actual same-frame sole contact or a verified world foot lock.
 const stopped={previousMode:'move',nextMode:'attack',sourceClipName:'Walking_A',
  actionTick:24,ownerAuthorized:true,groundedMoving:false,groundedTravel:.004,
  frameInterval:.2,alive:true,visible:true,teleport:false,reducedMotion:false};
 assert.equal(stop(stopped),true,'an actually halted sword attacker holds the outgoing licensed source stride');
 assert.equal(stop({...stopped,nextMode:'cast'}),true,'a lawful caster must also avoid source walking feet under a stationary cast');
 assert.equal(stop({...stopped,groundedTravel:0,frameInterval:.36}),true,
  'a genuinely motionless root must stop Walking_A even on recorded sparse 360ms WebGL delivery');
 assert.equal(stop({...stopped,groundedTravel:.03}),false,'moving root must NOT be frozen in midstride');
 for(const bad of [
  {previousMode:'idle'},{nextMode:'hurt'},{nextMode:'evade'},{nextMode:'idle'},
  {sourceClipName:'Idle'},{sourceClipName:'Fake_Walking_A'},
  {actionTick:null},{actionTick:-1},{ownerAuthorized:false},
  {groundedMoving:true},{groundedTravel:NaN},{groundedTravel:.05},
  {frameInterval:0},{frameInterval:NaN},{frameInterval:.6},
  {alive:false},{visible:false},{teleport:true},{reducedMotion:true}
 ])assert.equal(stop({...stopped,...bad}),false,
  'unsupported actor/clip/owner/movement cannot get a frozen original knee');
 const ongoing={targetMode:'attack',currentMode:'attack',clipName:'Walking_A',
  targetTick:24,currentTick:24,ownerAuthorized:true,sourceWeight:.4,
  sourceRunning:true,sourcePaused:false,groundedMoving:false,
  groundedTravel:0,frameInterval:.2,alive:true,visible:true,
  teleport:false,reducedMotion:false};
 assert.equal(deferred(ongoing),true,
  'an outgoing licensed mixer action may stop only on the later genuine stationary frame');
 for(const bad of [
  {currentTick:25},{currentMode:'hurt'},{targetMode:'guard'},
  {ownerAuthorized:false},{sourceWeight:0},{sourceRunning:false},
  {sourcePaused:true},{groundedMoving:true},{groundedTravel:.05},
  {visible:false},{alive:false},{teleport:true},{reducedMotion:true}
 ])assert.equal(deferred({...ongoing,...bad}),false,
  'late unrelated/interrupted or moving actor must retire its stale Walking_A');
 const renderer=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(renderer,/planImportedCombatWalkStop\(\{/,
  'the live original 41-joint imported adapter must use the guarded immediate stop');
 assert.match(renderer,/shouldFreezeDeferredImportedCombatWalk\(\{/,
  'deferred genuine root halt must apply to the actual original mixer action');
 assert.match(renderer,/outgoing\.paused=true/,
  'only the original departing source action should be paused, never its incoming combat clip');
});


test('RED: genuine source swing thigh supports a buried airborne toe without moving the opposite loaded shoe',async()=>{
 const {chooseOriginalSourceSwingThighSupport:choose}=await load();
 assert.equal(typeof choose,'function');
 // Exact predecessor 390px source-Walking_A has an airborne heel ~223mm
 // above the -20mm stone, but the same original weighted toe is 61mm BELOW.
 // These are TEST trial inputs; not alleged postchange WebGL measurements.
 const before={left:{heelY:.202,toeY:-.081,heelXZ:[0,0],toeXZ:[0,.22]},
  right:{heelY:-.023,toeY:-.028,heelXZ:[.2,0],toeXZ:[.2,.22]}};
 const make=(delta,toeY,heelY,toeXZ=[.012,.228],other=before.right)=>({
  delta,after:{left:{heelY,toeY,heelXZ:[.01,.005],toeXZ},right:other}
 });
 const owner={mode:'move',sourceClipName:'Walking_A',sourceWeight:.85,
  ownerLocomotion:true,sourceThighAxisVerified:true,sourceChainVerified:true,
  sourceInstanceSame:true,alive:true,visible:true,teleport:false,
  reducedMotion:false,interrupted:false,rootTravel:.036,frameAge:.032,
  side:'left',floorTopY:-.02,previousCorrectionRad:0,before};
 const good=choose({...owner,trials:[
  make(.045,-.074,.201),make(-.045,-.087,.203)
 ]});
 assert.equal(good?.angleRad,.045);
 assert.ok(good.improvementMeters>=.0069&&good.improvementMeters<.0071);
 assert.equal(good.contactLocked,false,'cannot claim foot lock from one original-GLB joint trial');
 const rejected=[
  {mode:'hurt'},{sourceClipName:'Idle'},{sourceWeight:.49},
  {sourceThighAxisVerified:false},{sourceChainVerified:false},
  {sourceInstanceSame:false},{ownerLocomotion:false},
  {alive:false},{visible:false},{teleport:true},{reducedMotion:true},
  {interrupted:true},{rootTravel:0},{frameAge:.32},{side:'right'}
 ];
 for(const bad of rejected)assert.equal(choose({...owner,...bad,trials:[make(.045,-.074,.201)]}),null,
  'a swing hip may only use the matching licensed source evidence');
 for(const unsafe of [
  make(.045,-.074,.201,[.06,.24]), // lateral toe skate
  make(.045,-.093,.20), // deeper real toe
  make(.045,-.074,.13), // collapse airborne heel
  make(.15,-.058,.201), // beyond even severe-burial upperleg slew
  make(.045,-.074,.201,[.012,.228],{...before.right,toeY:-.036}), // moves supporting foot
  make(.045,.04,.201), // floor overshoot
  make(.045,-.079,.201) // <4mm improvement
 ])assert.equal(choose({...owner,trials:[unsafe]}),null,
  'reject a synthetic better-looking shoe unsupported by both actual feet');
 const renderer=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(renderer,/stageOriginalSourceSwingThighAfterMixer\(/,
  'actual source upperleg must be measured and posed, not just a pure helper');
 assert.match(renderer,/chooseOriginalSourceSwingThighSupport\(/);
 assert.match(renderer,/sourceSwingThighCurrentFrameProofs/);
 assert.match(renderer,/readOriginalSwingSoleY\(/);
});


test('RED: the authentic post-ankle source thigh may improve a still buried toe only with reverified same-frame dual-shoe continuity',async()=>{
 const {reconcileOriginalSourceSwingToeProofWithThigh:reconcile}=await load();
 assert.equal(typeof reconcile,'function');
 // Genuine 390px original Walking_A toe after ankle+calf: -63.9156mm
 // world Y against the exact -20mm stone. Candidate below is only a
 // SYNTHETIC verified-thigh trial, never falsely labelled filmed output.
 const source={source:'same-original-GLB-foot-skinned-vertices',side:'right',
  sourceClip:'Walking_A',sourceInstanceId:'original-clone-1',
  beforeToeY:-.0877794,afterToeY:-.0639156,
  beforeHeelY:.2142043,afterHeelY:.2416427,
  floorTopY:-.02,liftMeters:.0238638,
  penetrationAfterMeters:.0439156};
 const current={heelY:.2416427,toeY:-.0639156,
  heelXZ:[.10,.25],toeXZ:[.13,.26]};
 const improved={heelY:.2376427,toeY:-.0569156,
  heelXZ:[.11,.255],toeXZ:[.136,.267]};
 const owner={proof:source,side:'right',sourceInstanceId:'original-clone-1',
  sourceClipName:'Walking_A',floorTopY:-.02,
  before:current,after:improved,thighImprovementMeters:.007};
 const final=reconcile(owner);
 assert.ok(final,'a real post-mixer thigh trial may complement a measured ankle/calf rescue');
 assert.equal(final.afterToeY,improved.toeY);
 assert.equal(final.afterHeelY,improved.heelY);
 assert.ok(Math.abs(final.liftMeters-(source.liftMeters+.007))<1e-7);
 assert.ok(Math.abs(final.penetrationAfterMeters-.0369156)<1e-7);
 assert.ok(Math.abs(final.combinedSourceThighMeters-.007)<1e-9);
 assert.equal(final.contactLocked,false,'neither trial proves a planted foot');
 for(const bad of [
  {sourceInstanceId:'different-clone'}, {sourceClipName:'Idle'},
  {side:'left'}, {floorTopY:.5},
  {before:{...current,toeY:current.toeY-.006}},
  {after:{...improved,toeY:current.toeY-.01}},
  {after:{...improved,toeY:current.toeY+.09}},
  {after:{...improved,heelY:current.heelY-.06}},
  {proof:{...source,sourceInstanceId:'other-clone'}},
  {proof:{...source,afterHeelY:NaN}},
  {thighImprovementMeters:.0001}
 ])assert.equal(reconcile({...owner,...bad}),null,
  'stale, foreign, unsafe, or unmeasured source-foot revisions fail closed');
 const renderer=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 const begin=renderer.indexOf('function stageOriginalSourceSwingThighAfterMixer(');
 const end=renderer.indexOf('function stageRigLegsAfterMixer(',begin);
 assert.ok(begin>0&&end>begin,'same real imported rig stage is still present');
 const stage=renderer.slice(begin,end);
 assert.match(stage,/reconcileOriginalSourceSwingToeProofWithThigh\(/,
  'the actual final weighted skin sample must update any earlier toe rescue');
 assert.match(stage,/sourceSwingToeCurrentFrameProofs\[side\]/,
  'same-frame original shoe evidence must remain attributable after a thigh trial');
 assert.doesNotMatch(stage,/actor\.sourceSwingToeCurrentFrameProofs\?\.\[side\]\s*\|\|/,
  'a verified same-side original ankle rescue must not blanket-block further safe source thigh movement');
 assert.doesNotMatch(stage,/actor\.sourceSwingCalfCurrentFrameMask\s*\|\|/,
  'a real source calf rescue is not a blanket rejection of a separately remeasured upperleg');
});


test('RED: only witnessed severe source-swing toe burial may select a wider but bounded authentic upperleg trial',async()=>{
 const {chooseOriginalSourceSwingThighSupport:choose}=await load();
 // Original-GLB 390px frame: source heel 249mm up, toe 57.4mm below
 // world zero against stone top -20mm. The trial poses here are hypothetical
 // inputs until remeasured on original skinned vertices in WebGL.
 const before={left:{heelY:.24918,toeY:-.05742,heelXZ:[0,0],toeXZ:[0,.20]},
  right:{heelY:-.023,toeY:-.030,heelXZ:[.25,0],toeXZ:[.25,.20]}};
 const owner={mode:'move',sourceClipName:'Walking_A',sourceWeight:.91,
  ownerLocomotion:true,sourceThighAxisVerified:true,sourceChainVerified:true,
  sourceInstanceSame:true,alive:true,visible:true,teleport:false,
  reducedMotion:false,interrupted:false,rootTravel:.038,frameAge:.032,
  side:'left',floorTopY:-.02,previousCorrectionRad:.045,before};
 const trial=(delta,toe,heel,toeXZ=[.018,.209],other=before.right)=>({
  delta,after:{left:{heelY:heel,toeY:toe,heelXZ:[.012,.003],toeXZ},
   right:other}
 });
 const selected=choose({...owner,trials:[
  trial(.045,-.05149,.25499,[.008,.205]),
  trial(.09,-.0456,.2604,[.018,.209]),
  trial(-.045,-.064,.244)
 ]});
 assert.equal(selected?.angleRad,.09,
  'real two-point skinned trial can improve residual swing burial without arbitrary foot lock');
 assert.ok(selected.improvementMeters>.011&&selected.improvementMeters<.012);
 assert.equal(selected.contactLocked,false);
 for(const bad of [
  {trials:[trial(.15,-.037,.2604)]},
  {trials:[trial(.09,-.0456,.2604,[.038,.209])]},
  {trials:[trial(.09,-.0456,.200)]},
  {trials:[trial(.09,-.0456,.2604,[.018,.209],{...before.right,toeY:-.038})]},
  {before:{...before,left:{...before.left,toeY:-.025}},
   trials:[trial(.09,-.013,.2604)]},
  {previousCorrectionRad:-.045,trials:[trial(.09,-.0456,.2604)]},
  {sourceWeight:.3,trials:[trial(.09,-.0456,.2604)]}
 ])assert.equal(choose({...owner,...bad}),null,
  'severe-penetration assist cannot bypass bounded joints, both shoes, or owner evidence');
 const renderer=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 const start=renderer.indexOf('function stageOriginalSourceSwingThighAfterMixer(');
 const end=renderer.indexOf('function stageRigLegsAfterMixer(',start);
 const stage=renderer.slice(start,end);
 assert.match(stage,/sourceSwingThighAxisAudit/);
 assert.match(stage,/sourceSkinnedSoleWorld/);
 assert.match(stage,/chooseOriginalSourceSwingThighSupport/);
 assert.match(stage,/\.09/,'severe-burial larger trial must be independently skinned and measured in live imported GLB');
});


test('verified opposite original stance shoe may coexist with a same-frame swing thigh',async()=>{
 const {verifyOriginalSourceOppositeStanceForSwingThigh:verify}=await load();
 assert.equal(typeof verify,'function');
 const measured={heelY:-.025825839362513623,toeY:-.02152517495108694,
  heelXZ:[-.12,-.2],toeXZ:[-.10,.01]};
 const proof={
  source:'same-original-GLB-two-point-stanced-shoe',side:'left',
  sourceInstanceId:'same-original-clone',sourceClip:'Walking_A',
  beforeHeelY:-.0233099626013819,beforeToeY:-.03162484019010477,
  afterHeelY:measured.heelY,afterToeY:measured.toeY,
  beforeWorstMeters:.011624840190104766,afterWorstMeters:.005825839362513623,
  floorTopY:-.02,appliedAngleRad:-.045
 };
 const args={proof,measured,oppositeSide:'left',sourceInstanceId:'same-original-clone',
  sourceClipName:'Walking_A',floorTopY:-.02};
 assert.equal(verify(args)?.sameFrameLoadedStance,true,
  'real left shoe correction should not veto a separately verified right swing trial');
 for(const bad of [
  {sourceInstanceId:'different-clone'},{sourceClipName:'Idle'},
  {oppositeSide:'right'},{floorTopY:0},
  {measured:{...measured,toeY:measured.toeY+.006}},
  {measured:{...measured,heelY:measured.heelY-.005}},
  {proof:{...proof,sourceClip:'Idle'}},
  {proof:{...proof,sourceInstanceId:'stale-clone'}},
  {proof:{...proof,afterWorstMeters:.018}},
  {proof:{...proof,afterToeY:.02}},
  {proof:{...proof,appliedAngleRad:NaN}},
  {proof:null}
 ])assert.equal(verify({...args,...bad}),null,
  'unmatched clip, actor, floor or unmeasured loaded shoe must never release swing trial');
 const renderer=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 const start=renderer.indexOf('function stageOriginalSourceSwingThighAfterMixer(');
 const end=renderer.indexOf('function stageRigLegsAfterMixer(',start);
 const stage=renderer.slice(start,end);
 assert.match(stage,/verifyOriginalSourceOppositeStanceForSwingThigh\(/,
  'live original skinned opposite loaded shoe needs explicit same-frame evidence');
 assert.doesNotMatch(stage,/actor\.sourceStanceSoleCurrentFrameProofs\?\.\[opposite\]\s*\|\|/,
  'an already proven opposite stance shoe must not blanket-veto an independently measured swing thigh');
});


// PRECHANGE evidence: native 390px original Walking_A tick 8 at head 3927623
// measured the licensed right upperleg -90mrad improving the original weighted
// toe from -55.014868mm to -44.068186mm, still 24.068mm inside -20mm stone.
// The following -135mrad examples are SYNTHETIC follow-up probes until actual
// source-skin readback and moving footage confirm or reject them.
test('RED: original swing thigh can grow from genuine prior 90mrad support by only 45mrad after a new two-shoe probe',async()=>{
 const {chooseOriginalSourceSwingThighSupport:choose}=await load();
 const before={
  right:{heelY:.2504383278648371,toeY:-.0550148681545242,
   heelXZ:[-2.67808146,-7.10639257],toeXZ:[-2.69538227,-7.13284927]},
  left:{heelY:.006432512387845958,toeY:-.0059309252918811435,
   heelXZ:[-2.70737881,-6.95440746],toeXZ:[-2.97744464,-6.92935275]}
 };
 const trial=(delta,toeY=-.039,heelY=.267,opposite=before.left)=>({
  delta,after:{right:{heelY,toeY,
   heelXZ:[-2.6775,-7.1063],toeXZ:[-2.679,-7.1328]},
   left:opposite}
 });
 const owner={mode:'move',sourceClipName:'Walking_A',sourceWeight:1,
  ownerLocomotion:true,sourceThighAxisVerified:true,sourceChainVerified:true,
  sourceInstanceSame:true,alive:true,visible:true,teleport:false,
  reducedMotion:false,interrupted:false,rootTravel:.042,frameAge:.034,
  side:'right',floorTopY:-.02,previousCorrectionRad:-.09,before};
 const chosen=choose({...owner,trials:[trial(-.045,-.048),trial(-.09,-.0440681861),
  trial(-.135)]});
 assert.equal(chosen?.angleRad,-.135,
  'only a prior genuine 90mrad supported pose can qualify for a fresh +45mrad trial');
 assert.ok(chosen?.improvementMeters>.015&&chosen?.improvementMeters<.017);
 assert.equal(chosen?.oppositeFootVerified,true);
 assert.equal(chosen?.contactLocked,false);
 assert.equal(choose({...owner,previousCorrectionRad:-.135,trials:[trial(-.135)]})?.angleRad,-.135,
  'same signed, newly measured source skin may retain the pose without further rotation');
 for(const bad of [
  {previousCorrectionRad:0},
  {previousCorrectionRad:-.045},
  {previousCorrectionRad:.09},
  {previousCorrectionRad:NaN},
  {previousCorrectionRad:-.18},
  {sourceWeight:.3},
  {sourceClipName:'Idle'},
  {rootTravel:0},
  {frameAge:.3},
  {reducedMotion:true},
  {teleport:true},
  {interrupted:true},
  {before:{...before,right:{...before.right,toeY:-.037}}},
  {trials:[trial(-.18)]},
  {trials:[trial(-.135,-.062)]},
  {trials:[trial(-.135,-.039,.19)]},
  {trials:[trial(-.135,-.039,.267,{...before.left,toeY:-.019})]}
 ])assert.equal(choose({...owner,trials:[trial(-.135)],...bad}),null,
  'unwitnessed 135mrad, inactive actor, changed source, worse shoe or unsupported live foot must be rejected');
 const renderer=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 const begin=renderer.indexOf('function stageOriginalSourceSwingThighAfterMixer(');
 const end=renderer.indexOf('function stageRigLegsAfterMixer(',begin);
 const stage=renderer.slice(begin,end);
 assert.match(stage,/previous[\s\S]*?\.135/,
  'real imported-rig trials must be conditionally exposed only after prior verified 90mrad');
 assert.match(stage,/sourceSkinnedSoleWorld/,
  'new trial must measure the real source skinned sole, not a guessed final angle');
});


// Exact current original-GLB mobile tick 8 (source artifact #13956471938):
// the original left swing shoe was -92.577819mm at the weighted toe, while
// the right shoe sat -22.697/-22.645mm at the actual -20mm stone top.
// -90mrad then improved the left toe to -81.172176mm but arrived immediately
// after a prior 0mrad supported original upperleg. Those are filmed source
// facts; the intermediate -45 and following -135 samples below are SYNTHETIC
// bounded joint trajectories, not claimed rendered improvements.
test('RED: native source swing thigh must build through genuine 45mrad steps, never jump 0 to 90mrad in one visible frame',async()=>{
 const {chooseOriginalSourceSwingThighSupport:choose}=await load();
 const before={
  left:{heelY:.2142452297000233,toeY:-.09257781947355347,
   heelXZ:[-2.66997658,-6.94763936],toeXZ:[-2.68279195,-6.93426121]},
  right:{heelY:-.022697219086271973,toeY:-.022645155972921854,
   heelXZ:[-2.70615892,-7.10992178],toeXZ:[-2.97637629,-7.13529380]}
 };
 const trial=(delta,toeY,heelY,toeX)=>{
  return {delta,after:{
   left:{heelY,toeY,heelXZ:[-2.6697,-6.9474],
    toeXZ:[toeX,-6.93385]},right:{...before.right}
  }};
 };
 const fortyFive=trial(-.045,-.0863,.2200,-2.6702);
 const ninety=trial(-.09,-.08117217582850386,.22556160534,-2.65840335);
 const oneThirtyFive=trial(-.135,-.0755,.231,-2.6582);
 const owner={mode:'move',sourceClipName:'Walking_A',sourceWeight:1,
  ownerLocomotion:true,sourceThighAxisVerified:true,sourceChainVerified:true,
  sourceInstanceSame:true,alive:true,visible:true,teleport:false,
  reducedMotion:false,interrupted:false,rootTravel:.042,frameAge:.034,
  side:'left',floorTopY:-.02,before};
 const choices=[fortyFive,ninety,oneThirtyFive];
 const first=choose({...owner,previousCorrectionRad:0,trials:choices});
 assert.equal(first?.angleRad,-.045,
  'the true first visible correction must not snap imported upperleg 90mrad');
 const second=choose({...owner,previousCorrectionRad:-.045,trials:choices});
 assert.equal(second?.angleRad,-.09,
  'lawful second visible frame may grow 45→90mrad using two real shoe reads');
 const third=choose({...owner,previousCorrectionRad:-.09,trials:choices});
 assert.equal(third?.angleRad,-.135,
  'only the witnessed 90mrad predecessor may test the third 135mrad pose');
 assert.equal(choose({...owner,previousCorrectionRad:0,trials:[ninety]}),null,
  'missing physical intermediate original-joint measurement must fail closed');
 for(const unsafe of [
  {teleport:true},{reducedMotion:true},{interrupted:true},{visible:false},
  {sourceClipName:'Idle'},{rootTravel:0},{sourceInstanceSame:false}
 ])assert.equal(choose({...owner,...unsafe,previousCorrectionRad:0,trials:choices}),null);
 const renderer=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(renderer,/swingThighAssistRad/);
 assert.match(renderer,/sourceSwingThighCurrentFrameProofs/);
});


test('RED: real original Walking_A swing upperleg releases its witnessed angle gradually when only a two-shoe-safe smaller pose remains',async()=>{
 const {chooseOriginalSourceSwingThighSupport:choose,
  planOriginalSourceSwingThighEaseOut:ease}=await load();
 assert.equal(typeof ease,'function','source-native thigh needs a measured 45mrad/frame release path');
 const baseFoot={heelY:-.023,toeY:-.025,heelXZ:[.25,0],toeXZ:[.25,.20]};
 const before={left:{heelY:.215,toeY:-.049,heelXZ:[0,0],toeXZ:[0,.20]},
  right:baseFoot};
 const candidate=(angle,afterToeY=-.047,heelY=.216,loaded=baseFoot,
  toeXZ=[.008,.204])=>({delta:angle,after:{
   left:{heelY,toeY:afterToeY,heelXZ:[.006,.002],toeXZ},
   right:loaded}});
 const owner={mode:'move',sourceClipName:'Walking_A',sourceWeight:.92,
  ownerLocomotion:true,sourceThighAxisVerified:true,sourceChainVerified:true,
  sourceInstanceSame:true,alive:true,visible:true,teleport:false,
  reducedMotion:false,interrupted:false,rootTravel:.034,frameAge:.03,
  side:'left',floorTopY:-.02,previousCorrectionRad:.135,before,
  priorSourceProofVerified:true};
 const safe=candidate(.09);
 assert.equal(choose({...owner,trials:[safe]}),null,
  'a 2mm non-rescue cannot pass the existing 4mm toe-lift rule');
 const release=ease({...owner,trials:[safe]});
 assert.equal(release?.angleRad,.09,'do not snap a genuinely supported 135mrad leg to source rest');
 assert.equal(release?.continuityRelease,true);
 assert.equal(release?.contactLocked,false);
 assert.equal(release?.oppositeFootVerified,true);
 const second=ease({...owner,previousCorrectionRad:.09,
  before:{...before,left:{...before.left,toeY:-.031}},
  trials:[candidate(.045,-.029)]});
 assert.equal(second?.angleRad,.045,'90→45mrad requires a new original dual-foot read');
 const neutral=ease({...owner,previousCorrectionRad:.045,
  before:{...before,left:{...before.left,toeY:-.022}},
  trials:[{delta:0,after:{left:{...before.left,toeY:-.022},right:baseFoot}}]});
 assert.equal(neutral?.angleRad,0,'45→0 can legally return to licensed source pose');
 for(const bad of [
  {priorSourceProofVerified:false},{sourceClipName:'Idle'},{sourceInstanceSame:false},
  {teleport:true},{interrupted:true},{reducedMotion:true},{alive:false},
  {sourceWeight:.4},{rootTravel:.4},{frameAge:.3},
  {previousCorrectionRad:-.135},{previousCorrectionRad:0},
  {trials:[candidate(.045)]}, // 135→45 skips the 90mrad verified stage
  {trials:[candidate(.09,-.055)]}, // newly buried toe
  {trials:[candidate(.09,-.047,.216,{...baseFoot,toeY:-.037})]},
  {trials:[candidate(.09,-.047,.216,baseFoot,[.08,.20])]}
 ])assert.equal(ease({...owner,trials:[safe],...bad}),null,
  'unverified source, lost travel, original-shoe drag or a >45mrad jump must fail closed');
 const renderer=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 const start=renderer.indexOf('function stageOriginalSourceSwingThighAfterMixer(');
 const end=renderer.indexOf('function stageRigLegsAfterMixer(',start);
 const live=renderer.slice(start,end);
 assert.match(live,/planOriginalSourceSwingThighEaseOut\(/,
  'real Three.js must re-read and pose the original licensed upperleg, not merely advertise a helper');
 assert.match(live,/sourceSwingThighEaseOutFrames/,
  'witnessed continuity releases need their own bounded readable evidence');
});

test('quiet-return reaches live original source thigh even once the skinned toe is near stone',async()=>{
 const renderer=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 const begin=renderer.indexOf('function stageOriginalSourceSwingThighAfterMixer(');
 const end=renderer.indexOf('function stageRigLegsAfterMixer(',begin);
 const stage=renderer.slice(begin,end);
 assert.ok(begin>0&&end>begin,'inspect the actual native Three.js source thigh stage');
 assert.match(stage,/\(swing\.toeY>=-\.028&&\(!priorProof\|\|swing\.toeY>\.015\)\)/,
  'true prior source proof may ease a recovered original toe without an unbounded new hip rescue');
 assert.match(stage,/planOriginalSourceSwingThighEaseOut\(/);
});


test('severely buried original Walking_A swing holds its already-witnessed upperleg instead of snapping before safe release',async()=>{
 const {planOriginalSourceSwingThighHold:hold}=await load();
 assert.equal(typeof hold,'function','a verified source-clip leg must have a bounded continuity hold');
 const loaded={heelY:-.024,toeY:-.026,heelXZ:[.24,0],toeXZ:[.24,.18]};
 const before={left:{heelY:.218,toeY:-.091,heelXZ:[0,0],toeXZ:[0,.20]},right:loaded};
 const safe={delta:-.09,after:{
  left:{heelY:.223,toeY:-.089,heelXZ:[.005,0],toeXZ:[.006,.201]},
  right:{...loaded,heelY:-.0245,toeY:-.0264}
 }};
 const owner={mode:'move',sourceClipName:'Walking_A',sourceWeight:.93,
  ownerLocomotion:true,sourceThighAxisVerified:true,sourceChainVerified:true,
  sourceInstanceSame:true,priorSourceProofVerified:true,alive:true,visible:true,
  teleport:false,reducedMotion:false,interrupted:false,rootTravel:.045,
  frameAge:.045,side:'left',floorTopY:-.02,previousCorrectionRad:-.09,before};
 const result=hold({...owner,trials:[safe]});
 assert.equal(result?.angleRad,-.09,'preserve the exact preceding proved original joint angle');
 assert.equal(result?.continuityHold,true,'hold is neither a NEW rescue nor a quiet release');
 assert.equal(result?.contactLocked,false,'no fabricated IK or planted-foot claim');
 assert.ok(result?.improvementMeters>=.001,'source weighted toe still improves in this frame');
 for(const bad of [
  {priorSourceProofVerified:false},{sourceInstanceSame:false},
  {sourceClipName:'Idle'},{sourceWeight:.4},{teleport:true},
  {reducedMotion:true},{interrupted:true},{alive:false},{visible:false},
  {rootTravel:0},{frameAge:.2},{previousCorrectionRad:.135},
  {before:{...before,left:{...before.left,toeY:-.036}}},
  {trials:[{delta:-.09,after:{left:{...safe.after.left,toeY:-.096},right:loaded}}]},
  {trials:[{delta:-.09,after:{left:{...safe.after.left,toeXZ:[.1,.2]},right:loaded}}]},
  {trials:[{delta:-.09,after:{left:safe.after.left,right:{...loaded,heelY:-.04}}}]}
 ])assert.equal(hold({...owner,trials:[safe],...bad}),null,
  'invalid owner, no severe burial, unsafe opposite shoe or unmeasured joint must fail closed');
 const renderer=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 const start=renderer.indexOf('function stageOriginalSourceSwingThighAfterMixer(');
 const end=renderer.indexOf('function stageRigLegsAfterMixer(',start);
 const native=renderer.slice(start,end);
 assert.match(native,/planOriginalSourceSwingThighHold\(/,
  'original skinned source joint must actually consume the verified hold');
 assert.match(native,/sourceSwingThighHoldFrames/,
  'hold and release must retain distinct read-only evidence');
});


test('RED: a genuine same-frame ankle/calf proof may coexist with a previously supported original Walking_A swing-thigh HOLD',async()=>{
 const {reconcileOriginalSourceSwingToeProofWithThigh:reconcile}=await load();
 // Physical source-GLB WebGL at exact predecessor 0b30c1eee290:
 // mobile original Walking_A toe remained ~79.47mm below the real stone
 // after a legally measured same-frame source foot correction; a continuity
 // hold must not be vetoed solely because that proof exists.
 // The proposed 1.5mm thigh improvement here is a SYNTHETIC unit trial;
 // no claim that the new hold was observed in a WebGL movie.
 const proof={source:'same-original-GLB-foot-skinned-vertices',
  side:'right',sourceClip:'Walking_A',sourceInstanceId:'original-clone',
  floorTopY:-.02,beforeToeY:-.105725,afterToeY:-.099469,
  beforeHeelY:.17229,afterHeelY:.176928,liftMeters:.006256,
  penetrationAfterMeters:.079469};
 const before={heelY:.176928,toeY:-.099469,
  heelXZ:[.11,.03],toeXZ:[.14,.21]};
 const after={heelY:.177528,toeY:-.097969,
  heelXZ:[.111,.031],toeXZ:[.141,.211]};
 const owner={proof,side:'right',sourceInstanceId:'original-clone',
  sourceClipName:'Walking_A',floorTopY:-.02,
  before,after,thighImprovementMeters:.0015};
 assert.equal(reconcile(owner),null,
  '1.5mm is insufficient to invent a NEW 4mm source thigh rescue');
 const held=reconcile({...owner,continuityKind:'hold'});
 assert.ok(held,'a physically measured 1.5mm native thigh HOLD must preserve the valid same-frame ankle+calf proof');
 assert.equal(held.combinedSourceThighKind,'hold');
 assert.equal(held.contactLocked,false);
 assert.ok(Math.abs(held.afterToeY-after.toeY)<1e-8);
 assert.ok(Math.abs(held.liftMeters-(proof.liftMeters+.0015))<1e-6);
 for(const bad of [
  {continuityKind:'invented'},
  {continuityKind:'hold',thighImprovementMeters:.0004},
  {continuityKind:'hold',thighImprovementMeters:.041},
  {continuityKind:'hold',sourceInstanceId:'different-clone'},
  {continuityKind:'hold',sourceClipName:'Idle'},
  {continuityKind:'hold',after:{...after,toeXZ:[.23,.22]}},
  {continuityKind:'hold',before:{...before,toeY:-.14}}
 ])assert.equal(reconcile({...owner,...bad}),null,
  'unwitnessed same-frame thigh or mismatched clone/clip/foot must fail closed');
 const native=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 const stage=native.slice(native.indexOf('function stageOriginalSourceSwingThighAfterMixer('),
  native.indexOf('function stageRigLegsAfterMixer('));
 assert.match(stage,/planOriginalSourceSwingThighHold\(/);
 assert.match(stage,/continuityKind:continuity/,
  'the live original source-skin adapter must reconcile same-frame ankle and measured thigh holds');
 assert.match(stage,/earlierToeProof&&.*continuity===.hold./,
  'a hold and its existing same-frame ankle proof must pass final original heel/toe reconciliation');
});


test('RED: a measured same-frame source ankle proof survives a bounded original thigh release',async()=>{
 const {reconcileOriginalSourceSwingToeProofWithThigh:reconcile}=await load();
 // The original heel/toe coordinates below are contract fixtures, not a claim
 // of a new WebGL foot plant. This guards a continuity transition that the
 // preceding adapter vetoed whenever an original ankle/calf proof coexisted.
 const proof={source:'same-original-GLB-foot-skinned-vertices',
  side:'left',sourceClip:'Walking_A',sourceInstanceId:'same-licensed-clone',
  floorTopY:-.02,beforeToeY:-.033256,afterToeY:-.027,
  beforeHeelY:.147,afterHeelY:.152,liftMeters:.006256};
 const before={heelY:.152,toeY:-.027,
  heelXZ:[.11,.03],toeXZ:[.14,.21]};
 const after={heelY:.1524,toeY:-.0282,
  heelXZ:[.111,.031],toeXZ:[.141,.211]};
 const owner={proof,side:'left',sourceInstanceId:'same-licensed-clone',
  sourceClipName:'Walking_A',floorTopY:-.02,before,after,
  thighImprovementMeters:-.0012,continuityKind:'release'};
 const accepted=reconcile(owner);
 assert.ok(accepted,'same-frame proven original foot + <=1.5mm measured thigh release must be reconcilable');
 assert.equal(accepted.combinedSourceThighKind,'release');
 assert.equal(accepted.contactLocked,false);
 assert.ok(Math.abs(accepted.liftMeters-.005056)<1e-6,
  'signed true source toe motion replaces the earlier same-frame receipt');
 for(const bad of [
  {continuityKind:'invented'},
  {sourceInstanceId:'stale-original'},
  {sourceClipName:'Idle'},
  {thighImprovementMeters:-.003},
  {after:{...after,toeY:-.0305}},
  {after:{...after,toeXZ:[.23,.21]}},
  {proof:{...proof,liftMeters:.0041,beforeToeY:-.0311}}
 ])assert.equal(reconcile({...owner,...bad}),null,
  'unwitnessed same-frame foot, too much burial or insufficient final lift must fail closed');
 const native=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 const stage=native.slice(native.indexOf('function stageOriginalSourceSwingThighAfterMixer('),
  native.indexOf('function stageRigLegsAfterMixer('));
 assert.match(stage,/continuity==='release'/);
 assert.doesNotMatch(stage,/else if\(!earlierToeProof\)\s*\{\s*selected=planOriginalSourceSwingThighEaseOut/,
  'existing same-frame source-ankle proof must not arbitrarily force a one-frame upperleg reset');
 assert.match(stage,/continuityKind:continuity/,
  'live Three.js source mixer must reconcile a measured release before retaining the source joint');
});


test('real 390px source Walking_A loaded shoe gets bounded lateral-slide relief, not an invented planted foot',async()=>{
 const {planOriginalSourceStanceSlideRelief:plan}=await load();
 // Original CC0 skinned 390px frame 85 -> 86 (true WebGL run #43275816923,
 // source-sole patch artifact 13971662542), NOT a synthetic shoe animation.
 const previous={
  left:{heel:[-3.7622763645869743,.19619061649808212,-6.964968636370414],
   toe:[-3.936331449985617,-.022848690971393016,-6.936989276434345]},
  right:{heel:[-3.673845306509682,-.015892989888730707,-7.117537969611167],
   toe:[-3.9433384106340967,-.022593029997116175,-7.1402535772176385]}
 };
 const current={
  left:{heel:[-3.7521558152800223,.1624096473608331,-6.958929690108859],
   toe:[-3.93614977336351,-.03730755226041721,-6.939063081035758]},
  right:{heel:[-3.6117278594795095,-.03542813690635666,-7.119786377236892],
   toe:[-3.880277883348968,-.03294688530907301,-7.142783473794835]}
 };
 const evidence={mode:'move',sourceClipName:'Walking_A',sourceWeight:1,
  sourceInstanceSame:true,ownerLocomotion:true,rootTravel:.0445,frameInterval:.05,
  alive:true,visible:true,teleport:false,reducedMotion:false,interrupted:false,
  floorTopY:-.02,previous,current};
 const result=plan(evidence);
 assert.equal(result?.side,'right','only source-loaded right shoe qualifies');
 assert.ok(result.reductionMeters>.014&&result.reductionMeters<=.01800001);
 assert.ok(result.worldDeltaX<-.014&&Math.abs(result.worldDeltaZ)<.004);
 assert.equal(result.contactLocked,false,'never convert visual skid reduction into a fictitious IK lock');
 assert.ok(result.reductionMeters<=.55*evidence.rootTravel);
 for(const alteration of [
  {mode:'hurt'},{sourceClipName:'Idle'},{sourceWeight:.45},
  {sourceInstanceSame:false},{ownerLocomotion:false},{rootTravel:0},
  {rootTravel:.6},{frameInterval:.9},{visible:false},{alive:false},
  {teleport:true},{interrupted:true},{reducedMotion:true},
  {current:{...current,right:{...current.right,heel:[NaN,0,0]}}},
  {current:{...current,right:{...current.right,toe:[-4.7,-.033,-7.14]}}},
  {previous:{...previous,left:{heel:[-3.76,-.018,-6.96],toe:[-3.93,-.019,-6.94]}},
   current:{...current,left:{heel:[-3.75,-.02,-6.95],toe:[-3.93,-.02,-6.94]}}}
 ])assert.equal(plan({...evidence,...alteration}),null,
  'reject unlicensed or ambiguous movement: '+Object.keys(alteration).join(','));
});


test('real mobile 87-to-88 source-shoe edge permits bounded near-stone skid relief without pretending to plant',async()=>{
 const {planOriginalSourceStanceSlideRelief:plan}=await load();
 // Genuine 12-Nov exact 507b2384 source-GLB 390px consecutive WebGL
 // displayed frames 87 -> 88, source-contact-patch artifact #13980180305.
 // Right weighted heel/toe remain just 30-31mm above stone (-.020m),
 // while left heel is visibly airborne. The old <=29mm stance ceiling
 // rejected this 75-77mm right-shoe skid even though 53mm root travel was
 // independently recorded. Not a claim of genuine contact or foot-lock IK.
 const previous={
  left:{heel:[-3.77696997284812,.21774047687102596,-6.956310767028135],
   toe:[-3.9455424221000004,-.005926448895619574,-6.9348156815946425]},
  right:{heel:[-3.681952925413135,.011020193262167806,-7.1148199717448595],
   toe:[-3.9513126825531684,.005419964807038423,-7.137881480700061]}
 };
 const current={
  left:{heel:[-3.7644770134980448,.20225492367019898,-6.967943101932226],
   toe:[-3.9520706015118874,.00869395468389629,-6.945516938516327]},
  right:{heel:[-3.6076568055217795,.0027496361572047386,-7.126670814236185],
   toe:[-3.8749458346541568,.010175487883357724,-7.149489176799761]}
 };
 const observed={mode:'move',sourceClipName:'Walking_A',sourceWeight:1,
  sourceInstanceSame:true,ownerLocomotion:true,rootTravel:.053,
  frameInterval:.05,alive:true,visible:true,teleport:false,
  reducedMotion:false,interrupted:false,floorTopY:-.02,previous,current};
 const supported=plan(observed);
 assert.equal(supported?.side,'right',
  'accept only the uniquely near-stone right source shoe, not a fictitious plant');
 assert.ok(supported?.reductionMeters>=.004&&supported.reductionMeters<=.018000001);
 assert.equal(supported?.contactLocked,false);
 assert.ok(supported.reductionMeters<=.55*observed.rootTravel);
 const borrowed=plan({...observed,rootTravel:0,
  recentRootTravel:.02395046528205215,recentTravelAge:.0333});
 assert.equal(borrowed?.side,'right',
  'the measured fixed-tick lull also has an independently witnessed 33ms-old real root step');
 assert.ok(borrowed.reductionMeters<=.55*.02395046528205215);
 for(const bad of [
  {current:{...current,right:{...current.right,toe:[
   current.right.toe[0],.016,current.right.toe[2]]}}},
  // A genuine 19mm projected-span excursion is allowed ONLY on the
  // opposite airborne source shoe; deformation >25mm still fails closed.
  {current:{...current,left:{...current.left,toe:[
   current.left.toe[0]-.055,current.left.toe[1],current.left.toe[2]]}}},
  // The near-stone supporting original shoe retains its strict 18mm
  // world-XZ heel/toe-span integrity gate.
  {current:{...current,right:{...current.right,toe:[
   current.right.toe[0]+.035,current.right.toe[1],current.right.toe[2]]}}},
  {previous:{...previous,right:{...previous.right,heel:[
   previous.right.heel[0],.020,previous.right.heel[2]]}}},
  {sourceInstanceSame:false},{sourceClipName:'Idle'},
  {sourceWeight:.40},{ownerLocomotion:false},{teleport:true},
  {reducedMotion:true},{interrupted:true},{visible:false},
  {recentRootTravel:0,rootTravel:0}
 ])assert.equal(plan({...observed,...bad}),null,
  'reject floating, stale or unauthorized source stance: '+Object.keys(bad).join(','));
});

test('genuine source Walking_A skid can use only a fresh witnessed root step across displayed same-tick frames',async()=>{
 const {planOriginalSourceStanceSlideRelief:plan}=await load();
 // Actual licensed player_swordsman 390px WebGL displayed frames 85 -> 86,
 // source-sole artifact 13971662542. Root moved 44.5mm on its last legal
 // source tick, then remains stationary during source-mixer rAF playback.
 const previous={
  left:{heel:[-3.7622763645869743,.19619061649808212,-6.964968636370414],
   toe:[-3.936331449985617,-.022848690971393016,-6.936989276434345]},
  right:{heel:[-3.673845306509682,-.015892989888730707,-7.117537969611167],
   toe:[-3.9433384106340967,-.022593029997116175,-7.1402535772176385]}
 };
 const current={
  left:{heel:[-3.7521558152800223,.1624096473608331,-6.958929690108859],
   toe:[-3.93614977336351,-.03730755226041721,-6.939063081035758]},
  right:{heel:[-3.6117278594795095,-.03542813690635666,-7.119786377236892],
   toe:[-3.880277883348968,-.03294688530907301,-7.142783473794835]}
 };
 const truth={mode:'move',sourceClipName:'Walking_A',sourceWeight:1,
  sourceInstanceSame:true,ownerLocomotion:true,rootTravel:0,
  recentRootTravel:.0445,recentTravelAge:.05,frameInterval:.05,
  alive:true,visible:true,teleport:false,reducedMotion:false,
  interrupted:false,floorTopY:-.02,previous,current};
 const accepted=plan(truth);
 assert.equal(accepted?.side,'right',
  'a genuine 50ms old 44.5mm root displacement can witness an observed original 62mm skinned shoe drift');
 assert.ok(accepted.reductionMeters>=.004&&accepted.reductionMeters<=.018000001);
 assert.equal(accepted.contactLocked,false);
 for(const override of [
  {recentRootTravel:0},{recentRootTravel:.007},{recentRootTravel:.30},
  {recentTravelAge:.181},{recentTravelAge:-.001},{recentTravelAge:NaN},
  {recentRootTravel:NaN},{rootTravel:NaN},{rootTravel:.24},
  {frameInterval:.4},{sourceInstanceSame:false},{sourceClipName:'Idle'},
  {ownerLocomotion:false},{reducedMotion:true},{interrupted:true},
  {teleport:true},{mode:'attack'}
 ])assert.equal(plan({...truth,...override}),null,
  'expired, invalid or nonmoving source must never borrow the old root step: '+JSON.stringify(override));
 // No real earlier step = zero borrowed authority.
 assert.equal(plan({...truth,recentRootTravel:0,recentTravelAge:0}),null);
 const renderer=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(renderer,/recentRootTravel:\s*actor\.rigRecentGroundedTravel/,
  'the real original GLB adapter must pass its existing, bounded, genuine root-witness receipt');
 assert.match(renderer,/recentTravelAge:\s*actor\.rigRecentGroundedAge/,
  'expired displayed-frame evidence must not authorize a pivot');
});


test('real original-GLB mobile frame 62 to 63: stable yaw allows a proven lifted swing-shoe projection',async()=>{
 const {planOriginalSourceStanceSlideRelief:plan}=await load();
 // Captured from actual 390px source skinned WebGL artifact 13983054549,
 // run #43304924320, SHA 3ff57f7; never generated animation.
 const previous={
  left:{heel:[-5.919720117561202,.17425874589647128,-7.089383328122347],
   toe:[-6.029049666028605,-.1008353179085734,-7.035474600598778]},
  right:{heel:[-6.000527314104341,.0081271109337408,-7.24060013768488],
   toe:[-6.2711670248072515,-.01573159146291147,-7.244760295182367]}};
 const current={
  left:{heel:[-5.9023531074834406,.22653613796164337,-7.09787340614834],
   toe:[-5.987046434318297,-.062323983389053005,-7.067182008603082]},
  right:{heel:[-5.922435926586021,.00005558909789165831,-7.2542551654560326],
   toe:[-6.193502412946521,-.01014223770586357,-7.243866771223421]}};
 const actual={mode:'move',sourceClipName:'Walking_A',sourceWeight:1,
  sourceInstanceSame:true,ownerLocomotion:true,rootTravel:.05066888433054339,
  frameInterval:.05,previousRootYaw:-1.4383329545967325,
  currentRootYaw:-1.438332954596734,floorTopY:-.02,previous,current};
 const heelTravel=[current.right.heel[0]-previous.right.heel[0],
  current.right.heel[2]-previous.right.heel[2]];
 const toeTravel=[current.right.toe[0]-previous.right.toe[0],
  current.right.toe[2]-previous.right.toe[2]];
 const originalEdgeDelta=Math.hypot(heelTravel[0]-toeTravel[0],
  heelTravel[1]-toeTravel[1]);
 const originalSpanBefore=Math.hypot(
  previous.right.heel[0]-previous.right.toe[0],
  previous.right.heel[2]-previous.right.toe[2]);
 const originalSpanAfter=Math.hypot(
  current.right.heel[0]-current.right.toe[0],
  current.right.heel[2]-current.right.toe[2]);
 assert.ok(originalEdgeDelta>.014&&originalEdgeDelta<.018,
  'real loaded source heel/toe motion differs 14.55mm but preserves the skinned sole');
 assert.ok(Math.abs(originalSpanAfter-originalSpanBefore)<.001,
  'source loaded shoe preserves its 270mm span to within 1mm');
 const accepted=plan(actual);
 assert.equal(accepted?.side,'right','the actual right heel/toe is loaded and slides 78mm');
 assert.ok(accepted.reductionMeters>=.004&&accepted.reductionMeters<=.0180001);
 assert.ok(accepted.otherShoeProjectedSpanDeltaMeters>.025&&
  accepted.otherShoeProjectedSpanDeltaMeters<=.036);
 assert.ok(accepted.sourceYawChangeRadians<.001);
 assert.equal(accepted.contactLocked,false);
 for(const bad of [
  {currentRootYaw:-.8},{previousRootYaw:NaN},{currentRootYaw:NaN},
  {current:{...current,left:{...current.left,heel:[
   current.left.heel[0],.03,current.left.heel[2]]}}},
  {current:{...current,left:{...current.left,toe:[
   current.left.toe[0]+.08,current.left.toe[1],current.left.toe[2]]}}},
  {current:{...current,right:{...current.right,toe:[
   current.right.toe[0]+.06,current.right.toe[1],current.right.toe[2]]}}},
  // Large heel/toe vector divergence still rejects an apparently plausible
  // but no longer source-rigid shoe, despite near-constant projected length.
  {current:{...current,right:{...current.right,toe:[
   current.right.toe[0],current.right.toe[1],current.right.toe[2]+.04]}}},
  {sourceInstanceSame:false},{reducedMotion:true},{teleport:true},
  {interrupted:true},{alive:false},{sourceClipName:'Idle'}
 ])assert.equal(plan({...actual,...bad}),null,
  'unverified yaw, stretched source skin, or changed owner rejects motion');
 const renderer=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(renderer,/previousRootYaw:\s*previous\.rootYaw/);
 assert.match(renderer,/currentRootYaw:\s*actor\.root\.rotation\.y/);
});


test('genuine source stance offset exits smoothly instead of restarting the weighted skinned shoe every rAF',async()=>{
 const {planOriginalSourceStanceReliefCarry:carry}=await load();
 // A corrected original loaded shoe receives <=18mm of reversible visual
 // translation. model-assets.js rebuilds its pivot from scratch each rAF:
 // discarding all 18mm immediately creates a distinct reverse shoe skid.
 // Fade the *already witnessed* local offset while the same original
 // GLB/Walking_A/real root step still owns the pose; never manufacture IK.
 const previous={x:-.018,z:0,sourceInstanceId:'source-vanguard',
  clip:'Walking_A',rootYaw:0};
 const valid={previous,sourceInstanceId:'source-vanguard',
  sourceClipName:'Walking_A',sourceWeight:1,mode:'move',
  ownerLocomotion:true,recentRootTravel:.05,recentTravelAge:.04,
  rootYaw:0,frameInterval:.05,alive:true,visible:true,
  reducedMotion:false,teleport:false,interrupted:false};
 const first=carry(valid);
 assert.equal(first?.sourceInstanceId,'source-vanguard');
 assert.ok(Math.abs(first.x+.012)<.000001,
  '18mm of independently witnessed presentation relief tapers to 12mm, not a 18mm reverse step');
 assert.equal(first.z,0);
 const second=carry({...valid,previous:first,recentTravelAge:.09});
 assert.ok(Math.abs(second.x+.006)<.000001);
 const final=carry({...valid,previous:second,recentTravelAge:.14});
 assert.equal(final,null,'clear the original witness naturally within 150ms');
 for(const change of [
  {sourceInstanceId:'other-clone'},{sourceClipName:'Idle'},
  {sourceWeight:.5},{mode:'attack'},{ownerLocomotion:false},
  {recentRootTravel:0},{recentTravelAge:.181},{recentTravelAge:-.01},
  {rootYaw:.2},{visible:false},{alive:false},{teleport:true},
  {interrupted:true},{reducedMotion:true},{frameInterval:.5},
  {previous:{...previous,x:.023}},{previous:{...previous,z:NaN}},
  {previous:{...previous,clip:'Idle'}}
 ])assert.equal(carry({...valid,...change}),null,
  'stale/mismatched/unsafe source witness cannot move a visible rig: '+Object.keys(change));
 const renderer=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(renderer,/planOriginalSourceStanceReliefCarry\(/,
  'real imported-rig pivot must consume the bounded carry');
 assert.match(renderer,/sourceStanceVisualOffset\s*=\s*\{/,
  'only a successful original weighted-shoe readback may renew the carried offset');
 assert.match(renderer,/Math\.hypot\(.*\.x,.*\.z\)/,
  'accepted corrections must retain a strict combined 18mm presentation budget');
});


test('RED: genuine Walking_A tick transition primes original skinned shoes without authorizing a blind slide',async()=>{
 const {planOriginalSourceStanceSampleHandoff:handoff,
  planOriginalSourceStanceSlideRelief:slide}=await load();
 // Actual mobile source-rig frame 62 -> 63 traveled 50.67mm at stable
 // -1.438333rad yaw. A changed authoritative tick must permit a current
 // source-GLB heel/toe sample, not a correction using stale pre-tick shoes.
 const witnessed={mode:'move',sourceClipName:'Walking_A',sourceWeight:.90,
  ownerLocomotion:true,rootTravel:.05066888433054339,frameInterval:.05,
  alive:true,visible:true,teleport:false,reducedMotion:false,
  interrupted:false,sourceAnatomyVerified:true};
 assert.deepEqual(handoff({...witnessed,changed:true}),
  {recordSample:true,allowRelief:false},
  'new legal tick must record only genuine post-mixer skinned source shoes');
 assert.deepEqual(handoff({...witnessed,changed:false}),
  {recordSample:true,allowRelief:true},
  'the next same-clip original displayed frame may attempt witnessed relief');
 for(const patch of [
  {mode:'attack'},{sourceClipName:'Idle'},{sourceWeight:.64},
  {ownerLocomotion:false},{sourceAnatomyVerified:false},
  {rootTravel:.44},{rootTravel:-.1},{frameInterval:.4},
  {alive:false},{visible:false},{teleport:true},
  {reducedMotion:true},{interrupted:true}
 ])assert.equal(handoff({...witnessed,changed:true,...patch}),null,
  'never prime stale, unauthenticated, unrendered or unsafe source skin');
 // The real 62->63 shoe pair was already proven with original source
 // weighted heel/toe and unique loaded side; warm-up must not change
 // the independent strict planar outsole validation.
 assert.equal(typeof slide,'function');
 const native=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 const stage=native.slice(native.indexOf('function stageOriginalSourceStanceSlideAfterMixer('),
  native.indexOf('function disposeActorAsset('));
 assert.match(stage,/planOriginalSourceStanceSampleHandoff\(/,
  'actual Three.js adapter must gate both sample priming and corrected frames');
 assert.match(stage,/handoff\.allowRelief/,
  'transition frame must never apply a correction without a prior source sample');
 assert.match(stage,/sourceStanceSlideSample=\{sourceInstanceId/,
  'only actual measured original-world skinned shoes may enter the next frame');
});


test('RED: real original GLB skating correction must not mistake a rotating root for a translating stance',async()=>{
 const {planOriginalSourceStanceSlideRelief:plan}=await load();
 // The actual 390px original WebGL run #43332071080 records genuine
 // per-frame actor turns of about 0.637 rad (frame 23→24, 24→25).
 // The proven near-stone right shoe below is from a separate, authentic
 // straight Walking_A source pair (#43275816923, frames 85→86).
 // Rotated versions are SYNTHETIC safety counterexamples, NOT filmed shots.
 const previous={
  left:{heel:[-3.7622763645869743,.19619061649808212,-6.964968636370414],
   toe:[-3.936331449985617,-.022848690971393016,-6.936989276434345]},
  right:{heel:[-3.673845306509682,-.015892989888730707,-7.117537969611167],
   toe:[-3.9433384106340967,-.022593029997116175,-7.1402535772176385]}
 };
 const current={
  left:{heel:[-3.7521558152800223,.1624096473608331,-6.958929690108859],
   toe:[-3.93614977336351,-.03730755226041721,-6.939063081035758]},
  right:{heel:[-3.6117278594795095,-.03542813690635666,-7.119786377236892],
   toe:[-3.880277883348968,-.03294688530907301,-7.142783473794835]}
 };
 const source={mode:'move',sourceClipName:'Walking_A',sourceWeight:1,
  sourceInstanceSame:true,ownerLocomotion:true,rootTravel:.0445,
  frameInterval:.05,alive:true,visible:true,teleport:false,
  reducedMotion:false,interrupted:false,floorTopY:-.02,previous,current,
  previousRootYaw:-1.4383329545967325,currentRootYaw:-1.438332954596734};
 assert.ok(plan(source)?.reductionMeters>0,
  'preserve the independently witnessed original straight-stance improvement');
 for(const yaw of [-1.4383329545967325+.6375,
  -1.4383329545967325-.6375,
  -1.4383329545967325+.09]){
  assert.equal(plan({...source,currentRootYaw:yaw}),null,
   'sharp real-turn-sized yaw cannot be silently converted into a false source-shoe skate rescue');
 }
 assert.ok(plan({...source,currentRootYaw:source.previousRootYaw+.079})?.reductionMeters>0,
  'a small independently measured source-facing change retains existing bounded relief');
 const renderer=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(renderer,/previousRootYaw:previous\.rootYaw,currentRootYaw:actor\.root\.rotation\.y/,
  'the live licensed clone already measures both actual source-facing orientations');
});
