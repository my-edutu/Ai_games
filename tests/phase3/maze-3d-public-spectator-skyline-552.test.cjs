'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const source=fs.readFileSync(path.join(root,'public/ai-maze-escape/world.js'),'utf8');
const file=name=>pathToFileURL(path.join(root,name)).href;
const load=()=>import('data:text/javascript;base64,'+Buffer.from(source
  .replace("'./vendor/three.module.js'",JSON.stringify(file('node_modules/three/build/three.module.js')))
  .replace("'./gate-moment.mjs'",JSON.stringify(file('public/ai-maze-escape/gate-moment.mjs')))
  .replace("'./map-view.mjs'",JSON.stringify(file('public/ai-maze-escape/map-view.mjs')))).toString('base64'));
const stage=()=>({
 runToken:'pass552-original-public-court',lifecycle:'running',result:null,
 width:5,height:9,currentCell:1,
 visibleCells:Array.from({length:15},(_,i)=>i),
 cells:Array.from({length:15},(_,cell)=>({
  cell,blocked:false,
  neighbors:cell===1?[6]:cell===6?[1,11]:cell===11?[6]:[],
 })),
 threats:[{id:'observed-thornback',cell:11,lanternParried:false}],
 doors:[],keys:[],inventory:[],traps:[],exitCell:null,
});
test('Pass552 witnessed guardian suppresses distant high spectator poles on same public tier but retains physical walls and restores ordinary scenery',async()=>{
 const {createMazeWorld}=await load(); const s=stage(); const copy=JSON.stringify(s);
 const w=createMazeWorld({balanced:true});
 try{
  w.update({...s,runToken:'public-court-active'});
  const active=w.stats(); assert.ok(active.guardianCausewayTiles>0,'actual witnessed reciprocal guardian court is physically staged');
  assert.equal(active.tidePennants,0,'no tall decorative wall pennants compete with the witnessed guardian on the public tier');
  assert.equal(active.wallWindcatchers,0,'no redundant high windcatchers compete with either actor on the public tier');
  assert.ok(active.meshes>0&&active.geometryCount<100,'original solid walls and strict budget remain');
  const calm={...s,runToken:'public-court-calm',threats:[]};
  w.update(calm); const restored=w.stats();
  assert.ok(restored.tidePennants+restored.wallWindcatchers>0,
   'ordinary original wall ornaments are restored when no guardian is publicly present');
  assert.equal(restored.geometryCount,active.geometryCount,'same shared GPU geometry classes');
  w.update({...s,runToken:'public-court-hidden',visibleCells:s.visibleCells.filter(c=>c!==11)});
  const unseen=w.stats();
  assert.ok(unseen.tidePennants+unseen.wallWindcatchers>0,
   'a merely remembered/hidden guardian cannot quiet visible scenery');
  for(let i=0;i<6;i++){
   w.update({...s,runToken:'pass552-reset-'+i});
   assert.ok(w.stats().geometryCount<100,'unchanged six-reset strict budget');
  }
  assert.equal(JSON.stringify(s),copy,'no AI/navigation/private authoritative state mutated');
 }finally{w.dispose();assert.equal(w.stats().geometryCount,0);assert.equal(w.stats().materialCount,0);}
});
