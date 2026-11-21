'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const source=fs.readFileSync(path.join(root,'public/ai-maze-escape/world.js'),'utf8');
const mod=name=>pathToFileURL(path.join(root,name)).href;
const load=()=>import('data:text/javascript;base64,'+Buffer.from(source
 .replace("'./vendor/three.module.js'",JSON.stringify(mod('node_modules/three/build/three.module.js')))
 .replace("'./gate-moment.mjs'",JSON.stringify(mod('public/ai-maze-escape/gate-moment.mjs')))
 .replace("'./map-view.mjs'",JSON.stringify(mod('public/ai-maze-escape/map-view.mjs')))).toString('base64'));
const scene=()=>({runToken:'pass547-public-outer-court',lifecycle:'running',result:null,
 width:13,height:13,currentCell:84,visibleCells:[84,85,90],
 cells:[{cell:84,blocked:false,neighbors:[85]},
   {cell:85,blocked:false,neighbors:[84]},
   {cell:90,blocked:false,neighbors:[]}],
 doors:[],keys:[],inventory:[],traps:[],exitCell:null,
 threats:[{id:'thornback',cell:85,lanternParried:true}]});
test('Pass547 earned two-actor public 3D stage quiets genuinely visible fifth-ring ordinary spectator dressing, not secrets or walls',async()=>{
 const {publicEarnedGuardianRecoilCourtCells:quiet,createMazeWorld}=await load();
 const s=scene(),original=JSON.stringify(s);
 const visibleOuter=quiet(s,{spectator:true});
 assert.ok(visibleOuter.has(90),'genuine currently visible fifth-ring ordinary spectator enters physical negative-space stage');
 assert.equal(quiet(s).has(90),false,'actor-level two-cell court does not grow into a speculative path');
 const hidden=scene();hidden.visibleCells=[84,85];
 assert.equal(quiet(hidden,{spectator:true}).has(90),false,'previously known but not CURRENTLY visible fifth-ring terrain is unchanged');
 const unearned=scene();unearned.threats[0].lanternParried=false;
 assert.equal(quiet(unearned,{spectator:true}).has(90),false,'no new stage on anticipated or unearned parry');
 const unseenGuardian=scene();unseenGuardian.visibleCells=[84,90];
 assert.equal(quiet(unseenGuardian,{spectator:true}).size,0,'hidden guardian never triggers outer physical stage');
 for(const [label,mutation] of [
   ['solid support',x=>{x.cells[2].blocked=true}],
   ['pressure jaw',x=>{x.cells[2].trap=true}],
   ['clue',x=>{x.cells[2].clue=true}],
   ['checkpoint',x=>{x.cells[2].checkpoint=true}],
   ['exit',x=>{x.exitCell=90}],
   ['key',x=>{x.keys=[{id:'key',cell:90,collected:false}]}],
   ['gate endpoint',x=>{x.doors=[{a:90,b:89,open:true}]}]
 ]) {
   const changed=scene();mutation(changed);
   assert.equal(quiet(changed,{spectator:true}).has(90),false,label+' stays physically intact');
 }
 const w=createMazeWorld({balanced:true});
 try{
   w.update(unearned);
   const baseline=w.stats().geometryCount;
   w.update(s);
   assert.ok(w.stats().geometryCount<100,'original GPU geometry resource budget remains unchanged');
   for(let run=0;run<6;run++){
     w.update({...s,runToken:'pass547-run-'+run});
     assert.ok(w.stats().geometryCount<100,'six genuine real Three resets retain original strict resource limit');
   }
   w.update(unearned);
   assert.ok(w.stats().geometryCount<100,'losing earned permission restores ordinary scene resources');
   assert.equal(JSON.stringify(s),original,'no public snapshot or autonomous simulation mutation');
   assert.ok(baseline<100);
 }finally{w.dispose();}
 assert.equal(w.stats().geometryCount,0,'all reusable GPU geometries disposed');
});