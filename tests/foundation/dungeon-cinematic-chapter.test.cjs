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
 assert.equal(close.mode,'contact');
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
 assert.match(app,/planCinematicShot\(state,encounterFrame/);
 assert.match(app,/planWardenCharge\(state\?\.bossWarning,state\?\.tick,reduced\)/);
 assert.ok(server.includes("['/dungeon/cinematic-chapter-plan.js','cinematic-chapter-plan.js']"));
 assert.match(ritual,/warningEdges\.setMatrixAt/);
 assert.match(ritual,/warningEdges\.instanceMatrix\.needsUpdate/);
});
