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
 assert.match(ritual,/warningEdges\.setMatrixAt/);
 assert.match(ritual,/warningEdges\.instanceMatrix\.needsUpdate/);
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
 assert.match(model,/joint\.pitch\+warningLift/);
 assert.match(model,/restoreRigArmsBeforeMixer\(actor\)/);
 assert.match(model,/mount\.last\.identity\(\)/);
 assert.match(model,/wardenChargeShoulderPeakRad:/);
});
