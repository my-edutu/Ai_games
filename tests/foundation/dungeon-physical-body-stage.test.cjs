'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const load=async name=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(path.join(root,'public/ai-dungeon',name),'utf8')).toString('base64'));
const map=Array.from({length:11},(_,z)=>Array.from({length:11},(_,x)=>z===0||z===10||x===0||x===10?'#':'.').join(''));
test('genuine 3D combat blocking cannot bury skinned feet or armour in adjacent stone',async()=>{
 const {settleStoneSafeCombatStances,planCombatStage}=await load('combat-staging-plan.js');
 const m=[...map];m[5]=m[5].slice(0,6)+'#'+m[5].slice(7);
 const u=Object.freeze({id:'hero',kind:'vanguard',hp:100,action:'attack',actionTick:17,faction:'party',x:5,z:5});
 const state=Object.freeze({tick:17,map:m,units:[u]});
 const placed=Object.freeze({hero:Object.freeze({x:5.42,z:5.34,dx:.42,dz:.34,crowded:true})});
 const a=settleStoneSafeCombatStances(state,placed);
 assert.ok(a.hero.dx<=.19);
 assert.equal(a.hero.z,5.34);
 assert.equal(a.hero.stoneSafe,true);
 assert.equal(placed.hero.dx,.42);
 const main=planCombatStage(state,{x:7,z:7});
 assert.ok(main.hero.x<=5.19);
});
test('diagonal solid stone protects visual ankle-space without changing legal movement',async()=>{
 const {settleStoneSafeCombatStances}=await load('combat-staging-plan.js');
 const m=[...map];m[6]=m[6].slice(0,6)+'#'+m[6].slice(7);
 const p={archer:{x:5.35,z:5.32,dx:.35,dz:.32,crowded:true}};
 const a=settleStoneSafeCombatStances(Object.freeze({map:m,units:[{id:'archer',kind:'ranger',hp:85,x:5,z:5}]}),p);
 assert.ok(a.archer.dx<=.24&&a.archer.dz<=.24);
 assert.equal(a.archer.crowded,true);
 assert.equal(p.archer.dx,.35);
});
test('real drawn co-located heroes resolve independently; deaths, corruption and wrong-cell roots cannot fabricate sightlines',async()=>{
 const {resolveRenderedSilhouetteSubjects}=await load('party-visibility-plan.js');
 const state=Object.freeze({map,units:[
  Object.freeze({id:'knight',hp:110,x:5,z:5,faction:'party'}),
  Object.freeze({id:'archer',hp:85,x:5,z:5,faction:'party'}),
  Object.freeze({id:'dead',hp:0,x:5,z:5,faction:'party'})]});
 const points=Object.freeze([Object.freeze({x:0,z:0,silhouetteRecess:true}),Object.freeze({x:0,z:0,silhouetteRecess:true}),Object.freeze({x:0,z:0})]);
 const actors=new Map([
  ['knight',{root:{visible:true,position:{x:.18,z:-.22}}}],
  ['archer',{root:{visible:true,position:{x:-.21,z:.19}}}],
  ['dead',{root:{visible:true,position:{x:.32,z:.31}}}]]);
 const found=resolveRenderedSilhouetteSubjects(state,points,actors);
 assert.equal(found[0].x,.18);assert.equal(found[1].x,-.21);
 assert.equal(found[2],points[2]);
 assert.equal(found[0].silhouetteRecess,true);
 assert.equal(state.units[0].x,5);
 assert.equal(resolveRenderedSilhouetteSubjects(state,Array.from({length:60},()=>points[0]),actors).length,5);
 actors.get('archer').root.position.x=7;
 assert.equal(resolveRenderedSilhouetteSubjects(state,points,actors)[1],points[1]);
});
test('live WebGL composes the true visible body positions for its physical camera and ALL stone layers',()=>{
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 assert.match(app,/const partySightlines=resolveRenderedSilhouetteSubjects\(state,/);
 assert.match(app,/physicalCameraDirector\.resolve\(state,basePlannedCamera/);
 assert.match(app,/cutawayWalls\(target,partySightlines/);
 assert.match(app,/dressing\?\.cutaway\(partySightlines/);
 assert.match(app,/chapterNaves\?\.cutaway\(partySightlines/);
});
