'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {pathToFileURL}=require('node:url');

// Load the ACTUAL shipped 3D world and production Three, not a duplicated
// helper. This tests physical foreground mesh batches and public disclosure.
async function realWorld(){
  const root=path.resolve(__dirname,'../..');
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'maze-gate-forecourt-'));
  try{
    fs.mkdirSync(path.join(tmp,'vendor'));
    fs.writeFileSync(path.join(tmp,'package.json'),'{"type":"module"}');
    for(const file of ['world.js','gate-moment.mjs','map-view.mjs'])
      fs.copyFileSync(path.join(root,'public/ai-maze-escape',file),path.join(tmp,file));
    for(const file of ['three.module.js','three.core.js'])
      fs.copyFileSync(path.join(root,'node_modules/three/build',file),path.join(tmp,'vendor',file));
    const mod=await import(pathToFileURL(path.join(tmp,'world.js')).href);
    return {world:mod.createMazeWorld({balanced:true}),done:()=>fs.rmSync(tmp,{force:true,recursive:true})};
  }catch(error){fs.rmSync(tmp,{force:true,recursive:true});throw error;}
}
const door={a:77,b:94,open:false,requiredKeyId:'key-1'};
const cell=id=>({cell:id,neighbors:[],blocked:false,trap:false,checkpoint:false,clue:false,visible:true});
const frame=(doors=[],cells=[cell(77),cell(94)],tick=1,runToken='public-forecourt')=>({
  runToken,tick,width:17,height:17,currentCell:77,cells,
  visibleCells:cells.map(c=>c.cell),keys:[],inventory:[],doors,
  threats:[],exitCell:null,result:null
});

test('authentic disclosed gate replaces tall foreground hedge with rooted low 3D planters',async()=>{
  const {world,done}=await realWorld();
  try{
    const normal=frame();
    const unchanged=JSON.stringify(normal);
    world.update(normal);
    const first=world.stats();
    assert.ok(first.wallGardens>0,'real authored wall gardens must exist in the test stage');
    const disclosed=frame([door],undefined,2);
    const disclosedText=JSON.stringify(disclosed);
    world.update(disclosed);
    const clear=world.stats();
    assert.equal(clear.renderedCells.length,2,'no unseen cells fabricated');
    assert.ok(clear.wallGardens<first.wallGardens,
      'actual tall physical hedge must give way around both known gate endpoints');
    assert.ok(clear.instances<first.instances,
      'replace overlapping high foliage, not add more stage clutter');
    assert.equal(clear.geometryCount,first.geometryCount,'reuse original GPU geometry');
    assert.equal(clear.materialCount,first.materialCount,'reuse original mineral materials');
    assert.equal(JSON.stringify(disclosed),disclosedText,'never mutate public authority');
    assert.equal(JSON.stringify(normal),unchanged);
    const opened=frame([{...door,open:true}],undefined,3);
    world.update(opened);
    const open=world.stats();
    assert.equal(open.wallGardens,clear.wallGardens,'opening known gate must keep stable forecourt');
    assert.equal(open.instances,clear.instances,'no foliage popping on physical gate animation');
    world.update(frame([],undefined,4));
    const restored=world.stats();
    assert.equal(restored.wallGardens,first.wallGardens,'known gate removal restores deterministic garden');
    assert.equal(restored.instances,first.instances,'original 3D terrain is restored exactly');
  }finally{world.dispose();done();}
});

test('undisclosed, invalid and non-adjacent door metadata cannot dress public scene',async()=>{
  const {world,done}=await realWorld();
  try{
    world.update(frame());
    const normal=world.stats();
    for(const suspect of [
      {a:77,b:95,open:false},
      {a:77,b:93,open:false},
      {a:77,b:100,open:false},
      {a:-1,b:94,open:false},
      {a:77,b:77,open:false},
      {a:77,b:95,open:false,secretRoute:[77,95]},
    ]){
      // Every suspect either is not adjacent or has an undisclosed endpoint.
      world.update(frame([suspect],undefined,2));
      const actual=world.stats();
      assert.equal(actual.wallGardens,normal.wallGardens);
      assert.equal(actual.instances,normal.instances);
      assert.deepEqual(actual.renderedCells,normal.renderedCells);
    }
    world.update(frame([door],[],3,'new-run-with-undisclosed-door'));
    assert.deepEqual(world.stats().renderedCells,[]);
  }finally{world.dispose();done();}
});
