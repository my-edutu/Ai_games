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

test('actual Warden approach tracks living-body proximity while preserving danger and reduced motion',async()=>{
 const {planCinematicShot,planReadableExpeditionLens}=await load('public/ai-dungeon/cinematic-chapter-plan.js');
 const close=fixture();close.units[2].action='idle';close.bossRecovery=null;
 const before=JSON.stringify(close),far=JSON.parse(JSON.stringify(close));far.units[2].x=15;
 const nearShot=planCinematicShot(close),farShot=planCinematicShot(far);
 assert.equal(nearShot.mode,'warden-approach');assert.equal(farShot.mode,'warden-approach');
 assert.equal(nearShot.duelDistance,2);assert.equal(farShot.duelDistance,5);
 const radius=l=>Math.hypot(l.offsets[0],l.offsets[2]);
 for(const view of [{width:1440,height:832},{width:390,height:844}]){
  const near=planReadableExpeditionLens(nearShot,view),distant=planReadableExpeditionLens(farShot,view);
  assert.ok(radius(near)<radius(distant)-1.4,'true proximity must earn a materially closer physical view');
  assert.ok(near.offsets[1]<distant.offsets[1]-1.2,'avoid distant toy-scale overhead shot');
  assert.equal(near.fov,distant.fov,'keep original lens visibility');
  const reduced=planReadableExpeditionLens(nearShot,{...view,reducedMotion:true});
  assert.ok(Math.abs(radius(reduced)-radius(distant))<.01,'reduced-motion preserves stable wide view');
  close.bossWarning={attackTick:close.tick+1,shape:'NOVA',cells:[{x:12,z:9}]};
  const danger=planReadableExpeditionLens(planCinematicShot(close),view);
  assert.equal(danger.mode,'warden-warning');assert.equal(danger.dangerPriority,true);
  close.bossWarning=null;
 }
 assert.equal(JSON.stringify(close),before,'camera cannot mutate authoritative state');
});

test('authentic close-body Warden approach gains physical scale in BOTH viewports without stealing warning coverage',async()=>{
 const {planCinematicShot,planReadableExpeditionLens}=await load('public/ai-dungeon/cinematic-chapter-plan.js');
 const s=fixture();s.units[2].action='idle';s.units[2].actionTick=12;s.bossRecovery=null;
 const before=JSON.stringify(s),shot=planCinematicShot(s);
 assert.equal(shot.mode,'warden-approach');assert.equal(shot.duelDistance,2);
 for(const view of [{width:1440,height:832},{width:390,height:844}]){
  const lens=planReadableExpeditionLens(shot,view);
  const radius=Math.hypot(lens.offsets[0],lens.offsets[2]);
  assert.ok(radius<(view.width===390?6.0:5.6),'close Warden must not read like miniature');
  assert.ok(lens.offsets[1]<(view.width===390?5.4:5.05),'physical body-height camera is essential');
  const stable=planReadableExpeditionLens(shot,{...view,reducedMotion:true});
  assert.ok(Math.hypot(stable.offsets[0],stable.offsets[2])>radius+1,'reduced-motion retains stable wide view');
  s.bossWarning={attackTick:s.tick+1,shape:'NOVA',cells:[{x:12,z:9}]};
  const danger=planReadableExpeditionLens(planCinematicShot(s),view);
  assert.equal(danger.mode,'warden-warning');assert.equal(danger.dangerPriority,true);
  s.bossWarning=null;
 }
 assert.equal(JSON.stringify(s),before,'optical camera cannot modify game authority');
});

