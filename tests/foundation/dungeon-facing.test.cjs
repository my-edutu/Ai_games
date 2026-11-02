'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=path.resolve(__dirname,'../../public/ai-dungeon/facing-plan.js');
async function planner(){
 const code=fs.readFileSync(source,'utf8');
 return import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
}
const unit=(id,kind,faction,x,z,action='attack',hp=30)=>({id,kind,faction,x,z,action,hp,actionTick:12});
const map=()=>Array.from({length:5},()=>'.'.repeat(5));
test('read-only melee facing selects an adjacent hostile at the true actor grid position',async()=>{
 const {planCombatFacing}=await planner();
 const hero=Object.freeze(unit('hero','vanguard','party',2,2)),foe=Object.freeze(unit('enemy','revenant','enemy',3,2));
 const units=Object.freeze([hero,foe]);const before=JSON.stringify(units);
 const aim=planCombatFacing(hero,units,map());
 assert.equal(aim.targetId,'enemy');
 assert.ok(Math.abs(aim.yaw+Math.PI/2)<1e-9);
 assert.equal(JSON.stringify(units),before,'the spectator planner cannot alter game truth');
});
test('stable tie-breaking and defeated just-struck units keep real attack intent readable',async()=>{
 const {planCombatFacing}=await planner();
 const hero=unit('hero','vanguard','party',2,2);
 const first=unit('a','revenant','enemy',1,2,'hurt',0);
 const second=unit('z','revenant','enemy',3,2);
 assert.equal(planCombatFacing(hero,[hero,second,first],map()).targetId,'a');
 assert.equal(planCombatFacing(hero,[hero,second],map()).targetId,'z');
 first.action='idle';
 assert.equal(planCombatFacing(hero,[hero,first],map()),null,'a stale corpse must not become a target');
});
test('ranged attacks face only aligned, unobstructed, in-range targets',async()=>{
 const {planCombatFacing}=await planner();
 const archer=unit('archer','ranger','party',1,1);
 const far=unit('far','cultist','enemy',1,3);
 assert.equal(planCombatFacing(archer,[archer,far],map()).targetId,'far');
 const obstructed=map();obstructed[2]='.#...';
 assert.equal(planCombatFacing(archer,[archer,far],obstructed),null);
 far.x=3;far.z=2;assert.equal(planCombatFacing(archer,[archer,far],map()),null,'never imply a projectile through a diagonal wall');
 far.x=1;far.z=5;assert.equal(planCombatFacing(archer,[archer,far],map()),null,'do not invent off-map targets');
});
test('healing spells, boss radial casting, guard and idle do not invent a victim',async()=>{
 const {planCombatFacing}=await planner();
 const enemy=unit('enemy','revenant','enemy',2,3);
 for(const [kind,action] of [['mystic','cast'],['warden','cast'],['vanguard','guard'],['vanguard','idle']]){
  assert.equal(planCombatFacing(unit('hero',kind,'party',2,2,action),[enemy],map()),null);
 }
 const cultist=unit('cultist','cultist','enemy',2,2,'cast');
 const hero=unit('hero','vanguard','party',2,3);
 assert.equal(planCombatFacing(cultist,[cultist,hero],map()).targetId,'hero');
});
test('movement direction and angular wrap stay bounded without frame-dependent snapping',async()=>{
 const {planMovementFacing,approachCharacterYaw,shortestYawDelta}=await planner();
 assert.ok(Math.abs(planMovementFacing(1,1,2,1)+Math.PI/2)<1e-9);
 assert.equal(planMovementFacing(1,1,1.025,1),null);
 assert.equal(planMovementFacing(NaN,1,2,1),null);
 const current=Math.PI-.08,target=-Math.PI+.08,next=approachCharacterYaw(current,target,.016);
 assert.ok(Math.abs(shortestYawDelta(next,target))<Math.abs(shortestYawDelta(current,target)));
 assert.ok(Math.abs(shortestYawDelta(current,next))<=.016*8.5+1e-9);
 assert.ok(Math.abs(shortestYawDelta(approachCharacterYaw(current,target,.016,true),target))<1e-9);
 assert.ok(Math.abs(shortestYawDelta(current,approachCharacterYaw(current,target,100)))<=.05*8.5+1e-9,'suspended tab cannot jump violently');
 assert.ok(Number.isFinite(approachCharacterYaw(NaN,NaN,.016)));
});
test('production scene and strict server actually wire the new facing planner',()=>{
 const app=fs.readFileSync(path.resolve(__dirname,'../../public/ai-dungeon/app.js'),'utf8');
 const server=fs.readFileSync(path.resolve(__dirname,'../../scripts/serve-dungeon-stream.cjs'),'utf8');
 assert.match(app,/import \{[^}]*planCombatFacing[^}]*\} from '\/dungeon\/facing-plan\.js'/);
 assert.match(app,/a\.combatFacing=planCombatFacing\(u,s\.units,s\.map\)/);
 assert.match(app,/approachCharacterYaw\(a\.root\.rotation\.y,visualYaw,dt,reduced\)/);
 assert.ok(server.includes("['/dungeon/facing-plan.js','facing-plan.js']"));
});

