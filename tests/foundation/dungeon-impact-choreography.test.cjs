'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const source=path.join(root,'public/ai-dungeon/impact-choreography-plan.js');
async function plan(){
 const code=fs.readFileSync(source,'utf8');
 return import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
}
const map=Array(19).fill('.'.repeat(19));
const hero={id:'vanguard',kind:'vanguard',faction:'party',x:8,z:9,hp:100,maxHp:100,action:'attack',actionTick:17,targetId:'warden'};
const enemy={id:'warden',kind:'warden',faction:'enemy',x:9,z:9,hp:90,maxHp:90,action:'hurt',actionTick:17};
const snapshot=(tick,units,run=1,floor=1)=>({tick,run,floor,map,units});
test('slow delivered frames still show a complete original sword impact and source-rig recovery',async()=>{
 const {planVisibleMeleeContactStep,VERIFIED_MELEE_CONTACT_DELAY}=await plan();
 let age=0;const delivered=[];
 for(let frame=0;frame<8;frame++){
  const step=planVisibleMeleeContactStep(.35,age);
  assert.ok(step>0&&step<=.35,'clock must stay bounded');
  age+=step;delivered.push(age);
 }
 assert.ok(Math.abs(delivered[0]-.05)<1e-9);
 assert.ok(Math.abs(delivered[1]-VERIFIED_MELEE_CONTACT_DELAY)<1e-9,
  'the true original blade and opt-in contact cue keep their shared 215ms beat');
 assert.ok(delivered.filter(t=>t>=VERIFIED_MELEE_CONTACT_DELAY-1e-9&&t<.62-1e-9).length>=4,
  'actual contact, planted follow-through and recovery should each reach the renderer under stalls');
 assert.ok(delivered[5]>=.62-1e-9,'the original attack must finish without looping a fake strike');
 assert.ok(Math.abs(planVisibleMeleeContactStep(.016,.30)-.016)<1e-9);
 for(const invalid of [-1,0,NaN,Infinity])
  assert.equal(planVisibleMeleeContactStep(invalid,.4),0);
});

