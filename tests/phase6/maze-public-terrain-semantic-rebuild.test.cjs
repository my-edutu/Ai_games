'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {pathToFileURL}=require('node:url');

// Exercise the ACTUAL authored world with production Three.js meshes,
// not a mock renderer, duplicated terrain function or test-only geometry.
async function loadRealWorld(){
  const root=path.resolve(__dirname,'../..');
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'maze-public-floor-'));
  try {
    fs.mkdirSync(path.join(temp,'vendor'));
    fs.writeFileSync(path.join(temp,'package.json'),'{"type":"module"}');
    for(const file of ['world.js','gate-moment.mjs','map-view.mjs'])
      fs.copyFileSync(path.join(root,'public/ai-maze-escape',file),path.join(temp,file));
    for(const file of ['three.module.js','three.core.js'])
      fs.copyFileSync(path.join(root,'node_modules/three/build',file),path.join(temp,'vendor',file));
    const loaded=await import(pathToFileURL(path.join(temp,'world.js')).href);
    const THREE=await import(pathToFileURL(path.join(temp,'vendor/three.module.js')).href);
    return {loaded,THREE,cleanup:()=>fs.rmSync(temp,{recursive:true,force:true})};
  } catch(error){fs.rmSync(temp,{recursive:true,force:true});throw error;}
}
const knownCell=(flags={})=>({
  cell:4,neighbors:[],blocked:false,trap:false,checkpoint:false,clue:false,...flags
});
const publicFrame=(c,tick=1)=>({
  runToken:'public-relief-transition',tick,width:3,height:3,currentCell:4,
  cells:[c],visibleCells:[4],keys:[],inventory:[],doors:[],threats:[],
  exitCell:null,result:null
});

test('newly disclosed hazard/checkpoint/clue removes misleading relief from real known floor',async()=>{
  const {loaded,THREE,cleanup}=await loadRealWorld();
  const world=loaded.createMazeWorld({balanced:true});
  let tick=0;
  try{
    // Cell 4 deterministically has five substantial shell-blade instances,
    // until the public cell identifies a gameplay-significant feature.
    const baseline=publicFrame(knownCell(),++tick);
    const unchanged=JSON.stringify(baseline);
    world.update(baseline);
    const originalInstances=world.stats().instances;
    assert.ok(originalInstances>5,'real public tile has physical batched court artwork');
    // Count the EXACT five source-authorized floor shell ShapeGeometry
    // instances, not aggregate instance count. Newly excluded fossils may
    // replace a cutaway sea wall with complete solid wall on a trap, so
    // total instances alone are NOT a trustworthy shell-privacy measure.
    const shellBladeCount=()=>{
      let count=0;
      const matrix=new THREE.Matrix4(),at=new THREE.Vector3(),q=new THREE.Quaternion(),scale=new THREE.Vector3();
      const center=loaded.cellPosition(4,3,3),floor=loaded.cellHeight(4,3,3);
      world.group.traverse(node=>{
        if(!node.isInstancedMesh||node.geometry?.type!=='ShapeGeometry')return;
        for(let i=0;i<node.count;i++){
          node.getMatrixAt(i,matrix);matrix.decompose(at,q,scale);
          if(Math.abs(at.x-center.x)<.001&&Math.abs(at.z-center.z)<.001
             &&Math.abs(at.y-(floor+.024))<.001
             &&Math.abs(scale.x-.82)<.001&&Math.abs(scale.y-.77)<.001)
            count++;
        }
      });
      return count;
    };
    assert.equal(shellBladeCount(),5,'real safe known floor displays all five original Three shell blades');
    for(const flag of ['trap','checkpoint','clue']){
      const signalled=publicFrame(knownCell({[flag]:true}),++tick);
      const unchangedSignal=JSON.stringify(signalled);
      world.update(signalled);
      assert.equal(shellBladeCount(),0,
        flag+' public disclosure must physically remove all five original floor shell blades');
      assert.equal(world.stats().renderedCells.length,1,
        'only the originally disclosed cell remains rendered');
      assert.equal(world.stats().renderedCells[0],4,
        'no hidden room or route inferred from public signal');
      assert.equal(JSON.stringify(signalled),unchangedSignal,
        'presentation must never mutate game-source knowledge');
      world.update(publicFrame(knownCell(),++tick));
      assert.equal(shellBladeCount(),5,
        flag+' removal must restore all five deterministic original floor shell blades');
      assert.equal(world.stats().instances,originalInstances,
        flag+' removal must restore exactly the same deterministic floor');
    }
    assert.equal(JSON.stringify(baseline),unchanged);
    world.update({...publicFrame(knownCell(),++tick),
      runToken:'next-private-run',cells:[],visibleCells:[]});
    assert.equal(world.stats().renderedCells.length,0,
      'undisclosed run must not retain another run\'s public terrain');
  }finally{world.dispose();cleanup();}
});
