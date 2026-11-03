'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {pathToFileURL}=require('node:url');

// Inspect the actual shipped world and installed Three matrices, not a model
// substitute or a mocked visual. Real native screenshots remain a SEPARATE
// mandatory art/cropping acceptance gate.
async function loadWorld() {
  const root=path.resolve(__dirname,'../..');
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'maze-public-fossil-'));
  try {
    fs.mkdirSync(path.join(tmp,'vendor'));
    fs.writeFileSync(path.join(tmp,'package.json'),'{"type":"module"}');
    for(const file of ['world.js','gate-moment.mjs','map-view.mjs'])
      fs.copyFileSync(path.join(root,'public/ai-maze-escape',file),path.join(tmp,file));
    for(const file of ['three.module.js','three.core.js'])
      fs.copyFileSync(path.join(root,'node_modules/three/build',file),path.join(tmp,'vendor',file));
    const module=await import(pathToFileURL(path.join(tmp,'world.js')).href);
    const THREE=await import(pathToFileURL(path.join(tmp,'vendor/three.module.js')).href);
    return {module,THREE,cleanup:()=>fs.rmSync(tmp,{recursive:true,force:true})};
  }catch(e){fs.rmSync(tmp,{recursive:true,force:true});throw e;}
}
const cell=(id,blocked=false,neighbors=[])=>({cell:id,neighbors,blocked,trap:false,checkpoint:false,clue:false});
const base=(cells,overrides={})=>({
  runToken:'fossil-world',tick:1,width:7,height:7,currentCell:4,
  cells,visibleCells:cells.map(c=>c.cell),doors:[],keys:[],
  inventory:[],threats:[],exitCell:null,result:null,...overrides
});
function fossilCones(world,THREE,origin) {
  const cones=[];
  const matrix=new THREE.Matrix4(),position=new THREE.Vector3();
  // Public foreground terrain, not dimension-only water/backdrop.
  world.group.children[1].traverse(node=>{
    if(!node.isInstancedMesh||node.geometry.type!=='ConeGeometry')return;
    if(!['cead72','b07953'].includes(node.material.color.getHexString()))return;
    for(let i=0;i<node.count;i++) {
      node.getMatrixAt(i,matrix); position.setFromMatrixPosition(matrix);
      // Two heavy material ribs on opposite sides of this exact blocked cell.
      if(Math.abs(Math.abs(position.x-origin.x)-.59)<.05
        &&Math.abs(position.z-(origin.z-.23))<.07)
        cones.push({x:position.x,y:position.y,z:position.z,
          height:new THREE.Vector3().setFromMatrixScale(matrix).y});
    }
  });
  return cones;
}
test('authored fossil garden is real high-relief 3D and cannot reveal unknown blocked tiles',async()=>{
  const {module,THREE,cleanup}=await loadWorld();
  const world=module.createMazeWorld({balanced:true});
  const empty=module.createMazeWorld({balanced:true});
  const again=module.createMazeWorld({balanced:true});
  const snapshot=base([cell(3,true)]);
  const frozen=JSON.stringify(snapshot);
  try{
    empty.update(base([]));
    assert.equal(empty.stats().tideFossilGroves,0);
    world.update(snapshot);
    again.update({...snapshot,runToken:'independent-replay',tick:100});
    assert.equal(world.stats().tideFossilGroves,1);
    assert.deepEqual(world.stats().renderedCells,[3]);
    assert.equal(again.stats().tideFossilGroves,1);
    const origin=module.cellPosition(3,7,7);
    const cones=fossilCones(world,THREE,origin);
    assert.equal(cones.length,2,'real tall rooted ribs must be identifiable in shipped instanced Three matrices');
    assert.ok(cones.every(c=>Math.abs(c.y-(1.05+module.cellHeight(3,7,7)))<1e-5&&Math.abs(c.height-1.16)<1e-5),
      'fossil grove must be actual substantial 3D sculpting, not a tile decal');
    assert.equal(world.stats().instances,again.stats().instances,
      'same disclosed public cell must build identical geometry regardless of run identity/tick');
    assert.ok(world.stats().instances>empty.stats().instances+15,
      'the generic five-cube pile must become a physically developed modeled place');
    assert.ok(world.stats().geometryCount<=16&&world.stats().materialCount<=26
      &&world.stats().textureCount<=3,'no new geometry/material/texture classes');
    assert.equal(JSON.stringify(snapshot),frozen,'renderer cannot mutate public maze state');
    world.update(base([],{runToken:'new-empty-run'}));
    assert.equal(world.stats().tideFossilGroves,0);
    assert.deepEqual(world.stats().renderedCells,[]);
  }finally{world.dispose();empty.dispose();again.dispose();cleanup();}
});
test('physically adjacent disclosed gate trims fossil skyline without clipping source actor',async()=>{
  const {module,THREE,cleanup}=await loadWorld();
  const world=module.createMazeWorld({balanced:true});
  const snapshot=base([cell(3,true),cell(4,false,[5]),cell(5,false,[4])],{
    doors:[{a:4,b:5,open:false,requiredKeyId:'key-1'}]
  });
  try{
    world.update(snapshot);
    assert.equal(world.stats().tideFossilGroves,1);
    const ribs=fossilCones(world,THREE,module.cellPosition(3,7,7));
    assert.equal(ribs.length,2);
    assert.ok(ribs.every(r=>Math.abs(r.y-(.8+module.cellHeight(3,7,7)))<1e-5&&Math.abs(r.height-.70)<1e-5),
      'near a truly disclosed gate the same sculpted real ribs must reduce actual projected height');
    assert.equal(world.stats().renderedCells.length,3);
    const open={...snapshot,tick:2,doors:[{...snapshot.doors[0],open:true}]};
    world.update(open);
    assert.deepEqual(fossilCones(world,THREE,module.cellPosition(3,7,7)),ribs,
      'real gate retraction must not pop or replace terrain because disclosure stayed the same');
    assert.equal(world.stats().tideFossilGroves,1);
    assert.ok(world.stats().geometryCount<=16&&world.stats().materialCount<=26
      &&world.stats().textureCount<=3);
  }finally{world.dispose();cleanup();}
});
