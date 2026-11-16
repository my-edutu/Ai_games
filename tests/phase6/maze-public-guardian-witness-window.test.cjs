'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {pathToFileURL}=require('node:url');
// Run the ACTUAL installed Three.js renderer source, never a mock geometry pass.
async function productionWorld(){
  const root=path.resolve(__dirname,'../..'),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'maze-parry-window-'));
  try {
    fs.mkdirSync(path.join(tmp,'vendor'));
    fs.writeFileSync(path.join(tmp,'package.json'),'{"type":"module"}');
    for(const file of ['world.js','gate-moment.mjs','map-view.mjs'])
      fs.copyFileSync(path.join(root,'public/ai-maze-escape',file),path.join(tmp,file));
    for(const file of ['three.module.js','three.core.js'])
      fs.copyFileSync(path.join(root,'node_modules/three/build',file),path.join(tmp,'vendor',file));
    const mod=await import(pathToFileURL(path.join(tmp,'world.js')).href);
    const THREE=await import(pathToFileURL(path.join(tmp,'vendor/three.module.js')).href);
    return {mod,THREE,done:()=>fs.rmSync(tmp,{force:true,recursive:true})};
  }catch(e){fs.rmSync(tmp,{force:true,recursive:true});throw e;}
}
const c=(cell,neighbors=[],extra={})=>({cell,neighbors,blocked:false,trap:false,
  clue:false,checkpoint:false,...extra});
const cells=()=>[c(91,[74]),c(74,[91]),c(92),c(93),c(75),c(108),c(109)];
const shot=(extra={})=>({width:17,height:17,currentCell:91,lifecycle:'running',
  tick:8,runToken:'current-public-parry',cells:cells(),visibleCells:cells().map(c=>c.cell),
  threats:[{cell:74,lanternParried:true}],doors:[],keys:[],inventory:[],
  exitCell:null,result:null,...extra});
test('installed Three physically renders connected closed foreground glass only on true publicly earned parry',async()=>{
  const {mod,THREE,done}=await productionWorld(),world=mod.createMazeWorld({balanced:true});
  try {
    const s=shot(),immutable=JSON.stringify(s);
    const edges=mod.publicEarnedGuardianCounterWindows(s);
    assert.ok(edges.size>0,'the authentic camera-side real actor court has visible sealed edges');
    assert.ok(edges.has('91:92')||edges.has('92:93'));
    world.update(s);
    const stats=world.stats();
    assert.equal(stats.guardianCounterWindows,edges.size);
    const meshes=[];
    world.group.children[1].traverse(node=>{
      if(node.isInstancedMesh && node.material.name==='Earned guardian theatre sealed glass')
        meshes.push(node);
    });
    assert.equal(meshes.length,1,'pooled installed GPU geometry, not source-only claim');
    assert.equal(meshes[0].count,edges.size);
    assert.equal(meshes[0].material.transparent,true);
    assert.equal(meshes[0].material.depthWrite,false);
    const matrix=new THREE.Matrix4(),sizes=new THREE.Vector3();
    for(let i=0;i<meshes[0].count;i++){
      meshes[0].getMatrixAt(i,matrix);sizes.setFromMatrixScale(matrix);
      assert.ok(Math.abs(sizes.y-.88)<.001,'real substantial pane exists, not deleted wall');
    }
    assert.ok(stats.geometryCount<100);
    assert.equal(JSON.stringify(s),immutable,'game authority is unchanged');
    world.update(shot({tick:9,threats:[{cell:74,lanternParried:false}]}));
    assert.equal(world.stats().guardianCounterWindows,0,'opaque original restored on recovery');
    world.update(shot({tick:1,runToken:'reset',threats:[]}));
    assert.equal(world.stats().guardianCounterWindows,0,'run reset never retains glass');
  }finally{world.dispose();done();}
});
test('unknown, terminal, opened, keyed and hazardous cells cannot be disclosed by viewing bay',async()=>{
  const {mod,done}=await productionWorld();
  try {
    const base=shot(),before=mod.publicEarnedGuardianCounterWindows(base);
    assert.ok(before.size>0);
    for(const change of [
      {visibleCells:[91,74]}, {lifecycle:'ended'}, {result:{reason:'capture'}},
      {threats:[{cell:74,lanternParried:false}]},
      {threats:[{cell:90,lanternParried:true}]},
    ]) assert.equal(mod.publicEarnedGuardianCounterWindows(shot(change)).size,0);
    const connected=shot({cells:cells().map(v=>v.cell===91?{...v,neighbors:[74,92]}:v)});
    assert.ok(!mod.publicEarnedGuardianCounterWindows(connected).has('91:92'));
    const locked=shot({doors:[{a:92,b:93,open:false}]});
    assert.ok(!mod.publicEarnedGuardianCounterWindows(locked).has('92:93'));
    const trap=shot({cells:cells().map(v=>v.cell===92?{...v,trap:true}:v)});
    assert.ok(!mod.publicEarnedGuardianCounterWindows(trap).has('92:93'));
    const key=shot({keys:[{id:'k',cell:92,collected:false}]});
    assert.ok(!mod.publicEarnedGuardianCounterWindows(key).has('92:93'));
    const secret=shot({privateRoute:[91,92,93],undiscovered:[76,90]});
    assert.deepEqual([...mod.publicEarnedGuardianCounterWindows(secret)],[...before],
      'never consult any extra private-looking fields');
  }finally{done();}
});
