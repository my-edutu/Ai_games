'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const load=async p=>import('data:text/javascript;base64,'+Buffer.from(read(p)).toString('base64'));
const map=Array.from({length:19},()=>'.'.repeat(19));
const fixture=()=>({tick:18,floor:2,phase:'exploring',map,guardianWard:false,
 units:[{id:'vanguard',kind:'vanguard',faction:'party',hp:80,x:8,z:9},
 {id:'ranger',kind:'ranger',faction:'party',hp:53,x:10,z:9},
 {id:'warden',kind:'warden',faction:'enemy',hp:140,x:12,z:9,action:'cast',actionTick:18}],
 bossRecovery:{remaining:2},bossWarning:null});
test('real Warden cast wins a full-body release camera before the counterattack',async()=>{
 const {planCinematicShot,planReadableExpeditionLens,planBossDuelSightline}=await load('public/ai-dungeon/cinematic-chapter-plan.js');
 const s=fixture(),before=JSON.stringify(s),shot=planCinematicShot(s);
 assert.equal(shot.mode,'warden-release');assert.deepEqual(shot.subjects,['warden','ranger']);
 assert.equal(shot.warning,false);
 const desk=planReadableExpeditionLens(shot,{width:1440,height:832});
 const phone=planReadableExpeditionLens(shot,{width:390,height:844});
 assert.ok(desk&&phone);
 assert.ok(phone.fov>desk.fov&&phone.offsets[1]>desk.offsets[1]);
 assert.equal(shot.subjects.includes('vanguard'),false);
 assert.equal(JSON.stringify(s),before,'cinematography is read-only');
 s.bossWarning={attackTick:19,shape:'NOVA',cells:[{x:12,z:9}]};
 assert.equal(planCinematicShot(s).mode,'warden-warning','danger beats visual drama');
 s.bossWarning=null;
 s.units[2].actionTick=17;
 assert.equal(planCinematicShot(s).mode,'warden-exposed','stale cast cannot pretend to land');
 s.units[2].actionTick=18;s.units[2].hp=0;
 assert.notEqual(planCinematicShot(s)?.mode,'warden-release','dead boss cannot release');
});
test('the same live cast keeps both skinned actors and floor in true physical light',async()=>{
 const {planWorldStoryStage}=await load('public/ai-dungeon/world-story-stage-plan.js');
 const {planEncounterLighting}=await load('public/ai-dungeon/encounter-lighting-plan.js');
 const s=fixture(),shot={mode:'warden-release',subjects:['warden','ranger']};
 const stage=planWorldStoryStage(s,shot,{width:390});
 assert.equal(stage.mode,'warden-release');assert.equal(stage.realRelease,true);
 assert.ok(stage.wallPad>=3.0&&stage.partyScale>1&&stage.keyScale>1);
 const light=planEncounterLighting(s,shot);
 assert.equal(light.mode,'duel');assert.equal(light.enemyId,'warden');
 assert.ok(light.bossLight.intensity>2.7);
 s.units[2].actionTick=17;
 assert.equal(planWorldStoryStage(s,shot).mode,'warden-approach');
 assert.ok(planEncounterLighting(s,shot).bossLight.intensity<2.7);
 s.units[2].actionTick=18;
 s.bossWarning={attackTick:19,cells:[{x:10,z:9}]};
 assert.equal(planWorldStoryStage(s,shot).mode,'warden-warning');
});
test('real Warden source camera, stage, body clearance, original lights and semantic boss prompt are integrated',()=>{
 const camera=read('public/ai-dungeon/cinematic-chapter-plan.js');
 const app=read('public/ai-dungeon/app.js');
 assert.match(camera,/mode='warden-release'/);
 assert.match(camera,/boss\.action==='cast'&&boss\.actionTick===s\.tick/);
 assert.match(camera,/planDuelCameraOffset\(closeBoss,boss,8\.9,7\.95/);
 assert.match(app,/planWardenTacticalCue\(s,\{nearBoss\}\)/);
 assert.match(app,/boss-phase'\)\.textContent=tactical\?\.label\?\?phase/);
 assert.match(app,/bossStrip\.dataset\.striking=String\(wardenRelease\)/);
 assert.match(app,/storyStage\?\.wallPad/);
});

test('verified boss release keeps physical anatomy/weapon clearance and camera fit without invented contact',async()=>{
 const {planCinematicSilhouetteRecess,planEncounterSightlines}=await load('public/ai-dungeon/encounter-sightlines.js');
 const s=fixture();
 // A 3-cell lawful lane needs the actual boss cast to claim combat clearance;
 // ordinary two-cell proximity is intentionally protected separately.
 s.units[2].x=13;
 const original=JSON.stringify(s);
 const base=planEncounterSightlines(s,{x:0,z:0},true);
 const recess=planCinematicSilhouetteRecess(s,base);
 assert.equal(recess.length,3);
 assert.ok(recess.some(p=>p.x===4&&p.z===0&&p.combatRecess===true),'real Warden body needs foreground aperture');
 assert.ok(recess.some(p=>p.x===1&&p.z===0&&p.combatRecess===true),'actual nearest defender needs a physical weapon lane');
 assert.equal(JSON.stringify(s),original);
 s.units[2].actionTick=17;
 const stale=planCinematicSilhouetteRecess(s,base);
 assert.ok(!stale.some(p=>p.x===4&&p.z===0&&p.combatRecess===true),'stale cast cannot forge a near-weapon chapter');
 const app=read('public/ai-dungeon/app.js');
 assert.match(app,/'warden-contact','warden-counter','warden-approach','warden-exposed','warden-warning','warden-release'\]\.includes\(cinematicShot\.mode\)/);
});
