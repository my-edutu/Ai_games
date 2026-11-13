'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
async function planner(){
 const src=fs.readFileSync(path.join(root,'public/ai-dungeon/cinematic-chapter-plan.js'),'utf8');
 return import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'));
}
const map=Array.from({length:19},()=>'.'.repeat(19));
const scene=()=>({phase:'exploring',map,tick:4,units:[
 {id:'vanguard',kind:'vanguard',faction:'party',hp:100,x:9,z:9},
 {id:'ranger',kind:'ranger',faction:'party',hp:80,x:10,z:9},
 {id:'mystic',kind:'mystic',faction:'party',hp:70,x:9,z:10},
 {id:'warden',kind:'warden',faction:'enemy',hp:200,x:12,z:9},
 {id:'cultist',kind:'cultist',faction:'enemy',hp:20,x:9,z:8}
]});
test('a saved revenant warning drives real duo camera, danger lens and mobile framing',async()=>{
 const {planCinematicShot,planReadableExpeditionLens}=await planner(),s=scene();
 s.units.find(u=>u.id==='warden').hp=0;
 s.units.push({id:'breacher',kind:'revenant',faction:'enemy',hp:48,x:10,z:9});
 s.revenantWarnings=[{sourceId:'breacher',targetId:'vanguard',x:9,z:9,impactTick:5}];
 const before=JSON.stringify(s),shot=planCinematicShot(s);
 assert.equal(shot.mode,'breach-warning');assert.equal(shot.remainingTurns,1);
 assert.deepEqual(shot.subjects,['breacher','vanguard']);
 const desk=planReadableExpeditionLens(shot,{width:1440,height:832});
 const phone=planReadableExpeditionLens(shot,{width:390,height:844});
 assert.equal(desk.dangerPriority,true);assert.ok(phone.fov>desk.fov&&phone.offsets[1]>desk.offsets[1]);
 assert.equal(JSON.stringify(s),before);
 s.revenantWarnings=[{...s.revenantWarnings[0],targetId:'imagined'}];
 assert.notEqual(planCinematicShot(s).mode,'breach-warning');
});
test('the actual looming Warden warning wins camera priority over a melee strike, safely widening to show danger',async()=>{
 const {planCinematicShot}=await planner(),s=scene();
 const aligned={mode:'contact',actorId:'vanguard',targetId:'cultist',x:9,z:8.5};
 const close=planCinematicShot(s,aligned);
 assert.equal(close.mode,'warden-approach');
 s.bossWarning={shape:'RIFT_CROSS',attackTick:6,cells:[{x:9,z:9},{x:12,z:9}]};
 const before=JSON.stringify(s),shot=planCinematicShot(s,aligned);
 assert.equal(shot.mode,'warden-warning');
 assert.equal(shot.remainingTurns,2);
 assert.deepEqual(shot.subjects,['warden','ranger']);
 assert.ok(shot.offsets[1]>close.offsets[1],'danger must reveal safe ground instead of hiding it in a close-up');
 assert.equal(JSON.stringify(s),before,'cinematic framing must never mutate authority');
});
test('real targeted contacts get a readable hero-scale shot, with bounded portrait accommodation',async()=>{
 const {planCinematicShot}=await planner(),s=scene();
 s.units.find(u=>u.id==='warden').hp=0; // isolated real skirmish, no nearby boss claiming priority
 const contact={mode:'contact',actorId:'vanguard',targetId:'cultist',x:9,z:8.5};
 const desktop=planCinematicShot(s,contact,{width:1440,height:832});
 const mobile=planCinematicShot(s,contact,{width:390,height:844});
 assert.equal(desktop.mode,'contact');
 assert.equal(desktop.x,9);assert.equal(desktop.z,8.5);
 assert.ok(desktop.lookY>.65);
 assert.ok(mobile.offsets[1]>desktop.offsets[1]);
 assert.ok(desktop.offsets[1]<7,'one-grid-cell combat should be visibly closer than the old long shot');
 const malformed=planCinematicShot({map:[],units:[]});
 assert.equal(malformed,null);
});
test('a real Warden duel is filmed from the flank so giant foreground boss armor cannot cover the heroes',async()=>{
 const {planCinematicShot,planDuelCameraOffset}=await planner(),s=scene();
 const v=s.units.find(u=>u.id==='vanguard'),boss=s.units.find(u=>u.id==='warden');
 const shot=planCinematicShot(s);
 assert.equal(shot.mode,'warden-approach');
 const view=shot.offsets;
 const direction={x:boss.x-v.x,z:boss.z-v.z};
 const dot=Math.abs(view[0]*direction.x+view[2]*direction.z);
 const cross=Math.hypot(view[0],view[2])*Math.hypot(direction.x,direction.z);
 assert.ok(dot/cross<.4,'the camera axis must not superimpose boss and hero in depth');
 assert.ok(shot.offsets[1]>=8,'the camera must still expose actual foot telegraphs');
 assert.equal(planDuelCameraOffset(v,v),null,'coincident units retain fallback stable view');
 assert.equal(planDuelCameraOffset({x:NaN,z:9},boss),null,'malformed real positions cannot place the camera');
 const reverse=planDuelCameraOffset(boss,v);
 assert.ok(reverse.every(Number.isFinite),'deterministic opposite direction shot is finite');
});
test('real Warden counter and contact place the living hero in front while real warnings remain tactical',async()=>{
 const {planCinematicShot,planDuelCameraOffset}=await planner(),s=scene();
 const hero=s.units.find(u=>u.id==='ranger'),boss=s.units.find(u=>u.id==='warden');
 const depthRatio=shot=>{
  const d={x:boss.x-hero.x,z:boss.z-hero.z};
  return (shot.offsets[0]*d.x+shot.offsets[2]*d.z)/(
   Math.hypot(shot.offsets[0],shot.offsets[2])*Math.hypot(d.x,d.z));
 };
 // The true closest living defender is ranger in this seeded scene.
 const approach=planCinematicShot(s);
 assert.equal(approach.mode,'warden-approach');
 assert.ok(depthRatio(approach)<-.20,'hero, not giant boss shoulder, must face the camera');
 s.bossRecovery={remaining:3};s.guardianWard=false;
 const exposed=planCinematicShot(s);
 assert.equal(exposed.mode,'warden-exposed');
 assert.ok(depthRatio(exposed)<-.20,'a genuine counter window must show the attacker');
 const contact=planCinematicShot(s,{mode:'contact',actorId:hero.id,targetId:boss.id,
  x:(hero.x+boss.x)/2,z:(hero.z+boss.z)/2});
 assert.equal(contact.mode,'warden-counter','genuine exposed counter damage deserves a close 3D chapter');
 assert.ok(depthRatio(contact)<-.20,'Warden contact must reveal the weapon-side hero');
 delete s.bossRecovery;
 assert.equal(planCinematicShot(s,{mode:'contact',actorId:hero.id,targetId:boss.id,
  x:(hero.x+boss.x)/2,z:(hero.z+boss.z)/2}).mode,'warden-contact',
  'no recovery means no invented counterstrike');
 s.bossRecovery={remaining:3};
 s.bossWarning={attackTick:s.tick+1,cells:[{x:boss.x,z:boss.z}],shape:'NOVA'};
 const warning=planCinematicShot(s);
 assert.equal(warning.mode,'warden-warning');
 assert.equal(warning.warning,true);
 assert.ok(depthRatio(warning)>0,'the danger overview deliberately keeps an elevated ordinary angle');
 assert.equal(planDuelCameraOffset(hero,boss,8,6,{heroForeground:true}).every(Number.isFinite),true);
});
test('authority-backed boss anticipation is reversible and reduced-motion safe',async()=>{
 const {planWardenCharge,planCinematicShot}=await planner();
 const warning={attackTick:6,cells:[{x:9,z:9}]};
 const start=planWardenCharge(warning,3),end=planWardenCharge(warning,6);
 assert.ok(end.charge>start.charge);
 assert.ok(end.armRaise<start.armRaise);
 assert.deepEqual(planWardenCharge(warning,6,true),{lift:0,pitch:0,armRaise:0,charge:0});
 assert.deepEqual(planWardenCharge(null,6),{lift:0,pitch:0,armRaise:0,charge:0});
 assert.deepEqual(planWardenCharge(warning,7),{lift:0,pitch:0,armRaise:0,charge:0});
 const s=scene();s.bossWarning={attackTick:6,cells:[]};
 assert.equal(planCinematicShot(s).warning,false);
});
test('new original camera grammar is actually wired into strict server, Warden rig, and live WebGL renderer',()=>{
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 const server=fs.readFileSync(path.join(root,'scripts/serve-dungeon-stream.cjs'),'utf8');
 const ritual=fs.readFileSync(path.join(root,'public/ai-dungeon/warden-ritual.js'),'utf8');
 assert.match(app,/planCinematicShot\(state,heldImpact\|\|encounterFrame/);
 assert.match(app,/planWardenCharge\(state\?\.bossWarning,state\?\.tick,reduced\)/);
 assert.ok(server.includes("['/dungeon/cinematic-chapter-plan.js','cinematic-chapter-plan.js']"));
 assert.match(ritual,/warningPerimeter\.setMatrixAt/,'real strike contour is drawn only around exposed danger cells');
 assert.match(ritual,/warningPerimeter\.instanceMatrix\.needsUpdate/,'the contiguous strike shape reaches real WebGL');
 assert.doesNotMatch(ritual,/warningEdges\.setMatrixAt/,'duplicate octagon halos may not obscure the genuine boss fight');
});

test('a distant wandering teammate no longer miniaturizes the real combat lens',async()=>{
 const {planReadableExpeditionLens}=await planner();
 const duel={mode:'contact',offsets:[4,6,3],subjects:['vanguard','cultist'],spread:1,lookY:.9};
 const wandering={...duel,offsets:[12,18,9],spread:16};
 const near=planReadableExpeditionLens(duel,{width:1440,height:900});
 const far=planReadableExpeditionLens(wandering,{width:1440,height:900});
 assert.deepEqual(far.offsets,near.offsets,'actual combatants, not distant teammates, establish the physical shot');
 assert.ok(near.fov<=44);
 assert.ok(Math.hypot(...near.offsets)<9);
 assert.equal(near.primarySubject,'vanguard');
 assert.equal(near.dangerPriority,false);
});
test('Warden danger takes priority over intimate combat, mobile sees more warned floor',async()=>{
 const {planReadableExpeditionLens}=await planner();
 const contact=planReadableExpeditionLens({mode:'warden-contact',offsets:[5,8,5],subjects:['vanguard','warden']});
 const actualWarning={mode:'warden-warning',offsets:[5,11,5],subjects:['warden','vanguard']};
 const wide=planReadableExpeditionLens(actualWarning,{width:1440,height:900});
 const mobile=planReadableExpeditionLens(actualWarning,{width:390,height:844});
 assert.ok(wide.fov>contact.fov&&wide.offsets[1]>contact.offsets[1]);
 assert.ok(Math.hypot(...wide.offsets)>Math.hypot(...contact.offsets));
 assert.ok(mobile.offsets[1]>wide.offsets[1]&&mobile.fov>wide.fov);
 assert.equal(wide.dangerPriority,true);
 assert.ok(wide.following>contact.following);
 assert.equal(planReadableExpeditionLens({...actualWarning,offsets:[NaN,11,5]}),null);
 assert.equal(planReadableExpeditionLens({...actualWarning,mode:'invented-attack'}),null);
});
test('optical chapter respects reduced motion, immutable authority and actual 3D rendering contract',async()=>{
 const {planReadableExpeditionLens}=await planner();
 const shot={mode:'journey',offsets:[5.1,8.2,5.65],subjects:['vanguard'],spread:15};
 const frozen=JSON.stringify(shot),lens=planReadableExpeditionLens(shot,{reducedMotion:true});
 assert.equal(lens.following,1);
 assert.equal(lens.fov,43);
 assert.equal(JSON.stringify(shot),frozen);
 assert.ok(Object.isFrozen(lens)&&Object.isFrozen(lens.offsets));
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 assert.match(app,/planReadableExpeditionLens\(cinematicShot,/);
 assert.match(app,/cinematicLens\?cinematicLens\.offsets:/);
 assert.match(app,/camera\.fov=nextFov/);
 assert.match(app,/heroKey\.intensity=.*cinematicLens\?\.keyScale/);
 assert.match(app,/cinematicLens:cinematicLens\?\?null/);
});


test('a cinematic Warden camera rescues off-screen body and warned tiles without moving the actual game',async()=>{
 const {planCriticalSubjectFit}=await planner();
 // Camera-local coordinates are provided by the actual Three.js camera.
 // A close boss at x=5 metres is cropped by the old 44-degree 16:10 lens.
 const before=[{x:5,y:1.5,z:-5},{x:-1.5,y:-1.2,z:-7}];
 const unchanged=JSON.stringify(before);
 const fit=planCriticalSubjectFit(before,1440/900,44);
 assert.ok(fit.fov>65 && fit.fov<=76,'actual boss should fit, not be cropped: '+fit.fov);
 assert.equal(fit.unframeable,false);
 assert.equal(fit.capped,false);
 assert.equal(JSON.stringify(before),unchanged,'no authority or camera point mutation');
 const bossOnScreen=Math.atan2(before[0].x,-before[0].z)*2*180/Math.PI;
 assert.ok(fit.fov>bossOnScreen/(1440/900)*.75);
 const mobile=planCriticalSubjectFit([{x:1.8,y:0,z:-6}],390/844,51);
 assert.ok(mobile.fov>51,'portrait must accommodate horizontal fight separation');
 assert.ok(mobile.fov<=82);
});

test('a dramatic boss frame has deterministic, capped visual-only emergency fallbacks',async()=>{
 const {planCriticalSubjectFit}=await planner();
 const impossible=planCriticalSubjectFit([{x:25,y:9,z:-1},{x:0,y:0,z:1}],1440/832,44);
 assert.equal(impossible.fov,76);
 assert.equal(impossible.capped,true);
 assert.equal(impossible.unframeable,true);
 assert.ok(Number.isFinite(impossible.fov));
 assert.equal(planCriticalSubjectFit([],1440/832,44).fov,44);
 assert.equal(planCriticalSubjectFit([{x:NaN,y:3,z:-5}],1,44).fov,44);
 assert.equal(planCriticalSubjectFit([{x:1,y:1,z:-4}],0,44).fov,44);
});

test('when the living Warden threatens the frontline, distant sentry shots cannot steal the boss confrontation',async()=>{
 const {planCinematicShot}=await planner(),s=scene();
 s.units.push({id:'oathbound-1-1',kind:'cultist',faction:'enemy',hp:44,x:9,z:7});
 const ranger=s.units.find(u=>u.id==='ranger');
 ranger.x=9;ranger.z=6;ranger.action='attack';ranger.targetId='oathbound-1-1';
 const moment={mode:'contact',actorId:'ranger',targetId:'oathbound-1-1',x:9,z:6.5};
 const preserved=JSON.stringify(s),shot=planCinematicShot(s,moment);
 assert.equal(shot.mode,'warden-approach');
 assert.deepEqual(shot.subjects,['vanguard','warden']);
 assert.equal(JSON.stringify(s),preserved);
 // A genuinely landed Warden strike, however, deserves its own close contact.
 const realBossHit={mode:'contact',actorId:'vanguard',targetId:'warden',x:10.5,z:9};
 const real=planCinematicShot(s,realBossHit);
 assert.equal(real.mode,'warden-contact');
});

test('real Warden warning poses imported shoulders as well as torso, without persistent additive pose',()=>{
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 assert.match(app,/a\.wardenCharge=a\.u\.kind==='warden'&&a\.u\.hp>0\?planWardenCharge\(state\?\.bossWarning,state\?\.tick,reduced\):null/);
 assert.match(model,/actor\.wardenCharge\?\.armRaise/);
 assert.ok(model.includes('joint.pitch+(physicalTell?.pitch??warningLift)'));
 assert.match(model,/restoreRigArmsBeforeMixer\(actor\)/);
 assert.match(model,/mount\.last\.identity\(\)/);
 assert.match(model,/wardenChargeShoulderPeakRad:/);
});

test('real Oathguard cover gets a close two-hero shot; history, remote ally, and visual-only guard do not',async()=>{
 const {planOathguardPose,planCinematicShot,planReadableExpeditionLens}=await planner();
 const s=scene(),guard=s.units.find(u=>u.id==='vanguard');
 guard.action='guard';guard.guardTick=s.tick;guard.targetId='ranger';
 const unchanged=JSON.stringify(s);
 assert.deepEqual(planOathguardPose(s),{guardianId:'vanguard',allyId:'ranger',x:9.5,z:9});
 const desktop=planCinematicShot(s,null,{width:1440,height:832});
 const mobile=planCinematicShot(s,null,{width:390,height:844});
 assert.equal(desktop.mode,'oathguard-cover');
 assert.deepEqual(desktop.subjects,['vanguard','ranger']);
 assert.equal(mobile.mode,'oathguard-cover');
 assert.equal(planReadableExpeditionLens(mobile,{width:390,height:844}).portrait,true);
 assert.equal(desktop.warning,false);
 assert.equal(JSON.stringify(s),unchanged);
 guard.guardTick=s.tick-1;assert.equal(planOathguardPose(s),null);
 guard.guardTick=s.tick;s.units.find(u=>u.id==='ranger').x=14;
 assert.equal(planOathguardPose(s),null);
 s.units.find(u=>u.id==='ranger').x=10;
 s.bossWarning={attackTick:s.tick+1,cells:[{x:10,z:9}],shape:'NOVA',axis:'EAST_WEST'};
 assert.equal(planCinematicShot(s).mode,'warden-warning');
});

test('real Warden exposure, cleared portal and total-party intermission form an honest filmable arc',async()=>{
 const {planCinematicShot,planReadableExpeditionLens}=await planner(),s=scene();
 s.bossRecovery={remaining:2,untilTick:s.tick+2};s.guardianWard=false;
 const original=JSON.stringify(s),opened=planCinematicShot(s);
 assert.equal(opened.mode,'warden-exposed');
 assert.deepEqual(opened.subjects,['ranger','warden']);
 assert.ok(planReadableExpeditionLens(opened).offsets[1]<8.35);
 assert.equal(JSON.stringify(s),original,'camera must never mutate game authority');
 s.bossWarning={attackTick:s.tick+1,cells:[{x:10,z:9}],shape:'NOVA'};
 assert.equal(planCinematicShot(s).mode,'warden-warning','true danger takes priority');
 delete s.bossWarning;delete s.bossRecovery;
 for(const e of s.units.filter(u=>u.faction==='enemy'))e.hp=0;
 s.exit={x:10,z:9};
 assert.equal(planCinematicShot(s).mode,'portal-descent');
 s.units.find(u=>u.id==='cultist').hp=10;
 assert.notEqual(planCinematicShot(s).mode,'portal-descent','living hostiles block fake exit');
 for(const e of s.units.filter(u=>u.faction==='enemy'))e.hp=0;
 for(const h of s.units.filter(u=>u.faction==='party')){h.hp=0;h.action='hurt';h.actionTick=s.tick;}
 s.phase='intermission';
 const end=planCinematicShot(s,null,{width:390,height:844});
 assert.equal(end.mode,'last-stand');assert.equal(end.subjects.length,3);
 assert.equal(end.warning,false);
 assert.ok(planReadableExpeditionLens(end,{width:390,height:844}).portrait);
 s.phase='exploring';
 assert.equal(planCinematicShot(s),null,'an unverified wipe cannot fake a terminal scene');
});
test('defeat film grammar is wired to the physical renderer and accessible result, not an invented cinematic',()=>{
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 const css=fs.readFileSync(path.join(root,'public/ai-dungeon/styles.css'),'utf8');
 assert.match(app,/planDefeatTableauPose\(a\.u,state\.phase\)/);
 assert.match(app,/lastStandBodies:/);
 assert.match(app,/document\.body\.dataset\.epilogue/);
 assert.match(css,/body\[data-epilogue=true\] \.run-result/);
});

test('earned counter shoots past the real survivor shoulder while danger retains a wider honest telegraph',async()=>{
 const {planCinematicShot,planReadableExpeditionLens}=await planner();
 const s=scene(),boss=s.units.find(u=>u.id==='warden');
 const hero=s.units.find(u=>u.id==='ranger');
 s.bossRecovery={remaining:3};s.guardianWard=false;
 const before=JSON.stringify(s),opened=planCinematicShot(s,null,{width:1440,height:832});
 const foreground=(shot)=>{
  const d={x:boss.x-hero.x,z:boss.z-hero.z};
  return (shot.offsets[0]*d.x+shot.offsets[2]*d.z)/
   (Math.hypot(shot.offsets[0],shot.offsets[2])*Math.hypot(d.x,d.z));
 };
 assert.equal(opened.mode,'warden-exposed');
 assert.ok(foreground(opened)<-.70,'actual camera must look from the hero side, not behind the giant boss');
 const cinematic=planReadableExpeditionLens(opened,{width:1440,height:832});
 assert.ok(cinematic.lookY>=1.0,'recovery must frame the physical actors above waist level');
 assert.equal(planReadableExpeditionLens(opened,{width:390,height:844}).portrait,true);
 assert.equal(JSON.stringify(s),before,'one scene direction cannot change the deterministic RPG');
 s.bossWarning={attackTick:s.tick+1,shape:'NOVA',cells:[{x:boss.x,z:boss.z}]};
 const danger=planCinematicShot(s);
 assert.equal(danger.mode,'warden-warning');
 assert.ok(danger.offsets[1]>opened.offsets[1]);
 assert.ok(foreground(danger)>0,'real warning restores tactical angle instead of hiding floor telegraphs');
});


test('real three-beat Warden signal coils the torso and braces skinned legs without changing the grid',async()=>{
 const {planWardenCharge}=await planner();
 const warning={attackTick:6,cells:[{x:9,z:9}]};
 const a=planWardenCharge(warning,3),b=planWardenCharge(warning,4),c=planWardenCharge(warning,5);
 assert.ok(a.brace>0&&a.brace<b.brace&&b.brace<c.brace&&c.brace<.25);
 assert.ok([a,b,c].every(v=>Math.abs(v.coil)<=.2&&v.lift<=0));
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 assert.ok(model.includes('const warningBrace='));
 assert.ok(model.includes('stageRigLegsAfterMixer'));
 assert.ok(app.includes('a.visualPivot.rotation.z+=anticipation.coil'));
 assert.equal(planWardenCharge(warning,5,true).brace,undefined);
 assert.equal(planWardenCharge(null,5).coil,undefined);
});

test('a true Warden wipe films original fallen bodies ahead of the living enemy rather than his huge back',async()=>{
 const {planCinematicShot,planLastStandTableau,planReadableExpeditionLens}=await planner(),s=scene();
 s.phase='intermission';
 for(const hero of s.units.filter(u=>u.faction==='party'))hero.hp=0;
 const before=JSON.stringify(s),shot=planCinematicShot(s,null,{width:1440,height:832});
 const dead=s.units.filter(u=>u.faction==='party');
 const center={x:dead.reduce((n,u)=>n+u.x,0)/dead.length,z:dead.reduce((n,u)=>n+u.z,0)/dead.length};
 const cam={x:shot.x+shot.offsets[0],z:shot.z+shot.offsets[2]};
 const boss=s.units.find(u=>u.kind==='warden');
 assert.equal(shot.mode,'last-stand');assert.deepEqual(shot.subjects,['vanguard','ranger','mystic']);
 assert.ok(Math.hypot(cam.x-boss.x,cam.z-boss.z)>Math.hypot(cam.x-center.x,cam.z-center.z)+.4,
  'actual surviving boss must be behind the aftermath');
 assert.ok(Math.hypot(cam.x-center.x,cam.z-center.z)>=1.35);
 const desktop=planReadableExpeditionLens(shot,{width:1440,height:832});
 const mobile=planReadableExpeditionLens(shot,{width:390,height:844});
 assert.ok(mobile.portrait&&mobile.offsets[1]>desktop.offsets[1]);
 assert.ok(desktop.offsets.every(Number.isFinite));
 assert.equal(JSON.stringify(s),before,'a camera can never modify combat or enemy truth');
 s.phase='exploring';assert.equal(planLastStandTableau(s,dead),null);
});
test('real edge-of-map aftermath preserves bounded camera and no imaginary boss',async()=>{
 const {planLastStandTableau}=await planner(),s=scene();
 s.phase='intermission';const dead=s.units.filter(u=>u.faction==='party');
 for(const [i,u] of dead.entries()){u.hp=0;u.x=1+i;u.z=1;}
 for(const enemy of s.units.filter(u=>u.faction==='enemy'))enemy.hp=0;
 const shot=planLastStandTableau(s,dead);
 assert.equal(shot.mode,'last-stand');
 assert.ok([shot.x,shot.z,shot.spread,...shot.offsets].every(Number.isFinite));
 assert.ok(shot.spread>0);
 assert.equal(planLastStandTableau(s,[]),null);
});

test('3D safe-lane glow requires an actual completed living two-hero foot-tile handoff',()=>{
 const source=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 assert.match(source,/oathguardEscapeMark\.visible=oathguardEscapeAge<\.72/);
 assert.match(source,/ally\?\.action==='move'&&ally\.x===oldVanguard\.x&&ally\.z===oldVanguard\.z/);
 assert.match(source,/e\.kind==='cover-advance'&&e\.tick===s\.tick/);
 assert.match(source,/oathguardCompletedLaneVisible:oathguardEscapeMark\.visible/);
 assert.match(source,/oathguardImpactRing\.visible=oathguardAegis\.visible&&!reduced&&impactProgress<1/,
  'preparatory teamwork cannot fabricate a shield impact');
});


test('the actual filmed Warden or melee defender owns automatic spectator focus',async()=>{
 const {planCinematicShot,planCinematicVisibleHero}=await planner();
 const s=scene(),before=JSON.stringify(s);
 const warden=planCinematicShot(s,null,{focusedHeroId:'mystic'});
 assert.deepEqual(warden.subjects,['ranger','warden']);
 assert.equal(planCinematicVisibleHero(s,warden,'mystic'),'ranger');
 s.bossWarning={shape:'NOVA',attackTick:5,cells:[{x:11,z:9}]};
 const warning=planCinematicShot(s,null,{focusedHeroId:'mystic'});
 assert.deepEqual(warning.subjects,['warden','ranger']);
 assert.equal(planCinematicVisibleHero(s,warning,'mystic'),'ranger');
 assert.equal(planCinematicVisibleHero(s,{subjects:['ghost','warden','vanguard']},'mystic'),'vanguard');
 s.units.find(u=>u.id==='vanguard').hp=0;
 assert.equal(planCinematicVisibleHero(s,{subjects:['vanguard','warden','ranger']},'mystic'),'ranger');
 assert.equal(planCinematicVisibleHero(s,{subjects:['invented']},'mystic'),'mystic');
 s.units.filter(u=>u.faction==='party').forEach(u=>u.hp=0);
 assert.equal(planCinematicVisibleHero(s,warning,'ranger'),null);
 assert.ok(before.includes('"hp":100'),'setup must contain live real hero');
});

test('the live cinematic camera keeps coherent focus and physically fits both true combatants',()=>{
 const fs=require('node:fs'),path=require('node:path');
 const app=fs.readFileSync(path.resolve(__dirname,'../../public/ai-dungeon/app.js'),'utf8');
 assert.match(app,/planCinematicVisibleHero\(state,rawCinematicShot,focusedHeroId\)/);
 assert.match(app,/if\(filmedHero&&filmedHero!==focusedHeroId\)/);
 assert.match(app,/'contact','skirmish-approach','breach-warning','oathguard-cover'/);
 assert.match(app,/planCriticalSubjectFit\(subjects,camera.aspect,wantedFov\)/);
 assert.match(app,/const point=camera.worldToLocal\(actor.root.localToWorld/);
});



test('a genuine sealed-guardian duel earns a safely tighter 390px fighting-body lens',async()=>{
 const {planCinematicShot,planReadableExpeditionLens}=await planner(),s=scene();
 s.guardianWard=true;
 s.units.find(u=>u.id==='cultist').hp=0;
 const vanguard=s.units.find(u=>u.id==='vanguard');
 vanguard.x=8;vanguard.z=9;vanguard.action='attack';vanguard.targetId='ward-revenant';
 s.units.find(u=>u.id==='ranger').x=11;
 s.units.push({id:'ward-revenant',kind:'revenant',faction:'enemy',hp:54,x:7,z:9});
 const original=JSON.stringify(s);
 const shot=planCinematicShot(s,null,{width:390,height:844});
 assert.equal(shot.mode,'skirmish-approach');
 assert.equal(JSON.stringify(s),original,'presentation must not mutate the authority');
 assert.equal(shot.guardianEngagement,true,'only real guardian fighters earn a close lens');
 const close=planReadableExpeditionLens(shot,{width:390,height:844});
 const control=planReadableExpeditionLens({...shot,guardianEngagement:false},{width:390,height:844});
 assert.ok(Math.hypot(close.offsets[0],close.offsets[2])<Math.hypot(control.offsets[0],control.offsets[2])*.87);
 assert.ok(close.offsets[1]<control.offsets[1]*.93);
 assert.deepEqual(planReadableExpeditionLens(shot,{width:1440,height:832}),
  planReadableExpeditionLens({...shot,guardianEngagement:false},{width:1440,height:832}),'desktop unchanged');
 assert.deepEqual(planReadableExpeditionLens(shot,{width:390,height:844,reducedMotion:true}),
  planReadableExpeditionLens({...shot,guardianEngagement:false},{width:390,height:844,reducedMotion:true}),'reduced motion unchanged');
 s.bossWarning={shape:'NOVA',attackTick:s.tick+1,cells:[{x:9,z:9}]};
 const warning=planCinematicShot(s,null,{width:390,height:844});
 assert.equal(warning.mode,'warden-warning');
 assert.equal(warning.guardianEngagement,false,'true Warden danger must remain wide');
 s.bossWarning=null;
 s.revenantWarnings=[{sourceId:'ward-revenant',targetId:'vanguard',x:8,z:9,impactTick:s.tick+1}];
 assert.equal(planCinematicShot(s,null,{width:390,height:844}).guardianEngagement,false,'incoming guardian breach remains wide');
});

test('a sealed Warden films the ACTUAL distant guardian melee rather than the invulnerable boss',async()=>{
 const {planCinematicShot,planReadableExpeditionLens}=await planner(),s=scene();
 // The ranger stands closest to the boss; the Vanguard is actually fighting
 // its Revenant shield-bearer on the other side of the same lawful court.
 s.guardianWard=true;
 s.units.find(u=>u.id==='cultist').hp=0;
 const vanguard=s.units.find(u=>u.id==='vanguard');
 const ranger=s.units.find(u=>u.id==='ranger');
 vanguard.x=8;vanguard.z=9;vanguard.action='attack';vanguard.targetId='ward-revenant';
 ranger.x=11;ranger.z=9;
 s.units.push({id:'ward-revenant',kind:'revenant',faction:'enemy',hp:54,x:7,z:9});
 const original=JSON.stringify(s);
 const shot=planCinematicShot(s,null,{width:390,height:844});
 assert.equal(shot.mode,'skirmish-approach','sealed boss must not steal the active guardian film');
 assert.deepEqual(shot.subjects,['vanguard','ward-revenant']);
 assert.deepEqual([shot.x,shot.z],[7.5,9]);
 const lens=planReadableExpeditionLens(shot,{width:390,height:844});
 assert.ok(lens.portrait&&lens.offsets[1]<7);
 assert.equal(JSON.stringify(s),original,'camera reads but never edits deterministic authority');
 const realContact={mode:'contact',actorId:'vanguard',targetId:'ward-revenant',x:7.5,z:9};
 assert.equal(planCinematicShot(s,realContact,{width:390,height:844}).mode,'contact');
 // A hit directed at the STILL SEALED invulnerable boss cannot override a
 // genuine live Revenant fight; danger, however, must always override it.
 const sealedBossContact={mode:'contact',actorId:'ranger',targetId:'warden',x:11.5,z:9};
 assert.equal(planCinematicShot(s,sealedBossContact).mode,'skirmish-approach');
 s.bossWarning={shape:'NOVA',attackTick:s.tick+1,cells:[{x:9,z:9}]};
 assert.equal(planCinematicShot(s,realContact).mode,'warden-warning');
 delete s.bossWarning;
 s.guardianWard=false;
 assert.equal(planCinematicShot(s,null).mode,'warden-approach','unsealed Warden regains legitimate priority');
 s.guardianWard=true;s.units.find(u=>u.id==='ward-revenant').hp=0;
 assert.equal(planCinematicShot(s,null).mode,'warden-approach','a dead guardian is not an active subject');
});

test('complete authentic mobile warning inset permits nearer original boss lens without changing other views',async()=>{
 const {planReadableExpeditionLens}=await planner();
 const shot={mode:'warden-warning',offsets:[4,10,7],subjects:['warden','vanguard'],
  spread:2,warningFocus:{closeness:0}};
 const full={insetHasAllCells:true,originalCellCount:23,cells:[{x:9,z:9}],
  radiusScale:.68,heightScale:.66,fovReduction:6};
 const old=planReadableExpeditionLens(shot,{width:390,height:658});
 const close=planReadableExpeditionLens(shot,{width:390,height:658,dualPlaneWarning:full});
 assert.ok(close.fov<old.fov);
 assert.ok(Math.hypot(close.offsets[0],close.offsets[2])<Math.hypot(old.offsets[0],old.offsets[2])*.75);
 assert.ok(close.offsets[1]<old.offsets[1]*.75);
 assert.deepEqual(planReadableExpeditionLens(shot,{width:1440,height:832,dualPlaneWarning:full}),
  planReadableExpeditionLens(shot,{width:1440,height:832}));
 assert.deepEqual(planReadableExpeditionLens(shot,{width:390,height:658,reducedMotion:true,dualPlaneWarning:full}),
  planReadableExpeditionLens(shot,{width:390,height:658,reducedMotion:true}));
 assert.deepEqual(planReadableExpeditionLens(shot,{width:390,height:658,dualPlaneWarning:{...full,insetHasAllCells:false}}),old);
});
