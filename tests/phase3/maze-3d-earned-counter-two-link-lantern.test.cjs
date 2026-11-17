'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const helpers=()=>import('../../public/ai-maze-escape/public-lantern-encounter.mjs');
const scene=fs.readFileSync(path.join(__dirname,'../../public/ai-maze-escape/scene.js'),'utf8');
const corridor=()=>({
  width:5,height:5,currentCell:6,runToken:'original-public-guardian',
  lifecycle:'running',result:null,visibleCells:[6,7,8],
  threats:[{id:'thornback',cell:8,lanternParried:true}],doors:[],
  cells:[{cell:6,blocked:false,neighbors:[7]},
    {cell:7,blocked:false,neighbors:[6,8]},
    {cell:8,blocked:false,neighbors:[7]}],
});
const earned=()=>({cell:8,x:4.8,z:0,counterPhase:.42});
test('earned moving two-link open public counter grounds original lantern in Thornback and leaves snapshot intact',async()=>{
 const {publicEarnedGuardianCounterBeam:beam,publicGuardianOpenSightline:open,
  publicLanternEncounter:near}=await helpers();
 const s=corridor(),before=structuredClone(s);
 assert.equal(open(s,8),2);
 assert.equal(near(s,8),false,'generic first-seen warning cannot send a two-link ray');
 assert.equal(beam(s,earned(),null),true);
 assert.deepEqual(s,before);
 assert.equal(beam(s,{...earned(),counterPhase:0},null),true);
 assert.equal(beam(s,{...earned(),counterPhase:1},null),false);
});
test('unknown, blocked, sealed, one-way, unseen, skipped-clock and rival threat cannot fake a moving counter ray',async()=>{
 const {publicEarnedGuardianCounterBeam:beam}=await helpers(),s=corridor();
 const bad=[
  {...s,visibleCells:[6,8]},
  {...s,visibleCells:[6,7]},
  {...s,doors:[{a:7,b:8,open:false}]},
  {...s,cells:s.cells.map(c=>c.cell===7?{...c,blocked:true}:c)},
  {...s,cells:s.cells.map(c=>c.cell===7?{...c,neighbors:[8]}:c)},
  {...s,threats:[{id:'thornback',cell:8,lanternParried:false}]},
  {...s,threats:[]},
  {...s,lifecycle:'intermission'},
  {...s,result:{reason:'capture'}},
  {...s,currentCell:11,visibleCells:[11,7,8]},
 ];
 for(const changed of bad)assert.equal(beam(changed,earned(),null),false);
 for(const invalid of [
  {...earned(),counterPhase:undefined},{...earned(),counterPhase:-.1},
  {...earned(),counterPhase:NaN},{...earned(),x:NaN},
  {...earned(),cell:7},{...earned(),cell:undefined}
 ])assert.equal(beam(s,invalid,null),false);
 assert.equal(beam(s,earned(),{strength:.8,lanternParried:false}),false,
  'another current un-parried threat has priority');
 assert.equal(beam(s,earned(),{strength:.8,lanternParried:true}),true);
});
test('the retained 3D hand lantern, NOT new GPU primitives or HUD text, renders the earned source-validated court',()=>{
 assert.match(scene,/publicEarnedGuardianCounterBeam\(s,earnedCounterActor,closestThreat\)/);
 assert.match(scene,/else if\(earnedTwoLinkBeam\)/);
 assert.match(scene,/lanternBeamEnd\.set\(earnedCounterActor\.x/);
 assert.match(scene,/lanternBeam\.scale\.set\(\.88,length,\.88\)/);
 assert.match(scene,/publicGuardianLanternReach\(s,earnedCounterActor\.cell,CELL_SIZE,4\)/);
 assert.match(scene,/publicLanternEncounter\(s,closestThreat\.cell\)/,
  'generic cone still requires the original STRICT adjacent-only public contract');
 assert.doesNotMatch(scene,/privateMaze.*earnedTwoLinkBeam|secretSafeRoute.*earnedTwoLinkBeam/i);
});
