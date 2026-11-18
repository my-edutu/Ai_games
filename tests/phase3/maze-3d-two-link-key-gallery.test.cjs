'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const source=fs.readFileSync(path.resolve(__dirname,'../../public/ai-maze-escape/world.js'),'utf8');
const three=pathToFileURL(path.resolve(__dirname,'../../node_modules/three/build/three.module.js')).href;
const gate=pathToFileURL(path.resolve(__dirname,'../../public/ai-maze-escape/gate-moment.mjs')).href;
const map=pathToFileURL(path.resolve(__dirname,'../../public/ai-maze-escape/map-view.mjs')).href;
const load=()=>import('data:text/javascript;base64,'+Buffer.from(source
  .replace("'./vendor/three.module.js'",JSON.stringify(three))
  .replace("'./gate-moment.mjs'",JSON.stringify(gate))
  .replace("'./map-view.mjs'",JSON.stringify(map))).toString('base64'));
const published=()=>({
 runToken:'real-physical-key-gallery',lifecycle:'running',result:null,
 width:7,height:9,currentCell:24,visibleCells:[23,24,25],
 cells:[
  {cell:23,blocked:false,trap:false,neighbors:[16,22,24]},
  {cell:24,blocked:false,trap:false,neighbors:[23,25]},
  {cell:25,blocked:false,trap:false,neighbors:[24]}
 ],keys:[{id:'key-1',cell:25,collected:false}],doors:[],threats:[],
 inventory:[],exitCell:null
});
test('a two-link key shrine is one OPEN currently disclosed gallery, never a guessed route',async()=>{
 const {publicTwoLinkTreasureGallery:gallery}=await load();
 const s=published(),before=JSON.stringify(s);
 const selected=gallery(s);
 assert.deepEqual([...selected.keys()],[24,25]);
 assert.equal(selected.get(24).keyId,'key-1');
 assert.equal(selected.get(25).axis,'x');
 assert.equal(selected.get(25).collected,false);
 assert.deepEqual([...gallery({...s,visibleCells:[23,24]})],[],
   'undiscovered treasure is not shown as a gallery');
 assert.deepEqual([...gallery({...s,visibleCells:[24,25]})],[],
   'undiscovered entry cannot imply a hidden passage');
 assert.deepEqual([...gallery({...s,cells:s.cells.map(c=>c.cell===25?{...c,neighbors:[]}:c)})],[],
   'one-way false corridor is not publicly traversable');
 assert.deepEqual([...gallery({...s,doors:[{a:24,b:25,open:false}]})],[],
   'no painted causeway may cross a sealed gate');
 assert.deepEqual([...gallery({...s,cells:s.cells.map(c=>c.cell===24?{...c,trap:true}:c)})],[],
   'a pressure hazard is never rendered as treasure floor');
 assert.deepEqual([...gallery({...s,keys:[{...s.keys[0],cell:24}]})],[],
   'a key in the middle of the passage is not a terminal shrine');
 assert.deepEqual([...gallery({...s,privateMaze:{keys:[{cell:25}],passages:[23,24,25]},
    secretGoal:25})].keys()],[24,25],
   'private fields cannot alter a source-public art decision');
 assert.deepEqual([...gallery({...s,keys:[{...s.keys[0],collected:true}]})]
   .map(([cell,value])=>[cell,value.collected]),[[24,true],[25,true]],
   'only authentic publicly reported collection changes spent gallery phase');
 assert.equal(JSON.stringify(s),before,'rendering helper cannot mutate the public game truth');
});
test('original joined full-tile 3D treasure corridor is real pooled Three geometry, replay safe',async()=>{
 const {createMazeWorld,publicTwoLinkTreasureGallery}=await load();
 const s=published(),unchanged=JSON.stringify(s);
 const w=createMazeWorld({balanced:true}),initial=w.stats();
 w.update(s);
 const first=w.stats();
 assert.equal(first.treasureGalleryTiles,2,
   'both published reciprocal shrine tiles receive one connected physical course');
 assert.equal(first.renderedCells.length,3,'undiscovered cells cannot become geometry');
 assert.ok(w.group.children[1].children.some(node=>node.isInstancedMesh&&node.count>0),
   'actual scene instances, not a HUD count or fake gameplay event');
 assert.equal(first.geometryCount,initial.geometryCount,
   'physical course must reuse installed Three geometries');
 assert.equal(first.materialCount,initial.materialCount,
   'physical course must reuse installed Three materials');
 assert.equal(JSON.stringify(s),unchanged,'no key, AI movement, world collision or hidden data changes');
 w.update({...s,visibleCells:[23,24]});
 assert.equal(w.stats().treasureGalleryTiles,0,
   'unobserved shrine never leaves invented visible gallery');
 w.update({...s,keys:[{...s.keys[0],collected:true}]});
 assert.equal(w.stats().treasureGalleryTiles,2,
   'same true public layout physically persists as spent treasure after collection');
 for(let i=0;i<6;i++){
   w.update({...s,runToken:'real-gallery-reset-'+i});
   assert.equal(w.stats().treasureGalleryTiles,2);
   assert.ok(w.stats().geometryCount<100,'existing six-reset GPU budget stays strict');
 }
 w.dispose();
 assert.equal(w.stats().geometryCount,0);
 assert.equal(w.stats().materialCount,0);
 assert.equal(w.stats().treasureGalleryTiles,0);
 assert.equal(publicTwoLinkTreasureGallery(s).size,2);
});