test('authentic compact Warden danger gets grounded physical 3D framing; broad hazard remains safe',async()=>{
 const {planCinematicShot,planReadableExpeditionLens,planWardenWarningFocus}=await load('public/ai-dungeon/cinematic-chapter-plan.js');
 const compact=fixture();compact.units[2].action='idle';compact.bossRecovery=null;
 compact.bossWarning={attackTick:compact.tick+1,shape:'RIFT_CROSS',
  cells:[{x:11,z:9},{x:12,z:9},{x:12,z:8},{x:12,z:10}]};
 const preserved=JSON.stringify(compact),close=planCinematicShot(compact);
 assert.equal(close.mode,'warden-warning');assert.equal(close.dangerPriority,undefined);
 assert.ok(close.warningFocus?.closeness>.6,'true compact danger creates a meaningful camera decision');
 const wide=JSON.parse(JSON.stringify(compact));wide.bossWarning.cells=[
  {x:2,z:2},{x:16,z:2},{x:2,z:16},{x:16,z:16}];
 const wideShot=planCinematicShot(wide);
 assert.equal(wideShot.mode,'warden-warning');
 assert.equal(wideShot.warningFocus?.closeness,0,'true broad warning must keep the overview');
 const distance=l=>Math.hypot(l.offsets[0],l.offsets[2]);
 for(const view of [{width:1440,height:832},{width:390,height:844}]){
  const closeLens=planReadableExpeditionLens(close,view);
  const wideLens=planReadableExpeditionLens(wideShot,view);
  assert.ok(distance(closeLens)<distance(wideLens)-1.1,'skinned Warden and frontline must have larger screen presence');
  assert.ok(closeLens.offsets[1]<wideLens.offsets[1]-1,'true hero-eye height instead of toy-like overhead');
  assert.equal(closeLens.fov,wideLens.fov,'do not delete the original threat field of view');
  assert.equal(closeLens.dangerPriority,true,'critical threat always remains highest priority');
  const stable=planReadableExpeditionLens(close,{...view,reducedMotion:true});
  assert.equal(distance(stable),distance(wideLens),'reduced-motion retains the stable original wide radius');
  assert.equal(stable.offsets[1],wideLens.offsets[1],'reduced-motion maintains established height');
 }
 assert.equal(JSON.stringify(compact),preserved,'planner cannot mutate the original game state');
 const malformed=JSON.parse(JSON.stringify(compact));malformed.bossWarning.cells.push({x:99,z:99});
 assert.equal(planWardenWarningFocus(malformed,malformed.units[1],malformed.units[2]),null,'invalid warning cannot claim compact framing');
 assert.equal(planCinematicShot(malformed).warningFocus,null,'invalid threat falls back to the stable lens');
});
test('genuine compact Warden danger now fills portrait with real adult-scale actors, never crop the hazard field',async()=>{
 const {planCinematicShot,planReadableExpeditionLens}=await load('public/ai-dungeon/cinematic-chapter-plan.js');
 const s=fixture();s.units[2].action='idle';s.bossRecovery=null;
 s.bossWarning={attackTick:s.tick+1,shape:'RIFT_CROSS',cells:[
  {x:11,z:9},{x:12,z:9},{x:12,z:8},{x:12,z:10}]};
 const before=JSON.stringify(s),shot=planCinematicShot(s);
 assert.equal(shot.mode,'warden-warning');
 assert.ok(shot.warningFocus.closeness>.6);
 const phone=planReadableExpeditionLens(shot,{width:390,height:844});
 const c=shot.warningFocus.closeness;
 const oldRadius=(9.05-2.4*c*.74)*1.24;
 const oldHeight=(10.55-2.2*c*.74)*1.17;
 assert.ok(Math.hypot(phone.offsets[0],phone.offsets[2])<oldRadius*.87);
 assert.ok(phone.offsets[1]<oldHeight*.95);
 assert.equal(phone.fov,57);
 assert.equal(phone.dangerPriority,true);
 const wide=planReadableExpeditionLens({...shot,warningFocus:{extent:11,cells:4,closeness:0}},{width:390,height:844});
 assert.ok(Math.hypot(...wide.offsets)>Math.hypot(...phone.offsets)+3);
 assert.ok(wide.offsets[1]>phone.offsets[1]+2);
 const still=planReadableExpeditionLens(shot,{width:390,height:844,reducedMotion:true});
 assert.ok(Math.abs(Math.hypot(...still.offsets)-Math.hypot(...wide.offsets))<.002);
 assert.equal(still.offsets[1],wide.offsets[1]);
 assert.equal(JSON.stringify(s),before,'camera must never modify authoritative combat');
});
