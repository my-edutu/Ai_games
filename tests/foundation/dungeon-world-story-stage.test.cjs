'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const src=p=>fs.readFileSync(path.join(root,p),'utf8');
const load=async p=>import('data:text/javascript;base64,'+Buffer.from(src(p)).toString('base64'));
const map=Array.from({length:19},()=>'.'.repeat(19));
const state=()=>({phase:'exploring',tick:10,floor:1,map,units:[
 {id:'vanguard',kind:'vanguard',hp:100,faction:'party',x:8,z:9},
 {id:'warden',kind:'warden',hp:200,faction:'enemy',x:9,z:9}]
});
test('one genuine adventure stage governs camera-level architecture clearance and physical light emphasis',async()=>{
 const {planWorldStoryStage:stage}=await load('public/ai-dungeon/world-story-stage-plan.js');
 const s=state(),before=JSON.stringify(s);
 const voyage=stage(s,{mode:'journey'}),duel=stage(s,{mode:'warden-contact'});
 assert.ok(duel.wallPad>voyage.wallPad && duel.keyScale>voyage.keyScale);
 assert.ok(duel.ambient<voyage.ambient,'combat needs stronger form and silhouette contrast');
 assert.ok(Object.isFrozen(duel));
 assert.equal(JSON.stringify(s),before,'never change authority');
 assert.equal(stage(s,{mode:'imaginary-kill'}),null);
 assert.equal(stage(null,{mode:'journey'}),null);
 for(const mode of ['journey','contact','warden-approach','warden-exposed','warden-warning','last-stand']){
  const result=stage(s,{mode},{width:390,reducedMotion:true});
  assert.ok(result.wallPad<=3.10&&result.wallPad>=2.1);
  assert.equal(result.motion,false);
  assert.ok(result.ambient>1.25&&result.ambient<1.8);
 }
});
test('Warden recovery, danger and death never fabricate an opening or boss light',async()=>{
 const {planWorldStoryStage:stage}=await load('public/ai-dungeon/world-story-stage-plan.js');
 const s=state(),shot={mode:'warden-exposed'};
 assert.equal(stage(s,shot).mode,'warden-approach');
 s.bossRecovery={remaining:3};
 assert.equal(stage(s,shot).mode,'warden-exposed');
 assert.equal(stage(s,shot).realRecovery,true);
 assert.equal(stage(s,shot,{width:390}).mode,'warden-exposed');
 s.bossWarning={attackTick:11,cells:[{x:8,z:9}]};
 assert.equal(stage(s,shot).mode,'warden-warning','lethal warning interrupts close-up');
 assert.equal(stage(s,shot).realWarning,true);
 s.bossWarning.cells=[];
 assert.equal(stage(s,shot).mode,'warden-exposed','empty telegraph is not actual danger');
 s.guardianWard=true;
 assert.equal(stage(s,shot).mode,'warden-approach','sealed boss is not vulnerable');
 s.units.find(u=>u.kind==='warden').hp=0;
 assert.equal(stage(s,shot).mode,'journey');
 assert.equal(stage(s,{mode:'warden-warning'}).realBossVisible,false);
});
test('the same stage width cuts facade, masonry and existing foreground props without deleting remote rooms',async()=>{
 const {planPartyWallReveal:reveal}=await load('public/ai-dungeon/party-visibility-plan.js');
 const camera={x:6,z:0},party=[{x:0,z:0}];
 assert.equal(reveal(0,3.0,party,camera),'none');
 assert.equal(reveal(0,3.0,party,camera,2.93),'nearby');
 assert.equal(reveal(0,4.5,party,camera,2.93),'none');
 const app=src('public/ai-dungeon/app.js'),env=src('public/ai-dungeon/environment.js'),host=src('scripts/serve-dungeon-stream.cjs');
 assert.match(app,/planWorldStoryStage\(state,cinematicShot/);
 assert.match(app,/cutawayWalls\(target,partySightlines,storyStage\?\.wallPad/);
 assert.match(app,/world\.userData\.dressing\?\.cutaway\(partySightlines,camera\.position,storyStage\?\.wallPad/);
 assert.match(app,/storyStage:storyStage\?\?null/);
 assert.match(env,/planPartyWallReveal\(face\[0\],face\[2\],eyes,camera,wallPad,face\[4\]\)/);
 assert.ok(host.includes("['/dungeon/world-story-stage-plan.js','world-story-stage-plan.js']"));
});
test('hero-first boss tableau separates an actual defender in place while aligning the visible blade origin',async()=>{
 const {planCombatStage,MAX_STAGE_OFFSET}=await load('public/ai-dungeon/combat-staging-plan.js');
 const {planCinematicShot}=await load('public/ai-dungeon/cinematic-chapter-plan.js');
 const s=state(),shot=planCinematicShot(s);
 assert.equal(shot.mode,'warden-approach');
 assert.ok(shot.x<8.5,'Warden must not steal the hero-led encounter composition');
 const stage=planCombatStage(s,{x:4,z:8}),hero=stage.vanguard;
 assert.ok(hero && Math.hypot(hero.dx,hero.dz)>.30,'full body silhouette needs more room to breathe');
 assert.ok(Math.hypot(hero.dx,hero.dz)<=MAX_STAGE_OFFSET+.0001);
 assert.equal(stage.warden.x,9);assert.equal(stage.warden.z,9);
});
