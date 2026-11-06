'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const {pathToFileURL} = require('node:url');

// Installed Three.js models, never a mocked or invented screenshot.
async function build() {
  const root = path.resolve(__dirname,'../..');
  const temp = fs.mkdtempSync(path.join(os.tmpdir(),'maze-pressure-relay-'));
  try {
    fs.mkdirSync(path.join(temp,'vendor'));
    fs.writeFileSync(path.join(temp,'package.json'),'{"type":"module"}');
    for(const file of ['world.js','map-view.mjs','gate-moment.mjs'])
      fs.copyFileSync(path.join(root,'public/ai-maze-escape',file),path.join(temp,file));
    for(const file of ['three.module.js','three.core.js'])
      fs.copyFileSync(path.join(root,'node_modules/three/build',file),path.join(temp,'vendor',file));
    const THREE = await import(pathToFileURL(path.join(temp,'vendor/three.module.js')).href);
    const game = await import(pathToFileURL(path.join(temp,'world.js')).href);
    return {THREE, game, world:game.createMazeWorld({balanced:true}),
      cleanup:()=>fs.rmSync(temp,{recursive:true,force:true})};
  } catch(error) {fs.rmSync(temp,{recursive:true,force:true});throw error}
}
const publicState = (overrides={}) => ({
  runToken:'visible-real-pressure-relay',tick:1,width:3,height:3,currentCell:4,
  cells:[{cell:4,neighbors:[],blocked:false,trap:true,checkpoint:false,clue:false}],
  visibleCells:[4],keys:[],doors:[],inventory:[],threats:[],exitCell:null,result:null,...overrides
});
const near=(value,expected,label)=>assert.ok(Math.abs(value-expected)<1e-8,
  label+': '+value+' vs '+expected);

test('public pressure mast has two rooted mechanically staged low-profile levers',async()=>{
  const {THREE,game,world,cleanup}=await build();
  try {
    const state=publicState(),frozen=JSON.stringify(state);
    world.update(state);
    const mast=world.group.getObjectByName('Published tide-shear pressure mast 4');
    const relays=[-1,1].map(side=>world.group.getObjectByName('Published tide-shear staged relay 4 '+side));
    assert.ok(mast?.isGroup && relays.every(r=>r?.isGroup && r.parent===mast),
      'relay hardware must attach to the actual already published trap');
    assert.ok(relays.every(r=>r.children.filter(p=>p.isMesh).length===3),
      'bronze pivot, bright lever and warm warning face are physical geometry');
    const budget=world.stats(),pos=game.cellPosition(4,3,3);
    const far=new THREE.Vector3(pos.x+40,0,pos.z+40);
    const center=new THREE.Vector3(pos.x,0,pos.z);
    world.animate(0,{explorerPosition:far,reducedMotion:false});
    near(relays[0].rotation.z,.05,'left resting relay');
    near(relays[1].rotation.z,-.05,'right resting relay');
    near(relays[0].position.y,.28,'resting linkage');
    world.animate(0,{explorerPosition:new THREE.Vector3(pos.x+game.CELL_SIZE,0,pos.z+game.CELL_SIZE),reducedMotion:false});
    assert.ok(Math.abs(relays[0].rotation.z)>.15 && Math.abs(relays[0].rotation.z)<.40,
      'actual visible diagonal approach first rotates warning lever');
    near(relays[0].position.y,.28,'early warning precedes piston linkage lift');
    world.animate(0,{explorerPosition:center,reducedMotion:false});
    near(relays[0].rotation.z,.70,'full witnessed pressure relay opens');
    near(relays[1].rotation.z,-.70,'mirrored hinge');
    near(relays[0].position.y,.43,'pressure piston lifts linked relay');
    world.animate(7,{explorerPosition:far,reducedMotion:false});
    near(relays[0].rotation.z,.05,'retreat returns to rest');
    near(relays[0].position.y,.28,'retreat lowers relay');
    world.animate(8,{explorerPosition:center,reducedMotion:true});
    near(relays[0].rotation.z,.40,'reduced motion holds a calm readable pose');
    near(relays[0].position.y,.32,'reduced motion holds without ticking');
    for(const key of ['geometryCount','materialCount','textureCount','instances'])
      assert.equal(world.stats()[key],budget[key],'motion must allocate no GPU resources');
    assert.equal(JSON.stringify(state),frozen,'source-knowledge and AI authority stay unchanged');
  } finally {world.dispose();cleanup()}
});

test('remembered-only, hidden and reset pressure hazards never animate or leave relays',async()=>{
  const {THREE,game,world,cleanup}=await build();
  try {
    const pos=game.cellPosition(4,3,3),center=new THREE.Vector3(pos.x,0,pos.z);
    world.update(publicState({visibleCells:[]}));
    const relay=world.group.getObjectByName('Published tide-shear staged relay 4 -1');
    assert.ok(relay,'remembered public geometry can remain, but must not act');
    world.animate(5,{explorerPosition:center,reducedMotion:false});
    near(relay.rotation.z,.05,'remembered relay is at rest');
    near(relay.position.y,.28,'remembered relay remains down');
    world.animate(8,{explorerPosition:center,reducedMotion:true});
    near(relay.rotation.z,.05,'reduced motion cannot leak remembered hazard action');
    world.update(publicState({visibleCells:[4]}));
    world.animate(8,{explorerPosition:center,reducedMotion:false});
    near(relay.rotation.z,.70,'truly visible public pressure can actuate');
    world.update(publicState({runToken:'next-run',cells:[],visibleCells:[],privateTrapCells:[4]}));
    assert.equal(world.group.getObjectByName('Published tide-shear staged relay 4 -1'),undefined);
    assert.equal(world.stats().responsiveTrapSignals,0,'new run releases all old trap props');
  } finally {world.dispose();cleanup()}
});