test('only actual consecutive public health decreases create a damage or lethal beat',async()=>{
 const {planAuthorityDamageBeats}=await plan();
 const before=snapshot(16,[{...hero},{...enemy}]);
 const after=snapshot(17,[{...hero},{...enemy,hp:50}]);
 const hits=planAuthorityDamageBeats(before,after);
 assert.equal(hits.length,1);assert.equal(hits[0].id,'warden');assert.equal(hits[0].damage,40);
 assert.equal(hits[0].fatal,false);assert.equal(hits[0].maxHp,90);
 assert.deepEqual(planAuthorityDamageBeats(after,after),[]);
 assert.deepEqual(planAuthorityDamageBeats(after,snapshot(18,[{...hero},{...enemy,hp:90}])),[]);
 assert.deepEqual(planAuthorityDamageBeats(before,snapshot(17,[{...hero},{...enemy,hp:0}],2)),[]);
 assert.deepEqual(planAuthorityDamageBeats(before,snapshot(17,[{...hero},{...enemy,hp:0}],1,2)),[]);
 assert.deepEqual(planAuthorityDamageBeats(before,snapshot(26,[{...hero},{...enemy,hp:0}])),[]);
 assert.equal(planAuthorityDamageBeats(before,snapshot(17,[{...hero},{...enemy,hp:0}]))[0].fatal,true);
});
test('genuine damage has readable impact/recovery; lethal event falls then clears; motion-safe stays still',async()=>{
 const {planDamageReaction,DAMAGE_BEAT_DURATION,DEATH_BEAT_DURATION}=await plan();
 for(const kind of ['vanguard','ranger','mystic','revenant','cultist','warden'])
  for(const fatal of [false,true])
   for(const age of [-2,NaN,0,.05,.11,.2,.4,.7,.89,DEATH_BEAT_DURATION,Infinity]){
    const p=planDamageReaction(kind,42,100,age,fatal);
    for(const key of ['x','y','z','pitch','roll'])assert.ok(Number.isFinite(p[key]));
    assert.ok(Math.abs(p.x)<=.001&&p.y>=-.29&&p.z>=0&&p.z<=.23);
    assert.ok(Math.abs(p.pitch)<=1.48&&Math.abs(p.roll)<=.11);
    assert.deepEqual(planDamageReaction(kind,42,100,age,fatal,true),{x:0,y:0,z:0,pitch:0,roll:0});
   }
 const hit=planDamageReaction('vanguard',30,100,.12);
 assert.ok(hit.pitch>.035&&hit.z>.018,'a real hit visibly affects the actor');
 assert.deepEqual(planDamageReaction('vanguard',30,100,DAMAGE_BEAT_DURATION),{x:0,y:0,z:0,pitch:0,roll:0});
 const fall=planDamageReaction('warden',90,90,.79,true);
 assert.ok(fall.pitch>1.15&&fall.y<-.2,'dead boss is no longer instantly invisible');
 assert.deepEqual(planDamageReaction('warden',90,90,DEATH_BEAT_DURATION,true),{x:0,y:0,z:0,pitch:0,roll:0});
});
test('camera cannot claim a hit without explicit lawful same-tick target and real hp loss',async()=>{
 const {planAuthorityDamageBeats,planImpactCameraHold}=await plan();
 const before=snapshot(16,[hero,enemy]);
 const after=snapshot(17,[hero,{...enemy,hp:0}]);
 const hit=planAuthorityDamageBeats(before,after);
 assert.deepEqual(planImpactCameraHold(after,hit),{mode:'final-blow',actorId:'vanguard',targetId:'warden',x:8.5,z:9});
 assert.equal(planImpactCameraHold(snapshot(17,[{...hero,targetId:'other'},{...enemy,hp:0}]),hit),null);
 assert.equal(planImpactCameraHold(snapshot(17,[{...hero,actionTick:16},{...enemy,hp:0}]),hit),null);
 assert.equal(planImpactCameraHold(snapshot(17,[{...hero,x:8,z:7},{...enemy,hp:0}]),hit),null);
 assert.equal(planImpactCameraHold(snapshot(17,[{...hero,x:1,z:9},{...enemy,hp:0}]),hit),null);
});
test('the actual live renderer has an inherited 3D damage pivot, collapsing dead and a true camera hold',()=>{
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 const assets=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 const server=fs.readFileSync(path.join(root,'scripts/serve-dungeon-stream.cjs'),'utf8');
 const shot=fs.readFileSync(path.join(root,'public/ai-dungeon/cinematic-chapter-plan.js'),'utf8');
 assert.match(app,/planAuthorityDamageBeats\(previousState,s\)/);
 assert.match(app,/planDamageReaction\(/);
 assert.match(app,/DEATH_BEAT_DURATION/);
 assert.match(app,/impactCameraHold/);
 assert.match(app,/root\.add\(impactPivot\)/);
 assert.match(assets,/actor\.impactPivot\|\|actor\.root/);
 assert.match(shot,/final-blow/);
 assert.ok(server.includes("['/dungeon/impact-choreography-plan.js','impact-choreography-plan.js']"));
 const code=fs.readFileSync(source,'utf8');
 assert.doesNotMatch(code,/Math\.random|performance\.now|requestAnimationFrame|fetch\(/);
});

test('only a real total-party loss produces grounded static physical bodies during intermission',async()=>{
 const {planDefeatTableauPose}=await plan();
 const dead={id:'vanguard',kind:'vanguard',faction:'party',hp:0};
 const neutral={x:0,y:0,z:0,pitch:0,roll:0};
 const pose=planDefeatTableauPose(dead,'intermission');
 assert.ok(pose.pitch>1.2&&pose.y<-.2);
 assert.deepEqual(planDefeatTableauPose({...dead,hp:1},'intermission'),neutral);
 assert.deepEqual(planDefeatTableauPose({...dead,faction:'enemy'},'intermission'),neutral);
 assert.deepEqual(planDefeatTableauPose(dead,'exploring'),neutral);
 for(const kind of ['vanguard','ranger','mystic'])
  assert.ok(Object.values(planDefeatTableauPose({...dead,kind},'intermission')).every(Number.isFinite));
});

test('imported GLB skeletons only collapse on an actual fatal HP-zero beat or genuine loss',async()=>{
 const {planSkinnedDefeatPose,DEATH_BEAT_DURATION}=await plan();
 const neutral=planSkinnedDefeatPose('vanguard',100,.4,true,false,false);
 assert.equal(neutral.weight,0);
 assert.deepEqual(planSkinnedDefeatPose('vanguard',0,.4,false,false,false),neutral);
 assert.deepEqual(planSkinnedDefeatPose('vanguard',0,NaN,true),neutral);
 assert.equal(planSkinnedDefeatPose('vanguard',0,.07,true).weight,0);
 const mid=planSkinnedDefeatPose('vanguard',0,.40,true);
 const fallen=planSkinnedDefeatPose('vanguard',0,.84,true);
 assert.ok(mid.weight>.25&&mid.weight<.9,'a fall builds over multiple rendered frames');
 assert.ok(fallen.weight>.95&&fallen.shoulders.right<-.5&&fallen.legs.left.upper>.4);
 assert.deepEqual(planSkinnedDefeatPose('vanguard',0,DEATH_BEAT_DURATION,true),neutral);
 for(const kind of ['vanguard','ranger','mystic','revenant','cultist','warden']){
  const staticLoss=planSkinnedDefeatPose(kind,0,Infinity,false,true,true);
  assert.equal(staticLoss.weight,1,'a real party loss is still clear with reduced motion');
  assert.deepEqual(staticLoss,planSkinnedDefeatPose(kind,0,0,false,false,true));
  for(const side of ['left','right']){
   assert.ok(Math.abs(staticLoss.shoulders[side])<.65);
   assert.ok(Math.abs(staticLoss.elbows[side])<.5);
   for(const joint of ['upper','lower','foot'])
    assert.ok(Number.isFinite(staticLoss.legs[side][joint]));
  }
 }
});
test('animated skinned defeat affects real cloned joints and restores their rotation before the next GLB frame',()=>{
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 assert.match(model,/stageSkinnedDefeatAfterMixer\(actor,reducedMotion\)/);
 assert.match(model,/mount\.bone\.quaternion\.multiply\(mount\.next\)/);
 assert.match(model,/mount\.last\.multiply\(mount\.next\)/);
 assert.match(model,/stageRigMeleeAfterMixer\(actor,since,poseSuppressed\);[\s\S]*?stageSkinnedDefeatAfterMixer/);
 assert.match(model,/restoreRigLegsBeforeMixer\(actor\)/);
 assert.match(model,/skinnedDefeatActors:/);
 assert.match(app,/a\.defeatIntermission=Boolean\(state\?\.phase==='intermission'/);
});


test('real nonfatal HP loss gives full-party cloned skeleton physical recoil',async()=>{
 const {planSkinnedHitResponse,DAMAGE_BEAT_DURATION}=await plan();
 for(const kind of ['vanguard','ranger','mystic','revenant','cultist','warden']){
  const quiet=planSkinnedHitResponse(kind,0,100,.16);
  assert.equal(quiet.weight,0);
  assert.deepEqual(planSkinnedHitResponse(kind,38,100,.16,true),quiet);
  assert.deepEqual(planSkinnedHitResponse(kind,38,100,.16,false,true),quiet);
  assert.deepEqual(planSkinnedHitResponse(kind,38,100,DAMAGE_BEAT_DURATION),quiet);
  for(const age of [-2,NaN,0,.07,.15,.29,.48,.55,Infinity]){
   const p=planSkinnedHitResponse(kind,38,100,age);
   assert.ok(p.weight>=0&&p.weight<=1);
   assert.ok(Math.abs(p.spine.pitch)<=.38&&Math.abs(p.spine.roll)<=.25);
   for(const joint of ['shoulders','elbows'])for(const side of ['left','right'])
    assert.ok(Number.isFinite(p[joint][side])&&Math.abs(p[joint][side])<=.6);
   for(const side of ['left','right'])for(const part of ['upper','lower','foot'])
    assert.ok(Number.isFinite(p.legs[side][part])&&Math.abs(p.legs[side][part])<=.6);
  }
  const hit=planSkinnedHitResponse(kind,38,100,.15);
  assert.ok(hit.weight>.3&&Math.abs(hit.shoulders.left)>.12&&Math.abs(hit.legs.left.upper)>.08);
 }
 assert.ok(planSkinnedHitResponse('warden',30,100,.16).weight<
  planSkinnedHitResponse('vanguard',30,100,.16).weight);
});
test('true damage attaches to bone overlay without stacking on imported mixer',()=>{
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(model,/planSkinnedHitResponse/);
 assert.match(model,/stageSkinnedHitAfterMixer\(actor,reducedMotion\)/);
 assert.match(model,/const poseSuppressed=reducedMotion\|\|interrupted/);
 assert.match(model,/stageRigMeleeAfterMixer\(actor,since,poseSuppressed\);[\s\S]*?stageSkinnedHitAfterMixer\(actor,reducedMotion\);[\s\S]*?stageSkinnedDefeatAfterMixer/);
 assert.match(model,/beat\?\.damage/);
 assert.match(model,/mount\.last\.multiply\(mount\.next\)/);
 assert.match(model,/const chest=selectCombatTorsoBone\(bones\)/);
 assert.match(model,/skinnedHitActors:/);
});

test('a true HP decrease uses only a single same-tick unobstructed enemy action to orient hit recoil',async()=>{
 const {planAuthorityDamageBeats,resolveImpactSide,planSkinnedHitResponse,planDamageReaction}=await plan();
 const prior=snapshot(16,[hero,enemy]);
 const after=snapshot(17,[hero,{...enemy,hp:54}]);
 const beat=planAuthorityDamageBeats(prior,after)[0];
 assert.deepEqual(beat.incoming,{dx:1,dz:0,sourceId:'vanguard'});
 assert.equal(resolveImpactSide(beat.incoming,0),1);
 assert.equal(resolveImpactSide(beat.incoming,Math.PI),-1);
 assert.equal(resolveImpactSide({dx:0,dz:0}),0);
 const a=planSkinnedHitResponse('warden',36,90,.16,false,false,1);
 const b=planSkinnedHitResponse('warden',36,90,.16,false,false,-1);
 assert.ok(a.spine.roll>0&&b.spine.roll<0);
 assert.ok(planDamageReaction('warden',36,90,.17,false,false,1).roll>0);
 assert.ok(planDamageReaction('warden',36,90,.17,false,false,-1).roll<0);
 const doubled=snapshot(17,[hero,{...hero,id:'second-striker'}, {...enemy,hp:54}]);
 assert.equal(planAuthorityDamageBeats(prior,doubled)[0].incoming,undefined,'two plausible attackers cannot prove a direction');
 const blocked=snapshot(17,[{...hero,x:1,z:9},{...enemy,hp:54}]);
 assert.equal(planAuthorityDamageBeats(prior,blocked)[0].incoming,undefined,'a distant attack is not matched');
 const trapped=snapshot(17,[{...hero,targetId:undefined},{...enemy,hp:54}]);
 assert.equal(planAuthorityDamageBeats(prior,trapped)[0].incoming,undefined,'environmental damage receives no invented attacker');
});
