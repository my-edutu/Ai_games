'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const src=fs.readFileSync(path.join(root,'public/ai-dungeon/native-duel-continuity.js'),'utf8');
const load=()=>import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'));
const attack={kind:'vanguard',action:'attack',actionTick:54,hp:90};
const threat={targetId:'warden-1',distance:1};

test('a real source-body attack crosses the authority boundary into recovery, never a second hit',async()=>{
 const {planNativeDuelContinuity:plan}=await load();
 const first=plan(null,attack,.215,.016,threat);
 assert.equal(first.mode,'attack');assert.equal(first.contactAllowed,true);
 const idle={...attack,action:'idle',actionTick:55};
 const follow=plan(first.memory,idle,0,.016);
 assert.equal(follow.mode,'recovery');assert.equal(follow.contactAllowed,false);
 assert.ok(follow.age>=.355&&follow.age<.62);assert.equal(follow.targetId,'warden-1');
 assert.ok(plan(follow.memory,idle,0,.05).age>follow.age);
});

test('severe 350ms visual stalls show no more than ONE honest recovery stance',async()=>{
 const {planNativeDuelContinuity:plan}=await load();
 const first=plan(null,attack,.34,.34,threat),idle={...attack,action:'idle',actionTick:55};
 const next=plan(first.memory,idle,0,.35);
 assert.equal(next.mode,'recovery');assert.equal(next.age,.49);
 assert.equal(plan(next.memory,idle,0,.35).mode,'rest');
});

test('new action, invalid target, death, reduced-motion, teleport and detached rig abort the tail',async()=>{
 const {planNativeDuelContinuity:plan}=await load();
 assert.equal(plan(null,attack,.2,.016,{...threat,distance:2}).mode,'rest');
 const first=plan(null,attack,.2,.016,threat);
 for(const action of ['move','attack','cast','guard','hurt'])
  assert.equal(plan(first.memory,{...attack,action,actionTick:55},0,.016).mode,'rest');
 for(const extra of [{reducedMotion:true},{teleport:true},{attached:false}])
  assert.equal(plan(first.memory,{...attack,action:'idle',actionTick:55},0,.016,extra).mode,'rest');
 for(const invalid of [{...attack,hp:0},{...attack,kind:'ranger'},
  {...attack,actionTick:53}])
  assert.equal(plan(first.memory,{...invalid,action:'idle'},0,.016).mode,'rest');
});

