'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {pathToFileURL}=require('node:url');

// Inspect the installed production Three scene. No synthetic screenshot,
// invented hidden cells, loosened image thresholds or placeholder meshes.
async function worldFixture(){
  const root=path.resolve(__dirname,'../..');
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'maze-public-fossil-motion-'));
  try{
    fs.mkdirSync(path.join(temp,'vendor'));
    fs.writeFileSync(path.join(temp,'package.json'),'{"type":"module"}');
    for(const file of ['world.js','gate-moment.mjs','map-view.mjs'])
      fs.copyFileSync(path.join(root,'public/ai-maze-escape',file),path.join(temp,file));
    for(const file of ['three.module.js','three.core.js'])
      fs.copyFileSync(path.join(root,'node_modules/three/build',file),path.join(temp,'vendor',file));
    const module=await import(pathToFileURL(path.join(temp,'world.js')).href);
    const THREE=await import(pathToFileURL(path.join(temp,'vendor/three.module.js')).href);
    return {module,THREE,world:module.createMazeWorld({balanced:true}),
      cleanup:()=>fs.rmSync(temp,{recursive:true,force:true})};
  }catch(error){fs.rmSync(temp,{recursive:true,force:true});throw error;}
}
const c=(cell,neighbors=[],flags={})=>({cell,neighbors,blocked:false,trap:false,checkpoint:false,clue:false,...flags});
const published=(overrides={})=>({
  runToken:'public-fossil-action',width:7,height:7,tick:1,currentCell:10,
  cells:[c(10,[11])],visibleCells:[10],keys:[],doors:[],inventory:[],
  threats:[],exitCell:null,result:null,...overrides
});
const pair=world=>[-1,1].map(side=>world.group.getObjectByName('Disclosed fossil listening sail 10 '+side));

test('real disclosed fossil sails have connected 3D carved mass, nonblocking roots and physical proximity acting',async()=>{
 const {world,module,THREE,cleanup}=await worldFixture();
 try{
   const state=published(),frozen=JSON.stringify(state);
   world.update(state);
   const sails=pair(world);
   assert.ok(sails.every(Boolean),'two genuine public wall-side Three hinges should exist');
   assert.equal(world.stats().responsiveFossilSails,2);
   assert.equal(world.stats().tideFossilAlcoves,1);
   assert.equal(world.stats().fossilGalleryEdges,1,'one public blocked wall receives a physically low gallery');
   const center=module.cellPosition(10,7,7);
   const ground=module.cellHeight(10,7,7);
   // Inspect actual installed instancing, not a cosmetic CSS counter or
   // metadata-only promise. The PUBLIC north wall has a stone gallery cap
   // below the hinged sculpture; its 0.17-high band cannot hide the actor.
   const galleryCaps=[];
   world.group.traverse(node=>{
     if(!node.isInstancedMesh||node.material?.name!=='Disclosed sea-glass mosaic')return;
     const transform=new THREE.Matrix4(),at=new THREE.Vector3(),rot=new THREE.Quaternion(),scale=new THREE.Vector3();
     for(let i=0;i<node.count;i++){
       node.getMatrixAt(i,transform);transform.decompose(at,rot,scale);
       if(Math.abs(at.x-center.x)<.01 && Math.abs(at.z-(center.z-1.2))<.01
         && Math.abs(at.y-(ground+.30))<.01 && Math.abs(scale.x-2.26)<.01
         && Math.abs(scale.y-.17)<.01)galleryCaps.push({top:at.y+scale.y/2,depth:scale.z});
     }
   });
   assert.equal(galleryCaps.length,1,'one actual grounded low sea-glass cap is installed at the known impassable edge');
   assert.ok(galleryCaps[0].top-ground<.45,'the real wall profile stays below the physical listening sails');
   for(const sail of sails){
     assert.ok(sail.children.filter(node=>node.isMesh).length>=4,
       'each animated object has a physical four-part silhouette, not a sprite');
     assert.ok(sail.position.z<center.z-.6,'public NORTH impassable edge owns the sculpture');
     assert.ok(Math.abs(sail.position.x-center.x)<.85,'stone stays off the eastward true passage');
     assert.ok(Math.abs(sail.position.y-ground-.25)<1e-9,'physical root follows real known terrace height');
   }
   world.animate(0,{explorerPosition:new THREE.Vector3(center.x,ground,center.z)});
   const near=sails.map(sail=>Math.abs(sail.rotation.z));
   world.animate(0,{explorerPosition:new THREE.Vector3(center.x+40,ground,center.z+40)});
   const far=sails.map(sail=>Math.abs(sail.rotation.z));
   assert.ok(near.every((angle,i)=>angle>far[i]+.1),
     'both physical hinges respond to real explorer proximity instead of fake AI text');
   world.animate(.3,{reducedMotion:true,explorerPosition:new THREE.Vector3(center.x,ground,center.z)});
   assert.ok(sails.every(sail=>Math.abs(Math.abs(sail.rotation.z)-.07)<1e-9),
     'reduced motion holds a stable pose even beside Pip');
   const stats=world.stats();
   assert.ok(stats.geometryCount<=16&&stats.materialCount<=26&&stats.textureCount<=3,
     'authored action reuses installed shared GPU resource classes');
   assert.equal(JSON.stringify(state),frozen,'rendering never edits published engine source');
   world.update(published({runToken:'next-run',cells:[],visibleCells:[]}));
   assert.equal(world.stats().responsiveFossilSails,0,'new run discards prior physical art');
   assert.equal(world.stats().fossilGalleryEdges,0,'new run never retains old cutaway masonry');
   assert.ok(pair(world).every(x=>!x),'unseen former cell cannot retain a reacting model');
 }finally{world.dispose();cleanup();}
});

test('unsafe/disclosed source semantics and unknown fields cannot fabricate fossil actors',async()=>{
 const {world,cleanup}=await worldFixture();
 try{
   for(const state of [
     published({cells:[],visibleCells:[],privateMazeCells:[10]}),
     published({cells:[c(10,[11],{trap:true})]}),
     published({cells:[c(10,[11],{blocked:true})]}),
     published({cells:[c(10,[11])],keys:[{id:'treasure',cell:10,collected:false}]}),
     published({cells:[c(10,[11]),c(11,[10])],visibleCells:[10,11],
       doors:[{a:10,b:11,open:false}]}),
   ]){
     world.update(state);
     assert.equal(world.stats().fossilGalleryEdges,0,'no cutaway of an unsafe, undisclosed or genuine gate wall');
     assert.equal(world.stats().responsiveFossilSails,0,
       'no new physical event on undisclosed, hazardous, occupied or gate cells: '
         + JSON.stringify({cells:state.cells,visibleCells:state.visibleCells,keys:state.keys,doors:state.doors}));
   }
   const unknown=published({hiddenExitCell:10,privateRoute:[1,2,3],privateThreatCell:10,
     unrevealedDoor:{a:10,b:17}});
   world.update(unknown);
   assert.equal(world.stats().responsiveFossilSails,2,
     'only published walkable tile and disclosed impassable side control physical placement');
   assert.equal(world.stats().fossilGalleryEdges,1,
     'unknown private topology cannot add another physical wall cutaway');
   assert.equal(world.stats().renderedCells.length,1);
 }finally{world.dispose();cleanup();}
});