test('explicit victim ID drives physical and audio aim, never a closer unrelated foe',async()=>{
 const {planCombatFacing,planVisualContact}=await planner();
 const hero={...unit('hero','vanguard','party',2,2),targetId:'z'};
 const a=unit('a','revenant','enemy',1,2,'hurt',30),z=unit('z','revenant','enemy',3,2,'hurt',30);
 const s={tick:12,map:map(),units:[hero,a,z],events:[]};
 assert.equal(planCombatFacing(hero,s.units,s.map).targetId,'z');
 assert.equal(planVisualContact(hero,s).targetId,'z');
 hero.targetId='ghost';assert.equal(planVisualContact(hero,s),null);
 hero.targetId='z';z.z=3;assert.equal(planCombatFacing(hero,s.units,s.map),null);
});
test('frozen public snapshots stage only actual contact or live Warden proximity',async()=>{
 const source=fs.readFileSync(path.resolve(__dirname,'../../public/ai-dungeon/encounter-frame-plan.js'),'utf8');
 const {planEncounterFrame}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 const hero={...unit('hero','vanguard','party',2,2),targetId:'enemy'},foe=unit('enemy','revenant','enemy',3,2,'hurt',0);
 const state=Object.freeze({phase:'exploring',map:map(),units:Object.freeze([Object.freeze(hero),Object.freeze(foe)])});
 const before=JSON.stringify(state),shot=planEncounterFrame(state);
 assert.equal(shot.mode,'contact');assert.equal(shot.x,2.5);assert.equal(shot.z,2);
 assert.equal(shot.targetId,'enemy');assert.equal(JSON.stringify(state),before);
 assert.equal(planEncounterFrame({...state,phase:'intermission'}),null);
 assert.equal(planEncounterFrame({...state,units:[{...hero,targetId:'ghost'},foe]}),null);
 const boss={...foe,kind:'warden',hp:300,action:'idle',x:4,z:2};
 assert.equal(planEncounterFrame({...state,units:[{...hero,action:'move',targetId:undefined},boss]}).x,3);
});
test('real stream serves the read-only combat shot planner with explicit diagnostics',()=>{
 const app=fs.readFileSync(path.resolve(__dirname,'../../public/ai-dungeon/app.js'),'utf8');
 const server=fs.readFileSync(path.resolve(__dirname,'../../scripts/serve-dungeon-stream.cjs'),'utf8');
 assert.ok(app.includes("import {planEncounterFrame} from '/dungeon/encounter-frame-plan.js'"));
 assert.ok(app.includes('encounterFrame:encounterFrame??null'));
 assert.ok(server.includes("['/dungeon/encounter-frame-plan.js','encounter-frame-plan.js']"));
});
