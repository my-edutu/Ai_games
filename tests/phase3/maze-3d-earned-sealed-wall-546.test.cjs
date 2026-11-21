'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const src=fs.readFileSync(path.join(root,'public/ai-maze-escape/world.js'),'utf8');
const mod=name=>pathToFileURL(path.join(root,name)).href;
const load=()=>import('data:text/javascript;base64,'+Buffer.from(src
 .replace("'./vendor/three.module.js'",JSON.stringify(mod('node_modules/three/build/three.module.js')))
 .replace("'./gate-moment.mjs'",JSON.stringify(mod('public/ai-maze-escape/gate-moment.mjs')))
 .replace("'./map-view.mjs'",JSON.stringify(mod('public/ai-maze-escape/map-view.mjs')))).toString('base64'));
const scene=()=>({runToken:'pass546-visible-parry-wall',lifecycle:'running',result:null,
 width:7,height:7,currentCell:23,visibleCells:[23,25,30],
 cells:[{cell:23,blocked:false,neighbors:[24]},{cell:25,blocked:false,neighbors:[24]},
 {cell:30,blocked:false,neighbors:[]}],doors:[],keys:[],inventory:[],traps:[],exitCell:null,
 threats:[{id:'thornback',cell:25,lanternParried:true}]});
test('Pass546 actual earned parry cuts only fully witnessed sealed spectator architecture',async()=>{
 const {publicEarnedGuardianSealedStageEdges:edges,createMazeWorld}=await load();
 const s=scene(),truth=JSON.stringify(s);
 assert.deepEqual([...edges(s)],['23:30'],'true publicly known solid nonpassage');
 const unearned=scene();unearned.threats[0].lanternParried=false;
 assert.equal(edges(unearned).size,0,'no invented counter');
 const hidden=scene();hidden.visibleCells=[23,25];
 assert.equal(edges(hidden).size,0,'no hidden wall reveal');
 const oneWay=scene();oneWay.cells[0].neighbors.push(30);
 assert.equal(edges(oneWay).size,0,'one-way ambiguous wall not cut');
 const opposite=scene();opposite.cells[2].neighbors.push(23);
 assert.equal(edges(opposite).size,0,'other-way ambiguous wall not cut');
 const gate=scene();gate.doors=[{a:23,b:30,open:true}];
 assert.equal(edges(gate).size,0,'real gate never recast');
 const pressure=scene();pressure.cells[2].trap=true;
 assert.equal(edges(pressure).size,0,'real trap wall stays');
 const blocked=scene();blocked.cells[2].blocked=true;
 assert.equal(edges(blocked).size,0,'blocked support wall stays');
 const outcome=scene();outcome.result={reason:'escape'};
 assert.equal(edges(outcome).size,0,'stale victory never invents cutaway');
 const w=createMazeWorld({balanced:true});
 try{
  w.update(unearned);
  const initial=w.stats().guardianSightlineParapets;
  w.update(s);
  assert.ok(w.stats().guardianSightlineParapets>initial,'real Three world reconstructs physical opaque bulwark');
  assert.equal(JSON.stringify(s),truth,'no simulation or public snapshot mutation');
 }finally{w.dispose();}
});
