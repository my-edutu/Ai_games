'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {pathToFileURL}=require('node:url');

// Physical Three.js critique of the ACTUAL submerged supporting mass.
// Do not substitute CSS, mock geometry, nonpublic map or screenshot pixels.
async function loadWorld(){
  const root=path.resolve(__dirname,'../..');
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'maze-public-foundations-'));
  try{
    fs.mkdirSync(path.join(dir,'vendor'));
    fs.writeFileSync(path.join(dir,'package.json'),'{"type":"module"}');
    for(const name of ['world.js','gate-moment.mjs','map-view.mjs'])
      fs.copyFileSync(path.join(root,'public/ai-maze-escape',name),path.join(dir,name));
    for(const name of ['three.module.js','three.core.js'])
      fs.copyFileSync(path.join(root,'node_modules/three/build',name),path.join(dir,'vendor',name));
    return {module:await import(pathToFileURL(path.join(dir,'world.js')).href),
      THREE:await import(pathToFileURL(path.join(dir,'vendor/three.module.js')).href),
      done:()=>fs.rmSync(dir,{recursive:true,force:true})};
  }catch(error){fs.rmSync(dir,{recursive:true,force:true});throw error;}
}
const known=(cell)=>({cell,neighbors:[],blocked:false,trap:false,checkpoint:false,clue:false});
const publicShot=(extra={})=>({
  runToken:'published-terrace-materials',tick:1,width:3,height:9,
  currentCell:10,cells:[known(1),known(10),known(19)],
  visibleCells:[1,10,19],doors:[],keys:[],inventory:[],threats:[],exitCell:null,
  result:null,...extra,
});
function actualFoundation(world,THREE,module,id){
  const center=module.cellPosition(id,3,9), floor=module.cellHeight(id,3,9);
  const targetY=-1.14+floor/2, expectedHeight=2.14+floor;
  const matrix=new THREE.Matrix4(),position=new THREE.Vector3(),scale=new THREE.Vector3();
  const found=[];
  world.group.children[1].traverse(mesh=>{
    if(!mesh.isInstancedMesh || mesh.geometry.type!=='ExtrudeGeometry')return;
    for(let i=0;i<mesh.count;i++){
      mesh.getMatrixAt(i,matrix);
      position.setFromMatrixPosition(matrix);
      scale.setFromMatrixScale(matrix);
      if(Math.abs(position.x-center.x)<.002 && Math.abs(position.z-center.z)<.002
        &&Math.abs(position.y-targetY)<.002
        &&Math.abs(scale.x-2.38)<.002 && Math.abs(scale.z-2.38)<.002
        &&Math.abs(scale.y-expectedHeight)<.002)
        found.push(mesh.material.color.getHexString());
    }
  });
  return found;
}
test('actual public high, middle and tide-plain foundations have distinct warm-to-cool 3D mineral masonry',async()=>{
  const {module,THREE,done}=await loadWorld();
  const live=module.createMazeWorld({balanced:true});
  const replay=module.createMazeWorld({balanced:true});
  const empty=module.createMazeWorld({balanced:true});
  try{
    const shot=publicShot(), immutable=JSON.stringify(shot);
    assert.deepEqual([1,10,19].map(id=>module.cellHeight(id,3,9)),[2.8,1.4,0]);
    live.update(shot);
    replay.update(publicShot({tick:911,runToken:'another-run',
      privateCells:[known(0),known(2)],hiddenRoute:[0,2],privateExitCell:0}));
    empty.update(publicShot({cells:[],visibleCells:[],privateCells:[known(1)],hiddenRoute:[1]}));
    for(const [id,color] of [[1,'8e7851'],[10,'398479'],[19,'28574f']]){
      assert.deepEqual(actualFoundation(live,THREE,module,id),[color],
        'one real grounded instanced foundation has the intended disclosed elevation material');
      assert.deepEqual(actualFoundation(replay,THREE,module,id),[color],
        'private state/run timestamp cannot influence public foundation material');
      assert.deepEqual(actualFoundation(empty,THREE,module,id),[],
        'private or undisclosed cells cannot create false terrain');
    }
    assert.ok(live.stats().geometryCount<=16 && live.stats().materialCount<=26
      && live.stats().textureCount<=3,'reuse existing Three GPU resource classes');
    assert.equal(live.stats().instances,replay.stats().instances,
      'the physical architecture must be deterministic for the same public cells');
    assert.equal(JSON.stringify(shot),immutable,'the presentation never mutates authoritative public state');
  }finally{live.dispose();replay.dispose();empty.dispose();done();}
});