test('three authentic imported melee roles have deterministic bounded continuity; renderer hooks clear state',async()=>{
 const {planNativeDuelContinuity:plan}=await load();
 for(const kind of ['vanguard','revenant','warden']){
  const state={...attack,kind},initial=plan(null,state,.1,.016,threat);
  assert.equal(initial.mode,'attack');assert.ok(Object.isFrozen(initial.memory));
  let next=initial;
  for(let i=0;i<12;i++){
   next=plan(next.memory,{...state,action:'idle',actionTick:55},0,.016);
   assert.equal(next.mode,'recovery');assert.equal(next.contactAllowed,false);
  }
 }
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 const server=fs.readFileSync(path.join(root,'scripts/serve-dungeon-stream.cjs'),'utf8');
 for(const name of ['planNativeDuelContinuity','actor.nativeDuelMemory=continuation.memory',
  'continuation.mode===\'recovery\'','actor.nativeDuelMemory=null'])
  assert.ok(model.includes(name),'missing integrated physical source-actor continuity: '+name);
 assert.ok(server.includes("['/dungeon/native-duel-continuity.js','native-duel-continuity.js']"));
 assert.doesNotMatch(src,/Math\.random|Date\.now|performance\.now|DungeonRuntime|fetch\(/);
});

test('original source attack clip continues through true idle recovery, without holding an invented strike',async()=>{
 const {planNativeDuelContinuity:plan,shouldRetainNativeRecoveryClip:retain}=await load();
 const attackFrame=plan(null,attack,.23,.016,threat);
 const idle={...attack,action:'idle',actionTick:55};
 const recovery=plan(attackFrame.memory,idle,0,.016);
 const valid={authoritativeAction:'idle',currentAction:'attack',
  currentActionTick:54,activeClipRunning:true,attached:true,reducedMotion:false};
 assert.equal(recovery.mode,'recovery');
 assert.equal(recovery.contactAllowed,false);
 assert.equal(retain(recovery,valid),true,'keep the real imported one-shot through its authored tail');
 for(const variant of [
  {activeClipRunning:false},{currentAction:'idle'},{currentActionTick:55},
  {authoritativeAction:'move'},{authoritativeAction:'attack'},
  {authoritativeAction:'cast'},{reducedMotion:true},{attached:false},
  {currentActionTick:NaN}
 ])assert.equal(retain(recovery,{...valid,...variant}),false,JSON.stringify(variant));
 const interrupted=plan(recovery.memory,{...idle,action:'hurt'},0,.016);
 assert.equal(retain(interrupted,valid),false,'a true interruption must never keep an old source clip');
 const dead=plan(recovery.memory,{...idle,hp:0},0,.016);
 assert.equal(retain(dead,valid),false,'dead rig must not keep a living sword animation');
 const teleported=plan(recovery.memory,idle,0,.016,{teleport:true});
 assert.equal(retain(teleported,valid),false,'teleport must drop source clip memory');
 const stalled=plan(plan(null,attack,.34,.34,threat).memory,idle,0,.35);
 assert.equal(retain(stalled,valid),true,'one witnessed recovery stance may be visible on a stalled real frame');
 const expired=plan(stalled.memory,idle,0,.35);
 assert.equal(retain(expired,valid),false,'never loop a completed original attack');
});

test('the live skinned mixer decides source clip retention before idle crossfade and exposes a bounded receipt',()=>{
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 const start=model.indexOf('function updateActor(actor,dt');
 const end=model.indexOf('function disposeActorAsset',start);
 assert.ok(start>0&&end>start,'read actual live updateActor');
 const body=model.slice(start,end);
 const gate=body.indexOf('shouldRetainNativeRecoveryClip(continuation');
 const switchClip=body.indexOf('changeAction(actor,actor.groundedPerformance');
 const mix=body.indexOf('actor.mixer.update(');
 assert.ok(gate>0&&gate<switchClip&&switchClip<mix,'original source attack must be retained BEFORE the mixer switches to idle');
 assert.ok(body.includes('if(!retainOriginalAttack)'),'no blind clip retention');
 assert.ok(body.includes('activeClipRunning:actor.activeClip?.isRunning?.()===true'),'never retain an already finished imported clip');
 assert.ok(model.includes('nativeSourceRecoveryClipFrames:authored.reduce('),'real renderer exposes provenance of any retained source clip frames');
 assert.ok(model.includes('actor.nativeSourceRecoveryClipFrames=0;'),'new or retired actors must release receipt state');
});

test('one source ankle physically plants through one real sword phrase and releases safely',async()=>{
 const {planNativeFootPlant:plant}=await load();
 const rootPosition={x:5,z:3},origin={x:5.2,z:2.8};
 const first=plant(null,{mode:'attack',age:.15,actionTick:54,rootPosition,footPosition:origin});
 assert.equal(first.locked,false);assert.equal(first.dx,0);assert.ok(Object.isFrozen(first.memory));
 const next=plant(first.memory,{mode:'attack',age:.24,actionTick:54,rootPosition,
  footPosition:{x:5.26,z:2.8}});
 assert.equal(next.locked,true);assert.ok(Math.abs(next.dx+.06)<1e-8);
 assert.equal(next.dz,0);
 const later=plant(next.memory,{mode:'recovery',age:.55,actionTick:54,rootPosition,
  footPosition:{x:5.4,z:2.8}});
 assert.ok(Math.hypot(later.dx,later.dz)<.095);
 assert.equal(plant(later.memory,{mode:'idle',age:.56,actionTick:55,rootPosition,footPosition:origin}).memory,null);
 assert.equal(plant(later.memory,{mode:'attack',age:.12,actionTick:55,rootPosition,footPosition:origin}).locked,false);
 assert.equal(plant(later.memory,{mode:'recovery',age:.57,actionTick:54,rootPosition:{x:8,z:3},footPosition:origin}).locked,false);
 assert.equal(plant(later.memory,{mode:'attack',age:.2,actionTick:54,rootPosition,footPosition:{x:NaN,z:0}}).memory,null);
 assert.equal(plant(later.memory,{mode:'attack',age:.2,actionTick:54,rootPosition,footPosition:origin,enabled:false}).memory,null);
});
test('true imported foot bone controls live sword root, not fake props or movement',()=>{
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 const start=model.indexOf('function updateActor(actor,dt'),end=model.indexOf('function disposeActorAsset',start);
 const stage=model.slice(start,end);
 assert.ok(stage.includes("b.part==='foot'")&&stage.includes('leadFoot.getWorldPosition(footWorld)'));
 assert.ok(stage.includes('actor.visualPivot.position.add(shift)'));
 assert.ok(stage.includes('actor.nativeFootPlantMemory=plant.memory'));
 assert.ok(stage.includes('else actor.nativeFootPlantMemory=null'));
 assert.ok(model.includes('nativeFootPlantFrames:authored.reduce('));
});

test('two genuine imported grounded ankles share one bounded sword-root bearing without inventing steps',async()=>{
 const {planNativeFootPlant:plant}=await load();
 const r={x:0,z:0},lead={x:.30,y:.12,z:.20},rear={x:-.24,y:.11,z:-.14};
 const first=plant(null,{mode:'attack',age:.15,actionTick:54,rootPosition:r,
  footPosition:lead,supportFootPosition:rear});
 assert.equal(first.locked,false);
 const second=plant(first.memory,{mode:'attack',age:.23,actionTick:54,rootPosition:r,
  footPosition:{...lead,x:.38},supportFootPosition:{...rear,x:-.20}});
 assert.equal(second.supportEngaged,true);
 assert.ok(Math.abs(second.dx-(-.08*.65-.04*.35))<1e-9);
 assert.ok(Math.hypot(second.dx,second.dz)<=.095);
 const raised=plant(first.memory,{mode:'attack',age:.23,actionTick:54,rootPosition:r,
  footPosition:{...lead,x:.38},supportFootPosition:{...rear,x:-.20,y:.38}});
 assert.equal(raised.supportEngaged,false,'a raised leg cannot plant a fictitious sole');
 assert.ok(Math.abs(raised.dx+.08)<1e-9,'normal lead source ankle still anchors');
 const moving=plant(first.memory,{mode:'attack',age:.23,actionTick:54,
  rootPosition:{x:.14,z:0},footPosition:lead,supportFootPosition:rear});
 assert.equal(moving.locked,false,'authoritative movement releases both anchors');
 const interruption=plant(second.memory,{mode:'idle',age:.40,actionTick:55,
  rootPosition:r,footPosition:lead,supportFootPosition:rear});
 assert.equal(interruption.memory,null);
 for(const malformed of [{x:0,y:NaN,z:0},{x:0,z:0},null]){
  const off=plant(first.memory,{mode:'recovery',age:.55,actionTick:54,
   rootPosition:r,footPosition:{...lead,x:.38},supportFootPosition:malformed});
  assert.equal(off.supportEngaged,false,'no accidental support without exact native data');
 }
});
test('the running original skinned dual-foot root records only genuinely planted source support',()=>{
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 const start=model.indexOf('function updateActor(actor,dt'),end=model.indexOf('function disposeActorAsset',start);
 const source=model.slice(start,end);
 assert.ok(source.includes('supportFoot.getWorldPosition(supportWorld)'));
 assert.ok(source.includes('supportFootPosition:supportWorld'));
 assert.ok(source.includes('if(plant.supportEngaged)'));
 assert.ok(model.includes('nativeSupportFootFrames:authored.reduce('));
});

test('true post-contact injury and genuine one-cell evasion own physical sword performance',async()=>{
 const {planNativeTrueBodyPriority:owner,planNativeDuelContinuity:continuity}=await load();
 const fighter={...attack,id:'vanguard',faction:'party',x:5,z:6};
 const harm={id:'vanguard',kind:'vanguard',faction:'party',damage:9,maxHp:90,fatal:false,age:.23};
 assert.equal(owner(fighter,{...harm,age:-.01}).mode,'ordinary','queued hit is not visible damage yet');
 const injured=owner(fighter,harm);
 assert.equal(injured.mode,'injury');assert.equal(injured.interruptSword,true);
 assert.equal(continuity(null,attack,.215,.016,{...threat,interruptSword:true}).mode,'rest');
 const aliveSword=continuity(null,attack,.23,.016,threat);
 assert.equal(continuity(aliveSword.memory,{...attack,action:'idle',actionTick:55},0,.016,{interruptSword:true}).memory,null);
 for(const bad of [
  {...harm,id:'another'}, {...harm,kind:'revenant'}, {...harm,faction:'enemy'},
  {...harm,damage:0}, {...harm,age:.55}, {...harm,fatal:true}
 ])assert.equal(owner(fighter,bad).mode,'ordinary','no unknown/old/foreign HP-loss cue');
 const evade={id:fighter.id,kind:fighter.kind,tick:54,age:.19,dx:1,dz:0,
  from:{x:4,z:6},to:{x:5,z:6}};
 assert.equal(owner(fighter,null,evade).mode,'evasion');
 assert.equal(owner(fighter,harm,evade).mode,'injury','HP injury outranks evasion');
 for(const bad of [
  {...evade,id:'unknown'}, {...evade,kind:'warden'}, {...evade,age:.60},
  {...evade,dx:2}, {...evade,to:{x:9,z:6}}, {...evade,from:{x:3,z:6}}
 ])assert.equal(owner(fighter,null,bad).mode,'ordinary','invalid escape cannot own a rig');
 assert.equal(owner({...fighter,hp:0},harm,evade).mode,'defeat');
 assert.ok(Object.isFrozen(owner(fighter,harm,evade)));
});
test('running original skinned animation interrupts old sword layers but keeps true HP injury/defeat',()=>{
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 const start=model.indexOf('function updateActor(actor,dt');
 const end=model.indexOf('function disposeActorAsset',start);
 const body=model.slice(start,end);
 assert.ok(body.includes('planNativeTrueBodyPriority(actor.u,actor.damageBeat,actor.evasionBeat)'));
 assert.ok(body.includes('interruptSword:interrupted'));
 assert.ok(body.includes('const poseSuppressed=reducedMotion||interrupted'));
 for(const stage of ['stageRigArmsAfterMixer','stageRigForearmsAfterMixer','stageRigLegsAfterMixer',
  'stageRigMeleeAfterMixer','stageRigRangedAfterMixer'])
  assert.ok(body.includes(stage+'(actor,since,poseSuppressed)'),stage+' should release old sword layers');
 assert.ok(body.includes('stageSkinnedHitAfterMixer(actor,reducedMotion)'), 'true HP recoil remains');
 assert.ok(body.includes('stageSkinnedDefeatAfterMixer(actor,reducedMotion)'), 'natural death remains');
 assert.ok(model.includes('nativeTrueInjuryFrames:authored.reduce('));
 assert.ok(model.includes('nativeTrueEvasionFrames:authored.reduce('));
});
