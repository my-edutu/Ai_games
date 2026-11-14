'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {pathToFileURL}=require('node:url');

// Real production Three.js scene, not a duplicated geometry algorithm.
async function realWorld(){
  const root=path.resolve(__dirname,'../..');
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'maze-forecourt-parapet-'));
  try{
    fs.mkdirSync(path.join(tmp,'vendor'));
    fs.writeFileSync(path.join(tmp,'package.json'),'{"type":"module"}');
    for(const file of ['world.js','gate-moment.mjs','map-view.mjs'])
      fs.copyFileSync(path.join(root,'public/ai-maze-escape',file),path.join(tmp,file));
    for(const file of ['three.module.js','three.core.js'])
      fs.copyFileSync(path.join(root,'node_modules/three/build',file),path.join(tmp,'vendor',file));
    const {createMazeWorld}=await import(pathToFileURL(path.join(tmp,'world.js')).href);
    return {world:createMazeWorld({balanced:true}),done:()=>fs.rmSync(tmp,{force:true,recursive:true})};
  }catch(error){fs.rmSync(tmp,{force:true,recursive:true});throw error;}
}
const c=id=>({cell:id,neighbors:[],blocked:false,trap:false,checkpoint:false,clue:false,visible:true});
const door={a:77,b:94,open:false,requiredKeyId:'key-1'};
function frame(doors=[],cells=[c(77),c(94),c(78)],tick=1,runToken='gate-forecourt-parapet'){
  return {runToken,tick,width:17,height:17,currentCell:77,
    visibleCells:cells.map(x=>x.cell),cells,doors,keys:[],inventory:[],
    threats:[],exitCell:null,result:null};
}

test('disclosed side barrier becomes a lower continuous physical parapet without modifying game authority',async()=>{
  const {world,done}=await realWorld();
  try{
    const baseline=frame(),source=JSON.stringify(baseline);
    world.update(baseline);
    const initial=world.stats();
    assert.equal(initial.gateForecourtParapets,0);
    const disclosed=frame([door],undefined,2);
    const unchanged=JSON.stringify(disclosed);
    world.update(disclosed);
    const observed=world.stats();
    assert.equal(observed.gateForecourtParapets,1,
      'only the side barrier between disclosed 77 and 78 becomes a low, solid wall');
    assert.deepEqual(observed.renderedCells,initial.renderedCells);
    assert.ok(observed.instances<initial.instances,
      'reduce real 3D foreground occlusion instead of layering more objects');
    assert.equal(observed.geometryCount,initial.geometryCount,'reuse pooled production geometries');
    assert.equal(observed.materialCount,initial.materialCount,'reuse pooled production materials');
    assert.equal(JSON.stringify(disclosed),unchanged);
    assert.equal(JSON.stringify(baseline),source);
    world.update(frame([{...door,open:true}],undefined,3));
    const opened=world.stats();
    assert.equal(opened.gateForecourtParapets,1,'no masonry popping as actual gate opens');
    assert.equal(opened.instances,observed.instances,'gate pose does not rebuild fixed parapet');
    world.update(frame([],undefined,4,'new-run'));
    const reset=world.stats();
    assert.equal(reset.gateForecourtParapets,0,'new run clears prior public disclosure');
    assert.equal(reset.instances,initial.instances,'neutral geometry precisely restored');
  }finally{world.dispose();done();}
});

test('hidden side cell, invented gate and noncardinal gate cannot trigger a parapet',async()=>{
  const {world,done}=await realWorld();
  try{
    for(const [doors,cells] of [
      [[door],[c(77),c(94)]], // no known blocked neighbor
      [[{a:77,b:95,open:false}],[c(77),c(94),c(78)]], // no public endpoint
      [[{a:77,b:95,open:false}],[c(77),c(94),c(95)]], // diagonal
      [[{a:77,b:77,open:false}],[c(77),c(94),c(78)]], // impossible
      [[{a:77,b:94,open:false}],[c(77)]], // hidden other gate endpoint
    ]){
      world.update(frame(doors,cells,5));
      assert.equal(world.stats().gateForecourtParapets,0);
      assert.deepEqual(world.stats().renderedCells,cells.map(x=>x.cell));
    }
  }finally{world.dispose();done();}
});
