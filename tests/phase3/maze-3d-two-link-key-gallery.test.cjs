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
    secretGoal:25}).keys()],[24,25],
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
 // Inspect the actual pooled 3D matrices, not a source string or a count
 // invented by a scene diagnostic. Both original tiles have two standing
 // sails outside the lane; the genuine key pickup must physically lower all
 // four into a spent-clay course without a geometry/material budget increase.
 const THREE=await import(three);
 const gallerySails=(expectedHeight)=>{
   const matrix=new THREE.Matrix4(),position=new THREE.Vector3(),
     quaternion=new THREE.Quaternion(),scale=new THREE.Vector3();
   let count=0;
   for(const node of w.group.children[1].children){
     if(!node.isInstancedMesh)continue;
     for(let i=0;i<node.count;i++){
       node.getMatrixAt(i,matrix);
       matrix.decompose(position,quaternion,scale);
       const onGallery=Math.abs(position.x)<.0001 || Math.abs(position.x-2.4)<.0001;
       const besideLane=Math.abs(Math.abs(position.z+2.4)-.96)<.0001;
       if(onGallery&&besideLane&&Math.abs(scale.y-expectedHeight)<.0001
         &&Math.abs(scale.x-1.77)<.0001&&Math.abs(scale.z-.15)<.0001)
         count++;
     }
   }
   return count;
 };
 assert.equal(gallerySails(.62),4,
   'both published treasure tiles must have genuine raised 3D sea-glass sails');
 assert.equal(JSON.stringify(s),unchanged,'no key, AI movement, world collision or hidden data changes');
 w.update({...s,visibleCells:[23,24]});
 assert.equal(w.stats().treasureGalleryTiles,0,
   'unobserved shrine never leaves invented visible gallery');
 w.update({...s,keys:[{...s.keys[0],collected:true}]});
 assert.equal(w.stats().treasureGalleryTiles,2,
   'same true public layout physically persists as spent treasure after collection');
 assert.equal(gallerySails(.12),4,
   'a real collected key must lower all four 3D gallery sails into spent clay');
 assert.equal(gallerySails(.62),0,
   'the charged 3D sails must not remain after the actual key collection');
 assert.equal(w.stats().geometryCount,initial.geometryCount);
 assert.equal(w.stats().materialCount,initial.materialCount);
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

// Source-authentic time sequence: unlike an abrupt state swap, the TWO real
// publicly discovered gallery tiles move their FOUR current Three instances.
test('witnessed public key acquisition smoothly drops the entire 3D Tideglass gallery without a fake hit or new GPU resources',async()=>{
 const {createMazeWorld,publicTreasureGallerySailHeight:height}=await load();
 const THREE=await import(three),w=createMazeWorld({balanced:true});
 const s={...published(),tick:40},baseline=w.stats();
 const heights=()=>{
   const out=[],m=new THREE.Matrix4(),p=new THREE.Vector3(),q=new THREE.Quaternion(),sc=new THREE.Vector3();
   for(const node of w.group.children[1].children){
     if(!node.isInstancedMesh)continue;
     for(let i=0;i<node.count;i++){
       node.getMatrixAt(i,m);m.decompose(p,q,sc);
       if((Math.abs(p.x)<.0001||Math.abs(p.x-2.4)<.0001)
         && Math.abs(Math.abs(p.z+2.4)-.96)<.0001
         && Math.abs(sc.x-1.77)<.0001&&Math.abs(sc.z-.15)<.0001)out.push(sc.y);
     }
   }
   return out.sort((a,b)=>a-b);
 };
 const all=(v)=>assert.ok(heights().length===4&&heights().every(h=>Math.abs(h-v)<1e-5),
   'the same FOUR honest 3D side sails must be in the correct timed pose: '+JSON.stringify(heights()));
 w.update(s);w.animate(0);all(.62);
 w.update({...s,tick:41,keys:[{...s.keys[0],collected:true}],inventory:['key-1']});
 all(.62); // true public before->after key collection begins at the raised stage
 w.animate(.6,{gateTime:.6});all(height(true,.6));
 assert.ok(height(true,.6)>.12&&height(true,.6)<.62,'a real intermediate physical collapse exists');
 w.animate(1.21,{gateTime:1.21});all(.12);
 w.animate(1.21,{gateTime:1.21,reducedMotion:true});all(.12);
 assert.equal(w.stats().geometryCount,baseline.geometryCount);
 assert.equal(w.stats().materialCount,baseline.materialCount);
 // An already-collected first encounter with no witnessed transition settles
 // immediately; a reset cannot replay a previous key event or show hidden map.
 w.update({...s,tick:1,runToken:'fresh-uncollected'});all(.62);
 w.update({...s,tick:2,runToken:'fresh-uncollected',keys:[{...s.keys[0],collected:true}]});all(.12);
 w.update({...s,tick:3,runToken:'fresh-uncollected',visibleCells:[23,24]});
 assert.equal(w.stats().treasureGalleryTiles,0);
 for(let i=0;i<6;i++){
   w.update({...s,runToken:'gallery-playback-reset-'+i});
   assert.ok(w.stats().geometryCount<100,'the original six-reset budget remains unchanged');
 }
 w.dispose();assert.equal(w.stats().geometryCount,0);assert.equal(w.stats().materialCount,0);
});
