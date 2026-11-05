'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {pathToFileURL}=require('node:url');

// Tests must instantiate the installed Three.js scene: no mocked visual output.
async function loadWorld(){
  const root=path.resolve(__dirname,'../..');
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'maze-pressure-shutters-'));
  try{
    fs.mkdirSync(path.join(temp,'vendor'));
    fs.writeFileSync(path.join(temp,'package.json'),'{"type":"module"}');
    for(const filename of ['world.js','map-view.mjs','gate-moment.mjs'])
      fs.copyFileSync(path.join(root,'public/ai-maze-escape',filename),path.join(temp,filename));
    for(const filename of ['three.module.js','three.core.js'])
      fs.copyFileSync(path.join(root,'node_modules/three/build',filename),path.join(temp,'vendor',filename));
    const THREE=await import(pathToFileURL(path.join(temp,'vendor/three.module.js')).href);
    const game=await import(pathToFileURL(path.join(temp,'world.js')).href);
    const world=game.createMazeWorld({balanced:true});
    return {THREE,game,world,cleanup:()=>fs.rmSync(temp,{recursive:true,force:true})};
  }catch(error){fs.rmSync(temp,{recursive:true,force:true});throw error;}
}
const published=(overrides={})=>({
  runToken:'real-tide-shear-shutters',tick:1,width:3,height:3,currentCell:4,
  cells:[{cell:4,neighbors:[],blocked:false,trap:true,checkpoint:false,clue:false}],
  visibleCells:[4],keys:[],doors:[],inventory:[],threats:[],exitCell:null,result:null,
  ...overrides
});
const close=(actual,expected,label)=>assert.ok(Math.abs(actual-expected)<1e-8,
  label+': expected '+expected+', observed '+actual);

test('published pressure cell owns two physically distinct, rooted hinged floor shutters',async()=>{
  const {THREE,game,world,cleanup}=await loadWorld();
  try{
    const state=published(),frozen=JSON.stringify(state);
    world.update(state);
    const trap=world.group.getObjectByName('Disclosed tide-shear pressure hazard 4');
    assert.ok(trap?.isGroup,'shutters must be inside the actual public 3D trap');
    const shutters=[-1,1].map(side=>world.group.getObjectByName('Published tide-shear floor shutter '+side));
    assert.ok(shutters.every(shutter=>shutter?.isGroup && shutter.parent===trap),
      'both shutters are physical joints attached to the real trap, not decorative UI');
    assert.ok(shutters.every(shutter=>shutter.children.filter(x=>x.isMesh).length===4),
      'every broad shutter has mineral, clay, danger and gold physical surfaces');
    const budget=world.stats(),point=game.cellPosition(4,3,3);
    const near=new THREE.Vector3(point.x,0,point.z);
    const far=new THREE.Vector3(point.x+40,0,point.z+40);

    world.animate(0,{explorerPosition:far,reducedMotion:false});
    for(const [index,side] of [-1,1].entries()){
      close(shutters[index].position.x,side*.52,'resting hinge X');
      close(shutters[index].rotation.z,-side*.03,'resting plate tilt');
    }
    world.animate(0,{explorerPosition:near,reducedMotion:false});
    for(const [index,side] of [-1,1].entries()){
      close(shutters[index].position.x,side*.70,'approaching hinge opens outward');
      close(shutters[index].rotation.z,-side*.81,'inward plate face visibly rises');
      assert.ok(shutters[index].children.every(mesh=>mesh.parent===shutters[index]));
    }
    close(shutters[0].rotation.z,-shutters[1].rotation.z,'symmetric opening');
    world.animate(0,{explorerPosition:new THREE.Vector3(point.x+game.CELL_SIZE,0,point.z),reducedMotion:false});
    assert.ok(Math.abs(shutters[0].rotation.z)>.79 && Math.abs(shutters[0].rotation.z)<.81,
      'the true one-cell published approach must OPEN the physical floor, not just wiggle it');
    world.animate(0,{explorerPosition:new THREE.Vector3(point.x+game.CELL_SIZE,0,point.z+game.CELL_SIZE),reducedMotion:false});
    assert.ok(Math.abs(shutters[0].rotation.z)>.08 && Math.abs(shutters[0].rotation.z)<.11,
      'real diagonal approach produces a small early warning without revealing a distant trap');
    world.animate(0,{explorerPosition:far,reducedMotion:false});
    close(shutters[0].position.x,-.52,'withdrawal closes left shutter');
    close(shutters[1].position.x,.52,'withdrawal closes right shutter');
    world.animate(11,{explorerPosition:near,reducedMotion:true});
    close(shutters[0].position.x,-.61,'reduced-motion pose keeps one readable static stage');
    close(shutters[0].rotation.z,.24,'reduced-motion leaves physical stage intact');
    for(const key of ['geometryCount','materialCount','textureCount','instances'])
      assert.equal(world.stats()[key],budget[key],'never allocate resources per animation tick');
    assert.equal(JSON.stringify(state),frozen,'visual acting may not mutate AI or game state');
  }finally{world.dispose();cleanup();}
});

test('unpublished danger, remembered-only trap and next-run reset cannot animate false shutters',async()=>{
  const {THREE,game,world,cleanup}=await loadWorld();
  try{
    const cell=game.cellPosition(4,3,3),hero=new THREE.Vector3(cell.x,0,cell.z);
    world.update(published({cells:[],visibleCells:[],privateTrapCells:[4],privateMap:{4:'secret'}}));
    assert.equal(world.group.getObjectByName('Published tide-shear floor shutter 1'),undefined);
    assert.equal(world.stats().responsiveTrapSignals,0);
    world.update(published({visibleCells:[]}));
    const right=world.group.getObjectByName('Published tide-shear floor shutter 1');
    assert.ok(right);
    world.animate(0,{explorerPosition:hero,reducedMotion:false});
    close(right.position.x,.52,'remembered but not visible hazard must remain closed');
    close(right.rotation.z,-.03,'remembered but not visible hinge must remain resting');
    world.update(published());
    world.animate(0,{explorerPosition:hero,reducedMotion:false});
    assert.ok(Math.abs(right.rotation.z)>.8,
      'publicly visible contact alone drives physical shutters');
    world.update(published({runToken:'new-world',cells:[],visibleCells:[]}));
    assert.equal(world.group.getObjectByName('Published tide-shear floor shutter 1'),undefined,
      'old-run pressure floor must disappear completely');
    assert.equal(world.stats().responsiveTrapSignals,0);
  }finally{world.dispose();cleanup();}
});
