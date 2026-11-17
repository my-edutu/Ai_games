'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const helpers=()=>import('../../public/ai-maze-escape/public-lantern-encounter.mjs');
const scene=fs.readFileSync(path.join(__dirname,'../../public/ai-maze-escape/scene.js'),'utf8');
const straight=()=>({
  width:5,height:5,currentCell:6,runToken:'actual-public-guardian',
  lifecycle:'running',result:null,visibleCells:[6,7,8],
  threats:[{id:'thornback',cell:8,lanternParried:true}],doors:[],
  cells:[{cell:6,blocked:false,neighbors:[7]},
    {cell:7,blocked:false,neighbors:[6,8]},
    {cell:8,blocked:false,neighbors:[7]}],
});
const earned=(cell=8)=>({cell,x:4.8,z:0,counterPhase:.42});
test('only two original public reciprocal open straight links may project a physical lantern pair',async()=>{
 const {publicEarnedGuardianCounterLightPath:light,publicLanternEncounter:one}=await helpers();
 const s=straight(),before=structuredClone(s);
 assert.equal(one(s,8),false,'generic warning stays strictly one link');
 assert.deepEqual(light(s,earned(),null),{links:2,midCell:7});
 assert.deepEqual(s,before,'renderer cue never mutates the source snapshot');
 assert.equal(light(s,{...earned(),counterPhase:1},null),null);
});
test('ACTUAL diagonal guardian counter bends the existing two lantern meshes around a known open intermediate cell',async()=>{
 const {publicEarnedGuardianCounterLightPath:light,publicGuardianOpenSightline:straightOnly}=await helpers();
 const s=straight();
 // This is a corner, not an invented diagonal straight line from 6 to 12.
 s.visibleCells=[6,7,11,12];
 s.threats=[{id:'thornback',cell:12,lanternParried:true}];
 s.cells=[
  {cell:6,blocked:false,neighbors:[7,11]},
  {cell:7,blocked:false,neighbors:[6,12]},
  {cell:11,blocked:false,neighbors:[6,12]},
  {cell:12,blocked:false,neighbors:[7,11]},
 ];
 assert.equal(straightOnly(s,12),0);
 assert.deepEqual(light(s,earned(12),null),{links:2,midCell:7},
  'choose one deterministic actually published unlocked bend');
 assert.deepEqual(light({...s,visibleCells:[6,11,12]},earned(12),null),
  {links:2,midCell:11},'never requires a hidden interim tile');
 assert.equal(light({...s,visibleCells:[6,12]},earned(12),null),null);
 assert.equal(light({...s,doors:[{a:7,b:12,open:false},{a:11,b:12,open:false}]},earned(12),null),null);
});
test('unknown, blocked, sealed, one-way, trapped, first-seen, terminal or rival guardian rejects the visible two-edge cue',async()=>{
 const {publicEarnedGuardianCounterLightPath:light}=await helpers(),s=straight();
 const bad=[
  {...s,visibleCells:[6,8]},
  {...s,visibleCells:[6,7]},
  {...s,doors:[{a:7,b:8,open:false}]},
  {...s,cells:s.cells.map(c=>c.cell===7?{...c,blocked:true}:c)},
  {...s,cells:s.cells.map(c=>c.cell===7?{...c,trap:true}:c)},
  {...s,cells:s.cells.map(c=>c.cell===7?{...c,neighbors:[8]}:c)},
  {...s,threats:[{id:'thornback',cell:8,lanternParried:false}]},
  {...s,threats:[]},
  {...s,lifecycle:'intermission'},
  {...s,result:{reason:'capture'}},
  {...s,currentCell:11,visibleCells:[11,7,8]},
 ];
 for(const changed of bad) assert.equal(light(changed,earned(),null),null);
 for(const invalid of [
  {...earned(),counterPhase:undefined},{...earned(),counterPhase:-.1},
  {...earned(),counterPhase:NaN},{...earned(),x:NaN},
  {...earned(),cell:7},{...earned(),cell:undefined}
 ])assert.equal(light(s,invalid,null),null);
 assert.equal(light(s,earned(),{strength:.8,lanternParried:false}),null);
 assert.deepEqual(light(s,earned(),{strength:.8,lanternParried:true}),{links:2,midCell:7});
});
test('native source performs a true physical bent light in reused geometry without forcing a route or private knowledge',()=>{
 assert.match(scene,/publicEarnedGuardianCounterLightPath\(s,earnedCounterActor,closestThreat\)/);
 assert.match(scene,/else if\(earnedTwoLinkPath\)/);
 assert.match(scene,/placePublicSurveyCone\(\s*lanternBeam,lanternFocusOrigin,lanternSurveyCorner\)/);
 assert.match(scene,/placePublicSurveyCone\(\s*lanternSurveyTurn,lanternSurveyCorner,lanternBeamEnd\)/);
 assert.match(scene,/Math\.max\(4,CELL_SIZE\*2\.9\)/);
 assert.match(scene,/publicLanternEncounter\(s,closestThreat\.cell\)/);
 assert.doesNotMatch(scene,/new THREE\.(Mesh|PointLight|CylinderGeometry).*earnedTwoLinkPath/);
});
