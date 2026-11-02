'use strict';

const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {pathToFileURL}=require('node:url');

// Use the actual released Three module and exact production source; no mocks,
// source transforms or hidden-state access to fake a beautiful physical world.
async function realWorld() {
  const root=path.resolve(__dirname,'../..');
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'maze-tidal-stage-'));
  try {
    fs.mkdirSync(path.join(dir,'vendor'));
    fs.writeFileSync(path.join(dir,'package.json'),'{"type":"module"}');
    for(const file of ['world.js','gate-moment.mjs','map-view.mjs'])
      fs.copyFileSync(path.join(root,'public/ai-maze-escape',file),path.join(dir,file));
    for(const file of ['three.module.js','three.core.js'])
      fs.copyFileSync(path.join(root,'node_modules/three/build',file),path.join(dir,'vendor',file));
    const m=await import(pathToFileURL(path.join(dir,'world.js')).href);
    return {m,cleanup:()=>fs.rmSync(dir,{recursive:true,force:true})};
  }catch(error){fs.rmSync(dir,{recursive:true,force:true});throw error}
}

function publicSnapshot(withKnown=true) {
  const width=5,height=5;
  const cells=withKnown?Array.from({length:width*height},(_,cell)=>({
    cell,neighbors:[],blocked:false,trap:false,checkpoint:false,clue:false
  })):[];
  return {runToken:'tidal-garden-source-bound',tick:1,width,height,cells,
    visibleCells:cells.map(c=>c.cell),doors:[],keys:[],inventory:[],exitCell:null};
}

test('architectural transformation is genuine batched 3D on disclosed solid walls only',async()=>{
  const {m,cleanup}=await realWorld();
  const empty=m.createMazeWorld({balanced:true});
  const stage=m.createMazeWorld({balanced:true});
  const again=m.createMazeWorld({balanced:true});
  const snapshot=publicSnapshot(), frozen=JSON.parse(JSON.stringify(snapshot));
  try {
    empty.update(publicSnapshot(false));
    const none=empty.stats();
    assert.equal(none.sculptedMosaicWalls,0);
    assert.equal(none.tidePennants,0);
    assert.equal(none.perimeterCascades,0);
    assert.deepEqual(none.renderedCells,[],'undisclosed tiles must not appear');
    stage.update(snapshot);
    again.update({...snapshot,unpublishedMazeSeed:'MUST_NOT_APPEAR',
      privateThreatLocations:[0,1,2],hiddenPath:[1,4,24]});
    const a=stage.stats(), b=again.stats();
    assert.ok(a.sculptedMosaicWalls>3,'physical carved ceramic facade needs visible coverage');
    assert.ok(a.tidePennants>0,'wall-anchored 3D cloth silhouettes should exist');
    assert.ok(a.perimeterCascades>0,'public-board water curtains should be actually modeled');
    assert.ok(a.tidalObservatories>0,'disclosed observatory must have roofline');
    assert.ok(a.instances>none.instances,'scenery uses actual Three instanced meshes');
    for(const key of ['renderedCells','sculptedMosaicWalls','tidePennants','perimeterCascades',
      'tidalObservatories','instances','geometryCount','materialCount','textureCount'])
      assert.deepEqual(a[key],b[key],key+' must depend only on the public world');
    assert.ok(a.geometryCount<=16 && a.materialCount<=26 && a.textureCount<=3,
      'keep geometric and texture budgets for CPU-balanced WebGL');
    assert.deepEqual(snapshot,frozen,'decorating the world cannot mutate game authority');
  }finally{empty.dispose();stage.dispose();again.dispose();cleanup()}
});

test('changing a private route cannot create new public scenic openings',async()=>{
  const {m,cleanup}=await realWorld();
  const world=m.createMazeWorld({balanced:true});
  const snapshot=publicSnapshot();
  try {
    world.update(snapshot);const before=world.stats();
    world.update({...snapshot,tick:2,hiddenMazeRoute:[11,3,5],
      privateWardenNextCell:7,secretGoalCell:24});
    const after=world.stats();
    for(const key of ['renderedCells','sculptedMosaicWalls','tidePennants',
      'perimeterCascades','tidalObservatories','instances'])
      assert.deepEqual(after[key],before[key],key+' changed on hidden-state-only update');
  }finally{world.dispose();cleanup()}
});
