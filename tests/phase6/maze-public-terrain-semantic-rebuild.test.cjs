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
    return {loaded,cleanup:()=>fs.rmSync(temp,{recursive:true,force:true})};
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
  const {loaded,cleanup}=await loadRealWorld();
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
    for(const flag of ['trap','checkpoint','clue']){
      const signalled=publicFrame(knownCell({[flag]:true}),++tick);
      const unchangedSignal=JSON.stringify(signalled);
      world.update(signalled);
      const withoutShell=world.stats().instances;
      assert.ok(withoutShell<=originalInstances-5,
        flag+' public disclosure must rebuild the actual floor, not retain a misleading shell');
      assert.equal(world.stats().renderedCells.length,1,
        'only the originally disclosed cell remains rendered');
      assert.equal(world.stats().renderedCells[0],4,
        'no hidden room or route inferred from public signal');
      assert.equal(JSON.stringify(signalled),unchangedSignal,
        'presentation must never mutate game-source knowledge');
      world.update(publicFrame(knownCell(),++tick));
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
