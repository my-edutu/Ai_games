'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const load=async()=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(path.join(root,'public/ai-dungeon/encounter-sightlines.js'),'utf8')).toString('base64'));
const map=Array.from({length:19},()=>'.'.repeat(19));
const s=()=>({map,units:[
 {faction:'party',id:'vanguard',hp:30,x:8,z:9},
 {faction:'party',id:'ranger',hp:30,x:8,z:10},
 {faction:'party',id:'mystic',hp:30,x:7,z:9},
 {faction:'enemy',id:'revenant1',kind:'revenant',hp:30,x:10,z:9},
 {faction:'enemy',id:'cultist1',kind:'cultist',hp:30,x:8,z:12}
]});
test('real skirmish foreground cutaway reveals closest legitimate living opponent before first swing',async()=>{
 const {planEncounterSightlines,planCombatSightlineExtension}=await load(),state=s();
 const original=JSON.stringify(state),base=planEncounterSightlines(state,{x:0,z:0},false);
 assert.deepEqual(base,[{x:-1,z:0},{x:-1,z:1},{x:-2,z:0}]);
 assert.deepEqual(planCombatSightlineExtension(state,base,'skirmish-approach'),[...base,{x:-1,z:3}]);
 assert.equal(JSON.stringify(state),original);
});
test('authoritative walls, distance, dead enemies and boss shots prevent invented sightlines',async()=>{
 const {planCombatSightlineExtension:extend}=await load(),state=s();
 const base=[{x:-1,z:0},{x:-1,z:1},{x:-2,z:0}];
 assert.deepEqual(extend(state,base,'journey'),base);
 assert.deepEqual(extend(state,base,'warden-warning'),base);
 assert.deepEqual(extend(state,base.concat([{x:2,z:0},{x:3,z:0}]),'contact'),base.concat([{x:2,z:0},{x:3,z:0}]));
 state.units=state.units.filter(u=>u.faction==='party').concat([{faction:'enemy',id:'remote',kind:'cultist',hp:30,x:17,z:17}]);
 assert.deepEqual(extend(state,base,'contact'),base);
 state.units[3]={faction:'enemy',id:'close',kind:'revenant',hp:10,x:10,z:9};
 state.map=state.map.map((r,z)=>z===9?r.substring(0,9)+'#'+r.substring(10):r);
 // The only enemy lies behind masonry, and the L routes must be genuinely clear.
 state.map=state.map.map((r,z)=>z===10?r.substring(0,9)+'#'+r.substring(10):r);
 assert.deepEqual(extend(state,base,'contact'),base);
 state.units[3].hp=0;
 assert.deepEqual(extend(state,base,'contact'),base);
});
test('the running Three.js dungeon uses the same capped enemy cutaway for live camera and world props',()=>{
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 assert.match(app,/planCombatSightlineExtension\(state,/);
 assert.match(app,/planEncounterSightlines\(state,target,Boolean\(bossDistance\)\)/);
 assert.match(app,/cutawayWalls\(target,partySightlines/);
 assert.match(app,/sightlineClearance\(prop\.position\.x/);
});
test('costume bodies have trimmed identity shapes without changing real GLB animation or hitboxes',async()=>{
 const kit=fs.readFileSync(path.join(root,'public/ai-dungeon/role-silhouette-plan.js'),'utf8');
 const armor=fs.readFileSync(path.join(root,'public/ai-dungeon/anatomical-kit-plan.js'),'utf8');
 const models=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(kit,/\.62,1\.44,\.43/);
 assert.match(armor,/\.44\*p\.head,\.28,\.16/);
 assert.match(models,/plate:new THREE\.IcosahedronGeometry\(\.5,0\)/);
 assert.match(models,/bindRigWardrobe\(actor\)/);
});
